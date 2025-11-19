// Test Login Page JavaScript
// Aligned with landing.js functionality and login-page.js security standards

// Import security utilities
import { SecurityUtils } from './js/utils/SecurityUtils.js';
import { debug, DEBUG } from './js/debug.js';


const FILE = 'LOGIN';

// Configuration constants matching login-page.js
const CONFIG = {
    API_BASE_URL: '/api',
    REDIRECT_DELAY: 200,
    MESSAGE_AUTO_HIDE: 5000,
    VALIDATION: {
        MAX_EMAIL_LENGTH: 100,
        MAX_PASSWORD_LENGTH: 128,
        MAX_USERNAME_LENGTH: 50,
        MAX_NAME_LENGTH: 100,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        HTML_PATTERN: /<[^>]*>/g
    }
};

const APP_PAGE = 'app.html';

// Form initialization (login only)
function initializeAuthForms() {
    // No form switching needed - login only page
    debug('Login form initialized');
}

// Security validation functions (matching login-page.js)
function validateInput(input, maxLength) {
    if (!input || typeof input !== 'string') {
        return false;
    }
    
    // Check length limit
    if (input.length > maxLength) {
        return false;
    }
    
    // Check for HTML tags (potential XSS)
    if (CONFIG.VALIDATION.HTML_PATTERN.test(input)) {
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    if (!validateInput(email, CONFIG.VALIDATION.MAX_EMAIL_LENGTH)) {
        return false;
    }
    
    // Basic email format validation
    return CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enhanced form validation with security checks
function validateLoginInputs(email, password) {
    if (!validateEmail(email)) {
        showSecureMessage('Please enter a valid email address.', 'error');
        return false;
    }

    if (!validateInput(password, CONFIG.VALIDATION.MAX_PASSWORD_LENGTH)) {
        showSecureMessage('Invalid password format.', 'error');
        return false;
    }
    
    return true;
}



// Enhanced secure message display (matching login-page.js)
function showSecureMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    // Use secure HTML escaping
    const escapedMessage = escapeHtml(message);
    messageDiv.textContent = escapedMessage;
    messageDiv.className = type === 'error' ? 'message error' : 'message success';
    messageDiv.classList.remove('hidden');
    
    // Keep messages visible until user interaction - following security guide UX improvements
    // No auto-hide timeouts for better accessibility
}

// Legacy function for backwards compatibility
function showMessage(message, type = 'info') {
    showSecureMessage(message, type);
}

// Form submission handlers
function initializeFormSubmissions() {
    const loginFormEl = document.getElementById('loginFormElement');

    // Login form submission with enhanced security
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            // Validate inputs with security checks
            if (!validateLoginInputs(email, password)) return;

            const loginData = { email, password, rememberMe };

            try {
                showSecureMessage('Signing in...', 'info');
                
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                const data = await response.json();

                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = data.retryAfter || '15 minutes';
                    showSecureMessage(`Too many login attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    return;
                }

                // Handle email verification requirement
                if (!data.success && data.requiresEmailVerification) {
                    showSecureMessage('Please verify your email address before logging in. Redirecting to verification page...', 'error');
                    
                    // Store email for verification page
                    sessionStorage.setItem('verificationEmail', email);
                    
                    // Redirect to verification page after showing message
                    setTimeout(() => {
                        window.location.href = 'verify-email.html?reason=login_required';
                    }, CONFIG.REDIRECT_DELAY);
                    return;
                }

                if (data.success) {
                    // Store auth token
                    localStorage.setItem('authToken', data.token);

                    if (data.session) {
                        localStorage.setItem('sessionToken', data.session.sessionToken);
                        localStorage.setItem('authUser', data.user);
                    }
                    
                    showSecureMessage('Login successful! Redirecting...', 'success');
                    
                    // Enhanced storage flush and redirect
                    setTimeout(() => {
                        // Force localStorage to flush
                        localStorage.setItem('_flush', 'true');
                        localStorage.removeItem('_flush');
                        
                        window.location.href = 'app.html?from=login&t=' + Date.now();
                    }, CONFIG.REDIRECT_DELAY);
                } else {
                    showSecureMessage('Login failed. Please check your email and password and try again.', 'error');
                }
            } catch (error) {
                debug('Login error:', error);
                showSecureMessage('Connection error. Please check your internet connection and try again.', 'error');
            }
        });
    }
}

// Modal functionality (matching landing.js)
function initializeModal() {
    const aboutModal = document.getElementById('aboutModal');
    const aboutLink = document.querySelector('.about-link');
    const closeModal = document.querySelector('.modal-close');

    // Open modal when About link is clicked
    if (aboutLink) {
        aboutLink.addEventListener('click', function(e) {
            e.preventDefault();
            aboutModal.classList.add('show');
            document.body.classList.add('modal-no-scroll');
        });
    }

    // Close modal when X is clicked
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            aboutModal.classList.remove('show');
            document.body.classList.remove('modal-no-scroll');
        });
    }

    // Close modal when clicking outside content
    aboutModal.addEventListener('click', function(e) {
        if (e.target === aboutModal) {
            aboutModal.classList.remove('show');
            document.body.classList.remove('modal-no-scroll');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && aboutModal.classList.contains('show')) {
            aboutModal.classList.remove('show');
            document.body.classList.remove('modal-no-scroll');
        }
    });
}

// Password toggle functionality
function initializePasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const showText = this.querySelector('.show-text');
            const hideText = this.querySelector('.hide-text');
            
            if (!targetInput || !showText || !hideText) return;
            
            if (targetInput.type === 'password') {
                // Show password
                targetInput.type = 'text';
                showText.classList.add('hidden');
                hideText.classList.remove('hidden');
                this.setAttribute('aria-label', 'Hide password');
            } else {
                // Hide password
                targetInput.type = 'password';
                showText.classList.remove('hidden');
                hideText.classList.add('hidden');
                this.setAttribute('aria-label', 'Show password');
            }
        });
        
        // Set initial aria-label
        toggle.setAttribute('aria-label', 'Show password');
    });
}

// Check if user is already authenticated
async function checkExistingAuth() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.valid) {
                // User is already authenticated, redirect to app
                window.location.href = APP_PAGE;
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('authUser');
            }
        }
    } catch (error) {
        debug('Auth check error:', error);
        // Remove potentially corrupted tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('authUser');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form switching
    initializeAuthForms();
    
    // Initialize form submissions
    initializeFormSubmissions();
    
    // Initialize modal functionality
    initializeModal();
    
    // Initialize password toggles
    initializePasswordToggles();
    
    // Add smooth scrolling - CSP compliant
    document.documentElement.classList.add('smooth-scroll');

    debug('Test Login page initialized');
});

// Check auth status when page loads
window.addEventListener('load', checkExistingAuth);
