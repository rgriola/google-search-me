/**
 * Database Viewer Security Check
 * Immediate admin access validation before any UI renders
 * SECURITY: This script must run before any database content is displayed
 */

// Hide body content immediately until security check completes
document.documentElement.style.visibility = 'hidden';

(async function() {
    try {
        const token = localStorage.getItem('authToken');
        
        // If no token, redirect to login without message
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        // Verify token and admin status with server
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // If logged in but not admin, redirect to app with notice
            if (!userData.user || !userData.user.isAdmin) {
                // Store admin access attempt notice
                sessionStorage.setItem('adminAccessAttempt', 'true');
                window.location.href = '/app.html';
                return;
            }
            
            // If admin, allow page to load normally
            console.log('✅ Admin access granted');
            document.documentElement.style.visibility = 'visible';
            
        } else {
            // Invalid token, redirect to login without message
            localStorage.removeItem('authToken');
            window.location.href = '/login.html';
            return;
        }
        
    } catch (error) {
        console.error('Admin access check failed:', error);
        // On error, redirect to login
        window.location.href = '/login.html';
        return;
    }
})();
