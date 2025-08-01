/**
 * Core Authentication UI Service
 * Handles basic UI updates, navigation buttons, and core display functionality
 */

import { StateManager } from '../state/AppState.js';

/**
 * Core Authentication UI Class
 */
export class AuthUICore {

  /**
   * Initialize core authentication UI
   */
  static initialize() {
    console.log('🎨 Initializing Core Authentication UI');
    
    // Show loading state initially
    this.showAuthLoadingState();
    
    // Update UI based on current state
    this.updateAuthUI();
    
    console.log('✅ Core Authentication UI initialized');
  }

  /**
   * Show loading state while authentication is being verified
   */
  static showAuthLoadingState() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const savedLocationsList = document.getElementById('savedLocationsList');
    
    if (userInfo) {
      userInfo.classList.add('auth-loading');
    }
    if (authButtons) {
      authButtons.classList.add('auth-loading');
    }
    if (savedLocationsList) {
      savedLocationsList.classList.add('locations-loading');
      savedLocationsList.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <span>Loading your profile...</span>
        </div>
      `;
    }
  }

  /**
   * Remove loading state and show actual content
   */
  static hideAuthLoadingState() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const savedLocationsList = document.getElementById('savedLocationsList');
    
    if (userInfo) {
      userInfo.classList.remove('auth-loading');
      userInfo.classList.add('fade-in');
    }
    if (authButtons) {
      authButtons.classList.remove('auth-loading');
      authButtons.classList.add('fade-in');
    }
    if (savedLocationsList) {
      savedLocationsList.classList.remove('locations-loading');
    }
  }

  /**
   * Update authentication UI state
   */
  static updateAuthUI() {
    const authState = StateManager.getAuthState();
    
    // Use currentUser instead of user
    const isAuthenticated = !!(authState?.currentUser && authState?.authToken);
    const user = authState?.currentUser;
    
    console.log('🔍 UpdateAuthUI called');
    console.log('🔍 Auth state:', authState);
    console.log('🔍 Is authenticated:', isAuthenticated);
    console.log('🔍 User data:', user);
    console.log('🔍 User isAdmin:', user?.isAdmin);

    // Remove loading states when updating UI
    this.hideAuthLoadingState();

    this.updateNavButtons(isAuthenticated, user);
    this.updateUserInfo(isAuthenticated, user);
    this.updateSavedLocationsVisibility(isAuthenticated);
  }

  /**
   * Update navigation auth buttons
   * @param {boolean} isAuthenticated - Authentication status
   * @param {Object|null} user - Current user object
   */
  static updateNavButtons(isAuthenticated, user) {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userDropdown = document.getElementById('userDropdown');

    if (isAuthenticated && user) {
      // Hide auth buttons, show user info
      if (authButtons) {
        authButtons.classList.add('auth-buttons-hidden');
        authButtons.classList.remove('auth-buttons-visible');
      }
      if (userInfo) {
        userInfo.classList.remove('hidden');
        userInfo.classList.add('user-info-visible');
        
        // Update username display
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
          const displayName = user.firstName 
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : user.username;
          welcomeText.textContent = `Welcome, ${displayName}!`;
        }
      }

      // Add admin button if user is admin
      if (user.isAdmin) {
        this.addAdminButton();
      } else {
        this.removeAdminButton();
      }

    } else {
      // Show auth buttons, hide user info
      if (authButtons) {
        authButtons.classList.remove('auth-buttons-hidden');
        authButtons.classList.add('auth-buttons-visible');
      }
      if (userInfo) {
        userInfo.classList.add('hidden');
        userInfo.classList.remove('user-info-visible');
      }
      if (userDropdown) {
        userDropdown.classList.add('dropdown-hidden');
        userDropdown.classList.remove('dropdown-visible');
      }
      this.removeAdminButton();
    }
  }

  /**
   * Add admin button to user dropdown
   */
  static addAdminButton() {
    // Remove existing admin button if it exists
    this.removeAdminButton();
    
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userDropdown && logoutBtn) {
      const adminBtn = document.createElement('button');
      adminBtn.id = 'adminBtn';
      adminBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2v0Z"></path>
          <path d="M6.343 7.343a2 2 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.828v0a2 2 0 0 1-2.828 0L6.343 10.17a2 2 0 0 1 0-2.828v0Z"></path>
          <path d="M17.657 7.343a2 2 0 0 0-2.828 0l-1.414 1.414a2 2 0 0 0 0 2.828v0a2 2 0 0 0 2.828 0l1.414-1.414a2 2 0 0 0 0-2.828v0Z"></path>
        </svg>
        Admin Panel
      `;
      adminBtn.className = 'dropdown-item';
      
      // Insert before logout button
      userDropdown.insertBefore(adminBtn, logoutBtn);
      
      // Add click handler (will be set up by AuthEventHandlers)
      adminBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const { AuthAdminService } = await import('./AuthAdminService.js');
        AuthAdminService.showAdminPanel();
      });
    }
  }

  /**
   * Remove admin button from dropdown
   */
  static removeAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      adminBtn.remove();
    }
  }

  /**
   * Update user info display
   * @param {boolean} isAuthenticated - Authentication status  
   * @param {Object|null} user - Current user object
   */
  static updateUserInfo(isAuthenticated, user) {
    if (!isAuthenticated || !user) return;

    // Update any additional user info displays
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(element => {
      element.textContent = user.email;
    });

    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
      const displayName = user.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.username;
      element.textContent = displayName;
    });
  }

  /**
   * Update saved locations button visibility
   * @param {boolean} isAuthenticated - Authentication status
   */
  static updateSavedLocationsVisibility(isAuthenticated) {
    const savedLocationsBtn = document.getElementById('saved-locations-list');
    if (savedLocationsBtn) {
      savedLocationsBtn.style.display = isAuthenticated ? 'inline-block' : 'none';
    }
  }

  /**
   * Toggle user dropdown visibility
   */
  static toggleUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      const isVisible = userDropdown.classList.contains('dropdown-visible');
      if (isVisible) {
        userDropdown.classList.remove('dropdown-visible');
        userDropdown.classList.add('dropdown-hidden');
      } else {
        userDropdown.classList.remove('dropdown-hidden');
        userDropdown.classList.add('dropdown-visible');
      }
    }
  }

  /**
   * Show user dropdown
   */
  static showUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      userDropdown.classList.remove('dropdown-hidden');
      userDropdown.classList.add('dropdown-visible');
    }
  }

  /**
   * Hide user dropdown
   */
  static hideUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
      userDropdown.classList.add('dropdown-hidden');
      userDropdown.classList.remove('dropdown-visible');
    }
  }

  /**
   * Show 404 page (utility function)
   */
  static show404Page() {
    window.location.href = '404.html';
  }
}
