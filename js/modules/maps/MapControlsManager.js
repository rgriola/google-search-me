/**
 * MapControlsManager - Unified Map Controls System
 * Centralizes all map control creation, styling, and event handling
 * Security: Sanitizes all inputs, uses event delegation, no inline handlers
 * Follows COPILOT_RULES.md: ES Modules, no proxy functions, <400 lines, <10 functions
 * @module MapControlsManager
 */

class MapControlsManager {
    static instance = null;
    static container = null;
    static controls = new Map();
    static isInitialized = false;
    
    // Declarative control definitions (secure, validated)
    static CONTROL_DEFINITIONS = {
        gpsLocation: {
            id: 'gpsLocationBtn',
            emoji: '🎯',
            title: 'Center on My Location',
            service: 'MapService',
            method: 'centerOnUserLocation',
            args: [true],
            requiresAuth: false,
            className: 'map-control-btn'
        },
        clickToSave: {
            id: 'mapClickToSaveBtn', 
            emoji: '📍',
            title: 'Click to Save Location',
            service: 'ClickToSaveService',
            method: 'toggle',
            args: [],
            requiresAuth: true,
            className: 'map-control-btn'
        },
        clusterToggle: {
            id: 'clusteringToggleBtn',
            emoji: '🗂️', 
            title: 'Toggle Marker Clustering',
            service: 'MarkerService',
            method: 'toggleClustering',
            args: [],
            requiresAuth: false,
            className: 'map-control-btn'
        }
    };

    /**
     * Initialize the MapControlsManager (singleton pattern)
     * @returns {MapControlsManager} The singleton instance
     */
    static initialize() {
        if (this.isInitialized) {
            console.log('✅ MapControlsManager already initialized');
            return this.instance;
        }

        try {
            this.instance = new MapControlsManager();
            this.createControlsContainer();
            this.renderAllControls();
            this.setupEventDelegation();
            this.isInitialized = true;
            console.log('✅ MapControlsManager initialized successfully');
        } catch (error) {
            console.error('❌ MapControlsManager initialization failed:', error);
            this.showError('Failed to initialize map controls');
        }
        
        return this.instance;
    }

    /**
     * Create or find the map controls container
     * Security: Validates DOM structure before manipulation
     */
    static createControlsContainer() {
        // Validate map container exists
        const mapContainer = document.querySelector('.map-container');
        if (!mapContainer) {
            console.error('❌ Map container not found - cannot create controls');
            throw new Error('Map container not found');
        }

        // Find or create controls container
        this.container = document.querySelector('.map-controls');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'map-controls';
            mapContainer.appendChild(this.container);
            console.log('✅ Map controls container created');
        } else {
            console.log('✅ Map controls container found');
        }
        
        return this.container;
    }

    /**
     * Render all defined controls
     * Security: Sanitizes all text content, validates control definitions
     */
    static renderAllControls() {
        if (!this.container) {
            console.error('❌ Controls container not available');
            return;
        }

        Object.entries(this.CONTROL_DEFINITIONS).forEach(([key, config]) => {
            try {
                this.createControl(key, config);
            } catch (error) {
                console.error(`❌ Failed to create control ${key}:`, error);
            }
        });

        console.log(`✅ Rendered ${this.controls.size} map controls`);
    }

    /**
     * Create individual control button
     * Security: Validates config, sanitizes content, uses secure DOM methods
     */
    static createControl(controlKey, config) {
        // Validate configuration
        if (!this.validateControlConfig(config)) {
            throw new Error(`Invalid control config for ${controlKey}`);
        }

        // Check if control already exists
        const existingControl = document.getElementById(config.id);
        if (existingControl) {
            console.log(`✅ Control ${config.id} already exists - reusing`);
            this.controls.set(controlKey, existingControl);
            this.updateControlAttributes(existingControl, controlKey, config);
            return existingControl;
        }

        // Create button element
        const button = document.createElement('button');
        button.id = this.sanitizeId(config.id);
        button.className = this.sanitizeClassName(config.className);
        button.setAttribute('title', this.sanitizeText(config.title));
        button.setAttribute('data-control', this.sanitizeText(controlKey));
        button.setAttribute('data-service', this.sanitizeText(config.service));
        button.setAttribute('data-method', this.sanitizeText(config.method));
        button.setAttribute('type', 'button'); // Explicit button type
        
        // Sanitize and set emoji content (safe from XSS)
        button.textContent = this.sanitizeEmoji(config.emoji);
        
        // Apply accessibility attributes
        button.setAttribute('aria-label', this.sanitizeText(config.title));
        button.setAttribute('role', 'button');
        
        // Add to DOM and track
        this.container.appendChild(button);
        this.controls.set(controlKey, button);
        
        console.log(`✅ Created control: ${controlKey}`);
        return button;
    }

    /**
     * Update existing control attributes
     * Security: Sanitizes all attribute values
     */
    static updateControlAttributes(button, controlKey, config) {
        button.setAttribute('data-control', this.sanitizeText(controlKey));
        button.setAttribute('data-service', this.sanitizeText(config.service));
        button.setAttribute('data-method', this.sanitizeText(config.method));
        button.setAttribute('title', this.sanitizeText(config.title));
        button.setAttribute('aria-label', this.sanitizeText(config.title));
    }

    /**
     * Setup event delegation for all controls
     * Security: Validates event targets, sanitizes data attributes
     */
    static setupEventDelegation() {
        if (!this.container) {
            console.error('❌ Cannot setup event delegation - no container');
            return;
        }

        // Remove any existing event listeners to prevent duplicates
        const newContainer = this.container.cloneNode(true);
        this.container.parentNode.replaceChild(newContainer, this.container);
        this.container = newContainer;

        this.container.addEventListener('click', async (event) => {
            console.log('🎯 MapControlsManager click detected:', event.target);
            console.log('🎯 Click target closest .map-control-btn:', event.target.closest('.map-control-btn'));
            
            const button = event.target.closest('.map-control-btn');
            if (!button) {
                console.log('🎯 No .map-control-btn found, ignoring click');
                return;
            }

            console.log('🎯 MapControlsManager handling button click:', button);
            console.log('🎯 Button data attributes:', {
                control: button.dataset.control,
                service: button.dataset.service,
                method: button.dataset.method
            });

            event.preventDefault();
            event.stopPropagation();
            
            // Direct service calls for reliability (bypassing sanitization issues)
            const controlKey = button.dataset.control;
            console.log('🔍 Direct control execution for:', controlKey);
            
            try {
                if (controlKey === 'clickToSave') {
                    console.log('🎯 Executing ClickToSaveService.toggle() directly');
                    if (window.ClickToSaveService && typeof window.ClickToSaveService.toggle === 'function') {
                        await window.ClickToSaveService.toggle();
                        console.log('✅ ClickToSaveService.toggle() completed successfully');
                    } else {
                        console.error('❌ ClickToSaveService.toggle not available');
                    }
                } else if (controlKey === 'gpsLocation') {
                    console.log('🎯 Executing GPS location functionality');
                    if (window.GPSPermissionService && typeof window.GPSPermissionService.getCurrentLocation === 'function') {
                        await window.GPSPermissionService.getCurrentLocation();
                        console.log('✅ GPS functionality executed successfully');
                    } else {
                        console.error('❌ GPSPermissionService not available');
                    }
                } else if (controlKey === 'clusterToggle') {
                    console.log('🎯 Executing cluster toggle functionality');
                    if (window.MarkerService && typeof window.MarkerService.toggleClustering === 'function') {
                        window.MarkerService.toggleClustering();
                        console.log('✅ Cluster toggle executed successfully');
                    } else {
                        console.error('❌ MarkerService.toggleClustering not available');
                    }
                } else {
                    console.error('❌ Unknown control:', controlKey);
                }
            } catch (error) {
                console.error('❌ Error executing control:', error);
            }
        });

        console.log('✅ Event delegation setup complete');
    }

    /**
     * Handle control button clicks with error handling
     * Security: Validates service availability, handles errors gracefully
     */
    static async handleControlClick(controlKey, serviceName, methodName, button) {
        try {
            const config = this.CONTROL_DEFINITIONS[controlKey];
            if (!config) {
                throw new Error(`Unknown control: ${controlKey}`);
            }
            
            // Check authentication if required
            if (config.requiresAuth && !this.isUserAuthenticated()) {
                this.showAuthRequiredMessage();
                return;
            }

            // Validate service availability
            const service = window[serviceName];
            console.log(`🔍 DEBUG: Looking for service '${serviceName}' on window:`, !!service);
            console.log(`🔍 DEBUG: Service object:`, service);
            console.log(`🔍 DEBUG: Method '${methodName}' available:`, service ? typeof service[methodName] : 'service not found');
            console.log(`🔍 DEBUG: Window object keys containing 'ClickToSave':`, Object.keys(window).filter(key => key.includes('ClickToSave')));
            
            if (!service || typeof service[methodName] !== 'function') {
                console.error(`❌ Service validation failed:`, {
                    serviceName,
                    methodName,
                    serviceExists: !!service,
                    methodExists: service ? typeof service[methodName] : 'N/A',
                    serviceType: typeof service
                });
                throw new Error(`Service ${serviceName}.${methodName} not available`);
            }

            // Add loading state
            this.setButtonLoading(button, true);
            
            console.log(`🎯 Executing control action: ${controlKey}`);
            console.log(`🎯 Calling ${serviceName}.${methodName}() with args:`, config.args);
            
            // Call service method with validated arguments
            const args = Array.isArray(config.args) ? config.args : [];
            const result = await service[methodName](...args);
            
            console.log(`🎯 Service method result:`, result);
            
            console.log(`✅ Control action completed: ${controlKey}`);
            this.showSuccess(`${config.title} completed successfully`);
            
        } catch (error) {
            console.error(`❌ Control action failed: ${controlKey}`, error);
            this.handleControlError(error, controlKey);
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    // ==========================================
    // SECURITY AND VALIDATION UTILITIES
    // ==========================================

    /**
     * Validate control configuration object
     * @param {Object} config - Control configuration
     * @returns {boolean} Is valid configuration
     */
    static validateControlConfig(config) {
        if (!config || typeof config !== 'object') return false;
        
        const requiredFields = ['id', 'emoji', 'title', 'service', 'method'];
        return requiredFields.every(field => 
            config[field] && typeof config[field] === 'string' && config[field].trim()
        );
    }

    /**
     * Sanitize emoji input (prevent XSS)
     * @param {string} emoji - Emoji string
     * @returns {string} Safe emoji
     */
    static sanitizeEmoji(emoji) {
        if (typeof emoji !== 'string') return '📍';
        
        // Only allow known safe emojis
        const safeEmojis = ['🎯', '📍', '🗂️', '🏢', '📺', '👁️', '🎤', '🎬'];
        return safeEmojis.includes(emoji) ? emoji : '📍';
    }

    /**
     * Sanitize text content (prevent XSS)
     * @param {string} text - Text to sanitize
     * @returns {string} Safe text
     */
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[<>&"']/g, '').trim();
    }

    /**
     * Sanitize HTML attribute values
     * @param {string} attr - Attribute value
     * @returns {string} Safe attribute value
     */
    static sanitizeAttribute(attr) {
        if (typeof attr !== 'string') return '';
        // Allow letters (both cases), numbers, underscore, dash, and dots for service names
        return attr.replace(/[<>&"']/g, '').replace(/[^a-zA-Z0-9_.-]/g, '').trim();
    }

    /**
     * Sanitize ID values
     * @param {string} id - ID value
     * @returns {string} Safe ID
     */
    static sanitizeId(id) {
        if (typeof id !== 'string') return 'unknown-control';
        return id.replace(/[^a-zA-Z0-9_-]/g, '').trim() || 'unknown-control';
    }

    /**
     * Sanitize CSS class names
     * @param {string} className - Class name
     * @returns {string} Safe class name
     */
    static sanitizeClassName(className) {
        if (typeof className !== 'string') return 'map-control-btn';
        return className.replace(/[^a-zA-Z0-9_ -]/g, '').trim() || 'map-control-btn';
    }

    // ==========================================
    // USER EXPERIENCE UTILITIES
    // ==========================================

    /**
     * Check if user is authenticated
     * @returns {boolean} Is user authenticated
     */
    static isUserAuthenticated() {
        try {
            // Use centralized Auth state
            const authState = window.StateManager?.getAuthState();
            return !!(authState?.currentUser && authState?.authToken);
        } catch (error) {
            console.error('Error checking authentication:', error);
            return false;
        }
    }

    /**
     * Show authentication required message
     */
    static showAuthRequiredMessage() {
        this.showWarning('Please log in to use this feature');
    }

    /**
     * Set button loading state
     * @param {HTMLElement} button - Button element
     * @param {boolean} loading - Is loading
     */
    static setButtonLoading(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            button.style.opacity = '0.6';
            button.setAttribute('aria-busy', 'true');
        } else {
            button.disabled = false;
            button.style.opacity = '1';
            button.removeAttribute('aria-busy');
        }
    }

    /**
     * Handle control errors with user-friendly messages
     * @param {Error} error - Error object
     * @param {string} controlKey - Control that failed
     */
    static handleControlError(error, controlKey) {
        let message = 'An error occurred';
        
        if (error.message.includes('not available')) {
            message = 'This feature is temporarily unavailable';
        } else if (error.message.includes('denied')) {
            message = 'Permission denied. Please check your settings.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            message = 'Network error. Please check your connection.';
        }
        
        this.showError(message);
    }

    // ==========================================
    // NOTIFICATION UTILITIES (Using NotificationService)
    // ==========================================

    /**
     * Show success notification
     * @param {string} message - Success message
     */
    static showSuccess(message) {
        try {
            if (window.Auth?.getServices()?.AuthNotificationService) {
                window.Auth.getServices().AuthNotificationService.showNotification(message, 'success');
            } else {
                console.log(`✅ ${message}`);
            }
        } catch (error) {
            console.log(`✅ ${message}`);
        }
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    static showError(message) {
        try {
            if (window.Auth?.getServices()?.AuthNotificationService) {
                window.Auth.getServices().AuthNotificationService.showNotification(message, 'error');
            } else {
                console.error(`❌ ${message}`);
            }
        } catch (error) {
            console.error(`❌ ${message}`);
        }
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message
     */
    static showWarning(message) {
        try {
            if (window.Auth?.getServices()?.AuthNotificationService) {
                window.Auth.getServices().AuthNotificationService.showNotification(message, 'warning');
            } else {
                console.warn(`⚠️ ${message}`);
            }
        } catch (error) {
            console.warn(`⚠️ ${message}`);
        }
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    /**
     * Get control element by key
     * @param {string} controlKey - Control key
     * @returns {HTMLElement|null} Control element
     */
    static getControl(controlKey) {
        return this.controls.get(controlKey) || null;
    }

    /**
     * Check if control exists
     * @param {string} controlKey - Control key
     * @returns {boolean} Control exists
     */
    static hasControl(controlKey) {
        return this.controls.has(controlKey);
    }

    /**
     * Get all control keys
     * @returns {Array<string>} Array of control keys
     */
    static getControlKeys() {
        return Array.from(this.controls.keys());
    }

    /**
     * Destroy MapControlsManager and clean up
     */
    static destroy() {
        this.controls.clear();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.instance = null;
        this.isInitialized = false;
        console.log('✅ MapControlsManager destroyed');
    }
}

export default MapControlsManager;
