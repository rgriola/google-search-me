/**
 * Main Locations UI Helpers
 * Coordinates between specialized UI helper services
 */

import { LocationsStreetViewHelpers } from './LocationsStreetViewHelpers.js';
import { LocationsDialogHelpers } from './LocationsDialogHelpers.js';
import { LocationsDisplayHelpers } from './LocationsDisplayHelpers.js';

/**
 * Main Locations UI Helpers Class
 * Acts as a coordinator between specialized UI services
 */
export class LocationsUIHelpers {

  // Delegate Street View operations to LocationsStreetViewHelpers
  static loadStreetView(locationData) {
    return LocationsStreetViewHelpers.loadStreetView(locationData);
  }

  static loadStreetViewInContainer(container, locationData, options = {}) {
    return LocationsStreetViewHelpers.loadStreetViewInContainer(container, locationData, options);
  }

  static async isStreetViewAvailable(lat, lng) {
    return await LocationsStreetViewHelpers.isStreetViewAvailable(lat, lng);
  }

  static createStreetViewThumbnail(lat, lng, width = 300, height = 200) {
    return LocationsStreetViewHelpers.createStreetViewThumbnail(lat, lng, width, height);
  }

  // Delegate Dialog operations to LocationsDialogHelpers
  static async showLocationDetails(location) {
    return await LocationsDialogHelpers.showLocationDetails(location);
  }

  static createLocationDetailsDialog() {
    return LocationsDialogHelpers.createLocationDetailsDialog();
  }

  static populateLocationDetails(dialog, location) {
    return LocationsDialogHelpers.populateLocationDetails(dialog, location);
  }

  static generateLocationDetailsHTML(location) {
    return LocationsDialogHelpers.generateLocationDetailsHTML(location);
  }

  static hideLocationDetails() {
    return LocationsDialogHelpers.hideLocationDetails();
  }

  static async showEditLocationDialog(location) {
    return await LocationsDialogHelpers.showEditLocationDialog(location);
  }

  static createEditLocationDialog(location) {
    return LocationsDialogHelpers.createEditLocationDialog(location);
  }

  static generateEditDialogHTML(location) {
    return LocationsDialogHelpers.generateEditDialogHTML(location);
  }

  static generateEditDropdownFieldsHTML(location) {
    return LocationsDialogHelpers.generateEditDropdownFieldsHTML(location);
  }

  static hideEditLocationDialog() {
    return LocationsDialogHelpers.hideEditLocationDialog();
  }

  static createConfirmationDialog(message, onConfirm, onCancel = null) {
    return LocationsDialogHelpers.createConfirmationDialog(message, onConfirm, onCancel);
  }

  // Delegate Display operations to LocationsDisplayHelpers
  static generateLocationCardHTML(location) {
    return LocationsDisplayHelpers.generateLocationCardHTML(location);
  }

  static updateLocationCard(location) {
    return LocationsDisplayHelpers.updateLocationCard(location);
  }

  static removeLocationCard(locationId) {
    return LocationsDisplayHelpers.removeLocationCard(locationId);
  }

  static showLoadingState(container, message = 'Loading...') {
    return LocationsDisplayHelpers.showLoadingState(container, message);
  }

  static showErrorState(container, message = 'An error occurred') {
    return LocationsDisplayHelpers.showErrorState(container, message);
  }

  static showEmptyState(container, message = 'No locations found') {
    return LocationsDisplayHelpers.showEmptyState(container, message);
  }

  static scrollToElement(element) {
    return LocationsDisplayHelpers.scrollToElement(element);
  }

  static highlightElement(element, duration = 2000) {
    return LocationsDisplayHelpers.highlightElement(element, duration);
  }

  static updateSaveButtonState(state) {
    return LocationsDisplayHelpers.updateSaveButtonState(state);
  }

  static createLocationSummaryCard(location) {
    return LocationsDisplayHelpers.createLocationSummaryCard(location);
  }

  static createLocationStatsDisplay(stats) {
    return LocationsDisplayHelpers.createLocationStatsDisplay(stats);
  }

  static createProgressBar(percentage, color = '#4285f4', label = '') {
    return LocationsDisplayHelpers.createProgressBar(percentage, color, label);
  }

  static createNotification(message, type = 'info', duration = 5000) {
    return LocationsDisplayHelpers.createNotification(message, type, duration);
  }

  static createTooltip(element, text, position = 'top') {
    return LocationsDisplayHelpers.createTooltip(element, text, position);
  }

  static formatDate(date, options = {}) {
    return LocationsDisplayHelpers.formatDate(date, options);
  }

  static truncateText(text, maxLength = 100) {
    return LocationsDisplayHelpers.truncateText(text, maxLength);
  }

  static escapeHtml(text) {
    return LocationsDisplayHelpers.escapeHtml(text);
  }

  // Legacy methods that are handled by the dialog helper but called from edit dialog
  static generateEditAddressFieldsHTML(location) {
    // This method exists in the original file but wasn't moved to dialog helpers
    // Adding it here for compatibility
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    return `
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Address</label>
        <input type="text" id="edit-location-address" value="${escapeHtml(location.address || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 3fr; gap: 10px; margin-bottom: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number</label>
          <input type="text" id="edit-location-number" value="${escapeHtml(location.number || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Street</label>
          <input type="text" id="edit-location-street" value="${escapeHtml(location.street || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">City</label>
          <input type="text" id="edit-location-city" value="${escapeHtml(location.city || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">State</label>
          <input type="text" id="edit-location-state" value="${escapeHtml(location.state || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Zip Code</label>
          <input type="text" id="edit-location-zipcode" value="${escapeHtml(location.zipcode || '')}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
      </div>
    `;
  }

  static async handleEditLocationFormSubmit(e, locationId) {
    // Delegate to the display helpers which has this method
    // This is a temporary wrapper - ideally this would be in form handlers
    try {
      e.preventDefault();
      
      // Get form data using edit dialog field IDs
      const formData = {
        name: document.getElementById('edit-location-name')?.value?.trim() || '',
        description: document.getElementById('edit-location-description')?.value?.trim() || '',
        type: document.getElementById('edit-location-type')?.value || '',
        address: document.getElementById('edit-location-address')?.value?.trim() || '',
        street: document.getElementById('edit-location-street')?.value?.trim() || '',
        number: document.getElementById('edit-location-number')?.value?.trim() || '',
        city: document.getElementById('edit-location-city')?.value?.trim() || '',
        state: document.getElementById('edit-location-state')?.value?.trim() || '',
        zipcode: document.getElementById('edit-location-zipcode')?.value?.trim() || '',
        photo_url: document.getElementById('edit-location-photo-url')?.value?.trim() || '',
        types: document.getElementById('edit-location-types')?.value?.trim() || '',
        entry_point: this.getCombinedFieldValue('location-entry-point-dropdown', 'location-entry-point'),
        parking: this.getCombinedFieldValue('location-parking-dropdown', 'location-parking'),
        access: this.getCombinedFieldValue('location-access-dropdown', 'location-access')
      };
      
      if (!formData.name || !formData.name.trim()) {
        alert('Please enter a location name');
        return;
      }

      // Import necessary modules
      const { LocationsService } = await import('./LocationsService.js');
      const { LocationsFormHandlers } = await import('./LocationsFormHandlers.js');
      
      // Update location
      const response = await LocationsService.updateLocation(locationId, formData);
      
      if (response) {
        console.log('Location updated successfully:', response);
        
        // Hide dialog
        this.hideEditLocationDialog();
        
        // Show success message
        LocationsFormHandlers.showSuccessMessage('Location updated successfully!');
        
        // Refresh locations list
        import('./LocationsEventHandlers.js').then(({ LocationsEventHandlers }) => {
          LocationsEventHandlers.loadAndDisplayLocations();
        });
        
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location. Please try again.');
    }
  }

  static getCombinedFieldValue(dropdownId, textId) {
    const dropdown = document.getElementById(dropdownId);
    const textField = document.getElementById(textId);
    
    const dropdownValue = dropdown?.value || '';
    const textValue = textField?.value?.trim() || '';
    
    if (dropdownValue && dropdownValue !== 'custom') {
      return textValue ? `${dropdownValue}. ${textValue}` : dropdownValue;
    } else {
      return textValue;
    }
  }
}

// Export individual functions for backward compatibility
export const loadStreetView = LocationsUIHelpers.loadStreetView.bind(LocationsUIHelpers);
export const showLocationDetails = LocationsUIHelpers.showLocationDetails.bind(LocationsUIHelpers);
export const createLocationDetailsDialog = LocationsUIHelpers.createLocationDetailsDialog.bind(LocationsUIHelpers);
export const populateLocationDetails = LocationsUIHelpers.populateLocationDetails.bind(LocationsUIHelpers);
export const generateLocationDetailsHTML = LocationsUIHelpers.generateLocationDetailsHTML.bind(LocationsUIHelpers);
export const hideLocationDetails = LocationsUIHelpers.hideLocationDetails.bind(LocationsUIHelpers);
export const generateLocationCardHTML = LocationsUIHelpers.generateLocationCardHTML.bind(LocationsUIHelpers);
export const updateLocationCard = LocationsUIHelpers.updateLocationCard.bind(LocationsUIHelpers);
export const removeLocationCard = LocationsUIHelpers.removeLocationCard.bind(LocationsUIHelpers);
export const showLoadingState = LocationsUIHelpers.showLoadingState.bind(LocationsUIHelpers);
export const showErrorState = LocationsUIHelpers.showErrorState.bind(LocationsUIHelpers);
export const showEmptyState = LocationsUIHelpers.showEmptyState.bind(LocationsUIHelpers);
export const scrollToElement = LocationsUIHelpers.scrollToElement.bind(LocationsUIHelpers);
export const highlightElement = LocationsUIHelpers.highlightElement.bind(LocationsUIHelpers);
export const showEditLocationDialog = LocationsUIHelpers.showEditLocationDialog.bind(LocationsUIHelpers);
export const createEditLocationDialog = LocationsUIHelpers.createEditLocationDialog.bind(LocationsUIHelpers);
export const generateEditDialogHTML = LocationsUIHelpers.generateEditDialogHTML.bind(LocationsUIHelpers);
export const generateEditDropdownFieldsHTML = LocationsUIHelpers.generateEditDropdownFieldsHTML.bind(LocationsUIHelpers);
export const hideEditLocationDialog = LocationsUIHelpers.hideEditLocationDialog.bind(LocationsUIHelpers);
export const updateSaveButtonState = LocationsUIHelpers.updateSaveButtonState.bind(LocationsUIHelpers);
