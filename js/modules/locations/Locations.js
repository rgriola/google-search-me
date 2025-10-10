/**
 * Unified Locations Module
 * Handles all location CRUD operations, UI rendering, and map marker interactions
 * Enhanced with advanced marker system integration
 */

import { StateManager } from '../state/AppState.js';
import { LocationsAPI } from './LocationsAPI.js';
import { LocationsUI } from './LocationsUI.js?v=7';
import { MarkerService } from '../maps/MarkerService.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'LOCATIONS';

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
    debug(FILE, '📍 Initializing Unified Locations Module');
    
    try {
      // Initialize UI layer immediately
      LocationsUI.initialize();
      
      // Set up global objects for backward compatibility
      this.setupGlobalObjects();
      
      // Check if user is authenticated for faster loading
      const authState = StateManager.getAuthState();
      const isAuthenticated = !!(authState?.currentUser && authState?.authToken);
      
      if (isAuthenticated) {
        debug(FILE, '👤 User authenticated - loading saved locations immediately');
        // Show loading state and then load locations data in parallel
        LocationsUI.showLocationsLoading();
        this.loadSavedLocationsAsync();
      }
      
      // Initialize notification system asynchronously
      try {
        const { NotificationService } = await import('../ui/NotificationService.js');
        NotificationService.initialize();
      } catch (error) {
        debug(FILE, '⚠️ NotificationService not available, continuing without it:', error, 'warn');
      }
      
      // Initialize API and data layer
      await LocationsAPI.initialize();
      
      debug(FILE, '✅ Unified Locations Module initialized');
      
    } catch (error) {
      debug(FILE, '❌ Error initializing locations:', error, 'error');
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
      
      debug(FILE, `✅ Loaded ${locations.length} locations asynchronously`);
      return locations;
    } catch (error) {
      debug(FILE, 'Error loading locations asynchronously:', error, 'error');
      LocationsUI.hideLocationsLoading();
      LocationsUI.renderLocationsList([]);
    }
  }

  /**
   * Setup global window objects for backward compatibility
   */
  static setupGlobalObjects() {
    if (typeof window === 'undefined') return;

    window.Locations = Locations;
    window.LocationsUI = LocationsUI;

    const photoManager = LocationsUI.photoManager;
    if (!photoManager) {
      debug(FILE, '❌ LocationsUI.photoManager not available when setting up globals', null, 'error');
      return;
    }

    window.LocationPhotoManager = photoManager;
    debug(FILE, '✅ Global photo manager exposed:', !!window.LocationPhotoManager);

    window.pendingPhotos ??= [];
    window.pendingEditPhotos ??= [];
    if (!window.pendingPhotos.length) debug(FILE, '✅ Initialized window.pendingPhotos array');
    if (!window.pendingEditPhotos.length) debug(FILE, '✅ Initialized window.pendingEditPhotos array');

    const requiredMethods = [
      'togglePhotoUpload',
      'removePhotoPreview',
      'updatePhotoCaption',
      'validatePhotoCaption',
      'uploadPendingPhotos',
      'handlePhotoFile',
      'processPhotoFiles'
    ];

    if (DEBUG) {
      requiredMethods.forEach(method => {
        if (typeof photoManager[method] === 'function') {
          debug(FILE, `✅ window.LocationPhotoManager.${method} is available`);
        } else {
          debug(FILE, `❌ window.LocationPhotoManager.${method} is NOT available`, null, 'error');
        }
      });
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
      
      debug(FILE, `✅ Loaded ${locations.length} locations with enhanced markers`);
      return locations;
    } catch (error) {
      debug(FILE, 'Error loading locations:', error, 'error');
      this.loadFromLocalStorage();
    }
  }

  /**
   * Save a new location
   * @param {Object} locationData - Location data to save
   */
  static async saveLocation(locationData) {
    try {
      debug(FILE, '💾 === SAVE LOCATION DEBUG START ===');
      debug(FILE, '💾 Raw location data received:', locationData);
      debug(FILE, '💾 Location data keys:', Object.keys(locationData));
      
      // Check for required fields before sending to server
      const requiredFields = ['type', 'entry_point', 'parking', 'access'];
      requiredFields.forEach(field => {
        const value = locationData[field];
        debug(FILE, `💾 Required field ${field}: "${value}" (type: ${typeof value}, valid: ${!!value && value.trim() !== ''})`);
      });
      
      debug(FILE, '💾 Calling LocationsAPI.saveLocation...');
      const savedLocation = await LocationsAPI.saveLocation(locationData);
      debug(FILE, '✅ Location saved to server successfully:', savedLocation);
      
      // Update state immediately with the new location for instant UI feedback
      const currentLocations = StateManager.getSavedLocations();
      const updatedLocations = [...currentLocations, savedLocation];
      StateManager.setSavedLocations(updatedLocations);
      
      // Update UI with the immediate change
      LocationsUI.renderLocationsList(updatedLocations);
      
      debug(FILE, '🔄 Locations list updated immediately with new location');
      debug(FILE, '💾 === SAVE LOCATION DEBUG END ===');
      
      return savedLocation;
    } catch (error) {
      debug(FILE, '❌ Error saving location:', error, 'error');
      debug(FILE, '❌ Error details:', error.message, 'error');
      debug(FILE, '❌ Error stack:', error.stack, 'error');
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
      debug(FILE, 'Error updating location:', error, 'error');
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
        debug(FILE, 'Location not found for deletion:', placeId, 'error');
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
          debug(FILE, `✅ Location "${locationName}" has been deleted successfully.`);
          
        } catch (error) {
          debug(FILE, 'Error deleting location:', error, 'error');
          debug(FILE, `❌ Failed to delete location "${locationName}". Please try again.`, null, 'error');
        }
      } else {
        debug(FILE, 'Location deletion cancelled by user');
      }
      
    } catch (error) {
      debug(FILE, 'Error in deleteLocation:', error, 'error');
    }
  }

  /**
   * Perform the actual location deletion (internal method)
   * @param {string} placeId - Location ID to delete
   */
  static async performDeleteLocation(placeId) {
    await LocationsAPI.deleteLocation(placeId); // << delete happens here
    
    // Update state
    const currentLocations = StateManager.getSavedLocations();
    const filteredLocations = currentLocations.filter(loc => 
      (loc.place_id || loc.id) !== placeId
    );
    StateManager.setSavedLocations(filteredLocations);
    
    // Update UI
    await this.refreshLocationsList();
  }  
  
  /**
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
      debug(FILE, '🔄 Refreshing locations list from server...');
      
      // Reload locations from server to get the latest data
      const locations = await LocationsAPI.getAllLocations();
      
      // Update state with fresh data
      StateManager.setSavedLocations(locations);
      
      // Update UI with fresh data
      LocationsUI.renderLocationsList(locations);
      
      // Update map markers with enhanced marker system
      await MarkerService.updateLocationMarkers(locations);
      
      debug(FILE, '✅ Locations list refreshed with', locations.length, 'locations and enhanced markers');
      
      return locations;
    } catch (error) {
      debug(FILE, '❌ Error refreshing locations list:', error, 'error');
      
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
      debug(FILE, `🎯 Highlighted marker for ${location.name}`);
    } else {
      debug(FILE, `No marker found for location: ${location.name}`, null, 'warn');
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
    
    debug(FILE, `🔍 Filtered locations by types: ${types.join(', ')}`);
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
    
    debug(FILE, `🗺️ Centered map on ${locations.length} locations`);
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
      debug(FILE, 'Error loading from localStorage:', error, 'error');
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
      debug(FILE, 'Error importing locations:', error, 'error');
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
        debug(FILE, '📍 Navigating to location:', location.name || location.address);
        
        // Use MapService.centerMap instead of panTo
        if (window.MapService) {
          window.MapService.centerMap(
            parseFloat(location.lat), 
            parseFloat(location.lng),
            15
          );
        }
        
      } else {
        debug(FILE, '❌ Location not found or missing coordinates:', placeId, 'error');
      }
    } catch (error) {
      debug(FILE, '❌ Error navigating to location:', error, 'error');
    }
  }
}
