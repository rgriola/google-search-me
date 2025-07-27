/**
 * Authentication Notification Service
 * Handles notifications, error messages, banners, and user feedback
 */

/**
 * Authentication Notification Service Class
 */
export class AuthNotificationService {

  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   */
  static showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.getElementById('authNotification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'authNotification';
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Show form validation errors
   * @param {Object|Array} errors - Error messages to display
   */
  static showFormErrors(errors) {
    // Clear existing errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });

    if (!errors) return;

    // Handle different error formats
    if (typeof errors === 'string') {
      errors = { general: errors };
    } else if (Array.isArray(errors)) {
      errors = { general: errors.join(', ') };
    }

    // Display errors
    Object.entries(errors).forEach(([field, message]) => {
      // Try to find field-specific error element
      const fieldError = document.getElementById(`${field}Error`);
      
      if (fieldError) {
        fieldError.textContent = message;
        fieldError.style.display = 'block';
      } else {
        // Fallback to general error display
        const generalError = document.querySelector('.error-message');
        if (generalError) {
          generalError.textContent = message;
          generalError.style.display = 'block';
        } else {
          // Show as notification if no error containers found
          this.showNotification(message, 'error');
        }
      }
    });
  }

  /**
   * Check console for verification link (development helper)
   */
  static checkConsoleForVerificationLink() {
    this.showNotification(
      'Development Mode: Check browser console for email verification link',
      'info'
    );
  }

  /**
   * Show email verification banner
   */
  static showEmailVerificationBanner() {
    // Remove existing banner
    this.hideEmailVerificationBanner();

    const banner = document.createElement('div');
    banner.id = 'emailVerificationBanner';
    banner.className = 'verification-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <div class="banner-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <div class="banner-message">
          <strong>Please verify your email address</strong>
          <p>We've sent a verification link to your email. Click the link to activate your account.</p>
        </div>
        <div class="banner-actions">
          <button id="resendVerificationBtn" class="btn-link">Resend Email</button>
          <button id="closeBannerBtn" class="btn-link">&times;</button>
        </div>
      </div>
    `;

    // Insert at top of page
    document.body.insertBefore(banner, document.body.firstChild);

    // Add event listeners
    document.getElementById('closeBannerBtn')?.addEventListener('click', () => {
      this.hideEmailVerificationBanner();
    });

    document.getElementById('resendVerificationBtn')?.addEventListener('click', async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          this.showNotification('Please log in to resend verification email', 'error');
          return;
        }

        const response = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          this.showNotification('Verification email sent! Please check your inbox.', 'success');
        } else {
          const error = await response.json();
          this.showNotification(error.error || 'Failed to resend verification email', 'error');
        }
      } catch (error) {
        console.error('Resend verification error:', error);
        this.showNotification('Failed to resend verification email', 'error');
      }
    });
  }

  /**
   * Hide email verification banner
   */
  static hideEmailVerificationBanner() {
    const banner = document.getElementById('emailVerificationBanner');
    if (banner) {
      banner.remove();
    }
  }

  /**
   * Show success message for successful operations
   * @param {string} message - Success message
   */
  static showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message for failed operations  
   * @param {string} message - Error message
   */
  static showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  static showWarning(message) {
    this.showNotification(message, 'warning');
  }

  /**
   * Show info message
   * @param {string} message - Info message
   */
  static showInfo(message) {
    this.showNotification(message, 'info');
  }

  /**
   * Clear all notifications and error messages
   */
  static clearAll() {
    // Remove notifications
    const notifications = document.querySelectorAll('#authNotification');
    notifications.forEach(notification => notification.remove());

    // Clear form errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });

    // Hide verification banner
    this.hideEmailVerificationBanner();
  }

  /**
   * Show custom dialog with HTML content
   * @param {string} htmlContent - HTML content for the dialog
   */
  static showCustomDialog(htmlContent) {
    // Remove existing dialogs
    const existingDialog = document.querySelector('.custom-auth-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }

    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-auth-dialog';
    overlay.innerHTML = `
      <div class="dialog-overlay" onclick="this.parentElement.remove()">
        <div class="dialog-content" onclick="event.stopPropagation()">
          ${htmlContent}
        </div>
      </div>
    `;

    // Add styles if not already present
    if (!document.querySelector('#customDialogStyles')) {
      const styles = document.createElement('style');
      styles.id = 'customDialogStyles';
      styles.textContent = `
        .custom-auth-dialog {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
        }
        .dialog-overlay {
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dialog-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .email-exists-dialog h3 {
          color: #dc3545;
          margin-bottom: 15px;
        }
        .email-exists-dialog p {
          margin-bottom: 15px;
          color: #666;
        }
        .dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 20px;
        }
        .dialog-actions .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: #007bff;
          color: white;
        }
        .btn-primary:hover {
          background: #0056b3;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn-secondary:hover {
          background: #545b62;
        }
        .btn-outline {
          background: transparent;
          color: #007bff;
          border: 1px solid #007bff;
        }
        .btn-outline:hover {
          background: #007bff;
          color: white;
        }
      `;
      document.head.appendChild(styles);
    }

    // Add to page
    document.body.appendChild(overlay);
  }

  /**
   * Hide form errors (alias for clearing form errors)
   */
  static hideFormErrors() {
    this.clearAll();
  }
}
