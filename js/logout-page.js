/**
 * Logout Page Module
 * Handles logout functionality and secure cleanup
 * Security compliant - no inline scripts
 * 
 * Enhanced with:
 * - Better error handling
 * - Improved security measures
 * - Progress indicators for users
 * - Comprehensive cleanup procedures
 */

import { SecurityUtils } from './utils/SecurityUtils.js';

// Configuration
const CONFIG = {
  API_BASE_URL: '/api',
  AUTO_REDIRECT_DELAY: 15000,  // 15 seconds
  SHOW_PROGRESS: true,         // Show progress indicators to user
  // Debug configuration - set to false in production
  DEBUG: false
};

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
  if (CONFIG.DEBUG) {
    console.log('[LOGOUT]', ...args);
  }
}

/**
 * LogoutService - Encapsulates all logout functionality
 */
class LogoutService {
  /**
   * Initialize the logout process
   */
  static init() {
    debug('🚀 Initializing logout page');
    this._setupEventListeners();
    this._startLogoutProcess();
    this._setupAutoRedirect();
  }
  
  /**
   * Set up event listeners
   */
  static _setupEventListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        loginBtn.addEventListener('click', this._navigateToLogin);
        debug('✅ Login button handler attached');
      } else {
        debug('⚠️ Login button not found in DOM');
      }
    });
  }
  
  /**
   * Start the logout process when page loads
   */
  static _startLogoutProcess() {
    window.addEventListener('load', async () => {
      debug('📄 Page loaded, starting logout process');
      
      // Update UI to show logout in progress
      this._updateLogoutProgressUI('Logging out...');
      
      try {
        // Step 1: Call logout API
        await this._callLogoutAPI();
        
        // Step 2: Perform client-side cleanup
        this._performSecureLogout();
        
        // Step 3: Update UI to show success
        this._updateLogoutProgressUI('Logout successful', 'success');
        debug('✅ Logout process completed successfully');
      } catch (error) {
        // Handle any errors during logout
        this._updateLogoutProgressUI('Logout completed with warnings', 'warning');
        if (CONFIG.DEBUG) {
          console.error('⚠️ Logout process error:', error);
        }
      }
    });
  }
  
  /**
   * Call logout API to invalidate server-side session
   * @returns {Promise<void>}
   */
  static async _callLogoutAPI() {
    const authToken = localStorage.getItem('authToken');
    const sessionToken = localStorage.getItem('sessionToken');

    // Skip API call if no tokens
    if (!authToken || !sessionToken) {
      debug('ℹ️ No auth tokens found, skipping API logout call');
      return;
    }
    
    try {
      debug('📡 Calling logout API...');
      this._updateLogoutProgressUI('Contacting server...');
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({ sessionToken }),
        // Shorter timeout for logout requests
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        debug('✅ Logout API call successful');
      } else {
        debug(`⚠️ Logout API returned status: ${response.status}`);
      }
    } catch (error) {
      // Log error but don't rethrow - we still want to continue with local cleanup
      if (CONFIG.DEBUG) {
        console.error('⚠️ Logout API call failed:', error);
      } else {
        console.error('⚠️ Logout API call failed');
      }
    }
  }
  
  /**
   * Perform secure local logout cleanup
   */
  static _performSecureLogout() {
    debug('🔒 Performing secure logout cleanup...');
    this._updateLogoutProgressUI('Clearing local data...');
    
    // Clear authentication data
    const authItems = ['authToken', 'sessionToken', 'userProfile', 'userId', 'userName'];
    authItems.forEach(item => localStorage.removeItem(item));
    
    // Clear application data
    const appItems = [
      'savedLocations', 'mapCenter', 'mapZoom', 'searchHistory', 
      'userPreferences', 'lastLoginTime', 'rememberMe', 'recentSearches',
      'settings', 'theme', 'lastActive'
    ];
    appItems.forEach(item => localStorage.removeItem(item));
    
    // Clear cookies that we have access to (not HTTPOnly ones)
    this._clearNonEssentialCookies();
    
    // Clear session storage completely
    sessionStorage.clear();
    
    // Add a logout timestamp for anti-CSRF protection
    localStorage.setItem('logoutTimestamp', Date.now().toString());
    
    debug('✅ Secure logout cleanup completed');
  }
  
  /**
   * Clear non-essential cookies
   */
  static _clearNonEssentialCookies() {
    const cookiesToClear = document.cookie.split(';')
      .map(cookie => cookie.trim().split('=')[0])
      .filter(name => !['essential_cookie', 'csrfToken'].includes(name));
    
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
    
    debug(`🍪 Cleared ${cookiesToClear.length} non-essential cookies`);
  }
  
  /**
   * Set up auto-redirect timer
   */
  static _setupAutoRedirect() {
    debug(`⏱️ Setting auto-redirect timer (${CONFIG.AUTO_REDIRECT_DELAY}ms)`);
    
    // Show countdown in the UI
    if (CONFIG.SHOW_PROGRESS) {
      const countdownElement = document.getElementById('redirectCountdown');
      if (countdownElement) {
        const totalSeconds = CONFIG.AUTO_REDIRECT_DELAY / 1000;
        countdownElement.textContent = `${totalSeconds}`;
        
        // Update countdown every second
        const intervalId = setInterval(() => {
          const secondsLeft = parseInt(countdownElement.textContent) - 1;
          countdownElement.textContent = `${secondsLeft}`;
          
          if (secondsLeft <= 0) {
            clearInterval(intervalId);
          }
        }, 1000);
      }
    }
    
    // Set timeout for redirect
    setTimeout(() => {
      debug('⏱️ Auto-redirect timer expired');
      this._navigateToLogin();
    }, CONFIG.AUTO_REDIRECT_DELAY);
  }
  
  /**
   * Navigate to login page
   */
  static _navigateToLogin() {
    debug('🔀 Navigating to login page');
    
    // Add cache-busting parameter to prevent back-button issues
    const cacheBuster = Date.now();
    window.location.href = `login.html?logout=success&t=${cacheBuster}`;
  }
  
  /**
   * Update UI to show logout progress
   * @param {string} message - Message to display
   * @param {string} status - Status type ('progress', 'success', 'warning', 'error')
   */
  static _updateLogoutProgressUI(message, status = 'progress') {
    if (!CONFIG.SHOW_PROGRESS) return;
    
    const progressElement = document.getElementById('logoutProgress');
    if (!progressElement) return;
    
    // Safely update the message using SecurityUtils
    SecurityUtils.setTextContent(progressElement, message);
    
    // Update styling based on status
    progressElement.className = `logout-status logout-status-${status}`;
    
    // Show element
    progressElement.style.display = 'block';
  }
}

// Initialize the logout process
LogoutService.init();
