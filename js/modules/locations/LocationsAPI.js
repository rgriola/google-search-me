/**
 * Locations API Service
 * Simplified API operations for locations CRUD
 */
import { StateManager } from '../state/AppState.js';
import { debug, DEBUG } from '../../debug.js';
const FILE = 'LOCATIONS_API';

/**
 * Simplified Locations API
 */
export class LocationsAPI {

  /**
   * Initialize API service
   */
  static async initialize() {
    debug(FILE, '🌐 Initializing');
    
    // Migrate localStorage format if needed
    this.migrateLocalStorageFormat();
    
    debug(FILE, '✅ Initialized');
  }

  /**
   * Get all locations from database
   * @returns {Promise<Array>} Array of locations
   */
  static async getAllLocations() {
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/with-creators`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        const locations = result.data || result.locations || [];
        debug(FILE, `📍 Loaded ${locations.length} locations from database`);
        return locations;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      debug(FILE, 'Error loading locations from API:', error, 'error');
      return this.getFromLocalStorage();
    }
  }

  /**
   * Save a new location
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Saved location
   */
  static async saveLocation(locationData) {
    try {
      debug(FILE, '🌐 === LOCATIONSAPI SAVE DEBUG START ===');
      debug(FILE, '🌐 LocationsAPI.saveLocation called with:', locationData);
      
      // Get auth token
      const authState = StateManager.getAuthState();
      const authToken = authState?.authToken;

      if (!authToken) {
        throw new Error('Authentication required to save locations');
      }

      const apiUrl = `${StateManager.getApiBaseUrl()}/locations/save`;
      debug(FILE, '🌐 Making POST request to:', apiUrl);
      debug(FILE, '🌐 Request payload:', JSON.stringify(locationData, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(locationData)
      });

      debug(FILE, '🌐 Response status:', response.status, response.statusText);
      debug(FILE, '🌐 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const savedLocation = await response.json();
        debug(FILE, '✅ Server response successful:', savedLocation);
        debug(FILE, '✅ Location saved to database:', savedLocation.name);
        
        // Also save to localStorage as backup
        this.saveToLocalStorage(savedLocation);
        
        debug(FILE, '🌐 === LOCATIONSAPI SAVE DEBUG END (SUCCESS) ===');
        return savedLocation;
      } else {
        const errorText = await response.text();
        debug(FILE, '❌ Server response error text:', errorText, 'error');
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        debug(FILE, '❌ Parsed error data:', errorData, 'error');
        debug(FILE, '🌐 === LOCATIONSAPI SAVE DEBUG END (ERROR) ===');
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      debug(FILE, '❌ LocationsAPI.saveLocation error:', error, 'error');
      debug(FILE, '❌ Error message:', error.message, 'error');
      debug(FILE, '❌ Error stack:', error.stack, 'error');
      throw error;
    }
  }

  /**
   * Update an existing location
   * @param {string} placeId - Location ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated location
   */
  static async updateLocation(placeId, updateData) {
    try {
      const authState = StateManager.getAuthState();
      const authToken = authState?.authToken;

      if (!authToken) {
        throw new Error('Authentication required to update locations');
      }

      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedLocation = await response.json();
        debug(FILE, '✅ Location updated:', updatedLocation.name);
        return updatedLocation;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

    } catch (error) {
      debug(FILE, 'Error updating location:', error, 'error');
      throw error;
    }
  }

  /**
   * Delete a location
   * @param {string} placeId - (saved_locations.place_id)
   * @returns {Promise<void>}
   */
  static async deleteLocation(placeId) {
    try {
      const authState = StateManager.getAuthState();
      const authToken = authState?.authToken;

      if (!authToken) {
        throw new Error('Authentication required to delete locations');
      }

      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        debug(FILE, '✅ Location deleted from database');
        
        // Also remove from localStorage
        this.removeFromLocalStorage(placeId);
        
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      debug(FILE, 'Error deleting location:', error, 'error');
      throw error;
    }
  }

  /**
   * Get locations from localStorage
   * @returns {Array} Array of locations
   */
  static getFromLocalStorage() {
    try {
      const savedData = localStorage.getItem('savedLocations');
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      debug(FILE, 'Error reading from localStorage:', error, 'error');
      return [];
    }
  }

  /**
   * Save location to localStorage
   * @param {Object} location - Location to save
   */
  static saveToLocalStorage(location) {
    try {
      const existing = this.getFromLocalStorage();
      const updated = [...existing, location];
      localStorage.setItem('savedLocations', JSON.stringify(updated));
    } catch (error) {
      debug(FILE, 'Error saving to localStorage:', error, 'error');
    }
  }

  /**
   * Remove location from localStorage
   * @param {string} placeId - Location ID to remove
   */
  static removeFromLocalStorage(placeId) {
    try {
      const existing = this.getFromLocalStorage();
      const filtered = existing.filter(loc => (loc.place_id || loc.id) !== placeId);
      localStorage.setItem('savedLocations', JSON.stringify(filtered));
    } catch (error) {
      debug(FILE, 'Error removing from localStorage:', error, 'error');
    }
  }

  /**
   * Migrate localStorage format if needed
   */
  static migrateLocalStorageFormat() {
    try {
      const savedData = localStorage.getItem('savedLocations');
      if (!savedData) return;

      const locations = JSON.parse(savedData);
      
      // Check if migration is needed
      let needsMigration = false;
      const migratedLocations = locations.map(location => {
        if (location.geometry && !location.lat) {
          needsMigration = true;
          return {
            ...location,
            lat: location.geometry.location.lat,
            lng: location.geometry.location.lng,
            place_id: location.place_id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }
        return location;
      });

      if (needsMigration) {
        localStorage.setItem('savedLocations', JSON.stringify(migratedLocations));
        debug(FILE, '✅ localStorage format migrated');
      }
    } catch (error) {
      debug(FILE, 'Error migrating localStorage:', error, 'error');
    }
  }
}
