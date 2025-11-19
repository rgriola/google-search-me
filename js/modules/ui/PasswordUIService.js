/**
 * Password UI Service
 * Centralized UI handling for password-related forms and feedback
 * CSP-compliant with external CSS classes
 * Phase 1 of password validation cleanup
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';

// Debug configuration - set to false in production
const DEBUG = false;

// Debug logging function
function debug(...args) {
    if (DEBUG) {
        console.log(...args);PasswordUIService.initializeAllPasswordToggles()
    }
}

export class PasswordUIService {
  static initialized = false;

  /**
   * Initialize the password UI service
   */
  static initialize() {
    if (this.initialized) return;
    
    debug('🔧 PasswordUIService initialized');
    this.initialized = true;
  }

  /**
   * Setup change password form handler with modern UI patterns
   * Replaces setupChangePasswordHandler from main.js
   * @param {Object} options - Configuration options
   * @param {Object} options.Auth - Auth service reference
   * @param {Function} options.showError - Error display function
   * @param {Function} options.showSuccess - Success display function
   */
  static setupChangePasswordHandler(options = {}) {
    const { Auth, showError, showSuccess } = options;
    
    if (!Auth) {
      if (DEBUG) console.error('❌ Auth service required for password UI setup');
      return;
    }

    const form = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const submitButton = document.getElementById('changePasswordSubmitBtn');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');

    if (!form || !currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !submitButton) {
      if (DEBUG) console.warn('⚠️ Password form elements not found');
      return;
    }

    // Setup show/hide password toggles using universal system
    PasswordUIService.setupPasswordToggle(currentPasswordInput, 'currentPassword');
    PasswordUIService.setupPasswordToggle(newPasswordInput, 'newPassword');
    PasswordUIService.setupPasswordToggle(confirmPasswordInput, 'confirmNewPassword');

    // Update password requirements visual indicators
    function updateRequirementIndicators(password) {
      Auth.updateRequirementIndicators(password);
    }

    // Update password strength meter with CSP-compliant styling
    function updatePasswordStrength(password) {
      const analysis = Auth.analyzePasswordStrength(password);
      
      // Update strength bar
      if (strengthBar) {
        strengthBar.style.width = `${analysis.score}%`;
        strengthBar.style.backgroundColor = analysis.color;
        strengthBar.style.backgroundPosition = `${100 - analysis.score}% 0`;
      }
      
      // Update strength text with CSP-compliant DOM manipulation
      if (strengthText) {
        if (password === '') {
          SecurityUtils.clearElement(strengthText);
          const placeholder = document.createElement('span');
          placeholder.className = 'password-placeholder';
          SecurityUtils.setTextContent(placeholder, 'Password strength will appear here');
          strengthText.appendChild(placeholder);
        } else {
          SecurityUtils.clearElement(strengthText);
          
          // Create strength header container
          const headerDiv = document.createElement('div');
          headerDiv.className = 'password-strength-header';
          
          // Create strength level element
          const strengthLevel = document.createElement('strong');
          strengthLevel.className = 'password-strength-level';
          strengthLevel.setAttribute('data-color', analysis.color);
          SecurityUtils.setTextContent(strengthLevel, `Strength: ${analysis.strength.toUpperCase()}`);
          strengthLevel.style.color = analysis.color;
          headerDiv.appendChild(strengthLevel);
          
          // Add entropy info
          if (analysis.entropy > 0) {
            const entropySpan = document.createElement('span');
            entropySpan.className = 'password-entropy-info';
            SecurityUtils.setTextContent(entropySpan, ` (${Math.round(analysis.entropy)} bits entropy)`);
            headerDiv.appendChild(entropySpan);
          }
          
          strengthText.appendChild(headerDiv);
          
          // Add missing requirements
          if (analysis.feedback.length > 0) {
            const requirementsDiv = document.createElement('div');
            requirementsDiv.className = 'password-missing-requirements';
            SecurityUtils.setTextContent(requirementsDiv, `⚠️ Missing: ${analysis.feedback.join(', ')}`);
            strengthText.appendChild(requirementsDiv);
          }
          
          // Add security warnings
          if (analysis.securityWarnings && analysis.securityWarnings.length > 0) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'password-security-warning';
            SecurityUtils.setTextContent(warningDiv, `🚨 Security Issues: ${analysis.securityWarnings.join(', ')}`);
            strengthText.appendChild(warningDiv);
          }
          
          // Add security recommendations
          if (analysis.entropy < 50 && password.length > 0) {
            const recommendationDiv = document.createElement('div');
            recommendationDiv.className = 'password-recommendation-weak';
            SecurityUtils.setTextContent(recommendationDiv, '⚠️ Consider a longer or more complex password');
            strengthText.appendChild(recommendationDiv);
          } else if (analysis.entropy >= 70 && analysis.score >= 80 && analysis.securityWarnings.length === 0) {
            const recommendationDiv = document.createElement('div');
            recommendationDiv.className = 'password-recommendation-excellent';
            SecurityUtils.setTextContent(recommendationDiv, '✅ Excellent security level - this password is very secure');
            strengthText.appendChild(recommendationDiv);
          } else if (analysis.score >= 70 && analysis.securityWarnings.length === 0) {
            const recommendationDiv = document.createElement('div');
            recommendationDiv.className = 'password-recommendation-good';
            SecurityUtils.setTextContent(recommendationDiv, '✅ Good security level');
            strengthText.appendChild(recommendationDiv);
          }
        }
      }
      
      // Update requirement indicators
      updateRequirementIndicators(password);
      
      // Add visual feedback for password field styling
      PasswordUIService.updatePasswordFieldStyling(newPasswordInput, analysis, password);
    }

    // Check form validity and update UI
    function checkFormValidity() {
      if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !submitButton) {
        return false;
      }
      
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      const validation = Auth.validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
      
      submitButton.disabled = !validation.isValid;
      
      // Update confirm password field styling
      PasswordUIService.updateConfirmPasswordStyling(confirmPasswordInput, validation, confirmPassword);
      
      return validation.isValid;
    }

    // Event listeners
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
        checkFormValidity();
      });
    }

    if (currentPasswordInput) {
      currentPasswordInput.addEventListener('input', checkFormValidity);
    }

    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', checkFormValidity);
    }

    // Form submission handler
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const validation = Auth.validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
        
        if (!validation.currentPasswordValid) {
          PasswordUIService.showPasswordError('Current password does not meet security requirements: ' + validation.errors.current.join(', '), showError);
          return;
        }
        
        if (!validation.newPasswordValid) {
          PasswordUIService.showPasswordError('New password does not meet security requirements: ' + validation.errors.new.join(', '), showError);
          return;
        }
        
        if (!validation.passwordsMatch) {
          PasswordUIService.showPasswordError(validation.errors.match, showError);
          return;
        }
        
        if (!validation.passwordsDifferent) {
          PasswordUIService.showPasswordError(validation.errors.different, showError);
          return;
        }
        
        // Show loading state
        PasswordUIService.setSubmissionState(submitButton, true);
        
        try {
          const { AuthService } = await import('../auth/AuthService.js');
          const result = await AuthService.changePassword(currentPassword, newPassword);
          
          if (result?.success) {
            const successMessage = '🎉 Password changed successfully! 📧 A security notification has been sent to your email.';
            PasswordUIService.showPasswordSuccess(successMessage, showSuccess);
            
            // Enhanced success feedback
            PasswordUIService.showEmailConfirmation();
            
            form.reset();
            updatePasswordStrength('');
            
            // Close modal after successful change
            setTimeout(async () => {
              try {
                const { AuthModalService } = await import('../auth/AuthModalService.js');
                AuthModalService.hideProfileModal();
              } catch (error) {
                if (DEBUG) console.warn('⚠️ Could not auto-close modal:', error);
              }
            }, 3000);
          } else {
            PasswordUIService.showPasswordError(result?.message || 'Failed to change password', showError);
          }
        } catch (error) {
          if (DEBUG) console.error('Password change error:', error);
          PasswordUIService.showPasswordError('Network error. Please try again.', showError);
        } finally {
          PasswordUIService.setSubmissionState(submitButton, false);
          checkFormValidity();
        }
      });
    }
    
    debug('✅ Password UI handler setup complete');
  }

  /**
   * Update password field styling based on analysis
   * @param {HTMLElement} passwordField - The password input field
   * @param {Object} analysis - Password strength analysis
   * @param {string} password - The password value
   */
  static updatePasswordFieldStyling(passwordField, analysis, password) {
    if (!passwordField) return;

    if (password.length > 0) {
      if (analysis.score >= 80 && analysis.securityWarnings.length === 0) {
        passwordField.style.borderColor = '#28a745';
        passwordField.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
      } else if (analysis.score >= 60 && analysis.securityWarnings.length === 0) {
        passwordField.style.borderColor = '#ffc107';
        passwordField.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.1)';
      } else {
        passwordField.style.borderColor = '#dc3545';
        passwordField.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
      }
    } else {
      passwordField.style.borderColor = '';
      passwordField.style.boxShadow = '';
    }
  }

  /**
   * Update confirm password field styling
   * @param {HTMLElement} confirmField - The confirm password input field
   * @param {Object} validation - Form validation result
   * @param {string} confirmPassword - The confirm password value
   */
  static updateConfirmPasswordStyling(confirmField, validation, confirmPassword) {
    if (!confirmField) return;

    if (confirmPassword !== '') {
      if (validation.passwordsMatch) {
        confirmField.style.borderColor = '#28a745';
        confirmField.style.backgroundColor = '#f8fff9';
      } else {
        confirmField.style.borderColor = '#dc3545';
        confirmField.style.backgroundColor = '#fff8f8';
      }
    } else {
      confirmField.style.borderColor = '';
      confirmField.style.backgroundColor = '';
    }
  }

  /**
   * Set submission button state
   * @param {HTMLElement} button - Submit button element
   * @param {boolean} isSubmitting - Whether form is being submitted
   */
  static setSubmissionState(button, isSubmitting) {
    if (!button) return;

    if (isSubmitting) {
      button.disabled = true;
      button.textContent = 'Changing Password...';
    } else {
      button.disabled = false;
      button.textContent = 'Change Password';
    }
  }

  /**
   * Show password error message
   * @param {string} message - Error message to display
   * @param {Function} fallbackShowError - Fallback error display function
   */
  static showPasswordError(message, fallbackShowError) {
    // Try to use centralized error display
    if (fallbackShowError && typeof fallbackShowError === 'function') {
      fallbackShowError(message);
      return;
    }

    // Fallback to DOM-based error display
    const errorDiv = PasswordUIService.getOrCreatePasswordMessageDiv('changePasswordError');
    if (errorDiv) {
      SecurityUtils.setTextContent(errorDiv, message);
      errorDiv.className = 'password-error-message';
      errorDiv.style.display = 'block';
    }
  }

  /**
   * Show password success message
   * @param {string} message - Success message to display
   * @param {Function} fallbackShowSuccess - Fallback success display function
   */
  static showPasswordSuccess(message, fallbackShowSuccess) {
    // Try to use centralized success display
    if (fallbackShowSuccess && typeof fallbackShowSuccess === 'function') {
      fallbackShowSuccess(message);
      return;
    }

    // Fallback to DOM-based success display
    PasswordUIService.clearPasswordErrors();
    
    const successDiv = PasswordUIService.getOrCreatePasswordMessageDiv('changePasswordSuccess');
    if (successDiv) {
      SecurityUtils.setTextContent(successDiv, message);
      successDiv.className = 'password-success-message';
      successDiv.style.display = 'block';
    }
  }

  /**
   * Show email confirmation details
   */
  static showEmailConfirmation() {
    setTimeout(() => {
      const successDiv = document.getElementById('changePasswordSuccess');
      if (successDiv) {
        const emailConfirm = document.createElement('div');
        emailConfirm.className = 'password-email-confirmation';
        SecurityUtils.setTextContent(emailConfirm, '📬 Check your inbox for a security notification about this password change.');
        successDiv.appendChild(emailConfirm);
      }
    }, 1000);
  }

  /**
   * Get or create password message div
   * @param {string} id - ID of the message div
   * @returns {HTMLElement} Message div element
   */
  static getOrCreatePasswordMessageDiv(id) {
    let messageDiv = document.getElementById(id);
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.id = id;
      
      const form = document.getElementById('changePasswordForm');
      if (form) {
        form.appendChild(messageDiv);
      }
    }
    
    // Clear other message types
    const otherType = id === 'changePasswordError' ? 'changePasswordSuccess' : 'changePasswordError';
    const otherDiv = document.getElementById(otherType);
    if (otherDiv) {
      otherDiv.style.display = 'none';
    }
    
    return messageDiv;
  }

  /**
   * Clear password error messages
   */
  static clearPasswordErrors() {
    const errorElement = document.getElementById('changePasswordError');
    const successElement = document.getElementById('changePasswordSuccess');
    
    if (errorElement) errorElement.style.display = 'none';
    if (successElement) successElement.style.display = 'none';
  }

  /**
   * Real-time password validation with UI feedback
   * @param {string} password - Password to validate
   * @param {Object} Auth - Auth service reference
   */
  static validatePasswordWithUI(password, Auth) {
    if (!Auth) return;

    const validation = Auth.validatePasswordRequirements ? Auth.validatePasswordRequirements(password) : null;
    
    // Find or create validation feedback element
    let feedbackElement = document.getElementById('newPasswordValidation');
    if (!feedbackElement) {
      feedbackElement = document.createElement('div');
      feedbackElement.id = 'newPasswordValidation';
      feedbackElement.className = 'password-validation-feedback';
      
      const passwordField = document.getElementById('newPassword');
      if (passwordField?.parentNode) {
        passwordField.parentNode.appendChild(feedbackElement);
      }
    }
    
    if (!validation || password.length === 0) {
      feedbackElement.style.display = 'none';
      return;
    }
    
    feedbackElement.style.display = 'block';
    
    if (validation.isValid) {
      feedbackElement.className = 'password-validation-feedback password-validation-success';
      SecurityUtils.setTextContent(feedbackElement, '✅ Password meets all requirements');
    } else {
      feedbackElement.className = 'password-validation-feedback password-validation-error';
      SecurityUtils.clearElement(feedbackElement);
      
      // Create error header
      const errorHeader = document.createElement('div');
      SecurityUtils.setTextContent(errorHeader, '❌ Password requirements:');
      feedbackElement.appendChild(errorHeader);
      
      // Create error list
      const errorList = document.createElement('ul');
      errorList.style.margin = '0';
      errorList.style.paddingLeft = '20px';
      
      validation.errors.forEach(error => {
        const listItem = document.createElement('li');
        SecurityUtils.setTextContent(listItem, error);
        errorList.appendChild(listItem);
      });
      
      feedbackElement.appendChild(errorList);
    }
  }

  /**
   * Validate password confirmation with UI feedback
   * @param {string} password - Original password
   * @param {string} confirmPassword - Confirmation password
   */
  static validatePasswordMatchWithUI(password, confirmPassword) {
    let matchElement = document.getElementById('confirmPasswordValidation');
    if (!matchElement) {
      matchElement = document.createElement('div');
      matchElement.id = 'confirmPasswordValidation';
      matchElement.className = 'password-match-feedback';
      
      const confirmField = document.getElementById('confirmNewPassword');
      if (confirmField?.parentNode) {
        confirmField.parentNode.appendChild(matchElement);
      }
    }
    
    if (confirmPassword.length === 0) {
      matchElement.style.display = 'none';
      return;
    }
    
    matchElement.style.display = 'block';
    
    if (password === confirmPassword) {
      matchElement.className = 'password-match-feedback password-match-success';
      SecurityUtils.setTextContent(matchElement, '✅ Passwords match');
    } else {
      matchElement.className = 'password-match-feedback password-match-error';
      SecurityUtils.setTextContent(matchElement, '❌ Passwords do not match');
    }
  }

  /**
   * Clear password validation feedback
   */
  static clearPasswordValidationFeedback() {
    const elements = [
      'newPasswordValidation',
      'confirmPasswordValidation'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });
  }

  /**
   * Setup password strength requirements indicators
   * Creates visual requirement checklist for password requirements
   * @param {string} containerId - Container ID for requirements display
   */
  static setupPasswordRequirementsDisplay(containerId = 'passwordRequirements') {
    const container = document.getElementById(containerId);
    if (!container) return;

    SecurityUtils.clearElement(container);

    // Create requirements container
    const requirementsDiv = document.createElement('div');
    requirementsDiv.className = 'password-requirements';

    // Define requirements
    const requirements = [
      { id: 'req-length', text: 'Min 8 characters' },
      { id: 'req-uppercase', text: '1 uppercase letter' },
      { id: 'req-lowercase', text: '1 lowercase letter' },
      { id: 'req-number', text: '1 number' },
      { id: 'req-special', text: '1 special character' }
    ];

    // Create each requirement item
    requirements.forEach(req => {
      const requirementItem = document.createElement('div');
      requirementItem.className = 'requirement-item';
      requirementItem.id = req.id;

      const icon = document.createElement('span');
      icon.className = 'requirement-icon';
      SecurityUtils.setTextContent(icon, '⚪');

      const text = document.createElement('span');
      text.className = 'requirement-text';
      SecurityUtils.setTextContent(text, req.text);

      requirementItem.appendChild(icon);
      requirementItem.appendChild(text);
      requirementsDiv.appendChild(requirementItem);
    });

    container.appendChild(requirementsDiv);

    debug('✅ Password requirements display setup complete');
  }

  /**
   * Setup show/hide password toggle for a password input field
   * Universal function that works across all forms (login, register, reset, change password)
   * @param {HTMLElement} passwordInput - The password input element
   * @param {string} inputId - ID of the password input (for unique toggle button ID)
   */
  static setupPasswordToggle(passwordInput, inputId) {
    if (!passwordInput) return;

    // Check if toggle already exists
    const existingToggle = document.getElementById(`${inputId}Toggle`);
    if (existingToggle) return;

    // Create wrapper div if it doesn't exist
    let wrapper = passwordInput.parentElement;
    if (!wrapper.classList.contains('password-field-wrapper') && !wrapper.classList.contains('password-input-container')) {
      // Create new wrapper
      wrapper = document.createElement('div');
      wrapper.className = 'password-field-wrapper';
      
      // Insert wrapper before the input
      passwordInput.parentNode.insertBefore(wrapper, passwordInput);
      
      // Move input into wrapper
      wrapper.appendChild(passwordInput);
    } else {
      // Add the new class to existing container for consistency
      wrapper.classList.add('password-field-wrapper');
    }

    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.id = `${inputId}Toggle`;
    toggleButton.className = 'password-toggle-btn';
    SecurityUtils.setTextContent(toggleButton, '👁️');
    toggleButton.title = 'Show password';
    toggleButton.setAttribute('aria-label', 'Toggle password visibility');

    // Add click handler for toggle
    let isVisible = false;
    toggleButton.addEventListener('click', () => {
      isVisible = !isVisible;
      
      if (isVisible) {
        passwordInput.type = 'text';
        SecurityUtils.setTextContent(toggleButton, '🙈');
        toggleButton.title = 'Hide password';
        toggleButton.setAttribute('aria-label', 'Hide password');
      } else {
        passwordInput.type = 'password';
        SecurityUtils.setTextContent(toggleButton, '👁️');
        toggleButton.title = 'Show password';
        toggleButton.setAttribute('aria-label', 'Show password');
      }
    });

    // Insert the toggle button into the wrapper
    wrapper.appendChild(toggleButton);

    debug(`✅ Password toggle added for ${inputId} with universal wrapper`);
  }

  /**
   * Initialize password toggles for all forms (universal setup)
   * Automatically detects and adds toggles to all password inputs on the page
   */
  static initializeAllPasswordToggles() {
    // Common password input IDs across all forms
    const passwordInputIds = [
      // Login form
      'password',
      // Registration form
      'regPassword',
      'regConfirmPassword',
      // Reset password form
      'newPassword',
      'confirmPassword',
      // Change password form
      'currentPassword',
      'confirmNewPassword'
    ];

    passwordInputIds.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        this.setupPasswordToggle(input, id);
      }
    });

    debug('✅ Universal password toggles initialized for all forms');
  }

  /**
   * Test function to manually add password toggles (for debugging)
   * Uses the new universal system
   */
  static testPasswordToggles() {
    debug('🧪 Testing universal password toggles...');
    
    // Use the universal initializer
    this.initializeAllPasswordToggles();
    
    debug('🧪 Universal password toggles test complete');
  }
}
