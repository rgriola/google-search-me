/**
 * Core Authentication UI Service
 * Handles basic UI updates, navigation buttons, and core display functionality
 */

import { StateManager } from '../state/AppState.js';
import { debug } from '../../debug.js';

const FILE = 'AUTH_UI_CORE';

/**
 * Core Authentication UI Class
 */
export class AuthUICore {

  /**
   * Initialize core authentication UI
   */
  static initialize() {
    debug(FILE, '🎨 Initializing Core Authentication UI');
    
    // Show loading state initially
    this.showAuthLoadingState();
    
    // Update UI based on current state
    this.updateAuthUI();
    
    debug(FILE, '✅ Core Authentication UI initialized');
  }

  /**
   * Create a DOM element with attributes
   * @param {string} tag - Element tag name
   * @param {string} className - CSS class name(s)
   * @param {Object} attrs - Object containing attribute key-value pairs
   * @param {string} textContent - Text content for the element
   * @returns {HTMLElement} Created element
   */
  static createElement(tag, className = '', attrs = {}, textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    
    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
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
      
      // Clear existing content
      while (savedLocationsList.firstChild) {
        savedLocationsList.removeChild(savedLocationsList.firstChild);
      }
      
      // Create loading container with spinner and text
      const loadingContainer = this.createElement('div', 'loading-container');
      const spinner = this.createElement('div', 'loading-spinner');
      const loadingText = this.createElement('span', '', {}, 'Loading your profile...');
      
      // Assemble the elements
      loadingContainer.appendChild(spinner);
      loadingContainer.appendChild(loadingText);
      savedLocationsList.appendChild(loadingContainer);
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
    
    // Debug information about authentication state
    debug(FILE, '🔍 UpdateAuthUI called');
    debug(FILE, '🔍 Auth state:', authState);
    debug(FILE, '🔍 Is authenticated:', isAuthenticated);
    debug(FILE, '🔍 User data:', user);
    debug(FILE, '🔍 User isAdmin:', user?.isAdmin);

    // Remove loading states when updating UI
    this.hideAuthLoadingState();

    // this.updateNavButtons(isAuthenticated, user);
    // this.updateUserInfo(isAuthenticated, user);
    this.updateSavedLocationsVisibility(isAuthenticated);
    
    // Debug potential authentication issues
    if (user && !isAuthenticated) {
      debug(FILE, '🚨 AUTH UI BUG: Have user data but not showing as authenticated', 'error');
      debug(FILE, '🚨 User object:', user, 'error');
      debug(FILE, '🚨 Auth token:', authState?.authToken ? 'present' : 'missing', 'error');
    }
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
      // Create admin button
      const adminBtn = this.createElement('button', 'dropdown-item', { id: 'adminBtn', 'data-action': 'admin' });
      
      // Create SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16');
      svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      
      // Create SVG paths
      const paths = [
        'M12 2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2v0Z',
        'M6.343 7.343a2 2 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.828v0a2 2 0 0 1-2.828 0L6.343 10.17a2 2 0 0 1 0-2.828v0Z',
        'M17.657 7.343a2 2 0 0 0-2.828 0l-1.414 1.414a2 2 0 0 0 0 2.828v0a2 2 0 0 0 2.828 0l1.414-1.414a2 2 0 0 0 0-2.828v0Z'
      ];
      
      // Add each path to the SVG
      paths.forEach(pathData => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        svg.appendChild(path);
      });
      
      // Add SVG and text to button
      adminBtn.appendChild(svg);
      adminBtn.appendChild(document.createTextNode(' Admin Panel'));
      
      // Insert before logout button
      userDropdown.insertBefore(adminBtn, logoutBtn);
      
      // Add click handler (will be set up by AuthEventHandlers)
      adminBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const { AuthAdminService } = await import('./AuthAdminService.js');
        AuthAdminService.showAdminPanel();
      });
      
      debug(FILE, '➕ Admin button added to user dropdown');
    }
  }

  /**
   * Remove admin button from dropdown
   */
  static removeAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      adminBtn.remove();
      debug(FILE, '➖ Admin button removed from dropdown');
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
    
    debug(FILE, '👤 User info display updated:', { email: user.email, name: user.username });
  }

  /**
   * Update saved locations button visibility
   * @param {boolean} isAuthenticated - Authentication status
   */
  static updateSavedLocationsVisibility(isAuthenticated) {
    const savedLocationsBtn = document.getElementById('saved-locations-list');
    if (savedLocationsBtn) {
      savedLocationsBtn.style.display = isAuthenticated ? 'inline-block' : 'none';
      debug(FILE, '🗺️ Saved locations button visibility:', isAuthenticated ? 'visible' : 'hidden');
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
        debug(FILE, '⬆️ User dropdown hidden');
      } else {
        userDropdown.classList.remove('dropdown-hidden');
        userDropdown.classList.add('dropdown-visible');
        debug(FILE, '⬇️ User dropdown shown');
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
      debug(FILE, '⬇️ User dropdown explicitly shown');
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
      debug(FILE, '⬆️ User dropdown explicitly hidden');
    }
  }

  /**
   * Show 404 page (utility function)
   */
  static show404Page() {
    debug(FILE, '🚫 Redirecting to 404 page');
    window.location.href = '404.html';
  }
}
