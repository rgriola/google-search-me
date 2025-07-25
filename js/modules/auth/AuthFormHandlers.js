/**
 * Authentication Form Handlers
 * Handles form submissions, validation, and form-related events
 */

import { AuthService } from './AuthService.js';
import { AuthModalService } from './AuthModalService.js';
import { AuthNotificationService } from './AuthNotificationService.js';
import { AuthUICore } from './AuthUICore.js';

/**
 * Authentication Form Handlers Class
 */
export class AuthFormHandlers {

  /**
   * Initialize form handlers
   */
  static initialize() {
    console.log('📝 Initializing Authentication Form Handlers');
    this.setupFormHandlers();
    console.log('✅ Authentication Form Handlers initialized');
  }

  /**
   * Setup form event handlers
   */
  static setupFormHandlers() {
    // Use event delegation for dynamically created forms
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'loginForm') {
        e.preventDefault();
        this.handleLogin(e.target);
      } else if (e.target.id === 'registerForm') {
        e.preventDefault();
        this.handleRegister(e.target);
      } else if (e.target.id === 'forgotPasswordForm') {
        e.preventDefault();
        this.handleForgotPassword(e.target);
      }
    });
  }

  /**
   * Handle login form submission
   * @param {HTMLFormElement} form - Login form element
   */
  static async handleLogin(form) {
    try {
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');

      // Basic validation
      if (!email || !password) {
        AuthNotificationService.showFormErrors({
          general: 'Please fill in all fields'
        });
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;

      // Attempt login
      const result = await AuthService.login(email, password);

      if (result.success) {
        AuthNotificationService.showSuccess('Login successful!');
        AuthModalService.hideAuthModal();
        AuthUICore.updateAuthUI();
      } else {
        AuthNotificationService.showFormErrors({
          general: result.message || 'Login failed'
        });
      }

    } catch (error) {
      console.error('Login error:', error);
      AuthNotificationService.showFormErrors({
        general: 'An error occurred during login'
      });
    } finally {
      // Reset button state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Handle register form submission
   * @param {HTMLFormElement} form - Register form element
   */
  static async handleRegister(form) {
    try {
      const formData = new FormData(form);
      const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
      };

      // Validation
      const errors = this.validateRegisterForm(userData);
      if (Object.keys(errors).length > 0) {
        AuthNotificationService.showFormErrors(errors);
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating Account...';
      submitBtn.disabled = true;

      // Attempt registration
      const result = await AuthService.register(userData);

      if (result.success) {
        AuthNotificationService.showSuccess('Registration successful!');
        AuthModalService.hideAuthModal();
        
        // Show verification banner if email verification is required
        if (result.requiresVerification) {
          AuthNotificationService.showEmailVerificationBanner();
          AuthNotificationService.checkConsoleForVerificationLink();
        }
        
        AuthUICore.updateAuthUI();
      } else {
        AuthNotificationService.showFormErrors({
          general: result.message || 'Registration failed'
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      AuthNotificationService.showFormErrors({
        general: 'An error occurred during registration'
      });
    } finally {
      // Reset button state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Register';
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Handle forgot password form submission
   * @param {HTMLFormElement} form - Forgot password form element
   */
  static async handleForgotPassword(form) {
    try {
      const formData = new FormData(form);
      const email = formData.get('email');

      if (!email) {
        AuthNotificationService.showFormErrors({
          general: 'Please enter your email address'
        });
        return;
      }

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      // Attempt password reset
      const result = await AuthService.forgotPassword(email);

      if (result.success) {
        AuthNotificationService.showSuccess('Password reset link sent to your email!');
        AuthModalService.hideAuthModal();
      } else {
        AuthNotificationService.showFormErrors({
          general: result.message || 'Failed to send reset link'
        });
      }

    } catch (error) {
      console.error('Forgot password error:', error);
      AuthNotificationService.showFormErrors({
        general: 'An error occurred while sending reset link'
      });
    } finally {
      // Reset button state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Send Reset Link';
        submitBtn.disabled = false;
      }
    }
  }

  /**
   * Validate registration form data
   * @param {Object} userData - User registration data
   * @returns {Object} Validation errors
   */
  static validateRegisterForm(userData) {
    const errors = {};

    // Required fields
    if (!userData.username?.trim()) {
      errors.username = 'Username is required';
    }
    if (!userData.email?.trim()) {
      errors.email = 'Email is required';
    }
    if (!userData.password) {
      errors.password = 'Password is required';
    }

    // Email format
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (userData.password && userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Password confirmation
    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Username validation
    if (userData.username && userData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    return errors;
  }

  /**
   * Handle profile update form (if implemented)
   * @param {HTMLFormElement} form - Profile form element
   */
  static async handleProfileUpdate(form) {
    try {
      const formData = new FormData(form);
      const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email')
      };

      const result = await AuthService.updateProfile(profileData);

      if (result.success) {
        AuthNotificationService.showSuccess('Profile updated successfully!');
        AuthUICore.updateAuthUI();
      } else {
        AuthNotificationService.showFormErrors({
          general: result.message || 'Failed to update profile'
        });
      }

    } catch (error) {
      console.error('Profile update error:', error);
      AuthNotificationService.showFormErrors({
        general: 'An error occurred while updating profile'
      });
    }
  }
}
