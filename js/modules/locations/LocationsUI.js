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
      // Prevent form submission on dialog content clicks (except submit buttons)
      const dialogContent = event.target.closest('.location-dialog');
      if (dialogContent && !event.target.matches('button[type="submit"], .submit-btn, .save-btn, .primary-btn, .close-dialog, .modal-close')) {
        // This is a click on dialog content that's not a submit button or close button
        // Don't do anything, just let it be
        return;
      }

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

      // Handle dialog form submissions - only on submit button clicks
      if (event.target.type === 'submit' || event.target.matches('button[type="submit"], .submit-btn, .save-btn, .primary-btn')) {
        const form = event.target.closest('form');
        if (form && (form.id === 'save-location-form' || form.id === 'edit-location-form')) {
          event.preventDefault();
          this.handleFormSubmit(form);
        }
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
          ${location.production_notes ? `<p><strong>Production Notes:</strong> ${this.safeDisplayText(location.production_notes)}</p>` : ''}
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
   * @param {string} position - Dialog position ('center' or 'top-right')
   */
  static showLocationDetailsDialog(location, position = 'center') {
    const dialog = this.createDialog('location-details-dialog', 'Location Details', position);
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>Location Details</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div class="dialog-content">
        ${this.generateLocationDetailsHTML(location)}
      </div>
      <div class="dialog-actions">
        <button class="btn-primary" onclick="window.Locations.showEditLocationDialog('${location.place_id || location.id}')">Edit</button>
        <button class="btn-secondary close-dialog">Close</button>
      </div>
    `;

    this.showDialog(dialog, position);
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data
   */
  static showEditLocationDialog(location) {
    const dialog = this.createDialog('edit-location-dialog', 'Edit Location', 'enhanced-center');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="edit-location-form" data-place-id="${location.place_id || location.id}">
        <div class="dialog-content">
          ${this.generateLocationFormHTML(location)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Changes</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog, 'enhanced-center');
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    const dialog = this.createDialog('save-location-dialog', 'Save Location', 'enhanced-center');
    
    // Debug: Log the locationData being passed to the form
    console.log('🔍 LocationsUI.showSaveLocationDialog() received data:', locationData);
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save New Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="save-location-form">
        <div class="dialog-content">
          ${this.generateLocationFormHTML(locationData)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Location</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog, 'enhanced-center');
    
    // Ensure form submission handler is attached after dialog is shown
    setTimeout(() => {
      const form = dialog.querySelector('#save-location-form');
      if (form) {
        // Remove any existing event listeners to prevent duplicates
        form.removeEventListener('submit', this.handleFormSubmitBound);
        
        // Add the form submit handler
        this.handleFormSubmitBound = this.handleFormSubmitBound || this.handleFormSubmit.bind(this);
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          console.log('🔍 Form submit triggered from GPS dialog');
          this.handleFormSubmit(form);
        });
        
        console.log('✅ Form submit handler attached to GPS save dialog');
      } else {
        console.error('❌ Could not find save-location-form in dialog');
      }
    }, 100);
  }

  /**
   * Generate location details HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationDetailsHTML(location) {
    return `
      <div class="location-details enhanced">
        <div class="detail-header">
          <h4 class="location-title">${this.escapeHtml(location.name || 'Unnamed Location')}</h4>
          <span class="location-type-badge ${location.type ? location.type.replace(/\s+/g, '-').toLowerCase() : 'default'}">${this.escapeHtml(location.type || 'No Type')}</span>
        </div>
        
        <div class="detail-section">
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Address:</label>
            <span>${this.escapeHtml(location.formatted_address || location.address || 'No address')}</span>
          </div>
          
          ${location.production_notes ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>Notes:</label>
            <span>${this.safeDisplayText(location.production_notes)}</span>
          </div>
          ` : ''}
          
          ${location.entry_point ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"></path><path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path><circle cx="12" cy="12" r="10"></circle></svg>Entry:</label>
            <span>${this.escapeHtml(location.entry_point)}</span>
          </div>
          ` : ''}
          
          ${location.parking ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>Parking:</label>
            <span>${this.escapeHtml(location.parking)}</span>
          </div>
          ` : ''}
          
          ${location.access ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>Access:</label>
            <span>${this.escapeHtml(location.access)}</span>
          </div>
          ` : ''}
        </div>
        
        ${location.lat && location.lng ? `
        <div class="detail-meta">
          <div class="detail-row coordinates">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"></polygon></svg>Coordinates:</label>
            <span class="coordinates-text">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
          </div>
          ${location.creator_username ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Created by:</label>
            <span>${this.escapeHtml(location.creator_username)}</span>
          </div>
          ` : ''}
          ${location.created_date || location.created_at ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Created:</label>
            <span>${new Date(location.created_date || location.created_at).toLocaleDateString()}</span>
          </div>
          ` : ''}
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
    
    // Debug: Log the location data being used to generate the form
    console.log('🔍 LocationsUI.generateLocationFormHTML() received location data:', location);
    
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
      
      <!-- Photo URL -->
      <div class="form-group">
        <label for="location-photo-url">Photo URL (Optional)</label>
        <input type="url" id="location-photo-url" name="photo_url" value="${this.escapeHtml(location.photo_url || '')}" placeholder="https://example.com/photo.jpg">
        <small class="form-hint">Add a photo URL to display an image for this location</small>
        <div id="photo-preview" style="margin-top: 10px;"></div>
      </div>
      
      <!-- Production Notes -->
      <div class="form-group">
        <label for="location-production-notes">Production Notes</label>
        <textarea id="location-production-notes" name="production_notes" maxlength="200" placeholder="Additional notes about this location..." rows="3">${this.decodeHtml(location.production_notes || '')}</textarea>
        <small class="char-count">0/200 characters</small>
      </div>
      
      <!-- Type - Required dropdown with updated values -->
      <div class="form-group">
        <label for="location-type">Type <span class="required">*</span></label>
        <select id="location-type" name="type" required>
          <option value="">Select type...</option>
          <option value="broll" ${location.type === 'broll' ? 'selected' : ''}>B-Roll</option>
          <option value="interview" ${location.type === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="live anchor" ${location.type === 'live anchor' ? 'selected' : ''}>Live Anchor</option>
          <option value="live reporter" ${location.type === 'live reporter' ? 'selected' : ''}>Live Reporter</option>
          <option value="stakeout" ${location.type === 'stakeout' ? 'selected' : ''}>Stakeout</option>
        </select>
      </div>
      
      <!-- Entry Point - Required -->
      <div class="form-group">
        <label for="location-entry-point">Entry Point <span class="required">*</span></label>
        <select id="location-entry-point" name="entry_point" required>
          <option value="">Select entry point...</option>
          <option value="front door" ${location.entry_point === 'front door' ? 'selected' : ''}>Front Door</option>
          <option value="backdoor" ${location.entry_point === 'backdoor' ? 'selected' : ''}>Back Door</option>
          <option value="garage" ${location.entry_point === 'garage' ? 'selected' : ''}>Garage</option>
          <option value="parking lot" ${location.entry_point === 'parking lot' ? 'selected' : ''}>Parking Lot</option>
        </select>
      </div>
      
      <!-- Parking - Required -->
      <div class="form-group">
        <label for="location-parking">Parking <span class="required">*</span></label>
        <select id="location-parking" name="parking" required>
          <option value="">Select parking...</option>
          <option value="street" ${location.parking === 'street' ? 'selected' : ''}>Street</option>
          <option value="driveway" ${location.parking === 'driveway' ? 'selected' : ''}>Driveway</option>
          <option value="garage" ${location.parking === 'garage' ? 'selected' : ''}>Garage</option>
        </select>
      </div>
      
      <!-- Access - Required -->
      <div class="form-group">
        <label for="location-access">Access <span class="required">*</span></label>
        <select id="location-access" name="access" required>
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
      
      <!-- Required fields validation message -->
      <div class="required-fields-notice">
        <span class="required">*</span> Required fields
      </div>
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
      // First, center the map on the location
      if (location.lat && location.lng) {
        // Direct map centering for immediate response
        if (window.MapService) {
          window.MapService.centerMap(location.lat, location.lng, 16);
        }
        
        // Also show marker and info window if MarkerService is available
        if (window.MarkerService) {
          try {
            // Create a proper place object with Google Maps LatLng format
            const place = {
              geometry: { 
                location: new google.maps.LatLng(location.lat, location.lng)
              },
              name: location.name,
              formatted_address: location.formatted_address || location.address,
              place_id: location.place_id || location.id
            };
            
            window.MarkerService.showPlaceOnMap(place, {
              zoom: 16, // Use a closer zoom level for better view
              showInfoWindow: true
            });
          } catch (error) {
            console.warn('Error showing place on map:', error);
            // Fallback to direct centering if LatLng creation fails
            if (window.MapService) {
              window.MapService.centerMap(location.lat, location.lng, 16);
            }
          }
        }
      }
      
      // Then show the dialog in top-right corner
      this.showLocationDetailsDialog(location, 'top-right');
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
    console.log('🔍 LocationsUI.handleFormSubmit() called with form:', form);
    
    try {
      const formData = new FormData(form);
      const locationData = Object.fromEntries(formData.entries());
      
      console.log('🔍 Form data extracted:', locationData);
      
      // Debug: Check for empty string values
      Object.keys(locationData).forEach(key => {
        if (locationData[key] === '') {
          console.log(`⚠️ Empty string value for field: ${key}`);
        }
      });
      
      // Client-side validation for required fields
      const requiredFields = ['type', 'entry_point', 'parking', 'access'];
      const missingFields = [];
      
      requiredFields.forEach(field => {
        if (!locationData[field] || locationData[field].trim() === '') {
          missingFields.push(field.replace('_', ' '));
        }
      });
      
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(field => field.charAt(0).toUpperCase() + field.slice(1)).join(', ');
        throw new Error(`Please select values for: ${fieldNames}`);
      }
      
      // Convert lat/lng to numbers
      if (locationData.lat) locationData.lat = parseFloat(locationData.lat);
      if (locationData.lng) locationData.lng = parseFloat(locationData.lng);
      
      console.log('🔍 Location data after lat/lng conversion:', locationData);
      
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
      
      console.log('🔍 Final location data to save:', locationData);
      
      if (form.id === 'edit-location-form') {
        const placeId = form.getAttribute('data-place-id');
        console.log('🔍 Updating existing location with place_id:', placeId);
        await window.Locations.updateLocation(placeId, locationData);
        this.showNotification(`Location "${locationData.name}" updated successfully`, 'success');
      } else {
        console.log('🔍 Saving new location...');
        
        // Verify window.Locations is available
        if (!window.Locations) {
          throw new Error('Locations service is not available');
        }
        
        const result = await window.Locations.saveLocation(locationData);
        console.log('🔍 Save location result:', result);
        
        // Show success notification
        this.showNotification(`Location "${locationData.name}" saved`, 'success');
        
        // Refresh the saved locations list automatically
        await window.Locations.refreshLocationsList();
        console.log('✅ Locations list refreshed after GPS save');
        
        // Update GPS marker visual state if this was a GPS save
        if (window.currentGPSMarkerData && window.MapService) {
          window.MapService.updateGPSMarkerAsSaved();
        }
      }
      
      // Close dialog with small delay to ensure notification shows
      setTimeout(() => {
        this.closeActiveDialog();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      this.showNotification(`Error saving location: ${error.message}`, 'error');
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
   * @param {string} position - Dialog position ('center', 'enhanced-center', or 'top-right')
   * @returns {HTMLElement} Dialog element
   */
  static createDialog(id, title, position = 'center') {
    // Remove existing dialog
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.id = id;
    
    // Apply position-specific classes
    if (position === 'top-right') {
      dialog.className = `location-dialog dialog-top-right`;
    } else if (position === 'enhanced-center') {
      dialog.className = `dialog enhanced-center`;
    } else {
      dialog.className = `location-dialog dialog-center`;
    }
    
    // Different styling based on position
    if (position === 'top-right') {
      dialog.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        padding: 0;
        max-width: 400px;
        width: 380px;
        z-index: 10000;
        border: 1px solid #e0e0e0;
        animation: slideInFromRight 0.3s ease;
      `;
    } else if (position === 'enhanced-center') {
      // Enhanced center dialogs use CSS classes for styling
      dialog.style.cssText = `z-index: 10000;`;
    } else {
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
    }

    return dialog;
  }

  /**
   * Show a dialog
   * @param {HTMLElement} dialog - Dialog element
   * @param {string} position - Dialog position ('center', 'enhanced-center', or 'top-right')
   */
  static showDialog(dialog, position = 'center') {
    // Create backdrop for center and enhanced-center dialogs
    if (position === 'center' || position === 'enhanced-center') {
      const backdrop = document.createElement('div');
      backdrop.className = 'dialog-backdrop';
      
      if (position === 'enhanced-center') {
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        
        backdrop.onclick = (e) => {
          if (e.target === backdrop) this.closeActiveDialog();
        };
        
        document.body.appendChild(backdrop);
        backdrop.appendChild(dialog);
        
        // Trigger animation
        setTimeout(() => {
          backdrop.style.opacity = '1';
        }, 10);
        
      } else {
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
        document.body.appendChild(dialog);
      }
    } else {
      // For top-right dialogs, just append to body
      document.body.appendChild(dialog);
    }
    
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

  /**
   * Decode double-encoded HTML entities (for display purposes)
   * @param {string} text - Text that may be double-encoded
   * @returns {string} Properly decoded text for display
   */
  static decodeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }

  /**
   * Smart HTML escaping that handles already encoded text
   * @param {string} text - Text to safely display
   * @returns {string} Safely encoded text for display
   */
  static safeDisplayText(text) {
    if (!text) return '';
    
    // First decode any existing encoding, then properly escape
    const decoded = this.decodeHtml(text);
    return this.escapeHtml(decoded);
  }
}
