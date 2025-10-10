/**
 * Authentication Form Handlers
 * Handles form submissions, validation, and form-related events
 */

import { AuthService } from './AuthService.js';
import { AuthModalService } from './AuthModalService.js';
import { AuthNotificationService } from './AuthNotificationService.js';
import { AuthUICore } from './AuthUICore.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'AUTH_FORM_HANDLERS';

export class AuthFormHandlers {

  static initialize() {
    debug(FILE, '📝 Initializing');
    this.setupFormHandlers();
    debug(FILE, '✅ Initialized');
  }

  static setupFormHandlers() {
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

  static async handleLogin(form) {
    try {
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');

      if (!email || !password) {
        AuthNotificationService.showFormErrors({
          general: 'Please fill in all fields'
        });
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;

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
      debug(FILE, 'Login error:', error, 'error');
      AuthNotificationService.showFormErrors({
        general: 'An error occurred during login'
      });
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
      }
    }
  }

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

      const errors = this.validateRegisterForm(userData);
      if (Object.keys(errors).length > 0) {
        AuthNotificationService.showFormErrors(errors);
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating Account...';
      submitBtn.disabled = true;

      const result = await AuthService.register(userData);

      if (result.success) {
        AuthNotificationService.showSuccess('Registration successful!');
        AuthModalService.hideAuthModal();
        if (result.requiresVerification) {
          AuthNotificationService.showEmailVerificationBanner();
          AuthNotificationService.checkConsoleForVerificationLink();
        }
        AuthUICore.updateAuthUI();
      } else {
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
      debug(FILE, 'Registration error:', error, 'error');
      AuthNotificationService.showFormErrors({
        general: 'An error occurred during registration'
      });
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Register';
        submitBtn.disabled = false;
      }
    }
  }

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

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

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
      debug(FILE, 'Forgot password error:', error, 'error');
      AuthNotificationService.showFormErrors({
        general: 'An error occurred while sending reset link'
      });
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Send Reset Link';
        submitBtn.disabled = false;
      }
    }
  }

  static validateRegisterForm(userData) {
    const errors = {};

    if (!userData.username?.trim()) {
      errors.username = 'Username is required';
    }
    if (!userData.email?.trim()) {
      errors.email = 'Email is required';
    }
    if (!userData.password) {
      errors.password = 'Password is required';
    }

    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (userData.password && userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (userData.username && userData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    return errors;
  }

  static clearProfileMessages() {
    const existingMessages = document.querySelectorAll('#profileFormElement .success-message, #profileFormElement .error-message');
    existingMessages.forEach(msg => msg.remove());
  }

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

  static async handleProfileUpdate(form) {
    this.clearProfileMessages();
    const formData = new FormData(form);

    // Debug each form field and value
    for (const [key, value] of formData.entries()) {
      debug(FILE, `formData after new FORM DATA API: [${key}] =`, value);
    }

    const profileData = {
      username: formData.get('username'),
      firstName: formData.get('firstname'),
      lastName: formData.get('lastname'),
      email: formData.get('email')
    };

    debug(FILE, '📝 profileData:', profileData);

    const errors = [];

    if (!profileData.username || !profileData.email) {
      errors.push('Username and email are required');
    }
    if (!profileData.firstName || !profileData.lastName) {
      errors.push('First and Lastname is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profileData.email && !emailRegex.test(profileData.email)) {
      errors.push('Please enter a valid email address');
    }
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
    if (profileData.username && !/^[a-zA-Z0-9_]{3,50}$/.test(profileData.username)) {
      errors.push('Username must be 3-50 characters long and contain only letters, numbers, and underscores');
    }

    if (errors.length) {
      this.showProfileError('Note: ' + errors.join(', '));
      throw new Error(errors.join('\n'));
    }

    try {
      debug(FILE, '[handleProfileUpdate] : profileData:', profileData);
      const result = await AuthService.updateProfile(profileData);

      if (result.success) {
        AuthUICore.updateAuthUI();
        this.showProfileSuccess('You Did It!');
        if (result.user) {
          AuthModalService.populateProfileForm(result.user);
        }
      } else {
        debug(FILE, 'Failed to update profile', result.message, 'error');
        this.showProfileError(result.message || 'Failed to update profile');
      }
    } catch (e) {
      debug(FILE, 'Profile update error:', e.message, 'error');
      this.showProfileError('Profile update error:', e.message);
    }
  }

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
    AuthNotificationService.showCustomDialog(dialogHtml);

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

  static switchToLogin(email) {
    AuthNotificationService.hideFormErrors();
    AuthModalService.showLoginForm();
    setTimeout(() => {
      const emailField = document.querySelector('#loginForm input[name="email"]');
      if (emailField) {
        emailField.value = email;
        emailField.focus();
      }
    }, 100);
  }

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
      debug(FILE, 'Password reset error:', error, 'error');
      AuthNotificationService.showFormErrors({
        general: 'An error occurred while requesting password reset'
      });
    }
  }
}
