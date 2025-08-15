/**
 * Admin Actions Handler
 * Handles admin panel actions like user management and system operations
 */

import { AdminDataService } from './AdminDataService.js';
import { AuthNotificationService } from './AuthNotificationService.js';

/**
 * Admin Actions Handler Class
 * Manages admin actions and operations
 */
export class AdminActionsHandler {

  /**
   * Handle user role change
   * @param {number} userId - User ID
   * @param {string} action - Action to perform ('makeAdmin' or 'removeAdmin')
   */
  static async handleUserRoleChange(userId, action) {
    try {
      await AdminDataService.updateUserRole(userId, action);
      AuthNotificationService.showSuccess(`User role updated successfully`);
      
      // Dispatch event to refresh admin panel
      this.dispatchRefreshEvent();
    } catch (error) {
      console.error('Error updating user role:', error);
      AuthNotificationService.showError(error.message || 'An error occurred while updating user role');
    }
  }

  /**
   * Handle user status change
   * @param {number} userId - User ID
   * @param {string} action - Action to perform ('activate' or 'deactivate')
   */
  static async handleUserStatusChange(userId, action) {
    try {
      await AdminDataService.updateUserStatus(userId, action);
      AuthNotificationService.showSuccess(`User ${action}d successfully`);
      
      // Dispatch event to refresh admin panel
      this.dispatchRefreshEvent();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      AuthNotificationService.showError(error.message || `An error occurred while ${action}ing user`);
    }
  }

  /**
   * Handle location action
   * @param {string} locationId - Location ID
   * @param {string} action - Action to perform
   */
  static async handleLocationAction(locationId, action) {
    if (action === 'view') {
      AuthNotificationService.showInfo(`Viewing location ${locationId}`);
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this location?')) {
        try {
          await AdminDataService.deleteLocation(locationId);
          AuthNotificationService.showSuccess('Location deleted successfully');
          
          // Dispatch event to refresh admin panel
          this.dispatchRefreshEvent();
        } catch (error) {
          console.error('Error deleting location:', error);
          AuthNotificationService.showError(error.message || 'An error occurred while deleting location');
        }
      }
    }
  }

  /**
   * Refresh system data
   */
  static async refreshSystemData() {
    console.log('Refreshing system data...');
    try {
      // Dispatch event to refresh admin panel
      this.dispatchRefreshEvent();
      AuthNotificationService.showSuccess('System data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing system data:', error);
      AuthNotificationService.showError('Failed to refresh system data');
    }
  }

  /**
   * Generate system report
   */
  static generateSystemReport() {
    console.log('Generating system report...');
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        totalUsers: document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-number')?.textContent || '0',
        adminUsers: document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-number')?.textContent || '0',
        totalLocations: document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-number')?.textContent || '0',
        activeSessions: document.querySelector('.stats-grid .stat-card:nth-child(4) .stat-number')?.textContent || '0',
        serverUptime: document.querySelector('.stats-grid .stat-card:nth-child(5) .stat-number')?.textContent || 'N/A',
        databaseSize: document.querySelector('.stats-grid .stat-card:nth-child(6) .stat-number')?.textContent || 'N/A'
      };
      
      // Create downloadable report
      const reportContent = `System Report - ${new Date().toLocaleDateString()}\n\n` +
        `Generated: ${reportData.timestamp}\n` +
        `Total Users: ${reportData.totalUsers}\n` +
        `Admin Users: ${reportData.adminUsers}\n` +
        `Total Locations: ${reportData.totalLocations}\n` +
        `Active Sessions: ${reportData.activeSessions}\n` +
        `Server Uptime: ${reportData.serverUptime}\n` +
        `Database Size: ${reportData.databaseSize}\n`;
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      AuthNotificationService.showSuccess('System report generated and downloaded');
    } catch (error) {
      console.error('Error generating system report:', error);
      AuthNotificationService.showError('Failed to generate system report');
    }
  }

  /**
   * Clear system cache
   */
  static clearSystemCache() {
    console.log('Clearing system cache...');
    try {
      // Clear localStorage related to the app
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('auth') || key.startsWith('app') || key.startsWith('admin')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      AuthNotificationService.showSuccess('System cache cleared successfully');
    } catch (error) {
      console.error('Error clearing system cache:', error);
      AuthNotificationService.showError('Failed to clear system cache');
    }
  }

  /**
   * Check system health
   */
  static async checkSystemHealth() {
    console.log('Checking system health...');
    try {
      const healthData = await AdminDataService.checkSystemHealth();
      AuthNotificationService.showSuccess('System health check completed successfully');
      console.log('System health data:', healthData);
    } catch (error) {
      console.error('Error checking system health:', error);
      AuthNotificationService.showError('System health check failed');
    }
  }

  /**
   * Dispatch refresh event for admin panel
   */
  static dispatchRefreshEvent() {
    const event = new CustomEvent('adminPanelRefresh');
    document.dispatchEvent(event);
  }
}
