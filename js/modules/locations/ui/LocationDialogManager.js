/**
 * Location Dialog Manager
 * Handles creation, display, and management of location dialogs
 */

import { LocationTemplates } from '../LocationTemplates.js';
import { SecurityUtils } from '../../../utils/SecurityUtils.js';

export class LocationDialogManager {
  
  // Initialize event delegation when class is loaded
  // this sets a global listener 
  static {
    this.initializeEventDelegation();
  }
  
  /**
   * Initialize secure event delegation for dialog interactions
   */
  static initializeEventDelegation() {
    document.addEventListener('click', (event) => {
      // Handle backdrop clicks securely
      if (event.target.dataset.dialogBackdrop === 'true') {
        // Only close if clicking the backdrop itself, not child elements
        if (event.target.classList.contains('dialog-backdrop')) {
          this.closeActiveDialog();
        }
        return;
      }
      
      // Handle close button clicks
      if (event.target.classList.contains('close-dialog')) {
        this.closeActiveDialog();
        return;
      }
    });
  }

  /**
   * Show location details dialog
   * @param {Object} location - Location data
   * @param {string} position - Dialog position ('center' or 'top-right')
   */
  static showLocationDetailsDialog(location, position = 'center') {
    const dialog = this.createDialog('location-details-dialog', 'Location Details', position);
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>Location Deets</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div class="dialog-content">
        ${LocationTemplates.generateLocationDetails(location)}
      </div>
      <div class="dialog-actions">
       <!-- <button class="btn-primary" data-action="edit" data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">Edit</button>
        <button class="btn-secondary close-dialog">Close</button>
      </div>
    `, ['data-action', 'data-place-id']);

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
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="edit-location-form" data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
        <div class="dialog-content">
          ${LocationTemplates.generateLocationForm(location)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Changes</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `, ['data-place-id', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd']);

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
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
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
    `, ['width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd']);

    this.showDialog(dialog, 'enhanced-center');
    
    // Form submit handler is now handled by LocationEventManager document listener
    console.log('✅ GPS save dialog created - form handling delegated to LocationEventManager');
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
    
    // Apply position-specific classes - no inline styles
    if (position === 'top-right') {
      dialog.className = `location-dialog dialog-top-right`;
    } else if (position === 'enhanced-center') {
      dialog.className = `dialog enhanced-center`;
    } else {
      dialog.className = `location-dialog dialog-center`;
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
      
      if (position === 'enhanced-center') {
        backdrop.className = 'dialog-backdrop enhanced-center';
        backdrop.dataset.dialogBackdrop = 'true';
        
        document.body.appendChild(backdrop);
        backdrop.appendChild(dialog);
        
        // Trigger animation
        setTimeout(() => {
          backdrop.style.opacity = '1';
        }, 10);
        
      } else {
        backdrop.className = 'dialog-backdrop standard';
        backdrop.dataset.dialogBackdrop = 'true';
        
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
