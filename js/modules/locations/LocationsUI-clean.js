/**
 * Locations UI Service
 * Main UI controller for location display and interaction
 */

import { StateManager } from '../state/AppState.js';
import { LocationPhotoManager } from './ui/LocationPhotoManager.js';
import { LocationDialogService } from './LocationDialogService.js';
import { LocationFormManager } from './LocationFormManager.js';
import { LocationFormValidator } from './LocationFormValidator.js';
import { LocationTemplateEngine } from './LocationTemplateEngine.js';
import { LocationDisplayUtils } from './LocationDisplayUtils.js';
import { LocationEventManager } from './LocationEventManager.js';
import { LocationUtilityManager } from './LocationUtilityManager.js';

/**
 * Main Locations UI Controller
 * Coordinates location UI operations through specialized services
 */
export class LocationsUI {

  // Initialize the photo manager
  static photoManager = new LocationPhotoManager();

  /**
   * Initialize UI components
   */
  static initialize() {
    console.log('🎨 Initializing Locations UI');
    
    // Verify photoManager is available
    if (!this.photoManager) {
      console.error('❌ LocationsUI.photoManager is not available!');
      this.photoManager = new LocationPhotoManager();
    } else {
      console.log('✅ LocationsUI.photoManager is available');
    }
    
    this.setupUIElements();
    LocationEventManager.setupEventListeners();
    
    console.log('✅ Locations UI initialized');
  }

  /**
   * Setup UI elements
   */
  static setupUIElements() {
    // Check if savedLocationsList already exists (it should in app.html)
    let savedLocationsList = document.getElementById('savedLocationsList');
    if (savedLocationsList) {
      console.log('✅ Found existing savedLocationsList element');
      return;
    }
    
    // Fallback: create the elements if they don't exist
    console.log('⚠️ savedLocationsList not found, creating fallback elements');
    
    let savedLocationsContainer = document.getElementById('savedLocations');
    if (!savedLocationsContainer) {
      savedLocationsContainer = document.createElement('div');
      savedLocationsContainer.id = 'savedLocations';
      savedLocationsContainer.className = 'saved-locations-container';
      document.body.appendChild(savedLocationsContainer);
    }
    
    if (!savedLocationsList) {
      savedLocationsList = document.createElement('div');
      savedLocationsList.id = 'savedLocationsList';
      savedLocationsList.className = 'saved-locations-list';
      savedLocationsContainer.appendChild(savedLocationsList);
    }
  }

  // ===== COORDINATION METHODS =====

  /**
   * Render locations list using template engine
   * @param {Array} locations - Array of location objects
   */
  static renderLocationsList(locations) {
    const html = LocationTemplateEngine.generateLocationsList(locations);
    const container = document.getElementById('savedLocationsList');
    if (container) {
      container.innerHTML = html;
    }
  }

  /**
   * Show location details dialog
   * @param {Object} location - Location data
   * @param {string} position - Dialog position
   */
  static showLocationDetailsDialog(location, position = 'center') {
    LocationDialogService.showLocationView(location, position);
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data to edit
   */
  static showEditLocationDialog(location) {
    LocationDialogService.showEditLocationDialog(location);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    LocationDialogService.showSaveLocationDialog(locationData);
  }

  /**
   * Close active dialog
   */
  static closeActiveDialog() {
    LocationDialogService.closeActiveDialog();
  }

  /**
   * Show location view (alias for showLocationDetailsDialog)
   * @param {Object} location - Location to show
   */
  static showLocationView(location) {
    this.showLocationDetailsDialog(location, 'top-right');
  }

  /**
   * Get location by ID
   * @param {string} placeId - The place ID to find
   * @returns {Object|null} Location object or null if not found
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => (loc.place_id || loc.id) === placeId);
  }

  /**
   * Load and display saved locations
   */
  static async loadSavedLocations() {
    try {
      if (window.Locations && window.Locations.refreshLocationsList) {
        await window.Locations.refreshLocationsList();
      } else {
        console.warn('⚠️ window.Locations.refreshLocationsList not available');
      }
    } catch (error) {
      console.error('❌ Error loading saved locations:', error);
    }
  }

  /**
   * Save location using location service
   * @param {Object} locationData - Location data to save
   */
  static async saveLocation(locationData) {
    if (!window.Locations) {
      throw new Error('Locations service is not available');
    }
    return await window.Locations.saveLocation(locationData);
  }

  /**
   * Update location using location service
   * @param {Object} locationData - Location data to update
   */
  static async updateLocation(locationData) {
    if (!window.Locations) {
      throw new Error('Locations service is not available');
    }
    const placeId = locationData.placeId || locationData.place_id;
    return await window.Locations.updateLocation(placeId, locationData);
  }

  /**
   * Delete location using location service
   * @param {string} placeId - ID of location to delete
   */
  static async deleteLocation(placeId) {
    if (!window.Locations) {
      throw new Error('Locations service is not available');
    }
    await window.Locations.deleteLocation(placeId);
    await this.loadSavedLocations(); // Refresh list
  }

  /**
   * Show notification using utility manager
   * @param {string} message - The notification message
   * @param {string} type - The notification type
   */
  static showNotification(message, type = 'info') {
    LocationUtilityManager.showNotification(message, type);
  }
}
