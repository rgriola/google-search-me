/**
 * LocationEventManager
 * Handles all event management for location UI operations
 * 
 * Responsibilities:
 * - Event delegation for location actions
 * - Location interaction management
 * - Clean interface between UI and data operations
 */

import { MapService } from '../maps/MapService.js';
// used on line 191 

export class LocationEventManager {

  
  /**
   * Setup event listeners for location UI
   */
  static setupEventListeners() {
    console.log('🎧 Setting up LocationEventManager event listeners');
    
    // Delegate location action clicks
    document.addEventListener('click', (event) => {
      LocationEventManager.handleLocationActionClick(event);
    });
    
    // Handle dialog close buttons
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('close-dialog')) {
        LocationEventManager.closeActiveDialog();
      }
    });

    // Handle form submissions - this is critical for save/edit functionality
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.id === 'save-location-form' || form.id === 'edit-location-form') {
        event.preventDefault();
        LocationEventManager.handleFormSubmit(form);
      }
    });

    // Handle photo file input changes
    document.addEventListener('change', (event) => {
      if (event.target.type === 'file' && event.target.id && event.target.id.includes('photo-file-input')) {
        LocationEventManager.handlePhotoFileChange(event);
      }
    });

    // Handle drop zone clicks to trigger file input
    document.addEventListener('click', (event) => {
      if (event.target.closest('.photo-drop-zone')) {
        const dropZone = event.target.closest('.photo-drop-zone');
        const dropZoneId = dropZone.id;
        // Extract mode from drop zone ID (e.g., "edit-photo-drop-zone" -> "edit")
        const mode = dropZoneId.split('-')[0];
        const fileInput = document.getElementById(`${mode}-photo-file-input`);
        if (fileInput) {
          console.log('[LocationEventManager] Drop zone clicked, triggering file input for mode:', mode);
          fileInput.click();
        }
      }
    });

    // Handle escape key to close dialogs
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        LocationEventManager.closeActiveDialog();
      }
    });
  }

  /**
   * Handle location action clicks (view, edit, delete)
   * @param {Event} event - Click event
   */
  static handleLocationActionClick(event) {
    // Handle clicks on location items
    const locationItem = event.target.closest('.location-item');
    if (locationItem) {
      const action = event.target.dataset.action;
      // Try both data-location-id (new secure format) and data-place-id (legacy)
      const placeId = event.target.dataset.locationId || locationItem.dataset.placeId;
      
      if (!action || !placeId) return;
      
      event.preventDefault();
      
      switch (action) {
        case 'view':
          LocationEventManager.handleViewLocation(placeId);
          break;
        case 'edit':
          LocationEventManager.handleEditLocation(placeId);
          break;
        case 'delete':
          LocationEventManager.handleDeleteLocation(placeId);
          break;
        case 'refreshLocations':
          LocationEventManager.handleRefreshLocations();
          break;
        case 'closeDialog':
          LocationEventManager.handleCloseDialog(event.target);
          break;
      }
      return;
    }

    // Handle clicks on dialog buttons (like edit button in details dialog)
    if (event.target.dataset.action && (event.target.dataset.locationId || event.target.dataset.placeId)) {
      const action = event.target.dataset.action;
      // Try both data-location-id (new secure format) and data-place-id (legacy)
      const placeId = event.target.dataset.locationId || event.target.dataset.placeId;
      
      event.preventDefault();
      
      switch (action) {
        case 'edit':
          LocationEventManager.handleEditLocation(placeId);
          break;
        case 'refreshLocations':
          LocationEventManager.handleRefreshLocations();
          break;
        case 'closeDialog':
          LocationEventManager.handleCloseDialog(event.target);
          break;
      }
    }
  }

  /**
   * Handle photo file input changes
   * @param {Event} event - Change event from file input
   */
  static handlePhotoFileChange(event) {
    console.log('[LocationEventManager] handlePhotoFileChange - called with files:', event.target.files);
    console.log('[LocationEventManager] Event target ID:', event.target.id);
    console.log('[LocationEventManager] Event target element:', event.target);
    
    if (event.target.files && event.target.files.length > 0) {
      // Extract mode from file input ID (e.g., "edit-photo-file-input" -> "edit")
      const mode = event.target.id.split('-')[0]; // Gets "edit" or "save"
      console.log('[LocationEventManager] Extracted mode from input ID:', mode);
      
      // Additional check to make sure this is the right element
      if (!event.target.id.includes('photo-file-input')) {
        console.warn('[LocationEventManager] Skipping - not a photo file input');
        return;
      }
      
      // Use existing LocationPhotoManager to handle the file
      if (window.LocationPhotoManager && typeof window.LocationPhotoManager.handlePhotoFile === 'function') {
        console.log('[LocationEventManager] Delegating to LocationPhotoManager.handlePhotoFile with mode:', mode);
        window.LocationPhotoManager.handlePhotoFile(event, mode);
      } else {
        console.error('[LocationEventManager] LocationPhotoManager.handlePhotoFile not available');
      }
    }
  }

  /**
   * Handle view location action
   * @param {string} placeId - The place ID to view
   */
  static async handleViewLocation(placeId) {
    try {
      console.log('👀 === VIEW LOCATION DEBUG START ===');
      console.log('👀 LocationEventManager.handleViewLocation() called for placeId:', placeId);
      
      const { LocationsUI } = await import('./LocationsUI.js');
      const { LocationDialogManager } = await import('./ui/LocationDialogManager.js');
      console.log('👀 LocationsUI.getLocationById available:', typeof LocationsUI.getLocationById);
      
      const location = LocationsUI.getLocationById(placeId);
      // calls similar function in StateManager. 

      // Center the map on the location first
      if (location.lat && location.lng) {
        console.log('🗺️ Centering map on location coordinates:', location.lat, location.lng);
        try {
          // Import services for map centering and marker highlighting
        //  const { MarkerService } = await import('../maps/MarkerService.js');
        //  const { Locations } = await import('./Locations.js');
          
          // Center the map and highlight marker (if exists)
         // Locations.viewLocationOnMap(location);
          
          // Import MapService and center the map on the location
          const { MapService } = await import('../maps/MapService.js');
          await MapService.centerMap(parseFloat(location.lat), parseFloat(location.lng), 16);
          
          console.log('✅ Map centered and marker highlighted successfully');
        } catch (mapError) {
          console.error('❌ Error centering map:', mapError);
          // Continue with showing the dialog even if map centering fails
        }
      } else {
        console.warn('⚠️ Location missing coordinates for map centering');
      }
      // Show the location view dialog - this is the larger dialog with details and 
      // the ability to call the edit location window. 
      LocationDialogManager.showLocationDetailsDialog(location, 'center');

      console.log('👀 === VIEW LOCATION DEBUG END (SUCCESS) ===');
      
    } catch (error) {
      console.error('❌ Error in handleViewLocation:', error);
      console.error('❌ Error stack:', error.stack);
      console.log('👀 === VIEW LOCATION DEBUG END (ERROR) ===');
      LocationEventManager.showNotification('Error viewing location', 'error');
    }
  }

  /**
   * Handle edit location action
   * @param {string} placeId - The place ID to edit
   */
  static async handleEditLocation(placeId) {
    try {
      console.log('✏️ LocationEventManager.handleEditLocation() called for placeId:', placeId);
      
      const { LocationsUI } = await import('./LocationsUI.js');
      const location = LocationsUI.getLocationById(placeId);
      
      if (!location) {
        console.error('❌ Location not found for placeId:', placeId);
        LocationEventManager.showNotification('Location not found', 'error');
        return;
      }
      
      console.log('📝 Editing location:', location);
      LocationsUI.showEditLocationDialog(location);
      
    } catch (error) {
      console.error('❌ Error in handleEditLocation:', error);
      LocationEventManager.showNotification('Error editing location', 'error');
    }
  }

  /**
   * Handle delete location action
   * @param {string} placeId - The place ID to delete
   */
  static async handleDeleteLocation(placeId) {
    try {
      console.log('🗑️ LocationEventManager.handleDeleteLocation() called for placeId:', placeId);
      
      const { LocationsUI } = await import('./LocationsUI.js');
      const location = LocationsUI.getLocationById(placeId);
      
      if (!location) {
        console.error('❌ Location not found for placeId:', placeId);
        LocationEventManager.showNotification('Location not found', 'error');
        return;
      }

      // Use async import for NotificationService to avoid import conflicts
      try {
        const { NotificationService } = await import('../ui/NotificationService.js');
        
        // Use NotificationService with proper callback pattern
        NotificationService.showConfirmation({
          message: `Delete "${location.name || location.title}"?`,
          title: 'Confirm Deletion',
          type: 'warning',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: async () => {
            try {
              console.log('🗑️ Deleting location:', location);
              await LocationsUI.deleteLocation(placeId);
              LocationEventManager.showNotification('Location deleted successfully', 'success');
            } catch (error) {
              console.error('❌ Error during deletion:', error);
              LocationEventManager.showNotification('Error deleting location', 'error');
            }
          },
          onCancel: () => {
            console.log('🚫 Location deletion cancelled by user');
            // No notification needed for cancel
          }
        });
        
      } catch (error) {
        console.error('❌ Error loading NotificationService, using simple confirm:', error);
        // Fallback to simple confirmation
        const confirmed = confirm(`Delete "${location.name || location.title}"? This action cannot be undone.`);
        
        if (confirmed) {
          console.log('🗑️ Deleting location:', location);
          await LocationsUI.deleteLocation(placeId);
          LocationEventManager.showNotification('Location deleted successfully', 'success');
        } else {
          console.log('🚫 Location deletion cancelled by user');
        }
      }
      
    } catch (error) {
      console.error('❌ Error in handleDeleteLocation:', error);
      LocationEventManager.showNotification('Error deleting location', 'error');
    }
  }

  /**
   * Handle form submission - proper implementation
   * @param {HTMLFormElement} form - The form being submitted
   */
  static async handleFormSubmit(form) {
    try {
      console.log('📝 === FORM SUBMISSION DEBUG START ===');
      console.log('📝 LocationEventManager.handleFormSubmit() called with form:', form);
      console.log('📝 Form ID:', form.id);
      console.log('📝 Form action:', form.action);
      console.log('📝 Form method:', form.method);
      
      // Debug: Check all form elements before extraction
      const formElements = form.elements;
      console.log('📝 Form has', formElements.length, 'elements:');
      for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        console.log(`📝 Element ${i}: name="${element.name}", type="${element.type}", value="${element.value}"`);
      }
      
      // Import required modules
      const { LocationFormManager } = await import('./ui/LocationFormManager.js');
      
      // Extract and validate form data using the proper extraction method
      const formResult = LocationFormManager.extractFormData(form);
      const { data: locationData, validation } = formResult;
      
      console.log('📋 === EXTRACTED DATA ===');
      console.log('📋 Location data keys:', Object.keys(locationData));
      console.log('📋 Location data values:', locationData);
      console.log('📋 Validation result:', validation);
      
      // Detailed check of required fields
      const requiredServerFields = ['type', 'entry_point', 'parking', 'access'];
      console.log('📋 === REQUIRED FIELD CHECK ===');
      requiredServerFields.forEach(field => {
        const value = locationData[field];
        const isValid = value && value.trim() !== '';
        console.log(`📋 ${field}: "${value}" (valid: ${isValid})`);
      });
      
      // Show validation errors if any
      if (!validation.isValid) {
        console.log('❌ Validation failed, showing errors:', validation.errors);
        LocationFormManager.showFormErrors(validation.errors, form);
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        LocationFormManager.showFormWarnings(validation.warnings, form);
      }

      console.log('📋 === PROCEEDING WITH SUBMISSION ===');
      
      // Handle save vs edit
      if (form.id === 'edit-location-form') {
        console.log('📝 Handling edit form submission');
        await LocationEventManager.handleEditFormSubmit(form, locationData);
      } else {
        console.log('📝 Handling save form submission');
        await LocationEventManager.handleSaveFormSubmit(form, locationData);
      }
      
      // Close dialog with small delay to ensure notification shows
      setTimeout(() => {
        LocationEventManager.closeActiveDialog();
      }, 500);
      
      console.log('📝 === FORM SUBMISSION DEBUG END ===');
      
    } catch (error) {
      console.error('❌ Error in handleFormSubmit:', error);
      console.error('❌ Error stack:', error.stack);
      LocationEventManager.showNotification(`Error saving location: ${error.message}`, 'error');
    }
  }

  /**
   * Handle edit form submission
   * @param {HTMLFormElement} form - Form element
   * @param {Object} locationData - Form data
   */
  static async handleEditFormSubmit(form, locationData) {
    const placeId = form.getAttribute('data-place-id');
    console.log('🔍 === EDIT FORM SUBMISSION DEBUG START ===');
    console.log('🔍 Updating existing location with place_id:', placeId);
    console.log('🔍 Pre-update global pendingPhotos:', window.pendingPhotos);
    
    await window.Locations.updateLocation(placeId, locationData);
    
    console.log('🔍 === POST-UPDATE PHOTO CHECK ===');
    console.log('🔍 Global window.pendingPhotos:', window.pendingPhotos);
    console.log('🔍 Global window.pendingEditPhotos:', window.pendingEditPhotos);
    console.log('🔍 Type of window.pendingEditPhotos:', typeof window.pendingEditPhotos);
    console.log('🔍 Is Array:', Array.isArray(window.pendingEditPhotos));
    console.log('🔍 Length:', window.pendingEditPhotos ? window.pendingEditPhotos.length : 'N/A');
    
    // Upload any pending photos after location is updated (CHECK EDIT PHOTOS FOR EDIT MODE)
    console.log('🔍 Checking for pending photos after edit...', {
      pendingPhotos: window.pendingPhotos,
      pendingEditPhotos: window.pendingEditPhotos,
      pendingEditPhotosLength: window.pendingEditPhotos ? window.pendingEditPhotos.length : 0,
      placeId: placeId,
      photoManagerAvailable: !!window.LocationPhotoManager,
      uploadMethodAvailable: !!(window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos)
    });
    
    // Debug: Check what happens if we force the condition (USE EDIT PHOTOS FOR EDIT MODE)
    console.log('🔍 Condition check results:');
    console.log('  - window.pendingEditPhotos exists:', !!window.pendingEditPhotos);
    console.log('  - pendingEditPhotos.length > 0:', window.pendingEditPhotos && window.pendingEditPhotos.length > 0);
    console.log('  - placeId exists:', !!placeId);
    console.log('  - All conditions met:', !!(window.pendingEditPhotos && window.pendingEditPhotos.length > 0 && placeId));
    
    if (window.pendingEditPhotos && window.pendingEditPhotos.length > 0 && placeId) {
      console.log('📸 Uploading pending edit photos for edited location...');
      try {
        // Access the global photo manager to upload photos
        if (window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos) {
          console.log('📸 Calling uploadPendingPhotos with edit mode photos:', window.pendingEditPhotos, placeId);
          await window.LocationPhotoManager.uploadPendingPhotos(window.pendingEditPhotos, placeId);
          // Clear pending photos after successful upload
          window.pendingEditPhotos = [];
          console.log('✅ Edit photos uploaded and cleared from pending queue');
        } else {
          console.warn('❌ LocationPhotoManager.uploadPendingPhotos not available');
          console.log('🔍 window.LocationPhotoManager:', window.LocationPhotoManager);
          console.log('🔍 Available methods:', window.LocationPhotoManager ? Object.keys(window.LocationPhotoManager) : 'N/A');
        }
      } catch (photoError) {
        console.error('❌ Error uploading edit photos:', photoError);
        LocationEventManager.showNotification('Location updated but photo upload failed', 'warning');
      }
    } else {
      console.log('❌ Photo upload conditions not met:');
      console.log('  - pendingEditPhotos:', window.pendingEditPhotos);
      console.log('  - pendingEditPhotos length:', window.pendingEditPhotos ? window.pendingEditPhotos.length : 'N/A');
      console.log('  - placeId:', placeId);
    }
    
    console.log('🔍 === EDIT FORM SUBMISSION DEBUG END ===');
    LocationEventManager.showNotification(`Location "${locationData.name}" updated successfully`, 'success');
  }

  /**
   * Handle save form submission
   * @param {HTMLFormElement} form - Form element
   * @param {Object} locationData - Form data
   */
  static async handleSaveFormSubmit(form, locationData) {
    console.log('🔍 Saving new location...');
    
    // Verify window.Locations is available
    if (!window.Locations) {
      throw new Error('Locations service is not available');
    }

    const result = await window.Locations.saveLocation(locationData);
    console.log('🔍 handleSaveFormSubmit:', result);

    // Upload any pending photos after location is saved
    // Use the place_id from the original locationData since that's what we need for photo uploads
    const placeId = locationData.place_id;
    
    console.log('🔍  handleSaveFormSubmit: Checking for pending photos...', {
      pendingPhotos: window.pendingPhotos,
      pendingPhotosLength: window.pendingPhotos ? window.pendingPhotos.length : 0,
      pendingEditPhotos: window.pendingEditPhotos,
      pendingEditPhotosLength: window.pendingEditPhotos ? window.pendingEditPhotos.length : 0,
      locationDataPlaceId: locationData.place_id,
      finalPlaceId: placeId,
      photoManagerAvailable: !!window.LocationPhotoManager,
      uploadMethodAvailable: !!(window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos)
    });
    
    // Check both photo queues in case mode detection was wrong
    const photosToUpload = [];
    if (window.pendingPhotos && window.pendingPhotos.length > 0) {
      photosToUpload.push(...window.pendingPhotos);
      console.log('📸 Found', window.pendingPhotos.length, ' handleSaveFormSubmit: photos in pendingPhotos queue');
    }
    if (window.pendingEditPhotos && window.pendingEditPhotos.length > 0) {
      photosToUpload.push(...window.pendingEditPhotos);
      console.log('📸 Found', window.pendingEditPhotos.length, ' handleSaveFormSubmit: photos in pendingEditPhotos queue');
    }
    
    if (photosToUpload.length > 0 && placeId) {
      console.log('📸 Uploading', photosToUpload.length, 'pending photos for saved location...');
      try {
        // Access the global photo manager to upload photos
        if (window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos) {
          console.log('📸 Calling uploadPendingPhotos with:', photosToUpload, placeId);
          await window.LocationPhotoManager.uploadPendingPhotos(photosToUpload, placeId);
          // Clear both pending photo queues after successful upload
          window.pendingPhotos = [];
          window.pendingEditPhotos = [];
          console.log('✅ Photos uploaded and cleared from both pending queues');
        } else {
          console.warn('❌ LocationPhotoManager.uploadPendingPhotos not available');
          console.log('🔍 window.LocationPhotoManager:', window.LocationPhotoManager);
          console.log('🔍 Available methods:', window.LocationPhotoManager ? Object.keys(window.LocationPhotoManager) : 'N/A');
        }
      } catch (photoError) {
        console.error('❌ Error uploading photos:', photoError);
        LocationEventManager.showNotification('Location saved but photo upload failed', 'warning');
      }
    } else {
      console.log('❌ Photo upload conditions not met:');
      console.log('  - photosToUpload.length:', photosToUpload.length);
      console.log('  - photosToUpload array:', photosToUpload);
      console.log('  - placeId (final):', placeId);
      console.log('  - result.place_id:', result.place_id);
      console.log('  - locationData.place_id:', locationData.place_id);
      console.log('  - result object:', result);
      console.log('  - Condition (photosToUpload.length > 0):', photosToUpload.length > 0);
      console.log('  - Condition (placeId exists):', !!placeId);
      console.log('  - Combined condition:', !!(photosToUpload.length > 0 && placeId));
    }

    LocationEventManager.showNotification(`Location "${locationData.name}" saved`, 'success');
    
    // Refresh the saved locations list automatically
    await window.Locations.refreshLocationsList();
    console.log('✅ Locations list refreshed after save');
  }

  /**
   * Close active dialog
   */
  static async closeActiveDialog() {
    try {
      const { LocationsUI } = await import('./LocationsUI.js');
      LocationsUI.closeActiveDialog();
    } catch (error) {
      console.error('❌ Error closing dialog:', error);
    }
  }

  /**
   * Handle refresh locations action
   */
  static async handleRefreshLocations() {
    try {
      console.log('🔄 LocationEventManager.handleRefreshLocations() called');
      
      // Use the global Locations.refreshLocationsList if available
      if (window.Locations && window.Locations.refreshLocationsList) {
        await window.Locations.refreshLocationsList();
        LocationEventManager.showNotification('Locations refreshed', 'success');
      } else {
        // Fallback to LocationsUI
        const { LocationsUI } = await import('./LocationsUI.js');
        await LocationsUI.refreshLocations();
        LocationEventManager.showNotification('Locations refreshed', 'success');
      }
    } catch (error) {
      console.error('❌ Error refreshing locations:', error);
      LocationEventManager.showNotification('Error refreshing locations', 'error');
    }
  }

  /**
   * Handle close dialog action
   * @param {HTMLElement} button - The close button that was clicked
   */
  static handleCloseDialog(button) {
    try {
      // Find the closest dialog overlay and remove it
      const dialogOverlay = button.closest('.dialog-overlay');
      if (dialogOverlay) {
        dialogOverlay.remove();
        console.log('✅ Dialog closed via close button');
      } else {
        // Fallback to the existing closeActiveDialog method
        LocationEventManager.closeActiveDialog();
      }
    } catch (error) {
      console.error('❌ Error closing dialog:', error);
      // Fallback to the existing closeActiveDialog method
      LocationEventManager.closeActiveDialog();
    }
  }

  /**
   * Show notification to user with async NotificationService loading
   * @param {string} message - The notification message
   * @param {string} type - The notification type ('success', 'error', 'info')
   */
  static async showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    
    // Try async import of NotificationService first
    try {
      const { NotificationService } = await import('../ui/NotificationService.js');
      NotificationService.showToast(message, type);
      return;
    } catch (error) {
      console.error('❌ Error loading NotificationService:', error);
    }
    
    // Try to use Auth notification service if available
    if (window.Auth) {
      try {
        const { AuthNotificationService } = window.Auth.getServices();
        AuthNotificationService.showNotification(message, type);
        return;
      } catch (error) {
        console.error('❌ Error using AuthNotificationService:', error);
      }
    }
    
    // Fallback to console log only (per project rules - no alerts)
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}
