/**
 * Environment Configuration
 * Centralized configuration management with environment-specific settings
 */

// Determine current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Import environment-specific configuration (using dynamic import with ES modules)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

// Setup path resolution for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import for ES modules
let envConfig;

// Use dynamic import with await to load the environment config
// We need to wrap this in a try/catch since we can't use await at the top level
try {
  const envConfigModule = await import(`./environments/${NODE_ENV}.js`);
  envConfig = envConfigModule.default;
} catch (error) {
  console.error(`Failed to load environment config for ${NODE_ENV}:`, error);
  // Fallback to a basic config to prevent crashes
  envConfig = {
    PORT: 3000,
    FRONTEND_URL: 'http://localhost:3000',
    API_BASE_URL: 'http://localhost:3000/api',
    DB_PATH: './locations.db',
    CORS: { origin: true, credentials: true }
  };
}

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
    }
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
        const requiredVars = ['JWT_SECRET', 'SESSION_SECRET'];
        const missing = requiredVars.filter(varName => {
            return !config[varName];
        });
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
        }
    }
}

export default config;
