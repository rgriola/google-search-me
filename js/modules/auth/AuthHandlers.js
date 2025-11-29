/**
 * Authentication Handlers for Standalone Pages
 * Handles authentication functionality for pages like forgot-password.html, reset-password.html
 * This is separate from the main auth modules to avoid circular dependencies
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';
import { PasswordUIService } from '../ui/PasswordUIService.js';
import { Url } from '../../config/Url.js';

// Debug configuration - set to false in production
//const DEBUG = environment.DEBUG || false;

const DEBUG = false;

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

/**
 * Password validation function (matching server-side requirements)
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push('Password must be at least 8 characters long');
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Show message to user with security escaping
 * @param {string} message - Message to display
 * @param {string} type - Message type ('error', 'success', 'info')
 */
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    // Use SecurityUtils for safe content
    const escapedMessage = SecurityUtils.escapeHtml(message);
    messageDiv.textContent = escapedMessage;
    messageDiv.className = type;
    messageDiv.style.display = 'block';

    // Debug the message being shown
    debug(`📝 Message shown (${type}): ${message}`);

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Show loading state on button
 * @param {HTMLButtonElement} button - Button element
 * @param {string} loadingText - Text to show during loading
 * @returns {Function} Function to reset button state
 */
function setButtonLoading(button, loadingText = 'Please wait...') {
    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    
    button.textContent = loadingText;
    button.disabled = true;
    
    debug(`🔄 Button state changed: "${originalText}" → "${loadingText}"`);
    
    return () => {
        button.textContent = originalText;
        button.disabled = originalDisabled;
        debug(`🔄 Button state restored: "${loadingText}" → "${originalText}"`);
    };
}

/**
 * Handle forgot password form submission
 */
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('forgotEmail');
    
    debug('🔑 Handling forgot password request for email:', email);
    
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    // Security validation for email input
    if (email.length > 254 || /<[^>]*>/g.test(email)) {
        showMessage('Invalid email format', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const resetButton = setButtonLoading(submitBtn, 'Sending Reset Email...');

    try {
        debug('🌐 Sending forgot password request to server');
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        debug('📡 Forgot password response:', data);
        handleServerResponse(data, response.ok, 'forgot-password');

    } catch (error) {
        if (DEBUG) console.error('❌ Forgot password error:', error);
        handleServerResponse(null, false, 'network');
    } finally {
        resetButton();
    }
}

/**
 * Validate password input securely
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
function validatePasswordInput(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }
    
    // Check length limit (reasonable maximum)
    if (password.length > 128) {
        return false;
    }
    
    // Check for HTML tags (potential XSS)
    if (/<[^>]*>/g.test(password)) {
        return false;
    }
    
    return true;
}

/**
 * Handle server response securely with generic error messages
 * @param {Object} data - Response data
 * @param {boolean} success - Whether request was successful
 * @param {string} operation - Operation being performed
 */
function handleServerResponse(data, success, operation) {
    debug(`🔄 Handling server response for ${operation}:`, { success, data });
    
    if (success) {
        if (operation === 'reset-password') {
            showMessage('✅ Password reset successfully! Redirecting to login...', 'success');
            debug('🔀 Will redirect to login page in 2 seconds');
            setTimeout(() => {
                window.location.href = Url.LOGIN;
            }, 2000);
        } else if (operation === 'forgot-password') {
            showMessage('✅ Password reset instructions have been sent. Please check your email inbox (and spam folder) for the reset link.', 'success');
        }
    } else {
        // Generic error messages to prevent information disclosure
        const genericMessages = {
            'reset-password': 'Unable to reset password. Please check that your reset link is valid and try again.',
            'forgot-password': 'Unable to send password reset email. Please check your email address and try again.',
            'network': 'Connection error. Please check your internet connection and try again.'
        };
        
        showMessage(genericMessages[operation] || genericMessages['network'], 'error');
    }
}

/**
 * Handle reset password form submission
 */
async function handleResetPassword(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    debug('🔑 Handling password reset with token:', token ? `${token.substring(0, 10)}...` : 'missing');
    
    if (!token) {
        showMessage('Invalid or missing reset token. Please request a new password reset.', 'error');
        return;
    }

    // Security validation for password inputs
    if (!validatePasswordInput(newPassword) || !validatePasswordInput(confirmPassword)) {
        showMessage('Invalid password format. Please check your input.', 'error');
        return;
    }

    // Password validation
    if (!newPassword || !confirmPassword) {
        showMessage('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        showMessage(passwordValidation.errors.join('. '), 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const resetButton = setButtonLoading(submitBtn, 'Updating Password...');

    try {
        debug('🌐 Sending password reset request to server');
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        debug('📡 Reset password response:', data);
        handleServerResponse(data, response.ok, 'reset-password');

    } catch (error) {
        if (DEBUG) console.error('❌ Reset password error:', error);
        handleServerResponse(null, false, 'network');
    } finally {
        resetButton();
    }
}

/**
 * Initialize authentication handlers when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    debug('🔐 Initializing standalone authentication handlers...');
    
    // Handle forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
        debug('✅ Forgot password form handler attached');
    }
    
    // Handle reset password form
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
        debug('✅ Reset password form handler attached');
        
        // Add real-time password validation
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');
        
        if (newPasswordField) {
            newPasswordField.addEventListener('input', function() {
                validatePasswordRealTime(this.value);
            });
        }
        
        if (confirmPasswordField) {
            confirmPasswordField.addEventListener('input', function() {
                validatePasswordMatch(newPasswordField.value, this.value);
            });
        }
    }
    
    // Initialize password toggles for all password inputs
    PasswordUIService.initializeAllPasswordToggles();
    
    debug('🎯 Standalone authentication handlers initialized successfully');
});

/**
 * Real-time password validation feedback
 * @param {string} password - Password to validate
 */
function validatePasswordRealTime(password) {
    const validation = validatePassword(password);
    
    // Find or create validation feedback element
    let feedbackElement = document.getElementById('passwordValidationFeedback');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'passwordValidationFeedback';
        feedbackElement.style.cssText = `
            margin-top: 8px;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        const passwordField = document.getElementById('newPassword');
        if (passwordField && passwordField.parentNode) {
            passwordField.parentNode.appendChild(feedbackElement);
        }
    }
    
    if (password.length === 0) {
        feedbackElement.style.display = 'none';
        return;
    }
    
    feedbackElement.style.display = 'block';
    
    if (validation.isValid) {
        feedbackElement.style.backgroundColor = '#d4edda';
        feedbackElement.style.color = '#155724';
        feedbackElement.style.border = '1px solid #c3e6cb';
        // Use SecurityUtils for safe content
        SecurityUtils.setSafeHTML(feedbackElement, '✅ Password meets all requirements');
        debug('✅ Password validation passed');
    } else {
        feedbackElement.style.backgroundColor = '#f8d7da';
        feedbackElement.style.color = '#721c24';
        feedbackElement.style.border = '1px solid #f5c6cb';
        // Create safe HTML content for validation errors
        const safeContent = '❌ Password requirements:\n• ' + validation.errors.join('\n• ');
        feedbackElement.textContent = safeContent;
        debug('❌ Password validation failed:', validation.errors);
    }
}

/**
 * Validate password confirmation match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 */
function validatePasswordMatch(password, confirmPassword) {
    let matchElement = document.getElementById('passwordMatchFeedback');
    if (!matchElement) {
        matchElement = document.createElement('div');
        matchElement.id = 'passwordMatchFeedback';
        matchElement.style.cssText = `
            margin-top: 8px;
            padding: 8px;
            border-radius: 6px;
            font-size: 13px;
        `;
        
        const confirmField = document.getElementById('confirmPassword');
        if (confirmField && confirmField.parentNode) {
            confirmField.parentNode.appendChild(matchElement);
        }
    }
    
    if (confirmPassword.length === 0) {
        matchElement.style.display = 'none';
        return;
    }
    
    matchElement.style.display = 'block';
    
    if (password === confirmPassword) {
        matchElement.style.backgroundColor = '#d4edda';
        matchElement.style.color = '#155724';
        matchElement.style.border = '1px solid #c3e6cb';
        matchElement.textContent = '✅ Passwords match';
        debug('✅ Password match validation passed');
    } else {
        matchElement.style.backgroundColor = '#f8d7da';
        matchElement.style.color = '#721c24';
        matchElement.style.border = '1px solid #f5c6cb';
        matchElement.textContent = '❌ Passwords do not match';
        debug('❌ Password match validation failed');
    }
}

// Export functions for potential external use
window.AuthHandlers = {
    validatePassword,
    showMessage,
    handleForgotPassword,
    handleResetPassword
};
