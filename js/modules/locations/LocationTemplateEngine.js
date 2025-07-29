/**
 * Location Template Engine
 * Handles HTML template generation for location forms and details
 */

export class LocationTemplateEngine {
  
  /**
   * Generate location form HTML
   * @param {Object} location - Location data (empty for new locations)
   * @returns {string} HTML string
   */
  static generateLocationFormHTML(location = {}) {
    const formId = location.place_id ? 'edit-location-form' : 'save-location-form';
    const addressId = location.place_id ? 'edit-address-display' : 'address-display';
    
    console.log('🔍 LocationTemplateEngine.generateLocationFormHTML() received location data:', location);
    
    return `
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
   * Generate HTML for a location item in the list
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationItemHTML(location) {
    const name = location.name || 'Unnamed Location';
    const address = location.formatted_address || location.address || 'No address';
    const type = location.type || 'Location';
    const placeId = location.place_id || location.id;
    
    return `
      <div class="location-item" data-place-id="${placeId}">
        <div class="location-info">
          <h4 class="location-name">${this.escapeHtml(name)}</h4>
          <p class="location-address"><strong>Address:</strong> ${this.escapeHtml(address)}</p>
          <p><strong>Type:</strong> ${this.escapeHtml(type)}</p>
          ${location.production_notes ? `<p><strong>Production Notes:</strong> ${this.safeDisplayText(location.production_notes)}</p>` : ''}
          ${location.entry_point ? `<p><strong>Entry Point:</strong> ${this.escapeHtml(location.entry_point)}</p>` : ''}
          ${location.parking ? `<p><strong>Parking:</strong> ${this.escapeHtml(location.parking)}</p>` : ''}
          ${location.access ? `<p><strong>Access:</strong> ${this.escapeHtml(location.access)}</p>` : ''}
          ${location.street || location.number || location.city || location.state || location.zipcode ? `
            <p><strong>Location:</strong> ${[location.number, location.street].filter(Boolean).join(' ')}, ${[location.city, location.state, location.zipcode].filter(Boolean).join(' ')}</p>
          ` : ''}
          ${location.lat && location.lng ? `<p><strong>Coordinates:</strong> ${location.lat}, ${location.lng}</p>` : ''}
          ${location.creator_username ? `<p><strong>Created by:</strong> ${this.escapeHtml(location.creator_username)}</p>` : ''}
          ${location.created_date || location.created_at ? `<p><strong>Created:</strong> ${new Date(location.created_date || location.created_at).toLocaleDateString()}</p>` : ''}
          ${location.updated_date ? `<p><strong>Updated:</strong> ${new Date(location.updated_date).toLocaleDateString()}</p>` : ''}
        </div>
        <div class="location-actions">
          <button data-action="view" title="View Details">👁️ View</button>
          <button data-action="edit" title="Edit">✏️ Edit</button>
          <button data-action="delete" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for a list of locations
   * @param {Array} locations - Array of location objects
   * @returns {string} HTML string for the entire list
   */
  static generateLocationsList(locations) {
    if (!locations || locations.length === 0) {
      return '<p class="no-locations">No saved locations yet.</p>';
    }

    return locations.map(location => this.generateLocationItemHTML(location)).join('');
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

  /**
   * Safe display text that handles encoded content
   * @param {string} text - Text to safely display
   * @returns {string} Safely encoded text
   */
  static safeDisplayText(text) {
    if (!text) return '';
    
    // First decode any existing encoding, then properly escape
    const decoded = this.decodeHtml(text);
    return this.escapeHtml(decoded);
  }
}
