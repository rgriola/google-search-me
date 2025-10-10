/**
 * Application Component Initialization
 * Sets up all components in the correct order with proper dependency management
 */

import { debug } from './debug.js';
import AppInitializer from './utils/AppInitializer.js';
import ComponentRegistry from './utils/ComponentRegistry.js';
import ScriptInitManager from './utils/ScriptInitManager.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', initializeApplication);

const FILE = 'APP_INIT_MAIN';

/**
 * Main application initialization function
 */
async function initializeApplication() {
    debug(FILE, '🚀 Beginning application initialization sequence');
    
    // Register initialization steps in priority order
    AppInitializer
        .addInitStep('core', initCore, [], true)
        .addInitStep('layout', initLayout, [], true)
        .addInitStep('auth', initAuth, ['layout'], true)
        .addInitStep('map', initMap, ['layout'], true)
        .addInitStep('locations', initLocations, ['map', 'layout'], false)
        .addInitStep('profile', initProfile, ['auth', 'layout'], false)
        .addInitStep('ui', initUIComponents, ['layout'], false);
    
    // Start the initialization process
    const success = await AppInitializer.initialize();
    
    if (success) {
        debug(FILE, '✅ Application initialization complete!');
    } else {
        debug(FILE, '⚠️ Application initialization completed with errors', 'warn');
    }
    
    // Dispatch a global ready event for legacy components
    document.dispatchEvent(new CustomEvent('applicationReady', {
        detail: { success }
    }));
}

/**
 * Initialize core system components
 */
async function initCore() {
    debug(FILE, '⚙️ Initializing core components');
    
    // Register important global objects that may already exist
    if (window.SidebarManager) {
        ComponentRegistry.register('SidebarManager', window.SidebarManager);
    }
    
    if (window.mapController) {
        ComponentRegistry.register('MapController', window.mapController);
    }
    
    if (window.locationsManager) {
        ComponentRegistry.register('LocationsManager', window.locationsManager);
    }
}

/**
 * Initialize layout components
 */
async function initLayout() {
    debug(FILE, '🔲 Initializing layout components');
    
    // Wait for sidebar manager to be ready from layout-control-buttons.js
    // (should be registered during its DOMContentLoaded handler)
    const sidebarManager = await ScriptInitManager.waitFor('SidebarManager', 2000);
    
    if (!sidebarManager) {
        debug(FILE, '⚠️ SidebarManager not available after timeout', 'warn');
        
        // If it's available on window but not registered properly, register it now
        if (window.SidebarManager) {
            ComponentRegistry.register('SidebarManager', window.SidebarManager);
            debug(FILE, '🔄 Registered SidebarManager from window object');
        }
    }
}

/**
 * Initialize authentication components
 */
async function initAuth() {
    debug(FILE, '🔒 Initializing authentication components');
    
    // Implement auth initialization here
    // ...
}

/**
 * Initialize map components
 */
async function initMap() {
    debug(FILE, '🗺️ Initializing map components');
    
    // Register map controller if available
    if (window.mapController) {
        ComponentRegistry.register('MapController', window.mapController);
    }
}

/**
 * Initialize locations components
 */
async function initLocations() {
    debug(FILE, '📍 Initializing locations components');
    
    // Implement locations initialization here
    // ...
}

/**
 * Initialize profile components
 */
async function initProfile() {
    debug(FILE, '👤 Initializing profile components');
    
    // Implement profile initialization here
    // ...
}

/**
 * Initialize UI components
 */
async function initUIComponents() {
    debug(FILE, '🖌️ Initializing UI components');
    
    // Implement UI initialization here
    // ...
}

// Export for direct imports
export { AppInitializer, ComponentRegistry, ScriptInitManager };
