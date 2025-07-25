/**
 * Photo Display Service
 * Handles photo display with captions for locations
 */

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
    
    container.innerHTML = `
      <div class="${layoutClass}">
        ${photos.map((photo, index) => this.createPhotoCard(photo, index, config)).join('')}
      </div>
    `;
    
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
      <div class="photo-card ${clickableClass}" data-photo-index="${index}">
        <div class="photo-image-container">
          <img src="${imageUrl}" 
               alt="${this.escapeHtml(photo.caption || 'Location photo')}" 
               loading="lazy"
               class="photo-image">
          ${photo.is_primary && config.showPrimaryBadge ? 
            '<div class="photo-primary-badge">★</div>' : ''}
        </div>
        ${config.showCaptions || config.showUploader ? `
          <div class="photo-info">
            ${config.showCaptions ? `
              <div class="photo-caption ${photo.caption ? '' : 'empty'}">
                ${this.escapeHtml(photo.caption) || '<em>No caption</em>'}
              </div>
            ` : ''}
            ${config.showUploader ? `
              <div class="photo-uploader">
                By: ${this.escapeHtml(photo.uploaded_by_username || 'Unknown')}
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
    
    modal.innerHTML = `
      <div class="photo-modal-content">
        <button class="photo-modal-close" aria-label="Close">&times;</button>
        <div class="photo-modal-image-container">
          <img src="${photo.urls.large}" 
               alt="${this.escapeHtml(photo.caption || 'Location photo')}"
               class="photo-modal-image">
        </div>
        <div class="photo-modal-info">
          <div class="photo-modal-caption">
            ${photo.caption ? 
              `<strong>Caption:</strong> ${this.escapeHtml(photo.caption)}` : 
              '<em style="color: #999;">No caption provided</em>'}
          </div>
          <div class="photo-modal-meta">
            <span>Uploaded by: ${this.escapeHtml(photo.uploaded_by_username || 'Unknown')}</span>
            ${photo.is_primary ? '<span class="primary-badge">★ Primary</span>' : ''}
          </div>
        </div>
      </div>
      <div class="photo-modal-overlay"></div>
    `;
    
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
    container.innerHTML = `
      <div class="photos-loading">
        <div class="loading-spinner"></div>
        <p>Loading photos...</p>
      </div>
    `;
  }
  
  /**
   * Show empty state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Empty state message
   */
  static showEmptyState(container, message) {
    container.innerHTML = `
      <div class="photos-empty">
        <div class="photos-empty-icon">📷</div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
  }
  
  /**
   * Show error state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Error message
   */
  static showErrorState(container, message) {
    container.innerHTML = `
      <div class="photos-error">
        <div class="photos-error-icon">⚠️</div>
        <p>${this.escapeHtml(message)}</p>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
  
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
   * Add CSS styles to document if not already present
   */
  static injectStyles() {
    if (document.getElementById('photo-display-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'photo-display-styles';
    styles.textContent = `
      /* Photo Display Styles */
      .photos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
        margin: 10px 0;
      }
      
      .photos-horizontal {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 10px 0;
      }
      
      .photos-horizontal .photo-card {
        flex: 0 0 auto;
        width: 150px;
      }
      
      .photos-single {
        display: flex;
        justify-content: center;
        margin: 15px 0;
      }
      
      .photo-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }
      
      .photo-clickable {
        cursor: pointer;
      }
      
      .photo-clickable:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .photo-image-container {
        position: relative;
        overflow: hidden;
      }
      
      .photo-image {
        width: 100%;
        height: 150px;
        object-fit: cover;
        transition: transform 0.2s ease;
      }
      
      .photo-clickable:hover .photo-image {
        transform: scale(1.05);
      }
      
      .photo-primary-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ffc107;
        color: #333;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .photo-info {
        padding: 10px;
      }
      
      .photo-caption {
        font-size: 13px;
        color: #333;
        margin-bottom: 5px;
        line-height: 1.4;
      }
      
      .photo-caption.empty {
        color: #999;
        font-style: italic;
      }
      
      .photo-uploader {
        font-size: 11px;
        color: #666;
      }
      
      /* Loading, Empty, Error States */
      .photos-loading,
      .photos-empty,
      .photos-error {
        text-align: center;
        padding: 20px;
        color: #666;
      }
      
      .photos-empty-icon,
      .photos-error-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }
      
      .loading-spinner {
        border: 2px solid #f3f3f3;
        border-top: 2px solid #4285f4;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .retry-btn {
        background: #4285f4;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      }
      
      /* Photo Modal */
      .photo-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .photo-modal.show {
        opacity: 1;
        visibility: visible;
      }
      
      .photo-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
      }
      
      .photo-modal-content {
        position: relative;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 90vw;
        max-height: 90vh;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      
      .photo-modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(0,0,0,0.7);
        color: white;
        border: none;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        z-index: 1001;
        transition: background 0.2s ease;
      }
      
      .photo-modal-close:hover {
        background: rgba(0,0,0,0.9);
      }
      
      .photo-modal-image {
        width: 100%;
        max-height: 60vh;
        object-fit: contain;
      }
      
      .photo-modal-info {
        padding: 20px;
      }
      
      .photo-modal-caption {
        font-size: 16px;
        margin-bottom: 10px;
        line-height: 1.4;
      }
      
      .photo-modal-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #eee;
        padding-top: 10px;
      }
      
      .primary-badge {
        background: #ffc107;
        color: #333;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .photos-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .photo-modal-content {
          max-width: 95vw;
          max-height: 95vh;
        }
        
        .photo-modal-info {
          padding: 15px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Auto-inject styles when module is loaded
PhotoDisplayService.injectStyles();
