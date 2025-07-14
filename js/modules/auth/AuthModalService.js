/**
 * Authentication Modal Service
 * Handles auth modals, forms, and modal-related UI interactions
 */

import { StateManager } from '../state/AppState.js';

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
  static showProfileModal() {
    const authState = StateManager.getAuthState();
    const user = authState?.currentUser;
    
    if (!user) {
      console.error('No user data available for profile');
      return;
    }

    // Implementation would go here - profile modal HTML and display
    console.log('Profile modal functionality - to be implemented');
  }

  /**
   * Hide profile modal
   */
  static hideProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.style.display = 'none';
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
        <button type="button" class="close-btn" onclick="document.getElementById('authModal').style.display='none'">&times;</button>
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
          <button type="button" class="btn-link" onclick="AuthModalService.showAuthModal('register')">Need an account? Register</button>
          <button type="button" class="btn-link" onclick="AuthModalService.showForgotPasswordModal()">Forgot Password?</button>
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
        <button type="button" class="close-btn" onclick="document.getElementById('authModal').style.display='none'">&times;</button>
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
          <button type="button" class="btn-link" onclick="AuthModalService.showAuthModal('login')">Already have an account? Login</button>
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
        <button type="button" class="close-btn" onclick="document.getElementById('authModal').style.display='none'">&times;</button>
      </div>
      <form id="forgotPasswordForm" class="auth-form">
        <div class="form-group">
          <label for="forgotEmail">Email:</label>
          <input type="email" id="forgotEmail" name="email" required>
          <small class="help-text">Enter your email address and we'll send you a link to reset your password.</small>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Send Reset Link</button>
          <button type="button" class="btn-link" onclick="AuthModalService.showAuthModal('login')">Back to Login</button>
        </div>
        <div id="forgotPasswordError" class="error-message"></div>
      </form>
    `;
  }
}
