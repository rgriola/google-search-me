/**
 * Authentication Event Handlers
 * Handles navigation events, button clicks, and non-form user interactions
 */

import { AuthService } from './AuthService.js';
import { AuthModalService } from './AuthModalService.js';
import { AuthUICore } from './AuthUICore.js';

/**
 * Authentication Event Handlers Class
 */
export class AuthEventHandlers {

  /**
   * Initialize all authentication event handlers
   */
  static initialize() {
    console.log('🎯 Initializing Authentication Event Handlers');
    
    this.setupNavButtonHandlers();
    this.setupModalHandlers();
    this.setupGlobalHandlers();
    
    console.log('✅ Authentication Event Handlers initialized');
  }

  /**
   * Setup navigation button event handlers
   */
  static setupNavButtonHandlers() {
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthModalService.showAuthModal('login');
      });
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthModalService.showAuthModal('register');
      });
    }

    // User info click (show dropdown)
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.addEventListener('click', (e) => {
        e.preventDefault();
        AuthUICore.toggleUserDropdown();
      });
    }

    // Profile button in dropdown
    const profileBtn = document.getElementById('profileBtn');
    console.log('🔍 Profile button found:', !!profileBtn);
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('👤 Profile button clicked - showing modal...');
        AuthModalService.showProfileModal();
        AuthUICore.toggleUserDropdown(); // Close dropdown
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const userMenu = document.querySelector('.user-menu');
      const userInfo = document.getElementById('userInfo');
      
      if (userMenu && userInfo && !userInfo.contains(e.target)) {
        userMenu.classList.remove('open');
      }
    });
  }

  /**
   * Setup modal event handlers
   */
  static setupModalHandlers() {
    // Auth modal close handlers
    document.addEventListener('click', (e) => {
      // Close auth modal when clicking outside
      if (e.target.id === 'authModal') {
        AuthModalService.hideAuthModal();
      }
      
      // Close profile modal when clicking outside
      if (e.target.id === 'profileModal') {
        AuthModalService.hideProfileModal();
      }
    });

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        AuthModalService.hideAuthModal();
        AuthModalService.hideProfileModal();
      }
    });

    // Close button handlers (using event delegation)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-btn') || e.target.classList.contains('close')) {
        const modal = e.target.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });
  }

  /**
   * Setup global event handlers
   */
  static setupGlobalHandlers() {
    // 404 fallback: redirect to 404.html if fetch fails
    window.addEventListener('error', function(e) {
      if (e.message && e.message.includes('Failed to fetch')) {
        window.location.href = '/404.html';
      }
    });

    // Handle authentication state changes
    window.addEventListener('authStateChange', (e) => {
      AuthUICore.updateAuthUI();
    });

    // Page visibility change - refresh auth state when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        AuthService.verifyAuthToken();
      }
    });
  }

  /**
   * Handle logout
   */
  static async handleLogout() {
    try {
      console.log('🚪 Logging out...');
      
      const result = await AuthService.logout();
      
      // Check if result exists and has success property
      if (result && result.success) {
        console.log('✅ Logout successful');
        AuthUICore.updateAuthUI();
        
        // Redirect to home or show success message
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/index.html') {
          window.location.href = '/';
        }
      } else {
        console.warn('⚠️ Logout completed but no success confirmation:', result);
        // Still update UI and redirect since logout cleanup was performed
        AuthUICore.updateAuthUI();
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath !== '/index.html') {
          window.location.href = '/';
        }
      }
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still try to clean up the UI even if there was an error
      AuthUICore.updateAuthUI();
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  static setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + L for login modal
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        const authState = StateManager.getAuthState();
        if (!authState?.currentUser) {
          AuthModalService.showAuthModal('login');
        }
      }
      
      // Ctrl/Cmd + Shift + A for admin panel (if admin)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const authState = StateManager.getAuthState();
        if (authState?.currentUser?.isAdmin) {
          import('./AuthAdminService.js').then(({ AuthAdminService }) => {
            AuthAdminService.showAdminPanel();
          });
        }
      }
    });
  }
}
