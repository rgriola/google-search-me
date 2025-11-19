/**
 * Test Reset Password Page JavaScript - CSP Compliant Version
 * Based on registration.js validation patterns with enhanced security
 * Handles password reset functionality with comprehensive validation
 */

// Import security utilities
//import { SecurityUtils } from './js/utils/SecurityUtils.js';
import { debug, DEBUG } from './js/debug.js';

import { Url } from './js/config/Url.js';

const FILE = 'RESET_PASSWORD';

// Security utility functions (inline for consistency with registration.js)
const SecurityUtils = {
    sanitizeInput: function(input) {
        if (!input || typeof input !== 'string') return '';
        return input.trim();
    },
    sanitizeText: function(text) {
        if (!text || typeof text !== 'string') return '';
        return text.trim().replace(/[<>]/g, '');
    },
    escapeHtml: function(input) {
        if (!input || typeof input !== 'string') return '';
        const text = String(input);
        const htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        return text.replace(/[&<>"'/`=]/g, (match) => htmlEntities[match]);
    }
};

// Configuration constants (matching registration.js)
const CONFIG = {
    API_BASE_URL: '/api',
    REDIRECT_DELAY: 2000,
    RATE_LIMIT: {
        MAX_ATTEMPTS: 5,
        WINDOW_MINUTES: 15
    },
    VALIDATION: {
        MAX_PASSWORD_LENGTH: 128,
        MIN_PASSWORD_LENGTH: 8,
        HTML_PATTERN: /<[^>]*>/g,
        PASSWORD_REQUIREMENTS: {
            MIN_LENGTH: 8,
            REQUIRE_UPPERCASE: true,
            REQUIRE_LOWERCASE: true,
            REQUIRE_NUMBER: true,
            REQUIRE_SPECIAL: true,
            SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        ERROR_MESSAGES: {
            PASSWORD: {
                REQUIRED: 'Password is required',
                TOO_SHORT: 'Password must be at least 8 characters long',
                TOO_LONG: 'Password must be 128 characters or less',
                NO_UPPERCASE: 'Password must contain at least one uppercase letter (A-Z)',
                NO_LOWERCASE: 'Password must contain at least one lowercase letter (a-z)',
                NO_NUMBER: 'Password must contain at least one number (0-9)',
                NO_SPECIAL: 'Password must contain at least one special character (!@#$%^&*)',
                CONTAINS_HTML: 'Password cannot contain HTML tags',
                NO_MATCH: 'Passwords do not match'
            },
            TOKEN: {
                MISSING: 'Invalid or missing reset token. Please request a new password reset.',
                EXPIRED: 'This password reset link has expired. Please request a new password reset.',
                INVALID: 'Invalid reset token. Please request a new password reset.'
            },
            NETWORK: {
                CONNECTION_ERROR: 'Connection error. Please check your internet connection and try again.',
                SERVER_ERROR: 'Server error. Please try again later.',
                RATE_LIMITED: 'Too many attempts. Please wait before trying again.'
            }
        }
    }
};

/**
 * ResetPasswordPageService - Encapsulates reset password page functionality
 */
class ResetPasswordPageService {
    /**
     * Initialize the reset password page
     */
    static initialize() {
        debug(FILE, 'Initializing test reset password page');
        
        this._initializeEventListeners();
        this._initializePasswordToggles();
        this._initializeFormValidation();
        this._checkResetToken();
        this._initializeRateLimiting();
    }

    /**
     * Check for valid reset token in URL
     */
    static _checkResetToken() {
        const urlParams = new URLSearchParams(window.location.search);
        this.resetToken = urlParams.get('token');
        
        if (!this.resetToken) {
            this._showSecureMessage(CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.MISSING, 'error');
            debug(FILE, 'No reset token found in URL');
            return false;
        }
        
        // Basic token validation (should be alphanumeric with some special chars)
        const tokenPattern = /^[A-Za-z0-9+/=._-]+$/;
        if (!tokenPattern.test(this.resetToken) || this.resetToken.length < 10) {
            this._showSecureMessage(CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.INVALID, 'error');
            debug(FILE, 'Invalid reset token format');
            return false;
        }
        
        debug(FILE, 'Reset token validated successfully');
        return true;
    }

    /**
     * Initialize rate limiting tracking
     */
    static _initializeRateLimiting() {
        this.rateLimitData = {
            attempts: 0,
            windowStart: Date.now(),
            isLocked: false
        };
        
        // Check for existing rate limit data
        const storedData = localStorage.getItem('resetPasswordRateLimit');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                const now = Date.now();
                const windowExpired = (now - parsedData.windowStart) > (CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000);
                
                if (!windowExpired) {
                    this.rateLimitData = parsedData;
                    if (this.rateLimitData.isLocked) {
                        this._lockResetForm();
                    }
                } else {
                    // Window expired, reset
                    localStorage.removeItem('resetPasswordRateLimit');
                }
            } catch (error) {
                debug(FILE, 'Error parsing rate limit data:', error);
                localStorage.removeItem('resetPasswordRateLimit');
            }
        }
    }

    /**
     * Initialize page event listeners
     */
    static _initializeEventListeners() {
        // Reset password form
        this._setupResetPasswordForm();
        
        // Header navigation
        this._setupHeaderNavigation();
    }

    /**
     * Initialize password toggles (CSP compliant)
     */
    static _initializePasswordToggles() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        
        passwordToggles.forEach(toggle => {
            const targetId = toggle.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            
            if (targetInput) {
                toggle.addEventListener('click', function() {
                    if (targetInput.type === 'password') {
                        targetInput.type = 'text';
                        toggle.querySelector('.show-text').classList.add('hidden');
                        toggle.querySelector('.hide-text').classList.remove('hidden');
                        toggle.setAttribute('aria-label', 'Hide password');
                    } else {
                        targetInput.type = 'password';
                        toggle.querySelector('.show-text').classList.remove('hidden');
                        toggle.querySelector('.hide-text').classList.add('hidden');
                        toggle.setAttribute('aria-label', 'Show password');
                    }
                });
                
                // Set initial state
                toggle.setAttribute('aria-label', 'Show password');
            }
        });
        
        debug(FILE, 'Password toggles initialized');
    }

    /**
     * Setup reset password form submission handler
     */
    static _setupResetPasswordForm() {
        const resetPasswordForm = document.getElementById('resetPasswordFormElement');
        if (!resetPasswordForm) {
            debug(FILE, 'Reset password form not found');
            return;
        }
        
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            debug(FILE, 'Reset password form submitted');
            
            // Check rate limit first
            if (!this._checkRateLimit()) {
                return;
            }
            
            const formData = new FormData(resetPasswordForm);
            const userData = this._extractFormData(formData);
            
            // Validate inputs
            if (!this._validateResetPasswordInputs(userData)) {
                this._incrementRateLimit();
                return;
            }
            
            // Submit to server
            await this._submitResetPassword(userData);
        });
    }

    /**
     * Extract and sanitize form data
     */
    static _extractFormData(formData) {
        return {
            newPassword: formData.get('newPassword') || '',
            confirmPassword: formData.get('confirmPassword') || ''
        };
    }

    /**
     * Validate reset password inputs comprehensively
     */
    static _validateResetPasswordInputs(userData) {
        const allErrors = [];

        // Check reset token
        if (!this.resetToken) {
            allErrors.push(CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.MISSING);
        }

        // Password validation
        const passwordValidation = this._validatePasswordDetailed(userData.newPassword);
        if (!passwordValidation.isValid) {
            allErrors.push(...passwordValidation.errors);
        }

        // Password confirmation
        if (userData.newPassword !== userData.confirmPassword) {
            allErrors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_MATCH);
        }

        // Show errors if any exist
        if (allErrors.length > 0) {
            this._showValidationErrors(allErrors);
            return false;
        }
        
        return true;
    }

    /**
     * Comprehensive password validation with detailed error reporting
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with errors array
     */
    static _validatePasswordDetailed(password) {
        const errors = [];
        const requirements = CONFIG.VALIDATION.PASSWORD_REQUIREMENTS;
        
        if (!password || typeof password !== 'string') {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.REQUIRED);
            return { isValid: false, errors };
        }

        if (password.length < requirements.MIN_LENGTH) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.TOO_SHORT);
        }

        if (password.length > CONFIG.VALIDATION.MAX_PASSWORD_LENGTH) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.TOO_LONG);
        }

        if (CONFIG.VALIDATION.HTML_PATTERN.test(password)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.CONTAINS_HTML);
        }

        if (requirements.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_UPPERCASE);
        }

        if (requirements.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_LOWERCASE);
        }

        if (requirements.REQUIRE_NUMBER && !/\d/.test(password)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_NUMBER);
        }

        if (requirements.REQUIRE_SPECIAL) {
            const specialChars = requirements.SPECIAL_CHARS;
            const hasSpecial = specialChars.split('').some(char => password.includes(char));
            if (!hasSpecial) {
                errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_SPECIAL);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Submit reset password request to server
     */
    static async _submitResetPassword(userData) {
        const resetBtn = document.getElementById('resetBtn');
        
        // Show loading state
        if (resetBtn) {
            resetBtn.disabled = true;
            resetBtn.textContent = 'Updating Password...';
        }

        try {
            debug(FILE, 'Sending reset password request to server');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    token: this.resetToken,
                    newPassword: userData.newPassword
                })
            });

            const data = await response.json();
            debug(FILE, 'Reset password response received:', response.status);
            
            this._handleResetPasswordResponse(response, data);

        } catch (error) {
            debug(FILE, 'Reset password network error:', error);
            this._incrementRateLimit();
            this._showSecureMessage(CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.CONNECTION_ERROR, 'error');
        } finally {
            // Reset button state
            if (resetBtn) {
                resetBtn.disabled = false;
                resetBtn.textContent = 'Update Password';
            }
        }
    }

    /**
     * Handle reset password API response
     */
    static _handleResetPasswordResponse(response, data) {
        if (data.success || response.ok) {
            this._handleSuccessfulReset(data);
        } else {
            this._handleResetError(data, response.status);
        }
    }

    /**
     * Handle successful password reset
     */
    static _handleSuccessfulReset(data) {
        debug(FILE, 'Password reset successful');
        
        // Clear rate limit on success
        localStorage.removeItem('resetPasswordRateLimit');
        
        this._showSecureMessage('✅ Password reset successfully! Redirecting to login...', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = Url.LOGIN;
        }, CONFIG.REDIRECT_DELAY);
    }

    /**
     * Handle password reset errors
     */
    static _handleResetError(data, status) {
        let errorMessage = 'Password reset failed. Please try again.';
        
        // Handle specific error types
        const errorCode = data.code || data.error;
        
        if (errorCode) {
            switch (errorCode.toLowerCase()) {
                case 'token_expired':
                case 'expired_token':
                    errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.EXPIRED;
                    break;
                case 'invalid_token':
                case 'token_invalid':
                    errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.INVALID;
                    break;
                case 'rate_limited':
                case 'too_many_requests':
                    errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.RATE_LIMITED;
                    this._lockResetForm();
                    break;
                case 'weak_password':
                    errorMessage = 'Password does not meet security requirements. Please choose a stronger password.';
                    break;
                default:
                    errorMessage = data.message || errorMessage;
            }
        } else if (status === 429) {
            errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.RATE_LIMITED;
            this._lockResetForm();
        } else if (status >= 500) {
            errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.SERVER_ERROR;
        }
        
        this._incrementRateLimit();
        this._showSecureMessage(errorMessage, 'error');
    }

    /**
     * Setup header navigation
     */
    static _setupHeaderNavigation() {
        // Handle any navigation links that need special handling
        debug(FILE, 'Header navigation setup completed');
    }

    /**
     * Initialize real-time form validation
     */
    static _initializeFormValidation() {
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this._updatePasswordStrengthIndicator(e.target.value);
            });
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', (e) => {
                const newPassword = newPasswordInput ? newPasswordInput.value : '';
                this._updatePasswordMatchIndicator(newPassword, e.target.value);
            });
        }
    }

    /**
     * Update password strength indicator with detailed requirements
     */
    static _updatePasswordStrengthIndicator(password) {
        const requirements = [
            { test: password.length >= 8, text: 'At least 8 characters long' },
            { test: /[A-Z]/.test(password), text: 'One uppercase letter (A-Z)' },
            { test: /[a-z]/.test(password), text: 'One lowercase letter (a-z)' },
            { test: /\d/.test(password), text: 'One number (0-9)' },
            { test: /[!@#$%^&*()_+-=\[\]{}|;:,.<>?]/.test(password), text: 'One special character (!@#$%^&*)' }
        ];

        const requirementsList = document.querySelectorAll('.password-requirements li');
        
        requirements.forEach((requirement, index) => {
            const listItem = requirementsList[index];
            if (listItem) {
                // Remove existing classes
                listItem.classList.remove('valid', 'invalid');
                // Add appropriate class based on test result
                listItem.classList.add(requirement.test ? 'valid' : 'invalid');
            }
        });
        
        debug(FILE, 'Password requirements updated for password length:', password.length);
    }

    /**
     * Update password match indicator
     */
    static _updatePasswordMatchIndicator(newPassword, confirmPassword) {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (!confirmPasswordInput) return;
        
        // Remove existing validation classes
        confirmPasswordInput.classList.remove('valid', 'invalid');
        
        // Only validate if both fields have content
        if (newPassword.length > 0 && confirmPassword.length > 0) {
            const matches = newPassword === confirmPassword;
            confirmPasswordInput.classList.add(matches ? 'valid' : 'invalid');
            debug(FILE, 'Password match check:', matches);
        }
    }

    /**
     * Rate limiting methods
     */
    static _checkRateLimit() {
        const now = Date.now();
        const windowExpired = (now - this.rateLimitData.windowStart) > (CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000);
        
        if (windowExpired) {
            this._resetRateLimit();
        }
        
        if (this.rateLimitData.isLocked) {
            const timeRemaining = Math.ceil(((this.rateLimitData.windowStart + (CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000)) - now) / 60000);
            this._showSecureMessage(`Too many failed attempts. Please wait ${timeRemaining} minutes before trying again.`, 'error');
            return false;
        }
        
        return true;
    }

    static _incrementRateLimit() {
        this.rateLimitData.attempts++;
        this.rateLimitData.windowStart = this.rateLimitData.windowStart || Date.now();
        
        if (this.rateLimitData.attempts >= CONFIG.RATE_LIMIT.MAX_ATTEMPTS) {
            this._lockResetForm();
        }
        
        localStorage.setItem('resetPasswordRateLimit', JSON.stringify(this.rateLimitData));
    }

    static _lockResetForm() {
        this.rateLimitData.isLocked = true;
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.disabled = true;
            resetBtn.textContent = 'Rate Limited - Please Wait';
        }
        
        localStorage.setItem('resetPasswordRateLimit', JSON.stringify(this.rateLimitData));
    }

    static _resetRateLimit() {
        this.rateLimitData = {
            attempts: 0,
            windowStart: Date.now(),
            isLocked: false
        };
        
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.textContent = 'Update Password';
        }
        
        localStorage.removeItem('resetPasswordRateLimit');
    }

    /**
     * Display secure messages
     */
    static _showSecureMessage(message, type = 'error') {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) {
            debug(FILE, 'Message div not found');
            return;
        }

        // Use textContent only - no innerHTML for security
        const sanitizedMessage = SecurityUtils.sanitizeText(message);
        messageDiv.textContent = sanitizedMessage;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        // Scroll message into view
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Display validation errors in a structured, user-friendly format
     */
    static _showValidationErrors(errors) {
        const messageDiv = document.getElementById('message');
        if (!messageDiv || !errors || errors.length === 0) {
            return;
        }

        // Create a structured error message
        let errorMessage;
        if (errors.length === 1) {
            errorMessage = errors[0];
        } else {
            errorMessage = 'Please fix the following ' + errors.length + ' issues: ' + errors.join('. ');
        }

        // Use textContent for security
        const sanitizedMessage = SecurityUtils.sanitizeText(errorMessage);
        messageDiv.textContent = sanitizedMessage;
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
        
        // Scroll message into view
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        debug(FILE, 'Displayed ' + errors.length + ' validation errors');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    debug(FILE, 'DOM loaded, initializing reset password page');
    ResetPasswordPageService.initialize();
});

// Export for potential external use
window.ResetPasswordPageService = ResetPasswordPageService;
