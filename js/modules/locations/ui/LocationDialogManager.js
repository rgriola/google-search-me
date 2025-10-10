/**
 * Location Dialog Manager
 * Handles creation, display, and management of location dialogs
 */

import { LocationTemplates } from '../LocationTemplates.js';
import { SecurityUtils } from '../../../utils/SecurityUtils.js';
import { LocationPermissionService } from '../LocationPermissionService.js';

import { debug, DEBUG } from '../../../debug.js';

// File identifier for debug logging
const FILE = 'LOCATION_DIALOG_MANAGER';

export class LocationDialogManager {
  
  // Track if dialog styles have been injected
  static dialogStylesInjected = false;
  

 static async initMap(location) {
  // This controls the map for the 'View' button response. 
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
  
  const element = document.getElementById("location-dialog-map");

  if(element){
     debug(FILE, 'Map element found');
      /*
            ZOOMS
            1: World
            5: Landmass or continent
            10: City
            15: Streets
            20: Buildings
          */
            // Map is the map Object assigned to the map variable
      
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
      //////////////////////////////////////////////////////
      // Center map if coordinates are available
      const { MapService } = await import('../../../modules/maps/MapService.js');
      await MapService.centerMap(Number(location.lat), Number(location.lng), 16);
      debug(FILE, '✅ Map centered on location');
        
    } else {
        debug(FILE, "Map did Not Work", null, 'warn');
      }
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
  static showLocationDetailsDialog(location) {
    
    const dialog = this.createDialog('location-details-dialog', 'location-dialog');

    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>Location Deets</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div id="location-dialog-map"></div>
      <div class="dialog-content" > ${LocationTemplates.generateLocationDetails(location)}</div>
      <div class="dialog-actions" > ${LocationPermissionService.canUserEditLocation(location) ? ` 
        <button class="btn-primary" data-action="edit" data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Update Location
          </button>
          <button class="btn-danger" data-action="delete" data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Delete Location
          </button>
        ` : 'WISH I WAS'}
      </div>
    `, ['data-action', 'data-location-id']);

    this.showDialog(dialog);

    // Ensure the map container is in the DOM before initializing the map
    setTimeout(() => {
      LocationDialogManager.initMap(location);
    }, 100);
    
    // loads photo if there are some
    this.loadPhotosWithDelay('dialog', location.place_id);

  }


  /**
   * Show edit location dialog
   * @param {Object} location - Location data
   */
  static showEditLocationDialog(location) {
    // this needs to be attached to edit-location-panel
    const dialog = this.createDialog('edit-location-dialog', 'location-dialog');
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        Edit Location
        </h3>
        <button class="close-dialog">&times;</button>
      </div>

      <div id="location-dialog-map" ></div>

      <form id="edit-location-form" data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
        <div class="dialog-content">
          ${LocationTemplates.generateLocationForm(location)}
        
        <div class="dialog-actions">
            <button type="submit" class="btn-primary">Update</button>
            <button type="button" class="btn-secondary" data-action="cancel" >Cancel</button>
        </div>

      </form>
      </div>
    `, ['data-place-id', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd']);
    
    // this handles the edit dialog

    this.showDialog(dialog);

    // Ensure the map container is in the DOM before initializing the map
    setTimeout(() => {
      LocationDialogManager.initMap(location);
    }, 100);

    // Load existing photos after dialog is shown
    this.loadPhotosWithDelay('edit', location.place_id);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(location = {}) {
    const dialog = this.createDialog('save-location-dialog', 'location-dialog');
    debug(FILE, '🔍 LDM.showSaveLocationDialog():', location);
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> 
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          Save New Location</h3>
          <button class="close-dialog">&times;</button>
      </div>

      <div id="location-dialog-map"></div>

      <div class="dialog-content">
        <form id="save-location-form" class="save-location-form">
          ${LocationTemplates.generateLocationForm(location)}
          
          <div class="dialog-actions">
            <button type="submit" class="btn-primary">Save Location</button>
            <button type="button" class="btn-secondary" data-action="cancel" >Cancel</button>
          </div>

        </form>
      </div>
    `, ['width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd']);

    this.showDialog(dialog);
    
    // Ensure the map container is in the DOM before initializing the map
    setTimeout(() => {
      LocationDialogManager.initMap(location);
    }, 200);
    
    // Form submit handler is now handled by LocationEventManager document listener
    debug(FILE, '✅ GPS save dialog created - form handling delegated to LocationEventManager');
  }

  static dialogActionsButtons(){
    const dialogActionsButtons = '';
  }

  /**
 *  helper function for view and edit dialogs for the photos.
 */
  static loadPhotosWithDelay(type, id) {
  setTimeout(() => {
    if (window.LocationsUI && window.LocationsUI.photoManager && id) {
      if (type === 'edit') {
        window.LocationsUI.photoManager.loadEditFormPhotos(id);
      } else if (type === 'dialog') {
        window.LocationsUI.photoManager.loadDialogPhotos(id);
        }
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
  static createDialog(id, classHere) {
    // Remove existing dialog
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
      } 

    const dialog = document.createElement('div');
          dialog.id = id;
          dialog.className = classHere;

    return dialog;
  }

  /**
   * Show a dialog
   * @param {HTMLElement} dialog - Dialog element
   * @param {string} position - Dialog position ('center', 'enhanced-center', or 'top-right')
   */
  static showDialog(dialog) {

      const dialogID = dialog.id;
      debug(FILE, 'dialogID:', dialogID );

      switch(dialogID){
        case  'location-details-dialog':
            // Hide Saved Locations - not remove
            this.hideSavedLocationsPanel();
            // grab the view location panel to attach to. 
            const moveDialogToRight = document.getElementById('view-location-panel');
            // append the dialog box to the panel
            moveDialogToRight.appendChild(dialog);
            // show the dialog in the sidebar.
            moveDialogToRight.style.display = 'block';
            moveDialogToRight.classList.add('active');
            debug(FILE, 'TEMPORARY BREAK');
            
              if (window.SidebarManager.expand){
                window.SidebarManager.expand();
                }
           break;

        case  'edit-location-dialog':
            // remove the view - only path to edit. 
            this.removeLocationDetailsDialog();
            this.hideViewLocationPanel();

          // grab the view location panel to attach to. 
            const editLocationDialogToTheRight = document.getElementById('edit-location-panel');
                  // append the dialog box to the panel
                  editLocationDialogToTheRight.appendChild(dialog);
                  // show the dialog in the sidebar.
                  editLocationDialogToTheRight.style.display = 'block';
                  editLocationDialogToTheRight.classList.add('active');

            // Expand sidebar wide for better editing experience
                if (window.SidebarManager.expandSidebarWide) {
                    window.SidebarManager.expandSidebarWide();
                  }
          break;

        case  'save-location-dialog':
          const saveMoveDialogToRight = document.getElementById('save-location-panel');
                this.hideSavedLocationsPanel();
                saveMoveDialogToRight.appendChild(dialog);
                saveMoveDialogToRight.style.display = 'block';
                saveMoveDialogToRight.classList.add('active');

                if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
                window.SidebarManager.expandSidebarWide();
                }

          break;
        
        default:
            break;
      }
            // for edit and save only not view. 
            // Setup form enhancements if this dialog contains a form
            if (dialog.querySelector('form') && window.LocationsUI) {
                window.LocationsUI.setupFormEnhancements(dialog);
              }
  }

   /**
   * Close the active dialog
   */
  // this also needs to handle save location/edit location
  static closeActiveDialog() {
    
    // this searches the entire DOM for active. Need to only search from container back. 

    // close to the active dialog box. 

    // if location-details-dialog is open close it aka 'view'
    //. --- activate view-locations (list)
    // if edit-location-dialog is open close it. 'edit'
    //. ---- activate view-locations (list)
    // if save-location-dialog is open close it 'save'
    // --- activate view-locations (list)

    // sidebar-content-container

    const searchSidebarContentContainer = document.getElementById('sidebar-content-container');
    const activeDialog = searchSidebarContentContainer.querySelector('.active');

    debug(FILE, 'The Active Dialog:', activeDialog ? activeDialog.id : 'none');
    
    switch(activeDialog.id){
      case 'view-location-panel':
          // close locations-details-dialog - removes the entire element
          this.removeLocationDetailsDialog();
          // de activate panel
          this.hideViewLocationPanel();
          // back to original layout
          this.showSavedLocationsPanel();

           // Restore sidebar to default app loading state when closing edit-profile
      if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
          window.SidebarManager.resetToInitialLayout();
          }
          break;

      case 'edit-location-panel':
          // close edit-location-dialog
          const closeEditLocationPanel = document.getElementById('edit-location-dialog');
                closeEditLocationPanel.remove();

          const editLocationPanel = document.getElementById('edit-location-panel');
                editLocationPanel.classList.remove('active');
          this.showSavedLocationsPanel();
          
               // Restore sidebar to default app loading state when closing edit-profile
          if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
              window.SidebarManager.resetToInitialLayout();
          }
          break;

      case 'save-location-panel':
            const closeSaveLocationPanel = document.getElementById('save-location-dialog');
                  closeSaveLocationPanel.remove();
              
            const saveLocationPanel = document.getElementById('save-location-panel')
                  saveLocationPanel.classList.remove('active');

            this.showSavedLocationsPanel();
                  // Restore sidebar to default app loading state when closing edit-profile
            if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
                window.SidebarManager.resetToInitialLayout();
                }
        break;
      }  
   }
  
  static removeLocationDetailsDialog(){
                const moveDialogToRight = document.getElementById('location-details-dialog');
                moveDialogToRight.remove();
          }

  static hideViewLocationPanel(){
         // Hide saved locations panel
        const viewLocationPanel = document.getElementById('view-location-panel');
        if (viewLocationPanel) {
            viewLocationPanel.classList.remove('active');
            viewLocationPanel.style.display = 'none';
            debug(FILE, '🔍 HIDE View Location Panel');
        }
    }

  static hideSavedLocationsPanel(){
         // Hide saved locations panel
        const savedLocationsPanel = document.getElementById('saved-locations-panel');
        if (savedLocationsPanel) {
            savedLocationsPanel.classList.remove('active');
            savedLocationsPanel.style.display = 'none';
            debug(FILE, '🔍 HIDE Saved Location Panel');
        }
    }

    static showSavedLocationsPanel() {
        const savedLocationsPanel = document.getElementById('saved-locations-panel');
        if (savedLocationsPanel) {
            savedLocationsPanel.style.display = 'block';
            savedLocationsPanel.classList.add('active');
            debug(FILE, '🔍 SHOW Saved Location Panel');
        }
    }

  /**
   * Check if any dialog is currently open
   * @returns {boolean} True if dialog is open
   */
  static isDialogOpen() {
    // this means there is a dialog open
    return document.querySelector('.location-dialog, .dialog') !== null;
    }

  /**
   * Get the currently open dialog
   * @returns {HTMLElement|null} Dialog element or null
   */
  static getCurrentDialog() {
    // this returns the 
    return document.querySelector('.location-dialog, .dialog');
    }
}