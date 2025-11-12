/**
 * CORS Configuration Module
 * Handles Cross-Origin Resource Sharing settings for the application
 * Uses environment-specific configuration
 */

// Import environment config using ES modules
import { config } from './environment.js';

/**
 * Base CORS configuration object
 * @type {Object}
 */
const baseCorsConfig = {
    // Allow credentials (cookies, authorization headers, etc.)
    credentials: true,
    
    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // Allowed headers
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Requested-With'
    ],
    
    // Expose headers to the client
    exposedHeaders: ['Authorization'],
    
    // How long the browser should cache preflight responses (in seconds)
    maxAge: 86400, // 24 hours
    
    // Handle preflight requests
    optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
};

/**
 * Development environment CORS options
 */
const corsDevOptions = {
    ...baseCorsConfig,
    origin: 'http://localhost:3000',
    credentials: true
};

/**
 * Production environment CORS options
 */
const corsProdOptions = {
    ...baseCorsConfig,
    //origin: ['https://google-search-me.onrender.com'],
    origin: ['https://merkelvision.com'],
    credentials: true
};

/**
 * Default CORS options
 */
const corsOptions = config.isProduction() ? corsProdOptions : corsDevOptions;

/**
 * Get CORS configuration based on environment
 * @returns {Object} CORS configuration object
 */
function getCorsConfig() {
    // Get origin from environment-specific config
    const originConfig = config.CORS?.origin || config.FRONTEND_URL || 'http://localhost:3000';
    
    return {
        ...baseCorsConfig,
        origin: originConfig,
        credentials: config.CORS?.credentials !== undefined ? config.CORS.credentials : true
    };
}

// Export the functions and configurations
export {
    baseCorsConfig,
    corsOptions,
    corsDevOptions,
    corsProdOptions,
    getCorsConfig
};
