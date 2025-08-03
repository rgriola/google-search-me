/**
 * Secure Logging Utility
 * Handles production-safe logging with automatic sensitive data filtering
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
 * Sensitive data patterns that should be filtered from logs
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /auth/i,
  /bearer/i,
  /session/i,
  /cookie/i,
  /email/i,
  /phone/i,
  /ssn/i,
  /credit/i,
  /card/i
];

/**
 * Logger class with environment-aware logging
 */
export class Logger {
  constructor(context = 'APP') {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.getLogLevel();
  }

  /**
   * Get current log level based on environment
   */
  getLogLevel() {
    if (this.isProduction) {
      return LOG_LEVELS.WARN; // Only show warnings and errors in production
    }
    return process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.DEBUG;
  }

  /**
   * Filter sensitive data from objects and strings
   */
  filterSensitiveData(data) {
    if (typeof data === 'string') {
      return this.filterSensitiveString(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      return this.filterSensitiveObject(data);
    }
    
    return data;
  }

  /**
   * Filter sensitive data from strings
   */
  filterSensitiveString(str) {
    let filtered = str;
    SENSITIVE_PATTERNS.forEach(pattern => {
      filtered = filtered.replace(new RegExp(`(${pattern.source})[\\s:=]+[\\S]+`, 'gi'), '$1: [FILTERED]');
    });
    return filtered;
  }

  /**
   * Filter sensitive data from objects
   */
  filterSensitiveObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.filterSensitiveData(item));
    }

    const filtered = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      
      if (isSensitive) {
        filtered[key] = '[FILTERED]';
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = this.filterSensitiveData(value);
      } else if (typeof value === 'string') {
        filtered[key] = this.filterSensitiveString(value);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const filteredData = data ? this.filterSensitiveData(data) : null;
    
    let logEntry = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    if (filteredData) {
      if (typeof filteredData === 'object') {
        logEntry += ` ${JSON.stringify(filteredData, null, 2)}`;
      } else {
        logEntry += ` ${filteredData}`;
      }
    }
    
    return logEntry;
  }

  /**
   * Log error messages (always shown)
   */
  error(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      const formatted = this.formatMessage('ERROR', message, data);
      console.error(formatted);
    }
  }

  /**
   * Log warning messages (shown in production)
   */
  warn(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage('WARN', message, data);
      console.warn(formatted);
    }
  }

  /**
   * Log info messages (hidden in production by default)
   */
  info(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage('INFO', message, data);
      console.log(formatted);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, data);
      console.log(formatted);
    }
  }

  /**
   * Log trace messages (development only)
   */
  trace(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.TRACE) {
      const formatted = this.formatMessage('TRACE', message, data);
      console.log(formatted);
    }
  }

  /**
   * Security-focused logging for authentication events
   */
  security(event, data = null) {
    const securityData = {
      event,
      timestamp: new Date().toISOString(),
      ...this.filterSensitiveData(data || {})
    };
    
    // Security events are always logged, even in production
    const formatted = this.formatMessage('SECURITY', event, securityData);
    console.warn(formatted); // Use warn level to ensure visibility
  }

  /**
   * Performance logging for monitoring
   */
  performance(operation, duration, data = null) {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      const perfData = {
        operation,
        duration: `${duration}ms`,
        ...this.filterSensitiveData(data || {})
      };
      
      const formatted = this.formatMessage('PERF', `${operation} completed`, perfData);
      console.log(formatted);
    }
  }
}

/**
 * Create logger instances for different modules
 */
export function createLogger(context) {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = new Logger('DEFAULT');

/**
 * Express middleware for request logging
 */
export function createRequestLogger(context = 'REQUEST') {
  const requestLogger = new Logger(context);
  
  return (req, res, next) => {
    const start = Date.now();
    
    // Only log detailed request info in development
    if (!requestLogger.isProduction) {
      requestLogger.debug(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - start;
      
      // Log all requests with basic info
      requestLogger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
      
      // Log slow requests as warnings
      if (duration > 1000) {
        requestLogger.warn(`Slow request detected`, {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`
        });
      }
      
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
}

/**
 * Express middleware for error logging
 */
export function createErrorLogger(context = 'ERROR') {
  const errorLogger = new Logger(context);
  
  return (err, req, res, next) => {
    errorLogger.error(`Request error on ${req.method} ${req.path}`, {
      error: err.message,
      stack: errorLogger.isProduction ? undefined : err.stack,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next(err);
  };
}
