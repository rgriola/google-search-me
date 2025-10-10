/**
 * GPS Permission Service
 * 
 * RESPONSIBILITY: Manages GPS permission state and user preferences only
 * - Tracks user's GPS permission status (granted/denied/not_asked)
 * - Updates user profile with GPS preferences
 * - Provides permission checking logic
 * 
 * DOES NOT: 
 * - Actually get GPS coordinates (use MapService.getCurrentLocation)
 * - Center map or add markers (use MapService.centerOnUserLocation)
 * - Handle UI interactions (handled by MapControlsManager → MapService)
 * 
 * USAGE:
 * - GPS Button: MapControlsManager → MapService.centerOnUserLocation()
 * - Permission checks: GPSPermissionService.hasStoredGPSPermission()
 * - State updates: GPSPermissionService.updateUserGPSPermission()
 */

import { StateManager } from '../state/AppState.js';
import { createLogger, LOG_CATEGORIES } from '../../utils/Logger.js';

// Create category-specific logger
const logger = createLogger(LOG_CATEGORIES.GPS);

import { debug, DEBUG } from '../../debug.js';
const FILE = 'GPS_PERMISSION_SERVICE';

/**
 * GPS Permission Service Class
 */
export class GPSPermissionService {

  /**
   * GPS Permission States
   */
  static PERMISSION_STATES = {
    NOT_ASKED: 'not_asked',
    GRANTED: 'granted', 
    DENIED: 'denied'
  };

  /**
   * Check if user has stored GPS permission in their profile
   * @returns {Promise<boolean>} True if user has granted GPS permission
   */
  static async hasStoredGPSPermission() {
    try {
      const authState = StateManager.getAuthState();
      
      // User must be authenticated to have stored permissions
      if (!authState.currentUser || !authState.currentUser.id) {
        debug(FILE, 'User not authenticated, cannot have stored GPS permission');
        return false;
      }

      // Check server for user's GPS permission status
      const response = await fetch('/api/auth/gps-permission', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logger.warn('Could not fetch GPS permission from server');
        debug(FILE, 'Could not fetch GPS permission from server', null, 'warn');
        return false;
      }

      const data = await response.json();
      debug(FILE, 'Fetched GPS permission from server:', data);

      return data.success && data.gps_permission === this.PERMISSION_STATES.GRANTED;
      
    } catch (error) {
      logger.error('Error checking stored GPS permission', error);
      debug(FILE, 'Error checking stored GPS permission', error, 'error');
      return false;
    }
  }

  /**
   * Request GPS permission from browser and update user profile
   * @returns {Promise<{granted: boolean, position?: Object}>} Permission result and position if granted
   */
  static async requestGPSPermission() {
    try {
      const authState = StateManager.getAuthState();
      
      // First check if user is authenticated
      if (!authState?.currentUser) {
        logger.debug('User not authenticated, cannot store GPS permission');
        debug(FILE, 'User not authenticated, cannot store GPS permission');
        return await this.requestBrowserGPSOnly();
      }

      logger.info('Requesting GPS permission from user...');
      debug(FILE, 'Requesting GPS permission from user...');

      // Request GPS permission from browser
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(position);
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      // Permission granted - save to user profile
      await this.updateUserGPSPermission(this.PERMISSION_STATES.GRANTED);
      
      logger.info('GPS permission granted and saved to profile');
      debug(FILE, 'GPS permission granted and saved to profile');
      return {
        granted: true,
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

    } catch (error) {
      logger.warn('GPS permission denied', { error: error.message });
      debug(FILE, 'GPS permission denied', error, 'warn');
      
      // Permission denied - save to user profile if authenticated
      const authState = StateManager.getAuthState();
      if (authState?.currentUser) {
        await this.updateUserGPSPermission(this.PERMISSION_STATES.DENIED);
      }
      
      return {
        granted: false,
        error: error.message
      };
    }
  }

  /**
   * Request GPS permission from browser only (for non-authenticated users)
   * @returns {Promise<{granted: boolean, position?: Object}>} Permission result
   */
  static async requestBrowserGPSOnly() {
    try {
      debug(FILE, 'Requesting browser-only GPS permission');
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });

      debug(FILE, 'Browser-only GPS permission granted');
      return {
        granted: true,
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

    } catch (error) {
      debug(FILE, 'Browser-only GPS permission denied', error, 'warn');
      return {
        granted: false,
        error: error.message
      };
    }
  }

  /**
   * Update user's GPS permission in their profile
   * @param {string} permission - Permission state ('granted', 'denied', 'not_asked')
   */
  static async updateUserGPSPermission(permission) {
    try {
      const authState = StateManager.getAuthState();
      
      // User must be authenticated to update permissions
      if (!authState.currentUser || !authState.currentUser.id) {
        logger.warn('Cannot update GPS permission - user not authenticated');
        debug(FILE, 'Cannot update GPS permission - user not authenticated', null, 'warn');
        return false;
      }

      // Update permission on server
      const response = await fetch('/api/auth/gps-permission', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permission })
      });

      if (!response.ok) {
        logger.error('Failed to update GPS permission on server');
        debug(FILE, 'Failed to update GPS permission on server', null, 'error');
        return false;
      }

      const data = await response.json();
      debug(FILE, 'Updated GPS permission on server:', data);
      
      if (data.success) {
        logger.info(`GPS permission updated to: ${permission}`);
        debug(FILE, `GPS permission updated to: ${permission}`);
        return true;
      }
      
      return false;

    } catch (error) {
      logger.error('Error updating user GPS permission', error);
      debug(FILE, 'Error updating user GPS permission', error, 'error');
      return false;
    }
  }

  /**
   * Get user's current GPS permission status
   * @returns {Promise<string>} Current permission state
   */
  static async getCurrentGPSPermissionStatus() {
    try {
      const authState = StateManager.getAuthState();
      
      if (!authState.currentUser || !authState.currentUser.id) {
        debug(FILE, 'User not authenticated, returning NOT_ASKED');
        return this.PERMISSION_STATES.NOT_ASKED;
      }

      // Get permission status from server
      const response = await fetch('/api/auth/gps-permission', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        debug(FILE, 'getCurrentGPSPermissionStatus - GPS Status:', data.gps_permission);
        return data.gps_permission || this.PERMISSION_STATES.NOT_ASKED;
      }

      debug(FILE, 'getCurrentGPSPermissionStatus - response not ok', null, 'warn');
      return this.PERMISSION_STATES.NOT_ASKED;
    } catch (error) {
      logger.error('Error getting GPS permission status', error);
      debug(FILE, 'Error getting GPS permission status', error, 'error');
      return this.PERMISSION_STATES.NOT_ASKED;
    }
  }

  /**
   * Check if we should ask for GPS permission
   * @returns {Promise<boolean>} True if we should ask for permission
   */
  static async shouldRequestGPSPermission() {
    const status = await this.getCurrentGPSPermissionStatus();
    debug(FILE, 'shouldRequestGPSPermission status:', status);
    return status === this.PERMISSION_STATES.NOT_ASKED;
  }

  /**
   * Reset GPS permission (allow user to be asked again)
   */
  static async resetGPSPermission() {
    debug(FILE, 'Resetting GPS permission to NOT_ASKED');
    await this.updateUserGPSPermission(this.PERMISSION_STATES.NOT_ASKED);
  }
}
