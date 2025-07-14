/**
 * Location UI Helpers
 * Utility functions for UI operations, Street View, and display helpers
 */

import { LocationsService } from './LocationsService.js';
import { LocationsUI } from './LocationsUI.js';

/**
 * Locations UI Helpers Class
 */
export class LocationsUIHelpers {

  /**
   * Load and display Street View for a location
   * @param {Object} locationData - Location data with lat/lng
   */
  static loadStreetView(locationData) {
    const container = document.getElementById('street-view-container');
    if (!container || !locationData.lat || !locationData.lng) {
      console.log('Street View container not found or no coordinates available');
      return;
    }

    try {
      // Clear existing content
      container.innerHTML = '<div style="padding: 80px 20px; text-align: center; color: #666;">Loading Street View...</div>';

      // Create Street View panorama
      const panorama = new google.maps.StreetViewPanorama(container, {
        position: { lat: parseFloat(locationData.lat), lng: parseFloat(locationData.lng) },
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        enableCloseButton: false,
        showRoadLabels: true,
        panControl: true,
        zoomControl: true,
        addressControl: false,
        fullscreenControl: false
      });

      // Handle Street View status
      panorama.addListener('status_changed', () => {
        const status = panorama.getStatus();
        if (status !== 'OK') {
          container.innerHTML = `
            <div style="padding: 80px 20px; text-align: center; color: #666;">
              <p>Street View not available for this location</p>
              <small>Coordinates: ${locationData.lat}, ${locationData.lng}</small>
            </div>
          `;
        }
      });

    } catch (error) {
      console.error('Error loading Street View:', error);
      container.innerHTML = `
        <div style="padding: 80px 20px; text-align: center; color: #666;">
          <p>Error loading Street View</p>
          <small>Please check your internet connection</small>
        </div>
      `;
    }
  }

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
        setTimeout(() => {
          this.loadStreetView({
            lat: location.lat,
            lng: location.lng
          });
        }, 100);
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
    document.getElementById('edit-location').addEventListener('click', () => this.showEditLocationDialog(dialog.currentLocation));

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
   * Generate location card HTML for display in lists
   * @param {Object} location - Location data
   * @returns {string} HTML string for location card
   */
  static generateLocationCardHTML(location) {
    const formatValue = (value) => value || '';
    const truncate = (text, length = 100) => {
      if (!text || text.length <= length) return text || '';
      return text.substring(0, length) + '...';
    };

    return `
      <div class="location-card" data-location-id="${location.id}" style="
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
        
        <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">${formatValue(location.name)}</h4>
            ${location.type ? `<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-block; margin-bottom: 8px;">${location.type}</span>` : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="view-location-btn" data-location-id="${location.id}" style="
              background: #4285f4;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            " onclick="event.stopPropagation();">View</button>
            <button class="delete-location-btn" data-location-id="${location.id}" style="
              background: #f44336;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            " onclick="event.stopPropagation();">Delete</button>
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <p style="margin: 0; color: #666; font-size: 14px;">${truncate(location.description, 150)}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #666;">
          <div>
            <strong>Address:</strong> ${truncate(location.address, 50)}
          </div>
          <div>
            <strong>City:</strong> ${formatValue(location.city)}${location.state ? `, ${location.state}` : ''}
          </div>
        </div>
        
        ${location.entry_point || location.parking || location.access ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            ${location.entry_point ? `<div><strong>Entry:</strong> ${truncate(location.entry_point, 60)}</div>` : ''}
            ${location.parking ? `<div><strong>Parking:</strong> ${truncate(location.parking, 60)}</div>` : ''}
            ${location.access ? `<div><strong>Access:</strong> ${truncate(location.access, 60)}</div>` : ''}
          </div>
        ` : ''}
        
        <div style="margin-top: 10px; font-size: 11px; color: #999;">
          Created: ${new Date(location.created_at).toLocaleDateString()}
        </div>
      </div>
    `;
  }

  /**
   * Update location card in DOM
   * @param {Object} location - Updated location data
   */
  static updateLocationCard(location) {
    const card = document.querySelector(`[data-location-id="${location.id}"]`);
    if (card) {
      const newHTML = this.generateLocationCardHTML(location);
      card.outerHTML = newHTML;
      
      // Re-attach event listeners for the new card
      import('./LocationsEventHandlers.js').then(({ LocationsEventHandlers }) => {
        LocationsEventHandlers.attachLocationCardListeners();
      });
    }
  }

  /**
   * Remove location card from DOM
   * @param {string|number} locationId - Location ID to remove
   */
  static removeLocationCard(locationId) {
    const card = document.querySelector(`[data-location-id="${locationId}"]`);
    if (card) {
      card.remove();
    }
  }

  /**
   * Show loading state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Loading message
   */
  static showLoadingState(container, message = 'Loading...') {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <div style="margin-bottom: 10px;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #4285f4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
          <p>${message}</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
    }
  }

  /**
   * Show error state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Error message
   */
  static showErrorState(container, message = 'An error occurred') {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #f44336;">
          <p style="margin: 0; font-size: 16px;">⚠️ ${message}</p>
          <button onclick="window.location.reload()" style="
            margin-top: 15px;
            background: #4285f4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Show empty state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Empty state message
   */
  static showEmptyState(container, message = 'No locations found') {
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p style="margin: 0; font-size: 16px;">📍 ${message}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Start by searching for a location on the map and saving it.</p>
        </div>
      `;
    }
  }

  /**
   * Scroll element into view smoothly
   * @param {HTMLElement} element - Element to scroll to
   */
  static scrollToElement(element) {
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  /**
   * Highlight element temporarily
   * @param {HTMLElement} element - Element to highlight
   * @param {number} duration - Highlight duration in ms
   */
  static highlightElement(element, duration = 2000) {
    if (!element) return;
    
    const originalBackground = element.style.background;
    element.style.background = '#fff3cd';
    element.style.transition = 'background 0.3s ease';
    
    setTimeout(() => {
      element.style.background = originalBackground;
    }, duration);
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data to edit
   */
  static async showEditLocationDialog(location) {
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
      document.getElementById('edit-location-form').addEventListener('submit', (e) => {
        this.handleEditLocationFormSubmit(e, location.id);
      });
      
      // Add dropdown change handlers
      LocationsFormHandlers.setupDropdownHandlers();
    });

    // Create backdrop
    import('./LocationsDialogManager.js').then(({ LocationsDialogManager }) => {
      LocationsDialogManager.createDialogBackdrop(() => this.hideEditLocationDialog());
    });
  }

  /**
   * Generate HTML for edit dialog
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateEditDialogHTML(location) {
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    return `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">Edit Location</h3>
        <button id="close-edit-dialog" style="float: right; background: none; border: none; font-size: 24px; cursor: pointer; margin-top: -30px;">&times;</button>
      </div>
      
      <form id="edit-location-form">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Name *</label>
          <input type="text" id="edit-location-name" required value="${escapeHtml(location.name || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Type</label>
          <select id="edit-location-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
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
          <textarea id="edit-location-description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Add notes about this location...">${escapeHtml(location.description || '')}</textarea>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Photo URL (Optional)</label>
          <input type="url" id="edit-location-photo-url" value="${escapeHtml(location.photo_url || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="https://example.com/photo.jpg">
          <small style="color: #666; font-size: 12px;">Add a photo URL to display an image for this location</small>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Location Types (Google Places)</label>
          <input type="text" id="edit-location-types" value="${escapeHtml(location.types || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="restaurant, food, establishment">
          <small style="color: #666; font-size: 12px;">Comma-separated types from Google Places</small>
        </div>
        
        ${this.generateEditDropdownFieldsHTML(location)}
        ${this.generateEditAddressFieldsHTML(location)}
        
        <div style="text-align: right; margin-top: 20px;">
          <button type="button" id="cancel-edit" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Cancel</button>
          <button type="submit" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Update Location</button>
        </div>
      </form>
    `;
  }

  /**
   * Generate dropdown fields HTML for edit dialog
   * @param {Object} location - Location data
   * @returns {string} Dropdown fields HTML
   */
  static generateEditDropdownFieldsHTML(location) {
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

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
        <textarea id="location-entry-point" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional entry point details or custom instructions...">${escapeHtml(location.entry_point || '')}</textarea>
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
        <textarea id="location-parking" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional parking details, restrictions, or custom information...">${escapeHtml(location.parking || '')}</textarea>
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
        <textarea id="location-access" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Additional accessibility information or custom details...">${escapeHtml(location.access || '')}</textarea>
      </div>
    `;
  }

  /**
   * Generate address fields HTML for edit dialog
   * @param {Object} location - Location data
   * @returns {string} Address fields HTML
   */
  static generateEditAddressFieldsHTML(location) {
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    return `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Address</label>
        <input type="text" id="edit-location-address" value="${escapeHtml(location.address || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 10px; margin-bottom: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number</label>
          <input type="text" id="edit-location-number" value="${escapeHtml(location.number || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street</label>
          <input type="text" id="edit-location-street" value="${escapeHtml(location.street || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">City</label>
          <input type="text" id="edit-location-city" value="${escapeHtml(location.city || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">State</label>
          <input type="text" id="edit-location-state" value="${escapeHtml(location.state || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Zip Code</label>
          <input type="text" id="edit-location-zipcode" value="${escapeHtml(location.zipcode || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
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
   * Handle edit location form submission
   * @param {Event} e - Form submit event
   * @param {string} locationId - Location ID to update
   */
  static async handleEditLocationFormSubmit(e, locationId) {
    e.preventDefault();
    
    try {
      // Get form data using edit dialog field IDs
      const formData = {
        name: document.getElementById('edit-location-name')?.value?.trim() || '',
        description: document.getElementById('edit-location-description')?.value?.trim() || '',
        type: document.getElementById('edit-location-type')?.value || '',
        address: document.getElementById('edit-location-address')?.value?.trim() || '',
        street: document.getElementById('edit-location-street')?.value?.trim() || '',
        number: document.getElementById('edit-location-number')?.value?.trim() || '',
        city: document.getElementById('edit-location-city')?.value?.trim() || '',
        state: document.getElementById('edit-location-state')?.value?.trim() || '',
        zipcode: document.getElementById('edit-location-zipcode')?.value?.trim() || '',
        photo_url: document.getElementById('edit-location-photo-url')?.value?.trim() || '',
        types: document.getElementById('edit-location-types')?.value?.trim() || '',
        entry_point: this.getCombinedFieldValue('location-entry-point-dropdown', 'location-entry-point'),
        parking: this.getCombinedFieldValue('location-parking-dropdown', 'location-parking'),
        access: this.getCombinedFieldValue('location-access-dropdown', 'location-access')
      };
      
      if (!formData.name || !formData.name.trim()) {
        alert('Please enter a location name');
        return;
      }

      // Import necessary modules
      const { LocationsService } = await import('./LocationsService.js');
      const { LocationsFormHandlers } = await import('./LocationsFormHandlers.js');
      
      // Update location
      const response = await LocationsService.updateLocation(locationId, formData);
      
      if (response) {
        console.log('Location updated successfully:', response);
        
        // Hide dialog
        this.hideEditLocationDialog();
        
        // Show success message
        LocationsFormHandlers.showSuccessMessage('Location updated successfully!');
        
        // Refresh locations list
        import('./LocationsEventHandlers.js').then(({ LocationsEventHandlers }) => {
          LocationsEventHandlers.loadAndDisplayLocations();
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
   * Get combined value from dropdown and text field (for edit dialog)
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
      return textValue ? `${dropdownValue}. ${textValue}` : dropdownValue;
    } else {
      return textValue;
    }
  }

  /**
   * Update save button state
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
}
