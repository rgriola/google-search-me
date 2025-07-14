/**
 * Location Event Handlers
 * Manages core event listeners and handlers for location-related events
 */

import { LocationsService } from './LocationsService.js';
import { LocationsUI } from './LocationsUI.js';
import { SearchService } from '../maps/SearchService.js';
import { MarkerService } from '../maps/MarkerService.js';
import { AuthUI } from '../auth/AuthUI.js';
import { StateManager } from '../state/AppState.js';

/**
 * Locations Event Handlers Class
 */
export class LocationsEventHandlers {

  /**
   * Initialize locations event handlers
   */
  static initialize() {
    console.log('🎯 Initializing Locations Event Handlers');
    
    this.setupEventListeners();
    
    console.log('✅ Locations Event Handlers initialized');
  }

  /**
   * Setup global event listeners
   */
  static setupEventListeners() {
    // Handle save location requests from info windows
    document.addEventListener('save-location', this.handleSaveLocationRequest.bind(this));
    
    // Handle view location on map requests
    document.addEventListener('view-location', this.handleViewLocationRequest.bind(this));
    
    // Handle location service events
    document.addEventListener('location-saved', this.handleLocationSaved.bind(this));
    document.addEventListener('location-deleted', this.handleLocationDeleted.bind(this));
    document.addEventListener('save-error', this.handleSaveError.bind(this));
    document.addEventListener('delete-error', this.handleDeleteError.bind(this));
    
    // Handle notification requests
    document.addEventListener('show-notification', this.handleNotificationRequest.bind(this));
    
    // Handle authentication state changes
    document.addEventListener('user-logged-in', this.handleUserLoggedIn.bind(this));
    document.addEventListener('user-logged-out', this.handleUserLoggedOut.bind(this));
  }

  /**
   * Handle save location request from info window or other sources
   * @param {Event} event - Custom event with place data
   */
  static async handleSaveLocationRequest(event) {
    const { place } = event.detail;
    
    console.log('🎯 LocationsEventHandlers: Save location request received', place);
    
    if (!place || !place.place_id) {
      console.error('❌ Invalid place data for saving:', place);
      AuthUI.showNotification('Invalid location data', 'error');
      return;
    }

    console.log('📍 Place ID:', place.place_id);
    console.log('🏷️ Place Name:', place.name);
    console.log('🔐 Is Authenticated:', StateManager.isAuthenticated());

    try {
      // Check if already saved
      if (LocationsService.isLocationSaved(place.place_id)) {
        console.log('ℹ️ Location already saved');
        AuthUI.showNotification('Location already saved', 'info');
        return;
      }

      // Import dialog manager dynamically
      const { LocationsDialogManager } = await import('./LocationsDialogManager.js');
      
      // Show the save location dialog with pre-populated data from search
      LocationsDialogManager.showSaveLocationDialog(place);
      
    } catch (error) {
      console.error('❌ Error in save location handler:', error);
      AuthUI.showNotification(`Failed to prepare save dialog: ${error.message}`, 'error');
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

    try {
      // Get place details from Google Places API
      const placeDetails = await SearchService.getPlaceDetails(placeId);
      
      // Show on map with info window
      await MarkerService.showPlaceOnMap(placeDetails, {
        showInfoWindow: true,
        zoom: 16,
        clearExisting: true
      });
      
      // Collapse sidebar on mobile for better map view
      if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && !sidebar.classList.contains('collapsed')) {
          LocationsUI.toggleSidebar();
        }
      }
      
    } catch (error) {
      console.error('Error viewing location on map:', error);
      AuthUI.showNotification('Failed to load location details', 'error');
    }
  }

  /**
   * Handle successful location save
   * @param {Event} event - Location saved event
   */
  static handleLocationSaved(event) {
    const { location, place } = event.detail;
    
    // Import UI helpers dynamically
    import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
      // Update save button state
      LocationsUIHelpers.updateSaveButtonState('saved');
    });
    
    // Update locations count in UI
    this.updateLocationCount();
    
    console.log('Location saved successfully:', location?.name || place?.name);
  }

  /**
   * Handle successful location deletion
   * @param {Event} event - Location deleted event
   */
  static handleLocationDeleted(event) {
    const { placeId } = event.detail;
    
    // Show success notification
    AuthUI.showNotification('Location removed successfully', 'success');
    
    // Update locations count in UI
    this.updateLocationCount();
    
    // Import UI helpers dynamically
    import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
      // Update save button if info window is open for this location
      LocationsUIHelpers.updateSaveButtonForPlace(placeId, 'not-saved');
    });
    
    console.log('Location deleted successfully:', placeId);
  }

  /**
   * Handle save error
   * @param {Event} event - Save error event
   */
  static handleSaveError(event) {
    const { error, place } = event.detail;
    
    // Import UI helpers dynamically
    import('./LocationsUIHelpers.js').then(({ LocationsUIHelpers }) => {
      // Update save button state
      LocationsUIHelpers.updateSaveButtonState('error');
    });
    
    // Show error notification
    const message = error.message || 'Failed to save location';
    AuthUI.showNotification(message, 'error');
    
    console.error('Save location error:', error);
  }

  /**
   * Handle delete error
   * @param {Event} event - Delete error event
   */
  static handleDeleteError(event) {
    const { error, placeId } = event.detail;
    
    // Show error notification
    const message = error.message || 'Failed to delete location';
    AuthUI.showNotification(message, 'error');
    
    console.error('Delete location error:', error);
  }

  /**
   * Handle notification requests
   * @param {Event} event - Show notification event
   */
  static handleNotificationRequest(event) {
    const { message, type } = event.detail;
    AuthUI.showNotification(message, type);
  }

  /**
   * Handle user logged in
   * @param {Event} event - User logged in event
   */
  static async handleUserLoggedIn(event) {
    try {
      // Load saved locations from API
      await LocationsService.loadSavedLocations();
      
      // Refresh UI
      LocationsUI.renderLocations();
      
      console.log('Loaded saved locations after login');
      
    } catch (error) {
      console.error('Error loading locations after login:', error);
    }
  }

  /**
   * Handle user logged out
   * @param {Event} event - User logged out event
   */
  static handleUserLoggedOut(event) {
    // Load from localStorage as fallback
    LocationsService.loadFromLocalStorage();
    
    // Refresh UI
    LocationsUI.renderLocations();
    
    console.log('Switched to localStorage locations after logout');
  }

  /**
   * Update save button state in info window
   * @param {string} state - Button state (saving, saved, error, not-saved)
   */
  static updateSaveButtonState(state) {
    const saveBtn = document.getElementById('saveLocationBtn');
    if (!saveBtn) return;

    switch (state) {
      case 'saving':
        saveBtn.textContent = '⏳ Saving...';
        saveBtn.disabled = true;
        saveBtn.className = 'save-location-btn saving';
        break;
        
      case 'saved':
        saveBtn.textContent = '✅ Saved';
        saveBtn.disabled = true;
        saveBtn.className = 'save-location-btn saved';
        break;
        
      case 'error':
        saveBtn.textContent = '💾 Save Location';
        saveBtn.disabled = false;
        saveBtn.className = 'save-location-btn error';
        // Reset to normal state after 3 seconds
        setTimeout(() => {
          if (saveBtn) {
            saveBtn.className = 'save-location-btn';
          }
        }, 3000);
        break;
        
      case 'not-saved':
        saveBtn.textContent = '💾 Save Location';
        saveBtn.disabled = false;
        saveBtn.className = 'save-location-btn';
        break;
    }
  }

  /**
   * Update save button for a specific place
   * @param {string} placeId - Place ID
   * @param {string} state - Button state
   */
  static updateSaveButtonForPlace(placeId, state) {
    const saveBtn = document.getElementById('saveLocationBtn');
    if (!saveBtn) return;
    
    // Check if current info window is for this place
    const currentPlaceId = saveBtn.dataset.placeId;
    if (currentPlaceId === placeId) {
      this.updateSaveButtonState(state);
    }
  }

  /**
   * Update locations count in sidebar
   */
  static updateLocationCount() {
    import('./LocationsService.js').then(({ LocationsService }) => {
      const locations = LocationsService.getAllSavedLocations();
      const countElement = document.querySelector('.locations-count');
      
      if (countElement) {
        countElement.textContent = locations.length;
      }
      
      // Update sidebar header if it exists
      const sidebarHeader = document.querySelector('.sidebar h2');
      if (sidebarHeader) {
        const baseText = 'Saved Locations';
        sidebarHeader.textContent = locations.length > 0 ? 
          `${baseText} (${locations.length})` : baseText;
      }
    });
  }

  /**
   * Handle bulk operations
   * @param {string} operation - Operation type (export, import, clear)
   * @param {*} data - Operation data
   */
  static async handleBulkOperation(operation, data = null) {
    try {
      const { LocationsService } = await import('./LocationsService.js');
      const { LocationsUI } = await import('./LocationsUI.js');
      const { AuthUI } = await import('../auth/AuthUI.js');

      switch (operation) {
        case 'export':
          LocationsUI.handleExport();
          break;
          
        case 'import':
          if (data) {
            await LocationsService.importLocations(data);
          }
          break;
          
        case 'clear':
          await LocationsService.clearAllLocations();
          break;
          
        default:
          console.warn('Unknown bulk operation:', operation);
      }
    } catch (error) {
      console.error(`Error in bulk operation ${operation}:`, error);
      const { AuthUI } = await import('../auth/AuthUI.js');
      AuthUI.showNotification(`Failed to ${operation} locations`, 'error');
    }
  }

  /**
   * Handle keyboard shortcuts for locations
   * @param {KeyboardEvent} event - Keyboard event
   */
  static handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Export locations
          import('./LocationsUI.js').then(({ LocationsUI }) => {
            LocationsUI.handleExport();
          });
        }
        break;
        
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Focus search input
          const searchInput = document.getElementById('locationsSearch');
          if (searchInput) {
            searchInput.focus();
          }
        }
        break;
        
      case 'Escape':
        // Clear search
        const searchInput = document.getElementById('locationsSearch');
        if (searchInput && searchInput.value) {
          import('./LocationsUI.js').then(({ LocationsUI }) => {
            LocationsUI.clearSearch();
          });
        }
        break;
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  static initializeKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  /**
   * Load and display all saved locations
   * Reloads data from server and updates UI
   */
  static async loadAndDisplayLocations() {
    try {
      // Import LocationsService to reload data
      const { LocationsService } = await import('./LocationsService.js');
      
      // Reload locations from API
      await LocationsService.loadSavedLocations();
      
      // Update locations count
      this.updateLocationCount();
      
      // Dispatch event to notify UI components
      this.dispatchEvent('locations-reloaded', {});
      
      console.log('✅ Locations reloaded and displayed');
      
    } catch (error) {
      console.error('❌ Error loading and displaying locations:', error);
    }
  }

  // Global compatibility methods for HTML onclick handlers
  
  /**
   * Save current location - Global compatibility method
   */
  static async saveCurrentLocation() {
    try {
      const { MarkerService } = await import('../maps/MarkerService.js');
      const { AuthUI } = await import('../auth/AuthUI.js');
      
      const currentPlace = MarkerService.getCurrentPlace();
      if (!currentPlace) {
        AuthUI.showNotification('No location selected. Please search for a place first.', 'warning');
        return;
      }
      
      const saveEvent = new CustomEvent('save-location', {
        detail: { place: currentPlace }
      });
      document.dispatchEvent(saveEvent);
    } catch (error) {
      console.error('Error saving current location:', error);
      const { AuthUI } = await import('../auth/AuthUI.js');
      AuthUI.showNotification('Failed to save location', 'error');
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
      const { AuthUI } = await import('../auth/AuthUI.js');
      AuthUI.showNotification('Failed to load location', 'error');
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
      
      const { LocationsService } = await import('./LocationsService.js');
      const { AuthUI } = await import('../auth/AuthUI.js');
      
      await LocationsService.deleteLocation(placeId);
      AuthUI.showNotification('Location removed successfully!', 'success');
    } catch (error) {
      console.error('Error deleting saved location:', error);
      const { AuthUI } = await import('../auth/AuthUI.js');
      AuthUI.showNotification('Failed to remove location', 'error');
    }
  }
  
  /**
   * Delete saved location from info window - Global compatibility method
   */
  static async deleteSavedLocationFromInfo(placeId) {
    await this.deleteSavedLocation(placeId);
    const { MarkerService } = await import('../maps/MarkerService.js');
    MarkerService.closeInfoWindow();
  }
  
  /**
   * Go to popular location - Global compatibility method
   */
  static async goToPopularLocation(placeId, lat, lng) {
    try {
      const { MarkerService } = await import('../maps/MarkerService.js');
      const { SearchService } = await import('../maps/SearchService.js');
      const { AuthUI } = await import('../auth/AuthUI.js');
      
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
      const { AuthUI } = await import('../auth/AuthUI.js');
      AuthUI.showNotification('Failed to load popular location', 'error');
    }
  }

}
