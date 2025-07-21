/**
 * Google Maps service management
 * Handles map initialization and core map functionality
 */

import { StateManager } from '../state/AppState.js';

/**
 * Map Service Class
 */
export class MapService {

  /**
   * Initialize Google Maps with default settings
   * @param {string} containerId - ID of the map container element
   * @param {Object} options - Map initialization options
   * @returns {Promise<google.maps.Map>} Initialized map instance
   */
  static async initialize(containerId = 'map', options = {}) {
    console.log('🗺️ Initializing Map Service');

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Map container with ID '${containerId}' not found`);
    }

    // Default map options
    const defaultOptions = {
      zoom: 13,
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: [] // Add custom styles if needed
    };

    // Merge with provided options
    const mapOptions = { ...defaultOptions, ...options };

    try {
      // Create the map instance
      const map = new google.maps.Map(container, mapOptions);

      // Initialize Google Maps services
      const placesService = new google.maps.places.PlacesService(map);
      const autocompleteService = new google.maps.places.AutocompleteService();
      const infoWindow = new google.maps.InfoWindow({
        maxWidth: 300
      });

      // Store all Maps instances in centralized state
      StateManager.setMapsState({
        map,
        placesService,
        autocompleteService,
        infoWindow
      });

      console.log('✅ Map Service initialized');
      return map;

    } catch (error) {
      console.error('Error initializing map:', error);
      throw error;
    }
  }

  /**
   * Get current map instance
   * @returns {google.maps.Map|null} Current map instance
   */
  static getMap() {
    return StateManager.getMapsState().map;
  }

  /**
   * Get places service instance
   * @returns {google.maps.places.PlacesService|null} Places service instance
   */
  static getPlacesService() {
    return StateManager.getMapsState().placesService;
  }

  /**
   * Get autocomplete service instance
   * @returns {google.maps.places.AutocompleteService|null} Autocomplete service instance
   */
  static getAutocompleteService() {
    return StateManager.getMapsState().autocompleteService;
  }

  /**
   * Get info window instance
   * @returns {google.maps.InfoWindow|null} Info window instance
   */
  static getInfoWindow() {
    return StateManager.getMapsState().infoWindow;
  }

  /**
   * Center map on specific coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Optional zoom level
   */
  static centerMap(lat, lng, zoom = null) {
    const map = this.getMap();
    if (!map) return;

    const position = new google.maps.LatLng(lat, lng);
    map.setCenter(position);
    
    if (zoom !== null) {
      map.setZoom(zoom);
    }
  }

  /**
   * Fit map bounds to include all markers
   */
  static fitBoundsToMarkers() {
    const map = this.getMap();
    const markers = StateManager.getMapsState().markers;
    
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
      if (marker.getPosition()) {
        bounds.extend(marker.getPosition());
      }
    });

    map.fitBounds(bounds);
  }

  /**
   * Get user's current location with permission management
   * @param {boolean} respectStoredPermission - Whether to check stored user permission first
   * @returns {Promise<{lat: number, lng: number}>} User's coordinates
   */
  static async getCurrentLocation(respectStoredPermission = true) {
    // Import GPS permission service
    const { GPSPermissionService } = await import('./GPSPermissionService.js');
    
    // If user wants to respect stored permissions and user is authenticated
    if (respectStoredPermission) {
      const hasStoredPermission = await GPSPermissionService.hasStoredGPSPermission();
      
      if (hasStoredPermission) {
        console.log('📍 Using stored GPS permission - granted');
        return this.getBrowserLocation();
      } else {
        const permissionStatus = await GPSPermissionService.getCurrentGPSPermissionStatus();
        
        if (permissionStatus === GPSPermissionService.PERMISSION_STATES.DENIED) {
          throw new Error('GPS permission was previously denied by user');
        }
        
        if (permissionStatus === GPSPermissionService.PERMISSION_STATES.NOT_ASKED) {
          console.log('📍 Requesting GPS permission for the first time...');
          const result = await GPSPermissionService.requestGPSPermission();
          
          if (result.granted) {
            return result.position;
          } else {
            throw new Error(result.error || 'GPS permission denied');
          }
        }
      }
    }
    
    // Fallback to direct browser request (for non-authenticated users or when ignoring stored permissions)
    return this.getBrowserLocation();
  }

  /**
   * Get location directly from browser (internal method)
   * @returns {Promise<{lat: number, lng: number, accuracy: number}>} User's coordinates with accuracy
   */
  static async getBrowserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 100 // Default to 100m if not provided
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

    /**
   * Center map on user's current location with permission management
   * @param {boolean} respectStoredPermission - Whether to check stored user permission first
   * @returns {Promise<void>}
   */
  static async centerOnUserLocation(respectStoredPermission = true) {
    const mapState = StateManager.getMapsState();
    
    if (!mapState.map) {
      throw new Error('Map not initialized');
    }

    try {
      const position = await this.getCurrentLocation(respectStoredPermission);
      
      mapState.map.setCenter(new google.maps.LatLng(position.lat, position.lng));
      mapState.map.setZoom(15);
      
      // Add or update GPS location marker
      this.addGPSLocationMarker(position);
      
      console.log('🎯 Map centered on user location:', position);
      
    } catch (error) {
      console.error('❌ Failed to center on user location:', error.message);
      
      // Show user-friendly notification based on error type
      if (error.message.includes('denied')) {
        this.showLocationError('Location access was denied. You can enable it in your browser settings or profile.');
      } else if (error.message.includes('not supported')) {
        this.showLocationError('Location services are not supported by your browser.');
      } else {
        this.showLocationError('Unable to get your current location. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Add or update GPS location marker with blue dot styling
   * @param {Object} position - Position object with lat and lng
   */
  static addGPSLocationMarker(position) {
    const mapState = StateManager.getMapsState();
    
    if (!mapState.map) {
      console.error('❌ Map not initialized');
      return;
    }

    // Remove existing GPS marker if it exists
    if (window.gpsMarker) {
      window.gpsMarker.setMap(null);
    }

    // Create GPS marker with custom blue dot icon
    const gpsIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      strokeOpacity: 1,
      scale: 8,
      anchor: new google.maps.Point(0, 0)
    };

    // Create the outer blue circle (accuracy circle)
    const accuracyCircle = new google.maps.Circle({
      center: { lat: position.lat, lng: position.lng },
      radius: position.accuracy || 100, // Default to 100m if accuracy not provided
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      strokeColor: '#4285F4',
      strokeOpacity: 0.3,
      strokeWeight: 1,
      map: mapState.map
    });

    // Create the GPS marker using modern Google Maps API
    const gpsMarker = new google.maps.Marker({
      position: { lat: position.lat, lng: position.lng },
      map: mapState.map,
      icon: gpsIcon,
      title: 'Your Location (Click to Save)',
      zIndex: 1000, // Ensure it's on top of other markers
      optimized: false, // Disable optimization for custom icon
      cursor: 'pointer', // Show pointer cursor on hover
      clickable: true // Explicitly enable clicking
    });

    // Add click handler to show save location dialog
    gpsMarker.addListener('click', async () => {
      console.log('🎯 GPS marker clicked - showing save location dialog');
      
      try {
        // Show loading state
        gpsMarker.setTitle('Getting location details...');
        
        // Get current location details using reverse geocoding
        const geocoder = new google.maps.Geocoder();
        const response = await new Promise((resolve, reject) => {
          geocoder.geocode(
            { location: { lat: position.lat, lng: position.lng } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                resolve(results[0]);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        });

        // Extract address components
        const address = response.formatted_address;
        const placeName = this.extractPlaceName(response);
        const addressComponents = this.extractAddressComponents(response);
        
        // Create location data for the dialog - format for server validation
        const locationData = {
          name: placeName || 'My Current Location',
          address: address,
          formatted_address: address,
          lat: position.lat,  // Server expects 'lat' not 'latitude'
          lng: position.lng,  // Server expects 'lng' not 'longitude'
          type: 'broll',      // Default to valid location type
          place_id: response.place_id || null,
          placeId: response.place_id || null,  // Support both formats
          production_notes: `GPS location from ${new Date().toLocaleDateString().replace(/\//g, '-')}`,
          // Address components for form fields
          number: addressComponents.street_number || '',
          street: addressComponents.route || '',
          city: addressComponents.locality || addressComponents.sublocality || '',
          state: addressComponents.administrative_area_level_1_short || '', // Use abbreviation for state
          zipcode: addressComponents.postal_code || '',
          // Optional fields with defaults
          entry_point: '',
          parking: '',
          access: ''
        };

        console.log('📍 GPS location data for dialog:', locationData);

        // Reset marker title
        gpsMarker.setTitle('Your Location (Click to Save)');

        // Import and show the save location dialog
        const { LocationsUI } = await import('../locations/LocationsUI.js');
        
        // Store reference to this marker for potential updates after save
        window.currentGPSMarkerData = {
          marker: gpsMarker,
          position: position,
          originalIcon: gpsIcon
        };
        
        // Show the save location dialog with GPS data pre-filled
        LocationsUI.showSaveLocationDialog(locationData);
        
      } catch (error) {
        console.error('❌ Error getting GPS location details:', error);
        
        // Reset marker title
        gpsMarker.setTitle('Your Location (Click to Save)');
        
        // Show fallback dialog with minimal data
        try {
          const { LocationsUI } = await import('../locations/LocationsUI.js');
          
          const fallbackData = {
            name: 'My Current Location',
            address: `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`,
            formatted_address: `Coordinates: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
            lat: position.lat,
            lng: position.lng,
            type: 'broll',
            place_id: null,
            placeId: null,
            production_notes: `GPS coordinates from ${new Date().toLocaleDateString().replace(/\//g, '-')}`,
            entry_point: '',
            parking: '',
            access: '',
            state: '',
            zipcode: ''
          };
          
          LocationsUI.showSaveLocationDialog(fallbackData);
          
        } catch (dialogError) {
          console.error('❌ Error showing fallback dialog:', dialogError);
          this.showLocationError('Failed to open save location dialog. Please try again.');
        }
      }
    });

    // Store globally for easy removal
    window.gpsMarker = gpsMarker;
    window.gpsAccuracyCircle = accuracyCircle;

    console.log('📍 GPS location marker added with click-to-save feature:', position);
  }

  /**
   * Extract a meaningful place name from geocoding results
   * @param {Object} geocodeResult - Google Maps geocoding result
   * @returns {string} Place name or null
   */
  static extractPlaceName(geocodeResult) {
    // Try to find a good place name from address components
    const components = geocodeResult.address_components;
    
    // Look for establishment, point_of_interest, or premise first
    for (const component of components) {
      if (component.types.includes('establishment') || 
          component.types.includes('point_of_interest') ||
          component.types.includes('premise')) {
        return component.long_name;
      }
    }
    
    // Fallback to street number + route
    let streetNumber = '';
    let route = '';
    
    for (const component of components) {
      if (component.types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (component.types.includes('route')) {
        route = component.long_name;
      }
    }
    
    if (streetNumber && route) {
      return `${streetNumber} ${route}`;
    }
    
    // Final fallback to neighborhood or locality
    for (const component of components) {
      if (component.types.includes('neighborhood') || 
          component.types.includes('locality')) {
        return component.long_name;
      }
    }
    
    return null;
  }

  /**
   * Extract individual address components from Google geocoding response
   * @param {Object} geocodeResult - Google geocoding response
   * @returns {Object} Parsed address components
   */
  static extractAddressComponents(geocodeResult) {
    const components = geocodeResult.address_components;
    const addressComponents = {};
    
    // Map Google's component types to our form fields
    const componentMap = {
      'street_number': 'street_number',
      'route': 'route',
      'locality': 'locality',
      'sublocality': 'sublocality',
      'sublocality_level_1': 'sublocality',
      'administrative_area_level_1': 'administrative_area_level_1',
      'administrative_area_level_2': 'administrative_area_level_2',
      'postal_code': 'postal_code',
      'country': 'country'
    };
    
    // Extract each component
    for (const component of components) {
      for (const type of component.types) {
        if (componentMap[type]) {
          addressComponents[componentMap[type]] = component.long_name;
          // Also store short name for state abbreviations
          if (type === 'administrative_area_level_1') {
            addressComponents[componentMap[type] + '_short'] = component.short_name;
          }
        }
      }
    }
    
    console.log('📍 Extracted address components:', addressComponents);
    
    return addressComponents;
  }

  /**
   * Show location success notification to user
   * @param {string} message - Success message to display
   */
  static showLocationSuccess(message) {
    // Try to use notification system if available
    try {
      const { AuthNotificationService } = window.Auth?.getServices() || {};
      if (AuthNotificationService) {
        AuthNotificationService.showNotification(message, 'success');
        return;
      }
    } catch (error) {
      console.warn('Notification service not available, using alert');
    }
    
    // Fallback to alert
    alert(message);
  }

  /**
   * Update GPS marker to show saved state
   */
  static updateGPSMarkerAsSaved() {
    if (window.currentGPSMarkerData && window.currentGPSMarkerData.marker) {
      const { marker, originalIcon } = window.currentGPSMarkerData;
      
      // Create saved state icon (green with checkmark feel)
      const savedIcon = {
        ...originalIcon,
        fillColor: '#28a745', // Green color for saved state
        strokeColor: '#FFFFFF',
        strokeWeight: 4,
        scale: 10 // Slightly larger to show importance
      };
      
      // Update marker appearance
      marker.setIcon(savedIcon);
      marker.setTitle('Your Location (Saved ✓)');
      
      console.log('✅ GPS marker updated to show saved state');
      
      // Reset to original state after 3 seconds
      setTimeout(() => {
        if (marker && window.currentGPSMarkerData) {
          marker.setIcon(originalIcon);
          marker.setTitle('Your Location (Click to Save)');
          console.log('🔄 GPS marker reset to original state');
        }
      }, 3000);
    }
  }

  /**
   * Remove GPS location marker from map
   */
  static removeGPSLocationMarker() {
    if (window.gpsMarker) {
      window.gpsMarker.setMap(null);
      window.gpsMarker = null;
    }
    
    if (window.gpsAccuracyCircle) {
      window.gpsAccuracyCircle.setMap(null);
      window.gpsAccuracyCircle = null;
    }
    
    console.log('📍 GPS location marker removed');
  }

  /**
   * Show location error notification to user
   * @param {string} message - Error message to display
   */
  static showLocationError(message) {
    // Try to use notification system if available
    if (window.AuthNotificationService) {
      window.AuthNotificationService.showError(message);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  /**
   * Add click listener to map
   * @param {Function} callback - Function to call on map click
   */
  static addClickListener(callback) {
    const map = this.getMap();
    if (!map) return;

    map.addListener('click', callback);
  }

  /**
   * Remove all map listeners
   */
  static clearAllListeners() {
    const map = this.getMap();
    if (!map) return;

    google.maps.event.clearListeners(map, 'click');
  }

  /**
   * Get map bounds
   * @returns {google.maps.LatLngBounds|null} Current map bounds
   */
  static getMapBounds() {
    const map = this.getMap();
    if (!map) return null;

    return map.getBounds();
  }

  /**
   * Set map zoom level
   * @param {number} zoom - Zoom level (1-20)
   */
  static setZoom(zoom) {
    const map = this.getMap();
    if (!map) return;

    map.setZoom(Math.max(1, Math.min(20, zoom)));
  }

  /**
   * Get current map zoom level
   * @returns {number|null} Current zoom level
   */
  static getZoom() {
    const map = this.getMap();
    if (!map) return null;

    return map.getZoom();
  }

  /**
   * Check if map is initialized
   * @returns {boolean} True if map is ready
   */
  static isInitialized() {
    const mapState = StateManager.getMapsState();
    return !!(mapState.map && mapState.placesService && mapState.autocompleteService);
  }

  /**
   * Destroy map instance and clean up
   */
  static destroy() {
    this.clearAllListeners();
    
    // Clear state
    StateManager.setMapsState({
      map: null,
      placesService: null,
      autocompleteService: null,
      infoWindow: null
    });

    console.log('🗺️ Map Service destroyed');
  }
}

// Export individual functions for backward compatibility
export const initializeMap = MapService.initialize.bind(MapService);
export const getMap = MapService.getMap.bind(MapService);
export const getPlacesService = MapService.getPlacesService.bind(MapService);
export const getAutocompleteService = MapService.getAutocompleteService.bind(MapService);
export const centerMap = MapService.centerMap.bind(MapService);
export const getCurrentLocation = MapService.getCurrentLocation.bind(MapService);
export const centerOnUserLocation = MapService.centerOnUserLocation.bind(MapService);
export const addGPSLocationMarker = MapService.addGPSLocationMarker.bind(MapService);
export const updateGPSMarkerAsSaved = MapService.updateGPSMarkerAsSaved.bind(MapService);
export const removeGPSLocationMarker = MapService.removeGPSLocationMarker.bind(MapService);
export const extractPlaceName = MapService.extractPlaceName.bind(MapService);
export const showLocationSuccess = MapService.showLocationSuccess.bind(MapService);
export const fitBoundsToMarkers = MapService.fitBoundsToMarkers.bind(MapService);
export const isMapInitialized = MapService.isInitialized.bind(MapService);