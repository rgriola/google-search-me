/**
 * Saved locations service
 * Handles CRUD operations for user's saved locations
 */

import { StateManager } from '../state/AppState.js';

/**
 * Locations Service Class
 */
export class LocationsService {

  /**
   * Initialize locations service
   */
  static async initialize() {
    console.log('📍 Initializing Locations Service');
    
    try {
      // DEBUG: Check localStorage before doing anything
      const localStorageData = localStorage.getItem('savedLocations');
      console.log('🔍 DEBUG: localStorage at service init:', localStorageData ? `${JSON.parse(localStorageData).length} items` : 'null');
      
      // Always load all saved locations from database (public endpoint)
      await this.loadSavedLocations();
      
      console.log('✅ Locations Service initialized');
      
    } catch (error) {
      console.error('Error initializing locations service:', error);
      // Fallback to localStorage
      this.loadFromLocalStorage();
    }
  }

  /**
   * Load all saved locations from API (public endpoint)
   * Shows all locations saved by any user in the database
   * @returns {Promise<Array>} Array of all saved locations
   */
  static async loadSavedLocations() {
    console.log('📍 Loading all saved locations from database...');
    
    // DEBUG: Check localStorage before API call
    const localStorageData = localStorage.getItem('savedLocations');
    console.log('🔍 DEBUG: localStorage before API call:', localStorageData ? JSON.parse(localStorageData).length + ' items' : 'null');

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
      console.log('🔍 DEBUG: Falling back to localStorage due to error');
      // Fallback to localStorage on error
      return this.loadFromLocalStorage();
    }
  }

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
      console.log('🔍 DEBUG: No localStorage data found');
      return [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  /**
   * Save a location
   * @param {Object} place - Place object to save
   * @returns {Promise<Object>} Saved location data
   */
  static async saveLocation(place) {
    console.log('🔧 LocationsService: saveLocation called with:', place);
    
    if (!place || !place.place_id) {
      console.error('❌ Invalid place data:', place);
      throw new Error('Invalid place data');
    }

    try {
      // Prepare location data - handle both Google Places API format and direct coordinates
      let lat, lng;
      
      // Extract coordinates with multiple fallback methods
      if (place.lat !== undefined && place.lng !== undefined) {
        // Direct coordinates (from ClickToSaveService)
        lat = place.lat;
        lng = place.lng;
      } else if (place.geometry && place.geometry.location) {
        // Google Places API format
        if (typeof place.geometry.location.lat === 'function') {
          lat = place.geometry.location.lat();
          lng = place.geometry.location.lng();
        } else {
          lat = place.geometry.location.lat;
          lng = place.geometry.location.lng;
        }
      } else {
        console.error('❌ No valid coordinates found in place data:', place);
        throw new Error('Location coordinates are required');
      }
      
      // Ensure coordinates are valid numbers
      lat = parseFloat(lat);
      lng = parseFloat(lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.error('❌ Invalid coordinates - lat:', lat, 'lng:', lng);
        throw new Error('Invalid location coordinates');
      }
      
      // Validate coordinate ranges
      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90');
      }
      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180');
      }

      const locationData = {
        place_id: place.place_id,
        name: place.name || 'Unknown Place',
        formatted_address: place.formatted_address || place.vicinity || place.address || '',
        lat: lat,
        lng: lng,
        // Enhanced location fields for new save format
        description: place.description || '',
        street: place.street || '',
        number: place.number || '',
        city: place.city || '',
        state: place.state || '',
        zipcode: place.zipcode || '',
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || null,
        types: place.types || [],
        website: place.website || null,
        formatted_phone_number: place.formatted_phone_number || null,
        opening_hours: place.opening_hours ? {
          open_now: place.opening_hours.open_now,
          weekday_text: place.opening_hours.weekday_text
        } : null,
        price_level: place.price_level || null,
        photos: place.photos ? place.photos.slice(0, 3).map(photo => {
          try {
            return photo.getUrl({ maxWidth: 400, maxHeight: 300 });
          } catch (e) {
            return null;
          }
        }).filter(url => url) : [],
        saved_at: new Date().toISOString()
      };

      console.log('📦 Prepared location data:', locationData);
      console.log('� DEBUG: Coordinates check - lat:', locationData.lat, 'lng:', locationData.lng);
      console.log('�🔐 Is authenticated:', StateManager.isAuthenticated());

      if (StateManager.isAuthenticated()) {
        console.log('💾 Saving to API...');
        // Save to API
        const apiResult = await this.saveToAPI(locationData);
        console.log('✅ API save result:', apiResult);
        
        // Extract the location data from the API response
        const savedLocation = apiResult.location || apiResult.data || apiResult;
        
        // Reload all locations from database to ensure consistency
        await this.loadSavedLocations();
        
        // Dispatch success event with original place data for notification
        this.dispatchLocationsEvent('location-saved', { 
          location: savedLocation,
          place 
        });
        
        // Return the full API response to preserve success status
        return apiResult;
        
      } else {
        console.log('💾 Saving to localStorage (not authenticated)...');
        // Save to localStorage
        const savedLocation = this.saveToLocalStorage(locationData);
        
        // Add to local state
        StateManager.addSavedLocation(savedLocation);
        
        // Dispatch success event
        this.dispatchLocationsEvent('location-saved', { 
          location: savedLocation,
          place 
        });
        
        // Return consistent response format
        return {
          success: true,
          message: 'Location saved to local storage',
          location: savedLocation
        };
      }

    } catch (error) {
      console.error('❌ Error saving location:', error);
      
      // Dispatch error event
      this.dispatchLocationsEvent('save-error', { 
        error,
        place 
      });
      
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
      console.log('✅ API save successful:', result);
      
      // Return the full result to preserve success status and message
      return result;
    } else {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('❌ Failed to parse error response as JSON:', parseError);
        console.error('❌ Raw response text:', responseText);
        throw new Error(`API request failed with status ${response.status}: ${responseText}`);
      }
      
      console.error('❌ API save failed with status:', response.status);
      console.error('❌ Error data:', errorData);
      console.error('❌ Full error object:', JSON.stringify(errorData, null, 2));
      
      throw new Error(errorData.message || errorData.error || `Failed to save location to API (${response.status})`);
    }
  }

  /**
   * Save location to localStorage
   * @param {Object} locationData - Location data to save
   * @returns {Object} Location data with ID
   */
  static saveToLocalStorage(locationData) {
    try {
      const currentLocations = StateManager.getSavedLocations();
      
      // Add unique ID for localStorage
      const locationWithId = {
        ...locationData,
        id: Date.now().toString(),
        local: true
      };
      
      const updatedLocations = [...currentLocations, locationWithId];
      localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));
      
      return locationWithId;
      
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('Failed to save location locally');
    }
  }

  /**
   * Delete a saved location
   * @param {string} placeId - Place ID to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteLocation(placeId) {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    try {
      if (StateManager.isAuthenticated()) {
        // Delete from API
        await this.deleteFromAPI(placeId);
      } else {
        // Delete from localStorage
        this.deleteFromLocalStorage(placeId);
      }

      // Remove from local state
      StateManager.removeSavedLocation(placeId);
      
      // Dispatch success event
      this.dispatchLocationsEvent('location-deleted', { placeId });
      
      return true;
      
    } catch (error) {
      console.error('Error deleting location:', error);
      
      // Dispatch error event
      this.dispatchLocationsEvent('delete-error', { 
        error,
        placeId 
      });
      
      throw error;
    }
  }

  /**
   * Delete location from API
   * @param {string} placeId - Place ID to delete
   */
  static async deleteFromAPI(placeId) {
    const authState = StateManager.getAuthState();
    const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authState.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete location from API');
    }
  }

  /**
   * Delete location from localStorage
   * @param {string} placeId - Place ID to delete
   */
  static deleteFromLocalStorage(placeId) {
    try {
      const currentLocations = StateManager.getSavedLocations();
      const updatedLocations = currentLocations.filter(loc => loc.place_id !== placeId);
      
      localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));
      
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
      throw new Error('Failed to delete location locally');
    }
  }

  /**
   * Check if a location is already saved
   * @param {string} placeId - Place ID to check
   * @returns {boolean} True if location is saved
   */
  static isLocationSaved(placeId) {
    return StateManager.isLocationSaved(placeId);
  }

  /**
   * Get all saved locations
   * @returns {Array} Array of saved locations
   */
  static getAllSavedLocations() {
    return StateManager.getSavedLocations();
  }

  /**
   * Get a specific saved location
   * @param {string} placeId - Place ID to find
   * @returns {Object|null} Found location or null
   */
  static getSavedLocation(placeId) {
    const locations = StateManager.getSavedLocations();
    return locations.find(loc => loc.place_id === placeId) || null;
  }

  /**
   * Search saved locations
   * @param {string} query - Search query
   * @returns {Array} Filtered locations
   */
  static searchSavedLocations(query) {
    if (!query || query.trim().length === 0) {
      return this.getAllSavedLocations();
    }

    const searchTerm = query.toLowerCase().trim();
    const locations = StateManager.getSavedLocations();
    
    return locations.filter(location => {
      return (
        location.name.toLowerCase().includes(searchTerm) ||
        location.formatted_address.toLowerCase().includes(searchTerm) ||
        (location.types && location.types.some(type => 
          type.toLowerCase().replace(/_/g, ' ').includes(searchTerm)
        ))
      );
    });
  }

  /**
   * Export saved locations to JSON file
   * @returns {string} JSON string of locations
   */
  static exportLocations() {
    const locations = StateManager.getSavedLocations();
    const exportData = {
      exported_at: new Date().toISOString(),
      total_locations: locations.length,
      locations: locations.map(loc => ({
        ...loc,
        // Remove API-specific fields for portability
        id: undefined,
        user_id: undefined,
        created_at: undefined,
        updated_at: undefined
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import locations from JSON data
   * @param {string} jsonData - JSON string of locations
   * @returns {Promise<number>} Number of locations imported
   */
  static async importLocations(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.locations || !Array.isArray(importData.locations)) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;
      
      for (const locationData of importData.locations) {
        if (locationData.place_id && !this.isLocationSaved(locationData.place_id)) {
          try {
            await this.saveLocation(locationData);
            importedCount++;
          } catch (error) {
            console.warn(`Failed to import location ${locationData.name}:`, error);
          }
        }
      }

      // Dispatch import complete event
      this.dispatchLocationsEvent('locations-imported', { 
        importedCount,
        totalCount: importData.locations.length 
      });

      return importedCount;
      
    } catch (error) {
      console.error('Error importing locations:', error);
      throw new Error('Failed to import locations: Invalid data format');
    }
  }

  /**
   * Clear all saved locations
   * @returns {Promise<boolean>} Success status
   */
  static async clearAllLocations() {
    try {
      console.log('🗑️ Clearing all locations from all sources...');
      
      if (StateManager.isAuthenticated()) {
        // Clear from API
        const authState = StateManager.getAuthState();
        const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/clear`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authState.authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to clear locations from API');
        }
        console.log('✅ Cleared locations from API');
      }

      // Force clear from localStorage
      localStorage.removeItem('savedLocations');
      console.log('✅ Cleared savedLocations from localStorage');
      
      // Clear from state
      StateManager.setSavedLocations([]);
      console.log('✅ Cleared locations from StateManager');
      
      // Dispatch event
      this.dispatchLocationsEvent('locations-cleared');
      
      return true;
      
    } catch (error) {
      console.error('Error clearing locations:', error);
      throw error;
    }
  }

  /**
   * Force clear localStorage and reload (debug method)
   * This method clears any orphaned localStorage data
   */
  static async forceResetLocations() {
    console.log('🔄 Force resetting all location data...');
    
    // Force clear localStorage regardless of authentication
    localStorage.removeItem('savedLocations');
    console.log('✅ Force cleared localStorage');
    
    // Clear state
    StateManager.setSavedLocations([]);
    
    // Reload from API
    await this.loadSavedLocations();
    
    console.log('✅ Force reset complete');
  }

  /**
   * Dispatch custom locations events
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchLocationsEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Get locations statistics
   * @returns {Object} Statistics object
   */
  static getLocationStats() {
    const locations = StateManager.getSavedLocations();
    
    return {
      total: locations.length,
      withRatings: locations.filter(loc => loc.rating).length,
      averageRating: locations.length > 0 ? 
        locations.filter(loc => loc.rating)
          .reduce((sum, loc) => sum + loc.rating, 0) / 
        locations.filter(loc => loc.rating).length : 0,
      topTypes: this.getTopLocationTypes(),
      oldestSave: locations.length > 0 ? 
        Math.min(...locations.map(loc => new Date(loc.saved_at || 0))) : null,
      newestSave: locations.length > 0 ? 
        Math.max(...locations.map(loc => new Date(loc.saved_at || 0))) : null
    };
  }

  /**
   * Get top location types
   * @returns {Array} Array of type counts
   */
  static getTopLocationTypes() {
    const locations = StateManager.getSavedLocations();
    const typeCounts = {};
    
    locations.forEach(location => {
      if (location.types) {
        location.types.forEach(type => {
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
      }
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type: type.replace(/_/g, ' '), count }));
  }
  
  // DISABLED: Popular locations functionality
  
  /*
   * DISABLED: Load popular locations from server
   * @returns {Promise<Array>} Array of popular locations
   */
  /*
  static async loadPopularLocations() {
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/popular`);
      
      if (response.ok) {
        const popularLocations = await response.json();
        console.log('✅ Popular locations loaded:', popularLocations.length);
        return popularLocations;
      } else {
        console.warn('Failed to load popular locations:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error loading popular locations:', error);
      return [];
    }
  }
  */
  
  /*
   * DISABLED: Popular locations functionality
   * 
   * Load popular locations from server
   * @returns {Promise<Array>} Array of popular locations
   */
  /*
  static async loadPopularLocations() {
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/popular`);
      if (response.ok) {
        const popularLocations = await response.json();
        console.log('✅ Popular locations loaded:', popularLocations.length);
        return popularLocations;
      } else {
        console.warn('Failed to load popular locations:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error loading popular locations:', error);
      return [];
    }
  }
  */
  
  /*
   * DISABLED: Add popular locations section to sidebar
   * This is the missing function from the original script.js
   */
  /*
  static async addPopularLocationsSection() {
    try {
      const popularLocations = await this.loadPopularLocations();
      
      if (popularLocations.length > 0) {
        const sidebar = document.querySelector('.sidebar');
        const popularSection = document.createElement('div');
        popularSection.className = 'popular-locations-section';
        popularSection.innerHTML = `
          <div class="popular-locations-header">
            <h4>Popular Locations</h4>
            <small>${popularLocations.length} locations saved by multiple users</small>
          </div>
          <div class="popular-locations-list">
            ${popularLocations.map(location => `
              <div class="popular-location-item" onclick="goToPopularLocation('${location.place_id}', ${location.lat}, ${location.lng})">
                <div class="popular-location-name">${location.name}</div>
                <div class="popular-location-stats">
                  <span class="save-count">${location.saved_count} saves</span>
                  ${location.rating ? `<span class="rating">★ ${location.rating}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Insert before the sidebar actions
        const sidebarActions = document.querySelector('.sidebar-actions');
        if (sidebarActions && sidebar) {
          sidebar.insertBefore(popularSection, sidebarActions);
        } else if (sidebar) {
          sidebar.appendChild(popularSection);
        }
        
        console.log('✅ Popular locations section added to sidebar');
      }
    } catch (error) {
      console.error('Error adding popular locations section:', error);
    }
  }
  */

  /**
   * Load locations with creator information
   * @returns {Promise<Array>} Array of locations with creator data
   */
  static async loadLocationsWithCreators() {
    console.log('📍 Loading locations with creator information...');
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/with-creators`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const locations = result.data || [];
      
      console.log('✅ Loaded locations with creators:', locations.length);
      
      // Update state
      StateManager.updateLocationsState({ allLocations: locations });
      
      return locations;
      
    } catch (error) {
      console.error('Error loading locations with creators:', error);
      throw error;
    }
  }

  /**
   * Get location by place ID
   * @param {string} placeId - Place ID
   * @returns {Promise<Object|null>} Location data or null
   */
  static async getLocationByPlaceId(placeId) {
    console.log('📍 Getting location by place ID:', placeId);
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/locations/${placeId}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
      
    } catch (error) {
      console.error('Error getting location by place ID:', error);
      throw error;
    }
  }

  /**
   * Update a location
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
   * Delete a location
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

}

// Export individual functions for backward compatibility
export const loadSavedLocations = LocationsService.loadSavedLocations.bind(LocationsService);
export const saveLocation = LocationsService.saveLocation.bind(LocationsService);
export const deleteLocation = LocationsService.deleteLocation.bind(LocationsService);
export const isLocationSaved = LocationsService.isLocationSaved.bind(LocationsService);
export const getAllSavedLocations = LocationsService.getAllSavedLocations.bind(LocationsService);
export const searchSavedLocations = LocationsService.searchSavedLocations.bind(LocationsService);
export const exportLocations = LocationsService.exportLocations.bind(LocationsService);
export const importLocations = LocationsService.importLocations.bind(LocationsService);
export const clearAllLocations = LocationsService.clearAllLocations.bind(LocationsService);
export const loadLocationsWithCreators = LocationsService.loadLocationsWithCreators.bind(LocationsService);
export const getLocationByPlaceId = LocationsService.getLocationByPlaceId.bind(LocationsService);
export const updateLocation = LocationsService.updateLocation.bind(LocationsService);
export const deleteLocationByPlaceId = LocationsService.deleteLocationByPlaceId.bind(LocationsService);
export const canUserEditLocation = LocationsService.canUserEditLocation.bind(LocationsService);
// DISABLED: export const loadPopularLocations = LocationsService.loadPopularLocations.bind(LocationsService);
// DISABLED: export const addPopularLocationsSection = LocationsService.addPopularLocationsSection.bind(LocationsService);