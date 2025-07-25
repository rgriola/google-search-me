/**
 * GPS Permission Service
 * Handles GPS permission management and user preferences
 */

import { StateManager } from '../state/AppState.js';

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
        console.warn('📍 Could not fetch GPS permission from server');
        return false;
      }

      const data = await response.json();
      
      return data.success && data.gps_permission === this.PERMISSION_STATES.GRANTED;
      
    } catch (error) {
      console.error('📍 Error checking stored GPS permission:', error);
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
        console.log('⚠️ User not authenticated, cannot store GPS permission');
        return await this.requestBrowserGPSOnly();
      }

      console.log('📍 Requesting GPS permission from user...');

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
      
      console.log('✅ GPS permission granted and saved to profile');
      return {
        granted: true,
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

    } catch (error) {
      console.log('❌ GPS permission denied:', error.message);
      
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

      return {
        granted: true,
        position: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

    } catch (error) {
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
        console.warn('📍 Cannot update GPS permission - user not authenticated');
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
        console.error('📍 Failed to update GPS permission on server');
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`📍 GPS permission updated to: ${permission}`);
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('Error updating user GPS permission:', error);
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
        return data.gps_permission || this.PERMISSION_STATES.NOT_ASKED;
      }

      return this.PERMISSION_STATES.NOT_ASKED;
    } catch (error) {
      console.error('Error getting GPS permission status:', error);
      return this.PERMISSION_STATES.NOT_ASKED;
    }
  }

  /**
   * Check if we should ask for GPS permission
   * @returns {Promise<boolean>} True if we should ask for permission
   */
  static async shouldRequestGPSPermission() {
    const status = await this.getCurrentGPSPermissionStatus();
    return status === this.PERMISSION_STATES.NOT_ASKED;
  }

  /**
   * Reset GPS permission (allow user to be asked again)
   */
  static async resetGPSPermission() {
    await this.updateUserGPSPermission(this.PERMISSION_STATES.NOT_ASKED);
  }
}
