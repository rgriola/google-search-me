/**
 * Test Verify Email Page JavaScript - CSP Compliant Version
 * Based on test-registration.js and test-login.js security patterns
 * Handles email verification and resend functionality with enhanced security
 */

// Import security utilities
import { SecurityUtils } from './js/utils/SecurityUtils.js';
import { debug, DEBUG } from './js/debug.js';

const FILE = 'VERIFY_EMAIL';

// Simple debug function (matching test-registration.js pattern)
/*
function debug(file, ...args) {
    console.log(`[${file}]`, ...args);
}*/

// Security utility functions (inline for consistency with other test pages)
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

// Configuration constants (matching test-registration.js patterns)
const CONFIG = {
    API_BASE_URL: '/api',
    REDIRECT_DELAY: 2000,
    RATE_LIMIT: {
        MAX_ATTEMPTS: 5,
        WINDOW_MINUTES: 15
    },
    VALIDATION: {
        MAX_EMAIL_LENGTH: 254, // RFC 5321 maximum
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        HTML_PATTERN: /<[^>]*>/g,
        ERROR_MESSAGES: {
            EMAIL: {
                REQUIRED: 'Email address is required',
                INVALID_FORMAT: 'Please enter a valid email address (example@domain.com)',
                TOO_LONG: 'Email address must be 254 characters or less',
                INVALID_CHARS: 'Email contains invalid characters',
                MISSING_AT: 'Email address must contain an @ symbol',
                MISSING_DOMAIN: 'Email address must include a valid domain'
            },
            TOKEN: {
                MISSING: 'Invalid or missing verification token. Please request a new verification email.',
                EXPIRED: 'This verification link has expired. Please request a new verification email.',
                INVALID: 'Invalid verification token. Please request a new verification email.'
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
 * VerifyEmailPageService - Encapsulates email verification page functionality
 */
class VerifyEmailPageService {
    /**
     * Initialize the verify email page
     */
    static initialize() {
        debug(FILE, 'Initializing test verify email page');
        
        this._initializeDOMElements();
        this._initializeEventListeners();
        this._initializeRateLimiting();
        this._processUrlParameters();
    }

    /**
     * Initialize DOM element references
     */
    static _initializeDOMElements() {
        this.verificationIcon = document.getElementById('verificationIcon');
        this.verificationTitle = document.getElementById('verificationTitle');
        this.verificationMessage = document.getElementById('verificationMessage');
        this.verificationActions = document.getElementById('verificationActions');
        this.resendSection = document.getElementById('resendSection');
        this.goToAppBtn = document.getElementById('goToAppBtn');
        this.resendForm = document.getElementById('resendForm');
        this.resendEmailInput = document.getElementById('resendEmail');
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
        const storedData = localStorage.getItem('verifyEmailRateLimit');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                const now = Date.now();
                const windowExpired = (now - parsedData.windowStart) > (CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000);
                
                if (!windowExpired) {
                    this.rateLimitData = parsedData;
                    if (this.rateLimitData.isLocked) {
                        this._lockResendForm();
                    }
                } else {
                    // Window expired, reset
                    localStorage.removeItem('verifyEmailRateLimit');
                }
            } catch (error) {
                debug(FILE, 'Error parsing rate limit data:', error);
                localStorage.removeItem('verifyEmailRateLimit');
            }
        }
    }

    /**
     * Initialize event listeners
     */
    static _initializeEventListeners() {
        // Go to app button
        if (this.goToAppBtn) {
            this.goToAppBtn.addEventListener('click', () => {
                this._handleGoToApp();
            });
        }
        
        // Resend form submission
        if (this.resendForm) {
            this.resendForm.addEventListener('submit', (e) => {
                this._handleResendFormSubmit(e);
            });
        }

        // Real-time email validation
        if (this.resendEmailInput) {
            this.resendEmailInput.addEventListener('input', (e) => {
                this._validateEmailRealtime(e.target.value);
            });
        }

        // Header navigation
        this._setupHeaderNavigation();
    }

    /**
     * Process URL parameters to determine page state
     */
    static _processUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const reason = urlParams.get('reason');
        
        debug(FILE, 'Processing URL parameters:', { token: token ? 'present' : 'missing', reason });
        
        if (token) {
            // We have a verification token, attempt to verify
            this.verificationToken = token;
            this._verifyEmailToken(token);
        } else {
            // No token, show appropriate state based on reason
            this._handleNoTokenState(reason);
        }
    }

    /**
     * Handle verification token
     */
    static async _verifyEmailToken(token) {
        // Basic token validation
        const tokenPattern = /^[A-Za-z0-9+/=._-]+$/;
        if (!tokenPattern.test(token) || token.length < 10) {
            this._showError(CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.INVALID);
            return;
        }

        try {
            debug(FILE, 'Verifying email token');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();
            debug(FILE, 'Verification response received:', response.status);
            
            this._handleVerificationResponse(response, data);

        } catch (error) {
            debug(FILE, 'Verification network error:', error);
            this._showError(CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.CONNECTION_ERROR);
        }
    }

    /**
     * Handle verification API response
     */
    static _handleVerificationResponse(response, data) {
        if (data.success || response.ok) {
            this._showSuccess();
        } else {
            this._handleVerificationError(data, response.status);
        }
    }

    /**
     * Handle verification errors
     */
    static _handleVerificationError(data, status) {
        let errorMessage = 'Email verification failed. Please try again or request a new verification email.';
        
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
                case 'token_not_found':
                    errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.TOKEN.INVALID;
                    break;
                case 'already_verified':
                    errorMessage = 'This email has already been verified. You can now sign in to your account.';
                    this._updateGoToAppButton('Sign In', 'test-login.html');
                    break;
                default:
                    errorMessage = data.message || errorMessage;
            }
        } else if (status === 429) {
            errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.RATE_LIMITED;
        } else if (status >= 500) {
            errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.SERVER_ERROR;
        }
        
        this._showError(errorMessage);
    }

    /**
     * Handle no token state based on reason parameter
     */
    static _handleNoTokenState(reason) {
        switch (reason) {
            case 'login_required':
                this._showLoginRequiredMessage();
                break;
            case 'registration':
                this._showRegistrationConfirmationMessage();
                break;
            default:
                this._showResendForm();
                break;
        }
    }

    /**
     * Show success state
     */
    static _showSuccess() {
        debug(FILE, 'Email verification successful');
        
        // Clear rate limit on success
        localStorage.removeItem('verifyEmailRateLimit');
        
        // Update UI elements
        this.verificationIcon.textContent = '✅';
        this.verificationIcon.className = 'auth-icon success';
        this.verificationTitle.textContent = 'Email Verified!';
        
        const urlParams = new URLSearchParams(window.location.search);
        const reason = urlParams.get('reason');
        
        if (reason === 'login_required') {
            this.verificationMessage.textContent = 'Your email has been successfully verified. You can now log in to access all features.';
            this._updateGoToAppButton('Go to Login', 'test-login.html');
        } else if (reason === 'registration') {
            this.verificationMessage.textContent = 'Your email has been successfully verified! Your registration is now complete. You can log in to start using the app.';
            this._updateGoToAppButton('Log In Now', 'test-login.html');
        } else {
            this.verificationMessage.textContent = 'Your email has been successfully verified. You can now access all features of the app.';
            this._updateGoToAppButton('Go to App', '/');
        }
        
        this._showElement(this.verificationActions);
    }

    /**
     * Show error state
     */
    static _showError(message) {
        debug(FILE, 'Showing error state:', message);
        
        this.verificationIcon.textContent = '❌';
        this.verificationIcon.className = 'auth-icon error';
        this.verificationTitle.textContent = 'Verification Failed';
        
        const sanitizedMessage = SecurityUtils.sanitizeText(message);
        this.verificationMessage.textContent = sanitizedMessage;
        
        this._showElement(this.resendSection);
    }

    /**
     * Show login required message
     */
    static _showLoginRequiredMessage() {
        debug(FILE, 'Showing login required message');
        
        this.verificationIcon.textContent = '🔒';
        this.verificationIcon.className = 'auth-icon warning';
        this.verificationTitle.textContent = 'Email Verification Required';
        this.verificationMessage.textContent = 'You must verify your email address before you can log in. Please check your inbox for a verification email, or enter your email below to resend it.';
        
        // Pre-populate email from sessionStorage if available
        this._populateStoredEmail();
        
        this._showElement(this.resendSection);
    }

    /**
     * Show registration confirmation message
     */
    static _showRegistrationConfirmationMessage() {
        debug(FILE, 'Showing registration confirmation message');
        
        this.verificationIcon.textContent = '📧';
        this.verificationIcon.className = 'auth-icon';
        this.verificationTitle.textContent = 'Check Your Email';
        this.verificationMessage.textContent = 'Thank you for registering! We\'ve sent a verification email to your inbox. Please click the link in the email to verify your account and complete your registration.';
        
        // Pre-populate email from sessionStorage if available
        this._populateStoredEmail();
        
        this._showElement(this.resendSection);
    }

    /**
     * Show resend form
     */
    static _showResendForm() {
        debug(FILE, 'Showing resend form');
        
        this.verificationIcon.textContent = '📧';
        this.verificationIcon.className = 'auth-icon';
        this.verificationTitle.textContent = 'Email Verification';
        this.verificationMessage.textContent = 'Enter your email address to resend the verification email.';
        
        this._showElement(this.resendSection);
    }

    /**
     * Populate email input from sessionStorage
     */
    static _populateStoredEmail() {
        const storedEmail = sessionStorage.getItem('verificationEmail');
        if (storedEmail && this._validateEmailDetailed(storedEmail).isValid) {
            this.resendEmailInput.value = storedEmail;
            
            // Personalize the message if we have the email
            if (this.verificationTitle.textContent === 'Check Your Email') {
                this.verificationMessage.textContent = `Thank you for registering! We've sent a verification email to ${storedEmail}. Please click the link in the email to verify your account and complete your registration.`;
            }
        }
        
        // Clear the stored email to prevent reuse
        sessionStorage.removeItem('verificationEmail');
    }

    /**
     * Handle resend form submission
     */
    static async _handleResendFormSubmit(e) {
        e.preventDefault();
        debug(FILE, 'Resend form submitted');
        
        // Check rate limit first
        if (!this._checkRateLimit()) {
            return;
        }
        
        const formData = new FormData(this.resendForm);
        const email = SecurityUtils.sanitizeInput(formData.get('email') || '');
        
        // Validate email
        const emailValidation = this._validateEmailDetailed(email);
        if (!emailValidation.isValid) {
            this._showSecureMessage(emailValidation.errors[0], 'error');
            this._incrementRateLimit();
            return;
        }
        
        // Submit resend request
        await this._submitResendRequest(email);
    }

    /**
     * Submit resend request to server
     */
    static async _submitResendRequest(email) {
        const submitBtn = this.resendForm.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Sending...';
        }

        try {
            debug(FILE, 'Sending resend verification request');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            debug(FILE, 'Resend response received:', response.status);
            
            this._handleResendResponse(response, data);

        } catch (error) {
            debug(FILE, 'Resend network error:', error);
            this._incrementRateLimit();
            this._showSecureMessage(CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.CONNECTION_ERROR, 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = 'Resend Verification Email';
            }
        }
    }

    /**
     * Handle resend API response
     */
    static _handleResendResponse(response, data) {
        if (data.success || response.ok) {
            // Clear rate limit on success
            localStorage.removeItem('verifyEmailRateLimit');
            this._showSecureMessage('Verification email sent successfully! Please check your inbox (and spam folder) for the verification link.', 'success');
            this.resendForm.reset();
        } else {
            this._handleResendError(data, response.status);
        }
    }

    /**
     * Handle resend errors
     */
    static _handleResendError(data, status) {
        let errorMessage = 'Unable to send verification email. Please check your email address and try again.';
        
        const errorCode = data.code || data.error;
        
        if (errorCode) {
            switch (errorCode.toLowerCase()) {
                case 'email_not_found':
                    errorMessage = 'No account found with this email address. Please check the email or create a new account.';
                    this._incrementRateLimit();
                    this._showSecureMessage(errorMessage, 'error');
                    break;
                case 'already_verified':
                    // Show success state instead of error for already verified emails
                    this._showAlreadyVerifiedSuccess();
                    return; // Don't increment rate limit or show error message
                case 'rate_limited':
                case 'too_many_requests':
                    errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.RATE_LIMITED;
                    this._lockResendForm();
                    this._incrementRateLimit();
                    this._showSecureMessage(errorMessage, 'error');
                    break;
                case 'unauthorized':
                case 'authentication_required':
                    // Try alternative endpoint for public resend
                    this._tryPublicResendEndpoint();
                    return; // Don't show error yet, try alternative first
                default:
                    errorMessage = data.message || errorMessage;
                    this._incrementRateLimit();
                    this._showSecureMessage(errorMessage, 'error');
            }
        } else if (status === 401) {
            // 401 Unauthorized - try public endpoint
            this._tryPublicResendEndpoint();
        } else if (status === 429) {
            errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.RATE_LIMITED;
            this._lockResendForm();
            this._incrementRateLimit();
            this._showSecureMessage(errorMessage, 'error');
        } else if (status >= 500) {
            errorMessage = CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.SERVER_ERROR;
            this._incrementRateLimit();
            this._showSecureMessage(errorMessage, 'error');
        } else {
            this._incrementRateLimit();
            this._showSecureMessage(errorMessage, 'error');
        }
    }

    /**
     * Handle go to app button click
     */
    static _handleGoToApp() {
        const href = this.goToAppBtn.getAttribute('data-href') || '/';
        window.location.href = href;
    }

    /**
     * Update go to app button
     */
    static _updateGoToAppButton(text, href) {
        if (this.goToAppBtn) {
            this.goToAppBtn.textContent = text;
            this.goToAppBtn.setAttribute('data-href', href);
        }
    }

    /**
     * Show success state for already verified emails
     */
    static _showAlreadyVerifiedSuccess() {
        debug(FILE, 'Email already verified - showing success state');
        
        // Clear rate limit since this is actually a success case
        localStorage.removeItem('verifyEmailRateLimit');
        
        // Update UI elements to success state
        this.verificationIcon.textContent = '✅';
        this.verificationIcon.className = 'auth-icon success';
        this.verificationTitle.textContent = 'Email Already Verified!';
        this.verificationMessage.textContent = 'Great news! Your email address has already been verified and your account is ready to go. You can sign in now.';
        
        // Hide resend section and show login button
        this._hideElement(this.resendSection);
        this._updateGoToAppButton('Go to Login', 'test-login.html');
        this._showElement(this.verificationActions);
    }

    /**
     * Try alternative public resend endpoint for 401 errors
     */
    static async _tryPublicResendEndpoint() {
        debug(FILE, 'Trying alternative public resend endpoint');
        
        const formData = new FormData(this.resendForm);
        const email = SecurityUtils.sanitizeInput(formData.get('email') || '');
        
        const submitBtn = this.resendForm.querySelector('button[type="submit"]');
        
        try {
            // Try alternative endpoints that might not require authentication
            const endpoints = [
                `${CONFIG.API_BASE_URL}/auth/resend-verification-public`,
                `${CONFIG.API_BASE_URL}/public/resend-verification`,
                `${CONFIG.API_BASE_URL}/resend-verification`
            ];
            
            for (const endpoint of endpoints) {
                try {
                    debug(FILE, `Trying endpoint: ${endpoint}`);
                    
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify({ email })
                    });

                    const data = await response.json();
                    debug(FILE, `Alternative endpoint ${endpoint} response:`, response.status);
                    
                    if (response.ok || data.success) {
                        this._handleResendResponse(response, data);
                        return; // Success, exit the loop
                    } else if (response.status !== 401 && response.status !== 404) {
                        // If it's not 401 or 404, handle the error
                        this._handleResendError(data, response.status);
                        return;
                    }
                    // Continue to next endpoint if 401 or 404
                } catch (endpointError) {
                    debug(FILE, `Endpoint ${endpoint} failed:`, endpointError);
                    // Continue to next endpoint
                }
            }
            
            // All endpoints failed
            this._incrementRateLimit();
            this._showSecureMessage('Unable to send verification email. The service may be temporarily unavailable. Please try again later or contact support.', 'error');
            
        } catch (error) {
            debug(FILE, 'All alternative endpoints failed:', error);
            this._incrementRateLimit();
            this._showSecureMessage(CONFIG.VALIDATION.ERROR_MESSAGES.NETWORK.CONNECTION_ERROR, 'error');
        } finally {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = 'Resend Verification Email';
            }
        }
    }

    /**
     * Setup header navigation
     */
    static _setupHeaderNavigation() {
        // Handle any navigation links that need special handling
        debug(FILE, 'Header navigation setup completed');
    }

    /**
     * Real-time email validation
     */
    static _validateEmailRealtime(email) {
        if (!this.resendEmailInput) return;
        
        // Remove existing validation classes
        this.resendEmailInput.classList.remove('valid', 'invalid');
        
        if (email.length > 0) {
            const validation = this._validateEmailDetailed(email);
            this.resendEmailInput.classList.add(validation.isValid ? 'valid' : 'invalid');
        }
    }

    /**
     * Detailed email validation with specific error messages
     */
    static _validateEmailDetailed(email) {
        const errors = [];
        
        if (!email || typeof email !== 'string') {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.REQUIRED);
            return { isValid: false, errors };
        }

        const trimmedEmail = email.trim();
        
        if (trimmedEmail.length === 0) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.REQUIRED);
            return { isValid: false, errors };
        }

        if (trimmedEmail.length > CONFIG.VALIDATION.MAX_EMAIL_LENGTH) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.TOO_LONG);
        }

        if (CONFIG.VALIDATION.HTML_PATTERN.test(trimmedEmail)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.INVALID_CHARS);
        }

        if (!trimmedEmail.includes('@')) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.MISSING_AT);
        } else {
            const parts = trimmedEmail.split('@');
            if (parts.length !== 2 || parts[1].indexOf('.') === -1) {
                errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.MISSING_DOMAIN);
            }
        }

        if (errors.length === 0 && !CONFIG.VALIDATION.EMAIL_PATTERN.test(trimmedEmail)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.INVALID_FORMAT);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
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
            this._lockResendForm();
        }
        
        localStorage.setItem('verifyEmailRateLimit', JSON.stringify(this.rateLimitData));
    }

    static _lockResendForm() {
        this.rateLimitData.isLocked = true;
        const submitBtn = this.resendForm?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Rate Limited - Please Wait';
        }
        
        localStorage.setItem('verifyEmailRateLimit', JSON.stringify(this.rateLimitData));
    }

    static _resetRateLimit() {
        this.rateLimitData = {
            attempts: 0,
            windowStart: Date.now(),
            isLocked: false
        };
        
        const submitBtn = this.resendForm?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Resend Verification Email';
        }
        
        localStorage.removeItem('verifyEmailRateLimit');
    }

    /**
     * Utility methods
     */
    static _showElement(element) {
        if (element) {
            element.classList.remove('hidden');
            element.classList.add('visible');
        }
    }

    static _hideElement(element) {
        if (element) {
            element.classList.remove('visible');
            element.classList.add('hidden');
        }
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    debug(FILE, 'DOM loaded, initializing verify email page');
    VerifyEmailPageService.initialize();
});

// Export for potential external use
//window.VerifyEmailPageService = VerifyEmailPageService;