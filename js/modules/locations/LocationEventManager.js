/**
 * LocationEventManager
 * Handles all event management for location UI operations
 * 
 * Responsibilities:
 * - Event delegation for location actions
 * - Location interaction management
 * - Clean interface between UI and data operations
 */
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
   * Handle view location action
   * @param {string} placeId - The place ID to view
   */
  static async handleViewLocation(placeId) {
    try {
      console.log('👀 LocationEventManager.handleViewLocation() called for placeId:', placeId);
      
      const { LocationsUI } = await import('./LocationsUI.js');
      const location = LocationsUI.getLocationById(placeId);
      
      if (!location) {
        console.error('❌ Location not found for placeId:', placeId);
        LocationEventManager.showNotification('Location not found', 'error');
        return;
      }
      
      console.log('📍 Viewing location:', location);
      LocationsUI.showLocationView(location);
      
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
        const confirmed = await NotificationService.showConfirmation(
          `Delete "${location.name || location.title}"?`,
          'This action cannot be undone.'
        );
        
        if (confirmed) {
          console.log('🗑️ Deleting location:', location);
          await LocationsUI.deleteLocation(placeId);
          LocationEventManager.showNotification('Location deleted successfully', 'success');
        }
      } catch (error) {
        console.error('❌ Error loading NotificationService, using simple confirm:', error);
        // Fallback to simple confirmation
        const confirmed = confirm(`Delete "${location.name || location.title}"? This action cannot be undone.`);
        
        if (confirmed) {
          console.log('🗑️ Deleting location:', location);
          await LocationsUI.deleteLocation(placeId);
          LocationEventManager.showNotification('Location deleted successfully', 'success');
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
      console.log('📝 LocationEventManager.handleFormSubmit() called with form:', form);
      
      // Import required modules
      const { LocationFormManager } = await import('./ui/LocationFormManager.js');
      
      // Extract and validate form data using the proper extraction method
      const formResult = LocationFormManager.extractFormData(form);
      const { data: locationData, validation } = formResult;
      
      console.log('📋 Extracted location data:', locationData);
      console.log('📋 Validation result:', validation);
      
      // Show validation errors if any
      if (!validation.isValid) {
        LocationFormManager.showFormErrors(validation.errors, form);
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        LocationFormManager.showFormWarnings(validation.warnings, form);
      }

      // Handle save vs edit
      if (form.id === 'edit-location-form') {
        await LocationEventManager.handleEditFormSubmit(form, locationData);
      } else {
        await LocationEventManager.handleSaveFormSubmit(form, locationData);
      }
      
      // Close dialog with small delay to ensure notification shows
      setTimeout(() => {
        LocationEventManager.closeActiveDialog();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error in handleFormSubmit:', error);
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
    console.log('🔍 Updating existing location with place_id:', placeId);
    
    await window.Locations.updateLocation(placeId, locationData);
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
    console.log('🔍 Save location result:', result);
    
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
