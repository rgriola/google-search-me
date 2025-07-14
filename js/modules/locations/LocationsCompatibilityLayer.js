/**
 * Locations Compatibility Layer
 * Maintains backward compatibility while transitioning to modular architecture
 * This module provides the original LocationsHandlers interface
 */

// Import all the new modular components
import { LocationsEventHandlers } from './LocationsEventHandlers.js';
import { LocationsDialogManager } from './LocationsDialogManager.js';
import { LocationsFormHandlers } from './LocationsFormHandlers.js';
import { LocationsUIHelpers } from './LocationsUIHelpers.js';

/**
 * LocationsHandlers - Compatibility Layer
 * Provides the original interface while delegating to modular components
 */
export class LocationsHandlers {
  
  /**
   * Initialize the locations system
   * Sets up all event handlers and initializes modules
   */
  static async initialize() {
    try {
      console.log('Initializing LocationsHandlers compatibility layer...');
      
      // Initialize the event handlers module
      await LocationsEventHandlers.initialize();
      
      console.log('LocationsHandlers compatibility layer initialized successfully');
    } catch (error) {
      console.error('Error initializing LocationsHandlers:', error);
      throw error;
    }
  }

  // ===== EVENT HANDLERS =====
  // Delegate to LocationsEventHandlers

  static setupEventListeners() {
    return LocationsEventHandlers.setupEventListeners();
  }

  static handleSaveLocationRequest(data) {
    return LocationsEventHandlers.handleSaveLocationRequest(data);
  }

  static handleViewLocationRequest(data) {
    return LocationsEventHandlers.handleViewLocationRequest(data);
  }

  static handleDeleteLocationRequest(data) {
    return LocationsEventHandlers.handleDeleteLocationRequest(data);
  }

  static handleLocationSaved(data) {
    return LocationsEventHandlers.handleLocationSaved(data);
  }

  static handleLocationDeleted(data) {
    return LocationsEventHandlers.handleLocationDeleted(data);
  }

  static handleLocationUpdated(data) {
    return LocationsEventHandlers.handleLocationUpdated(data);
  }

  static loadAndDisplayLocations() {
    return LocationsEventHandlers.loadAndDisplayLocations();
  }

  static attachLocationCardListeners() {
    return LocationsEventHandlers.attachLocationCardListeners();
  }

  static deleteLocation(locationId) {
    return LocationsEventHandlers.deleteLocation(locationId);
  }

  static viewLocationDetails(locationId) {
    return LocationsEventHandlers.viewLocationDetails(locationId);
  }

  static refreshLocationsList() {
    return LocationsEventHandlers.refreshLocationsList();
  }

  // ===== DIALOG MANAGEMENT =====
  // Delegate to LocationsDialogManager

  static showSaveLocationDialog(place) {
    return LocationsDialogManager.showSaveLocationDialog(place);
  }

  static hideSaveLocationDialog() {
    return LocationsDialogManager.hideSaveLocationDialog();
  }

  static hideLocationDialog() {
    return LocationsDialogManager.hideLocationDialog();
  }

  static createSaveLocationDialog() {
    return LocationsDialogManager.createSaveLocationDialog();
  }

  static createDialogBackdrop(clickHandler) {
    return LocationsDialogManager.createDialogBackdrop(clickHandler);
  }

  static escapeHtml(text) {
    return LocationsDialogManager.escapeHtml(text);
  }

  // ===== FORM HANDLING =====
  // Delegate to LocationsFormHandlers

  static handleSaveLocationFormSubmit(e) {
    return LocationsFormHandlers.handleSaveLocationFormSubmit(e);
  }

  static handleLocationFormSubmit(e) {
    return LocationsFormHandlers.handleLocationFormSubmit(e);
  }

  static getFormData() {
    return LocationsFormHandlers.getFormData();
  }

  static getLocationFormData(form) {
    return LocationsFormHandlers.getLocationFormData(form);
  }

  static getCombinedFieldValue(dropdownId, textId) {
    return LocationsFormHandlers.getCombinedFieldValue(dropdownId, textId);
  }

  static setupDropdownHandlers() {
    return LocationsFormHandlers.setupDropdownHandlers();
  }

  static extractLocationDataFromPlace(place) {
    return LocationsFormHandlers.extractLocationDataFromPlace(place);
  }

  static parseAddressComponents(components, locationData) {
    return LocationsFormHandlers.parseAddressComponents(components, locationData);
  }

  static showSuccessMessage(message) {
    return LocationsFormHandlers.showSuccessMessage(message);
  }

  static validateFormData(formData) {
    return LocationsFormHandlers.validateFormData(formData);
  }

  static clearForm(formId) {
    return LocationsFormHandlers.clearForm(formId);
  }

  // ===== UI HELPERS =====
  // Delegate to LocationsUIHelpers

  static loadStreetView(locationData) {
    return LocationsUIHelpers.loadStreetView(locationData);
  }

  static showLocationDetails(location) {
    return LocationsUIHelpers.showLocationDetails(location);
  }

  static hideLocationDetails() {
    return LocationsUIHelpers.hideLocationDetails();
  }

  static generateLocationCardHTML(location) {
    return LocationsUIHelpers.generateLocationCardHTML(location);
  }

  static updateLocationCard(location) {
    return LocationsUIHelpers.updateLocationCard(location);
  }

  static removeLocationCard(locationId) {
    return LocationsUIHelpers.removeLocationCard(locationId);
  }

  static showLoadingState(container, message) {
    return LocationsUIHelpers.showLoadingState(container, message);
  }

  static showErrorState(container, message) {
    return LocationsUIHelpers.showErrorState(container, message);
  }

  static showEmptyState(container, message) {
    return LocationsUIHelpers.showEmptyState(container, message);
  }

  static scrollToElement(element) {
    return LocationsUIHelpers.scrollToElement(element);
  }

  static highlightElement(element, duration) {
    return LocationsUIHelpers.highlightElement(element, duration);
  }

  // ===== UTILITY METHODS =====
  // Maintain backward compatibility for commonly used utilities

  /**
   * Get all locations (compatibility method)
   * @returns {Array} Array of locations
   */
  static async getAllLocations() {
    return LocationsEventHandlers.loadAndDisplayLocations();
  }

  /**
   * Create location dialog (generic compatibility method)
   * @param {Object} location - Location data (optional)
   */
  static createLocationDialog(location = null) {
    if (location) {
      return LocationsUIHelpers.showLocationDetails(location);
    } else {
      return LocationsDialogManager.createSaveLocationDialog();
    }
  }

  /**
   * Handle map click to save location (compatibility method)
   * @param {Object} clickData - Click event data with coordinates
   */
  static handleMapClickToSave(clickData) {
    // This would typically be called from the map click handler
    // Create a place-like object from click data
    const placeData = {
      name: 'New Location',
      geometry: {
        location: {
          lat: clickData.lat,
          lng: clickData.lng
        }
      },
      formatted_address: `${clickData.lat}, ${clickData.lng}`,
      place_id: ''
    };
    
    return this.showSaveLocationDialog(placeData);
  }

  /**
   * Refresh the entire locations system (compatibility method)
   */
  static refresh() {
    return this.loadAndDisplayLocations();
  }

  /**
   * Get locations container element (compatibility method)
   * @returns {HTMLElement} Locations container element
   */
  static getLocationsContainer() {
    return document.getElementById('locations-container') || 
           document.getElementById('saved-locations-list') ||
           document.querySelector('.locations-list');
  }

  /**
   * Show/hide locations panel (compatibility method)
   * @param {boolean} show - Whether to show or hide
   */
  static toggleLocationsPanel(show) {
    const container = this.getLocationsContainer();
    if (container) {
      container.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Search locations by name (compatibility method)
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered locations
   */
  static searchLocations(searchTerm) {
    // This would need to be implemented based on the current locations data
    // For now, just return a promise that resolves to empty array
    return Promise.resolve([]);
  }

  /**
   * Export locations data (compatibility method)
   * @returns {string} JSON string of locations data
   */
  static exportLocations() {
    // This would export current locations data
    // Implementation would depend on the current data structure
    return JSON.stringify([]);
  }

  /**
   * Import locations data (compatibility method)
   * @param {string} jsonData - JSON string of locations data
   */
  static importLocations(jsonData) {
    try {
      const locations = JSON.parse(jsonData);
      // Implementation would handle importing locations
      console.log('Import functionality would handle:', locations);
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error importing locations:', error);
      return Promise.reject(error);
    }
  }

  // ===== LEGACY SUPPORT =====
  // Methods that might be called by old code

  /**
   * Legacy method support - redirects to appropriate new methods
   */
  static handleLocationClick(locationId) {
    return this.viewLocationDetails(locationId);
  }

  static showLocationForm(location = null) {
    if (location) {
      return this.showLocationDetails(location);
    } else {
      return this.createSaveLocationDialog();
    }
  }

  static hideLocationForm() {
    this.hideSaveLocationDialog();
    this.hideLocationDetails();
  }

  static submitLocationForm(formData) {
    // Legacy form submission
    return LocationsFormHandlers.handleSaveLocationFormSubmit({ 
      preventDefault: () => {},
      target: { elements: formData }
    });
  }

  /**
   * Module information for debugging
   * @returns {Object} Module information
   */
  static getModuleInfo() {
    return {
      name: 'LocationsHandlers (Compatibility Layer)',
      version: '2.0.0',
      modules: {
        events: 'LocationsEventHandlers',
        dialogs: 'LocationsDialogManager', 
        forms: 'LocationsFormHandlers',
        ui: 'LocationsUIHelpers'
      },
      description: 'Maintains backward compatibility while using modular architecture'
    };
  }
}
