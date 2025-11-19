/**
 * Test Registration Page JavaScript - CSP Compliant Version
 * Handles registration form functionality with enhanced security
 */

const FILE = 'TEST_REGISTRATION';

// Simple debug function (matching test-login.js pattern)
function debug(file, ...args) {
    console.log(`[${file}]`, ...args);
}

// Security utility functions (inline for consistency)
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

// Simple Auth check function
const Auth = {
    isAuthenticated: async function() {
        try {
            const token = localStorage.getItem('authToken');
            return !!token;
        } catch (error) {
            return false;
        }
    }
};

// Configuration constants
const CONFIG = {
    API_BASE_URL: '/api',
    REDIRECT_DELAY: 1500,
    MESSAGE_AUTO_HIDE: 8000,
    RATE_LIMIT: {
        MAX_ATTEMPTS: 5,
        WINDOW_MINUTES: 15
    },
    VALIDATION: {
        MAX_EMAIL_LENGTH: 100,
        MAX_PASSWORD_LENGTH: 128,
        MAX_USERNAME_LENGTH: 50,
        MAX_NAME_LENGTH: 40,
        MIN_PASSWORD_LENGTH: 8,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        HTML_PATTERN: /<[^>]*>/g,
        USERNAME_PATTERN: /^[a-zA-Z0-9._-]+$/,
        PROMO_CODE_PATTERN: /^[A-Z0-9]{6,20}$/,
        PASSWORD_REQUIREMENTS: {
            MIN_LENGTH: 8,
            REQUIRE_UPPERCASE: true,
            REQUIRE_LOWERCASE: true,
            REQUIRE_NUMBER: true,
            REQUIRE_SPECIAL: true,
            SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        ERROR_MESSAGES: {
            EMAIL: {
                REQUIRED: 'Email address is required',
                INVALID_FORMAT: 'Please enter a valid email address (example@domain.com)',
                TOO_LONG: 'Email address must be 100 characters or less',
                INVALID_CHARS: 'Email contains invalid characters',
                MISSING_AT: 'Email address must contain an @ symbol',
                MISSING_DOMAIN: 'Email address must include a valid domain'
            },
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
            USERNAME: {
                REQUIRED: 'Username is required',
                TOO_SHORT: 'Username must be at least 3 characters long',
                TOO_LONG: 'Username must be 30 characters or less',
                INVALID_CHARS: 'Username can only contain letters, numbers, periods, underscores, and hyphens',
                INVALID_START: 'Username cannot start with a special character',
                INVALID_END: 'Username cannot end with a special character',
                CONTAINS_HTML: 'Username cannot contain HTML tags'
            },
            NAME: {
                REQUIRED: 'Name is required',
                INVALID_FORMAT: 'Name can only contain letters and spaces',
                TOO_LONG: 'Name must be 40 characters or less',
                TOO_SHORT: 'Name must be at least 2 characters long',
                CONTAINS_HTML: 'Name cannot contain HTML tags',
                CONTAINS_NUMBERS: 'Name cannot contain numbers or special characters'
            },
            PROMO: {
                INVALID_FORMAT: 'Promo code must contain only letters and numbers',
                INVALID_LENGTH: 'Promo code must be 6-20 characters long'
            },
            TERMS: {
                TERMS_REQUIRED: 'You must agree to the Terms of Service',
                PRIVACY_REQUIRED: 'You must agree to the Privacy Policy.'
            }
        }
    }
};

/**
 * RegistrationPageService - Encapsulates registration page functionality
 */
class RegistrationPageService {
    /**
     * Initialize the registration page
     */
    static initialize() {
        debug(FILE, 'Initializing test registration page');
        
        this._initializeEventListeners();
        this._initializePasswordToggles();
        this._initializePromoCodeToggle();
        this._checkExistingAuth();
        this._initializeRateLimiting();
        
        // Initialize form validation
        this._initializeFormValidation();
    }

    /**
     * Check if user is already logged in
     */
    static async _checkExistingAuth() {
        try {
            const isAuthenticated = await Auth.isAuthenticated();
            if (isAuthenticated) {
                debug(FILE, 'User already authenticated, redirecting to app');
                window.location.href = 'app.html?from=registration_redirect';
            }
        } catch (error) {
            debug(FILE, 'Auth check failed, continuing with registration page');
        }
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
        const storedData = localStorage.getItem('registrationRateLimit');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                const timeDiff = Date.now() - parsed.windowStart;
                
                // If within the rate limit window
                if (timeDiff < CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000) {
                    this.rateLimitData = parsed;
                    
                    if (parsed.attempts >= CONFIG.RATE_LIMIT.MAX_ATTEMPTS) {
                        this._lockRegistration();
                    }
                } else {
                    // Reset if window has expired
                    localStorage.removeItem('registrationRateLimit');
                }
            } catch (error) {
                debug(FILE, 'Error parsing rate limit data:', error);
                localStorage.removeItem('registrationRateLimit');
            }
        }
    }

    /**
     * Initialize page event listeners
     */
    static _initializeEventListeners() {
        // Registration form
        this._setupRegistrationForm();
        
        // Country/state selection
        this._setupLocationSelectors();
        
        // Terms and conditions toggles
        this._setupTermsHandlers();
        
        // Sign in link
        this._setupSignInLink();
        
        // Header navigation
        this._setupHeaderNavigation();
    }

    /**
     * Initialize password toggles
     */
    static _initializePasswordToggles() {
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
        
        debug(FILE, 'Password toggles initialized');
    }
    

    /**
     * Initialize promo code toggle functionality
     */
    static _initializePromoCodeToggle() {
        const promoToggle = document.getElementById('promoToggle');
        const promoInput = document.getElementById('promoInput');
        
        if (promoToggle && promoInput) {
            promoToggle.addEventListener('click', (e) => {
                e.preventDefault();
                
                const isHidden = promoInput.classList.contains('hidden');
                const toggleIcon = promoToggle.querySelector('.toggle-icon');
                
                if (isHidden) {
                    promoInput.classList.remove('hidden');
                    promoToggle.classList.add('active');
                    if (toggleIcon) toggleIcon.textContent = '−';
                    
                    // Focus on the input field
                    const input = promoInput.querySelector('input');
                    if (input) setTimeout(() => input.focus(), 100);
                } else {
                    promoInput.classList.add('hidden');
                    promoToggle.classList.remove('active');
                    if (toggleIcon) toggleIcon.textContent = '+';
                }
                
                debug(FILE, `Promo code section ${isHidden ? 'opened' : 'closed'}`);
            });
        }
    }

    /**
     * Setup registration form submission handler
     */
    static _setupRegistrationForm() {
        const registrationForm = document.getElementById('registrationForm');
        if (!registrationForm) return;
        
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            debug(FILE, 'Registration form submitted');
            
            // Check rate limiting
            if (this._checkRateLimit()) {
                this._showSecureMessage('Too many registration attempts. Please wait before trying again.', 'error');
                return;
            }
            
            const formData = new FormData(e.target);
            const userData = this._extractFormData(formData);
            
            // Validate inputs
            if (!this._validateRegistrationInputs(userData)) {
                this._incrementRateLimit();
                return;
            }
            
            // Check required terms acceptance
            if (!this._validateTermsAcceptance(formData)) {
                this._incrementRateLimit();
                return;
            }

            const registerData = this._prepareRegistrationData(userData);
            
            try {
                debug(FILE, 'Sending registration request');
                const response = await this._sendRegistrationRequest(registerData);
                const data = await response.json();
                
                // Handle rate limiting from server
                if (response.status === 429) {
                    debug(FILE, 'Server rate limited registration');
                    const retryAfter = data.retryAfter || '1 hour';
                    this._showSecureMessage(`Too many registration attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    this._lockRegistration();
                    return;
                }
                
                this._handleRegistrationResponse(response, data);
            } catch (error) {
                debug(FILE, 'Registration error:', error);
                this._incrementRateLimit();
                this._handleServerResponse(null, false, 'network');
            }
        });
    }

    /**
     * Extract and sanitize form data
     */
    static _extractFormData(formData) {
        return {
            email: SecurityUtils.sanitizeInput(formData.get('email') || ''),
            username: SecurityUtils.sanitizeInput(formData.get('username') || ''),
            password: formData.get('password') || '',
            confirmPassword: formData.get('confirmPassword') || '',
            firstName: SecurityUtils.sanitizeInput(formData.get('firstName') || ''),
            lastName: SecurityUtils.sanitizeInput(formData.get('lastName') || ''),
            location: SecurityUtils.sanitizeInput(formData.get('location') || ''),
            interests: SecurityUtils.sanitizeInput(formData.get('interests') || ''),
            promoCode: SecurityUtils.sanitizeInput(formData.get('promoCode') || '').toUpperCase(),
            marketing: formData.get('marketing') === 'on'
        };
    }

    /**
     * Validate registration inputs comprehensively with detailed error messages
     */
    static _validateRegistrationInputs(userData) {
        const allErrors = [];

        // Username validation (REQUIRED)
        const usernameValidation = this._validateUsernameDetailed(userData.username);
        if (!usernameValidation.isValid) {
            allErrors.push(...usernameValidation.errors);
        }

        // Email validation
        const emailValidation = this._validateEmailDetailed(userData.email);
        if (!emailValidation.isValid) {
            allErrors.push(...emailValidation.errors);
        }

        // Password validation
        const passwordValidation = this._validatePasswordDetailed(userData.password);
        if (!passwordValidation.isValid) {
            allErrors.push(...passwordValidation.errors);
        }

        // Password confirmation
        if (userData.password !== userData.confirmPassword) {
            allErrors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_MATCH);
        }

        // Required name fields validation
        const firstNameValidation = this._validateNameDetailed(userData.firstName, 'firstName');
        if (!firstNameValidation.isValid) {
            allErrors.push(...firstNameValidation.errors.map(error => `First name: ${error}`));
        }

        const lastNameValidation = this._validateNameDetailed(userData.lastName, 'lastName');
        if (!lastNameValidation.isValid) {
            allErrors.push(...lastNameValidation.errors.map(error => `Last name: ${error}`));
        }

        // Promo code validation (if provided)
        if (userData.promoCode && !this._validatePromoCode(userData.promoCode)) {
            allErrors.push(CONFIG.VALIDATION.ERROR_MESSAGES.PROMO.INVALID_FORMAT);
        }

        // Show errors if any exist
        if (allErrors.length > 0) {
            this._showValidationErrors(allErrors);
            return false;
        }
        
        return true;
    }

    /**
     * Validate terms acceptance
     */
    static _validateTermsAcceptance(formData) {
        const errors = [];
        const termsAccepted = formData.get('terms') === 'on';
        const privacyAccepted = formData.get('privacy') === 'on';
        
        if (!termsAccepted) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.TERMS.TERMS_REQUIRED);
        }
        
        if (!privacyAccepted) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.TERMS.PRIVACY_REQUIRED);
        }
        
        if (errors.length > 0) {
            this._showValidationErrors(errors);
            return false;
        }
        
        return true;
    }    /**
     * Prepare registration data for API (matches original login.html structure)
     */
    static _prepareRegistrationData(userData) {
        const registerData = {
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName || null,
            lastName: userData.lastName || null,
            password: userData.password
        };
        
        // Add promo code if provided
        if (userData.promoCode) {
            registerData.promoCode = userData.promoCode;
        }
        
        return registerData;
    }

    /**
     * Send registration request to server
     */
    static async _sendRegistrationRequest(registerData) {
        return await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(registerData)
        });
    }

    /**
     * Handle registration API response
     */
    static _handleRegistrationResponse(response, data) {
        if (data.success) {
            this._handleSuccessfulRegistration(data);
        } else {
            this._incrementRateLimit();
            this._handleRegistrationError(data, response.status);
        }
    }

    /**
     * Handle successful registration
     */
    static _handleSuccessfulRegistration(data) {
        debug(FILE, 'Registration successful');
        
        // Clear rate limit on success
        localStorage.removeItem('registrationRateLimit');
        
        // Store verification email if needed
        if (data.requiresVerification) {
            sessionStorage.setItem('verificationEmail', data.user.email);
            this._showSecureMessage('Account created successfully! Please check your email to verify your account before signing in.', 'success');
            
            setTimeout(() => {
                window.location.href = 'verify-email.html?reason=registration';
            }, CONFIG.REDIRECT_DELAY);
        } else {
            // Auto-login if no verification required
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                if (data.session) {
                    localStorage.setItem('sessionToken', data.session.sessionToken);
                }
            }
            
            this._showSecureMessage('Account created successfully! Welcome to the platform. Redirecting to your dashboard...', 'success');
            
            setTimeout(() => {
                window.location.href = 'app.html?from=registration&welcome=true';
            }, CONFIG.REDIRECT_DELAY);
        }
    }

    /**
     * Handle registration errors with smart email redirect
     */
    static _handleRegistrationError(data, status) {
        let errorMessage = 'Registration failed. Please check your information and try again.';
        
        // Check for error code first (server returns 'code' field), then fallback to 'error' field
        const errorCode = data.code || data.error;
        const errorText = data.error || errorMessage;
        
        if (errorCode) {
            switch (errorCode) {
                case 'EMAIL_EXISTS':
                case 'email_exists':
                    // Smart redirect to forgot password (without pre-filling email for security)
                    debug(FILE, 'Email exists, showing dialog');
                    this._showEmailExistsDialog();
                    return; // Don't show generic error message
                case 'USERNAME_EXISTS':
                case 'username_exists':
                    errorMessage = 'This username is already taken. Please choose a different username.';
                    break;
                case 'EMAIL_AND_USERNAME_EXISTS':
                    errorMessage = 'Both the email and username are already taken. Please use different credentials.';
                    break;
                case 'invalid_email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'weak_password':
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'invalid_promo_code':
                    errorMessage = 'Invalid promo code. Please check and try again.';
                    break;
                case 'validation_failed':
                    if (data.validation_errors && Array.isArray(data.validation_errors)) {
                        this._showValidationErrors(data.validation_errors);
                        return;
                    }
                    errorMessage = 'Please check your information and try again.';
                    break;
                case 'rate_limit_exceeded':
                    errorMessage = 'Too many registration attempts. Please wait a moment before trying again.';
                    break;
                default:
                    debug(FILE, 'Unknown registration error code:', errorCode, 'Error text:', errorText);
                    // Use the server's error message if available
                    if (errorText && errorText !== errorMessage) {
                        errorMessage = errorText;
                    }
            }
        } else if (errorText) {
            // If no code, but we have an error message, check if it indicates email exists
            if (errorText.toLowerCase().includes('email') && errorText.toLowerCase().includes('already exists')) {
                debug(FILE, 'Email exists detected from error message, showing dialog');
                this._showEmailExistsDialog();
                return;
            }
            errorMessage = errorText;
        }
        
        this._showSecureMessage(errorMessage, 'error');
    }

    /**
     * Setup country/state selection handlers
     */
    static _setupLocationSelectors() {
        const countrySelect = document.getElementById('country');
        const stateSelect = document.getElementById('state');
        
        if (countrySelect && stateSelect) {
            countrySelect.addEventListener('change', (e) => {
                const selectedCountry = e.target.value;
                debug(FILE, `Country selected: ${selectedCountry}`);
                
                if (selectedCountry === 'US') {
                    stateSelect.style.display = 'block';
                    stateSelect.required = true;
                } else {
                    stateSelect.style.display = 'none';
                    stateSelect.required = false;
                    stateSelect.value = '';
                }
            });
        }
    }

    /**
     * Setup terms and conditions handlers
     */
    static _setupTermsHandlers() {
        const termsLinks = document.querySelectorAll('.terms-link');
        
        termsLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const linkText = link.textContent.toLowerCase();
                if (linkText.includes('terms')) {
                    this._showTermsModal();
                } else if (linkText.includes('privacy')) {
                    this._showPrivacyModal();
                }
            });
        });
    }

    /**
     * Setup sign in link
     */
    static _setupSignInLink() {
        const signInLink = document.getElementById('signInLink');
        if (signInLink) {
            signInLink.addEventListener('click', (e) => {
                e.preventDefault();
                debug(FILE, 'Navigating to sign in page');
                window.location.href = 'test-login.html';
            });
        }
    }

    /**
     * Setup header navigation
     */
    static _setupHeaderNavigation() {
        const aboutLink = document.querySelector('.nav-link[href="#about"]');
        if (aboutLink) {
            aboutLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Reuse the about modal from test-landing if available
                const aboutModal = document.getElementById('aboutModal');
                if (aboutModal) {
                    aboutModal.classList.add('active');
                } else {
                    // Fallback to simple alert or redirect
                    window.location.href = 'test-landing.html#about';
                }
            });
        }
    }

    /**
     * Initialize real-time form validation
     */
    static _initializeFormValidation() {
        const emailInput = document.getElementById('email');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this._validateFieldRealtime('email', emailInput.value);
            });
        }
        
        if (usernameInput) {
            usernameInput.addEventListener('blur', () => {
                this._validateFieldRealtime('username', usernameInput.value);
            });
        }

        // First Name validation
        const firstNameInput = document.getElementById('firstName');
        if (firstNameInput) {
            firstNameInput.addEventListener('blur', () => {
                const validation = this._validateNameDetailed(firstNameInput.value, 'firstName');
                if (validation.isValid && firstNameInput.value.trim()) {
                    // Auto-capitalize the name
                    firstNameInput.value = this._capitalizeName(firstNameInput.value);
                }
                this._validateFieldRealtime('firstName', firstNameInput.value);
            });
        }

        // Last Name validation
        const lastNameInput = document.getElementById('lastName');
        if (lastNameInput) {
            lastNameInput.addEventListener('blur', () => {
                const validation = this._validateNameDetailed(lastNameInput.value, 'lastName');
                if (validation.isValid && lastNameInput.value.trim()) {
                    // Auto-capitalize the name
                    lastNameInput.value = this._capitalizeName(lastNameInput.value);
                }
                this._validateFieldRealtime('lastName', lastNameInput.value);
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this._validateFieldRealtime('password', passwordInput.value);
                
                // Also validate confirm password if it has a value
                if (confirmPasswordInput && confirmPasswordInput.value) {
                    this._validateFieldRealtime('confirmPassword', confirmPasswordInput.value, passwordInput.value);
                }
            });
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this._validateFieldRealtime('confirmPassword', confirmPasswordInput.value, passwordInput ? passwordInput.value : '');
            });
        }
    }

    /**
     * Real-time field validation with detailed feedback
     */
    static _validateFieldRealtime(fieldType, value, compareValue = null) {
        const fieldElement = document.getElementById(fieldType);
        if (!fieldElement) return;
        
        let isValid = true;
        let errorMessage = '';
        
        switch (fieldType) {
            case 'email':
                const emailValidation = this._validateEmailDetailed(value);
                isValid = emailValidation.isValid;
                errorMessage = emailValidation.errors.length > 0 ? emailValidation.errors[0] : '';
                break;
            case 'username':
                const usernameValidation = this._validateUsernameDetailed(value);
                isValid = usernameValidation.isValid;
                errorMessage = usernameValidation.errors.length > 0 ? usernameValidation.errors[0] : '';
                break;
            case 'password':
                const passwordValidation = this._validatePasswordDetailed(value);
                isValid = passwordValidation.isValid;
                errorMessage = passwordValidation.errors.length > 0 ? passwordValidation.errors[0] : '';
                break;
            case 'confirmPassword':
                isValid = value === compareValue && value.length > 0;
                errorMessage = isValid ? '' : CONFIG.VALIDATION.ERROR_MESSAGES.PASSWORD.NO_MATCH;
                break;
            case 'firstName':
            case 'lastName':
                const nameValidation = this._validateNameDetailed(value, fieldType);
                isValid = nameValidation.isValid;
                errorMessage = nameValidation.errors.length > 0 ? nameValidation.errors[0] : '';
                break;
        }
        
        this._updateFieldValidation(fieldElement, isValid, errorMessage);
        
        // Show password strength for password field
        if (fieldType === 'password') {
            this._updatePasswordStrengthIndicator(value);
        }
    }

    /**
     * Update password strength indicator with detailed requirements
     */
    static _updatePasswordStrengthIndicator(password) {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;

        // Find the form group (parent container) to append indicator after password container
        const formGroup = passwordInput.closest('.form-group');
        if (!formGroup) return;

        // Find or create strength indicator
        let strengthDiv = formGroup.querySelector('.password-strength-indicator');
        if (!strengthDiv) {
            strengthDiv = document.createElement('div');
            strengthDiv.className = 'password-strength-indicator';
            
            // Append after the password-input-container
            const passwordContainer = passwordInput.parentNode;
            passwordContainer.parentNode.insertBefore(strengthDiv, passwordContainer.nextSibling);
        }

        if (!password || password.length === 0) {
            strengthDiv.style.display = 'none';
            return;
        }

        strengthDiv.style.display = 'block';
        
        const requirements = CONFIG.VALIDATION.PASSWORD_REQUIREMENTS;
        const checks = [
            {
                test: password.length >= requirements.MIN_LENGTH,
                text: `At least ${requirements.MIN_LENGTH} characters`
            },
            {
                test: /[A-Z]/.test(password),
                text: 'One uppercase letter (A-Z)'
            },
            {
                test: /[a-z]/.test(password),
                text: 'One lowercase letter (a-z)'
            },
            {
                test: /\d/.test(password),
                text: 'One number (0-9)'
            },
            {
                test: requirements.SPECIAL_CHARS.split('').some(char => password.includes(char)),
                text: 'One special character (!@#$%^&*)'
            }
        ];

        const checkElements = checks.map(check => {
            const status = check.test ? '✓' : '○';
            const className = check.test ? 'met' : 'unmet';
            return `<div class="password-requirement-item ${className}">${status} ${check.text}</div>`;
        }).join('');

        strengthDiv.innerHTML = `<div class="password-requirement-title">Password Requirements:</div>${checkElements}`;
    }

    /**
     * Update field validation UI with enhanced feedback
     */
    static _updateFieldValidation(fieldElement, isValid, errorMessage) {
        // Remove existing validation classes
        fieldElement.classList.remove('valid', 'invalid', 'validating');
        
        // Find the form group to properly position validation messages
        const formGroup = fieldElement.closest('.form-group');
        
        // Remove existing error message from the form group
        const existingError = formGroup ? formGroup.querySelector('.field-validation-message') : fieldElement.parentNode.querySelector('.field-validation-message');
        if (existingError) {
            existingError.remove();
        }
        
        const fieldValue = fieldElement.value.trim();
        
        // Don't show validation for empty fields (except required ones during form submission)
        if (fieldValue === '') {
            return;
        }
        
        if (isValid) {
            fieldElement.classList.add('valid');
            
            // Show success message for complex fields
            if (fieldElement.id === 'password' && fieldValue.length >= CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
                const successDiv = document.createElement('div');
                successDiv.className = 'field-validation-message success';
                successDiv.textContent = '✓ Password meets all requirements';
                
                // For password fields, append after the password container
                if (fieldElement.parentNode.classList.contains('password-input-container') && formGroup) {
                    const passwordContainer = fieldElement.parentNode;
                    formGroup.insertBefore(successDiv, passwordContainer.nextSibling);
                } else {
                    fieldElement.parentNode.appendChild(successDiv);
                }
            }
            
            // Show success message for name fields
            if ((fieldElement.id === 'firstName' || fieldElement.id === 'lastName') && fieldValue.length >= 2) {
                const successDiv = document.createElement('div');
                successDiv.className = 'field-validation-message success';
                successDiv.textContent = '✓ Valid name format';
                fieldElement.parentNode.appendChild(successDiv);
            }
        } else {
            fieldElement.classList.add('invalid');
            
            // Add error message with enhanced styling
            if (errorMessage) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-validation-message error';
                errorDiv.textContent = errorMessage;
                
                // For password fields, append after the password container
                if (fieldElement.parentNode.classList.contains('password-input-container') && formGroup) {
                    const passwordContainer = fieldElement.parentNode;
                    formGroup.insertBefore(errorDiv, passwordContainer.nextSibling);
                } else {
                    fieldElement.parentNode.appendChild(errorDiv);
                }
            }
        }
    }

    /**
     * Rate limiting methods
     */
    static _checkRateLimit() {
        if (this.rateLimitData.isLocked) {
            const timeDiff = Date.now() - this.rateLimitData.windowStart;
            const timeRemaining = (CONFIG.RATE_LIMIT.WINDOW_MINUTES * 60 * 1000) - timeDiff;
            
            if (timeRemaining > 0) {
                const minutesRemaining = Math.ceil(timeRemaining / (60 * 1000));
                debug(FILE, `Registration locked, ${minutesRemaining} minutes remaining`);
                return true;
            } else {
                // Reset rate limit
                this._resetRateLimit();
                return false;
            }
        }
        
        return false;
    }

    static _incrementRateLimit() {
        this.rateLimitData.attempts++;
        this.rateLimitData.windowStart = this.rateLimitData.windowStart || Date.now();
        
        if (this.rateLimitData.attempts >= CONFIG.RATE_LIMIT.MAX_ATTEMPTS) {
            this._lockRegistration();
        }
        
        localStorage.setItem('registrationRateLimit', JSON.stringify(this.rateLimitData));
    }

    static _lockRegistration() {
        this.rateLimitData.isLocked = true;
        const submitBtn = document.querySelector('.create-account-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registration Temporarily Locked';
            submitBtn.style.opacity = '0.6';
        }
        
        localStorage.setItem('registrationRateLimit', JSON.stringify(this.rateLimitData));
    }

    static _resetRateLimit() {
        this.rateLimitData = {
            attempts: 0,
            windowStart: Date.now(),
            isLocked: false
        };
        
        const submitBtn = document.querySelector('.create-account-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
            submitBtn.style.opacity = '1';
        }
        
        localStorage.removeItem('registrationRateLimit');
    }

    /**
     * Validation helper methods
     */
    static _validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        if (email.length > CONFIG.VALIDATION.MAX_EMAIL_LENGTH) return false;
        if (CONFIG.VALIDATION.HTML_PATTERN.test(email)) return false;
        return CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
    }

    /**
     * Detailed email validation with specific error messages
     * @param {string} email - Email to validate
     * @returns {Object} Validation result with errors array
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
            if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
                errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.EMAIL.INVALID_FORMAT);
            } else if (!parts[1].includes('.') || parts[1].endsWith('.') || parts[1].startsWith('.')) {
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

    static _validatePassword(password) {
        if (!password || typeof password !== 'string') return false;
        if (password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) return false;
        if (password.length > CONFIG.VALIDATION.MAX_PASSWORD_LENGTH) return false;
        if (CONFIG.VALIDATION.HTML_PATTERN.test(password)) return false;
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

    static _validateName(name) {
        if (!name || typeof name !== 'string') return false;
        if (name.length > CONFIG.VALIDATION.MAX_NAME_LENGTH) return false;
        if (CONFIG.VALIDATION.HTML_PATTERN.test(name)) return false;
        return true;
    }

    /**
     * Detailed name validation with specific error messages
     * @param {string} name - Name to validate
     * @param {string} fieldType - Type of name field ('firstName' or 'lastName')
     * @returns {Object} Validation result with errors array
     */
    static _validateNameDetailed(name, fieldType = 'name') {
        const errors = [];
        
        if (!name || typeof name !== 'string') {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.REQUIRED);
            return { isValid: false, errors };
        }

        const trimmedName = name.trim();
        
        if (trimmedName.length === 0) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.REQUIRED);
            return { isValid: false, errors };
        }

        if (trimmedName.length < 2) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.TOO_SHORT);
        }

        if (trimmedName.length > CONFIG.VALIDATION.MAX_NAME_LENGTH) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.TOO_LONG);
        }

        if (CONFIG.VALIDATION.HTML_PATTERN.test(trimmedName)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.CONTAINS_HTML);
        }

        // Check for letters and spaces only (no numbers or special characters)
        const namePattern = /^[A-Za-z\s]+$/;
        if (!namePattern.test(trimmedName)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.CONTAINS_NUMBERS);
        }

        // Check for numbers specifically
        if (/\d/.test(trimmedName)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.NAME.CONTAINS_NUMBERS);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Auto-capitalize name (first letter of each word)
     * @param {string} name - Name to capitalize
     * @returns {string} Properly capitalized name
     */
    static _capitalizeName(name) {
        if (!name || typeof name !== 'string') return '';
        
        return name.trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    static _validateDateOfBirth(dateStr) {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(date.getTime())) return false;
        
        // Check if date is in the past
        if (date >= now) return false;
        
        // Check if person is at least 13 years old (COPPA compliance)
        const minDate = new Date();
        minDate.setFullYear(now.getFullYear() - 13);
        
        return date <= minDate;
    }

    static _validateUsername(username) {
        if (!username || typeof username !== 'string') return false;
        if (username.length < 3 || username.length > CONFIG.VALIDATION.MAX_USERNAME_LENGTH) return false;
        if (CONFIG.VALIDATION.HTML_PATTERN.test(username)) return false;
        return CONFIG.VALIDATION.USERNAME_PATTERN.test(username);
    }

    /**
     * Detailed username validation with specific error messages
     * @param {string} username - Username to validate
     * @returns {Object} Validation result with errors array
     */
    static _validateUsernameDetailed(username) {
        const errors = [];
        
        if (!username || typeof username !== 'string') {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.REQUIRED);
            return { isValid: false, errors };
        }

        const trimmedUsername = username.trim();
        
        if (trimmedUsername.length === 0) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.REQUIRED);
            return { isValid: false, errors };
        }

        if (trimmedUsername.length < 3) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.TOO_SHORT);
        }

        if (trimmedUsername.length > CONFIG.VALIDATION.MAX_USERNAME_LENGTH) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.TOO_LONG);
        }

        if (CONFIG.VALIDATION.HTML_PATTERN.test(trimmedUsername)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.CONTAINS_HTML);
        }

        if (!CONFIG.VALIDATION.USERNAME_PATTERN.test(trimmedUsername)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.INVALID_CHARS);
        }

        // Check for invalid start/end characters
        const firstChar = trimmedUsername[0];
        const lastChar = trimmedUsername[trimmedUsername.length - 1];
        if (firstChar && ['.', '_', '-'].includes(firstChar)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.INVALID_START);
        }
        if (lastChar && ['.', '_', '-'].includes(lastChar)) {
            errors.push(CONFIG.VALIDATION.ERROR_MESSAGES.USERNAME.INVALID_END);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static _validatePromoCode(promoCode) {
        if (!promoCode) return true; // Optional field
        // Basic promo code validation (alphanumeric, max 20 chars)
        return /^[A-Z0-9]{1,20}$/.test(promoCode);
    }

    /**
     * Modal methods (basic implementation)
     */
    static _showTermsModal() {
        alert('We do our best to secure your data however it is not guaranteed. ' + 
            'No website is perfect. You agree to not sue us, really me, Rod Griola, if your data is lost or stolen or the Merkel Vision website is no longer available.' 
            + 'This site was created by a volunteer and by using this website you are agreeing to scream into a pillow if you are frustrated by us.' 
            + ' Leave the lawyering for rich people.');
    }

    static _showPrivacyModal() {
        alert('We do not share your info with 3rd parties. This site is about sharing your locations for mediaproductions - that is radio, tv, digital, streaming and film productions.' 
            + 'Do not place sensitive information; ie security codes, passwords or similar in the notes or other places where you cannot secure it.');
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
     * @param {Array} errors - Array of error messages
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

    /**
     * Show dialog when email already exists with redirect options
     */
    static _showEmailExistsDialog() {
        // Hide any existing messages first
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.classList.add('hidden');
        }

        // Create and show custom dialog
        const dialogMessage = 'An account with this email address already exists. Would you like to sign in instead or reset your password?';
        
        // Show initial message
        this._showSecureMessage(dialogMessage, 'info');
        
        // Create action buttons after a brief delay
        setTimeout(() => {
            this._createEmailExistsActionButtons();
        }, 1000);
    }

    /**
     * Create action buttons for email exists scenario
     */
    static _createEmailExistsActionButtons() {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;

        // Clear existing content and create button container
        messageDiv.textContent = 'An account with this email already exists. What would you like to do?';
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'email-exists-buttons';
        
        // Sign In button
        const signInBtn = document.createElement('button');
        signInBtn.textContent = 'Sign In Instead';
        signInBtn.className = 'email-exists-btn sign-in';
        signInBtn.addEventListener('click', () => {
            window.location.href = 'test-login.html';
        });
        
        // Forgot Password button
        const forgotPasswordBtn = document.createElement('button');
        forgotPasswordBtn.textContent = 'Reset Password';
        forgotPasswordBtn.className = 'email-exists-btn forgot-password';
        forgotPasswordBtn.addEventListener('click', () => {
            // Redirect WITHOUT pre-filling email for security
            window.location.href = 'test-forgot-password.html';
        });
        
        // Use Different Email button
        const differentEmailBtn = document.createElement('button');
        differentEmailBtn.textContent = 'Use Different Email';
        differentEmailBtn.className = 'email-exists-btn different-email';
        differentEmailBtn.addEventListener('click', () => {
            messageDiv.classList.add('hidden');
            // Focus on email input to help user
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.focus();
                emailInput.select();
            }
        });
        
        // Add buttons to container
        buttonContainer.appendChild(signInBtn);
        buttonContainer.appendChild(forgotPasswordBtn);
        buttonContainer.appendChild(differentEmailBtn);
        
        // Add container to message div
        messageDiv.appendChild(buttonContainer);
    }

    /**
     * Handle server response (compatibility method)
     */
    static _handleServerResponse(data, success, operation) {
        if (success) {
            if (operation === 'register') {
                this._handleSuccessfulRegistration(data);
            }
        } else {
            const genericMessages = {
                'register': 'Registration failed. Please check your information and try again.',
                'network': 'Connection error. Please check your internet connection and try again.'
            };
            
            this._showSecureMessage(genericMessages[operation] || genericMessages['network'], 'error');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    debug(FILE, 'DOM loaded, initializing registration page');
    RegistrationPageService.initialize();
});

// Export for potential external use
//window.RegistrationPageService = RegistrationPageService;
