
import { LocationUtilityManager } from './LocationUtilityManager.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';
import { LocationPermissionService } from './LocationPermissionService.js';

export class LocationTemplates {

  // ===== FORM TEMPLATES =====

  /**
   * Generate location form HTML
   * THIS IS THE SAVE AND EDIT AND VIEW FORM
   *  
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
    console.log('🔍 LocationTemplates.generateLocationForm()', {
      locationData, mode, id: locationData.id, idType: typeof locationData.id, place_id: locationData.place_id
    });

    return `
      <!-- Location Name and Type Row -->
      <div class="location-type-row">


        <div class="form-group location-name">
          <label for="location-name">Film Location *</label>
          <input type="text" id="location-name" name="name" value="${safeAttribute(locationData.name)}" 
                 placeholder="Enter location name" required>
        </div>
        
        <div class="form-group type-select">
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
              <option value="AL" ${locationData.state === 'AL' ? 'selected' : ''}>Alabama</option>
              <option value="AK" ${locationData.state === 'AK' ? 'selected' : ''}>Alaska</option>
              <option value="AS" ${locationData.state === 'AS' ? 'selected' : ''}>American Samoa</option>
              <option value="AZ" ${locationData.state === 'AZ' ? 'selected' : ''}>Arizona</option>
              <option value="AR" ${locationData.state === 'AR' ? 'selected' : ''}>Arkansas</option>
              <option value="CA" ${locationData.state === 'CA' ? 'selected' : ''}>California</option>
              <option value="CO" ${locationData.state === 'CO' ? 'selected' : ''}>Colorado</option>
              <option value="CT" ${locationData.state === 'CT' ? 'selected' : ''}>Connecticut</option>
              <option value="DC" ${locationData.state === 'DC' ? 'selected' : ''}>District of Columbia</option>
              <option value="DE" ${locationData.state === 'DE' ? 'selected' : ''}>Delaware</option>
              <option value="FL" ${locationData.state === 'FL' ? 'selected' : ''}>Florida</option>
              <option value="GA" ${locationData.state === 'GA' ? 'selected' : ''}>Georgia</option>
              <option value="GU" ${locationData.state === 'GU' ? 'selected' : ''}>Guam</option>
              <option value="HI" ${locationData.state === 'HI' ? 'selected' : ''}>Hawaii</option>
              <option value="ID" ${locationData.state === 'ID' ? 'selected' : ''}>Idaho</option>
              <option value="IL" ${locationData.state === 'IL' ? 'selected' : ''}>Illinois</option>
              <option value="IN" ${locationData.state === 'IN' ? 'selected' : ''}>Indiana</option>
              <option value="IA" ${locationData.state === 'IA' ? 'selected' : ''}>Iowa</option>
              <option value="KS" ${locationData.state === 'KS' ? 'selected' : ''}>Kansas</option>
              <option value="KY" ${locationData.state === 'KY' ? 'selected' : ''}>Kentucky</option>
              <option value="LA" ${locationData.state === 'LA' ? 'selected' : ''}>Louisiana</option>
              <option value="ME" ${locationData.state === 'ME' ? 'selected' : ''}>Maine</option>
              <option value="MD" ${locationData.state === 'MD' ? 'selected' : ''}>Maryland</option>
              <option value="MA" ${locationData.state === 'MA' ? 'selected' : ''}>Massachusetts</option>
              <option value="MI" ${locationData.state === 'MI' ? 'selected' : ''}>Michigan</option>
              <option value="MN" ${locationData.state === 'MN' ? 'selected' : ''}>Minnesota</option>
              <option value="MS" ${locationData.state === 'MS' ? 'selected' : ''}>Mississippi</option>
              <option value="MO" ${locationData.state === 'MO' ? 'selected' : ''}>Missouri</option>
              <option value="MT" ${locationData.state === 'MT' ? 'selected' : ''}>Montana</option>
              <option value="NE" ${locationData.state === 'NE' ? 'selected' : ''}>Nebraska</option>
              <option value="NV" ${locationData.state === 'NV' ? 'selected' : ''}>Nevada</option>
              <option value="NH" ${locationData.state === 'NH' ? 'selected' : ''}>New Hampshire</option>
              <option value="NJ" ${locationData.state === 'NJ' ? 'selected' : ''}>New Jersey</option>
              <option value="NM" ${locationData.state === 'NM' ? 'selected' : ''}>New Mexico</option>
              <option value="NY" ${locationData.state === 'NY' ? 'selected' : ''}>New York</option>
              <option value="NC" ${locationData.state === 'NC' ? 'selected' : ''}>North Carolina</option>
              <option value="ND" ${locationData.state === 'ND' ? 'selected' : ''}>North Dakota</option>
              <option value="MP" ${locationData.state === 'MP' ? 'selected' : ''}>Northern Mariana Islands</option>
              <option value="OH" ${locationData.state === 'OH' ? 'selected' : ''}>Ohio</option>
              <option value="OK" ${locationData.state === 'OK' ? 'selected' : ''}>Oklahoma</option>
              <option value="OR" ${locationData.state === 'OR' ? 'selected' : ''}>Oregon</option>
              <option value="PA" ${locationData.state === 'PA' ? 'selected' : ''}>Pennsylvania</option>
              <option value="PR" ${locationData.state === 'PR' ? 'selected' : ''}>Puerto Rico</option>
              <option value="RI" ${locationData.state === 'RI' ? 'selected' : ''}>Rhode Island</option>
              <option value="SC" ${locationData.state === 'SC' ? 'selected' : ''}>South Carolina</option>
              <option value="SD" ${locationData.state === 'SD' ? 'selected' : ''}>South Dakota</option>
              <option value="TN" ${locationData.state === 'TN' ? 'selected' : ''}>Tennessee</option>
              <option value="TX" ${locationData.state === 'TX' ? 'selected' : ''}>Texas</option>
              <option value="TT" ${locationData.state === 'TT' ? 'selected' : ''}>Trust Territories</option>
              <option value="UT" ${locationData.state === 'UT' ? 'selected' : ''}>Utah</option>
              <option value="VT" ${locationData.state === 'VT' ? 'selected' : ''}>Vermont</option>
              <option value="VI" ${locationData.state === 'VI' ? 'selected' : ''}>Virgin Islands</option>
              <option value="VA" ${locationData.state === 'VA' ? 'selected' : ''}>Virginia</option>
              <option value="WA" ${locationData.state === 'WA' ? 'selected' : ''}>Washington</option>
              <option value="WV" ${locationData.state === 'WV' ? 'selected' : ''}>West Virginia</option>
              <option value="WI" ${locationData.state === 'WI' ? 'selected' : ''}>Wisconsin</option>
              <option value="WY" ${locationData.state === 'WY' ? 'selected' : ''}>Wyoming</option>
            </select>
          </div>
          <div class="form-group form-group-flex-1">
            <label for="location-zipcode">ZIP Code</label>
            <input type="text" id="location-zipcode" name="zipcode" value="${safeValue(locationData.zipcode)}" 
                   placeholder="12345" maxlength="5" title="Enter 5-digit ZIP code">
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

      <!-- Coordinates Display -->
      <div class="type-coordinates-row">
        <div class="form-group coordinates-display-col">
          <label>Coordinates</label>
          <div class="coordinates-display">
            ${locationData.lat && locationData.lng ? 
              `Lat: ${SecurityUtils.escapeHtml(locationData.lat)}°, Lng: ${SecurityUtils.escapeHtml(locationData.lng)}°` : 
              'Not set'}
          </div>
          <input type="hidden" name="lat" value="${SecurityUtils.escapeHtmlAttribute(locationData.lat || '')}">
          <input type="hidden" name="lng" value="${SecurityUtils.escapeHtmlAttribute(locationData.lng || '')}">
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
        </div>
        
        ${safeLocation.displayCreatedDate ? `
          <div class="location-meta">
            Created: ${SecurityUtils.escapeHtml(safeLocation.displayCreatedDate)}, Owner: ${SecurityUtils.escapeHtml(safeLocation.displayOwner)}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate locations list container
   * 
   * The list itsself. indivual items are generated by generateLocationItemHTML
   * 
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
          <p>${SecurityUtils.escapeHtml(safeLocation.displayAddress)}</p>
          ${safeLocation.displayCoordinates ? 
          `<p class="coordinates"> ${SecurityUtils.escapeHtml(safeLocation.displayCoordinates)}</p>` : ''} 
        
        ${location.production_notes ? `
            <h4>📝 Production Notes</h4>
            <p>${SecurityUtils.escapeHtml(location.production_notes)}</p>

        ` : 'Notes'}
        
        ${(location.entry_point || location.parking || location.access) ? `
            ${location.entry_point ? `<p><strong>Entry Point:</strong> ${SecurityUtils.escapeHtml(location.entry_point)}</p>` : ''}
            ${location.parking ? `<p><strong>Parking:</strong> ${SecurityUtils.escapeHtml(location.parking)}</p>` : ''}
            ${location.access ? `<p><strong>Access Notes:</strong> ${SecurityUtils.escapeHtml(location.access)}</p>` : ''}
        ` : ''}

          <div class="location-photos" id="location-photos-${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            <!-- Photos will be loaded here by LocationPhotoManager -->
            <div class="loading-photos">Loading photos...</div>
          </div>
        
        ${(safeLocation.displayCreatedDate || safeLocation.displayUpdatedDate) ? `
            ${safeLocation.displayCreatedDate ? `<p><strong>created:</strong> ${SecurityUtils.escapeHtml(safeLocation.displayCreatedDate)} Owner: ${SecurityUtils.escapeHtml(safeLocation.displayOwner)} </p>` : ''}
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
