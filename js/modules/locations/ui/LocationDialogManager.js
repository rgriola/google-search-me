/**
 * Location Dialog Manager
 * Handles creation, display, and management of location dialogs
 */

import { LocationTemplates } from '../LocationTemplates.js';

export class LocationDialogManager {
  
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
        ${LocationTemplates.generateLocationDetails(location)}
      </div>
      <div class="dialog-actions">
        <button class="btn-primary" onclick="window.Locations.showEditLocationDialog('${location.place_id || location.id}')">Edit</button>
        <button class="btn-secondary close-dialog">Close</button>
      </div>
    `;

    this.showDialog(dialog, position);
    
    // Load photos after dialog is shown
    setTimeout(() => {
      if (window.LocationsUI && window.LocationsUI.photoManager) {
        window.LocationsUI.photoManager.loadDialogPhotos(location.place_id || location.id);
      }
    }, 100);
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
          ${LocationTemplates.generateLocationForm(location)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Changes</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog, 'enhanced-center');
    
    // Load existing photos after dialog is shown
    setTimeout(() => {
      if (window.LocationsUI && window.LocationsUI.photoManager && (location.place_id || location.id)) {
        window.LocationsUI.photoManager.loadEditFormPhotos(location.place_id || location.id);
      }
    }, 100);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    const dialog = this.createDialog('save-location-dialog', 'Save Location', 'enhanced-center');
    
    // Debug: Log the locationData being passed to the form
    console.log('🔍 LocationDialogManager.showSaveLocationDialog() received data:', locationData);
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save New Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="save-location-form">
        <div class="dialog-content">
          ${LocationTemplates.generateLocationForm(locationData)}
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
      if (form && window.LocationsUI) {
        // Remove any existing event listeners to prevent duplicates
        form.removeEventListener('submit', window.LocationsUI.handleFormSubmitBound);
        
        // Add the form submit handler
        window.LocationsUI.handleFormSubmitBound = window.LocationsUI.handleFormSubmitBound || window.LocationsUI.handleFormSubmit.bind(window.LocationsUI);
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          console.log('🔍 Form submit triggered from GPS dialog');
          window.LocationsUI.handleFormSubmit(form);
        });
        
        console.log('✅ Form submit handler attached to GPS save dialog');
      } else {
        console.error('❌ Could not find save-location-form in dialog or LocationsUI not available');
      }
    }, 100);
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
    if (dialog.querySelector('form') && window.LocationsUI) {
      window.LocationsUI.setupFormEnhancements(dialog);
    }
  }

  /**
   * Close the active dialog
   */
  static closeActiveDialog() {
    const dialogs = document.querySelectorAll('.location-dialog, .dialog');
    const backdrops = document.querySelectorAll('.dialog-backdrop');
    
    dialogs.forEach(dialog => dialog.remove());
    backdrops.forEach(backdrop => backdrop.remove());
  }

  /**
   * Check if any dialog is currently open
   * @returns {boolean} True if dialog is open
   */
  static isDialogOpen() {
    return document.querySelector('.location-dialog, .dialog') !== null;
  }

  /**
   * Get the currently open dialog
   * @returns {HTMLElement|null} Dialog element or null
   */
  static getCurrentDialog() {
    return document.querySelector('.location-dialog, .dialog');
  }
}
