/**
 * Locations Dialog Helpers
 * Handles dialog creation, management, and interactions
 */

import { LocationsStreetViewHelpers } from './LocationsStreetViewHelpers.js';

/**
 * Locations Dialog Helpers Class
 */
export class LocationsDialogHelpers {

  /**
   * Show location details in a popup/modal
   * @param {Object} location - Location object
   */
  static async showLocationDetails(location) {
    try {
      // Import dialog manager
      const { LocationsDialogManager } = await import('./LocationsDialogManager.js');
      
      // Create details dialog if it doesn't exist
      let dialog = document.getElementById('location-details-dialog');
      if (!dialog) {
        dialog = this.createLocationDetailsDialog();
      }

      // Populate dialog with location data
      this.populateLocationDetails(dialog, location);

      // Show dialog
      dialog.style.display = 'block';
      
      // Create backdrop
      LocationsDialogManager.createDialogBackdrop(() => this.hideLocationDetails());

      // Load Street View if coordinates available
      if (location.lat && location.lng) {
        LocationsStreetViewHelpers.initializeLocationStreetView(location);
      }

    } catch (error) {
      console.error('Error showing location details:', error);
      alert('Error displaying location details');
    }
  }

  /**
   * Create location details dialog
   * @returns {HTMLElement} Dialog element
   */
  static createLocationDetailsDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'location-details-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      padding: 20px;
      max-width: 700px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      z-index: 10000;
      display: none;
      font-family: Arial, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
        <h3 id="location-details-title" style="margin: 0; color: #333;">Location Details</h3>
        <button id="close-details-dialog" style="float: right; background: none; border: none; font-size: 24px; cursor: pointer; margin-top: -30px;">&times;</button>
      </div>
      
      <div id="location-details-content">
        <!-- Content will be populated by populateLocationDetails -->
      </div>
      
      <div id="street-view-container" style="margin: 15px 0; height: 200px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5;">
        <div style="padding: 80px 20px; text-align: center; color: #666;">
          Loading Street View...
        </div>
      </div>
      
      <div style="text-align: right; margin-top: 20px;">
        <button id="edit-location" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Edit</button>
        <button id="close-details" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Close</button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    document.getElementById('close-details-dialog').addEventListener('click', () => this.hideLocationDetails());
    document.getElementById('close-details').addEventListener('click', () => this.hideLocationDetails());
    document.getElementById('edit-location').addEventListener('click', () => {
      console.log('🔍 Edit button clicked, current location:', dialog.currentLocation);
      this.showEditLocationDialog(dialog.currentLocation);
    });

    return dialog;
  }

  /**
   * Populate location details dialog with data
   * @param {HTMLElement} dialog - Dialog element
   * @param {Object} location - Location data
   */
  static populateLocationDetails(dialog, location) {
    const title = dialog.querySelector('#location-details-title');
    const content = dialog.querySelector('#location-details-content');

    if (title) {
      title.textContent = location.name || 'Location Details';
    }

    if (content) {
      content.innerHTML = this.generateLocationDetailsHTML(location);
    }

    // Store location data for edit functionality
    dialog.currentLocation = location;
  }

  /**
   * Generate HTML for location details
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationDetailsHTML(location) {
    const formatValue = (value) => value || 'Not specified';
    const formatDate = (dateString) => {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Basic Information</h4>
          <p><strong>Name:</strong> ${formatValue(location.name)}</p>
          <p><strong>Type:</strong> ${formatValue(location.type)}</p>
          <p><strong>Description:</strong> ${formatValue(location.description)}</p>
          <p><strong>Created:</strong> ${formatDate(location.created_at)}</p>
          <p><strong>Updated:</strong> ${formatDate(location.updated_at)}</p>
        </div>
        
        <div>
          <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Address</h4>
          <p><strong>Full Address:</strong> ${formatValue(location.address)}</p>
          <p><strong>Street:</strong> ${formatValue(location.number)} ${formatValue(location.street)}</p>
          <p><strong>City:</strong> ${formatValue(location.city)}</p>
          <p><strong>State:</strong> ${formatValue(location.state)}</p>
          <p><strong>Zip Code:</strong> ${formatValue(location.zipcode)}</p>
          ${location.lat && location.lng ? `<p><strong>Coordinates:</strong> ${location.lat}, ${location.lng}</p>` : ''}
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Access Information</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div>
            <p><strong>Entry Point:</strong></p>
            <p style="font-size: 14px; color: #666;">${formatValue(location.entry_point)}</p>
          </div>
          <div>
            <p><strong>Parking:</strong></p>
            <p style="font-size: 14px; color: #666;">${formatValue(location.parking)}</p>
          </div>
          <div>
            <p><strong>Accessibility:</strong></p>
            <p style="font-size: 14px; color: #666;">${formatValue(location.access)}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Hide location details dialog
   */
  static hideLocationDetails() {
    const dialog = document.getElementById('location-details-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
    
    const backdrop = document.getElementById('dialog-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data to edit
   */
  static async showEditLocationDialog(location) {
    console.log('🔍 showEditLocationDialog called with:', location);
    try {
      // Hide the details dialog
      this.hideLocationDetails();
      
      // Import the dialog manager and show edit form
      const { LocationsDialogManager } = await import('./LocationsDialogManager.js');
      
      // Create edit dialog with pre-filled data
      this.createEditLocationDialog(location);
      
    } catch (error) {
      console.error('Error showing edit dialog:', error);
      alert('Error opening edit dialog');
    }
  }

  /**
   * Create edit location dialog with pre-filled data
   * @param {Object} location - Location data to edit
   */
  static createEditLocationDialog(location) {
    // Debug: Log the location object to see what data we have
    console.log('🔍 Edit Dialog - Location data received:', location);
    console.log('🔍 Location properties:', Object.keys(location));
    console.log('🔍 entry_point value:', location.entry_point);
    console.log('🔍 parking value:', location.parking);
    console.log('🔍 access value:', location.access);
    
    // Remove existing edit dialog if it exists
    const existingDialog = document.getElementById('edit-location-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }

    const dialog = document.createElement('div');
    dialog.id = 'edit-location-dialog';
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
      display: block;
      font-family: Arial, sans-serif;
    `;

    dialog.innerHTML = this.generateEditDialogHTML(location);
    document.body.appendChild(dialog);

    // Add event listeners
    document.getElementById('close-edit-dialog').addEventListener('click', () => this.hideEditLocationDialog());
    document.getElementById('cancel-edit').addEventListener('click', () => this.hideEditLocationDialog());
    
    // Setup form submission handler
    import('./LocationsFormHandlers.js').then(({ LocationsFormHandlers }) => {
      const form = document.getElementById('edit-location-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          LocationsFormHandlers.handleLocationFormSubmit(e);
        });
      }
    });

    // Create backdrop
    import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
      LocationsDialogManager.createDialogBackdrop(() => this.hideEditLocationDialog());
    });
  }

  /**
   * edit-location-form HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateEditDialogHTML(location) {
    // Use the unified form generator directly
    const formFields = this.generateUnifiedEditFormHTML(location);
    
    return `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">Edit Location</h3>
        <button id="close-edit-dialog" style="float: right; background: none; border: none; font-size: 24px; cursor: pointer; margin-top: -30px;">&times;</button>
      </div>
      
      <form id="edit-location-form" data-location-id="${location.place_id || location.id || ''}">
        ${formFields}
        
        <!-- Hidden fields for required data -->
        <input type="hidden" name="place_id" value="${location.place_id || location.id || ''}">
        <input type="hidden" name="lat" value="${location.lat || ''}">
        <input type="hidden" name="lng" value="${location.lng || ''}">
        <input type="hidden" name="address" value="${location.address || ''}">
        <input type="hidden" name="saved_count" value="${location.saved_count || ''}">
        <input type="hidden" name="created_at" value="${location.created_at || ''}">
        
        <div style="text-align: right; margin-top: 20px;">
          <button type="submit" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Save Changes</button>
          <button type="button" id="cancel-edit" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      </form>
    `;
  }

  /**
   * Generate unified edit form HTML (directly inline since we can't import in template literals)
   * @param {Object} location - Location data
   * @returns {string} Form HTML
   */
  static generateUnifiedEditFormHTML(location) {
    // Define all possible values for each field (same as in LocationsDialogManager)
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

    return `
      <!-- Basic Information -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Name</label>
          <input type="text" name="name" value="${location.name || ''}" required 
                 style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Type</label>
          <select name="type" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">Select location type...</option>
            <option value="Live Reporter" ${location.type === 'Live Reporter' ? 'selected' : ''}>Live Reporter</option>
            <option value="Live Anchor" ${location.type === 'Live Anchor' ? 'selected' : ''}>Live Anchor</option>
            <option value="Live Stakeout" ${location.type === 'Live Stakeout' ? 'selected' : ''}>Live Stakeout</option>
            <option value="Live Presser" ${location.type === 'Live Presser' ? 'selected' : ''}>Live Presser</option>
            <option value="Interview" ${location.type === 'Interview' ? 'selected' : ''}>Interview</option>
          </select>
        </div>
      </div>
      
      <!-- Description -->
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description</label>
        <textarea name="description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Add notes about this location...">${location.description || ''}</textarea>
      </div>
      
      <!-- Access Information -->
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
      
      <!-- Address Information -->
      <div style="margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Address Details</h4>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Full Address:</label>
          <input type="text" name="full_address" value="${location.address || ''}" 
                 style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 15px; margin-bottom: 10px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street Number:</label>
            <input type="text" name="number" value="${location.number || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street Name:</label>
            <input type="text" name="street" value="${location.street || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 10px;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">City:</label>
            <input type="text" name="city" value="${location.city || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">State:</label>
            <input type="text" name="state" value="${location.state || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Zip Code:</label>
            <input type="text" name="zipcode" value="${location.zipcode || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Hide edit location dialog
   */
  static hideEditLocationDialog() {
    const dialog = document.getElementById('edit-location-dialog');
    if (dialog) {
      dialog.remove();
    }
    
    const backdrop = document.getElementById('dialog-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  /**
   * Create confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback for confirmation
   * @param {Function} onCancel - Callback for cancellation
   */
  static createConfirmationDialog(message, onConfirm, onCancel = null) {
    const dialog = document.createElement('div');
    dialog.id = 'confirmation-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      padding: 20px;
      max-width: 400px;
      width: 90%;
      z-index: 10001;
      font-family: Arial, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="margin-bottom: 20px;">
        <p style="margin: 0; color: #333; font-size: 16px;">${message}</p>
      </div>
      
      <div style="text-align: right;">
        <button id="confirm-action" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Confirm</button>
        <button id="cancel-action" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    document.getElementById('confirm-action').addEventListener('click', () => {
      dialog.remove();
      const backdrop = document.getElementById('dialog-backdrop');
      if (backdrop) backdrop.remove();
      if (onConfirm) onConfirm();
    });

    document.getElementById('cancel-action').addEventListener('click', () => {
      dialog.remove();
      const backdrop = document.getElementById('dialog-backdrop');
      if (backdrop) backdrop.remove();
      if (onCancel) onCancel();
    });

    // Create backdrop
    import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
      LocationsDialogManager.createDialogBackdrop(() => {
        dialog.remove();
        if (onCancel) onCancel();
      });
    });
  }
}

// Export individual functions for backward compatibility
export const showLocationDetails = LocationsDialogHelpers.showLocationDetails.bind(LocationsDialogHelpers);
export const createLocationDetailsDialog = LocationsDialogHelpers.createLocationDetailsDialog.bind(LocationsDialogHelpers);
export const hideLocationDetails = LocationsDialogHelpers.hideLocationDetails.bind(LocationsDialogHelpers);
export const showEditLocationDialog = LocationsDialogHelpers.showEditLocationDialog.bind(LocationsDialogHelpers);
export const createEditLocationDialog = LocationsDialogHelpers.createEditLocationDialog.bind(LocationsDialogHelpers);
export const hideEditLocationDialog = LocationsDialogHelpers.hideEditLocationDialog.bind(LocationsDialogHelpers);
