import { StateManager } from '../state/AppState.js';

/**
 * LocationEventManager
 * Handles all event management for location UI operations
 * 
 * Responsibilities:
 * - Event delegation for location actions
 * - Form submission handling
 * - Location interaction management
 */
export class LocationEventManager {

  /**
   * Setup event listeners for location UI
   */
  static setupEventListeners() {
    console.log('🎧 Setting up LocationEventManager event listeners');
    
    // Delegate location action clicks
    document.addEventListener('click', (event) => {
      const locationItem = event.target.closest('.location-item');
      if (!locationItem) return;
      
      const action = event.target.dataset.action;
      const placeId = locationItem.dataset.placeId;
      
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
      }
    });
    
    // Dialog close handlers
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('close-dialog')) {
        // Import and call LocationsUI closeActiveDialog
        import('./LocationsUI.js').then(({ LocationsUI }) => {
          LocationsUI.closeActiveDialog();
        });
      }
    });
    
    // Form submission handlers
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.id === 'save-location-form' || form.id === 'edit-location-form') {
        event.preventDefault();
        LocationEventManager.handleFormSubmit(form);
      }
    });
  }

  /**
   * Handle view location action
   * @param {string} placeId - The place ID to view
   */
  static async handleViewLocation(placeId) {
    try {
      console.log('👀 LocationEventManager.handleViewLocation() called for placeId:', placeId);
      
      // Import LocationsUI and call the view method
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
      
      // Import LocationsUI and call the edit method
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
      
      // Import LocationsUI and call the delete method
      const { LocationsUI } = await import('./LocationsUI.js');
      const location = LocationsUI.getLocationById(placeId);
      
      if (!location) {
        console.error('❌ Location not found for placeId:', placeId);
        LocationEventManager.showNotification('Location not found', 'error');
        return;
      }
      
      if (confirm(`Are you sure you want to delete "${location.title}"?`)) {
        console.log('🗑️ Deleting location:', location);
        await LocationsUI.deleteLocation(placeId);
        LocationEventManager.showNotification('Location deleted successfully', 'success');
      }
      
    } catch (error) {
      console.error('❌ Error in handleDeleteLocation:', error);
      LocationEventManager.showNotification('Error deleting location', 'error');
    }
  }

  /**
   * Handle form submission
   * @param {HTMLFormElement} form - The form being submitted
   */
  static async handleFormSubmit(form) {
    try {
      console.log('� LocationEventManager.handleFormSubmit() called with form:', form);
      
      // Import LocationsUI and required validators
      const { LocationsUI } = await import('./LocationsUI.js');
      const { LocationFormValidator } = await import('./LocationFormValidator.js');
      
      const formData = new FormData(form);
      const locationData = {
        title: formData.get('title')?.trim() || '',
        description: formData.get('description')?.trim() || '',
        category: formData.get('category') || 'general',
        privacy: formData.get('privacy') || 'private',
        placeId: formData.get('placeId') || '',
        address: formData.get('address')?.trim() || '',
        latitude: parseFloat(formData.get('latitude')) || 0,
        longitude: parseFloat(formData.get('longitude')) || 0
      };
      
      console.log('� Extracted location data:', locationData);
      
      // Validate the form data
      const validation = LocationFormValidator.validateLocationData(locationData);
      if (!validation.isValid) {
        console.warn('⚠️ Form validation failed:', validation.errors);
        LocationEventManager.showNotification(validation.errors.join(', '), 'error');
        return;
      }
      
      // Handle photo queue if present
      if (LocationsUI.photoManager && LocationsUI.photoManager.hasQueuedPhotos()) {
        console.log('📷 Processing queued photos...');
        const photoResult = await LocationsUI.photoManager.processPhotoQueue(locationData.placeId);
        if (photoResult.success) {
          locationData.photos = photoResult.photos;
          console.log('✅ Photos processed:', locationData.photos);
        } else {
          console.warn('⚠️ Photo processing had issues:', photoResult.message);
        }
      }
      
      // Save the location
      if (form.id === 'edit-location-form') {
        await LocationsUI.updateLocation(locationData);
        LocationEventManager.showNotification('Location updated successfully', 'success');
      } else {
        await LocationsUI.saveLocation(locationData);
        LocationEventManager.showNotification('Location saved successfully', 'success');
      }
      
      // Close dialog and refresh
      LocationsUI.closeActiveDialog();
      LocationsUI.loadSavedLocations();
      
    } catch (error) {
      console.error('❌ Error in handleFormSubmit:', error);
      LocationEventManager.showNotification('Error saving location', 'error');
    }
  }

  /**
   * Show notification to user
   * @param {string} message - The notification message
   * @param {string} type - The notification type ('success', 'error', 'info')
   */
  static showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    
    // Try to use existing notification system
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }
    
    // Fallback to alert for now
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }
}
