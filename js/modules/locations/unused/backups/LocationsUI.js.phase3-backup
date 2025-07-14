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
   * Create HTML for a single location with compact view
   * @param {Object} location - Location object
   * @returns {string} HTML string
   */
  static createLocationHTML(location) {
    const savedDate = location.saved_at ? 
      new Date(location.saved_at).toLocaleDateString() : '';
    
    const creatorInfo = location.creator_username || location.creator_email || 'Unknown User';
    const currentUser = StateManager.getAuthState().user;
    const canEdit = currentUser && (
      currentUser.isAdmin || 
      location.created_by === currentUser.userId ||
      location.user_id === currentUser.userId
    );

    // Compact view with basic info
    return `
      <div class="saved-location" data-place-id="${location.place_id}">
        <div class="location-content">
          <div class="location-info">
            <strong class="location-name">${location.name}</strong>
            <div class="location-address">${location.address || location.formatted_address || ''}</div>
            <div class="location-meta">
              <span class="creator-info">👤 ${creatorInfo}</span>
              ${savedDate ? `<span class="saved-date">📅 ${savedDate}</span>` : ''}
            </div>
          </div>
          <div class="location-actions">
            <button class="view-location-btn" 
                    title="View details" 
                    data-place-id="${location.place_id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </button>
            <button class="zoom-to-location-btn" 
                    title="Show on map" 
                    data-lat="${location.lat}"
                    data-lng="${location.lng}">
              📍
            </button>
            ${canEdit ? `
              <button class="edit-location-btn" 
                      title="Edit location" 
                      data-place-id="${location.place_id}">
                ✏️
              </button>
            ` : ''}
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
   * Handle location item clicks with enhanced functionality
   * @param {Event} event - Click event
   */
  static handleLocationClick(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const placeId = target.dataset.placeId;
    
    if (target.classList.contains('view-location-btn')) {
      event.stopPropagation();
      this.showLocationDetailsPopup(placeId);
      
    } else if (target.classList.contains('zoom-to-location-btn')) {
      event.stopPropagation();
      const lat = parseFloat(target.dataset.lat);
      const lng = parseFloat(target.dataset.lng);
      this.zoomToLocation(lat, lng);
      
    } else if (target.classList.contains('edit-location-btn')) {
      event.stopPropagation();
      this.showEditLocationDialog(placeId);
      
    } else if (target.classList.contains('delete-location-btn')) {
      event.stopPropagation();
      this.handleDeleteLocation(placeId);
    }
  }

  /**
   * Show location details popup
   * @param {string} placeId - Place ID
   */
  static async showLocationDetailsPopup(placeId) {
    try {
      // Get location details
      const location = await LocationsService.getLocationByPlaceId(placeId);
      if (!location) {
        alert('Location not found');
        return;
      }

      // Create popup
      const popup = this.createLocationDetailsPopup(location);
      document.body.appendChild(popup);
      
      // Show with animation
      requestAnimationFrame(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, -50%) scale(1)';
      });

    } catch (error) {
      console.error('Error showing location details:', error);
      alert('Error loading location details');
    }
  }

  /**
   * Create location details popup
   * @param {Object} location - Location data
   * @returns {HTMLElement} Popup element
   */
  static createLocationDetailsPopup(location) {
    const popup = document.createElement('div');
    popup.className = 'location-details-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      padding: 0;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 10000;
      opacity: 0;
      transition: all 0.3s ease;
      font-family: Arial, sans-serif;
    `;

    const currentUser = StateManager.getAuthState().currentUser;
    console.log('🔍 DEBUG: Current user for permissions:', currentUser);
    console.log('🔍 DEBUG: Location data for permissions:', {
      place_id: location.place_id,
      created_by: location.created_by,
      user_id: location.user_id,
      creator_id: location.creator_id
    });
    
    // Check if user can edit (admin or creator)
    const canEdit = currentUser && (
      currentUser.isAdmin === 1 || currentUser.isAdmin === true ||
      (location.created_by && location.created_by === currentUser.id) ||
      (location.user_id && location.user_id === currentUser.id) ||
      (location.creator_id && location.creator_id === currentUser.id)
    );
    
    console.log('🔍 DEBUG: Can edit result:', canEdit);

    popup.innerHTML = `
      <div style="position: relative;">
        <div style="padding: 20px; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #333; font-size: 24px;">${location.name}</h2>
          <button class="close-popup" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 28px; cursor: pointer; color: #666;">&times;</button>
        </div>
        
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">📍 Address</h3>
            <p style="margin: 0; color: #666;">${location.address || 'Not specified'}</p>
            ${location.street || location.number ? `
              <div style="margin-top: 5px; font-size: 14px; color: #888;">
                ${location.number ? location.number + ' ' : ''}${location.street || ''}
                ${location.city ? ', ' + location.city : ''}
                ${location.state ? ', ' + location.state : ''}
                ${location.zipcode ? ' ' + location.zipcode : ''}
              </div>
            ` : ''}
          </div>
          
          ${location.description ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 10px 0;">📝 Description</h3>
              <p style="margin: 0; color: #666;">${location.description}</p>
            </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">ℹ️ Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div><strong>Coordinates:</strong><br>${location.lat?.toFixed(6)}, ${location.lng?.toFixed(6)}</div>
              <div><strong>Created by:</strong><br>${location.creator_username || location.creator_email || 'Unknown'}</div>
              <div><strong>Created:</strong><br>${location.created_at ? new Date(location.created_at).toLocaleDateString() : 'Unknown'}</div>
              <div><strong>Times saved:</strong><br>${location.saved_count || 1}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button class="zoom-to-btn" data-lat="${location.lat}" data-lng="${location.lng}" 
                    style="background: #4285f4; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">
              📍 Show on Map
            </button>
            ${canEdit ? `
              <button class="edit-btn" data-place-id="${location.place_id}"
                      style="background: #ff9800; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">
                ✏️ Edit
              </button>
              <button class="delete-btn" data-place-id="${location.place_id}"
                      style="background: #f44336; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">
                🗑️ Delete
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    popup.querySelector('.close-popup').addEventListener('click', () => this.closePopup(popup));
    
    const zoomBtn = popup.querySelector('.zoom-to-btn');
    if (zoomBtn) {
      zoomBtn.addEventListener('click', () => {
        this.zoomToLocation(location.lat, location.lng);
        this.closePopup(popup);
      });
    }

    if (canEdit) {
      const editBtn = popup.querySelector('.edit-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.closePopup(popup);
          this.showEditLocationDialog(location.place_id);
        });
      }

      const deleteBtn = popup.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          this.closePopup(popup);
          this.handleDeleteLocation(location.place_id);
        });
      }
    }

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'popup-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    backdrop.addEventListener('click', () => this.closePopup(popup));
    
    document.body.appendChild(backdrop);
    popup.backdrop = backdrop;

    return popup;
  }

  /**
   * Close popup
   * @param {HTMLElement} popup - Popup element
   */
  static closePopup(popup) {
    popup.style.opacity = '0';
    popup.style.transform = 'translate(-50%, -50%) scale(0.9)';
    
    setTimeout(() => {
      if (popup.backdrop) {
        popup.backdrop.remove();
      }
      popup.remove();
    }, 300);
  }

  /**
   * Zoom to location on map
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  static zoomToLocation(lat, lng) {
    const map = StateManager.getMapsState().map;
    if (map) {
      map.setCenter({ lat, lng });
      map.setZoom(16);
      
      // Add a temporary marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        animation: google.maps.Animation.BOUNCE
      });
      
      // Remove bounce after 2 seconds
      setTimeout(() => {
        marker.setAnimation(null);
      }, 2000);
    }
  }

  /**
   * Show edit location dialog
   * @param {string} placeId - Place ID
   */
  static async showEditLocationDialog(placeId) {
    try {
      const location = await LocationsService.getLocationByPlaceId(placeId);
      if (!location) {
        alert('Location not found');
        return;
      }

      // Delegate to the comprehensive edit dialog in LocationsUIHelpers
      const { LocationsUIHelpers } = await import('./LocationsUIHelpers.js');
      return LocationsUIHelpers.showEditLocationDialog(location);

    } catch (error) {
      console.error('Error showing edit dialog:', error);
      alert('Error loading location for editing');
    }
  }

  // DEPRECATED: Edit dialog creation moved to LocationsUIHelpers.js
  // This method is kept for reference but no longer used
  /*
  static createEditLocationDialog(location) {
    // This functionality has been moved to LocationsUIHelpers.generateEditDialogHTML()
    // with comprehensive field support including:
    // - Location Type, Entry Point, Parking, Access, Photo URL, Types
    console.log('DEPRECATED: Use LocationsUIHelpers.showEditLocationDialog() instead');
    return null;
  }
  */

  // DEPRECATED: Dialog management moved to LocationsUIHelpers.js
  /*
  static closeEditDialog(dialog) {
    // This functionality is now handled by LocationsUIHelpers.hideEditLocationDialog()
    if (dialog.backdrop) {
      dialog.backdrop.remove();
    }
    dialog.remove();
  }

  // DEPRECATED: Dialog management moved to LocationsUIHelpers.js
  /*
  static closeEditDialog(dialog) {
    // This functionality is now handled by LocationsUIHelpers.hideEditLocationDialog()
    if (dialog.backdrop) {
      dialog.backdrop.remove();
    }
    dialog.remove();
  }

  static async handleUpdateLocation(event, placeId, dialog) {
    // This functionality is now handled by LocationsUIHelpers.handleEditLocationFormSubmit()
    // with comprehensive field support
    console.log('DEPRECATED: Use LocationsUIHelpers.handleEditLocationFormSubmit() instead');
  }
  */

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