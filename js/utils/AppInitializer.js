/**
 * Application Initialization System
 * Handles proper loading and initialization of all application components
 */

import { debug } from '../debug.js';
import ScriptInitManager from './ScriptInitManager.js';
import ComponentRegistry from './ComponentRegistry.js';

const FILE = 'APP_INIT';

class AppInitializer {
    constructor() {
        this.initialized = false;
        this.initSteps = [];
        this.componentOrder = [
            // Define the ideal order for component initialization
            'SidebarManager',
            'MapController',
            'LocationsManager',
            'UIController',
            'AuthManager'
        ];
        
        debug(FILE, '📋 Application Initializer created');
        
        // Register this component itself
        ComponentRegistry.register('AppInitializer', this);
    }
    
    /**
     * Adds an initialization step to be executed during app startup
     * @param {string} name - Name of the initialization step
     * @param {Function} initFn - Function to execute for initialization
     * @param {Array<string>} dependencies - Array of dependencies required before this step
     * @param {boolean} critical - Whether failure of this step should abort initialization
     */
    addInitStep(name, initFn, dependencies = [], critical = false) {
        this.initSteps.push({
            name,
            initFn,
            dependencies,
            critical,
            executed: false,
            success: null
        });
        
        debug(FILE, `➕ Added initialization step: "${name}" (critical: ${critical})`);
        return this;
    }
    
    /**
     * Runs all initialization steps in the appropriate order based on dependencies
     * @returns {Promise<boolean>} - True if initialization was successful
     */
    async initialize() {
        if (this.initialized) {
            debug(FILE, '⚠️ Application already initialized', 'warn');
            return true;
        }
        
        debug(FILE, '🚀 Starting application initialization');
        
        // Create a deterministic order based on componentOrder and dependencies
        const orderedSteps = this._createExecutionOrder();
        
        // Execute each step in order
        for (const step of orderedSteps) {
            debug(FILE, `▶️ Executing init step: "${step.name}"`);
            
            try {
                // Wait for dependencies
                const depsLoaded = await ComponentRegistry.waitForDependencies(
                    step.dependencies, 
                    5000
                );
                
                if (!depsLoaded && step.critical) {
                    debug(FILE, `🚨 Critical dependencies for "${step.name}" not loaded, aborting`, 'error');
                    return false;
                }
                
                // Execute the step
                await step.initFn();
                step.executed = true;
                step.success = true;
                
                debug(FILE, `✅ Init step "${step.name}" completed successfully`);
            } catch (error) {
                step.executed = true;
                step.success = false;
                
                debug(FILE, `🚨 Error in init step "${step.name}": ${error.message}`, 'error');
                
                if (step.critical) {
                    debug(FILE, '🚨 Critical initialization step failed, aborting', 'error');
                    return false;
                }
            }
        }
        
        this.initialized = true;
        debug(FILE, '✅ Application initialization complete');
        
        // Dispatch global ready event
        document.dispatchEvent(new CustomEvent('appInitialized', {
            detail: { initializer: this }
        }));
        
        return true;
    }
    
    /**
     * Creates an ordered execution list based on dependencies
     * @private
     * @returns {Array} - Ordered list of initialization steps
     */
    _createExecutionOrder() {
        // Start with predefined component order
        const result = [];
        const remaining = [...this.initSteps];
        
        // First, add steps in the predefined component order
        for (const componentName of this.componentOrder) {
            const index = remaining.findIndex(step => step.name === componentName);
            if (index !== -1) {
                result.push(remaining[index]);
                remaining.splice(index, 1);
            }
        }
        
        // Then add the rest (dependency resolution would be more complex in a real implementation)
        result.push(...remaining);
        
        return result;
    }
    
    /**
     * Get initialization status
     * @returns {object} - Status of all initialization steps
     */
    getStatus() {
        return {
            initialized: this.initialized,
            steps: this.initSteps.map(step => ({
                name: step.name,
                executed: step.executed,
                success: step.success,
                critical: step.critical,
                dependencies: step.dependencies
            }))
        };
    }
}

// Create singleton instance
const appInitializer = new AppInitializer();

// Export singleton
export default appInitializer;
