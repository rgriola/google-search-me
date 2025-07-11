/**
 * Google Maps service management
 * Handles map initialization and core map functionality
 */

import { StateManager } from '../state/AppState.js';

/**
 * Map Service Class
 */
export class MapService {

  /**
   * Initialize Google Maps with default settings
   * @param {string} containerId - ID of the map container element
   * @param {Object} options - Map initialization options
   * @returns {Promise<google.maps.Map>} Initialized map instance
   */
  static async initialize(containerId = 'map', options = {}) {
    console.log('🗺️ Initializing Map Service');

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Map container with ID '${containerId}' not found`);
    }

    // Default map options
    const defaultOptions = {
      zoom: 13,
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: [] // Add custom styles if needed
    };

    // Merge with provided options
    const mapOptions = { ...defaultOptions, ...options };

    try {
      // Create the map instance
      const map = new google.maps.Map(container, mapOptions);

      // Initialize Google Maps services
      const placesService = new google.maps.places.PlacesService(map);
      const autocompleteService = new google.maps.places.AutocompleteService();
      const infoWindow = new google.maps.InfoWindow({
        maxWidth: 300
      });

      // Store all Maps instances in centralized state
      StateManager.setMapsState({
        map,
        placesService,
        autocompleteService,
        infoWindow
      });

      console.log('✅ Map Service initialized');
      return map;

    } catch (error) {
      console.error('Error initializing map:', error);
      throw error;
    }
  }

  /**
   * Get current map instance
   * @returns {google.maps.Map|null} Current map instance
   */
  static getMap() {
    return StateManager.getMapsState().map;
  }

  /**
   * Get places service instance
   * @returns {google.maps.places.PlacesService|null} Places service instance
   */
  static getPlacesService() {
    return StateManager.getMapsState().placesService;
  }

  /**
   * Get autocomplete service instance
   * @returns {google.maps.places.AutocompleteService|null} Autocomplete service instance
   */
  static getAutocompleteService() {
    return StateManager.getMapsState().autocompleteService;
  }

  /**
   * Get info window instance
   * @returns {google.maps.InfoWindow|null} Info window instance
   */
  static getInfoWindow() {
    return StateManager.getMapsState().infoWindow;
  }

  /**
   * Center map on specific coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Optional zoom level
   */
  static centerMap(lat, lng, zoom = null) {
    const map = this.getMap();
    if (!map) return;

    const position = new google.maps.LatLng(lat, lng);
    map.setCenter(position);
    
    if (zoom !== null) {
      map.setZoom(zoom);
    }
  }

  /**
   * Fit map bounds to include all markers
   */
  static fitBoundsToMarkers() {
    const map = this.getMap();
    const markers = StateManager.getMapsState().markers;
    
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
      if (marker.getPosition()) {
        bounds.extend(marker.getPosition());
      }
    });

    map.fitBounds(bounds);
  }

  /**
   * Get user's current location
   * @returns {Promise<{lat: number, lng: number}>} User's coordinates
   */
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Center map on user's current location
   * @param {number} zoom - Zoom level
   */
  static async centerOnUserLocation(zoom = 15) {
    try {
      const position = await this.getCurrentLocation();
      this.centerMap(position.lat, position.lng, zoom);
      return position;
    } catch (error) {
      console.error('Error getting user location:', error);
      throw error;
    }
  }

  /**
   * Add click listener to map
   * @param {Function} callback - Function to call on map click
   */
  static addClickListener(callback) {
    const map = this.getMap();
    if (!map) return;

    map.addListener('click', callback);
  }

  /**
   * Remove all map listeners
   */
  static clearAllListeners() {
    const map = this.getMap();
    if (!map) return;

    google.maps.event.clearListeners(map, 'click');
  }

  /**
   * Get map bounds
   * @returns {google.maps.LatLngBounds|null} Current map bounds
   */
  static getMapBounds() {
    const map = this.getMap();
    if (!map) return null;

    return map.getBounds();
  }

  /**
   * Set map zoom level
   * @param {number} zoom - Zoom level (1-20)
   */
  static setZoom(zoom) {
    const map = this.getMap();
    if (!map) return;

    map.setZoom(Math.max(1, Math.min(20, zoom)));
  }

  /**
   * Get current map zoom level
   * @returns {number|null} Current zoom level
   */
  static getZoom() {
    const map = this.getMap();
    if (!map) return null;

    return map.getZoom();
  }

  /**
   * Check if map is initialized
   * @returns {boolean} True if map is ready
   */
  static isInitialized() {
    const mapState = StateManager.getMapsState();
    return !!(mapState.map && mapState.placesService && mapState.autocompleteService);
  }

  /**
   * Destroy map instance and clean up
   */
  static destroy() {
    this.clearAllListeners();
    
    // Clear state
    StateManager.setMapsState({
      map: null,
      placesService: null,
      autocompleteService: null,
      infoWindow: null
    });

    console.log('🗺️ Map Service destroyed');
  }
}

// Export individual functions for backward compatibility
export const initializeMap = MapService.initialize.bind(MapService);
export const getMap = MapService.getMap.bind(MapService);
export const getPlacesService = MapService.getPlacesService.bind(MapService);
export const getAutocompleteService = MapService.getAutocompleteService.bind(MapService);
export const centerMap = MapService.centerMap.bind(MapService);
export const getCurrentLocation = MapService.getCurrentLocation.bind(MapService);
export const centerOnUserLocation = MapService.centerOnUserLocation.bind(MapService);
export const fitBoundsToMarkers = MapService.fitBoundsToMarkers.bind(MapService);
export const isMapInitialized = MapService.isInitialized.bind(MapService);