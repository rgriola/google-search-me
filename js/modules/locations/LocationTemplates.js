/**
 * Location Templates
 * Consolidated template generation for al            <input type="text" id="location-city" name="city" value="${safeAttribute(locationData.city)}" placeholder="City" required>
          </div>
          <div class="form-group">
            <label for="location-state">State *</label>
            <input type="text" id="location-state" name="state" value="${safeAttribute(locationData.state)}" placeholder="CA" required>
          </div>
          <div class="form-group">
            <label for="location-zipcode">Zip Code</label>
            <input type="text" id="location-zipcode" name="zipcode" value="${safeAttribute(locationData.zipcode)}" placeholder="12345">n UI components
 */

import { LocationUtilityManager } from './LocationUtilityManager.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

export class LocationTemplates {

  // ===== FORM TEMPLATES =====

  /**
   * Generate location form HTML
   * @param {Object} locationData - Pre-filled location data
   * @returns {string} Form HTML
   */
  static generateLocationForm(locationData = {}) {
    // Safely escape values for HTML attributes and display, but not for textarea content
    const safeValue = (value) => SecurityUtils.escapeHtml(value || '');
    const safeTextareaValue = (value) => value || ''; // No escaping for textarea content
    const safeAttribute = (value) => SecurityUtils.escapeHtmlAttribute(value || '');
    
    // Determine mode based on whether location exists in our database (has a numeric ID from our DB)
    // Google place_id is a string and doesn't mean it's saved in our system yet
    const mode = (locationData.id && typeof locationData.id === 'number') ? 'edit' : 'save';
    
    // Debug log to verify data flow
    console.log('🔍 LocationTemplates.generateLocationForm() received:', locationData);
    console.log('🔍 LocationTemplates.generateLocationForm() mode:', mode);
    console.log('🔍 LocationTemplates.generateLocationForm() locationData.id:', locationData.id);
    console.log('🔍 LocationTemplates.generateLocationForm() locationData.id type:', typeof locationData.id);
    console.log('🔍 LocationTemplates.generateLocationForm() locationData.place_id:', locationData.place_id);
    
    return `
      <!-- Location Name and Type -->
      <div class="form-section">
        <div class="form-group">
          <label for="location-name">Location Name *</label>
          <input type="text" id="location-name" name="name" value="${safeAttribute(locationData.name)}" 
                 placeholder="Enter location name" required>
        </div>
        
        <div class="form-group">
          <label for="location-type">Location Type *</label>
          <select id="location-type" name="type" required>
            <option value="">Select type...</option>
            <option value="broll" ${locationData.type === 'broll' ? 'selected' : ''}>B-Roll</option>
            <option value="interview" ${locationData.type === 'interview' ? 'selected' : ''}>Interview</option>
            <option value="live anchor" ${locationData.type === 'live anchor' ? 'selected' : ''}>Live Anchor</option>
            <option value="live reporter" ${locationData.type === 'live reporter' ? 'selected' : ''}>Live Reporter</option>
            <option value="stakeout" ${locationData.type === 'stakeout' ? 'selected' : ''}>Stakeout</option>
            <option value="headquarters" ${locationData.type === 'headquarters' ? 'selected' : ''}>Headquarters</option>
            <option value="bureau" ${locationData.type === 'bureau' ? 'selected' : ''}>Bureau</option>
            <option value="office" ${locationData.type === 'office' ? 'selected' : ''}>Office</option>
          </select>
        </div>
      </div>

      <!-- Address Components -->
      <div class="form-section">
        <h4>Address Information</h4>
        <div class="form-row address-row">
          <div class="form-group">
            <label for="location-number">Street Number</label>
            <input type="text" id="location-number" name="number" value="${safeAttribute(locationData.number)}" placeholder="123">
          </div>
          <div class="form-group form-group-flex-2">
            <label for="location-street">Street Name</label>
            <input type="text" id="location-street" name="street" value="${safeAttribute(locationData.street)}" placeholder="Main Street">
          </div>
        </div>
        
        <div class="form-row address-row">
          <div class="form-group form-group-flex-2">
            <label for="location-city">City *</label>
            <input type="text" id="location-city" name="city" value="${safeValue(locationData.city)}" placeholder="City" required>
          </div>
          <div class="form-group">
            <label for="location-state">State *</label>
            <input type="text" id="location-state" name="state" value="${safeValue(locationData.state)}" placeholder="CA" required>
          </div>
          <div class="form-group">
            <label for="location-zipcode">ZIP Code</label>
            <input type="text" id="location-zipcode" name="zipcode" value="${safeValue(locationData.zipcode)}" placeholder="12345">
          </div>
        </div>
        
        <!-- Live Address Preview -->
        <div class="address-preview">
          <label>Address Preview:</label>
          <div class="address-display">${SecurityUtils.escapeHtml(LocationUtilityManager.formatAddressComponents(locationData) || 'Address will appear here...')}</div>
        </div>
        
        <!-- Hidden field for formatted address -->
        <input type="hidden" name="formatted_address" value="${safeAttribute(locationData.formatted_address)}">
        
        <!-- Hidden field for place_id -->
        <input type="hidden" name="place_id" value="${SecurityUtils.escapeHtmlAttribute(locationData.place_id || locationData.placeId || '')}">
      </div>

      <!-- Coordinates (Read-only) -->
      <div class="form-section">
        <h4>Coordinates</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Latitude</label>
            <div class="readonly-field">${SecurityUtils.escapeHtml(locationData.lat || 'Not set')}</div>
            <input type="hidden" name="lat" value="${SecurityUtils.escapeHtmlAttribute(locationData.lat || '')}">
          </div>
          <div class="form-group">
            <label>Longitude</label>
            <div class="readonly-field">${SecurityUtils.escapeHtml(locationData.lng || 'Not set')}</div>
            <input type="hidden" name="lng" value="${SecurityUtils.escapeHtmlAttribute(locationData.lng || '')}">
          </div>
        </div>
      </div>

      <!-- Production Details -->
      <div class="form-section">
        <h4>Production Details</h4>
        <div class="form-group">
          <label for="location-production-notes">Production Notes</label>
          <textarea id="location-production-notes" name="production_notes" maxlength="500" 
                    placeholder="Notes about this location for production use...">${safeTextareaValue(locationData.production_notes)}</textarea>
          <div class="char-count">0/500 characters</div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="location-entry-point">Entry Point *</label>
            <select id="location-entry-point" name="entry_point" required>
              <option value="">Select entry point...</option>
              <option value="front door" ${locationData.entry_point === 'front door' ? 'selected' : ''}>Front Door</option>
              <option value="backdoor" ${locationData.entry_point === 'backdoor' ? 'selected' : ''}>Back Door</option>
              <option value="garage" ${locationData.entry_point === 'garage' ? 'selected' : ''}>Garage</option>
              <option value="parking lot" ${locationData.entry_point === 'parking lot' ? 'selected' : ''}>Parking Lot</option>
            </select>
          </div>
          <div class="form-group">
            <label for="location-parking">Parking *</label>
            <select id="location-parking" name="parking" required>
              <option value="">Select parking...</option>
              <option value="street" ${locationData.parking === 'street' ? 'selected' : ''}>Street</option>
              <option value="driveway" ${locationData.parking === 'driveway' ? 'selected' : ''}>Driveway</option>
              <option value="garage" ${locationData.parking === 'garage' ? 'selected' : ''}>Garage</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="location-access">Access *</label>
          <select id="location-access" name="access" required>
            <option value="">Select access...</option>
            <option value="ramp" ${locationData.access === 'ramp' ? 'selected' : ''}>Ramp</option>
            <option value="stairs only" ${locationData.access === 'stairs only' ? 'selected' : ''}>Stairs Only</option>
            <option value="doorway" ${locationData.access === 'doorway' ? 'selected' : ''}>Doorway</option>
            <option value="garage" ${locationData.access === 'garage' ? 'selected' : ''}>Garage</option>
          </select>
        </div>
      </div>

      <!-- Photos Section -->
      <div class="form-section">
        <h4>Photos</h4>
        
        <!-- Existing Photos Display -->
        <div id="existing-photos-container" class="existing-photos">
          <div class="existing-photos-grid" id="existing-photos-grid">
            <!-- Photos will be loaded here by LocationPhotoManager -->
          </div>
        </div>
        
        <!-- Photo Upload Section -->
        <div class="photo-upload-section">
          <!-- File Input (hidden but functional) -->
          <input type="file" 
                 id="${mode}-photo-file-input" 
                 accept="image/jpeg,image/png,image/webp" 
                 multiple 
                 class="hidden-file-input">
          
          <!-- Primary Upload Area (clickable drop zone) -->
          <div class="photo-drop-zone" 
               id="${mode}-photo-drop-zone">
            <div class="drop-zone-content">
              <div class="drop-zone-icon">📁</div>
              <div class="drop-zone-text">
                <strong class="drop-zone-main-text">Click to select photos</strong>
                <div class="drop-zone-subtext">
                  Or drag and drop photos here<br>
                  JPG, PNG, WebP up to 10MB each
                </div>
              </div>
            </div>
          </div>
          
          <!-- Photo Previews -->
          <div class="photo-previews" id="${mode}-photo-preview">
            <!-- Previews will be added here dynamically -->
          </div>
        </div>
      </div>
    `;
  }

  // ===== LIST TEMPLATES =====

  /**
   * Generate location item HTML for lists
   * @param {Object} location - Location data
   * @returns {string} Location item HTML
   */
  static generateLocationItemHTML(location) {
    const safeLocation = LocationUtilityManager.formatLocationForDisplay(location);
    const summary = LocationUtilityManager.getLocationSummary(location);
    const details = LocationUtilityManager.getLocationDetails(location);
    const typeBadgeClass = LocationUtilityManager.getTypeBadgeClass(location.type);
    const statusClasses = LocationUtilityManager.getLocationStatus(location).join(' ');
    
    return `
      <div class="location-item ${statusClasses}" data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
        <div class="location-header">
          <h4 class="location-name">${SecurityUtils.escapeHtml(safeLocation.displayName)}</h4>
          <span class="location-type-badge ${typeBadgeClass}">${SecurityUtils.escapeHtml(safeLocation.displayType)}</span>
        </div>
        
        <div class="location-address">
          ${SecurityUtils.escapeHtml(safeLocation.displayAddress)}
        </div>
        
        ${safeLocation.displayCoordinates ? `
          <div class="location-coordinates">
            📍 ${SecurityUtils.escapeHtml(safeLocation.displayCoordinates)}
          </div>
        ` : ''}
        
        ${details ? `
          <div class="location-details">
            ${SecurityUtils.escapeHtml(LocationUtilityManager.truncateText(details, 100))}
          </div>
        ` : ''}
        
        <div class="location-actions">
          <button class="btn-primary btn-sm" 
                  data-action="view" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            View
          </button>
          <button class="btn-secondary btn-sm" 
                  data-action="edit" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Edit
          </button>
          <button class="btn-danger btn-sm" 
                  data-action="delete" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Delete
          </button>
        </div>
        
        ${safeLocation.displayCreatedDate ? `
          <div class="location-meta">
            Created: ${SecurityUtils.escapeHtml(safeLocation.displayCreatedDate)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate locations list container
   * @param {Array} locations - Array of locations
   * @returns {string} List HTML
   */
  static generateLocationsList(locations) {
    if (!locations || locations.length === 0) {
      return `
        <div class="empty-locations">
          <div class="empty-icon">📍</div>
          <h3>No saved locations</h3>
          <p>Click on the map to save your first location!</p>
        </div>
      `;
    }

    const locationItems = locations.map(location => this.generateLocationItemHTML(location)).join('');
    
    return `
      <div class="locations-header">
        <h3>Saved Locations (${locations.length})</h3>
        <div class="locations-controls">
          <button class="btn-secondary btn-sm" data-action="refreshLocations">
            🔄 Refresh
          </button>
        </div>
      </div>
      <div class="locations-list">
        ${locationItems}
      </div>
    `;
  }

  // ===== DETAIL TEMPLATES =====

  /**
   * Generate location details view
   * @param {Object} location - Location data
   * @returns {string} Details HTML
   */
  static generateLocationDetails(location) {
    const safeLocation = LocationUtilityManager.formatLocationForDisplay(location);
    const details = LocationUtilityManager.getLocationDetails(location);
    const typeBadgeClass = LocationUtilityManager.getTypeBadgeClass(location.type);
    
    return `
      <div class="location-details-content">
        <div class="location-header">
          <h3>${SecurityUtils.escapeHtml(safeLocation.displayName)}</h3>
          <span class="location-type-badge ${typeBadgeClass}">${SecurityUtils.escapeHtml(safeLocation.displayType)}</span>
        </div>
        
        <div class="location-section">
          <h4>📍 Address</h4>
          <p>${SecurityUtils.escapeHtml(safeLocation.displayAddress)}</p>
          
          ${safeLocation.displayCoordinates ? `
            <p class="coordinates">
              <strong>Coordinates:</strong> ${SecurityUtils.escapeHtml(safeLocation.displayCoordinates)}
            </p>
          ` : ''}
        </div>
        
        ${location.production_notes ? `
          <div class="location-section">
            <h4>📝 Production Notes</h4>
            <p>${SecurityUtils.escapeHtml(location.production_notes)}</p>
          </div>
        ` : ''}
        
        ${(location.entry_point || location.parking || location.access) ? `
          <div class="location-section">
            <h4>🚪 Access Information</h4>
            ${location.entry_point ? `<p><strong>Entry Point:</strong> ${SecurityUtils.escapeHtml(location.entry_point)}</p>` : ''}
            ${location.parking ? `<p><strong>Parking:</strong> ${SecurityUtils.escapeHtml(location.parking)}</p>` : ''}
            ${location.access ? `<p><strong>Access Notes:</strong> ${SecurityUtils.escapeHtml(location.access)}</p>` : ''}
          </div>
        ` : ''}
        
        <div class="location-section">
          <h4>📷 Photos</h4>
          <div class="location-photos" id="location-photos-${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            <!-- Photos will be loaded here by LocationPhotoManager -->
            <div class="loading-photos">Loading photos...</div>
          </div>
        </div>
        
        ${(safeLocation.displayCreatedDate || safeLocation.displayUpdatedDate) ? `
          <div class="location-section">
            <h4>📅 Timestamps</h4>
            ${safeLocation.displayCreatedDate ? `<p><strong>Created:</strong> ${SecurityUtils.escapeHtml(safeLocation.displayCreatedDate)}</p>` : ''}
            ${safeLocation.displayUpdatedDate ? `<p><strong>Updated:</strong> ${SecurityUtils.escapeHtml(safeLocation.displayUpdatedDate)}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ===== DIALOG TEMPLATES =====

  /**
   * Generate dialog wrapper HTML
   * @param {string} id - Dialog ID
   * @param {string} title - Dialog title
   * @param {string} content - Dialog content
   * @param {string} actions - Dialog actions
   * @returns {string} Dialog HTML
   */
  static generateDialog(id, title, content, actions = '') {
    return `
      <div class="dialog-overlay" id="${SecurityUtils.escapeHtmlAttribute(id)}-overlay">
        <div class="dialog-container" id="${SecurityUtils.escapeHtmlAttribute(id)}">
          <div class="dialog-header">
            <h3>${SecurityUtils.escapeHtml(title)}</h3>
            <button class="dialog-close" data-action="closeDialog">×</button>
          </div>
          <div class="dialog-content">
            ${content}
          </div>
          ${actions ? `
            <div class="dialog-actions">
              ${actions}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
