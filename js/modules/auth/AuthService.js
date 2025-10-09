/**
 * Core authentication service
 * Handles login, register, logout, and token management
 * 
 * This is definitely used. 8-21-2025
 */

import { StateManager } from '../state/AppState.js';

// Debug configuration - set to false in production
const DEBUG = false;

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

/**
 * Authentication Service Class
 */
export class AuthService {
  
  static async updateAuthUI() {
        try {
            const { AuthUICore } = await import('./AuthUICore.js');
            AuthUICore.updateAuthUI();
        } catch (error) {
            if (DEBUG) console.warn('Could not update auth UI:', error);
        }
    }

  /**
   * Initialize authentication system
   * Optimized for faster UI updates
   */
  static async initialize() {
    debug('🔐 Initializing Authentication Service');
    
    // Verify existing token on startup
    const tokenValid = await this.verifyAuthToken();
    
    // If user is authenticated, trigger immediate UI update
    if (tokenValid) {
      debug('🚀 Token verified - triggering immediate UI update');
      // Import and update UI immediately 
      await this.updateAuthUI();
    }
    
    // Set up authentication event listeners
    this.setupEventListeners();
    
    debug('✅ Authentication Service initialized');
  }

  /**
   * Verify authentication token from localStorage
   */
  static async verifyAuthToken() {
    const token = localStorage.getItem('authToken');

    debug('🔍 js/modules/auth/AuthService.js verifyAuthToken()', token ? 'present' : 'missing');
    
    if (!token) {
      debug('🔍 js/modules/auth/AuthService.js verifyAuthToken() No token found, clearing auth state');
      StateManager.clearAuthState();
      return false;
    }

    // Check if we already have auth state
    const currentAuthState = StateManager.getAuthState();
    const hasAuthState = !!(currentAuthState?.currentUser && currentAuthState?.authToken);
            
    debug('🔍 js/modules/auth/AuthService.js verifyAuthToken() Has existing auth state:', hasAuthState);

    try {
      const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': hasAuthState ? 'no-cache' : 'no-cache, no-store, must-revalidate',
      'Pragma': !hasAuthState ? 'no-cache' : undefined
      };

      // Remove undefined headers
      Object.keys(headers).forEach(key => headers[key] === undefined && delete headers[key]);

      debug('🔍 js/modules/auth/AuthService.js verifyAuthToken() request to verify endpoint...');
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/verify`, {
                              method: 'GET',
                              headers
                              });
      
      debug('🔍 Verify response:', response.status, response.statusText);

      if (response.ok) {
          let userData;

      try {
        userData = await response.json();
        debug('🔍 userData from verify:', userData);

      } catch (jsonError) {
              if (response.status === 304 && hasAuthState) {
                 debug('304 response - token still valid, keeping existing auth state');
                 return true;
                  }
                localStorage.removeItem('authToken');
                StateManager.clearAuthState();
                return false;
          }

      // Add debug log to confirm data passed to StateManager
      debug('🔍 js/modules/auth/AuthService.js verifyAuthToken() setting StateManager user data:', userData.user);

      StateManager.setAuthState({
        user: {
        ...userData.user,
        isAdmin: Boolean(userData.user.isAdmin)
        },
        token,
        userId: userData.user.id
      });

      try {
        await this.updateAuthUI();
      } catch (uiError) {
        if (DEBUG) console.warn('Could not update auth UI immediately:', uiError);
      }

      return true;
      } else {
      debug('🔍 AUTH DEBUG: Invalid token response:', response.status);
      localStorage.removeItem('authToken');
      StateManager.clearAuthState();
      return false;
      }
    } catch (error) {
      if (DEBUG) console.error('🔍 AUTH DEBUG: Token verification error:', error);
      StateManager.clearAuthState();
      return false;
    }
  }

  /**
   * Handle user login
   * @param {string} email - User email (changed from username)
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  static async login(email, password) {
    try {
      debug('🔐 Attempting login with:', { email, password: '***' });
      
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      debug('📤 Login response status:', response.status);
      const data = await response.json();
      debug('📥 Login response data:', data);

      if (response.ok && data.success) {
        // Store token
        localStorage.setItem('authToken', data.token);
        
        // Update state with admin status preserved
        StateManager.setAuthState({
          user: {
            ...data.user,
            isAdmin: Boolean(data.user.isAdmin)
          },
          token: data.token,
          userId: data.user.id
        });

        return { success: true, user: data.user };
      } else {
        // Handle email verification required
        if (response.status === 403 && data.verificationPageUrl) {
          debug('📧 Email verification required, storing email for verification page');
          sessionStorage.setItem('verificationEmail', email);
          return { 
            success: false, 
            error: data.error || 'Email verification required',
            requiresVerification: true,
            verificationUrl: data.verificationPageUrl
          };
        }
        
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      if (DEBUG) console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Handle user registration
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  static async register(userData) {
    try {
      debug('🔐 Attempting registration with:', { email: userData.email, username: userData.username });
      
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      debug('📤 Registration response status:', response.status);
      const data = await response.json();
      debug('📥 Registration response data:', data);

      if (response.ok && data.success) {
        // Store token
        localStorage.setItem('authToken', data.token);
        
        // Update state with user data - fix the property name mismatch
        // Add debug log to confirm data passed to StateManager
        debug('🔍 Setting auth state with user:', data.user);

        StateManager.setAuthState({
          user: {
            ...data.user,
            isAdmin: Boolean(data.user.isAdmin)
          },
          token: data.token,
          userId: data.user.id
        });

        debug('✅ Registration successful, auth state updated');
        
        await this.updateAuthUI();

        return { 
          success: true, 
          user: data.user,
          token: data.token,
          requiresVerification: data.requiresVerification 
        };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      if (DEBUG) console.error('Registration error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Handle user logout with enhanced security cleanup
   */
  static async logout() {
    try {
      debug('🔐 AuthService: Starting logout process...');
      
      // Call logout endpoint if token exists
      const authState = StateManager.getAuthState();
      if (authState.authToken) {
        const sessionToken = localStorage.getItem('sessionToken');
        
        await fetch(`${StateManager.getApiBaseUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionToken: sessionToken
          })
        });
        
        debug('✅ Logout API call successful');
      }
      
      // Enhanced security cleanup - always execute regardless of API call result
      this.performEnhancedLogoutCleanup();
      
      return { success: true, message: 'Logout successful' };
      
    } catch (error) {
      if (DEBUG) console.error('❌ Logout API error:', error);
      
      // Still perform cleanup even if API call fails
      this.performEnhancedLogoutCleanup();
      
      return { success: true, message: 'Logout completed (with API error)' };
    }
  }

  /**
   * Enhanced security cleanup for logout
   */
  static performEnhancedLogoutCleanup() {
    debug('🧹 AuthService: Performing enhanced logout cleanup...');
    
    // Clear authentication tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userProfile');
    
    // Clear app-specific data for security
    localStorage.removeItem('savedLocations');
    localStorage.removeItem('mapCenter');
    localStorage.removeItem('mapZoom');
    localStorage.removeItem('searchHistory');
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('rememberMe');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear app state
    StateManager.clearAuthState();
    
    debug('✅ Enhanced logout cleanup completed');
  }

  /**
   * Handle forgot password
   * @param {string} email - User email
   * @returns {Promise<Object>} Forgot password result
   */
  static async forgotPassword(email) {
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message || 'Password reset email sent' };
      } else {
        return { success: false, message: data.message || 'Failed to send reset email' };
      }
    } catch (error) {
      if (DEBUG) console.error('Forgot password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<Object>} Update result
   */
  static async updateProfile(profileData) {
    try {
      const authState = StateManager.getAuthState();
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        // Update user data in state
        StateManager.setAuthState({
          user: data.user,
          token: authState.authToken,
          userId: data.user.id
        });

        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Auth.Service.updateProfile update failed' };
      }
    } catch (error) {
      if (DEBUG) console.error('Profile update error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Change password result
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      const authState = StateManager.getAuthState();
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authState.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: 'Password changed successfully' };
      } else {
        return { success: false, message: data.message || 'Password change failed' };
      }
    } catch (error) {
      if (DEBUG) console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Setup authentication event listeners
   */
  static setupEventListeners() {
    // These will be handled by AuthHandlers.js
    debug('This does nothing. Auth event listeners will be set up by AuthHandlers');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  static isAuthenticated() {
    return StateManager.isAuthenticated();
  }

  /**
   * Get current user
   * @returns {Object|null} Current user object
   */
  static getCurrentUser() {
    return StateManager.getAuthState().currentUser;
  }

  /**
   * Get authentication token
   * @returns {string|null} Auth token
   */
  static getAuthToken() {
    return StateManager.getAuthState().authToken;
  }
}

// Export individual functions for backward compatibility
export const verifyAuthToken = AuthService.verifyAuthToken.bind(AuthService);
export const login = AuthService.login.bind(AuthService);
export const register = AuthService.register.bind(AuthService);
export const logout = AuthService.logout.bind(AuthService);
export const forgotPassword = AuthService.forgotPassword.bind(AuthService);
export const updateProfile = AuthService.updateProfile.bind(AuthService);
export const changePassword = AuthService.changePassword.bind(AuthService);
export const isAuthenticated = AuthService.isAuthenticated.bind(AuthService);
export const getCurrentUser = AuthService.getCurrentUser.bind(AuthService);
export const getAuthToken = AuthService.getAuthToken.bind(AuthService);