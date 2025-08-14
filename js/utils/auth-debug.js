/**
 * Authentication Debug Tool
 * Add this script to any page to see auth state debugging info
 */

window.debugAuth = function() {
    console.log('=== AUTH DEBUG INFO ===');
    
    // Check localStorage
    const authToken = localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');
    
    console.log('localStorage:', {
        authToken: authToken ? `${authToken.substring(0, 20)}...` : 'missing',
        sessionToken: sessionToken ? `${sessionToken.substring(0, 20)}...` : 'missing'
    });
    
    // Check app state if available
    if (window.StateManager) {
        const authState = window.StateManager.getAuthState();
        console.log('App State:', authState);
        console.log('Current User:', authState?.currentUser);
        console.log('Auth Token in State:', authState?.authToken ? 'present' : 'missing');
        console.log('User ID:', authState?.currentUserId);
    } else {
        console.log('StateManager not available');
    }
    
    // Check UI elements
    const userInfo = document.getElementById('userInfo');
    const welcomeText = document.getElementById('welcomeText');
    const authButtons = document.getElementById('authButtons');
    
    console.log('UI Elements:', {
        userInfo: userInfo ? {
            visible: !userInfo.classList.contains('hidden'),
            classes: userInfo.className
        } : 'not found',
        welcomeText: welcomeText ? {
            text: welcomeText.textContent,
            visible: !welcomeText.classList.contains('hidden')
        } : 'not found',
        authButtons: authButtons ? {
            visible: !authButtons.classList.contains('auth-buttons-hidden'),
            classes: authButtons.className
        } : 'not found'
    });
    
    console.log('========================');
};

// Auto-run debug after 5 seconds to ensure modules are loaded
setTimeout(() => {
    console.log('🔍 Running automatic auth debug...');
    
    // Double-check StateManager availability
    if (window.StateManager) {
        console.log('🔍 StateManager available, running debug...');
        window.debugAuth();
    } else {
        console.log('⚠️ StateManager not available, retrying in 2 seconds...');
        setTimeout(() => {
            if (window.StateManager) {
                console.log('🔍 StateManager now available, running debug...');
                window.debugAuth();
            } else {
                console.log('❌ StateManager still not available after retry');
            }
        }, 2000);
    }
}, 5000);

// Make it available in console
window.authDebug = window.debugAuth;
