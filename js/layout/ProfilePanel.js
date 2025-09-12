// Dynamic Profile Panel that integrates with your existing Auth system
import { SecurityUtils } from '../utils/SecurityUtils.js';

export class ProfilePanel {
    constructor() {
        this.currentPanel = null;
        this.isVisible = false;
        console.log('🔧 ProfilePanel class initialized');
        
        // Add debug function to window for emergency debugging
        window.debugProfilePanel = () => {
            console.log('🔍 ProfilePanel debug info:', {
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
    }

    // This handles the profile button to get to the profile modal
    // where the user can edit their information.

    createProfilePanel(userInfo, isAdmin) {
        return this.createProfilePanelDOM(userInfo, isAdmin);
    }

    createProfilePanelDOM(userInfo, isAdmin) {
        // Remove any existing profile panel
        const oldPanel = document.getElementById('profile-panel');
        if (oldPanel) oldPanel.remove();

        // Create the panel container
        const panel = document.createElement('div');
        panel.id = 'profile-panel';
        panel.className = 'sidebar-panel active';
        panel.style.display = 'block';

        // Profile content wrapper
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
        panel.appendChild(content);

        // Setup event handlers for the panel's buttons
        this.setupEventHandlers(panel);
        
        // Return the panel instead of appending directly
        return panel;
    }

    async handleAction(action) {
        const authState = window.StateManager?.getAuthState();
        const user = authState?.currentUser;
        const modal = document.getElementById('sidebar-content-container');

        if (!modal || !user) {
            console.error('❌ Modal or user data not available');
            return;
        }

        switch (action) {
            case 'edit-profile':
                // Expand sidebar wide for better editing experience
                if (window.SidebarManager?.expandWide) {
                    window.SidebarManager.expandWide();
                }

                const userProfile = await this.fetchUserProfile();
                await this.createProfileForm(modal, userProfile.user);
                window.AuthModalService.setupProfileFormHandler();

                modal.style.display = 'block';
                modal.classList.add('show');
                this.hide();
                break;

            case 'admin-panel':
                // Expand sidebar wide for better admin experience
                if (window.SidebarManager?.expandWide) {
                    window.SidebarManager.expandWide();
                }

                try {
                    const { AuthAdminService } = await import('../modules/auth/AuthAdminService.js');
                    await AuthAdminService.showAdminPanel();
                } catch (error) {
                    console.error('❌ Failed to load admin panel:', error);
                }

                modal.style.display = 'block';
                modal.classList.add('show');
                this.hide();
                break;
                
            case 'logout':
                if (window.Auth?.logout) {
                    try {
                        await window.Auth.logout();
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

        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }
    

    // Create dynamic profile form
    async createProfileForm(modal, user) {
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
            // Restore sidebar to default app loading state when closing edit-profile
            if (window.SidebarManager && window.SidebarManager.restoreToDefault) {
                window.SidebarManager.restoreToDefault();
            }
            
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
        
        // Add all sections to modal
        modalContent.appendChild(profileInfoSection);
        modalContent.appendChild(passwordSection);
        
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

    async toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            await this.show();
        }
    }

    async show() {
        const userInfo = await this.getCurrentUserInfo();
        if (!userInfo) {
            console.warn('❌ No user info available for profile panel');
            return;
        }
        
        const isAdmin = await this.checkIfAdmin(userInfo);
        
        // Hide saved locations panel first
        const savedLocationsPanel = document.getElementById('saved-locations-panel');
        if (savedLocationsPanel) {
            savedLocationsPanel.style.display = 'none';
            savedLocationsPanel.classList.remove('active');
        }
        
        // Create dynamic panel
        this.currentPanel = this.createProfilePanel(userInfo, isAdmin);
        
        // Add to DOM
        const sidebarContainer = document.getElementById('sidebar-content-container');
        if (sidebarContainer) {
            sidebarContainer.appendChild(this.currentPanel);
            
            // Update sidebar title
            const sidebarTitle = document.getElementById('sidebar-title');
            if (sidebarTitle) {
                sidebarTitle.textContent = '👤 User Profile';
            }
            
            // Animate in
            setTimeout(() => {
                this.currentPanel.classList.add('visible', 'active');
                this.currentPanel.style.display = 'block';
                this.isVisible = true;
            }, 10);
        } else {
            console.error('❌ Sidebar container not found for panel attachment');
        }
    }

    hide() {
        if (this.currentPanel) {
            this.currentPanel.classList.remove('visible', 'active');
            
            if (this.currentPanel.parentNode) {
                this.currentPanel.remove();
            }
            this.currentPanel = null;
        }
        
        this.isVisible = false;
    }


}