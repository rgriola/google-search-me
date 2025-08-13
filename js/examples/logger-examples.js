/**
 * Logger Usage Examples and Best Practices
 * This file demonstrates how to use the new logging system
 * 
 * 
 *   // You can still test manually from console
        loggerTestUtils.setLevel('DEBUG')
        loggerTestUtils.showConfig()
        loggerTestUtils.toggleCategory('GPS')
 * 
 */

import { 
  createLogger, 
  LOG_CATEGORIES, 
  LoggerConfig,
  authLogger,
  mapsLogger,
  locationLogger,
  apiLogger,
  uiLogger,
  gpsLogger,
  markerLogger,
  searchLogger,
  permissionLogger
} from '../utils/Logger.js';

// ================================================================
// BASIC USAGE EXAMPLES
// ================================================================

/**
 * Example 1: Using pre-configured loggers
 */
function exampleBasicUsage() {
  // Use pre-configured loggers for specific categories
  authLogger.info('User login successful', { userId: 123 });
  mapsLogger.debug('Map initialized', { zoom: 10, center: { lat: 40.7, lng: -74.0 } });
  apiLogger.error('API request failed', { endpoint: '/api/locations', status: 500 });
  
  // Use different log levels
  gpsLogger.trace('GPS coordinates received', { lat: 40.7589, lng: -73.9851 });
  gpsLogger.debug('GPS permission check started');
  gpsLogger.info('GPS permission granted');
  gpsLogger.warn('GPS accuracy is low');
  gpsLogger.error('GPS permission denied');
}

/**
 * Example 2: Creating custom loggers for specific modules
 */
function exampleCustomLoggers() {
  const profileLogger = createLogger('PROFILE');
  const settingsLogger = createLogger('SETTINGS');
  
  profileLogger.info('Profile updated', { fields: ['firstName', 'lastName'] });
  settingsLogger.debug('Settings loaded from localStorage');
}

/**
 * Example 3: Using console groups for complex operations
 */
async function exampleComplexOperation() {
  const logger = createLogger(LOG_CATEGORIES.LOCATION);
  
  logger.group('Save Location Operation');
  
  logger.debug('Validating location data');
  logger.info('Geocoding address');
  logger.debug('Checking for duplicates');
  logger.info('Saving to database');
  logger.info('Location saved successfully');
  
  logger.groupEnd();
}

/**
 * Example 4: Performance timing
 */
async function examplePerformanceTiming() {
  const logger = createLogger(LOG_CATEGORIES.API);
  
  logger.time('API Request');
  
  try {
    const response = await fetch('/api/locations');
    const data = await response.json();
    
    logger.timeEnd('API Request');
    logger.info('API request completed', { recordCount: data.length });
  } catch (error) {
    logger.timeEnd('API Request');
    logger.error('API request failed', error);
  }
}

// ================================================================
// CONFIGURATION EXAMPLES
// ================================================================

/**
 * Development vs Production configuration
 */
function exampleConfiguration() {
  // In development - show all logs
  if (window.location.hostname === 'localhost') {
    LoggerConfig.setLogLevel('DEBUG');
    LoggerConfig.setEnabledCategories(Object.values(LOG_CATEGORIES));
  }
  
  // In production - only show warnings and errors
  else {
    LoggerConfig.setLogLevel('WARN');
    LoggerConfig.setEnabledCategories(['AUTH', 'API', 'GENERAL']);
  }
}

/**
 * Dynamic log control for debugging
 */
function exampleDynamicControl() {
  // Enable verbose logging for GPS debugging
  LoggerConfig.setLogLevel('TRACE');
  LoggerConfig.setEnabledCategories(['GPS', 'LOCATION', 'PERMISSION']);
  
  // Later, reduce logging
  LoggerConfig.setLogLevel('INFO');
}

// ================================================================
// MIGRATION EXAMPLES (Replacing console.log calls)
// ================================================================

/**
 * BEFORE: Using console.log
 */
function beforeMigration() {
  console.log('📍 Requesting GPS permission from user...');
  console.log('✅ GPS permission granted and saved to profile');
  console.warn('📍 Could not fetch GPS permission from server');
  console.error('📍 Error checking stored GPS permission:', error);
}

/**
 * AFTER: Using structured logging
 */
function afterMigration() {
  const logger = createLogger(LOG_CATEGORIES.GPS);
  
  logger.info('Requesting GPS permission from user...');
  logger.info('GPS permission granted and saved to profile');
  logger.warn('Could not fetch GPS permission from server');
  logger.error('Error checking stored GPS permission', error);
}

// ================================================================
// DEBUGGING UTILITIES
// ================================================================

/**
 * Export logs for debugging/support
 */
function exportDebugLogs() {
  const logger = createLogger(LOG_CATEGORIES.GENERAL);
  logger.exportLogs();
}

/**
 * Show logger configuration
 */
function showCurrentConfig() {
  LoggerConfig.showConfig();
}

/**
 * Quick debug functions for console
 */
function setupDebugFunctions() {
  // Make available globally for debugging
  window.debugLog = {
    setLevel: LoggerConfig.setLogLevel,
    setCategories: LoggerConfig.setEnabledCategories,
    showConfig: LoggerConfig.showConfig,
    reset: LoggerConfig.reset,
    export: exportDebugLogs
  };
}

// ================================================================
// BEST PRACTICES
// ================================================================

/**
 * BEST PRACTICE: Create module-specific loggers
 */
class ExampleService {
  constructor() {
    this.logger = createLogger('EXAMPLE_SERVICE');
  }
  
  async doSomething() {
    this.logger.group('doSomething operation');
    
    try {
      this.logger.debug('Starting operation');
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.logger.info('Operation completed successfully');
      
    } catch (error) {
      this.logger.error('Operation failed', error);
      throw error;
      
    } finally {
      this.logger.groupEnd();
    }
  }
}

/**
 * BEST PRACTICE: Conditional detailed logging
 */
function exampleConditionalLogging() {
  const logger = createLogger(LOG_CATEGORIES.API);
  
  // Always log the basic info
  logger.info('API request started');
  
  // Only log detailed data in debug mode
  logger.debug('Request details', {
    url: '/api/endpoint',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { /* detailed request data */ }
  });
}

/**
 * BEST PRACTICE: Error logging with context
 */
function exampleErrorLogging() {
  const logger = createLogger(LOG_CATEGORIES.AUTH);
  
  try {
    // Some operation that might fail
    throw new Error('Authentication failed');
    
  } catch (error) {
    // Log error with context
    logger.error('Login failed', {
      error: error.message,
      userId: 'user123',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }
}

// ================================================================
// CONSOLE COMMANDS FOR DEBUGGING
// ================================================================

/**
 * Make debugging functions available in console
 */
if (typeof window !== 'undefined') {
  // Quick access to logger controls
  window.setLogLevel = LoggerConfig.setLogLevel;
  window.setLogCategories = LoggerConfig.setEnabledCategories;
  window.showLogConfig = LoggerConfig.showConfig;
  window.resetLogger = LoggerConfig.reset;
  
  // Example usage in console:
  // setLogLevel('DEBUG')
  // setLogCategories(['GPS', 'MAPS'])
  // showLogConfig()
  // resetLogger()
}
