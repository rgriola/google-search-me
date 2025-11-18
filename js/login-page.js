/**
 * Login Page JavaScript - CSP Compliant Version
 * Handles login and registration form functionality
 */

import { SecurityUtils } from './utils/SecurityUtils.js';
import { Auth } from './modules/auth/Auth.js';
import { PasswordUIService } from './modules/ui/PasswordUIService.js';

// Using explicit relative path for debug.js to ensure proper resolution in all environments
import { debug, DEBUG } from './debug.js';
const FILE = 'LOGIN';

// Configuration constants
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

/**
 * LoginPageService - Encapsulates login page functionality
 */
class LoginPageService {
    /**
     * Initialize the login page
     */
    static initialize() {
        this._initializeEventListeners();
        PasswordUIService.initializeAllPasswordToggles();
        
        // Check for URL parameters (like ?mode=register)
        this._checkUrlParameters();
        
        // Check auth status when page loads
        window.addEventListener('load', this._checkExistingAuth);
    }

    /**
     * Check if user is already logged in
     */
    static async _checkExistingAuth() {
        const isAuthenticated = await Auth.isAuthenticated();
        if (isAuthenticated) {
            window.location.href = 'app.html';
        }
    }

    /**
     * Check URL parameters for automatic form switching
     */
    static _checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        if (mode === 'register') {
            debug(FILE, 'URL parameter detected: switching to registration form');
            this._showRegisterForm();
        }
    }

    /**
     * Initialize page event listeners
     */
    static _initializeEventListeners() {
        // Form switching links
        this._setupFormSwitchingLinks();
        
        // Login form
        this._setupLoginForm();
        
        // Registration form
        this._setupRegistrationForm();
    }

    /**
     * Set up form switching links
     */
    static _setupFormSwitchingLinks() {
        const showRegisterLink = document.getElementById('showRegisterLink');
        const showLoginLink = document.getElementById('showLoginLink');
        
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this._showRegisterForm();
            });
        }
        
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this._showLoginForm();
            });
        }
    }

    /**
     * Set up login form submission handler
     */
    static _setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            debug('🔐 Login form submitted');
            
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            const rememberMe = formData.get('rememberMe') === 'on';

            // Validate inputs
            if (!this._validateLoginInputs(email, password)) return;

            const loginData = { email, password, rememberMe };
            debug('📧 Login data:', { email: loginData.email, rememberMe: loginData.rememberMe });

            try {
                debug('🌐 Sending login request to:', `${CONFIG.API_BASE_URL}/auth/login`);
                const response = await this._sendLoginRequest(loginData);
                
                debug('📡 Response status:', response.status);
                const data = await response.json();
                debug('📦 Response data:', data);

                // Handle response based on status
                await this._handleLoginResponse(response, data, email);
            } catch (error) {
                if (DEBUG) console.error('Login error:', error);
                this._handleServerResponse(null, false, 'network');
            }
        });
    }

    /**
     * Validate login inputs
     */
    static _validateLoginInputs(email, password) {
        if (!this._validateEmail(email)) {
            this._showSecureMessage('Please enter a valid email address.', 'error');
            return false;
        }

        if (!this._validateInput(password, CONFIG.VALIDATION.MAX_PASSWORD_LENGTH)) {
            this._showSecureMessage('Invalid password format.', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Send login request to server
     */
    static async _sendLoginRequest(loginData) {
        return await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
    }

    /**
     * Handle login API response
     */
    static async _handleLoginResponse(response, data, email) {
        // Handle rate limiting
        if (response.status === 429) {
            debug('🚫 Rate limited');
            const retryAfter = data.retryAfter || '15 minutes';
            this._showSecureMessage(`Too many login attempts. Please wait ${retryAfter} before trying again.`, 'error');
            return;
        }

        // Handle email verification requirement
        if (!data.success && data.requiresEmailVerification) {
            debug('📧 Email verification required, redirecting...');
            console.log('🔍 LOGIN DEBUG: Email verification required. Response data:', data);
            this._showSecureMessage('Please verify your email address before logging in. Redirecting to verification page...', 'error');
            
            // Store email for verification page
            sessionStorage.setItem('verificationEmail', email);
            console.log('🔍 LOGIN DEBUG: Stored email in sessionStorage:', email);
            
            // Redirect to verification page after showing message
            setTimeout(() => {
                console.log('🔍 LOGIN DEBUG: Attempting redirect to verification page...');
                window.location.href = 'verify-email.html?reason=login_required';
            }, CONFIG.REDIRECT_DELAY);
            return;
        }

        this._handleServerResponse(data, data.success, 'login');
    }

    /**
     * Set up registration form submission handler
     */
    static _setupRegistrationForm() {
        const registrationForm = document.getElementById('registrationForm');
        if (!registrationForm) return;
        
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            
            // Validate inputs
            if (!this._validateRegistrationInputs(userData)) return;

            const registerData = {
                username: userData.username,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                password: userData.password
            };

            try {
                const response = await this._sendRegistrationRequest(registerData);
                const data = await response.json();
                
                // Handle rate limiting specifically
                if (response.status === 429) {
                    debug('🚫 Registration rate limited');
                    const retryAfter = data.retryAfter || '1 hour';
                    this._showSecureMessage(`Too many registration attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    return;
                }
                
                this._handleServerResponse(data, data.success, 'register');
            } catch (error) {
                if (DEBUG) console.error('Registration error:', error);
                this._handleServerResponse(null, false, 'network');
            }
        });
    }

    /**
     * Validate registration inputs
     */
    static _validateRegistrationInputs(userData) {
        if (!this._validateInput(userData.username, CONFIG.VALIDATION.MAX_USERNAME_LENGTH)) {
            this._showSecureMessage('Invalid username format.', 'error');
            return false;
        }

        if (!this._validateEmail(userData.email)) {
            this._showSecureMessage('Please enter a valid email address.', 'error');
            return false;
        }

        if (userData.firstName && !this._validateInput(userData.firstName, CONFIG.VALIDATION.MAX_NAME_LENGTH)) {
            this._showSecureMessage('Invalid first name format.', 'error');
            return false;
        }

        if (userData.lastName && !this._validateInput(userData.lastName, CONFIG.VALIDATION.MAX_NAME_LENGTH)) {
            this._showSecureMessage('Invalid last name format.', 'error');
            return false;
        }

        if (!this._validateInput(userData.password, CONFIG.VALIDATION.MAX_PASSWORD_LENGTH)) {
            this._showSecureMessage('Invalid password format.', 'error');
            return false;
        }

        if (userData.password !== userData.confirmPassword) {
            this._showSecureMessage('Passwords do not match', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Send registration request to server
     */
    static async _sendRegistrationRequest(registerData) {
        return await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
    }

    /**
     * Handle server response
     */
    static _handleServerResponse(data, success, operation) {
        if (success) {
            if (operation === 'login') {
                this._handleSuccessfulLogin(data);
            } else if (operation === 'register') {
                this._handleSuccessfulRegistration(data);
            }
        } else {
            this._showGenericErrorMessage(operation);
        }
    }

    /**
     * Handle successful login
     */
    static _handleSuccessfulLogin(data) {
        // Store auth token
        localStorage.setItem('authToken', data.token);
        debug('💾 Stored auth token:', data.token.substring(0, 20) + '...');

        if (data.session) {
            localStorage.setItem('sessionToken', data.session.sessionToken);
            localStorage.setItem('authUser', data.user);
            debug('💾 Stored session token:', data.session.sessionToken.substring(0, 20) + '...');
        }
        
        this._showSecureMessage('Login successful! Redirecting...', 'success');
        debug('✅ Login successful, redirecting to app...');
        
        // Enhanced storage flush and redirect
        setTimeout(async () => {
            // Force localStorage to flush
            localStorage.setItem('_flush', 'true');
            localStorage.removeItem('_flush');
            
            window.location.href = 'app.html?from=login&t=' + Date.now();
        }, CONFIG.REDIRECT_DELAY);
    }

    /**
     * Handle successful registration
     */
    static _handleSuccessfulRegistration(data) {
        // Store auth token if present (but don't auto-login if verification required)
        if (data.token && !data.requiresVerification) {
            localStorage.setItem('authToken', data.token);
            debug('💾 Stored auth token after registration');
        }
        
        // Show appropriate success message based on email verification status
        if (data.requiresVerification) {
            this._showSecureMessage('Account created successfully! Please check your email to verify your account.', 'success');
            
            // Store email for verification page
            sessionStorage.setItem('verificationEmail', data.user.email);
            
            // Redirect to verification page instead of app
            setTimeout(() => {
                window.location.href = 'verify-email.html?reason=registration';
            }, CONFIG.REDIRECT_DELAY);
        } else {
            this._showSecureMessage('Account created successfully! Redirecting to your dashboard...', 'success');
            
            // Only redirect to app if no verification is required
            setTimeout(async () => {
                // Force localStorage to flush
                localStorage.setItem('_flush', 'true');
                localStorage.removeItem('_flush');
                
                // Redirect to main app with registration indicator
                window.location.href = 'app.html?from=register&t=' + Date.now();
            }, CONFIG.REDIRECT_DELAY);
        }
    }

    /**
     * Show generic error message
     */
    static _showGenericErrorMessage(operation) {
        const genericMessages = {
            'login': 'Login failed. Please check your email and password and try again.',
            'register': 'Registration failed. Please check your information and try again.',
            'network': 'Connection error. Please check your internet connection and try again.'
        };
        
        this._showSecureMessage(genericMessages[operation] || genericMessages['network'], 'error');
    }

    /**
     * Show register form and hide login form
     */
    static _showRegisterForm() {
        const loginContainer = document.getElementById('loginFormContainer');
        const registerForm = document.getElementById('registerForm');
        
        if (loginContainer) loginContainer.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        
        // Reinitialize password toggles for newly visible forms
        setTimeout(() => {
            PasswordUIService.initializeAllPasswordToggles();
        }, 100);
    }

    /**
     * Show login form and hide register form
     */
    static _showLoginForm() {
        const loginContainer = document.getElementById('loginFormContainer');
        const registerForm = document.getElementById('registerForm');
        
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        
        // Reinitialize password toggles for newly visible forms
        setTimeout(() => {
            PasswordUIService.initializeAllPasswordToggles();
        }, 100);
    }

    /**
     * Display secure messages without exposing system details
     */
    static _showSecureMessage(message, type = 'error') {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;

        // Use SecurityUtils for safe content
        const escapedMessage = SecurityUtils.escapeHtml(message);
        messageDiv.textContent = escapedMessage;
        messageDiv.className = type === 'error' ? 'error' : 'success';
        messageDiv.classList.remove('hidden');
        
        // Auto-hide success messages after set time
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, CONFIG.MESSAGE_AUTO_HIDE);
        }
    }

    /**
     * Validate input securely
     */
    static _validateInput(input, maxLength) {
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

    /**
     * Validate email input securely
     */
    static _validateEmail(email) {
        if (!this._validateInput(email, CONFIG.VALIDATION.MAX_EMAIL_LENGTH)) {
            return false;
        }
        
        // Basic email format validation
        return CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
    }
}

// Legacy function for backwards compatibility
function showMessage(message, isError = false) {
    LoginPageService._showSecureMessage(message, isError ? 'error' : 'success');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    LoginPageService.initialize();
});
