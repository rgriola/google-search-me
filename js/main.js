/**
 * Main application entry point
 * Replaces the original script.js with modular architecture
 */

// Import centralized state management
import { StateManager, StateDebug } from './modules/state/AppState.js';

// Import security utilities
import { SecurityUtils } from './utils/SecurityUtils.js';

// Import environment configuration
import { environment } from './modules/config/environment.js';

// Import authentication modules
import { Auth } from './modules/auth/Auth.js';

// Import maps modules (Phase 3)
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { ClickToSaveService } from './modules/maps/ClickToSaveService.js';
import { GPSPermissionService } from './modules/maps/GPSPermissionService.js';

// Import locations modules (Phase 4 - STREAMLINED!)
import { Locations } from './modules/locations/Locations.js';

// Import photo modules  
import { PhotoDisplayService } from './modules/photos/PhotoDisplayService.js';

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
        console.log('📦 Loading application modules...');
        
        // Phase 2: Authentication modules - Fast initialization
        console.log('🔐 Initializing authentication...');
        await Auth.initialize();
        
        // Validate authentication state
        const authState = StateManager.getAuthState();
        const currentUser = authState?.currentUser;
        
        if (currentUser) {
            console.log('✅ Authenticated user found:', currentUser.email || currentUser.username);
        } else {
            console.log('⚠️ No authenticated user found');
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
        console.log('� Initializing locations...');
        await Locations.initialize();
        
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
 * Setup inter-module event handlers for communication
 */
function setupEventHandlers() {
    // Search event handlers
    setupSearchEventHandlers();
    
    // Click-to-save event handlers
    setupClickToSaveEventHandlers();
    
    // GPS permission event handlers
    setupGPSEventHandlers();
    
    // Filter control event handlers
    setupFilterEventHandlers();
    
    // UI enhancement handlers
    setupUIEnhancements();
    
    console.log('✅ Inter-module event handlers setup complete');
}

/**
 * Ensure GPS button exists in the DOM
 */
function ensureGPSButtonExists() {
    console.log('🔧 Ensuring GPS button exists...');
    
    // Check if button already exists
    let gpsBtn = document.getElementById('gpsLocationBtn');
    if (gpsBtn) {
        console.log('✅ GPS button already exists');
        return gpsBtn;
    }
    
    // Find or create map controls container
    let mapControls = document.querySelector('.map-controls');
    if (!mapControls) {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapControls = document.createElement('div');
            mapControls.className = 'map-controls';
            mapContainer.appendChild(mapControls);
            console.log('✅ Created map-controls container');
        } else {
            console.error('❌ Map container not found');
            return null;
        }
    }
    
    // Create GPS button
    gpsBtn = document.createElement('button');
    gpsBtn.id = 'gpsLocationBtn';
    gpsBtn.className = 'map-control-btn';
    gpsBtn.title = 'Center on My Location';
    gpsBtn.innerHTML = '🎯';
    
    // Ensure it's visible
    gpsBtn.style.display = 'flex';
    gpsBtn.style.visibility = 'visible';
    
    mapControls.appendChild(gpsBtn);
    console.log('✅ GPS button created and added to DOM');
    
    return gpsBtn;
}

/**
 * Setup GPS permission event handlers
 */
function setupGPSEventHandlers() {
    console.log('🎯 Setting up GPS event handlers...');
    
    // Ensure GPS button exists first
    ensureGPSButtonExists();
    
    // Function to set up GPS button with retry logic
    const setupGPSButton = () => {
        const gpsLocationBtn = document.getElementById('gpsLocationBtn');
        console.log('🎯 GPS button element found:', !!gpsLocationBtn);
        
        if (gpsLocationBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newButton = gpsLocationBtn.cloneNode(true);
            gpsLocationBtn.parentNode.replaceChild(newButton, gpsLocationBtn);
            
            newButton.addEventListener('click', async () => {
                try {
                    console.log('🎯 GPS location button clicked');
                    
                    // Check if GPS permission service is available
                    if (!window.GPSPermissionService) {
                        console.error('❌ GPS Permission Service not available');
                        alert('GPS Permission Service not available. Please refresh the page.');
                        return;
                    }
                    
                    // Center map on user location using GPS permission service
                    await MapService.centerOnUserLocation(true);
                    console.log('✅ Map centered on user location');
                    
                } catch (error) {
                    console.error('❌ Error centering on user location:', error);
                    
                    // Show user-friendly error message
                    const { AuthNotificationService } = Auth.getServices();
                    if (error.message.includes('denied')) {
                        AuthNotificationService.showNotification(
                            'Location access denied. You can enable it in your profile settings.',
                            'warning'
                        );
                    } else {
                        AuthNotificationService.showNotification(
                            'Unable to get your current location. Please try again.',
                            'error'
                        );
                    }
                }
            });
            console.log('✅ GPS button click handler attached');
            return true;
        } else {
            console.warn('⚠️ GPS button element not found in DOM');
            return false;
        }
    };
    
    // Try to set up GPS button immediately
    if (!setupGPSButton()) {
        // If not found, try again after a short delay (for dynamic content)
        console.log('🔄 Retrying GPS button setup after delay...');
        setTimeout(() => {
            if (!setupGPSButton()) {
                // Final attempt after longer delay
                setTimeout(() => {
                    if (!setupGPSButton()) {
                        console.error('❌ GPS button could not be found after multiple attempts');
                        // Try to add the button dynamically as fallback
                        addGPSButtonFallback();
                    }
                }, 2000);
            }
        }, 500);
    }
    
    // GPS permission controls in profile modal
    setupProfileGPSHandlers();
    
    // Change password form in profile modal
    setupChangePasswordHandler();
}

/**
 * Fallback: Add GPS button dynamically if not found in HTML
 */
function addGPSButtonFallback() {
    console.log('🔧 Adding GPS button as fallback...');
    
    const mapControls = document.querySelector('.map-controls');
    if (mapControls) {
        const gpsBtn = document.createElement('button');
        gpsBtn.id = 'gpsLocationBtn';
        gpsBtn.className = 'map-control-btn';
        gpsBtn.title = 'Center on My Location';
        gpsBtn.innerHTML = '🎯';
        
        mapControls.appendChild(gpsBtn);
        console.log('✅ GPS button added dynamically');
        
        // Set up the event handler for the dynamically added button
        setTimeout(() => setupGPSButton(), 100);
    } else {
        console.error('❌ Map controls container not found for fallback GPS button');
    }
}

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
    const profileBtn = document.getElementById('profileBtn');
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
 */
function setupChangePasswordHandler() {
    const form = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmNewPassword');
    const submitButton = document.getElementById('changePasswordSubmitBtn');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');

    // Simulate password breach checking (Phase 2 security feature)
    function checkPasswordSecurity(password) {
        // Common compromised passwords (simplified simulation)
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
            '123456789', 'welcome', 'monkey', '1234567890', 'abc123',
            'Password1', 'password1', '12345678', 'sunshine', 'master',
            'login', 'passw0rd', 'football', 'baseball', 'superman'
        ];
        
        // Check if password appears in common breach list
        const isCommon = commonPasswords.some(common => 
            password.toLowerCase().includes(common.toLowerCase()) ||
            common.toLowerCase().includes(password.toLowerCase())
        );
        
        // Check for common patterns that might be in breaches
        const hasCommonPatterns = [
            /^[a-zA-Z]+\d+$/, // Letters followed by numbers
            /^\d+[a-zA-Z]+$/, // Numbers followed by letters
            /^[a-zA-Z]+\d+[!@#$%^&*]$/, // Letters, numbers, single special char
            /password/i, /admin/i, /user/i, /test/i
        ].some(pattern => pattern.test(password));
        
        return {
            isCommon,
            hasCommonPatterns,
            isSecure: !isCommon && !hasCommonPatterns && password.length >= 12
        };
    }

    // Enhanced real-time password strength analysis with security checking
    function analyzePasswordStrength(password) {
        let score = 0;
        let feedback = [];
        let entropy = 0;
        let securityWarnings = [];
        
        // Character set size calculation for entropy
        let charsetSize = 0;
        if (/[a-z]/.test(password)) charsetSize += 26;
        if (/[A-Z]/.test(password)) charsetSize += 26;
        if (/\d/.test(password)) charsetSize += 10;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charsetSize += 32;
        
        // Calculate entropy (bits of randomness)
        if (password.length > 0 && charsetSize > 0) {
            entropy = Math.log2(Math.pow(charsetSize, password.length));
        }
        
        // Security check
        const securityCheck = checkPasswordSecurity(password);
        
        // Length scoring (more granular)
        if (password.length >= 16) score += 35;
        else if (password.length >= 14) score += 32;
        else if (password.length >= 12) score += 30;
        else if (password.length >= 10) score += 25;
        else if (password.length >= 8) score += 20;
        else if (password.length >= 6) score += 10;
        else if (password.length >= 4) score += 5;
        
        if (password.length < 8) feedback.push('At least 8 characters');
        
        // Character variety scoring
        if (/[A-Z]/.test(password)) score += 15;
        else feedback.push('uppercase letter');
        
        if (/[a-z]/.test(password)) score += 15;
        else feedback.push('lowercase letter');
        
        if (/\d/.test(password)) score += 15;
        else feedback.push('number');
        
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
        else feedback.push('special character');
        
        // Bonus points for complexity patterns
        if (password.length >= 12) score += 5; // Length bonus
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 5; // All types
        if (entropy >= 70) score += 5; // High entropy bonus
        
        // Security penalties
        if (securityCheck.isCommon) {
            score -= 30;
            securityWarnings.push('This password appears in breach databases');
        }
        
        if (securityCheck.hasCommonPatterns) {
            score -= 15;
            securityWarnings.push('Avoid common password patterns');
        }
        
        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) {
            score -= 10;
            securityWarnings.push('Avoid repeated characters');
        }
        
        if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def/.test(password.toLowerCase())) {
            score -= 10;
            securityWarnings.push('Avoid sequential characters');
        }
        
        // Ensure score doesn't go below 0 or above 100
        score = Math.max(0, Math.min(100, score));
        
        // Determine strength level with more granular categories
        let strength = 'very weak';
        let color = '#dc3545';
        
        if (score >= 90 && securityCheck.isSecure) {
            strength = 'excellent';
            color = '#28a745';
        } else if (score >= 80) {
            strength = 'strong';
            color = '#20c997';
        } else if (score >= 70) {
            strength = 'good';
            color = '#28a745';
        } else if (score >= 60) {
            strength = 'fair';
            color = '#ffc107';
        } else if (score >= 40) {
            strength = 'weak';
            color = '#fd7e14';
        } else if (score >= 20) {
            strength = 'poor';
            color = '#dc3545';
        }
        
        return { score, strength, color, feedback, entropy, securityWarnings };
    }

    // Update password requirements visual indicators
    function updateRequirementIndicators(password) {
        const requirements = [
            { id: 'req-length', test: password.length >= 8 },
            { id: 'req-uppercase', test: /[A-Z]/.test(password) },
            { id: 'req-lowercase', test: /[a-z]/.test(password) },
            { id: 'req-number', test: /\d/.test(password) },
            { id: 'req-special', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
        ];

        requirements.forEach(req => {
            const element = document.getElementById(req.id);
            if (element) {
                const icon = element.querySelector('.requirement-icon');
                if (req.test) {
                    element.classList.add('met');
                    element.classList.remove('unmet');
                    icon.textContent = '✅';
                } else {
                    element.classList.add('unmet');
                    element.classList.remove('met');
                    icon.textContent = '⚪';
                }
            }
        });
    }

    // Update password strength meter with enhanced feedback and security warnings
    function updatePasswordStrength(password) {
        const analysis = analyzePasswordStrength(password);
        
        // Update strength bar with animated gradient
        if (strengthBar) {
            strengthBar.style.width = `${analysis.score}%`;
            strengthBar.style.backgroundColor = analysis.color;
            strengthBar.style.backgroundPosition = `${100 - analysis.score}% 0`;
        }
        
        // Update strength text with detailed information and security warnings
        if (strengthText) {
            if (password === '') {
                strengthText.innerHTML = '<span style="color: #6c757d;">Password strength will appear here</span>';
            } else {
                const entropyText = analysis.entropy > 0 ? ` (${Math.round(analysis.entropy)} bits entropy)` : '';
                let strengthHTML = `
                    <div style="margin-bottom: 5px;">
                        <strong style="color: ${analysis.color};">Strength: ${analysis.strength.toUpperCase()}</strong> 
                        <span style="font-size: 11px; opacity: 0.8; color: #6c757d;">${entropyText}</span>
                    </div>
                `;
                
                // Add missing requirements
                if (analysis.feedback.length > 0) {
                    strengthHTML += `<div style="font-size: 11px; color: #dc3545; margin-bottom: 5px;">
                        ⚠️ Missing: ${analysis.feedback.join(', ')}
                    </div>`;
                }
                
                // Add security warnings
                if (analysis.securityWarnings && analysis.securityWarnings.length > 0) {
                    strengthHTML += `<div style="font-size: 11px; color: #dc3545; margin-bottom: 5px;">
                        🚨 Security Issues: ${analysis.securityWarnings.join(', ')}
                    </div>`;
                }
                
                // Add security recommendation based on entropy and analysis
                if (analysis.entropy < 50 && password.length > 0) {
                    strengthHTML += `<div style="font-size: 10px; color: #dc3545;">
                        ⚠️ Consider a longer or more complex password
                    </div>`;
                } else if (analysis.entropy >= 70 && analysis.score >= 80 && analysis.securityWarnings.length === 0) {
                    strengthHTML += `<div style="font-size: 10px; color: #28a745;">
                        ✅ Excellent security level - this password is very secure
                    </div>`;
                } else if (analysis.score >= 70 && analysis.securityWarnings.length === 0) {
                    strengthHTML += `<div style="font-size: 10px; color: #28a745;">
                        ✅ Good security level
                    </div>`;
                }
                
                strengthText.innerHTML = strengthHTML;
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
        
        const isCurrentPasswordValid = validatePasswordRequirements(currentPassword).isValid;
        const isNewPasswordValid = validatePasswordRequirements(newPassword).isValid;
        const passwordsMatch = newPassword === confirmPassword && newPassword !== '';
        const passwordsDifferent = currentPassword !== newPassword && newPassword !== '';
        
        const isValid = isCurrentPasswordValid && isNewPasswordValid && passwordsMatch && passwordsDifferent;
        
        submitButton.disabled = !isValid;
        
        // Update confirm password field styling
        if (confirmPassword !== '') {
            if (passwordsMatch) {
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
        
        return isValid;
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
            
            // Validate current password requirements
            const currentPasswordValidation = validatePasswordRequirements(currentPassword);
            if (!currentPasswordValidation.isValid) {
                showPasswordError('Current password does not meet security requirements: ' + currentPasswordValidation.errors.join(', '));
                return;
            }
            
            // Validate new password requirements
            const newPasswordValidation = validatePasswordRequirements(newPassword);
            if (!newPasswordValidation.isValid) {
                showPasswordError('New password does not meet security requirements: ' + newPasswordValidation.errors.join(', '));
                return;
            }
            
            // Check if passwords match
            if (newPassword !== confirmPassword) {
                showPasswordError('New passwords do not match');
                return;
            }
            
            // Check if passwords are different
            if (currentPassword === newPassword) {
                showPasswordError('New password must be different from current password');
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
                    showPasswordSuccess('Password changed successfully!');
                    form.reset();
                    updatePasswordStrength('');
                    
                    // Close modal after successful change
                    setTimeout(() => {
                        const modal = document.getElementById('profileModal');
                        if (modal) modal.style.display = 'none';
                    }, 2000);
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
    
    console.log('✅ Enhanced change password form handler attached');
}

/**
 * Handle change password form submission
 * @param {HTMLFormElement} form - The change password form
 */
async function handleChangePasswordSubmit(form) {
    try {
        const formData = new FormData(form);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmNewPassword = formData.get('confirmNewPassword');
        
        // Clear any existing error messages
        clearPasswordErrors();
        
        // Validation
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showPasswordError('Please fill in all password fields');
            return;
        }
        
        // Validate current password strength (must meet same requirements)
        const currentPasswordValidation = validatePasswordRequirements(currentPassword);
        if (!currentPasswordValidation.isValid) {
            showPasswordError('Current password does not meet security requirements: ' + currentPasswordValidation.errors.join(', '));
            return;
        }
        
        // Validate new password strength
        const newPasswordValidation = validatePasswordRequirements(newPassword);
        if (!newPasswordValidation.isValid) {
            showPasswordError('New password does not meet requirements: ' + newPasswordValidation.errors.join(', '));
            return;
        }
        
        // Validate password confirmation
        if (newPassword !== confirmNewPassword) {
            showPasswordError('New passwords do not match');
            return;
        }
        
        // Don't allow same password
        if (currentPassword === newPassword) {
            showPasswordError('New password must be different from current password');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Changing Password...';
        submitBtn.disabled = true;
        
        try {
            // Use the AuthService to change password
            const { AuthService } = await import('./modules/auth/AuthService.js');
            const result = await AuthService.changePassword(currentPassword, newPassword);
            
            if (result?.success) {
                showPasswordSuccess('Password changed successfully!');
                form.reset();
                clearPasswordValidationFeedback();
                
                // Close modal after a brief delay
                setTimeout(() => {
                    const modal = document.getElementById('profileModal');
                    if (modal) modal.style.display = 'none';
                }, 2000);
            } else {
                showPasswordError(result?.message || 'Failed to change password');
            }
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Change password error:', error);
        showPasswordError('An error occurred while changing password. Please try again.');
    }
}

/**
 * Show password error message
 * @param {string} message - Error message to display
 */
function showPasswordError(message) {
    const errorDiv = getOrCreatePasswordMessageDiv('password-error');
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 6px;
        color: #721c24;
        font-size: 14px;
    `;
}

/**
 * Get or create password message div
 * @param {string} id - ID of the message div
 * @returns {HTMLElement} Message div element
 */
function getOrCreatePasswordMessageDiv(id) {
    let messageDiv = document.getElementById(id);
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = id;
        
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.appendChild(messageDiv);
        }
    }
    
    // Clear other message types
    const otherType = id === 'password-error' ? 'password-success' : 'password-error';
    const otherDiv = document.getElementById(otherType);
    if (otherDiv) {
        otherDiv.remove();
    }
    
    return messageDiv;
}
function validatePasswordRequirements(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push('Password must be at least 8 characters long');
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Real-time password strength validation
 * @param {string} password - Password to validate
 */
function validatePasswordStrength(password) {
    const validation = validatePasswordRequirements(password);
    
    // Find or create validation feedback element
    let feedbackElement = document.getElementById('newPasswordValidation');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'newPasswordValidation';
        feedbackElement.style.cssText = `
            margin-top: 8px;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        const passwordField = document.getElementById('newPassword');
        if (passwordField?.parentNode) {
            passwordField.parentNode.appendChild(feedbackElement);
        }
    }
    
    if (password.length === 0) {
        feedbackElement.style.display = 'none';
        return;
    }
    
    feedbackElement.style.display = 'block';
    
    if (validation.isValid) {
        feedbackElement.style.backgroundColor = '#d4edda';
        feedbackElement.style.color = '#155724';
        feedbackElement.style.border = '1px solid #c3e6cb';
        feedbackElement.innerHTML = '✅ Password meets all requirements';
    } else {
        feedbackElement.style.backgroundColor = '#f8d7da';
        feedbackElement.style.color = '#721c24';
        feedbackElement.style.border = '1px solid #f5c6cb';
        feedbackElement.innerHTML = '❌ Password requirements:<br>• ' + validation.errors.join('<br>• ');
    }
}

/**
 * Validate password confirmation match
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 */
function validatePasswordMatch(password, confirmPassword) {
    let matchElement = document.getElementById('confirmPasswordValidation');
    if (!matchElement) {
        matchElement = document.createElement('div');
        matchElement.id = 'confirmPasswordValidation';
        matchElement.style.cssText = `
            margin-top: 8px;
            padding: 8px;
            border-radius: 6px;
            font-size: 13px;
        `;
        
        const confirmField = document.getElementById('confirmNewPassword');
        if (confirmField?.parentNode) {
            confirmField.parentNode.appendChild(matchElement);
        }
    }
    
    if (confirmPassword.length === 0) {
        matchElement.style.display = 'none';
        return;
    }
    
    matchElement.style.display = 'block';
    
    if (password === confirmPassword) {
        matchElement.style.backgroundColor = '#d4edda';
        matchElement.style.color = '#155724';
        matchElement.style.border = '1px solid #c3e6cb';
        matchElement.innerHTML = '✅ Passwords match';
    } else {
        matchElement.style.backgroundColor = '#f8d7da';
        matchElement.style.color = '#721c24';
        matchElement.style.border = '1px solid #f5c6cb';
        matchElement.innerHTML = '❌ Passwords do not match';
    }
}

/**
 * Show password success message
 * @param {string} message - Success message to display
 */
function showPasswordSuccess(message) {
    clearPasswordErrors();
    
    let successElement = document.getElementById('changePasswordSuccess');
    if (!successElement) {
        successElement = document.createElement('div');
        successElement.id = 'changePasswordSuccess';
        successElement.style.cssText = `
            margin-top: 15px;
            padding: 12px;
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 6px;
            font-size: 14px;
        `;
        
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.appendChild(successElement);
        }
    }
    
    successElement.textContent = message;
    successElement.style.display = 'block';
}

/**
 * Clear password error messages
 */
function clearPasswordErrors() {
    const errorElement = document.getElementById('changePasswordError');
    const successElement = document.getElementById('changePasswordSuccess');
    
    if (errorElement) errorElement.style.display = 'none';
    if (successElement) successElement.style.display = 'none';
}

/**
 * Clear password validation feedback
 */
function clearPasswordValidationFeedback() {
    const elements = [
        'newPasswordValidation',
        'confirmPasswordValidation'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

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
 */
function setupFilterEventHandlers() {
    console.log('🎚️ Setting up filter event handlers...');
    
    // Setup toggle all filters button
    const toggleAllFiltersBtn = document.getElementById('toggleAllFilters');
    if (toggleAllFiltersBtn) {
        toggleAllFiltersBtn.addEventListener('click', () => {
            try {
                if (typeof MarkerService !== 'undefined' && MarkerService.toggleAllFilters) {
                    MarkerService.toggleAllFilters();
                    console.log('✅ Toggle all filters executed');
                } else {
                    console.warn('⚠️ MarkerService.toggleAllFilters not available');
                }
            } catch (error) {
                console.error('❌ Error in toggle all filters:', error);
            }
        });
        console.log('✅ Toggle all filters event listener attached');
    } else {
        console.warn('⚠️ Toggle all filters button not found');
    }
    
    // Setup clustering toggle checkbox
    const clusteringCheckbox = document.getElementById('clustering-enabled');
    if (clusteringCheckbox) {
        clusteringCheckbox.addEventListener('change', () => {
            try {
                if (typeof MarkerService !== 'undefined' && MarkerService.toggleClustering) {
                    MarkerService.toggleClustering();
                    console.log('✅ Toggle clustering executed');
                } else {
                    console.warn('⚠️ MarkerService.toggleClustering not available');
                }
            } catch (error) {
                console.error('❌ Error in toggle clustering:', error);
            }
        });
        console.log('✅ Clustering toggle event listener attached');
    } else {
        console.warn('⚠️ Clustering checkbox not found');
    }
}

/**
 * Setup click-to-save event handlers for maps integration
 */
function setupClickToSaveEventHandlers() {
    console.log('🔍 Setting up click-to-save event handlers...');
    console.log('🔍 ClickToSaveService available:', !!ClickToSaveService);
    console.log('🔍 ClickToSaveService methods:', ClickToSaveService ? Object.getOwnPropertyNames(ClickToSaveService) : 'N/A');
    
    // Direct button handler for specific button ID
    const setupDirectButton = () => {
        const button = document.getElementById('clickToSaveBtn');
        console.log('🔍 Looking for clickToSaveBtn element:', !!button);
        
        if (button) {
            console.log('✅ Found clickToSaveBtn, setting up direct event handler');
            console.log('🔍 Button element:', button);
            console.log('🔍 Button classList:', button.classList.toString());
            
            // Remove any existing handlers
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('🎯 DIRECT BUTTON CLICK DETECTED!');
                console.log('🔍 Event:', event);
                console.log('🔍 ClickToSaveService available:', !!ClickToSaveService);
                console.log('🔍 toggle method available:', typeof ClickToSaveService?.toggle);
                
                if (!ClickToSaveService || typeof ClickToSaveService.toggle !== 'function') {
                    console.error('❌ ClickToSaveService not available');
                    alert('ClickToSaveService not available. Please refresh the page.');
                    return;
                }
                
                try {
                    console.log('🎯 Calling ClickToSaveService.toggle()...');
                    ClickToSaveService.toggle();
                    console.log('✅ ClickToSaveService.toggle() called successfully');
                } catch (error) {
                    console.error('❌ Error calling ClickToSaveService.toggle():', error);
                    alert('Error with click-to-save: ' + error.message);
                }
            });
            
            // Also add a test click listener
            newButton.addEventListener('mousedown', () => {
                console.log('🔍 Mousedown detected on click-to-save button');
            });
            
            return true;
        }
        return false;
    };
    
    // Try to set up direct button immediately
    if (!setupDirectButton()) {
        console.warn('⚠️ clickToSaveBtn not found immediately, will try with delay');
        setTimeout(() => {
            if (!setupDirectButton()) {
                console.error('❌ clickToSaveBtn not found after delay');
                // Try one more time with longer delay
                setTimeout(() => {
                    if (!setupDirectButton()) {
                        console.error('❌ clickToSaveBtn not found after extended delay');
                    }
                }, 3000);
            }
        }, 1000);
    }
    
    // Handle click-to-save button clicks (generic fallback)
    document.addEventListener('click', async (event) => {
        console.log('🔍 Document click detected, target:', event.target);
        
        const clickToSaveBtn = event.target.closest('.click-to-save-btn, .map-control-btn[data-action="click-to-save"]');
        
        // Skip if this is the main button (already handled by direct handler)
        if (clickToSaveBtn && clickToSaveBtn.id === 'clickToSaveBtn') {
            console.log('🔍 Skipping main clickToSaveBtn (handled by direct handler)');
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
    window.StateManager = StateManager;
    window.StateDebug = StateDebug;
    window.Auth = Auth;
    // Access services through Auth coordinator
    const authServices = Auth.getServices();
    window.AuthService = authServices.AuthService;
    window.AuthUICore = authServices.AuthUICore;
    window.AuthModalService = authServices.AuthModalService;
    window.AuthNotificationService = authServices.AuthNotificationService;
    window.MapService = MapService;
    window.SearchService = SearchService;
    window.SearchUI = SearchUI;
    window.MarkerService = MarkerService;
    window.ClickToSaveService = ClickToSaveService;
    window.GPSPermissionService = GPSPermissionService;
    window.Locations = Locations;
    window.initializeAllModules = initializeAllModules;
    
    // Add test function for click-to-save
    window.testClickToSave = () => {
        console.log('🧪 Testing click-to-save functionality...');
        console.log('🔍 ClickToSaveService available:', !!ClickToSaveService);
        console.log('🔍 toggle method available:', typeof ClickToSaveService?.toggle);
        
        if (ClickToSaveService && typeof ClickToSaveService.toggle === 'function') {
            try {
                ClickToSaveService.toggle();
                console.log('✅ Test successful: ClickToSaveService.toggle() called');
                alert('✅ Click-to-save test successful!');
            } catch (error) {
                console.error('❌ Test failed:', error);
                alert('❌ Click-to-save test failed: ' + error.message);
            }
        } else {
            console.error('❌ ClickToSaveService not available');
            alert('❌ ClickToSaveService not available');
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
        
        // Check alt button
        const altButton = document.getElementById('mapClickToSaveBtn');
        console.log('🔍 Alt button found:', !!altButton);
        if (altButton) {
            console.log('🔍 Alt button class:', altButton.className);
            console.log('🔍 Alt button text:', altButton.textContent);
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
        if (button) {
            console.log('🔍 Button element:', button);
            console.log('🔍 Button classes:', button.className);
            console.log('🔍 Button text:', button.textContent);
            console.log('🔍 Button parent:', button.parentElement);
            console.log('🔍 Button listeners:', getEventListeners ? getEventListeners(button) : 'DevTools not available');
        }
        
        const allButtons = document.querySelectorAll('.click-to-save-btn');
        console.log('🔍 All click-to-save buttons found:', allButtons.length);
        allButtons.forEach((btn, index) => {
            console.log(`🔍 Button ${index}:`, btn);
        });
    };
    
    // Set global API_BASE_URL based on environment
    window.API_BASE_URL = environment.API_BASE_URL;
    
    // MISSING: Expose global functions for HTML onclick handlers and compatibility
    window.saveCurrentLocation = () => Locations.saveCurrentLocation();
    window.deleteSavedLocation = (placeId) => Locations.deleteLocation(placeId);
    window.deleteSavedLocationFromInfo = (placeId) => Locations.deleteLocation(placeId);
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
        
        // Check localStorage
        console.log('🔍 localStorage authToken:', localStorage.getItem('authToken') ? 'present' : 'missing');
        console.log('🔍 localStorage sessionToken:', localStorage.getItem('sessionToken') ? 'present' : 'missing');
        
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
}

// Export for use by other modules (clean exports only)
export {
    initializeAllModules,
    StateManager,
    StateDebug
};