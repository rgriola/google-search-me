/**
 * Environment Configuration
 * Centralized configuration management with environment-specific settings
 */

// Load environment variables first
import dotenv from 'dotenv';
import development from './environments/development.js';
import production from './environments/production.js';
import test from './environments/test.js';

console.log('ENVIRONMENT <<>> DEBUG ENV:', process.env.IMAGEKIT_PUBLIC_KEY, process.env.EMAIL_USER, process.env.NODE_ENV);

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

// Determine current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

const envConfigs = {
  development,
  production,
  test
};

const envConfig = envConfigs[NODE_ENV] || {};

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
    isTest: () => NODE_ENV === 'test'
};

// Validate required environment variables in production
export function validateConfig() {

    if (config.isProduction()) {
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
            throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
        }
    }
}

export default config;
