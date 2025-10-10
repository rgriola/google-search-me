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

import { debug, DEBUG } from '../../debug.js';
const FILE = 'LOCATION_EVENT_MANAGER';

export class LocationEventManager {

  /**
   * Setup event listeners - IMPROVED VERSION
   * Single, consistent pattern for all events
   */

  static setupEventListeners() {

    debug(FILE, '🎧 Setting up LocationEventManager event listeners');
    
    // SINGLE document-level event delegation for ALL clicks
    document.addEventListener('click', (event) => {
      debug(FILE, 'click handleGlobalClick:', event);
      LocationEventManager.handleGlobalClick(event);
    });

    // SINGLE document-level event delegation for keydown
    document.addEventListener('keydown', (event) => {
      LocationEventManager.handleGlobalKeydown(event);
    });

    // SINGLE document-level event delegation for form submissions
    document.addEventListener('submit', (event) => {
      debug(FILE, 'submit handleGlobalSubmit');
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

    debug(FILE, 'handleGlobalClick - target:', event.target);
    debug(FILE, 'handleGlobalClick - action:', target.dataset.action);

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
        debug(FILE, '⚠️ Form submission blocked: already in progress', null, 'warn');
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
    if (window.google && window.google.maps) {
      debug(FILE, '🗺️ Google Maps event handlers ready for InfoWindow integration');
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

  debug(FILE, '🎯 LocaEventMgr.handleLocationActionClick called');
  debug(FILE, '🎯 Action:', action);
  debug(FILE, '🎯 Place ID:', placeId);
  debug(FILE, '🎯 Target element:', target);

  // Validate we have the required data
  if (!action) {
    debug(FILE, '⚠️ No action found on target element', null, 'warn');
    return;
  }

  // Prevent default behavior for all actions
  event.preventDefault();
  event.stopPropagation();

  // Route to appropriate handler based on action
  switch (action) {
    case 'view':
    case 'edit':
    case 'delete':
    case 'centerMapOnLocation':
    case 'center':
      if (!placeId) {
        debug(FILE, '⚠️ No place ID found:', action, 'warn');
        return;
        }
      if (action === 'view') {
        debug(FILE, '👀 Routing to view location handler');
        LocationEventManager.handleViewLocation(placeId);
      } else if (action === 'edit') {
        debug(FILE, '✏️ Routing to edit location handler');
        LocationEventManager.handleEditLocation(placeId);
      } else if (action === 'delete') {
        debug(FILE, '🗑️ Routing to delete location handler');
        LocationEventManager.handleDeleteLocation(placeId);
      } else if (action === 'centerMapOnLocation' || action === 'center') {
        debug(FILE, '🗺️ Routing to center map handler');
        LocationEventManager.handleCenterMap(target);
        }
      break;

    case 'refreshLocations':
    case 'refresh':
      debug(FILE, '🔄 Routing to refresh locations handler');
      LocationEventManager.handleRefreshLocations();
      break;

    case 'cancel':
      debug(FILE, '🚫 Cancel action triggered');
      LocationEventManager.closeActiveDialog();
      break;

    default:
      debug(FILE, '⚠️ Unknown action:', action, 'warn');
      debug(FILE, '🎯 Available actions: view, edit, delete, center, refresh, cancel');
  }
}

  /**
   * IMPROVED: Close active dialog - single method, multiple fallbacks
   */
  static closeActiveDialog() {
    debug(FILE, '🚪 Closing active dialog...');
    
    // Method 1: Try to close Google Maps InfoWindow first
    if (window.MarkerService && window.MarkerService.currentInfoWindow) {
      window.MarkerService.currentInfoWindow.close();
      debug(FILE, '✅ Google Maps InfoWindow closed');
      return;
    }

    // Method 2: Try to close standard dialogs
    const dialogBackdrop = document.querySelector('.dialog-backdrop.show');
    if (dialogBackdrop) {
      dialogBackdrop.classList.remove('show');
      setTimeout(() => dialogBackdrop.remove(), 300);
      debug(FILE, '✅ Standard dialog closed');
      return;
    }

    // Method 3: Try to close any dialog overlay
    const dialogOverlay = document.querySelector('.dialog-overlay');
    if (dialogOverlay) {
      dialogOverlay.remove();
      debug(FILE, '✅ Dialog overlay closed');
      return;
    }

    // Method 4: Import and use LocationDialogManager as fallback
    import('./ui/LocationDialogManager.js').then(({ LocationDialogManager }) => {
        LocationDialogManager.closeActiveDialog();
        debug(FILE, '✅ LocationDialogManager fallback used');
    }).catch(error => {
      debug(FILE, '❌ Error with LocationDialogManager fallback:', error, 'error');
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
      debug(FILE, '[LocationEventManager] Drop zone clicked, triggering file input for mode:', mode);
      fileInput.click();
    }
  }

  /**
   * Handle photo file input changes
   * @param {Event} event - Change event from file input
   */
  static handlePhotoFileChange(event) {
    debug(FILE, '[LocationEventManager] handlePhotoFileChange - called with files:', event.target.files);
    debug(FILE, '[LocationEventManager] Event target ID:', event.target.id);
    debug(FILE, '[LocationEventManager] Event target element:', event.target);
    
    if (event.target.files && event.target.files.length > 0) {
      // Extract mode from file input ID (e.g., "edit-photo-file-input" -> "edit")
      const mode = event.target.id.split('-')[0]; // Gets "edit" or "save"
      debug(FILE, '[LocationEventManager] Extracted mode from input ID:', mode);
      
      // Additional check to make sure this is the right element
      if (!event.target.id.includes('photo-file-input')) {
        debug(FILE, '[LocationEventManager] Skipping - not a photo file input', null, 'warn');
        return;
      }
      
      // Use existing LocationPhotoManager to handle the file
      if (window.LocationPhotoManager && typeof window.LocationPhotoManager.handlePhotoFile === 'function') {
        debug(FILE, '[LocationEventManager] Delegating to LocationPhotoManager.handlePhotoFile with mode:', mode);
        window.LocationPhotoManager.handlePhotoFile(event, mode);
      } else {
        debug(FILE, '[LocationEventManager] LocationPhotoManager.handlePhotoFile not available', null, 'error');
      }
    }
  }

  /**
   * Handle view location action
   * @param {string} placeId - The place ID to view
   */
  static async handleViewLocation(placeId) {
    try {
      debug(FILE, '👀 [handleViewLocation] placeId:', placeId);

      // Dynamically import dependencies in parallel
      const [{ LocationsUI }, { LocationDialogManager }] = await Promise.all([
        import('./LocationsUI.js'),
        import('./ui/LocationDialogManager.js')
      ]);

      const location = LocationsUI.getLocationById(placeId);
      if (!location) {
        debug(FILE, '⚠️ Location not found for placeId:', placeId, 'warn');
        LocationEventManager.showNotification('Location not found', 'error');
        return;
        }
      // Show location details dialog
      LocationDialogManager.showLocationDetailsDialog(location);
      debug(FILE, '👀 [handleViewLocation] complete');

    } catch (error) {
      debug(FILE, '❌ Error in handleViewLocation:', error, 'error');
      LocationEventManager.showNotification('Error viewing location', 'error');
    }
  }

  /**
   * Handle edit location action
   * @param {string} placeId - The place ID to edit
   */
  static async handleEditLocation(placeId) {
    
    try {
      debug(FILE, '✏️ LEMgr.handleEditLocation() - placeId:', placeId);
      
      // Dynamically import dependencies in parallel
      const [{ LocationsUI }, { LocationDialogManager }] = await Promise.all([
        import('./LocationsUI.js'),
        import('./ui/LocationDialogManager.js')
      ]);
      const location =  LocationsUI.getLocationById(placeId);

      if (!location) {
        debug(FILE, '❌ Location not found for placeId:', placeId, 'error');
        LocationEventManager.showNotification('Location not found', 'error');
        return;
        }
        
        debug(FILE, '📝 Editing location:', location);
        LocationDialogManager.showEditLocationDialog(location);
      
    } catch (error) {
      debug(FILE, '❌ Error in handleEditLocation:', error, 'error');
      LocationEventManager.showNotification('Error editing location', 'error');
    }
  }

/**
 * Handle delete location action - IMPROVED
 * @param {string} placeId - The place ID to delete
 */
static async handleDeleteLocation(placeId) {
  try {
    debug(FILE, '🗑️ Start delete process for:', placeId);
    
    // 1. Get location data first
    const location = await LocationEventManager.getLocationData(placeId);
    if (!location) {
      LocationEventManager.showNotification('Location not found', 'error');
      return;
    }

    // 2. Get user confirmation
    const confirmed = await LocationEventManager.confirmDeletion(location);
    if (!confirmed) {
      debug(FILE, '🚫 Deletion cancelled by user');
      return;
    }

    // 3. Perform deletion
    await LocationEventManager.performDeletion(location);
    
    // 4. Update UI
    await LocationEventManager.updateUIAfterDeletion();
    
    LocationEventManager.showNotification(`Location "${location.name}" deleted successfully`, 'success');
    
  } catch (error) {
    debug(FILE, '❌ Error in handleDeleteLocation:', error, 'error');
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
    debug(FILE, 'Using fallback confirmation dialog:', error, 'warn');
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
        debug(FILE, '⚠️ Form submission already in progress, ignoring duplicate request', null, 'warn');
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
      
      debug(FILE, '📝 === FORM SUBMISSION DEBUG START ===');
      debug(FILE, '📝 LocationEventManager.handleFormSubmit() called with form:', form);
      debug(FILE, '📝 Form ID:', form.id);
      debug(FILE, '📝 Form action:', form.action);
      debug(FILE, '📝 Form method:', form.method);
      
      // Debug: Check all form elements before extraction
      const formElements = form.elements;
      debug(FILE, '📝 Form has', formElements.length, 'elements:');
      for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        debug(FILE, `📝 Element ${i}: name="${element.name}", type="${element.type}", value="${element.value}"`);
      }
      
      // Import required modules
      const { LocationFormManager } = await import('./ui/LocationFormManager.js');
      
      // Extract and validate form data using the proper extraction method
      const formResult = LocationFormManager.extractFormData(form);
      const { data: locationData, validation } = formResult;
      
      debug(FILE, '📋 === EXTRACTED DATA ===');
      debug(FILE, '📋 Location data keys:', Object.keys(locationData));
      debug(FILE, '📋 Location data values:', locationData);
      debug(FILE, '📋 Validation result:', validation);
      
      // Detailed check of required fields
      const requiredServerFields = ['type', 'entry_point', 'parking', 'access'];
      debug(FILE, '📋 === REQUIRED FIELD CHECK ===');
      requiredServerFields.forEach(field => {
        const value = locationData[field];
        const isValid = value && value.trim() !== '';
        debug(FILE, `📋 ${field}: "${value}" (valid: ${isValid})`);
      });
      
      // Show validation errors if any
      if (!validation.isValid) {
        debug(FILE, '❌ Validation failed, showing errors:', validation.errors, 'error');
        LocationFormManager.showFormErrors(validation.errors, form);
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        LocationFormManager.showFormWarnings(validation.warnings, form);
      }

      debug(FILE, '📋 === PROCEEDING WITH SUBMISSION ===');
      
      // Handle save vs edit
      if (form.id === 'edit-location-form') {
        debug(FILE, '📝 Handling edit form submission');
        await LocationEventManager.handleEditFormSubmit(form, locationData);
      } else {
        debug(FILE, '📝 Handling save form submission');
        await LocationEventManager.handleSaveFormSubmit(form, locationData);
      }
      
      // Close dialog with small delay to ensure notification shows
      setTimeout(() => {
        LocationEventManager.closeActiveDialog();
      }, 500);
      
      debug(FILE, '📝 === FORM SUBMISSION DEBUG END ===');
      
    } catch (error) {
      debug(FILE, '❌ Error in handleFormSubmit:', error, 'error');
      debug(FILE, '❌ Error stack:', error.stack, 'error');
      
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

    debug(FILE, '🔍 === EDIT FORM SUBMISSION DEBUG START ===');
    debug(FILE, '🔍 Updating existing location with place_id:', placeId);
    debug(FILE, '🔍 Pre-update global pendingPhotos:', window.pendingPhotos);
    
    await window.Locations.updateLocation(placeId, locationData);
    
    debug(FILE, '🔍 === POST-UPDATE PHOTO CHECK ===');
    debug(FILE, '🔍 Global window.pendingPhotos:', window.pendingPhotos);
    debug(FILE, '🔍 Global window.pendingEditPhotos:', window.pendingEditPhotos);
    debug(FILE, '🔍 Type of window.pendingEditPhotos:', typeof window.pendingEditPhotos);
    debug(FILE, '🔍 Is Array:', Array.isArray(window.pendingEditPhotos));
    debug(FILE, '🔍 Length:', window.pendingEditPhotos ? window.pendingEditPhotos.length : 'N/A');
    
    // Upload any pending photos after location is updated (CHECK EDIT PHOTOS FOR EDIT MODE)
    debug(FILE, '🔍 Checking for pending photos after edit...', {
      pendingPhotos: window.pendingPhotos,
      pendingEditPhotos: window.pendingEditPhotos,
      pendingEditPhotosLength: window.pendingEditPhotos ? window.pendingEditPhotos.length : 0,
      placeId: placeId,
      photoManagerAvailable: !!window.LocationPhotoManager,
      uploadMethodAvailable: !!(window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos)
    });
    
    debug(FILE, '🔍 Condition check results:');
    debug(FILE, '  - window.pendingEditPhotos exists:', !!window.pendingEditPhotos);
    debug(FILE, '  - pendingEditPhotos.length > 0:', window.pendingEditPhotos && window.pendingEditPhotos.length > 0);
    debug(FILE, '  - placeId exists:', !!placeId);
    debug(FILE, '  - All conditions met:', !!(window.pendingEditPhotos && window.pendingEditPhotos.length > 0 && placeId));
    
    if (window.pendingEditPhotos && window.pendingEditPhotos.length > 0 && placeId) {
      debug(FILE, '📸 Uploading pending edit photos for edited location...');
      try {
        if (window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos) {
          debug(FILE, '📸 Calling uploadPendingPhotos with edit mode photos:', window.pendingEditPhotos, placeId);
          await window.LocationPhotoManager.uploadPendingPhotos(window.pendingEditPhotos, placeId);
          window.pendingEditPhotos = [];
          debug(FILE, '✅ Edit photos uploaded and cleared from pending queue');
        } else {
          debug(FILE, '❌ LocationPhotoManager.uploadPendingPhotos not available', null, 'error');
          debug(FILE, '🔍 window.LocationPhotoManager:', window.LocationPhotoManager);
          debug(FILE, '🔍 Available methods:', window.LocationPhotoManager ? Object.keys(window.LocationPhotoManager) : 'N/A');
        }
      } catch (photoError) {
        debug(FILE, '❌ Error uploading edit photos:', photoError, 'error');
        LocationEventManager.showNotification('Location updated but photo upload failed', 'warning');
      }
    } else {
      debug(FILE, '❌ Photo upload conditions not met:');
      debug(FILE, '  - pendingEditPhotos:', window.pendingEditPhotos);
      debug(FILE, '  - pendingEditPhotos length:', window.pendingEditPhotos ? window.pendingEditPhotos.length : 'N/A');
      debug(FILE, '  - placeId:', placeId);
    }
    
    debug(FILE, '🔍 === EDIT FORM SUBMISSION DEBUG END ===');
    LocationEventManager.showNotification(`Location "${locationData.name}" updated successfully`, 'success');
  }

  /**
   * Handle save form submission
   * @param {HTMLFormElement} form - Form element
   * @param {Object} locationData - Form data
   */
  static async handleSaveFormSubmit(form, locationData) {
    debug(FILE, '🔍 Saving new location...');
    
    if (!window.Locations) {
      throw new Error('Locations service is not available');
    }

    const result = await window.Locations.saveLocation(locationData);
    debug(FILE, '🔍 handleSaveFormSubmit:', result);

    const placeId = locationData.place_id;
    
    debug(FILE, '🔍  handleSaveFormSubmit: Checking for pending photos...', {
      pendingPhotos: window.pendingPhotos,
      pendingPhotosLength: window.pendingPhotos ? window.pendingPhotos.length : 0,
      pendingEditPhotos: window.pendingEditPhotos,
      pendingEditPhotosLength: window.pendingEditPhotos ? window.pendingEditPhotos.length : 0,
      locationDataPlaceId: locationData.place_id,
      finalPlaceId: placeId,
      photoManagerAvailable: !!window.LocationPhotoManager,
      uploadMethodAvailable: !!(window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos)
    });
    
    const photosToUpload = [];
    if (window.pendingPhotos && window.pendingPhotos.length > 0) {
      photosToUpload.push(...window.pendingPhotos);
      debug(FILE, '📸 Found', window.pendingPhotos.length, ' handleSaveFormSubmit: photos in pendingPhotos queue');
    }
    if (window.pendingEditPhotos && window.pendingEditPhotos.length > 0) {
      photosToUpload.push(...window.pendingEditPhotos);
      debug(FILE, '📸 Found', window.pendingEditPhotos.length, ' handleSaveFormSubmit: photos in pendingEditPhotos queue');
    }
    
    if (photosToUpload.length > 0 && placeId) {
      debug(FILE, '📸 Uploading', photosToUpload.length, 'pending photos for saved location...');
      try {
        if (window.LocationPhotoManager && window.LocationPhotoManager.uploadPendingPhotos) {
          debug(FILE, '📸 Calling uploadPendingPhotos with:', photosToUpload, placeId);
          await window.LocationPhotoManager.uploadPendingPhotos(photosToUpload, placeId);
          window.pendingPhotos = [];
          window.pendingEditPhotos = [];
          debug(FILE, '✅ Photos uploaded and cleared from both pending queues');
        } else {
          debug(FILE, '❌ LocationPhotoManager.uploadPendingPhotos not available', null, 'error');
          debug(FILE, '🔍 window.LocationPhotoManager:', window.LocationPhotoManager);
          debug(FILE, '🔍 Available methods:', window.LocationPhotoManager ? Object.keys(window.LocationPhotoManager) : 'N/A');
        }
      } catch (photoError) {
        debug(FILE, '❌ Error uploading photos:', photoError, 'error');
        LocationEventManager.showNotification('Location saved but photo upload failed', 'warning');
      }
    } else {

      debug(FILE, '❌ Photo upload conditions not met:');
      debug(FILE, '  - photosToUpload.length:', photosToUpload.length);
      debug(FILE, '  - photosToUpload array:', photosToUpload);
      debug(FILE, '  - placeId (final):', placeId);
      debug(FILE, '  - result.place_id:', result.place_id);
      debug(FILE, '  - locationData.place_id:', locationData.place_id);
      debug(FILE, '  - result object:', result);
      debug(FILE, '  - Condition (photosToUpload.length > 0):', photosToUpload.length > 0);
      debug(FILE, '  - Condition (placeId exists):', !!placeId);
      debug(FILE, '  - Combined condition:', !!(photosToUpload.length > 0 && placeId));
    
    }

    LocationEventManager.showNotification(`Location "${locationData.name}" saved`, 'success');
    
    await window.Locations.refreshLocationsList();
    debug(FILE, '✅ Locations list refreshed after save');
  }

  /**
   * Handle refresh locations action
   */
  static async handleRefreshLocations() {
    try {
      debug(FILE, '🔄 LocationEventManager.handleRefreshLocations() called');

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
      debug(FILE, '❌ Error refreshing locations:', error, 'error');
      LocationEventManager.showNotification('Error refreshing locations', 'error');
    }
  }

  /**
   * Show notification to user with async NotificationService loading
   * @param {string} message - The notification message
   * @param {string} type - The notification type ('success', 'error', 'info')
   */
  static async showNotification(message, type = 'info') {
    debug(FILE, `📢 Notification (${type}):`, message);
    
    try {
      const { NotificationService } = await import('../ui/NotificationService.js');
      NotificationService.showToast(message, type);
      return;
    } catch (error) {
      debug(FILE, '❌ Error loading NotificationService:', error, 'error');
    }
    
    debug(FILE, `${type.toUpperCase()}: ${message}`);
  }
}
