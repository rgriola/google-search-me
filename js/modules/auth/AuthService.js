/**
 * Core authentication service
 * Handles login, register, logout, and token management
 */

import { StateManager } from '../state/AppState.js';

/**
 * Authentication Service Class
 */
export class AuthService {
  
  /**
   * Initialize authentication system
   */
  static async initialize() {
    console.log('🔐 Initializing Authentication Service');
    
    // Verify existing token on startup
    await this.verifyAuthToken();
    
    // Set up authentication event listeners
    this.setupEventListeners();
    
    console.log('✅ Authentication Service initialized');
  }

  /**
   * Verify authentication token from localStorage
   */
  static async verifyAuthToken() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      StateManager.clearAuthState();
      return false;
    }

    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        StateManager.setAuthState({
          user: {
            ...userData.user,
            isAdmin: Boolean(userData.user.isAdmin) // ← ADD THIS LINE
          },
          token: token,
          userId: userData.user.id
        });
        return true;
      } else {
        // Invalid token
        localStorage.removeItem('authToken');
        StateManager.clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
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
      console.log('🔐 Attempting login with:', { email, password: '***' });
      
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📤 Login response status:', response.status);
      const data = await response.json();
      console.log('📥 Login response data:', data);

      if (response.ok && data.success) {
        // Store token
        localStorage.setItem('authToken', data.token);
        
        // Update state with admin status preserved
        StateManager.setAuthState({
          user: {
            ...data.user,
            isAdmin: Boolean(data.user.isAdmin) // ← ADD THIS LINE
          },
          token: data.token,
          userId: data.user.id
        });

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
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
      const response = await fetch(`${StateManager.getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after successful registration
        localStorage.setItem('authToken', data.token);
        StateManager.setAuthState({
          user: data.user,
          token: data.token,
          userId: data.user.id
        });

        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Handle user logout with enhanced security cleanup
   */
  static async logout() {
    try {
      console.log('🔐 AuthService: Starting logout process...');
      
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
        
        console.log('✅ Logout API call successful');
      }
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      // Enhanced security cleanup - always execute regardless of API call result
      this.performEnhancedLogoutCleanup();
    }
  }

  /**
   * Enhanced security cleanup for logout
   */
  static performEnhancedLogoutCleanup() {
    console.log('🧹 AuthService: Performing enhanced logout cleanup...');
    
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
    
    console.log('✅ Enhanced logout cleanup completed');
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
      console.error('Forgot password error:', error);
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
        return { success: false, message: data.message || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
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
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  /**
   * Setup authentication event listeners
   */
  static setupEventListeners() {
    // These will be handled by AuthHandlers.js
    console.log('Auth event listeners will be set up by AuthHandlers');
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