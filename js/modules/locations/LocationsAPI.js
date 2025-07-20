/**
 * Locations API Service
 * Simplified API operations for locations CRUD
 */

import { StateManager } from '../state/AppState.js';

/**
 * Simplified Locations API
 */
export class LocationsAPI {

  /**
   * Initialize API service
   */
  static async initialize() {
    console.log('🌐 Initializing Locations API');
    
    // Migrate localStorage format if needed
    this.migrateLocalStorageFormat();
    
    console.log('✅ Locations API initialized');
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
        console.log(`📍 Loaded ${locations.length} locations from database`);
        return locations;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading locations from API:', error);
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
      // Get auth token
      const authState = StateManager.getAuthState();
      const authToken = authState?.authToken;

      if (!authToken) {
        throw new Error('Authentication required to save locations');
      }

      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(locationData)
      });

      if (response.ok) {
        const savedLocation = await response.json();
        console.log('✅ Location saved to database:', savedLocation.name);
        
        // Also save to localStorage as backup
        this.saveToLocalStorage(savedLocation);
        
        return savedLocation;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving location:', error);
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
        console.log('✅ Location updated:', updatedLocation.name);
        return updatedLocation;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location
   * @param {string} placeId - Location ID
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
        console.log('✅ Location deleted from database');
        
        // Also remove from localStorage
        this.removeFromLocalStorage(placeId);
        
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
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
      console.error('Error reading from localStorage:', error);
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
      console.error('Error saving to localStorage:', error);
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
      console.error('Error removing from localStorage:', error);
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
        console.log('✅ localStorage format migrated');
      }
    } catch (error) {
      console.error('Error migrating localStorage:', error);
    }
  }
}
