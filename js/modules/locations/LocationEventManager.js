/**
 * LocationEventManager - REFACTORED VERSION
 * Cleaner, more focused, less repetitive
 */
export class LocationEventManager {

  /**
   * Setup event listeners - STREAMLINED
   */
  static setupEventListeners() {
    console.log('🎧 Setting up LocationEventManager event listeners');
    
    // Single document-level delegation
    document.addEventListener('click', this.handleGlobalClick);
    document.addEventListener('keydown', this.handleGlobalKeydown);
    document.addEventListener('submit', this.handleGlobalSubmit);
    document.addEventListener('change', this.handleGlobalChange);
  }

  /**
   * SIMPLIFIED click handler - less validation, more action
   */
  static handleGlobalClick(event) {
  const target = event.target;
  
  // ✅ FIXED - consistent use of 'this'
  if (target.classList.contains('close-dialog')) {
    event.preventDefault();
    return LocationEventManager.closeActiveDialog(); // ✅ Fixed
  }

  if (target.closest('.photo-drop-zone')) {
    event.preventDefault();
    return LocationEventManager.handleDropZoneClick(target); // ✅ Fixed to use class name
  }

  const action = target.dataset.action;
  if (action) {
    event.preventDefault();
    return LocationEventManager.routeAction(action, target); // ✅ Fixed to use class name
  }
}

  /**
   * SIMPLIFIED action routing - single method, clean switch
   */
  static async routeAction(action, target) {
    const placeId = target.dataset.placeId || target.dataset.locationId;
    
    // Single validation point
    if (!placeId && ['view', 'edit', 'delete', 'viewLocation', 'editLocation', 'deleteLocation'].includes(action)) {
      return console.warn('⚠️ No place ID found for action:', action);
    }

    try {
      switch (action) {
        case 'viewLocation':
        case 'view':
          await LocationEventManager.handleViewLocation(placeId);
          break;
        case 'editLocation':
        case 'edit':
          await LocationEventManager.handleEditLocation(placeId);
          break;
        case 'deleteLocation':
        case 'delete':
          await LocationEventManager.handleDeleteLocation(placeId);
          break;
        case 'centerMapOnLocation':
        case 'center':
          await LocationEventManager.handleCenterMap(target);
          break;
        case 'refreshLocations':
        case 'refresh':
          await LocationEventManager.handleRefreshLocations();
          break;
        default:
          console.warn('⚠️ Unknown action:', action);
      }
    } catch (error) {
      console.error('❌ Error handling action:', action, error);
      LocationEventManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * SIMPLIFIED form submission - moved validation elsewhere
   */
  static async handleFormSubmit(form) {
    try {
      const { LocationFormManager } = await import('./ui/LocationFormManager.js');
      const formResult = LocationFormManager.extractFormData(form);
      
      if (!formResult.validation.isValid) {
        return LocationFormManager.showFormErrors(formResult.validation.errors, form);
      }

      const isEdit = form.id === 'edit-location-form';
      await (isEdit ? LocationEventManager.processEditForm(form, formResult.data) : LocationEventManager.processSaveForm(form, formResult.data));
      
      setTimeout(() => LocationEventManager.closeActiveDialog(), 300);
      
    } catch (error) {
      console.error('❌ Form submission error:', error);
      LocationEventManager.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * CLEAN edit form processing - single responsibility
   */
  static async processEditForm(form, locationData) {
    const placeId = form.getAttribute('data-place-id');
    
    await window.Locations.updateLocation(placeId, locationData);
    await LocationEventManager.handlePhotoUpload(window.pendingEditPhotos, placeId, 'edit');
    
    LocationEventManager.showNotification(`Location "${locationData.name}" updated`, 'success');
  }

  /**
   * CLEAN save form processing - single responsibility
   */
  static async processSaveForm(form, locationData) {
    const result = await window.Locations.saveLocation(locationData);
    const placeId = locationData.place_id;
    
    await LocationEventManager.handlePhotoUpload([...window.pendingPhotos || [], ...window.pendingEditPhotos || []], placeId, 'save');
    
    LocationEventManager.showNotification(`Location "${locationData.name}" saved`, 'success');
    await window.Locations.refreshLocationsList();
  }

  /**
   * CENTRALIZED photo upload - eliminates duplication
   */
  static async handlePhotoUpload(photos, placeId, mode) {
    if (!photos?.length || !placeId || !window.LocationPhotoManager?.uploadPendingPhotos) {
      return;
    }

    try {
      await window.LocationPhotoManager.uploadPendingPhotos(photos, placeId);
      
      // Clear appropriate queues
      if (mode === 'edit') {
        window.pendingEditPhotos = [];
      } else {
        window.pendingPhotos = [];
        window.pendingEditPhotos = [];
      }
      
      console.log('✅ Photos uploaded successfully');
    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      LocationEventManager.showNotification(`${mode === 'edit' ? 'Updated' : 'Saved'} but photo upload failed`, 'warning');
    }
  }

  /**
   * SIMPLIFIED delete with better UX
   */
  static async handleDeleteLocation(placeId) {
    const { LocationsUI } = await import('./LocationsUI.js');
    const location = LocationsUI.getLocationById(placeId);
    
    if (!location) {
      return LocationEventManager.showNotification('Location not found', 'error');
    }

    const confirmed = await LocationEventManager.showConfirmDialog(`Delete "${location.name}"?`);
    if (!confirmed) return;

    try {
      const { LocationsAPI } = await import('../locations/LocationsAPI.js');
      await LocationsAPI.deleteLocation(location.place_id);
      await LocationsUI.loadSavedLocations();
      LocationEventManager.closeActiveDialog();
      LocationEventManager.showNotification('Location deleted successfully', 'success');
    } catch (error) {
      console.error('❌ Delete error:', error);
      LocationEventManager.showNotification('Error deleting location', 'error');
    }
  }

  /**
   * UTILITY: Confirm dialog - reusable
   */
  static async showConfirmDialog(message) {
    try {
      const { NotificationService } = await import('../ui/NotificationService.js');
      return new Promise(resolve => {
        NotificationService.showConfirmation({
          message,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false)
        });
      });
    } catch (error) {
      return confirm(message); // Fallback
    }
  }

  /**
   * SIMPLIFIED view location - focused on core functionality
   */
  static async handleViewLocation(placeId) {
    const { LocationsUI } = await import('./LocationsUI.js');
    const { LocationDialogManager } = await import('./ui/LocationDialogManager.js');
    const location = LocationsUI.getLocationById(placeId);

    if (!location) {
      return LocationEventManager.showNotification('Location not found', 'error');
    }

    // Center map if coordinates exist
    if (location.lat && location.lng) {
      try {
        const { MapService } = await import('../maps/MapService.js');
        await MapService.centerMap(parseFloat(location.lat), parseFloat(location.lng), 16);
      } catch (error) {
        console.warn('⚠️ Map centering failed:', error);
      }
    }

    LocationDialogManager.showLocationDetailsDialog(location, 'center');
  }

  /**
   * CLEAN notification system
   */
  static async showNotification(message, type = 'info') {
    try {
      const { NotificationService } = await import('../ui/NotificationService.js');
      NotificationService.showToast(message, type);
    } catch (error) {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Simple handlers - kept minimal
   */
static handleGlobalKeydown(event) {
  if (event.key === 'Escape') {
    LocationEventManager.closeActiveDialog(); // ✅ Fixed
  }
}

  static handleGlobalSubmit(event) {
    const form = event.target;
      if (form.id === 'save-location-form' || form.id === 'edit-location-form') {
      event.preventDefault();
      LocationEventManager.handleFormSubmit(form); // ✅ Fixed
    }
}

  static handleGlobalChange(event) {
    if (event.target.type === 'file' && event.target.id?.includes('photo-file-input')) {
      const mode = event.target.id.split('-')[0];
      window.LocationPhotoManager?.handlePhotoFile(event, mode);
    }
  }

  static closeActiveDialog() {
    // Try multiple close methods
    const closeMethod = 
      window.MarkerService?.currentInfoWindow?.close?.() ||
      document.querySelector('.dialog-backdrop.show')?.classList.remove('show') ||
      document.querySelector('.dialog-overlay')?.remove();
      
    if (!closeMethod) {
      import('./ui/LocationDialogManager.js').then(({ LocationDialogManager }) => {
        LocationDialogManager.closeActiveDialog();
      });
    }
  }
}