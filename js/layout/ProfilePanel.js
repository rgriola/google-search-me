// Dynamic Profile Panel that integrates with your existing Auth system
import { SecurityUtils } from '../utils/SecurityUtils.js';
import { debug } from '../debug.js';
import ScriptInitManager from '../utils/ScriptInitManager.js';

const FILE = 'PROFILE_PANEL';
export class ProfilePanel {
    constructor() {
        this.currentPanel = null;
        this.isVisible = false;
        debug(FILE, '🔧 ProfilePanel class initialized');
        
        // Add debug function to window for emergency debugging
        window.debugProfilePanel = () => {
            debug(FILE, '🔍 ProfilePanel debug info:', {
                isVisible: this.isVisible,
                hasCurrentPanel: !!this.currentPanel,
                sidebarManager: !!window.SidebarManager,
                layoutController: !!window.layoutController,
                profileButtonExists: !!document.getElementById('profile-button'),
                savedLocationsPanel: !!document.getElementById('saved-locations-panel'),
                profilePanel: !!document.getElementById('profile-panel')
            });
            return 'Debug info logged to console';
        };
        
        // Begin trying to establish SidebarManager connection using ScriptInitManager
        this.ensureSidebarManager().then(sidebarManager => {
            if (sidebarManager) {
                debug(FILE, `✅ SidebarManager obtained successfully`);
            } else {
                debug(FILE, `⚠️ Failed to get SidebarManager`, 'warn');
            }
        });
        
        this.setupProfilePanelObserver();
    }
    
    setupProfilePanelObserver() {
        // Observe the sidebar container for changes
        const sidebarContainer = document.getElementById('sidebar-content-container');
        if (sidebarContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            if (node.id === 'profile-panel') {
                                debug(FILE, '🚨 PROFILE PANEL REMOVED FROM DOM!', {
                                    removedBy: 'Unknown',
                                    stackTrace: new Error().stack
                                }, 'error');
                            }
                        });
                        mutation.addedNodes.forEach((node) => {
                            if (node.id === 'profile-panel') {
                                debug(FILE, '✅ Profile panel added to DOM');
                            }
                        });
                    }
                });
            });
            
            observer.observe(sidebarContainer, {
                childList: true,
                subtree: true
            });
            
            debug(FILE, '👁️ Profile panel mutation observer setup');
        }
    }

    /**
     * Ensures that SidebarManager is available, waiting if necessary
     * @param {number} timeout - Maximum time to wait in milliseconds
     * @returns {Promise<object|null>} - SidebarManager or null if timed out
     */
    async ensureSidebarManager(timeout = 3000) {
        // Try to get SidebarManager from ScriptInitManager
        const sidebarManager = await ScriptInitManager.waitFor('SidebarManager', timeout);
        
        if (sidebarManager) {
            debug(FILE, '✅ SidebarManager obtained from ScriptInitManager');
            return sidebarManager;
        } 
        
        // Fallback to window.SidebarManager for backward compatibility
        if (window.SidebarManager) {
            debug(FILE, '✅ SidebarManager found on window object');
            return window.SidebarManager;
        }
        
        debug(FILE, '⚠️ Failed to obtain SidebarManager', 'warn');
        return null;
    }

    // This handles the profile button to get to the profile modal
    // where the user can edit their information.

    createProfilePanel(userInfo, isAdmin) {
    
        // Don't remove the existing profile panel container - just create content
        // The show() method will handle clearing and appending to the existing container

        /**
         * this creates the profile panel with edit/admin/logout. this is where the
         * the edit/admin tabs need to be added eventually. 
         */
        
        // Create the content wrapper (not the panel container itself)
        const content = document.createElement('div');
        content.className = 'profile-content';

        // User info sidebar
        const userInfoDiv = document.createElement('div');
        userInfoDiv.className = 'user-info-sidebar dynamic-profile-panel visible';

        // Profile identity
        const identity = document.createElement('div');
        identity.className = 'profile-identity';

        const details = document.createElement('div');
        details.className = 'profile-details';

        const name = document.createElement('h4');
        name.className = 'profile-name';
        name.id = 'profile-display-name';
        name.textContent = userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || userInfo.username : 'Loading...';

        // Create close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', async () => {
            // Get SidebarManager from ScriptInitManager
            const sidebarManager = await this.ensureSidebarManager();
            if (sidebarManager && sidebarManager.resetToInitialLayout) {
                sidebarManager.resetToInitialLayout();
            }
        });
        // add close button after 
        name.appendChild(closeBtn);

        const email = document.createElement('p');
        email.className = 'profile-email';
        email.id = 'profile-display-email';
        email.textContent = userInfo ? userInfo.email : 'Loading...';

        details.appendChild(name);
        
        details.appendChild(email);
        identity.appendChild(details);

        // Profile stats
        const stats = this.createElement('div', 'profile-stats');
        stats.appendChild(this.createStatItem('stat-item', 'saved-locations-count', '0', 'Locations'));
        stats.appendChild(this.createStatItem('stat-item', 'photos-count', '0', 'Photos'));

        // Profile actions
        const actions = document.createElement('div');
        actions.className = 'profile-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'profile-action-btn primary';
        editBtn.id = 'edit-profile-btn';
        editBtn.dataset.action = 'edit-profile';
        editBtn.textContent = '✏️ Edit Profile';

        const adminSection = document.createElement('div');
        adminSection.className = 'admin-section';
        
        // Only show admin button if user is admin
        if (isAdmin) {
            const adminBtn = document.createElement('button');
            adminBtn.className = 'profile-action-btn admin';
            adminBtn.dataset.action = 'admin-panel';
            adminBtn.textContent = '📊 Admin Panel';
            adminSection.appendChild(adminBtn);
        }

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'profile-action-btn logout';
        logoutBtn.dataset.action = 'logout';
        logoutBtn.textContent = '🚪 Logout';

        actions.appendChild(editBtn);
        actions.appendChild(adminSection);
        actions.appendChild(logoutBtn);

        // Profile footer
        const footer = document.createElement('div');
        footer.className = 'profile-footer';
        const small = document.createElement('small');
        small.textContent = 'Authenticated via Merkel Vision';
        footer.appendChild(small);

        // Assemble
        userInfoDiv.appendChild(identity);
        userInfoDiv.appendChild(stats);
        userInfoDiv.appendChild(actions);
        userInfoDiv.appendChild(footer);
        content.appendChild(userInfoDiv);

        // Setup event handlers for the content's buttons
        this.setupEventHandlers(content);
        
        // Return the content instead of a full panel container
        return content;
    }

    async handleAction(action) {

        // this could just be state manager
        const userInfo = await this.getCurrentUserInfo();
        if (!userInfo) {
            debug(FILE, '❌ No user info available for profile panel', 'warn');
            return;
            }
       // const isAdmin = await this.checkIfAdmin(userInfo);

        const modal = document.getElementById('profile-panel');

        if (!modal || !userInfo) {
            debug(FILE, '❌ Modal or user data not available', 'error');
            return;
            }

        switch (action) {
            case 'edit-profile':
                // Hide saved locations panel first
                this.hide();
                
                // In handleAction() method's edit-profile case
                await this.ensureSidebarManager();
                if (window.SidebarManager && window.SidebarManager.expandSidebarWide) {
                    window.SidebarManager.expandSidebarWide();
                } else {
                    debug(FILE, 'Edit-Profile SidebarManager Not Available', 'error');
                    // Fallback layout adjustment
                    const sidebar = document.getElementById('right-sidebar-overlay');
                    if (sidebar) sidebar.style.width = '70%';
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) mapContainer.style.width = '30%';
                }

                const userProfile = await this.fetchUserProfile();
                await this.createProfileForm(modal, userProfile.user);
                window.AuthModalService.setupProfileFormHandler();

                modal.style.display = 'block';
                modal.classList.add('active');
                break;

            case 'admin-panel':
                // Hide profile-panel
                this.hide();
                
                // In handleAction() method's admin-panel case
                await this.ensureSidebarManager();
                if (window.SidebarManager && window.SidebarManager.expandSidebarWide) {
                    window.SidebarManager.expandSidebarWide();
                } else {
                    debug(FILE, 'Admin Panel SidebarManager Not Available', 'error');
                    // Fallback layout adjustment
                    const sidebar = document.getElementById('right-sidebar-overlay');
                    if (sidebar) sidebar.style.width = '70%';
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) mapContainer.style.width = '30%';
                }
                    
                    
                try {
                    const { AuthAdminService } = await import('../modules/auth/AuthAdminService.js');
                    await AuthAdminService.showAdminPanel();
                } catch (error) {
                    debug(FILE, '❌ Failed to load admin panel:', error, 'error');
                }

                // hide saved locations
                this.hideSavedLocations();

                modal.style.display = 'block';
                modal.classList.add('active');

                break;
                
            case 'logout':
                if (window.Auth?.logout) {
                    try {
                        await window.Auth.logout();
                    } catch (error) {
                        debug(FILE, '❌ Logout error:', error, 'error');
                    }
                }
                this.hide();
                break;
                
            default:
                debug(FILE, `❓ Unknown profile action: ${action}`, 'warn');
                this.hide();
                break;
        }
    }

    // Get user info from your existing Auth system via main.js
    async getCurrentUserInfo() {
        try {
            if (window.StateManager) {
                const authState = window.StateManager.getAuthState();
                return authState?.currentUser || null;
            }
            
            // Check localStorage as fallback
            const storedUser = localStorage.getItem('currentUser');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            debug(FILE, 'Error getting user info:', error, 'error');
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
            debug(FILE, 'Error checking admin status:', error, 'error');
            return false;
        }
    }

    // Create admin section using secure DOM manipulation
    createAdminSection() {
        const adminDiv = document.createElement('div');
        adminDiv.className = 'admin-section';
        
        // Admin Panel Button
        const adminBtn = document.createElement('button');
        adminBtn.className = 'profile-action-btn admin';
        adminBtn.dataset.action = 'admin-panel';
        adminBtn.textContent = '📊 Admin Panel';
        
        adminDiv.appendChild(adminBtn);
        
        return adminDiv;
    }

    setupEventHandlers(panel) {
        const actionButtons = panel.querySelectorAll('[data-action]');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
              //e.stopPropagation();
                const action = e.target.closest('[data-action]').dataset.action;
                await this.handleAction(action);
            });
        });
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

            // HTTP Errors
            if (!response.ok) {
                throw new Error(`Failed to fetch profile: ${response.statusText}`);
                }

            // Parse the JSON response
            const data = await response.json();
            return data;

        } catch (error) {
            // 404, 500 errors
            debug(FILE, 'Error fetching user profile:', error, 'error');
            }
    }
    
    // creates Edit-Profile Form
    async createProfileForm(modal, user) {

        this.hideSavedLocations();
        
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
        closeBtn.addEventListener('click', async () => {
            // Restore sidebar to default app loading state when closing edit-profile
            await this.ensureSidebarManager();
            if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
                window.SidebarManager.resetToInitialLayout();
            } else {
                // Fallback layout reset
                const sidebar = document.getElementById('right-sidebar-overlay');
                if (sidebar) sidebar.style.width = '25%';
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer) mapContainer.style.width = '75%';
            }
            
            const modal = document.getElementById('edit-profile');
            if (modal) {
                modal.remove(); // Remove the entire modal
            }
            document.getElementById('profile-panel').style.display = 'none';
        });
        
        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Your Profile Info';
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        
        // Profile Information Section
        const profileInfoSection = document.createElement('div');
        profileInfoSection.id = 'profileInfo';
        profileInfoSection.className = 'profile-section';
        
        const profileInfoTitle = document.createElement('h3');
        profileInfoTitle.textContent = 'Profile Information';
        
        // Create the profile form using helper functions
        const profileForm = this.createElement('form', '', '', { id: 'profileFormElement' });
        
        // Add form fields using helper
        profileForm.appendChild(this.createFormGroup('Username:', 'text', 'profileUsername', user.username, true, 'Username must be 3-50 characters, letters, numbers, and underscores only'));
        profileForm.appendChild(this.createFormGroup('Email:', 'email', 'profileEmail', user.email, true));
        profileForm.appendChild(this.createFormGroup('First Name:', 'text', 'profileFirstName', user.firstName));
        profileForm.appendChild(this.createFormGroup('Last Name:', 'text', 'profileLastName', user.lastName));
        
        
        // Update Profile Button
        const updateBtn = this.createElement('button', 'auth-submit-btn', 'Update Profile', { type: 'submit' });
        profileForm.appendChild(updateBtn);
        
        profileInfoSection.appendChild(profileInfoTitle);
        profileInfoSection.appendChild(profileForm);
        
        // Password Change Section
        const passwordSection = this.createPasswordSection();

        const gpsSection = this.createGPSSection();
        
        // Add all sections to modal
        modalContent.appendChild(profileInfoSection);
        modalContent.appendChild(passwordSection);
        modalContent.appendChild(gpsSection);

        await this.updateGPSPermissionStatus();

        // Connect to main.js handler
        if (window.setupChangePasswordHandler) {
            window.setupChangePasswordHandler();
        }

    }

    // Create password requirements section
    // Create password section for profile form
    createPasswordSection() {
        const passwordSection = this.createElement('div', 'profile-section');
        const passwordTitle = this.createElement('h3', '', 'Change Password');
        const passwordForm = this.createElement('form', '', '', { id: 'changePasswordForm' });
        
        // Password fields
        const currentPassGroup = this.createPasswordField('currentPassword', 'Current Password:', 'current-password', 'Enter your current password to verify your identity');
        const newPassGroup = this.createNewPasswordField();
        const confirmPassGroup = this.createPasswordField('confirmNewPassword', 'Confirm New Password:', 'new-password');
        
        // Requirements and submit button
        const requirementsDiv = this.createPasswordRequirementsSection();
        const changePassBtn = this.createElement('button', 'auth-submit-btn', 'Change Password', { 
            type: 'submit', 
            id: 'changePasswordSubmitBtn',
            disabled: true 
        });
        
        // Assemble
        passwordForm.appendChild(currentPassGroup);
        passwordForm.appendChild(newPassGroup);
        passwordForm.appendChild(confirmPassGroup);
        passwordForm.appendChild(requirementsDiv);
        passwordForm.appendChild(changePassBtn);
        
        passwordSection.appendChild(passwordTitle);
        passwordSection.appendChild(passwordForm);
        
        return passwordSection;
    }

    // creates GPS Section
    createGPSSection() {
        // GPS Section
        const   gpsContainer = document.createElement('div');
                gpsContainer.className = 'profile-section';

            // child to container
            const   gpsHeader = document.createElement('h3');
                    gpsHeader.textContent = 'Location Preferences';

            // child to container
            const   gpsFormGroup1 = document.createElement('div');
                    gpsFormGroup1.className = 'form-group';

                // child to form group
                const   gpsFormGroup1label = document.createElement('label');
                        gpsFormGroup1label.textContent = 'GPS Permission Preference:';

                // child to form group
                const   gpsPermissonSection = document.createElement('span');
                        gpsPermissonSection.id = 'gpsPermissionStatus';
                        gpsPermissonSection.className = 'permission-status';
                        gpsPermissonSection.textContent = 'Checking...';


                            // append to form group 1
                            gpsFormGroup1.appendChild(gpsFormGroup1label);
                            gpsFormGroup1.appendChild(gpsPermissonSection);

                    // child to container
            const   gpsFormGroup2 = document.createElement('div');
                    gpsFormGroup2.className = 'form-group';

                        //child to form group 2
                const   gpsFormGroup2label = document.createElement('label');
                        gpsFormGroup2label.textContent = 'GPS Permission Controls:';

                        // child to form group 2
                const   gpsControls = document.createElement('div');
                        gpsControls.className = 'gps-controls';

                            // child to gpsControls
                            // Added the listener directly. 9-14-2025
                    const   grantGpsBtn = document.createElement('button');
                            grantGpsBtn.id = 'grantGpsBtn';
                            grantGpsBtn.className = 'gps-control-btn grant';
                            grantGpsBtn.textContent = 'Grant Permission';
                            grantGpsBtn.addEventListener('click', async () => {
                                await this.updateGPSPermission('granted');
                                });

                    const   denyGpsBtn = document.createElement('button');
                            denyGpsBtn.id = 'denyGpsBtn';
                            denyGpsBtn.className = 'gps-control-btn deny';
                            denyGpsBtn.textContent = 'Deny Permission';
                            denyGpsBtn.addEventListener('click', async () => {
                                await this.updateGPSPermission('denied');
                                });

                    const   resetGpsBtn = document.createElement('button');
                            resetGpsBtn.id = 'resetGpsBtn';
                            resetGpsBtn.className = 'gps-control-btn reset';
                            resetGpsBtn.textContent = 'Reset Permission';
                            resetGpsBtn.addEventListener('click', async () => {
                                await this.updateGPSPermission('not_asked');
                            });

                            // append buttons to gps controls
                            gpsControls.appendChild(grantGpsBtn);
                            gpsControls.appendChild(denyGpsBtn);
                            gpsControls.appendChild(resetGpsBtn);

                    // append to form group 2
                    gpsFormGroup2.appendChild(gpsFormGroup2label);
                    gpsFormGroup2.appendChild(gpsControls);

                    const gpsInfo = document.createElement('p');
                    gpsInfo.className = 'gps-info';
                    gpsInfo.textContent = '📍 GPS Permission: Gives App Permission to Use Your Device GPS';

                    // append to container 
                    gpsContainer.appendChild(gpsHeader);
                    gpsContainer.appendChild(gpsFormGroup1);
                    gpsContainer.appendChild(gpsFormGroup2);
                    gpsContainer.appendChild(gpsInfo);

        return gpsContainer;
    }

    // Create password field helper
    createPasswordField(id, labelText, autocomplete, helpText = '') {
        const group = this.createElement('div', 'form-group');
        const label = this.createElement('label', '', labelText, { for: id });
        const input = this.createElement('input', '', '', { 
            type: 'password', 
            id, 
            name: id,
            required: true,
            autocomplete 
        });
        
        group.appendChild(label);
        group.appendChild(input);
        
        if (helpText) {
            const helpDiv = this.createElement('div', 'password-help');
            const small = this.createElement('small', '', helpText);
            helpDiv.appendChild(small);
            group.appendChild(helpDiv);
        }
        
        return group;
    }

    // Create new password field with strength meter
    createNewPasswordField() {
        const group = this.createElement('div', 'form-group');
        const label = this.createElement('label', '', 'New Password:', { for: 'newPassword' });
        const input = this.createElement('input', '', '', { 
            type: 'password', 
            id: 'newPassword',
            name: 'newPassword',
            required: true,
            autocomplete: 'new-password'
        });
        
        // Strength meter
        const strengthContainer = this.createElement('div', 'password-strength-container');
        const strengthMeter = this.createElement('div', 'password-strength-meter');
        const strengthBar = this.createElement('div', 'password-strength-bar', '', { id: 'passwordStrengthBar' });
        const strengthText = this.createElement('div', 'password-strength-text', 'Password strength will appear here', { id: 'passwordStrengthText' });
        
        strengthMeter.appendChild(strengthBar);
        strengthContainer.appendChild(strengthMeter);
        strengthContainer.appendChild(strengthText);
        
        group.appendChild(label);
        group.appendChild(input);
        group.appendChild(strengthContainer);
        
        return group;
    }

    createPasswordRequirementsSection() {
        const requirementsDiv = this.createElement('div', 'password-requirements-enhanced');
        const title = this.createElement('h4', '', 'Password Requirements:');
        const requirementList = this.createElement('div', 'requirement-list');
        
        const requirements = [
            { id: 'req-length', text: 'At least 8 characters long' },
            { id: 'req-uppercase', text: 'One uppercase letter (A-Z)' },
            { id: 'req-lowercase', text: 'One lowercase letter (a-z)' },
            { id: 'req-number', text: 'One number (0-9)' },
            { id: 'req-special', text: 'One special character (!@#$%^&*)' }
        ];
        
        requirements.forEach(req => {
            const reqItem = this.createElement('div', 'requirement-item', '', { id: req.id });
            reqItem.appendChild(this.createElement('span', 'requirement-icon', '⚪'));
            reqItem.appendChild(this.createElement('span', 'requirement-text', req.text));
            requirementList.appendChild(reqItem);
        });
        
        // Security notes (simplified)
        const securityNotes = this.createElement('div', 'security-notes');
        securityNotes.innerHTML = '<p><strong>Security Notes:</strong></p><ul><li>Consider using a password manager for stronger security</li><li>Longer passwords with variety are more secure</li></ul>';
        
        requirementsDiv.appendChild(title);
        requirementsDiv.appendChild(requirementList);
        requirementsDiv.appendChild(securityNotes);
        
        return requirementsDiv;
    }

    // Helper functions
    loadProfileStats() {

        const extra = window.StateManager.getStateSummary().savedLocationsCount;

            // Load saved locations count
            try {
                const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
                const countElement = document.getElementById('saved-locations-count');
                
                if (countElement) {
                   // countElement.textContent = savedLocations.length;
                    countElement.textContent = extra;
                    }

            } catch (error) {
                debug(FILE, 'Error loading location count:', error, 'error');
                }
            
            // Mock photo count for now
            const photoCountElement = document.getElementById('photos-count');
            if (photoCountElement) {
                photoCountElement.textContent = '0';
                }

    }

    /**
     * Update user's GPS permission status
     */
    async updateGPSPermission(permission) {

        try {
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
            debug(FILE, '❌ Error updating GPS permission:', error, 'error');
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
        const gpsService = window.GPSPermissionService;
            if (!gpsService) {
                debug(FILE, '❌ GPS Permission Service not available', 'error');
                return;
                }

        const statusElement = document.getElementById('gpsPermissionStatus');
            if (!statusElement) {
                debug(FILE, '⚠️ GPS status element not found', 'warn');
                return;
                }   
        
        try {
            const status = await gpsService.getCurrentGPSPermissionStatus();
            const formattedStatus = status ? status.charAt(0).toUpperCase() 
            + status.slice(1).replace('_', ' ') : 'Unknown';
            statusElement.textContent = formattedStatus;
            statusElement.className = `permission-status ${status ? status.replace('_', '-') : 'unknown'}`;
        
        } catch (error) {
            debug(FILE, '❌ Error updating GPS permission status:', error, 'error');
            }
    }

    async toggle() {
        // Check if profile panel has content instead of internal state
        const profilePanel = document.getElementById('profile-panel');
        const isVisible = profilePanel && profilePanel.children.length > 0;
        
        if (isVisible) {
            this.hide();
        } else {
            await this.show();
        }
    }

    async hide() {
        const profilePanel = document.getElementById('profile-panel');

        if (profilePanel) {
            // Remove all content from profile panel
            while (profilePanel.firstChild) {
                profilePanel.removeChild(profilePanel.firstChild);
                }
            
            // Hide profile panel
            profilePanel.style.display = 'none';
            profilePanel.classList.remove('active');
            }
            
            await this.ensureSidebarManager();
            if (window.SidebarManager && window.SidebarManager.resetToInitialLayout) {
                window.SidebarManager.resetToInitialLayout();
            } else {
                debug(FILE, '⚠️ Could not reset layout - SidebarManager unavailable', 'warn');
                // Fallback layout reset
                const sidebar = document.getElementById('right-sidebar-overlay');
                if (sidebar) sidebar.style.width = '25%';
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer) mapContainer.style.width = '75%';
            }

            this.currentPanel = null;
            this.isVisible = false;
            debug(FILE, '✅ Profile panel hidden');
        }

    async show() {
            const notice = document.getElementById('notification-confirm');
                if(notice){
                    notice.remove();
                    }

            const sidebarContainer = document.getElementById('sidebar-content-container');
            // closes all active panels
            if (sidebarContainer) {
                const activePanels = sidebarContainer.querySelectorAll('.active');
                    activePanels.forEach(panel => {
                        debug(FILE, '>>>>>>>>. ' + panel.id);
                        panel.classList.remove('active');
                        panel.style = '';
                        // only remove first childs not of saved-locations-panel
                        if(panel.id != 'saved-locations-panel'){
                            while(panel.firstChild) {
                                panel.removeChild(panel.firstChild);
                                }
                            }
                        
                    
                    });
                }
            
        debug(FILE, '🔍 ProfilePanel.show() called');
        // Get the dedicated profile panel container
        let profilePanel = document.getElementById('profile-panel');
        if (!profilePanel) {
            debug(FILE, '❌ Profile-Panel NOT FOUND', 'error');
            return;
            }
        // clear any child of profile-panel
        debug(FILE, '🔍 Clearing existing content from profile panel');
        while (profilePanel.firstChild) {
            profilePanel.removeChild(profilePanel.firstChild);
            }
         
        // this could just be state manager
        const userInfo = await this.getCurrentUserInfo();
        if (!userInfo) {
            debug(FILE, '❌ No user info available for profile panel', 'warn');
            return;
            }
        const isAdmin = await this.checkIfAdmin(userInfo);

        this.hideSavedLocations();
        
        // Create and append profile content
        this.currentPanel = this.createProfilePanel(userInfo, isAdmin);        
        profilePanel.appendChild(this.currentPanel);
        // Show the profile panel
        profilePanel.style.display = 'block';
        profilePanel.classList.add('active');
        debug(FILE, '🔍 Creating profile content');

    // Expand sidebar wide for better admin experience
    await this.ensureSidebarManager();
    if (window.SidebarManager && window.SidebarManager.expandSidebarWide) {
        window.SidebarManager.expandSidebarWide();
    } else {
        debug(FILE, '⚠️ Could not expand sidebar - SidebarManager unavailable', 'warn');
        // Fallback layout adjustment
        const sidebar = document.getElementById('right-sidebar-overlay');
        if (sidebar) sidebar.style.width = '70%';
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) mapContainer.style.width = '30%';
    }
        
        this.isVisible = true;
        
        debug(FILE, '✅ Profile panel shown successfully');
        
        this.loadProfileStats();

        // Final verification
        setTimeout(() => {
            const verifyPanel = document.getElementById('profile-panel');
            debug(FILE, '🔍 Final verification - Profile panel still exists:', !!verifyPanel);
            if (verifyPanel) {
                debug(FILE, '🔍 Final verification - Profile panel children count:', verifyPanel.children.length);
                debug(FILE, '🔍 Final verification - Profile panel parent:', verifyPanel.parentElement.id);
            }
        }, 100);
    }

    hideSavedLocations(){
         // Hide saved locations panel
        const savedLocationsPanel = document.getElementById('saved-locations-panel');
        if (savedLocationsPanel) {
            savedLocationsPanel.style.display = 'none';
            savedLocationsPanel.classList.remove('active');
            debug(FILE, '🔍 Saved locations panel hidden');
        }
    }

    showSavedLocations() {
        const savedLocationsPanel = document.getElementById('saved-locations-panel');
        if (savedLocationsPanel) {
            savedLocationsPanel.style.display = 'block';
            savedLocationsPanel.classList.add('active');
        }
    }

      //// Helper functions ////////////
    
    // Generic DOM element creator to reduce repetitive code
    createElement(tag, className = '', textContent = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }

    // Create form group helper
    createFormGroup(labelText, inputType, inputId, inputValue = '', required = false, helpText = '') {
        const group = this.createElement('div', 'form-group');
        const label = this.createElement('label', '', labelText, { for: inputId });
        const input = this.createElement('input', '', '', { 
            type: inputType, 
            id: inputId, 
            name: inputId.replace('profile', '').toLowerCase(),
            value: SecurityUtils.escapeHtml(inputValue || ''),
            ...(required && { required: true })
        });
        
        group.appendChild(label);
        group.appendChild(input);
        
        if (helpText) {
            const help = this.createElement('small', 'form-help', helpText);
            group.appendChild(help);
        }
        
        return group;
    }

    // Create stat item helper
    createStatItem(className, id, count, label) {
        const statItem = this.createElement('div', 'stat-item');
        const statNum = this.createElement('span', 'stat-number', count, { id });
        const statLabel = this.createElement('span', 'stat-label', label);
        statItem.appendChild(statNum);
        statItem.appendChild(statLabel);
        return statItem;
    }
}