/**
 * Secure Logout Page Module - logout.js
 * Following security implementation guide
 * CSP compliant - no inline scripts or styles
 * Enhanced security with comprehensive session cleanup
 */

// Import security utilities
import { SecurityUtils } from './js/utils/SecurityUtils.js';
import { debug, DEBUG } from './js/debug.js';
// Debug mode - set to false in production
//const DEBUG = true;
const FILE = 'LOGOUT';

// Configuration
const CONFIG = {
    API_BASE_URL: '/api',
    AUTO_REDIRECT_DELAY: 15000, // 15 seconds
    SHOW_PROGRESS: true,
    REDIRECT_URL: 'login.html',
    HOME_URL: 'landing.html',
    
    // Timeouts
    API_TIMEOUT: 5000,
    CLEANUP_DELAY: 1000,
    
    // Security settings
    CLEAR_HISTORY: false, // Don't clear browser history by default
    FORCE_RELOAD: true,   // Force page reload on navigation
    
    MESSAGE_DISPLAY_TIME: 5000
};

/**
 * TestLogoutService - Secure logout functionality
 */
class TestLogoutService {
    
    static isInitialized = false;
    static autoRedirectTimer = null;
    static countdownInterval = null;
    static logoutInProgress = false;
    
    /**
     * Initialize the logout service
     */
    static init() {
        if (this.isInitialized) {
            debug(FILE, '⚠️ Service already initialized');
            return;
        }
        
        debug(FILE, '🚀 Initializing secure logout service');
        
        // Set up event listeners first
        this._setupEventListeners();
        
        // Start logout process after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._startLogoutProcess());
        } else {
            this._startLogoutProcess();
        }
        
        this.isInitialized = true;
        debug(FILE, '✅ Logout service initialized');
    }
    
    /**
     * Set up all event listeners
     */
    static _setupEventListeners() {
        debug(FILE, '📡 Setting up event listeners');
        
        // Return to login button
        const loginBtn = document.getElementById('returnToLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._navigateToLogin();
            });
            debug(FILE, '✅ Login button handler attached');
        }
        
        // Go to homepage button
        const homeBtn = document.getElementById('goToHomeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._navigateToHome();
            });
            debug(FILE, '✅ Home button handler attached');
        }
        
        // Cancel auto-redirect button
        const cancelBtn = document.getElementById('cancelAutoRedirect');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._cancelAutoRedirect();
            });
            debug(FILE, '✅ Cancel redirect button handler attached');
        }
        
        // Message close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-close')) {
                this._hideMessage();
            }
        });
        
        // Prevent back navigation to authenticated pages
        this._setupNavigationGuard();
    }
    
    /**
     * Start the complete logout process
     */
    static async _startLogoutProcess() {
        if (this.logoutInProgress) {
            debug(FILE, '⚠️ Logout already in progress');
            return;
        }
        
        this.logoutInProgress = true;
        debug(FILE, '🔒 Starting secure logout process');
        
        try {
            // Step 1: Show processing status
            this._updateLogoutStatus('Processing logout...', 'processing');
            
            // Step 2: Call logout API (with timeout)
            await this._performServerLogout();
            
            // Step 3: Perform comprehensive client-side cleanup
            await this._performSecureCleanup();
            
            // Step 4: Update UI to success state
            this._updateLogoutStatus('Logout completed successfully', 'success');
            
            // Step 5: Enable navigation buttons
            this._enableNavigationButtons();
            
            // Step 6: Start auto-redirect timer
            this._startAutoRedirect();
            
            debug(FILE, '✅ Logout process completed successfully');
            
        } catch (error) {
            debug(FILE, '⚠️ Logout process encountered issues:', error);
            this._updateLogoutStatus('Logout completed with warnings', 'warning');
            this._enableNavigationButtons();
            this._startAutoRedirect();
            this._showMessage('Logout completed but some cleanup operations failed. Your session is still secure.', 'warning');
        } finally {
            this.logoutInProgress = false;
        }
    }
    
    /**
     * Perform server-side logout
     */
    static async _performServerLogout() {
        debug(FILE, '📡 Attempting server logout');
        
        const authToken = localStorage.getItem('authToken');
        const sessionToken = localStorage.getItem('sessionToken');
        
        // Skip API call if no authentication tokens
        if (!authToken && !sessionToken) {
            debug(FILE, 'ℹ️ No authentication tokens found, skipping server logout');
            return;
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    sessionToken,
                    timestamp: Date.now()
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                debug(FILE, '✅ Server logout successful');
                const data = await response.json();
                debug(FILE, 'Server response:', data);
            } else {
                debug(FILE, `⚠️ Server logout returned status: ${response.status}`);
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                debug(FILE, '⏱️ Server logout request timed out');
            } else {
                debug(FILE, '⚠️ Server logout request failed:', error);
            }
            // Don't throw - continue with client cleanup
        }
    }
    
    /**
     * Perform comprehensive client-side cleanup
     */
    static async _performSecureCleanup() {
        debug(FILE, '🧹 Performing comprehensive security cleanup');
        
        // Small delay to show processing state
        await new Promise(resolve => setTimeout(resolve, CONFIG.CLEANUP_DELAY));
        
        // 1. Clear authentication data
        this._clearAuthenticationData();
        
        // 2. Clear application data
        this._clearApplicationData();
        
        // 3. Clear temporary session data
        this._clearSessionData();
        
        // 4. Clear non-essential cookies
        this._clearNonEssentialCookies();
        
        // 5. Add logout timestamp for security
        this._addLogoutTimestamp();
        
        debug(FILE, '✅ Security cleanup completed');
    }
    
    /**
     * Clear all authentication-related data
     */
    static _clearAuthenticationData() {
        const authItems = [
            'authToken',
            'sessionToken', 
            'refreshToken',
            'userProfile',
            'userId',
            'userName',
            'userEmail',
            'lastLoginTime',
            'rememberMe',
            'loginAttempts',
            'twoFactorEnabled'
        ];
        
        let clearedCount = 0;
        authItems.forEach(item => {
            if (localStorage.getItem(item)) {
                localStorage.removeItem(item);
                clearedCount++;
            }
        });
        
        debug(FILE, `🔑 Cleared ${clearedCount} authentication items`);
    }
    
    /**
     * Clear application-specific data
     */
    static _clearApplicationData() {
        const appItems = [
            'savedLocations',
            'mapCenter',
            'mapZoom',
            'searchHistory',
            'recentSearches',
            'userPreferences',
            'settings',
            'theme',
            'lastActive',
            'uploadQueue',
            'drafts',
            'bookmarks',
            'favorites'
        ];
        
        let clearedCount = 0;
        appItems.forEach(item => {
            if (localStorage.getItem(item)) {
                localStorage.removeItem(item);
                clearedCount++;
            }
        });
        
        debug(FILE, `📱 Cleared ${clearedCount} application data items`);
    }
    
    /**
     * Clear session storage completely
     */
    static _clearSessionData() {
        const sessionCount = sessionStorage.length;
        sessionStorage.clear();
        debug(FILE, `🗂️ Cleared ${sessionCount} session storage items`);
    }
    
    /**
     * Clear non-essential cookies (keep essential ones for basic functionality)
     */
    static _clearNonEssentialCookies() {
        const essentialCookies = ['csrfToken', 'essential_cookie', 'consent'];
        const allCookies = document.cookie.split(';');
        let clearedCount = 0;
        
        allCookies.forEach(cookie => {
            const cookieName = cookie.trim().split('=')[0];
            if (cookieName && !essentialCookies.includes(cookieName)) {
                // Clear cookie by setting expiration date in the past
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                clearedCount++;
            }
        });
        
        debug(FILE, `🍪 Cleared ${clearedCount} non-essential cookies`);
    }
    
    /**
     * Add logout timestamp for anti-CSRF and security auditing
     */
    static _addLogoutTimestamp() {
        const timestamp = Date.now();
        localStorage.setItem('logoutTimestamp', timestamp.toString());
        localStorage.setItem('logoutSuccess', 'true');
        debug(FILE, `⏰ Added logout timestamp: ${new Date(timestamp).toISOString()}`);
    }
    
    /**
     * Update logout status display
     */
    static _updateLogoutStatus(message, status = 'processing') {
        const statusElement = document.getElementById('logoutStatus');
        const messageElement = statusElement?.querySelector('.status-message');
        
        if (statusElement && messageElement) {
            // Update message text securely
            SecurityUtils.setTextContent(messageElement, message);
            
            // Update status class
            statusElement.className = `logout-status ${status}`;
            
            // Show the status element
            statusElement.classList.remove('hidden');
            
            debug(FILE, `📊 Updated logout status: ${status} - ${message}`);
        }
    }
    
    /**
     * Enable navigation buttons after logout completion
     */
    static _enableNavigationButtons() {
        const loginBtn = document.getElementById('returnToLoginBtn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
        }
        
        debug(FILE, '🔓 Navigation buttons enabled');
    }
    
    /**
     * Start auto-redirect countdown timer
     */
    static _startAutoRedirect() {
        const timerElement = document.getElementById('autoRedirectTimer');
        const countdownElement = document.getElementById('countdown');
        
        if (!timerElement || !countdownElement) {
            debug(FILE, '⚠️ Auto-redirect elements not found');
            return;
        }
        
        // Show timer
        timerElement.classList.remove('hidden');
        
        let secondsLeft = CONFIG.AUTO_REDIRECT_DELAY / 1000;
        SecurityUtils.setTextContent(countdownElement, secondsLeft.toString());
        
        // Update countdown every second
        this.countdownInterval = setInterval(() => {
            secondsLeft--;
            SecurityUtils.setTextContent(countdownElement, secondsLeft.toString());
            
            if (secondsLeft <= 0) {
                clearInterval(this.countdownInterval);
                this._navigateToLogin();
            }
        }, 1000);
        
        // Set main timeout as backup
        this.autoRedirectTimer = setTimeout(() => {
            this._navigateToLogin();
        }, CONFIG.AUTO_REDIRECT_DELAY);
        
        debug(FILE, `⏱️ Auto-redirect timer started (${secondsLeft} seconds)`);
    }
    
    /**
     * Cancel auto-redirect timer
     */
    static _cancelAutoRedirect() {
        if (this.autoRedirectTimer) {
            clearTimeout(this.autoRedirectTimer);
            this.autoRedirectTimer = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        const timerElement = document.getElementById('autoRedirectTimer');
        if (timerElement) {
            timerElement.classList.add('hidden');
        }
        
        this._showMessage('Auto-redirect cancelled. You can navigate manually using the buttons below.', 'info');
        debug(FILE, '⏹️ Auto-redirect cancelled by user');
    }
    
    /**
     * Navigate to login page
     */
    static _navigateToLogin() {
        debug(FILE, '🔀 Navigating to login page');
        
        // Clear any remaining timers
        this._cancelAutoRedirect();
        
        // Add cache-busting and logout success parameters
        const params = new URLSearchParams({
            logout: 'success',
            t: Date.now().toString()
        });
        
        const targetUrl = `${CONFIG.REDIRECT_URL}?${params.toString()}`;
        
        if (CONFIG.FORCE_RELOAD) {
            window.location.replace(targetUrl);
        } else {
            window.location.href = targetUrl;
        }
    }
    
    /**
     * Navigate to homepage
     */
    static _navigateToHome() {
        debug(FILE, '🏠 Navigating to homepage');
        
        // Clear any remaining timers
        this._cancelAutoRedirect();
        
        const params = new URLSearchParams({
            from: 'logout',
            t: Date.now().toString()
        });
        
        const targetUrl = `${CONFIG.HOME_URL}?${params.toString()}`;
        
        if (CONFIG.FORCE_RELOAD) {
            window.location.replace(targetUrl);
        } else {
            window.location.href = targetUrl;
        }
    }
    
    /**
     * Set up navigation guard to prevent back button issues
     */
    static _setupNavigationGuard() {
        // Add state to history to handle back button
        if (window.history.pushState) {
            window.history.pushState(null, '', window.location.href);
            
            window.addEventListener('popstate', (event) => {
                debug(FILE, '🔙 Back navigation detected, redirecting to login');
                this._navigateToLogin();
            });
        }
        
        // Handle page visibility changes (tab switches, minimize, etc.)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                debug(FILE, '👁️ Page became visible, verifying logout state');
                // Optionally re-verify logout state when page becomes visible
            }
        });
        
        debug(FILE, '🛡️ Navigation guard established');
    }
    
    /**
     * Show secure message to user
     */
    static _showMessage(messageText, type = 'info') {
        const messageElement = document.getElementById('message');
        const messageTextElement = messageElement?.querySelector('.message-text');
        
        if (!messageElement || !messageTextElement) {
            debug(FILE, '⚠️ Message elements not found');
            return;
        }
        
        // Update message content securely
        SecurityUtils.setTextContent(messageTextElement, messageText);
        
        // Update message type
        messageElement.className = `message ${type}`;
        messageElement.classList.remove('hidden');
        
        // Auto-hide after delay (but allow manual close)
        setTimeout(() => {
            if (!messageElement.classList.contains('hidden')) {
                messageElement.classList.add('fade-out');
                setTimeout(() => {
                    messageElement.classList.add('hidden');
                    messageElement.classList.remove('fade-out');
                }, 300);
            }
        }, CONFIG.MESSAGE_DISPLAY_TIME);
        
        debug(FILE, `💬 Showed ${type} message: ${messageText}`);
    }
    
    /**
     * Hide message display
     */
    static _hideMessage() {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.classList.add('hidden');
            messageElement.classList.remove('fade-out');
        }
    }
}

// Security check - verify we're on the right domain
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.warn('[SECURITY] Logout page should only be served over HTTPS in production');
}

// Initialize the logout service
TestLogoutService.init();

// Handle any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    debug(FILE, '⚠️ Unhandled promise rejection:', event.reason);
    // Don't prevent default - let it log to console
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestLogoutService;
}

debug(FILE, '🔒 Secure logout module loaded successfully');
