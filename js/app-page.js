/**
 * App Page JavaScript - CSP Compliant Version
 * Handles authentication check and map initialization
 * Moved from inline scripts to comply with Content Security Policy
 */

/**
 * Check authentication before loading the app
 */
async function checkAuth() {
    console.log('🔒 Checking authentication...');
    
    // Check if this is a redirect from login/register
    const urlParams = new URLSearchParams(window.location.search);
    const fromSource = urlParams.get('from');
    
    if (fromSource) {
        console.log(`📍 Redirected from: ${fromSource}`);
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    console.log('🔍 DEBUG: localStorage contents:', { 
        authToken: localStorage.getItem('authToken') ? 'present' : 'missing',
        sessionToken: localStorage.getItem('sessionToken') ? 'present' : 'missing'
    });
    
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.log('❌ No auth token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('🔑 Auth token found:', authToken.substring(0, 20) + '...');
    
    try {
        console.log('📡 Verifying token with API...');
        
        // For fresh registration/login, force a fresh request
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };
        
        if (fromSource === 'register' || fromSource === 'login') {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
            console.log('🆕 Forcing fresh auth verification for new session');
        } else {
            headers['Cache-Control'] = 'no-cache';
        }
        
        // Verify token is still valid by calling the auth verify endpoint
        const response = await fetch('/api/auth/verify', { headers });
        
        console.log('📊 API response status:', response.status);
        
        // Try to log the response body for debugging
        try {
            const responseClone = response.clone();
            responseClone.text().then(text => {
                try {
                    const data = JSON.parse(text);
                    console.log('🔍 DEBUG: API response body:', data);
                } catch (e) {
                    console.log('🔍 DEBUG: API response text:', text);
                }
            });
        } catch (err) {
            console.log('🔍 DEBUG: Could not read response body', err);
        }
        
        if (!response.ok) {
            console.log('❌ Token invalid or expired, clearing storage');
            console.log(`🔍 DEBUG: API response status: ${response.status}`);
            
            // Show error in page for debugging
            showDebugError(`Token verification failed with status ${response.status}. Redirecting to login in 5 seconds...`);
            
            // Token invalid or expired
            localStorage.removeItem('authToken');
            localStorage.removeItem('sessionToken');
            
            // Delay redirect for debugging
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);
            return;
        }
        
        // Token valid, continue loading the app
        console.log('✅ Authentication verified, loading app...');
        
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        // Show error in page for debugging
        showDebugError(`Authentication error: ${error.message}. Redirecting to login in 5 seconds...`);
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('sessionToken');
        
        // Delay redirect for debugging
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 5000);
    }
}

/**
 * Show debug error message using CSS classes instead of inline styles
 */
function showDebugError(message) {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'debug-error-banner';
    debugDiv.textContent = `DEBUG: ${message}`;
    
    // Add CSS for debug banner if not already present
    if (!document.querySelector('#debug-error-styles')) {
        const style = document.createElement('style');
        style.id = 'debug-error-styles';
        style.textContent = `
            .debug-error-banner {
                background-color: #ffcccc;
                padding: 20px;
                margin: 20px;
                border: 2px solid red;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 9999;
                color: #000;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(debugDiv);
}

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
