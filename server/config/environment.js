/**
 * Environment Configuration
 * Centralized configuration management with environment-specific settings
 */

// this is server/environment.js

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Debug configuration - set to false in production
const DEBUG = process.env.DEBUG_ENV === 'true' || false;

// Debug logging function
function debug(...args) {
    if (DEBUG) {
        console.log('[ENV CONFIG]', ...args);
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Always load .env from the /server/ directory, regardless of CWD
const envPath = path.join(__dirname, '..', process.env.NODE_ENV === 'production' ? '.env.production' : '.env');
debug(`Loading environment from: ${envPath}`);

dotenv.config({ path: envPath });

// Debug log after dotenv loads (only if DEBUG is true)
debug('Environment variables loaded:', {
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  EMAIL_USER: process.env.EMAIL_USER,
  NODE_ENV: process.env.NODE_ENV
});

import development from './environments/development.js';
import production from './environments/production.js';
import test from './environments/test.js';

// Determine current environment
const NODE_ENV = process.env.NODE_ENV || 'development';
debug(`Active environment: ${NODE_ENV}`);

const envConfigs = {
  development,
  production,
  test
};

const envConfig = envConfigs[NODE_ENV] || {};
debug('Environment-specific config loaded');

// Common configuration across all environments
const commonConfig = {
    // Security Configuration
    BCRYPT_ROUNDS: 12,
    
    // Rate Limiting Configuration
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        authMax: 5 // stricter limit for auth endpoints
    },
    
    // API Configuration
    API_PREFIX: '/api',
    
    // Email Configuration (for future email features)
    SMTP: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    },
    
    // ImageKit Configuration
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || '',
    IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT || ''
};

// Merge common config with environment-specific config
export const config = {
    ...commonConfig,
    ...envConfig,
    NODE_ENV,
    
    // Helper functions
    isDevelopment: () => NODE_ENV === 'development',
    isProduction: () => NODE_ENV === 'production',
    isTest: () => NODE_ENV === 'test',
    
    // Debug flag and function
    DEBUG,
    debug
};

// Validate required environment variables in production
export function validateConfig() {
    if (config.isProduction()) {
        debug('Validating production configuration...');
        
        const requiredVars = [
            'JWT_SECRET', 
            'SESSION_SECRET',
            'IMAGEKIT_PUBLIC_KEY',
            'IMAGEKIT_PRIVATE_KEY', 
            'IMAGEKIT_URL_ENDPOINT'
        ];
        
        const missing = requiredVars.filter(varName => {
            return !config[varName];
        });
        
        if (missing.length > 0) {
            const errorMsg = `Missing required environment variables in production: ${missing.join(', ')}`;
            debug(`Validation failed: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        
        debug('Production configuration validated successfully');
    } else {
        debug('Skipping full validation in non-production environment');
    }
}

// Log final configuration if debugging is enabled
if (DEBUG) {
    // Create a safe copy of config for logging (without sensitive data)
    const safeConfig = { ...config };
    
    // Remove sensitive values
    delete safeConfig.IMAGEKIT_PRIVATE_KEY;
    if (safeConfig.SMTP && safeConfig.SMTP.auth) {
        safeConfig.SMTP.auth = { ...safeConfig.SMTP.auth, pass: '[FILTERED]' };
    }
    
    debug('Final configuration:', safeConfig);
}

export default config;
