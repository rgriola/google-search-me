/**
 * Saved locations UI management
 * Handles sidebar display, search, and location list rendering
 */

import { StateManager } from '../state/AppState.js';
import { LocationsService } from './LocationsService.js';

/**
 * Locations UI Class
 */
export class LocationsUI {

  /**
   * Initialize locations UI
   */
  static initialize() {
    console.log('🎨 Initializing Locations UI');
    
    this.setupUIElements();
    this.setupEventListeners();
    this.renderLocations();
    
    // Remove any existing popular locations sections
    this.removePopularLocationsSection();
    
    console.log('✅ Locations UI initialized');
  }

  /**
   * Setup UI DOM elements
   */
  static setupUIElements() {
    this.sidebar = document.querySelector('.sidebar');
    this.locationsList = document.getElementById('savedLocationsList');
    this.toggleButton = document.getElementById('toggleSidebar');
    this.statsContainer = document.getElementById('locationsStats');
    this.refreshButton = document.getElementById('refreshLocations');
    // No sidebar search input: do not create or reference it
  }

  /**
   * Create missing UI elements if they don't exist
   */
  static createMissingElements() {
    // Only create stats container if missing
    if (!this.statsContainer && this.sidebar) {
      const statsDiv = document.createElement('div');
      statsDiv.id = 'locationsStats';
      statsDiv.className = 'locations-stats';
      if (this.locationsList) {
        this.locationsList.before(statsDiv);
        this.statsContainer = statsDiv;
      }
    }
  }

  /**
   * Setup event listeners
   */
  static setupEventListeners() {
    // Sidebar toggle
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', this.toggleSidebar.bind(this));
    }

    // Refresh locations button
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', this.refreshSavedLocations.bind(this));
    }

    // No sidebar search input: do not attach search event listeners

    // Listen for locations events
    document.addEventListener('locations-loaded', () => {
      this.renderLocations();
      this.updateStats();
    });

    document.addEventListener('location-saved', (event) => {
      console.log('🎉 Location saved event received:', event.detail);
      this.renderLocations();
      this.updateStats();
    });

    document.addEventListener('location-deleted', () => {
      this.renderLocations();
      this.updateStats();
    });

    // Location item interactions
    document.addEventListener('click', this.handleLocationClick.bind(this));
  }

  /**
   * Render saved locations list
   * @param {Array} locationsToRender - Optional filtered locations array
   */
  static renderLocations(locationsToRender = null) {
    if (!this.locationsList) return;

    const locations = locationsToRender || LocationsService.getAllSavedLocations();
    console.log('🎨 Rendering locations in UI:', locations.length, 'locations');

    if (locations.length === 0) {
      this.renderEmptyState();
    } else {
      this.renderLocationsList(locations);
    }

    this.updateStats();
  }

  /**
   * Render empty state
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
   * Render locations list
   * @param {Array} locations - Locations to render
   */
  static renderLocationsList(locations) {
    const locationsHTML = locations.map(location => this.createLocationHTML(location)).join('');
    this.locationsList.innerHTML = locationsHTML;
  }

  /**
   * Create HTML for a single location
   * @param {Object} location - Location object
   * @returns {string} HTML string
   */
  static createLocationHTML(location) {
    const savedDate = location.saved_at ? 
      new Date(location.saved_at).toLocaleDateString() : '';
    
    const types = location.types && location.types.length > 0 ? 
      location.types.slice(0, 2)
        .map(type => type.replace(/_/g, ' '))
        .join(', ') : '';

    // Format the location display without ratings (as requested)
    return `
      <div class="saved-location" data-place-id="${location.place_id}">
        <div class="location-content">
          <div class="location-info">
            <strong class="location-name">${location.name}</strong>
            <div class="location-address">${location.formatted_address || ''}</div>
            ${types ? `<div class="location-types">${types}</div>` : ''}
            ${savedDate ? `<div class="location-saved-date">Saved: ${savedDate}</div>` : ''}
          </div>
          <div class="location-actions">
            <button class="view-location-btn" 
                    title="View on map" 
                    data-place-id="${location.place_id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </button>
            <button class="delete-location-btn" 
                    title="Remove" 
                    data-place-id="${location.place_id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle search input
   * @param {Event} event - Input event
   */
  // No sidebar search input: remove handleSearchInput

  /**
   * Clear search input
   */
  // No sidebar search input: remove clearSearch

  /**
   * Toggle sidebar visibility
   */
  static toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.toggle('collapsed');
      
      // Save preference to localStorage
      const isCollapsed = this.sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
  }

  /**
   * Handle location item clicks
   * @param {Event} event - Click event
   */
  static handleLocationClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const placeId = target.dataset.placeId;
    if (!placeId) return;

    if (target.classList.contains('view-location-btn')) {
      event.stopPropagation();
      this.dispatchLocationEvent('view-location', { placeId });
      
    } else if (target.classList.contains('delete-location-btn')) {
      event.stopPropagation();
      this.handleDeleteLocation(placeId);
    }
  }

  /**
   * Handle delete location
   * @param {string} placeId - Place ID to delete
   */
  static async handleDeleteLocation(placeId) {
    const location = LocationsService.getSavedLocation(placeId);
    if (!location) return;

    const confirmed = confirm(`Remove "${location.name}" from saved locations?`);
    if (!confirmed) return;

    try {
      await LocationsService.deleteLocation(placeId);
      this.showNotification('Location removed', 'success');
    } catch (error) {
      console.error('Error deleting location:', error);
      this.showNotification('Failed to remove location', 'error');
    }
  }

  /**
   * Update statistics display
   */
  static updateStats() {
    if (!this.statsContainer) return;

    const stats = LocationsService.getLocationStats();
    
    this.statsContainer.innerHTML = `
      <div class="stats-summary">
        <span class="stat-item">
          <strong>${stats.total}</strong> locations
        </span>
      </div>
    `;
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  static showNotification(message, type = 'info') {
    // Dispatch notification event
    this.dispatchLocationEvent('show-notification', { message, type });
  }

  /**
   * Dispatch custom location events
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchLocationEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Restore sidebar state from localStorage
   */
  static restoreSidebarState() {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed && this.sidebar) {
      this.sidebar.classList.add('collapsed');
    }
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
      
    } catch (error) {
      console.error('❌ Error refreshing saved locations:', error);
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
}

// Export individual functions for backward compatibility
export const renderLocations = LocationsUI.renderLocations.bind(LocationsUI);
export const toggleSidebar = LocationsUI.toggleSidebar.bind(LocationsUI);
export const updateStats = LocationsUI.updateStats.bind(LocationsUI);
export const showNotification = LocationsUI.showNotification.bind(LocationsUI);