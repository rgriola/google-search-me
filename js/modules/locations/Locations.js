/**
 * Unified Locations Module
 * Handles all location CRUD operations, UI rendering, and map marker interactions
 * Enhanced with advanced marker system integration
 */

import { StateManager } from '../state/AppState.js';
import { LocationsAPI } from './LocationsAPI.js';
import { LocationsUI } from './LocationsUI.js?v=7';
import { MarkerService } from '../maps/MarkerService.js';

/**
 * Main Locations Module
 * Coordinates data operations and UI interactions
 */
export class Locations {

  /**
   * Initialize the locations system
   * Optimized for faster loading of authenticated content
   */
  static async initialize() {
    console.log('📍 Initializing Unified Locations Module');
    
    try {
      // Initialize UI layer immediately
      LocationsUI.initialize();
      
      // Set up global objects for backward compatibility
      this.setupGlobalObjects();
      
      // Check if user is authenticated for faster loading
      const authState = StateManager.getAuthState();
      const isAuthenticated = !!(authState?.currentUser && authState?.authToken);
      
      if (isAuthenticated) {
        console.log('👤 User authenticated - loading saved locations immediately');
        // Show loading state and then load locations data in parallel
        LocationsUI.showLocationsLoading();
        this.loadSavedLocationsAsync();
      }
      
      // Initialize notification system asynchronously
      try {
        const { NotificationService } = await import('../ui/NotificationService.js');
        NotificationService.initialize();
      } catch (error) {
        console.warn('⚠️ NotificationService not available, continuing without it:', error);
      }
      
      // Initialize API and data layer
      await LocationsAPI.initialize();
      
      console.log('✅ Unified Locations Module initialized');
      
    } catch (error) {
      console.error('❌ Error initializing locations:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
    }
  }

  /**
   * Load saved locations asynchronously without blocking initialization
   */
  static async loadSavedLocationsAsync() {
    try {
      const locations = await LocationsAPI.getAllLocations();
      StateManager.setSavedLocations(locations);
      
      // Hide loading state and render locations
      LocationsUI.hideLocationsLoading();
      LocationsUI.renderLocationsList(locations);
      
      // Update map markers with enhanced marker system
      await MarkerService.updateLocationMarkers(locations);
      
      console.log(`✅ Loaded ${locations.length} locations asynchronously`);
      return locations;
    } catch (error) {
      console.error('Error loading locations asynchronously:', error);
      LocationsUI.hideLocationsLoading();
      LocationsUI.renderLocationsList([]);
    }
  }

  /**
   * Setup global window objects for backward compatibility
   */
  static setupGlobalObjects() {
    if (typeof window !== 'undefined') {
      window.Locations = Locations;
      window.LocationsUI = LocationsUI;
      
      // Ensure photoManager is available
      if (LocationsUI.photoManager) {
        window.LocationPhotoManager = LocationsUI.photoManager;
        console.log('✅ Global photo manager exposed:', !!window.LocationPhotoManager);
        
        // Initialize pending photo arrays if they don't exist
        if (!window.pendingPhotos) {
          window.pendingPhotos = [];
          console.log('✅ Initialized window.pendingPhotos array');
        }
        if (!window.pendingEditPhotos) {
          window.pendingEditPhotos = [];
          console.log('✅ Initialized window.pendingEditPhotos array');
        }
        
        // Verify key methods are available
        const methods = ['togglePhotoUpload', 'removePhotoPreview', 'updatePhotoCaption', 'validatePhotoCaption', 'uploadPendingPhotos', 'handlePhotoFile', 'processPhotoFiles'];
        methods.forEach(method => {
          if (typeof window.LocationPhotoManager[method] === 'function') {
            console.log(`✅ window.LocationPhotoManager.${method} is available`);
          } else {
            console.error(`❌ window.LocationPhotoManager.${method} is NOT available`);
          }
        });
      } else {
        console.error('❌ LocationsUI.photoManager not available when setting up globals');
      }
    }
  }

  /**
   * Load all saved locations and update map markers
   */
  static async loadSavedLocations() {
    try {
      const locations = await LocationsAPI.getAllLocations();
      StateManager.setSavedLocations(locations);
      LocationsUI.renderLocationsList(locations);
      
      // Update map markers with enhanced marker system
      await MarkerService.updateLocationMarkers(locations);
      
      console.log(`✅ Loaded ${locations.length} locations with enhanced markers`);
      return locations;
    } catch (error) {
      console.error('Error loading locations:', error);
      this.loadFromLocalStorage();
    }
  }

  /**
   * Save a new location
   * @param {Object} locationData - Location data to save
   */
  static async saveLocation(locationData) {
    try {
      console.log('💾 === SAVE LOCATION DEBUG START ===');
      console.log('💾 Raw location data received:', locationData);
      console.log('💾 Location data keys:', Object.keys(locationData));
      
      // Check for required fields before sending to server
      const requiredFields = ['type', 'entry_point', 'parking', 'access'];
      requiredFields.forEach(field => {
        const value = locationData[field];
        console.log(`💾 Required field ${field}: "${value}" (type: ${typeof value}, valid: ${!!value && value.trim() !== ''})`);
      });
      
      console.log('💾 Calling LocationsAPI.saveLocation...');
      const savedLocation = await LocationsAPI.saveLocation(locationData);
      console.log('✅ Location saved to server successfully:', savedLocation);
      
      // Update state immediately with the new location for instant UI feedback
      const currentLocations = StateManager.getSavedLocations();
      const updatedLocations = [...currentLocations, savedLocation];
      StateManager.setSavedLocations(updatedLocations);
      
      // Update UI with the immediate change
      LocationsUI.renderLocationsList(updatedLocations);
      
      console.log('🔄 Locations list updated immediately with new location');
      console.log('💾 === SAVE LOCATION DEBUG END ===');
      
      return savedLocation;
    } catch (error) {
      console.error('❌ Error saving location:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Update an existing location
   * @param {string} placeId - Location ID
   * @param {Object} updateData - Data to update
   */
  static async updateLocation(placeId, updateData) {
    try {
      const updatedLocation = await LocationsAPI.updateLocation(placeId, updateData);
      
      // Update state
      const currentLocations = StateManager.getSavedLocations();
      const updatedLocations = currentLocations.map(loc => 
        (loc.place_id || loc.id) === placeId ? updatedLocation : loc
      );
      StateManager.setSavedLocations(updatedLocations);
      
      // Update UI
      await this.refreshLocationsList();
      
      return updatedLocation;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a saved location with confirmation
   * @param {string} placeId - Location ID to delete
   */
  static async deleteLocation(placeId) {
    try {
      // Get location details for confirmation message
      const currentLocations = StateManager.getSavedLocations();
      const locationToDelete = currentLocations.find(loc => 
        (loc.place_id || loc.id) === placeId
      );
      
      if (!locationToDelete) {
        console.error('Location not found for deletion:', placeId);
        return;
      }
      
      const locationName = locationToDelete.name || locationToDelete.address || 'this location';
      // Show simple confirmation dialog for now
      const confirmed = confirm(`Are you sure you want to permanently delete "${locationName}"? This action cannot be undone.`);
      
      if (confirmed) {
        try {
          // Perform the actual deletion
          await this.performDeleteLocation(placeId);
          
          // Show success message
          console.log(`✅ Location "${locationName}" has been deleted successfully.`);
          
          // Try to use Auth notification if available
          if (window.Auth) {
            try {
              const { AuthNotificationService } = window.Auth.getServices();
              AuthNotificationService.showNotification(
                `Location "${locationName}" has been deleted successfully.`,
                'success'
              );
            } catch (error) {
              console.error('❌ Error using AuthNotificationService:', error);
            }
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          console.log(`❌ Failed to delete location "${locationName}". Please try again.`);
          
          // Try to use Auth notification if available
          if (window.Auth) {
            try {
              const { AuthNotificationService } = window.Auth.getServices();
              AuthNotificationService.showNotification(
                `Failed to delete location "${locationName}". Please try again.`,
                'error'
              );
            } catch (error) {
              console.error('❌ Error using AuthNotificationService:', error);
            }
          }
        }
      } else {
        console.log('Location deletion cancelled by user');
      }
      
    } catch (error) {
      console.error('Error in deleteLocation:', error);
    }
  }

  /**
   * Perform the actual location deletion (internal method)
   * @param {string} placeId - Location ID to delete
   */
  static async performDeleteLocation(placeId) {
    await LocationsAPI.deleteLocation(placeId);
    
    // Update state
    const currentLocations = StateManager.getSavedLocations();
    const filteredLocations = currentLocations.filter(loc => 
      (loc.place_id || loc.id) !== placeId
    );
    StateManager.setSavedLocations(filteredLocations);
    
    // Update UI
    await this.refreshLocationsList();
  }  /**
   * Get location by ID
   * @param {string} placeId - Location ID
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => (loc.place_id || loc.id) === placeId);
  }

  /**
   * Refresh the locations list in UI and update map markers
   */
  static async refreshLocationsList() {
    try {
      console.log('🔄 Refreshing locations list from server...');
      
      // Reload locations from server to get the latest data
      const locations = await LocationsAPI.getAllLocations();
      
      // Update state with fresh data
      StateManager.setSavedLocations(locations);
      
      // Update UI with fresh data
      LocationsUI.renderLocationsList(locations);
      
      // Update map markers with enhanced marker system
      await MarkerService.updateLocationMarkers(locations);
      
      console.log('✅ Locations list refreshed with', locations.length, 'locations and enhanced markers');
      
      return locations;
    } catch (error) {
      console.error('❌ Error refreshing locations list:', error);
      
      // Fallback to current state if server request fails
      const currentLocations = StateManager.getSavedLocations();
      LocationsUI.renderLocationsList(currentLocations);
      
      // Update markers with current data
      await MarkerService.updateLocationMarkers(currentLocations);
      
      return currentLocations;
    }
  }
  
  /**
   * Show edit location dialog
   * @param {Object|string} location - Location object or place_id
   */
  static async showEditLocationDialog(location) {
    if (typeof location === 'string') {
      location = this.getLocationById(location);
    }
    if (location) {
      LocationsUI.showEditLocationDialog(location);
    }
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    LocationsUI.showSaveLocationDialog(locationData);
  }

  // ==========================================
  // MAP INTERACTION METHODS
  // Enhanced marker integration
  // ==========================================

  /**
   * View location on map with marker highlighting
   * @param {Object|string} location - Location object or place_id
   */
  static viewLocationOnMap(location) {
   
    // Find and highlight the corresponding marker
    const markers = MarkerService.locationMarkers;
    const marker = markers.find(m => 
      m && m.locationData && 
      Math.abs(m.getPosition().lat() - parseFloat(location.lat)) < 0.0001 && 
      Math.abs(m.getPosition().lng() - parseFloat(location.lng)) < 0.0001
    );
    
    if (marker) {
      // Bounce animation
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 2000);
      
      // Show info window - this is the little box 
     // MarkerService.showLocationInfoWindow(marker, location);
      
      console.log(`🎯 Highlighted marker for ${location.name}`);
    } else {
      console.warn(`No marker found for location: ${location.name}`);
    }
  }

  /**
   * Filter locations by type
   * @param {Array} types - Array of location types to show
   */
  static filterLocationsByType(types) {
    // Update the filter checkboxes
    const checkboxes = document.querySelectorAll('.location-filters input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = types.includes(checkbox.value);
    });
    
    console.log(`🔍 Filtered locations by types: ${types.join(', ')}`);
  }

  /**
   * Toggle marker clustering
   */
  static toggleClustering() {
    MarkerService.toggleClustering();
  }

  /**
   * Center map on all locations
   */
  static centerMapOnAllLocations() {
    const locations = StateManager.getSavedLocations();
    if (!locations || locations.length === 0) return;
    
    // Calculate bounds of all locations
    const bounds = new google.maps.LatLngBounds();
    locations.forEach(location => {
      if (location.lat && location.lng) {
        bounds.extend(new google.maps.LatLng(
          parseFloat(location.lat), 
          parseFloat(location.lng)
        ));
      }
    });
    
    // Fit map to bounds
    const map = MarkerService.MapService?.getMap();
    if (map) {
      map.fitBounds(bounds);
      if (locations.length === 1) {
        // If only one location, set a reasonable zoom level
        setTimeout(() => map.setZoom(15), 100);
      }
    }
    
    console.log(`🗺️ Centered map on ${locations.length} locations`);
  }

  /**
   * Load from localStorage as fallback
   */
  static loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('savedLocations');
      if (savedData) {
        const locations = JSON.parse(savedData);
        StateManager.setSavedLocations(locations);
        LocationsUI.renderLocationsList(locations);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      StateManager.setSavedLocations([]);
    }
  }

  /**
   * Export locations data
   */
  static exportLocations() {
    const locations = StateManager.getSavedLocations();
    const dataStr = JSON.stringify(locations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `locations-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  /**
   * Import locations data
   * @param {File} file - JSON file to import
   */
  static async importLocations(file) {
    try {
      const text = await file.text();
      const locations = JSON.parse(text);
      
      if (Array.isArray(locations)) {
        // Save imported locations
        for (const location of locations) {
          await this.saveLocation(location);
        }
        
        await this.refreshLocationsList();
        return true;
      }
      throw new Error('Invalid file format');
    } catch (error) {
      console.error('Error importing locations:', error);
      throw error;
    }
  }

  // ===== BACKWARD COMPATIBILITY =====
  // These methods maintain compatibility with existing code

  static saveCurrentLocation() {
    // Get current map location and show save dialog
    const mapCenter = window.MapService?.getMapCenter();
    if (mapCenter) {
      this.showSaveLocationDialog({
        lat: mapCenter.lat,
        lng: mapCenter.lng,
        address: 'Current Location'
      });
    }
  }

  static async goToPopularLocation(placeId, lat, lng) {
    if (window.MapService) {
      window.MapService.centerMap(parseFloat(lat), parseFloat(lng), 15);
    }
  }

  /**
   * Navigate to a saved location by place_id
   * @param {string} placeId - Place ID of the location to navigate to
   */
  static async goToLocation(placeId) {
    try {
      const locations = StateManager.getSavedLocations();
      const location = locations.find(loc => (loc.place_id || loc.id) === placeId);
      
      if (location && location.lat && location.lng) {
        console.log('📍 Navigating to location:', location.name || location.address);
        
        // Use MapService.centerMap instead of panTo
        if (window.MapService) {
          window.MapService.centerMap(
            parseFloat(location.lat), 
            parseFloat(location.lng),
            15
          );
        }
        
      } else {
        console.error('❌ Location not found or missing coordinates:', placeId);
      }
    } catch (error) {
      console.error('❌ Error navigating to location:', error);
    }
  }
}
