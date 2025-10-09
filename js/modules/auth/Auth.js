/**
 * Authentication Module Coordinator
 * Central coordinator for all auth functionality - imports and initializes all auth services
 */

import { AuthService } from './AuthService.js';
import { AuthUICore } from './AuthUICore.js';
import { AuthEventHandlers } from './AuthEventHandlers.js';
import { AuthFormHandlers } from './AuthFormHandlers.js';
import { AuthModalService } from './AuthModalService.js';
import { AuthNotificationService } from './AuthNotificationService.js';
import { PasswordValidationService } from './PasswordValidationService.js';
import { StateManager } from '../state/AppState.js';

import { debug } from '../../debug.js';

const FILE = 'AUTH';

/**
 * Main Authentication Module
 * Coordinates all auth services and provides a unified interface
 */
export class Auth {

  /**
   * Initialize the authentication system
   */
  static async initialize() {
    debug(FILE, '🔐 Initializing Authentication System');
    
    try {
      // Initialize core services first
      await AuthService.initialize();
      
      // Initialize UI components
      AuthUICore.initialize();
      
      // Initialize event handlers
      AuthEventHandlers.initialize();
      AuthFormHandlers.initialize();
      
      debug(FILE, '✅ Authentication System initialized successfully');
      
    } catch (error) {
      debug(FILE, '❌ Failed to initialize Authentication System:', error, 'error');
      AuthNotificationService.showError('Failed to initialize authentication system');
    }
  }

  /**
   * Get all auth services for external use
   */
  static getServices() {
    return {
      AuthService,
      AuthUICore,
      AuthEventHandlers,
      AuthFormHandlers,
      AuthModalService,
      AuthNotificationService,
      PasswordValidationService
    };
  }

  // Re-export only actually used methods for backward compatibility
  static showLoginModal = () => AuthModalService.showAuthModal('login');
  static showRegisterModal = () => AuthModalService.showAuthModal('register');
  
  // Centralized password validation methods
  static validatePassword = PasswordValidationService.validatePassword;
  static validatePasswordRequirements = PasswordValidationService.validatePasswordRequirements;
  static validatePasswordMatch = PasswordValidationService.validatePasswordMatch;
  static analyzePasswordStrength = PasswordValidationService.analyzePasswordStrength;
  static validatePasswordRealTime = PasswordValidationService.validatePasswordRealTime;
  static validatePasswordChangeForm = PasswordValidationService.validatePasswordChangeForm;
  static updateRequirementIndicators = PasswordValidationService.updateRequirementIndicators;

  // Centralized authentication check methods
  static async checkAuthAndRedirect(redirectUrl = '/login.html', options = {}) {
    debug(FILE, '🔒 Auth.checkAuthAndRedirect called with:', { redirectUrl, options });
    
    try {
      // Use existing AuthService.verifyAuthToken which already handles all the logic
      const isValid = await AuthService.verifyAuthToken();
      
      if (!isValid && !options.skipRedirect) {
        debug(FILE, '❌ Auth invalid, redirecting to:', redirectUrl);
        if (!options.silent) {
          AuthNotificationService.showNotification('Session expired. Redirecting to login...', 'info');
        }
        
        // Small delay for notification visibility
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, options.redirectDelay || 1000);
        
        return false;
      }
      
      debug(FILE, '✅ Auth verification completed, valid:', isValid);
      return isValid;
      
    } catch (error) {
      debug(FILE, '❌ Auth.checkAuthAndRedirect error:', error, 'error');
      
      if (!options.skipRedirect) {
        if (!options.silent) {
          AuthNotificationService.showError('Authentication check failed. Redirecting to login...');
        }
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, options.redirectDelay || 1000);
      }
      
      return false;
    }
  }

  // Quick authentication status check (no redirect)
  static async isAuthenticated() {
    try {
      return await AuthService.verifyAuthToken();
    } catch (error) {
      debug(FILE, '❌ Auth.isAuthenticated error:', error, 'error');
      return false;
    }
  }

  /**
   * Enhanced security check with immediate UI protection
   * Performs both quick token check and full API verification
   * @param {string} redirectUrl - URL to redirect to if not authenticated
   * @returns {boolean} True if authenticated and UI should be shown
   */
  static async performSecurityCheck(redirectUrl = '/login.html') {
    debug(FILE, '🛡️ Performing enhanced security check...');
    
    // First: Quick token check (no API call)
    if (!this.hasValidToken()) {
      debug(FILE, '🚨 SECURITY: No valid token, immediate redirect', 'warn');
      window.location.href = redirectUrl;
      return false;
    }
    
    // Second: Full API verification
    try {
      const isValid = await AuthService.verifyAuthToken();
      
      if (!isValid) {
        debug(FILE, '🚨 SECURITY: Token verification failed, redirecting', 'warn');
        AuthNotificationService.showNotification('Session expired. Redirecting to login...', 'info');
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
        return false;
      }
      
      debug(FILE, '✅ SECURITY: Authentication verified, UI safe to show');
      return true;
      
    } catch (error) {
      debug(FILE, '❌ SECURITY: Auth verification error:', error, 'error');
      AuthNotificationService.showError('Authentication check failed. Redirecting to login...');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
      return false;
    }
  }

  // Get current user from state (no API call)
  static getCurrentUser() {
    const authState = StateManager.getAuthState();
    return authState?.currentUser || null;
  }

  // Enhanced logout with cleanup
  static async logout(redirectUrl = '/login.html') {
    try {
      debug(FILE, '🔓 Auth.logout called');
      
      // Use existing AuthService logout logic
      await AuthService.logout();
      
      // Clear all auth state
      StateManager.clearAuthState();
      localStorage.removeItem('authToken');
      localStorage.removeItem('sessionToken');
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = redirectUrl;
      
    } catch (error) {
      debug(FILE, '❌ Logout error:', error, 'error');
      // Force cleanup even if API call fails
      StateManager.clearAuthState();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = redirectUrl;
    }
  }

  // ===============================
  // Phase 3: Token Management
  // ===============================

  /**
   * Get authentication token with validation
   * @returns {string|null} The auth token or null if not found/invalid
   */
  static getToken() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return null;
      }
      
      // Basic token validation (non-empty, reasonable length)
      if (token.length < 10) {
        debug(FILE, '⚠️ Auth token seems too short, may be invalid', 'warn');
        return null;
      }
      
      return token;
    } catch (error) {
      debug(FILE, '❌ Error retrieving auth token:', error, 'error');
      return null;
    }
  }

  /**
   * Get session token
   * @returns {string|null} The session token or null if not found
   */
  static getSessionToken() {
    try {
      return localStorage.getItem('sessionToken');
    } catch (error) {
      debug(FILE, '❌ Error retrieving session token:', error, 'error');
      return null;
    }
  }

  /**
   * Set authentication tokens securely
   * @param {string} authToken - The authentication token
   * @param {string} sessionToken - The session token (optional)
   */
  static setToken(authToken, sessionToken = null) {
    try {
      if (!authToken) {
        throw new Error('Auth token is required');
      }

      localStorage.setItem('authToken', authToken);
      
      if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
      }

      debug(FILE, '✅ Tokens stored successfully');
    } catch (error) {
      debug(FILE, '❌ Error storing tokens:', error, 'error');
      throw error;
    }
  }

  /**
   * Clear all authentication tokens
   */
  static clearTokens() {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('sessionToken');
      debug(FILE, '✅ Auth tokens cleared');
    } catch (error) {
      debug(FILE, '❌ Error clearing tokens:', error, 'error');
    }
  }

  /**
   * Check if valid token exists (quick check without API call)
   * @returns {boolean} True if a token exists and appears valid
   */
  static hasValidToken() {
    const token = this.getToken();
    return token !== null;
  }

  /**
   * Get comprehensive auth debug information
   * @returns {object} Debug information about current auth state
   */
  static getAuthDebugInfo() {
    try {
      const authToken = this.getToken();
      const sessionToken = this.getSessionToken();
      
      return {
        hasAuthToken: authToken !== null,
        authTokenLength: authToken ? authToken.length : 0,
        authTokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'None',
        hasSessionToken: sessionToken !== null,
        sessionTokenLength: sessionToken ? sessionToken.length : 0,
        localStorageAvailable: typeof(Storage) !== "undefined",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Lazy load and show admin panel
   * This defers loading the admin service until needed
   */
  static async showAdminPanel() {
    try {
      const { AuthAdminService } = await import('./AuthAdminService.js');
      return AuthAdminService.showAdminPanel();
    } catch (error) {
      debug(FILE, 'Failed to load admin panel:', error, 'error');
      throw error;
    }
  }
}

// Note: Global window assignments are handled in main.js to avoid duplication

/*. DO NOT DELETE THIS IS A SUMMARY OF THE AUTH Directory

-Core Auth Services:
Auth.js - Main coordinator
AuthService.js - Core authentication logic
AuthUICore.js - UI updates and navigation
AuthEventHandlers.js - Event handling
AuthFormHandlers.js - Form processing
AuthModalService.js - Modal management
AuthNotificationService.js - Notifications

-Admin Panel (Compliant Modules):
AuthAdminService.js - Main admin coordinator (164 lines)
AdminModalManager.js - Modal creation (234 lines)
AdminDataService.js - Server communication (193 lines)
AdminTabContentManager.js - Content generation (247 lines)
AdminActionsHandler.js - Action handling (158 lines)
AdminFilterManager.js - Filtering logic (71 lines)

-Supporting Services:
AuthHandlers.js - Standalone page handlers (still needed by forgot-password.html, reset-password.html)
PasswordValidationService.js - Password validation utilities
README.md - Documentation

*/

