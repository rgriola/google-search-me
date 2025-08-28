/**
 * Location Dialog Manager
 * Handles creation, display, and management of location dialogs
 */

import { LocationTemplates } from '../LocationTemplates.js';
import { SecurityUtils } from '../../../utils/SecurityUtils.js';
import { LocationPermissionService } from '../LocationPermissionService.js';
import { LocationEventManager } from '../LocationEventManager.js';

export class LocationDialogManager {
  
  // Track if dialog styles have been injected
  static dialogStylesInjected = false;
  
  // Initialize event delegation when class is loaded
  // this sets a global listener 
  static {
    // events maybe better here long term. 

   // this.initializeEventDelegation();
  }

  /**
   * Dynamically inject dialog styles into the document
   * This ensures dialog styles are available when needed
   */
  static injectDialogStyles() {
    if (this.dialogStylesInjected) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'dynamic-dialog-styles';
    styleSheet.textContent = `
      /* DIALOG SYSTEM STYLES - Dynamically Injected - Enhanced */
      .dialog-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .dialog-backdrop.show {
        opacity: 1;
      }

      .dialog-backdrop.enhanced-center {
        z-index: 2000;
      }

      .dialog {
        background-color: white;
        border-radius: 12px;
        padding: 0;
        max-width: 90%;
        max-height: 90vh;
        width: 600px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 1px solid #e0e0e0;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        position: relative;
      }

      .dialog-backdrop.show .dialog {
        transform: scale(1);
      }

      .dialog.enhanced-center {
        width: 600px;
        max-width: 90%;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        overflow-y: auto;
        z-index: 2001;
      }

      .dialog-header {
        background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
        color: white;
        padding: 20px;
        display: flex !important;
        justify-content: space-between;
        align-items: center;
        border-bottom: none;
        margin: 0;
        flex-wrap: nowrap;
        width: 100%;
        box-sizing: border-box;
      }

      .dialog-header h2,
      .dialog-header h3 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: white;
      }

      .close,
      .close-dialog {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        border-radius: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-left: auto;
        line-height: 1;
        float: none;
        margin-top: 0;
      }

      .close:hover,
      .close:focus,
      .close-dialog:hover {
        background: rgba(255, 255, 255, 0.3);
        color: white;
        transform: scale(1.1);
      }

      .dialog-content {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
        line-height: 1.6;
      }

      .dialog-actions {
        padding: 20px;
        background: #f8f9fa;
        border-top: 1px solid #e2e8f0;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin: 0;
        border-radius: 0;
      }

      /* Enhanced Button Styling to Match Profile Modal */
      .dialog-actions button,
      .primary-btn,
      .secondary-btn,
      .btn-primary,
      .btn-secondary,
      .btn-danger,
      .btn-sm,
      .auth-submit-btn,
      .auth-cancel-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s ease;
        min-width: 80px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Primary Button Styling */
      .primary-btn,
      .btn-primary,
      .auth-submit-btn {
        background: #1a73e8;
        color: white;
        box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
      }

      .primary-btn:hover,
      .btn-primary:hover,
      .auth-submit-btn:hover {
        background: #1557b0;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
      }

      .primary-btn:disabled,
      .btn-primary:disabled,
      .auth-submit-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* Secondary Button Styling */
      .secondary-btn,
      .btn-secondary,
      .auth-cancel-btn {
        background: transparent;
        color: #6c757d;
        border: 1px solid #6c757d;
        box-shadow: none;
      }

      .secondary-btn:hover,
      .btn-secondary:hover,
      .auth-cancel-btn:hover {
        background: #6c757d;
        color: white;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(108, 117, 125, 0.2);
      }

      /* Danger Button Styling */
      .btn-danger {
        background: #dc3545;
        color: white;
        box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
      }

      .btn-danger:hover {
        background: #c82333;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
      }

      /* Small Button Variant */
      .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
        min-width: 60px;
      }

      /* Form Section Styling */
      .profile-section {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e2e8f0;
      }

      .profile-section:last-child {
        border-bottom: none;
      }

      .profile-section h3 {
        color: #1a73e8;
        font-size: 18px;
        margin-bottom: 15px;
      }

      /* Form Group Styling */
      .form-group {
        margin-bottom: 15px;
      }

      .form-group:last-child {
        margin-top: 25px;
        text-align: right;
      }

      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
      }

      .form-group input[type="text"],
      .form-group input[type="email"],
      .form-group input[type="password"],
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 10px;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.2s ease;
        box-sizing: border-box;
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #1a73e8;
        box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
      }

      .form-help {
        font-size: 12px;
        color: #6c757d;
        margin-top: 5px;
      }

      /* Photo Upload Drop Zone Styling */
      .photo-drop-zone {
        margin-top: 15px;
        padding: 30px 20px;
        border: 2px dashed #1a73e8;
        border-radius: 12px;
        text-align: center;
        cursor: pointer;
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f8ff 100%);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .photo-drop-zone:hover {
        background: linear-gradient(135deg, #e3f2fd 0%, #e8f4fd 100%);
        border-color: #1557b0;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15);
      }

      .photo-drop-zone.dragover {
        background: linear-gradient(135deg, #e8f4fd 0%, #bbdefb 100%);
        border-color: #1557b0;
        border-style: solid;
        box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
      }

      .drop-zone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        position: relative;
        z-index: 1;
      }

      .drop-zone-icon {
        font-size: 3em;
        color: #1a73e8;
        margin-bottom: 8px;
        transition: all 0.3s ease;
      }

      .photo-drop-zone:hover .drop-zone-icon {
        color: #1557b0;
        transform: scale(1.1);
      }

      .drop-zone-main-text {
        color: #1a73e8;
        font-weight: 600;
        font-size: 18px;
        margin-bottom: 4px;
        transition: color 0.3s ease;
      }

      .photo-drop-zone:hover .drop-zone-main-text {
        color: #1557b0;
      }

      .drop-zone-subtext {
        color: #6c757d;
        margin: 0;
        font-size: 14px;
        line-height: 1.4;
        max-width: 300px;
      }

      .drop-zone-or {
        display: flex;
        align-items: center;
        width: 100%;
        margin: 20px 0 15px 0;
        position: relative;
      }

      .drop-zone-or::before {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
      }

      .drop-zone-or::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #e2e8f0;
      }

      .drop-zone-or span {
        padding: 0 15px;
        color: #6c757d;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
      }

      /* Photo Upload Button Styling */
      .photo-upload-btn,
      .select-photo-btn {
        background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 140px;
      }

      .photo-upload-btn:hover,
      .select-photo-btn:hover {
        background: linear-gradient(135deg, #1557b0 0%, #0d47a1 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(26, 115, 232, 0.3);
      }

      .photo-upload-btn:active,
      .select-photo-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
      }

      /* Hidden File Input */
      .hidden-file-input {
        display: none !important;
        position: absolute;
        opacity: 0;
        pointer-events: none;
        width: 0;
        height: 0;
      }

      /* Photo Preview Area */
      .photo-preview-area {
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .photo-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }

      .photo-preview-item {
        position: relative;
        background: white;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease;
      }

      .photo-preview-item:hover {
        transform: scale(1.02);
      }

      .photo-preview-image {
        width: 100%;
        height: 80px;
        object-fit: cover;
        display: block;
      }

      .photo-preview-remove {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .photo-preview-remove:hover {
        background: #dc3545;
        transform: scale(1.1);
      }

      /* Upload Progress */
      .upload-progress {
        margin-top: 15px;
        padding: 10px;
        background: #e3f2fd;
        border-radius: 6px;
        border-left: 3px solid #1a73e8;
      }

      .upload-progress-bar {
        width: 100%;
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
        margin-top: 5px;
      }

      .upload-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #1a73e8, #1557b0);
        transition: width 0.3s ease;
        border-radius: 2px;
      }

      /* Error States */
      .photo-drop-zone.error {
        border-color: #dc3545;
        background: linear-gradient(135deg, #fff5f5 0%, #ffe6e6 100%);
      }

      .photo-upload-error {
        margin-top: 10px;
        padding: 8px 12px;
        background: #fff5f5;
        color: #dc3545;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        font-size: 13px;
      }

      /* Mobile Responsive Photo Upload */
      @media (max-width: 768px) {
        .photo-drop-zone {
          padding: 25px 15px;
          margin-top: 12px;
        }
        
        .drop-zone-icon {
          font-size: 2.5em;
        }
        
        .drop-zone-main-text {
          font-size: 16px;
        }
        
        .drop-zone-subtext {
          font-size: 13px;
        }
        
        .photo-upload-btn,
        .select-photo-btn {
          padding: 10px 20px;
          font-size: 13px;
          min-width: 120px;
        }
      }

      @media (max-width: 480px) {
        .photo-drop-zone {
          padding: 20px 12px;
        }
        
        .drop-zone-icon {
          font-size: 2em;
        }
        
        .drop-zone-main-text {
          font-size: 15px;
        }
        
        .photo-upload-btn,
        .select-photo-btn {
          width: 100%;
          padding: 12px 16px;
          font-size: 14px;
        }
        
        .photo-preview-grid {
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }
        
        .photo-preview-image {
          height: 60px;
        }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .dialog {
          width: 95vw;
          max-width: none;
          margin: 20px;
        }
        
        .dialog.enhanced-center {
          width: 95vw;
          margin: 20px;
        }
        
        .dialog-header {
          padding: 16px 20px;
        }
        
        .dialog-header h2,
        .dialog-header h3 {
          font-size: 20px;
        }
        
        .dialog-content {
          padding: 20px;
        }
        
        .dialog-actions {
          padding: 16px 20px;
          flex-direction: column;
          gap: 8px;
        }
        
        .dialog-actions button {
          width: 100%;
          margin-bottom: 0;
        }
      }

      @media (max-width: 480px) {
        .dialog {
          width: calc(100vw - 20px);
          margin: 10px;
        }
        
        .dialog.enhanced-center {
          width: calc(100vw - 20px);
          margin: 10px;
        }
        
        .dialog-header {
          padding: 12px 16px;
        }
        
        .dialog-header h2,
        .dialog-header h3 {
          font-size: 18px;
        }
        
        .dialog-content {
          padding: 16px;
        }
        
        .dialog-actions {
          padding: 12px 16px;
        }
      }
    `;

    document.head.appendChild(styleSheet);
    this.dialogStylesInjected = true;
    console.log('✅ Dialog styles dynamically injected');
  }
  

  /**
   * Show location details dialog
   * 
   * Main view popup for location details
   * adding edit/ delete buttons 8-17-2025
   * 
   * @param {Object} location - Location data
   * @param {string} position - Dialog position ('center' or 'top-right')
   */
  static showLocationDetailsDialog(location, position = 'center') {
    // Ensure dialog styles are available
    this.injectDialogStyles();
    
    const dialog = this.createDialog('location-details-dialog', 'Location Details', position);

    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3>Location Deets</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <div class="dialog-content">
        ${LocationTemplates.generateLocationDetails(location)}
      </div>
      <div class="dialog-actions">
        ${LocationPermissionService.canUserEditLocation(location) ? `
          <button class="btn-secondary btn-sm" 
                  data-action="edit" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Edit
          </button>
          <button class="btn-danger btn-sm" 
                  data-action="delete" 
                  data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
            Delete
          </button>
        ` : 'WISH I WAS'}
      </div>
    `, ['data-action', 'data-location-id']);

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
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="edit-location-form" data-place-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}">
        <div class="dialog-content">
          ${LocationTemplates.generateLocationForm(location)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Changes</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `, ['data-place-id', 'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd']);

    this.showDialog(dialog, 'enhanced-center');
    
    // Load existing photos after dialog is shown
    setTimeout(() => {
      if (window.LocationsUI && window.LocationsUI.photoManager && (location.place_id || location.id)) {
        window.LocationsUI.photoManager.loadEditFormPhotos(location.place_id || location.id);
      }
    }, 100);
  }

  /**
   * Show save location dialog
   * @param {Object} locationData - Initial location data
   */
  static showSaveLocationDialog(locationData = {}) {
    // Ensure dialog styles are available
    this.injectDialogStyles();
    
    const dialog = this.createDialog('save-location-dialog', 'Save Location', 'enhanced-center');
    
    // Debug: Log the locationData being passed to the form
    console.log('🔍 LocationDialogManager.showSaveLocationDialog() received data:', locationData);
    
    SecurityUtils.setSafeHTMLAdvanced(dialog, `
      <div class="dialog-header">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>Save New Location</h3>
        <button class="close-dialog">&times;</button>
      </div>
      <form id="save-location-form">
        <div class="dialog-content">
          ${LocationTemplates.generateLocationForm(locationData)}
        </div>
        <div class="dialog-actions">
          <button type="submit" class="primary-btn">Save Location</button>
          <button type="button" class="secondary-btn close-dialog">Cancel</button>
        </div>
      </form>
    `, ['width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd']);

    this.showDialog(dialog, 'enhanced-center');
    
    // Form submit handler is now handled by LocationEventManager document listener
    console.log('✅ GPS save dialog created - form handling delegated to LocationEventManager');
  }

  /**
   * Create a dialog element
   * @param {string} id - Dialog ID
   * @param {string} title - Dialog title
   * @param {string} position - Dialog position ('center', 'enhanced-center', or 'top-right')
   * @returns {HTMLElement} Dialog element
   */
  static createDialog(id, title, position = 'center') {
    // Remove existing dialog
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.id = id;
    
    // Apply position-specific classes - no inline styles
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
   * Show a dialog
   * @param {HTMLElement} dialog - Dialog element
   * @param {string} position - Dialog position ('center', 'enhanced-center', or 'top-right')
   */
  static showDialog(dialog, position = 'center') {
    // Create backdrop for center and enhanced-center dialogs
    if (position === 'center' || position === 'enhanced-center') {
      const backdrop = document.createElement('div');
      
      if (position === 'enhanced-center') {
        backdrop.className = 'dialog-backdrop enhanced-center';
        backdrop.dataset.dialogBackdrop = 'true';
        
        document.body.appendChild(backdrop);
        backdrop.appendChild(dialog);
        
        // Trigger animation
        setTimeout(() => {
          backdrop.style.opacity = '1';
        }, 10);
        
      } else {
        backdrop.className = 'dialog-backdrop standard';
        backdrop.dataset.dialogBackdrop = 'true';
        
        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
      }
    } else {
      // For top-right dialogs, just append to body
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
    const dialogs = document.querySelectorAll('.location-dialog, .dialog', '#location-details-dialog');
    const backdrops = document.querySelectorAll('.dialog-backdrop');
    
    dialogs.forEach(dialog => dialog.remove());
    backdrops.forEach(backdrop => backdrop.remove());
  }

  /**
   * Check if any dialog is currently open
   * @returns {boolean} True if dialog is open
   */
  static isDialogOpen() {
    return document.querySelector('.location-dialog, .dialog') !== null;
  }

  /**
   * Get the currently open dialog
   * @returns {HTMLElement|null} Dialog element or null
   */
  static getCurrentDialog() {
    return document.querySelector('.location-dialog, .dialog');
  }
}
