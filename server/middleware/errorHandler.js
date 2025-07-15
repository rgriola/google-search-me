/**
 * Error Handling Middleware
 * Centralized error handling and logging for the application
 */

/**
 * Global error handler middleware
 * Should be used as the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    console.error('🚨 Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? { id: req.user.userId, username: req.user.username } : null,
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large',
            message: 'The uploaded file exceeds the maximum allowed size'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            message: err.message,
            details: err.details || []
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Authentication token is invalid'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            message: 'Authentication token has expired'
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
            error: 'Database constraint violation',
            message: 'The operation violates database constraints'
        });
    }

    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

    res.status(statusCode).json({
        error: 'Internal server error',
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res) => {
    console.log(`🔍 404 - Route not found: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: {
            auth: '/api/auth/*',
            locations: '/api/locations/*',
            users: '/api/user/*',
            admin: '/api/admin/*',
            health: '/api/health'
        }
    });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Request logger middleware
 * Logs all incoming requests for debugging
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    console.log(`📨 ${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
    
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
        console.log(`📤 ${statusEmoji} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

/**
 * Database error handler
 * Handles SQLite-specific errors
 */
const handleDatabaseError = (err, operation = 'Database operation') => {
    console.error(`💾 ${operation} failed:`, err);
    
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return {
            status: 409,
            error: 'Duplicate entry',
            message: 'A record with this information already exists'
        };
    }
    
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return {
            status: 400,
            error: 'Invalid reference',
            message: 'Referenced record does not exist'
        };
    }
    
    if (err.code === 'SQLITE_BUSY') {
        return {
            status: 503,
            error: 'Database busy',
            message: 'Database is temporarily unavailable, please try again'
        };
    }
    
    return {
        status: 500,
        error: 'Database error',
        message: 'An unexpected database error occurred'
    };
};

/**
 * Graceful shutdown handler
 * Handles application shutdown gracefully
 */
const gracefulShutdown = (server, database) => {
    const shutdown = (signal) => {
        console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
        
        server.close(() => {
            console.log('🔌 HTTP server closed');
            
            if (database) {
                database.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                        process.exit(1);
                    } else {
                        console.log('💾 Database connection closed');
                        process.exit(0);
                    }
                });
            } else {
                process.exit(0);
            }
        });
        
        // Force close after 10 seconds
        setTimeout(() => {
            console.error('🚨 Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('🚨 Uncaught Exception:', err);
        process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
};

export {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    requestLogger,
    handleDatabaseError,
    gracefulShutdown
};
