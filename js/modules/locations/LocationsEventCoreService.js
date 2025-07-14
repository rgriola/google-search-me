/**
 * Locations Event Core Service
 * Handles core location operations: save, view, delete events
 * Extracted from LocationsEventHandlers.js for Phase 4 refactoring
 */

import { LocationsService } from './LocationsService.js';
import { LocationsUI } from './LocationsUI.js';
import { SearchService } from '../maps/SearchService.js';
import { MarkerService } from '../maps/MarkerService.js';
import { AuthUICore } from '../auth/AuthUICore.js';
import { AuthNotificationService } from '../auth/AuthNotificationService.js';
import { StateManager } from '../state/AppState.js';

/**
 * Locations Event Core Service Class
 * Responsible for core location event handling: save, view, delete operations
 */
export class LocationsEventCoreService {

  /**
   * Initialize core location event handlers
   */
  static initialize() {
    console.log('🎯 Initializing Locations Event Core Service');
    
    this.setupCoreEventListeners();
    
    console.log('✅ Locations Event Core Service initialized');
  }

  /**
   * Setup core event listeners for location operations
   */
  static setupCoreEventListeners() {
    // Handle save location requests from info windows
    document.addEventListener('save-location', this.handleSaveLocationRequest.bind(this));
    
    // Handle view location on map requests
    document.addEventListener('view-location', this.handleViewLocationRequest.bind(this));
    
    // Handle location service events
    document.addEventListener('location-saved', this.handleLocationSaved.bind(this));
    document.addEventListener('location-deleted', this.handleLocationDeleted.bind(this));
    document.addEventListener('save-error', this.handleSaveError.bind(this));
    document.addEventListener('delete-error', this.handleDeleteError.bind(this));
    
    console.log('✅ Core event listeners attached');
  }

  /**
   * Handle save location request from info window or other sources
   * @param {Event} event - Custom event with place data
   */
  static async handleSaveLocationRequest(event) {
    const { place } = event.detail;
    
    console.log('🎯 LocationsEventCoreService: Save location request received', place);
    
    if (!place || !place.place_id) {
      console.error('❌ Invalid place data for saving:', place);
      AuthNotificationService.showNotification('Invalid location data', 'error');
      return;
    }

    console.log('📍 Place ID:', place.place_id);
    console.log('🏷️ Place Name:', place.name);
    console.log('🔐 Is Authenticated:', StateManager.isAuthenticated());

    try {
      // Check if already saved
      if (LocationsService.isLocationSaved(place.place_id)) {
        console.log('ℹ️ Location already saved');
        AuthNotificationService.showNotification('Location already saved', 'info');
        return;
      }

      // Import dialog manager dynamically
      const { LocationsDialogManager } = await import('./LocationsDialogManager.js');
      
      // Show the save location dialog with pre-populated data from search
      LocationsDialogManager.showSaveLocationDialog(place);
      
    } catch (error) {
      console.error('❌ Error in save location handler:', error);
      AuthNotificationService.showNotification(`Failed to prepare save dialog: ${error.message}`, 'error');
    }
  }

  /**
   * Handle view location on map request
   * @param {Event} event - Custom event with place ID
   */
  static async handleViewLocationRequest(event) {
    const { placeId } = event.detail;
    
    if (!placeId) {
      console.error('No place ID provided for viewing location');
      return;
    }

    console.log('🎯 View location request for place ID:', placeId);

    try {
      // Get location from saved locations first
      let location = LocationsService.getSavedLocation(placeId);
      
      if (!location) {
        console.log('📍 Location not found in memory, fetching from API...');
        // Try to get from API if not in memory
        try {
          location = await LocationsService.getLocationByPlaceId(placeId);
        } catch (apiError) {
          console.error('API fetch failed:', apiError);
        }
      }

      if (!location) {
        console.error('Location not found:', placeId);
        AuthNotificationService.showNotification('Location not found', 'error');
        return;
      }

      console.log('📍 Found location:', location);

      // Create place object for map display
      const place = {
        place_id: location.place_id,
        name: location.name,
        formatted_address: location.address,
        geometry: {
          location: {
            lat: () => location.lat,
            lng: () => location.lng
          }
        }
      };

      // Show on map
      await MarkerService.showPlaceOnMap(place, {
        showInfoWindow: true,
        zoom: 15
      });

      // Import and use dialog helpers
      import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
        LocationsUIHelpers.showLocationDetails(location);
      });

    } catch (error) {
      console.error('❌ Error viewing location:', error);
      AuthNotificationService.showNotification('Failed to view location', 'error');
    }
  }

  /**
   * Handle location saved event
   * @param {Event} event - Location saved event
   */
  static handleLocationSaved(event) {
    console.log('🎉 Location saved successfully:', event.detail);
    
    // Show success notification
    AuthNotificationService.showNotification('Location saved successfully!', 'success');
    
    // Update UI
    LocationsUI.renderLocations();
    
    // Dispatch to UI service for button state updates
    this.dispatchCoreEvent('location-saved-ui-update', {
      placeId: event.detail.placeId,
      location: event.detail.location
    });
    
    // Load and display notification for saved location
    import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
      if (event.detail.location) {
        LocationsUIHelpers.showNotification('Location saved successfully!', 'success');
      }
    });
  }

  /**
   * Handle location deleted event
   * @param {Event} event - Location deleted event
   */
  static handleLocationDeleted(event) {
    console.log('🗑️ Location deleted:', event.detail);
    
    // Show success notification
    AuthNotificationService.showNotification('Location removed successfully!', 'success');
    
    // Update UI
    LocationsUI.renderLocations();
    
    // Dispatch to UI service for any UI updates
    this.dispatchCoreEvent('location-deleted-ui-update', {
      placeId: event.detail.placeId
    });
    
    // Show notification
    import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
      LocationsUIHelpers.showNotification('Location removed successfully!', 'success');
    });
  }

  /**
   * Handle save error event
   * @param {Event} event - Save error event
   */
  static handleSaveError(event) {
    const error = event.detail.error || 'Unknown error';
    console.error('Save location error:', error);
    
    // Show error notification
    AuthNotificationService.showNotification(`Failed to save location: ${error}`, 'error');
    
    // Dispatch to UI service for button state updates
    this.dispatchCoreEvent('save-error-ui-update', {
      placeId: event.detail.placeId,
      error: error
    });
    
    // Show enhanced error notification
    import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
      LocationsUIHelpers.showNotification(`Failed to save location: ${error}`, 'error');
    });
  }

  /**
   * Handle delete error event
   * @param {Event} event - Delete error event
   */
  static handleDeleteError(event) {
    const error = event.detail.error || 'Unknown error';
    console.error('Delete location error:', error);
    
    // Show error notification
    AuthNotificationService.showNotification(`Failed to delete location: ${error}`, 'error');
    
    // Dispatch to UI service for any UI updates
    this.dispatchCoreEvent('delete-error-ui-update', {
      placeId: event.detail.placeId,
      error: error
    });
  }

  /**
   * Handle authentication state changes
   * @param {Event} event - User logged in event
   */
  static async handleUserLoggedIn(event) {
    try {
      console.log('🔑 User logged in - reloading locations from API');
      
      // Load saved locations from API
      await LocationsService.loadSavedLocations();
      
      // Refresh UI
      LocationsUI.renderLocations();
      
      // Show welcome notification
      AuthNotificationService.showNotification('Welcome back! Your saved locations have been loaded.', 'success');
      
      console.log('✅ Loaded saved locations after login');
      
    } catch (error) {
      console.error('❌ Error loading locations after login:', error);
      AuthNotificationService.showNotification('Error loading your saved locations', 'error');
    }
  }

  /**
   * Handle user logged out event
   * @param {Event} event - User logged out event
   */
  static handleUserLoggedOut(event) {
    console.log('🚪 User logged out - switching to local storage');
    
    // Load from localStorage as fallback
    LocationsService.loadFromLocalStorage();
    
    // Refresh UI
    LocationsUI.renderLocations();
    
    // Show logout notification
    AuthNotificationService.showNotification('Logged out. Showing locally saved locations.', 'info');
    
    console.log('✅ Switched to localStorage locations after logout');
  }

  // Global compatibility methods for HTML onclick handlers

  /**
   * Save current location - Global compatibility method
   */
  static async saveCurrentLocation() {
    try {
      const currentPlace = MarkerService.getCurrentPlace();
      if (!currentPlace) {
        AuthNotificationService.showNotification('No location selected. Please search for a place first.', 'warning');
        return;
      }
      
      const saveEvent = new CustomEvent('save-location', {
        detail: { place: currentPlace }
      });
      document.dispatchEvent(saveEvent);
    } catch (error) {
      console.error('Error saving current location:', error);
      AuthNotificationService.showNotification('Failed to save location', 'error');
    }
  }

  /**
   * Go to saved location - Global compatibility method
   */
  static async goToSavedLocation(placeId) {
    try {
      const viewEvent = new CustomEvent('view-location', {
        detail: { placeId, source: 'saved' }
      });
      document.dispatchEvent(viewEvent);
    } catch (error) {
      console.error('Error going to saved location:', error);
      AuthNotificationService.showNotification('Failed to load location', 'error');
    }
  }

  /**
   * Delete saved location - Global compatibility method
   */
  static async deleteSavedLocation(placeId) {
    try {
      if (!confirm('Are you sure you want to remove this saved location?')) {
        return;
      }
      
      await LocationsService.deleteLocation(placeId);
      AuthNotificationService.showNotification('Location removed successfully!', 'success');
    } catch (error) {
      console.error('Error deleting saved location:', error);
      AuthNotificationService.showNotification('Failed to remove location', 'error');
    }
  }

  /**
   * Delete saved location from info window - Global compatibility method
   */
  static async deleteSavedLocationFromInfo(placeId) {
    await this.deleteSavedLocation(placeId);
    MarkerService.closeInfoWindow();
  }

  /**
   * Go to popular location - Global compatibility method
   */
  static async goToPopularLocation(placeId, lat, lng) {
    try {
      // Clear existing markers
      MarkerService.clearMarkers();
      
      // Show the location on map
      const position = { lat, lng };
      
      // Get place details if available
      try {
        const place = await SearchService.getPlaceDetails(placeId);
        if (place) {
          await MarkerService.showPlaceOnMap(place, {
            showInfoWindow: true,
            zoom: 15
          });
          return;
        }
      } catch (error) {
        console.warn('Could not get place details, using coordinates:', error);
      }
      
      // Fallback: show marker at coordinates
      await MarkerService.addMarker(position, {
        title: 'Popular Location',
        showInfoWindow: true,
        zoom: 15
      });
      
    } catch (error) {
      console.error('Error going to popular location:', error);
      AuthNotificationService.showNotification('Failed to load popular location', 'error');
    }
  }

  /**
   * Dispatch core event for coordination with UI service
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchCoreEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Load and display all saved locations
   * Reloads data from server and updates UI
   */
  static async loadAndDisplayLocations() {
    try {
      // Reload locations from API
      await LocationsService.loadSavedLocations();
      
      // Dispatch event to notify UI components
      this.dispatchCoreEvent('locations-reloaded', {});
      
      console.log('✅ Locations reloaded and displayed');
      
    } catch (error) {
      console.error('❌ Error loading and displaying locations:', error);
      AuthNotificationService.showNotification('Failed to reload locations', 'error');
    }
  }
}

// Export individual functions for backward compatibility
export const handleSaveLocationRequest = LocationsEventCoreService.handleSaveLocationRequest.bind(LocationsEventCoreService);
export const handleViewLocationRequest = LocationsEventCoreService.handleViewLocationRequest.bind(LocationsEventCoreService);
export const saveCurrentLocation = LocationsEventCoreService.saveCurrentLocation.bind(LocationsEventCoreService);
export const goToSavedLocation = LocationsEventCoreService.goToSavedLocation.bind(LocationsEventCoreService);
export const deleteSavedLocation = LocationsEventCoreService.deleteSavedLocation.bind(LocationsEventCoreService);
