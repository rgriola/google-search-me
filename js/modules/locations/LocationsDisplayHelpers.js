/**
 * Locations Display Helpers
 * Handles UI display elements, cards, states, and visual feedback
 */

/**
 * Locations Display Helpers Class
 */
export class LocationsDisplayHelpers {

  /**
   * Generate location card HTML for display in lists
   * @param {Object} location - Location data
   * @returns {string} HTML string for location card
   */
  static generateLocationCardHTML(location) {
    const formatValue = (value) => value || '';
    const truncate = (text, length = 100) => {
      if (!text || text.length <= length) return text || '';
      return text.substring(0, length) + '...';
    };

    return `
      <div class="location-card" data-location-id="${location.id}" style="
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
        
        <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 18px;">${formatValue(location.name)}</h4>
            ${location.type ? `<span style="background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-block; margin-bottom: 8px;">${location.type}</span>` : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="view-location-btn" data-location-id="${location.id}" style="
              background: #4285f4;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            " onclick="event.stopPropagation();">View</button>
            <button class="delete-location-btn" data-location-id="${location.id}" style="
              background: #f44336;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            " onclick="event.stopPropagation();">Delete</button>
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <p style="margin: 0; color: #666; font-size: 14px;">${truncate(location.description, 150)}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #666;">
          <div>
            <strong>Address:</strong> ${truncate(location.address, 50)}
          </div>
          <div>
            <strong>City:</strong> ${formatValue(location.city)}${location.state ? `, ${location.state}` : ''}
          </div>
        </div>
        
        ${location.entry_point || location.parking || location.access ? `
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            ${location.entry_point ? `<div><strong>Entry:</strong> ${truncate(location.entry_point, 60)}</div>` : ''}
            ${location.parking ? `<div><strong>Parking:</strong> ${truncate(location.parking, 60)}</div>` : ''}
            ${location.access ? `<div><strong>Access:</strong> ${truncate(location.access, 60)}</div>` : ''}
          </div>
        ` : ''}
        
        <div style="margin-top: 10px; font-size: 11px; color: #999;">
          Created: ${new Date(location.created_at).toLocaleDateString()}
        </div>
      </div>
    `;
  }

  /**
   * Update location card in DOM
   * @param {Object} location - Updated location data
   */
  static updateLocationCard(location) {
    const card = document.querySelector(`[data-location-id="${location.id}"]`);
    if (card) {
      const newHTML = this.generateLocationCardHTML(location);
      card.outerHTML = newHTML;
      
      // Re-attach event listeners for the new card
      import('./LocationsEventHandlers.js').then(({ LocationsEventHandlers }) => {
        LocationsEventHandlers.attachLocationCardListeners();
      });
    }
  }

  /**
   * Remove location card from DOM
   * @param {string|number} locationId - Location ID to remove
   */
  static removeLocationCard(locationId) {
    const card = document.querySelector(`[data-location-id="${locationId}"]`);
    if (card) {
      card.remove();
    }
  }

  /**
   * Show loading state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Loading message
   */
  static showLoadingState(container, message = 'Loading...') {
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Error message
   */
  static showErrorState(container, message = 'An error occurred') {
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <p>⚠️ ${message}</p>
          <button class="retry-btn" onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }

  /**
   * Show empty state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Empty state message
   */
  static showEmptyState(container, message = 'No locations found') {
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-message">📍 ${message}</p>
          <p class="empty-hint">Start by searching for a location on the map and saving it.</p>
        </div>
      `;
    }
  }

  /**
   * Scroll element into view smoothly
   * @param {HTMLElement} element - Element to scroll to
   */
  static scrollToElement(element) {
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  /**
   * Highlight element temporarily
   * @param {HTMLElement} element - Element to highlight
   * @param {number} duration - Highlight duration in ms
   */
  static highlightElement(element, duration = 2000) {
    if (!element) return;
    
    const originalBackground = element.style.background;
    element.style.background = '#fff3cd';
    element.style.transition = 'background 0.3s ease';
    
    setTimeout(() => {
      element.style.background = originalBackground;
    }, duration);
  }

  /**
   * Update save button state
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
   * Create location summary card
   * @param {Object} location - Location data
   * @returns {string} HTML for summary card
   */
  static createLocationSummaryCard(location) {
    const formatValue = (value) => value || 'Not specified';
    
    return `
      <div class="location-summary-card" style="
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
      ">
        <h4 style="margin: 0 0 10px 0; color: #333;">${location.name || 'Unnamed Location'}</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
          <div><strong>Type:</strong> ${formatValue(location.type)}</div>
          <div><strong>City:</strong> ${formatValue(location.city)}</div>
          <div><strong>Address:</strong> ${formatValue(location.address)}</div>
          <div><strong>Created:</strong> ${location.created_at ? new Date(location.created_at).toLocaleDateString() : 'Unknown'}</div>
        </div>
      </div>
    `;
  }

  /**
   * Create location statistics display
   * @param {Object} stats - Statistics object
   * @returns {string} HTML for statistics display
   */
  static createLocationStatsDisplay(stats) {
    return `
      <div class="location-stats" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      ">
        <div class="stat-card" style="
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${stats.totalLocations || 0}</div>
          <div style="font-size: 14px; color: #666;">Total Locations</div>
        </div>
        
        <div class="stat-card" style="
          background: #e8f5e8;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${stats.categoriesCount || 0}</div>
          <div style="font-size: 14px; color: #666;">Categories</div>
        </div>
        
        <div class="stat-card" style="
          background: #fff3e0;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${stats.typesCount || 0}</div>
          <div style="font-size: 14px; color: #666;">Types</div>
        </div>
        
        <div class="stat-card" style="
          background: #f3e5f5;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        ">
          <div style="font-size: 24px; font-weight: bold; color: #7b1fa2;">${stats.creatorsCount || 0}</div>
          <div style="font-size: 14px; color: #666;">Creators</div>
        </div>
      </div>
    `;
  }

  /**
   * Create progress bar
   * @param {number} percentage - Progress percentage (0-100)
   * @param {string} color - Progress bar color
   * @param {string} label - Progress label
   * @returns {string} HTML for progress bar
   */
  static createProgressBar(percentage, color = '#4285f4', label = '') {
    return `
      <div class="progress-container" style="margin-bottom: 10px;">
        ${label ? `<div style="margin-bottom: 5px; font-size: 14px; color: #666;">${label}</div>` : ''}
        <div style="
          background: #f0f0f0;
          border-radius: 10px;
          height: 20px;
          overflow: hidden;
        ">
          <div style="
            background: ${color};
            height: 100%;
            width: ${Math.min(100, Math.max(0, percentage))}%;
            transition: width 0.3s ease;
            border-radius: 10px;
          "></div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #666; margin-top: 2px;">
          ${Math.round(percentage)}%
        </div>
      </div>
    `;
  }

  /**
   * Create notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Auto-hide duration in ms (0 for persistent)
   * @returns {HTMLElement} Notification element
   */
  static createNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove();">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-hide if duration is specified
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, duration);
    }

    return notification;
  }

  /**
   * Create tooltip
   * @param {HTMLElement} element - Element to attach tooltip to
   * @param {string} text - Tooltip text
   * @param {string} position - Tooltip position (top, bottom, left, right)
   */
  static createTooltip(element, text, position = 'top') {
    if (!element) return;

    let tooltip = null;

    const showTooltip = () => {
      tooltip = document.createElement('div');
      tooltip.textContent = text;
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10003;
        pointer-events: none;
      `;

      document.body.appendChild(tooltip);

      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      switch (position) {
        case 'top':
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
          break;
        case 'bottom':
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${rect.bottom + 8}px`;
          break;
        case 'left':
          tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
        case 'right':
          tooltip.style.left = `${rect.right + 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
      }
    };

    const hideTooltip = () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    };

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
  }

  /**
   * Format date for display
   * @param {string|Date} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date string
   */
  static formatDate(date, options = {}) {
    if (!date) return 'Unknown';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', formatOptions);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
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
}

// Export individual functions for backward compatibility
export const generateLocationCardHTML = LocationsDisplayHelpers.generateLocationCardHTML.bind(LocationsDisplayHelpers);
export const updateLocationCard = LocationsDisplayHelpers.updateLocationCard.bind(LocationsDisplayHelpers);
export const removeLocationCard = LocationsDisplayHelpers.removeLocationCard.bind(LocationsDisplayHelpers);
export const showLoadingState = LocationsDisplayHelpers.showLoadingState.bind(LocationsDisplayHelpers);
export const showErrorState = LocationsDisplayHelpers.showErrorState.bind(LocationsDisplayHelpers);
export const showEmptyState = LocationsDisplayHelpers.showEmptyState.bind(LocationsDisplayHelpers);
export const scrollToElement = LocationsDisplayHelpers.scrollToElement.bind(LocationsDisplayHelpers);
export const highlightElement = LocationsDisplayHelpers.highlightElement.bind(LocationsDisplayHelpers);
export const updateSaveButtonState = LocationsDisplayHelpers.updateSaveButtonState.bind(LocationsDisplayHelpers);
