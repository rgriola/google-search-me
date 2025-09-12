/**
 * Authentication Modal Service
 * Handles auth modals, forms, and modal-related UI interactions
 */

import { StateManager } from '../state/AppState.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

/**
 * Authentication Modal Service Class
 */
export class AuthModalService {

  /**
   * Show authentication modal
   * @param {string} mode - Modal mode ('login', 'register', 'forgotPassword')
   */
  static showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const modalContent = document.getElementById('authModalContent');
    
    if (!modal || !modalContent) {
      console.error('Auth modal elements not found');
      return;
    }

    // Get the appropriate form HTML based on mode
    let formHTML = '';
    switch (mode) {
      case 'register':
        formHTML = this.getRegisterFormHTML();
        break;
      case 'forgotPassword':
        formHTML = this.getForgotPasswordFormHTML();
        break;
      default:
        formHTML = this.getLoginFormHTML();
    }

    modalContent.innerHTML = formHTML;
    modal.style.display = 'block';

    // Setup event delegation for modal actions
    this.setupModalEventDelegation(modal);

    // Focus on first input
    setTimeout(() => {
      const firstInput = modalContent.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  /**
   * Hide authentication modal
   */
  static hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

 /**
   * Show profile modal
   */
  static async showProfileModal() {
    console.log('🎭 auth.AuthModalService.showProfileModal() called');
    
    const authState = StateManager.getAuthState();
    let user = authState?.currentUser;
    
    console.log('🔍 Auth state:', authState);
    console.log('👤 Current user:', user);
    
    if (!user) {
      console.error('❌ No user data available for profile');
      return;
    }

    const modal = document.getElementById('profileModal');
    console.log('🔍 Profile modal found:', !!modal);
    
    if (!modal) {
      console.error('❌ Profile modal not found in DOM');
      return;
    }

    // Reset modal to clean state before showing
    this.resetProfileModal();

    // Refresh user data from server to ensure we have firstName/lastName
    try {
      const { AuthService } = await import('./AuthService.js');
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('🔄 Refreshed user data from server:', data.user);
          user = data.user;
          
          // Update the state with fresh user data
          StateManager.setAuthState({
            user: data.user,
            token: authState.authToken,
            userId: data.user.id
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not refresh user data from server:', error);
      // Continue with existing user data
     }

    // Populate profile form with user data (refreshed or existing)
    this.populateProfileForm(user);

    // Setup profile form submission handler
    this.setupProfileFormHandler();

    // Show the modal
    modal.style.display = 'block';
    console.log('✅ Profile modal displayed');
  }

   /**
   * Reset profile modal to clean state
   */
  static resetProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    console.log('🧹 Resetting profile modal to clean state...');
    
    // Clear all dynamic messages (success/error notifications)
    const dynamicMessages = modal.querySelectorAll('[id*="password-"], [id*="Success"], [id*="Error"], .success-message, .error-message');
    dynamicMessages.forEach(element => {
      console.log('🗑️ Removing dynamic element:', element.id || element.className);
      element.remove();
    });
    
    // Clear any temporary divs with success/error styling
    const tempMessages = modal.querySelectorAll('div[style*="background-color: #d4edda"], div[style*="background-color: #f8d7da"]');
    tempMessages.forEach(element => {
      console.log('🗑️ Removing temporary message element');
      element.remove();
    });
    
    // Reset form validation states
    const inputs = modal.querySelectorAll('input');
    inputs.forEach(input => {
      input.style.borderColor = '';
      input.style.backgroundColor = '';
      input.style.boxShadow = '';
    });
    
    // Reset password strength indicators
    const strengthBar = modal.querySelector('#passwordStrengthBar');
    const strengthText = modal.querySelector('#passwordStrengthText');
    if (strengthBar) {
      strengthBar.style.width = '0%';
      strengthBar.style.backgroundColor = '';
    }
    if (strengthText) {
      strengthText.innerHTML = '<span style="color: #6c757d;">Password strength will appear here</span>';
    }
    
    // Reset requirement indicators to default state
    const requirements = modal.querySelectorAll('.requirement-icon');
    requirements.forEach(icon => {
      icon.textContent = '⚪';
      if (icon.parentElement) {
        icon.parentElement.style.color = '';
      }
    });
    
    // Reset button states
    const submitButton = modal.querySelector('#changePasswordSubmitBtn');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Change Password';
    }
    
    console.log('✅ Profile modal reset complete');
  }

  /**
   * Hide profile modal
   */
  static hideProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
      console.log('🎭 Hiding profile modal with cleanup...');
      // Clean up before hiding
      this.resetProfileModal();
      modal.style.display = 'none';
      console.log('✅ Profile modal hidden and cleaned');
    }
  }

  /**
   * Show forgot password modal
   */
  static showForgotPasswordModal() {
    this.showAuthModal('forgotPassword');
  }

  /**
   * Get login form HTML
   * @returns {string} Login form HTML
   */
  static getLoginFormHTML() {
    return `
      <div class="modal-header">
        <h3>Login</h3>
        <button type="button" class="close-btn" data-action="closeModal">&times;</button>
      </div>
      <form id="loginForm" class="auth-form">
        <div class="form-group">
          <label for="loginEmail">Email:</label>
          <input type="email" id="loginEmail" name="email" required>
        </div>
        <div class="form-group">
          <label for="loginPassword">Password:</label>
          <input type="password" id="loginPassword" name="password" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Login</button>
          <button type="button" class="btn-link" data-action="showAuthModal" data-mode="register">Need an account? Register</button>
          <button type="button" class="btn-link" data-action="showForgotPasswordModal">Forgot Password?</button>
        </div>
        <div id="loginError" class="error-message"></div>
      </form>
    `;
  }

  /**
   * Get register form HTML
   * @returns {string} Register form HTML
   */
  static getRegisterFormHTML() {
    return `
      <div class="modal-header">
        <h3>Register</h3>
        <button type="button" class="close-btn" data-action="closeModal">&times;</button>
      </div>
      <form id="registerForm" class="auth-form">
        <div class="form-group">
          <label for="registerUsername">Username:</label>
          <input type="text" id="registerUsername" name="username" required>
        </div>
        <div class="form-group">
          <label for="registerEmail">Email:</label>
          <input type="email" id="registerEmail" name="email" required>
        </div>
        <div class="form-group">
          <label for="registerFirstName">First Name:</label>
          <input type="text" id="registerFirstName" name="firstName">
        </div>
        <div class="form-group">
          <label for="registerLastName">Last Name:</label>
          <input type="text" id="registerLastName" name="lastName">
        </div>
        <div class="form-group">
          <label for="registerPassword">Password:</label>
          <input type="password" id="registerPassword" name="password" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Register</button>
          <button type="button" class="btn-link" data-action="showAuthModal" data-mode="login">Already have an account? Login</button>
        </div>
        <div id="registerError" class="error-message"></div>
      </form>
    `;
  }

  /**
   * Get forgot password form HTML
   * @returns {string} Forgot password form HTML
   */
  static getForgotPasswordFormHTML() {
    return `
      <div class="modal-header">
        <h3>Reset Password</h3>
        <button type="button" class="close-btn" data-action="closeModal">&times;</button>
      </div>
      <form id="forgotPasswordForm" class="auth-form">
        <div class="form-group">
          <label for="forgotEmail">Email:</label>
          <input type="email" id="forgotEmail" name="email" required>
          <small class="help-text">Enter your email address and we'll send you a link to reset your password.</small>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Send Reset Link</button>
          <button type="button" class="btn-link" data-action="showAuthModal" data-mode="login">Back to Login</button>
        </div>
        <div id="forgotPasswordError" class="error-message"></div>
      </form>
    `;
  }

  /**
   * Populate profile form with user data
   * @param {Object} user - User data object
   */
  static populateProfileForm(user) {
    console.log('📝 Populating profile form with user data:', user);
    
    // Populate form fields with user data
    const usernameField = document.getElementById('profileUsername');
    const emailField = document.getElementById('profileEmail');
    const firstNameField = document.getElementById('profileFirstName');
    const lastNameField = document.getElementById('profileLastName');

    console.log('🔍 Form fields found:', {
      username: !!usernameField,
      email: !!emailField,
      firstName: !!firstNameField,
      lastName: !!lastNameField
    });

    // Check what firstName/lastName data we have
    console.log('🔍 User name data available:', {
      'user.firstName': user.firstName,
      'user.first_name': user.first_name,
      'user.lastName': user.lastName,
      'user.last_name': user.last_name
    });

    if (usernameField) {
      usernameField.value = user.username || '';
      console.log('✅ Set username field to:', usernameField.value);
    }
    if (emailField) {
      emailField.value = user.email || '';
      console.log('✅ Set email field to:', emailField.value);
    }
    if (firstNameField) {
      const firstNameValue = user.firstName || user.first_name || '';
      firstNameField.value = firstNameValue;
      console.log('✅ Set firstName field to:', firstNameValue, '(source:', user.firstName ? 'firstName' : user.first_name ? 'first_name' : 'empty', ')');
    }
    if (lastNameField) {
      const lastNameValue = user.lastName || user.last_name || '';
      lastNameField.value = lastNameValue;
      console.log('✅ Set lastName field to:', lastNameValue, '(source:', user.lastName ? 'lastName' : user.last_name ? 'last_name' : 'empty', ')');
    }

    console.log('✅ Profile form populated with user data');
    
    // Log final form state for verification
    console.log('🔍 Final form field values:', {
      username: usernameField?.value,
      email: emailField?.value,
      firstName: firstNameField?.value,
      lastName: lastNameField?.value
    });
  }

  /**
   * Setup profile form submission handler
   */
  static setupProfileFormHandler() {
    const form = document.getElementById('profileFormElement');
    if (!form) {
      console.warn('⚠️ Profile form not found');
      return;
    }

    // Remove existing event listeners to prevent duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Add form submission handler
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('📝 Profile form submitted');

      const submitBtn = newForm.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent || 'Update Pro';

      try {
        // Show loading state
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Updating...';
        }

        // Clear previous messages
        this.clearProfileMessages();

        // Validate and get form data
        const formData = new FormData(newForm);
        const profileData = {
          username: formData.get('username') || document.getElementById('profileUsername')?.value,
          firstName: formData.get('firstName') || document.getElementById('profileFirstName')?.value,
          lastName: formData.get('lastName') || document.getElementById('profileLastName')?.value,
          email: formData.get('email') || document.getElementById('profileEmail')?.value
        };

        console.log('📝 Profile data to update:', profileData);

        // Validate required fields
        if (!profileData.username || !profileData.email) {
          throw new Error('Username and email are required');
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_]{3,50}$/.test(profileData.username)) {
          throw new Error('Username must be 3-50 characters long and contain only letters, numbers, and underscores');
        }

        // Use AuthFormHandlers to handle the update
        const { AuthFormHandlers } = await import('./AuthFormHandlers.js');
        await AuthFormHandlers.handleProfileUpdate(newForm);
        
      } catch (error) {
        console.error('❌ Profile update error:', error);
        this.showProfileError(error.message);
      } finally {
        // Reset button state
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });

    console.log('✅ Profile form handler setup complete');
  }

  /**
   * Clear profile form messages
   */
  static clearProfileMessages() {
    const existingMessages = document.querySelectorAll('#profileFormElement .success-message, #profileFormElement .error-message');
    existingMessages.forEach(msg => msg.remove());
  }

  /**
   * Show profile error message
   * @param {string} message - Error message to display
   */
  static showProfileError(message) {
    this.clearProfileMessages();
    
    const form = document.getElementById('profileFormElement');
    if (!form) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      margin-top: 15px;
      padding: 10px;
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      font-size: 14px;
    `;
    errorDiv.textContent = message;
    
    form.appendChild(errorDiv);
  }

  /**
   * Show profile success message
   * @param {string} message - Success message to display
   */
  static showProfileSuccess(message) {
    this.clearProfileMessages();
    
    const form = document.getElementById('profileFormElement');
    if (!form) return;

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
      margin-top: 15px;
      padding: 10px;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
      font-size: 14px;
    `;
    successDiv.textContent = message;
    
    form.appendChild(successDiv);
  }

  /**
   * Setup event delegation for modal actions
   * @param {HTMLElement} modal - Modal element
   */
  static setupModalEventDelegation(modal) {
    // Remove existing listeners to prevent duplicates
    modal.removeEventListener('click', this.modalClickHandler);
    
    // Add new listener
    this.modalClickHandler = (e) => {
      const action = e.target.dataset.action;
      const mode = e.target.dataset.mode;

      switch (action) {
        case 'closeModal':
          modal.style.display = 'none';
          break;
        case 'showAuthModal':
          this.showAuthModal(mode);
          break;
        case 'showForgotPasswordModal':
          this.showForgotPasswordModal();
          break;
      }
    };
    
    modal.addEventListener('click', this.modalClickHandler);
  }
}
