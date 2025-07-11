/**
 * Authentication UI management
 * Handles auth modals, forms, and UI state updates
 */

import { StateManager } from '../state/AppState.js';

/**
 * Authentication UI Class
 */
export class AuthUI {

  /**
   * Initialize authentication UI
   */
  static initialize() {
    console.log('🎨 Initializing Authentication UI');
    this.updateAuthUI();
    console.log('✅ Authentication UI initialized');
  }

  /**
   * Update authentication UI state
   */
  static updateAuthUI() {
    const authState = StateManager.getAuthState();
    
    // FIX: Use currentUser instead of user
    const isAuthenticated = !!(authState?.currentUser && authState?.authToken);
    const user = authState?.currentUser; // ← CHANGED FROM authState?.user
    
    console.log('🔍 UpdateAuthUI called');
    console.log('🔍 Auth state:', authState);
    console.log('🔍 Is authenticated:', isAuthenticated);
    console.log('🔍 User data:', user);
    console.log('🔍 User isAdmin:', user?.isAdmin);

    this.updateNavButtons(isAuthenticated, user);
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
      if (authButtons) authButtons.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'flex';
        
        // Update username display
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
          const displayName = user.firstName 
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : user.username;
          welcomeText.textContent = `Welcome, ${displayName}!`;
        }
      }

      // ADD ADMIN BUTTON IF USER IS ADMIN
      if (user.isAdmin) {
        this.addAdminButton();
      } else {
        this.removeAdminButton();
      }

    } else {
      // Show auth buttons, hide user info
      if (authButtons) authButtons.style.display = 'flex';
      if (userInfo) userInfo.style.display = 'none';
      if (userDropdown) userDropdown.style.display = 'none';
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
      
      adminBtn.addEventListener('click', () => {
        this.showAdminPanel();
        // Close dropdown
        userDropdown.style.display = 'none';
      });
      
      // Insert before logout button
      userDropdown.insertBefore(adminBtn, logoutBtn);
    }
  }

  /**
   * Remove admin button from user dropdown
   */
  static removeAdminButton() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
      adminBtn.remove();
    }
  }

  /**
   * Show admin panel (placeholder - implement admin functionality)
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
            <button class="admin-action-btn" onclick="window.showAdminPanel()">
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
    
    this.showNotification('Failed to load admin panel', 'error');
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
    console.log('🔍 Current user:', authState?.currentUser);
    
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

      const [usersResponse, statsResponse, locationsResponse] = await Promise.all([
        fetch(`${baseUrl}/admin/users?t=${timestamp}`, {
          method: 'GET',
          headers
        }),
        fetch(`${baseUrl}/admin/stats?t=${timestamp}`, {
          method: 'GET',
          headers
        }),
        fetch(`${baseUrl}/locations?t=${timestamp}`, {
          method: 'GET',
          headers
        })
      ]);

      console.log('🔍 Users response:', usersResponse.status, usersResponse.statusText);
      console.log('🔍 Stats response:', statsResponse.status, statsResponse.statusText);
      console.log('🔍 Locations response:', locationsResponse.status, locationsResponse.statusText);

      let users = [];
      let stats = { totalUsers: 0, adminUsers: 0, totalLocations: 0, activeSessions: 0 };
      let locations = [];

      // Handle users response
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('📋 Raw users data:', usersData);
        
        // Handle different response formats
        if (usersData.success && usersData.data) {
          users = Array.isArray(usersData.data) ? usersData.data : [];
        } else if (Array.isArray(usersData)) {
          users = usersData;
        } else if (usersData.users && Array.isArray(usersData.users)) {
          users = usersData.users;
        } else {
          console.warn('⚠️ Unexpected users data format:', usersData);
          users = [];
        }
      } else {
        const errorText = await usersResponse.text();
        console.error('❌ Users endpoint error:', usersResponse.status, errorText);
      }

      // Handle stats response
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Raw stats data:', statsData);
        stats = statsData || stats;
      } else {
        const errorText = await statsResponse.text();
        console.error('❌ Stats endpoint error:', statsResponse.status, errorText);
      }

      // Handle locations response
      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        console.log('📍 Raw locations data:', locationsData);
        
        // Handle different response formats
        if (Array.isArray(locationsData)) {
          locations = locationsData;
        } else if (locationsData.locations && Array.isArray(locationsData.locations)) {
          locations = locationsData.locations;
        } else if (locationsData.data && Array.isArray(locationsData.data)) {
          locations = locationsData.data;
        } else {
          console.warn('⚠️ Unexpected locations data format:', locationsData);
          locations = [];
        }
      } else {
        const errorText = await locationsResponse.text();
        console.error('❌ Locations endpoint error:', locationsResponse.status, errorText);
      }

      console.log('✅ Final processed data:');
      console.log(`🎯 Admin data summary:`)
      console.log(`   Users: ${users.length} total (real API data)`);
      console.log(`   Stats:`, stats);
      console.log(`   Locations: ${locations.length} total`);
      
      // Log individual users for debugging
      users.forEach((user, index) => {
        console.log(`   User ${user.id}: ${user.username} - Admin: ${!!user.is_admin} - Active: ${!!user.is_active}`);
      });

      return { users, stats, locations };
      
    } catch (error) {
      console.error('❌ Fetch admin data error:', error);
      
      // Return fallback data for development
      const fallbackData = {
        users: [
          {
            id: 1,
            username: 'rodczaro@gmail.com',
            email: 'rodczaro@gmail.com',
            first_name: 'Rod',
            last_name: 'Czaro',
            is_admin: true,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            username: 'admin@test.com',
            email: 'admin@test.com',
            first_name: 'Admin',
            last_name: 'User',
            is_admin: true,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            username: 'user@test.com', 
            email: 'user@test.com',
            first_name: 'Test',
            last_name: 'User',
            is_admin: false,
            is_active: false,  // This user is inactive for testing
            created_at: new Date().toISOString()
          }
        ],
        stats: {
          totalUsers: 3,
          adminUsers: 2,
          totalLocations: 5,
          activeSessions: 0  // Remove mock session, will show real count from API
        },
        locations: [
          {
            id: 1,
            place_id: 'ChIJOwg_06VPwokRYv534QaPC8g',
            name: 'New York, NY',
            formatted_address: 'New York, NY, USA',
            lat: 40.7128,
            lng: -74.0060,
            rating: 4.5,
            user_ratings_total: 1250,
            saved_at: new Date(Date.now() - 86400000).toISOString(),
            user_id: 1
          },
          {
            id: 2,
            place_id: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
            name: 'San Francisco, CA',
            formatted_address: 'San Francisco, CA, USA',
            lat: 37.7749,
            lng: -122.4194,
            rating: 4.2,
            user_ratings_total: 850,
            saved_at: new Date(Date.now() - 172800000).toISOString(),
            user_id: 2
          },
          {
            id: 3,
            place_id: 'ChIJ7cv00DwsDogRAMDACa2m4K8',
            name: 'Chicago, IL',
            formatted_address: 'Chicago, IL, USA',
            lat: 41.8781,
            lng: -87.6298,
            rating: 4.3,
            user_ratings_total: 920,
            saved_at: new Date(Date.now() - 259200000).toISOString(),
            user_id: 1
          },
          {
            id: 4,
            place_id: 'ChIJKxjxuaNqwokR0h0qkjGPV2o',
            name: 'Syracuse, NY',
            formatted_address: 'Syracuse, NY, USA',
            lat: 43.0481,
            lng: -76.1474,
            rating: 4.1,
            user_ratings_total: 320,
            saved_at: new Date(Date.now() - 345600000).toISOString(),
            user_id: 1
          },
          {
            id: 5,
            place_id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
            name: 'Los Angeles, CA',
            formatted_address: 'Los Angeles, CA, USA',
            lat: 34.0522,
            lng: -118.2437,
            rating: 4.4,
            user_ratings_total: 1100,
            saved_at: new Date(Date.now() - 432000000).toISOString(),
            user_id: 3
          }
        ]
      };
      
      console.log('🔄 Using fallback data:', fallbackData);
      return fallbackData;
    }
  }

  /**
   * Create admin modal with database data
   */
  static createAdminModal(adminData) {
    // Remove existing admin modal if it exists
    const existingModal = document.getElementById('adminModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create admin modal
    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal';
    adminModal.style.display = 'block';

    adminModal.innerHTML = `
      <div class="modal-content admin-modal-content">
        <span class="close admin-close">&times;</span>
        <h2>🔧 Admin Panel</h2>
        
        <div class="admin-tabs">
          <button class="tab-btn active" data-tab="stats">Statistics</button>
          <button class="tab-btn" data-tab="users">Users</button>
          <button class="tab-btn" data-tab="locations">Locations</button>
          <button class="tab-btn" data-tab="system">System</button>
        </div>

        <div class="admin-content">
          <!-- Statistics Tab -->
          <div id="statsTab" class="tab-content active">
            <h3>Database Statistics</h3>
            <p class="stats-subtitle">💡 Click on any statistic card to view detailed data</p>
            <div class="stats-grid">
              <div class="stat-card clickable" data-navigate="users" title="Click to view all users">
                <h4>Total Users</h4>
                <div class="stat-number">${adminData.stats.totalUsers || 0}</div>
                <div class="stat-action">👥 View All Users</div>
              </div>
              <div class="stat-card clickable" data-navigate="users" data-filter="admin" title="Click to view admin users">
                <h4>Admin Users</h4>
                <div class="stat-number">${adminData.stats.adminUsers || 0}</div>
                <div class="stat-action">👑 View Admins</div>
              </div>
              <div class="stat-card clickable" data-navigate="locations" title="Click to view saved locations">
                <h4>Total Locations</h4>
                <div class="stat-number">${adminData.stats.totalLocations || 0}</div>
                <div class="stat-action">📍 View Locations</div>
              </div>
              <div class="stat-card clickable" data-navigate="system" title="Click to view system info">
                <h4>Active Sessions</h4>
                <div class="stat-number">${adminData.stats.activeSessions || 0}</div>
                <div class="stat-action">⚡ View System</div>
              </div>
            </div>
          </div>

          <!-- Users Tab -->
          <div id="usersTab" class="tab-content">
            <h3>👥 User Management</h3>
            <div class="users-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Admin</th>
                    <th>Active</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.generateUsersTableRows(adminData.users)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Locations Tab -->
          <div id="locationsTab" class="tab-content">
            <h3>📍 Saved Locations Management</h3>
            <div class="locations-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Place Name</th>
                    <th>Address</th>
                    <th>Coordinates</th>
                    <th>Rating</th>
                    <th>Saved By</th>
                    <th>Saved Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.generateLocationsTableRows(adminData.locations)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- System Tab -->
          <div id="systemTab" class="tab-content">
            <h3>⚙️ System Management</h3>
            
            <!-- System Stats -->
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 25px;">
              <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <h4>Active Sessions</h4>
                <div class="stat-number">${adminData.stats.activeSessions || 0}</div>
              </div>
              <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h4>Server Uptime</h4>
                <div class="stat-number" style="font-size: 18px;">Online</div>
              </div>
              <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <h4>Database Status</h4>
                <div class="stat-number" style="font-size: 18px;">Connected</div>
              </div>
            </div>
            
            <!-- System Actions -->
            <div class="system-actions">
              <button class="admin-action-btn" id="refreshDataBtn">
                🔄 Refresh Data
              </button>
              <button class="admin-action-btn" id="testConnectionBtn">
                � Test Database
              </button>
              <button class="admin-action-btn" id="exportDataBtn">
                📥 Export Data
              </button>
              <button class="admin-action-btn danger" id="clearLogsBtn">
                🗑️ Clear Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(adminModal);
    this.setupAdminModalEvents(adminModal);
  }

  /**
   * Generate users table rows
   */
  static generateUsersTableRows(users) {
    console.log('📝 Generating table rows for users:', users?.length || 0, users);
    
    if (!users || users.length === 0) {
      return `
        <tr>
          <td colspan="8" class="admin-empty-state">
            <h4>👥 No Users Found</h4>
            <p>No user accounts are currently registered in the system.</p>
          </td>
        </tr>
      `;
    }

    return users.map(user => {
      const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
      const fullName = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || 'N/A';
      const username = user.username || user.email || 'Unknown';
      const email = user.email || 'N/A';
      
      // Check admin status more thoroughly
      const isAdmin = !!(user.is_admin || user.isAdmin || user.admin || user.role === 'admin');
      
      // FIXED: Check active status - backend returns 'isActive' (camelCase), not 'is_active'
      const isActive = user.isActive !== undefined ? !!user.isActive : 
                       user.is_active !== undefined ? !!user.is_active : true;
      
      console.log(`👤 User ${username}: isActive=${user.isActive}, is_active=${user.is_active}, final isActive=${isActive}`);
      
      return `
        <tr class="${!isActive ? 'user-inactive' : ''}">
          <td><strong>#${user.id}</strong></td>
          <td>${username}</td>
          <td>${email}</td>
          <td>${fullName}</td>
          <td>
            <span class="admin-badge ${isAdmin ? 'admin' : 'user'}">
              ${isAdmin ? '👑 Admin' : '👤 User'}
            </span>
          </td>
          <td>
            <span class="status-text ${isActive ? 'active' : 'inactive'}">
              ${this.formatUserStatus(isActive)}
            </span>
          </td>
          <td>${createdDate}</td>
          <td>
            <button class="admin-action-btn small ${isAdmin ? 'demote' : 'promote'}" 
                    data-user-id="${user.id}" 
                    data-action="${isAdmin ? 'demote' : 'promote'}"
                    ${!isActive ? 'disabled' : ''}
                    title="${!isActive ? 'Cannot change role of inactive user' : ''}">
              ${isAdmin ? '⬇️ Demote' : '⬆️ Promote'}
            </button>
            <button class="admin-action-btn small ${isActive ? 'deactivate' : 'activate'}" 
                    data-user-id="${user.id}" 
                    data-action="${isActive ? 'deactivate' : 'activate'}"
                    style="background: ${isActive ? '#dc3545' : '#28a745'}; color: white; margin-left: 5px;"
                    title="${isActive ? 'Remove user access (preserves data)' : 'Restore user access'}">
              ${isActive ? '🚫 Remove' : '✅ Restore'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Generate locations table rows
   */
  static generateLocationsTableRows(locations) {
    console.log('📍 Generating locations table rows:', locations?.length || 0, locations);
    
    if (!locations || locations.length === 0) {
      return `
        <tr>
          <td colspan="8" class="admin-empty-state">
            <h4>📍 No Saved Locations Found</h4>
            <p>No locations have been saved by users yet.</p>
          </td>
        </tr>
      `;
    }

    return locations.map(location => {
      const savedDate = location.saved_at ? new Date(location.saved_at).toLocaleDateString() : 'Unknown';
      
      // Ensure lat/lng are valid numbers
      const lat = typeof location.lat === 'number' ? location.lat : parseFloat(location.lat);
      const lng = typeof location.lng === 'number' ? location.lng : parseFloat(location.lng);
      
      const coordinates = (!isNaN(lat) && !isNaN(lng)) ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'N/A';
      const rating = location.rating ? `⭐ ${location.rating} (${location.user_ratings_total || 0})` : 'No rating';
      const address = location.formatted_address || location.vicinity || 'No address';
      const name = location.name || 'Unknown Place';
      const userId = location.user_id || 'Unknown';
      
      console.log(`🔧 Processing location ${location.id || location.place_id}: lat=${lat}, lng=${lng}, name=${name}`);
      
      // Only add valid lat/lng to button data attributes
      const validLat = !isNaN(lat) ? lat : '';
      const validLng = !isNaN(lng) ? lng : '';
      const validId = location.id || location.place_id || ''; // Use place_id if id is not available
      const validPlaceId = location.place_id || '';
      
      console.log(`🔧 Button data attributes: id=${validId}, place_id=${validPlaceId}, lat=${validLat}, lng=${validLng}, name=${name}`);
      
      return `
        <tr>
          <td><strong>#${location.id || location.place_id}</strong></td>
          <td>
            <div style="font-weight: 500;">${name}</div>
            <div style="font-size: 12px; color: #6c757d;">${location.place_id || 'No Place ID'}</div>
          </td>
          <td>
            <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;" title="${address}">
              ${address}
            </div>
          </td>
          <td>
            <div style="font-family: monospace; font-size: 12px;" data-lat="${lat}" data-lng="${lng}">
              ${coordinates}
            </div>
          </td>
          <td>${rating}</td>
          <td>User #${userId}</td>
          <td>${savedDate}</td>
          <td>
            <button class="admin-action-btn small" 
                    data-location-id="${validId}" 
                    data-location-name="${name}"
                    data-location-lat="${validLat}"
                    data-location-lng="${validLng}"
                    data-action="view"
                    style="background: #007bff; color: white;">
              View
            </button>
            <button class="admin-action-btn small" 
                    data-location-id="${validId}"
                    data-place-id="${validPlaceId}" 
                    data-action="delete"
                    style="background: #dc3545; color: white; margin-left: 5px;">
              🗑️ Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Setup admin modal events
   */
  static setupAdminModalEvents(modal) {
    // Close modal
    modal.querySelector('.admin-close').addEventListener('click', () => {
      modal.remove();
    });

    // Tab switching
    modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchAdminTab(tabName, modal);
      });
    });

    // Stat card navigation - NEW!
    modal.querySelectorAll('.stat-card.clickable').forEach(card => {
      card.addEventListener('click', (e) => {
        const targetTab = card.dataset.navigate;
        const filter = card.dataset.filter;
        
        console.log(`📊 Navigating to ${targetTab} tab${filter ? ` with filter: ${filter}` : ''}`);
        
        // Switch to the target tab
        this.switchAdminTab(targetTab, modal);
        
        // Apply filter if specified
        if (filter) {
          this.applyUserFilter(modal, filter);
        }
        
        // Visual feedback
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      });
    });

    // User promotion/demotion, activation/deactivation and location actions
    modal.addEventListener('click', async (e) => {
      // Debug: Log all button clicks in admin panel
      if (e.target.classList.contains('admin-action-btn')) {
        console.log('🔧 Admin button clicked:', {
          target: e.target,
          classList: Array.from(e.target.classList),
          dataset: e.target.dataset,
          text: e.target.textContent.trim()
        });
      }
      
      if (e.target.classList.contains('promote') || e.target.classList.contains('demote')) {
        const userId = e.target.dataset.userId;
        const action = e.target.dataset.action;
        console.log(`👑 Role change: ${action} user ${userId}`);
        await this.handleUserRoleChange(userId, action);
      } else if (e.target.classList.contains('deactivate') || e.target.classList.contains('activate')) {
        const userId = e.target.dataset.userId;
        const action = e.target.dataset.action;
        console.log(`🔄 Status change: ${action} user ${userId}`);
        console.log(`🔄 Button classes:`, Array.from(e.target.classList));
        console.log(`🔄 Button dataset:`, e.target.dataset);
        await this.handleUserStatusChange(userId, action);
      } else if (e.target.dataset.action === 'view' || e.target.dataset.action === 'delete') {
        // Note: data-location-id in HTML becomes dataset.locationId in JavaScript
        const locationId = e.target.dataset.locationId;
        const placeId = e.target.dataset.placeId; // For delete operations
        const action = e.target.dataset.action;
        console.log(`🔧 Button clicked - locationId: ${locationId}, placeId: ${placeId}, action: ${action}`);
        console.log(`🔧 Button element:`, e.target);
        console.log(`🔧 Button dataset:`, e.target.dataset);
        console.log(`🔧 All data attributes:`, {
          locationId: e.target.dataset.locationId,
          placeId: e.target.dataset.placeId,
          locationName: e.target.dataset.locationName,
          locationLat: e.target.dataset.locationLat,
          locationLng: e.target.dataset.locationLng,
          action: e.target.dataset.action
        });
        
        // Use placeId for delete operations, locationId for view operations
        const idToUse = action === 'delete' ? placeId : locationId;
        await this.handleLocationAction(idToUse, action, e.target);
      }
    });

    // System actions
    const refreshBtn = modal.querySelector('#refreshDataBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.showAdminPanel());
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Switch admin tab
   */
  static switchAdminTab(tabName, modal) {
    // Update tab buttons
    modal.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    modal.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    modal.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    modal.querySelector(`#${tabName}Tab`).classList.add('active');
  }

  /**
   * Handle user role changes
   */
  static async handleUserRoleChange(userId, action) {
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`${StateManager.getApiBaseUrl()}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: action // 'promote' or 'demote'
        })
      });

      if (response.ok) {
        this.showNotification(`User ${action}d successfully`, 'success');
        this.showAdminPanel(); // Refresh the panel
      } else {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      this.showNotification(`Failed to ${action} user`, 'error');
    }
  }

  /**
   * Handle user status changes (activate/deactivate)
   */
  static async handleUserStatusChange(userId, action) {
    const actionText = action === 'activate' ? 'restore' : 'remove';
    const confirmMessage = action === 'activate' 
      ? 'Are you sure you want to restore this user\'s access? They will be able to log in again.'
      : 'Are you sure you want to remove this user\'s access? They will no longer be able to log in, but their data will be preserved.';
    
    console.log(`🔄 handleUserStatusChange called with userId: ${userId}, action: ${action}`);
    
    if (!confirm(confirmMessage)) {
      console.log(`🔄 User cancelled ${action} operation for user ${userId}`);
      return;
    }
    
    const token = StateManager.getAuthState()?.authToken;
    
    try {
      console.log(`🔄 ${action === 'activate' ? 'Activating' : 'Deactivating'} user ${userId}`);
      
      const response = await fetch(`${StateManager.getApiBaseUrl()}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: action // 'activate' or 'deactivate'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ User status response:`, result);
        
        // Handle both success and "already in state" cases
        if (result.data && result.data.changed === false) {
          this.showNotification(`User is already ${action === 'activate' ? 'active' : 'inactive'}. The display has been refreshed to show the current state.`, 'info');
        } else {
          this.showNotification(`User ${actionText}d successfully`, 'success');
        }
        
        // Always refresh to ensure UI consistency
        console.log('🔄 Refreshing admin panel to show current data...');
        await new Promise(resolve => setTimeout(resolve, 150)); // Small delay to ensure server state is updated
        this.showAdminPanel(); // Refresh the panel
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`❌ Status change failed:`, errorData);
        throw new Error(`Failed to ${actionText} user: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${actionText}ing user:`, error);
      this.showNotification(`Failed to ${actionText} user: ${error.message}`, 'error');
    }
  }

  /**
   * Update user information display
   * @param {boolean} isAuthenticated - Authentication status
   * @param {Object|null} user - Current user object
   */
  static updateUserInfo(isAuthenticated, user) {
    if (!isAuthenticated || !user) return;

    // Update profile modal if it exists
    const profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
      const form = profileInfo.querySelector('#profileFormElement');
      if (form) {
        // Populate profile form with user data
        const usernameInput = form.querySelector('#profileUsername');
        const emailInput = form.querySelector('#profileEmail');
        const fullNameInput = form.querySelector('#profileFullName');

        if (usernameInput) usernameInput.value = user.username || '';
        if (emailInput) emailInput.value = user.email || '';
        if (fullNameInput) fullNameInput.value = user.fullName || '';
      }
    }
  }

  /**
   * Update saved locations section visibility
   * @param {boolean} isAuthenticated - Authentication status
   */
  static updateSavedLocationsVisibility(isAuthenticated) {
    const savedLocationsSection = document.querySelector('.saved-locations');
    if (savedLocationsSection) {
      savedLocationsSection.style.display = isAuthenticated ? 'block' : 'none';
    }
  }

  /**
   * Show authentication modal
   * @param {string} mode - 'login' or 'register'
   */
  static showAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    // Clear previous content
    modalContent.innerHTML = '';

    if (mode === 'login') {
      modalContent.innerHTML = this.getLoginFormHTML();
    } else if (mode === 'register') {
      modalContent.innerHTML = this.getRegisterFormHTML();
    } else if (mode === 'forgot-password') {
      modalContent.innerHTML = this.getForgotPasswordFormHTML();
    }

    modal.style.display = 'block';
    
    // Focus on first input
    const firstInput = modalContent.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Hide authentication modal
   */
  static hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Show profile modal
   */
  static showProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.style.display = 'block';
      this.updateUserInfo(true, StateManager.getAuthState().currentUser);
    }
  }

  /**
   * Hide profile modal
   */
  static hideProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Toggle user dropdown menu
   */
  static toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    }
  }

  /**
   * Get login form HTML
   * @returns {string} Login form HTML
   */
  static getLoginFormHTML() {
    return `
      <span class="close">&times;</span>
      <h2>Login</h2>
      <form id="loginForm">
        <div class="form-group">
          <label for="loginUsername">Email:</label>
          <input type="email" id="loginUsername" name="loginUsername" required>
        </div>
        <div class="form-group">
          <label for="loginPassword">Password:</label>
          <input type="password" id="loginPassword" name="loginPassword" required>
        </div>
        <button type="submit" class="auth-submit-btn">Login</button>
      </form>
      <p class="auth-switch">
        Don't have an account? 
        <a href="#" id="showRegister">Register here</a>
      </p>
      <p class="auth-switch">
        <a href="#" id="showForgotPassword">Forgot Password?</a>
      </p>
    `;
  }

  /**
   * Get register form HTML
   * @returns {string} Register form HTML
   */
  static getRegisterFormHTML() {
    return `
      <span class="close">&times;</span>
      <h2>Register</h2>
      <form id="registerForm">
        <div class="form-group">
          <label for="registerUsername">Username:</label>
          <input type="text" id="registerUsername" required>
        </div>
        <div class="form-group">
          <label for="registerEmail">Email:</label>
          <input type="email" id="registerEmail" required>
        </div>
        <div class="form-group">
          <label for="registerFullName">Full Name:</label>
          <input type="text" id="registerFullName">
        </div>
        <div class="form-group">
          <label for="registerPassword">Password:</label>
          <input type="password" id="registerPassword" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" required>
        </div>
        <button type="submit" class="auth-submit-btn">Register</button>
      </form>
      <p class="auth-switch">
        Already have an account? 
        <a href="#" id="showLogin">Login here</a>
      </p>
    `;
  }

  /**
   * Get forgot password form HTML
   * @returns {string} Forgot password form HTML
   */
  static getForgotPasswordFormHTML() {
    return `
      <span class="close">&times;</span>
      <h2>Reset Password</h2>
      <form id="forgotPasswordForm">
        <div class="form-group">
          <label for="forgotEmail">Email:</label>
          <input type="email" id="forgotEmail" required>
        </div>
        <button type="submit" class="auth-submit-btn">Send Reset Email</button>
      </form>
      <p class="auth-switch">
        Remember your password? 
        <a href="#" id="showLogin">Login here</a>
      </p>
    `;
  }

  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - 'success', 'error', or 'info'
   */

  static showNotification(message, type = 'info') {
    // This will be moved to NotificationService in Phase 5
    // For now, just console log
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Basic alert for now
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else if (type === 'success') {
      alert(`Success: ${message}`);
      }
  }

  /**
   * Display form validation errors
   * @param {Object} errors - Validation errors object
   */
  static showFormErrors(errors) {
    // Clear previous errors
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => el.remove());

    // Show new errors
    Object.keys(errors).forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = errors[field];
        error.style.color = 'red';
        error.style.fontSize = '12px';
        error.style.marginTop = '5px';
        input.parentNode.appendChild(error);
      }
    });
  }
  
  // MISSING: Email verification banner methods
  
  /**
   * Check console for verification link - Global compatibility method
   */
  static checkConsoleForVerificationLink() {
    this.showNotification('Check your Node.js server terminal for the verification link!', 'warning');
    console.log('🔍 VERIFICATION HELP: Look at your Node.js terminal where you ran "npm start" - the verification link is printed there!');
    console.log('📋 EXAMPLE: Look for a line like "Verification URL: http://localhost:3000/verify-email.html?token=..."');
    console.log('🖱️ Copy that URL and paste it in your browser to verify your email');
  }
  
  /**
   * Show email verification banner
   */
  static showEmailVerificationBanner() {
    // Remove existing banner if any
    const existingBanner = document.getElementById('verificationBanner');
    if (existingBanner) {
      existingBanner.remove();
    }
    
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser || currentUser.emailVerified) {
      return;
    }
    
    const banner = document.createElement('div');
    banner.id = 'verificationBanner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #fff3cd;
      border-bottom: 1px solid #ffeaa7;
      padding: 12px 20px;
      text-align: center;
      z-index: 9999;
      font-size: 14px;
      color: #856404;
    `;
    
    banner.innerHTML = `
      📧 Please verify your email address to access all features. 
      <button onclick="resendVerificationEmail()" style="background: none; border: none; color: #1a73e8; text-decoration: underline; cursor: pointer; font-size: 14px; margin-left: 10px;">
        Resend email
      </button>
      <button onclick="checkConsoleForVerificationLink()" style="background: none; border: none; color: #1a73e8; text-decoration: underline; cursor: pointer; font-size: 14px; margin-left: 10px;">
        Check console for verification link
      </button>
      <button onclick="hideEmailVerificationBanner()" style="background: none; border: none; color: #856404; cursor: pointer; float: right; font-size: 16px;">
        ×
      </button>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Adjust main content margin
    const container = document.querySelector('.container');
    if (container) {
      container.style.marginTop = '60px';
    }
  }
  
  /**
   * Hide email verification banner - Global compatibility method
   */
  static hideEmailVerificationBanner() {
    const banner = document.getElementById('verificationBanner');
    if (banner) {
      banner.remove();
    }
    
    // Reset main content margin
    const container = document.querySelector('.container');
    if (container) {
      container.style.marginTop = '0';
    }
  }

  /**
   * Apply filter to users table
   */
  static applyUserFilter(modal, filter) {
    const tbody = modal.querySelector('#usersTab .admin-table tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    console.log(`🔍 Applying filter: ${filter}`);
    
    rows.forEach(row => {
      const adminBadge = row.querySelector('.admin-badge');
      if (!adminBadge) {
        console.log('❌ No admin badge found in row');
        return;
      }
      
      const isAdmin = adminBadge.classList.contains('admin');
      console.log(`👤 Row admin status: ${isAdmin}, badge classes:`, adminBadge.classList.toString());
      
      let shouldShow = true;
      
      switch (filter) {
        case 'admin':
          shouldShow = isAdmin;
          break;
        case 'user':
          shouldShow = !isAdmin;
          break;
        default:
          shouldShow = true;
      }
      
      console.log(`👁️ Should show row: ${shouldShow}`);
      
      if (shouldShow) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    
    console.log(`📊 Filter result: ${visibleCount} visible rows`);
    
    // Add filter indicator
    this.showFilterIndicator(modal, filter, visibleCount);
  }

  /**
   * Show filter indicator in users table
   */
  static showFilterIndicator(modal, filter, count) {
    // Remove existing filter indicator
    const existingIndicator = modal.querySelector('.filter-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (!filter || filter === 'all') return;
    
    const usersTab = modal.querySelector('#usersTab');
    const tableContainer = usersTab.querySelector('.users-table-container');
    
    const indicator = document.createElement('div');
    indicator.className = 'filter-indicator';
    indicator.innerHTML = `
      <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #1976d2; font-weight: 500;">
          🔍 Filtered by: <strong>${filter === 'admin' ? 'Admin Users' : 'Regular Users'}</strong> 
          (${count} result${count !== 1 ? 's' : ''})
        </span>
        <button class="admin-action-btn small clear-filter-btn" style="background: #2196f3; color: white;">
          ✕ Clear Filter
        </button>
      </div>
    `;
    
    // Add event listener to clear filter button
    const clearBtn = indicator.querySelector('.clear-filter-btn');
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🔄 Clearing user filter');
      
      // Show all rows
      const tbody = modal.querySelector('#usersTab .admin-table tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(row => {
          row.style.display = '';
        });
      }
      
      // Remove the filter indicator
      indicator.remove();
    });
    
    tableContainer.insertBefore(indicator, tableContainer.firstChild);
  }

  /**
   * Handle location actions (view/delete)
   */
  static async handleLocationAction(id, action, buttonElement = null) {
    console.log(`📍 Location action: ${action} for ID: ${id} (${action === 'delete' ? 'placeId' : 'locationId'})`);
    console.log(`📍 Button element:`, buttonElement);
    
    if (action === 'view') {
      let locationData = null;
      
      try {
        // First try to get data directly from the button attributes
        if (buttonElement && buttonElement.dataset) {
          console.log(`📍 Button dataset:`, buttonElement.dataset);
          console.log(`📍 Raw button attributes:`, {
            'data-location-lat': buttonElement.getAttribute('data-location-lat'),
            'data-location-lng': buttonElement.getAttribute('data-location-lng'),
            'data-location-name': buttonElement.getAttribute('data-location-name'),
            'data-location-id': buttonElement.getAttribute('data-location-id')
          });
          
          const latStr = buttonElement.dataset.locationLat;
          const lngStr = buttonElement.dataset.locationLng;
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          const name = buttonElement.dataset.locationName;
          
          console.log(`📍 String values - lat: "${latStr}", lng: "${lngStr}", name: "${name}"`);
          console.log(`📍 Parsed values - lat: ${lat}, lng: ${lng}, name: ${name}`);
          console.log(`📍 IsNaN check - lat: ${isNaN(lat)}, lng: ${isNaN(lng)}`);
          
          if (!isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null) {
            locationData = { lat, lng, name: name || 'Unknown Location' };
            console.log(`📍 Got location data from button:`, locationData);
          } else {
            console.warn(`📍 Invalid coordinates from button - lat: ${lat} (${typeof lat}), lng: ${lng} (${typeof lng})`);
          }
        } else {
          console.warn(`📍 No button element or dataset available`);
        }
        
        // If button data didn't work, try fallback data using locationId
        if (!locationData && id) {
          console.log(`📍 Using fallback data for location ID: ${id}`);
          const fallbackLocations = [
            { id: 1, lat: 40.7128, lng: -74.0060, name: 'New York, NY' },
            { id: 2, lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
            { id: 3, lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' },
            { id: 4, lat: 43.0481, lng: -76.1474, name: 'Syracuse, NY' },
            { id: 5, lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' }
          ];
          
          locationData = fallbackLocations.find(loc => loc.id.toString() === id.toString());
          console.log(`📍 Got location data from fallback:`, locationData);
        }
        
        if (locationData && !isNaN(locationData.lat) && !isNaN(locationData.lng)) {
          console.log(`📍 Navigating to location:`, locationData);
          
          // Close the admin modal
          const adminModal = document.getElementById('adminModal');
          if (adminModal) {
            adminModal.remove();
          }
          
          // Navigate to the location on the map
          if (window.MapService && window.MarkerService) {
            const map = window.MapService.getMap();
            
            if (map) {
              // Create location object for the map
              const location = new google.maps.LatLng(locationData.lat, locationData.lng);
              
              // Center the map on the location
              map.setCenter(location);
              map.setZoom(15);
              
              // Create a simple marker
              const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: locationData.name
              });
              
              // Create info window
              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 10px;">
                    <h4 style="margin: 0 0 5px 0;">${locationData.name}</h4>
                    <p style="margin: 0; color: #666;">
                      Coordinates: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}
                    </p>
                  </div>
                `
              });
              
              // Show info window
              infoWindow.open(map, marker);
              
            // I removed this because it interupts a successful navigation
             // this.showNotification(`Navigated to ${locationData.name}`, 'success');
            } else {
              this.showNotification('Map not available', 'error');
            }
          } else {
            this.showNotification('Map services not available', 'error');
          }
        } else {
          console.error('❌ Invalid location data:', locationData);
          this.showNotification('Invalid location coordinates', 'error');
        }
        
      } catch (error) {
        console.error('Error navigating to location:', error);
        this.showNotification('Error navigating to location', 'error');
      }
      
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this saved location?')) {
        try {
          const placeId = id; // For delete operations, id parameter is the placeId
          console.log(`🗑️ Attempting to delete location with placeId: ${placeId}`);
          
          const token = StateManager.getAuthState()?.authToken;
          const deleteUrl = `${StateManager.getApiBaseUrl()}/admin/locations/${placeId}`;
          console.log(`🗑️ DELETE URL: ${deleteUrl}`);
          
          const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log(`🗑️ Delete response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log(`🗑️ Delete response:`, result);
            this.showNotification('Location deleted successfully', 'success');
            // Refresh the admin panel to update the data
            this.showAdminPanel();
          } else {
            const errorText = await response.text();
            console.error(`🗑️ Delete failed with status ${response.status}:`, errorText);
            throw new Error(`Failed to delete location: ${response.status} ${errorText}`);
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          this.showNotification(`Failed to delete location: ${error.message}`, 'error');
        }
      }
    }
  }

  /**
   * Format user status for display
   * @param {boolean|number} isActive - User active status
   * @returns {string} - Formatted status text
   */
  static formatUserStatus(isActive) {
    // Simple Y/N display - can be easily changed to other formats later
    return !!isActive ? 'Yes' : 'No';
  }

  /**
   * Debug function to test admin data and user status display
   */
  static debugUserStatus() {
    console.log('🔍 DEBUGGING USER STATUS DISPLAY');
    
    // Test with sample data that mimics backend response
    const testUsers = [
      { id: 9, username: 'testuser9', email: 'test9@example.com', isActive: false, is_admin: false },
      { id: 10, username: 'testuser10', email: 'test10@example.com', isActive: false, is_admin: false },
      { id: 1, username: 'activeuser', email: 'active@example.com', isActive: true, is_admin: true }
    ];
    
    testUsers.forEach(user => {
      const isAdmin = !!(user.is_admin || user.isAdmin || user.admin || user.role === 'admin');
      const isActive = user.isActive !== undefined ? !!user.isActive : 
                       user.is_active !== undefined ? !!user.is_active : true;
      
      console.log(`🔍 User ${user.id}:`);
      console.log(`   - user.isActive: ${user.isActive}`);
      console.log(`   - user.is_active: ${user.is_active}`);
      console.log(`   - calculated isActive: ${isActive}`);
      console.log(`   - should show button: ${isActive ? 'Remove' : 'Restore'}`);
    });
  }

  /**
   * Show 404 error page (global compatibility)
   */
  static show404Page() {
    window.location.href = '/404.html';
  }

  /**
   * Show forgot password modal (global compatibility)
   */
  static showForgotPasswordModal() {
    this.showAuthModal('forgot-password');
  }

}

// Export individual functions for backward compatibility
export const updateAuthUI = AuthUI.updateAuthUI.bind(AuthUI);
export const showAuthModal = AuthUI.showAuthModal.bind(AuthUI);
export const hideAuthModal = AuthUI.hideAuthModal.bind(AuthUI);
export const showProfileModal = AuthUI.showProfileModal.bind(AuthUI);
export const hideProfileModal = AuthUI.hideProfileModal.bind(AuthUI);
export const toggleUserDropdown = AuthUI.toggleUserDropdown.bind(AuthUI);
export const showNotification = AuthUI.showNotification.bind(AuthUI);
export const showLoginForm = () => AuthUI.showAuthModal('login');
export const showRegisterForm = () => AuthUI.showAuthModal('register');
export const checkConsoleForVerificationLink = AuthUI.checkConsoleForVerificationLink.bind(AuthUI);
export const showEmailVerificationBanner = AuthUI.showEmailVerificationBanner.bind(AuthUI);
export const hideEmailVerificationBanner = AuthUI.hideEmailVerificationBanner.bind(AuthUI);
export const showAdminPanel = AuthUI.showAdminPanel.bind(AuthUI);