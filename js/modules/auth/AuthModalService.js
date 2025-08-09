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
   * Show profile modal
   */
  static showProfileModal() {
    console.log('🎭 showProfileModal() called');
    
    const authState = StateManager.getAuthState();
    const user = authState?.currentUser;
    
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

    // Populate profile form with user data
    this.populateProfileForm(user);

    // Show the modal
    modal.style.display = 'block';
    console.log('✅ Profile modal displayed');
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

    if (usernameField) usernameField.value = user.username || '';
    if (emailField) emailField.value = user.email || '';
    if (firstNameField) firstNameField.value = user.firstName || user.first_name || '';
    if (lastNameField) lastNameField.value = user.lastName || user.last_name || '';

    console.log('✅ Profile form populated with user data');
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
