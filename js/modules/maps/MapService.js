/**
 * Google Maps service management
 * Handles map initialization and core map functionality
 */

import { StateManager } from '../state/AppState.js';
import { CacheService } from './CacheService.js';

// for the logging and sphyoning off console.logs
import { createLogger, LOG_CATEGORIES } from '../../utils/Logger.js';

// Create logger for this service
const logger = createLogger(LOG_CATEGORIES.MAPS);

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


    // infomational log
    //console.log('🗺️ Initializing Map Service');
    logger.info('Initializing Map Service');
    logger.debug('Map options', options);

    /*
    const userData = { id: 1, name: "Alice", email: "alice@example.com" };
    console.log(userData);

    const products = [{ id: 101, name: "Laptop" }, { id: 102, name: "Mouse" }];
    console.log(products);
    
        const users = [
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 25 }
    ];
    console.table(users);
    */
    
  



    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.Map) {
      throw new Error('Google Maps API not loaded or not ready');
    }

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Map container with ID '${containerId}' not found`);
    }

    // Default map options
    const defaultOptions = {
      zoom: 13,
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle?.HORIZONTAL_BAR || 0,
        position: google.maps.ControlPosition?.TOP_RIGHT || 2
      },
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
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
   * Set info window instance
   * @param {google.maps.InfoWindow} infoWindow - Info window instance to set
   */
  static setInfoWindow(infoWindow) {
    const currentState = StateManager.getMapsState();
    StateManager.setMapsState({
      ...currentState,
      infoWindow
    });
  }

  /**
   * Center map on specific coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Optional zoom level
   * @param {boolean} offsetForInfoWindow - Whether to offset upward for info window display
   */
  static async centerMap(lat, lng, zoom = null, offsetForInfoWindow = false) {
    console.log('🎯 MapService.centerMap called with:', { lat, lng, zoom, offsetForInfoWindow });
    
    //const map = MapService.getMap();
    const map = StateManager.getMapsState().map;

    if (!map) {
      console.error('❌ MapService.centerMap: Map not available');
      return false;
    }

    // Validate and convert coordinates
    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);
    
    // Validate coordinates
    if (
      typeof numLat !== 'number' || isNaN(numLat) || numLat < -90 || numLat > 90 ||
      typeof numLng !== 'number' || isNaN(numLng) || numLng < -180 || numLng > 180
    ) {
      console.error('❌ MapService.centerMap: Invalid coordinates', { lat, lng, numLat, numLng });
      return false;
    }

    try {
      // Check map container dimensions before centering
      const mapDiv = map.getDiv();
      const mapBounds = mapDiv.getBoundingClientRect();
      
      console.log('🔍 Map container dimensions:', {
        width: mapBounds.width,
        height: mapBounds.height,
        visible: mapBounds.width > 0 && mapBounds.height > 0
      });
      
      // If map container has no dimensions, wait for it to be properly sized
      if (mapBounds.width === 0 || mapBounds.height === 0) {
        console.warn('⚠️ Map container has zero dimensions, triggering resize and retrying...');
        
        // Trigger a resize event to force the map to recalculate its size
        google.maps.event.trigger(map, 'resize');
        
        // Wait a bit for the resize to take effect
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check dimensions again
        const newBounds = mapDiv.getBoundingClientRect();
        console.log('🔍 Map container dimensions after resize:', {
          width: newBounds.width,
          height: newBounds.height,
          visible: newBounds.width > 0 && newBounds.height > 0
        });
      }
      
      let position = new google.maps.LatLng(numLat, numLng);
      
      // If offsetting for info window, adjust the latitude slightly upward
      if (offsetForInfoWindow) {
        const currentZoom = map.getZoom() || zoom || 15;
        // Calculate offset based on zoom level - higher zoom needs smaller offset
        const latOffset = 0.002 / Math.pow(2, currentZoom - 15); // Adjust formula as needed
        position = new google.maps.LatLng(numLat + latOffset, numLng);
        console.log('📐 Offset position for info window:', position.toString(), 'offset:', latOffset);
      }
      
      console.log('🗺️ Setting map center to:', position.toString());
      
      // Get current center before changing it
      const currentCenter = map.getCenter();
      console.log('📍 Current map center:', currentCenter ? currentCenter.toString() : 'none');
      
      map.setCenter(position);
      
      // Set zoom level - use provided zoom or default to 15 for consistent viewing like GPS centering
      const targetZoom = zoom !== null && !isNaN(zoom) ? 
        Math.max(1, Math.min(20, parseInt(zoom))) : 15;
      console.log('🔍 Setting map zoom to:', targetZoom);
      map.setZoom(targetZoom);
      
      // Verify the center was actually set correctly
      setTimeout(() => {
        const newCenter = map.getCenter();
        const actualLat = newCenter.lat();
        const actualLng = newCenter.lng();
        
        console.log('🎯 Verification - New map center:', newCenter.toString());
        console.log('📊 Center accuracy check:', {
          requestedLat: numLat,
          actualLat: actualLat,
          latDiff: Math.abs(numLat - actualLat),
          requestedLng: numLng,
          actualLng: actualLng,
          lngDiff: Math.abs(numLng - actualLng),
          accurate: Math.abs(numLat - actualLat) < 0.001 && Math.abs(numLng - actualLng) < 0.001
        });
      }, 100);
      
      console.log('✅ Map center updated successfully');
      return true;
      
    } catch (error) {
      console.error('❌ MapService.centerMap: Error setting center', error);
      return false;
    }
  }

  /**
   * Force map to resize and recalculate its viewport
   * Useful when map container dimensions change or map is initially hidden
   */
  static async forceMapResize() {
    const map = MapService.getMap();
    if (!map) {
      console.error('❌ MapService.forceMapResize: Map not available');
      return false;
    }

    try {
      const mapDiv = map.getDiv();
      const beforeBounds = mapDiv.getBoundingClientRect();
      
      console.log('🔄 Forcing map resize...', {
        beforeWidth: beforeBounds.width,
        beforeHeight: beforeBounds.height
      });
      
      // Trigger resize event
      google.maps.event.trigger(map, 'resize');
      
      // Wait for the resize to take effect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const afterBounds = mapDiv.getBoundingClientRect();
      console.log('✅ Map resize completed', {
        afterWidth: afterBounds.width,
        afterHeight: afterBounds.height,
        changed: beforeBounds.width !== afterBounds.width || beforeBounds.height !== afterBounds.height
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ MapService.forceMapResize: Error', error);
      return false;
    }
  }

  /**
   * Fit map bounds to include all markers
   */
  static fitBoundsToMarkers() {
    const map = MapService.getMap();
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
   * 
   * RESPONSIBILITY: This is the primary method for getting GPS location
   * - Handles browser geolocation API
   * - Integrates with GPSPermissionService for permission management
   * - Used by MapControlsManager GPS button and other location features
   * 
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
   * 
   * RESPONSIBILITY: This is the primary method for GPS button functionality
   * - Gets current location using getCurrentLocation()
   * - Centers map on user's position
   * - Adds GPS marker with click-to-save functionality
   * - Handles all error states and user notifications
   * 
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

    // Create GPS marker with custom blue dot icon using SVG circle path
    // Using SVG path for better cross-browser compatibility
    const gpsIcon = {
      path: 'M 0 -8 A 8 8 0 1 1 0 8 A 8 8 0 1 1 0 -8 Z', // SVG circle path
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      strokeOpacity: 1,
      scale: 1,
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

    console.log('📍 GPS marker created with icon:', gpsIcon);
    console.log('📍 GPS marker position:', { lat: position.lat, lng: position.lng });
    console.log('📍 GPS marker visible:', gpsMarker.getVisible());
    console.log('📍 GPS marker map:', !!gpsMarker.getMap());

    // Add click handler to show save location dialog
    gpsMarker.addListener('click', async () => {
      console.log('🎯 GPS marker clicked - showing save location dialog');
      
      try {
        // Show loading state
        gpsMarker.setTitle('Getting location details...');
        
        // Check GPS cache first for reverse geocoding
        const gpsKey = `${Math.round(position.lat * 1000)}_${Math.round(position.lng * 1000)}`;
        const cached = CacheService.get('gps_location', { coords: gpsKey });
        
        let response;
        if (cached) {
          console.log('📦 GPS Cache HIT for reverse geocoding:', position);
          response = cached;
        } else {
          console.log('🌍 GPS Reverse Geocoding API call for:', position);
          // Get current location details using reverse geocoding
          const geocoder = new google.maps.Geocoder();
          response = await new Promise((resolve, reject) => {
            geocoder.geocode(
              { location: { lat: position.lat, lng: position.lng } },
              (results, status) => {
                if (status === 'OK' && results[0]) {
                  // Cache the result for future use
                  CacheService.set('gps_location', { coords: gpsKey }, results[0]);
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              }
            );
          });
        }

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
    const map = MapService.getMap();
    if (!map) return;

    map.addListener('click', callback);
  }

  /**
   * Remove all map listeners
   */
  static clearAllListeners() {
    const map = MapService.getMap();
    if (!map) return;

    google.maps.event.clearListeners(map, 'click');
  }

  /**
   * Get map bounds
   * @returns {google.maps.LatLngBounds|null} Current map bounds
   */
  static getMapBounds() {
    const map = MapService.getMap();
    if (!map) return null;

    return map.getBounds();
  }

  /**
   * Set map zoom level
   * @param {number} zoom - Zoom level (1-20)
   */
  static setZoom(zoom) {
    const map = MapService.getMap();
    if (!map) return;

    map.setZoom(Math.max(1, Math.min(20, zoom)));
  }

  /**
   * Get current map zoom level
   * @returns {number|null} Current zoom level
   */
  static getZoom() {
    const map = MapService.getMap();
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

  /**
   * Diagnostic function to check map viewport and centering issues
   * Call this when experiencing centering problems
   */
  static diagnoseMapViewport() {
    console.log('🔍 === MAP VIEWPORT DIAGNOSIS ===');
    
    const map = MapService.getMap();
    if (!map) {
      console.error('❌ No map instance found');
      return;
    }
    
    const mapDiv = map.getDiv();
    const bounds = mapDiv.getBoundingClientRect();
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    console.log('📊 Map container element:', mapDiv);
    console.log('📐 Container dimensions:', {
      width: bounds.width,
      height: bounds.height,
      top: bounds.top,
      left: bounds.left,
      visible: bounds.width > 0 && bounds.height > 0
    });
    
    console.log('🎯 Current map state:', {
      center: center ? center.toString() : 'none',
      zoom: zoom,
      bounds: map.getBounds() ? map.getBounds().toString() : 'none'
    });
    
    console.log('🖥️ Container computed styles:');
    const styles = window.getComputedStyle(mapDiv);
    console.log({
      display: styles.display,
      visibility: styles.visibility,
      width: styles.width,
      height: styles.height,
      position: styles.position,
      overflow: styles.overflow
    });
    
    console.log('🌍 Google Maps API loaded:', {
      googleMapsLoaded: typeof google !== 'undefined',
      mapsAPILoaded: typeof google?.maps !== 'undefined',
      mapInstance: !!map
    });
    
    console.log('🔍 === END DIAGNOSIS ===');
    
    return {
      mapAvailable: !!map,
      containerVisible: bounds.width > 0 && bounds.height > 0,
      hasCenter: !!center,
      hasZoom: zoom !== undefined,
      dimensions: bounds
    };
  }

  /**
   * Get the current center of the map
   * @returns {Object} Object with lat and lng properties
   */
  static getMapCenter() {
    const map = StateManager.get('map');
    if (map) {
      const center = map.getCenter();
      return {
        lat: center.lat(),
        lng: center.lng()
      };
    }
    
    // Return default center if map not available
    return {
      lat: 37.7749,
      lng: -122.4194
    };
  }
}

// Export individual functions for backward compatibility
export const initializeMap = MapService.initialize.bind(MapService);
export const getMapCenter = MapService.getMapCenter.bind(MapService);
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
export const forceMapResize = MapService.forceMapResize.bind(MapService);
export const diagnoseMapViewport = MapService.diagnoseMapViewport.bind(MapService);