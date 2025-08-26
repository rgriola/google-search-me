/**
 * LocationUtilityManager
 * Contains utility methods for location operations and display formatting
 */

export class LocationUtilityManager {

/*
These are the keys from a location object

access : "ramp"
city : "Denver"
created_by : 28
created_date : "2025-08-18 03:31:57"
creator_email : "rodczaro@gmail.com"
creator_username : "rgriola"
entry_point : "front door"
formatted_address : "414 14th Street, Denver, CO 80202, USA"
id : 122
imagekit_file_id : null
imagekit_file_path : null
is_permanent : 0
lat : 39.7415642775356
lng : -104.9922817675004
name : "14th St"
number : "414"
original_filename : null
parking : "street"
photo_uploaded_at : null
photo_uploaded_by : null
photo_urls : "[]"
place_id : "ChIJS3ju6tN4bIcR54-G86EtfbY"
production_notes : "Boo Yaaa"
state : "CO"
street : "14th Street"
type : "stakeout"
updated_date : "2025-08-18 03:31:57"
zipcode : "80202"
*/



  // ===== HTML UTILITIES =====

  /**
   * Decode HTML entities for display
   * @param {string} text - Text to decode
   * @returns {string} Decoded text
   */
  static decodeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText;
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

  // ===== LOCATION DATA UTILITIES =====

  /**
   * Get location by ID from state
   * @param {string} placeId - The place ID to find
   * @returns {Object|null} Location object or null if not found
   */
  static getLocationById(placeId) {
    try {
      // Import StateManager to get locations
      import('../state/AppState.js').then(({ StateManager }) => {
        const locations = StateManager.getSavedLocations();
        return locations.find(loc => (loc.place_id || loc.id) === placeId);
      });
    } catch (error) {
      console.error('❌ Error getting location by ID:', error);
      return null;
    }
  }

  // ===== DISPLAY FORMATTING =====

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

  // ===== STYLING UTILITIES =====

  /**
   * Get type badge class for styling
   * @param {string} type - Location type
   * @returns {string} CSS class name
   */
  static getTypeBadgeClass(type) {
    console.log('TYPE: ', type);
    if (!type) return 'type-badge-default';
    
    const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
    return `type-badge-${normalizedType}`;
  }

  // ===== VALIDATION UTILITIES =====

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

  // ===== NOTIFICATION UTILITIES =====

  /**
   * Show notification to user
   * @param {string} message - The notification message
   * @param {string} type - The notification type ('success', 'error', 'info')
   */
  static showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}):`, message);
    
    // Try to use Auth notification service if available
    if (window.Auth) {
      const { AuthNotificationService } = window.Auth.getServices();
      AuthNotificationService.showNotification(message, type);
      return;
    }
    
    // Try global notification function
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }
    
    // Fallback to alert
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }
}
