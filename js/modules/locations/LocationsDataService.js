/**
 * Locations Data Service
 * Handles data operations, validation, and search functionality
 */

import { StateManager } from '../state/AppState.js';

/**
 * Locations Data Service Class
 */
export class LocationsDataService {

  /**
   * Get all saved locations
   * @returns {Array} Array of all saved locations
   */
  static getAllSavedLocations() {
    return StateManager.getSavedLocations() || [];
  }

  /**
   * Get saved location by place ID
   * @param {string} placeId - Place ID to search for
   * @returns {Object|null} Location object or null if not found
   */
  static getSavedLocation(placeId) {
    const locations = this.getAllSavedLocations();
    return locations.find(location => location.place_id === placeId) || null;
  }

  /**
   * Check if a location is already saved
   * @param {string} placeId - Place ID to check
   * @returns {boolean} Whether the location is saved
   */
  static isLocationSaved(placeId) {
    return this.getSavedLocation(placeId) !== null;
  }

  /**
   * Search saved locations by query
   * @param {string} query - Search query
   * @returns {Array} Array of matching locations
   */
  static searchSavedLocations(query) {
    if (!query || query.trim() === '') {
      return this.getAllSavedLocations();
    }

    const searchTerm = query.toLowerCase().trim();
    const locations = this.getAllSavedLocations();

    return locations.filter(location => {
      // Search in multiple fields
      const searchableFields = [
        location.name,
        location.description,
        location.notes,
        location.address,
        location.category,
        location.type,
        location.creator_email,
        location.creator_name
      ];

      return searchableFields.some(field => 
        field && field.toLowerCase().includes(searchTerm)
      );
    });
  }

  /**
   * Filter locations by category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of filtered locations
   */
  static filterLocationsByCategory(category) {
    if (!category || category === 'all') {
      return this.getAllSavedLocations();
    }

    const locations = this.getAllSavedLocations();
    return locations.filter(location => 
      location.category && location.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Filter locations by type
   * @param {string} type - Type to filter by
   * @returns {Array} Array of filtered locations
   */
  static filterLocationsByType(type) {
    if (!type || type === 'all') {
      return this.getAllSavedLocations();
    }

    const locations = this.getAllSavedLocations();
    return locations.filter(location => 
      location.type && location.type.toLowerCase() === type.toLowerCase()
    );
  }

  /**
   * Get locations by creator
   * @param {string} creatorEmail - Creator email to filter by
   * @returns {Array} Array of locations created by the user
   */
  static getLocationsByCreator(creatorEmail) {
    if (!creatorEmail) {
      return [];
    }

    const locations = this.getAllSavedLocations();
    return locations.filter(location => 
      location.creator_email && location.creator_email.toLowerCase() === creatorEmail.toLowerCase()
    );
  }

  /**
   * Get recent locations (sorted by creation date)
   * @param {number} limit - Number of recent locations to return
   * @returns {Array} Array of recent locations
   */
  static getRecentLocations(limit = 10) {
    const locations = this.getAllSavedLocations();
    
    return locations
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA; // Most recent first
      })
      .slice(0, limit);
  }

  /**
   * Get locations within a geographic area
   * @param {Object} bounds - Geographic bounds {north, south, east, west}
   * @returns {Array} Array of locations within bounds
   */
  static getLocationsInBounds(bounds) {
    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return this.getAllSavedLocations();
    }

    const locations = this.getAllSavedLocations();
    
    return locations.filter(location => {
      if (!location.geometry || !location.geometry.location) {
        return false;
      }

      const lat = location.geometry.location.lat;
      const lng = location.geometry.location.lng;

      return lat >= bounds.south && 
             lat <= bounds.north && 
             lng >= bounds.west && 
             lng <= bounds.east;
    });
  }

  /**
   * Get unique categories from all locations
   * @returns {Array} Array of unique categories
   */
  static getUniqueCategories() {
    const locations = this.getAllSavedLocations();
    const categories = locations
      .map(location => location.category)
      .filter(category => category && category.trim() !== '')
      .map(category => category.trim());
    
    return [...new Set(categories)].sort();
  }

  /**
   * Get unique types from all locations
   * @returns {Array} Array of unique types
   */
  static getUniqueTypes() {
    const locations = this.getAllSavedLocations();
    const types = locations
      .map(location => location.type)
      .filter(type => type && type.trim() !== '')
      .map(type => type.trim());
    
    return [...new Set(types)].sort();
  }

  /**
   * Validate location data
   * @param {Object} locationData - Location data to validate
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  static validateLocationData(locationData) {
    const errors = [];

    if (!locationData) {
      errors.push('Location data is required');
      return { isValid: false, errors };
    }

    // Required fields
    if (!locationData.place_id) {
      errors.push('Place ID is required');
    }

    if (!locationData.name || locationData.name.trim() === '') {
      errors.push('Location name is required');
    }

    // Validate geometry if present
    if (locationData.geometry) {
      if (!locationData.geometry.location) {
        errors.push('Location geometry must include location coordinates');
      } else {
        const { lat, lng } = locationData.geometry.location;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          errors.push('Location coordinates must be valid numbers');
        }
        if (lat < -90 || lat > 90) {
          errors.push('Latitude must be between -90 and 90');
        }
        if (lng < -180 || lng > 180) {
          errors.push('Longitude must be between -180 and 180');
        }
      }
    }

    // Validate optional fields format
    if (locationData.rating && (typeof locationData.rating !== 'number' || locationData.rating < 0 || locationData.rating > 5)) {
      errors.push('Rating must be a number between 0 and 5');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get location statistics
   * @returns {Object} Statistics about saved locations
   */
  static getLocationStatistics() {
    const locations = this.getAllSavedLocations();
    
    if (locations.length === 0) {
      return {
        totalLocations: 0,
        categoriesCount: 0,
        typesCount: 0,
        averageRating: 0,
        creatorsCount: 0
      };
    }

    const categories = this.getUniqueCategories();
    const types = this.getUniqueTypes();
    const creators = [...new Set(locations.map(loc => loc.creator_email).filter(email => email))];
    
    const ratingsSum = locations
      .filter(loc => loc.rating && typeof loc.rating === 'number')
      .reduce((sum, loc) => sum + loc.rating, 0);
    const ratingsCount = locations.filter(loc => loc.rating && typeof loc.rating === 'number').length;
    
    return {
      totalLocations: locations.length,
      categoriesCount: categories.length,
      typesCount: types.length,
      averageRating: ratingsCount > 0 ? (ratingsSum / ratingsCount).toFixed(1) : 0,
      creatorsCount: creators.length,
      categories,
      types,
      creators
    };
  }

  /**
   * Sort locations by different criteria
   * @param {Array} locations - Locations to sort
   * @param {string} sortBy - Sort criteria ('name', 'created_at', 'rating', 'distance')
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {Array} Sorted locations
   */
  static sortLocations(locations, sortBy = 'name', order = 'asc') {
    const sortedLocations = [...locations];
    
    sortedLocations.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = (a.name || '').toLowerCase();
          valueB = (b.name || '').toLowerCase();
          break;
        case 'created_at':
          valueA = new Date(a.created_at || 0);
          valueB = new Date(b.created_at || 0);
          break;
        case 'updated_at':
          valueA = new Date(a.updated_at || a.created_at || 0);
          valueB = new Date(b.updated_at || b.created_at || 0);
          break;
        case 'rating':
          valueA = a.rating || 0;
          valueB = b.rating || 0;
          break;
        case 'category':
          valueA = (a.category || '').toLowerCase();
          valueB = (b.category || '').toLowerCase();
          break;
        case 'type':
          valueA = (a.type || '').toLowerCase();
          valueB = (b.type || '').toLowerCase();
          break;
        default:
          valueA = (a.name || '').toLowerCase();
          valueB = (b.name || '').toLowerCase();
      }
      
      if (valueA < valueB) {
        return order === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortedLocations;
  }

  /**
   * Get location count
   * @returns {number} Total number of saved locations
   */
  static getLocationCount() {
    return this.getAllSavedLocations().length;
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
export const getAllSavedLocations = LocationsDataService.getAllSavedLocations.bind(LocationsDataService);
export const getSavedLocation = LocationsDataService.getSavedLocation.bind(LocationsDataService);
export const isLocationSaved = LocationsDataService.isLocationSaved.bind(LocationsDataService);
export const searchSavedLocations = LocationsDataService.searchSavedLocations.bind(LocationsDataService);
export const getLocationCount = LocationsDataService.getLocationCount.bind(LocationsDataService);
