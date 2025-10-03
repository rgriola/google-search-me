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

  // Make this class globally accessible for cleanup operations
  static initialize() {
    window.AdminModalManager = AdminModalManager;
    console.log('✅ AdminModalManager made globally accessible');
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
   * Create main admin modal with data for sidebar
   * @param {Object} adminData - Admin data containing users, stats, and locations
   */
  static createMainModal(adminData) {
    
    this.loadAdminStyles();
    this.removeExistingModal();


   // const sidebarContainer = document.getElementById('sidebar-content-container');
    const sidebarContainer = document.getElementById('profile-panel');
    if (!sidebarContainer) {
      console.error('❌ profile-panel not found');
      return null;
    }

    // Hide existing content in sidebar instead of destroying it
    const existingPanels = sidebarContainer.querySelectorAll('.sidebar-panel');
    existingPanels.forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
      console.log('🔧 Hiding existing panel for main modal:', panel.id || panel.className);
    });

    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminModal';
    adminPanel.className = 'sidebar-panel admin-panel active';

    const { users, stats, locations } = adminData;
    console.log('🔧 Creating admin panel in sidebar with data:', {
      usersCount: users?.length,
      statsData: stats,
      locationsCount: locations?.length,
      firstLocation: locations?.[0]
    });

    // this is where the layout is attached to the admin panel
    adminPanel.innerHTML = this.generateModalContent(adminData);
    sidebarContainer.appendChild(adminPanel);
    
    console.log('🔍 Admin panel added to sidebar:', {
      panelExists: !!document.getElementById('adminModal'),
      panelInSidebar: sidebarContainer.contains(adminPanel),
      panelHtml: adminPanel.innerHTML.length > 0
    });
    
    // Show the sidebar panel
    adminPanel.style.display = 'block';
    adminPanel.classList.add('show');
    
    console.log('✅ Admin panel display set in sidebar:', {
      display: adminPanel.style.display,
      classes: adminPanel.className,
      hasShowClass: adminPanel.classList.contains('show'),
      isVisible: adminPanel.offsetHeight > 0,
      computedDisplay: window.getComputedStyle(adminPanel).display
    });
    
    this.setupModalEvents(adminPanel);
    return adminPanel;
  }

  /**
   * Generate panel content HTML for sidebar
   * @param {Object} adminData - Admin data
   * @returns {string} HTML content
   */
  static generateModalContent(adminData) {
    const { users, stats, locations } = adminData;
    
    return `
      <div class="admin-panel-header">
      <h2>🔧 Admin Panel</h2>
      <span class="close admin-close">&times;</span>
        
      </div>

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
        // Restore the hidden panels when closing admin panel
        this.restoreHiddenPanels();
        
        // Also restore sidebar to default app loading state
        if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
          window.SidebarManager.resetToInitialLayout();
          console.log('✅ Sidebar restored to default state (25%) on admin panel close');
        }
        
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
        // Restore the hidden panels when clicking outside admin panel
        this.restoreHiddenPanels();
        
        // Also restore sidebar to default app loading state
        if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
          window.SidebarManager.resetToInitialLayout();
          console.log('✅ Sidebar restored to default state (25%) on admin panel click outside');
        }
        
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
   * Removes adminModal which is the element stucture for the admin-panel
   * keep this. We need to hide saved-locations-panel remove "active" 
   * 
   */
  static removeExistingModal() {
    const existingModal = document.getElementById('adminModal');
    if (existingModal) {
      existingModal.remove();
    }
  }

  /**
   * Restore previously hidden panels when admin panel closes
   */
  static restoreHiddenPanels() {

    const sidebarContainer = document.getElementById('sidebar-content-container');
    if (!sidebarContainer) {
      console.error('❌ sidebar-content-container not found for restore');
      return;
    }

    // 1. Remove ALL dynamic content that shouldn't be there
    this.clearAllDynamicContent(sidebarContainer);

    // 2. Ensure the sidebar-content-container itself is visible
    sidebarContainer.style.display = 'block';
    sidebarContainer.style.visibility = 'visible';
    //sidebarContainer.style.opacity = '1';
    sidebarContainer.classList.remove('hidden');
    console.log('✅ Restored sidebar-content-container visibility');

    // 3. Show the saved-locations-panel if it exists
    const savedLocationsPanel = document.getElementById('saved-locations-panel');
    if (savedLocationsPanel) {
      savedLocationsPanel.style.display = 'block';
      savedLocationsPanel.style.visibility = 'visible';
      //savedLocationsPanel.style.opacity = '1';
      savedLocationsPanel.classList.add('active');
      savedLocationsPanel.classList.remove('hidden');
      console.log('✅ Restored saved-locations-panel visibility');

      // Also ensure the saved locations list inside is visible
      const savedLocationsList = document.getElementById('savedLocationsList');
      if (savedLocationsList) {
        savedLocationsList.style.display = 'block';
        savedLocationsList.style.visibility = 'visible';
       // savedLocationsList.style.opacity = '1';
        savedLocationsList.classList.remove('hidden');
        console.log('✅ Restored savedLocationsList visibility');
      }
    } else {
      console.warn('⚠️ saved-locations-panel not found in DOM');
    }

    // 4. Hide profile panel
    const profilePanel = document.getElementById('profile-panel');
    if (profilePanel) {
      profilePanel.style.display = 'none';
      profilePanel.classList.remove('active');
      console.log('✅ Hidden profile-panel');
    }

    // 5. Update sidebar title
    const sidebarTitle = document.getElementById('sidebar-title');
    if (sidebarTitle) {
      sidebarTitle.textContent = '📍 Saved Locations';
      console.log('✅ Restored sidebar title');
    }

    // 6. Debug: Check final state
    console.log('🔍 Final visibility check:', {
      containerVisible: sidebarContainer?.style.display !== 'none',
      panelExists: !!savedLocationsPanel,
      panelVisible: savedLocationsPanel?.style.display !== 'none',
      listExists: !!document.getElementById('savedLocationsList'),
      listVisible: document.getElementById('savedLocationsList')?.style.display !== 'none'
    });

    // 7. Refresh the saved locations list to ensure content is loaded
    if (window.Locations?.refreshLocationsList instanceof Function) {
      // Use requestAnimationFrame for better timing after DOM updates
      requestAnimationFrame(() => {
      window.Locations.refreshLocationsList()
        .then(() => console.log('✅ Saved locations list refreshed after admin panel close'))
        .catch(error => console.error('❌ Error refreshing locations list after admin close:', error));
      });
    } else {
      console.warn('⚠️ window.Locations.refreshLocationsList not available');
      }

    console.log('✅ Hidden panels restored successfully');
  }

  /**
   * Clear all dynamic content that shouldn't persist
   * @param {HTMLElement} container - The sidebar container
   */
  static clearAllDynamicContent(container) {
    console.log('🧹 Clearing all dynamic content from sidebar');

    // Remove admin modals
    const adminModals = container.querySelectorAll('#adminModal');
    adminModals.forEach(modal => {
      console.log('🧹 Removing admin modal:', modal.id);
      modal.remove();
    });

    // Remove edit profile forms
    const editProfileForms = container.querySelectorAll('#edit-profile, .edit-profile-form, .profile-form-container');
    editProfileForms.forEach(form => {
      console.log('🧹 Removing edit profile form:', form.id || form.className);
      form.remove();
    });

    // Remove any elements with dynamic classes
    const dynamicElements = container.querySelectorAll('.dynamic-content, .admin-panel, .profile-form, .modal-content');
    dynamicElements.forEach(element => {
      // Don't remove if it's a default panel
      if (element.id !== 'saved-locations-panel' && element.id !== 'profile-panel') {
        console.log('🧹 Removing dynamic element:', element.id || element.className);
        element.remove();
      }
    });

    // Remove any forms or divs that were injected by profile edit
    const injectedContent = container.querySelectorAll('form, .sidebar-modal-content, .auth-modal-content');
    injectedContent.forEach(content => {
      // Only remove if it's not part of the default structure
      if (!content.closest('#saved-locations-panel') && !content.closest('#profile-panel')) {
        console.log('🧹 Removing injected content:', content.tagName, content.id || content.className);
        content.remove();
      }
    });

    console.log('✅ Dynamic content clearing complete');
  }

    /**
   * Create error admin panel for sidebar
   * @param {Error} error - Error object to display
   */
  static createErrorModal(error) {
    this.removeExistingModal();

    const sidebarContainer = document.getElementById('sidebar-content-container');
    if (!sidebarContainer) {
      console.error('❌ sidebar-content-container not found');
      return null;
    }

    // Hide existing content in sidebar instead of destroying it
    const existingPanels = sidebarContainer.querySelectorAll('.sidebar-panel');
    existingPanels.forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
      console.log('🔧 Hiding existing panel for error modal:', panel.id || panel.className);
    });

    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminModal';
    adminPanel.className = 'sidebar-panel admin-panel active';

    adminPanel.innerHTML = `
      <div class="admin-panel-header">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Panel - Error</h2>
      </div>
      <div class="admin-error">
          <p>Failed to load admin panel. Please try again.</p>
          <button class="admin-action-btn" data-action="retryAdminPanel">
              Retry
          </button>
      </div>
    `;

    sidebarContainer.appendChild(adminPanel);
    
    // Show the sidebar panel
    adminPanel.style.display = 'block';
    adminPanel.classList.add('show');
    
    console.log('✅ Admin error panel display set in sidebar');
    
    this.setupModalEvents(adminPanel);
    AuthNotificationService.showError('Failed to load admin panel');
    return adminPanel;
  }

   /**
   * Create loading admin modal for sidebar
   */
  static createLoadingModal() {
    this.removeExistingModal();
    
   // const sidebarContainer = document.getElementById('sidebar-content-container');
   const sidebarContainer = document.getElementById('profile-panel');
   
    if (!sidebarContainer) {
      console.error('❌ sidebar-content-container not found');
      return null;
    }

    // Hide existing content in sidebar instead of destroying it
    const existingPanels = sidebarContainer.querySelectorAll('.sidebar-panel');
    existingPanels.forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
      console.log('🔧 Hiding existing panel for loading:', panel.id || panel.className);
    });

    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminModal';
    adminPanel.className = 'sidebar-panel admin-panel active';

    adminPanel.innerHTML = `
      <div class="admin-panel-header">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Loading Panel</h2>
      </div>
      <div class="admin-loading">
        <div class="loading-spinner"></div>
        <p>Loading admin data...</p>
      </div>
    `;

    sidebarContainer.appendChild(adminPanel);
    
    // Show the sidebar panel
    adminPanel.style.display = 'block';
    adminPanel.classList.add('show');
    
    console.log('✅ Admin loading panel created in sidebar');

    this.setupModalEvents(adminPanel);
    return adminPanel;
  }


}
