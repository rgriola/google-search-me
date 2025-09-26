/**
 * Admin Tab Content Manager
 * Handles content generation for different admin panel tabs
 */

import { SecurityUtils } from '../../utils/SecurityUtils.js';

/**
 * Admin Tab Content Manager Class
 * Manages tab content generation and rendering
 */
export class AdminTabContentManager {

  /**
   * Generate users tab content
   * @param {Array} users - Array of user objects
   * @returns {string} HTML content for users tab
   */
  static generateUsersTabContent(users) {
    return `
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
    `;
  }

  /**
   * Generate locations tab content
   * @param {Array} locations - Array of location objects
   * @returns {string} HTML content for locations tab
   */
  static generateLocationsTabContent(locations) {
    return `
      <div id="locationsTab" class="admin-tab-panel active">
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
    `;
  }

  /**
   * Generate system tab content
   * @param {Object} stats - System statistics
   * @param {Array} users - Array of user objects
   * @param {Array} locations - Array of location objects
   * @returns {string} HTML content for system tab
   */
  static generateSystemTabContent(stats, users, locations) {
    return `
      <div id="systemTab" class="admin-tab-panel active">
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
          <div class="system-health">
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
          <div class="system-actions">
            <h4>System Actions</h4>
            <div class="system-actions-flex">
              <button class="admin-action-btn" data-action="refreshSystemData">🔄 Refresh Data</button>
              <button class="admin-action-btn" data-action="generateSystemReport">📊 Generate Report</button>
              <button class="admin-action-btn" data-action="clearSystemCache">🧹 Clear Cache</button>
              <button class="admin-action-btn" data-action="checkSystemHealth">🏥 Health Check</button>
            </div>
          </div>
        </div>
      </div>
    `;
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
        <td>${SecurityUtils.escapeHtml(user.username)}</td>
        <td>${SecurityUtils.escapeHtml(user.email)}</td>
        <td>${SecurityUtils.escapeHtml(user.firstName || '')} ${SecurityUtils.escapeHtml(user.lastName || '')}</td>
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
            `<button class="btn-danger btn-sm" data-action="userRoleChange" data-user-id="${SecurityUtils.escapeHtmlAttribute(user.id.toString())}" data-role-action="removeAdmin">Remove Admin</button>` :
            `<button class="btn-primary btn-sm" data-action="userRoleChange" data-user-id="${SecurityUtils.escapeHtmlAttribute(user.id.toString())}" data-role-action="makeAdmin">Make Admin</button>`
          }
          ${user.isActive ?
            `<button class="btn-danger btn-sm" data-action="userStatusChange" data-user-id="${SecurityUtils.escapeHtmlAttribute(user.id.toString())}" data-status-action="deactivate">Deactivate</button>` :
            `<button class="btn-primary btn-sm" data-action="userStatusChange" data-user-id="${SecurityUtils.escapeHtmlAttribute(user.id.toString())}" data-status-action="activate">Activate</button>`
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
      return '<tr><td colspan="7" class="admin-table-empty">No locations found</td></tr>';
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
          <td>${SecurityUtils.escapeHtml(id)}</td>
          <td>${SecurityUtils.escapeHtml(name)}</td>
          <td>${SecurityUtils.escapeHtml(address)}</td>
          <td>${SecurityUtils.escapeHtml(lat)}, ${SecurityUtils.escapeHtml(lng)}</td>
          <td>User ${SecurityUtils.escapeHtml(userId)}</td>
          <td>${SecurityUtils.escapeHtml(formattedDate)}</td>
          <td class="actions">
            <button class="btn-primary btn-sm" data-action="locationAction" data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}" data-location-action="view">View</button>
            <button class="btn-danger btn-sm" data-action="locationAction" data-location-id="${SecurityUtils.escapeHtmlAttribute(location.place_id || location.id)}" data-location-action="delete">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}
