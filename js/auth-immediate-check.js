/**
 * Immediate Auth Check - Security Entry Point
 * Runs before any UI renders to prevent unauthorized access
 * Self-executing with no external dependencies for speed
 */
(function() {
    'use strict';

    const isProduction = window.location.hostname !== 'localhost' && 
                    !window.location.hostname.includes('dev');
    
    // Configuration
    const CONFIG = {
        LOGIN_URL: '/login.html',
        TOKEN_NAME: 'authToken',
        MIN_TOKEN_LENGTH: 10,
        REDIRECT_PARAMS: 'reason=session_expired',
        DEBUG: !isProduction
    };
    
    // Conditional debug logging
    function debug(message) {
        if (CONFIG.DEBUG) {
            console.log(`🔒 [AUTH-CHECK] ${message}`);
        }
    }

    /**
     * Verify token existence and basic validity
     * @returns {boolean} True if token exists and meets basic requirements
     */
    function hasValidToken() {
        try {
            // Check for token in localStorage
            const token = localStorage.getItem(CONFIG.TOKEN_NAME);
            if (!token || token.length < CONFIG.MIN_TOKEN_LENGTH) {
                debug('No token or token too short');
                return false;
            }
            
            // Check token format (should be a JWT-like structure)
            if (!token.includes('.')) {
                debug('Token format invalid (not JWT-like)');
                return false;
            }
            
            // Check token expiry if embedded
            try {
                // Decode the middle part of the JWT without external libraries
                const payloadBase64 = token.split('.')[1];
                const payload = JSON.parse(atob(payloadBase64));
                
                // Check if token is expired
                if (payload.exp && Date.now() >= payload.exp * 1000) {
                    debug('Token expired');
                    return false;
                }
            } catch (decodeError) {
                // If we can't decode, continue with basic check
                // This is just an optimization, full verification happens later
            }
            
            // Check for logout timestamp (additional security)
            const logoutTimestamp = localStorage.getItem('logoutTimestamp');
            const tokenTimestamp = localStorage.getItem('tokenTimestamp');
            
            if (logoutTimestamp && tokenTimestamp && 
                parseInt(logoutTimestamp) > parseInt(tokenTimestamp)) {
                debug('Token obtained before last logout');
                return false;
            }
            
            debug('Basic token check passed');
            return true;
        } catch (error) {
            // Any error means we fail securely (deny access)
            debug('Error checking token: ' + (error.message || 'Unknown error'));
            return false;
        }
    }

    /**
     * Perform secure redirect to login page
     */
    function redirectToLogin() {
        try {
            // Current page for potential redirect back after login
            const currentPage = encodeURIComponent(window.location.pathname);
            
            // Clear sensitive data before redirect
            localStorage.removeItem('tempAuthData');
            sessionStorage.removeItem('authRedirect');
            
            // Redirect with cache-busting parameter and return URL
            const cacheBuster = Date.now();
            window.location.href = `${CONFIG.LOGIN_URL}?${CONFIG.REDIRECT_PARAMS}&from=${currentPage}&cb=${cacheBuster}`;
        } catch (redirectError) {
            // Fallback to simple redirect if anything goes wrong
            window.location.href = CONFIG.LOGIN_URL;
        }
    }

    // Main execution
    if (!hasValidToken()) {
        debug('No valid auth token found, redirecting immediately');
        redirectToLogin();
        // Prevent any further script execution
        throw new Error('AUTH_REQUIRED');
    } else {
        debug('Initial token check passed, proceeding with full auth verification');
        // Mark the check was performed
        window._authCheckPerformed = true;
    }
})();
