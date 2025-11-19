// Test Forgot Password Page JavaScript
// CSP-compliant version following our Security Implementation Guide
// Based on AuthHandlers.js but with all inline style violations eliminated

// Import security utilities
import { SecurityUtils } from './js/utils/SecurityUtils.js';
import { debug, DEBUG } from './js/debug.js';

// Configuration constants
const CONFIG = {
    API_BASE_URL: '/api',
    REDIRECT_DELAY: 2000,
    VALIDATION: {
        MAX_EMAIL_LENGTH: 254,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        HTML_PATTERN: /<[^>]*>/g
    }
};

// Security validation functions (matching our guide patterns)
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
    if (!text || typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// CSP-compliant secure message display (following our guide)
function showSecureMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        debug('Message div not found');
        return;
    }

    // Clear any existing button containers first
    const existingButtons = messageDiv.querySelectorAll('.email-not-found-buttons, .email-verification-buttons');
    existingButtons.forEach(btn => btn.remove());

    // Use secure HTML escaping
    const escapedMessage = escapeHtml(message);
    messageDiv.textContent = escapedMessage;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    // Add subtle animation for better UX
    messageDiv.classList.add('fade-in');
    
    // Debug the element state
    debug(`🎯 Message element visibility:`, {
        className: messageDiv.className,
        isVisible: getComputedStyle(messageDiv).display !== 'none',
        hasHidden: messageDiv.classList.contains('hidden')
    });
    
    // NO AUTO-HIDE TIMEOUTS - following our security guide UX improvements
    // Messages stay visible until user interaction for better accessibility
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    debug(`📝 Message shown (${type}): ${message}`);
}

// CSP-compliant button loading state
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

// Enhanced form validation with security checks
function validateForgotPasswordInputs(email) {
    if (!validateEmail(email)) {
        showSecureMessage('Please enter a valid email address.', 'error');
        return false;
    }
    
    return true;
}

// Handle server response securely with enhanced UX messaging
function handleServerResponse(data, success, operation) {
    debug(`🔄 Handling server response for ${operation}:`, { success, data });
    
    if (success) {
        if (operation === 'forgot-password') {
            showSecureMessage('✅ If an account exists you will receive an email for this account with a reset link.', 'success');
        }
    } else {
        // Handle specific error codes for better UX
        const errorCode = data?.code || data?.error;
        
        if (errorCode) {
            switch (errorCode) {
                case 'EMAIL_NOT_FOUND':
                case 'email_not_found':
                case 'USER_NOT_FOUND':
                case 'user_not_found':
                    // Show email not found dialog with helpful options
                    showEmailNotFoundDialog();
                    return;
                case 'ACCOUNT_DISABLED':
                case 'account_disabled':
                    showSecureMessage('This account has been disabled. Please contact support for assistance.', 'error');
                    return;
                case 'EMAIL_NOT_VERIFIED':
                case 'email_not_verified':
                    showEmailNotVerifiedDialog();
                    return;
                case 'rate_limit_exceeded':
                case 'RATE_LIMIT_EXCEEDED':
                    const retryAfter = data.retryAfter || '15 minutes';
                    showSecureMessage(`Too many password reset attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    return;
                default:
                    debug('Unknown forgot password error code:', errorCode);
                    break;
            }
        }
        
        // Generic error messages to prevent information disclosure
        const genericMessages = {
            'forgot-password': 'Unable to send password reset email. Please check your email address and try again.',
            'network': 'Connection error. Please check your internet connection and try again.'
        };
        
        showSecureMessage(genericMessages[operation] || genericMessages['network'], 'error');
    }
}

// Show email not found dialog with helpful options
function showEmailNotFoundDialog() {
    // Hide any existing messages first
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.classList.add('hidden');
    }

    // Create and show custom dialog
    const dialogMessage = 'No account found with this email address. Would you like to create a new account or try a different email?';
    
    // Show initial message
    showSecureMessage(dialogMessage, 'info');
    
    // Create action buttons after a brief delay
    setTimeout(() => {
        createEmailNotFoundActionButtons();
    }, 1000);
}

// Show email not verified dialog
function showEmailNotVerifiedDialog() {
    const dialogMessage = 'Your email address has not been verified yet. Please check your inbox for the verification email, or request a new one.';
    
    showSecureMessage(dialogMessage, 'info');
    
    setTimeout(() => {
        createEmailNotVerifiedActionButtons();
    }, 1000);
}

// Create action buttons for email not found scenario
function createEmailNotFoundActionButtons() {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    // Clear existing content and create button container
    messageDiv.textContent = 'No account found with this email address. What would you like to do?';
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'email-not-found-buttons';
    
    // Create Account button
    const createAccountBtn = document.createElement('button');
    createAccountBtn.textContent = 'Create New Account';
    createAccountBtn.className = 'email-not-found-btn create-account';
    createAccountBtn.addEventListener('click', () => {
        window.location.href = 'test-registration.html';
    });
    
    // Try Different Email button
    const differentEmailBtn = document.createElement('button');
    differentEmailBtn.textContent = 'Try Different Email';
    differentEmailBtn.className = 'email-not-found-btn different-email';
    differentEmailBtn.addEventListener('click', () => {
        messageDiv.classList.add('hidden');
        // Focus on email input to help user
        const emailInput = document.getElementById('forgotEmail');
        if (emailInput) {
            emailInput.focus();
            emailInput.select();
        }
    });
    
    // Contact Support button
    const supportBtn = document.createElement('button');
    supportBtn.textContent = 'Contact Support';
    supportBtn.className = 'email-not-found-btn contact-support';
    supportBtn.addEventListener('click', () => {
        // You can customize this to your support system
        window.open('mailto:support@merkelvision.com?subject=Account%20Recovery%20Help', '_blank');
    });
    
    // Add buttons to container
    buttonContainer.appendChild(createAccountBtn);
    buttonContainer.appendChild(differentEmailBtn);
    buttonContainer.appendChild(supportBtn);
    
    // Add container to message div
    messageDiv.appendChild(buttonContainer);
}

// Create action buttons for email not verified scenario
function createEmailNotVerifiedActionButtons() {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    // Clear existing content and create button container
    messageDiv.textContent = 'Your email needs to be verified before you can reset your password. What would you like to do?';
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'email-verification-buttons';
    
    // Resend Verification button
    const resendBtn = document.createElement('button');
    resendBtn.textContent = 'Resend Verification Email';
    resendBtn.className = 'email-verification-btn resend-verification';
    resendBtn.addEventListener('click', () => {
        // Redirect to verification page
        window.location.href = 'verify-email.html?reason=forgot_password';
    });
    
    // Check Inbox button
    const checkInboxBtn = document.createElement('button');
    checkInboxBtn.textContent = 'Check My Inbox';
    checkInboxBtn.className = 'email-verification-btn check-inbox';
    checkInboxBtn.addEventListener('click', () => {
        messageDiv.classList.add('hidden');
        showSecureMessage('Please check your email inbox (including spam folder) for the verification link, then try password reset again.', 'info');
    });
    
    // Different Email button
    const differentEmailBtn = document.createElement('button');
    differentEmailBtn.textContent = 'Use Different Email';
    differentEmailBtn.className = 'email-verification-btn different-email';
    differentEmailBtn.addEventListener('click', () => {
        messageDiv.classList.add('hidden');
        const emailInput = document.getElementById('forgotEmail');
        if (emailInput) {
            emailInput.focus();
            emailInput.select();
        }
    });
    
    // Add buttons to container
    buttonContainer.appendChild(resendBtn);
    buttonContainer.appendChild(checkInboxBtn);
    buttonContainer.appendChild(differentEmailBtn);
    
    // Add container to message div
    messageDiv.appendChild(buttonContainer);
}

// Form submission handlers
function initializeForgotPasswordForm() {
    const forgotPasswordFormEl = document.getElementById('forgotPasswordFormElement');

    if (forgotPasswordFormEl) {
        forgotPasswordFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value;

            debug('🔑 Handling forgot password request for email:', email);

            // Validate inputs with security checks
            if (!validateForgotPasswordInputs(email)) return;

            const submitBtn = document.getElementById('resetBtn');
            const resetButton = setButtonLoading(submitBtn, 'Sending Reset Email...');

            try {
                // Clear any previous messages and show loading state
                const messageDiv = document.getElementById('message');
                if (messageDiv) {
                    messageDiv.classList.add('hidden');
                }
                
                showSecureMessage('Sending reset email...', 'info');

                debug('🌐 Sending forgot password request to server');
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/forgot-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    debug('Failed to parse server response:', parseError);
                    handleServerResponse(null, false, 'network');
                    return;
                }

                debug('📡 Forgot password response:', data);

                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = data?.retryAfter || '15 minutes';
                    showSecureMessage(`Too many password reset attempts. Please wait ${retryAfter} before trying again.`, 'error');
                    return;
                }

                handleServerResponse(data, response.ok, 'forgot-password');

            } catch (error) {
                debug('❌ Forgot password error:', error);
                handleServerResponse(null, false, 'network');
            } finally {
                resetButton();
            }
        });
    }
}

// Modal functionality (CSP-compliant)
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
                window.location.href = 'app.html';
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
    // Initialize forgot password form
    initializeForgotPasswordForm();
    
    // Initialize modal functionality
    initializeModal();
    
    // Add smooth scrolling - CSP compliant
    document.documentElement.classList.add('smooth-scroll');
    
    debug('🔐 Test Forgot Password page initialized with CSP compliance');
});

// Check auth status when page loads
window.addEventListener('load', checkExistingAuth);

// Export functions for potential testing use
window.ForgotPasswordHandlers = {
    validateEmail,
    showSecureMessage,
    validateForgotPasswordInputs,
    handleServerResponse,
    showEmailNotFoundDialog,
    showEmailNotVerifiedDialog,
    createEmailNotFoundActionButtons,
    createEmailNotVerifiedActionButtons
};
