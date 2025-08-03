/**
 * Elegant Notification Service
 * Provides beautiful, non-intrusive notifications that slide down from the top
 */

export class NotificationService {
  static activeNotifications = new Map();
  static initialized = false;

  /**
   * Initialize the notification system
   */
  static initialize() {
    if (this.initialized) return;
    
    // Add CSS styles for notifications
    this.injectStyles();
    this.initialized = true;
    console.log('✅ NotificationService initialized');
  }

  /**
   * Show a confirmation dialog with elegant styling
   * @param {Object} options - Notification options
   * @param {string} options.message - The message to display
   * @param {string} options.title - Optional title
   * @param {string} options.type - 'warning', 'error', 'success', 'info'
   * @param {Function} options.onConfirm - Callback for confirm action
   * @param {Function} options.onCancel - Callback for cancel action
   * @param {string} options.confirmText - Text for confirm button (default: 'Confirm')
   * @param {string} options.cancelText - Text for cancel button (default: 'Cancel')
   */
  static showConfirmation(options) {
    const {
      message,
      title = 'Confirm Action',
      type = 'warning',
      onConfirm = () => {},
      onCancel = () => {},
      confirmText = 'Confirm',
      cancelText = 'Cancel'
    } = options;

    // Remove any existing confirmation dialogs
    this.closeConfirmation();

    const notification = document.createElement('div');
    notification.className = `notification-confirm notification-${type}`;
    notification.id = 'notification-confirm';
    
    const icon = this.getIconForType(type);
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <div class="notification-icon">${icon}</div>
          <h3 class="notification-title">${title}</h3>
        </div>
        <p class="notification-message">${message}</p>
        <div class="notification-actions">
          <button class="notification-btn notification-btn-confirm" data-action="confirm">
            ${confirmText}
          </button>
          <button class="notification-btn notification-btn-cancel" data-action="cancel">
            ${cancelText}
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    notification.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action === 'confirm') {
        onConfirm();
        this.closeConfirmation();
      } else if (action === 'cancel') {
        onCancel();
        this.closeConfirmation();
      }
    });

    // Add to page
    document.body.appendChild(notification);
    
    // Trigger slide-down animation
    setTimeout(() => {
      notification.classList.add('notification-show');
    }, 10);

    return notification;
  }

  /**
   * Show a simple notification toast
   * @param {string} message - The message to display
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds (default: 4000)
   */
  static showToast(message, type = 'info', duration = 4000) {
    const id = Date.now().toString();
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.id = `notification-toast-${id}`;
    
    const icon = this.getIconForType(type);
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${icon}</div>
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close">&times;</button>
      </div>
    `;

    // Add close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.closeToast(id);
    });

    // Add to active notifications
    this.activeNotifications.set(id, notification);

    // Add to page
    document.body.appendChild(notification);
    
    // Trigger slide-down animation
    setTimeout(() => {
      notification.classList.add('notification-show');
    }, 10);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.closeToast(id);
      }, duration);
    }

    return id;
  }

  /**
   * Close confirmation dialog
   */
  static closeConfirmation() {
    const existing = document.getElementById('notification-confirm');
    if (existing) {
      existing.classList.remove('notification-show');
      setTimeout(() => {
        existing.remove();
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
        notification.remove();
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
   * Get icon for notification type
   * @param {string} type - Notification type
   * @returns {string} SVG icon
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
   * CSS styles are now in external stylesheet for CSP compliance
   * @deprecated - Styles moved to css/styles.css
   */
  static injectStyles() {
    // CSP Compliance: Styles moved to external CSS file
    // All notification styles are now in css/styles.css
    return;
  }
}
