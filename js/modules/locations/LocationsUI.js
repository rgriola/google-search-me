/**
 * Locations UI Service
 * Main UI controller for location display and interaction
 */

import { StateManager } from '../state/AppState.js';
import { LocationPhotoManager } from './ui/LocationPhotoManager.js';
import { LocationFormManager } from './ui/LocationFormManager.js';
import { LocationTemplates } from './LocationTemplates.js';
import { LocationUtilityManager } from './LocationUtilityManager.js';
import { LocationEventManager } from './LocationEventManager.js';
import { LocationDialogManager } from './ui/LocationDialogManager.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'LOCATIONS_UI';

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
    debug(FILE, '🎨 Initializing Locations UI');
    
    // Verify photoManager is available
    if (!this.photoManager) {
      debug(FILE, '❌ LocationsUI.photoManager is not available!', null, 'error');
      this.photoManager = new LocationPhotoManager();
    } else {
      debug(FILE, '✅ LocationsUI.photoManager is available');
    }
    
    this.setupUIElements();
    LocationEventManager.setupEventListeners();
    debug(FILE, '✅ Locations UI initialized');
  }

  /**
   * Setup UI elements
   */
  static setupUIElements() {
    // Check if savedLocationsList already exists (it should in app.html)
    let savedLocationsList = document.getElementById('savedLocationsList');
    if (savedLocationsList) {
      debug(FILE, '✅ Found existing savedLocationsList element');
      return;
    }

    if (!savedLocationsList) {
      savedLocationsList = document.createElement('div');
      savedLocationsList.id = 'savedLocationsList';
      savedLocationsList.className = 'saved-locations-list';
      const savedLocationsContainer = document.getElementById('savedLocationsContainer') || document.body;
      savedLocationsContainer.appendChild(savedLocationsList);
      debug(FILE, '✅ Created new savedLocationsList element');
    }
  }

  // ===== COORDINATION METHODS =====

  /**
   * Render locations list using template engine
   * @param {Array} locations - Array of location objects
   */
  static renderLocationsList(locations) {
    let html = '';
    if (!locations || locations.length === 0) {
      html = '<p class="no-locations">No saved locations yet.</p>';
    } else {
      // Use the working generateLocationItemHTML method directly
      html = locations.map(location => LocationTemplates.generateLocationItemHTML(location)).join('');
    }
    
    const container = document.getElementById('savedLocationsList');
    if (container) {
      container.innerHTML = html;
      container.classList.add('fade-in');
      debug(FILE, `✅ Rendered ${locations?.length || 0} locations`);
    }
  }

  /**
   * Show loading state for saved locations
   */
  static showLocationsLoading() {
    const container = document.getElementById('savedLocationsList');
    if (container) {
      container.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <span>Loading saved locations...</span>
        </div>
      `;
      container.classList.add('locations-loading');
      debug(FILE, '⏳ Showing locations loading state');
    }
  }

  /**
   * Hide loading state for saved locations
   */
  static hideLocationsLoading() {
    const container = document.getElementById('savedLocationsList');
    if (container) {
      container.classList.remove('locations-loading');
      debug(FILE, '✅ Hiding locations loading state');
    }
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data to edit
   */
  static showEditLocationDialog(location) {
    LocationDialogManager.showEditLocationDialog(location);
    debug(FILE, '📝 Showing edit location dialog');
  }

  /**
   * Generate location form HTML
   * @param {Object} location - Location data (empty for new locations)
   * @returns {string} HTML string
   */
  static generateLocationFormHTML(location = {}) {
    debug(FILE, '📝 Generating location form HTML');
    return LocationTemplates.generateLocationForm(location);
  }

  /**
   * Close active dialog
   */
  static closeActiveDialog() {
    //LocationDialogService.closeActiveDialog();
    LocationDialogManager.closeActiveDialog();
    debug(FILE, '🗙 Closed active dialog');
  }

  /**
   * Get location by ID
   * @param {string} placeId - The place ID to find
   * @returns {Object|null} Location object or null if not found
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    const found = locations.find(loc => (loc.place_id || loc.id) === placeId);
    debug(FILE, `🔍 getLocationById(${placeId}) found:`, !!found);
    return found;
  }

  /**
   * Load and display saved locations
   */
  static async loadSavedLocations() {
    try {
      if (window.Locations && window.Locations.refreshLocationsList) {
        await window.Locations.refreshLocationsList();
        debug(FILE, '✅ Loaded and refreshed saved locations');
      } else {
        debug(FILE, '⚠️ window.Locations.refreshLocationsList not available', null, 'warn');
      }
    } catch (error) {
      debug(FILE, '❌ Error loading saved locations:', error, 'error');
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
    debug(FILE, '💾 Saving location via Locations service');
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
    debug(FILE, '💾 Updating location via Locations service');
    return await window.Locations.updateLocation(placeId, locationData);
  }

  /**
   * Delete location using location service
   * @param {string} placeId - string
   */
  static async deleteLocation(placeId) {
    if (!window.Locations) {
      throw new Error('Locations service is not available');
    }
    debug(FILE, `🗑️ Deleting location: ${placeId}`);
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
    debug(FILE, `🔔 Notification shown: ${message} (${type})`);
  }

  /**
   * Setup form enhancements for a dialog
   * Delegates to LocationFormManager
   * @param {HTMLElement} dialog - Dialog containing the form
   */
  static setupFormEnhancements(dialog) {
    if (LocationFormManager && typeof LocationFormManager.setupFormEnhancements === 'function') {
      LocationFormManager.setupFormEnhancements(dialog);
      debug(FILE, '✨ Form enhancements set up');
    } else {
      debug(FILE, 'LocationFormManager.setupFormEnhancements not available', null, 'warn');
    }
  }

  /**
   * Handle form submission
   * Delegates to LocationFormManager
   * @param {HTMLFormElement} form - The form element
   */
  static handleFormSubmit(form) {
    if (LocationFormManager && typeof LocationFormManager.handleFormSubmit === 'function') {
      debug(FILE, '📤 Handling form submit');
      return LocationFormManager.handleFormSubmit(form);
    } else {
      debug(FILE, 'LocationFormManager.handleFormSubmit not available', null, 'warn');
    }
  }
}
