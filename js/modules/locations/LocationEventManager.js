/**
 * LocationEventManager
 * Handles all event management for location UI operations
 * 
 * Responsibilities:
 * - Event delegation for location actions
 * - Location interaction management
 * - Clean interface between UI and data operations
 */

// future improvements move import to one time in this file. 9-17-2025
//const { LocationsUI } = await import('./LocationsUI.js');
//const { LocationDialogManager } = await import('./ui/LocationDialogManager.js')

const debug = true;

export class LocationEventManager {

  /**
   * Setup event listeners - IMPROVED VERSION
   * Single, consistent pattern for all events
   */

  static setupEventListeners() {
    console.log('🎧 Setting up LocationEventManager event listeners');
    
    // SINGLE document-level event delegation for ALL clicks
    document.addEventListener('click', (event) => {
      LocationEventManager.handleGlobalClick(event);
    });

    // SINGLE document-level event delegation for keydown
    document.addEventListener('keydown', (event) => {
      LocationEventManager.handleGlobalKeydown(event);
    });

    // SINGLE document-level event delegation for form submissions
    document.addEventListener('submit', (event) => {
      LocationEventManager.handleGlobalSubmit(event);
    });

    // SINGLE document-level event delegation for file changes
    document.addEventListener('change', (event) => {
      LocationEventManager.handleGlobalChange(event);
    });

    // SPECIAL: Google Maps InfoWindow event handling
    // This is needed because Google Maps creates elements outside normal DOM
    LocationEventManager.setupGoogleMapsEventHandlers();
  }

  /**
   * CENTRALIZED click handler - routes all clicks through here
   * @param {Event} event - Click event
   */
  static handleGlobalClick(event) {
    const target = event.target;
    const action = target.dataset.action;

    // 1. CLOSE DIALOG BUTTONS (highest priority)
    if (target.classList.contains('close-dialog')) {
      event.preventDefault();
      event.stopPropagation();
      LocationEventManager.closeActiveDialog();
      return;
    }

    // 2. PHOTO DROP ZONES
    if (target.closest('.photo-drop-zone')) {
      event.preventDefault();
      LocationEventManager.handleDropZoneClick(target);
      return;
    }

    // 3. LOCATION ACTIONS (view, edit, delete)
    // active view/edit/delete handler. 9-15-2025
    if (action) {
      event.preventDefault();
      LocationEventManager.handleLocationActionClick(event);
      return;
    }
  }

  /**
   * CENTRALIZED keydown handler
   * @param {Event} event - Keydown event
   */
  static handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
      LocationEventManager.closeActiveDialog();
    }
  }

  /**
   * CENTRALIZED form submission handler
   * @param {Event} event - Submit event
   */
  static handleGlobalSubmit(event) {
    const form = event.target;
    if (form.id === 'save-location-form' || form.id === 'edit-location-form') {
      event.preventDefault();
      
      // Additional protection: check if already submitting
      if (form.dataset.submitting === 'true') {
        console.log('⚠️ Form submission blocked: already in progress');
        return;
      }
      
      LocationEventManager.handleFormSubmit(form);
    }
  }

  /**
   * CENTRALIZED change handler
   * @param {Event} event - Change event
   */
  static handleGlobalChange(event) {
    if (event.target.type === 'file' && 
        event.target.id && 
        event.target.id.includes('photo-file-input')) {
      LocationEventManager.handlePhotoFileChange(event);
    }
  }

  /**
   * SPECIAL: Handle Google Maps InfoWindow events
   * This is needed because Google Maps creates DOM outside our control
   */
  static setupGoogleMapsEventHandlers() {
    // Listen for when InfoWindows are created
    if (window.google && window.google.maps) {
      // We'll attach this when the InfoWindow is created in MarkerService
      console.log('🗺️ Google Maps event handlers ready for InfoWindow integration');
    }
  }

  /**
 * Handle location action clicks (view, edit, delete, etc.)
 * @param {Event} event - Click event
 */
static handleLocationActionClick(event) {
  const target = event.target;
  const action = target.dataset.action;
  const placeId = target.dataset.placeId || target.dataset.locationId;

  if(debug){
    console.log('🎯 LocaEventMgr.handleLocationActionClick called');
    console.log('🎯 Action:', action);
    console.log('🎯 Place ID:', placeId);
    console.log('🎯 Target element:', target);
  }
  
  // Validate we have the required data
  if (!action) {
    console.warn('⚠️ No action found on target element');
    return;
  }

  if (!placeId) {
    console.warn('⚠️ No place ID found on target element');
    return;
  }

  // Prevent default behavior
  event.preventDefault();
  event.stopPropagation();

  // Route to appropriate handler based on action
  switch (action) {
    //case 'viewLocation':
    case 'view':
      console.log('👀 Routing to view location handler');
      //LocationEventManager.closeActiveDialog();
      LocationEventManager.handleViewLocation(placeId);
      break;
      
    //case 'editLocation':
    case 'edit':
      console.log('✏️ Routing to edit location handler');
      //LocationEventManager.closeActiveDialog(); // << Closes active dialog
      // close view dialog - the only edit access point to control 
      // data flow. 
      LocationEventManager.handleEditLocation(placeId);

      break;
      
    case 'deleteLocation':
    case 'delete':
      console.log('🗑️ Routing to delete location handler');
      LocationEventManager.handleDeleteLocation(placeId);
      break;
      
    case 'centerMapOnLocation':
    case 'center':
      console.log('🗺️ Routing to center map handler');
      LocationEventManager.handleCenterMap(target);
      break;
      
    case 'refreshLocations':
    case 'refresh':
      console.log('🔄 Routing to refresh locations handler');
      LocationEventManager.handleRefreshLocations();
      break;
      
    default:
      console.warn('⚠️ Unknown action:', action);
      console.log('🎯 Available actions: viewLocation, editLocation, deleteLocation, centerMapOnLocation, refreshLocations');
  }
}

  /**
   * IMPROVED: Close active dialog - single method, multiple fallbacks
   */
  static closeActiveDialog() {
    console.log('🚪 Closing active dialog...');
    
    // Method 1: Try to close Google Maps InfoWindow first
    if (window.MarkerService && window.MarkerService.currentInfoWindow) {
      window.MarkerService.currentInfoWindow.close();
      console.log('✅ Google Maps InfoWindow closed');
      return;
    }

    // Method 2: Try to close standard dialogs
    const dialogBackdrop = document.querySelector('.dialog-backdrop.show');
    if (dialogBackdrop) {
      dialogBackdrop.classList.remove('show');
      setTimeout(() => dialogBackdrop.remove(), 300);
      console.log('✅ Standard dialog closed');
      return;
    }

    // Method 3: Try to close any dialog overlay
    const dialogOverlay = document.querySelector('.dialog-overlay');
    if (dialogOverlay) {
      dialogOverlay.remove();
      console.log('✅ Dialog overlay closed');
      return;
    }

    // Method 4: Import and use LocationDialogManager as fallback
    import('./ui/LocationDialogManager.js').then(({ LocationDialogManager }) => {
      LocationDialogManager.closeActiveDialog();
      console.log('✅ LocationDialogManager fallback used');
    }).catch(error => {
      console.error('❌ Error with LocationDialogManager fallback:', error);
    });
  }

  /**
   * Handle drop zone clicks
   * @param {HTMLElement} target - Clicked element
   */
  static handleDropZoneClick(target) {
    const dropZone = target.closest('.photo-drop-zone');
    const dropZoneId = dropZone.id;
    const mode = dropZoneId.split('-')[0];
    const fileInput = document.getElementById(`${mode}-photo-file-input`);
    
    if (fileInput) {
      console.log('[LocationEventManager] Drop zone clicked, triggering file input for mode:', mode);
      fileInput.click();
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
      console.log('👀 [handleViewLocation] placeId:', placeId);

      // Dynamically import dependencies in parallel
      const [{ LocationsUI }, { LocationDialogManager }] = await Promise.all([
        import('./LocationsUI.js'),
        import('./ui/LocationDialogManager.js')
      ]);

      const location = LocationsUI.getLocationById(placeId);
      if (!location) {
        console.warn('⚠️ Location not found for placeId:', placeId);
        LocationEventManager.showNotification('Location not found', 'error');
        return;
        }
      // Show location details dialog
      LocationDialogManager.showLocationDetailsDialog(location, 'center');
      console.log('👀 [handleViewLocation] complete');

    } catch (error) {
      console.error('❌ Error in handleViewLocation:', error);
      LocationEventManager.showNotification('Error viewing location', 'error');
    }
  }

  /**
   * Handle edit location action
   * @param {string} placeId - The place ID to edit
   */
  static async handleEditLocation(placeId) {

    try {
      console.log('✏️ LEMgr.handleEditLocation() - placeId:', placeId);
      
      // Dynamically import dependencies in parallel
      const [{ LocationsUI }, { LocationDialogManager }] = await Promise.all([
        import('./LocationsUI.js'),
        import('./ui/LocationDialogManager.js')
      ]);
      const location =  LocationsUI.getLocationById(placeId);

      if (!location) {
        console.error('❌ Location not found for placeId:', placeId);
        LocationEventManager.showNotification('Location not found', 'error');
        return;
        }
        
        console.log('📝 Editing location:', location);

        LocationDialogManager.showEditLocationDialog(location);
        //LocationsUI.showEditLocationDialog(location);
      
    } catch (error) {
      console.error('❌ Error in handleEditLocation:', error);
      LocationEventManager.showNotification('Error editing location', 'error');
    }
  }

/**
 * Handle delete location action - IMPROVED
 * @param {string} placeId - The place ID to delete
 */
static async handleDeleteLocation(placeId) {
  try {
    console.log('🗑️ Start delete process for:', placeId);
    
    // 1. Get location data first
    const location = await LocationEventManager.getLocationData(placeId);
    if (!location) {
      LocationEventManager.showNotification('Location not found', 'error');
      return;
    }

    // 2. Get user confirmation
    const confirmed = await LocationEventManager.confirmDeletion(location);
    if (!confirmed) {
      console.log('🚫 Deletion cancelled by user');
      return;
    }

    // 3. Perform deletion
    await LocationEventManager.performDeletion(location);
    
    // 4. Update UI
    await LocationEventManager.updateUIAfterDeletion();
    
    LocationEventManager.showNotification(`Location "${location.name}" deleted successfully`, 'success');
    
  } catch (error) {
    console.error('❌ Error in handleDeleteLocation:', error);
    LocationEventManager.showNotification('Error deleting location', 'error');
  }
}

/**
 * Get location data by place ID
 * @param {string} placeId - Place ID to look up
 * @returns {Promise<Object|null>} Location object or null
 */
static async getLocationData(placeId) {
  const { LocationsUI } = await import('./LocationsUI.js');
  return LocationsUI.getLocationById(placeId);
}

/**
 * Get user confirmation for deletion
 * @param {Object} location - Location to delete
 * @returns {Promise<boolean>} Whether user confirmed
 */
static async confirmDeletion(location) {
  try {
    // Try modern confirmation dialog
    const { NotificationService } = await import('../ui/NotificationService.js');
    
    return new Promise((resolve) => {
      NotificationService.showConfirmation({
        message: `Delete "${location.name}"?`,
        title: 'Confirm Deletion',
        type: 'warning',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
    
  } catch (error) {
    console.warn('Using fallback confirmation dialog:', error);
    // Fallback to browser confirm
    return confirm(`Delete "${location.name}"? This action cannot be undone.`);
  }
}

/**
 * Perform the actual deletion
 * @param {Object} location - Location to delete
 * @returns {Promise<void>}
 */
static async performDeletion(location) {
  const { LocationsAPI } = await import('../locations/LocationsAPI.js');
  await LocationsAPI.deleteLocation(location.place_id);
}

/**
 * Update UI after successful deletion
 * @returns {Promise<void>}
 */
static async updateUIAfterDeletion() {
  // Close any open dialogs
  LocationEventManager.closeActiveDialog();
  
  // Refresh the locations list
  const { LocationsUI } = await import('./LocationsUI.js');
  await LocationsUI.loadSavedLocations();
}
  /**
   * Handle form submission - proper implementation
   * @param {HTMLFormElement} form - The form being submitted
   */
  static async handleFormSubmit(form) {
    try {
      // Prevent double submission
      if (form.dataset.submitting === 'true') {
        console.log('⚠️ Form submission already in progress, ignoring duplicate request');
        return;
      }
      
      // Mark form as submitting
      form.dataset.submitting = 'true';
      
      // Disable submit button to prevent additional clicks
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        const originalText = submitButton.textContent || submitButton.value;
        if (submitButton.textContent) {
          submitButton.textContent = 'Saving...';
        } else {
          submitButton.value = 'Saving...';
        }
        
        // Store original text for restoration
        submitButton.dataset.originalText = originalText;
      }
      
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
      
      // Show error notification
      LocationEventManager.showNotification(`Error saving location: ${error.message}`, 'error');
    } finally {
      // Always reset form submission state
      form.dataset.submitting = 'false';
      
      // Re-enable submit button
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        const originalText = submitButton.dataset.originalText;
        if (originalText) {
          if (submitButton.textContent) {
            submitButton.textContent = originalText;
          } else {
            submitButton.value = originalText;
          }
        }
      }
    }
  }

  /**
   * Handle edit form submission
   * @param {HTMLFormElement} form - Form element
   * @param {Object} locationData - Form data
   */
  static async handleEditFormSubmit(form, locationData) {
    const placeId = form.getAttribute('data-place-id');

    if (debug){
      console.log('🔍 === EDIT FORM SUBMISSION DEBUG START ===');
      console.log('🔍 Updating existing location with place_id:', placeId);
      console.log('🔍 Pre-update global pendingPhotos:', window.pendingPhotos);
    }
    
    
    await window.Locations.updateLocation(placeId, locationData);
    
    if(debug){
      console.log('🔍 === POST-UPDATE PHOTO CHECK ===');
      console.log('🔍 Global window.pendingPhotos:', window.pendingPhotos);
      console.log('🔍 Global window.pendingEditPhotos:', window.pendingEditPhotos);
      console.log('🔍 Type of window.pendingEditPhotos:', typeof window.pendingEditPhotos);
      console.log('🔍 Is Array:', Array.isArray(window.pendingEditPhotos));
      console.log('🔍 Length:', window.pendingEditPhotos ? window.pendingEditPhotos.length : 'N/A');
    }
    
    
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
   * Handle refresh locations action
   */
  static async handleRefreshLocations() {
    try {
      console.log('🔄 LocationEventManager.handleRefreshLocations() called');

      // Try global Locations.refreshLocationsList, else fallback to LocationsUI.refreshLocations
      let refreshed = false;
          const { LocationsUI } = await import('./LocationsUI.js');

              if (typeof LocationsUI.refreshLocations === 'function') {
                  await LocationsUI.refreshLocations();
                  refreshed = true;
                  LocationEventManager.showNotification('Locations refreshed', 'success');
              } else {
                throw new Error('No refresh method available');
                }
    
    } catch (error) {
      console.error('❌ Error refreshing locations:', error);
      LocationEventManager.showNotification('Error refreshing locations', 'error');
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
    
    // Fallback to console log only (per project rules - no alerts)
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}
