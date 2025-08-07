/**
 * 404 Page Module
 * Handles navigation and interactions for the 404 error page
 * Security compliant - no inline scripts
 */

import { SecurityUtils } from './utils/SecurityUtils.js';

/**
 * Secure navigation to home page
 */
function navigateToHome() {
    // Validate the target URL for security
    const homeUrl = 'app.html';
    
    // Basic URL validation to prevent open redirect vulnerabilities
    if (homeUrl && !homeUrl.includes('javascript:') && !homeUrl.includes('data:')) {
        window.location.href = homeUrl;
    } else {
        console.error('Invalid navigation target blocked for security');
    }
}

/**
 * Initialize 404 page functionality
 */
function init() {
    // Secure event listener setup
    document.addEventListener('DOMContentLoaded', function() {
        const homeBtn = document.getElementById('homeBtn');
        
        if (homeBtn) {
            homeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToHome();
            });
        }
    });

    // Reduced console output for security (minimal information disclosure)
    console.log('404 page loaded');
}

// Initialize the module
init();
