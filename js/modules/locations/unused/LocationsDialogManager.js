/**
 * Location Dialog Manager
 * Manages dialog creation, display, and UI interactions
 */

/**
 * Locations Dialog Manager Class
 */
export class LocationsDialogManager {

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

    // Import form handlers for data extraction
    import('./LocationsFormHandlers.js').then(({ LocationsFormHandlers }) => {
      // Extract location data from place object
      const locationData = LocationsFormHandlers.extractLocationDataFromPlace(place);

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
        const photoUrlField = document.getElementById('location-photo-url');
        const typesField = document.getElementById('location-types');

        // Populate form fields if they exist
        if (nameField) nameField.value = locationData.name || '';
        if (descField) descField.value = locationData.description || '';
        if (addressField) addressField.textContent = locationData.address || '';
        if (streetField) streetField.value = locationData.street || '';
        if (numberField) numberField.value = locationData.number || '';
        if (cityField) cityField.value = locationData.city || '';
        if (stateField) stateField.value = locationData.state || '';
        if (zipcodeField) zipcodeField.value = locationData.zipcode || '';
        if (photoUrlField) photoUrlField.value = locationData.photoUrl || '';
        if (typesField) typesField.value = locationData.types ? locationData.types.join(', ') : '';

        // Update the generated address field to ensure consistency
        LocationsDialogManager.updateGeneratedAddress();

        // Store location data on dialog
        dialog.locationData = locationData;

        // Load Street View if coordinates are available
        if (locationData.lat && locationData.lng) {
          import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
            LocationsUIHelpers.loadStreetView(locationData);
          });
        }
      }, 50);
    });

    // Show dialog
    dialog.style.display = 'block';

    // Create backdrop
    this.createDialogBackdrop(() => this.hideSaveLocationDialog());
  }

  /**
   * Create dialog backdrop
   * @param {Function} clickHandler - Function to call when backdrop is clicked
   */
  static createDialogBackdrop(clickHandler) {
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
      backdrop.addEventListener('click', clickHandler);
      document.body.appendChild(backdrop);
    }
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
   * Hide location dialog (unified)
   */
  static hideLocationDialog() {
    const dialog = document.getElementById('location-form-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
    
    const backdrop = document.getElementById('dialog-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Create the save location dialog if it doesn't exist
   */
  static createSaveLocationDialog() {
    // Remove existing dialog if it exists to ensure we get the latest version
    const existingDialog = document.getElementById('save-location-dialog');
    if (existingDialog) {
      existingDialog.remove();
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
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 10000;
      display: none;
      font-family: Arial, sans-serif;
    `;

    dialog.innerHTML = this.generateSaveDialogHTML();
    document.body.appendChild(dialog);

    // Add event listeners
    document.getElementById('close-save-dialog').addEventListener('click', () => this.hideSaveLocationDialog());
    document.getElementById('cancel-save').addEventListener('click', () => this.hideSaveLocationDialog());
    
    // Setup form submission handler
    import('./LocationsFormHandlers.js').then(({ LocationsFormHandlers }) => {
      document.getElementById('save-location-form').addEventListener('submit', (e) => {
        LocationsFormHandlers.handleSaveLocationFormSubmit(e);
      });
      
      // Add dropdown change handlers
      LocationsFormHandlers.setupDropdownHandlers();
      
      // Setup address field event listeners
      const numberField = document.getElementById('location-number');
      const streetField = document.getElementById('location-street');
      const cityField = document.getElementById('location-city');
      const stateField = document.getElementById('location-state');
      const zipcodeField = document.getElementById('location-zipcode');
      
      if (numberField) numberField.addEventListener('input', () => this.updateGeneratedAddress());
      if (streetField) streetField.addEventListener('input', () => this.updateGeneratedAddress());
      if (cityField) cityField.addEventListener('input', () => this.updateGeneratedAddress());
      if (stateField) stateField.addEventListener('input', () => this.updateGeneratedAddress());
      if (zipcodeField) zipcodeField.addEventListener('input', () => this.updateGeneratedAddress());
    });

    // Make updateGeneratedAddress available globally for oninput handlers
    window.LocationsDialogManager = this;
  }

  /**
   * Generate HTML for save dialog
   * @returns {string} HTML string
   */
  static generateSaveDialogHTML() {
    return `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">Save Location</h3>
        <button id="close-save-dialog" style="float: right; background: none; border: none; font-size: 24px; cursor: pointer; margin-top: -30px;">&times;</button>
      </div>
      
      <form id="save-location-form">
        ${this.generateFormFieldsHTML()}
        
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
  }

  /**
   * Generate form fields HTML
   * @returns {string} Form fields HTML
   */
  static generateFormFieldsHTML() {
    return `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Name *</label>
        <input type="text" id="location-name" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Type</label>
        <select id="location-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">Select location type...</option>
          <option value="Live Reporter">Live Reporter</option>
          <option value="Live Anchor">Live Anchor</option>
          <option value="Live Stakeout">Live Stakeout</option>
          <option value="Live Presser">Live Presser</option>
          <option value="Interview">Interview</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
        <textarea id="location-description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Add notes about this location..."></textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Photo URL (Optional)</label>
        <input type="url" id="location-photo-url" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="https://example.com/photo.jpg">
        <small style="color: #666; font-size: 12px;">Add a photo URL to display an image for this location</small>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Types (Google Places)</label>
        <input type="text" id="location-types" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="restaurant, food, establishment" readonly>
        <small style="color: #666; font-size: 12px;">Automatically filled from Google Places data</small>
      </div>
      
      ${this.generateDropdownFieldsHTML()}
      ${this.generateAddressFieldsHTML()}
    `;
  }

  /**
   * Generate unified form fields HTML for both save and edit dialogs
   * @param {Object} location - Location data (optional, for edit mode)
   * @param {string} mode - 'save' or 'edit' mode
   * @returns {string} Form fields HTML
   */
  static generateUnifiedFormFieldsHTML(location = {}, mode = 'save') {
    const isEditMode = mode === 'edit';
    
    return `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Name ${isEditMode ? '' : '*'}</label>
        <input type="text" ${isEditMode ? 'name="name"' : 'id="location-name"'} value="${location.name || ''}" ${isEditMode ? '' : 'required'} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Type</label>
        <select ${isEditMode ? 'name="type"' : 'id="location-type"'} ${isEditMode ? 'required' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">Select location type...</option>
          <option value="Live Reporter" ${location.type === 'Live Reporter' ? 'selected' : ''}>Live Reporter</option>
          <option value="Live Anchor" ${location.type === 'Live Anchor' ? 'selected' : ''}>Live Anchor</option>
          <option value="Live Stakeout" ${location.type === 'Live Stakeout' ? 'selected' : ''}>Live Stakeout</option>
          <option value="Live Presser" ${location.type === 'Live Presser' ? 'selected' : ''}>Live Presser</option>
          <option value="Interview" ${location.type === 'Interview' ? 'selected' : ''}>Interview</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
        <textarea ${isEditMode ? 'name="description"' : 'id="location-description"'} rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Add notes about this location...">${location.description || ''}</textarea>
      </div>
      
      ${this.generateUnifiedDropdownFieldsHTML(location, mode)}
      ${this.generateUnifiedAddressFieldsHTML(location, mode)}
      ${isEditMode ? '' : this.generateSaveOnlyFieldsHTML(location)}
    `;
  }

  /**
   * Generate unified dropdown fields HTML (entry point, parking, accessibility)
   * @param {Object} location - Location data (optional, for edit mode)
   * @param {string} mode - 'save' or 'edit' mode
   * @returns {string} Dropdown fields HTML
   */
  static generateUnifiedDropdownFieldsHTML(location = {}, mode = 'save') {
    const isEditMode = mode === 'edit';
    
    // Define all possible values for each field
    const entryPointOptions = [
      'Main entrance', 'Side entrance', 'Back entrance', 'Loading dock', 
      'Parking lot entrance', 'Staff entrance', 'Security gate', 
      'Visitor entrance', 'Emergency entrance', 'Front Door', 'Side Door', 
      'Back Door', 'Security Entrance', 'Loading Dock', 'Other'
    ];
    
    const parkingOptions = [
      'Street parking available', 'Free parking lot', 'Paid parking lot', 
      'Parking garage', 'Valet parking', 'Reserved media parking', 
      'No parking available', 'Limited parking', 'Permit required', 
      'Loading zone only', 'Handicap accessible parking', 'Street Parking', 
      'Parking Lot', 'Parking Garage', 'Valet', 'No Parking', 'Other'
    ];
    
    const accessOptions = [
      'Fully wheelchair accessible', 'Wheelchair accessible with assistance', 
      'Limited wheelchair access', 'Not wheelchair accessible', 'Elevator available', 
      'Stairs only', 'Ramp available', 'Accessible restrooms', 'Hearing loop available', 
      'Sign language interpreter needed', 'Service animal friendly', 'Wheelchair Accessible', 
      'Limited Access', 'No Access', 'Unknown'
    ];

    if (isEditMode) {
      // Edit mode: Simple select dropdowns with fallback text inputs for custom values
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Entry Point:</label>
            <select name="entry_point" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="">Select Entry</option>
              ${entryPointOptions.map(option => 
                `<option value="${option}" ${location.entry_point === option ? 'selected' : ''}>${option}</option>`
              ).join('')}
            </select>
            ${location.entry_point && !entryPointOptions.includes(location.entry_point) ? 
              `<input type="text" name="entry_point_custom" value="${location.entry_point}" placeholder="Custom entry point" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">` : ''}
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Parking:</label>
            <select name="parking" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="">Select Parking</option>
              ${parkingOptions.map(option => 
                `<option value="${option}" ${location.parking === option ? 'selected' : ''}>${option}</option>`
              ).join('')}
            </select>
            ${location.parking && !parkingOptions.includes(location.parking) ? 
              `<input type="text" name="parking_custom" value="${location.parking}" placeholder="Custom parking info" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">` : ''}
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Accessibility:</label>
            <select name="access" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              <option value="">Select Access</option>
              ${accessOptions.map(option => 
                `<option value="${option}" ${location.access === option || (location.access && location.access.startsWith(option)) ? 'selected' : ''}>${option}</option>`
              ).join('')}
            </select>
            ${location.access && !accessOptions.some(opt => location.access === opt || location.access.startsWith(opt)) ? 
              `<input type="text" name="access_custom" value="${location.access}" placeholder="Custom accessibility info" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;">` : ''}
          </div>
        </div>
      `;
    } else {
      // Save mode: Dropdown + textarea combination
      return `
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Entry Point</label>
          <select id="location-entry-point-dropdown" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
            <option value="">Select common entry point...</option>
            ${entryPointOptions.filter(opt => !['Front Door', 'Side Door', 'Back Door', 'Security Entrance', 'Loading Dock', 'Other'].includes(opt)).map(option => 
              `<option value="${option}">${option}</option>`
            ).join('')}
            <option value="custom">Custom - specify below</option>
          </select>
          <textarea id="location-entry-point" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional entry point details or custom instructions..."></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Parking Information</label>
          <select id="location-parking-dropdown" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
            <option value="">Select parking type...</option>
            ${parkingOptions.filter(opt => !['Street Parking', 'Parking Lot', 'Parking Garage', 'Valet', 'No Parking', 'Other'].includes(opt)).map(option => 
              `<option value="${option}">${option}</option>`
            ).join('')}
            <option value="custom">Custom - specify below</option>
          </select>
          <textarea id="location-parking" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional parking details, restrictions, or custom information..."></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Accessibility</label>
          <select id="location-access-dropdown" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
            <option value="">Select accessibility features...</option>
            ${accessOptions.filter(opt => !['Wheelchair Accessible', 'Limited Access', 'No Access', 'Unknown'].includes(opt)).map(option => 
              `<option value="${option}">${option}</option>`
            ).join('')}
            <option value="custom">Custom - specify below</option>
          </select>
          <textarea id="location-access" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional accessibility information or custom details..."></textarea>
        </div>
      `;
    }
  }

  /**
   * Generate unified address fields HTML
   * @param {Object} location - Location data (optional, for edit mode)
   * @param {string} mode - 'save' or 'edit' mode
   * @returns {string} Address fields HTML
   */
  static generateUnifiedAddressFieldsHTML(location = {}, mode = 'save') {
    const isEditMode = mode === 'edit';
    
    if (isEditMode) {
      return `
        <div style="margin-bottom: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Address Details</h4>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Full Address (Auto-Generated)</label>
            <div id="location-address" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f8f9fa; color: #6c757d; min-height: 20px; font-family: inherit;">${location.address || 'Address will be generated from fields below'}</div>
            <small style="color: #666; font-size: 12px;">This field updates automatically based on the address components below</small>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number</label>
              <input type="text" name="number" id="location-number" value="${location.number || ''}" 
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street</label>
              <input type="text" name="street" id="location-street" value="${location.street || ''}" 
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">City</label>
              <input type="text" name="city" id="location-city" value="${location.city || ''}" 
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">State</label>
              <input type="text" name="state" id="location-state" value="${location.state || ''}" 
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Zip Code</label>
              <input type="text" name="zipcode" id="location-zipcode" value="${location.zipcode || ''}" 
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
        </div>
      `;
    } else {
      // Save mode: Use text-only address field that auto-updates
      return `
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Full Address (Auto-Generated)</label>
          <div id="location-address" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f8f9fa; color: #6c757d; min-height: 20px; font-family: inherit;">Address will be generated from fields below</div>
          <small style="color: #666; font-size: 12px;">This field updates automatically based on the address components below</small>
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
      `;
    }
  }

  /**
   * Generate fields that are only needed for save mode
   * @param {Object} location - Location data
   * @returns {string} Save-only fields HTML
   */
  static generateSaveOnlyFieldsHTML(location = {}) {
    return `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Photo URL (Optional)</label>
        <input type="url" id="location-photo-url" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="https://example.com/photo.jpg">
        <small style="color: #666; font-size: 12px;">Add a photo URL to display an image for this location</small>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Types (Google Places)</label>
        <input type="text" id="location-types" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="restaurant, food, establishment" readonly>
        <small style="color: #666; font-size: 12px;">Automatically filled from Google Places data</small>
      </div>
    `;
  }

  /**
   * Generate form fields HTML (updated to use unified system)
   * @returns {string} Form fields HTML
   */
  static generateFormFieldsHTML() {
    return this.generateUnifiedFormFieldsHTML({}, 'save');
  }

  /**
   * Generate dropdown fields HTML (legacy - now uses unified system)
   * @returns {string} Dropdown fields HTML
   */
  static generateDropdownFieldsHTML() {
    return this.generateUnifiedDropdownFieldsHTML({}, 'save');
  }

  /**
   * Update the generated address field in real-time
   */
  static updateGeneratedAddress() {
    const numberField = document.getElementById('location-number');
    const streetField = document.getElementById('location-street');
    const cityField = document.getElementById('location-city');
    const stateField = document.getElementById('location-state');
    const zipcodeField = document.getElementById('location-zipcode');
    const addressField = document.getElementById('location-address');
    
    if (!addressField) return;
    
    // Get current values
    const number = numberField?.value?.trim() || '';
    const street = streetField?.value?.trim() || '';
    const city = cityField?.value?.trim() || '';
    const state = stateField?.value?.trim() || '';
    const zipcode = zipcodeField?.value?.trim() || '';
    
    // Build address components
    const addressParts = [];
    
    // Add street address (number + street)
    if (number || street) {
      const streetAddress = [number, street].filter(part => part).join(' ');
      if (streetAddress) addressParts.push(streetAddress);
    }
    
    // Add city
    if (city) addressParts.push(city);
    
    // Add state and zipcode
    if (state || zipcode) {
      const stateZip = [state, zipcode].filter(part => part).join(' ');
      if (stateZip) addressParts.push(stateZip);
    }
    
    // Update the address field (now a div)
    if (addressParts.length > 0) {
      addressField.textContent = addressParts.join(', ');
    } else {
      addressField.textContent = 'Address will be generated from fields below';
    }
  }

  /**
   * Generate address fields HTML (legacy - now uses unified system)
   * @returns {string} Address fields HTML
   */
  static generateAddressFieldsHTML() {
    return this.generateUnifiedAddressFieldsHTML({}, 'save');
  }
}
