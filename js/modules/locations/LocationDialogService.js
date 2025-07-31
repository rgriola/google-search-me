/**
 * Location Dialog Service
 * Handles dialog creation, display, and management for location operations
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';

export class LocationDialogService {
  
  /**
   * Show location details dialog
   * @param {Object} location - Location data
   * @param {string} position - Dialog position ('center' or 'top-right')
   */
  static showLocationDetailsDialog(location, position = 'center') {
    const dialog = this.createDialog('location-details-dialog', 'Location Details', position);
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3>Location Details</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div class="dialog-content">
        ${this.generateLocationDetailsHTML(location)}
      </div>
      <div class="dialog-actions">
        <button class="btn-primary" onclick="window.LocationsUI.showEditLocationDialog(window.LocationsUI.getLocationById('${location.place_id || location.id}'))">Edit</button>
        <button class="btn-secondary close-dialog">Close</button>
      </div>
    `;

    this.showDialog(dialog, position);
    
    // Load photos after dialog is shown
    setTimeout(() => {
      if (window.LocationsUI && window.LocationsUI.photoManager) {
        window.LocationsUI.photoManager.loadDialogPhotos(location.place_id || location.id);
      }
    }, 100);
  }

  /**
   * Show edit location dialog
   * @param {Object} location - Location data
   */
  static showEditLocationDialog(location) {
    const dialog = this.createDialog('edit-location-dialog', 'Edit Location', 'enhanced-center');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="edit-location-form" data-place-id="${location.place_id || location.id}">
        <div class="dialog-content">
          ${window.LocationsUI.generateLocationFormHTML(location)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Changes</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog, 'enhanced-center');
    
    // Load existing photos after dialog is shown
    setTimeout(() => {
      if (location.place_id || location.id) {
        if (window.LocationsUI && window.LocationsUI.photoManager) {
          window.LocationsUI.photoManager.loadEditFormPhotos(location.place_id || location.id);
        }
      }
    }, 100);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    const dialog = this.createDialog('save-location-dialog', 'Save Location', 'enhanced-center');
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save New Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="save-location-form">
        <div class="dialog-content">
          ${window.LocationsUI.generateLocationFormHTML(locationData)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Location</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `;

    this.showDialog(dialog, 'enhanced-center');
  }

  /**
   * Create a dialog element
   * @param {string} id - Dialog ID
   * @param {string} title - Dialog title
   * @param {string} position - Dialog position
   * @returns {HTMLElement} Dialog element
   */
  static createDialog(id, title, position = 'center') {
    // Remove existing dialog
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.id = id;
    
    // Apply position-specific classes
    if (position === 'top-right') {
      dialog.className = `location-dialog dialog-top-right`;
    } else if (position === 'enhanced-center') {
      dialog.className = `dialog enhanced-center`;
    } else {
      dialog.className = `location-dialog dialog-center`;
    }
    
    return dialog;
  }

  /**
   * Show a dialog with positioning
   * @param {HTMLElement} dialog - Dialog element
   * @param {string} position - Dialog position
   */
  static showDialog(dialog, position = 'center') {
    // Create backdrop for center and enhanced-center dialogs
    if (position === 'center' || position === 'enhanced-center') {
      const backdrop = document.createElement('div');
      backdrop.className = 'dialog-backdrop';
      
      if (position === 'enhanced-center') {
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        
        backdrop.onclick = (e) => {
          if (e.target === backdrop) this.closeActiveDialog();
        };
        
        document.body.appendChild(backdrop);
        backdrop.appendChild(dialog);
        
        // Trigger animation
        setTimeout(() => {
          backdrop.style.opacity = '1';
        }, 10);
        
      } else {
        backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
        `;
        backdrop.onclick = () => this.closeActiveDialog();
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
      }
    } else {
      // For top-right dialogs, just append to body
      if (position === 'top-right') {
        dialog.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          padding: 0;
          max-width: 400px;
          width: 380px;
          z-index: 10000;
          border: 1px solid #e0e0e0;
          animation: slideInFromRight 0.3s ease;
        `;
      }
      document.body.appendChild(dialog);
    }
    
    // Setup form enhancements if this dialog contains a form
    if (dialog.querySelector('form') && window.LocationsUI) {
      window.LocationsUI.setupFormEnhancements(dialog);
    }
  }

  /**
   * Close the active dialog
   */
  static closeActiveDialog() {
    const dialogs = document.querySelectorAll('.location-dialog, .dialog');
    const backdrops = document.querySelectorAll('.dialog-backdrop');
    
    dialogs.forEach(dialog => dialog.remove());
    backdrops.forEach(backdrop => backdrop.remove());
  }

  /**
   * Generate location details HTML
   * @param {Object} location - Location data
   * @returns {string} HTML string
   */
  static generateLocationDetailsHTML(location) {
    return `
      <div class="location-details enhanced">
        <div class="detail-header">
          <h4 class="location-title">${SecurityUtils.escapeHtml(location.name || 'Unnamed Location')}</h4>
          <span class="location-type-badge ${location.type ? location.type.replace(/\s+/g, '-').toLowerCase() : 'default'}">${SecurityUtils.escapeHtml(location.type || 'No Type')}</span>
        </div>
        
        <div class="detail-section">
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Address:</label>
            <span>${SecurityUtils.escapeHtml(location.formatted_address || location.address || 'No address')}</span>
          </div>
          
          ${location.production_notes ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg>Notes:</label>
            <span>${SecurityUtils.escapeHtml(location.production_notes)}</span>
          </div>
          ` : ''}
          
          ${location.entry_point ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"></path><path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"></path><circle cx="12" cy="12" r="10"></circle></svg>Entry:</label>
            <span>${SecurityUtils.escapeHtml(location.entry_point)}</span>
          </div>
          ` : ''}
          
          ${location.parking ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>Parking:</label>
            <span>${SecurityUtils.escapeHtml(location.parking)}</span>
          </div>
          ` : ''}
          
          ${location.access ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>Access:</label>
            <span>${SecurityUtils.escapeHtml(location.access)}</span>
          </div>
          ` : ''}
        </div>
        
        <!-- Photos Section -->
        <div class="detail-section photos-section">
          <div class="detail-row photos-header">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg>Photos:</label>
          </div>
          <div class="location-photos-container" data-place-id="${location.place_id || location.id}">
            <div class="photos-loading">
              <div class="loading-spinner"></div>
              <p>Loading photos...</p>
            </div>
          </div>
        </div>
        
        ${location.lat && location.lng ? `
        <div class="detail-meta">
          <div class="detail-row coordinates">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"></polygon></svg>Coordinates:</label>
            <span class="coordinates-text">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
          </div>
          ${location.creator_username ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Created by:</label>
            <span>${SecurityUtils.escapeHtml(location.creator_username)}</span>
          </div>
          ` : ''}
          ${location.created_date || location.created_at ? `
          <div class="detail-row">
            <label><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Created:</label>
            <span>${new Date(location.created_date || location.created_at).toLocaleDateString()}</span>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `;
  }
}
