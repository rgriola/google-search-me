/**
 * Main Application Entry Point
 * Modular Express server with organized routing and middleware
 */

// Load environment variables from .env files
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Import configuration
const { config } = require('./config/environment');
const { getCorsConfig } = require('./config/cors');
const { initializeDatabase } = require('./config/database');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const databaseRoutes = require('./routes/database');

// Import services
const sessionService = require('./services/sessionService');

// Create Express app
const app = express();

// Initialize database
initializeDatabase();

// Start session cleanup service
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

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const { getSystemHealth } = require('./services/adminService');
        const health = await getSystemHealth();
        
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            version: require('../package.json').version || '1.0.0',
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
            auth: '/api/auth/*',
            locations: '/api/locations/*',
            users: '/api/user/*',
            admin: '/api/admin/*'
        }
    });
});

// Server info endpoint
app.get('/api/info', (req, res) => {
    const { formatBytes } = require('./utils/helpers');
    const memoryUsage = process.memoryUsage();
    
    res.json({
        success: true,
        server: {
            name: 'Google Search Me API',
            version: require('../package.json').version || '1.0.0',
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
const { gracefulShutdown } = require('./middleware/errorHandler');
const { getDatabase } = require('./config/database');
gracefulShutdown(server, getDatabase());

module.exports = app;
