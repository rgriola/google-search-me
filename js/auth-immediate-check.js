// Security: Immediate auth check script - runs before any UI renders
(function() {
    'use strict';
    
    // Quick token check without module imports (for immediate execution)
    function hasToken() {
        try {
            const token = localStorage.getItem('authToken');
            return token && token.length > 10;
        } catch (error) {
            return false;
        }
    }
    
    // If no token exists, redirect immediately (before any UI renders)
    if (!hasToken()) {
        console.log('🚨 SECURITY: No auth token found, redirecting immediately');
        window.location.href = '/login.html';
        return; // Prevent further script execution
    }
    
    console.log('🔒 SECURITY: Token found, proceeding with full auth verification');
})();
