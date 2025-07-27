/**
 * Validation Middleware Module
 * Handles input validation for various endpoints
 */

/**
 * Password validation function
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push('Password must be at least 8 characters long');
    if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChar) errors.push('Password must contain at least one special character');

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Email validation with enhanced regex and domain checking
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateEmail(email) {
    // Enhanced email regex pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }
    
    // Check email length
    if (email.length > 254) {
        return { isValid: false, error: 'Email address is too long' };
    }
    
    // Check for common invalid patterns
    const invalidPatterns = [
        /\.\./,  // consecutive dots
        /^\./, // starts with dot
        /\.$/, // ends with dot
        /@\./,  // @ followed by dot
        /\.@/   // dot followed by @
    ];
    
    for (const pattern of invalidPatterns) {
        if (pattern.test(email)) {
            return { isValid: false, error: 'Invalid email format' };
        }
    }
    
    // Check for common disposable email domains (optional)
    const disposableEmailDomains = [
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com',
        'tempmail.org',
        'throwaway.email'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableEmailDomains.includes(domain)) {
        return { isValid: false, error: 'Disposable email addresses are not allowed' };
    }
    
    return { isValid: true };
}

/**
 * Username validation function
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
function validateUsername(username) {
    const errors = [];
    
    if (!username || username.length < 3) {
        errors.push('Username must be at least 3 characters long');
    }
    
    if (username && username.length > 30) {
        errors.push('Username must be less than 30 characters');
    }
    
    // Allow letters, numbers, underscore, hyphen, dots, and @ symbol
    // This allows email-like usernames while still being safe
    const usernameRegex = /^[a-zA-Z0-9._@-]+$/;
    if (username && !usernameRegex.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, hyphens, periods, and @ symbol (email format allowed)');
    }
    
    // Don't allow usernames that start or end with special characters
    if (username && /^[._-]|[._-]$/.test(username)) {
        errors.push('Username cannot start or end with special characters');
    }
    
    // Don't allow consecutive special characters
    if (username && /[._-]{2,}/.test(username)) {
        errors.push('Username cannot have consecutive special characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Location validation function
 * @param {Object} location - Location object to validate
 * @returns {Object} Validation result
 */
function validateLocation(location) {
    const errors = [];
    // Handle both camelCase and snake_case formats
    const placeId = location.placeId || location.place_id;
    const { name, lat, lng, type, entry_point, parking, access, production_notes, state, zipcode } = location;
    
    console.log('🔍 LOCATION VALIDATION DEBUG:');
    console.log('Raw location object:', JSON.stringify(location, null, 2));
    console.log('Extracted values:', {
        type: `"${type}" (${typeof type})`,
        entry_point: `"${entry_point}" (${typeof entry_point})`,
        parking: `"${parking}" (${typeof parking})`,
        access: `"${access}" (${typeof access})`
    });
    
    if (!placeId) errors.push('Place ID is required');
    if (!name || name.trim().length === 0) errors.push('Location name is required');
    if (lat === undefined || lat === null || isNaN(lat)) errors.push('Valid latitude is required');
    if (lng === undefined || lng === null || isNaN(lng)) errors.push('Valid longitude is required');
    
    // Validate latitude range
    if (lat < -90 || lat > 90) errors.push('Latitude must be between -90 and 90');
    
    // Validate longitude range
    if (lng < -180 || lng > 180) errors.push('Longitude must be between -180 and 180');
    
    // Validate location type (required) - updated to include permanent location types
    const validTypes = ['broll', 'interview', 'live anchor', 'live reporter', 'stakeout', 'headquarters', 'bureau', 'office'];
    console.log(`🔍 Type validation: value="${type}", isEmpty=${!type || type.trim() === ''}, isValid=${validTypes.includes(type)}`);
    if (!type || type.trim() === '') {
        errors.push('Location type is required');
    } else if (!validTypes.includes(type)) {
        errors.push('Invalid location type. Must be one of: ' + validTypes.join(', ') + '. Got: ' + type);
    }
    
    // Validate entry_point (required with specific values)
    const validEntryPoints = ['front door', 'backdoor', 'garage', 'parking lot'];
    console.log(`🔍 Entry point validation: value="${entry_point}", isEmpty=${!entry_point || entry_point.trim() === ''}, isValid=${validEntryPoints.includes(entry_point)}`);
    if (!entry_point || entry_point.trim() === '') {
        errors.push('Entry point is required');
    } else if (!validEntryPoints.includes(entry_point)) {
        errors.push('Invalid entry point. Must be one of: ' + validEntryPoints.join(', '));
    }
    
    // Validate parking (required with specific values)
    const validParking = ['street', 'driveway', 'garage'];
    console.log(`🔍 Parking validation: value="${parking}", isEmpty=${!parking || parking.trim() === ''}, isValid=${validParking.includes(parking)}`);
    if (!parking || parking.trim() === '') {
        errors.push('Parking is required');
    } else if (!validParking.includes(parking)) {
        errors.push('Invalid parking. Must be one of: ' + validParking.join(', '));
    }
    
    // Validate access (required with specific values)
    const validAccess = ['ramp', 'stairs only', 'doorway', 'garage'];
    console.log(`🔍 Access validation: value="${access}", isEmpty=${!access || access.trim() === ''}, isValid=${validAccess.includes(access)}`);
    if (!access || access.trim() === '') {
        errors.push('Access is required');
    } else if (!validAccess.includes(access)) {
        errors.push('Invalid access. Must be one of: ' + validAccess.join(', '));
    }
    
    // Validate production_notes length
    if (production_notes && production_notes.length > 200) {
        errors.push('Production notes must be 200 characters or less');
    }
    
    // Validate address component lengths
    if (state && state.length > 2) {
        errors.push('State must be 2 characters or less');
    }
    
    if (zipcode && zipcode.length > 5) {
        errors.push('Zipcode must be 5 characters or less');
    }
    
    // Validate parking (optional but limit length)
    if (parking && parking.length > 300) {
        errors.push('Parking information must be less than 300 characters');
    }
    
    // Validate access (optional but limit length)
    if (access && access.length > 300) {
        errors.push('Access information must be less than 300 characters');
    }
    
    console.log('🔍 VALIDATION RESULT:', {
        isValid: errors.length === 0,
        errors: errors
    });

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Middleware to sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeRequestBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitizedBody = {};
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                sanitizedBody[key] = sanitizeInput(value);
            } else {
                sanitizedBody[key] = value;
            }
        }
        req.body = sanitizedBody;
    }
    next();
};

/**
 * Middleware to validate registration input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRegistration = (req, res, next) => {
    const { username, email, password, firstName, lastName } = req.body;
    
    console.log('🔍 REGISTRATION VALIDATION DEBUG:');
    console.log('Request body:', { username, email, password: password ? '[PRESENT]' : '[MISSING]', firstName, lastName });
    
    const errors = [];
    
    // Validate username
    if (!username) {
        errors.push('Username is required');
    } else {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            errors.push(...usernameValidation.errors);
        }
    }
    
    // Validate email
    if (!email) {
        errors.push('Email is required');
    } else {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            errors.push(emailValidation.error);
        }
    }
    
    // Validate password
    if (!password) {
        errors.push('Password is required');
    } else {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            errors.push(...passwordValidation.errors);
        }
    }
    
    if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        return res.status(400).json({ error: errors.join(', ') });
    }
    
    console.log('✅ Validation passed');
    next();
};

/**
 * Middleware to validate login input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
        return res.status(400).json({ error: emailValidation.error });
    }
    
    next();
};

/**
 * Middleware to validate location input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateLocationInput = (req, res, next) => {
    const locationValidation = validateLocation(req.body);
    
    if (!locationValidation.isValid) {
        return res.status(400).json({ error: locationValidation.errors.join(', ') });
    }
    
    next();
};

export {
    validatePassword,
    validateEmail,
    validateUsername,
    validateLocation,
    sanitizeInput,
    sanitizeRequestBody,
    validateRegistration,
    validateLogin,
    validateLocationInput
};
