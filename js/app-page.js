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
async function initializeFormHandlers() {
    console.log('🔧 Initializing form handlers after UI reveal...');
    
    // Directly use PasswordUIService - no need to wait for main.js
    await setupPasswordHandler();
}

/**
 * Setup password change functionality using centralized PasswordUIService
 */
async function setupPasswordHandler() {
    console.log('🔧 App-Page.js <<>> Setting up password change handler...');
    
    try {
        // Import and use centralized PasswordUIService
        const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
        
        // Initialize the service
        PasswordUIService.initialize();
        
        // Get Auth notification services for error/success display
        const { AuthNotificationService } = Auth.getServices();
        
        // Setup the password form with centralized UI service
        const result = PasswordUIService.setupChangePasswordHandler({
            Auth: Auth,
            showError: (message) => {
                AuthNotificationService.showNotification(message, 'error');
            },
            showSuccess: (message) => {
                AuthNotificationService.showNotification(message, 'success');
            }
        });
        
        if (result?.success !== false) {
            console.log('✅ PasswordUIService initialized successfully');
        } else {
            console.warn('⚠️ PasswordUIService setup had issues:', result?.message);
        }
    } catch (error) {
        console.error('❌ Failed to load PasswordUIService:', error);
        console.log('📋 Note: Password functionality requires PasswordUIService module');
    }
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
    
    // Check for admin access attempt notice
    checkAdminAccessAttempt();
});

/**
 * Check if user attempted to access admin panel and show notice
 */
function checkAdminAccessAttempt() {
    const adminAttempt = sessionStorage.getItem('adminAccessAttempt');
    if (adminAttempt) {
        // Clear the flag
        sessionStorage.removeItem('adminAccessAttempt');
        
        // Import and show notification
        import('./modules/ui/NotificationService.js')
            .then(({ NotificationService }) => {
                NotificationService.initialize();
                NotificationService.show({
                    type: 'warning',
                    title: 'Access Restricted',
                    message: 'Only administrators can view the database viewer.',
                    duration: 6000
                });
            })
            .catch(error => {
                console.error('Failed to load NotificationService:', error);
                // Fallback to alert
                alert('⚠️ Access Restricted: Only administrators can view the database viewer.');
            });
    }
}

// Initialize map when page loads
window.addEventListener('load', initializeMapWhenReady);
