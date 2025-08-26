// Import centralized state management
import { StateManager, StateDebug } from './modules/state/AppState.js';

// Import security utilities
import { SecurityUtils } from './utils/SecurityUtils.js';

// Import Auth module for centralized authentication
import { Auth } from './modules/auth/Auth.js';

// Import environment configuration
import { environment } from './modules/config/environment.js';

console.log('🔍 Environment import status:', { environment, hasCache: !!environment?.CACHE_CONFIG });

// Import maps modules (Phase 3)
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { ClickToSaveService } from './modules/maps/ClickToSaveService.js';
import { GPSPermissionService } from './modules/maps/GPSPermissionService.js';
import MapControlsManager from './modules/maps/MapControlsManager.js?v=fixed-regex';

// Import locations modules (Phase 4 - STREAMLINED!)
import { Locations } from './modules/locations/Locations.js';

/**
 * Initialize the application modules
 * This function is called by the global initMap function in initMap.js
 */

/**
 * Initialize all application modules in the correct order
 * Optimized for faster loading and better user experience
 */
async function initializeAllModules() {
    try {
        // Environment-aware cache management with defensive checks
        console.log('🌍 Environment loaded:', environment);
        
        if (!environment) {
            console.error('❌ Environment configuration not loaded');
            throw new Error('Environment configuration not available');
        }
        
        if (!environment.CACHE_CONFIG) {
            console.error('❌ Environment CACHE_CONFIG not found');
            throw new Error('Cache configuration not available');
        }
        
        if (environment.CACHE_CONFIG.CLEAR_ON_LOAD) {
            console.log('🧹 Development mode: Clearing caches for fresh state');
            await clearDevelopmentCaches();
        } else {
            console.log('🧹 Production mode: Managing cache versions');
            await manageProductionCaches();
        }
        
        console.log('📦 Loading application modules...');
        
        // Phase 2: Authentication modules - Fast initialization
        console.log('🔐 Initializing authentication...');
        await Auth.initialize();
        
        // Validate authentication state
        const authState = StateManager.getAuthState();
        const currentUser = authState?.currentUser;
        
        console.log('🔍 AUTH STATE DEBUG AFTER INIT:');
        console.log('  - Auth state object:', authState);
        console.log('  - Current user:', currentUser);
        console.log('  - Auth token present:', !!authState?.authToken);
        console.log('  - User ID:', authState?.currentUserId);
        
        if (currentUser) {
            console.log('✅ Authenticated user found:', currentUser.email || currentUser.username);
            
            // Force UI update to make sure user info shows
            const { AuthUICore } = await import('./modules/auth/AuthUICore.js');
            console.log('🎨 Forcing UI update after initialization...');
            AuthUICore.updateAuthUI();
        } else {
            console.log('⚠️ No authenticated user found');
            
            // Check if we have a token but no user (this indicates a problem)
            const token = Auth.getToken();
            if (token) {
                console.error('🚨 ISSUE: Have auth token but no user data');
                console.error('🚨 Token length:', token.length, 'characters (token not logged for security)');
                console.error('🚨 This suggests auth verification failed');
            }
        }
        
        // Phase 3: Initialize core map services in parallel for faster loading
        console.log('�️ Initializing map services...');
        await Promise.all([
            SearchService.initialize(),
            SearchUI.initialize(),
            MarkerService.initialize(),
            ClickToSaveService.initialize()
        ]);
        
        // Phase 4: Initialize locations system (depends on authenticated state)
        console.log('📍 Initializing locations...');
        await Locations.initialize();
        
        // IMPORTANT: Export services to window BEFORE setting up event handlers
        // This ensures MapControlsManager can access them during initialization
        console.log('🌐 Exporting services to window object...');
       
    
        window.StateManager = StateManager;
        window.StateDebug = StateDebug;
        window.Auth = Auth;
        
        // Access services through Auth coordinator
        const authServices = Auth.getServices();
        window.AuthService = authServices.AuthService;
        window.AuthUICore = authServices.AuthUICore;
        window.AuthModalService = authServices.AuthModalService;
        window.AuthNotificationService = authServices.AuthNotificationService;
        
        // Export map services
        window.MapService = MapService;
        window.SearchService = SearchService;
        window.SearchUI = SearchUI;
        window.MarkerService = MarkerService;
        window.ClickToSaveService = ClickToSaveService;
        window.GPSPermissionService = GPSPermissionService;
       
        window.initializeAllModules = initializeAllModules;
        
        // Setup inter-module event handlers
        setupEventHandlers();
        
        console.log('✅ All modules initialized successfully');
        
        // Test server connection in background (non-blocking)
        setTimeout(async () => {
            try {
                const isConnected = await window.testServerConnection();
                if (!isConnected) {
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification('Server connection issues detected. Some features may not work properly.', 'warning');
                }
            } catch (error) {
                console.error('Error testing server connection:', error);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error initializing modules:', error);
        showErrorNotification('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Clear caches in development mode for fresh testing
 * Only runs when isDevelopment is true
 */
async function clearDevelopmentCaches() {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            
            if (cacheNames.length > 0) {
                console.log(`🧹 Found ${cacheNames.length} cache(s) to clear:`, cacheNames);
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('✅ Development caches cleared successfully');
            } else {
                console.log('ℹ️ No caches found to clear');
            }
        } else {
            console.log('ℹ️ Cache API not supported');
        }
        
        // Also clear any lingering service workers in development
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            if (registrations.length > 0) {
                console.log(`🧹 Found ${registrations.length} service worker(s) to clean up`);
                
                for (let registration of registrations) {
                    console.log(`🗑️ Removing service worker: ${registration.scope}`);
                    await registration.unregister();
                }
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error during development cache cleanup:', error);
        // Don't fail the app if cache cleanup fails
    }
}

/**
 * Production cache management for deployment
 * Handles versioned cache cleanup and optimization
 */
async function manageProductionCaches() {
    if (!('caches' in window)) {
        return; // Cache API not supported
    }
    
    try {
        const APP_VERSION = environment.APP_VERSION;
        const CURRENT_CACHE_PREFIX = `app-cache-${APP_VERSION}`;
        const cacheConfig = environment.CACHE_CONFIG;
        
        const cacheNames = await caches.keys();
        
        // Find old app caches (different versions)
        const oldAppCaches = cacheNames.filter(name => 
            name.startsWith('app-cache-') && !name.startsWith(CURRENT_CACHE_PREFIX)
        );
        
        if (oldAppCaches.length > 0) {
            console.log(`🧹 Cleaning ${oldAppCaches.length} old cache version(s):`, oldAppCaches);
            await Promise.all(oldAppCaches.map(name => caches.delete(name)));
            console.log('✅ Old cache versions cleaned up');
        }
        
        // Clean up caches with configured prefixes
        if (cacheConfig.CLEANUP_PREFIXES) {
            const tempCaches = cacheNames.filter(name => 
                cacheConfig.CLEANUP_PREFIXES.some(prefix => name.includes(prefix))
            );
            
            if (tempCaches.length > 0) {
                console.log(`🧹 Cleaning ${tempCaches.length} temporary cache(s):`, tempCaches);
                await Promise.all(tempCaches.map(name => caches.delete(name)));
                console.log('✅ Temporary caches cleaned up');
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error during production cache management:', error);
        // Don't fail the app if cache management fails
    }
}

/**
 * Setup inter-module event handlers for communication
 */
function setupEventHandlers() {
    // Search event handlers
    setupSearchEventHandlers();
    
    // Click-to-save event handlers
    setupClickToSaveEventHandlers();
    
    // Initialize unified map controls (replaces GPS setup)
    console.log('🗺️ Initializing map controls...');
    MapControlsManager.initialize();
    
    // Filter control event handlers
    setupFilterEventHandlers();
    
    // UI enhancement handlers
    setupUIEnhancements();
    
    console.log('✅ Inter-module event handlers setup complete');
}

/**
 * REMOVED: ensureGPSButtonExists() and setupGPSEventHandlers()
 * These functions have been replaced by MapControlsManager.initialize()
 * MapControlsManager provides unified, secure control management
 * See: js/modules/maps/MapControlsManager.js
 */

/**
 * Setup GPS permission handlers in profile modal
 */
function setupProfileGPSHandlers() {
    const grantGpsBtn = document.getElementById('grantGpsBtn');
    const denyGpsBtn = document.getElementById('denyGpsBtn');
    const resetGpsBtn = document.getElementById('resetGpsBtn');
    
    if (grantGpsBtn) {
        grantGpsBtn.addEventListener('click', async () => {
            await updateGPSPermission('granted');
        });
    }
    
    if (denyGpsBtn) {
        denyGpsBtn.addEventListener('click', async () => {
            await updateGPSPermission('denied');
        });
    }
    
    if (resetGpsBtn) {
        resetGpsBtn.addEventListener('click', async () => {
            await updateGPSPermission('not_asked');
        });
    }
    
    // Update GPS status when profile modal opens
    const profileBtn = document.getElementById('profileBtn' || 'profile-button');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            setTimeout(updateGPSPermissionStatus, 100); // Small delay for modal to open
        });
    }
}

/**
 * Update user's GPS permission status
 */
async function updateGPSPermission(permission) {
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
            await updateGPSPermissionStatus();
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
async function updateGPSPermissionStatus() {
    try {
        if (!window.GPSPermissionService) {
            return;
        }
        
        const status = await window.GPSPermissionService.getCurrentGPSPermissionStatus();
        const statusElement = document.getElementById('gpsPermissionStatus');
        
        if (statusElement) {
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
            statusElement.className = `permission-status ${status.replace('_', '-')}`;
        }
        
    } catch (error) {
        console.error('❌ Error updating GPS permission status:', error);
    }
}

/**
 * Setup change password form handler in profile modal
 * PHASE 1: Migrated to PasswordUIService for centralized UI handling
 */
async function setupChangePasswordHandler() {
    try {
        // Import the new PasswordUIService
        const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
        
        // Initialize the service
        PasswordUIService.initialize();
        
        // Get Auth notification services for error/success display
        const { AuthNotificationService } = Auth.getServices();
        
        // Setup the password form with centralized UI service
        PasswordUIService.setupChangePasswordHandler({
            Auth: Auth,
            showError: (message) => {
                AuthNotificationService.showNotification(message, 'error');
            },
            showSuccess: (message) => {
                AuthNotificationService.showNotification(message, 'success');
            }
        });
        
        console.log('✅ Password UI handler setup via PasswordUIService');
        
    } catch (error) {
        console.error('❌ Error setting up password UI handler:', error);
        
        // Fallback to legacy implementation if PasswordUIService fails
        console.warn('⚠️ Falling back to legacy password handler');
        setupChangePasswordHandlerLegacy();
    }
}

/**
 * Legacy password handler (fallback only)
 * @deprecated Use PasswordUIService.setupChangePasswordHandler instead
 */
function setupChangePasswordHandlerLegacy() {
    const form = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const submitButton = document.getElementById('changePasswordSubmitBtn');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');

    // Update password requirements visual indicators
    function updateRequirementIndicators(password) {
        // Use centralized Auth service for updating indicators
        Auth.updateRequirementIndicators(password);
    }

    // Update password strength meter with enhanced feedback and security warnings
    function updatePasswordStrength(password) {
        // Use centralized password analysis
        const analysis = Auth.analyzePasswordStrength(password);
        
        // Update strength bar with animated gradient
        if (strengthBar) {
            strengthBar.style.width = `${analysis.score}%`;
            strengthBar.style.backgroundColor = analysis.color;
            strengthBar.style.backgroundPosition = `${100 - analysis.score}% 0`;
        }
        
        // Update strength text with detailed information and security warnings
        if (strengthText) {
            if (password === '') {
                strengthText.innerHTML = '<span class="password-placeholder">Password strength will appear here</span>';
            } else {
                const entropyText = analysis.entropy > 0 ? ` (${Math.round(analysis.entropy)} bits entropy)` : '';
                let strengthHTML = `
                    <div class="password-strength-header">
                        <strong class="password-strength-level" data-color="${SecurityUtils.escapeHtmlAttribute(analysis.color)}">Strength: ${SecurityUtils.escapeHtml(analysis.strength.toUpperCase())}</strong> 
                        <span class="password-entropy-info">${SecurityUtils.escapeHtml(entropyText)}</span>
                    </div>
                `;
                
                // Add missing requirements
                if (analysis.feedback.length > 0) {
                    strengthHTML += `<div class="password-missing-requirements">
                        ⚠️ Missing: ${SecurityUtils.escapeHtml(analysis.feedback.join(', '))}
                    </div>`;
                }
                
                // Add security warnings
                if (analysis.securityWarnings && analysis.securityWarnings.length > 0) {
                    strengthHTML += `<div class="password-security-warning">
                        🚨 Security Issues: ${SecurityUtils.escapeHtml(analysis.securityWarnings.join(', '))}
                    </div>`;
                }
                
                // Add security recommendation based on entropy and analysis
                if (analysis.entropy < 50 && password.length > 0) {
                    strengthHTML += `<div class="password-recommendation-weak">
                        ⚠️ Consider a longer or more complex password
                    </div>`;
                } else if (analysis.entropy >= 70 && analysis.score >= 80 && analysis.securityWarnings.length === 0) {
                    strengthHTML += `<div class="password-recommendation-excellent">
                        ✅ Excellent security level - this password is very secure
                    </div>`;
                } else if (analysis.score >= 70 && analysis.securityWarnings.length === 0) {
                    strengthHTML += `<div class="password-recommendation-good">
                        ✅ Good security level
                    </div>`;
                }
                
                strengthText.innerHTML = strengthHTML;
                
                // Set the dynamic color for the strength level element
                const strengthLevelElement = strengthText.querySelector('.password-strength-level');
                if (strengthLevelElement) {
                    strengthLevelElement.style.color = analysis.color;
                }
            }
        }
        
        // Update requirement indicators
        updateRequirementIndicators(password);
        
        // Add visual feedback for password strength with security considerations
        const passwordField = document.getElementById('newPassword');
        if (passwordField && password.length > 0) {
            if (analysis.score >= 80 && analysis.securityWarnings.length === 0) {
                passwordField.style.borderColor = '#28a745';
                passwordField.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
            } else if (analysis.score >= 60 && analysis.securityWarnings.length === 0) {
                passwordField.style.borderColor = '#ffc107';
                passwordField.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.1)';
            } else {
                passwordField.style.borderColor = '#dc3545';
                passwordField.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
            }
        } else if (passwordField) {
            passwordField.style.borderColor = '';
            passwordField.style.boxShadow = '';
        }
    }

    // Check if form is valid for submission
    function checkFormValidity() {
        if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput || !submitButton) {
            return false;
        }
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Use centralized Auth validation
        const validation = Auth.validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
        
        submitButton.disabled = !validation.isValid;
        
        // Update confirm password field styling
        if (confirmPassword !== '') {
            if (validation.passwordsMatch) {
                confirmPasswordInput.style.borderColor = '#28a745';
                confirmPasswordInput.style.backgroundColor = '#f8fff9';
            } else {
                confirmPasswordInput.style.borderColor = '#dc3545';
                confirmPasswordInput.style.backgroundColor = '#fff8f8';
            }
        } else {
            confirmPasswordInput.style.borderColor = '';
            confirmPasswordInput.style.backgroundColor = '';
        }
        
        return validation.isValid;
    }

    // Real-time validation event listeners
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
            checkFormValidity();
        });
    }

    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('input', function() {
            checkFormValidity();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            checkFormValidity();
        });
    }

    // Form submission handler
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Validate using centralized Auth validation
            const validation = Auth.validatePasswordChangeForm(currentPassword, newPassword, confirmPassword);
            
            if (!validation.currentPasswordValid) {
                showPasswordError('Current password does not meet security requirements: ' + validation.errors.current.join(', '));
                return;
            }
            
            if (!validation.newPasswordValid) {
                showPasswordError('New password does not meet security requirements: ' + validation.errors.new.join(', '));
                return;
            }
            
            if (!validation.passwordsMatch) {
                showPasswordError(validation.errors.match);
                return;
            }
            
            if (!validation.passwordsDifferent) {
                showPasswordError(validation.errors.different);
                return;
            }
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.textContent = 'Changing Password...';
            
            try {
                // Use the AuthService to change password
                const { AuthService } = await import('./modules/auth/AuthService.js');
                const result = await AuthService.changePassword(currentPassword, newPassword);
                
                if (result?.success) {
                    const successMessage = '🎉 Password changed successfully! 📧 A security notification has been sent to your email.';
                    showPasswordSuccess(successMessage);
                    
                    // Add email confirmation details
                    setTimeout(() => {
                        const successDiv = document.getElementById('changePasswordSuccess');
                        if (successDiv) {
                            const emailConfirm = document.createElement('div');
                            emailConfirm.style.cssText = 'font-size: 12px; color: #6c757d; margin-top: 8px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #17a2b8;';
                            SecurityUtils.setTextContent(emailConfirm, '📬 Check your inbox for a security notification about this password change.');
                            successDiv.appendChild(emailConfirm);
                        }
                    }, 1000);
                    
                    form.reset();
                    updatePasswordStrength('');
                    
                    // Close modal after successful change with proper cleanup
                    setTimeout(async () => {
                        const { AuthModalService } = await import('./modules/auth/AuthModalService.js');
                        AuthModalService.hideProfileModal();
                    }, 3000);
                } else {
                    showPasswordError(result?.message || 'Failed to change password');
                }
            } catch (error) {
                console.error('Password change error:', error);
                showPasswordError('Network error. Please try again.');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Change Password';
                checkFormValidity(); // Re-check form validity
            }
        });
    }
    
    console.log('✅ Legacy password form handler attached');
}

//=====================================================================
// PHASE 2 CLEANUP: PASSWORD FUNCTIONS REMOVED
// All password UI logic has been moved to PasswordUIService.js
// The following functions have been removed to eliminate duplication:
// - handleChangePasswordSubmit() -> Use PasswordUIService methods
// - showPasswordError() -> Use PasswordUIService.showPasswordError()
// - getOrCreatePasswordMessageDiv() -> Use PasswordUIService.getOrCreatePasswordMessageDiv()
// - validatePasswordStrength() -> Use PasswordUIService.validatePasswordWithUI()
// - validatePasswordMatch() -> Use PasswordUIService.validatePasswordMatchWithUI()
// - showPasswordSuccess() -> Use PasswordUIService.showPasswordSuccess()
// - clearPasswordErrors() -> Use PasswordUIService.clearPasswordErrors()
// - clearPasswordValidationFeedback() -> Use PasswordUIService.clearPasswordValidationFeedback()
//
// This removes ~200+ lines of duplicate code while maintaining functionality
// through the centralized PasswordUIService.
//=====================================================================

/**
 * Setup search event handlers for maps integration
 */
function setupSearchEventHandlers() {
    // Listen for search completion
    document.addEventListener('search-complete', async (event) => {
        const { result } = event.detail;
        
        try {
            // Show the place on the map
            await MarkerService.showPlaceOnMap(result.place, {
                showInfoWindow: true,
                zoom: 15
            });
            
        } catch (error) {
            console.error('Error displaying search result:', error);
            showErrorNotification('Error displaying search result');
        }
    });

    // Listen for suggestion selection
    document.addEventListener('suggestion-selected', async (event) => {
        const { placeDetails } = event.detail;
        
        try {
            // Show the selected place on the map
            await MarkerService.showPlaceOnMap(placeDetails, {
                showInfoWindow: true,
                zoom: 16
            });
            
        } catch (error) {
            console.error('Error displaying selected place:', error);
            showErrorNotification('Error displaying selected place');
        }
    });

    // Listen for search errors
    document.addEventListener('search-error', (event) => {
        const { error, query } = event.detail;
        console.error('Search error:', error);
        showErrorNotification(`Search failed: ${error.message}`);
    });

    console.log('✅ Search event handlers configured');
}

/**
 * Setup filter control event handlers (secure replacements for inline handlers)
 * Note: Location filtering has been removed - this function is kept for backward compatibility
 */
function setupFilterEventHandlers() {
    console.log('🎚️ Filter event handlers setup (filtering functionality removed)');
    
    // Filter functionality has been removed per user request
    // This function is kept to prevent JavaScript errors
}

/**
 * Setup click-to-save event handlers for maps integration
 */
function setupClickToSaveEventHandlers() {
    console.log('🔍 Setting up click-to-save event handlers...');
 
    // Direct button handler for specific button IDs
    const setupDirectButton = (buttonId, buttonName) => {
        const button = document.getElementById(buttonId);
        console.log(`🔍 Looking for ${buttonName} element (${buttonId}):`, !!button);
        
        if (button) {
            console.log(`✅ Found ${buttonName}, setting up direct event handler`, {
                button,
                classList: button.classList.toString()
            });
            
            // Remove any existing handlers
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', (event) => {
                event.preventDefault();

                if (!ClickToSaveService || typeof ClickToSaveService.toggle !== 'function') {
                    console.error('❌ ClickToSaveService.toggle not available');
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification('Click-to-save service is unavailable. Please refresh the page.', 'error');
                    return;
                }

                console.log(`🎯 ${buttonName} clicked`, { event });

                try {
                    ClickToSaveService.toggle();
                    console.log('✅ ClickToSaveService.toggle() executed');
                } catch (error) {
                    console.error('❌ Error in ClickToSaveService.toggle:', error);
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification(`Click-to-save error: ${SecurityUtils.escapeHtml(error.message)}`, 'error');
                }
            });
            
            // Also add a test click listener
            newButton.addEventListener('mousedown', () => {
                console.log(`🔍 Mousedown detected on ${buttonName}`);
            });
            
            return true;
        }
        return false;
    };
    
    // Try to set up main click-to-save button (map button handled by MapControlsManager)
    const mainButtonSetup = setupDirectButton('clickToSaveBtn', 'main click-to-save button');
    
    if (!mainButtonSetup) {
        console.warn('⚠️ Main click-to-save button not found immediately, will try with delay');
        setTimeout(() => {
            const mainButtonDelayed = setupDirectButton('clickToSaveBtn', 'main click-to-save button');
            
            if (!mainButtonDelayed) {
                console.error('❌ Main click-to-save button not found after delay');
                // Try one more time with longer delay
                setTimeout(() => {
                    setupDirectButton('clickToSaveBtn', 'main click-to-save button');
                }, 3000);
            }
        }, 1000);
    }
    
    // Handle click-to-save button clicks (generic fallback)
    document.addEventListener('click', async (event) => {
        console.log('🔍 Document click detected, target:', event.target); ///<<<< this is also handling 'view' button clicks
        
        const clickToSaveBtn = event.target.closest('.click-to-save-btn, .map-control-btn[data-action="click-to-save"]');
        
        // Skip if this is the main button (already handled by direct handler)
        // mapClickToSaveBtn is now handled by MapControlsManager
        if (clickToSaveBtn && clickToSaveBtn.id === 'clickToSaveBtn') {
            console.log(`🔍 Skipping ${clickToSaveBtn.id} (handled by direct handler)`);
            return;
        }
        
        if (clickToSaveBtn) {
            event.preventDefault();
            
            console.log('🔍 DEBUG: Generic click-to-save button clicked');
            console.log('🔍 DEBUG: ClickToSaveService:', ClickToSaveService);
            console.log('🔍 DEBUG: toggle method:', ClickToSaveService?.toggle);
            
            // Check if ClickToSaveService is properly loaded
            if (!ClickToSaveService || typeof ClickToSaveService.toggle !== 'function') {
                console.error('❌ ClickToSaveService not properly loaded');
                return;
            }
            
            try {
                ClickToSaveService.toggle();
                console.log('✅ Click-to-save toggled successfully');
            } catch (error) {
                console.error('❌ Error toggling click-to-save:', error);
            }
            
            return;
        }
        
        // Handle location action buttons (edit, delete) in popups
        const actionBtn = event.target.closest('[data-action]');
        if (actionBtn && actionBtn.closest('.location-details-popup')) {
            event.preventDefault();
            
            const action = actionBtn.getAttribute('data-action');
            const placeId = actionBtn.getAttribute('data-place-id');
            
            try {
                if (action === 'edit') {
                    await Locations.showEditLocationDialog(placeId);
                } else if (action === 'delete') {
                    await Locations.deleteLocation(placeId);
                }
            } catch (error) {
                console.error(`Error handling ${action} action:`, error);
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification(`Error ${action}ing location`, 'error');
            }
        }
    });
    
    // Listen for location save events from form submissions
    document.addEventListener('location-save-requested', async (event) => {
        const { locationData } = event.detail;
        
        try {
            // Location data from form is already in correct format
            await Locations.saveLocation(locationData);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Location saved successfully!', 'success');
            
            // Dispatch success event to reset UI states
            document.dispatchEvent(new CustomEvent('location-save-success', {
                detail: { locationData },
                bubbles: true
            }));
            
            // Refresh handled internally by Locations module
        } catch (error) {
            console.error('Error saving location:', error);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Failed to save location', 'error');
            
            // Dispatch error event to reset UI states
            document.dispatchEvent(new CustomEvent('location-save-error', {
                detail: { error, locationData },
                bubbles: true
            }));
        }
    });
    
    console.log('✅ Click-to-save event handlers configured');
}

/**
 * Setup UI enhancement handlers
 */
function setupUIEnhancements() {
    // Handle responsive behavior
    setupResponsiveBehavior();
    
    // Setup keyboard shortcuts
    setupGlobalKeyboardShortcuts();
    
    console.log('✅ UI enhancements configured');
}

/**
 * Setup responsive behavior for mobile devices
 */
function setupResponsiveBehavior() {
    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        // Refresh map size after orientation change
        setTimeout(() => {
            const map = MapService.getMap();
            if (map) {
                google.maps.event.trigger(map, 'resize');
            }
        }, 100);
    });
}

/**
 * Setup global keyboard shortcuts
 */
function setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '/':
                event.preventDefault();
                // Focus main search input
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
                
            case 'Escape':
                // Clear all inputs and close info windows
                const inputs = document.querySelectorAll('input[type="text"]');
                inputs.forEach(input => input.blur());
                
                // Close info window
                MarkerService.closeInfoWindow();
                break;
        }
    });
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
    console.error('Error:', message);
    const { AuthNotificationService } = Auth.getServices();
    AuthNotificationService.showNotification(message, 'error');
}

/**
 * Handle application errors globally
 */
function setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Don't show notification for every error, but log it
        if (event.reason && event.reason.message) {
            console.error('Error details:', event.reason.message);
        }
        
        // Prevent the default handling (which would log to console)
        event.preventDefault();
    });
    
    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        // Only show notification for critical errors
        if (event.error && event.error.message && 
            event.error.message.includes('Google Maps')) {
            showErrorNotification('Maps functionality error occurred');
        }
    });
}

/**
 * Initialize error handling
 */
setupGlobalErrorHandling();

//=====================================================================
// DEVELOPMENT UTILITIES
//=====================================================================

// Make modules available globally for debugging
if (typeof window !== 'undefined') {
    // Services are already exported earlier in initializeAllModules()
    // Only add development-specific test functions here
    
    // Add test function for click-to-save
    window.testClickToSave = () => {
        console.log('🧪 Testing click-to-save functionality...');
        console.log('🔍 ClickToSaveService available:', !!ClickToSaveService);
        console.log('🔍 toggle method available:', typeof ClickToSaveService?.toggle);
        
        if (ClickToSaveService && typeof ClickToSaveService.toggle === 'function') {
            try {
                ClickToSaveService.toggle();
                console.log('✅ Test successful: ClickToSaveService.toggle() called');
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification('✅ Click-to-save test successful!', 'success');
            } catch (error) {
                console.error('❌ Test failed:', error);
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification(`❌ Click-to-save test failed: ${SecurityUtils.escapeHtml(error.message)}`, 'error');
            }
        } else {
            console.error('❌ ClickToSaveService not available');
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('❌ ClickToSaveService not available', 'error');
        }
    };
    
    // Add comprehensive diagnostic function
    window.diagnoseClickToSave = () => {
        console.log('🔍 === CLICK-TO-SAVE DIAGNOSTIC ===');
        console.log('🔍 ClickToSaveService object:', ClickToSaveService);
        console.log('🔍 ClickToSaveService methods:', ClickToSaveService ? Object.getOwnPropertyNames(ClickToSaveService) : 'N/A');
        console.log('🔍 ClickToSaveService.isEnabled:', ClickToSaveService?.isEnabled);
        console.log('🔍 MapService available:', !!MapService);
        console.log('🔍 Map instance:', !!MapService?.getMap());
        
        // Check button
        const button = document.getElementById('clickToSaveBtn');
        console.log('🔍 Button found:', !!button);
        if (button) {
            console.log('🔍 Button class:', button.className);
            console.log('🔍 Button text:', button.textContent);
            console.log('🔍 Button parent:', button.parentElement?.tagName);
        }
        
        // Check map button (handled by MapControlsManager, but useful for diagnostics)
        const altButton = document.getElementById('mapClickToSaveBtn');
        console.log('🔍 Map button found:', !!altButton);
        if (altButton) {
            console.log('🔍 Map button class:', altButton.className);
            console.log('🔍 Map button text:', altButton.textContent);
        }
        
        console.log('🔍 === END DIAGNOSTIC ===');
    };
    
    // Add enhanced map click test function
    // Add geocoding test function
    // Add comprehensive workflow test
    window.testFullClickToSaveWorkflow = async () => {
        console.log('🧪 === FULL CLICK-TO-SAVE WORKFLOW TEST ===');
        
        // Step 1: Verify all dependencies
        console.log('🔍 Step 1 - Dependency Check:');
        console.log('🔍 ClickToSaveService:', !!ClickToSaveService);
        console.log('🔍 MapService:', !!MapService);
        console.log('🔍 LocationsUI:', !!LocationsUI);
        console.log('🔍 Map instance:', !!MapService?.getMap());
        
        if (!ClickToSaveService || !MapService || !LocationsUI) {
            console.error('❌ Required services not available');
            return;
        }
        
        const map = MapService.getMap();
        if (!map) {
            console.error('❌ Map not initialized');
            return;
        }
        
        // Step 2: Enable click-to-save
        console.log('🔍 Step 2 - Enabling Click-to-Save:');
        ClickToSaveService.enable();
        console.log('🔍 isEnabled after enable:', ClickToSaveService.isEnabled);
        console.log('🔍 Map cursor:', map.get('cursor'));
        
        // Step 3: Simulate a map click
        console.log('🔍 Step 3 - Simulating Map Click:');
        const center = map.getCenter();
        const testLatLng = new google.maps.LatLng(center.lat(), center.lng());
        const mockEvent = { latLng: testLatLng };
        
        console.log('🔍 Simulating click at:', {
            lat: center.lat(),
            lng: center.lng()
        });
        
        try {
            await ClickToSaveService.handleMapClick(mockEvent);
            console.log('✅ Map click handling completed successfully');
        } catch (error) {
            console.error('❌ Map click handling failed:', error);
        }
        
        // Step 4: Cleanup
        setTimeout(() => {
            console.log('🔍 Step 4 - Cleanup:');
            ClickToSaveService.disable();
            console.log('🔍 Final isEnabled state:', ClickToSaveService.isEnabled);
            console.log('🧪 === FULL WORKFLOW TEST COMPLETE ===');
        }, 2000);
    };
    
    window.testGeocoding = async () => {
        console.log('🧪 === TESTING GEOCODING FUNCTION ===');
        
        const map = MapService?.getMap();
        if (!map) {
            console.error('❌ Map not available');
            return;
        }
        
        // Test coordinates (center of map)
        const center = map.getCenter();
        const testLatLng = new google.maps.LatLng(center.lat(), center.lng());
        
        console.log('🔍 Testing geocoding for coordinates:', {
            lat: center.lat(),
            lng: center.lng()
        });
        
        try {
            const locationData = await ClickToSaveService.getLocationDetails(testLatLng);
            console.log('✅ Geocoding successful:', locationData);
            
            // Also test showing the dialog
            console.log('🔍 Testing dialog display...');
            ClickToSaveService.showSaveLocationDialog(locationData);
            
        } catch (error) {
            console.error('❌ Geocoding failed:', error);
        }
        
        console.log('🧪 === GEOCODING TEST COMPLETE ===');
    };
    
    window.testMapClickWorkflow = () => {
        console.log('🧪 === TESTING MAP CLICK WORKFLOW ===');
        
        // Step 1: Check initial state
        console.log('🔍 Step 1 - Initial state:');
        console.log('🔍 ClickToSaveService.isEnabled:', ClickToSaveService?.isEnabled);
        console.log('🔍 ClickToSaveService object:', ClickToSaveService);
        console.log('🔍 Map instance:', MapService?.getMap());
        
        // Step 2: Enable click-to-save
        console.log('🔍 Step 2 - Enabling click-to-save...');
        if (ClickToSaveService && typeof ClickToSaveService.enable === 'function') {
            ClickToSaveService.enable();
            console.log('🔍 After enable - isEnabled:', ClickToSaveService.isEnabled);
            
            // Step 3: Check if map cursor changed
            const map = MapService?.getMap();
            if (map) {
                console.log('🔍 Map cursor options:', map.get('cursor'));
            }
            
            // Step 4: Test the actual map click listener
            console.log('🔍 Step 3 - Testing map click detection...');
            console.log('🔍 Please click on the map now and observe the console...');
            console.log('🔍 You have 10 seconds to test map clicks...');
            
            // Auto-disable after 10 seconds for cleanup
            setTimeout(() => {
                console.log('🔍 Step 4 - Auto-disabling after 10 seconds...');
                if (ClickToSaveService && typeof ClickToSaveService.disable === 'function') {
                    ClickToSaveService.disable();
                    console.log('🔍 Final state - isEnabled:', ClickToSaveService.isEnabled);
                }
                console.log('🧪 === TEST COMPLETE ===');
            }, 10000);
        } else {
            console.error('❌ ClickToSaveService.enable not available');
            console.log('🔍 Available methods:', ClickToSaveService ? Object.getOwnPropertyNames(ClickToSaveService) : 'Service not available');
        }
    };
    
    // Add DOM debug function
    window.debugClickToSaveButton = () => {
        const button = document.getElementById('clickToSaveBtn');
        console.log('🔍 Button found:', !!button);
    
            // Try to log attached event listeners if possible (DevTools only)
            if (typeof getEventListeners === 'function') {
            console.log('🔍 Button listeners:', getEventListeners(button));
            } else {
            console.log('🔍 Button listeners: DevTools getEventListeners not available');
            }
        
        
        const allButtons = document.querySelectorAll('.click-to-save-btn');
        console.log('🔍 All click-to-save buttons found:', allButtons.length);
        allButtons.forEach((btn, index) => {
            console.log(`🔍 Button ${index}:`, btn);
        });
    };
    
    // Set global API_BASE_URL based on environment
    window.API_BASE_URL = environment.API_BASE_URL;
    
    // Expose global functions for legacy compatibility and fallback scenarios
    window.saveCurrentLocation = () => Locations.saveCurrentLocation();
    window.deleteSavedLocation = (placeId) => Locations.deleteLocation(placeId);
    window.goToPopularLocation = (placeId, lat, lng) => Locations.goToPopularLocation(placeId, lat, lng);
    window.showLoginForm = () => authServices.AuthModalService.showAuthModal('login');
    window.showRegisterForm = () => authServices.AuthModalService.showAuthModal('register');
    window.logout = () => {
        // Redirect to logout page
        window.location.href = '/logout.html';
    };
    window.resendVerificationEmail = () => console.log('resendVerificationEmail - needs implementation');
    window.checkConsoleForVerificationLink = () => authServices.AuthNotificationService.checkConsoleForVerificationLink();
    window.hideEmailVerificationBanner = () => authServices.AuthNotificationService.hideEmailVerificationBanner();
    window.resendVerificationFromProfile = (email) => console.log('resendVerificationFromProfile - needs implementation');
    window.showAdminPanel = () => Auth.showAdminPanel().catch(err => {
        console.error('Admin panel error:', err);
        authServices.AuthNotificationService.showError('Failed to load admin panel');
    });
    window.debugUserStatus = () => console.log('debugUserStatus - needs implementation');
    window.debugAdminPanel = async () => {
        const authState = StateManager.getAuthState();
        console.log('🔍 Auth State:', authState);
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authState.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('🔍 Raw API Data:', data);
            
            if (Array.isArray(data)) {
                data.forEach(user => {
                    console.log(`🔍 User ${user.id}: isActive=${user.isActive}, is_active=${user.is_active}`);
                });
            }
        } catch (error) {
            console.error('🔍 API Test Error:', error);
        }
    };
    
    // MISSING: Server connection test
    window.testServerConnection = async () => {
        try {
            const response = await fetch(`${window.API_BASE_URL || 'http://localhost:3000/api'}/health`);
            if (response.ok) {
                console.log('✅ Server connection successful');
                return true;
            } else {
                console.warn('⚠️ Server responded with non-OK status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            return false;
        }
    };
    
    // DEBUG: Login flow troubleshooting
    window.debugLoginFlow = async () => {
        console.log('🔍 === LOGIN FLOW DEBUG ===');
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Referrer:', document.referrer);
        
        // Check localStorage using centralized Auth methods
        const debugInfo = Auth.getAuthDebugInfo();
        console.log('🔍 Auth Debug Info:', debugInfo);
        console.log('🔍 localStorage authToken:', debugInfo.hasAuthToken ? 'present' : 'missing');
        console.log('🔍 localStorage sessionToken:', debugInfo.hasSessionToken ? 'present' : 'missing');
        
        // Check state manager
        const authState = StateManager.getAuthState();
        console.log('🔍 StateManager auth state:', authState);
        console.log('🔍 StateManager current user:', StateManager.getUser());
        
        // Test auth verification
        console.log('🔍 Testing auth verification...');
        try {
            const isValid = await Auth.getServices().AuthService.verifyAuthToken();
            console.log('🔍 Auth verification result:', isValid);
            
            if (isValid) {
                const updatedUser = StateManager.getUser();
                console.log('🔍 User after verification:', updatedUser);
            }
        } catch (error) {
            console.log('🔍 Auth verification error:', error);
        }
        
        console.log('🔍 === END LOGIN FLOW DEBUG ===');
    };
}

// Development helper functions
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

if (isDevelopment) {
    window.clearAllData = () => {
        localStorage.clear();
        sessionStorage.clear();
        StateManager.setSavedLocations([]);
        console.log('All local data cleared');
    };
    
    // Debug function for force resetting location data
    window.forceResetLocations = async () => {
        await Locations.loadSavedLocations();
    };
    
    window.debugLocationData = () => {
        console.log('🔍 Current location debug info:');
        console.log('StateManager locations:', StateManager?.getSavedLocations() || 'StateManager not available');
        console.log('localStorage savedLocations:', localStorage.getItem('savedLocations'));
    };
    
    // Debug function for checking user profile state
    window.debugUserProfile = () => {
        console.log('👤 Current user profile debug:');
        const authState = StateManager.getAuthState();
        console.log('Full auth state:', authState);
        console.log('Current user:', authState?.currentUser);
        console.log('Auth token present:', !!authState?.authToken);
        
        // Check if profile modal exists and form fields
        const modal = document.getElementById('profileModal');
        const form = document.getElementById('profileFormElement');
        console.log('Profile modal exists:', !!modal);
        console.log('Profile form exists:', !!form);
        
        if (form) {
            const username = document.getElementById('profileUsername')?.value;
            const email = document.getElementById('profileEmail')?.value;
            const firstName = document.getElementById('profileFirstName')?.value;
            const lastName = document.getElementById('profileLastName')?.value;
            
            console.log('Form field values:', {
                username,
                email,
                firstName,
                lastName
            });
        }
    };
    
    window.testProfileModal = () => {
        console.log('🧪 Testing profile modal...');
        AuthModalService.showProfileModal();
        setTimeout(() => {
            window.debugUserProfile();
        }, 100);
    };
    
    // DEBUG: Add global test function for profile button
    window.testProfileButton = () => {
        console.log('🧪 Testing profile button...');
        
        const profileBtn = document.getElementById('profileBtn');
        console.log('🔍 Profile button found:', !!profileBtn);
        
        if (profileBtn) {
            console.log('📊 Profile button details:', {
                id: profileBtn.id,
                classList: Array.from(profileBtn.classList),
                parentElement: profileBtn.parentElement?.className,
                style: profileBtn.style.cssText,
                offsetParent: !!profileBtn.offsetParent
            });
            
            // Try to trigger the click manually
            console.log('🖱️ Simulating click...');
            profileBtn.click();
        }
        
        // Also test the modal directly
        const modal = document.getElementById('profileModal');
        console.log('🔍 Profile modal found:', !!modal);
        
        if (modal) {
            console.log('📊 Modal details:', {
                display: getComputedStyle(modal).display,
                visibility: getComputedStyle(modal).visibility
            });
        }
        
        // Test the auth state
        try {
            const authState = StateManager.getAuthState();
            console.log('🔍 Auth state:', authState);
        } catch (error) {
            console.log('❌ Error getting auth state:', error);
        }
    };

    console.log('🧪 Debug function added: window.testProfileButton()');
    
    window.simulateError = (message) => {
        throw new Error(message || 'Simulated error for testing');
    };
    
    window.exportAppState = () => {
        return {
            auth: StateManager.getAuthState(),
            maps: StateManager.getMapsState(),
            locations: StateManager.getSavedLocations(),
            timestamp: new Date().toISOString()
        };
    };
    
    // Export centralized Auth functions for testing (delegating to Auth module)
    window.validatePasswordRequirements = Auth.validatePasswordRequirements;
    window.validatePasswordStrength = Auth.analyzePasswordStrength;
    window.validatePasswordMatch = Auth.validatePasswordMatch;
    window.validatePasswordChangeForm = Auth.validatePasswordChangeForm;
    
    // PHASE 2 COMPLETE: Removed duplicate password functions (~200+ lines)
    // All UI logic moved to PasswordUIService.js for centralized management
    // setupChangePasswordHandler now acts as a coordinator only
    window.setupChangePasswordHandler = setupChangePasswordHandler;
    
    // PHASE 2: Backward compatibility wrappers for removed functions
    // These delegate to PasswordUIService methods for compatibility
    window.showPasswordError = async (message) => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.showPasswordError(message);
        } catch (error) {
            console.error('❌ PasswordUIService unavailable, using alert fallback:', error);
            alert(`Password Error: ${message}`);
        }
    };
    
    window.showPasswordSuccess = async (message) => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.showPasswordSuccess(message);
        } catch (error) {
            console.error('❌ PasswordUIService unavailable, using alert fallback:', error);
            alert(`Password Success: ${message}`);
        }
    };
    
    window.clearPasswordErrors = async () => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.clearPasswordErrors();
        } catch (error) {
            console.error('❌ PasswordUIService unavailable for clearPasswordErrors:', error);
        }
    };
    
    window.validatePasswordWithUI = async (password) => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.validatePasswordWithUI(password, Auth);
        } catch (error) {
            console.error('❌ PasswordUIService unavailable for validatePasswordWithUI:', error);
        }
    };
}

//=====================================================================
// PHASE 2 ARCHITECTURE SUMMARY
//=====================================================================
// BEFORE: ~1700 lines with duplicate password UI logic scattered throughout
// AFTER:  ~1400 lines with clean separation of concerns
//
// REMOVED: ~300 lines of duplicate password functions:
//   - handleChangePasswordSubmit, showPasswordError, getOrCreatePasswordMessageDiv
//   - validatePasswordStrength, validatePasswordMatch, showPasswordSuccess  
//   - clearPasswordErrors, clearPasswordValidationFeedback
//
// CENTRALIZED: All password UI logic in PasswordUIService.js
// COMPATIBILITY: Backward compatibility wrappers maintained for legacy code
// BENEFITS: Single source of truth, CSP compliance, easier maintenance
//=====================================================================

// Export for use by other modules (clean exports only)
export {
    initializeAllModules,
    StateManager,
    StateDebug
};