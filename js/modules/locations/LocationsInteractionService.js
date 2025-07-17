/**
 * Locations Interaction Service
 * Handles event handling, user interactions, popups, and location actions
 * Extracted from LocationsUI.js for Phase 3 refactoring
 */

import { StateManager } from '../state/AppState.js';
import { LocationsService } from './LocationsService.js';

/**
 * Locations Interaction Service Class
 * Responsible for user interactions, event handling, and location detail popups
 */
export class LocationsInteractionService {

  /**
   * Initialize event listeners for location interactions
   */
  static initialize() {
    console.log('🎮 Initializing Locations Interaction Service');
    
    this.setupEventListeners();
    
    console.log('✅ Locations Interaction Service initialized');
  }

  /**
   * Setup event listeners for location interactions
   */
  static setupEventListeners() {
    // Listen for locations events
    document.addEventListener('locations-loaded', () => {
      this.dispatchInteractionEvent('locations-data-updated');
    });

    document.addEventListener('location-saved', (event) => {
      console.log('🎉 Location saved event received:', event.detail);
      this.dispatchInteractionEvent('location-action-completed', { 
        action: 'saved', 
        location: event.detail 
      });
    });

    document.addEventListener('location-deleted', () => {
      this.dispatchInteractionEvent('location-action-completed', { 
        action: 'deleted' 
      });
    });

    // Location item interactions - delegate all click handling
    document.addEventListener('click', this.handleLocationClick.bind(this));
    
    console.log('✅ Event listeners attached for location interactions');
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
   * Show location details popup with comprehensive information
   * @param {string} placeId - Place ID
   */
  static async showLocationDetailsPopup(placeId) {
    try {
      // Get location details
      const location = await LocationsService.getLocationByPlaceId(placeId);
      if (!location) {
        this.showNotification('Location not found', 'error');
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
      this.showNotification('Error loading location details', 'error');
    }
  }

  /**
   * Create location details popup with modern styling
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
      created_by: location.created_by, // <-- This has no db reference.
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

    // Safely get location properties with fallbacks
    const name = location.name || 'Unnamed Location';
    const address = location.address || location.formatted_address || 'Not specified';
    const lat = location.lat || location.latitude || 0;
    const lng = location.lng || location.longitude || 0;
    const description = location.description || null;
    const creatorInfo = location.creator_username || location.creator_email || 'Unknown';
    const createdAt = location.created_at ? new Date(location.created_at).toLocaleDateString() : 'Unknown';
    const savedCount = location.saved_count || 1;

    popup.innerHTML = `
      <div style="position: relative;">
        <div style="padding: 20px; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0; color: #333; font-size: 24px;">${name}</h2>
          <button class="close-popup" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 28px; cursor: pointer; color: #666;">&times;</button>
        </div>
        
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">📍 Address</h3>
            <p style="margin: 0; color: #666;">${address}</p>
            ${location.street || location.number ? `
              <div style="margin-top: 5px; font-size: 14px; color: #888;">
                ${location.number ? location.number + ' ' : ''}${location.street || ''}
                ${location.city ? ', ' + location.city : ''}
                ${location.state ? ', ' + location.state : ''}
                ${location.zipcode ? ' ' + location.zipcode : ''}
              </div>
            ` : ''}
          </div>
          
          ${description ? `
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 10px 0;">📝 Description</h3>
              <p style="margin: 0; color: #666;">${description}</p>
            </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 10px 0;">ℹ️ Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div><strong>Coordinates:</strong><br>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
              <div><strong>Created by:</strong><br>${creatorInfo}</div>
              <div><strong>Created:</strong><br>${createdAt}</div>
              <div><strong>Times saved:</strong><br>${savedCount}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button class="zoom-to-btn" data-lat="${lat}" data-lng="${lng}" 
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
   * Close popup with animation
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
   * Zoom to location on map with marker animation
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  static zoomToLocation(lat, lng) {
    const map = StateManager.getMapsState().map;
    if (map) {
      map.setCenter({ lat, lng });
      map.setZoom(16);
      
      // Add a temporary marker with bounce animation
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        animation: google.maps.Animation.BOUNCE
      });
      
      // Remove bounce after 2 seconds
      setTimeout(() => {
        marker.setAnimation(null);
      }, 2000);
      
      console.log('🗺️ Zoomed to location:', { lat, lng });
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
        this.showNotification('Location not found', 'error');
        return;
      }

      // Delegate to the comprehensive edit dialog in LocationsUIHelpers
      const { LocationsUIHelpers } = await import('./LocationsUIHelpers.js');
      return LocationsUIHelpers.showEditLocationDialog(location);

    } catch (error) {
      console.error('Error showing edit dialog:', error);
      this.showNotification('Error loading location for editing', 'error');
    }
  }

  /**
   * Handle delete location with confirmation
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
      
      // Dispatch delete event for UI refresh
      this.dispatchInteractionEvent('location-deleted', { placeId });
      
    } catch (error) {
      console.error('Error deleting location:', error);
      this.showNotification('Failed to remove location', 'error');
    }
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  static showNotification(message, type = 'info') {
    // Dispatch notification event
    this.dispatchInteractionEvent('show-notification', { message, type });
  }

  /**
   * Dispatch custom interaction events
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchInteractionEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle refresh button clicks
   */
  static async handleRefreshLocations() {
    try {
      console.log('🔄 Handling refresh locations request...');
      
      // Dispatch refresh event for rendering service
      this.dispatchInteractionEvent('refresh-locations-requested');
      
    } catch (error) {
      console.error('Error handling refresh:', error);
      this.showNotification('Error refreshing locations', 'error');
    }
  }

  /**
   * Handle location item selection events
   * @param {string} placeId - Place ID
   * @param {string} action - Action type (view, edit, delete, zoom)
   */
  static handleLocationAction(placeId, action) {
    console.log(`🎯 Handling location action: ${action} for place ${placeId}`);
    
    switch (action) {
      case 'view':
        this.showLocationDetailsPopup(placeId);
        break;
      case 'edit':
        this.showEditLocationDialog(placeId);
        break;
      case 'delete':
        this.handleDeleteLocation(placeId);
        break;
      case 'zoom':
        const location = LocationsService.getSavedLocation(placeId);
        if (location) {
          this.zoomToLocation(location.lat, location.lng);
        }
        break;
      default:
        console.warn('Unknown location action:', action);
    }
  }

  /**
   * Get interaction state information
   * @returns {Object} Current interaction state
   */
  static getInteractionState() {
    return {
      hasActivePopup: !!document.querySelector('.location-details-popup'),
      hasActiveBackdrop: !!document.querySelector('.popup-backdrop'),
      currentTime: new Date().toISOString()
    };
  }
}

// Export individual functions for backward compatibility
export const showNotification = LocationsInteractionService.showNotification.bind(LocationsInteractionService);
export const handleLocationClick = LocationsInteractionService.handleLocationClick.bind(LocationsInteractionService);
export const showLocationDetailsPopup = LocationsInteractionService.showLocationDetailsPopup.bind(LocationsInteractionService);
