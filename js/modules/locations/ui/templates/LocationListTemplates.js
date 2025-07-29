/**
 * Location List Templates
 * Contains all HTML templates for location list rendering
 */

export class LocationListTemplates {
  
  /**
   * Generate location item HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationItem(location) {
    const name = location.name || 'Unnamed Location';
    const address = location.formatted_address || location.address || 'No address';
    const type = location.type || 'Location';
    const placeId = location.place_id || location.id;

    return `
      <div class="location-item" data-place-id="${placeId}">
        <div class="location-info">
          ${this.generateLocationHeader(name, address, type)}
          ${this.generateLocationDetails(location)}
          ${this.generateLocationMeta(location)}
        </div>
        ${this.generateLocationActions()}
      </div>
    `;
  }

  /**
   * Generate location header (name, address, type)
   * @param {string} name - Location name
   * @param {string} address - Location address
   * @param {string} type - Location type
   * @returns {string} HTML string
   */
  static generateLocationHeader(name, address, type) {
    return `
      <h4 class="location-name">${this.escapeHtml(name)}</h4>
      <p class="location-address"><strong>Address:</strong> ${this.escapeHtml(address)}</p>
      <p><strong>Type:</strong> ${this.escapeHtml(type)}</p>
    `;
  }

  /**
   * Generate location details section
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationDetails(location) {
    const details = [];
    
    // Production notes
    if (location.production_notes) {
      details.push(`<p><strong>Production Notes:</strong> ${this.safeDisplayText(location.production_notes)}</p>`);
    }
    
    // Entry point
    if (location.entry_point) {
      details.push(`<p><strong>Entry Point:</strong> ${this.escapeHtml(location.entry_point)}</p>`);
    }
    
    // Parking
    if (location.parking) {
      details.push(`<p><strong>Parking:</strong> ${this.escapeHtml(location.parking)}</p>`);
    }
    
    // Access
    if (location.access) {
      details.push(`<p><strong>Access:</strong> ${this.escapeHtml(location.access)}</p>`);
    }
    
    // Location components
    if (location.street || location.number || location.city || location.state || location.zipcode) {
      const streetAddress = [location.number, location.street].filter(Boolean).join(' ');
      const cityStateZip = [location.city, location.state, location.zipcode].filter(Boolean).join(' ');
      details.push(`<p><strong>Location:</strong> ${streetAddress}, ${cityStateZip}</p>`);
    }
    
    // Coordinates
    if (location.lat && location.lng) {
      details.push(`<p><strong>Coordinates:</strong> ${location.lat}, ${location.lng}</p>`);
    }
    
    return details.join('');
  }

  /**
   * Generate location metadata section
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationMeta(location) {
    const meta = [];
    
    // Creator
    if (location.creator_username) {
      meta.push(`<p><strong>Created by:</strong> ${this.escapeHtml(location.creator_username)}</p>`);
    }
    
    // Created date
    if (location.created_date || location.created_at) {
      const createdDate = new Date(location.created_date || location.created_at).toLocaleDateString();
      meta.push(`<p><strong>Created:</strong> ${createdDate}</p>`);
    }
    
    // Updated date
    if (location.updated_date) {
      const updatedDate = new Date(location.updated_date).toLocaleDateString();
      meta.push(`<p><strong>Updated:</strong> ${updatedDate}</p>`);
    }
    
    return meta.join('');
  }

  /**
   * Generate location action buttons
   * @returns {string} HTML string
   */
  static generateLocationActions() {
    return `
      <div class="location-actions">
        <button data-action="view" title="View Details">👁️ View</button>
        <button data-action="edit" title="Edit">✏️ Edit</button>
        <button data-action="delete" title="Delete">🗑️ Delete</button>
      </div>
    `;
  }

  /**
   * Generate empty locations message
   * @returns {string} HTML string
   */
  static generateEmptyMessage() {
    return '<p class="no-locations">No saved locations yet.</p>';
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
    const decoded = this.decodeHtml(text);
    return this.escapeHtml(decoded);
  }
}
