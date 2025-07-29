/**
 * Location Event Handlers
 * Centralized event handling for location-related interactions
 */

import { LocationDialogManager } from './LocationDialogManager.js';
import { LocationFormManager } from './LocationFormManager.js';
import { StateManager } from '../../state/AppState.js';

export class LocationEventHandlers {
  
  /**
   * Setup all event listeners
   */
  static setupEventListeners() {
    this.setupDocumentEventListeners();
    this.setupFormEventListeners();
  }

  /**
   * Setup document-level event listeners
   */
  static setupDocumentEventListeners() {
    // Handle clicks on location items and buttons
    document.addEventListener('click', async (event) => {
      await this.handleDocumentClick(event);
    });

    // Handle form input changes for character counting and validation
    document.addEventListener('input', (event) => {
      this.handleDocumentInput(event);
    });

    // Handle escape key to close dialogs
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && LocationDialogManager.isDialogOpen()) {
        LocationDialogManager.closeActiveDialog();
      }
    });
  }

  /**
   * Setup form-specific event listeners
   */
  static setupFormEventListeners() {
    // Form submission prevention on non-submit elements
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.id === 'save-location-form' || form.id === 'edit-location-form') {
        event.preventDefault();
        this.handleFormSubmit(form);
      }
    });
  }

  /**
   * Handle document click events
   * @param {Event} event - Click event
   */
  static async handleDocumentClick(event) {
    // Prevent form submission on dialog content clicks (except submit buttons)
    const dialogContent = event.target.closest('.location-dialog, .dialog');
    if (dialogContent && !event.target.matches('button[type="submit"], .submit-btn, .save-btn, .primary-btn, .close-dialog, .modal-close')) {
      // This is a click on dialog content that's not a submit button or close button
      return;
    }

    // Handle location item clicks
    const locationItem = event.target.closest('.location-item');
    if (locationItem) {
      const placeId = locationItem.getAttribute('data-place-id');
      const action = event.target.getAttribute('data-action');
      
      await this.handleLocationItemAction(placeId, action);
      return;
    }

    // Handle dialog form submissions - only on submit button clicks
    if (event.target.type === 'submit' || event.target.matches('button[type="submit"], .submit-btn, .save-btn, .primary-btn')) {
      const form = event.target.closest('form');
      if (form && (form.id === 'save-location-form' || form.id === 'edit-location-form')) {
        event.preventDefault();
        this.handleFormSubmit(form);
      }
      return;
    }

    // Handle dialog close buttons
    if (event.target.matches('.close-dialog, .modal-close')) {
      LocationDialogManager.closeActiveDialog();
      return;
    }
  }

  /**
   * Handle document input events
   * @param {Event} event - Input event
   */
  static handleDocumentInput(event) {
    // Handle production notes character counting
    if (event.target.matches('#location-production-notes')) {
      LocationFormManager.updateCharacterCount(event.target);
    }

    // Handle real-time form validation
    const form = event.target.closest('form');
    if (form && (form.id === 'save-location-form' || form.id === 'edit-location-form')) {
      // Clear validation styling on input
      LocationFormManager.clearFieldValidation(event.target);
    }
  }

  /**
   * Handle location item actions
   * @param {string} placeId - Location place ID
   * @param {string} action - Action to perform
   */
  static async handleLocationItemAction(placeId, action) {
    switch (action) {
      case 'view':
        await this.handleViewLocation(placeId);
        break;
      case 'edit':
        await this.handleEditLocation(placeId);
        break;
      case 'delete':
        await this.handleDeleteLocation(placeId);
        break;
      default:
        // Default action - show details
        await this.handleViewLocation(placeId);
    }
  }

  /**
   * Handle view location
   * @param {string} placeId - Location ID
   */
  static async handleViewLocation(placeId) {
    const location = this.getLocationById(placeId);
    if (!location) {
      console.error('Location not found:', placeId);
      return;
    }
    
    // First, center the map on the location
    if (location.lat && location.lng) {
      // Direct map centering for immediate response
      if (window.MapService) {
        window.MapService.centerMap(location.lat, location.lng, 16);
      }
      
      // Also show marker and info window if MarkerService is available
      if (window.MarkerService) {
        try {
          // Create a proper place object with Google Maps LatLng format
          const place = {
            geometry: { 
              location: new google.maps.LatLng(location.lat, location.lng)
            },
            name: location.name,
            formatted_address: location.formatted_address || location.address,
            place_id: location.place_id || location.id
          };
          
          window.MarkerService.showPlaceOnMap(place, {
            zoom: 16, // Use a closer zoom level for better view
            showInfoWindow: true
          });
        } catch (error) {
          console.warn('Error showing place on map:', error);
          // Fallback to direct centering if LatLng creation fails
          if (window.MapService) {
            window.MapService.centerMap(location.lat, location.lng, 16);
          }
        }
      }
    }
    
    // Then show the dialog in top-right corner
    LocationDialogManager.showLocationDetailsDialog(location, 'top-right');
  }

  /**
   * Handle edit location
   * @param {string} placeId - Location ID
   */
  static async handleEditLocation(placeId) {
    const location = this.getLocationById(placeId);
    if (location) {
      LocationDialogManager.showEditLocationDialog(location);
    }
  }

  /**
   * Handle delete location
   * @param {string} placeId - Location ID
   */
  static async handleDeleteLocation(placeId) {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      await window.Locations.deleteLocation(placeId);
      this.showNotification('Location deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting location:', error);
      this.showNotification('Error deleting location', 'error');
    }
  }

  /**
   * Handle form submission
   * @param {HTMLFormElement} form - Form element
   */
  static async handleFormSubmit(form) {
    console.log('🔍 LocationEventHandlers.handleFormSubmit() called with form:', form);
    
    try {
      // Extract and validate form data
      const formResult = LocationFormManager.extractFormData(form);
      const { data: locationData, validation } = formResult;
      
      // Show validation errors if any
      if (!validation.isValid) {
        LocationFormManager.showFormErrors(validation.errors, form);
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        LocationFormManager.showFormWarnings(validation.warnings, form);
      }
      
      if (form.id === 'edit-location-form') {
        await this.handleEditFormSubmit(form, locationData);
      } else {
        await this.handleSaveFormSubmit(form, locationData);
      }
      
      // Close dialog with small delay to ensure notification shows
      setTimeout(() => {
        LocationDialogManager.closeActiveDialog();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      this.showNotification(`Error saving location: ${error.message}`, 'error');
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
    
    // Upload any pending photos after successful location update
    if (window.pendingEditPhotos && window.pendingEditPhotos.length > 0 && window.LocationsUI) {
      console.log('🔍 Uploading pending edit photos:', window.pendingEditPhotos.length);
      await window.LocationsUI.photoManager.uploadPendingPhotos(window.pendingEditPhotos, placeId);
      window.pendingEditPhotos = []; // Clear after upload
    }
    
    this.showNotification(`Location "${locationData.name}" updated successfully`, 'success');
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
    
    // Extract place_id from the result for photo upload
    const placeId = locationData.place_id || result?.placeId || result?.place_id;
    console.log('🔍 Photo upload check - placeId:', placeId);
    console.log('🔍 Photo upload check - window.pendingPhotos:', window.pendingPhotos);
    console.log('🔍 Photo upload check - pendingPhotos length:', window.pendingPhotos?.length || 0);
    
    // Upload any pending photos after successful location save
    if (window.pendingPhotos && window.pendingPhotos.length > 0 && placeId && window.LocationsUI) {
      console.log('🔍 Uploading pending save photos:', window.pendingPhotos.length);
      await window.LocationsUI.photoManager.uploadPendingPhotos(window.pendingPhotos, placeId);
      window.pendingPhotos = []; // Clear after upload
    } else {
      console.log('🔍 No pending photos to upload or missing placeId');
    }
    
    // Show success notification
    this.showNotification(`Location "${locationData.name}" saved`, 'success');
    
    // Refresh the saved locations list automatically
    await window.Locations.refreshLocationsList();
    console.log('✅ Locations list refreshed after GPS save');
    
    // Update GPS marker visual state if this was a GPS save
    if (window.currentGPSMarkerData && window.MapService) {
      window.MapService.updateGPSMarkerAsSaved();
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get location by ID
   * @param {string} placeId - Location ID
   * @returns {Object|null} Location object
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => (loc.place_id || loc.id) === placeId);
  }

  /**
   * Show notification
   * @param {string} message - Message text
   * @param {string} type - Notification type
   */
  static showNotification(message, type = 'info') {
    // Use Auth notification service if available
    if (window.Auth) {
      const { AuthNotificationService } = window.Auth.getServices();
      AuthNotificationService.showNotification(message, type);
    } else {
      // Simple fallback
      alert(message);
    }
  }
}
