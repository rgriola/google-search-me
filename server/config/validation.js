/**
 * Environment Variable Validation
 * Validates required environment variables and their security properties
 */

import { config } from './environment.js';

/**
 * Required environment variables for each environment
 */
const REQUIRED_VARS = {
  development: [
    'JWT_SECRET',
    'SESSION_SECRET', 
    'GOOGLE_MAPS_API_KEY',
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'IMAGEKIT_URL_ENDPOINT'
  ],
  production: [
    'JWT_SECRET',
    'SESSION_SECRET',
    'GOOGLE_MAPS_API_KEY', 
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'IMAGEKIT_URL_ENDPOINT',
    'EMAIL_PASS',
    'EMAIL_HOST'
  ],
  test: [
    'JWT_SECRET',
    'SESSION_SECRET'
  ]
};

/**
 * Security requirements for sensitive variables
 */
const SECURITY_REQUIREMENTS = {
  JWT_SECRET: {
    minLength: 32,
    description: 'JWT secret must be at least 32 characters long'
  },
  SESSION_SECRET: {
    minLength: 32, 
    description: 'Session secret must be at least 32 characters long'
  },
  GOOGLE_MAPS_API_KEY: {
    pattern: /^AIza[0-9A-Za-z_-]{35}$/,
    description: 'Google Maps API key must follow AIza[35 chars] pattern'
  },
  IMAGEKIT_PUBLIC_KEY: {
    pattern: /^public_[A-Za-z0-9+/=]+$/,
    description: 'ImageKit public key must start with public_'
  },
  IMAGEKIT_PRIVATE_KEY: {
    pattern: /^private_[A-Za-z0-9+/=]+$/,
    description: 'ImageKit private key must start with private_'
  }
};

/**
 * Validate a single environment variable
 * @param {string} name - Variable name
 * @param {string} value - Variable value
 * @returns {Object} Validation result
 */
function validateVariable(name, value) {
  const requirement = SECURITY_REQUIREMENTS[name];
  
  if (!requirement) {
    return { valid: true };
  }
  
  // Check minimum length
  if (requirement.minLength && value.length < requirement.minLength) {
    return {
      valid: false,
      error: `${name} is too short. ${requirement.description}`
    };
  }
  
  // Check pattern
  if (requirement.pattern && !requirement.pattern.test(value)) {
    return {
      valid: false,
      error: `${name} format is invalid. ${requirement.description}`
    };
  }
  
  return { valid: true };
}

/**
 * Validate all required environment variables
 * @param {string} environment - Environment name (development, production, test)
 * @returns {Object} Validation results
 */
export function validateEnvironmentVariables(environment = config.NODE_ENV) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    summary: {}
  };
  
  const required = REQUIRED_VARS[environment] || [];
  
  // Check for missing variables (check both config and process.env)
  const missing = required.filter(varName => {
    const value = config[varName] || process.env[varName];
    return !value;
  });
  if (missing.length > 0) {
    results.valid = false;
    results.errors.push(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate existing variables (check both config and process.env)
  required.forEach(varName => {
    const value = config[varName] || process.env[varName];
    if (value) {
      const validation = validateVariable(varName, value);
      if (!validation.valid) {
        results.valid = false;
        results.errors.push(validation.error);
      }
    }
  });
  
  // Development-specific warnings
  if (environment === 'development') {
    if (config.JWT_SECRET && config.JWT_SECRET.includes('dev-jwt-secret')) {
      results.warnings.push('Using default development JWT secret - OK for development only');
    }
  }
  
  // Production-specific checks
  if (environment === 'production') {
    const jwtSecret = config.JWT_SECRET || process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 64) {
      results.warnings.push('JWT secret should be 64+ characters for production');
    }
    
    const googleMapsKey = config.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (googleMapsKey) {
      results.warnings.push('Google Maps API key should be restricted by domain in production');
    }
  }
  
  // Build summary
  results.summary = {
    environment,
    required: required.length,
    configured: required.filter(varName => {
      const value = config[varName] || process.env[varName];
      return !!value;
    }).length,
    securityCompliant: results.errors.length === 0
  };
  
  return results;
}

/**
 * Validate and report environment configuration on startup
 * Throws error for critical issues in production
 */
export function validateAndReport() {
  const results = validateEnvironmentVariables();
  
  console.log('\n🔍 Environment Configuration Validation');
  console.log('==========================================');
  
  if (results.valid) {
    console.log('✅ All required environment variables are properly configured');
  } else {
    console.log('❌ Environment validation failed:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Security warnings:');
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Environment: ${results.summary.environment}`);
  console.log(`   Required variables: ${results.summary.required}`);
  console.log(`   Configured: ${results.summary.configured}`);
  console.log(`   Security compliant: ${results.summary.securityCompliant ? '✅' : '❌'}`);
  console.log('==========================================\n');
  
  // In production, fail fast on critical errors
  if (!results.valid && config.NODE_ENV === 'production') {
    throw new Error('Critical environment configuration errors detected. Cannot start in production mode.');
  }
  
  return results;
}

/**
 * Get safe configuration summary (no secrets exposed)
 */
export function getConfigSummary() {
  return {
    environment: config.NODE_ENV || process.env.NODE_ENV,
    hasJwtSecret: !!(config.JWT_SECRET || process.env.JWT_SECRET),
    hasSessionSecret: !!(config.SESSION_SECRET || process.env.SESSION_SECRET),
    hasGoogleMapsKey: !!(config.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
    hasImageKitConfig: !!((config.IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY) && 
                         (config.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY)),
    hasEmailConfig: !!((config.EMAIL_HOST || process.env.EMAIL_HOST) && 
                      (config.EMAIL_PASS || process.env.EMAIL_PASS)),
    databasePath: config.DB_PATH || process.env.DB_PATH,
    frontendUrl: config.FRONTEND_URL || process.env.FRONTEND_URL,
    apiBaseUrl: config.API_BASE_URL || process.env.API_BASE_URL
  };
}
