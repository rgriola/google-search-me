/**
 * Input Validation Middleware
 * Implements input length limits and validation
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('VALIDATION');

/**
 * Input validation configuration
 */
export const INPUT_LIMITS = {
  // String field limits
  email: { min: 3, max: 254 },
  password: { min: 8, max: 128 },
  username: { min: 2, max: 50 },
  name: { min: 1, max: 100 },
  title: { min: 1, max: 200 },
  description: { min: 0, max: 1000 },
  caption: { min: 0, max: 500 },
  address: { min: 1, max: 300 },
  notes: { min: 0, max: 2000 },
  category: { min: 1, max: 50 },
  
  // Numeric limits
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
  rating: { min: 0, max: 5 },
  
  // General limits
  generalText: { min: 0, max: 500 },
  longText: { min: 0, max: 5000 },
  shortText: { min: 0, max: 100 },
  
  // Array limits
  maxArrayItems: 100,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 20
};

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  username: /^[a-zA-Z0-9_-]+$/,
  phone: /^\+?[\d\s()-]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  noScript: /<script[^>]*>.*?<\/script>/gi,
  noHtml: /<[^>]*>/g
};

/**
 * Validate string length
 */
function validateStringLength(value, field, limits = INPUT_LIMITS.generalText) {
  if (typeof value !== 'string') {
    return { valid: false, error: `${field} must be a string` };
  }
  
  const length = value.length;
  
  if (length < limits.min) {
    return { 
      valid: false, 
      error: `${field} must be at least ${limits.min} characters` 
    };
  }
  
  if (length > limits.max) {
    return { 
      valid: false, 
      error: `${field} must be no more than ${limits.max} characters` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate email format and length
 */
function validateEmail(email) {
  const lengthCheck = validateStringLength(email, 'email', INPUT_LIMITS.email);
  if (!lengthCheck.valid) {
    return lengthCheck;
  }
  
  if (!VALIDATION_PATTERNS.email.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true };
}

/**
 * Validate password strength and length
 */
function validatePassword(password) {
  const lengthCheck = validateStringLength(password, 'password', INPUT_LIMITS.password);
  if (!lengthCheck.valid) {
    return lengthCheck;
  }
  
  // Check for basic password requirements
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const requirements = [];
  if (!hasLower) requirements.push('lowercase letter');
  if (!hasUpper) requirements.push('uppercase letter');
  if (!hasNumber) requirements.push('number');
  if (!hasSpecial) requirements.push('special character');
  
  if (requirements.length > 0) {
    return { 
      valid: false, 
      error: `Password must contain: ${requirements.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate numeric range
 */
function validateNumericRange(value, field, limits) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${field} must be a valid number` };
  }
  
  if (num < limits.min || num > limits.max) {
    return { 
      valid: false, 
      error: `${field} must be between ${limits.min} and ${limits.max}` 
    };
  }
  
  return { valid: true };
}

/**
 * Check for potentially dangerous content
 */
function validateSafeContent(value, field) {
  if (typeof value !== 'string') {
    return { valid: true };
  }
  
  // Check for script tags
  if (VALIDATION_PATTERNS.noScript.test(value)) {
    return { 
      valid: false, 
      error: `${field} contains forbidden script content` 
    };
  }
  
  // Check for excessive HTML (basic check)
  const htmlMatches = value.match(VALIDATION_PATTERNS.noHtml);
  if (htmlMatches && htmlMatches.length > 5) {
    return { 
      valid: false, 
      error: `${field} contains too much HTML content` 
    };
  }
  
  return { valid: true };
}

/**
 * Validate array limits
 */
function validateArray(array, field, maxItems = INPUT_LIMITS.maxArrayItems) {
  if (!Array.isArray(array)) {
    return { valid: false, error: `${field} must be an array` };
  }
  
  if (array.length > maxItems) {
    return { 
      valid: false, 
      error: `${field} cannot contain more than ${maxItems} items` 
    };
  }
  
  return { valid: true };
}

/**
 * Main validation function
 */
export function validateInput(data, validationRules) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const value = data[field];
    
    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      if (rules.required) {
        errors.push(`${field} is required`);
      }
      continue;
    }
    
    // String length validation
    if (rules.type === 'string' && rules.limits) {
      const result = validateStringLength(value, field, rules.limits);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    // Email validation
    if (rules.type === 'email') {
      const result = validateEmail(value);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    // Password validation
    if (rules.type === 'password') {
      const result = validatePassword(value);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    // Numeric range validation
    if (rules.type === 'number' && rules.limits) {
      const result = validateNumericRange(value, field, rules.limits);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    // Array validation
    if (rules.type === 'array') {
      const result = validateArray(value, field, rules.maxItems);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    // Safe content validation
    if (rules.checkSafety !== false) {
      const result = validateSafeContent(value, field);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    // Custom pattern validation
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        errors.push(rules.patternError || `${field} has invalid format`);
        continue;
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Express middleware for input validation
 */
export function createValidationMiddleware(validationRules) {
  return (req, res, next) => {
    const result = validateInput(req.body, validationRules);
    
    if (!result.valid) {
      logger.warn('Input validation failed', {
        path: req.path,
        method: req.method,
        errors: result.errors,
        ip: req.ip
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        errors: result.errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    next();
  };
}

/**
 * Middleware to limit request body size and validate structure
 */
export function validateRequestSize(req, res, next) {
  // Check if body is too large (Express already handles this, but we log it)
  if (req.body && JSON.stringify(req.body).length > 1024 * 1024) { // 1MB limit
    logger.warn('Request body too large', {
      path: req.path,
      method: req.method,
      bodySize: JSON.stringify(req.body).length,
      ip: req.ip
    });
    
    return res.status(413).json({
      error: 'Request body too large',
      code: 'BODY_TOO_LARGE'
    });
  }
  
  next();
}

/**
 * Common validation rule sets
 */
export const VALIDATION_RULES = {
  // User registration
  userRegistration: {
    username: {
      type: 'string',
      limits: INPUT_LIMITS.username,
      pattern: VALIDATION_PATTERNS.username,
      patternError: 'Username can only contain letters, numbers, underscores, and hyphens',
      required: true
    },
    email: {
      type: 'email',
      required: true
    },
    password: {
      type: 'password',
      required: true
    }
  },
  
  // Location creation/update
  location: {
    name: {
      type: 'string',
      limits: INPUT_LIMITS.name,
      required: true
    },
    description: {
      type: 'string',
      limits: INPUT_LIMITS.description,
      required: false
    },
    address: {
      type: 'string',
      limits: INPUT_LIMITS.address,
      required: false
    },
    latitude: {
      type: 'number',
      limits: INPUT_LIMITS.latitude,
      required: false
    },
    longitude: {
      type: 'number',
      limits: INPUT_LIMITS.longitude,
      required: false
    },
    category: {
      type: 'string',
      limits: INPUT_LIMITS.category,
      required: false
    }
  },
  
  // Photo caption
  photoCaption: {
    caption: {
      type: 'string',
      limits: INPUT_LIMITS.caption,
      required: false
    }
  }
};
