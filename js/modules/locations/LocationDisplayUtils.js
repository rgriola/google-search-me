/**
 * Location Display Utils
 * Utility functions for location display formatting and text processing
 */

export class LocationDisplayUtils {
  
  /**
   * Format location for display in lists
   * @param {Object} location - Location data
   * @returns {Object} Formatted location data
   */
  static formatLocationForDisplay(location) {
    return {
      ...location,
      displayName: location.name || 'Unnamed Location',
      displayAddress: location.formatted_address || location.address || 'No address',
      displayType: location.type || 'Location',
      displayCreatedDate: location.created_date || location.created_at 
        ? new Date(location.created_date || location.created_at).toLocaleDateString()
        : null,
      displayUpdatedDate: location.updated_date 
        ? new Date(location.updated_date).toLocaleDateString()
        : null,
      displayCoordinates: location.lat && location.lng 
        ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        : null
    };
  }

  /**
   * Get location summary text
   * @param {Object} location - Location data
   * @returns {string} Summary text
   */
  static getLocationSummary(location) {
    const parts = [];
    
    if (location.name) parts.push(location.name);
    if (location.type) parts.push(`(${location.type})`);
    if (location.formatted_address || location.address) {
      parts.push(location.formatted_address || location.address);
    }
    
    return parts.join(' - ');
  }

  /**
   * Get location details for tooltip or preview
   * @param {Object} location - Location data
   * @returns {string} Details text
   */
  static getLocationDetails(location) {
    const details = [];
    
    if (location.production_notes) {
      details.push(`Notes: ${location.production_notes}`);
    }
    if (location.entry_point) {
      details.push(`Entry: ${location.entry_point}`);
    }
    if (location.parking) {
      details.push(`Parking: ${location.parking}`);
    }
    if (location.access) {
      details.push(`Access: ${location.access}`);
    }
    
    return details.join(' | ');
  }

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format address components into a single string
   * @param {Object} location - Location with address components
   * @returns {string} Formatted address
   */
  static formatAddressComponents(location) {
    const parts = [];
    
    // Street address
    if (location.number || location.street) {
      const streetPart = [location.number, location.street].filter(Boolean).join(' ');
      if (streetPart.trim()) parts.push(streetPart.trim());
    }
    
    // City
    if (location.city && location.city.trim()) {
      parts.push(location.city.trim());
    }
    
    // State and zipcode
    if (location.state || location.zipcode) {
      const stateZip = [location.state, location.zipcode].filter(Boolean).join(' ');
      if (stateZip.trim()) parts.push(stateZip.trim());
    }
    
    return parts.join(', ');
  }

  /**
   * Get type badge class for styling
   * @param {string} type - Location type
   * @returns {string} CSS class name
   */
  static getTypeBadgeClass(type) {
    if (!type) return 'type-badge-default';
    
    const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
    return `type-badge-${normalizedType}`;
  }

  /**
   * Check if location has complete address information
   * @param {Object} location - Location data
   * @returns {boolean} True if address is complete
   */
  static hasCompleteAddress(location) {
    return !!(
      (location.street || location.number) &&
      location.city &&
      location.state
    );
  }

  /**
   * Check if location has location metadata
   * @param {Object} location - Location data
   * @returns {boolean} True if has metadata
   */
  static hasLocationMetadata(location) {
    return !!(
      location.production_notes ||
      location.entry_point ||
      location.parking ||
      location.access
    );
  }

  /**
   * Get location status indicators
   * @param {Object} location - Location data
   * @returns {Array} Array of status indicators
   */
  static getLocationStatus(location) {
    const status = [];
    
    if (location.lat && location.lng) {
      status.push('has-coordinates');
    }
    
    if (this.hasCompleteAddress(location)) {
      status.push('complete-address');
    }
    
    if (this.hasLocationMetadata(location)) {
      status.push('has-metadata');
    }
    
    if (location.created_date || location.created_at) {
      const created = new Date(location.created_date || location.created_at);
      const daysSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreated <= 1) {
        status.push('new');
      } else if (daysSinceCreated <= 7) {
        status.push('recent');
      }
    }
    
    return status;
  }
}
