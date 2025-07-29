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
 * Handles all location UI operations including dialogs, forms, and display
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
      
      // Find a suitable parent or add to sidebar
      const sidebar = document.querySelector('.sidebar') || document.body;
      sidebar.appendChild(savedLocationsContainer);
    }

    // Create saved locations list
    savedLocationsList = document.createElement('div');
    savedLocationsList.id = 'savedLocationsList';
    savedLocationsList.className = 'saved-locations-list';
    savedLocationsContainer.appendChild(savedLocationsList);
  }

  /**
   * Setup event listeners for location interactions
   */
  // ===== CORE LOCATION UI METHODS =====

  // ===== UTILITY METHODS =====

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Decode HTML entities for display
   * @param {string} text - Text to decode
   * @returns {string} Decoded text
   */
  static decodeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
  }

  /**
   * Safe display text that handles encoded content
   * @param {string} text - Text to safely display
   * @returns {string} Safely encoded text
   */
  static safeDisplayText(text) {
    if (!text) return '';
    const decoded = this.decodeHtml(text);
    return this.escapeHtml(decoded);
  }

  // ===== UTILITY METHODS =====

  /**
   * Render locations list
   * @param {Array} locations - Array of locations to render
   */
  static renderLocationsList(locations) {
    const listContainer = document.getElementById('savedLocationsList');
    
    if (!listContainer) {
      console.error('❌ Sidebar container not found!');
      return;
    }

    if (!locations || locations.length === 0) {
      listContainer.innerHTML = '<p class="no-locations">No saved locations yet.</p>';
      return;
    }

    const html = locations.map(location => this.generateLocationItemHTML(location)).join('');
    listContainer.innerHTML = html;
  }

  /**
   * Generate location form HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationFormHTML(location = {}) {
    return LocationTemplateEngine.generateLocationFormHTML(location);
  }

  /**
   * Generate HTML for a location item
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationItemHTML(location) {
    return LocationTemplateEngine.generateLocationItemHTML(location);
  }

  /**
   * Show location details dialog
   * @param {Object} location - Location data
   * @param {string} position - Dialog position ('center' or 'top-right')
   */
  static showLocationDetailsDialog(location, position = 'center') {
    LocationDialogService.showLocationDetailsDialog(location, position);
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data
   */
  static showEditLocationDialog(location) {
    LocationDialogService.showEditLocationDialog(location);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    console.log('🔍 LocationsUI.showSaveLocationDialog() received data:', locationData);
    LocationDialogService.showSaveLocationDialog(locationData);
  }

  /**
   * Close active dialog
   */
  static closeActiveDialog() {
    LocationDialogService.closeActiveDialog();
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle view location
      <div class="address-display" id="${addressId}" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 16px; font-weight: bold; color: #495057; min-height: 20px; transition: all 0.3s ease;">
        ${this.escapeHtml(location.formatted_address || location.address || 'Address information')}
      </div>
      
      <!-- Name Field - Required, defaults to street + city -->
      <div class="form-group">
        <label for="location-name">Location Name *</label>
        <input type="text" id="location-name" name="name" value="${this.escapeHtml(location.name || '')}" required maxlength="100" placeholder="Location name">
      </div>
      
      <!-- Address Components - User can edit -->
      <div class="form-group">
        <label for="location-number">Street Number</label>
        <input type="text" id="location-number" name="number" value="${this.escapeHtml(location.number || '')}" placeholder="3375" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-street">Street</label>
        <input type="text" id="location-street" name="street" value="${this.escapeHtml(location.street || '')}" placeholder="Laren Lane Southwest" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-city">City</label>
        <input type="text" id="location-city" name="city" value="${this.escapeHtml(location.city || '')}" placeholder="Atlanta" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-state">State</label>
        <input type="text" id="location-state" name="state" value="${this.escapeHtml(location.state || '')}" maxlength="2" placeholder="GA" class="address-component">
      </div>
      
      <div class="form-group">
        <label for="location-zipcode">Zip Code</label>
        <input type="text" id="location-zipcode" name="zipcode" value="${this.escapeHtml(location.zipcode || '')}" maxlength="5" placeholder="30311" class="address-component">
      </div>
      
      <!-- Photos Section -->
      <div class="form-group">
        <div class="photos-header">
          <label>Photos</label>
          <button type="button" class="photo-toggle-btn" onclick="window.LocationsUI.photoManager.togglePhotoUpload('${location.place_id ? 'edit' : 'save'}')">
            <span class="toggle-text">Add Photos</span>
          </button>
        </div>
        
        <!-- Existing Photos Display -->
        <div id="${location.place_id ? 'edit' : 'save'}-photos-grid" class="photos-grid">
          <!-- Photos will be loaded here -->
        </div>
        
        <!-- Photo Upload Section (Initially Hidden) -->
        <div id="${location.place_id ? 'edit' : 'save'}-photo-upload" class="photo-upload-section" style="display: none;">
          <div class="upload-area" 
               ondrop="window.LocationsUI.photoManager.handlePhotoDrop(event, '${location.place_id ? 'edit' : 'save'}')" 
               ondragover="window.LocationsUI.photoManager.allowDrop(event)"
               onclick="document.getElementById('${location.place_id ? 'edit' : 'save'}-photo-file').click()">
            <div class="upload-text">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
              </svg>
              <p>Click to select or drag photos here</p>
              <small>JPG, PNG up to 10MB each</small>
            </div>
            <input type="file" 
                   id="${location.place_id ? 'edit' : 'save'}-photo-file" 
                   accept="image/jpeg,image/png" 
                   multiple 
                   style="display: none;" 
                   onchange="window.LocationsUI.photoManager.handlePhotoFile(event, '${location.place_id ? 'edit' : 'save'}')">
          </div>
          <div id="${location.place_id ? 'edit' : 'save'}-photo-preview" class="photo-preview"></div>
        </div>
      </div>
      
      <!-- Production Notes -->
      <div class="form-group">
        <label for="location-production-notes">Production Notes</label>
        <textarea id="location-production-notes" name="production_notes" maxlength="200" placeholder="Additional notes about this location..." rows="3">${this.decodeHtml(location.production_notes || '')}</textarea>
        <small class="char-count">0/200 characters</small>
      </div>
      
      <!-- Type - Required dropdown with updated values -->
      <div class="form-group">
        <label for="location-type">Type <span class="required">*</span></label>
        <select id="location-type" name="type" required>
          <option value="">Select type...</option>
          <option value="broll" ${location.type === 'broll' ? 'selected' : ''}>B-Roll</option>
          <option value="interview" ${location.type === 'interview' ? 'selected' : ''}>Interview</option>
          <option value="live anchor" ${location.type === 'live anchor' ? 'selected' : ''}>Live Anchor</option>
          <option value="live reporter" ${location.type === 'live reporter' ? 'selected' : ''}>Live Reporter</option>
          <option value="stakeout" ${location.type === 'stakeout' ? 'selected' : ''}>Stakeout</option>
        </select>
      </div>
      
      <!-- Entry Point - Required -->
      <div class="form-group">
        <label for="location-entry-point">Entry Point <span class="required">*</span></label>
        <select id="location-entry-point" name="entry_point" required>
          <option value="">Select entry point...</option>
          <option value="front door" ${location.entry_point === 'front door' ? 'selected' : ''}>Front Door</option>
          <option value="backdoor" ${location.entry_point === 'backdoor' ? 'selected' : ''}>Back Door</option>
          <option value="garage" ${location.entry_point === 'garage' ? 'selected' : ''}>Garage</option>
          <option value="parking lot" ${location.entry_point === 'parking lot' ? 'selected' : ''}>Parking Lot</option>
        </select>
      </div>
      
      <!-- Parking - Required -->
      <div class="form-group">
        <label for="location-parking">Parking <span class="required">*</span></label>
        <select id="location-parking" name="parking" required>
          <option value="">Select parking...</option>
          <option value="street" ${location.parking === 'street' ? 'selected' : ''}>Street</option>
          <option value="driveway" ${location.parking === 'driveway' ? 'selected' : ''}>Driveway</option>
          <option value="garage" ${location.parking === 'garage' ? 'selected' : ''}>Garage</option>
        </select>
      </div>
      
      <!-- Access - Required -->
      <div class="form-group">
        <label for="location-access">Access <span class="required">*</span></label>
        <select id="location-access" name="access" required>
          <option value="">Select access...</option>
          <option value="ramp" ${location.access === 'ramp' ? 'selected' : ''}>Ramp</option>
          <option value="stairs only" ${location.access === 'stairs only' ? 'selected' : ''}>Stairs Only</option>
          <option value="doorway" ${location.access === 'doorway' ? 'selected' : ''}>Doorway</option>
          <option value="garage" ${location.access === 'garage' ? 'selected' : ''}>Garage</option>
        </select>
      </div>
      
      <!-- Hidden fields for coordinates and place_id -->
      <input type="hidden" name="lat" value="${location.lat || ''}">
      <input type="hidden" name="lng" value="${location.lng || ''}">
      <input type="hidden" name="place_id" value="${location.place_id || location.id || ''}">
      <input type="hidden" name="formatted_address" value="${this.escapeHtml(location.formatted_address || location.address || '')}">
      
      <!-- Required fields validation message -->
      <div class="required-fields-notice">
        <span class="required">*</span> Required fields
      </div>
    `;
  }

    /**
   * Close the active dialog (delegates to LocationDialogService)
   */
  static closeActiveDialog() {
    LocationDialogService.closeActiveDialog();
  }

  /**
   * Get location by ID
   * @param {string} placeId - Location ID
   * @returns {Object|null} Location object
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => (loc.place_id || loc.id) === placeId);
  }

  /**
   * Show notification (delegates to LocationUtilityManager)
   * @param {string} message - Message text
   * @param {string} type - Notification type
   */
  static showNotification(message, type = 'info') {
    LocationUtilityManager.showNotification(message, type);
  }

}

  /**
   * Show a dialog
   * @param {HTMLElement} dialog - Dialog element
   * @param {string} position - Dialog position ('center', 'enhanced-center', or 'top-right')
   */
  static showDialog(dialog, position = 'center') {
    // Create backdrop for center and enhanced-center dialogs
    if (position === 'center' || position === 'enhanced-center') {
      const backdrop = document.createElement('div');
      backdrop.className = 'dialog-backdrop';
      
      if (position === 'enhanced-center') {
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        
        backdrop.onclick = (e) => {
          if (e.target === backdrop) this.closeActiveDialog();
        };
        
        document.body.appendChild(backdrop);
        backdrop.appendChild(dialog);
        
        // Trigger animation
        setTimeout(() => {
          backdrop.style.opacity = '1';
        }, 10);
        
      } else {
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
        `;
        backdrop.onclick = () => this.closeActiveDialog();
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
      }
    } else {
      // For top-right dialogs, just append to body
      document.body.appendChild(dialog);
    }
    
    // Setup form enhancements if this dialog contains a form
    if (dialog.querySelector('form')) {
      this.setupFormEnhancements(dialog);
    }
  }

  /**
   * Close the active dialog
   */
  static closeActiveDialog() {
    const dialogs = document.querySelectorAll('.location-dialog');
    const backdrops = document.querySelectorAll('.dialog-backdrop');
    
    dialogs.forEach(dialog => dialog.remove());
    backdrops.forEach(backdrop => backdrop.remove());
  }

  /**
   * Get location by ID
   * @param {string} placeId - Location ID
   * @returns {Object|null} Location object
   */
  static getLocationById(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => (loc.place_id || loc.id) === placeId);
  }

  /**
   * Show notification (delegates to LocationUtilityManager)
   * @param {string} message - Message text
   * @param {string} type - Notification type
   */
  static showNotification(message, type = 'info') {
    LocationUtilityManager.showNotification(message, type);
  }

}
