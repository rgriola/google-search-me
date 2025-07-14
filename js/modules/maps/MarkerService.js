/**
 * Map marker management
 * Handles creation, display, and removal of map markers and info windows
 */

import { StateManager } from '../state/AppState.js';
import { MapService } from './MapService.js';

/**
 * Marker Service Class
 */
export class MarkerService {

  /**
   * Initialize marker service
   */
  static initialize() {
    console.log('📍 Initializing Marker Service');
    console.log('✅ Marker Service initialized');
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
      const saveBtn = document.getElementById('saveLocationBtn');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      // Dispatch save location event
      const event = new CustomEvent('save-location', {
        detail: { place },
        bubbles: true
      });
      document.dispatchEvent(event);

    } catch (error) {
      console.error('Error saving location:', error);
    }
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