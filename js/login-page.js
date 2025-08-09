/**
 * Login Page JavaScript - CSP Compliant Version
 * Handles login and registration form functionality
 * Moved from inline script to comply with Content Security Policy
 */

import { SecurityUtils } from './utils/SecurityUtils.js';
import { Auth } from './modules/auth/Auth.js';

const API_BASE_URL = '/api';

// Security constants
const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum
const MAX_PASSWORD_LENGTH = 128; // Reasonable maximum
const MAX_USERNAME_LENGTH = 50;
const MAX_NAME_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate input securely
 * @param {string} input - Input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if valid
 */
function validateInput(input, maxLength) {
    if (!input || typeof input !== 'string') {
        return false;
    }
    
    // Check length limit
    if (input.length > maxLength) {
        return false;
    }
    
    // Check for HTML tags (potential XSS)
    if (/<[^>]*>/g.test(input)) {
        return false;
    }
    
    return true;
}

/**
 * Validate email input securely
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
    if (!validateInput(email, MAX_EMAIL_LENGTH)) {
        return false;
    }
    
    // Basic email format validation
    return EMAIL_PATTERN.test(email);
}

/**
 * Handle server response securely with generic error messages
 * @param {Object} data - Response data
 * @param {boolean} success - Whether request was successful
 * @param {string} operation - Operation being performed
 */
function handleServerResponse(data, success, operation) {
    if (success) {
        if (operation === 'login') {
            // Store auth token
            localStorage.setItem('authToken', data.token);
            console.log('💾 Stored auth token:', data.token.substring(0, 20) + '...');
            
            if (data.session) {
                localStorage.setItem('sessionToken', data.session.sessionToken);
                console.log('💾 Stored session token:', data.session.sessionToken.substring(0, 20) + '...');
            }
            
            showSecureMessage('Login successful! Redirecting...', 'success');
            console.log('✅ Login successful, redirecting to app...');
            
            // Enhanced storage flush and redirect
            setTimeout(async () => {
                // Force localStorage to flush
                localStorage.setItem('_flush', 'true');
                localStorage.removeItem('_flush');
                
                // Redirect to main app with login indicator
                window.location.href = 'app.html?from=login&t=' + Date.now();
            }, 1500);
            
        } else if (operation === 'register') {
            // Store auth token if present (but don't auto-login if verification required)
            if (data.token && !data.requiresVerification) {
                localStorage.setItem('authToken', data.token);
                console.log('💾 Stored auth token after registration');
            }
            
            // Show appropriate success message based on email verification status
            if (data.requiresVerification) {
                showSecureMessage('Account created successfully! Please check your email to verify your account.', 'success');
                
                // Store email for verification page
                sessionStorage.setItem('verificationEmail', data.user.email);
                
                // Redirect to verification page instead of app
                setTimeout(() => {
                    window.location.href = 'verify-email.html?reason=registration';
                }, 2000);
            } else {
                showSecureMessage('Account created successfully! Redirecting to your dashboard...', 'success');
                
                // Only redirect to app if no verification is required
                setTimeout(async () => {
                    // Force localStorage to flush
                    localStorage.setItem('_flush', 'true');
                    localStorage.removeItem('_flush');
                    
                    // Redirect to main app with registration indicator
                    window.location.href = 'app.html?from=register&t=' + Date.now();
                }, 2000);
            }
        }
    } else {
        // Generic error messages to prevent information disclosure
        const genericMessages = {
            'login': 'Login failed. Please check your email and password and try again.',
            'register': 'Registration failed. Please check your information and try again.',
            'network': 'Connection error. Please check your internet connection and try again.'
        };
        
        showSecureMessage(genericMessages[operation] || genericMessages['network'], 'error');
    }
}

/**
 * Display secure messages without exposing system details
 * @param {string} message - Message to display
 * @param {string} type - Message type (success/error)
 */
function showSecureMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    // Use SecurityUtils for safe content
    const escapedMessage = SecurityUtils.escapeHtml(message);
    messageDiv.textContent = escapedMessage;
    messageDiv.className = type === 'error' ? 'error' : 'success';
    messageDiv.classList.remove('hidden');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Show register form and hide login form
 */
function showRegisterForm() {
    const loginContainer = document.getElementById('loginFormContainer');
    const registerForm = document.getElementById('registerForm');
    
    if (loginContainer) loginContainer.classList.add('hidden');
    if (registerForm) registerForm.classList.remove('hidden');
}

/**
 * Show login form and hide register form
 */
function showLoginForm() {
    const loginContainer = document.getElementById('loginFormContainer');
    const registerForm = document.getElementById('registerForm');
    
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
}

/**
 * Legacy function for compatibility - now using secure message display
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether message is an error
 */
function showMessage(message, isError = false) {
    showSecureMessage(message, isError ? 'error' : 'success');
}

/**
 * Initialize page event listeners
 */
function initializeEventListeners() {
    // Secure event listeners for form switching
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }

    // Login form handler with security validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            console.log('🔐 Login form submitted');
            
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            const rememberMe = formData.get('rememberMe') === 'on';

            // Client-side security validation
            if (!validateEmail(email)) {
                showSecureMessage('Please enter a valid email address.', 'error');
                return;
            }

            if (!validateInput(password, MAX_PASSWORD_LENGTH)) {
                showSecureMessage('Invalid password format.', 'error');
                return;
            }

            const loginData = { email, password, rememberMe };
            console.log('📧 Login data:', { email: loginData.email, rememberMe: loginData.rememberMe });

            try {
                console.log('🌐 Sending login request to:', `${API_BASE_URL}/auth/login`);
                
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                console.log('📡 Response status:', response.status);
                const data = await response.json();
                console.log('📦 Response data:', data);

                // Handle rate limiting specifically
                if (response.status === 429) {
                    console.log('🚫 Rate limited');
                    const retryAfter = data.retryAfter || '15 minutes';
                    showSecureMessage(`Too many login attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    return;
                }

                // Handle email verification requirement specifically
                if (!data.success && data.requiresEmailVerification) {
                    console.log('📧 Email verification required, redirecting...');
                    showSecureMessage('Please verify your email address before logging in. Redirecting to verification page...', 'error');
                    
                    // Store email for verification page
                    sessionStorage.setItem('verificationEmail', email);
                    
                    // Redirect to verification page after showing message
                    setTimeout(() => {
                        window.location.href = 'verify-email.html?reason=login_required';
                    }, 2000);
                    return;
                }

                handleServerResponse(data, data.success, 'login');

            } catch (error) {
                console.error('Login error:', error);
                handleServerResponse(null, false, 'network');
            }
        });
    }

    // Registration form handler with security validation
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const username = formData.get('username');
            const email = formData.get('email');
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            // Client-side security validation
            if (!validateInput(username, MAX_USERNAME_LENGTH)) {
                showSecureMessage('Invalid username format.', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showSecureMessage('Please enter a valid email address.', 'error');
                return;
            }

            if (firstName && !validateInput(firstName, MAX_NAME_LENGTH)) {
                showSecureMessage('Invalid first name format.', 'error');
                return;
            }

            if (lastName && !validateInput(lastName, MAX_NAME_LENGTH)) {
                showSecureMessage('Invalid last name format.', 'error');
                return;
            }

            if (!validateInput(password, MAX_PASSWORD_LENGTH)) {
                showSecureMessage('Invalid password format.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showSecureMessage('Passwords do not match', 'error');
                return;
            }

            const registerData = {
                username,
                email,
                firstName,
                lastName,
                password
            };

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registerData)
                });

                const data = await response.json();
                
                // Handle rate limiting specifically
                if (response.status === 429) {
                    console.log('🚫 Registration rate limited');
                    const retryAfter = data.retryAfter || '1 hour';
                    showSecureMessage(`Too many registration attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    return;
                }
                
                handleServerResponse(data, data.success, 'register');

            } catch (error) {
                console.error('Registration error:', error);
                handleServerResponse(null, false, 'network');
            }
        });
    }
}

/**
 * Check if user is already logged in
 */
async function checkExistingAuth() {
    const isAuthenticated = await Auth.isAuthenticated();
    if (isAuthenticated) {
        window.location.href = 'app.html';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Check auth status when page loads
window.addEventListener('load', checkExistingAuth);
