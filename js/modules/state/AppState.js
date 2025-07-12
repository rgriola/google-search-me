/**
 * Centralized application state management
 * Contains all global variables and state used throughout the application
 */

export const AppState = {
  //=====================================================================
  // AUTHENTICATION STATE
  //=====================================================================
  
  /** @type {Object|null} Current logged-in user data */
  currentUser: null,
  
  /** @type {string|null} JWT token for API authentication */
  authToken: null,
  
  /** @type {string|null} User ID for backward compatibility with legacy system */
  currentUserId: null,

  //=====================================================================
  // GOOGLE MAPS STATE
  //=====================================================================
  
  /** @type {google.maps.Map|null} Main Google Maps instance */
  map: null,
  
  /** @type {google.maps.places.PlacesService|null} Google Places service for location details */
  placesService: null,
  
  /** @type {google.maps.places.AutocompleteService|null} Google Autocomplete service for search suggestions */
  autocompleteService: null,
  
  /** @type {google.maps.Marker[]} Array to store all map markers */
  markers: [],
  
  /** @type {google.maps.InfoWindow|null} Info window for displaying place details */
  infoWindow: null,

  //=====================================================================
  // APPLICATION DATA STATE
  //=====================================================================
  
  /** @type {Array} User's saved locations from database */
  savedLocations: [],
  
  /** @type {Object|null} Currently selected place for saving/viewing */
  currentPlace: null,
  
  /** @type {string} Backend API base URL */
  API_BASE_URL: 'http://localhost:3000/api',

  //API_BASE_URL: 'https://google-search-me.onrender.com/api',

  //=====================================================================
  // UI STATE
  //=====================================================================
  
  /** @type {Array} Current search suggestions for autocomplete */
  currentSuggestions: [],
  
  /** @type {number} Currently selected suggestion index for keyboard navigation */
  selectedSuggestionIndex: -1
};

/**
 * State management utilities for controlled access to application state
 */
export const StateManager = {
  /**
   * Get current authentication state
   * @returns {Object} Authentication state object
   */
  getAuthState() {
    return {
      currentUser: AppState.currentUser,
      authToken: AppState.authToken,
      currentUserId: AppState.currentUserId
    };
  },

  /**
   * Update authentication state
   * @param {Object} authData - Authentication data
   * @param {Object|null} authData.user - User object
   * @param {string|null} authData.token - JWT token
   * @param {string|null} authData.userId - User ID
   */
  setAuthState({ user = null, token = null, userId = null } = {}) {
    AppState.currentUser = user;
    AppState.authToken = token;
    AppState.currentUserId = userId;
  },

  /**
   * Clear all authentication state (logout)
   */
  clearAuthState() {
    AppState.currentUser = null;
    AppState.authToken = null;
    AppState.currentUserId = null;
  },

  /**
   * Get Google Maps state
   * @returns {Object} Maps state object
   */
  getMapsState() {
    return {
      map: AppState.map,
      placesService: AppState.placesService,
      autocompleteService: AppState.autocompleteService,
      markers: AppState.markers,
      infoWindow: AppState.infoWindow
    };
  },

  /**
   * Set Google Maps instances
   * @param {Object} mapsData - Maps instances
   */
  setMapsState({ map, placesService, autocompleteService, infoWindow } = {}) {
    if (map) AppState.map = map;
    if (placesService) AppState.placesService = placesService;
    if (autocompleteService) AppState.autocompleteService = autocompleteService;
    if (infoWindow) AppState.infoWindow = infoWindow;
  },

  /**
   * Add marker to markers array
   * @param {google.maps.Marker} marker - Marker to add
   */
  addMarker(marker) {
    AppState.markers.push(marker);
  },

  /**
   * Clear all markers from map and state
   */
  clearMarkers() {
    AppState.markers.forEach(marker => marker.setMap(null));
    AppState.markers = [];
  },

  /**
   * Get current saved locations
   * @returns {Array} Array of saved locations
   */
  getSavedLocations() {
    return AppState.savedLocations;
  },

  /**
   * Set saved locations array
   * @param {Array} locations - Array of location objects
   */
  setSavedLocations(locations) {
    AppState.savedLocations = Array.isArray(locations) ? locations : [];
  },

  /**
   * Add a location to saved locations
   * @param {Object} location - Location object to add
   */
  addSavedLocation(location) {
    if (location && !AppState.savedLocations.find(loc => loc.place_id === location.place_id)) {
      AppState.savedLocations.push(location);
    }
  },

  /**
   * Remove a location from saved locations
   * @param {string} placeId - Place ID of location to remove
   */
  removeSavedLocation(placeId) {
    AppState.savedLocations = AppState.savedLocations.filter(loc => loc.place_id !== placeId);
  },

  /**
   * Get current place
   * @returns {Object|null} Current place object
   */
  getCurrentPlace() {
    return AppState.currentPlace;
  },

  /**
   * Set current place
   * @param {Object|null} place - Place object
   */
  setCurrentPlace(place) {
    AppState.currentPlace = place;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  isAuthenticated() {
    return !!(AppState.authToken && AppState.currentUser);
  },

  /**
   * Check if current place is already saved
   * @param {string} placeId - Place ID to check
   * @returns {boolean} True if place is saved
   */
  isLocationSaved(placeId) {
    return AppState.savedLocations.some(loc => loc.place_id === placeId);
  },

  /**
   * Get API base URL
   * @returns {string} API base URL
   */
  getApiBaseUrl() {
    return AppState.API_BASE_URL;
  },

  /**
   * Set API base URL
   * @param {string} url - New API base URL
   */
  setApiBaseUrl(url) {
    AppState.API_BASE_URL = url;
  }
};

/**
 * Development utilities for debugging state
 */
export const StateDebug = {
  /**
   * Log current application state to console
   */
  logState() {
    console.group('🔍 Application State Debug');
    console.log('Auth State:', StateManager.getAuthState());
    console.log('Maps State:', StateManager.getMapsState());
    console.log('Saved Locations:', StateManager.getSavedLocations());
    console.log('Current Place:', StateManager.getCurrentPlace());
    console.log('API Base URL:', StateManager.getApiBaseUrl());
    console.groupEnd();
  },

  /**
   * Get state summary for debugging
   * @returns {Object} State summary object
   */
  getStateSummary() {
    return {
      isAuthenticated: StateManager.isAuthenticated(),
      userName: AppState.currentUser?.username || 'Not logged in',
      savedLocationsCount: AppState.savedLocations.length,
      currentPlace: AppState.currentPlace?.name || 'None selected',
      markersCount: AppState.markers.length,
      mapsInitialized: !!(AppState.map && AppState.placesService)
    };
  }
};

// Make state available globally for debugging (development only)
if (typeof window !== 'undefined') {
  window.AppState = AppState;
  window.StateManager = StateManager;
  window.StateDebug = StateDebug;
}