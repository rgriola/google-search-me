/**
 * Script Initialization Manager
 * This module ensures proper script loading order and provides dependency management
 */

import { debug } from '../debug.js';

const FILE = 'SCRIPT_LOADER';

class ScriptInitManager {
    constructor() {
        this.components = {};
        this.initStatus = {};
        this.initPromises = {};
        this.isDebug = true;
        
        debug(FILE, '📋 Script Initialization Manager created');
        
        // Expose globally for emergency access
        window.ScriptInitManager = this;
    }
    
    /**
     * Register a component with the initialization manager
     * @param {string} name - Component name
     * @param {object} component - The component object
     * @param {boolean} notifyListeners - Whether to notify listeners about this component
     */
    register(name, component, notifyListeners = true) {
        this.components[name] = component;
        this.initStatus[name] = true;
        
        debug(FILE, `✅ Component "${name}" registered`);
        
        // Resolve any pending promises
        if (this.initPromises[name]) {
            this.initPromises[name].resolve(component);
        }
        
        // Dispatch an event for other scripts to listen for
        if (notifyListeners) {
            document.dispatchEvent(new CustomEvent(`${name}Ready`, {
                detail: { component }
            }));
            debug(FILE, `📢 Dispatched ${name}Ready event`);
        }
        
        return component;
    }
    
    /**
     * Wait for a component to become available
     * @param {string} name - Component name to wait for
     * @param {number} timeout - Maximum time to wait in ms
     * @returns {Promise<object|null>} - The component or null if timed out
     */
    async waitFor(name, timeout = 5000) {
        // If already available, return immediately
        if (this.components[name]) {
            return this.components[name];
        }
        
        debug(FILE, `⏳ Waiting for component "${name}" (timeout: ${timeout}ms)`);
        
        // Create a promise if not exists
        if (!this.initPromises[name]) {
            let resolveFunc, rejectFunc;
            const promise = new Promise((resolve, reject) => {
                resolveFunc = resolve;
                rejectFunc = reject;
            });
            
            this.initPromises[name] = {
                promise,
                resolve: resolveFunc,
                reject: rejectFunc
            };
        }
        
        // Set up a timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Timeout waiting for component "${name}"`));
            }, timeout);
        });
        
        try {
            // Wait for either the component or timeout
            return await Promise.race([
                this.initPromises[name].promise,
                timeoutPromise
            ]);
        } catch (error) {
            debug(FILE, `⚠️ ${error.message}`, 'warn');
            return null;
        }
    }
    
    /**
     * Get a component by name
     * @param {string} name - Component name
     * @returns {object|null} - The component or null if not found
     */
    get(name) {
        return this.components[name] || null;
    }
    
    /**
     * Check if a component is initialized
     * @param {string} name - Component name
     * @returns {boolean} - True if initialized
     */
    isInitialized(name) {
        return !!this.initStatus[name];
    }
}

// Create singleton instance
const scriptInitManager = new ScriptInitManager();

// Export singleton
export default scriptInitManager;
