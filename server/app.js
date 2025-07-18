/**
 * Main Application Entry Point
 * Modular Express server with organized routing and middleware
 */

// Load environment variables from .env files
import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

// Import core dependencies
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import configuration
import { config } from './config/environment.js';
import { getCorsConfig } from './config/cors.js';
import { initializeDatabase } from './config/database.js';

// Import middleware
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';

// Import the router loader utility
import { loadRouter, createFallbackRouter } from './utils/routerLoader.js';

// Initialize database first, before loading any routes
console.log('🗃️ Initializing database...');
await initializeDatabase();

// Load all route modules using the router loader
console.log('📁 Loading route modules...');
let authRoutes, locationRoutes, userRoutes, adminRoutes, databaseRoutes, healthRoutes;

// Function to load a router with fallback
const loadRouterSafely = async (routeName) => {
  try {
    return await loadRouter(routeName);
  } catch (err) {
    console.error(`❌ Could not load ${routeName} routes:`, err.message);
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
  loadRouterSafely('health')
]);

// Assign the routers
[authRoutes, locationRoutes, userRoutes, adminRoutes, databaseRoutes, healthRoutes] = routerPromises;

// Create Express app
const app = express();

// Import and start session service after database is initialized
const sessionService = await import('./services/sessionService.js');
sessionService.startSessionCleanup();

// Middleware setup
app.use(requestLogger); // Log all requests

// Security headers
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production' && req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    // Remove server header for security
    res.removeHeader('X-Powered-By');
    
    next();
});

app.use(cors(getCorsConfig()));
app.use(express.json({ limit: '10mb' })); // Set JSON payload limit
app.use(express.static(path.join(__dirname, '..'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 // Cache static files in production
}));
app.use(apiLimiter); // Apply rate limiting to all routes

// Session configuration
app.use(session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));


// Handle the root path (/) by redirecting to login.html
app.get('/', (req, res) => {
  console.log('📍 Request to root path, redirecting to login.html');
  return res.redirect('/login.html');
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/health', healthRoutes);

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
            console.error('Health service not available:', serviceError.message);
        }
        
        // Try to get package version
        let version = '1.0.0';
        try {
            const packageJson = JSON.parse(
                await fs.promises.readFile(new URL('../package.json', import.meta.url), 'utf8')
            );
            version = packageJson.version || '1.0.0';
        } catch (packageError) {
            console.error('Package info not available:', packageError.message);
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

// Error handling middleware
app.use(errorHandler);

// 404 handler (must be last)
app.use(notFoundHandler);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
    console.log(`🚀 Modular server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    console.log(`🌍 Location endpoints: http://localhost:${PORT}/api/locations/*`);
    console.log(`👤 User endpoints: http://localhost:${PORT}/api/user/*`);
    console.log(`🔒 Admin endpoints: http://localhost:${PORT}/api/admin/*`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Setup graceful shutdown
import { gracefulShutdown } from './middleware/errorHandler.js';
import { getDatabase } from './config/database.js';
gracefulShutdown(server, getDatabase());

// Export for testing
export default app;
