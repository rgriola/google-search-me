/**
 * Logout Page Module
 * Handles logout functionality and secure cleanup
 * Security compliant - no inline scripts
 */

import { SecurityUtils } from './utils/SecurityUtils.js';

const API_BASE_URL = '/api';

/**
 * Navigate to login page
 */
function goToLogin() {
    window.location.href = 'login.html';
}

/**
 * Enhanced logout cleanup for better security
 */
function performSecureLogout() {
    console.log('🔒 Performing secure logout cleanup...');
    
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userProfile');
    
    // Clear app-specific data
    localStorage.removeItem('savedLocations');
    localStorage.removeItem('mapCenter');
    localStorage.removeItem('mapZoom');
    localStorage.removeItem('searchHistory');
    localStorage.removeItem('userPreferences');
    
    // Clear any temporary session data
    sessionStorage.clear();
    
    // Clear any cached user data (for security)
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('rememberMe');
    
    console.log('✅ Secure logout cleanup completed');
}

/**
 * Call logout API to invalidate server-side session
 */
async function callLogoutAPI() {
    const authToken = localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');

    // Call logout API if we have tokens
    if (authToken && sessionToken) {
        try {
            console.log('📡 Calling logout API...');
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionToken: sessionToken
                })
            });
            console.log('✅ Logout API call successful');
        } catch (error) {
            console.log('⚠️ Logout API call failed:', error);
            // Continue with local cleanup even if API fails
        }
    }
}

/**
 * Initialize logout page functionality
 */
function init() {
    // Secure event listener for login button
    document.addEventListener('DOMContentLoaded', function() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                goToLogin();
            });
        }
    });

    // Perform logout on page load
    window.addEventListener('load', async () => {
        // Call logout API
        await callLogoutAPI();
        
        // Perform enhanced security cleanup
        performSecureLogout();
    });

    // Auto-redirect to login after 15 seconds
    setTimeout(() => {
        goToLogin();
    }, 15000);
}

// Initialize the module
init();
