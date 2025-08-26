// Dynamic Profile Panel that integrates with your existing Auth system
import { SecurityUtils } from '../utils/SecurityUtils.js';

import { AdminActionsHandler } from '../modules/auth/AdminActionsHandler.js';
import { AdminTabContentManager } from '../modules/auth/AdminTabContentManager.js';
import { AdminFilterManager } from '../modules/auth/AdminFilterManager.js';

export class ProfilePanel {
    constructor() {
        this.currentPanel = null;
        this.isVisible = false;
    }

    // This handles the profile button to get to the profile modal
    // where there user can edit their infomation. 
    // these build the panels in the profile section/button

    createProfilePanel(userInfo, isAdmin) {
        const panel = document.createElement('div');
        panel.className = 'user-info-sidebar dynamic-profile-panel';
        
        // Get user details with fallbacks
        const username = userInfo?.username || userInfo?.email?.split('@')[0] || 'User';
        const email = userInfo?.email || 'No email provided';
        const firstName = userInfo?.firstName || '';
        const lastName = userInfo?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || username;
        
        // Create profile panel using secure DOM manipulation - no innerHTML
        panel.textContent = ''; // Clear content first
        
        // User Identity Section
        const identityDiv = document.createElement('div');
        identityDiv.className = 'profile-identity';
        
        // Skip avatar as requested - just add profile details
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'profile-details';
        
        const nameH4 = document.createElement('h4');
        nameH4.className = 'profile-name';
        nameH4.textContent = fullName;
        
        const emailP = document.createElement('p');
        emailP.className = 'profile-email';
        emailP.textContent = email;
        
        detailsDiv.appendChild(nameH4);
        detailsDiv.appendChild(emailP);
        
        if (userInfo?.role) {
            const roleSpan = document.createElement('span');
            roleSpan.className = `profile-role ${userInfo.role}`;
            roleSpan.textContent = userInfo.role.toUpperCase();
            detailsDiv.appendChild(roleSpan);
        }
        
        identityDiv.appendChild(detailsDiv);
        
        // Quick Stats Section
        const statsDiv = document.createElement('div');
        statsDiv.className = 'profile-stats';
        
        // Location stat
        const locationStatDiv = document.createElement('div');
        locationStatDiv.className = 'stat-item';
        
        // stats are not working currently 
        const locationNumber = document.createElement('span');
        locationNumber.className = 'stat-number';
        locationNumber.id = 'saved-locations-count';
        locationNumber.textContent = '...';
        
        const locationLabel = document.createElement('span');
        locationLabel.className = 'stat-label';
        locationLabel.textContent = 'Locations';
        
        locationStatDiv.appendChild(locationNumber);
        locationStatDiv.appendChild(locationLabel);
        
        // Photo stat
        const photoStatDiv = document.createElement('div');
        photoStatDiv.className = 'stat-item';
        
        const photoNumber = document.createElement('span');
        photoNumber.className = 'stat-number';
        photoNumber.id = 'photos-count';
        photoNumber.textContent = '...';
        
        const photoLabel = document.createElement('span');
        photoLabel.className = 'stat-label';
        photoLabel.textContent = 'Photos';
        
        photoStatDiv.appendChild(photoNumber);
        photoStatDiv.appendChild(photoLabel);
        
        statsDiv.appendChild(locationStatDiv);
        statsDiv.appendChild(photoStatDiv);
        
        // Action Buttons Section
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'profile-actions';
        
        // Edit Profile Button
        const editBtn = document.createElement('button');
        editBtn.className = 'profile-action-btn primary';
        editBtn.id = 'edit-profile-btn';
        editBtn.dataset.action = 'edit-profile';
        editBtn.textContent = '✏️ Edit Profile';
        
        // Location Settings Button
        const locationBtn = document.createElement('button');
        locationBtn.className = 'profile-action-btn secondary';
        locationBtn.dataset.action = 'location-settings';
        locationBtn.textContent = '📍 Location Settings';
        
        actionsDiv.appendChild(editBtn);
        // DO NOT REMOVE
       // actionsDiv.appendChild(locationBtn);
        
        // Add admin buttons if admin
        if (isAdmin) {
            const adminDiv = this.createAdminSection();
            actionsDiv.appendChild(adminDiv);
        }
        
        // Logout Button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'profile-action-btn logout';
        logoutBtn.dataset.action = 'logout';
        logoutBtn.textContent = '🚪 Logout';
        
        actionsDiv.appendChild(logoutBtn);
        
        // Footer Section
        const footerDiv = document.createElement('div');
        footerDiv.className = 'profile-footer';
        
        const footerText = document.createElement('small');
        footerText.textContent = 'Authenticated via Merkel Vision';
        footerDiv.appendChild(footerText);
        
        // Assemble the panel
        panel.appendChild(identityDiv);
        panel.appendChild(statsDiv);
        panel.appendChild(actionsDiv);
        panel.appendChild(footerDiv);
        
        console.log('Panel To Here');
        // Setup event handlers
        this.setupEventHandlers(panel);
        
        return panel;
    }

    async handleAction(action) {
        console.log(`🎯 Profile action triggered: ${action}`);
        
                //This has limited user data
                const authState = window.StateManager?.getAuthState();
                const user = authState?.currentUser;
                // BASIC ELEMENT/USER CHECK check for modal 
                const modal = document.getElementById('profileModal');
                if (!modal) {
                    console.error('❌ profile-modal not found. ');
                    return;
                    }
                // check there is a user in the state. 
                if (!user) {
                    console.error('❌ No user data available');
                    return;
                    }

        switch (action) {
            case 'edit-profile':
                console.log('🔍 edit-profile dynamic form...');
                // resets the form if it exsists
                window.AuthModalService.resetProfileModal();
                // gets user data
                const userProfile = await this.fetchUserProfile();
                // Create and inject the profile form - this is new form
                await this.createProfileForm(modal, userProfile.user);
                // OLD
                //window.AuthModalService.populateProfileForm(userProfile.user);
                
                // event handler for form
                window.AuthModalService.setupProfileFormHandler();
                
                // Show the modal
                modal.style.display = 'block';
                modal.classList.add('show');
                
                console.log('✅ edit-profile displayed');
                this.hide();
                break;

            case 'admin-panel':
                console.log('🎯 admin-modal panel action triggered...');

                try {
                    // Load the admin panel using AuthAdminService
                    const { AuthAdminService } = await import('../modules/auth/AuthAdminService.js');
                    // needs to be attached to the modal
                   // const adminPanel = await AuthAdminService.showAdminPanel();

                    console.log('🔧 AuthAdminService.showAdminPanel(): Loading Admin Panel...');
                        
                        const { AdminModalManager } = await import('../modules/auth/AdminModalManager.js');
                        const { AdminDataService } = await import('../modules/auth/AdminDataService.js');           
                        // Show loading modal first
                       // const loadingModal = AdminModalManager.createLoadingModal();

                        const loadingModal = this.createLoadingModal(modal);
                        this.setupEventDelegation(loadingModal);
                        
                        try {
                          // Fetch admin data from server
                          const adminData = await AdminDataService.fetchAdminData();
                         // const mainModal = AdminModalManager.createMainModal(adminData);
                            const mainModal = this.createMainModal(adminData, modal);

                             this.setupEventDelegation(mainModal);
                             this.setupTabContentLoader(adminData);

                        } catch (error) {
                          console.error('❌  AuthAdminService.showAdminPanel(): Failed to load admin data:', error);
                          AdminModalManager.createErrorModal(error);
                        }


                   // await AuthAdminService.showAdminPanel();
                    console.log('✅ Admin panel opened successfully');
                } catch (error) {
                    console.error('❌ Failed to load admin panel:', error);
                    }

                 // Show the modal
                modal.style.display = 'block';
                modal.classList.add('show');
                
                console.log('✅ admin-modal displayed');
                // Hide the profile modal after successful admin panel creation
                this.hide();
                break;
                
            case 'debug-admin':
                console.log('🔍 Debug Admin Panel triggered');
                try {
                    if (window.debugAdminPanel) {
                        await window.debugAdminPanel();
                        console.log('✅ Debug admin panel executed');
                    } else {
                        console.log('🔍 Debug function not available, showing available auth info');
                        const userInfo = await this.getCurrentUserInfo();
                        const authState = window.StateManager?.getAuthState();
                        console.log('Current User Info:', userInfo);
                        console.log('Auth State:', authState);
                        console.log('Admin Status:', userInfo?.isAdmin);
                    }
                } catch (error) {
                    console.error('❌ Debug admin error:', error);
                }

                 // Show the modal
                modal.style.display = 'block';
                modal.classList.add('show');
                this.hide();
                break;
                
            case 'logout':
                console.log('🔍 Logging out...');
                if (window.Auth && window.Auth.logout) {
                    try {
                        await window.Auth.logout();
                        console.log('✅ Logout successful');
                    } catch (error) {
                        console.error('❌ Logout error:', error);
                    }
                }
                this.hide();
                break;
                
            default:
                console.warn(`❓ Unknown profile action: ${action}`);
                this.hide();
                break;
        }
    }

    createLoadingModal(modal) {  // styles
        // this.loadAdminStyles();
            this.removeExistingModal();
            
            // Create and configure the admin modal
            const adminModal = document.createElement('div');
            adminModal.id = 'adminModal';
            adminModal.className = 'modal-content admin-modal-content';
            adminModal.innerHTML = `
                <span class="close admin-close">&times;</span>
                <h2>🔧 Admin Loading Panel</h2>
                <div class="admin-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading admin data...</p>
                </div>
            `;

            // Apply display properties
            adminModal.style.display = 'block';
            adminModal.classList.add('show');

            // Setup modal events
            this.setupModalEvents(adminModal);

            // Append the modal to the parent container
            modal.appendChild(adminModal);

            // return adminModal;
            return modal;
    }

    /**
    * Create main admin modal with data
    * @param {Object} adminData - Admin data containing users, stats, and locations
    */
    createMainModal(adminData, modal) {
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
        
        modal.appendChild(adminModal);
        //this.setupModalEvents(adminModal);
        this.setupModalEvents(modal);
        //return adminModal;
        return modal;
    }

    /**
     * Remove existing modal if present
     */
    removeExistingModal() {
        const existingModal = document.getElementById('adminModal');
        if (existingModal) {
        existingModal.remove();
        }
    }

    /**
     * Setup close button functionality
     * @param {HTMLElement} modal - Modal element
     */
    
    setupCloseButton(modal) {
             // CLOSE FOR ADMIN PANEL
            modal.addEventListener('click', (e) => {
                    const closeBtn = e.target.closest('.admin-close');
                    const isClickOutside = e.target === modal;
                    
                    if (closeBtn || isClickOutside) {
                        // Unified close logic for both scenarios
                        const adminModal = document.getElementById('adminModal');
                        if (adminModal) {
                            adminModal.remove();
                        }
                        
                        // Hide the parent modal (don't delete it!)
                        const profileModal = document.getElementById('profileModal');
                        if (profileModal) {
                            profileModal.style.display = 'none';
                            profileModal.classList.remove('show');
                        }
                    }
                });
    }

    /**
     * Setup tab switching functionality
     * @param {HTMLElement} modal - Modal element
     */
    setupTabSwitching(modal) {
        const tabButtons = modal.querySelectorAll('.admin-tab-btn');

        tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            this.switchTab(tabName, modal);
        });
        });
    }
    
    /**
     * Switch active tab
     * @param {string} tabName - Tab name to switch to
     * @param {HTMLElement} modal - Admin modal element
     */
    
    switchTab(tabName, modal) {
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
     * Generate modal content HTML
     * @param {Object} adminData - Admin data
     * @returns {string} HTML content
     */
    generateModalContent(adminData) {
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
       * Setup event delegation for admin panel
       * @param {HTMLElement} modal - Admin modal element
       */
    
    
    setupEventDelegation(modal) {

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
       * Load content for specific tab
       * @param {string} tabName - Tab name
       * @param {Object} adminData - Admin data
       * @param {HTMLElement} contentContainer - Content container element
       */
      loadTabContent(tabName, adminData, contentContainer) {
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
      setupFilterListeners() {
        const modal = document.getElementById('adminModal');
        if (modal) {
          AdminFilterManager.setupFilterListeners(modal);
        }
      }

       /**
         * Show admin panel
         */
        async showAdminPanel() {
          console.log('🔧 AuthAdminService.showAdminPanel():Loading Admin Panel...');
          
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
 * Dynamically load the admin modal CSS file
 */
loadAdminStyles() {
    const existingLink = document.querySelector('link[href="css/pages/new-layout-admin.css"]');
    if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './css/pages/new-layout-admin-.css'; // Path to your CSS file
        document.head.appendChild(link);
        console.log('✅ Admin styles loaded dynamically');
    } else {
        console.log('ℹ️ Admin styles already loaded');
      }
}

    /**
     * Setup tab content loading system
     * @param {Object} adminData - Admin data for tab content
     */
    
    setupTabContentLoader(adminData) {
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
     * Setup modal event handlers
     * @param {HTMLElement} modal - Admin modal element
     */

    setupModalEvents(modal) {
        this.setupCloseButton(modal);
        this.setupTabSwitching(modal);
    }

    // Get user info from your existing Auth system via main.js
    async getCurrentUserInfo() {
        try {
            // Wait for Auth system to be available
            if (window.StateManager) {
                const authState = window.StateManager.getAuthState();
                console.log('🔍 Auth state:', authState);
                console.log( authState.authToken, '/n',authState.currentUser );

                /*             
                authState: authToken - syntax authState.authToken = xxxxxxx String
                currentUser : { correct synta currentUser.email = "rodczar@gmail.com"
                email : string
                emailVerified : 1/0 = t/f1
                firstName : stringid : int
                isAdmin : t/f
                lastName : string
                username : string
                            }
                */

                // Add debug log to confirm retrieved user data
                console.log('🔍 Retrieved user data in getCurrentUserInfo:', authState?.currentUser);

                return authState?.currentUser || null;
            }
            
            // Check localStorage as fallback
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting user info:', error);
            return null;
        }
    }

    // Check admin status using your existing Auth system
    async checkIfAdmin(userInfo) {
        if (!userInfo) return false;
        
        try {
            // Method 1: Check role
            if (userInfo.role === 'admin') return true;
            
            // Method 2: Check isAdmin flag
            if (userInfo.isAdmin === true) return true;
            
            // Method 3: Check if showAdminPanel function exists (from main.js)
            if (window.showAdminPanel && typeof window.showAdminPanel === 'function') {
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    // Create admin section using secure DOM manipulation
    createAdminSection() {
        const adminDiv = document.createElement('div');
        adminDiv.className = 'admin-section';
        
        // Admin label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'admin-label';
        labelDiv.textContent = '⭐ Admin Tools';
        
        // Admin Panel Button
        const adminBtn = document.createElement('button');
        adminBtn.className = 'profile-action-btn admin';
        adminBtn.dataset.action = 'admin-panel';
        adminBtn.textContent = '📊 Admin Panel';
        
        // Debug Tools Button
        const debugBtn = document.createElement('button');
        debugBtn.className = 'profile-action-btn admin';
        debugBtn.dataset.action = 'debug-admin';
        debugBtn.textContent = '🔧 Debug Tools';
        
        //adminDiv.appendChild(labelDiv);
        adminDiv.appendChild(adminBtn);
       // adminDiv.appendChild(debugBtn);
        
        return adminDiv;
    }

    
    setupEventHandlers(panel) {
        const actionButtons = panel.querySelectorAll('[data-action]');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
              //  e.stopPropagation();
                const action = e.target.closest('[data-action]').dataset.action;
                await this.handleAction(action);
            });
        });
        
        // Load stats
        this.loadProfileStats();
    }
    


    // Function to fetch user profile data
    async fetchUserProfile() {
        try {
            // Make a GET request to the /profile endpoint
            const response = await fetch('/api/auth/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include the JWT toke
                }
            });

            // Check if the response is successful
            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
            }

            // Parse the JSON response
            const data = await response.json();
            return data;

            // Pass the user data to createProfileForm
           // createProfileForm(modal, data.user);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }
    

    // Create dynamic profile form
    async createProfileForm(modal, user) {
        console.log('createProfileForm:', modal, '' ,user);
        
        // Find or create modal content container
        let modalContent = modal.querySelector('.modal-content');
        if (!modalContent) {
            modalContent = document.createElement('div');
            modalContent.id = 'edit-profile';
            modalContent.className = 'modal-content';
            modal.appendChild(modalContent);
        }
        
        // Clear existing content - use textContent for security
        modalContent.textContent = '';
        
        // Create close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => {
           // document.getElementById('profileModal').style.display = 'none';
            const modal = document.getElementById('edit-profile');
            if (modal) {
                modal.remove(); // Remove the entire modal
                }
            document.getElementById('profileModal').style.display = 'none';
        });
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'User Profile';
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        
        // Create the complete profile form structure that main.js expects
        // This replicates the structure from app-v1.html
        
        // Profile Information Section
        const profileInfoSection = document.createElement('div');
        profileInfoSection.id = 'profileInfo';
        profileInfoSection.className = 'profile-section';
        
        const profileInfoTitle = document.createElement('h3');
        profileInfoTitle.textContent = 'Profile Information';
        
        const profileForm = document.createElement('form');
        profileForm.id = 'profileFormElement';
        
        // Username field
        const usernameGroup = document.createElement('div');
        usernameGroup.className = 'form-group';
        
        const usernameLabel = document.createElement('label');
        usernameLabel.setAttribute('for', 'profileUsername');
        usernameLabel.textContent = 'Username:';
        
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'profileUsername';
        usernameInput.name = 'username';
        usernameInput.value = SecurityUtils.escapeHtml(user.username || '');
        usernameInput.required = true;
        
        const usernameHelp = document.createElement('small');
        usernameHelp.className = 'form-help';
        usernameHelp.textContent = 'Username must be 3-50 characters, letters, numbers, and underscores only';
        
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);
        usernameGroup.appendChild(usernameHelp);
        
        // Email field
        const emailGroup = document.createElement('div');
        emailGroup.className = 'form-group';
        
        const emailLabel = document.createElement('label');
        emailLabel.setAttribute('for', 'profileEmail');
        emailLabel.textContent = 'Email:';
        
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'profileEmail';
        emailInput.name = 'email';
        emailInput.value = SecurityUtils.escapeHtml(user.email || '');
        emailInput.required = true;
        
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);
        
        // First Name field
        const firstNameGroup = document.createElement('div');
        firstNameGroup.className = 'form-group';
        
        const firstNameLabel = document.createElement('label');
        firstNameLabel.setAttribute('for', 'profileFirstName');
        firstNameLabel.textContent = 'First Name:';
        
        const firstNameInput = document.createElement('input');
        firstNameInput.type = 'text';
        firstNameInput.id = 'profileFirstName';
        firstNameInput.name = 'firstName';
        // Handle both camelCase and snake_case field names
        const firstNameValue = user.firstName || '';
        firstNameInput.value = SecurityUtils.escapeHtml(firstNameValue);
        
        console.log('🔍 First Name field - using value:', firstNameValue);
        
        firstNameGroup.appendChild(firstNameLabel);
        firstNameGroup.appendChild(firstNameInput);
        
        // Last Name field
        const lastNameGroup = document.createElement('div');
        lastNameGroup.className = 'form-group';
        
        const lastNameLabel = document.createElement('label');
        lastNameLabel.setAttribute('for', 'profileLastName');
        lastNameLabel.textContent = 'Last Name:';
        
        const lastNameInput = document.createElement('input');
        lastNameInput.type = 'text';
        lastNameInput.id = 'profileLastName';
        lastNameInput.name = 'lastName';
        // Handle both camelCase and snake_case field names
        const lastNameValue = user.lastName || '';
        lastNameInput.value = SecurityUtils.escapeHtml(lastNameValue);
        
        console.log('🔍 Last Name field - using value:', lastNameValue);
        
        lastNameGroup.appendChild(lastNameLabel);
        lastNameGroup.appendChild(lastNameInput);
        
        // Update Profile Button
        const updateBtn = document.createElement('button');
        updateBtn.type = 'submit';
        updateBtn.className = 'auth-submit-btn';
        updateBtn.textContent = 'Update Profile';
        
        // Assemble profile form
        profileForm.appendChild(usernameGroup);
        profileForm.appendChild(emailGroup);
        profileForm.appendChild(firstNameGroup);
        profileForm.appendChild(lastNameGroup);
        profileForm.appendChild(updateBtn);
        
        profileInfoSection.appendChild(profileInfoTitle);
        profileInfoSection.appendChild(profileForm);
        
        // Password Change Section - Create the structure main.js expects
        const passwordSection = document.createElement('div');
        passwordSection.className = 'profile-section';
        
        const passwordTitle = document.createElement('h3');
        passwordTitle.textContent = 'Change Password';
        
        const passwordForm = document.createElement('form');
        passwordForm.id = 'changePasswordForm';
        
        // Current Password
        const currentPassGroup = document.createElement('div');
        currentPassGroup.className = 'form-group';
        
        const currentPassLabel = document.createElement('label');
        currentPassLabel.setAttribute('for', 'currentPassword');
        currentPassLabel.textContent = 'Current Password:';
        
        const currentPassInput = document.createElement('input');
        currentPassInput.type = 'password';
        currentPassInput.id = 'currentPassword';
        currentPassInput.name = 'currentPassword';
        currentPassInput.required = true;
        currentPassInput.setAttribute('autocomplete', 'current-password');
        
        const currentPassHelp = document.createElement('div');
        currentPassHelp.className = 'password-help';
        const currentPassSmall = document.createElement('small');
        currentPassSmall.textContent = 'Enter your current password to verify your identity';
        currentPassHelp.appendChild(currentPassSmall);
        
        currentPassGroup.appendChild(currentPassLabel);
        currentPassGroup.appendChild(currentPassInput);
        currentPassGroup.appendChild(currentPassHelp);
        
        // New Password
        const newPassGroup = document.createElement('div');
        newPassGroup.className = 'form-group';
        
        const newPassLabel = document.createElement('label');
        newPassLabel.setAttribute('for', 'newPassword');
        newPassLabel.textContent = 'New Password:';
        
        const newPassInput = document.createElement('input');
        newPassInput.type = 'password';
        newPassInput.id = 'newPassword';
        newPassInput.name = 'newPassword';
        newPassInput.required = true;
        newPassInput.setAttribute('autocomplete', 'new-password');
        
        // Password strength container
        const strengthContainer = document.createElement('div');
        strengthContainer.className = 'password-strength-container';
        
        const strengthMeter = document.createElement('div');
        strengthMeter.className = 'password-strength-meter';
        const strengthBar = document.createElement('div');
        strengthBar.className = 'password-strength-bar';
        strengthBar.id = 'passwordStrengthBar';
        strengthMeter.appendChild(strengthBar);
        
        const strengthText = document.createElement('div');
        strengthText.className = 'password-strength-text';
        strengthText.id = 'passwordStrengthText';
        strengthText.textContent = 'Password strength will appear here';
        
        strengthContainer.appendChild(strengthMeter);
        strengthContainer.appendChild(strengthText);
        
        newPassGroup.appendChild(newPassLabel);
        newPassGroup.appendChild(newPassInput);
        newPassGroup.appendChild(strengthContainer);
        
        // Confirm Password
        const confirmPassGroup = document.createElement('div');
        confirmPassGroup.className = 'form-group';
        
        const confirmPassLabel = document.createElement('label');
        confirmPassLabel.setAttribute('for', 'confirmNewPassword');
        confirmPassLabel.textContent = 'Confirm New Password:';
        
        const confirmPassInput = document.createElement('input');
        confirmPassInput.type = 'password';
        confirmPassInput.id = 'confirmNewPassword';
        confirmPassInput.name = 'confirmNewPassword';
        confirmPassInput.required = true;
        confirmPassInput.setAttribute('autocomplete', 'new-password');
        
        confirmPassGroup.appendChild(confirmPassLabel);
        confirmPassGroup.appendChild(confirmPassInput);
        
        // Password Requirements Section
        const requirementsDiv = this.createPasswordRequirementsSection();
        
        // Change Password Button
        const changePassBtn = document.createElement('button');
        changePassBtn.type = 'submit';
        changePassBtn.className = 'auth-submit-btn';
        changePassBtn.id = 'changePasswordSubmitBtn';
        changePassBtn.textContent = 'Change Password';
        changePassBtn.disabled = true;
        
        // Assemble password form
        passwordForm.appendChild(currentPassGroup);
        passwordForm.appendChild(newPassGroup);
        passwordForm.appendChild(confirmPassGroup);
        passwordForm.appendChild(requirementsDiv);
        passwordForm.appendChild(changePassBtn);
        
        passwordSection.appendChild(passwordTitle);
        passwordSection.appendChild(passwordForm);
        
        // Add all sections to modal
        modalContent.appendChild(profileInfoSection);
        modalContent.appendChild(passwordSection);
       //modalContent.appendChild(gpsSection);
        
        // NOW call the main.js handler after the DOM is ready
        if (window.setupChangePasswordHandler) {
            console.log('🔗 Connecting to existing main.js password handler');
            window.setupChangePasswordHandler();
            console.log('✅ Connected to existing main.js password system');
        } else {
            console.warn('⚠️ main.js password handler not available');
        }

         // Add GPS Permission Section
        const gpsSection = this.createGPSSection();
        if (gpsSection) {
            modalContent.appendChild(gpsSection);
            console.log('✅ GPS section added to profile form');

            // Call updateGPSPermissionStatus immediately after the GPS section is loaded
            this.updateGPSPermissionStatus();
        } else {
            console.error('❌ Failed to create GPS section');
        }
        
         this.setupProfileGPSHandlers();
        
        console.log('✅ Dynamic profile form created and connected to main.js');
    }

    // Create password requirements section
    createPasswordRequirementsSection() {
        const requirementsDiv = document.createElement('div');
        requirementsDiv.className = 'password-requirements-enhanced';
        
        const title = document.createElement('h4');
        title.textContent = 'Password Requirements:';
        
        const requirementList = document.createElement('div');
        requirementList.className = 'requirement-list';
        
        const requirements = [
            { id: 'req-length', text: 'At least 8 characters long' },
            { id: 'req-uppercase', text: 'One uppercase letter (A-Z)' },
            { id: 'req-lowercase', text: 'One lowercase letter (a-z)' },
            { id: 'req-number', text: 'One number (0-9)' },
            { id: 'req-special', text: 'One special character (!@#$%^&*)' }
        ];
        
        requirements.forEach(req => {
            const reqItem = document.createElement('div');
            reqItem.className = 'requirement-item';
            reqItem.id = req.id;
            
            const icon = document.createElement('span');
            icon.className = 'requirement-icon';
            icon.textContent = '⚪';
            
            const text = document.createElement('span');
            text.className = 'requirement-text';
            text.textContent = req.text;
            
            reqItem.appendChild(icon);
            reqItem.appendChild(text);
            requirementList.appendChild(reqItem);
        });
        
        const securityNotes = document.createElement('div');
        securityNotes.className = 'security-notes';
        
        const notesTitle = document.createElement('p');
        notesTitle.innerHTML = '<strong>Security Notes:</strong>';
        
        const notesList = document.createElement('ul');
        const notes = [
            'Your current password must also meet these requirements',
            'New password must be different from your current password',
            'Consider using a password manager for stronger security',
            'We check against common password databases',
            'Password entropy is calculated to ensure randomness',
            'Longer passwords with variety are more secure'
        ];
        
        notes.forEach(note => {
            const li = document.createElement('li');
            li.textContent = note;
            notesList.appendChild(li);
        });
        
        const securityTips = document.createElement('div');
        securityTips.className = 'security-tips';
        securityTips.innerHTML = '<strong>💡 Pro Tips:</strong>';
        
        const tipsList = document.createElement('ul');
        tipsList.className = 'security-tips-list';
        
        const tips = [
            'Use a passphrase: "Coffee#Morning@2024!"',
            'Avoid personal information (birthdays, names)',
            'Don\'t reuse passwords across sites',
            'Enable two-factor authentication when available'
        ];
        
        tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            tipsList.appendChild(li);
        });
        
        securityTips.appendChild(tipsList);
        securityNotes.appendChild(notesTitle);
        securityNotes.appendChild(notesList);
        securityNotes.appendChild(securityTips);
        
        requirementsDiv.appendChild(title);
        requirementsDiv.appendChild(requirementList);
        requirementsDiv.appendChild(securityNotes);
        
        return requirementsDiv;
    }

    /////////////////////////////////////////////////////
    // Create GPS permission section
    createGPSSection() {
        const gpsSection = document.createElement('div');
        gpsSection.className = 'profile-section';
        
        const gpsTitle = document.createElement('h3');
        gpsTitle.textContent = 'Location Preferences';
        
        const gpsContainer = document.createElement('div');
        gpsContainer.className = 'gps-permission-container';
        
        // GPS Status
        const statusGroup = document.createElement('div');
        statusGroup.className = 'form-group';
        
        const statusLabel = document.createElement('label');
        statusLabel.textContent = 'GPS Permission Status:';
        
        const statusSpan = document.createElement('span');
        statusSpan.id = 'gpsPermissionStatus';
        statusSpan.className = 'permission-status';
        statusSpan.textContent = 'Checking...';
        
        statusGroup.appendChild(statusLabel);
        statusGroup.appendChild(statusSpan);
        
        // GPS Controls
        const controlsGroup = document.createElement('div');
        controlsGroup.className = 'form-group';
        
        const controlsLabel = document.createElement('label');
        controlsLabel.textContent = 'GPS Permission Controls:';
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'gps-controls';
        
        const grantBtn = document.createElement('button');
        grantBtn.type = 'button';
        grantBtn.id = 'grantGpsBtn';
        grantBtn.className = 'gps-control-btn grant';
        grantBtn.textContent = 'Grant Permission';
        
        const denyBtn = document.createElement('button');
        denyBtn.type = 'button';
        denyBtn.id = 'denyGpsBtn';
        denyBtn.className = 'gps-control-btn deny';
        denyBtn.textContent = 'Deny Permission';
        
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.id = 'resetGpsBtn';
        resetBtn.className = 'gps-control-btn reset';
        resetBtn.textContent = 'Reset Permission';
        
        controlsDiv.appendChild(grantBtn);
        controlsDiv.appendChild(denyBtn);
        controlsDiv.appendChild(resetBtn);
        
        controlsGroup.appendChild(controlsLabel);
        controlsGroup.appendChild(controlsDiv);
        
        // GPS Info
        const gpsInfo = document.createElement('p');
        gpsInfo.className = 'gps-info';
        gpsInfo.innerHTML = '📍 <strong>GPS Permission:</strong> Allows the app to access your current location for centering the map and location-based features.';
        
        gpsContainer.appendChild(statusGroup);
        gpsContainer.appendChild(controlsGroup);
        gpsContainer.appendChild(gpsInfo);
        
        gpsSection.appendChild(gpsTitle);
        gpsSection.appendChild(gpsContainer);
        
        return gpsSection;
    }

    /**
     * Setup GPS permission handlers in profile modal
     */
    setupProfileGPSHandlers() {
        const grantGpsBtn = document.getElementById('grantGpsBtn');
        const denyGpsBtn = document.getElementById('denyGpsBtn');
        const resetGpsBtn = document.getElementById('resetGpsBtn');

        if (grantGpsBtn) {
            grantGpsBtn.addEventListener('click', async () => {
                await this.updateGPSPermission('granted');
            });

        }
        
        if (denyGpsBtn) {
            denyGpsBtn.addEventListener('click', async () => {
                await this.updateGPSPermission('denied');
            });
        }
        
        if (resetGpsBtn) {
            resetGpsBtn.addEventListener('click', async () => {
                await this.updateGPSPermission('not_asked');
            });
        }
        
    }
    /**
     * Update user's GPS permission status
     */
    async updateGPSPermission(permission) {
        try {
            if (!window.GPSPermissionService) {
                console.error('❌ GPS Permission Service not available');
                return;
            }
            
            const success = await window.GPSPermissionService.updateUserGPSPermission(permission);
            
            if (success) {
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification(
                    `GPS permission set to: ${permission}`,
                    'success'
                );
                
                // Update the status display
                await this.updateGPSPermissionStatus();
            } else {
                throw new Error('Failed to update GPS permission');
            }
            
        } catch (error) {
            console.error('❌ Error updating GPS permission:', error);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification(
                'Failed to update GPS permission. Please try again.',
                'error'
            );
        }
    }
    
    /**
     * Update GPS permission status display in profile modal
     */
    async updateGPSPermissionStatus() {
    console.error('❌ CHECKING GPS');
    try {
        if (!window.GPSPermissionService) {
            console.error('❌ GPS Permission Service not available');
            return;
        }

        const status = await window.GPSPermissionService.getCurrentGPSPermissionStatus();
        const statusElement = document.getElementById('gpsPermissionStatus');

        if (statusElement) {
            console.log('✅ GPS Status:', status);
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
            statusElement.className = `permission-status ${status.replace('_', '-')}`;
        } else {
            console.warn('⚠️ GPS status element not found');
        }
    } catch (error) {
        console.error('❌ Error updating GPS permission status:', error);
    }
    }
    
    //// Helper functions ////////////
    loadProfileStats() {
        setTimeout(() => {
            // Load saved locations count
            try {
                const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
                const countElement = document.getElementById('saved-locations-count');
                if (countElement) {
                    countElement.textContent = savedLocations.length;
                }
            } catch (error) {
                console.error('Error loading location count:', error);
            }

            // Mock photo count for now
            const photoCountElement = document.getElementById('photos-count');
            if (photoCountElement) {
                photoCountElement.textContent = '0';
            }
        }, 100);
    }

    getAvatarColor(username) {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];
        
        // Generate consistent color based on username
        const hash = username.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        
        return colors[Math.abs(hash) % colors.length];
    }

    escapeHtml(text) {
        if (!text) return '';
        
        // Use your SecurityUtils if available
        if (window.SecurityUtils && window.SecurityUtils.escapeHtml) {
            return window.SecurityUtils.escapeHtml(text);
        }
        
        // Fallback HTML escaping
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            await this.show();
        }
    }

    async show() {
        // Remove existing panel
        this.hide();
        
        // Get user info
        const userInfo = await this.getCurrentUserInfo();
        if (!userInfo) {
            console.warn('❌ No user info available for profile panel');
            return;
        }
        
        console.log('✅ User info retrieved:', userInfo);
        
        const isAdmin = await this.checkIfAdmin(userInfo);
        console.log('🔍 Is admin:', isAdmin);
        
        // Create dynamic panel
        this.currentPanel = this.createProfilePanel(userInfo, isAdmin);
        
        // Add to DOM
        const profileButton = document.getElementById('profile-button');
        if (profileButton) {
            profileButton.appendChild(this.currentPanel);
            
            // Animate in
            setTimeout(() => {
                this.currentPanel.classList.add('visible');
                this.isVisible = true;
                console.log('✅ Profile panel displayed');
            }, 10);
        } else {
            console.error('❌ Profile button not found for panel attachment');
        }
    }

    hide() {
        if (this.currentPanel) {
            this.currentPanel.classList.remove('visible');
            // Immediate cleanup when called from show()
            if (this.currentPanel.parentNode) {
                this.currentPanel.remove();
            }
            this.currentPanel = null;
        }
        this.isVisible = false;
    }


}