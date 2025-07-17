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
