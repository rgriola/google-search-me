/**
 * Click to Save Location Service
 * Handles map click events to save locations with enhanced UI
 */

import { MapService } from './MapService.js';
import { StateManager } from '../state/AppState.js';
import { LocationsUI } from '../locations/LocationsUI.js';
import { LocationDialogManager } from '../locations/ui/LocationDialogManager.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'CLICK_AND_SAVE!';

/**
 * Click to Save Service Class
 */
export class ClickToSaveService {
  static clickMarker = null;
  static clickCircle = null;
  static isEnabled = false;
  static mapClickListener = null;
  static saveLocationDialog = null;

  // Configuration
  static config = {
    markerIcon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="10" fill="#4285f4" stroke="white" stroke-width="3"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16)
    },
    circleOptions: {
      strokeColor: '#ef7122ff',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4285f4',
      fillOpacity: 0.2,
      radius: 100
    },
    cursors: {
      enabled: 'crosshair',
      disabled: 'grab'
    }
  };

  /**
   * Initialize click-to-save functionality
   */
  static initialize() {
    debug(FILE, '📍 Initializing Click-to-Save Service');
    
    // Check if already initialized to prevent duplicate listeners
    if (ClickToSaveService.mapClickListener) {
      debug(FILE, '✅ ClickToSaveService already initialized, skipping...');
      return;
    }
    
    debug(FILE, '📍 MapService available:', !!MapService);
    debug(FILE, '📍 StateManager available:', !!StateManager);
    debug(FILE, '📍 LocationsUI available:', !!LocationsUI);
    
    const map = MapService.getMap();
    debug(FILE, '📍 Map instance:', !!map);
    if (!map) {
      debug(FILE, '❌ Map not Initialized', null, 'error');
      return;
    }

    // Store map click listener reference for cleanup
    ClickToSaveService.mapClickListener = map.addListener('click', (event) => {
      debug(FILE, '🗺️ Map click detected, isEnabled:', ClickToSaveService.isEnabled);
      
      if (ClickToSaveService.isEnabled) {
        debug(FILE, '🗺️ Processing map click...');
        ClickToSaveService.handleMapClick(event).catch(error => {
          debug(FILE, '❌ Error handling map click:', error, 'error');
          ClickToSaveService.showErrorNotification('Failed to process location click');
        });
      } else {
        debug(FILE, '🗺️ Click-to-save disabled, ignoring click');
      }
    });

    debug(FILE, '✅ Click-to-Save Service initialized successfully');
  }

  /**
   * Handle map click event
   * @param {google.maps.MapMouseEvent} event - Map click event
   */
  static async handleMapClick(event) {
    const { latLng } = event;
    const lat = latLng.lat();
    const lng = latLng.lng();

    debug(FILE, '📍 Map clicked at:', { lat, lng });

    // Clear previous marker
    ClickToSaveService.clearClickMarker();

    // Add marker and circle at click location
    ClickToSaveService.addClickMarker(latLng);

    // Get location details from Google
    try {
      const locationData = await ClickToSaveService.getLocationDetails(latLng);

      LocationDialogManager.showSaveLocationDialog(locationData);
      
    } catch (error) {
      debug(FILE, '❌ Error getting location details:', error, 'error');
      // Basic throw with string message
      throw new Error('Map Click Failed', error);
    }
  }

  /**
   * Add marker and circle at clicked location
   * @param {google.maps.LatLng} latLng - Clicked location
   */
  static addClickMarker(latLng) {
    const map = MapService.getMap();
    if (!map) return;

    // Create marker with configured icon
    ClickToSaveService.clickMarker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: 'Save this location',
      icon: ClickToSaveService.config.markerIcon
    });

    // Create circle with configured options
    ClickToSaveService.clickCircle = new google.maps.Circle({
      ...ClickToSaveService.config.circleOptions,
      map: map,
      center: latLng
    });

    // Center map on location
    map.panTo(latLng);
  }

  /**
   * Clear click marker and circle
   */
  static clearClickMarker() {
    if (ClickToSaveService.clickMarker) {
      ClickToSaveService.clickMarker.setMap(null);
      ClickToSaveService.clickMarker = null;
    }
    if (ClickToSaveService.clickCircle) {
      ClickToSaveService.clickCircle.setMap(null);
      ClickToSaveService.clickCircle = null;
    }
  }

  /**
   * Get location details from Google Places
   * @param {google.maps.LatLng} latLng - Location coordinates
   * @returns {Promise<Object>} Location details
   */
  static async getLocationDetails(latLng) {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const result = results[0];
          const locationData = ClickToSaveService.parseGeocodeResult(result, latLng);
          resolve(locationData);
        } else {
          reject(new Error('Geocoding failed: ' + status));
        }
      });
    });
  }

  /**
   * Parse geocode result into location data
   * @param {google.maps.GeocoderResult} result - Geocode result
   * @param {google.maps.LatLng} latLng - Original coordinates
   * @returns {Object} Parsed location data
   */
  static parseGeocodeResult(result, latLng) {
    debug(FILE, '🔍 Geocode Result:', {
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      types: result.types,
      address_components: result.address_components
    });
    
    const components = result.address_components;
    const locationData = {
      lat: latLng.lat(),
      lng: latLng.lng(),
      address: result.formatted_address,
      place_id: result.place_id,
      name: result.formatted_address,
      street: '',
      number: '',
      city: '',
      state: '',
      zipcode: ''
      // Explicitly NOT setting id here - should only come from our database
    };
    
    debug(FILE, '🔍 locationData before address parsing:', locationData);

    // Parse address components
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        locationData.number = component.long_name;
      } else if (types.includes('route')) {
        locationData.street = component.long_name;
      } else if (types.includes('locality')) {
        locationData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationData.state = component.short_name;
      } else if (types.includes('postal_code')) {
        locationData.zipcode = component.long_name;
      }
    });

    debug(FILE, '🔍 locationData after address parsing:', locationData);
    return locationData;
  }

  /**
   * Show save location dialog with data using strategy pattern
   * @param {Object} locationData - Location data to populate
   */
  static showSaveLocationDialog(locationData) {
    try {
      LocationDialogManager.showSaveLocationDialog(locationData);
      debug(FILE, '📍 Location dialog shown successfully');
    } catch (error) {
      debug(FILE, '❌ Failed to show location dialog:', error.message, 'error');
      ClickToSaveService.showErrorNotification('Unable to show location dialog');
    }
  }

  /**
   * Show fallback dialog when main UI managers fail
   * @param {Object} locationData - Location data
   */
  static showFallbackDialog(locationData) {
    const message = `Save location at ${locationData.address}?\n\nLat: ${locationData.lat}\nLng: ${locationData.lng}`;
    if (confirm(message)) {
      // Trigger save through event system
      window.dispatchEvent(new CustomEvent('saveLocation', { detail: locationData }));
    }
  }

  /**
   * Show error notification to user
   * @param {string} message - Error message
   */
  static showErrorNotification(message) {
    // Prefer NotificationService if available
    if (window.NotificationService?.showError) {
      window.NotificationService.showError(message);
      return;
    }
    // Fallback to showToast if available
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'error');
      return;
    }
    // Final fallback: log and alert
    debug(FILE, message, null, 'error');
    if (typeof window.alert === 'function') {
      window.alert(`Error: ${message}`);
    }
  }

  /**
   * Enable click-to-save mode
   */
  static enable() {
    debug(FILE, '🎯 Enabling click-to-save mode');
    ClickToSaveService.isEnabled = true;
    ClickToSaveService.updateMapCursor();
    debug(FILE, '✅ Click-to-save mode enabled');
  }

  /**
   * Disable click-to-save mode
   */
  static disable() {
    debug(FILE, '🎯 Disabling click-to-save mode');
    ClickToSaveService.isEnabled = false;
    ClickToSaveService.updateMapCursor();
    ClickToSaveService.clearClickMarker();
    debug(FILE, '✅ Click-to-save mode disabled');
  }

  /**
   * Update map cursor based on current state
   */
  static updateMapCursor() {
    const map = MapService.getMap();
    if (!map) return;

    const cursor = ClickToSaveService.isEnabled 
      ? ClickToSaveService.config.cursors.enabled 
      : ClickToSaveService.config.cursors.disabled;
    
    map.setOptions({ cursor });
    debug(FILE, `🎯 Map cursor updated to: ${cursor}`);
  }

  /**
   * Toggle click-to-save mode
   */
  static toggle() {
    debug(FILE, '🎯 Toggling click-to-save mode from:', ClickToSaveService.isEnabled);
    
    if (ClickToSaveService.isEnabled) {
      ClickToSaveService.disable();
    } else {
      ClickToSaveService.enable();
    }
    
    return ClickToSaveService.isEnabled;
  }

  /**
   * Cleanup service resources
   */
  static cleanup() {
    debug(FILE, '🧹 Cleaning up Click-to-Save Service...');
    
    // Remove map click listener
    if (ClickToSaveService.mapClickListener) {
      google.maps.event.removeListener(ClickToSaveService.mapClickListener);
      ClickToSaveService.mapClickListener = null;
      debug(FILE, '✅ Map click listener removed');
    }
    
    // Clear any active markers
    ClickToSaveService.clearClickMarker();
    
    // Reset state
    ClickToSaveService.isEnabled = false;
    
    // Update cursor
    ClickToSaveService.updateMapCursor();
    
    debug(FILE, '✅ Click-to-save service cleaned up');
  }
}