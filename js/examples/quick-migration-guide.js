/**
 * Quick Migration Guide
 * Copy-paste these patterns to quickly migrate your files
 */

// ================================================================
// STEP 1: Add imports to the top of your file
// ================================================================

// Choose the import that matches your file's purpose:

// For authentication-related files:
import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';
const logger = createLogger(LOG_CATEGORIES.AUTH);

// For map-related files:
import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';
const logger = createLogger(LOG_CATEGORIES.MAPS);

// For API-related files:
import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';
const logger = createLogger(LOG_CATEGORIES.API);

// For GPS-related files:
import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';
const logger = createLogger(LOG_CATEGORIES.GPS);

// For UI-related files:
import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';
const logger = createLogger(LOG_CATEGORIES.UI);

// ================================================================
// STEP 2: Replace console calls with logger calls
// ================================================================

// Find and replace patterns:
// console.log('message') → logger.info('message')
// console.error('message', error) → logger.error('message', error)
// console.warn('message') → logger.warn('message')
// console.debug('message') → logger.debug('message')

// ================================================================
// STEP 3: Use structured data instead of string concatenation
// ================================================================

// BEFORE:
console.log('User logged in with ID: ' + userId + ' at ' + timestamp);

// AFTER:
logger.info('User logged in', { userId, timestamp });

// BEFORE:
console.error('API request failed: ' + error.message + ' for endpoint: ' + endpoint);

// AFTER:
logger.error('API request failed', { error: error.message, endpoint });

// ================================================================
// STEP 4: Use console groups for complex operations
// ================================================================

// BEFORE:
console.log('Starting save location process...');
console.log('Validating data...');
console.log('Sending to API...');
console.log('Location saved successfully');

// AFTER:
logger.group('Save Location Process');
logger.debug('Validating data...');
logger.debug('Sending to API...');
logger.info('Location saved successfully');
logger.groupEnd();

// ================================================================
// EXAMPLE: Complete file migration
// ================================================================

/**
 * Example: auth-service.js migration
 */

// BEFORE migration:
class AuthServiceOld {
  static async login(email, password) {
    console.log('🔐 Attempting login for: ' + email);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        console.log('✅ Login successful for: ' + email);
        return await response.json();
      } else {
        console.error('❌ Login failed with status: ' + response.status);
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('❌ Login error: ' + error.message);
      throw error;
    }
  }
}

// AFTER migration:
import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';

class AuthServiceNew {
  constructor() {
    this.logger = createLogger(LOG_CATEGORIES.AUTH);
  }
  
  async login(email, password) {
    this.logger.info('Attempting login', { email });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        this.logger.info('Login successful', { email });
        return await response.json();
      } else {
        this.logger.error('Login failed', { status: response.status, email });
        throw new Error('Login failed');
      }
    } catch (error) {
      this.logger.error('Login error', { error: error.message, email });
      throw error;
    }
  }
}

// ================================================================
// DEBUGGING TIPS
// ================================================================

/*
Once migrated, you can control logging dynamically:

// Show only authentication logs
setLogCategories(['AUTH'])

// Show only errors and warnings
setLogLevel('WARN')

// Enable verbose debugging for GPS issues
setLogCategories(['GPS', 'LOCATION', 'MAPS'])
setLogLevel('DEBUG')

// Export logs for support/debugging
exportLogs() // Downloads a JSON file with all log history

// Reset to defaults
resetLogger()
*/
