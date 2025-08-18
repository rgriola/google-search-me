/**
 * Map marker management
 * Handles creation, display, and removal of map markers and info windows
 * Streamlined for circle icons only
 */

import { StateManager } from '../state/AppState.js';
import { MapService } from './MapService.js';
import { CustomSVGIcons } from './CustomSVGIcons.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

/**
 * Marker Service Class - Streamlined for circle icons
 */
export class MarkerService {

  // ==========================================
  // MARKER SYSTEM - CIRCLE ICONS ONLY
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
  static currentInfoWindow = null;       // Track open info windows
  static clusteringEnabled = true;       // Clustering state
  static markerSize = 38; // Default marker size in pixels


  /**
   * Initialize marker service with enhanced features
   */
  static async initialize() {


    console.log('>>>>>>>>>>  MarkerService.initialize() <<<<<<<<<<<');
    console.log('📍 Initializing Enhanced Marker Service');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    // Load MarkerClusterer library if not already loaded
    await this.loadMarkerClustererLibrary();
    
    // NOTE: Clustering controls now handled by MapControlsManager
    // this.initializeClusteringControls(); // REMOVED - see MapControlsManager.js
    
    // Initialize event delegation for marker actions
    this.initializeEventDelegation();
    
    console.log('✅ Enhanced Marker Service initialized with clustering');
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
  // CIRCLE MARKER CREATION
  // SVG circle icons with type colors and initials
  // ==========================================

  /**
   * Create circle marker icon with dynamic color and type initials
   * 
   *  This calls the marker createion 
   * 
   * 
   */
  static createLocationMarkerIcon(type, size = this.markerSize) {
    const color = this.LOCATION_TYPE_COLORS[type?.toLowerCase()] || this.LOCATION_TYPE_COLORS.default;
    const initials = this.TYPE_INITIALS[type?.toLowerCase()] || '?';
    
    // Always use simple circle design
    //const svg = CustomSVGIcons.createSimpleSVGMarker(type, color, initials, size);

    const svg = CustomSVGIcons.createAnimatedSVGMarker(type, color, initials, size);

    // Create data URL with proper encoding
    let dataUrl;
    try {
      dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      
      console.log(`📍 Created circle marker icon for ${type}:`, {
        type,
        color,
        initials,
        size,
        svgLength: svg.length
      });
      
    } catch (error) {
      console.error('❌ Error encoding SVG for marker:', error);
      // Fallback to simple base64 encoding
      try {
        dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
        console.log('📍 Using base64 fallback for marker icon');
      } catch (base64Error) {
        console.error('❌ Base64 fallback also failed:', base64Error);
        // Ultimate fallback to default Google Maps marker
        return null;
      }
    }

    return {
      url: dataUrl,
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
        StateManager.clearMarkers();
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
  // this is the popup when you click on the google marker. 
   /*
    const rating = place.rating ? 
      `<div class="rating">⭐ ${SecurityUtils.escapeHtml(place.rating.toString())} (${SecurityUtils.escapeHtml((place.user_ratings_total || 0).toString())} reviews)</div>` : '';
    */
    
   /* const phone = place.formatted_phone_number ? 
      `<div class="phone">📞 ${SecurityUtils.escapeHtml(place.formatted_phone_number)}</div>` : '';
    */
    /*
    const openingHours = place.opening_hours && place.opening_hours.open_now !== undefined ? 
      `<div class="hours ${place.opening_hours.open_now ? 'open' : 'closed'}">
        ${place.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
      </div>` : '';
    */

    /*
    const priceLevel = place.price_level !== undefined ?
      `<div class="price-level">${'💰'.repeat(place.price_level)}</div>` : '';
      */
    
    /*
    const photoHTML = photo ? 
      `<div class="place-photo">
        <img src="${SecurityUtils.escapeHtmlAttribute(photo)}" alt="${SecurityUtils.escapeHtmlAttribute(place.name)}" style="max-width: 100%; height: 120px; object-fit: cover; border-radius: 8px;">
      </div>` : '';
    */

    const photo = await this.getPlacePhotoUrl(place);

    const website = place.website ? 
      `<div class="website"><a href="${SecurityUtils.escapeHtmlAttribute(place.website)}" target="_blank">🌐 Website</a></div>` : '';

    const isAuthenticated = StateManager.isAuthenticated();
    const isSaved = StateManager.isLocationSaved(place.place_id);
    
    const saveButton = isAuthenticated ? 
      `<button id="saveLocationBtn" class="save-location-btn ${isSaved ? 'saved' : ''}" 
               data-place-id="${SecurityUtils.escapeHtmlAttribute(place.place_id)}">
        ${isSaved ? '✅ Saved' : '💾 Save Location'} </button>` : `<div class="login-prompt"><small>Login to save locations</small></div>`;

    return `
      <div class="info-window-content">
        <div class="place-info">
          <h1 class="place-name">${SecurityUtils.escapeHtml(place.name || 'Unknown Place')}</h3>
          <div class="place-address">${SecurityUtils.escapeHtml(place.formatted_address || place.vicinity || '')}</div>
          ${website}
          <div class="place-types">
            ${this.formatPlaceTypes(place.types)}
          </div>
          <div class="info-actions">
            ${saveButton}
            <button id="directionsBtn" class="directions-btn" data-place-id="${SecurityUtils.escapeHtmlAttribute(place.place_id)}">
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
      .map(type => `<span class="place-type-tag">${SecurityUtils.escapeHtml(type)}</span>`)
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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&destination_place_id=${encodeURIComponent(place.place_id)}`;
    window.open(url, '_blank');
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
   * Close info window
   */
  static closeInfoWindow() {
    const infoWindow = MapService.getInfoWindow();
    if (infoWindow) {
      infoWindow.close();
    }
  }

  /**
   * REMOVED: initializeClusteringControls()
   * Clustering control creation is now handled by MapControlsManager
   * See: js/modules/maps/MapControlsManager.js
   */

  /**
   * Toggle marker clustering on/off
   */
  static toggleClustering() {
    this.clusteringEnabled = !this.clusteringEnabled;
    
    if (this.clusteringEnabled) {
      this.initializeMarkerClustering();
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
      
      console.log('❌ Marker clustering disabled');
    }
  }

  /**
   * Initialize event delegation for marker actions
   */
  static initializeEventDelegation() {
    // Remove any existing delegation to avoid duplicates
    document.removeEventListener('click', this.handleMarkerActionClick);
    
    // Add global event delegation for marker actions
    document.addEventListener('click', this.handleMarkerActionClick.bind(this));
    console.log('initializeEventDelegation()');
    console.log('✅ Marker action event delegation initialized');
  }

  /**
   * Handle marker action clicks via event delegation
   * @param {Event} event - Click event
   */
  static handleMarkerActionClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    
    if (!action) return;
    
    // Prevent default behavior
    event.preventDefault();
    
    switch (action) {
      case 'centerMapOnLocation':
        const lat = parseFloat(target.dataset.lat);
        const lng = parseFloat(target.dataset.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          MapService.centerMap(parseFloat(lat), parseFloat(lng), 16);
        }
        break;
        
      case 'editLocation':
        const placeId = target.dataset.placeId;
        if (placeId) {
          this.editLocation(placeId);
        }
        break;
        
      case 'closeModal':
        const modal = target.closest('.modal');
        if (modal) {
          modal.remove();
        }
        break;
        
      default:
        console.log('Unknown marker action:', action);
    }
  }

  // ==========================================
  // ENHANCED INFO WINDOWS
  // Rich info windows for location markers
  // ==========================================

  /**
   * Show enhanced info window for location marker
   * @param {google.maps.Marker} marker - The marker to show the info window for
   * @param {Object} location - The location data to display
   * 
   * This creates the dialog window after clicking on the marker. 
   * 8-16-2025
   * 
   */
  static showLocationInfoWindow(marker, location) {
    // Close any existing info window
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    
    // Create info window content
    const content = `
      <div class="location-info-window">
        <div class="dialog-header">
          <h3 class="place-name">${SecurityUtils.escapeHtml(location.name || 'Unnamed Location')}</h3>
          <button class="close-dialog">&times;</button>
        </div>
        <p class="place-address">
          ${SecurityUtils.escapeHtml(location.formatted_address || location.address || 'No address')}
        </p>
        <div class="location-type-badge" style="background: ${this.LOCATION_TYPE_COLORS[location.type?.toLowerCase()] || '#666'};">
          ${SecurityUtils.escapeHtml(location.type || 'Unknown')}
        </div>
        ${location.production_notes ? `<p class="location-notes"><strong>Notes:</strong> ${SecurityUtils.escapeHtml(location.production_notes)}</p>` : ''}
        ${location.entry_point ? `<p class="location-detail"><strong>Entry:</strong> ${SecurityUtils.escapeHtml(location.entry_point)}</p>` : ''}
        ${location.parking ? `<p class="location-detail"><strong>Parking:</strong> ${SecurityUtils.escapeHtml(location.parking)}</p>` : ''}
        <div class="info-actions">
         <!-- <button class="directions-btn" data-action="centerMapOnLocation" 
                  data-lat="${SecurityUtils.escapeHtmlAttribute(location.lat)}" 
                  data-lng="${SecurityUtils.escapeHtmlAttribute(location.lng)}">
            📍 Center
          </button>. -->
          <!-- 
          ${location.place_id ? `<button class="save-location-btn" data-action="editLocation" 
                  data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id)}">
            ✏️ Edit
          </button>` : ''}
          -->
        </div>
      </div>
    `;
    
    // Create Google Maps InfoWindow with custom positioning
    this.currentInfoWindow = new google.maps.InfoWindow({
      content: content,
      maxWidth: 300,
      // this moves the map its self offset from the marker. DO NOT CHANGE
      // The x,y is off set from the map centerd in the viewport 0,0 is center. 
      pixelOffset: new google.maps.Size(200, 200) // Offset to keep marker visible
    });
    
    console.log('📋 Created InfoWindow with content:', content);
    
    // Open info window
    this.currentInfoWindow.open(MapService.getMap(), marker);
    
    console.log('📋 InfoWindow opened on map');
    
    // CRITICAL FIX: Add event listener for close button after InfoWindow DOM is ready
    google.maps.event.addListener(this.currentInfoWindow, 'domready', () => {
      const closeButton = document.querySelector('.location-info-window .close-dialog');
      if (closeButton) {
        closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚪 InfoWindow close button clicked directly');
          this.currentInfoWindow.close();
          this.currentInfoWindow = null;
        });
        console.log('✅ InfoWindow close button event listener attached');
      } else {
        console.warn('⚠️ Close button not found in InfoWindow DOM');
      }
    });
    
    // Pan map to ensure both marker and info window are visible
    setTimeout(() => {
      const map = MapService.getMap();
      const markerPosition = marker.getPosition();
      const projection = map.getProjection();
      
      if (projection) {
        // Calculate offset to move marker slightly down/left to accommodate info window
        const scale = Math.pow(2, map.getZoom());
        const worldCoordinate = projection.fromLatLngToPoint(markerPosition);
        
        // Offset controls (currently set to 0 as per your existing code)
        const offsetX = 0 / scale;
        const offsetY = 0 / scale;
        
        const newWorldCoordinate = new google.maps.Point(
          worldCoordinate.x + offsetX,
          worldCoordinate.y + offsetY
        );
        
        const newCenter = projection.fromPointToLatLng(newWorldCoordinate);
        map.panTo(newCenter);
      }
    }, 100);
    
    console.log(`📋 Opened info window for ${location.name}`);
  }

  /**
   * Handle location editing
   */
  static editLocation(placeId) {
    console.log(`✏️ Edit location requested for place_id: ${placeId}`);
    
    // Close the info window first
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    
    // Call the Locations module's edit functionality
    if (window.Locations && typeof window.Locations.showEditLocationDialog === 'function') {
      window.Locations.showEditLocationDialog(placeId);
    } else {
      console.error('❌ window.Locations.showEditLocationDialog not available');
    }
  }

  /**
 * PUBLIC method to close current InfoWindow
 */
static closeCurrentInfoWindow() {
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
      console.log('📋 InfoWindow closed programmatically');
    }
}
}

// Export individual functions for backward compatibility
export const showPlaceOnMap = MarkerService.showPlaceOnMap.bind(MarkerService);
export const createMarker = MarkerService.createMarker.bind(MarkerService);
export const createMarkersForPlaces = MarkerService.createMarkersForPlaces.bind(MarkerService);
export const showInfoWindow = MarkerService.showInfoWindow.bind(MarkerService);
//export const createInfoWindowContent = MarkerService.createInfoWindowContent.bind(MarkerService);
export const removeMarker = MarkerService.removeMarker.bind(MarkerService);
export const closeInfoWindow = MarkerService.closeInfoWindow.bind(MarkerService);
