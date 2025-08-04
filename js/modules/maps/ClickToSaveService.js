/**
 * Click to Save Location Service
 * Handles map click events to save locations with enhanced UI
 */

import { MapService } from './MapService.js';
import { StateManager } from '../state/AppState.js';
import { LocationsUI } from '../locations/LocationsUI.js';

/**
 * Click to Save Service Class
 */
export class ClickToSaveService {
  static clickMarker = null;
  static clickCircle = null;
  static isEnabled = false;
  static saveLocationDialog = null;

  /**
   * Initialize click-to-save functionality
   */
  static initialize() {
    console.log('📍 Initializing Click-to-Save Service');
    console.log('📍 MapService available:', !!MapService);
    console.log('📍 StateManager available:', !!StateManager);
    console.log('📍 LocationsUI available:', !!LocationsUI);
    
    const map = MapService.getMap();
    console.log('📍 Map instance:', !!map);
    if (!map) {
      console.error('❌ Map not initialized for ClickToSaveService');
      return;
    }

    // Add map click listener
    map.addListener('click', (event) => {
      console.log('🗺️ Map click detected, isEnabled:', ClickToSaveService.isEnabled);
      console.log('🗺️ Map click event:', event);
      
      if (ClickToSaveService.isEnabled) {
        console.log('🗺️ Calling handleMapClick...');
        ClickToSaveService.handleMapClick(event);
      } else {
        console.log('🗺️ Click-to-save not enabled, ignoring map click');
      }
    });

    // Create the save location dialog
    ClickToSaveService.createSaveLocationDialog();

    console.log('✅ Click-to-Save Service initialized successfully');
    console.log('✅ ClickToSaveService methods available:', Object.getOwnPropertyNames(ClickToSaveService));
  }

  /**
   * Enable click-to-save mode
   */
  static enable() {
    console.log('🎯 ClickToSaveService.enable() called');
    ClickToSaveService.isEnabled = true;
    const map = MapService.getMap();
    console.log('🎯 Map for enable:', !!map);
    if (map) {
      map.setOptions({ cursor: 'crosshair' });
      console.log('🎯 Map cursor set to crosshair');
    }
    console.log('📍 Click-to-save mode enabled');
  }

  /**
   * Disable click-to-save mode
   */
  static disable() {
    console.log('🎯 ClickToSaveService.disable() called');
    ClickToSaveService.isEnabled = false;
    const map = MapService.getMap();
    console.log('🎯 Map for disable:', !!map);
    if (map) {
      map.setOptions({ cursor: 'grab' });
      console.log('🎯 Map cursor set to grab');
    }
    ClickToSaveService.clearClickMarker();
    console.log('📍 Click-to-save mode disabled');
  }

  /**
   * Toggle click-to-save mode
   */
  static toggle() {
    console.log('🎯 ClickToSaveService.toggle() called');
    console.log('🎯 Current isEnabled state:', ClickToSaveService.isEnabled);
    console.log('🎯 MapService available:', !!MapService);
    console.log('🎯 Map available:', !!MapService.getMap());
    
    if (ClickToSaveService.isEnabled) {
      console.log('🎯 Calling disable()...');
      ClickToSaveService.disable();
    } else {
      console.log('🎯 Calling enable()...');
      ClickToSaveService.enable();
    }
    
    console.log('🎯 New isEnabled state:', ClickToSaveService.isEnabled);
  }

  /**
   * Handle map click event
   * @param {google.maps.MapMouseEvent} event - Map click event
   */
  static async handleMapClick(event) {
    const { latLng } = event;
    const lat = latLng.lat();
    const lng = latLng.lng();

    console.log('📍 Map clicked at:', { lat, lng });

    // Clear previous marker
    ClickToSaveService.clearClickMarker();

    // Add marker and circle at click location
    ClickToSaveService.addClickMarker(latLng);

    // Get location details from Google
    try {
      const locationData = await ClickToSaveService.getLocationDetails(latLng);
      ClickToSaveService.showSaveLocationDialog(locationData);
    } catch (error) {
      console.error('Error getting location details:', error);
      // Still show dialog with basic coordinates
      ClickToSaveService.showSaveLocationDialog({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        name: 'Unknown Location'
      });
    }
  }

  /**
   * Add marker and circle at clicked location
   * @param {google.maps.LatLng} latLng - Clicked location
   */
  static addClickMarker(latLng) {
    const map = MapService.getMap();

    // Create marker
    ClickToSaveService.clickMarker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: 'Save this location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#4285f4" stroke="white" stroke-width="3"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    });

    // Create circle
    ClickToSaveService.clickCircle = new google.maps.Circle({
      strokeColor: '#4285f4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4285f4',
      fillOpacity: 0.2,
      map: map,
      center: latLng,
      radius: 100 // 100 meters
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
    console.log('🔍 Google Geocode Result (full object):', result);
    console.log('🔍 Google Geocode Result.id:', result.id);
    console.log('🔍 Google Geocode Result.place_id:', result.place_id);
    
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
    
    console.log('🔍 locationData before address parsing:', locationData);

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

    console.log('🔍 locationData after address parsing:', locationData);
    return locationData;
  }

  /**
   * Create the save location dialog
   */
  static createSaveLocationDialog() {
    // Dialog creation is handled by LocationsUI
    console.log('📍 Dialog creation handled by LocationsUI');
  }

  /**
   * Show save location dialog with data
   * @param {Object} locationData - Location data to populate
   */
  static showSaveLocationDialog(locationData) {
    console.log('📍 ClickToSaveService.showSaveLocationDialog called with:', locationData);
    console.log('📍 LocationsUI available:', !!LocationsUI);
    console.log('📍 LocationsUI.showSaveLocationDialog method:', typeof LocationsUI?.showSaveLocationDialog);
    
    // Use the streamlined LocationsUI module
    try {
      LocationsUI.showSaveLocationDialog(locationData);
      console.log('📍 LocationsUI.showSaveLocationDialog called successfully');
    } catch (error) {
      console.error('📍 Error calling LocationsUI.showSaveLocationDialog:', error);
    }
  }

  /**
   * Hide save location dialog
   */
  static hideSaveLocationDialog() {
    LocationsUI.closeActiveDialog();
  }

  /**
   * Load Street View for the location
   * @param {Object} locationData - Location data
   */
  static loadStreetView(locationData) {
    // Street view functionality is handled by LocationsUI
    console.log('📍 Street view functionality handled by LocationsUI');
  }

  /**
   * Handle save location form submission
   * Form handling is now managed by LocationsUI
   */
  static async handleSaveLocation(event) {
    console.log('📍 Save location handling is now managed by LocationsUI');
  }
}
