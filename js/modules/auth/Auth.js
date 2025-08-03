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

/**
 * Main Authentication Module
 * Coordinates all auth services and provides a unified interface
 */
export class Auth {

  /**
   * Initialize the authentication system
   */
  static async initialize() {
    console.log('🔐 Initializing Authentication System');
    
    try {
      // Initialize core services first
      await AuthService.initialize();
      
      // Initialize UI components
      AuthUICore.initialize();
      
      // Initialize event handlers
      AuthEventHandlers.initialize();
      AuthFormHandlers.initialize();
      
      console.log('✅ Authentication System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Authentication System:', error);
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
      AuthNotificationService
    };
  }

  // Re-export only actually used methods for backward compatibility
  static showLoginModal = () => AuthModalService.showAuthModal('login');
  static showRegisterModal = () => AuthModalService.showAuthModal('register');
  
  /**
   * Lazy load and show admin panel
   * This defers loading the admin service until needed
   */
  static async showAdminPanel() {
    try {
      const { AuthAdminService } = await import('./AuthAdminService.js');
      return AuthAdminService.showAdminPanel();
    } catch (error) {
      console.error('Failed to load admin panel:', error);
      throw error;
    }
  }
}

// Note: Global window assignments are handled in main.js to avoid duplication
