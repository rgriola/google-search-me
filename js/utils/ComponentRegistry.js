/**
 * Component Registry
 * A central registry for all application components with dependency management
 */

import { debug } from '../debug.js';
import ScriptInitManager from './ScriptInitManager.js';

const FILE = 'COMPONENT_REGISTRY';

class ComponentRegistry {
    constructor() {
        this.components = {};
        this.dependencyMap = {};
        this.loadStatus = {};
        this.eventListeners = {};
        
        debug(FILE, '📋 Component Registry created');
        
        // Make accessible globally for emergency debugging
        window._componentRegistry = this;
    }
    
    /**
     * Register a component with the registry
     * @param {string} name - Component name
     * @param {object} component - The component object
     * @param {Array<string>} dependencies - Optional array of dependency component names
     * @returns {object} - The registered component
     */
    register(name, component, dependencies = []) {
        this.components[name] = component;
        this.loadStatus[name] = true;
        this.dependencyMap[name] = dependencies;
        
        debug(FILE, `✅ Component "${name}" registered with dependencies: ${dependencies.join(', ') || 'none'}`);
        
        // Also register with ScriptInitManager for compatibility
        ScriptInitManager.register(name, component);
        
        // Notify any components waiting for this one
        this._notifyDependents(name);
        
        return component;
    }
    
    /**
     * Retrieve a component from the registry
     * @param {string} name - Component name
     * @returns {object|null} - The component or null if not found
     */
    get(name) {
        return this.components[name] || null;
    }
    
    /**
     * Check if a component is loaded
     * @param {string} name - Component name
     * @returns {boolean} - True if the component is loaded
     */
    isLoaded(name) {
        return !!this.loadStatus[name];
    }
    
    /**
     * Wait for a component to become available
     * @param {string} name - Component name to wait for
     * @param {number} timeout - Maximum time to wait in ms (default: 5000)
     * @returns {Promise<object|null>} - The component or null if timed out
     */
    async waitFor(name, timeout = 5000) {
        // If component is already available, return immediately
        if (this.components[name]) {
            return this.components[name];
        }
        
        debug(FILE, `⏳ Waiting for component "${name}"`);
        
        // Delegate to ScriptInitManager for now
        return await ScriptInitManager.waitFor(name, timeout);
    }
    
    /**
     * Wait for multiple dependencies to be loaded
     * @param {Array<string>} dependencies - Array of component names to wait for
     * @param {number} timeout - Maximum wait time in ms
     * @returns {Promise<boolean>} - True if all dependencies loaded successfully
     */
    async waitForDependencies(dependencies, timeout = 5000) {
        if (!dependencies || dependencies.length === 0) {
            return true;
        }
        
        debug(FILE, `⏳ Waiting for dependencies: ${dependencies.join(', ')}`);
        
        try {
            const results = await Promise.all(
                dependencies.map(dep => this.waitFor(dep, timeout))
            );
            
            const allLoaded = results.every(result => result !== null);
            if (allLoaded) {
                debug(FILE, '✅ All dependencies loaded successfully');
            } else {
                debug(FILE, '⚠️ Some dependencies failed to load', 'warn');
            }
            
            return allLoaded;
        } catch (error) {
            debug(FILE, `🚨 Error waiting for dependencies: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Register a callback for when a component becomes available
     * @param {string} componentName - Name of component to wait for
     * @param {Function} callback - Function to call when component is ready
     */
    onComponentReady(componentName, callback) {
        if (!this.eventListeners[componentName]) {
            this.eventListeners[componentName] = [];
        }
        
        this.eventListeners[componentName].push(callback);
        debug(FILE, `👂 Listener added for "${componentName}" component`);
        
        // If the component is already available, call the callback immediately
        if (this.components[componentName]) {
            callback(this.components[componentName]);
            debug(FILE, `📣 Immediately called listener for already-loaded "${componentName}"`);
        }
    }
    
    /**
     * Notify waiting components that a dependency is now available
     * @private
     * @param {string} componentName - Name of component that was just registered
     */
    _notifyDependents(componentName) {
        if (this.eventListeners[componentName]) {
            this.eventListeners[componentName].forEach(callback => {
                try {
                    callback(this.components[componentName]);
                } catch (error) {
                    debug(FILE, `🚨 Error in component "${componentName}" listener: ${error.message}`, 'error');
                }
            });
            
            debug(FILE, `📣 Notified ${this.eventListeners[componentName].length} listeners about "${componentName}"`);
        }
    }
}

// Create singleton instance
const componentRegistry = new ComponentRegistry();

// Export the singleton
export default componentRegistry;
