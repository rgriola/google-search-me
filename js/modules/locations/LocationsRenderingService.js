/**
 * Locations Rendering Service
 * Handles UI setup, DOM management, and location list rendering
 * Extracted from LocationsUI.js for Phase 3 refactoring
 */

import { StateManager } from '../state/AppState.js';
import { LocationsService } from './LocationsService.js';

/**
 * Locations Rendering Service Class
 * Responsible for UI initialization, DOM setup, and location list rendering
 */
export class LocationsRenderingService {

  /**
   * Initialize locations UI elements and basic setup
   */
  static initialize() {
    console.log('🎨 Initializing Locations Rendering Service');
    
    this.setupUIElements();
    this.createMissingElements();
    
    // Remove any existing popular locations sections
    this.removePopularLocationsSection();
    
    console.log('✅ Locations Rendering Service initialized');
  }

  /**
   * Setup UI DOM elements
   */
  static setupUIElements() {
    this.sidebar = document.querySelector('.sidebar');
    this.locationsList = document.getElementById('savedLocationsList');
   // this.statsContainer = document.getElementById('locationsStats');
    this.refreshButton = document.getElementById('refreshLocations');
    
    console.log('🔍 UI Elements found:', {
      sidebar: !!this.sidebar,
      locationsList: !!this.locationsList,
    //  statsContainer: !!this.statsContainer,
      refreshButton: !!this.refreshButton
    });
  }

  /**
   * Create missing UI elements if they don't exist
   */
  static createMissingElements() {
    // No longer creating stats container - removed location count feature
  }

  /**
   * Render saved locations list
   * @param {Array} locationsToRender - Optional filtered locations array
   */
  static renderLocations(locationsToRender = null) {
    if (!this.locationsList) {
      console.warn('❌ No locations list element found for rendering');
      return;
    }

    const locations = locationsToRender || LocationsService.getAllSavedLocations();
    console.log('🎨 Rendering locations in UI:', locations.length, 'locations');

    if (locations.length === 0) {
      this.renderEmptyState();
    } else {
      this.renderLocationsList(locations);
      }
  }

  /**
   * Render empty state when no locations are available
   */
  static renderEmptyState() {
    const isSearching = this.searchInput && this.searchInput.value.trim().length > 0;
    
    this.locationsList.innerHTML = `
      <div class="no-saved-locations">
        <div class="empty-icon">📍</div>
        <p>${isSearching ? 'No locations found' : 'No saved locations yet'}</p>
        <p class="hint">
          ${isSearching ? 
            'Try a different search term' : 
            'Search for a place and click "Save Location" to add it here'
          }
        </p>
      </div>
    `;
  }

  /**
   * Render locations list with all locations
   * @param {Array} locations - Locations to render
   */
  static renderLocationsList(locations) {
    const locationsHTML = locations.map(location => this.createLocationHTML(location)).join('');
    this.locationsList.innerHTML = locationsHTML;
  }

  /**
   * Create HTML for a single location with compact view
   * @param {Object} location - Location object
   * @returns {string} HTML string
   */
  static createLocationHTML(location) {
    // Ensure we have valid location data
    if (!location) {
      console.warn('⚠️ Attempted to render null/undefined location');
      return '';
    }

    const savedDate = location.saved_at ? 
      new Date(location.saved_at).toLocaleDateString() : '';
    
    const creatorInfo = location.creator_username || location.creator_email || 'Unknown User';
    const currentUser = StateManager.getAuthState().currentUser;
    const canEdit = currentUser && (
      currentUser.isAdmin || 
      location.created_by === currentUser.userId ||
      location.user_id === currentUser.userId
    );

    // Safely get location properties with fallbacks
    const placeId = location.place_id || '';
    const name = location.name || 'Unnamed Location';
    const address = location.address || location.formatted_address || 'No address available';
    const lat = location.lat || location.latitude || 0;
    const lng = location.lng || location.longitude || 0;

    // Compact view with basic info
    return `
      <div class="saved-location" data-place-id="${placeId}">
        <div class="location-content">
          <div class="location-info">
            <strong class="location-name">${name}</strong>
            <div class="location-address">${address}</div>
            <div class="location-meta">
              <span class="creator-info">👤 ${creatorInfo}</span>
              ${savedDate ? `<span class="saved-date">📅 ${savedDate}</span>` : ''}
            </div>
          </div>
          <div class="location-actions">
            <button class="view-location-btn" 
                    title="View details" 
                    data-place-id="${placeId}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </button>
            <button class="zoom-to-location-btn" 
                    title="Show on map" 
                    data-lat="${lat}"
                    data-lng="${lng}">
              📍
            </button>
            ${canEdit ? `
              <button class="edit-location-btn" 
                      title="Edit location" 
                      data-place-id="${placeId}">
                ✏️
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Highlight search terms in location names
   * @param {string} text - Text to highlight
   * @param {string} searchTerm - Search term to highlight
   * @returns {string} HTML with highlighted terms
   */
  static highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Refresh saved locations display
   * Useful for manual refresh or after login
   */
  static async refreshSavedLocations() {
    console.log('🔄 Refreshing saved locations display...');
    
    try {
      // Reload all locations from database (no auth required)
      await LocationsService.loadSavedLocations();
      
      // Re-render the locations
      this.renderLocations();
      
      console.log('✅ Saved locations refreshed');
      
      // Dispatch success event
      this.dispatchRenderingEvent('locations-refreshed', { success: true });
      
    } catch (error) {
      console.error('❌ Error refreshing saved locations:', error);
      
      // Dispatch error event
      this.dispatchRenderingEvent('locations-refresh-error', { 
        error: error.message 
      });
    }
  }

  /**
   * Remove any existing popular locations sections from the DOM
   */
  static removePopularLocationsSection() {
    const existingSection = document.querySelector('.popular-locations-section');
    if (existingSection) {
      existingSection.remove();
      console.log('✅ Popular locations section removed');
    }
  }

  /**
   * Dispatch custom rendering events
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchRenderingEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Get UI element references for external access
   * @returns {Object} UI elements object
   */
  static getUIElements() {
    return {
      sidebar: this.sidebar,
      locationsList: this.locationsList,
      refreshButton: this.refreshButton
    };
  }

  /**
   * Check if UI is ready for rendering
   * @returns {boolean} True if UI elements are available
   */
  static isUIReady() {
    return !!(this.sidebar && this.locationsList);
  }
}

// Export individual functions for backward compatibility
export const renderLocations = LocationsRenderingService.renderLocations.bind(LocationsRenderingService);
export const refreshSavedLocations = LocationsRenderingService.refreshSavedLocations.bind(LocationsRenderingService);
