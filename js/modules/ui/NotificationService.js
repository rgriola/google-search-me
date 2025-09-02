/**
 * Secure Notification Service
 * Provides beautiful, non-intrusive notifications with XSS protection
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';

export class NotificationService {
  static activeNotifications = new Map();
  static initialized = false;
  static maxNotifications = 5; // Prevent notification spam

  /**
   * Initialize the notification system
   */
  static initialize() {
    if (this.initialized) return;
    
    this.initialized = true;
    console.log('✅ NotificationService initialized');
  }

  /**
   * Show a confirmation dialog with secure styling
   * @param {Object} options - Notification options
   * @param {string} options.message - The message to display (will be sanitized)
   * @param {string} options.title - Optional title (will be sanitized)
   * @param {string} options.type - 'warning', 'error', 'success', 'info'
   * @param {Function} options.onConfirm - Callback for confirm action
   * @param {Function} options.onCancel - Callback for cancel action
   * @param {string} options.confirmText - Text for confirm button (will be sanitized)
   * @param {string} options.cancelText - Text for cancel button (will be sanitized)
   */


  static async show(message, type = 'info') {
        try {
            const { AuthNotificationService } = await import('../auth/AuthNotificationService.js');
            AuthNotificationService.showNotification(message, type);
        } catch (error) {
            // Fallback to browser alert
            alert(message);
        }
    }


  static showConfirmation(options) {
    // Input validation and sanitization
    const {
      message = '',
      title = 'Confirm Action',
      type = 'warning',
      onConfirm = () => {},
      onCancel = () => {},
      confirmText = 'Confirm',
      cancelText = 'Cancel'
    } = this.validateOptions(options);

    // Sanitize all text inputs
    const safeMessage = SecurityUtils.escapeHtml(message);
    const safeTitle = SecurityUtils.escapeHtml(title);
    const safeConfirmText = SecurityUtils.escapeHtml(confirmText);
    const safeCancelText = SecurityUtils.escapeHtml(cancelText);
    const safeType = this.validateType(type);

    // Remove any existing confirmation dialogs
    this.closeConfirmation();

    // Create notification using DOM methods (not innerHTML)
    const notification = this.createConfirmationElement(
      safeMessage, 
      safeTitle, 
      safeType, 
      safeConfirmText, 
      safeCancelText,
      onConfirm,
      onCancel
    );

    // Add to page and animate
    document.body.appendChild(notification);
    
    // Trigger slide-down animation
    requestAnimationFrame(() => {
      notification.classList.add('notification-show');
    });

    return notification;
  }

  /**
   * Show a simple notification toast
   * @param {string} message - The message to display (will be sanitized)
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds (default: 4000)
   */
  static showToast(message, type = 'info', duration = 4000) {
    // Prevent notification spam
    if (this.activeNotifications.size >= this.maxNotifications) {
      console.warn('⚠️ Maximum notifications reached, ignoring new notification');
      return null;
    }

    // Input validation and sanitization
    const safeMessage = SecurityUtils.escapeHtml(message || '');
    const safeType = this.validateType(type);
    const safeDuration = this.validateDuration(duration);

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Create notification using DOM methods (not innerHTML)
    const notification = this.createToastElement(safeMessage, safeType, id);

    // Add to active notifications
    this.activeNotifications.set(id, notification);

    // Add to page
    document.body.appendChild(notification);
    
    // Trigger slide-down animation
    requestAnimationFrame(() => {
      notification.classList.add('notification-show');
    });

    // Auto-remove after duration
    if (safeDuration > 0) {
      setTimeout(() => {
        this.closeToast(id);
      }, safeDuration);
    }

    return id;
  }

  /**
   * Create confirmation dialog element using secure DOM methods
   * @private
   */
  static createConfirmationElement(message, title, type, confirmText, cancelText, onConfirm, onCancel) {
    const notification = document.createElement('div');
    notification.className = `notification-confirm notification-${type}`;
    notification.id = 'notification-confirm';
    
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'notification-header';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'notification-icon';
    iconContainer.innerHTML = this.getIconForType(type); // Icons are safe, hardcoded SVG
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'notification-title';
    titleElement.textContent = title; // Using textContent prevents XSS
    
    header.appendChild(iconContainer);
    header.appendChild(titleElement);
    
    // Create message
    const messageElement = document.createElement('p');
    messageElement.className = 'notification-message';
    messageElement.textContent = message; // Using textContent prevents XSS
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'notification-actions';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'notification-btn notification-btn-confirm';
    confirmBtn.textContent = confirmText;
    confirmBtn.setAttribute('data-action', 'confirm');
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'notification-btn notification-btn-cancel';
    cancelBtn.textContent = cancelText;
    cancelBtn.setAttribute('data-action', 'cancel');
    
    actions.appendChild(confirmBtn);
    actions.appendChild(cancelBtn);
    
    // Assemble notification
    content.appendChild(header);
    content.appendChild(messageElement);
    content.appendChild(actions);
    notification.appendChild(content);
    
    // Add secure event listeners
    notification.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action === 'confirm' && typeof onConfirm === 'function') {
        try {
          onConfirm();
        } catch (error) {
          console.error('Error in confirm callback:', error);
        }
        this.closeConfirmation();
      } else if (action === 'cancel' && typeof onCancel === 'function') {
        try {
          onCancel();
        } catch (error) {
          console.error('Error in cancel callback:', error);
        }
        this.closeConfirmation();
      }
    });
    
    return notification;
  }

  /**
   * Create toast notification element using secure DOM methods
   * @private
   */
  static createToastElement(message, type, id) {
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.id = `notification-toast-${id}`;
    
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'notification-icon';
    iconContainer.innerHTML = this.getIconForType(type); // Safe hardcoded SVG
    
    const messageElement = document.createElement('span');
    messageElement.className = 'notification-message';
    messageElement.textContent = message; // Using textContent prevents XSS
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    
    // Add secure close functionality
    closeBtn.addEventListener('click', () => {
      this.closeToast(id);
    });
    
    content.appendChild(iconContainer);
    content.appendChild(messageElement);
    content.appendChild(closeBtn);
    notification.appendChild(content);
    
    return notification;
  }

  /**
   * Validate and sanitize options object
   * @private
   */
  static validateOptions(options) {
    if (!options || typeof options !== 'object') {
      throw new Error('Invalid options provided to NotificationService');
    }

    // Validate callbacks
    if (options.onConfirm && typeof options.onConfirm !== 'function') {
      console.warn('onConfirm is not a function, using default');
      options.onConfirm = () => {};
    }
    
    if (options.onCancel && typeof options.onCancel !== 'function') {
      console.warn('onCancel is not a function, using default');
      options.onCancel = () => {};
    }

    return options;
  }

  /**
   * Validate notification type
   * @private
   */
  static validateType(type) {
    const validTypes = ['warning', 'error', 'success', 'info'];
    return validTypes.includes(type) ? type : 'info';
  }

  /**
   * Validate duration
   * @private
   */
  static validateDuration(duration) {
    const num = parseInt(duration, 10);
    return (num > 0 && num <= 30000) ? num : 4000; // Max 30 seconds
  }

  /**
   * Close confirmation dialog
   */
  static closeConfirmation() {
    const existing = document.getElementById('notification-confirm');
    if (existing) {
      existing.classList.remove('notification-show');
      setTimeout(() => {
        if (existing.parentNode) {
          existing.remove();
        }
      }, 300);
    }
  }

  /**
   * Close a specific toast notification
   * @param {string} id - Toast notification ID
   */
  static closeToast(id) {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.classList.remove('notification-show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
        this.activeNotifications.delete(id);
      }, 300);
    }
  }

  /**
   * Close all notifications
   */
  static closeAll() {
    this.closeConfirmation();
    this.activeNotifications.forEach((notification, id) => {
      this.closeToast(id);
    });
  }

  /**
   * Get safe icon for notification type
   * @param {string} type - Notification type
   * @returns {string} Safe SVG icon (hardcoded, not user input)
   * @private
   */
  static getIconForType(type) {
    const icons = {
      warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/>
        <path d="m12 17 .01 0"/>
      </svg>`,
      error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M15 9l-6 6"/>
        <path d="M9 9l6 6"/>
      </svg>`,
      success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22,4 12,14.01 9,11.01"/>
      </svg>`,
      info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>`
    };
    return icons[type] || icons.info;
  }

  /**
   * Simple notification method for compatibility
   * @param {string} message - Message to display
   * @param {string} type - Notification type
   */
  static showNotification(message, type = 'info') {
    return this.showToast(message, type);
  }
}
