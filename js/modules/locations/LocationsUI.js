/**
 * Locations UI Coordinator
 * Main entry point for locations UI functionality
 * Coordinates between rendering and interaction services
 * Refactored in Phase 3 to split into specialized services
 */

import { StateManager } from '../state/AppState.js';
import { LocationsService } from './LocationsService.js';
import { LocationsRenderingService } from './LocationsRenderingService.js';
import { LocationsInteractionService } from './LocationsInteractionService.js';

/**
 * Locations UI Coordinator Class
 * Acts as the main interface for locations UI, delegating to specialized services
 */
export class LocationsUI {

  /**
   * Initialize locations UI with both rendering and interaction services
   */
  static initialize() {
    console.log('🎨 Initializing Locations UI Coordinator');
    
    // Initialize both services
    LocationsRenderingService.initialize();
    LocationsInteractionService.initialize();
    
    // Setup coordination between services
    this.setupServiceCoordination();
    
    // Initial render
    LocationsRenderingService.renderLocations();
    
    console.log('✅ Locations UI Coordinator initialized');
  }

  /**
   * Setup coordination between rendering and interaction services
   */
  static setupServiceCoordination() {
    // Handle refresh requests from interaction service
    document.addEventListener('refresh-locations-requested', () => {
      LocationsRenderingService.refreshSavedLocations();
    });

    // Handle location actions that require UI updates
    document.addEventListener('location-action-completed', () => {
      LocationsRenderingService.renderLocations();
    });

    // Handle data updates that require re-rendering
    document.addEventListener('locations-data-updated', () => {
      LocationsRenderingService.renderLocations();
    });

    // Setup refresh button if available
    const refreshButton = document.getElementById('refreshLocations');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        LocationsRenderingService.refreshSavedLocations();
      });
    }

    console.log('🔗 Service coordination setup complete');
  }

  /**
   * Setup UI DOM elements (delegates to rendering service)
   */
  static setupUIElements() {
    return LocationsRenderingService.setupUIElements();
  }

  /**
   * Setup event listeners (delegates to interaction service)
   */
  static setupEventListeners() {
    return LocationsInteractionService.setupEventListeners();
  }

  /**
   * Render saved locations list (delegates to rendering service)
   * @param {Array} locationsToRender - Optional filtered locations array
   */
  static renderLocations(locationsToRender = null) {
    return LocationsRenderingService.renderLocations(locationsToRender);
  }

  /**
   * Render empty state (delegates to rendering service)
   */
  static renderEmptyState() {
    return LocationsRenderingService.renderEmptyState();
  }

  /**
   * Render locations list (delegates to rendering service)
   * @param {Array} locations - Locations to render
   */
  static renderLocationsList(locations) {
    return LocationsRenderingService.renderLocationsList(locations);
  }

  /**
   * Create HTML for a single location (delegates to rendering service)
   * @param {Object} location - Location object
   * @returns {string} HTML string
   */
  static createLocationHTML(location) {
    return LocationsRenderingService.createLocationHTML(location);
  }

  /**
   * Handle location item clicks (delegates to interaction service)
   * @param {Event} event - Click event
   */
  static handleLocationClick(event) {
    return LocationsInteractionService.handleLocationClick(event);
  }

  /**
   * Handle delete location (delegates to interaction service)
   * @param {string} placeId - Place ID to delete
   */
  static async handleDeleteLocation(placeId) {
    return LocationsInteractionService.handleDeleteLocation(placeId);
  }

  /**
   * Show notification message (delegates to interaction service)
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  static showNotification(message, type = 'info') {
    return LocationsInteractionService.showNotification(message, type);
  }

  /**
   * Refresh saved locations display (delegates to rendering service)
   */
  static async refreshSavedLocations() {
    return LocationsRenderingService.refreshSavedLocations();
  }

  /**
   * Show location details popup (delegates to interaction service)
   * @param {string} placeId - Place ID
   */
  static async showLocationDetailsPopup(placeId) {
    return LocationsInteractionService.showLocationDetailsPopup(placeId);
  }

  /**
   * Create location details popup (delegates to interaction service)
   * @param {Object} location - Location data
   * @returns {HTMLElement} Popup element
   */
  static createLocationDetailsPopup(location) {
    return LocationsInteractionService.createLocationDetailsPopup(location);
  }

  /**
   * Close popup (delegates to interaction service)
   * @param {HTMLElement} popup - Popup element
   */
  static closePopup(popup) {
    return LocationsInteractionService.closePopup(popup);
  }

  /**
   * Zoom to location on map (delegates to interaction service)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  static zoomToLocation(lat, lng) {
    return LocationsInteractionService.zoomToLocation(lat, lng);
  }

  /**
   * Show edit location dialog (delegates to interaction service)
   * @param {string} placeId - Place ID
   */
  static async showEditLocationDialog(placeId) {
    return LocationsInteractionService.showEditLocationDialog(placeId);
  }

  /**
   * Highlight search terms in location names (delegates to rendering service)
   * @param {string} text - Text to highlight
   * @param {string} searchTerm - Search term to highlight
   * @returns {string} HTML with highlighted terms
   */
  static highlightSearchTerm(text, searchTerm) {
    return LocationsRenderingService.highlightSearchTerm(text, searchTerm);
  }

  /**
   * Dispatch custom location events (delegates to interaction service)
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchLocationEvent(eventName, detail = {}) {
    return LocationsInteractionService.dispatchInteractionEvent(eventName, detail);
  }

  /**
   * Remove any existing popular locations sections (delegates to rendering service)
   */
  static removePopularLocationsSection() {
    return LocationsRenderingService.removePopularLocationsSection();
  }

  /**
   * Get comprehensive UI status from both services
   * @returns {Object} Combined status from both services
   */
  static getUIStatus() {
    return {
      rendering: {
        isReady: LocationsRenderingService.isUIReady(),
        elements: LocationsRenderingService.getUIElements()
      },
      interaction: {
        state: LocationsInteractionService.getInteractionState()
      },
      coordinator: {
        initialized: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Handle location action with proper delegation
   * @param {string} placeId - Place ID
   * @param {string} action - Action type
   */
  static handleLocationAction(placeId, action) {
    return LocationsInteractionService.handleLocationAction(placeId, action);
  }
}

// Export individual functions for backward compatibility
export const renderLocations = LocationsUI.renderLocations.bind(LocationsUI);
export const showNotification = LocationsUI.showNotification.bind(LocationsUI);
export const handleLocationClick = LocationsUI.handleLocationClick.bind(LocationsUI);
export const showLocationDetailsPopup = LocationsUI.showLocationDetailsPopup.bind(LocationsUI);
export const refreshSavedLocations = LocationsUI.refreshSavedLocations.bind(LocationsUI);
