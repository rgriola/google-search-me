/**
 * Authentication event handlers
 * Manages form submissions, button clicks, and user interactions
 */

import { AuthService } from './AuthService.js';
import { AuthUI } from './AuthUI.js';

/**
 * Authentication Handlers Class
 */
export class AuthHandlers {

  /**
   * Initialize all authentication event handlers
   */
  static initialize() {
    console.log('🎯 Initializing Authentication Handlers');
    
    this.setupNavButtonHandlers();
    this.setupModalHandlers();
    this.setupFormHandlers();
    
    console.log('✅ Authentication Handlers initialized');
  }

  /**
   * Setup navigation button event handlers
   */
  static setupNavButtonHandlers() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthUI.showAuthModal('login');
      });
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthUI.showAuthModal('register');
      });
    }

    // User info click (show dropdown)
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.addEventListener('click', (e) => {
        e.preventDefault();
        AuthUI.toggleUserDropdown();
      });
    }

    // Profile button in dropdown
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthUI.showProfileModal();
        AuthUI.toggleUserDropdown(); // Close dropdown
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const userInfo = document.getElementById('userInfo');
      const dropdown = document.getElementById('userDropdown');
      
      if (userInfo && dropdown && !userInfo.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // 404 fallback: redirect to 404.html if not found
    window.addEventListener('error', function(e) {
      if (e.message && e.message.includes('Failed to fetch')) {
        window.location.href = '/404.html';
      }
    });
  }

  /**
   * Setup modal event handlers
   */
  static setupModalHandlers() {
    // Auth modal close handlers
    document.addEventListener('click', (e) => {
      // Close button
      if (e.target.classList.contains('close')) {
        AuthUI.hideAuthModal();
        AuthUI.hideProfileModal();
      }
      
      // Modal background click
      if (e.target.id === 'authModal') {
        AuthUI.hideAuthModal();
      }
      if (e.target.id === 'profileModal') {
        AuthUI.hideProfileModal();
      }
    });

    // Dynamic modal content handlers (for switching between forms)
    document.addEventListener('click', (e) => {
      if (e.target.id === 'showRegister') {
        e.preventDefault();
        AuthUI.showAuthModal('register');
      }
      if (e.target.id === 'showLogin') {
        e.preventDefault();
        AuthUI.showAuthModal('login');
      }
      if (e.target.id === 'showForgotPassword') {
        e.preventDefault();
        AuthUI.showAuthModal('forgot-password');
      }
    });

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        AuthUI.hideAuthModal();
        AuthUI.hideProfileModal();
      }
    });

    // Forgot password page handler
    if (window.location.pathname.endsWith('forgot-password.html')) {
      const forgotForm = document.getElementById('forgotPasswordForm');
      if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          await AuthHandlers.handleForgotPassword(forgotForm);
        });
      }
    }
  }

  /**
   * Setup form submission handlers
   */
  static setupFormHandlers() {
    // Use event delegation for dynamic forms
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'loginForm') {
        e.preventDefault();
        this.handleLogin(e.target);
      }
      if (e.target.id === 'registerForm') {
        e.preventDefault();
        this.handleRegister(e.target);
      }
      if (e.target.id === 'forgotPasswordForm') {
        e.preventDefault();
        this.handleForgotPassword(e.target);
      }
      if (e.target.id === 'profileFormElement') {
        e.preventDefault();
        this.handleProfileUpdate(e.target);
      }
      if (e.target.id === 'changePasswordForm') {
        e.preventDefault();
        this.handleChangePassword(e.target);
      }
    });
  }

  /**
   * Handle login form submission
   * @param {HTMLFormElement} form - Login form element
   */
  static async handleLogin(form) {
    const formData = new FormData(form);
    const email = formData.get('loginUsername') || document.getElementById('loginUsername')?.value; // This field is actually email
    const password = formData.get('loginPassword') || document.getElementById('loginPassword')?.value;

    console.log('🔍 Form debug - email:', email, 'password:', password ? '***' : 'undefined');

    // Basic validation
    if (!email || !password) {
      AuthUI.showNotification('Please fill in all fields', 'error');
      return;
    }

    try {
      // Disable submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
      }

      const result = await AuthService.login(email, password);

      if (result.success) {
        AuthUI.showNotification('Login successful!', 'success');
        AuthUI.hideAuthModal();
        AuthUI.updateAuthUI();
        
        // Reload saved locations for logged in user
        try {
          const { LocationsUI } = await import('../locations/LocationsUI.js');
          await LocationsUI.refreshSavedLocations();
          console.log('✅ Saved locations refreshed after login');
        } catch (error) {
          console.error('Error refreshing saved locations after login:', error);
        }
      } else {
        AuthUI.showNotification(result.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      AuthUI.showNotification('Login failed. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    }
  }

  /**
   * Handle register form submission
   * @param {HTMLFormElement} form - Register form element
   */
  static async handleRegister(form) {
    const formData = new FormData(form);
    const userData = {
      username: formData.get('registerUsername') || document.getElementById('registerUsername')?.value,
      email: formData.get('registerEmail') || document.getElementById('registerEmail')?.value,
      fullName: formData.get('registerFullName') || document.getElementById('registerFullName')?.value,
      password: formData.get('registerPassword') || document.getElementById('registerPassword')?.value
    };
    const confirmPassword = formData.get('confirmPassword') || document.getElementById('confirmPassword')?.value;

    // Validation
    const errors = this.validateRegistrationForm(userData, confirmPassword);
    if (Object.keys(errors).length > 0) {
      AuthUI.showFormErrors(errors);
      return;
    }

    try {
      // Disable submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
      }

      const result = await AuthService.register(userData);

      if (result.success) {
        AuthUI.showNotification('Registration successful!', 'success');
        AuthUI.hideAuthModal();
        AuthUI.updateAuthUI();
      } else {
        AuthUI.showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      AuthUI.showNotification('Registration failed. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
      }
    }
  }

  /**
   * Handle forgot password form submission
   * @param {HTMLFormElement} form - Forgot password form element
   */
  static async handleForgotPassword(form) {
    const formData = new FormData(form);
    const email = formData.get('forgotEmail') || document.getElementById('forgotEmail')?.value;

    if (!email || !this.validateEmail(email)) {
      AuthUI.showNotification('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Disable submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const result = await AuthService.forgotPassword(email);

      if (result.success) {
        AuthUI.showNotification(result.message, 'success');
        AuthUI.hideAuthModal();
      } else {
        AuthUI.showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      AuthUI.showNotification('Failed to send reset email. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Email';
      }
    }
  }

  /**
   * Handle profile update form submission
   * @param {HTMLFormElement} form - Profile form element
   */
  static async handleProfileUpdate(form) {
    const formData = new FormData(form);
    const profileData = {
      username: formData.get('profileUsername') || document.getElementById('profileUsername')?.value,
      email: formData.get('profileEmail') || document.getElementById('profileEmail')?.value,
      fullName: formData.get('profileFullName') || document.getElementById('profileFullName')?.value
    };

    try {
      const result = await AuthService.updateProfile(profileData);

      if (result.success) {
        AuthUI.showNotification('Profile updated successfully!', 'success');
        AuthUI.updateAuthUI();
      } else {
        AuthUI.showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      AuthUI.showNotification('Profile update failed. Please try again.', 'error');
    }
  }

  /**
   * Handle change password form submission
   * @param {HTMLFormElement} form - Change password form element
   */
  static async handleChangePassword(form) {
    const formData = new FormData(form);
    const currentPassword = formData.get('currentPassword') || document.getElementById('currentPassword')?.value;
    const newPassword = formData.get('newPassword') || document.getElementById('newPassword')?.value;
    const confirmNewPassword = formData.get('confirmNewPassword') || document.getElementById('confirmNewPassword')?.value;

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      AuthUI.showNotification('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      AuthUI.showNotification('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      AuthUI.showNotification('New password must be at least 6 characters', 'error');
      return;
    }

    try {
      const result = await AuthService.changePassword(currentPassword, newPassword);

      if (result.success) {
        AuthUI.showNotification('Password changed successfully!', 'success');
        form.reset();
      } else {
        AuthUI.showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Change password error:', error);
      AuthUI.showNotification('Password change failed. Please try again.', 'error');
    }
  }

  /**
   * Handle logout
   */
  static async handleLogout() {
    try {
      console.log('🔐 Starting secure logout process...');
      
      // Call logout API to invalidate server session
      await AuthService.logout();
      
      // Enhanced security cleanup
      this.performSecureLogoutCleanup();
      
      // Redirect to logout page
      window.location.href = '/logout.html';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, perform cleanup and redirect
      this.performSecureLogoutCleanup();
      window.location.href = '/logout.html';
    }
  }

  /**
   * Enhanced security cleanup for logout
   */
  static performSecureLogoutCleanup() {
    console.log('🧹 Performing enhanced logout cleanup...');
    
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userProfile');
    
    // Clear app-specific data
    localStorage.removeItem('savedLocations');
    localStorage.removeItem('mapCenter');
    localStorage.removeItem('mapZoom');
    localStorage.removeItem('searchHistory');
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('rememberMe');
    
    // Clear session storage for extra security
    sessionStorage.clear();
    
    console.log('✅ Enhanced logout cleanup completed');
  }

  /**
   * Validate registration form
   * @param {Object} userData - User data to validate
   * @param {string} confirmPassword - Confirm password value
   * @returns {Object} Validation errors
   */
  static validateRegistrationForm(userData, confirmPassword) {
    const errors = {};

    if (!userData.username || userData.username.length < 3) {
      errors.registerUsername = 'Username must be at least 3 characters';
    }

    if (!userData.email || !this.validateEmail(userData.email)) {
      errors.registerEmail = 'Please enter a valid email address';
    }

    if (!userData.password || userData.password.length < 6) {
      errors.registerPassword = 'Password must be at least 6 characters';
    }

    if (userData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // MISSING: Global compatibility methods for HTML onclick handlers
  
  /**
   * Logout - Global compatibility method
   */
  static async logout() {
    await this.handleLogout();
  }
  
  /**
   * Resend verification email - Global compatibility method
   */
  static async resendVerificationEmail() {
    try {
      const user = AuthService.getCurrentUser();
      if (!user || !user.email) {
        AuthUI.showNotification('No user email found', 'error');
        return;
      }
      
      const response = await fetch(`${window.API_BASE_URL || 'http://localhost:3000/api'}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthService.getToken()}`
        },
        body: JSON.stringify({ email: user.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        AuthUI.showNotification('Verification email sent! Check your inbox.', 'success');
      } else {
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      AuthUI.showNotification(error.message || 'Failed to send verification email', 'error');
    }
  }
  
  /**
   * Resend verification from profile - Global compatibility method
   */
  static async resendVerificationFromProfile(email) {
    try {
      const response = await fetch(`${window.API_BASE_URL || 'http://localhost:3000/api'}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthService.getToken()}`
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        AuthUI.showNotification('Verification email sent!', 'success');
      } else {
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      AuthUI.showNotification(error.message || 'Failed to send verification email', 'error');
    }
  }

}

// Export individual functions for backward compatibility
export const handleLogin = AuthHandlers.handleLogin.bind(AuthHandlers);
export const handleRegister = AuthHandlers.handleRegister.bind(AuthHandlers);
export const handleLogout = AuthHandlers.handleLogout.bind(AuthHandlers);
export const handleForgotPassword = AuthHandlers.handleForgotPassword.bind(AuthHandlers);
export const handleProfileUpdate = AuthHandlers.handleProfileUpdate.bind(AuthHandlers);
export const handleChangePassword = AuthHandlers.handleChangePassword.bind(AuthHandlers);
export const logout = AuthHandlers.logout.bind(AuthHandlers);
export const resendVerificationEmail = AuthHandlers.resendVerificationEmail.bind(AuthHandlers);
export const resendVerificationFromProfile = AuthHandlers.resendVerificationFromProfile.bind(AuthHandlers);