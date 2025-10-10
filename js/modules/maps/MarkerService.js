/**
 * Map marker management
 * Handles creation, display, and removal of map markers and info windows
 * Streamlined for circle icons only
 */

import { StateManager } from '../state/AppState.js';
import { MapService } from './MapService.js';
import { CustomSVGIcons } from './CustomSVGIcons.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'MARKER_SERVICE';

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
    debug(FILE, '📍 Initializing Enhanced Marker Service');
    await this.loadMarkerClustererLibrary();
    this.initializeEventDelegation();
    this.initializeGooglePlacesInterception();
    debug(FILE, '✅ Enhanced Marker Service initialized with clustering and Google Places interception');
  }

  /**
   * Load MarkerClusterer library dynamically
   */
  static loadMarkerClustererLibrary() {
    return new Promise((resolve, reject) => {
      if (typeof markerClusterer !== 'undefined') {
        debug(FILE, '✅ MarkerClusterer already loaded');
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
      script.onload = () => {
        debug(FILE, '✅ MarkerClusterer library loaded successfully');
        resolve();
      };
      script.onerror = () => {
        debug(FILE, '⚠️ Failed to load MarkerClusterer library - clustering disabled', null, 'warn');
        this.clusteringEnabled = false;
        resolve();
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
    const svg = CustomSVGIcons.createAnimatedSVGMarker(type, color, initials, size);

    let dataUrl;
    try {
      dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
      debug(FILE, `📍 Created circle marker icon for ${type}:`, { type, color, initials, size, svgLength: svg.length });
    } catch (error) {
      debug(FILE, '❌ Error encoding SVG for marker:', error, 'error');
      try {
        dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
        debug(FILE, '📍 Using base64 fallback for marker icon');
      } catch (base64Error) {
        debug(FILE, '❌ Base64 fallback also failed:', base64Error, 'error');
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
      debug(FILE, `Skipping marker for ${location.name || 'unnamed'} - missing coordinates`, null, 'warn');
      return null;
    }
    const marker = new google.maps.Marker({
      position: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
      map: null,
      title: location.name || 'Unnamed Location',
      icon: this.createLocationMarkerIcon(location.type),
      locationData: location
    });
    marker.addListener('click', () => {
      this.showLocationInfoWindow(marker, location);
    });
    debug(FILE, `📍 Created enhanced marker for ${location.name} (${location.type})`);
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
      debug(FILE, 'Map or place geometry not available', null, 'error');
      return null;
    }
    try {
      if (options.clearExisting !== false) {
        StateManager.clearMarkers();
      }
      const marker = this.createMarker({
        position: place.geometry.location,
        title: place.name || 'Unknown Place',
        place: place,
        ...options.markerOptions
      });
      const position = place.geometry.location;
      MapService.centerMap(
        position.lat(), 
        position.lng(), 
        options.zoom || 15
      );
      if (options.showInfoWindow !== false) {
        await this.showInfoWindow(marker, place);
      }
      StateManager.setCurrentPlace(place);
      return marker;
    } catch (error) {
      debug(FILE, 'Error showing place on map:', error, 'error');
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
    debug(FILE, '🗺️ Updating location markers...', locations?.length || 0, 'locations');
    this.clearLocationMarkers();
    if (!locations || locations.length === 0) {
      debug(FILE, '📍 No locations to display');
      return;
    }
    let createdCount = 0;
    locations.forEach(location => {
      const marker = this.createLocationMarker(location);
      if (marker) {
        this.locationMarkers.push(marker);
        createdCount++;
      }
    });
    if (this.clusteringEnabled) {
      await this.initializeMarkerClustering();
    }
    debug(FILE, `✅ Created ${createdCount} location markers from ${locations.length} locations`);
  }

  /**
   * Clear all location markers from map
   */
  static clearLocationMarkers() {
    if (this.markerCluster) {
      this.markerCluster.clearMarkers();
      this.markerCluster = null;
    }
    this.locationMarkers.forEach(marker => {
      if (marker) {
        marker.setMap(null);
      }
    });
    this.locationMarkers = [];
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
    }
    debug(FILE, '🧹 All location markers cleared');
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
      debug(FILE, '⚠️ Clustering not available - showing individual markers', null, 'warn');
      this.locationMarkers.forEach(marker => {
        if (marker.getVisible()) {
          marker.setMap(MapService.getMap());
        }
      });
      return;
    }
    try {
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
      this.markerCluster = new markerClusterer.MarkerClusterer({
        markers: this.locationMarkers,
        map: MapService.getMap(),
        renderer: renderer,
        algorithm: new markerClusterer.SuperClusterAlgorithm({
          radius: 60,
          maxZoom: 15,
          minPoints: 2
        })
      });
      debug(FILE, `🔗 Marker clustering initialized with ${this.locationMarkers.length} markers`);
    } catch (error) {
      debug(FILE, '❌ Error initializing marker clustering:', error, 'error');
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
    let infoWindow = MapService.getInfoWindow();
    if (!infoWindow) {
      debug(FILE, '🔧 No info window found, creating new one');
      infoWindow = new google.maps.InfoWindow({
        maxWidth: 350,
        disableAutoPan: false
      });
      if (typeof MapService.setInfoWindow === 'function') {
        MapService.setInfoWindow(infoWindow);
      }
    }
    try {
      debug(FILE, '🔍 Attempting to create info window content for:', place.name);
      const content = await this.createInfoWindowContent(place);
      debug(FILE, '📋 Info window content generated, length:', content.length);
      infoWindow.setContent(content);
      infoWindow.open(MapService.getMap(), marker);
      debug(FILE, '📋 Info window opened on map');
      this.setupInfoWindowHandlers(place);
      debug(FILE, '✅ Info window setup complete for:', place.name);
    } catch (error) {
      debug(FILE, '❌ Error showing info window:', error, 'error');
    }
  }

  /**
   * Create HTML content for info window
   * @param {Object} place - Place object
   * @returns {string} HTML content
   */

static async createInfoWindowContent(place) {
    const photo = await this.getPlacePhotoUrl(place);

    const website = place.website ? 
      `<div class="website"><a href="${SecurityUtils.escapeHtmlAttribute(place.website)}" target="_blank">Website</a></div>` : '';

    const isAuthenticated = StateManager.isAuthenticated();
    const isSaved = StateManager.isLocationSaved(place.place_id);
    
    const saveButton = isAuthenticated ? 
      `<button id="saveLocationBtn" class="save-location-btn ${isSaved ? 'saved' : ''}" data-place-id="${SecurityUtils.escapeHtmlAttribute(place.place_id)}">
        ${isSaved ? 'Saved' : 'Save'} </button>`: ``;

    return `
      <div class="info-window-content">
        <div class="info-window-header">
          <h3 class="place-name">${SecurityUtils.escapeHtml(place.name || 'Unknown Place')}</h1>
          <button class="close-dialog">x</button>
        </div>
        <div class="place-info">
          <div class="place-address">${SecurityUtils.escapeHtml(place.formatted_address || place.vicinity || '')}</div>
          ${website}
          <div class="place-types">
            ${this.formatPlaceTypes(place.types)}
          </div>
          <div class="info-actions">
            ${saveButton}
            <button id="directionsBtn" class="directions-btn" data-place-id="${SecurityUtils.escapeHtmlAttribute(place.place_id)}">Directions</button>
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
    setTimeout(() => {
      const closeBtn = document.querySelector('.info-window-content .close-dialog');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          debug(FILE, '🚪 Google Places InfoWindow close button clicked');
          const infoWindow = MapService.getInfoWindow();
          if (infoWindow) {
            infoWindow.close();
          }
        });
        debug(FILE, '✅ Google Places InfoWindow close button event listener attached');
      }
      const saveBtn = document.getElementById('saveLocationBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => this.handleSaveLocation(place));
      }
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
      const locationData = this.transformPlaceForForm(place);
      if (window.Locations && window.Locations.showSaveLocationDialog) {
        window.Locations.showSaveLocationDialog(locationData);
      } else {
        debug(FILE, 'Locations service not available', null, 'error');
        alert('Unable to open save dialog. Please try again.');
      }
    } catch (error) {
      debug(FILE, 'Error saving location:', error, 'error');
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
      debug(FILE, '✅ Marker clustering enabled');
    } else {
      if (this.markerCluster) {
        this.markerCluster.clearMarkers();
        this.markerCluster = null;
      }
      this.locationMarkers.forEach(marker => {
        if (marker.getVisible()) {
          marker.setMap(MapService.getMap());
        }
      });
      debug(FILE, '❌ Marker clustering disabled');
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
    debug(FILE, '✅ Marker action event delegation initialized');
  }

  /**
   * Handle marker action clicks via event delegation
   * @param {Event} event - Click event
   */
  static handleMarkerActionClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    if (!action) return;
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
        debug(FILE, 'Non Marker Action:', action);
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
          <h3 class="place-name"> ${SecurityUtils.escapeHtml(location.name || 'Unnamed Location')}</h3>
          <button class="close-dialog">&times;</button>
        </div>
        <p class="place-address">
          ${SecurityUtils.escapeHtml(location.formatted_address || location.address || 'No address')}
        </p>
        <div class="location-type-badge" style="background: ${this.LOCATION_TYPE_COLORS[location.type?.toLowerCase()] || '#666'};">
          ${SecurityUtils.escapeHtml(location.type || 'Unknown')}
        </div>
          <div class="info-actions">
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
    
    debug(FILE, '📋 Created InfoWindow with content:', content);
    
    // Open info window
    this.currentInfoWindow.open(MapService.getMap(), marker);
    
    debug(FILE, '📋 InfoWindow opened on map');
    
    // CRITICAL FIX: Add event listener for close button after InfoWindow DOM is ready
    google.maps.event.addListener(this.currentInfoWindow, 'domready', () => {
      const closeButton = document.querySelector('.location-info-window .close-dialog');
      if (closeButton) {
        closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          debug(FILE, '🚪 InfoWindow close button clicked directly');
          this.currentInfoWindow.close();
          this.currentInfoWindow = null;
        });
        debug(FILE, '✅ InfoWindow close button event listener attached');
      } else {
        debug(FILE, '⚠️ Close button not found in InfoWindow DOM', null, 'warn');
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
    
    debug(FILE, `📋 Opened info window for ${location.name}`);
  }

  /**
   * Handle location editing
   */
  static editLocation(placeId) {
    debug(FILE, `✏️ Edit location requested for place_id: ${placeId}`);
    
    // Close the info window first
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
    
    // Call the Locations module's edit functionality
    if (window.Locations && typeof window.Locations.showEditLocationDialog === 'function') {
      window.Locations.showEditLocationDialog(placeId);
    } else {
      debug(FILE, '❌ window.Locations.showEditLocationDialog not available', null, 'error');
    }
  }

  /**
 * PUBLIC method to close current InfoWindow
 */
static closeCurrentInfoWindow() {
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
      debug(FILE, '📋 InfoWindow closed programmatically');
    }
}

  /**
   * Initialize Google Places click interception
   * This replaces Google's native info windows with our custom ones
   */
  static initializeGooglePlacesInterception() {
    const map = MapService.getMap();
    if (!map) {
      debug(FILE, '⚠️ Map not available for Google Places interception', null, 'warn');
      return;
    }

    // Track recent clicks to prevent duplicates
    let lastPlaceId = null;
    let lastClickTime = 0;
    
    // Intercept clicks on Google Places (POI markers)
    google.maps.event.addListener(map, 'click', (event) => {
      // Check if this was a click on a Google Place
      if (event.placeId) {
        const currentTime = Date.now();
        
        // Prevent duplicate clicks on same place within 500ms
        if (event.placeId === lastPlaceId && (currentTime - lastClickTime) < 500) {
          debug(FILE, '🔄 Duplicate click detected, ignoring');
          return;
        }
        
        lastPlaceId = event.placeId;
        lastClickTime = currentTime;
        
        debug(FILE, '🎯 Intercepted Google Place click:', event.placeId);
        
        // Prevent the default Google info window from showing
        event.stop();
        
        // Small delay to ensure proper event handling
        setTimeout(() => {
          this.handleGooglePlaceClick(event.placeId, event.latLng);
        }, 10);
      }
    });
    
    debug(FILE, '✅ Google Places click interception initialized');
  }

  /**
   * Handle click on a Google Place marker
   * @param {string} placeId - The Google Place ID
   * @param {google.maps.LatLng} latLng - The click coordinates
   */
  static async handleGooglePlaceClick(placeId, latLng) {
    const map = MapService.getMap();
    if (!map) {
      debug(FILE, '❌ Map not available for Google Place click handling', null, 'error');
      return;
    }

    try {
      debug(FILE, '🔍 Processing Google Place click:', placeId);
      
      // Close any existing info windows first
      this.closeInfoWindow();
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
        this.currentInfoWindow = null;
      }

      // Create Places service to get place details
      const service = new google.maps.places.PlacesService(map);
      
      // Request detailed place information
      const request = {
        placeId: placeId,
        fields: [
          'place_id', 
          'name', 
          'formatted_address', 
          'geometry', 
          'types', 
          'website',
          'formatted_phone_number',
          'rating',
          'user_ratings_total',
          'price_level',
          'opening_hours',
          'photos',
          'vicinity'
        ]
      };

      // Wrap getDetails in a Promise for better error handling
      const getPlaceDetails = () => {
        return new Promise((resolve, reject) => {
          service.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              reject(new Error(`Places API error: ${status}`));
            }
          });
        });
      };

      // Get place details
      const place = await getPlaceDetails();
      debug(FILE, '📍 Retrieved Google Place details:', place.name);
      debug(FILE, '🔍 Place data:', {
        name: place.name,
        address: place.formatted_address,
        geometry: !!place.geometry,
        location: place.geometry?.location ? 'present' : 'missing'
      });
      
      // Create a temporary marker at the clicked location for our info window
      const position = place.geometry?.location || latLng;
      debug(FILE, '📍 Creating marker at position:', position);
      
      const marker = new google.maps.Marker({
        position: position,
        map: null, // Don't show the marker, just use for positioning
        title: place.name
      });
      
      debug(FILE, '📍 Marker created successfully');
      
      // Show our custom info window
      await this.showInfoWindow(marker, place);
      debug(FILE, '✅ Custom info window displayed for:', place.name);

    } catch (error) {
      debug(FILE, '❌ Error handling Google Place click:', error, 'error');
      this.showBasicGooglePlaceInfo(placeId, latLng);
    }
  }

  /**
   * Show basic info for Google Place when detailed info fails
   * @param {string} placeId - The Google Place ID
   * @param {google.maps.LatLng} latLng - The coordinates
   */
  static showBasicGooglePlaceInfo(placeId, latLng) {
    // Create minimal place object
    const basicPlace = {
      place_id: placeId,
      name: 'Google Place',
      geometry: {
        location: latLng
      },
      formatted_address: 'Location details unavailable'
    };

    // Create temporary marker
    const marker = new google.maps.Marker({
      position: latLng,
      map: null,
      title: 'Google Place'
    });

    // Show our custom info window with basic data
    this.showInfoWindow(marker, basicPlace);
  }
}

// Export individual functions for backward compatibility
export const showPlaceOnMap = MarkerService.showPlaceOnMap.bind(MarkerService);
export const createMarker = MarkerService.createMarker.bind(MarkerService);
export const createMarkersForPlaces = MarkerService.createMarkersForPlaces.bind(MarkerService);
export const showInfoWindow = MarkerService.showInfoWindow.bind(MarkerService);
export const removeMarker = MarkerService.removeMarker.bind(MarkerService);
export const closeInfoWindow = MarkerService.closeInfoWindow.bind(MarkerService);
