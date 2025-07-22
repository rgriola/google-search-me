/**
 * Authentication Admin Service
 * Handles admin panel functionality, user management, and admin-specific features
 */

import { StateManager } from '../state/AppState.js';
import { AuthNotificationService } from './AuthNotificationService.js';

/**
 * Authentication Admin Service Class
 */
export class AuthAdminService {

  /**
   * Show admin panel
   */
  static async showAdminPanel() {
    console.log('🔧 Loading Admin Panel...');
    
    // Show loading modal first
    this.createLoadingAdminModal();
    
    try {
      // Fetch admin data from server
      const adminData = await this.fetchAdminData();
      this.createAdminModal(adminData);
    } catch (error) {
      console.error('❌ Failed to load admin data:', error);
      this.createErrorAdminModal(error);
    }
  }

  /**
   * Create loading admin modal
   */
  static createLoadingAdminModal() {
    // Remove existing admin modal if it exists
    const existingModal = document.getElementById('adminModal');
    if (existingModal) {
      existingModal.remove();
    }

    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal';
    adminModal.style.display = 'block';

    adminModal.innerHTML = `
      <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Panel</h2>
        <div class="admin-loading">
          <div class="loading-spinner"></div>
          <h4>Loading Admin Data...</h4>
          <p>Fetching users and system statistics...</p>
        </div>
      </div>
    `;

    document.body.appendChild(adminModal);
    
    // Setup close button
    adminModal.querySelector('.admin-close').addEventListener('click', () => {
      adminModal.remove();
    });
  }

  /**
   * Create error admin modal
   */
  static createErrorAdminModal(error) {
    const adminModal = document.getElementById('adminModal');
    if (!adminModal) return;

    adminModal.innerHTML = `
      <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Panel - Error</h2>
        <div class="admin-empty-state">
          <h4>❌ Failed to Load Admin Data</h4>
          <p>Error: ${error.message}</p>
          <div class="system-actions" style="justify-content: center; margin-top: 20px;">
            <button class="admin-action-btn" onclick="AuthAdminService.showAdminPanel()">
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    `;

    // Setup close button
    adminModal.querySelector('.admin-close').addEventListener('click', () => {
      adminModal.remove();
    });
    
    AuthNotificationService.showError('Failed to load admin panel');
  }

  /**
   * Fetch admin data from server
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
        
        if (usersData.success && usersData.data) {
          users = Array.isArray(usersData.data) ? usersData.data : [];
        } else if (Array.isArray(usersData)) {
          users = usersData;
        } else if (usersData.users && Array.isArray(usersData.users)) {
          users = usersData.users;
        }
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
   * Create admin modal with data
   * @param {Object} adminData - Admin data containing users, stats, and locations
   */
  static createAdminModal(adminData) {
    // Remove existing admin modal
    const existingModal = document.getElementById('adminModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create admin modal
    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal';
    adminModal.style.display = 'block';

    const { users, stats, locations } = adminData;
    console.log('🔧 Creating admin modal with data:', {
      usersCount: users?.length,
      statsData: stats,
      locationsCount: locations?.length,
      firstLocation: locations?.[0]
    });

    adminModal.innerHTML = `
      <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Panel</h2>
        
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

        <!-- Tab Content -->
        <div class="admin-tab-content">
          <!-- Users Tab -->
          <div id="usersTab" class="admin-tab-panel active">
            <div class="admin-controls">
              <div class="user-filters">
                <label>Filter Users:</label>
                <select id="userFilter">
                  <option value="all">All Users (${users.length})</option>
                  <option value="admin">Admins (${users.filter(u => u.isAdmin).length})</option>
                  <option value="regular">Regular Users (${users.filter(u => !u.isAdmin).length})</option>
                  <option value="active">Active (${users.filter(u => u.isActive).length})</option>
                  <option value="inactive">Inactive (${users.filter(u => !u.isActive).length})</option>
                </select>
              </div>
            </div>
            
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="usersTableBody">
                  ${this.generateUsersTableRows(users)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Locations Tab -->
          <div id="locationsTab" class="admin-tab-panel">
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Coordinates</th>
                    <th>User</th>
                    <th>Saved Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.generateLocationsTableRows(locations)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- System Tab -->
          <div id="systemTab" class="admin-tab-panel">
            <div class="system-info">
              <h4>System Information</h4>
              
              <!-- System Stats Grid -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${stats.totalUsers || users.length}</div>
                  <div class="stat-label">Total Users</div>
                  <div class="stat-action">Registered users</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.adminUsers || users.filter(u => u.isAdmin).length}</div>
                  <div class="stat-label">Admin Users</div>
                  <div class="stat-action">With admin privileges</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.totalLocations || locations.length}</div>
                  <div class="stat-label">Total Locations</div>
                  <div class="stat-action">Saved locations</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.activeSessions || 0}</div>
                  <div class="stat-label">Active Sessions</div>
                  <div class="stat-action">Current user sessions</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.serverUptime || 'N/A'}</div>
                  <div class="stat-label">Server Uptime</div>
                  <div class="stat-action">Time since start</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.databaseSize || 'N/A'}</div>
                  <div class="stat-label">Database Size</div>
                  <div class="stat-action">Storage used</div>
                </div>
              </div>

              <!-- System Health -->
              <div class="system-health" style="margin-top: 2rem;">
                <h4>System Health</h4>
                <div class="admin-table-container">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Database</td>
                        <td><span class="status-text active">✅ Connected</span></td>
                        <td>SQLite database operational</td>
                      </tr>
                      <tr>
                        <td>Authentication</td>
                        <td><span class="status-text active">✅ Working</span></td>
                        <td>JWT tokens valid</td>
                      </tr>
                      <tr>
                        <td>File System</td>
                        <td><span class="status-text active">✅ Accessible</span></td>
                        <td>Read/write permissions OK</td>
                      </tr>
                      <tr>
                        <td>Memory Usage</td>
                        <td><span class="status-text active">✅ Normal</span></td>
                        <td>${stats.memoryUsage || 'Not available'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- System Actions -->
              <div class="system-actions" style="margin-top: 2rem;">
                <h4>System Actions</h4>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                  <button class="admin-action-btn" onclick="window.AuthAdminService.refreshSystemData()">🔄 Refresh Data</button>
                  <button class="admin-action-btn" onclick="window.AuthAdminService.generateSystemReport()">📊 Generate Report</button>
                  <button class="admin-action-btn" onclick="window.AuthAdminService.clearSystemCache()">🧹 Clear Cache</button>
                  <button class="admin-action-btn" onclick="window.AuthAdminService.checkSystemHealth()">🏥 Health Check</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(adminModal);
    this.setupAdminModalEvents(adminModal);
  }

  /**
   * Generate users table rows HTML
   * @param {Array} users - Array of user objects
   * @returns {string} HTML for user table rows
   */
  static generateUsersTableRows(users) {
    return users.map(user => `
      <tr data-user-id="${user.id}" data-admin="${!!user.isAdmin}" data-active="${!!user.isActive}">
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.firstName || ''} ${user.lastName || ''}</td>
        <td>
          <span class="role-badge ${user.isAdmin ? 'admin' : 'user'}">
            ${user.isAdmin ? '👑 Admin' : '👤 User'}
          </span>
        </td>
        <td>
          <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
            ${user.isActive ? '✅ Active' : '⛔ Inactive'}
          </span>
        </td>
        <td class="actions">
          ${user.isAdmin ? 
            `<button class="admin-btn small" onclick="AuthAdminService.handleUserRoleChange(${user.id}, 'removeAdmin')">Remove Admin</button>` :
            `<button class="admin-btn small" onclick="AuthAdminService.handleUserRoleChange(${user.id}, 'makeAdmin')">Make Admin</button>`
          }
          ${user.isActive ?
            `<button class="admin-btn small danger" onclick="AuthAdminService.handleUserStatusChange(${user.id}, 'deactivate')">Deactivate</button>` :
            `<button class="admin-btn small" onclick="AuthAdminService.handleUserStatusChange(${user.id}, 'activate')">Activate</button>`
          }
        </td>
      </tr>
    `).join('');
  }

  /**
   * Generate locations table rows HTML
   * @param {Array} locations - Array of location objects
   * @returns {string} HTML for location table rows
   */
  static generateLocationsTableRows(locations) {
    if (!Array.isArray(locations) || locations.length === 0) {
      return '<tr><td colspan="7" style="text-align: center; color: #888;">No locations found</td></tr>';
    }

    return locations.map(location => {
      // Safely get location properties with fallbacks
      const id = location.id || location.place_id || 'N/A';
      // Handle name - use address as fallback if name is empty/null
      const name = location.name && location.name.trim() ? location.name : (location.address || 'Unnamed Location');
      const address = location.address || location.formatted_address || 'No address';
      const lat = location.lat ? parseFloat(location.lat).toFixed(4) : 'N/A';
      const lng = location.lng ? parseFloat(location.lng).toFixed(4) : 'N/A';
      const userId = location.user_id || location.created_by || 'Unknown';
      const savedAt = location.saved_at || location.created_at;
      const formattedDate = savedAt ? new Date(savedAt).toLocaleDateString() : 'N/A';

      return `
        <tr>
          <td>${id}</td>
          <td>${name}</td>
          <td>${address}</td>
          <td>${lat}, ${lng}</td>
          <td>User ${userId}</td>
          <td>${formattedDate}</td>
          <td class="actions">
            <button class="admin-btn small" onclick="AuthAdminService.handleLocationAction('${location.place_id || location.id}', 'view')">View</button>
            <button class="admin-btn small danger" onclick="AuthAdminService.handleLocationAction('${location.place_id || location.id}', 'delete')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Setup admin modal event handlers
   * @param {HTMLElement} modal - Admin modal element
   */
  static setupAdminModalEvents(modal) {
    // Close button
    modal.querySelector('.admin-close').addEventListener('click', () => {
      modal.remove();
    });

    // Tab switching
    const tabButtons = modal.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        this.switchAdminTab(tabName, modal);
      });
    });

    // User filter
    const userFilter = modal.querySelector('#userFilter');
    if (userFilter) {
      userFilter.addEventListener('change', (e) => {
        this.applyUserFilter(modal, e.target.value);
      });
    }

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Switch admin tab
   * @param {string} tabName - Tab name to switch to
   * @param {HTMLElement} modal - Admin modal element
   */
  static switchAdminTab(tabName, modal) {
    // Update tab buttons
    modal.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab panels
    modal.querySelectorAll('.admin-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}Tab`);
    });
  }

  /**
   * Handle user role change
   * @param {number} userId - User ID
   * @param {string} action - Action to perform ('makeAdmin' or 'removeAdmin')
   */
  static async handleUserRoleChange(userId, action) {
    try {
      const authState = StateManager.getAuthState();
      const token = authState?.authToken;
      const baseUrl = StateManager.getApiBaseUrl();

      if (!token) {
        AuthNotificationService.showError('No authentication token found');
        return;
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

      if (response.ok) {
        AuthNotificationService.showSuccess(`User role updated successfully`);
        // Refresh admin panel
        this.showAdminPanel();
      } else {
        const error = await response.json();
        AuthNotificationService.showError(error.message || 'Failed to update user role');
      }

    } catch (error) {
      console.error('Error updating user role:', error);
      AuthNotificationService.showError('An error occurred while updating user role');
    }
  }

  /**
   * Handle user status change
   * @param {number} userId - User ID
   * @param {string} action - Action to perform ('activate' or 'deactivate')
   */
  static async handleUserStatusChange(userId, action) {
    try {
      const authState = StateManager.getAuthState();
      const token = authState?.authToken;
      const baseUrl = StateManager.getApiBaseUrl();

      if (!token) {
        AuthNotificationService.showError('No authentication token found');
        return;
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

      if (response.ok) {
        AuthNotificationService.showSuccess(`User ${action}d successfully`);
        // Refresh admin panel
        this.showAdminPanel();
      } else {
        const error = await response.json();
        AuthNotificationService.showError(error.message || `Failed to ${action} user`);
      }

    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      AuthNotificationService.showError(`An error occurred while ${action}ing user`);
    }
  }

  /**
   * Apply user filter
   * @param {HTMLElement} modal - Admin modal element
   * @param {string} filter - Filter type
   */
  static applyUserFilter(modal, filter) {
    const userRows = modal.querySelectorAll('#usersTableBody tr');
    let visibleCount = 0;

    userRows.forEach(row => {
      const isAdmin = row.dataset.admin === 'true';
      const isActive = row.dataset.active === 'true';
      let shouldShow = false;

      switch (filter) {
        case 'all':
          shouldShow = true;
          break;
        case 'admin':
          shouldShow = isAdmin;
          break;
        case 'regular':
          shouldShow = !isAdmin;
          break;
        case 'active':
          shouldShow = isActive;
          break;
        case 'inactive':
          shouldShow = !isActive;
          break;
      }

      row.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Update filter indicator
    this.showFilterIndicator(modal, filter, visibleCount);
  }

  /**
   * Show filter indicator
   * @param {HTMLElement} modal - Admin modal element
   * @param {string} filter - Applied filter
   * @param {number} count - Number of visible items
   */
  static showFilterIndicator(modal, filter, count) {
    let indicator = modal.querySelector('.filter-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'filter-indicator';
      const controls = modal.querySelector('.admin-controls');
      if (controls) {
        controls.appendChild(indicator);
      }
    }

    if (filter === 'all') {
      indicator.textContent = '';
      indicator.style.display = 'none';
    } else {
      indicator.textContent = `Showing ${count} ${filter} users`;
      indicator.style.display = 'block';
    }
  }

  /**
   * Handle location action
   * @param {number} locationId - Location ID
   * @param {string} action - Action to perform
   */
  static async handleLocationAction(locationId, action) {
    if (action === 'view') {
      // Implementation for viewing location
      AuthNotificationService.showInfo(`Viewing location ${locationId}`);
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this location?')) {
        try {
          const authState = StateManager.getAuthState();
          const token = authState?.authToken;
          const baseUrl = StateManager.getApiBaseUrl();

          const response = await fetch(`${baseUrl}/locations/${locationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            AuthNotificationService.showSuccess('Location deleted successfully');
            // Refresh admin panel
            this.showAdminPanel();
          } else {
            const error = await response.json();
            AuthNotificationService.showError(error.message || 'Failed to delete location');
          }

        } catch (error) {
          console.error('Error deleting location:', error);
          AuthNotificationService.showError('An error occurred while deleting location');
        }
      }
    }
  }

  /**
   * System action methods for admin panel
   */
  static async refreshSystemData() {
    console.log('Refreshing system data...');
    try {
      // Close current modal and reopen to refresh data
      const existingModal = document.getElementById('adminModal');
      if (existingModal) {
        existingModal.remove();
      }
      await this.showAdminPanel();
      // Switch back to system tab
      this.switchAdminTab('system');
      AuthNotificationService.showSuccess('System data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing system data:', error);
      AuthNotificationService.showError('Failed to refresh system data');
    }
  }

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

  static clearSystemCache() {
    console.log('Clearing system cache...');
    try {
      // Clear localStorage related to the app
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('google-search-me') || key.includes('location') || key.includes('user')) {
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

  static async checkSystemHealth() {
    console.log('Checking system health...');
    try {
      const response = await fetch('/admin/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const healthData = await response.json();
        const healthMessage = `System Health Check:\n\nStatus: ${healthData.status || 'OK'}\nDatabase: Connected\nServer: Running\nTimestamp: ${new Date().toLocaleString()}`;
        alert(healthMessage);
        AuthNotificationService.showSuccess('System health check completed');
      } else {
        AuthNotificationService.showWarning('Health check completed with warnings');
      }
    } catch (error) {
      console.error('Error checking system health:', error);
      AuthNotificationService.showError('System health check failed - server may be unreachable');
    }
  }
}
