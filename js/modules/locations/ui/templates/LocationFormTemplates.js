/**
 * Location Form Templates
 * Contains all HTML templates for location forms
 */

export class LocationFormTemplates {
  
  /**
   * Generate main location form HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationForm(location = {}) {
    const formId = location.place_id ? 'edit-location-form' : 'save-location-form';
    const addressId = location.place_id ? 'edit-address-display' : 'address-display';
    
    return `
      <div class="address-display" id="${addressId}" style="background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 16px; font-weight: bold; color: #495057; min-height: 20px; transition: all 0.3s ease;">
        ${this.escapeHtml(location.formatted_address || location.address || 'Address information')}
      </div>
      
      ${this.generateNameField(location)}
      ${this.generateAddressFields(location)}
      ${this.generatePhotosSection(location)}
      ${this.generateProductionNotesField(location)}
      ${this.generateRequiredFields(location)}
      ${this.generateHiddenFields(location)}
      ${this.generateRequiredFieldsNotice()}
    `;
  }

  /**
   * Generate name field
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateNameField(location) {
    return `
      <div class="form-group">
        <label for="location-name">Location Name *</label>
        <input type="text" id="location-name" name="name" value="${this.escapeHtml(location.name || '')}" required maxlength="100" placeholder="Location name">
      </div>
    `;
  }

  /**
   * Generate address component fields
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateAddressFields(location) {
    return `
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
    `;
  }

  /**
   * Generate photos section
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generatePhotosSection(location) {
    const mode = location.place_id ? 'edit' : 'save';
    
    return `
      <div class="form-group">
        <div class="photos-header">
          <label>Photos</label>
          <button type="button" class="photo-toggle-btn" onclick="window.LocationsUI.photoManager.togglePhotoUpload('${mode}')">
            <span class="toggle-text">Add Photos</span>
          </button>
        </div>
        
        <!-- Existing Photos Display -->
        <div id="${mode}-photos-grid" class="photos-grid">
          <!-- Photos will be loaded here -->
        </div>
        
        <!-- Photo Upload Section (Initially Hidden) -->
        <div id="${mode}-photo-upload" class="photo-upload-section" style="display: none;">
          <div class="upload-area" 
               ondrop="window.LocationsUI.photoManager.handlePhotoDrop(event, '${mode}')" 
               ondragover="window.LocationsUI.photoManager.allowDrop(event)"
               onclick="document.getElementById('${mode}-photo-file').click()">
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
                   id="${mode}-photo-file" 
                   accept="image/jpeg,image/png" 
                   multiple 
                   style="display: none;" 
                   onchange="window.LocationsUI.photoManager.handlePhotoFile(event, '${mode}')">
          </div>
          <div id="${mode}-photo-preview" class="photo-preview"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate production notes field
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateProductionNotesField(location) {
    return `
      <div class="form-group">
        <label for="location-production-notes">Production Notes</label>
        <textarea id="location-production-notes" name="production_notes" maxlength="200" placeholder="Additional notes about this location..." rows="3">${this.decodeHtml(location.production_notes || '')}</textarea>
        <small class="char-count">0/200 characters</small>
      </div>
    `;
  }

  /**
   * Generate required dropdown fields
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateRequiredFields(location) {
    return `
      <!-- Type - Required dropdown -->
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
    `;
  }

  /**
   * Generate hidden fields
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateHiddenFields(location) {
    return `
      <input type="hidden" name="lat" value="${location.lat || ''}">
      <input type="hidden" name="lng" value="${location.lng || ''}">
      <input type="hidden" name="place_id" value="${location.place_id || location.id || ''}">
      <input type="hidden" name="formatted_address" value="${this.escapeHtml(location.formatted_address || location.address || '')}">
    `;
  }

  /**
   * Generate required fields notice
   * @returns {string} HTML string
   */
  static generateRequiredFieldsNotice() {
    return `
      <div class="required-fields-notice">
        <span class="required">*</span> Required fields
      </div>
    `;
  }

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
}
