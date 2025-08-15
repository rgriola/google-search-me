/**
 * Admin Data Service
 * Handles fetching and processing admin data from server
 */

import { StateManager } from '../state/AppState.js';

/**
 * Admin Data Service Class
 * Manages admin data fetching and processing
 */
export class AdminDataService {

  /**
   * Fetch admin data from server
   * @returns {Promise<Object>} Admin data containing users, stats, and locations
   */
  static async fetchAdminData() {
    const authState = StateManager.getAuthState();
    const token = authState?.authToken;
    const baseUrl = StateManager.getApiBaseUrl();
    
    console.log('🔍 Fetching admin data...');
    console.log('🔍 Base URL:', baseUrl);
    console.log('🔍 Token exists:', !!token);
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      // Add timestamp and cache-busting headers to ensure fresh data
      const timestamp = Date.now();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      // Only fetch users and stats from server - locations are already available in StateManager
      const [usersResponse, statsResponse] = await Promise.all([
        fetch(`${baseUrl}/admin/users?t=${timestamp}`, { method: 'GET', headers }),
        fetch(`${baseUrl}/admin/stats?t=${timestamp}`, { method: 'GET', headers })
      ]);

      console.log('🔍 API Responses:', {
        users: usersResponse.status,
        stats: statsResponse.status
      });

      let users = [];
      let stats = { totalUsers: 0, adminUsers: 0, totalLocations: 0, activeSessions: 0 };
      
      // Get locations from StateManager instead of server (more efficient)
      let locations = StateManager.getSavedLocations() || [];
      console.log('📍 Using existing saved locations from StateManager:', locations.length, 'locations');
      console.log('📍 First location sample:', locations[0]);

      // Handle users response
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('📋 Users data:', usersData);
        
        users = this.processUsersData(usersData);
      }

      // Handle stats response
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Stats data:', statsData);
        stats = statsData || stats;
      }

      console.log('✅ Admin data loaded:', { 
        usersCount: users.length, 
        locationsCount: locations.length,
        stats 
      });
      
      return { users, stats, locations };
      
    } catch (error) {
      console.error('❌ Fetch admin data error:', error);
      throw error;
    }
  }

  /**
   * Process users data from different response formats
   * @param {Object} usersData - Raw users data from server
   * @returns {Array} Processed users array
   */
  static processUsersData(usersData) {
    if (usersData.success && usersData.data) {
      return Array.isArray(usersData.data) ? usersData.data : [];
    } else if (Array.isArray(usersData)) {
      return usersData;
    } else if (usersData.users && Array.isArray(usersData.users)) {
      return usersData.users;
    }
    return [];
  }

  /**
   * Update user role on server
   * @param {number} userId - User ID
   * @param {string} action - Action to perform ('makeAdmin' or 'removeAdmin')
   * @returns {Promise<boolean>} Success status
   */
  static async updateUserRole(userId, action) {
    const authState = StateManager.getAuthState();
    const token = authState?.authToken;
    const baseUrl = StateManager.getApiBaseUrl();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action === 'makeAdmin' ? 'promote' : 'demote'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update user role');
    }

    return true;
  }

  /**
   * Update user status on server
   * @param {number} userId - User ID
   * @param {string} action - Action to perform ('activate' or 'deactivate')
   * @returns {Promise<boolean>} Success status
   */
  static async updateUserStatus(userId, action) {
    const authState = StateManager.getAuthState();
    const token = authState?.authToken;
    const baseUrl = StateManager.getApiBaseUrl();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: action
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to ${action} user`);
    }

    return true;
  }

  /**
   * Delete location from server
   * @param {string} locationId - Location ID to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteLocation(locationId) {
    const authState = StateManager.getAuthState();
    const token = authState?.authToken;
    const baseUrl = StateManager.getApiBaseUrl();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete location');
    }

    return true;
  }

  /**
   * Check system health
   * @returns {Promise<Object>} System health data
   */
  static async checkSystemHealth() {
    const authState = StateManager.getAuthState();
    const token = authState?.authToken;
    const baseUrl = StateManager.getApiBaseUrl();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/admin/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('System health check failed');
    }

    return await response.json();
  }
}
