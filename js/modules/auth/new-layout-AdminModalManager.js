/**
 * Admin Modal Manager
 * Handles modal creation and display for admin panel
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';
import { AuthNotificationService } from './AuthNotificationService.js';

/**
 * Admin Modal Manager Class
 * Manages modal creation, display, and basic interactions
 */
export class AdminModalManager {


/**
   * Create error admin modal
   * @param {Error} error - Error object to display
   */
  static createErrorModal(error) {
    this.removeExistingModal();

    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal'; // Use same class as profile modal

    adminModal.innerHTML = `
      <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Panel - Error</h2>
        <div class="admin-error">
            <p>Failed to load admin panel. Please try again.</p>
            <button class="admin-action-btn" data-action="retryAdminPanel">
                Retry
            </button>
        </div>
      </div>
    `;

    document.body.appendChild(adminModal);
    
    // Follow same display pattern as profile modal
    adminModal.style.display = 'block';
    adminModal.classList.add('show');
    
    console.log('✅ Admin error modal display set');
    
    this.setupModalEvents(adminModal);
    AuthNotificationService.showError('Failed to load admin panel');
    return adminModal;
  }


/**
 * Dynamically load the admin modal CSS file
 */
static loadAdminStyles() {
    const existingLink = document.querySelector('link[href="css/pages/new-layout-admin.css"]');
    if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/pages/new-layout-admin.css'; // Path to your CSS file
        document.head.appendChild(link);
        console.log('✅ Admin styles loaded dynamically');
    } else {
        console.log('ℹ️ Admin styles already loaded');
      }
}
  /**
   * Create loading admin modal
   */
  
  static createLoadingModal() {  // styles
   // this.loadAdminStyles();
    this.removeExistingModal();
    
    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal-content'; // Use same class as profile modal

    adminModal.innerHTML = `
   <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Loading Panel</h2>
        <div class="admin-loading">
          <div class="loading-spinner"></div>
          <p>Loading admin data...</p>
        </div>
      </div>
    `;

    console.log('✅ Admin loading modal display set');
    document.body.appendChild(adminModal);
    // Follow same display pattern as profile modal
    adminModal.style.display = 'block';
    adminModal.classList.add('show');
    this.setupModalEvents(adminModal);
    return adminModal;
  }

  /**
   * Create main admin modal with data
   * @param {Object} adminData - Admin data containing users, stats, and locations
   */
  static createMainModal(adminData) {
    this.loadAdminStyles();
    this.removeExistingModal();

    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal-content'; // Use same class as profile modal

    const { users, stats, locations } = adminData;
    console.log('🔧 Creating admin modal with data:', {
      usersCount: users?.length,
      statsData: stats,
      locationsCount: locations?.length,
      firstLocation: locations?.[0]
    });

    adminModal.innerHTML = this.generateModalContent(adminData);
    document.body.appendChild(adminModal);
    
    console.log('🔍 Admin modal added to DOM:', {
      modalExists: !!document.getElementById('adminModal'),
      modalInDom: document.body.contains(adminModal),
      modalHtml: adminModal.innerHTML.length > 0
    });
    
    // Follow same display pattern as profile modal
    adminModal.style.display = 'block';
    adminModal.classList.add('show');
    
    console.log('✅ Admin modal display set:', {
      display: adminModal.style.display,
      classes: adminModal.className,
      hasShowClass: adminModal.classList.contains('show'),
      isVisible: adminModal.offsetHeight > 0,
      computedDisplay: window.getComputedStyle(adminModal).display
    });
    
    this.setupModalEvents(adminModal);
    return adminModal;
  }

  /**
   * Generate modal content HTML
   * @param {Object} adminData - Admin data
   * @returns {string} HTML content
   */
  static generateModalContent(adminData) {
    const { users, stats, locations } = adminData;
    
    return `
      <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin MY Panel</h2>
        
        <!-- Admin Stats -->
        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-number">${stats.totalUsers || users.length}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.adminUsers || users.filter(u => u.isAdmin).length}</div>
            <div class="stat-label">Admin Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.totalLocations || locations.length}</div>
            <div class="stat-label">Total Locations</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.activeSessions || 0}</div>
            <div class="stat-label">Active Sessions</div>
          </div>
        </div>

        <!-- Admin Tabs -->
        <div class="admin-tabs">
          <button class="admin-tab-btn active" data-tab="users">👥 Users</button>
          <button class="admin-tab-btn" data-tab="locations">📍 Locations</button>
          <button class="admin-tab-btn" data-tab="system">⚙️ System</button>
        </div>

        <!-- Tab Content Container -->
        <div class="admin-tab-content" id="adminTabContent">
          <!-- Content will be loaded dynamically -->
        </div>
      </div>
    `;
  }

  /**
   * Setup modal event handlers
   * @param {HTMLElement} modal - Admin modal element
   */
  static setupModalEvents(modal) {
    this.setupCloseButton(modal);
    this.setupTabSwitching(modal);
    this.setupClickOutsideClose(modal);
  }

  /**
   * Setup close button functionality
   * @param {HTMLElement} modal - Modal element
   */
  static setupCloseButton(modal) {
    const closeBtn = modal.querySelector('.admin-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
    }
  }

  /**
   * Setup tab switching functionality
   * @param {HTMLElement} modal - Modal element
   */
  static setupTabSwitching(modal) {
    const tabButtons = modal.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.switchTab(tabName, modal);
      });
    });
  }

  /**
   * Setup click outside to close functionality
   * @param {HTMLElement} modal - Modal element
   */
  static setupClickOutsideClose(modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Switch active tab
   * @param {string} tabName - Tab name to switch to
   * @param {HTMLElement} modal - Admin modal element
   */
  static switchTab(tabName, modal) {
    // Update tab buttons
    modal.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Load tab content dynamically
    const contentContainer = modal.querySelector('#adminTabContent');
    if (contentContainer) {
      contentContainer.innerHTML = '<div class="tab-loading">Loading...</div>';
      
      // Dispatch custom event for tab content loading
      const event = new CustomEvent('adminTabSwitch', {
        detail: { tabName, modal, contentContainer }
      });
      document.dispatchEvent(event);
    }
  }

  /**
   * Remove existing modal if present
   */
  static removeExistingModal() {
    const existingModal = document.getElementById('adminModal');
    if (existingModal) {
      existingModal.remove();
    }
  }
}
