/**
 * Location Dialog Manager
 * Handles creation, display, and management of location dialogs
 */

import { LocationTemplates } from '../LocationTemplates.js';
import { SecurityUtils } from '../../../utils/SecurityUtils.js';
import { LocationPermissionService } from '../LocationPermissionService.js';
//import { LocationEventManager } from '../LocationEventManager.js';

export class LocationDialogManager {
  
  // Track if dialog styles have been injected
  static dialogStylesInjected = false;

 static async initMap(location) {
  
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  
  const element = document.getElementById("location-dialog-map");

  if(element){
      console.log('Map element Found');
      // The map, centered at Uluru
      const map = new Map(element, {
        zoom: 15,
        center: { lat: location.lat, lng: location.lng },
        mapId: "DEMO_MAP_ID",
      });
      
      // The marker, positioned at Uluru
      const marker = new AdvancedMarkerElement({
        map: map,
        position: { lat: location.lat, lng: location.lng },
        // content: pinTextGlyph.element,
      });
  } else {
    console.log("Map did Not Work");
    }

/*
  ZOOMS 
  1: World
  5: Landmass or continent
  10: City
  15: Streets
  20: Buildings
*/
  // Map is the map Object assigned to the map variable
}


  /**
   * Show location details dialog
   * 
   * Main view popup for location details
   * adding edit/ delete buttons 8-17-2025
   * 
   * @param {Object} location - Location data
   * @param {string} position - Dialog position ('center' or 'top-right')
   */
  static showLocationDetailsDialog(location, position = 'center') {
    // Ensure dialog styles are available
    //this.injectDialogStyles();
    
    const dialog = this.createDialog('location-details-dialog', 'Location Details', position);

    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>Location Deets</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div id="location-dialog-map" ></div>
      <div class="dialog-content"> ${LocationTemplates.generateLocationDetails(location)}</div>
      <div class="dialog-actions"> ${LocationPermissionService.canUserEditLocation(location) ? `
          
        <button class="btn-secondary btn-sm" 
                  data-action="edit" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Edit
          </button>
          <button class="btn-danger btn-sm" 
                  data-action="delete" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Delete
          </button>
        ` : 'WISH I WAS'}
      </div>
    `, ['data-action', 'data-location-id']);

    this.showDialog(dialog, position);

    // Ensure the map container is in the DOM before initializing the map
    setTimeout(() => {
      LocationDialogManager.initMap(location);
    }, 100);
 
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
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit Location</h3>
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
    // Ensure dialog styles are available
   //this.injectDialogStyles();
    
    const dialog = this.createDialog('save-location-dialog', 'Save Location', 'enhanced-center');
    
    // Debug: Log the locationData being passed to the form
    console.log('🔍 LocationDialogManager.showSaveLocationDialog() received data:', locationData);
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save New Location</h3>
          <button class="close-dialog">&times;</button>
      </div>
       <div class="dialog-content">
       <form id="save-location-form" class="save-location-form">
          ${LocationTemplates.generateLocationForm(locationData)}
       </form>
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
    const dialogs = document.querySelectorAll('.location-dialog, .dialog', '#location-details-dialog');
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
