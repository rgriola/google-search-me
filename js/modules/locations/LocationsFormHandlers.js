/**
 * Location Form Handlers
 * Handles form submission, data extraction, and validation
 */

import { LocationsService } from './LocationsService.js';
import { AppState } from '../state/AppState.js';

/**
 * Locations Form Handlers Class
 */
export class LocationsFormHandlers {

  /**
   * Handle save location form submission
   * @param {Event} e - Form submit event
   */
  static async handleSaveLocationFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = this.getFormData();
    console.log('� Form data collected for:', formData.name);
    
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter a location name');
      return;
    }

    try {
      // Save location
      const response = await LocationsService.saveLocation(formData);
      
      if (response && (response.success || response.location || response.id || response.alreadySaved)) {
        // Handle different response formats
        const isAlreadySaved = response.alreadySaved;
        const isSuccess = response.success;
        const hasLocation = response.location;
        
        // Determine success message
        let message;
        if (isAlreadySaved) {
          message = 'Location is already saved in your list!';
        } else if (isSuccess || hasLocation) {
          message = response.message || 'Location saved successfully!';
        } else {
          message = 'Location saved successfully!';
        }
        
        console.log('✅ Location save response:', response);
        
        // Show success message
        this.showSuccessMessage(message);
        
        // Hide dialog
        import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
          LocationsDialogManager.hideSaveLocationDialog();
        });
        
        // Refresh saved locations sidebar
        import('./LocationsRenderingService.js').then(({ LocationsRenderingService }) => {
          LocationsRenderingService.refreshSavedLocations();
        });
        
        // Dispatch event for new saves only
        if (!isAlreadySaved) {
          const event = new CustomEvent('locationSaved', { 
            detail: { location: response.location || response, formData } 
          });
          document.dispatchEvent(event);
        }
        
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      
      // Check if this is an "already saved" error from the server
      if (error.message && error.message.includes('already saved')) {
        this.showSuccessMessage('Location is already saved in your list!');
        
        // Hide dialog
        import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
          LocationsDialogManager.hideSaveLocationDialog();
        });
        
        // Refresh saved locations sidebar
        import('./LocationsRenderingService.js').then(({ LocationsRenderingService }) => {
          LocationsRenderingService.refreshSavedLocations();
        });
        
      } else if (error.message && error.message.includes('Failed to save location')) {
        // This is likely a network or server error, but location might have been saved
        console.warn('Save error occurred but location might have been saved:', error);
        alert(`Save completed with warning: ${error.message}. Please check your saved locations.`);
        
        // Hide dialog and refresh to see if it was actually saved
        import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
          LocationsDialogManager.hideSaveLocationDialog();
        });
        
        // Refresh saved locations sidebar
        import('./LocationsRenderingService.js').then(({ LocationsRenderingService }) => {
          LocationsRenderingService.refreshSavedLocations();
        });
        
      } else {
        alert(`Failed to save location: ${error.message}. Please try again.`);
      }
    }
  }

  /**
   * Get form data from save location form
   * @returns {Object} Form data object
   */
  static getFormData() {
    // Get the dialog to access stored location data
    const dialog = document.getElementById('save-location-dialog');
    const locationData = dialog?.locationData || {};

    return {
      name: document.getElementById('location-name')?.value?.trim() || '',
      description: document.getElementById('location-description')?.value?.trim() || '',
      type: document.getElementById('location-type')?.value || '',
      address: document.getElementById('location-address')?.textContent?.trim() || '',
      street: document.getElementById('location-street')?.value?.trim() || '',
      number: document.getElementById('location-number')?.value?.trim() || '',
      city: document.getElementById('location-city')?.value?.trim() || '',
      state: document.getElementById('location-state')?.value?.trim() || '',
      zipcode: document.getElementById('location-zipcode')?.value?.trim() || '',
      entry_point: this.getCombinedFieldValue('location-entry-point-dropdown', 'location-entry-point'),
      parking: this.getCombinedFieldValue('location-parking-dropdown', 'location-parking'),
      access: this.getCombinedFieldValue('location-access-dropdown', 'location-access'),
      photo_url: document.getElementById('location-photo-url')?.value?.trim() || '',
      types: document.getElementById('location-types')?.value?.trim() || '',
      lat: locationData.lat || null,
      lng: locationData.lng || null,
      place_id: locationData.place_id || '',
      created_by: AppState.currentUser?.id || null
    };
  }

  /**
   * Get combined value from dropdown and text field
   * @param {string} dropdownId - ID of dropdown element
   * @param {string} textId - ID of text element
   * @returns {string} Combined value
   */
  static getCombinedFieldValue(dropdownId, textId) {
    const dropdown = document.getElementById(dropdownId);
    const textField = document.getElementById(textId);
    
    const dropdownValue = dropdown?.value || '';
    const textValue = textField?.value?.trim() || '';
    
    if (dropdownValue && dropdownValue !== 'custom') {
      // If dropdown has a value and it's not custom, use dropdown value plus any additional text
      return textValue ? `${dropdownValue}. ${textValue}` : dropdownValue;
    } else {
      // If no dropdown value or custom selected, use text field value
      return textValue;
    }
  }

  /**
   * Setup dropdown change handlers
   */
  static setupDropdownHandlers() {
    // Entry point dropdown handler
    const entryDropdown = document.getElementById('location-entry-point-dropdown');
    if (entryDropdown) {
      entryDropdown.addEventListener('change', (e) => {
        const textField = document.getElementById('location-entry-point');
        if (e.target.value === 'custom') {
          textField.placeholder = 'Please specify custom entry point instructions...';
          textField.focus();
        } else if (e.target.value) {
          textField.placeholder = 'Additional entry point details...';
        }
      });
    }

    // Parking dropdown handler
    const parkingDropdown = document.getElementById('location-parking-dropdown');
    if (parkingDropdown) {
      parkingDropdown.addEventListener('change', (e) => {
        const textField = document.getElementById('location-parking');
        if (e.target.value === 'custom') {
          textField.placeholder = 'Please specify custom parking information...';
          textField.focus();
        } else if (e.target.value) {
          textField.placeholder = 'Additional parking details or restrictions...';
        }
      });
    }

    // Access dropdown handler
    const accessDropdown = document.getElementById('location-access-dropdown');
    if (accessDropdown) {
      accessDropdown.addEventListener('change', (e) => {
        const textField = document.getElementById('location-access');
        if (e.target.value === 'custom') {
          textField.placeholder = 'Please specify custom accessibility information...';
          textField.focus();
        } else if (e.target.value) {
          textField.placeholder = 'Additional accessibility details...';
        }
      });
    }
  }

  /**
   * Extract location data from Google Places result
   * @param {Object} place - Google Places result object
   * @returns {Object} Extracted location data
   */
  static extractLocationDataFromPlace(place) {
    if (!place) return {};

    let locationData = {
      name: place.name || '',
      description: '',
      address: place.formatted_address || '',
      lat: null,
      lng: null,
      place_id: place.place_id || '',
      street: '',
      number: '',
      city: '',
      state: '',
      zipcode: '',
      photo_url: '',
      types: ''
    };

    // Extract coordinates
    if (place.geometry && place.geometry.location) {
      if (typeof place.geometry.location.lat === 'function') {
        locationData.lat = place.geometry.location.lat();
        locationData.lng = place.geometry.location.lng();
      } else {
        locationData.lat = place.geometry.location.lat;
        locationData.lng = place.geometry.location.lng;
      }
    }

    // Extract photo URL from first photo if available
    if (place.photos && place.photos.length > 0) {
      try {
        locationData.photo_url = place.photos[0].getUrl({ maxWidth: 400 });
      } catch (error) {
        console.warn('Could not extract photo URL:', error);
      }
    }

    // Extract types
    if (place.types && Array.isArray(place.types)) {
      locationData.types = place.types.join(', ');
    }

    // Check for parsed address data from ClickToSaveService first
    if (place.parsed_address) {
      locationData.number = place.parsed_address.number || '';
      locationData.street = place.parsed_address.street || '';
      locationData.city = place.parsed_address.city || '';
      locationData.state = place.parsed_address.state || '';
      locationData.zipcode = place.parsed_address.zipcode || '';
      console.log('🏠 Using parsed address data from ClickToSaveService:', place.parsed_address);
    } else if (place.address_components) {
      // Fallback to parsing Google Places address components
      this.parseAddressComponents(place.address_components, locationData);
    }

    return locationData;
  }

  /**
   * Parse Google Places address components
   * @param {Array} components - Address components array
   * @param {Object} locationData - Location data object to populate
   */
  static parseAddressComponents(components, locationData) {
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        locationData.number = component.long_name;
      } else if (types.includes('route')) {
        locationData.street = component.long_name;
      } else if (types.includes('locality')) {
        locationData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationData.state = component.short_name || component.long_name;
      } else if (types.includes('postal_code')) {
        locationData.zipcode = component.long_name;
      }
    });
  }

  /**
   * Handle regular location form submission (edit existing)
   * @param {Event} e - Form submit event
   */
  static async handleLocationFormSubmit(e) {
    e.preventDefault();
    
    // Get location ID from form or stored data
    const form = e.target;
    const locationId = form.dataset.locationId;
    
    if (!locationId) {
      console.error('No location ID found for form submission');
      return;
    }

    try {
      // Get form data
      const formData = this.getLocationFormData(form);
      
      // Update location
      const response = await LocationsService.updateLocation(locationId, formData);
      
      if (response) {
        console.log('Location updated successfully:', response);
        
        // Dispatch update event
        const event = new CustomEvent('locationUpdated', { 
          detail: { location: response, locationId } 
        });
        document.dispatchEvent(event);
        
        // Hide edit dialog
        import('./LocationsDialogHelpers.js').then(({ LocationsDialogHelpers }) => {
          LocationsDialogHelpers.hideEditLocationDialog();
        });
        
        // Show success message
        this.showSuccessMessage('Location updated successfully!');
        
        // Refresh saved locations sidebar
        import('./LocationsRenderingService.js').then(({ LocationsRenderingService }) => {
          LocationsRenderingService.refreshSavedLocations();
        });
        
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location. Please try again.');
    }
  }

  /**
   * Get form data from regular location form
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Form data object
   */
  static getLocationFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Always use correct value for dropdown + custom fields
    // Entry Point
    if (form.elements['entry_point']) {
      const dropdown = form.elements['entry_point'];
      const custom = form.elements['entry_point_custom'];
      if (dropdown.value === 'custom' && custom && custom.value.trim()) {
        data['entry_point'] = custom.value.trim();
      } else {
        data['entry_point'] = dropdown.value;
      }
    }
    // Parking
    if (form.elements['parking']) {
      const dropdown = form.elements['parking'];
      const custom = form.elements['parking_custom'];
      if (dropdown.value === 'custom' && custom && custom.value.trim()) {
        data['parking'] = custom.value.trim();
      } else {
        data['parking'] = dropdown.value;
      }
    }
    // Access
    if (form.elements['access']) {
      const dropdown = form.elements['access'];
      const custom = form.elements['access_custom'];
      if (dropdown.value === 'custom' && custom && custom.value.trim()) {
        data['access'] = custom.value.trim();
      } else {
        data['access'] = dropdown.value;
      }
    }

    return data;
  }

  /**
   * Show success message
   * @param {string} message - Success message to display
   */
  static showSuccessMessage(message) {
    // Create or update success message element
    let successEl = document.getElementById('success-message');
    if (!successEl) {
      successEl = document.createElement('div');
      successEl.id = 'success-message';
      successEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10001;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        font-size: 14px;
      `;
      document.body.appendChild(successEl);
    }
    
    successEl.textContent = message;
    successEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successEl.style.display = 'none';
    }, 3000);
  }

  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateFormData(formData) {
    const errors = [];
    
    if (!formData.name || !formData.name.trim()) {
      errors.push('Location name is required');
    }
    
    if (formData.name && formData.name.length > 100) {
      errors.push('Location name must be less than 100 characters');
    }
    
    if (formData.description && formData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear form data
   * @param {string} formId - ID of form to clear
   */
  static clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
      
      // Clear any stored location data
      if (formId === 'save-location-form') {
        const dialog = document.getElementById('save-location-dialog');
        if (dialog) {
          delete dialog.locationData;
        }
      }
    }
  }

  /**
   * Close dialog and refresh locations list - helper method
   */
  static async closeDialogAndRefresh() {
    // Hide dialog
    import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
      LocationsDialogManager.hideSaveLocationDialog();
    });
    
    // Refresh locations list
    import('./LocationsEventHandlers.js').then(({ LocationsEventHandlers }) => {
      LocationsEventHandlers.loadAndDisplayLocations();
    });
  }
}
