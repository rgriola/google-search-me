/**
 * Authentication Handlers for Standalone Pages
 * Handles authentication functionality for pages like forgot-password.html, reset-password.html
 * This is separate from the main auth modules to avoid circular dependencies
 */

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
 * Show message to user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('error', 'success', 'info')
 */
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.style.display = 'block';

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
    
    return () => {
        button.textContent = originalText;
        button.disabled = originalDisabled;
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

    const submitBtn = form.querySelector('button[type="submit"]');
    const resetButton = setButtonLoading(submitBtn, 'Sending Reset Email...');

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(
                `✅ Password reset instructions have been sent to ${email}. Please check your email inbox (and spam folder) for the reset link.`,
                'success'
            );
            form.reset();
        } else {
            showMessage(data.error || 'Failed to send reset email. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        resetButton();
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
    
    if (!token) {
        showMessage('Invalid or missing reset token. Please request a new password reset.', 'error');
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
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('✅ Password reset successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(data.error || 'Failed to reset password. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Reset password error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        resetButton();
    }
}

/**
 * Initialize authentication handlers when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Initializing standalone authentication handlers...');
    
    // Handle forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
        console.log('✅ Forgot password form handler attached');
    }
    
    // Handle reset password form
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
        console.log('✅ Reset password form handler attached');
        
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
    
    console.log('🎯 Standalone authentication handlers initialized successfully');
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
        feedbackElement.innerHTML = '✅ Password meets all requirements';
    } else {
        feedbackElement.style.backgroundColor = '#f8d7da';
        feedbackElement.style.color = '#721c24';
        feedbackElement.style.border = '1px solid #f5c6cb';
        feedbackElement.innerHTML = '❌ Password requirements:<br>• ' + validation.errors.join('<br>• ');
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
        matchElement.innerHTML = '✅ Passwords match';
    } else {
        matchElement.style.backgroundColor = '#f8d7da';
        matchElement.style.color = '#721c24';
        matchElement.style.border = '1px solid #f5c6cb';
        matchElement.innerHTML = '❌ Passwords do not match';
    }
}

// Export functions for potential external use
window.AuthHandlers = {
    validatePassword,
    showMessage,
    handleForgotPassword,
    handleResetPassword
};
