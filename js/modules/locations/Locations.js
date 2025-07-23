/**
 * Unified Locations Module
 * Handles all location CRUD operations, UI rendering, and map marker interactions
 * Enhanced with advanced marker system integration
 */

import { StateManager } from '../state/AppState.js';
import { LocationsAPI } from './LocationsAPI.js';
import { LocationsUI } from './LocationsUI.js';
import { MarkerService } from '../maps/MarkerService.js';

/**
 * Main Locations Module
 * Coordinates data operations and UI interactions
 */
export class Locations {

  /**
   * Initialize the locations system
   */
  static async initialize() {
    console.log('📍 Initializing Unified Locations Module');
    
    try {
      // Initialize API and data layer
      await LocationsAPI.initialize();
      
      // Initialize UI layer
      LocationsUI.initialize();
      
      // Load initial data
      await this.loadSavedLocations();
      
      console.log('✅ Unified Locations Module initialized');
      
    } catch (error) {
      console.error('❌ Error initializing locations:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
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
      console.log('💾 Saving new location:', locationData);
      
      const savedLocation = await LocationsAPI.saveLocation(locationData);
      console.log('✅ Location saved to server:', savedLocation);
      
      // Update state immediately with the new location for instant UI feedback
      const currentLocations = StateManager.getSavedLocations();
      const updatedLocations = [...currentLocations, savedLocation];
      StateManager.setSavedLocations(updatedLocations);
      
      // Update UI with the immediate change
      LocationsUI.renderLocationsList(updatedLocations);
      
      console.log('🔄 Locations list updated immediately with new location');
      
      return savedLocation;
    } catch (error) {
      console.error('❌ Error saving location:', error);
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
   * Delete a location
   * @param {string} placeId - Location ID to delete
   */
  static async deleteLocation(placeId) {
    try {
      await LocationsAPI.deleteLocation(placeId);
      
      // Update state
      const currentLocations = StateManager.getSavedLocations();
      const filteredLocations = currentLocations.filter(loc => 
        (loc.place_id || loc.id) !== placeId
      );
      StateManager.setSavedLocations(filteredLocations);
      
      // Update UI
      await this.refreshLocationsList();
      
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
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
   * Show location details dialog
   * @param {Object|string} location - Location object or place_id
   */
  static async showLocationDetails(location) {
    if (typeof location === 'string') {
      location = this.getLocationById(location);
    }
    if (location) {
      LocationsUI.showLocationDetailsDialog(location);
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
    if (typeof location === 'string') {
      location = this.getLocationById(location);
    }
    
    if (!location || !location.lat || !location.lng) {
      console.warn('Location not found or missing coordinates');
      return;
    }
    
    // Center map on location
    MarkerService.centerMapOnLocation(location.lat, location.lng);
    
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
      
      // Show info window
      MarkerService.showLocationInfoWindow(marker, location);
      
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
    
    // Apply marker filters
    MarkerService.applyMarkerFilters();
    
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

  static deleteSavedLocation(placeId) {
    return this.deleteLocation(placeId);
  }

  static deleteSavedLocationFromInfo(placeId) {
    return this.deleteLocation(placeId);
  }

  static async goToPopularLocation(placeId, lat, lng) {
    if (window.MapService) {
      window.MapService.panTo({ lat: parseFloat(lat), lng: parseFloat(lng) });
      window.MapService.setZoom(15);
    }
  }

  // Event handler setup for backward compatibility
  static setupEventListeners() {
    LocationsUI.setupEventListeners();
  }
}

// Make available globally for compatibility
if (typeof window !== 'undefined') {
  window.Locations = Locations;
}
