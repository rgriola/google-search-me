/**
 * Photo Display Service
 * Handles photo display with captions for locations
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';

export class PhotoDisplayService {
  
  /**
   * Load and display photos for a location
   * @param {string} placeId - Google Place ID
   * @param {HTMLElement} container - Container element to display photos
   * @param {Object} options - Display options
   * @returns {Promise<Array>} Array of photos loaded
   */
  static async loadAndDisplayPhotos(placeId, container, options = {}) {
    const defaultOptions = {
      showCaptions: true,
      showPrimaryBadge: true,
      showUploader: true,
      clickable: true,
      layout: 'grid', // 'grid', 'horizontal', 'single'
      imageSize: 'card', // 'thumbnail', 'card', 'large'
      emptyMessage: 'No photos available for this location',
      maxPhotos: null // null = show all
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      // Show loading state
      this.showLoadingState(container);
      
      // Load photos from API
      const photos = await this.loadLocationPhotos(placeId);
      
      // Apply max photos limit if specified
      const displayPhotos = config.maxPhotos ? photos.slice(0, config.maxPhotos) : photos;
      
      // Display photos
      this.displayPhotos(displayPhotos, container, config);
      
      return photos;
      
    } catch (error) {
      console.error('Error loading photos:', error);
      this.showErrorState(container, `Error loading photos: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Load photos from API
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Array>} Array of photo objects
   */
  static async loadLocationPhotos(placeId) {
    const response = await fetch(`/api/photos/location/${encodeURIComponent(placeId)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to load photos');
    }
    
    return data.data || [];
  }
  
  /**
   * Display photos in container
   * @param {Array} photos - Array of photo objects
   * @param {HTMLElement} container - Container element
   * @param {Object} config - Display configuration
   */
  static displayPhotos(photos, container, config) {
    if (!photos || photos.length === 0) {
      this.showEmptyState(container, config.emptyMessage);
      return;
    }
    
    const layoutClass = this.getLayoutClass(config.layout);
    
    SecurityUtils.setSafeHTMLAdvanced(container, `
      <div class="${layoutClass}">
        ${photos.map((photo, index) => this.createPhotoCard(photo, index, config)).join('')}
      </div>
    `, ['src', 'alt', 'data-photo-id', 'data-index']);
    
    // Add click handlers if clickable
    if (config.clickable) {
      this.attachClickHandlers(container, photos);
    }
  }
  
  /**
   * Create HTML for a single photo card
   * @param {Object} photo - Photo object
   * @param {number} index - Photo index
   * @param {Object} config - Display configuration
   * @returns {string} HTML string
   */
  static createPhotoCard(photo, index, config) {
    const imageUrl = photo.urls[config.imageSize] || photo.urls.card;
    const clickableClass = config.clickable ? 'photo-clickable' : '';
    
    return `
      <div class="photo-card ${SecurityUtils.escapeHtml(clickableClass)}" data-photo-index="${SecurityUtils.escapeHtmlAttribute(index.toString())}">
        <div class="photo-image-container">
          <img src="${SecurityUtils.escapeHtmlAttribute(imageUrl)}" 
               alt="${SecurityUtils.escapeHtmlAttribute(photo.caption || 'Location photo')}" 
               loading="lazy"
               class="photo-image">
          ${photo.is_primary && config.showPrimaryBadge ? 
            '<div class="photo-primary-badge">★</div>' : ''}
        </div>
        ${config.showCaptions || config.showUploader ? `
          <div class="photo-info">
            ${config.showCaptions ? `
              <div class="photo-caption ${photo.caption ? '' : 'empty'}">
                ${SecurityUtils.escapeHtml(photo.caption) || '<em>No caption</em>'}
              </div>
            ` : ''}
            ${config.showUploader ? `
              <div class="photo-uploader">
                By: ${SecurityUtils.escapeHtml(photo.uploaded_by_username || 'Unknown')}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Get CSS class for layout type
   * @param {string} layout - Layout type
   * @returns {string} CSS class name
   */
  static getLayoutClass(layout) {
    const layouts = {
      'grid': 'photos-grid',
      'horizontal': 'photos-horizontal',
      'single': 'photos-single'
    };
    return layouts[layout] || 'photos-grid';
  }
  
  /**
   * Attach click handlers to photos
   * @param {HTMLElement} container - Container element
   * @param {Array} photos - Array of photo objects
   */
  static attachClickHandlers(container, photos) {
    const photoCards = container.querySelectorAll('.photo-clickable');
    
    photoCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const photoIndex = parseInt(card.dataset.photoIndex);
        this.openPhotoModal(photos[photoIndex], photos);
      });
    });
  }
  
  /**
   * Open photo in modal
   * @param {Object} photo - Photo object
   * @param {Array} allPhotos - All photos for navigation
   */
  static openPhotoModal(photo, allPhotos = []) {
    // Remove existing modal if any
    const existingModal = document.getElementById('photo-display-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'photo-display-modal';
    modal.className = 'photo-modal';
    
    SecurityUtils.setSafeHTMLAdvanced(modal, `
      <div class="photo-modal-content">
        <button class="photo-modal-close" aria-label="Close">&times;</button>
        <div class="photo-modal-image-container">
          <img src="${SecurityUtils.escapeHtmlAttribute(photo.urls.large)}" 
               alt="${SecurityUtils.escapeHtmlAttribute(photo.caption || 'Location photo')}"
               class="photo-modal-image">
        </div>
        <div class="photo-modal-info">
          <div class="photo-modal-caption">
            ${photo.caption ? 
              `<strong>Caption:</strong> ${SecurityUtils.escapeHtml(photo.caption)}` : 
              '<em style="color: #999;">No caption provided</em>'}
          </div>
          <div class="photo-modal-meta">
            <span>Uploaded by: ${SecurityUtils.escapeHtml(photo.uploaded_by_username || 'Unknown')}</span>
            ${photo.is_primary ? '<span class="primary-badge">★ Primary</span>' : ''}
          </div>
        </div>
      </div>
      <div class="photo-modal-overlay"></div>
    `, ['src', 'alt', 'aria-label']);
    
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Add event listeners
    this.attachModalHandlers(modal);
  }
  
  /**
   * Attach modal event handlers
   * @param {HTMLElement} modal - Modal element
   */
  static attachModalHandlers(modal) {
    const closeBtn = modal.querySelector('.photo-modal-close');
    const overlay = modal.querySelector('.photo-modal-overlay');
    
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Keyboard handling
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', keyHandler);
      }
    };
    
    document.addEventListener('keydown', keyHandler);
  }
  
  /**
   * Show loading state
   * @param {HTMLElement} container - Container element
   */
  static showLoadingState(container) {
    SecurityUtils.setSafeHTML(container, `
      <div class="photos-loading">
        <div class="loading-spinner"></div>
        <p>Loading photos...</p>
      </div>
    `);
  }
  
  /**
   * Show empty state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Empty state message
   */
  static showEmptyState(container, message) {
    SecurityUtils.setSafeHTML(container, `
      <div class="photos-empty">
        <div class="photos-empty-icon">📷</div>
        <p>${SecurityUtils.escapeHtml(message)}</p>
      </div>
    `);
  }
  
  /**
   * Show error state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Error message
   */
  static showErrorState(container, message) {
    SecurityUtils.setSafeHTML(container, `
      <div class="photos-error">
        <div class="photos-error-icon">⚠️</div>
        <p>${SecurityUtils.escapeHtml(message)}</p>
        <button class="retry-btn" data-action="reload">Retry</button>
      </div>
    `);
    
    // Add event listener for retry button
    const retryBtn = container.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }
  
  /**
   * Create compact photo display for location cards
   * @param {string} placeId - Google Place ID
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Display options
   */
  static async createCompactPhotoDisplay(placeId, container, options = {}) {
    const config = {
      maxPhotos: 3,
      showCaptions: false,
      showUploader: false,
      layout: 'horizontal',
      imageSize: 'thumbnail',
      clickable: true,
      emptyMessage: 'No photos',
      ...options
    };
    
    return this.loadAndDisplayPhotos(placeId, container, config);
  }
  
  /**
   * CSS styles are now in external stylesheet for CSP compliance
   * @deprecated - Styles moved to css/styles.css
   */
  static injectStyles() {
    // CSP Compliance: Styles moved to external CSS file
    // All photo display styles are now in css/styles.css
    return;
  }
}

// Auto-inject styles when module is loaded
PhotoDisplayService.injectStyles();
