/**
 * Main Application Entry Point
 * Modular Express server with organized routing and middleware
 */

// Import core dependencies
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Dynamically import connect-sqlite3 for ES modules compatibility
const SQLiteStore = (await import('connect-sqlite3')).default(session);

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import configuration (dotenv is loaded in environment.js)
import { config } from './config/environment.js';
import { getCorsConfig } from './config/cors.js';
import { initializeDatabase } from './config/database.js';
import { initializeImageKit } from './config/imagekit.js';
import { runPhotoMigrations } from './migrations/add_photo_support.js';

console.log('APP.JS >><< DEBUG ENV:', process.env.IMAGEKIT_PUBLIC_KEY, process.env.EMAIL_USER, process.env.NODE_ENV);

// JWT Secret for sessions
const jwtSecret = config.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Import middleware
import { apiLimiter, authLimiter, registrationLimiter, passwordResetLimiter, adminLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';

// Import the router loader utility
import { loadRouter, createFallbackRouter } from './utils/routerLoader.js';

// Import secure logging utility
import { createLogger, createRequestLogger } from './utils/logger.js';
const logger = createLogger('SERVER');

// Initialize database first, before loading any routes
logger.info('Initializing database...');
await initializeDatabase();

// Run photo migrations
logger.info('Setting up photo support...');
try {
    await runPhotoMigrations();
} catch (error) {
    logger.warn('Photo migration warning:', { error: error.message });
    }

// Initialize ImageKit
logger.info('Initializing ImageKit...');
try {
    initializeImageKit();
} catch (error) {
    logger.warn('ImageKit initialization warning:', { error: error.message });
    }

// Initialize Email Service
logger.info('Initializing Email Service...');
try {
    const emailServiceModule = await import('./services/emailService.js');
    await emailServiceModule.initializeEmailService();
    logger.info('Email service initialization complete');
} catch (error) {
    logger.warn('Email service initialization warning:', { error: error.message });
}

// Load all route modules using the router loader
logger.debug('Loading route modules...');
let authRoutes, locationRoutes, userRoutes, adminRoutes, databaseRoutes, healthRoutes, photoRoutes;

// Function to load a router with fallback
const loadRouterSafely = async (routeName) => {
  try {
    return await loadRouter(routeName);
  } catch (err) {
    logger.error(`Could not load ${routeName} routes:`, { error: err.message });
    return createFallbackRouter(routeName);
  }
};

// Use Promise.all to load all routers concurrently
const routerPromises = await Promise.all([
  loadRouterSafely('auth'),
  loadRouterSafely('locations'),
  loadRouterSafely('users'),
  loadRouterSafely('admin'),
  loadRouterSafely('database'),
  loadRouterSafely('health'),
  loadRouterSafely('photos')
]);

// Assign the routers
[authRoutes, locationRoutes, userRoutes, adminRoutes, databaseRoutes, healthRoutes, photoRoutes] = routerPromises;

// Create Express app
const app = express();

// Configure trust proxy for Render deployment
// This is required for rate limiting and IP detection behind proxies
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy (Render's load balancer)
    logger.info('Trust proxy enabled for production deployment');
}

// Import and start session service after database is initialized
const sessionService = await import('./services/sessionService.js');
sessionService.startSessionCleanup();

// Middleware setup
app.use(createRequestLogger('REQUEST')); // Use secure request logger

// Import security configuration
import { setSecurityHeaders, getSessionConfig, rateLimitConfig } from './config/security.js';

// Import additional security middleware
import { csrfProtection, provideCSRFToken } from './middleware/csrfProtection.js';
import { validateRequestSize } from './middleware/inputValidation.js';

// Security middleware with enhanced headers
app.use(setSecurityHeaders);

// CSRF protection and token provision
app.use(provideCSRFToken);

// Request size validation
app.use(validateRequestSize);

app.use(cors(getCorsConfig()));
app.use(express.json({ limit: '10mb' })); // Set JSON payload limit

// Remove debug logging middleware in production
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        logger.debug('Incoming request details', {
            method: req.method,
            path: req.path,
            headers: req.headers,
            body: req.method === 'PUT' && req.path.includes('/api/locations/') ? req.body : undefined
        });
        next();
    });
}

app.use(express.static(path.join(__dirname, '..'), {
    // Use versioned cache strategy - cache files with version params, no-cache others
    maxAge: 0, // Default to no cache
    setHeaders: (res, path, stat) => {
        // Ensure JavaScript files are served with correct MIME type for ES modules
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        // Ensure CSS files have correct MIME type
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        
        // Cache-busting strategy: Only cache files when version parameter is present
        const url = res.req.url;
        const hasVersionParam = url.includes('?v=') || url.includes('&v=');
        
        if (hasVersionParam && process.env.NODE_ENV === 'production') {
            // Files with version parameters can be cached longer since they're versioned
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        } else {
            // Files without version parameters should not be cached
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Apply rate limiting - enabled in production, disabled in development for easier testing
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', apiLimiter);
    app.use('/api/login', authLimiter);
    app.use('/api/register', registrationLimiter);
    app.use('/api/forgot-password', passwordResetLimiter);
    app.use('/api/reset-password', passwordResetLimiter);
    app.use('/api/admin', adminLimiter);
    logger.info('API rate limiting enabled for production');
} else {
    logger.warn('API rate limiting disabled for development');
}

// Session configuration with enhanced security using SQLite
app.use(session({
  secret: jwtSecret,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: path.join(__dirname, '..', 'server')
  }),
  name: 'sessionId',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Handle the root path (/) by redirecting to login.html
app.get('/', (req, res) => {
  logger.debug('Request to root path, redirecting to login.html');
  return res.redirect('/login.html');
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/photos', photoRoutes);

// CSRF token endpoint
import { getCSRFToken } from './middleware/csrfProtection.js';
app.get('/api/csrf-token', getCSRFToken);

// Direct ImageKit URL endpoint for testing
app.get('/api/direct-imagekit-url', (req, res) => {
    console.log('🔍 DIRECT ROUTE: /api/direct-imagekit-url was called');
    try {
        const imagekitUrl = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/rgriola';
        console.log('📸 Sending imagekit URL directly:', imagekitUrl);
        res.json({ imagekitUrl });
    } catch (error) {
        console.error('❌ Error in direct route:', error);
        res.status(500).json({ error: 'Configuration not available' });
    }
});

// Legacy health check endpoint (if the health routes fail to load)
app.get('/api/health-check', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Extended health check endpoint (with system details)
app.get('/api/health/extended', async (req, res) => {
    try {
        // Try to dynamically import admin service
        let health = { status: 'basic' };
        try {
            const adminServiceModule = await import('./services/adminService.js');
            const { getSystemHealth } = adminServiceModule;
            health = await getSystemHealth();
        } catch (serviceError) {
            logger.error('Health service not available:', { error: serviceError.message });
        }
        
        // Try to get package version
        let version = '1.0.0';
        try {
            const packageJson = JSON.parse(
                await fs.promises.readFile(new URL('../package.json', import.meta.url), 'utf8')
            );
            version = packageJson.version || '1.0.0';
        } catch (packageError) {
            logger.error('Package info not available:', { error: packageError.message });
        }
        
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            version: version,
            environment: process.env.NODE_ENV || 'development',
            health: health
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Server is running but health check failed',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Basic route for testing modules
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Modular server is working!',
        modules: {
            config: 'loaded',
            database: 'initialized',
            auth: 'loaded',
            locations: 'loaded',
            users: 'loaded',
            admin: 'loaded',
            cors: 'configured',
            rateLimit: 'active',
            errorHandler: 'active',
            utilities: 'loaded'
        },
        endpoints: {
            health: '/api/health',
            test: '/api/test',
            auth: '/api/auth/*',
            locations: '/api/locations/*',
            users: '/api/user/*',
            admin: '/api/admin/*'
        }
    });
});

// Simple test endpoint that always works
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Test endpoint working',
        timestamp: new Date().toISOString(),
        basic: {
            appName: 'Google Search Me',
            environment: process.env.NODE_ENV || 'development'
        },
        request: {
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip
        }
    });
});

// Server info endpoint
app.get('/api/info', async (req, res) => {
    // Import helpers module using dynamic import
    const helpersModule = await import('./utils/helpers.js');
    const { formatBytes } = helpersModule;
    const memoryUsage = process.memoryUsage();
    
    // Import package.json (needs to be read as a file in ES modules)
    const packageJson = JSON.parse(
        await fs.promises.readFile(new URL('../package.json', import.meta.url), 'utf8')
    );
    
    res.json({
        success: true,
        server: {
            name: 'Google Search Me API',
            version: packageJson.version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        },
        memory: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external)
        },
        features: [
            'Authentication & Authorization',
            'Location Management',
            'Admin Panel',
            'Rate Limiting',
            'Error Handling',
            'Request Logging',
            'Email Services (configurable)',
            'Database Management'
        ]
    });
});

// Email test endpoint for debugging
app.get('/api/email-test', async (req, res) => {
    try {
        const emailServiceModule = await import('./services/emailService.js');
        const result = await emailServiceModule.testEmailConfiguration();
        
        res.json({
            success: true,
            message: 'Email test completed',
            result: result,
            environment: {
                EMAIL_MODE: process.env.EMAIL_MODE,
                EMAIL_SERVICE: process.env.EMAIL_SERVICE,
                EMAIL_USER: process.env.EMAIL_USER ? 'CONFIGURED' : 'MISSING',
                EMAIL_PASS: process.env.EMAIL_PASS ? 'CONFIGURED' : 'MISSING',
                EMAIL_HOST: process.env.EMAIL_HOST,
                EMAIL_PORT: process.env.EMAIL_PORT
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler (must be last)
app.use(notFoundHandler);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
    logger.info(`Modular server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`Test endpoint: http://localhost:${PORT}/api/test`);
    logger.debug(`Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    logger.debug(`Location endpoints: http://localhost:${PORT}/api/locations/*`);
    logger.debug(`User endpoints: http://localhost:${PORT}/api/user/*`);
    logger.debug(`Admin endpoints: http://localhost:${PORT}/api/admin/*`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Setup graceful shutdown
import { gracefulShutdown } from './middleware/errorHandler.js';
import { getDatabase } from './config/database.js';
gracefulShutdown(server, getDatabase());

// Export for testing
export default app;
