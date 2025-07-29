/**
 * LocationUtilityManager
 * Contains utility methods for location operations
 */
export class LocationUtilityManager {

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
    return div.textContent || div.innerText;
  }

  /**
   * Safely display text with proper encoding/decoding
   * @param {string} text - Text to display
   * @returns {string} Safe display text
   */
  static safeDisplayText(text) {
    if (!text) return '';
    return this.decodeHtml(this.escapeHtml(text));
  }

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
