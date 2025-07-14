/**
 * Locations Event Handlers Coordinator
 * Main entry point for location event handling
 * Coordinates between core and UI event services
 * Refactored in Phase 4 to split into specialized services
 */

import { LocationsEventCoreService } from './LocationsEventCoreService.js';
import { LocationsEventUIService } from './LocationsEventUIService.js';

/**
 * Locations Event Handlers Coordinator Class
 * Acts as the main interface for location event handling, delegating to specialized services
 */
export class LocationsEventHandlers {

  /**
   * Initialize locations event handlers with both core and UI services
   */
  static initialize() {
    console.log('🎯 Initializing Locations Event Handlers Coordinator');
    
    // Initialize both services
    LocationsEventCoreService.initialize();
    LocationsEventUIService.initialize();
    
    // Setup coordination between services
    this.setupServiceCoordination();
    
    console.log('✅ Locations Event Handlers Coordinator initialized');
  }

  /**
   * Setup coordination between core and UI services
   */
  static setupServiceCoordination() {
    // Handle authentication events for both services
    document.addEventListener('user-logged-in', (event) => {
      LocationsEventCoreService.handleUserLoggedIn(event);
      LocationsEventUIService.handleUserLoggedInUI(event);
    });

    document.addEventListener('user-logged-out', (event) => {
      LocationsEventCoreService.handleUserLoggedOut(event);
      LocationsEventUIService.handleUserLoggedOutUI(event);
    });

    console.log('🔗 Event service coordination setup complete');
  }

  /**
   * Setup global event listeners (delegates to core service)
   */
  static setupEventListeners() {
    return LocationsEventCoreService.setupCoreEventListeners();
  }

  /**
   * Handle save location request (delegates to core service)
   * @param {Event} event - Custom event with place data
   */
  static async handleSaveLocationRequest(event) {
    return LocationsEventCoreService.handleSaveLocationRequest(event);
  }

  /**
   * Handle view location request (delegates to core service)
   * @param {Event} event - Custom event with place ID
   */
  static async handleViewLocationRequest(event) {
    return LocationsEventCoreService.handleViewLocationRequest(event);
  }

  /**
   * Handle location saved (delegates to core service)
   * @param {Event} event - Location saved event
   */
  static handleLocationSaved(event) {
    return LocationsEventCoreService.handleLocationSaved(event);
  }

  /**
   * Handle location deleted (delegates to core service)
   * @param {Event} event - Location deleted event
   */
  static handleLocationDeleted(event) {
    return LocationsEventCoreService.handleLocationDeleted(event);
  }

  /**
   * Handle save error (delegates to core service)
   * @param {Event} event - Save error event
   */
  static handleSaveError(event) {
    return LocationsEventCoreService.handleSaveError(event);
  }

  /**
   * Handle delete error (delegates to core service)
   * @param {Event} event - Delete error event
   */
  static handleDeleteError(event) {
    return LocationsEventCoreService.handleDeleteError(event);
  }

  /**
   * Handle notification requests (delegates to UI service)
   * @param {Event} event - Show notification event
   */
  static handleNotificationRequest(event) {
    return LocationsEventUIService.handleNotificationRequest(event);
  }

  /**
   * Handle user logged in (delegates to core service)
   * @param {Event} event - User logged in event
   */
  static async handleUserLoggedIn(event) {
    return LocationsEventCoreService.handleUserLoggedIn(event);
  }

  /**
   * Handle user logged out (delegates to core service)
   * @param {Event} event - User logged out event
   */
  static handleUserLoggedOut(event) {
    return LocationsEventCoreService.handleUserLoggedOut(event);
  }

  /**
   * Update save button state (delegates to UI service)
   * @param {string} state - Button state
   */
  static updateSaveButtonState(state) {
    return LocationsEventUIService.updateSaveButtonState(state);
  }

  /**
   * Update save button for place (delegates to UI service)
   * @param {string} placeId - Place ID
   * @param {string} state - Button state
   */
  static updateSaveButtonForPlace(placeId, state) {
    return LocationsEventUIService.updateSaveButtonForPlace(placeId, state);
  }

  /**
   * Update location count (delegates to UI service)
   */
  static updateLocationCount() {
    return LocationsEventUIService.updateLocationCount();
  }

  /**
   * Handle bulk operation (delegates to UI service)
   * @param {string} operation - Operation type
   * @param {Object} data - Operation data
   */
  static async handleBulkOperation(operation, data = null) {
    return LocationsEventUIService.handleBulkOperation(operation, data);
  }

  /**
   * Handle keyboard shortcuts (delegates to UI service)
   * @param {KeyboardEvent} event - Keyboard event
   */
  static handleKeyboardShortcuts(event) {
    return LocationsEventUIService.handleKeyboardShortcuts(event);
  }

  /**
   * Initialize keyboard shortcuts (delegates to UI service)
   */
  static initializeKeyboardShortcuts() {
    return LocationsEventUIService.initializeKeyboardShortcuts();
  }

  /**
   * Load and display locations (delegates to core service)
   */
  static async loadAndDisplayLocations() {
    return LocationsEventCoreService.loadAndDisplayLocations();
  }

  // Global compatibility methods for HTML onclick handlers (delegate to core service)

  /**
   * Save current location - Global compatibility method
   */
  static async saveCurrentLocation() {
    return LocationsEventCoreService.saveCurrentLocation();
  }

  /**
   * Go to saved location - Global compatibility method
   */
  static async goToSavedLocation(placeId) {
    return LocationsEventCoreService.goToSavedLocation(placeId);
  }

  /**
   * Delete saved location - Global compatibility method
   */
  static async deleteSavedLocation(placeId) {
    return LocationsEventCoreService.deleteSavedLocation(placeId);
  }

  /**
   * Delete saved location from info window - Global compatibility method
   */
  static async deleteSavedLocationFromInfo(placeId) {
    return LocationsEventCoreService.deleteSavedLocationFromInfo(placeId);
  }

  /**
   * Go to popular location - Global compatibility method
   */
  static async goToPopularLocation(placeId, lat, lng) {
    return LocationsEventCoreService.goToPopularLocation(placeId, lat, lng);
  }

  /**
   * Get comprehensive status from both services
   * @returns {Object} Combined status from both services
   */
  static getEventHandlersStatus() {
    return {
      core: {
        initialized: true,
        hasGlobalMethods: true
      },
      ui: {
        state: LocationsEventUIService.getUIState(),
        keyboardShortcutsActive: true
      },
      coordinator: {
        initialized: true,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export individual functions for backward compatibility
export const handleSaveLocationRequest = LocationsEventHandlers.handleSaveLocationRequest.bind(LocationsEventHandlers);
export const handleViewLocationRequest = LocationsEventHandlers.handleViewLocationRequest.bind(LocationsEventHandlers);
export const saveCurrentLocation = LocationsEventHandlers.saveCurrentLocation.bind(LocationsEventHandlers);
export const goToSavedLocation = LocationsEventHandlers.goToSavedLocation.bind(LocationsEventHandlers);
export const deleteSavedLocation = LocationsEventHandlers.deleteSavedLocation.bind(LocationsEventHandlers);
export const updateSaveButtonState = LocationsEventHandlers.updateSaveButtonState.bind(LocationsEventHandlers);
export const updateLocationCount = LocationsEventHandlers.updateLocationCount.bind(LocationsEventHandlers);
export const handleBulkOperation = LocationsEventHandlers.handleBulkOperation.bind(LocationsEventHandlers);
