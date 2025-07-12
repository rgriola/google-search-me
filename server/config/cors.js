/**
 * CORS Configuration Module
 * Handles Cross-Origin Resource Sharing settings for the application
 */

/**
 * CORS configuration object
 * @type {Object}
 */
const corsOptions = {
    // Allow requests from the frontend application
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',

    //origin: process.env.FRONTEND_URL || 'https://google-search-me.onrender.com',
    
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
 * Development-specific CORS configuration
 * More permissive settings for development environment
 */
const corsDevOptions = {
    ...corsOptions,
    origin: true, // Allow all origins in development
    credentials: true
};

/**
 * Production-specific CORS configuration
 * More restrictive settings for production environment
 */
const corsProdOptions = {
    ...corsOptions,
    origin: [
        'http://localhost:3000',
        'https://google-search-me.onrender.com' // Replace with actual production domain
    ]
};

/**
 * Get CORS configuration based on environment
 * @returns {Object} CORS configuration object
 */
function getCorsConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
        case 'production':
            return corsProdOptions;
        case 'test':
            return corsDevOptions;
        case 'development':
        default:
            return corsDevOptions;
    }
}

module.exports = {
    corsOptions,
    corsDevOptions,
    corsProdOptions,
    getCorsConfig
};
