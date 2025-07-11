/**
 * Admin Middleware
 * Handles admin authorization, logging, and validation
 */

/**
 * Middleware to require admin privileges
 * Must be used after authenticateToken middleware
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    next();
};

/**
 * Middleware to log admin actions for audit purposes
 */
const logAdminAction = (action) => {
    return (req, res, next) => {
        const adminId = req.user?.userId;
        const adminUsername = req.user?.username;
        const targetId = req.params.userId || req.params.placeId || 'N/A';
        const timestamp = new Date().toISOString();
        
        console.log(`🔒 [ADMIN ACTION] ${timestamp} - Admin ${adminUsername} (ID: ${adminId}) performed: ${action} on target: ${targetId}`);
        
        // Store action details for potential response logging
        req.adminAction = {
            action,
            adminId,
            adminUsername,
            targetId,
            timestamp
        };
        
        next();
    };
};

/**
 * Middleware to validate admin-specific input
 */
const validateAdminInput = (validationRules) => {
    return (req, res, next) => {
        const { body, params } = req;
        const errors = [];
        
        // Validate based on provided rules
        if (validationRules.includes('userId') && params.userId) {
            const userId = parseInt(params.userId);
            if (isNaN(userId) || userId <= 0) {
                errors.push('Invalid user ID');
            }
        }
        
        if (validationRules.includes('placeId') && params.placeId) {
            if (!params.placeId || typeof params.placeId !== 'string') {
                errors.push('Invalid place ID');
            }
        }
        
        if (validationRules.includes('role') && body.action) {
            if (!['promote', 'demote'].includes(body.action)) {
                errors.push('Invalid role action. Must be "promote" or "demote"');
            }
        }
        
        if (validationRules.includes('userFields') && body) {
            // Validate admin user update fields
            const allowedFields = ['firstName', 'lastName', 'email', 'isActive', 'isAdmin', 'emailVerified'];
            const providedFields = Object.keys(body);
            const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
            
            if (invalidFields.length > 0) {
                errors.push(`Invalid fields: ${invalidFields.join(', ')}`);
            }
        }
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors
            });
        }
        
        next();
    };
};

/**
 * Middleware to prevent self-modification in admin operations
 */
const preventSelfModification = (req, res, next) => {
    const targetUserId = parseInt(req.params.userId);
    const adminUserId = req.user.userId;
    
    if (targetUserId === adminUserId) {
        return res.status(400).json({ 
            error: 'Cannot perform this action on your own account' 
        });
    }
    
    next();
};

module.exports = {
    requireAdmin,
    logAdminAction,
    validateAdminInput,
    preventSelfModification
};
