/**
 * Saved locations event handlers
 * Manages interactions between locations service, UI, and other modules
 */

import { LocationsService } from './LocationsService.js';
import { LocationsUI } from './LocationsUI.js';
import { SearchService } from '../maps/SearchService.js';
import { MarkerService } from '../maps/MarkerService.js';
import { AuthUI } from '../auth/AuthUI.js';
import { StateManager } from '../state/AppState.js';

/**
 * Locations Handlers Class
 */
export class LocationsHandlers {

  /**
   * Initialize locations handlers
   */
  static initialize() {
    console.log('🎯 Initializing Locations Handlers');
    
    this.setupEventListeners();
    
    console.log('✅ Locations Handlers initialized');
  }

  /**
   * Setup global event listeners
   */
  static setupEventListeners() {
    // Handle save location requests from info windows
    document.addEventListener('save-location', this.handleSaveLocationRequest.bind(this));
    
    // Handle view location on map requests
    document.addEventListener('view-location', this.handleViewLocationRequest.bind(this));
    
    // Handle location service events
    document.addEventListener('location-saved', this.handleLocationSaved.bind(this));
    document.addEventListener('location-deleted', this.handleLocationDeleted.bind(this));
    document.addEventListener('save-error', this.handleSaveError.bind(this));
    document.addEventListener('delete-error', this.handleDeleteError.bind(this));
    
    // Handle notification requests
    document.addEventListener('show-notification', this.handleNotificationRequest.bind(this));
    
    // Handle authentication state changes
    document.addEventListener('user-logged-in', this.handleUserLoggedIn.bind(this));
    document.addEventListener('user-logged-out', this.handleUserLoggedOut.bind(this));
  }

  /**
   * Handle save location request from info window or other sources
   * @param {Event} event - Custom event with place data
   */
  static async handleSaveLocationRequest(event) {
    const { place } = event.detail;
    
    console.log('🎯 LocationsHandlers: Save location request received', place);
    
    if (!place || !place.place_id) {
      console.error('❌ Invalid place data for saving:', place);
      AuthUI.showNotification('Invalid location data', 'error');
      return;
    }

    console.log('📍 Place ID:', place.place_id);
    console.log('🏷️ Place Name:', place.name);
    console.log('🔐 Is Authenticated:', StateManager.isAuthenticated());

    try {
      // Check if already saved
      if (LocationsService.isLocationSaved(place.place_id)) {
        console.log('ℹ️ Location already saved');
        AuthUI.showNotification('Location already saved', 'info');
        return;
      }

      // Show the save location dialog with pre-populated data from search
      this.showSaveLocationDialog(place);
      
    } catch (error) {
      console.error('❌ Error in save location handler:', error);
      AuthUI.showNotification(`Failed to prepare save dialog: ${error.message}`, 'error');
    }
  }

  /**
   * Handle view location on map request
   * @param {Event} event - Custom event with place ID
   */
  static async handleViewLocationRequest(event) {
    const { placeId } = event.detail;
    
    if (!placeId) {
      console.error('No place ID provided for viewing location');
      return;
    }

    try {
      // Get place details from Google Places API
      const placeDetails = await SearchService.getPlaceDetails(placeId);
      
      // Show on map with info window
      await MarkerService.showPlaceOnMap(placeDetails, {
        showInfoWindow: true,
        zoom: 16,
        clearExisting: true
      });
      
      // Collapse sidebar on mobile for better map view
      if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.classList.contains('collapsed')) {
          LocationsUI.toggleSidebar();
        }
      }
      
    } catch (error) {
      console.error('Error viewing location on map:', error);
      AuthUI.showNotification('Failed to load location details', 'error');
    }
  }

  /**
   * Handle successful location save
   * @param {Event} event - Location saved event
   */
  static handleLocationSaved(event) {
    const { location, place } = event.detail;
    
    // Update save button state
    this.updateSaveButtonState('saved');
    
    // Note: Success notification is already shown in handleSaveLocationRequest
    // to avoid duplicate notifications
    
    // Update locations count in UI
    this.updateLocationCount();
    
    console.log('Location saved successfully:', location?.name || place?.name);
  }

  /**
   * Handle successful location deletion
   * @param {Event} event - Location deleted event
   */
  static handleLocationDeleted(event) {
    const { placeId } = event.detail;
    
    // Show success notification
    AuthUI.showNotification('Location removed successfully', 'success');
    
    // Update locations count in UI
    this.updateLocationCount();
    
    // Update save button if info window is open for this location
    this.updateSaveButtonForPlace(placeId, 'not-saved');
    
    console.log('Location deleted successfully:', placeId);
  }

  /**
   * Handle save error
   * @param {Event} event - Save error event
   */
  static handleSaveError(event) {
    const { error, place } = event.detail;
    
    // Update save button state
    this.updateSaveButtonState('error');
    
    // Show error notification
    const message = error.message || 'Failed to save location';
    AuthUI.showNotification(message, 'error');
    
    console.error('Save location error:', error);
  }

  /**
   * Handle delete error
   * @param {Event} event - Delete error event
   */
  static handleDeleteError(event) {
    const { error, placeId } = event.detail;
    
    // Show error notification
    const message = error.message || 'Failed to delete location';
    AuthUI.showNotification(message, 'error');
    
    console.error('Delete location error:', error);
  }

  /**
   * Handle notification requests
   * @param {Event} event - Show notification event
   */
  static handleNotificationRequest(event) {
    const { message, type } = event.detail;
    AuthUI.showNotification(message, type);
  }

  /**
   * Handle user logged in
   * @param {Event} event - User logged in event
   */
  static async handleUserLoggedIn(event) {
    try {
      // Load saved locations from API
      await LocationsService.loadSavedLocations();
      
      // Refresh UI
      LocationsUI.renderLocations();
      
      console.log('Loaded saved locations after login');
      
    } catch (error) {
      console.error('Error loading locations after login:', error);
    }
  }

  /**
   * Handle user logged out
   * @param {Event} event - User logged out event
   */
  static handleUserLoggedOut(event) {
    // Load from localStorage as fallback
    LocationsService.loadFromLocalStorage();
    
    // Refresh UI
    LocationsUI.renderLocations();
    
    console.log('Switched to localStorage locations after logout');
  }

  /**
   * Update save button state in info window
   * @param {string} state - Button state (saving, saved, error, not-saved)
   */
  static updateSaveButtonState(state) {
    const saveBtn = document.getElementById('saveLocationBtn');
    if (!saveBtn) return;

    switch (state) {
      case 'saving':
        saveBtn.textContent = '⏳ Saving...';
        saveBtn.disabled = true;
        saveBtn.className = 'save-location-btn saving';
        break;
        
      case 'saved':
        saveBtn.textContent = '✅ Saved';
        saveBtn.disabled = true;
        saveBtn.className = 'save-location-btn saved';
        break;
        
      case 'error':
        saveBtn.textContent = '💾 Save Location';
        saveBtn.disabled = false;
        saveBtn.className = 'save-location-btn error';
        // Reset to normal state after 3 seconds
        setTimeout(() => {
          if (saveBtn) {
            saveBtn.className = 'save-location-btn';
          }
        }, 3000);
        break;
        
      case 'not-saved':
        saveBtn.textContent = '💾 Save Location';
        saveBtn.disabled = false;
        saveBtn.className = 'save-location-btn';
        break;
    }
  }

  /**
   * Update save button for a specific place
   * @param {string} placeId - Place ID
   * @param {string} state - Button state
   */
  static updateSaveButtonForPlace(placeId, state) {
    const saveBtn = document.getElementById('saveLocationBtn');
    if (!saveBtn) return;
    
    // Check if current info window is for this place
    const currentPlaceId = saveBtn.dataset.placeId;
    if (currentPlaceId === placeId) {
      this.updateSaveButtonState(state);
    }
  }

  /**
   * Update locations count in sidebar
   */
  static updateLocationCount() {
    const locations = LocationsService.getAllSavedLocations();
    const countElement = document.querySelector('.locations-count');
    
    if (countElement) {
      countElement.textContent = locations.length;
    }
    
    // Update sidebar header if it exists
    const sidebarHeader = document.querySelector('.sidebar h2');
    if (sidebarHeader) {
      const baseText = 'Saved Locations';
      sidebarHeader.textContent = locations.length > 0 ? 
        `${baseText} (${locations.length})` : baseText;
    }
  }

  /**
   * Handle bulk operations
   * @param {string} operation - Operation type (export, import, clear)
   * @param {*} data - Operation data
   */
  static async handleBulkOperation(operation, data = null) {
    try {
      switch (operation) {
        case 'export':
          LocationsUI.handleExport();
          break;
          
        case 'import':
          if (data) {
            await LocationsService.importLocations(data);
          }
          break;
          
        case 'clear':
          await LocationsService.clearAllLocations();
          break;
          
        default:
          console.warn('Unknown bulk operation:', operation);
      }
    } catch (error) {
      console.error(`Error in bulk operation ${operation}:`, error);
      AuthUI.showNotification(`Failed to ${operation} locations`, 'error');
    }
  }

  /**
   * Handle keyboard shortcuts for locations
   * @param {KeyboardEvent} event - Keyboard event
   */
  static handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Export locations
          LocationsUI.handleExport();
        }
        break;
        
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Focus search input
          const searchInput = document.getElementById('locationsSearch');
          if (searchInput) {
            searchInput.focus();
          }
        }
        break;
        
      case 'Escape':
        // Clear search
        const searchInput = document.getElementById('locationsSearch');
        if (searchInput && searchInput.value) {
          LocationsUI.clearSearch();
        }
        break;
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  static initializeKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }
  
  // MISSING: Global compatibility methods for HTML onclick handlers
  
  /**
   * Save current location - Global compatibility method
   */
  static async saveCurrentLocation() {
    try {
      const currentPlace = MarkerService.getCurrentPlace();
      if (!currentPlace) {
        AuthUI.showNotification('No location selected. Please search for a place first.', 'warning');
        return;
      }
      
      const saveEvent = new CustomEvent('save-location', {
        detail: { place: currentPlace }
      });
      document.dispatchEvent(saveEvent);
    } catch (error) {
      console.error('Error saving current location:', error);
      AuthUI.showNotification('Failed to save location', 'error');
    }
  }
  
  /**
   * Go to saved location - Global compatibility method
   */
  static async goToSavedLocation(placeId) {
    try {
      const viewEvent = new CustomEvent('view-location', {
        detail: { placeId, source: 'saved' }
      });
      document.dispatchEvent(viewEvent);
    } catch (error) {
      console.error('Error going to saved location:', error);
      AuthUI.showNotification('Failed to load location', 'error');
    }
  }
  
  /**
   * Delete saved location - Global compatibility method
   */
  static async deleteSavedLocation(placeId) {
    try {
      if (!confirm('Are you sure you want to remove this saved location?')) {
        return;
      }
      
      await LocationsService.deleteLocation(placeId);
      AuthUI.showNotification('Location removed successfully!', 'success');
    } catch (error) {
      console.error('Error deleting saved location:', error);
      AuthUI.showNotification('Failed to remove location', 'error');
    }
  }
  
  /**
   * Delete saved location from info window - Global compatibility method
   */
  static async deleteSavedLocationFromInfo(placeId) {
    await this.deleteSavedLocation(placeId);
    MarkerService.closeInfoWindow();
  }
  
  /**
   * Go to popular location - Global compatibility method
   */
  static async goToPopularLocation(placeId, lat, lng) {
    try {
      // Clear existing markers
      MarkerService.clearMarkers();
      
      // Show the location on map
      const position = { lat, lng };
      
      // Get place details if available
      try {
        const place = await SearchService.getPlaceDetails(placeId);
        if (place) {
          await MarkerService.showPlaceOnMap(place, {
            showInfoWindow: true,
            zoom: 15
          });
          return;
        }
      } catch (error) {
        console.warn('Could not get place details, using coordinates:', error);
      }
      
      // Fallback: show marker at coordinates
      await MarkerService.addMarker(position, {
        title: 'Popular Location',
        showInfoWindow: true,
        zoom: 15
      });
      
    } catch (error) {
      console.error('Error going to popular location:', error);
      AuthUI.showNotification('Failed to load popular location', 'error');
    }
  }

  /**
   * Show save location dialog with pre-populated data from search result
   * @param {Object} place - Place object from search result
   */
  static showSaveLocationDialog(place) {
    // Create or get existing dialog
    let dialog = document.getElementById('save-location-dialog');
    
    if (!dialog) {
      this.createSaveLocationDialog();
      dialog = document.getElementById('save-location-dialog');
    }

    // Extract location data from place object
    const locationData = this.extractLocationDataFromPlace(place);

    // Wait a bit for dialog to be in DOM then populate
    setTimeout(() => {
      const nameField = document.getElementById('location-name');
      const descField = document.getElementById('location-description');
      const addressField = document.getElementById('location-address');
      const streetField = document.getElementById('location-street');
      const numberField = document.getElementById('location-number');
      const cityField = document.getElementById('location-city');
      const stateField = document.getElementById('location-state');
      const zipcodeField = document.getElementById('location-zipcode');

      // Populate form fields if they exist
      if (nameField) nameField.value = locationData.name || '';
      if (descField) descField.value = locationData.description || '';
      if (addressField) addressField.value = locationData.address || '';
      if (streetField) streetField.value = locationData.street || '';
      if (numberField) numberField.value = locationData.number || '';
      if (cityField) cityField.value = locationData.city || '';
      if (stateField) stateField.value = locationData.state || '';
      if (zipcodeField) zipcodeField.value = locationData.zipcode || '';

      // Store location data on dialog
      dialog.locationData = locationData;

      // Load Street View if coordinates are available
      if (locationData.lat && locationData.lng) {
        this.loadStreetView(locationData);
      }
    }, 50);

    // Show dialog
    dialog.style.display = 'block';

    // Create backdrop
    let backdrop = document.getElementById('dialog-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
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
  }

  /**
   * Extract location data from Google Places search result
   * @param {Object} place - Place object from search
   * @returns {Object} Formatted location data
   */
  static extractLocationDataFromPlace(place) {
    const locationData = {
      lat: place.geometry?.location?.lat ? place.geometry.location.lat() : null,
      lng: place.geometry?.location?.lng ? place.geometry.location.lng() : null,
      address: place.formatted_address || place.vicinity || '',
      place_id: place.place_id,
      name: place.name || '',
      description: '',
      street: '',
      number: '',
      city: '',
      state: '',
      zipcode: ''
    };

    // Parse address components if available
    if (place.address_components) {
      place.address_components.forEach(component => {
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
    }

    return locationData;
  }

  /**
   * Create the save location dialog if it doesn't exist
   */
  static createSaveLocationDialog() {
    // Check if dialog already exists
    if (document.getElementById('save-location-dialog')) {
      return;
    }

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

    // Add event listeners
    document.getElementById('close-save-dialog').addEventListener('click', () => this.hideSaveLocationDialog());
    document.getElementById('cancel-save').addEventListener('click', () => this.hideSaveLocationDialog());
    document.getElementById('save-location-form').addEventListener('submit', (e) => this.handleSaveLocationFormSubmit(e));
  }

  /**
   * Hide save location dialog
   */
  static hideSaveLocationDialog() {
    const dialog = document.getElementById('save-location-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
    
    const backdrop = document.getElementById('dialog-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Load Street View for the location
   * @param {Object} locationData - Location data with lat/lng
   */
  static loadStreetView(locationData) {
    const container = document.getElementById('street-view-container');
    if (!container || !locationData.lat || !locationData.lng) return;
    
    try {
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
    } catch (error) {
      console.error('Error loading Street View:', error);
      container.innerHTML = '<div style="padding: 80px 20px; text-align: center; color: #999;">Street View not available</div>';
    }
  }

  /**
   * Handle save location form submission
   * @param {Event} event - Form submit event
   */
  static async handleSaveLocationFormSubmit(event) {
    event.preventDefault();
    
    const dialog = document.getElementById('save-location-dialog');
    const locationData = dialog.locationData;
    
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
        AuthUI.showNotification(`✅ ${result.message || 'Location saved successfully!'}`, 'success');
        this.hideSaveLocationDialog();
        
        // Update save button state to success
        this.updateSaveButtonState('saved');
        
        // Refresh saved locations display
        if (window.refreshSavedLocations) {
          window.refreshSavedLocations();
        }
      } else {
        AuthUI.showNotification('❌ Failed to save location: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      AuthUI.showNotification('❌ Error saving location: ' + error.message, 'error');
    }
  }

}

// Export individual functions for backward compatibility
export const handleSaveLocationRequest = LocationsHandlers.handleSaveLocationRequest.bind(LocationsHandlers);
export const handleViewLocationRequest = LocationsHandlers.handleViewLocationRequest.bind(LocationsHandlers);
export const updateSaveButtonState = LocationsHandlers.updateSaveButtonState.bind(LocationsHandlers);
export const updateLocationCount = LocationsHandlers.updateLocationCount.bind(LocationsHandlers);
export const handleBulkOperation = LocationsHandlers.handleBulkOperation.bind(LocationsHandlers);