import { LocationUtilityManager } from './LocationUtilityManager.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'LOCATION TEMPLATES';

/**
 * LocationTemplates
 * Generates HTML templates for location forms, lists, details, and dialogs.
 * All outputs are sanitized for security.
 */
export class LocationTemplates {

  // ===== FORM TEMPLATES =====

  /**
   * Generate location form HTML for save/edit/view.
   * @param {Object} locationData - Pre-filled location data
   * @returns {string} Form HTML
   */
  static generateLocationForm(locationData = {}) {
    const safeValue = (value) => SecurityUtils.escapeHtml(value || '');
    const safeTextareaValue = (value) => value || '';
    const safeAttribute = (value) => SecurityUtils.escapeHtmlAttribute(value || '');
    const mode = (locationData.id && typeof locationData.id === 'number') ? 'edit' : 'save';

    debug(FILE, '🔍 LocationTemplates.generateLocationForm()', {
      locationData, mode, id: locationData.id, idType: typeof locationData.id, place_id: locationData.place_id
    });

    return `
      <!-- Location Name and Type Row -->
      <div class="location-type-row">
        <div class="form-group type-select">
          <label for="location-type">*Type</label>
          <select id="location-type" name="type" required>
            <option value="">Select type...</option>
            <option value="broll" ${locationData.type === 'broll' ? 'selected' : ''}>B-Roll</option>
            <option value="interview" ${locationData.type === 'interview' ? 'selected' : ''}>Interview</option>
            <option value="live anchor" ${locationData.type === 'live anchor' ? 'selected' : ''}>Live Anchor</option>
            <option value="live reporter" ${locationData.type === 'live reporter' ? 'selected' : ''}>Live Reporter</option>
            <option value="stakeout" ${locationData.type === 'stakeout' ? 'selected' : ''}>Stakeout</option>
            <option value="headquarters" ${locationData.type === 'headquarters' ? 'selected' : ''}>Headquarters</option>
            <option value="drone" ${locationData.type === 'drone' ? 'selected' : ''}>Drone</option>
            <option value="bureau" ${locationData.type === 'bureau' ? 'selected' : ''}>Bureau</option>
            <option value="office" ${locationData.type === 'office' ? 'selected' : ''}>Office</option>
          </select>
        </div>
        <div class="form-group location-name">
          <label for="location-name">Name</label>
          <input type="text" id="location-name" name="name" value="${safeAttribute(locationData.name)}" 
                 placeholder="Enter location name" required>
        </div>
      <!-- Address Components -->
      <div class="form-section">
        <div class="form-group address-preview">
          <label>Address Preview:</label>
          <div class="address-display">${SecurityUtils.escapeHtml(LocationUtilityManager.formatAddressComponents(locationData) || 'Address will appear here...')}</div>
        </div>
        <div class="address-row">
          <div class="form-group address-number">
            <label for="location-number">Street Number</label>
            <input type="text" id="location-number" name="number" value="${safeAttribute(locationData.number)}" 
                   placeholder="123" maxlength="10" pattern="[0-9]{1,10}" title="Enter up to 10 digits">
          </div>
          <div class="form-group address-street">
            <label for="location-street">Street Name</label>
            <input type="text" id="location-street" name="street" value="${safeAttribute(locationData.street)}" placeholder="Main Street">
          </div>
        </div>
        <div class="address-row">
          <div class="form-group form-group-flex-2">
            <label for="location-city">City *</label>
            <input type="text" id="location-city" name="city" value="${safeValue(locationData.city)}" placeholder="City" required>
          </div>
          <div class="form-group form-group-flex-1">
            <label for="location-state">State *</label>
            <select id="location-state" name="state" required>
              <option value="">Select State...</option>
              <!-- State options omitted for brevity -->
              <option value="CA" ${locationData.state === 'CA' ? 'selected' : ''}>California</option>
              <!-- ... -->
              <option value="WY" ${locationData.state === 'WY' ? 'selected' : ''}>Wyoming</option>
            </select>
          </div>
          <div class="form-group form-group-flex-1">
            <label for="location-zipcode">ZIP Code</label>
            <input type="text" id="location-zipcode" name="zipcode" value="${safeValue(locationData.zipcode)}" 
                   placeholder="12345" maxlength="5" title="Enter 5-digit ZIP code">
          </div>
        </div>
        <input type="hidden" name="formatted_address" value="${safeAttribute(locationData.formatted_address)}">
        <input type="hidden" name="place_id" value="${SecurityUtils.escapeHtmlAttribute(locationData.place_id || locationData.placeId || '')}">
      </div>
      <!-- Coordinates Display -->
      <div class="type-coordinates-row">
        <div class="form-group coordinates-display-col">
          <div class="coordinates-display">
            ${locationData.lat && locationData.lng ? 
              `📍${SecurityUtils.escapeHtml(locationData.lat.toFixed(3))}°, ${SecurityUtils.escapeHtml(locationData.lng.toFixed(3))}°` : 
              'Missing'}
          </div>
          <input type="hidden" name="lat" value="${SecurityUtils.escapeHtmlAttribute(locationData.lat || '')}">
          <input type="hidden" name="lng" value="${SecurityUtils.escapeHtmlAttribute(locationData.lng || '')}">
        </div>
      </div>
      <!-- Production Details -->
      <div class="form-section">
        <h4>Production Details</h4>
        <div class="form-group">
          <label for="location-production-notes">Notes <span class="char-count"> (0/500 char)</span> </label>
          <textarea id="location-production-notes" name="production_notes" maxlength="500" 
                    placeholder="Add info about the production - do not add sensitive passwords etc...">${safeTextareaValue(locationData.production_notes)}</textarea>
        </div>
        <div class="address-row">
          <div class="form-group form-group-flex-1">
            <label for="location-parking">Parking *</label>
            <select id="location-parking" name="parking" required>
              <option value="">Parking...</option>
              <option value="street" ${locationData.parking === 'street' ? 'selected' : ''}>On Street</option>
              <option value="driveway" ${locationData.parking === 'driveway' ? 'selected' : ''}>Driveway</option>
              <option value="parking garage" ${locationData.parking === 'parking garage' ? 'selected' : ''}>Parking Garage</option>
              <option value="parking lot" ${locationData.parking === 'parking lot' ? 'selected' : ''}>Parking Lot</option>
              <option value="see production notes" ${locationData.parking === 'see production notes' ? 'selected' : ''}>See Prod Notes</option>
            </select>
          </div>
          <div class="form-group form-group-flex-1">
            <label for="location-entry-point">Entry Point *</label>
            <select id="location-entry-point" name="entry_point" required>
              <option value="">Gear Entry Point...</option>
              <option value="front door" ${locationData.entry_point === 'front door' ? 'selected' : ''}>Front Door</option>
              <option value="backdoor" ${locationData.entry_point === 'backdoor' ? 'selected' : ''}>Back Door</option>
              <option value="loading dock" ${locationData.entry_point === 'loading dock' ? 'selected' : ''}>Loading Dock</option>
              <option value="see production notes" ${locationData.entry_point === 'see production notes' ? 'selected' : ''}>See Prod Notes</option>
            </select>
          </div>
          <div class="form-group form-group-flex-1">
            <label for="location-access">Access *</label>
            <select id="location-access" name="access" required>
              <option value="">Gear Ramps...</option>
              <option value="ramp" ${locationData.access === 'ramp' ? 'selected' : ''}>Accessible Ramp</option>
              <option value="stairs only" ${locationData.access === 'stairs only' ? 'selected' : ''}>Stairs Only</option>
              <option value="passenger elevator" ${locationData.access === 'passenger elevator' ? 'selected' : ''}>Passenger Elevator</option>
              <option value="freight elevator" ${locationData.access === 'freight elevator' ? 'selected' : ''}>Freight Elevator</option>
              <option value="porter skycap" ${locationData.access === 'porter skycap' ? 'selected' : ''}>Porter/Skycap</option>
              <option value="see production notes" ${locationData.access === 'see production notes' ? 'selected' : ''}>See Prod Notes</option>
            </select>
          </div>
        </div>
      </div>
      <!-- Photos Section -->
      <div id="photos" class="form-section">
        <h4>Photos</h4>
        <div id="existing-photos-container" class="existing-photos">
          <div class="existing-photos-grid" id="existing-photos-grid"></div>
        </div>
        <div class="photo-upload-section">
          <input type="file" 
                 id="${mode}-photo-file-input" 
                 accept="image/jpeg,image/png,image/webp" 
                 multiple 
                 class="hidden-file-input">
          <div class="photo-drop-zone" id="${mode}-photo-drop-zone">
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
          <div class="photo-previews" id="${mode}-photo-preview"></div>
        </div>
      </div>
    `;
  }

  // ===== LIST TEMPLATES =====

  /**
   * Generate location item HTML for lists.
   * @param {Object} location - Location data
   * @returns {string} Location item HTML
   */
  static generateLocationItemHTML(location) {
    const safeLocation = LocationUtilityManager.formatLocationForDisplay(location);
    const typeBadgeClass = LocationUtilityManager.getTypeBadgeClass(location.type);
    const statusClasses = LocationUtilityManager.getLocationStatus(location).join(' ');
    debug(FILE, 'Type badge class:', typeBadgeClass);

    return `
      <div class="location-item ${statusClasses}" data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
        <div class="location-header">
          <span class="location-type-badge ${typeBadgeClass}">${SecurityUtils.escapeHtml(safeLocation.displayType)}</span>
          <h4 class="location-name">${SecurityUtils.escapeHtml(safeLocation.displayName)}</h4>
        </div>
        <div class="location-address">
          <p>${SecurityUtils.escapeHtml(safeLocation.displayAddressLine1)}</p>
          <p>${SecurityUtils.escapeHtml(safeLocation.displayAddressLine2)}</p>
        </div>
        ${safeLocation.displayCoordinates ? `
          <div class="location-coordinates">
            📍 ${SecurityUtils.escapeHtml(safeLocation.displayCoordinates)}
          </div>
        ` : ''}
        ${safeLocation.displayCreatedDate ? `
          <div class="location-meta">
            ${SecurityUtils.escapeHtml(safeLocation.displayOwner)} - ${SecurityUtils.escapeHtml(safeLocation.displayCreatedDate)}
          </div>
        ` : ''}
        <div class="location-actions">
          <button class="btn-primary btn-sm" 
                  data-action="view" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            View
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate locations list container.
   * @param {Array} locations - Array of locations
   * @returns {string} List HTML
   */
  static generateLocationsList(locations) {
    if (!locations || locations.length === 0) {
      return `
        <div class="empty-locations">
          <div class="empty-icon">📍</div>
          <h3>Add Your First Location</h3>
          <p>Click on the Pin Icon to Save a Location</p>
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
   * Generate details card after clicking "View".
   * @param {Object} location - Location data
   * @returns {string} Details HTML
   */
  static generateLocationDetails(location) {
    const safeLocation = LocationUtilityManager.formatLocationForDisplay(location);
    const typeBadgeClass = LocationUtilityManager.getTypeBadgeClass(location.type);
    return `
      <div class="location-details-content">
        <div class="location-header">
          <span class="location-type-badge ${typeBadgeClass}">${SecurityUtils.escapeHtml(safeLocation.displayType)}</span> 
          <h4>${SecurityUtils.escapeHtml(safeLocation.displayName)}</h4>
        </div>
        <div class="location-address">
          <p>${SecurityUtils.escapeHtml(safeLocation.displayAddress)}</p>
          ${safeLocation.displayCoordinates ? 
          `<p class="location-coordinates"> 📍 ${SecurityUtils.escapeHtml(safeLocation.displayCoordinates)}</p>` : ''} 
        </div>
        <div class="location-label boarder-space notes">
        ${location.production_notes ? `
            <h4>📝 Production Notes</h4>
            <p>${SecurityUtils.escapeHtml(location.production_notes)}</p>
        ` : 'Notes'}
        </div>
        <div class="location-label"><h4> 🗝️ Property Access</h4>
        ${(location.entry_point || location.parking || location.access) ? `
            ${location.parking ? `<p><strong>Parking :&nbsp;</strong> ${SecurityUtils.escapeHtml(location.parking)} </p>` : ''}
            ${location.entry_point ? `<p><strong>Entry :&nbsp;</strong> ${SecurityUtils.escapeHtml(location.entry_point)} </p>` : ''}
            ${location.access ? `<p><strong>Access Notes :&nbsp;</strong> ${SecurityUtils.escapeHtml(location.access)} </p>` : ''}
        ` : ''}
        </div>
        <div class="location-photos" id="location-photos-${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
          <div class="loading-photos">Loading photos...</div>
        </div>
        <div class="location-owner"><p>${SecurityUtils.escapeHtml(safeLocation.displayOwner)} -
        ${(safeLocation.displayCreatedDate || safeLocation.displayUpdatedDate) ? `
            ${safeLocation.displayCreatedDate ? `${SecurityUtils.escapeHtml(safeLocation.displayCreatedDate)}</p>` : ''}
            ${safeLocation.displayUpdatedDate ? `<p>update :&nbsp;${SecurityUtils.escapeHtml(safeLocation.displayUpdatedDate)}</p>` : ''}
            ` : ''}
        </div>
      </div>
    `;
  }

  // ===== DIALOG TEMPLATES =====

  /**
   * Generate dialog wrapper HTML.
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
