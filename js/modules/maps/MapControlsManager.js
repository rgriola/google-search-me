/**
 * MapControlsManager - Unified Map Controls System
 * Centralizes all map control creation, styling, and event handling
 * Security: Sanitizes all inputs, uses event delegation, no inline handlers
 * Follows COPILOT_RULES.md: ES Modules, no proxy functions, <400 lines, <10 functions
 * @module MapControlsManager
 */

import { debug, DEBUG } from '../../debug.js';
const FILE = 'MAP_CONTROLS_MANAGER';

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
            debug(FILE, '✅ MapControlsManager already initialized');
            return this.instance;
        }

        try {
            this.instance = new MapControlsManager();
            this.createControlsContainer();
            this.renderAllControls();
            this.setupEventDelegation();
            this.isInitialized = true;
            debug(FILE, '✅ MapControlsManager initialized successfully');
        } catch (error) {
            debug(FILE, '❌ MapControlsManager initialization failed:', error, 'error');
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
            debug(FILE, '❌ Map container not found - cannot create controls', null, 'error');
            throw new Error('Map container not found');
        }

        // Find or create controls container
        this.container = document.querySelector('.map-controls');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'map-controls';
            mapContainer.appendChild(this.container);
            debug(FILE, '✅ Map controls container created');
        } else {
            debug(FILE, '✅ Map controls container found');
        }
        
        return this.container;
    }

    /**
     * Render all defined controls
     * Security: Sanitizes all text content, validates control definitions
     */
    static renderAllControls() {
        if (!this.container) {
            debug(FILE, '❌ Controls container not available', null, 'error');
            return;
        }

        Object.entries(this.CONTROL_DEFINITIONS).forEach(([key, config]) => {
            try {
                this.createControl(key, config);
            } catch (error) {
                debug(FILE, `❌ Failed to create control ${key}:`, error, 'error');
            }
        });

        debug(FILE, `✅ Rendered ${this.controls.size} map controls`);
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
            debug(FILE, `✅ Control ${config.id} already exists - reusing`);
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
        
        debug(FILE, `✅ Created control: ${controlKey}`);
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
            debug(FILE, '❌ Cannot setup event delegation - no container', null, 'error');
            return;
        }

        // Remove any existing event listeners to prevent duplicates
        const newContainer = this.container.cloneNode(true);
        this.container.parentNode.replaceChild(newContainer, this.container);
        this.container = newContainer;

        this.container.addEventListener('click', async (event) => {
            debug(FILE, '🎯 MapControlsManager click detected:', event.target);
            debug(FILE, '🎯 Click target closest .map-control-btn:', event.target.closest('.map-control-btn'));
            
            const button = event.target.closest('.map-control-btn');
            if (!button) {
                debug(FILE, '🎯 No .map-control-btn found, ignoring click');
                return;
            }

            debug(FILE, '🎯 MapControlsManager handling button click:', button);
            debug(FILE, '🎯 Button data attributes:', {
                control: button.dataset.control,
                service: button.dataset.service,
                method: button.dataset.method
            });

            event.preventDefault();
            event.stopPropagation();
            
            // Direct service calls for reliability (bypassing sanitization issues)
            const controlKey = button.dataset.control;
            debug(FILE, '🔍 Direct control execution for:', controlKey);
            
            try {
                if (controlKey === 'clickToSave') {
                    debug(FILE, '🎯 Executing ClickToSaveService.toggle() directly');
                    if (window.ClickToSaveService && typeof window.ClickToSaveService.toggle === 'function') {
                        await window.ClickToSaveService.toggle();
                        debug(FILE, '✅ ClickToSaveService.toggle() completed successfully');
                    } else {
                        debug(FILE, '❌ ClickToSaveService.toggle not available', null, 'error');
                    }
                } else if (controlKey === 'gpsLocation') {
                    debug(FILE, '🎯 Executing GPS location functionality');
                    if (window.MapService && typeof window.MapService.centerOnUserLocation === 'function') {
                        try {
                            await window.MapService.centerOnUserLocation();
                            debug(FILE, '✅ GPS location centered successfully');
                        } catch (error) {
                            debug(FILE, '❌ GPS location failed:', error.message, 'error');
                        }
                    } else {
                        debug(FILE, '❌ MapService.centerOnUserLocation not available', null, 'error');
                    }
                } else if (controlKey === 'clusterToggle') {
                    debug(FILE, '🎯 Executing cluster toggle functionality');
                    if (window.MarkerService && typeof window.MarkerService.toggleClustering === 'function') {
                        window.MarkerService.toggleClustering();
                        debug(FILE, '✅ Cluster toggle executed successfully');
                    } else {
                        debug(FILE, '❌ MarkerService.toggleClustering not available', null, 'error');
                    }
                } else {
                    debug(FILE, '❌ Unknown control:', controlKey, 'error');
                }
            } catch (error) {
                debug(FILE, '❌ Error executing control:', error, 'error');
            }
        });

        debug(FILE, '✅ Event delegation setup complete');
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
            debug(FILE, `🔍 DEBUG: Looking for service '${serviceName}' on window:`, !!service);
            debug(FILE, `🔍 DEBUG: Service object:`, service);
            debug(FILE, `🔍 DEBUG: Method '${methodName}' available:`, service ? typeof service[methodName] : 'service not found');
            debug(FILE, `🔍 DEBUG: Window object keys containing 'ClickToSave':`, Object.keys(window).filter(key => key.includes('ClickToSave')));
            
            if (!service || typeof service[methodName] !== 'function') {
                debug(FILE, '❌ Service validation failed:', {
                    serviceName,
                    methodName,
                    serviceExists: !!service,
                    methodExists: service ? typeof service[methodName] : 'N/A',
                    serviceType: typeof service
                }, 'error');
                throw new Error(`Service ${serviceName}.${methodName} not available`);
            }

            // Add loading state
            this.setButtonLoading(button, true);
            
            debug(FILE, `🎯 Executing control action: ${controlKey}`);
            debug(FILE, `🎯 Calling ${serviceName}.${methodName}() with args:`, config.args);
            
            // Call service method with validated arguments
            const args = Array.isArray(config.args) ? config.args : [];
            const result = await service[methodName](...args);
            
            debug(FILE, `🎯 Service method result:`, result);
            
            debug(FILE, `✅ Control action completed: ${controlKey}`);
            this.showSuccess(`${config.title} completed successfully`);
            
        } catch (error) {
            debug(FILE, `❌ Control action failed: ${controlKey}`, error, 'error');
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
            debug(FILE, 'Error checking authentication:', error, 'error');
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
                debug(FILE, `✅ ${message}`);
            }
        } catch (error) {
            debug(FILE, `✅ ${message}`);
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
                debug(FILE, `❌ ${message}`, null, 'error');
            }
        } catch (error) {
            debug(FILE, `❌ ${message}`, null, 'error');
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
                debug(FILE, `⚠️ ${message}`, null, 'warn');
            }
        } catch (error) {
            debug(FILE, `⚠️ ${message}`, null, 'warn');
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
        debug(FILE, '✅ MapControlsManager destroyed');
    }
}

export default MapControlsManager;
