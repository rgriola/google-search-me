/**
 * Map marker management
 * Handles creation, display, and removal of map markers and info windows
 * Enhanced with clustering, filtering, and location-type specific markers
 */

import { StateManager } from '../state/AppState.js';
import { MapService } from './MapService.js';
import { CustomSVGIcons } from './CustomSVGIcons.js';

/**
 * Marker Service Class - Enhanced with advanced features
 */
export class MarkerService {

  // ==========================================
  // ENHANCED MARKER SYSTEM - PHASE 4
  // Location type colors, clustering, filtering
  // ==========================================
  
  // Location type color scheme (matching app design)
  static LOCATION_TYPE_COLORS = {
    'live reporter': '#ff4444',    // Red
    'live anchor': '#4285f4',      // Blue
    'live stakeout': '#ffbb33',    // Orange
    'stakeout': '#ffbb33',         // Orange (alias)
    'live presser': '#00aa00',     // Green
    'interview': '#8e44ad',        // Purple
    'broll': '#ad1457',           // Pink
    'headquarters': '#2c3e50',     // Dark Blue - Permanent
    'bureau': '#34495e',          // Dark Gray - Permanent
    'office': '#7f8c8d',          // Gray - Permanent
    'default': '#666666'          // Gray fallback
  };
  
  // Type initials for markers
  static TYPE_INITIALS = {
    'live reporter': 'LR',
    'live anchor': 'LA',
    'live stakeout': 'LS',
    'stakeout': 'ST',
    'live presser': 'LP',
    'interview': 'IN',
    'broll': 'BR',
    'headquarters': 'HQ',
    'bureau': 'BU',
    'office': 'OF'
  };
  
  // Enhanced marker management variables
  static locationMarkers = [];           // Store all location markers
  static markerCluster = null;           // Marker clustering instance
  static activeFilters = new Set(['live reporter', 'live anchor', 'live stakeout', 'interview', 'broll']); // Default visible
  static currentInfoWindow = null;       // Track open info windows
  static clusteringEnabled = true;       // Clustering state
  static markerSize = 38; // Default marker size in pixels
  static useCustomSVGIcons = false; // Toggle for custom vs simple icons
  static permanentLocationTypes = new Set(['headquarters', 'bureau', 'office']); // Always visible types


  /**
   * Initialize marker service with enhanced features
   */
  static async initialize() {
    console.log('📍 Initializing Enhanced Marker Service');
    
    // Load MarkerClusterer library if not already loaded
    await this.loadMarkerClustererLibrary();
    
    // Initialize filter event listeners
    this.initializeFilterListeners();
    
    // Initialize clustering controls
    this.initializeClusteringControls();
    
    console.log('✅ Enhanced Marker Service initialized with clustering and filtering');
  }

  /**
   * Load MarkerClusterer library dynamically
   */
  static loadMarkerClustererLibrary() {
    return new Promise((resolve, reject) => {
      if (typeof markerClusterer !== 'undefined') {
        console.log('✅ MarkerClusterer already loaded');
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
      script.onload = () => {
        console.log('✅ MarkerClusterer library loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.warn('⚠️ Failed to load MarkerClusterer library - clustering disabled');
        this.clusteringEnabled = false;
        resolve(); // Don't reject, just disable clustering
      };
      document.head.appendChild(script);
    });
  }

  // ==========================================
  // ENHANCED MARKER CREATION
  // SVG icons with type colors and initials
  // ==========================================

  /**
   * Create SVG marker icon with dynamic color and type initials
   * Now supports both simple and custom SVG icons
   */
  static createLocationMarkerIcon(type, size = this.markerSize) {
    const color = this.LOCATION_TYPE_COLORS[type?.toLowerCase()] || this.LOCATION_TYPE_COLORS.default;
    const initials = this.TYPE_INITIALS[type?.toLowerCase()] || '?';
    
    let svg;
    
    // Use custom SVG icons if enabled, otherwise use simple design
    if (this.useCustomSVGIcons) {
      // Check if it's a live event for animation
      const isLive = type?.toLowerCase().includes('live');
      if (isLive) {
        svg = CustomSVGIcons.createAnimatedSVGMarker(type, color, size);
      } else {
        svg = CustomSVGIcons.createCustomSVGMarker(type, color, size);
      }
    } else {
      // Use simple circle design (current default)
      svg = CustomSVGIcons.createSimpleSVGMarker(type, color, initials, size);
    }
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size/2)
    };
  }

  /**
   * Create a location marker with enhanced features
   */
  static createLocationMarker(location) {
    if (!location.lat || !location.lng) {
      console.warn(`Skipping marker for ${location.name || 'unnamed'} - missing coordinates`);
      return null;
    }
    
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
      map: null, // Don't add to map directly - clustering will handle this
      title: location.name || 'Unnamed Location',
      icon: this.createLocationMarkerIcon(location.type),
      locationData: location // Store location data for info windows
    });
    
    // Add click listener for enhanced info window
    marker.addListener('click', () => {
      this.showLocationInfoWindow(marker, location);
    });
    
    console.log(`📍 Created enhanced marker for ${location.name} (${location.type})`);
    return marker;
  }

  /**
   * Show a place on the map with marker and info window
   * @param {Object} place - Place object with geometry and details
   * @param {Object} options - Display options
   */
  static async showPlaceOnMap(place, options = {}) {
    const map = MapService.getMap();
    if (!map || !place.geometry) {
      console.error('Map or place geometry not available');
      return null;
    }

    try {
      // Clear existing markers if specified
      if (options.clearExisting !== false) {
        this.clearMarkers();
      }

      // Create marker
      const marker = this.createMarker({
        position: place.geometry.location,
        title: place.name || 'Unknown Place',
        place: place,
        ...options.markerOptions
      });

      // Center map on marker
      const position = place.geometry.location;
      MapService.centerMap(
        position.lat(), 
        position.lng(), 
        options.zoom || 15
      );

      // Show info window if requested
      if (options.showInfoWindow !== false) {
        await this.showInfoWindow(marker, place);
      }

      // Store current place in state
      StateManager.setCurrentPlace(place);

      return marker;

    } catch (error) {
      console.error('Error showing place on map:', error);
      return null;
    }
  }

  /**
   * Create a map marker
   * @param {Object} options - Marker options
   * @returns {google.maps.Marker} Created marker
   */
  static createMarker(options = {}) {
    const map = MapService.getMap();
    if (!map) {
      throw new Error('Map not available');
    }

    const defaultOptions = {
      map: map,
      animation: google.maps.Animation.DROP,
      optimized: false // Better for custom icons
    };

    const markerOptions = { ...defaultOptions, ...options };

    // Create marker
    const marker = new google.maps.Marker(markerOptions);

    // Add to state
    StateManager.addMarker(marker);

    // Add click listener for info window
    marker.addListener('click', () => {
      if (options.place) {
        this.showInfoWindow(marker, options.place);
      }
    });

    return marker;
  }

  // ==========================================
  // LOCATION MARKERS MANAGEMENT
  // Handle saved locations with clustering
  // ==========================================

  /**
   * Update map with saved locations using enhanced markers
   */
  static async updateLocationMarkers(locations) {
    console.log('🗺️ Updating location markers...', locations?.length || 0, 'locations');
    
    // Clear existing location markers
    this.clearLocationMarkers();
    
    if (!locations || locations.length === 0) {
      console.log('📍 No locations to display');
      this.updateFilterStats(0, 0);
      return;
    }
    
    // Create new location markers
    let createdCount = 0;
    locations.forEach(location => {
      const marker = this.createLocationMarker(location);
      if (marker) {
        this.locationMarkers.push(marker);
        createdCount++;
      }
    });
    
    // Initialize clustering if enabled
    if (this.clusteringEnabled) {
      await this.initializeMarkerClustering();
    }
    
    // Apply current filters
    this.applyMarkerFilters();
    
    console.log(`✅ Created ${createdCount} location markers from ${locations.length} locations`);
  }

  /**
   * Clear all location markers from map
   */
  static clearLocationMarkers() {
    // Clear cluster if it exists
    if (this.markerCluster) {
      this.markerCluster.clearMarkers();
      this.markerCluster = null;
    }
    
    // Clear individual markers
    this.locationMarkers.forEach(marker => {
      if (marker) {
        marker.setMap(null);
      }
    });
    this.locationMarkers = [];
    
    // Close any open info windows
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
    }
    
    console.log('🧹 All location markers cleared');
  }

  // ==========================================
  // MARKER CLUSTERING
  // Smart clustering with custom styles
  // ==========================================

  /**
   * Initialize marker clustering with custom styles
   */
  static async initializeMarkerClustering() {
    if (typeof markerClusterer === 'undefined' || !this.locationMarkers.length || !this.clusteringEnabled) {
      console.log('⚠️ Clustering not available - showing individual markers');
      // Fallback: show markers individually
      this.locationMarkers.forEach(marker => {
        if (marker.getVisible()) {
          marker.setMap(MapService.getMap());
        }
      });
      return;
    }
    
    try {
      // Custom cluster renderer with location type colors
      const renderer = {
        render: ({ count, position }, stats, map) => {
          const color = count > 50 ? '#ad1457' : count > 20 ? '#8e44ad' : count > 10 ? '#ff4444' : '#4285f4';
          const svg = `
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" fill="${color}" stroke="white" stroke-width="3" opacity="0.9"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="Roboto,Arial">
                ${count}
              </text>
            </svg>
          `;
          
          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20)
            },
            title: `${count} locations`,
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count
          });
        }
      };
      
      // Create the MarkerClusterer
      this.markerCluster = new markerClusterer.MarkerClusterer({
        markers: this.locationMarkers,
        map: MapService.getMap(),
        renderer: renderer,
        algorithm: new markerClusterer.SuperClusterAlgorithm({
          radius: 60,        // Cluster radius in pixels
          maxZoom: 15,       // Maximum zoom to cluster markers
          minPoints: 2       // Minimum points to form a cluster
        })
      });
      
      console.log(`🔗 Marker clustering initialized with ${this.locationMarkers.length} markers`);
      
    } catch (error) {
      console.error('❌ Error initializing marker clustering:', error);
      // Fallback: show markers individually
      this.locationMarkers.forEach(marker => {
        if (marker.getVisible()) {
          marker.setMap(MapService.getMap());
        }
      });
    }
  }

  /**
   * Create multiple markers for places
   * @param {Array} places - Array of place objects
   * @param {Object} options - Options for all markers
   * @returns {Array} Array of created markers
   */
  static createMarkersForPlaces(places, options = {}) {
    const markers = [];

    places.forEach((place, index) => {
      if (!place.geometry || !place.geometry.location) return;

      const markerOptions = {
        position: place.geometry.location,
        title: place.name || `Place ${index + 1}`,
        place: place,
        ...options
      };

      const marker = this.createMarker(markerOptions);
      markers.push(marker);
    });

    // Fit map to show all markers
    if (markers.length > 1 && options.fitBounds !== false) {
      MapService.fitBoundsToMarkers();
    }

    return markers;
  }

  /**
   * Show info window for a marker
   * @param {google.maps.Marker} marker - Marker to show info for
   * @param {Object} place - Place data
   */
  static async showInfoWindow(marker, place) {
    const infoWindow = MapService.getInfoWindow();
    if (!infoWindow) return;

    try {
      // Generate info window content
      const content = await this.createInfoWindowContent(place);
      
      // Set content and open
      infoWindow.setContent(content);
      infoWindow.open(MapService.getMap(), marker);

      // Add save location button functionality
      this.setupInfoWindowHandlers(place);

    } catch (error) {
      console.error('Error showing info window:', error);
    }
  }

  /**
   * Create HTML content for info window
   * @param {Object} place - Place object
   * @returns {string} HTML content
   */
  static async createInfoWindowContent(place) {
    const rating = place.rating ? 
      `<div class="rating">⭐ ${place.rating} (${place.user_ratings_total || 0} reviews)</div>` : '';
    
    const website = place.website ? 
      `<div class="website"><a href="${place.website}" target="_blank">🌐 Website</a></div>` : '';
    
    const phone = place.formatted_phone_number ? 
      `<div class="phone">📞 ${place.formatted_phone_number}</div>` : '';
    
    const openingHours = place.opening_hours && place.opening_hours.open_now !== undefined ? 
      `<div class="hours ${place.opening_hours.open_now ? 'open' : 'closed'}">
        ${place.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
      </div>` : '';

    const priceLevel = place.price_level !== undefined ?
      `<div class="price-level">${'💰'.repeat(place.price_level)}</div>` : '';

    const photo = await this.getPlacePhotoUrl(place);
    const photoHTML = photo ? 
      `<div class="place-photo">
        <img src="${photo}" alt="${place.name}" style="max-width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
      </div>` : '';

    const isAuthenticated = StateManager.isAuthenticated();
    const isSaved = StateManager.isLocationSaved(place.place_id);
    
    const saveButton = isAuthenticated ? 
      `<button id="saveLocationBtn" class="save-location-btn ${isSaved ? 'saved' : ''}" 
               data-place-id="${place.place_id}">
        ${isSaved ? '✅ Saved' : '💾 Save Location'}
      </button>` : 
      `<div class="login-prompt">
        <small>Login to save locations</small>
      </div>`;

    return `
      <div class="info-window-content">
        ${photoHTML}
        <div class="place-info">
          <h3 class="place-name">${place.name || 'Unknown Place'}</h3>
          <div class="place-address">${place.formatted_address || place.vicinity || ''}</div>
          ${rating}
          ${priceLevel}
          ${openingHours}
          ${phone}
          ${website}
          <div class="place-types">
            ${this.formatPlaceTypes(place.types)}
          </div>
          <div class="info-actions">
            ${saveButton}
            <button id="directionsBtn" class="directions-btn" data-place-id="${place.place_id}">
              🧭 Directions
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get photo URL for a place
   * @param {Object} place - Place object
   * @returns {string|null} Photo URL or null
   */
  static async getPlacePhotoUrl(place) {
    if (!place.photos || !place.photos.length) return null;

    try {
      const photo = place.photos[0];
      return photo.getUrl({
        maxWidth: 300,
        maxHeight: 200
      });
    } catch (error) {
      console.error('Error getting place photo:', error);
      return null;
    }
  }

  /**
   * Format place types for display
   * @param {Array} types - Array of place types
   * @returns {string} Formatted types HTML
   */
  static formatPlaceTypes(types) {
    if (!types || !types.length) return '';
    
    return types
      .filter(type => !type.includes('political') && !type.includes('plus_code'))
      .slice(0, 3)
      .map(type => type.replace(/_/g, ' '))
      .map(type => `<span class="place-type-tag">${type}</span>`)
      .join(' ');
  }

  /**
   * Setup event handlers for info window buttons
   * @param {Object} place - Place object
   */
  static setupInfoWindowHandlers(place) {
    // Use timeout to ensure DOM is ready
    setTimeout(() => {
      // Save location button
      const saveBtn = document.getElementById('saveLocationBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.handleSaveLocation(place));
      }

      // Directions button
      const directionsBtn = document.getElementById('directionsBtn');
      if (directionsBtn) {
        directionsBtn.addEventListener('click', () => this.handleDirections(place));
      }
    }, 100);
  }

  /**
   * Handle save location button click
   * @param {Object} place - Place to save
   */
  static async handleSaveLocation(place) {
    if (!StateManager.isAuthenticated()) {
      alert('Please login to save locations');
      return;
    }

    try {
      // Transform the Google Places API place object for the form
      const locationData = this.transformPlaceForForm(place);
      
      // Show the save location dialog form instead of direct save
      if (window.Locations && window.Locations.showSaveLocationDialog) {
        window.Locations.showSaveLocationDialog(locationData);
      } else {
        console.error('Locations service not available');
        alert('Unable to open save dialog. Please try again.');
      }

    } catch (error) {
      console.error('Error saving location:', error);
      // Reset button state on error
      const saveBtn = document.getElementById('saveLocationBtn');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Location';
        saveBtn.className = 'save-location-btn';
      }
    }
  }

  /**
   * Transform Google Places API place object for the save form
   * @param {Object} place - Google Places API place object
   * @returns {Object} - Transformed data for the form
   */
  static transformPlaceForForm(place) {
    const transformedData = {};
    
    // Basic properties
    transformedData.place_id = place.place_id;
    transformedData.name = place.name;
    transformedData.formatted_address = place.formatted_address;
    transformedData.address = place.formatted_address; // For consistency with ClickToSaveService
    
    // Extract coordinates from Google Places API format
    if (place.geometry && place.geometry.location) {
      if (typeof place.geometry.location.lat === 'function') {
        transformedData.lat = place.geometry.location.lat();
        transformedData.lng = place.geometry.location.lng();
      } else {
        transformedData.lat = place.geometry.location.lat;
        transformedData.lng = place.geometry.location.lng;
      }
    }
    
    // Parse address components if available (same as ClickToSaveService)
    if (place.address_components) {
      // Initialize address component fields
      transformedData.street = '';
      transformedData.number = '';
      transformedData.city = '';
      transformedData.state = '';
      transformedData.zipcode = '';
      
      // Parse address components
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          transformedData.number = component.long_name;
        } else if (types.includes('route')) {
          transformedData.street = component.long_name;
        } else if (types.includes('locality')) {
          transformedData.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          transformedData.state = component.short_name;
        } else if (types.includes('postal_code')) {
          transformedData.zipcode = component.long_name;
        }
      });
    } else {
      // If no address_components, initialize empty fields
      transformedData.street = '';
      transformedData.number = '';
      transformedData.city = '';
      transformedData.state = '';
      transformedData.zipcode = '';
    }
    
    // Add any existing optional fields but leave required dropdowns empty
    // This ensures the user must make conscious choices for required fields
    const optionalFields = ['photo_url', 'production_notes'];
    optionalFields.forEach(field => {
      if (place[field] !== undefined) {
        transformedData[field] = place[field];
      }
    });
    
    console.log('🔧 MarkerService transformed data:', transformedData);
    return transformedData;
  }

  /**
   * Handle directions button click
   * @param {Object} place - Place for directions
   */
  static handleDirections(place) {
    if (!place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const name = encodeURIComponent(place.name || 'Location');
    
    // Open Google Maps in new tab
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${place.place_id}`;
    window.open(url, '_blank');
  }

  /**
   * Clear all markers from the map
   */
  static clearMarkers() {
    StateManager.clearMarkers();
  }

  /**
   * Remove specific marker
   * @param {google.maps.Marker} marker - Marker to remove
   */
  static removeMarker(marker) {
    if (marker) {
      marker.setMap(null);
      
      // Remove from state
      const markers = StateManager.getMapsState().markers;
      const index = markers.indexOf(marker);
      if (index > -1) {
        markers.splice(index, 1);
      }
    }
  }

  /**
   * Create custom marker icon
   * @param {Object} options - Icon options
   * @returns {Object} Marker icon object
   */
  static createCustomIcon(options = {}) {
    const defaultOptions = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };

    return { ...defaultOptions, ...options };
  }

  /**
   * Get all current markers
   * @returns {Array} Array of current markers
   */
  static getAllMarkers() {
    return StateManager.getMapsState().markers;
  }

  /**
   * Close info window
   */
  static closeInfoWindow() {
    const infoWindow = MapService.getInfoWindow();
    if (infoWindow) {
      infoWindow.close();
    }
  }
  
  /**
   * Get current place from state
   * @returns {Object|null} Current place object
   */
  static getCurrentPlace() {
    return StateManager.getCurrentPlace();
  }
  
  /**
   * Set current place in state
   * @param {Object} place - Place object to set as current
   */
  static setCurrentPlace(place) {
    StateManager.setCurrentPlace(place);
  }

  /**
   * Get marker icon based on location type
   * @param {string} locationType - Type of location
   * @returns {Object} Marker icon configuration
   */
  static getMarkerIconForType(locationType) {
    const iconConfigs = {
      'Live Reporter': {
        color: '#ff4444',
        label: 'R',
        title: 'Live Reporter Location'
      },
      'Live Anchor': {
        color: '#4285f4',
        label: 'A',
        title: 'Live Anchor Location'
      },
      'Live Stakeout': {
        color: '#ffbb33',
        label: 'S',
        title: 'Live Stakeout Location'
      },
      'Live Presser': {
        color: '#00aa00',
        label: 'P',
        title: 'Live Press Conference Location'
      },
      'Interview': {
        color: '#8e44ad',
        label: 'I',
        title: 'Interview Location'
      },
      'default': {
        color: '#666666',
        label: '•',
        title: 'Saved Location'
      }
    };

    return iconConfigs[locationType] || iconConfigs['default'];
  }

  /**
   * Create marker icon SVG
   * @param {Object} config - Icon configuration
   * @returns {string} SVG data URL
   */
  static createMarkerIcon(config) {
    const { color, label } = config;
    const svg = `
      <svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 7.5 12 24 12 24s12-16.5 12-24c0-6.627-5.373-12-12-12z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="8" fill="white"/>
        <text x="12" y="17" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="10" font-weight="bold" fill="${color}">${label}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Create a marker with location type styling
   * @param {Object} location - Location object with type information
   * @param {Object} options - Additional marker options
   * @returns {google.maps.Marker} Created marker
   */
  static createLocationTypeMarker(location, options = {}) {
    const iconConfig = this.getMarkerIconForType(location.type);
    const iconUrl = this.createMarkerIcon(iconConfig);

    const markerOptions = {
      position: { lat: location.lat, lng: location.lng },
      title: location.name || iconConfig.title,
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(24, 36),
        anchor: new google.maps.Point(12, 36)
      },
      place: location,
      locationType: location.type,
      ...options
    };

    return this.createMarker(markerOptions);
  }

  // ==========================================
  // MARKER FILTERING
  // Filter markers by location type
  // ==========================================

  /**
   * Apply marker filters based on selected types
   * Permanent locations (headquarters, bureaus) are always visible
   */
  static applyMarkerFilters() {
    const selectedTypes = this.getSelectedFilterTypes();
    this.activeFilters = new Set(selectedTypes);
    
    let visibleCount = 0;
    let totalCount = this.locationMarkers.length;
    let permanentCount = 0;
    
    this.locationMarkers.forEach(marker => {
      if (!marker || !marker.locationData) return;
      
      const locationType = marker.locationData.type?.toLowerCase();
      const isPermanent = marker.locationData.is_permanent || this.permanentLocationTypes.has(locationType);
      const shouldShow = isPermanent || selectedTypes.includes(locationType);
      
      marker.setVisible(shouldShow);
      if (shouldShow) {
        visibleCount++;
        if (isPermanent) permanentCount++;
      }
    });
    
    // Update clustering with filtered markers
    this.updateMarkerClustering();
    
    // Update filter statistics with permanent location info
    this.updateFilterStats(visibleCount, totalCount, permanentCount);
    
    console.log(`🔍 Filter applied: ${visibleCount}/${totalCount} markers visible (${permanentCount} permanent)`);
  }

  /**
   * Get currently selected filter types from UI
   */
  static getSelectedFilterTypes() {
    const checkboxes = document.querySelectorAll('.location-filters input[type="checkbox"]');
    const selectedTypes = [];
    
    checkboxes.forEach(checkbox => {
      if (checkbox.checked && checkbox.value) {
        selectedTypes.push(checkbox.value.toLowerCase());
      }
    });
    
    return selectedTypes;
  }

  /**
   * Update marker clustering when filters change
   */
  static updateMarkerClustering() {
    if (!this.clusteringEnabled || !this.markerCluster) {
      // Clustering disabled - show individual markers
      this.locationMarkers.forEach(marker => {
        if (marker.getVisible()) {
          marker.setMap(MapService.getMap());
        } else {
          marker.setMap(null);
        }
      });
      return;
    }
    
    // Get visible markers based on current filters
    const visibleMarkers = this.locationMarkers.filter(marker => marker.getVisible());
    
    // Update cluster with visible markers only
    this.markerCluster.clearMarkers();
    this.markerCluster.addMarkers(visibleMarkers);
    
    console.log(`🔗 Clustering updated with ${visibleMarkers.length} visible markers`);
  }

  /**
   * Update filter statistics display
   */
  static updateFilterStats(visibleCount, totalCount, permanentCount = 0) {
    const statsElement = document.getElementById('filter-stats');
    if (!statsElement) return;
    
    const filterableCount = totalCount - permanentCount;
    const filteredVisible = visibleCount - permanentCount;
    
    if (permanentCount > 0) {
      if (filteredVisible === filterableCount) {
        statsElement.textContent = `All types visible + ${permanentCount} permanent`;
        statsElement.style.color = '#28a745';
      } else if (filteredVisible === 0) {
        statsElement.textContent = `Only ${permanentCount} permanent locations visible`;
        statsElement.style.color = '#17a2b8';
      } else {
        statsElement.textContent = `${filteredVisible} of ${filterableCount} + ${permanentCount} permanent`;
        statsElement.style.color = '#ffc107';
      }
    } else {
      // Fallback to original logic if no permanent locations
      if (visibleCount === totalCount) {
        statsElement.textContent = 'All types visible';
        statsElement.style.color = '#28a745';
      } else if (visibleCount === 0) {
        statsElement.textContent = 'No markers visible';
        statsElement.style.color = '#dc3545';
      } else {
        statsElement.textContent = `${visibleCount} of ${totalCount} markers visible`;
        statsElement.style.color = '#ffc107';
      }
    }
    
    console.log(`📊 Filter stats: ${visibleCount}/${totalCount} markers visible (${permanentCount} permanent)`);
  }

  /**
   * Initialize filter event listeners
   */
  static initializeFilterListeners() {
    const checkboxes = document.querySelectorAll('.location-filters input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.applyMarkerFilters();
        console.log(`🔄 Filter toggled: ${checkbox.value} = ${checkbox.checked}`);
      });
    });
    
    // Make MarkerService available globally for button onclick handlers
    window.MarkerService = this;
    
    console.log('✅ Filter event listeners initialized');
  }

  /**
   * Toggle all filters on/off
   */
  static toggleAllFilters() {
    const checkboxes = document.querySelectorAll('.location-filters input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    // If all are checked, uncheck all; otherwise check all
    const newState = !allChecked;
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = newState;
    });
    
    this.applyMarkerFilters();
    console.log(`🔄 All filters ${newState ? 'enabled' : 'disabled'}`);
  }

  /**
   * Initialize clustering control UI
   */
  static initializeClusteringControls() {
    // Add clustering toggle button if it doesn't exist
    const mapControls = document.querySelector('.map-controls');
    if (mapControls && !document.getElementById('clusteringToggleBtn')) {
      const clusterBtn = document.createElement('button');
      clusterBtn.id = 'clusteringToggleBtn';
      clusterBtn.className = 'map-control-btn';
      clusterBtn.title = 'Toggle Marker Clustering';
      clusterBtn.innerHTML = '🔗';
      clusterBtn.addEventListener('click', () => this.toggleClustering());
      mapControls.appendChild(clusterBtn);
    }
  }

  /**
   * Toggle marker clustering on/off
   */
  static toggleClustering() {
    this.clusteringEnabled = !this.clusteringEnabled;
    const clusterStats = document.getElementById('cluster-stats');
    
    if (this.clusteringEnabled) {
      this.initializeMarkerClustering();
      if (clusterStats) {
        clusterStats.textContent = 'Clustering active';
        clusterStats.style.color = '#28a745';
      }
      console.log('✅ Marker clustering enabled');
    } else {
      if (this.markerCluster) {
        this.markerCluster.clearMarkers();
        this.markerCluster = null;
      }
      
      // Show individual markers directly on map
      this.locationMarkers.forEach(marker => {
        if (marker.getVisible()) {
          marker.setMap(MapService.getMap());
        }
      });
      
      if (clusterStats) {
        clusterStats.textContent = 'Individual markers';
        clusterStats.style.color = '#6c757d';
      }
      console.log('❌ Marker clustering disabled');
    }
  }

  // ==========================================
  // ENHANCED INFO WINDOWS
  // Rich info windows for location markers
  // ==========================================

  /**
   * Show enhanced info window for location marker
   */
  static showLocationInfoWindow(marker, location) {
    const content = `
      <div class="location-info-window" style="font-family: 'Roboto', Arial, sans-serif; color: #333; min-width: 280px; max-width: 320px;">
        <div class="location-info" style="padding: 12px;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a73e8; line-height: 1.3;">
            ${this.escapeHtml(location.name || 'Unnamed Location')}
          </h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #5f6368; line-height: 1.4;">
            ${this.escapeHtml(location.formatted_address || location.address || 'No address')}
          </p>
          <div style="display: inline-block; padding: 4px 12px; background: ${this.LOCATION_TYPE_COLORS[location.type?.toLowerCase()] || '#666'}; color: white; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            ${location.type || 'Unknown'}
          </div>
          ${location.production_notes ? `<p style="margin: 8px 0; font-size: 13px;"><strong>Notes:</strong> ${this.escapeHtml(location.production_notes)}</p>` : ''}
          ${location.entry_point ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Entry:</strong> ${this.escapeHtml(location.entry_point)}</p>` : ''}
          ${location.parking ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Parking:</strong> ${this.escapeHtml(location.parking)}</p>` : ''}
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="MarkerService.centerMapOnLocation(${location.lat}, ${location.lng})" style="flex: 1; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; background: #6c757d; color: white;">
              📍 Center
            </button>
            ${location.place_id ? `<button onclick="MarkerService.editLocation('${location.place_id}')" style="flex: 1; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; background: #1a73e8; color: white;">
              ✏️ Edit
            </button>` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Close any existing info window
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    
    this.currentInfoWindow = new google.maps.InfoWindow({
      content: content,
      maxWidth: 320
    });
    
    this.currentInfoWindow.open(MapService.getMap(), marker);
    console.log(`📋 Opened enhanced info window for ${location.name}`);
  }

  /**
   * Center map on specific coordinates
   */
  static centerMapOnLocation(lat, lng) {
    MapService.centerMap(parseFloat(lat), parseFloat(lng), 16);
    console.log(`🎯 Centered map on location: ${lat}, ${lng}`);
  }

  /**
   * Handle location editing (to be implemented by app)
   */
  static editLocation(placeId) {
    console.log(`✏️ Edit location requested for place_id: ${placeId}`);
    // This would trigger the app's edit location functionality
    // Implementation depends on your app's structure
  }

  /**
   * Escape HTML for safe display
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // CUSTOM SVG ICON MANAGEMENT
  // Toggle between simple and custom icons
  // ==========================================

  /**
   * Toggle between simple and custom SVG icons
   * @param {boolean} useCustom - Whether to use custom icons
   */
  static toggleCustomIcons(useCustom = null) {
    // Toggle if no parameter provided
    if (useCustom === null) {
      this.useCustomSVGIcons = !this.useCustomSVGIcons;
    } else {
      this.useCustomSVGIcons = useCustom;
    }
    
    console.log(`🎨 Custom SVG icons ${this.useCustomSVGIcons ? 'enabled' : 'disabled'}`);
    
    // Refresh all location markers to apply new icon style
    this.refreshLocationMarkers();
  }

  /**
   * Refresh all location markers with current icon style
   */
  static refreshLocationMarkers() {
    if (!this.locationMarkers.length) return;
    
    console.log('🔄 Refreshing location markers with new icon style...');
    
    // Update each marker's icon
    this.locationMarkers.forEach(marker => {
      if (marker && marker.locationData) {
        const newIcon = this.createLocationMarkerIcon(marker.locationData.type);
        marker.setIcon(newIcon);
      }
    });
    
    console.log(`✅ Refreshed ${this.locationMarkers.length} markers with ${this.useCustomSVGIcons ? 'custom' : 'simple'} icons`);
  }

  /**
   * Get available custom icon types
   * @returns {Array} Array of available icon types
   */
  static getAvailableCustomIconTypes() {
    return CustomSVGIcons.getAvailableTypes();
  }

  /**
   * Export custom icon as SVG file
   * @param {string} type - Location type
   * @param {string} filename - Optional filename
   */
  static exportCustomIconAsSVG(type, filename = null) {
    const color = this.LOCATION_TYPE_COLORS[type?.toLowerCase()] || this.LOCATION_TYPE_COLORS.default;
    const svgContent = CustomSVGIcons.exportIconAsSVG(type, color, 64);
    
    // Create download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${type || 'default'}_icon.svg`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`📁 Exported ${type} icon as SVG`);
  }

  /**
   * Export all custom icons data as JSON
   */
  static exportAllCustomIconsAsJSON() {
    const iconsData = CustomSVGIcons.exportIconsAsJSON();
    
    // Create download
    const blob = new Blob([iconsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom_svg_icons.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📁 Exported all custom icons as JSON');
  }

  /**
   * Get current icon style info
   * @returns {Object} Current icon configuration
   */
  static getCurrentIconInfo() {
    return {
      useCustomIcons: this.useCustomSVGIcons,
      iconStyle: this.useCustomSVGIcons ? 'custom' : 'simple',
      availableTypes: this.getAvailableCustomIconTypes(),
      currentMarkerCount: this.locationMarkers.length
    };
  }

  // ==========================================
  // PERMANENT LOCATIONS MANAGEMENT
  // Admin-only functionality for headquarters/bureaus
  // ==========================================

  /**
   * Check if a location type is permanent (always visible)
   * @param {string} type - Location type
   * @returns {boolean} True if permanent type
   */
  static isPermanentLocationType(type) {
    return this.permanentLocationTypes.has(type?.toLowerCase());
  }

  /**
   * Mark a location as permanent (admin only)
   * @param {string} locationId - Location ID
   * @param {boolean} isPermanent - Whether to mark as permanent
   */
  static async markLocationAsPermanent(locationId, isPermanent = true) {
    if (!StateManager.isAdmin()) {
      console.error('❌ Only admins can manage permanent locations');
      return false;
    }

    try {
      const response = await fetch('/api/locations/set-permanent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${StateManager.getAuthToken()}`
        },
        body: JSON.stringify({
          location_id: locationId,
          is_permanent: isPermanent
        })
      });

      if (response.ok) {
        console.log(`✅ Location ${isPermanent ? 'marked as' : 'removed from'} permanent`);
        
        // Update local marker if it exists
        const marker = this.locationMarkers.find(m => 
          m.locationData && m.locationData.id === locationId
        );
        if (marker) {
          marker.locationData.is_permanent = isPermanent;
          // Refresh marker appearance if needed
          this.refreshLocationMarkers();
        }
        
        return true;
      } else {
        console.error('❌ Failed to update permanent status');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating permanent status:', error);
      return false;
    }
  }

  /**
   * Get all permanent locations
   * @returns {Array} Array of permanent location markers
   */
  static getPermanentLocations() {
    return this.locationMarkers.filter(marker => {
      if (!marker || !marker.locationData) return false;
      const type = marker.locationData.type?.toLowerCase();
      return marker.locationData.is_permanent || this.isPermanentLocationType(type);
    });
  }

  /**
   * Get permanent location statistics
   * @returns {Object} Statistics about permanent locations
   */
  static getPermanentLocationStats() {
    const permanent = this.getPermanentLocations();
    const stats = {
      total: permanent.length,
      byType: {},
      visible: 0
    };

    permanent.forEach(marker => {
      const type = marker.locationData.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      if (marker.getVisible()) stats.visible++;
    });

    return stats;
  }

  /**
   * Add admin controls for permanent locations
   */
  static initializePermanentLocationControls() {
    if (!StateManager.isAdmin()) return;

    // Add admin control panel for permanent locations
    const mapControls = document.querySelector('.map-controls');
    if (mapControls && !document.getElementById('permanentControlsBtn')) {
      const permBtn = document.createElement('button');
      permBtn.id = 'permanentControlsBtn';
      permBtn.className = 'map-control-btn admin-only';
      permBtn.title = 'Manage Permanent Locations (Admin)';
      permBtn.innerHTML = '🏢';
      permBtn.addEventListener('click', () => this.showPermanentLocationPanel());
      mapControls.appendChild(permBtn);
    }
  }

  /**
   * Show permanent location management panel (admin only)
   */
  static showPermanentLocationPanel() {
    if (!StateManager.isAdmin()) {
      alert('Admin access required');
      return;
    }

    const stats = this.getPermanentLocationStats();
    const permanent = this.getPermanentLocations();
    
    let listHTML = '';
    if (permanent.length > 0) {
      listHTML = permanent.map(marker => {
        const loc = marker.locationData;
        return `
          <div class="permanent-location-item" style="padding: 8px; border: 1px solid #e0e0e0; margin: 4px 0; border-radius: 4px;">
            <strong>${loc.name || 'Unnamed'}</strong><br>
            <small>${loc.type || 'Unknown Type'} - ${loc.formatted_address || loc.address || 'No address'}</small><br>
            <button onclick="MarkerService.markLocationAsPermanent('${loc.id}', false)" style="font-size: 11px; padding: 2px 6px; margin-top: 4px;">
              Remove Permanent Status
            </button>
          </div>
        `;
      }).join('');
    } else {
      listHTML = '<p style="color: #666; font-style: italic;">No permanent locations found</p>';
    }

    const panelContent = `
      <div style="max-width: 400px; max-height: 500px; overflow-y: auto;">
        <h3 style="margin: 0 0 12px 0;">🏢 Permanent Locations Management</h3>
        <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 12px;">
          <strong>Statistics:</strong><br>
          Total: ${stats.total} | Visible: ${stats.visible}<br>
          Types: ${Object.entries(stats.byType).map(([type, count]) => `${type}: ${count}`).join(', ')}
        </div>
        <div style="margin-bottom: 12px;">
          <button onclick="MarkerService.addNewPermanentLocation()" style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
            ➕ Add New Permanent Location
          </button>
        </div>
        <h4>Current Permanent Locations:</h4>
        <div style="max-height: 300px; overflow-y: auto;">
          ${listHTML}
        </div>
      </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); display: flex; align-items: center; 
      justify-content: center; z-index: 10000;
    `;
    
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: white; padding: 20px; border-radius: 8px; 
      box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    `;
    panel.innerHTML = panelContent + `
      <div style="margin-top: 16px; text-align: right;">
        <button onclick="this.closest('.modal').remove()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    modal.className = 'modal';
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }

  /**
   * Add new permanent location (admin only)
   */
  static addNewPermanentLocation() {
    if (!StateManager.isAdmin()) {
      alert('Admin access required');
      return;
    }

    // This would integrate with your existing location save dialog
    // but automatically mark as permanent and set appropriate type
    if (window.Locations && window.Locations.showSaveLocationDialog) {
      const permanentLocationData = {
        type: 'headquarters', // Default to headquarters
        is_permanent: true,
        admin_notes: 'Added as permanent location'
      };
      window.Locations.showSaveLocationDialog(permanentLocationData);
    } else {
      alert('Location save dialog not available. Please use the regular save location feature and mark as permanent.');
    }
  }

  // ==========================================
  // PERMANENT LOCATION ADMIN METHODS
  // For testing and admin functionality
  // ==========================================

  /**
   * Show only permanent locations on the map
   */
  static showOnlyPermanentLocations() {
    console.log('🏢 Filtering to show only permanent locations...');
    
    this.locationMarkers.forEach(marker => {
      if (marker && marker.locationData) {
        const isPermanent = marker.locationData.is_permanent || 
                           this.permanentLocationTypes.has(marker.locationData.type);
        
        if (isPermanent) {
          marker.setMap(MapService.getMap());
        } else {
          marker.setMap(null);
        }
      }
    });
    
    // Update the active filter state
    this.activeFilters = new Set(['permanent-only']);
    
    // Update statistics
    const stats = this.getLocationStats();
    console.log(`🏢 Permanent-only filter applied: ${stats.visible} locations visible`);
  }

  /**
   * Get comprehensive location statistics
   */
  static getLocationStats() {
    let total = 0;
    let visible = 0;
    let permanent = 0;
    const byType = {};
    
    this.locationMarkers.forEach(marker => {
      if (marker && marker.locationData) {
        total++;
        
        const locationType = marker.locationData.type;
        const isPermanent = marker.locationData.is_permanent || 
                           this.permanentLocationTypes.has(locationType);
        
        // Count by type
        byType[locationType] = (byType[locationType] || 0) + 1;
        
        // Count permanent
        if (isPermanent) {
          permanent++;
        }
        
        // Count visible (check if marker is on map)
        if (marker.getMap() !== null) {
          visible++;
        }
      }
    });
    
    return {
      total,
      visible,
      permanent,
      byType,
      filtered: total - visible
    };
  }

  /**
   * Clear all active filters
   */
  static clearFilters() {
    console.log('🔄 Clearing all marker filters...');
    
    // Show all markers
    this.locationMarkers.forEach(marker => {
      if (marker) {
        marker.setMap(MapService.getMap());
      }
    });
    
    // Clear active filter state
    this.activeFilters = new Set(['live reporter', 'live anchor', 'live stakeout', 'interview', 'broll']);
    
    const stats = this.getLocationStats();
    console.log(`✅ All filters cleared: ${stats.visible} locations visible`);
  }

  /**
   * Get map center coordinates for testing
   */
  static getMapCenter() {
    return MapService.getMapCenter();
  }

}

// Export individual functions for backward compatibility
export const showPlaceOnMap = MarkerService.showPlaceOnMap.bind(MarkerService);
export const createMarker = MarkerService.createMarker.bind(MarkerService);
export const createMarkersForPlaces = MarkerService.createMarkersForPlaces.bind(MarkerService);
export const showInfoWindow = MarkerService.showInfoWindow.bind(MarkerService);
export const createInfoWindowContent = MarkerService.createInfoWindowContent.bind(MarkerService);
export const clearMarkers = MarkerService.clearMarkers.bind(MarkerService);
export const removeMarker = MarkerService.removeMarker.bind(MarkerService);
export const closeInfoWindow = MarkerService.closeInfoWindow.bind(MarkerService);
export const getCurrentPlace = MarkerService.getCurrentPlace.bind(MarkerService);
export const setCurrentPlace = MarkerService.setCurrentPlace.bind(MarkerService);