/**
 * Locations API Service
 * Handles all API-related operations for locations
 */

import { StateManager } from '../state/AppState.js';

/**
 * Locations API Service Class
 */
export class LocationsAPIService {

  /**
   * Load all saved locations from API (public endpoint)
   * Shows all locations saved by any user in the database
   * @returns {Promise<Array>} Array of all saved locations
   */
  static async loadSavedLocations() {
    console.log('📍 Loading all saved locations from database...');
    
    try {
      // Use enhanced endpoint to get ALL locations with creator information
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/with-creators`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📦 Raw API response:', result);
        
        const locations = result.data || result; // Handle both response formats
        console.log('📍 Parsed locations array:', locations.length, 'locations');
        console.log('🔍 DEBUG: Locations from API:', locations);
        
        StateManager.setSavedLocations(locations);
        
        // Dispatch event for UI updates
        this.dispatchLocationsEvent('locations-loaded', { locations });
        
        return locations;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load saved locations');
      }

    } catch (error) {
      console.error('Error loading saved locations from API:', error);
      throw error;
    }
  }

  /**
   * Save location to API
   * @param {Object} locationData - Location data to save
   * @returns {Promise<Object>} Saved location response
   */
  static async saveToAPI(locationData) {
    console.log('🌐 Saving to API with data:', locationData);
    
    const authState = StateManager.getAuthState();
    console.log('🔑 Auth state:', { 
      isAuthenticated: !!authState.authToken,
      tokenPreview: authState.authToken ? authState.authToken.substring(0, 20) + '...' : 'none'
    });
    
    const apiUrl = `${StateManager.getApiBaseUrl()}/locations/save`;
    console.log('📡 API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authState.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    });

    console.log('📊 API response status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Successfully saved to API:', result);
      
      // Refresh the locations list to show the new location
      await this.loadSavedLocations();
      
      return {
        success: true,
        message: 'Location saved successfully',
        location: result.location
      };
    } else {
      const errorData = await response.json();
      console.error('❌ API error response:', errorData);
      throw new Error(errorData.message || 'Failed to save location');
    }
  }

  /**
   * Delete location from API
   * @param {string} placeId - Place ID to delete
   * @returns {Promise<Object>} Delete result
   */
  static async deleteFromAPI(placeId) {
    console.log('🗑️ Deleting from API:', placeId);
    
    const authState = StateManager.getAuthState();
    const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authState.authToken}`
      }
    });

    if (response.ok) {
      console.log('✅ Successfully deleted from API');
      
      // Refresh the locations list
      await this.loadSavedLocations();
      
      return { success: true, message: 'Location deleted successfully' };
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete location');
    }
  }

  /**
   * Load locations with creators information
   * @returns {Promise<Array>} Array of locations with creator info
   */
  static async loadLocationsWithCreators() {
    console.log('📍 Loading locations with creators...');
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/with-creators`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const locations = result.data || result;
        console.log('📍 Loaded locations with creators:', locations.length);
        
        StateManager.setSavedLocations(locations);
        
        // Dispatch event for UI updates
        this.dispatchLocationsEvent('locations-loaded', { locations });
        
        return locations;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load locations with creators');
      }

    } catch (error) {
      console.error('Error loading locations with creators:', error);
      throw error;
    }
  }

  /**
   * Get location by place ID from API
   * @param {string} placeId - Place ID
   * @returns {Promise<Object>} Location data
   */
  static async getLocationByPlaceId(placeId) {
    console.log('📍 Getting location by place ID:', placeId);
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Location found:', result);
        return result.location;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Location not found');
      }

    } catch (error) {
      console.error('Error getting location by place ID:', error);
      throw error;
    }
  }

  /**
   * Update location via API
   * @param {string} placeId - Place ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  static async updateLocation(placeId, updates) {
    console.log('📍 Updating location:', placeId, updates);
    
    // Check authentication using the proper method
    if (!StateManager.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    const authState = StateManager.getAuthState();
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.authToken}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update location');
      }
      
      const result = await response.json();
      console.log('✅ Location updated successfully');
      
      // Refresh locations
      await this.loadSavedLocations();
      
      return result;
      
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Delete a location by place ID
   * @param {string} placeId - Place ID
   * @returns {Promise<Object>} Delete result
   */
  static async deleteLocationByPlaceId(placeId) {
    console.log('📍 Deleting location:', placeId);
    
    // Check authentication using the proper method
    if (!StateManager.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    
    const authState = StateManager.getAuthState();
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete location');
      }
      
      const result = await response.json();
      console.log('✅ Location deleted successfully');
      
      // Refresh locations
      await this.loadSavedLocations();
      
      return result;
      
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Check if user can edit a location
   * @param {string} placeId - Place ID
   * @returns {Promise<boolean>} Whether user can edit
   */
  static async canUserEditLocation(placeId) {
    // Check authentication using the proper method
    if (!StateManager.isAuthenticated()) {
      return false;
    }
    
    const authState = StateManager.getAuthState();
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}/can-edit`, {
        headers: {
          'Authorization': `Bearer ${authState.authToken}`
        }
      });
      
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return result.canEdit;
      
    } catch (error) {
      console.error('Error checking edit permission:', error);
      return false;
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
export const loadSavedLocations = LocationsAPIService.loadSavedLocations.bind(LocationsAPIService);
export const saveToAPI = LocationsAPIService.saveToAPI.bind(LocationsAPIService);
export const deleteFromAPI = LocationsAPIService.deleteFromAPI.bind(LocationsAPIService);
export const loadLocationsWithCreators = LocationsAPIService.loadLocationsWithCreators.bind(LocationsAPIService);
export const getLocationByPlaceId = LocationsAPIService.getLocationByPlaceId.bind(LocationsAPIService);
export const updateLocation = LocationsAPIService.updateLocation.bind(LocationsAPIService);
export const deleteLocationByPlaceId = LocationsAPIService.deleteLocationByPlaceId.bind(LocationsAPIService);
export const canUserEditLocation = LocationsAPIService.canUserEditLocation.bind(LocationsAPIService);
