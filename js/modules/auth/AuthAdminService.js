/**
 * Authentication Admin Service
 * Main coordinator for admin panel functionality
 * Delegates to specialized modules following COPILOT_RULES compliance
 */

import { AdminModalManager } from './AdminModalManager.js';
import { AdminDataService } from './AdminDataService.js';
import { AdminTabContentManager } from './AdminTabContentManager.js';
import { AdminActionsHandler } from './AdminActionsHandler.js';
import { AdminFilterManager } from './AdminFilterManager.js';

/**
 * Authentication Admin Service Class
 * Main entry point for admin functionality - delegates to specialized modules
 */
export class AuthAdminService {

  /**
   * Show admin panel
   */
  static async showAdminPanel() {
    console.log('🔧 Loading Admin Panel...');
    
    // Show loading modal first
    const loadingModal = AdminModalManager.createLoadingModal();
    this.setupEventDelegation(loadingModal);
    
    try {
      // Fetch admin data from server
      const adminData = await AdminDataService.fetchAdminData();
      const mainModal = AdminModalManager.createMainModal(adminData);
      this.setupEventDelegation(mainModal);
      this.setupTabContentLoader(adminData);
    } catch (error) {
      console.error('❌ Failed to load admin data:', error);
      AdminModalManager.createErrorModal(error);
    }
  }

  /**
   * Setup event delegation for admin panel
   * @param {HTMLElement} modal - Admin modal element
   */
  static setupEventDelegation(modal) {
    modal.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      // Handle retry action for error modal
      if (action === 'retryAdminPanel') {
        this.showAdminPanel();
        return;
      }

      // Handle user role changes
      if (action === 'userRoleChange') {
        const userId = e.target.dataset.userId;
        const roleAction = e.target.dataset.roleAction;
        AdminActionsHandler.handleUserRoleChange(userId, roleAction);
        return;
      }

      // Handle user status changes
      if (action === 'userStatusChange') {
        const userId = e.target.dataset.userId;
        const statusAction = e.target.dataset.statusAction;
        AdminActionsHandler.handleUserStatusChange(userId, statusAction);
        return;
      }

      // Handle location actions
      if (action === 'locationAction') {
        const locationId = e.target.dataset.locationId;
        const locationAction = e.target.dataset.locationAction;
        AdminActionsHandler.handleLocationAction(locationId, locationAction);
        return;
      }

      // Handle system actions
      switch (action) {
        case 'refreshSystemData':
          AdminActionsHandler.refreshSystemData();
          break;
        case 'generateSystemReport':
          AdminActionsHandler.generateSystemReport();
          break;
        case 'clearSystemCache':
          AdminActionsHandler.clearSystemCache();
          break;
        case 'checkSystemHealth':
          AdminActionsHandler.checkSystemHealth();
          break;
      }
    });
  }

  /**
   * Setup tab content loading system
   * @param {Object} adminData - Admin data for tab content
   */
  static setupTabContentLoader(adminData) {
    document.addEventListener('adminTabSwitch', (e) => {
      const { tabName, contentContainer } = e.detail;
      this.loadTabContent(tabName, adminData, contentContainer);
    });

    document.addEventListener('adminPanelRefresh', () => {
      this.showAdminPanel();
    });
    
    // Load initial tab content (users by default)
    setTimeout(() => {
      const contentContainer = document.querySelector('#adminTabContent');
      if (contentContainer) {
        this.loadTabContent('users', adminData, contentContainer);
        this.setupFilterListeners();
      }
    }, 100);
  }

  /**
   * Load content for specific tab
   * @param {string} tabName - Tab name
   * @param {Object} adminData - Admin data
   * @param {HTMLElement} contentContainer - Content container element
   */
  static loadTabContent(tabName, adminData, contentContainer) {
    const { users, stats, locations } = adminData;
    let content = '';

    switch (tabName) {
      case 'users':
        content = AdminTabContentManager.generateUsersTabContent(users);
        break;
      case 'locations':
        content = AdminTabContentManager.generateLocationsTabContent(locations);
        break;
      case 'system':
        content = AdminTabContentManager.generateSystemTabContent(stats, users, locations);
        break;
      default:
        content = '<div class="tab-error">Unknown tab</div>';
    }

    contentContainer.innerHTML = content;
    
    // Setup filters for users tab
    if (tabName === 'users') {
      setTimeout(() => this.setupFilterListeners(), 50);
    }
  }

  /**
   * Setup filter listeners for current modal
   */
  static setupFilterListeners() {
    const modal = document.getElementById('adminModal');
    if (modal) {
      AdminFilterManager.setupFilterListeners(modal);
    }
  }
}
