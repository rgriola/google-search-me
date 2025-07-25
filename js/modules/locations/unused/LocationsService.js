/**
 * Main Locations Service
 * Coordinates between specialized location services
 */

import { StateManager } from '../state/AppState.js';
import { LocationsAPIService } from './LocationsAPIService.js';
import { LocationsStorageService } from './LocationsStorageService.js';
import { LocationsDataService } from './LocationsDataService.js';
import { LocationsImportExportService } from './LocationsImportExportService.js';

/**
 * Main Locations Service Class
 * Acts as a coordinator between specialized services
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
      
      // Migrate localStorage format if needed
      LocationsStorageService.migrateLocalStorageFormat();
      
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
   * @returns {Promise<Array>} Array of all saved locations
   */
  static async loadSavedLocations() {
    console.log('📍 Loading all saved locations from database...');
    
    // DEBUG: Check localStorage before API call
    const localStorageData = localStorage.getItem('savedLocations');
    console.log('🔍 DEBUG: localStorage before API call:', localStorageData ? JSON.parse(localStorageData).length + ' items' : 'null');

    try {
      return await LocationsAPIService.loadSavedLocations();
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
    return LocationsStorageService.loadFromLocalStorage();
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

      console.log('🔍 DEBUG: Extracted coordinates:', { lat, lng });

      // Build location data in format expected by server API
      const locationData = {
        // Required fields for server validation
        place_id: place.place_id,
        placeId: place.place_id, // Include both formats for compatibility
        name: place.name || 'Unnamed Location',
        lat: lat, // Flat structure as server expects
        lng: lng, // Flat structure as server expects
        
        // Server validation expects specific type values or empty
        type: place.type && ['Live Reporter', 'Live Anchor', 'Live Stakeout', 'Live Presser', 'Interview'].includes(place.type) 
          ? place.type 
          : '', // Use empty string for invalid/missing types
        
        // Required server fields (can be empty strings)
        entry_point: place.entry_point || '',
        parking: place.parking || '',
        access: place.access || '',
        
        // Address fields - use both formatted address and parsed components
        address: place.formatted_address || place.vicinity || place.address || '',
        street: place.street || '',
        number: place.number || '',
        city: place.city || '',
        state: place.state || '',
        zipcode: place.zipcode || '',
        
        // Additional fields for compatibility
        description: place.description || '',
        notes: place.notes || '',
        photo_url: place.photo_url || '',
        types: place.types || '',
        
        // Metadata
        category: place.category || 'general',
        saved_at: new Date().toISOString(),
        
        // Optional Google Places data (for frontend use)
        rating: place.rating || null,
        photos: place.photos ? place.photos.map(photo => ({
          photo_reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) : []
      };

      console.log('🔍 DEBUG: Prepared location data for saving:', locationData);
      
      // Validate the data
      const validation = LocationsDataService.validateLocationData(locationData);
      if (!validation.isValid) {
        throw new Error(`Invalid location data: ${validation.errors.join(', ')}`);
      }

      // Try to save to API first if authenticated, otherwise save to localStorage
      if (StateManager.isAuthenticated()) {
        console.log('🔑 User is authenticated, saving to API...');
        const result = await LocationsAPIService.saveToAPI(locationData);
        
        // Dispatch success event
        this.dispatchLocationsEvent('location-saved', { 
          location: result.location,
          place 
        });
        
        return result;
      } else {
        console.log('👤 User not authenticated, saving to localStorage...');
        const result = LocationsStorageService.saveToLocalStorage(locationData);
        
        // Dispatch success event
        this.dispatchLocationsEvent('location-saved', { 
          location: result.location,
          place 
        });
        
        return result;
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
   * Delete a location
   * @param {string} placeId - Place ID
   * @returns {Promise<Object>} Delete result
   */
  static async deleteLocation(placeId) {
    console.log('🗑️ Deleting location:', placeId);
    
    try {
      if (StateManager.isAuthenticated()) {
        console.log('🔑 User is authenticated, deleting from API...');
        const result = await LocationsAPIService.deleteFromAPI(placeId);
        
        // Dispatch success event
        this.dispatchLocationsEvent('location-deleted', { placeId });
        
        return result;
      } else {
        console.log('👤 User not authenticated, deleting from localStorage...');
        const result = LocationsStorageService.deleteFromLocalStorage(placeId);
        
        // Dispatch success event
        this.dispatchLocationsEvent('location-deleted', { placeId });
        
        return result;
      }
    } catch (error) {
      console.error('❌ Error deleting location:', error);
      
      // Dispatch error event
      this.dispatchLocationsEvent('delete-error', { error, placeId });
      
      throw error;
    }
  }

  // Delegate data operations to LocationsDataService
  static isLocationSaved(placeId) {
    return LocationsDataService.isLocationSaved(placeId);
  }

  static getAllSavedLocations() {
    return LocationsDataService.getAllSavedLocations();
  }

  static getSavedLocation(placeId) {
    return LocationsDataService.getSavedLocation(placeId);
  }

  static searchSavedLocations(query) {
    return LocationsDataService.searchSavedLocations(query);
  }

  static getLocationCount() {
    return LocationsDataService.getLocationCount();
  }

  static getLocationStats() {
    return LocationsDataService.getLocationStatistics();
  }

  // Delegate import/export operations to LocationsImportExportService
  static exportLocations() {
    return LocationsImportExportService.exportLocations();
  }

  static async importLocations(jsonData) {
    return await LocationsImportExportService.importLocations(jsonData);
  }

  // Delegate API operations to LocationsAPIService
  static async loadLocationsWithCreators() {
    return await LocationsAPIService.loadLocationsWithCreators();
  }

  static async getLocationByPlaceId(placeId) {
    return await LocationsAPIService.getLocationByPlaceId(placeId);
  }

  static async updateLocation(placeId, updates) {
    return await LocationsAPIService.updateLocation(placeId, updates);
  }

  static async deleteLocationByPlaceId(placeId) {
    return await LocationsAPIService.deleteLocationByPlaceId(placeId);
  }

  static async canUserEditLocation(placeId) {
    return await LocationsAPIService.canUserEditLocation(placeId);
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
export const loadSavedLocations = LocationsService.loadSavedLocations.bind(LocationsService);
export const saveLocation = LocationsService.saveLocation.bind(LocationsService);
export const deleteLocation = LocationsService.deleteLocation.bind(LocationsService);
export const isLocationSaved = LocationsService.isLocationSaved.bind(LocationsService);
export const getAllSavedLocations = LocationsService.getAllSavedLocations.bind(LocationsService);
export const searchSavedLocations = LocationsService.searchSavedLocations.bind(LocationsService);
export const exportLocations = LocationsService.exportLocations.bind(LocationsService);
export const importLocations = LocationsService.importLocations.bind(LocationsService);
export const loadLocationsWithCreators = LocationsService.loadLocationsWithCreators.bind(LocationsService);
export const getLocationByPlaceId = LocationsService.getLocationByPlaceId.bind(LocationsService);
export const updateLocation = LocationsService.updateLocation.bind(LocationsService);
export const deleteLocationByPlaceId = LocationsService.deleteLocationByPlaceId.bind(LocationsService);
export const canUserEditLocation = LocationsService.canUserEditLocation.bind(LocationsService);
export const getLocationCount = LocationsService.getLocationCount.bind(LocationsService);
export const getLocationStats = LocationsService.getLocationStats.bind(LocationsService);
