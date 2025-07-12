/**
 * Click to Save Location Service
 * Handles map click events to save locations with enhanced UI
 */

import { MapService } from './MapService.js';
import { StateManager } from '../state/AppState.js';
import { LocationsService } from '../locations/LocationsService.js';

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
    
    const map = MapService.getMap();
    if (!map) {
      console.error('Map not initialized');
      return;
    }

    // Add map click listener
    map.addListener('click', (event) => {
      if (this.isEnabled) {
        this.handleMapClick(event);
      }
    });

    // Create the save location dialog
    this.createSaveLocationDialog();

    console.log('✅ Click-to-Save Service initialized');
  }

  /**
   * Enable click-to-save mode
   */
  static enable() {
    this.isEnabled = true;
    const map = MapService.getMap();
    if (map) {
      map.setOptions({ cursor: 'crosshair' });
    }
    console.log('📍 Click-to-save mode enabled');
  }

  /**
   * Disable click-to-save mode
   */
  static disable() {
    this.isEnabled = false;
    const map = MapService.getMap();
    if (map) {
      map.setOptions({ cursor: 'grab' });
    }
    this.clearClickMarker();
    console.log('📍 Click-to-save mode disabled');
  }

  /**
   * Toggle click-to-save mode
   */
  static toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
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
    this.clearClickMarker();

    // Add marker and circle at click location
    this.addClickMarker(latLng);

    // Get location details from Google
    try {
      const locationData = await this.getLocationDetails(latLng);
      this.showSaveLocationDialog(locationData);
    } catch (error) {
      console.error('Error getting location details:', error);
      // Still show dialog with basic coordinates
      this.showSaveLocationDialog({
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
    this.clickMarker = new google.maps.Marker({
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
    this.clickCircle = new google.maps.Circle({
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
    if (this.clickMarker) {
      this.clickMarker.setMap(null);
      this.clickMarker = null;
    }
    if (this.clickCircle) {
      this.clickCircle.setMap(null);
      this.clickCircle = null;
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
          const locationData = this.parseGeocodeResult(result, latLng);
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
    };

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

    return locationData;
  }

  /**
   * Create the save location dialog
   */
  static createSaveLocationDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'save-location-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      padding: 20px;
      max-width: 500px;
      width: 90%;
      z-index: 10000;
      display: none;
      font-family: Arial, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">Save Location</h3>
        <button id="close-save-dialog" style="float: right; background: none; border: none; font-size: 24px; cursor: pointer; margin-top: -30px;">&times;</button>
      </div>
      
      <form id="save-location-form">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Name *</label>
          <input type="text" id="location-name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
          <textarea id="location-description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Add notes about this location..."></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Address</label>
          <input type="text" id="location-address" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 10px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number</label>
            <input type="text" id="location-number" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street</label>
            <input type="text" id="location-street" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">City</label>
            <input type="text" id="location-city" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">State</label>
            <input type="text" id="location-state" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Zip Code</label>
            <input type="text" id="location-zipcode" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
        
        <div id="street-view-container" style="margin: 15px 0; height: 200px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5;">
          <div style="padding: 80px 20px; text-align: center; color: #666;">
            Loading Street View...
          </div>
        </div>
        
        <div style="text-align: right; margin-top: 20px;">
          <button type="button" id="cancel-save" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Cancel</button>
          <button type="submit" style="background: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Save Location</button>
        </div>
      </form>
    `;

    document.body.appendChild(dialog);
    this.saveLocationDialog = dialog;

    // Add event listeners
    document.getElementById('close-save-dialog').addEventListener('click', () => this.hideSaveLocationDialog());
    document.getElementById('cancel-save').addEventListener('click', () => this.hideSaveLocationDialog());
    document.getElementById('save-location-form').addEventListener('submit', (e) => this.handleSaveLocation(e));
  }

  /**
   * Show save location dialog with data
   * @param {Object} locationData - Location data to populate
   */
  static showSaveLocationDialog(locationData) {
    // Populate form fields
    document.getElementById('location-name').value = locationData.name || '';
    document.getElementById('location-address').value = locationData.address || '';
    document.getElementById('location-street').value = locationData.street || '';
    document.getElementById('location-number').value = locationData.number || '';
    document.getElementById('location-city').value = locationData.city || '';
    document.getElementById('location-state').value = locationData.state || '';
    document.getElementById('location-zipcode').value = locationData.zipcode || '';

    // Store location data on dialog
    this.saveLocationDialog.locationData = locationData;

    // Load Street View
    this.loadStreetView(locationData);

    // Show dialog
    this.saveLocationDialog.style.display = 'block';

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'dialog-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    backdrop.addEventListener('click', () => this.hideSaveLocationDialog());
    document.body.appendChild(backdrop);
  }

  /**
   * Hide save location dialog
   */
  static hideSaveLocationDialog() {
    if (this.saveLocationDialog) {
      this.saveLocationDialog.style.display = 'none';
    }
    
    const backdrop = document.getElementById('dialog-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
    
    this.clearClickMarker();
  }

  /**
   * Load Street View for the location
   * @param {Object} locationData - Location data
   */
  static loadStreetView(locationData) {
    const container = document.getElementById('street-view-container');
    
    const streetView = new google.maps.StreetViewPanorama(container, {
      position: { lat: locationData.lat, lng: locationData.lng },
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      addressControl: false,
      enableCloseButton: false,
      fullscreenControl: false
    });

    // Check if Street View is available
    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama({
      location: { lat: locationData.lat, lng: locationData.lng },
      radius: 50
    }, (data, status) => {
      if (status !== 'OK') {
        container.innerHTML = '<div style="padding: 80px 20px; text-align: center; color: #999;">Street View not available for this location</div>';
      }
    });
  }

  /**
   * Handle save location form submission
   * @param {Event} event - Form submit event
   */
  static async handleSaveLocation(event) {
    event.preventDefault();
    
    const locationData = this.saveLocationDialog.locationData;
    
    // Get form data
    const formData = {
      name: document.getElementById('location-name').value,
      description: document.getElementById('location-description').value,
      address: document.getElementById('location-address').value,
      street: document.getElementById('location-street').value,
      number: document.getElementById('location-number').value,
      city: document.getElementById('location-city').value,
      state: document.getElementById('location-state').value,
      zipcode: document.getElementById('location-zipcode').value,
      lat: locationData.lat,
      lng: locationData.lng,
      place_id: locationData.place_id || `custom_${Date.now()}`
    };

    try {
      const result = await LocationsService.saveLocation(formData);
      
      if (result.success) {
        alert('✅ Location saved successfully!');
        this.hideSaveLocationDialog();
        this.disable(); // Exit click-to-save mode
        
        // Refresh saved locations display
        if (window.refreshSavedLocations) {
          window.refreshSavedLocations();
        }
      } else {
        alert('❌ Failed to save location: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('❌ Error saving location: ' + error.message);
    }
  }
}
