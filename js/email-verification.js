/**
 * Email Verification Module
 * Handles email verification and resend functionality
 * Security compliant - no inline scripts
 */

import { SecurityUtils } from './utils/SecurityUtils.js';

// Configuration constants
const API_BASE_URL = '/api';
const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DOM elements
let verificationIcon, verificationTitle, verificationMessage, verificationActions, resendSection;

/**
 * Initialize email verification page
 */
function initializeEmailVerification() {
    // Get DOM elements
    verificationIcon = document.getElementById('verificationIcon');
    verificationTitle = document.getElementById('verificationTitle');
    verificationMessage = document.getElementById('verificationMessage');
    verificationActions = document.getElementById('verificationActions');
    resendSection = document.getElementById('resendSection');
    
    // Get parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const reason = urlParams.get('reason');
    
    // Setup event listeners
    setupEventListeners();
    
    // Handle different verification scenarios
    if (!token) {
        if (reason === 'login_required') {
            // User came from failed login due to unverified email
            showLoginRequiredMessage();
        } else if (reason === 'registration') {
            // User came from successful registration
            showRegistrationConfirmationMessage();
        } else {
            // Default resend form
            showResendForm();
        }
    } else {
        verifyEmail(token);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Go to app button
    document.getElementById('goToAppBtn').addEventListener('click', function() {
        window.location.href = '/';
    });
    
    // Resend form submission
    document.getElementById('resendForm').addEventListener('submit', handleResendFormSubmit);
}

/**
 * Validate email input securely
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // Check length limit
    if (email.length > MAX_EMAIL_LENGTH) {
        return false;
    }
    
    // Check for HTML tags (potential XSS)
    if (/<[^>]*>/g.test(email)) {
        return false;
    }
    
    // Basic email format validation
    return EMAIL_PATTERN.test(email);
}

/**
 * Display secure messages without exposing system details
 * @param {string} message - Message to display
 * @param {string} type - Message type (success/error)
 */
function showSecureMessage(message, type = 'error') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    // Use SecurityUtils to escape content
    const escapedMessage = SecurityUtils.escapeHtml(message);
    SecurityUtils.setSafeHTML(messageDiv, escapedMessage);
    
    const container = document.querySelector('.verification-container');
    container.insertBefore(messageDiv, resendSection);
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

/**
 * Handle server response securely
 * @param {Object} data - Response data
 * @param {boolean} success - Whether request was successful
 * @param {string} operation - Operation being performed
 */
function handleServerResponse(data, success, operation) {
    if (success) {
        if (operation === 'verify') {
            showSuccess();
        } else if (operation === 'resend') {
            showSecureMessage('Verification email sent successfully!', 'success');
            document.getElementById('resendForm').reset();
        }
    } else {
        // Generic error messages to prevent information disclosure
        const genericMessages = {
            'verify': 'Email verification failed. Please try again or request a new verification email.',
            'resend': 'Unable to send verification email. Please check your email address and try again.',
            'network': 'Connection error. Please check your internet connection and try again.'
        };
        
        showSecureMessage(genericMessages[operation] || genericMessages['network'], 'error');
    }
}

/**
 * Verify email with token
 * @param {string} token - Verification token
 */
async function verifyEmail(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        handleServerResponse(data, response.ok, 'verify');
        
    } catch (error) {
        console.error('Verification error:', error);
        handleServerResponse(null, false, 'network');
    }
}

/**
 * Show success state
 */
function showSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason');
    
    verificationIcon.textContent = '✅';
    verificationIcon.className = 'verification-icon success';
    verificationTitle.textContent = 'Email Verified!';
    
    if (reason === 'login_required') {
        verificationMessage.textContent = 'Your email has been successfully verified. You can now log in to access all features of the app.';
        
        // Update the "Go to App" button to say "Go to Login"
        const goToAppBtn = document.getElementById('goToAppBtn');
        if (goToAppBtn) {
            goToAppBtn.textContent = 'Go to Login';
            // Remove any existing listeners
            const newBtn = goToAppBtn.cloneNode(true);
            goToAppBtn.parentNode.replaceChild(newBtn, goToAppBtn);
            // Add secure event listener
            newBtn.addEventListener('click', function() {
                window.location.href = '/login.html';
            });
        }
    } else if (reason === 'registration') {
        verificationMessage.textContent = 'Your email has been successfully verified! Your registration is now complete. You can log in to start using the app.';
        
        // Update the "Go to App" button to say "Go to Login"
        const goToAppBtn = document.getElementById('goToAppBtn');
        if (goToAppBtn) {
            goToAppBtn.textContent = 'Log In Now';
            // Remove any existing listeners
            const newBtn = goToAppBtn.cloneNode(true);
            goToAppBtn.parentNode.replaceChild(newBtn, goToAppBtn);
            // Add secure event listener
            newBtn.addEventListener('click', function() {
                window.location.href = '/login.html';
            });
        }
    } else {
        verificationMessage.textContent = 'Your email has been successfully verified. You can now access all features of the app.';
    }
    
    verificationActions.classList.remove('hidden');
    verificationActions.classList.add('visible');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showError(message) {
    verificationIcon.textContent = '❌';
    verificationIcon.className = 'verification-icon error';
    verificationTitle.textContent = 'Verification Failed';
    // Use SecurityUtils for safe text content
    const escapedMessage = SecurityUtils.escapeHtml(message);
    verificationMessage.textContent = escapedMessage;
    resendSection.classList.remove('hidden');
    resendSection.classList.add('visible');
}

/**
 * Show resend form
 */
function showResendForm() {
    verificationIcon.textContent = '📧';
    verificationIcon.className = 'verification-icon';
    verificationTitle.textContent = 'Email Verification';
    verificationMessage.textContent = 'Enter your email address to resend the verification email.';
    resendSection.classList.remove('hidden');
    resendSection.classList.add('visible');
}

/**
 * Show login required message when user comes from failed login
 */
function showLoginRequiredMessage() {
    verificationIcon.textContent = '🔒';
    verificationIcon.className = 'verification-icon warning';
    verificationTitle.textContent = 'Email Verification Required';
    verificationMessage.textContent = 'You must verify your email address before you can log in. Please check your inbox for a verification email, or enter your email below to resend it.';
    
    // Pre-populate email from sessionStorage if available
    const storedEmail = sessionStorage.getItem('verificationEmail');
    if (storedEmail && validateEmail(storedEmail)) {
        const emailInput = document.getElementById('resendEmail');
        if (emailInput) {
            emailInput.value = storedEmail;
        }
    }
    
    resendSection.classList.remove('hidden');
    resendSection.classList.add('visible');
    
    // Clear the stored email to prevent it from being used again
    sessionStorage.removeItem('verificationEmail');
}

/**
 * Show registration confirmation message when user comes from successful registration
 */
function showRegistrationConfirmationMessage() {
    verificationIcon.textContent = '📧';
    verificationIcon.className = 'verification-icon';
    verificationTitle.textContent = 'Check Your Email';
    verificationMessage.textContent = 'Thank you for registering! We\'ve sent a verification email to your inbox. Please click the link in the email to verify your account and complete your registration.';
    
    // Pre-populate email from sessionStorage if available
    const storedEmail = sessionStorage.getItem('verificationEmail');
    if (storedEmail && validateEmail(storedEmail)) {
        const emailInput = document.getElementById('resendEmail');
        if (emailInput) {
            emailInput.value = storedEmail;
        }
        
        // Show a more personalized message with the email
        verificationMessage.textContent = `Thank you for registering! We've sent a verification email to ${storedEmail}. Please click the link in the email to verify your account and complete your registration.`;
    }
    
    resendSection.classList.remove('hidden');
    resendSection.classList.add('visible');
    
    // Clear the stored email to prevent it from being used again
    sessionStorage.removeItem('verificationEmail');
}

/**
 * Handle resend form submission
 * @param {Event} e - Submit event
 */
async function handleResendFormSubmit(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('resendEmail');
    const email = emailInput.value.trim();
    const submitButton = e.target.querySelector('button');
    const originalText = submitButton.textContent;
    
    // Client-side validation
    if (!validateEmail(email)) {
        showSecureMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        handleServerResponse(data, response.ok, 'resend');
        
    } catch (error) {
        console.error('Resend error:', error);
        handleServerResponse(null, false, 'network');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEmailVerification);
