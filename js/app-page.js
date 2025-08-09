/**
 * App Page JavaScript - CSP Compliant Version
 * Handles authentication check and map initialization
 * Moved from inline scripts to comply with Content Security Policy
 * PHASE 2: Uses centralized Auth module for authentication
 * SECURITY FIX: Progressive authentication with UI hiding
 */

// Import centralized Auth module
import { Auth } from './modules/auth/Auth.js';

/**
 * Show the main app UI after successful authentication
 */
function showAppUI() {
    const authLoading = document.getElementById('authLoading');
    const appContent = document.getElementById('appContent');
    
    if (authLoading) {
        authLoading.style.display = 'none';
    }
    
    if (appContent) {
        appContent.style.display = 'block';
    }
    
    console.log('✅ App UI revealed after successful authentication');
    
    // IMPORTANT: Initialize form handlers AFTER UI is revealed
    setTimeout(() => {
        initializeFormHandlers();
    }, 100);
}

/**
 * Initialize form handlers that depend on visible DOM elements
 */
function initializeFormHandlers() {
    console.log('🔧 Initializing form handlers after UI reveal...');
    
    try {
        // Call the main.js setup function if available
        if (window.setupChangePasswordHandler && typeof window.setupChangePasswordHandler === 'function') {
            window.setupChangePasswordHandler();
            console.log('✅ Change password handler initialized');
        } else {
            console.warn('⚠️ setupChangePasswordHandler not available, trying alternative...');
            // Try to set up the handler manually if main.js version isn't available
            setupChangePasswordHandlerLocal();
        }
    } catch (error) {
        console.error('❌ Error initializing form handlers:', error);
    }
}

/**
 * Local implementation of change password handler setup
 * Fallback if main.js version isn't available
 */
function setupChangePasswordHandlerLocal() {
    const form = document.getElementById('changePasswordForm');
    if (!form) {
        console.warn('⚠️ Change password form not found');
        return;
    }
    
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const submitButton = document.getElementById('changePasswordSubmitBtn');
    
    if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !submitButton) {
        console.warn('⚠️ Some change password form elements not found');
        return;
    }
    
    function checkFormValidity() {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const validation = Auth.validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
        submitButton.disabled = !validation.isValid;
        
        // Update confirm password field styling
        if (confirmPassword !== '') {
            if (validation.passwordsMatch) {
                confirmPasswordInput.style.borderColor = '#28a745';
                confirmPasswordInput.style.backgroundColor = '#f8fff9';
            } else {
                confirmPasswordInput.style.borderColor = '#dc3545';
                confirmPasswordInput.style.backgroundColor = '#fff8f8';
            }
        } else {
            confirmPasswordInput.style.borderColor = '';
            confirmPasswordInput.style.backgroundColor = '';
        }
    }
    
    function updatePasswordStrength(password) {
        const analysis = Auth.analyzePasswordStrength(password);
        const strengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('passwordStrengthText');
        
        if (strengthBar) {
            strengthBar.style.width = `${analysis.score}%`;
            strengthBar.style.backgroundColor = analysis.color;
        }
        
        if (strengthText) {
            if (password === '') {
                strengthText.innerHTML = '<span style="color: #6c757d;">Password strength will appear here</span>';
            } else {
                const entropyText = analysis.entropy > 0 ? ` (${Math.round(analysis.entropy)} bits entropy)` : '';
                let strengthHTML = `
                    <div style="margin-bottom: 5px;">
                        <strong style="color: ${analysis.color};">Strength: ${analysis.strength.toUpperCase()}</strong> 
                        <span style="font-size: 11px; opacity: 0.8; color: #6c757d;">${entropyText}</span>
                    </div>
                `;
                
                if (analysis.feedback.length > 0) {
                    strengthHTML += `<div style="font-size: 11px; color: #dc3545; margin-bottom: 5px;">
                        ⚠️ Missing: ${analysis.feedback.join(', ')}
                    </div>`;
                }
                
                strengthText.innerHTML = strengthHTML;
            }
        }
    }
    
    // Add event listeners
    newPasswordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
        Auth.updateRequirementIndicators(this.value);
        checkFormValidity();
    });
    
    currentPasswordInput.addEventListener('input', checkFormValidity);
    confirmPasswordInput.addEventListener('input', checkFormValidity);
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        const validation = Auth.validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
        
        if (!validation.isValid) {
            console.error('❌ Form validation failed:', validation.errors);
            return;
        }
        
        submitButton.disabled = true;
        submitButton.textContent = 'Changing Password...';
        
        try {
            const { AuthService } = await import('./modules/auth/AuthService.js');
            const result = await AuthService.changePassword(currentPassword, newPassword);
            
            if (result?.success) {
                console.log('✅ Password changed successfully');
                form.reset();
                updatePasswordStrength('');
                
                // Show enhanced success message with email notification
                const successDiv = document.createElement('div');
                successDiv.style.cssText = 'background-color: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #28a745;';
                successDiv.innerHTML = '🎉 Password changed successfully!<br><small style="font-size: 11px; opacity: 0.9;">📧 A security notification has been sent to your email.</small>';
                form.appendChild(successDiv);
                
                // Add email confirmation details
                setTimeout(() => {
                    if (successDiv.parentElement) {
                        const emailConfirm = document.createElement('div');
                        emailConfirm.style.cssText = 'font-size: 11px; color: #6c757d; margin-top: 8px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #17a2b8;';
                        emailConfirm.innerHTML = '📬 Check your inbox for security notification about this password change.';
                        successDiv.appendChild(emailConfirm);
                    }
                }, 1000);
                
                setTimeout(() => {
                    successDiv.remove();
                }, 4000);
            } else {
                console.error('❌ Password change failed:', result?.message);
            }
        } catch (error) {
            console.error('❌ Password change error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Change Password';
            checkFormValidity();
        }
    });
    
    console.log('✅ Local change password handler setup complete');
}

/**
 * Enhanced authentication check with immediate UI control
 * SECURITY: Ensures UI is only shown after successful authentication
 */
async function checkAuth() {
    console.log('🔒 Starting enhanced authentication verification...');
    
    // Check if this is a redirect from login/register
    const urlParams = new URLSearchParams(window.location.search);
    const fromSource = urlParams.get('from');
    
    if (fromSource) {
        console.log(`📍 Redirected from: ${fromSource}`);
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    try {
        // Double-check token existence (should have been caught by immediate script)
        if (!Auth.hasValidToken()) {
            console.log('🚨 SECURITY: No token found during verification, redirecting');
            window.location.href = '/login.html';
            return false;
        }

        // Use centralized Auth module for full verification
        const options = {
            silent: false, // Show notifications
            redirectDelay: 1000, // Quick redirect on failure
            skipRedirect: false // Allow redirect on failure
        };

        console.log('🔍 Performing full API authentication verification...');
        const isAuthenticated = await Auth.performSecurityCheck('/login.html');
        
        if (isAuthenticated) {
            console.log('✅ Authentication verified successfully');
            // SECURITY: Only show UI after successful authentication
            showAppUI();
            return true;
        } else {
            console.log('❌ Authentication failed, redirect initiated');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        
        // Fallback error handling with user-friendly message
        showDebugError(`AUTHENTICATION ERROR: ${error.message}`, {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
        
        return false;
    }
}

/**
 * Show debug error message using CSS classes instead of inline styles
 */
function showDebugError(message, errorData = null) {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'debug-error-banner';
    
    const errorJson = errorData ? JSON.stringify(errorData, null, 2) : 'No additional data';
    
    debugDiv.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 10px;">🚨 AUTHENTICATION ERROR 🚨</div>
        <div style="font-size: 14px; margin-bottom: 10px;">${message}</div>
        <div style="font-size: 12px; margin-bottom: 15px;">Error details captured - use buttons below:</div>
        
        <div style="margin-bottom: 15px;">
            <button onclick="copyErrorToClipboard()" style="background: #28a745; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                📋 COPY ERROR TO CLIPBOARD
            </button>
            <button onclick="showFullError()" style="background: #17a2b8; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                👁️ SHOW FULL ERROR
            </button>
            <button onclick="proceedToLogin()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                ➡️ CONTINUE TO LOGIN
            </button>
        </div>
        
        <div id="fullErrorDisplay" style="display: none; background: #000; color: #0f0; padding: 15px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 12px; text-align: left; max-height: 200px; overflow-y: auto;">
            <pre id="errorContent">${errorJson}</pre>
        </div>
        
        <div style="font-size: 11px; opacity: 0.8; margin-top: 10px;">
            ⚠️ REDIRECT PREVENTED FOR DEBUGGING - Copy the error data and share it
        </div>
    `;
    
    // Store error data globally for the copy function
    window.currentErrorData = errorData;
    window.currentErrorMessage = message;
    
    // Add CSS for debug banner if not already present
    if (!document.querySelector('#debug-error-styles')) {
        const style = document.createElement('style');
        style.id = 'debug-error-styles';
        style.textContent = `
            .debug-error-banner {
                background-color: #ff4444;
                color: white;
                padding: 20px;
                margin: 0;
                border: 3px solid #cc0000;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 99999;
                font-family: Arial, sans-serif;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                max-height: 90vh;
                overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(debugDiv);
}

// Global functions for the error banner buttons
window.copyErrorToClipboard = function() {
    const errorText = `
🚨 AUTHENTICATION ERROR REPORT
Message: ${window.currentErrorMessage || 'Unknown error'}
Timestamp: ${new Date().toISOString()}

Full Error Data:
${JSON.stringify(window.currentErrorData || {}, null, 2)}

Additional Info:
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}
- Local Storage Auth Token: ${localStorage.getItem('authToken') ? 'Present' : 'Missing'}
- Local Storage Session Token: ${localStorage.getItem('sessionToken') ? 'Present' : 'Missing'}
`;
    
    navigator.clipboard.writeText(errorText).then(() => {
        alert('✅ Error data copied to clipboard! Paste it in your message.');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = errorText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('✅ Error data copied to clipboard! Paste it in your message.');
    });
};

window.showFullError = function() {
    const display = document.getElementById('fullErrorDisplay');
    if (display.style.display === 'none') {
        display.style.display = 'block';
    } else {
        display.style.display = 'none';
    }
};

window.proceedToLogin = function() {
    window.location.href = 'login.html';
};

/**
 * Initialize map when Google Maps is ready
 */
function initializeMapWhenReady() {
    if (typeof google !== 'undefined' && window.initMap) {
        window.initMap();
    } else {
        // Retry a few times if Google Maps isn't ready yet
        let retries = 0;
        const checkAndInit = () => {
            if (typeof google !== 'undefined' && window.initMap) {
                window.initMap();
            } else if (retries < 10) {
                retries++;
                setTimeout(checkAndInit, 500);
            }
        };
        checkAndInit();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication immediately
    checkAuth();
});

// Initialize map when page loads
window.addEventListener('load', initializeMapWhenReady);
