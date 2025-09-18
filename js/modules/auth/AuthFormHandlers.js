/**
 * Authentication Form Handlers
 * Handles form submissions, validation, and form-related events
 */

import { AuthService } from './AuthService.js';
import { AuthModalService } from './AuthModalService.js';
import { AuthNotificationService } from './AuthNotificationService.js';
import { AuthUICore } from './AuthUICore.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

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
        // Handle specific error cases for better UX
        if (result.code === 'EMAIL_EXISTS') {
          this.showEmailExistsDialog(userData.email);
        } else if (result.code === 'USERNAME_EXISTS') {
          AuthNotificationService.showFormErrors({
            username: 'This username is already taken. Please choose a different username.'
          });
        } else if (result.code === 'EMAIL_AND_USERNAME_EXISTS') {
          this.showEmailExistsDialog(userData.email);
        } else {
          AuthNotificationService.showFormErrors({
            general: result.message || 'Registration failed'
          });
        }
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
   * Clear profile form messages
   */
  static clearProfileMessages() {
    const existingMessages = document.querySelectorAll('#profileFormElement .success-message, #profileFormElement .error-message');
    existingMessages.forEach(msg => msg.remove());
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
   * Handle profile update form (if implemented)
   * @param {HTMLFormElement} form - Profile form element
   */
  static async handleProfileUpdate(form) {

      // Clear previous messages
        this.clearProfileMessages();
        
        // Validate and get form data. uses values in name attribute of the element. 
        const formData = new FormData(form);

        // Log each form field and value for debugging
        for (const [key, value] of formData.entries()) {
          console.log(`formData after new FORM DATE API: [${key}] =`, value);
        }

        const profileData = { // removed the form references it gave false positives. 
          username: formData.get('username'), 
          firstName: formData.get('firstname'), 
          lastName: formData.get('lastname'), 
          email: formData.get('email')
        };

        console.log('📝 profileData:', profileData);

        // Collect validation errors
        const errors = [];

        // Required fields
        if (!profileData.username || !profileData.email) {
          errors.push('Username and email are required');
          }
        if (!profileData.firstName || !profileData.lastName) {
          errors.push('First and Lastname is required');
          }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (profileData.email && !emailRegex.test(profileData.email)) {
          errors.push('Please enter a valid email address');
          }

        // Name validation
        const nameRegex = /^[A-Za-z]+$/;
        if (profileData.firstName && !nameRegex.test(profileData.firstName)) {
          errors.push('First name can only contain letters');
          }
        if (profileData.lastName && !nameRegex.test(profileData.lastName)) {
          errors.push('Last name can only contain letters');
          }
        if (profileData.firstName && profileData.firstName.length > 30) {
          errors.push('First name cannot be longer than 30 letters');
          }
        if (profileData.lastName && profileData.lastName.length > 30) {
          errors.push('Last name cannot be longer than 30 letters');
          }

        // Username validation
        if (profileData.username && !/^[a-zA-Z0-9_]{3,50}$/.test(profileData.username)) {
          errors.push('Username must be 3-50 characters long and contain only letters, numbers, and underscores');
          }

        // If any errors, throw as a single error message
        if (errors.length) {
          this.showProfileError('Note: ' + errors.join(', '));
          throw new Error(errors.join('\n'));
        }

    try {
      // Log profileData for debugging in handleProfileUpdate
      console.log('AuthFormHandlers.[handleProfileUpdate] profileData:', profileData);
      
      const result = await AuthService.updateProfile(profileData);

      if (result.success) {
          AuthUICore.updateAuthUI();
          this.showProfileSuccess('You Did It!');
          
          if (result.user) {
            // this makes sure the data is there. 
            AuthModalService.populateProfileForm(result.user);
            }

      } else {
          console.error('Failed to update profile', errors.message);
          this.showProfileError(result.message || 'Failed to update profile');
        }
    } catch (e) {
      console.error('Profile update error:', e.message);
      this.showProfileError('Profile update error:', e.message);
      }
  }

  /**
   * Show dialog when user tries to register with existing email
   * @param {string} email - Email that already exists
   */
  static showEmailExistsDialog(email) {
    const dialogHtml = `
      <div class="email-exists-dialog">
        <h3>Account Already Exists</h3>
        <p>An account already exists with the email address <strong>${SecurityUtils.escapeHtml(email)}</strong>.</p>
        <p>Did you forget your password?</p>
        
        <div class="dialog-actions">
          <button class="btn btn-primary" data-action="switchToLogin" data-email="${SecurityUtils.escapeHtmlAttribute(email)}">
            Sign In Instead
          </button>
          <button class="btn btn-secondary" data-action="resetPassword" data-email="${SecurityUtils.escapeHtmlAttribute(email)}">
            Reset Password
          </button>
          <button class="btn btn-outline" data-action="hideFormErrors">
            Use Different Email
          </button>
        </div>
      </div>
    `;
    
    // Show dialog and setup event handlers
    AuthNotificationService.showCustomDialog(dialogHtml);
    
    // Add event delegation for dialog actions
    const dialog = document.querySelector('.custom-auth-dialog');
    if (dialog) {
      dialog.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const email = e.target.dataset.email;
        
        switch (action) {
          case 'switchToLogin':
            AuthFormHandlers.switchToLogin(email);
            break;
          case 'resetPassword':
            AuthFormHandlers.initiatePasswordReset(email);
            break;
          case 'hideFormErrors':
            AuthNotificationService.hideFormErrors();
            break;
        }
      });
    }
    
    AuthNotificationService.showCustomDialog(dialogHtml);
  }

  /**
   * Switch to login form with pre-filled email
   * @param {string} email - Email to pre-fill
   */
  static switchToLogin(email) {
    AuthNotificationService.hideFormErrors();
    AuthModalService.showLoginForm();
    
    // Pre-fill email field
    setTimeout(() => {
      const emailField = document.querySelector('#loginForm input[name="email"]');
      if (emailField) {
        emailField.value = email;
        emailField.focus();
      }
    }, 100);
  }

  /**
   * Initiate password reset for existing email
   * @param {string} email - Email to reset password for
   */
  static async initiatePasswordReset(email) {
    try {
      AuthNotificationService.hideFormErrors();
      
      const result = await AuthService.requestPasswordReset(email);
      
      if (result.success) {
        AuthNotificationService.showSuccess(
          `Password reset instructions have been sent to ${email}`
        );
        AuthModalService.hideAuthModal();
      } else {
        AuthNotificationService.showFormErrors({
          general: result.message || 'Failed to send password reset email'
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      AuthNotificationService.showFormErrors({
        general: 'An error occurred while requesting password reset'
      });
    }
  }
}
