/**
 * Locations Storage Service
 * Handles localStorage operations for locations
 */

import { StateManager } from '../state/AppState.js';

/**
 * Locations Storage Service Class
 */
export class LocationsStorageService {

  /**
   * Load saved locations from localStorage (fallback)
   * @returns {Array} Array of saved locations
   */
  static loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('savedLocations');
      console.log('🔍 DEBUG: loadFromLocalStorage called, data:', saved);
      if (saved) {
        const locations = JSON.parse(saved);
        console.log('🔍 DEBUG: Parsed localStorage locations:', locations.length, 'items');
        StateManager.setSavedLocations(locations);
        
        // Dispatch event for UI updates
        this.dispatchLocationsEvent('locations-loaded', { locations });
        
        return locations;
      }
      
      console.log('📍 No saved locations found in localStorage');
      StateManager.setSavedLocations([]);
      
      // Dispatch event for UI updates
      this.dispatchLocationsEvent('locations-loaded', { locations: [] });
      
      return [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      StateManager.setSavedLocations([]);
      return [];
    }
  }

  /**
   * Save location to localStorage
   * @param {Object} locationData - Location data to save
   * @returns {Object} Save result
   */
  static saveToLocalStorage(locationData) {
    console.log('💾 Saving to localStorage:', locationData);
    
    try {
      // Get existing locations
      const existingLocations = this.getAllFromLocalStorage();
      
      // Check if location already exists
      const existingIndex = existingLocations.findIndex(loc => 
        loc.place_id === locationData.place_id
      );
      
      if (existingIndex !== -1) {
        // Update existing location
        existingLocations[existingIndex] = {
          ...existingLocations[existingIndex],
          ...locationData,
          updated_at: new Date().toISOString()
        };
      } else {
        // Add new location
        const newLocation = {
          ...locationData,
          id: Date.now(), // Simple ID generation for localStorage
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        existingLocations.push(newLocation);
      }
      
      // Save to localStorage
      localStorage.setItem('savedLocations', JSON.stringify(existingLocations));
      
      // Update state
      StateManager.setSavedLocations(existingLocations);
      
      console.log('✅ Successfully saved to localStorage');
      
      return {
        success: true,
        message: 'Location saved to local storage',
        location: existingIndex !== -1 ? existingLocations[existingIndex] : existingLocations[existingLocations.length - 1]
      };
      
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }

  /**
   * Delete location from localStorage
   * @param {string} placeId - Place ID to delete
   * @returns {Object} Delete result
   */
  static deleteFromLocalStorage(placeId) {
    console.log('🗑️ Deleting from localStorage:', placeId);
    
    try {
      const existingLocations = this.getAllFromLocalStorage();
      const filteredLocations = existingLocations.filter(loc => loc.place_id !== placeId);
      
      if (filteredLocations.length === existingLocations.length) {
        throw new Error('Location not found in localStorage');
      }
      
      localStorage.setItem('savedLocations', JSON.stringify(filteredLocations));
      StateManager.setSavedLocations(filteredLocations);
      
      console.log('✅ Successfully deleted from localStorage');
      
      return { success: true, message: 'Location deleted from local storage' };
      
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      throw error;
    }
  }

  /**
   * Get all locations from localStorage
   * @returns {Array} Array of all saved locations
   */
  static getAllFromLocalStorage() {
    try {
      const saved = localStorage.getItem('savedLocations');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting all from localStorage:', error);
      return [];
    }
  }

  /**
   * Update location in localStorage
   * @param {string} placeId - Place ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Update result
   */
  static updateInLocalStorage(placeId, updates) {
    console.log('📝 Updating in localStorage:', placeId, updates);
    
    try {
      const existingLocations = this.getAllFromLocalStorage();
      const locationIndex = existingLocations.findIndex(loc => loc.place_id === placeId);
      
      if (locationIndex === -1) {
        throw new Error('Location not found in localStorage');
      }
      
      // Update the location
      existingLocations[locationIndex] = {
        ...existingLocations[locationIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Save back to localStorage
      localStorage.setItem('savedLocations', JSON.stringify(existingLocations));
      StateManager.setSavedLocations(existingLocations);
      
      console.log('✅ Successfully updated in localStorage');
      
      return {
        success: true,
        message: 'Location updated in local storage',
        location: existingLocations[locationIndex]
      };
      
    } catch (error) {
      console.error('Error updating in localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear all locations from localStorage
   * @returns {Object} Clear result
   */
  static clearAllLocations() {
    console.log('🗑️ Clearing all locations from localStorage');
    
    try {
      localStorage.removeItem('savedLocations');
      StateManager.setSavedLocations([]);
      
      // Dispatch event for UI updates
      this.dispatchLocationsEvent('locations-cleared', { locations: [] });
      
      console.log('✅ All locations cleared from localStorage');
      
      return { success: true, message: 'All locations cleared' };
      
    } catch (error) {
      console.error('Error clearing all locations:', error);
      throw error;
    }
  }

  /**
   * Validate location data before storage
   * @param {Object} locationData - Location data to validate
   * @returns {boolean} Whether the data is valid
   */
  static validateLocationData(locationData) {
    if (!locationData) {
      console.error('Location data is null or undefined');
      return false;
    }
    
    if (!locationData.place_id) {
      console.error('Location data missing place_id');
      return false;
    }
    
    if (!locationData.name) {
      console.error('Location data missing name');
      return false;
    }
    
    return true;
  }

  /**
   * Migrate old localStorage format to new format
   * @returns {boolean} Whether migration was performed
   */
  static migrateLocalStorageFormat() {
    console.log('🔄 Checking for localStorage format migration...');
    
    try {
      const saved = localStorage.getItem('savedLocations');
      if (!saved) {
        return false; // No data to migrate
      }
      
      const locations = JSON.parse(saved);
      let migrationNeeded = false;
      
      // Check if any locations need migration
      const migratedLocations = locations.map(location => {
        if (!location.created_at) {
          migrationNeeded = true;
          return {
            ...location,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: location.id || Date.now() + Math.random()
          };
        }
        return location;
      });
      
      if (migrationNeeded) {
        localStorage.setItem('savedLocations', JSON.stringify(migratedLocations));
        StateManager.setSavedLocations(migratedLocations);
        console.log('✅ localStorage format migrated successfully');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error during localStorage migration:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  static getStorageStats() {
    try {
      const locations = this.getAllFromLocalStorage();
      const storageData = localStorage.getItem('savedLocations');
      
      return {
        totalLocations: locations.length,
        storageSize: storageData ? storageData.length : 0,
        lastModified: locations.length > 0 ? 
          Math.max(...locations.map(loc => new Date(loc.updated_at || loc.created_at || 0).getTime())) : 
          null
      };
      
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalLocations: 0,
        storageSize: 0,
        lastModified: null
      };
    }
  }

  /**
   * Dispatch locations event
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  static dispatchLocationsEvent(eventType, data) {
    window.dispatchEvent(new CustomEvent(`locations-${eventType}`, { detail: data }));
  }
}

// Export individual functions for backward compatibility
export const loadFromLocalStorage = LocationsStorageService.loadFromLocalStorage.bind(LocationsStorageService);
export const saveToLocalStorage = LocationsStorageService.saveToLocalStorage.bind(LocationsStorageService);
export const deleteFromLocalStorage = LocationsStorageService.deleteFromLocalStorage.bind(LocationsStorageService);
export const clearAllLocations = LocationsStorageService.clearAllLocations.bind(LocationsStorageService);
