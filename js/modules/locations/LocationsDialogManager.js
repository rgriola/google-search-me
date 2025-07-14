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
        if (addressField) addressField.value = locationData.address || '';
        if (streetField) streetField.value = locationData.street || '';
        if (numberField) numberField.value = locationData.number || '';
        if (cityField) cityField.value = locationData.city || '';
        if (stateField) stateField.value = locationData.state || '';
        if (zipcodeField) zipcodeField.value = locationData.zipcode || '';
        if (photoUrlField) photoUrlField.value = locationData.photoUrl || '';
        if (typesField) typesField.value = locationData.types ? locationData.types.join(', ') : '';

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
    });
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
   * Generate dropdown fields HTML (entry point, parking, accessibility)
   * @returns {string} Dropdown fields HTML
   */
  static generateDropdownFieldsHTML() {
    return `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Entry Point</label>
        <select id="location-entry-point-dropdown" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
          <option value="">Select common entry point...</option>
          <option value="Main entrance">Main entrance</option>
          <option value="Side entrance">Side entrance</option>
          <option value="Back entrance">Back entrance</option>
          <option value="Loading dock">Loading dock</option>
          <option value="Parking lot entrance">Parking lot entrance</option>
          <option value="Staff entrance">Staff entrance</option>
          <option value="Security gate">Security gate</option>
          <option value="Visitor entrance">Visitor entrance</option>
          <option value="Emergency entrance">Emergency entrance</option>
          <option value="custom">Custom - specify below</option>
        </select>
        <textarea id="location-entry-point" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional entry point details or custom instructions..."></textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Parking Information</label>
        <select id="location-parking-dropdown" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
          <option value="">Select parking type...</option>
          <option value="Street parking available">Street parking available</option>
          <option value="Free parking lot">Free parking lot</option>
          <option value="Paid parking lot">Paid parking lot</option>
          <option value="Parking garage">Parking garage</option>
          <option value="Valet parking">Valet parking</option>
          <option value="Reserved media parking">Reserved media parking</option>
          <option value="No parking available">No parking available</option>
          <option value="Limited parking">Limited parking</option>
          <option value="Permit required">Permit required</option>
          <option value="Loading zone only">Loading zone only</option>
          <option value="Handicap accessible parking">Handicap accessible parking</option>
          <option value="custom">Custom - specify below</option>
        </select>
        <textarea id="location-parking" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional parking details, restrictions, or custom information..."></textarea>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Accessibility</label>
        <select id="location-access-dropdown" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
          <option value="">Select accessibility features...</option>
          <option value="Fully wheelchair accessible">Fully wheelchair accessible</option>
          <option value="Wheelchair accessible with assistance">Wheelchair accessible with assistance</option>
          <option value="Limited wheelchair access">Limited wheelchair access</option>
          <option value="Not wheelchair accessible">Not wheelchair accessible</option>
          <option value="Elevator available">Elevator available</option>
          <option value="Stairs only">Stairs only</option>
          <option value="Ramp available">Ramp available</option>
          <option value="Accessible restrooms">Accessible restrooms</option>
          <option value="Hearing loop available">Hearing loop available</option>
          <option value="Sign language interpreter needed">Sign language interpreter needed</option>
          <option value="Service animal friendly">Service animal friendly</option>
          <option value="custom">Custom - specify below</option>
        </select>
        <textarea id="location-access" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional accessibility information or custom details..."></textarea>
      </div>
    `;
  }

  /**
   * Generate address fields HTML
   * @returns {string} Address fields HTML
   */
  static generateAddressFieldsHTML() {
    return `
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
    `;
  }
}
