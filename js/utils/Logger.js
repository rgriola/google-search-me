/**
 * Client-Side Logger Utility
 * Provides structured logging with levels, categories, and environment awareness
 * 
 * Features:
 * - Log levels (ERROR, WARN, INFO, DEBUG, TRACE)
 * - Category-based filtering
 * - Environment-aware logging (production vs development)
 * - Console grouping for complex operations
 * - Optional browser storage for log history
 * - Emoji prefixes for visual clarity
 */

/**
 * Log levels in order of severity
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

/**
 * Log categories for filtering
 */
export const LOG_CATEGORIES = {
  AUTH: 'AUTH',
  MAPS: 'MAPS',
  LOCATION: 'LOCATION',
  API: 'API',
  UI: 'UI',
  GPS: 'GPS',
  MARKER: 'MARKER',
  SEARCH: 'SEARCH',
  PERMISSION: 'PERMISSION',
  GENERAL: 'GENERAL'
};

/**
 * Category emoji mapping for visual clarity
 */
const CATEGORY_EMOJIS = {
  AUTH: '🔐',
  MAPS: '🗺️',
  LOCATION: '📍',
  API: '🌐',
  UI: '🎨',
  GPS: '📡',
  MARKER: '📌',
  SEARCH: '🔍',
  PERMISSION: '🛡️',
  GENERAL: '⚙️'
};

/**
 * Client-side Logger class
 */
export class Logger {
  constructor(category = LOG_CATEGORIES.GENERAL) {
    this.category = category;
    this.isDevelopment = this.checkEnvironment();
    this.logLevel = this.getLogLevel();
    this.enabledCategories = this.getEnabledCategories();
    this.logHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Check if we're in development environment
   */
  checkEnvironment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('dev') ||
           window.location.search.includes('debug=true');
  }

  /**
   * Get current log level from localStorage or default
   */
  getLogLevel() {
    const stored = localStorage.getItem('app_log_level');
    if (stored && LOG_LEVELS[stored.toUpperCase()] !== undefined) {
      return LOG_LEVELS[stored.toUpperCase()];
    }
    return this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  /**
   * Get enabled categories from localStorage or default to all
   */
  getEnabledCategories() {
    const stored = localStorage.getItem('app_enabled_log_categories');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return Object.values(LOG_CATEGORIES);
      }
    }
    return this.isDevelopment ? Object.values(LOG_CATEGORIES) : ['AUTH', 'API', 'GENERAL'];
  }

  /**
   * Check if logging is enabled for this category and level
   */
  shouldLog(level) {
    return level <= this.logLevel && this.enabledCategories.includes(this.category);
  }

  /**
   * Format log message with timestamp and category
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const emoji = CATEGORY_EMOJIS[this.category] || '⚙️';
    const levelName = Object.keys(LOG_LEVELS)[level];
    
    let formatted = `[${timestamp}] ${emoji} [${this.category}] ${message}`;
    
    return { formatted, data, timestamp, level: levelName };
  }

  /**
   * Add to log history (for debugging purposes)
   */
  addToHistory(logEntry) {
    this.logHistory.push({
      ...logEntry,
      category: this.category,
      fullTimestamp: new Date().toISOString()
    });
    
    // Keep history size manageable
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Log error messages (always shown)
   */
  error(message, data = null) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const logEntry = this.formatMessage(LOG_LEVELS.ERROR, message, data);
      console.error(logEntry.formatted, data || '');
      this.addToHistory(logEntry);
    }
  }

  /**
   * Log warning messages
   */
  warn(message, data = null) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      const logEntry = this.formatMessage(LOG_LEVELS.WARN, message, data);
      console.warn(logEntry.formatted, data || '');
      this.addToHistory(logEntry);
    }
  }

  /**
   * Log info messages
   */
  info(message, data = null) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      const logEntry = this.formatMessage(LOG_LEVELS.INFO, message, data);
      console.log(logEntry.formatted, data || '');
      this.addToHistory(logEntry);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message, data = null) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      const logEntry = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
      console.log(logEntry.formatted, data || '');
      this.addToHistory(logEntry);
    }
  }

  /**
   * Log trace messages (development only, very verbose)
   */
  trace(message, data = null) {
    if (this.shouldLog(LOG_LEVELS.TRACE)) {
      const logEntry = this.formatMessage(LOG_LEVELS.TRACE, message, data);
      console.log(logEntry.formatted, data || '');
      this.addToHistory(logEntry);
    }
  }

  /**
   * Start a console group for complex operations
   */
  group(groupName, collapsed = false) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      const emoji = CATEGORY_EMOJIS[this.category] || '⚙️';
      const groupTitle = `${emoji} ${this.category}: ${groupName}`;
      
      if (collapsed) {
        console.groupCollapsed(groupTitle);
      } else {
        console.group(groupTitle);
      }
    }
  }

  /**
   * End a console group
   */
  groupEnd() {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.groupEnd();
    }
  }

  /**
   * Performance timing helper
   */
  time(label) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.time(`${this.category}: ${label}`);
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.timeEnd(`${this.category}: ${label}`);
    }
  }

  /**
   * Get log history (for debugging)
   */
  getHistory(category = null, level = null) {
    let filtered = this.logHistory;
    
    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }
    
    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }
    
    return filtered;
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logHistory = [];
  }

  /**
   * Export logs (for debugging/support)
   */
  exportLogs() {
    const exportData = {
      timestamp: new Date().toISOString(),
      environment: this.isDevelopment ? 'development' : 'production',
      logLevel: Object.keys(LOG_LEVELS)[this.logLevel],
      enabledCategories: this.enabledCategories,
      logs: this.logHistory
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Logger configuration utilities
 */
export class LoggerConfig {
  /**
   * Set global log level
   */
  static setLogLevel(level) {
    if (typeof level === 'string') {
      level = LOG_LEVELS[level.toUpperCase()];
    }
    if (level !== undefined) {
      localStorage.setItem('app_log_level', Object.keys(LOG_LEVELS)[level]);
      console.log(`🔧 Log level set to: ${Object.keys(LOG_LEVELS)[level]}`);
    }
  }

  /**
   * Enable/disable specific categories
   */
  static setEnabledCategories(categories) {
    localStorage.setItem('app_enabled_log_categories', JSON.stringify(categories));
    console.log(`🔧 Enabled log categories:`, categories);
  }

  /**
   * Reset logging configuration
   */
  static reset() {
    localStorage.removeItem('app_log_level');
    localStorage.removeItem('app_enabled_log_categories');
    console.log('🔧 Logger configuration reset');
  }

  /**
   * Show current configuration
   */
  static showConfig() {
    const logger = new Logger();
    console.group('🔧 Logger Configuration');
    console.log('Environment:', logger.isDevelopment ? 'development' : 'production');
    console.log('Log Level:', Object.keys(LOG_LEVELS)[logger.logLevel]);
    console.log('Enabled Categories:', logger.enabledCategories);
    console.groupEnd();
  }
}

/**
 * Factory function to create category-specific loggers
 */
export function createLogger(category) {
  return new Logger(category);
}

/**
 * Pre-configured loggers for common categories
 */
export const authLogger = new Logger(LOG_CATEGORIES.AUTH);
export const mapsLogger = new Logger(LOG_CATEGORIES.MAPS);
export const locationLogger = new Logger(LOG_CATEGORIES.LOCATION);
export const apiLogger = new Logger(LOG_CATEGORIES.API);
export const uiLogger = new Logger(LOG_CATEGORIES.UI);
export const gpsLogger = new Logger(LOG_CATEGORIES.GPS);
export const markerLogger = new Logger(LOG_CATEGORIES.MARKER);
export const searchLogger = new Logger(LOG_CATEGORIES.SEARCH);
export const permissionLogger = new Logger(LOG_CATEGORIES.PERMISSION);

/**
 * Development helper functions
 */
if (typeof window !== 'undefined') {
  // Make logger utilities available globally for development
  window.LoggerConfig = LoggerConfig;
  window.LOG_LEVELS = LOG_LEVELS;
  window.LOG_CATEGORIES = LOG_CATEGORIES;
  
  // Quick access functions
  window.setLogLevel = LoggerConfig.setLogLevel;
  window.setLogCategories = LoggerConfig.setEnabledCategories;
  window.showLogConfig = LoggerConfig.showConfig;
  window.resetLogger = LoggerConfig.reset;
}
