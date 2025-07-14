/**
 * Locations Event UI Service
 * Handles UI state management, notifications, shortcuts, and bulk operations
 * Extracted from LocationsEventHandlers.js for Phase 4 refactoring
 */

import { LocationsService } from './LocationsService.js';
import { LocationsUI } from './LocationsUI.js';
import { AuthUICore } from '../auth/AuthUICore.js';
import { AuthNotificationService } from '../auth/AuthNotificationService.js';
import { StateManager } from '../state/AppState.js';

/**
 * Locations Event UI Service Class
 * Responsible for UI state management, keyboard shortcuts, and bulk operations
 */
export class LocationsEventUIService {

  /**
   * Initialize UI-focused event handlers
   */
  static initialize() {
    console.log('🎨 Initializing Locations Event UI Service');
    
    this.setupUIEventListeners();
    this.initializeKeyboardShortcuts();
    
    console.log('✅ Locations Event UI Service initialized');
  }

  /**
   * Setup UI-focused event listeners
   */
  static setupUIEventListeners() {
    // Handle notification requests
    document.addEventListener('show-notification', this.handleNotificationRequest.bind(this));
    
    // Handle authentication state changes for UI updates
    document.addEventListener('user-logged-in', this.handleUserLoggedInUI.bind(this));
    document.addEventListener('user-logged-out', this.handleUserLoggedOutUI.bind(this));
    
    // Handle UI state updates from core service
    document.addEventListener('location-saved-ui-update', this.handleLocationSavedUI.bind(this));
    document.addEventListener('location-deleted-ui-update', this.handleLocationDeletedUI.bind(this));
    document.addEventListener('save-error-ui-update', this.handleSaveErrorUI.bind(this));
    document.addEventListener('delete-error-ui-update', this.handleDeleteErrorUI.bind(this));
    
    // Handle location reload events
    document.addEventListener('locations-reloaded', this.handleLocationsReloaded.bind(this));
    
    console.log('✅ UI event listeners attached');
  }

  /**
   * Handle notification requests
   * @param {Event} event - Show notification event
   */
  static handleNotificationRequest(event) {
    const { message, type } = event.detail;
    AuthNotificationService.showNotification(message, type);
  }

  /**
   * Handle user logged in UI updates
   * @param {Event} event - User logged in event
   */
  static async handleUserLoggedInUI(event) {
    // Update location count after login
    this.updateLocationCount();
    
    // Show loading state briefly
    this.showLoadingState('Loading your saved locations...');
    
    // Clear loading state after a moment
    setTimeout(() => {
      this.hideLoadingState();
    }, 2000);
  }

  /**
   * Handle user logged out UI updates
   * @param {Event} event - User logged out event
   */
  static handleUserLoggedOutUI(event) {
    // Update location count after logout
    this.updateLocationCount();
    
    // Reset any authenticated-only UI elements
    this.resetAuthenticatedUI();
  }

  /**
   * Handle location saved UI updates
   * @param {Event} event - Location saved UI update event
   */
  static handleLocationSavedUI(event) {
    const { placeId } = event.detail;
    
    // Update save button state to saved
    this.updateSaveButtonForPlace(placeId, 'saved');
    
    // Update location count
    this.updateLocationCount();
  }

  /**
   * Handle location deleted UI updates
   * @param {Event} event - Location deleted UI update event
   */
  static handleLocationDeletedUI(event) {
    const { placeId } = event.detail;
    
    // Update any UI elements for the deleted location
    this.updateSaveButtonForPlace(placeId, 'not-saved');
    
    // Update location count
    this.updateLocationCount();
  }

  /**
   * Handle save error UI updates
   * @param {Event} event - Save error UI update event
   */
  static handleSaveErrorUI(event) {
    const { placeId } = event.detail;
    
    // Update save button state to error
    this.updateSaveButtonForPlace(placeId, 'error');
  }

  /**
   * Handle delete error UI updates
   * @param {Event} event - Delete error UI update event
   */
  static handleDeleteErrorUI(event) {
    // Could handle specific delete error UI updates if needed
    console.log('Delete error UI update:', event.detail);
  }

  /**
   * Handle locations reloaded event
   * @param {Event} event - Locations reloaded event
   */
  static handleLocationsReloaded(event) {
    // Update location count
    this.updateLocationCount();
    
    // Dispatch event to UI components
    this.dispatchUIEvent('locations-count-updated', {});
  }

  /**
   * Update save button state in info window
   * @param {string} state - Button state (saving, saved, error, not-saved)
   */
  static updateSaveButtonState(state) {
    const saveBtn = document.getElementById('saveLocationBtn');
    if (!saveBtn) return;

    switch (state) {
      case 'saving':
        saveBtn.textContent = '⏳ Saving...';
        saveBtn.disabled = true;
        saveBtn.className = 'save-location-btn saving';
        break;
        
      case 'saved':
        saveBtn.textContent = '✅ Saved';
        saveBtn.disabled = true;
        saveBtn.className = 'save-location-btn saved';
        break;
        
      case 'error':
        saveBtn.textContent = '💾 Save Location';
        saveBtn.disabled = false;
        saveBtn.className = 'save-location-btn error';
        // Reset to normal state after 3 seconds
        setTimeout(() => {
          if (saveBtn) {
            saveBtn.className = 'save-location-btn';
          }
        }, 3000);
        break;
        
      case 'not-saved':
        saveBtn.textContent = '💾 Save Location';
        saveBtn.disabled = false;
        saveBtn.className = 'save-location-btn';
        break;
    }
  }

  /**
   * Update save button for a specific place
   * @param {string} placeId - Place ID
   * @param {string} state - Button state
   */
  static updateSaveButtonForPlace(placeId, state) {
    const saveBtn = document.getElementById('saveLocationBtn');
    if (!saveBtn) return;
    
    // Check if current info window is for this place
    const currentPlaceId = saveBtn.dataset.placeId;
    if (currentPlaceId === placeId) {
      this.updateSaveButtonState(state);
    }
  }

  /**
   * Update location count display
   */
  static updateLocationCount() {
    try {
      const stats = LocationsService.getLocationStats();
      const countElement = document.getElementById('locationsCount');
      
      if (countElement) {
        countElement.textContent = stats.total;
      }
      
      // Update any other count displays
      const statsElements = document.querySelectorAll('.locations-count, .saved-locations-count');
      statsElements.forEach(element => {
        element.textContent = stats.total;
      });
      
      console.log('📊 Updated location count:', stats.total);
      
    } catch (error) {
      console.error('Error updating location count:', error);
    }
  }

  /**
   * Handle bulk operations on locations
   * @param {string} operation - Operation type (export, clear, import)
   * @param {Object} data - Operation data
   */
  static async handleBulkOperation(operation, data = null) {
    try {
      console.log('🔄 Handling bulk operation:', operation);
      
      switch (operation) {
        case 'export':
          const { LocationsUI } = await import('./LocationsUI.js');
          await LocationsUI.exportLocations();
          AuthNotificationService.showNotification('Locations exported successfully', 'success');
          break;
          
        case 'clear':
          if (!confirm('Are you sure you want to clear all saved locations? This cannot be undone.')) {
            return;
          }
          await LocationsService.clearAllLocations();
          LocationsUI.renderLocations();
          this.updateLocationCount();
          AuthNotificationService.showNotification('All locations cleared', 'success');
          break;
          
        case 'import':
          const { LocationsUI: UIModule } = await import('./LocationsUI.js');
          await UIModule.importLocations(data);
          LocationsUI.renderLocations();
          this.updateLocationCount();
          AuthNotificationService.showNotification('Locations imported successfully', 'success');
          break;
          
        default:
          console.warn('Unknown bulk operation:', operation);
      }
    } catch (error) {
      console.error(`Error in bulk operation ${operation}:`, error);
      AuthNotificationService.showNotification(`Failed to ${operation} locations`, 'error');
    }
  }

  /**
   * Handle keyboard shortcuts for locations
   * @param {KeyboardEvent} event - Keyboard event
   */
  static handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Export locations
          this.handleBulkOperation('export');
        }
        break;
        
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Focus search input
          const searchInput = document.getElementById('locationsSearch');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        break;
        
      case 'Escape':
        // Clear search or close dialogs
        this.handleEscapeKey();
        break;
        
      case 'r':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Refresh locations
          this.refreshLocations();
        }
        break;
    }
  }

  /**
   * Handle escape key press
   */
  static handleEscapeKey() {
    // Clear search if there's a search input with value
    const searchInput = document.getElementById('locationsSearch');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      return;
    }
    
    // Close any open popups
    const popups = document.querySelectorAll('.location-details-popup, .edit-location-dialog');
    popups.forEach(popup => {
      if (popup.style.display !== 'none') {
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 300);
      }
    });
    
    // Close info windows
    try {
      const { MarkerService } = import('../maps/MarkerService.js');
      MarkerService.then(module => module.MarkerService.closeInfoWindow());
    } catch (error) {
      // Silently handle if MarkerService is not available
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  static initializeKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    console.log('⌨️ Keyboard shortcuts initialized');
  }

  /**
   * Show loading state
   * @param {string} message - Loading message
   */
  static showLoadingState(message = 'Loading...') {
    const loadingElement = document.getElementById('locationsLoading');
    if (loadingElement) {
      loadingElement.textContent = message;
      loadingElement.style.display = 'block';
    }
  }

  /**
   * Hide loading state
   */
  static hideLoadingState() {
    const loadingElement = document.getElementById('locationsLoading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  /**
   * Reset authenticated-only UI elements
   */
  static resetAuthenticatedUI() {
    // Reset any UI elements that should only be visible when authenticated
    const authOnlyElements = document.querySelectorAll('.auth-only');
    authOnlyElements.forEach(element => {
      element.style.display = 'none';
    });
    
    // Reset save button states
    this.updateSaveButtonState('not-saved');
  }

  /**
   * Refresh locations manually
   */
  static async refreshLocations() {
    try {
      this.showLoadingState('Refreshing locations...');
      
      await LocationsService.loadSavedLocations();
      LocationsUI.renderLocations();
      this.updateLocationCount();
      
      AuthNotificationService.showNotification('Locations refreshed', 'success');
      
    } catch (error) {
      console.error('Error refreshing locations:', error);
      AuthNotificationService.showNotification('Failed to refresh locations', 'error');
    } finally {
      this.hideLoadingState();
    }
  }

  /**
   * Dispatch UI event for coordination
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchUIEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Get current UI state
   * @returns {Object} Current UI state information
   */
  static getUIState() {
    return {
      locationCount: LocationsService.getLocationStats().total,
      isLoading: document.getElementById('locationsLoading')?.style.display !== 'none',
      hasActivePopup: !!document.querySelector('.location-details-popup'),
      currentTime: new Date().toISOString()
    };
  }
}

// Export individual functions for backward compatibility
export const updateSaveButtonState = LocationsEventUIService.updateSaveButtonState.bind(LocationsEventUIService);
export const updateLocationCount = LocationsEventUIService.updateLocationCount.bind(LocationsEventUIService);
export const handleBulkOperation = LocationsEventUIService.handleBulkOperation.bind(LocationsEventUIService);
export const handleKeyboardShortcuts = LocationsEventUIService.handleKeyboardShortcuts.bind(LocationsEventUIService);
