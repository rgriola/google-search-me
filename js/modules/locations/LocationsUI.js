/**
 * Locations UI Service
 * Simplified UI operations for locations display and interaction
 */

import { StateManager } from '../state/AppState.js';

/**
 * Simplified Locations UI
 */
export class LocationsUI {

  /**
   * Initialize UI components
   */
  static initialize() {
    // console.log('🎨 Initializing Locations UI');
    
    this.setupUIElements();
    this.setupEventListeners();
    
    // console.log('✅ Locations UI initialized');
  }

  /**
   * Setup UI elements
   */
  static setupUIElements() {
    // Check if savedLocationsList already exists (it should in app.html)
    let savedLocationsList = document.getElementById('savedLocationsList');
    if (savedLocationsList) {
      // console.log('✅ Found existing savedLocationsList element');
      return;
    }
    
    // Fallback: create the elements if they don't exist
    console.log('⚠️ savedLocationsList not found, creating fallback elements');
    
    let savedLocationsContainer = document.getElementById('savedLocations');
    if (!savedLocationsContainer) {
      savedLocationsContainer = document.createElement('div');
      savedLocationsContainer.id = 'savedLocations';
      
      // Find a suitable parent or add to sidebar
      const sidebar = document.querySelector('.sidebar') || document.body;
      sidebar.appendChild(savedLocationsContainer);
    }

    // Create saved locations list
    savedLocationsList = document.createElement('div');
    savedLocationsList.id = 'savedLocationsList';
    savedLocationsList.className = 'saved-locations-list';
    savedLocationsContainer.appendChild(savedLocationsList);
  }

  /**
   * Setup event listeners
   */
  static setupEventListeners() {
    // Handle clicks on location items and buttons
    document.addEventListener('click', async (event) => {
      // Handle location item clicks
      const locationItem = event.target.closest('.location-item');
      if (locationItem) {
        const placeId = locationItem.getAttribute('data-place-id');
        const action = event.target.getAttribute('data-action');
        
        switch (action) {
          case 'view':
            this.handleViewLocation(placeId);
            break;
          case 'edit':
            this.handleEditLocation(placeId);
            break;
          case 'delete':
            this.handleDeleteLocation(placeId);
            break;
          default:
            // Default action - show details
            this.handleViewLocation(placeId);
        }
        return;
      }

      // Handle dialog form submissions
      const form = event.target.closest('form');
      if (form && (form.id === 'save-location-form' || form.id === 'edit-location-form')) {
        event.preventDefault();
        this.handleFormSubmit(form);
      }

      // Handle dialog close buttons
      if (event.target.matches('.close-dialog, .modal-close')) {
        this.closeActiveDialog();
      }
    });

    // Handle form input changes for character counting and validation
    document.addEventListener('input', (event) => {
      if (event.target.matches('#location-production-notes')) {
        this.updateCharacterCount(event.target);
      }
    });
  }

  /**
   * Update character count for textarea fields
   * @param {HTMLTextAreaElement} textarea - Textarea element
   */
  static updateCharacterCount(textarea) {
    const maxLength = parseInt(textarea.getAttribute('maxlength'));
    const currentLength = textarea.value.length;
    const charCountElement = textarea.parentNode.querySelector('.char-count');
    
    if (charCountElement) {
      charCountElement.textContent = `${currentLength}/${maxLength} characters`;
      
      // Update styling based on character count
      charCountElement.classList.remove('warning', 'error');
      if (currentLength > maxLength * 0.8) {
        charCountElement.classList.add('warning');
      }
      if (currentLength >= maxLength) {
        charCountElement.classList.add('error');
      }
    }
  }

  /**
   * Setup form enhancements after form is displayed
   * @param {HTMLElement} formContainer - Container with the form
   */
  static setupFormEnhancements(formContainer) {
    // Initialize character counters
    const productionNotesField = formContainer.querySelector('#location-production-notes');
    if (productionNotesField) {
      this.updateCharacterCount(productionNotesField);
    }
    
    // Setup live address updating
    this.setupLiveAddressUpdate(formContainer);
  }

  /**
   * Setup live address updating for form fields
   * @param {HTMLElement} formContainer - Container with the form
   */
  static setupLiveAddressUpdate(formContainer) {
    const addressFields = [
      'location-number',
      'location-street', 
      'location-city',
      'location-state',
      'location-zipcode'
    ];
    
    const addressDisplay = formContainer.querySelector('.address-display');
    const hiddenAddressField = formContainer.querySelector('input[name="formatted_address"]');
    
    if (!addressDisplay) return;
    
    // Function to update the live address preview
    const updateAddressPreview = () => {
      const components = {
        number: formContainer.querySelector('#location-number')?.value.trim() || '',
        street: formContainer.querySelector('#location-street')?.value.trim() || '',
        city: formContainer.querySelector('#location-city')?.value.trim() || '',
        state: formContainer.querySelector('#location-state')?.value.trim() || '',
        zipcode: formContainer.querySelector('#location-zipcode')?.value.trim() || ''
      };
      
      const formattedAddress = this.formatLiveAddress(components);
      
      if (formattedAddress) {
        addressDisplay.textContent = formattedAddress;
        addressDisplay.classList.add('updating');
        
        // Reset the styling after animation
        setTimeout(() => {
          addressDisplay.classList.remove('updating');
        }, 500);
      } else {
        addressDisplay.textContent = 'Address will appear here...';
        addressDisplay.classList.remove('updating');
      }
      
      // Update hidden field for form submission
      if (hiddenAddressField) {
        hiddenAddressField.value = formattedAddress;
      }
    };
    
    // Add event listeners to address fields
    addressFields.forEach(fieldId => {
      const field = formContainer.querySelector(`#${fieldId}`);
      if (field) {
        field.addEventListener('input', (e) => {
          // Validate field length
          if (fieldId === 'location-state' && e.target.value.length > 2) {
            e.target.value = e.target.value.substring(0, 2);
          }
          if (fieldId === 'location-zipcode' && e.target.value.length > 5) {
            e.target.value = e.target.value.substring(0, 5);
          }
          
          updateAddressPreview();
        });
        
        field.addEventListener('blur', (e) => {
          // Convert state to uppercase
          if (fieldId === 'location-state') {
            e.target.value = e.target.value.toUpperCase();
            updateAddressPreview();
          }
        });
      }
    });
    
    // Initial address update
    updateAddressPreview();
  }

  /**
   * Render locations list
   * @param {Array} locations - Array of locations to render
   */
  static renderLocationsList(locations) {
    const listContainer = document.getElementById('savedLocationsList');
    
    if (!listContainer) {
      console.error('❌ Sidebar container not found!');
      return;
    }

    if (!locations || locations.length === 0) {
      listContainer.innerHTML = '<p class="no-locations">No saved locations yet.</p>';
      return;
    }

    const html = locations.map(location => this.generateLocationItemHTML(location)).join('');
    listContainer.innerHTML = html;
  }

  /**
   * Generate HTML for a location item
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationItemHTML(location) {
    const name = location.name || 'Unnamed Location';
    const address = location.formatted_address || location.address || 'No address';
    const type = location.type || 'Location';
    const placeId = location.place_id || location.id;

    // Enhanced display with more details like the test file
    const hasDetails = location.production_notes || location.entry_point || location.parking || location.access;
    
    return `
      <div class="location-item" data-place-id="${placeId}">
        <div class="location-info">
          <h4 class="location-name">${this.escapeHtml(name)}</h4>
          <p class="location-address"><strong>Address:</strong> ${this.escapeHtml(address)}</p>
          <p><strong>Type:</strong> ${this.escapeHtml(type)}</p>
          ${location.production_notes ? `<p><strong>Production Notes:</strong> ${this.escapeHtml(location.production_notes)}</p>` : ''}
          ${location.entry_point ? `<p><strong>Entry Point:</strong> ${this.escapeHtml(location.entry_point)}</p>` : ''}
          ${location.parking ? `<p><strong>Parking:</strong> ${this.escapeHtml(location.parking)}</p>` : ''}
          ${location.access ? `<p><strong>Access:</strong> ${this.escapeHtml(location.access)}</p>` : ''}
          ${location.street || location.number || location.city || location.state || location.zipcode ? `
            <p><strong>Location:</strong> ${[location.number, location.street].filter(Boolean).join(' ')}, ${[location.city, location.state, location.zipcode].filter(Boolean).join(' ')}</p>
          ` : ''}
          ${location.lat && location.lng ? `<p><strong>Coordinates:</strong> ${location.lat}, ${location.lng}</p>` : ''}
          ${location.creator_username ? `<p><strong>Created by:</strong> ${this.escapeHtml(location.creator_username)}</p>` : ''}
          ${location.created_date || location.created_at ? `<p><strong>Created:</strong> ${new Date(location.created_date || location.created_at).toLocaleDateString()}</p>` : ''}
          ${location.updated_date ? `<p><strong>Updated:</strong> ${new Date(location.updated_date).toLocaleDateString()}</p>` : ''}
        </div>
        <div class="location-actions">
          <button data-action="view" title="View Details">👁️ View</button>
          <button data-action="edit" title="Edit">✏️ Edit</button>
          <button data-action="delete" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Show location details dialog
   * @param {Object} location - Location data
   */
  static showLocationDetailsDialog(location) {
    const dialog = this.createDialog('location-details-dialog', 'Location Details');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>Location Details</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div class="dialog-content">
        ${this.generateLocationDetailsHTML(location)}
      </div>
      <div class="dialog-actions">
        <button onclick="window.Locations.showEditLocationDialog('${location.place_id || location.id}')">Edit</button>
        <button class="close-dialog">Close</button>
      </div>
    `;

    this.showDialog(dialog);
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data
   */
  static showEditLocationDialog(location) {
    const dialog = this.createDialog('edit-location-dialog', 'Edit Location');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>Edit Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="edit-location-form" data-place-id="${location.place_id || location.id}">
        <div class="dialog-content">
          ${this.generateLocationFormHTML(location)}
        </div>
        <div class="dialog-actions">
          <button type="submit">Save Changes</button>
          <button type="button" class="close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    const dialog = this.createDialog('save-location-dialog', 'Save Location');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>Save New Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="save-location-form">
        <div class="dialog-content">
          ${this.generateLocationFormHTML(locationData)}
        </div>
        <div class="dialog-actions">
          <button type="submit">Save Location</button>
          <button type="button" class="close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog);
  }

  /**
   * Generate location details HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationDetailsHTML(location) {
    return `
      <div class="location-details">
        <div class="detail-row">
          <label>Name:</label>
          <span>${this.escapeHtml(location.name || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Type:</label>
          <span>${this.escapeHtml(location.type || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Address:</label>
          <span>${this.escapeHtml(location.address || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <label>Description:</label>
          <span>${this.escapeHtml(location.description || 'N/A')}</span>
        </div>
        ${location.lat && location.lng ? `
        <div class="detail-row">
          <label>Coordinates:</label>
          <span>${location.lat}, ${location.lng}</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate location form HTML - Updated to match comprehensive structure
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationFormHTML(location = {}) {
    const formId = location.place_id ? 'edit-location-form' : 'save-location-form';
    const addressId = location.place_id ? 'edit-address-display' : 'address-display';
    
    return `
      <div class="address-display" id="${addressId}" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 16px; font-weight: bold; color: #495057; min-height: 20px; transition: all 0.3s ease;">
        ${this.escapeHtml(location.formatted_address || location.address || 'Address information')}
      </div>
      
      <!-- Name Field - Required, defaults to street + city -->
      <div class="form-group">
        <label for="location-name">Location Name *</label>
        <input type="text" id="location-name" name="name" value="${this.escapeHtml(location.name || '')}" required maxlength="100" placeholder="Location name">
      </div>
      
      <!-- Address Components - User can edit -->
      <div class="form-group">
        <label for="location-number">Street Number</label>
        <input type="text" id="location-number" name="number" value="${this.escapeHtml(location.number || '')}" placeholder="3375" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-street">Street</label>
        <input type="text" id="location-street" name="street" value="${this.escapeHtml(location.street || '')}" placeholder="Laren Lane Southwest" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-city">City</label>
        <input type="text" id="location-city" name="city" value="${this.escapeHtml(location.city || '')}" placeholder="Atlanta" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-state">State</label>
        <input type="text" id="location-state" name="state" value="${this.escapeHtml(location.state || '')}" maxlength="2" placeholder="GA" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-zipcode">Zip Code</label>
        <input type="text" id="location-zipcode" name="zipcode" value="${this.escapeHtml(location.zipcode || '')}" maxlength="5" placeholder="30311" class="address-component">
      </div>
      
      <!-- Production Notes -->
      <div class="form-group">
        <label for="location-production-notes">Production Notes</label>
        <textarea id="location-production-notes" name="production_notes" maxlength="200" placeholder="Additional notes about this location..." rows="3">${this.escapeHtml(location.production_notes || '')}</textarea>
        <small class="char-count">0/200 characters</small>
      </div>
      
      <!-- Type - Required dropdown with updated values -->
      <div class="form-group">
        <label for="location-type">Type *</label>
        <select id="location-type" name="type" required>
          <option value="">Select type...</option>
          <option value="broll" ${location.type === 'broll' ? 'selected' : ''}>B-Roll</option>
          <option value="interview" ${location.type === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="live anchor" ${location.type === 'live anchor' ? 'selected' : ''}>Live Anchor</option>
          <option value="live reporter" ${location.type === 'live reporter' ? 'selected' : ''}>Live Reporter</option>
          <option value="stakeout" ${location.type === 'stakeout' ? 'selected' : ''}>Stakeout</option>
        </select>
      </div>
      
      <!-- Entry Point -->
      <div class="form-group">
        <label for="location-entry-point">Entry Point</label>
        <select id="location-entry-point" name="entry_point">
          <option value="">Select entry point...</option>
          <option value="front door" ${location.entry_point === 'front door' ? 'selected' : ''}>Front Door</option>
          <option value="backdoor" ${location.entry_point === 'backdoor' ? 'selected' : ''}>Back Door</option>
          <option value="garage" ${location.entry_point === 'garage' ? 'selected' : ''}>Garage</option>
          <option value="parking lot" ${location.entry_point === 'parking lot' ? 'selected' : ''}>Parking Lot</option>
        </select>
      </div>
      
      <!-- Parking -->
      <div class="form-group">
        <label for="location-parking">Parking</label>
        <select id="location-parking" name="parking">
          <option value="">Select parking...</option>
          <option value="street" ${location.parking === 'street' ? 'selected' : ''}>Street</option>
          <option value="driveway" ${location.parking === 'driveway' ? 'selected' : ''}>Driveway</option>
          <option value="garage" ${location.parking === 'garage' ? 'selected' : ''}>Garage</option>
        </select>
      </div>
      
      <!-- Access -->
      <div class="form-group">
        <label for="location-access">Access</label>
        <select id="location-access" name="access">
          <option value="">Select access...</option>
          <option value="ramp" ${location.access === 'ramp' ? 'selected' : ''}>Ramp</option>
          <option value="stairs only" ${location.access === 'stairs only' ? 'selected' : ''}>Stairs Only</option>
          <option value="doorway" ${location.access === 'doorway' ? 'selected' : ''}>Doorway</option>
          <option value="garage" ${location.access === 'garage' ? 'selected' : ''}>Garage</option>
        </select>
      </div>
      
      <!-- Hidden fields for coordinates and place_id -->
      <input type="hidden" name="lat" value="${location.lat || ''}">
      <input type="hidden" name="lng" value="${location.lng || ''}">
      <input type="hidden" name="place_id" value="${location.place_id || location.id || ''}">
      <input type="hidden" name="formatted_address" value="${this.escapeHtml(location.formatted_address || location.address || '')}">
    `;
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle view location
   * @param {string} placeId - Location ID
   */
  static async handleViewLocation(placeId) {
    const location = this.getLocationById(placeId);
    if (location) {
      this.showLocationDetailsDialog(location);
      
      // Also show on map if available
      if (window.MarkerService && location.lat && location.lng) {
        window.MarkerService.showPlaceOnMap({
          geometry: { location: { lat: location.lat, lng: location.lng } },
          name: location.name,
          formatted_address: location.address
        });
      }
    }
  }

  /**
   * Handle edit location
   * @param {string} placeId - Location ID
   */
  static async handleEditLocation(placeId) {
    const location = this.getLocationById(placeId);
    if (location) {
      this.showEditLocationDialog(location);
    }
  }

  /**
   * Handle delete location
   * @param {string} placeId - Location ID
   */
  static async handleDeleteLocation(placeId) {
    if (confirm('Are you sure you want to delete this location?')) {
      try {
        await window.Locations.deleteLocation(placeId);
        this.showNotification('Location deleted successfully', 'success');
      } catch (error) {
        this.showNotification('Error deleting location', 'error');
      }
    }
  }

  /**
   * Handle form submission
   * @param {HTMLFormElement} form - Form element
   */
  static async handleFormSubmit(form) {
    try {
      const formData = new FormData(form);
      const locationData = Object.fromEntries(formData.entries());
      
      // Convert lat/lng to numbers
      if (locationData.lat) locationData.lat = parseFloat(locationData.lat);
      if (locationData.lng) locationData.lng = parseFloat(locationData.lng);
      
      // Ensure formatted_address is updated from address components
      const addressComponents = {
        number: locationData.number || '',
        street: locationData.street || '',
        city: locationData.city || '',
        state: locationData.state || '',
        zipcode: locationData.zipcode || ''
      };
      
      const updatedFormattedAddress = this.formatLiveAddress(addressComponents);
      if (updatedFormattedAddress) {
        locationData.formatted_address = updatedFormattedAddress;
      }
      
      if (form.id === 'edit-location-form') {
        const placeId = form.getAttribute('data-place-id');
        await window.Locations.updateLocation(placeId, locationData);
        this.showNotification('Location updated successfully', 'success');
      } else {
        await window.Locations.saveLocation(locationData);
        this.showNotification('Location saved successfully', 'success');
      }
      
      this.closeActiveDialog();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showNotification('Error saving location', 'error');
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Live address formatting function
   * @param {Object} components - Address components
   * @returns {string} Formatted address
   */
  static formatLiveAddress(components) {
    const { number, street, city, state, zipcode } = components;
    
    // Build address parts
    const parts = [];
    
    // Street address (number + street)
    if (number || street) {
      const streetPart = [number, street].filter(Boolean).join(' ');
      if (streetPart.trim()) {
        parts.push(streetPart.trim());
      }
    }
    
    // City
    if (city && city.trim()) {
      parts.push(city.trim());
    }
    
    // State and zipcode (together)
    if (state || zipcode) {
      const stateZip = [state, zipcode].filter(Boolean).join(' ');
      if (stateZip.trim()) {
        parts.push(stateZip.trim());
      }
    }
    
    // Join with commas
    let formattedAddress = '';
    if (parts.length > 0) {
      if (parts.length === 1) {
        formattedAddress = parts[0];
      } else if (parts.length === 2) {
        formattedAddress = parts.join(', ');
      } else {
        formattedAddress = parts.slice(0, -1).join(', ') + ', ' + parts[parts.length - 1];
      }
    }
    
    // Add USA if we have a complete address
    if (formattedAddress && (state || zipcode)) {
      formattedAddress += ', USA';
    }
    
    return formattedAddress;
  }

  /**
   * Create a dialog element
   * @param {string} id - Dialog ID
   * @param {string} title - Dialog title
   * @returns {HTMLElement} Dialog element
   */
  static createDialog(id, title) {
    // Remove existing dialog
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.id = id;
    dialog.className = 'location-dialog';
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
    `;

    return dialog;
  }

  /**
   * Show a dialog
   * @param {HTMLElement} dialog - Dialog element
   */
  static showDialog(dialog) {
    document.body.appendChild(dialog);
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    backdrop.onclick = () => this.closeActiveDialog();
    
    document.body.appendChild(backdrop);
    
    // Setup form enhancements if this dialog contains a form
    if (dialog.querySelector('form')) {
      this.setupFormEnhancements(dialog);
    }
  }

  /**
   * Close the active dialog
   */
  static closeActiveDialog() {
    const dialogs = document.querySelectorAll('.location-dialog');
    const backdrops = document.querySelectorAll('.dialog-backdrop');
    
    dialogs.forEach(dialog => dialog.remove());
    backdrops.forEach(backdrop => backdrop.remove());
  }

  /**
   * Get location by ID
   * @param {string} placeId - Location ID
   * @returns {Object|null} Location object
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => (loc.place_id || loc.id) === placeId);
  }

  /**
   * Show notification
   * @param {string} message - Message text
   * @param {string} type - Notification type
   */
  static showNotification(message, type = 'info') {
    // Use Auth notification service if available
    if (window.Auth) {
      const { AuthNotificationService } = window.Auth.getServices();
      AuthNotificationService.showNotification(message, type);
    } else {
      // Simple fallback
      alert(message);
    }
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
