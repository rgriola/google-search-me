/**
 * Google Maps search functionality
 * Handles place predictions, search queries, and place details
 */

import { StateManager } from '../state/AppState.js';
import { MapService } from './MapService.js';

/**
 * Search Service Class
 */
export class SearchService {

  /**
   * Initialize search service
   */
  static async initialize() {
    console.log('🔍 Initializing Search Service');
    
    // Test Google Maps API after a brief delay to ensure it's ready
    setTimeout(async () => {
      const apiWorking = await this.testGoogleMapsAPI();
      if (!apiWorking) {
        console.error('❌ Google Maps API test failed during SearchService initialization');
      }
    }, 1000);
    
    console.log('✅ Search Service initialized');
  }

  /**
   * Get place predictions for autocomplete
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of place predictions
   */
  static async getPlacePredictions(query, options = {}) {
    console.log('🔍 SearchService getPlacePredictions called with query:', query);
    
    // Check if Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.error('❌ Google Maps API not loaded');
      throw new Error('Google Maps API not loaded');
    }

    const autocompleteService = MapService.getAutocompleteService();
    console.log('🔍 SearchService autocompleteService:', autocompleteService);
    
    if (!autocompleteService) {
      throw new Error('Autocomplete service not available');
    }

    // Use legacy API request format
    const request = {
      input: query,
      types: ['(cities)'], // Legacy format - try cities first
      // Remove radius and location for now - these can cause issues
    };

    console.log('🔍 SearchService calling legacy autocompleteService.getPlacePredictions with request:', request);

    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('🔍 SearchService: API call timed out after 5 seconds');
        reject(new Error('Google Maps API call timed out'));
      }, 5000);

      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        clearTimeout(timeoutId);
        console.log('🔍 SearchService received predictions:', predictions, 'status:', status);
        
        // Use legacy status constants
        if (status === 'OK') {
          console.log('✅ Predictions successful:', predictions?.length || 0, 'results');
          resolve(predictions || []);
        } else if (status === 'ZERO_RESULTS') {
          console.log("ℹ️ No predictions found for query:", query);
          resolve([]);
        } else {
          console.error("❌ Places API error:", status);
          // Try to continue anyway for some status codes
          if (status === 'INVALID_REQUEST' || status === 'REQUEST_DENIED') {
            reject(new Error(`Places API error: ${status}`));
          } else {
            // For other errors, return empty array
            console.warn("⚠️ Continuing with empty results for status:", status);
            resolve([]);
          }
        }
      });
    });
  }

  /**
   * Get detailed information about a place
   * @param {string} placeId - Google Places ID
   * @param {Array} fields - Fields to retrieve
   * @returns {Promise<Object>} Place details
   */
  static async getPlaceDetails(placeId, fields = []) {
    const placesService = MapService.getPlacesService();
    if (!placesService) {
      throw new Error('Places service not available');
    }

    const defaultFields = [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'user_ratings_total',
      'photos',
      'types',
      'vicinity',
      'website',
      'formatted_phone_number',
      'opening_hours',
      'price_level'
    ];

    const requestFields = fields.length > 0 ? fields : defaultFields;

    return new Promise((resolve, reject) => {
      placesService.getDetails({
        placeId: placeId,
        fields: requestFields
      }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(place);
        } else {
          reject(new Error(`Place details error: ${status}`));
        }
      });
    });
  }

  /**
   * Search for places by text query
   * @param {string} query - Text search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of places
   */
  static async searchPlacesByText(query, options = {}) {
    const placesService = MapService.getPlacesService();
    if (!placesService) {
      throw new Error('Places service not available');
    }

    const map = MapService.getMap();
    const defaultOptions = {
      query: query,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'rating',
        'photos',
        'types'
      ],
      locationBias: options.location ? 
        new google.maps.Circle({
          center: options.location,
          radius: options.radius || 50000
        }) : 
        map?.getBounds()
    };

    return new Promise((resolve, reject) => {
      placesService.textSearch(defaultOptions, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results || []);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Text search error: ${status}`));
        }
      });
    });
  }

  /**
   * Search for nearby places
   * @param {Object} location - {lat, lng} coordinates
   * @param {number} radius - Search radius in meters
   * @param {string} type - Place type to search for
   * @returns {Promise<Array>} Array of nearby places
   */
  static async searchNearbyPlaces(location, radius = 5000, type = null) {
    const placesService = MapService.getPlacesService();
    if (!placesService) {
      throw new Error('Places service not available');
    }

    const request = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius: radius,
      fields: [
        'place_id',
        'name',
        'vicinity',
        'geometry',
        'rating',
        'photos',
        'types'
      ]
    };

    if (type) {
      request.type = type;
    }

    return new Promise((resolve, reject) => {
      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results || []);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Nearby search error: ${status}`));
        }
      });
    });
  }

  /**
   * Geocode an address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<Object>} Geocoding result
   */
  static async geocodeAddress(address) {
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
          resolve(results[0]);
        } else {
          reject(new Error(`Geocoding error: ${status}`));
        }
      });
    });
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Reverse geocoding result
   */
  static async reverseGeocode(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latLng = new google.maps.LatLng(lat, lng);

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
          resolve(results[0]);
        } else {
          reject(new Error(`Reverse geocoding error: ${status}`));
        }
      });
    });
  }

  /**
   * Process a search query and return the best result
   * @param {string} query - Search query
   * @returns {Promise<Object>} Best search result
   */
  static async processSearchQuery(query) {
    try {
      // First, try to get place predictions
      const predictions = await this.getPlacePredictions(query);
      
      if (predictions.length > 0) {
        // Get details for the first prediction
        const placeDetails = await this.getPlaceDetails(predictions[0].place_id);
        return {
          type: 'place',
          place: placeDetails,
          prediction: predictions[0]
        };
      }

      // If no predictions, try text search
      const textResults = await this.searchPlacesByText(query);
      
      if (textResults.length > 0) {
        return {
          type: 'text_search',
          place: textResults[0],
          results: textResults
        };
      }

      // If no text results, try geocoding as last resort
      const geocodeResult = await this.geocodeAddress(query);
      return {
        type: 'geocode',
        place: geocodeResult,
        address: geocodeResult.formatted_address
      };

    } catch (error) {
      console.error('Search query processing error:', error);
      throw new Error(`Could not find results for "${query}"`);
    }
  }

  /**
   * Get popular places in a given area
   * @param {Object} location - {lat, lng} coordinates
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of popular places
   */
  static async getPopularPlaces(location, radius = 10000) {
    try {
      const popularTypes = ['tourist_attraction', 'restaurant', 'shopping_mall', 'park'];
      const allPlaces = [];

      for (const type of popularTypes) {
        try {
          const places = await this.searchNearbyPlaces(location, radius, type);
          allPlaces.push(...places.slice(0, 3)); // Top 3 of each type
        } catch (error) {
          console.warn(`Error searching for ${type}:`, error);
        }
      }

      // Sort by rating and remove duplicates
      const uniquePlaces = allPlaces.filter((place, index, self) => 
        index === self.findIndex(p => p.place_id === place.place_id)
      );

      return uniquePlaces
        .filter(place => place.rating && place.rating >= 4.0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);

    } catch (error) {
      console.error('Error getting popular places:', error);
      return [];
    }
  }

  /**
   * Test Google Maps API functionality
   * @returns {Promise<boolean>} True if API is working
   */
  static async testGoogleMapsAPI() {
    try {
      console.log('🔍 Testing Google Maps API...');
      
      if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.error('❌ Google Maps API not loaded');
        return false;
      }

      const autocompleteService = MapService.getAutocompleteService();
      if (!autocompleteService) {
        console.error('❌ Autocomplete service not available');
        return false;
      }

      // Test with a simple query using legacy format
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          console.error('❌ Google Maps API test timed out');
          resolve(false);
        }, 3000);

        const request = {
          input: 'New York',
          types: ['(cities)'] // Legacy format
        };

        autocompleteService.getPlacePredictions(request, (predictions, status) => {
          clearTimeout(timeoutId);
          console.log('🔍 API test result - status:', status, 'predictions:', predictions?.length || 0);
          
          // Use legacy status strings
          if (status === 'OK' || status === 'ZERO_RESULTS') {
            console.log('✅ Google Maps API is working');
            resolve(true);
          } else {
            console.error('❌ Google Maps API error:', status);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('❌ Google Maps API test failed:', error);
      return false;
    }
  }
}

// Export individual functions for backward compatibility
export const getPlacePredictions = SearchService.getPlacePredictions.bind(SearchService);
export const getPlaceDetails = SearchService.getPlaceDetails.bind(SearchService);
export const searchPlacesByText = SearchService.searchPlacesByText.bind(SearchService);
export const searchNearbyPlaces = SearchService.searchNearbyPlaces.bind(SearchService);
export const geocodeAddress = SearchService.geocodeAddress.bind(SearchService);
export const reverseGeocode = SearchService.reverseGeocode.bind(SearchService);
export const processSearchQuery = SearchService.processSearchQuery.bind(SearchService);
export const getPopularPlaces = SearchService.getPopularPlaces.bind(SearchService);
export const testGoogleMapsAPI = SearchService.testGoogleMapsAPI.bind(SearchService);

// Make the test function available globally for debugging
if (typeof window !== 'undefined') {
  window.testGoogleMapsAPI = SearchService.testGoogleMapsAPI.bind(SearchService);
  window.testAutocomplete = async (query = 'Syracuse') => {
    try {
      console.log('🔍 Manual test: Calling getPlacePredictions with:', query);
      const predictions = await SearchService.getPlacePredictions(query);
      console.log('✅ Manual test results:', predictions);
      return predictions;
    } catch (error) {
      console.error('❌ Manual test failed:', error);
      return null;
    }
  };
}