/**
 * Environment Configuration
 * Centralized configuration management
 */

export const config = {
    // Server Configuration
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Security Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here-change-in-production',
    BCRYPT_ROUNDS: 12,
    
    // Database Configuration
    DB_PATH: process.env.DB_PATH || './locations.db',
    
    // Rate Limiting Configuration
    RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        authMax: 5 // stricter limit for auth endpoints
    },
    
    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    
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
    
    // Session Configuration
    SESSION_SECRET: process.env.SESSION_SECRET || 'session-secret-change-in-production',
    
    // API Configuration
    API_PREFIX: '/api',
    
    // Development flags
    isDevelopment: () => config.NODE_ENV === 'development',
    isProduction: () => config.NODE_ENV === 'production',
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validate required environment variables in production
export function validateConfig() {
    if (config.isProduction()) {
        const requiredVars = ['JWT_SECRET', 'SESSION_SECRET'];
        const missing = requiredVars.filter(varName => {
            const value = process.env[varName];
            return !value || value === config[varName.replace('_', '')];
        });
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
        }
    }
}

export default config;
