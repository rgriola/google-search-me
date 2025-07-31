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
   * Inject CSS styles for notifications
   */
  static injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Confirmation Dialog Styles */
      .notification-confirm {
        position: fixed;
        top: -300px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        max-width: 480px;
        width: 90%;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid #e0e0e0;
      }

      .notification-confirm.notification-show {
        top: 20px;
      }

      .notification-confirm.notification-warning {
        border-left: 5px solid #ff9800;
      }

      .notification-confirm.notification-error {
        border-left: 5px solid #f44336;
      }

      .notification-confirm.notification-success {
        border-left: 5px solid #4caf50;
      }

      .notification-confirm.notification-info {
        border-left: 5px solid #2196f3;
      }

      .notification-content {
        padding: 24px;
      }

      .notification-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }

      .notification-icon {
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .notification-warning .notification-icon {
        background: #fff3e0;
        color: #ff9800;
      }

      .notification-error .notification-icon {
        background: #ffebee;
        color: #f44336;
      }

      .notification-success .notification-icon {
        background: #e8f5e8;
        color: #4caf50;
      }

      .notification-info .notification-icon {
        background: #e3f2fd;
        color: #2196f3;
      }

      .notification-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .notification-message {
        margin: 0 0 20px 0;
        font-size: 14px;
        line-height: 1.5;
        color: #666;
      }

      .notification-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .notification-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
      }

      .notification-btn-confirm {
        background: #f44336;
        color: white;
      }

      .notification-btn-confirm:hover {
        background: #d32f2f;
        transform: translateY(-1px);
      }

      .notification-btn-cancel {
        background: #f5f5f5;
        color: #666;
      }

      .notification-btn-cancel:hover {
        background: #e0e0e0;
        color: #333;
      }

      /* Toast Notification Styles */
      .notification-toast {
        position: fixed;
        top: -100px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        min-width: 300px;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border-left: 4px solid #2196f3;
      }

      .notification-toast.notification-show {
        top: 20px;
      }

      .notification-toast.notification-warning {
        border-left-color: #ff9800;
      }

      .notification-toast.notification-error {
        border-left-color: #f44336;
      }

      .notification-toast.notification-success {
        border-left-color: #4caf50;
      }

      .notification-toast .notification-content {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .notification-toast .notification-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      .notification-toast .notification-message {
        flex: 1;
        margin: 0;
        font-size: 14px;
        color: #333;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .notification-close:hover {
        background: #f0f0f0;
        color: #666;
      }

      /* Mobile responsiveness */
      @media (max-width: 480px) {
        .notification-confirm {
          width: 95%;
          margin: 0 2.5%;
        }
        
        .notification-toast {
          right: 10px;
          left: 10px;
          max-width: none;
          min-width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
