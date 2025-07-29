/**
 * Location Details Templates
 * Contains all HTML templates for location details display
 */

export class LocationDetailsTemplates {
  
  /**
   * Generate location details HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationDetails(location) {
    return `
      <div class="location-details enhanced">
        ${this.generateDetailHeader(location)}
        ${this.generateDetailSection(location)}
        ${this.generatePhotosSection(location)}
        ${this.generateDetailMeta(location)}
      </div>
    `;
  }

  /**
   * Generate detail header
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateDetailHeader(location) {
    return `
      <div class="detail-header">
        <h4 class="location-title">${this.escapeHtml(location.name || 'Unnamed Location')}</h4>
        <span class="location-type-badge ${location.type ? location.type.replace(/\s+/g, '-').toLowerCase() : 'default'}">${this.escapeHtml(location.type || 'No Type')}</span>
      </div>
    `;
  }

  /**
   * Generate main detail section
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateDetailSection(location) {
    const rows = [];
    
    // Address row (always shown)
    rows.push(`
      <div class="detail-row">
        <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Address:</label>
        <span>${this.escapeHtml(location.formatted_address || location.address || 'No address')}</span>
      </div>
    `);
    
    // Production notes row
    if (location.production_notes) {
      rows.push(`
        <div class="detail-row">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>Notes:</label>
          <span>${this.safeDisplayText(location.production_notes)}</span>
        </div>
      `);
    }
    
    // Entry point row
    if (location.entry_point) {
      rows.push(`
        <div class="detail-row">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"></path><path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path><circle cx="12" cy="12" r="10"></circle></svg>Entry:</label>
          <span>${this.escapeHtml(location.entry_point)}</span>
        </div>
      `);
    }
    
    // Parking row
    if (location.parking) {
      rows.push(`
        <div class="detail-row">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>Parking:</label>
          <span>${this.escapeHtml(location.parking)}</span>
        </div>
      `);
    }
    
    // Access row
    if (location.access) {
      rows.push(`
        <div class="detail-row">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>Access:</label>
          <span>${this.escapeHtml(location.access)}</span>
        </div>
      `);
    }
    
    return `
      <div class="detail-section">
        ${rows.join('')}
      </div>
    `;
  }

  /**
   * Generate photos section
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generatePhotosSection(location) {
    return `
      <div class="detail-section photos-section">
        <div class="detail-row photos-header">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg>Photos:</label>
        </div>
        <div class="location-photos-container" data-place-id="${location.place_id || location.id}">
          <div class="photos-loading">
            <div class="loading-spinner"></div>
            <p>Loading photos...</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate detail meta section
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateDetailMeta(location) {
    if (!location.lat || !location.lng) {
      return '';
    }

    const metaRows = [];
    
    // Coordinates row
    metaRows.push(`
      <div class="detail-row coordinates">
        <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"></polygon></svg>Coordinates:</label>
        <span class="coordinates-text">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
      </div>
    `);
    
    // Creator row
    if (location.creator_username) {
      metaRows.push(`
        <div class="detail-row">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Created by:</label>
          <span>${this.escapeHtml(location.creator_username)}</span>
        </div>
      `);
    }
    
    // Created date row
    if (location.created_date || location.created_at) {
      metaRows.push(`
        <div class="detail-row">
          <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Created:</label>
          <span>${new Date(location.created_date || location.created_at).toLocaleDateString()}</span>
        </div>
      `);
    }
    
    return `
      <div class="detail-meta">
        ${metaRows.join('')}
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
