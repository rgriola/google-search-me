/**
 * Location Permission Service
 * Handles client-side permission checking for location actions
 */

import { StateManager } from '../state/AppState.js';

export class LocationPermissionService {
  
  /**
   * Check if current user can edit/delete a location
   * @param {Object} location - Location object
   * @returns {boolean} Whether user has edit/delete permissions
   */
  static canUserEditLocation(location) {
    const authState = StateManager.getAuthState();
    const currentUser = authState?.currentUser;
    
    // Must be authenticated
    if (!currentUser) {
      return false;
    }
    
    // Admins can edit everything
    if (currentUser.isAdmin) {
      return true;
    }
    
    // Permanent locations can only be edited by admins
    if (location.is_permanent === 1 || location.is_permanent === true) {
      return false;
    }
    
    // Regular users can only edit their own locations
    return location.created_by === currentUser.id;
  }
  
  /**
   * Check if current user is admin
   * @returns {boolean} Whether user is admin
   */
  static isCurrentUserAdmin() {
    const authState = StateManager.getAuthState();
    return authState?.currentUser?.isAdmin === true;
  }
  
  /**
   * Get current user ID
   * @returns {number|null} Current user ID
   */
  static getCurrentUserId() {
    const authState = StateManager.getAuthState();
    return authState?.currentUser?.id || null;
  }
}
