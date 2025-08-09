/**
 * Authentication Routes Module
 * Handles all authentication-related API endpoints
 */

import express from 'express';
const router = express.Router();

// Import services and middleware
import * as authService from '../services/authService.js';
import * as sessionService from '../services/sessionService.js';
import * as emailService from '../services/emailService.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validateRegistration, validateLogin, validatePassword, sanitizeRequestBody } from '../middleware/validation.js';
import { authLimiter, registrationLimiter, passwordResetLimiter } from '../middleware/rateLimit.js';

// Register new user
router.post('/register', registrationLimiter, sanitizeRequestBody, validateRegistration, async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const userCheck = await authService.checkUserExists(username, email);
        if (userCheck.exists) {
            // Provide helpful error message based on what exists
            let errorMessage = 'An account already exists with this information.';
            let errorCode = 'USER_EXISTS';
            
            if (userCheck.emailExists && userCheck.usernameExists) {
                errorMessage = 'An account already exists with this email and username.';
                errorCode = 'EMAIL_AND_USERNAME_EXISTS';
            } else if (userCheck.emailExists) {
                errorMessage = 'An account already exists with this email address. Did you forget your password?';
                errorCode = 'EMAIL_EXISTS';
            } else if (userCheck.usernameExists) {
                errorMessage = 'This username is already taken. Please choose a different username.';
                errorCode = 'USERNAME_EXISTS';
            }
            
            return res.status(409).json({ 
                error: errorMessage,
                code: errorCode,
                suggestions: userCheck.emailExists ? ['login', 'reset_password'] : ['choose_different_username']
            });
        }

        // Create user
        console.log('🔍 REGISTRATION DEBUG: Creating user with data:', {
            username,
            email,
            firstName,
            lastName,
            password: '[HIDDEN]'
        });
        
        const newUser = await authService.createUser({
            username,
            email,
            password,
            firstName,
            lastName
        });
        
        console.log('🔍 REGISTRATION DEBUG: User created successfully:', {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            verificationToken: newUser.verificationToken ? 'generated' : 'missing'
        });

        // Send verification email
        console.log('🔍 REGISTRATION DEBUG: Attempting to send verification email...');
        const emailSent = await emailService.sendVerificationEmail(
            email, 
            username, 
            newUser.verificationToken
        );
        
        console.log('🔍 REGISTRATION DEBUG: Email send result:', emailSent);
        
        if (!emailSent && process.env.EMAIL_USER) {
            // If email service is configured but failed to send, return error
            console.log('🔍 REGISTRATION DEBUG: Email failed to send, returning error');
            return res.status(500).json({ 
                error: 'Failed to send verification email. Please try again.' 
            });
        }

        // Generate JWT token (user can use the app but with limited access until verified)
        const token = authService.generateToken({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            email_verified: false,
            is_admin: false
        });

        res.status(201).json({
            success: true,
            message: process.env.EMAIL_USER 
                ? 'User registered successfully. Please check your email to verify your account.'
                : 'User registered successfully. Email verification is disabled in development.',
            token: token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                emailVerified: false,
                isAdmin: false
            },
            requiresVerification: !!process.env.EMAIL_USER
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific database errors
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Username or email already exists' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', authLimiter, sanitizeRequestBody, validateLogin, async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        
        // Extract user agent and IP address for session tracking
        const userAgent = req.get('User-Agent');
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Authenticate user with session creation
        const authResult = await authService.authenticateUser(
            email, 
            password, 
            userAgent, 
            ipAddress, 
            rememberMe || false
        );
        
        if (!authResult.success) {
            const response = { error: authResult.error };
            
            // If email verification is required, provide additional info
            if (authResult.requiresEmailVerification) {
                response.requiresEmailVerification = true;
                response.resendEndpoint = '/api/auth/resend-verification-public';
                response.verificationPageUrl = '/verify-email.html?reason=login_required';
            }
            
            return res.status(401).json(response);
        }

        const response = {
            success: true,
            message: 'Login successful',
            token: authResult.token,
            user: authResult.user
        };
        
        // Include session info if available
        if (authResult.session) {
            response.session = authResult.session;
            console.log(`🔐 Session created for ${email}: ${authResult.session.sessionId}`);
        }

        res.json(response);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout user with session invalidation
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const { sessionToken } = req.body;
        
        // If sessionToken is provided, invalidate the specific session
        if (sessionToken) {
            const invalidated = await sessionService.invalidateSession(sessionToken);
            console.log(`🚫 Session ${sessionToken} invalidated: ${invalidated}`);
        }
        
        // For extra security, you could also invalidate all sessions for this user:
        // await sessionService.invalidateUserSessions(req.user.id);
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        // Even if session invalidation fails, we should still allow logout
        res.json({
            success: true,
            message: 'Logout successful (session cleanup may have failed)'
        });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await authService.findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                emailVerified: user.email_verified,
                isAdmin: user.is_admin,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
    console.log('🔍 AUTH VERIFY: Request received');
    console.log('🔍 AUTH VERIFY: User from token:', {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        isAdmin: req.user.isAdmin
    });
    
    // Set cache control headers to prevent caching issues
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    const responseData = {
        success: true,
        valid: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            firstName: req.user.first_name || null,
            lastName: req.user.last_name || null,
            emailVerified: req.user.emailVerified,
            isAdmin: Boolean(req.user.isAdmin) // Ensure boolean
        }
    };
    
    console.log('🔍 AUTH VERIFY: Sending response:', responseData);
    res.json(responseData);
});

// Update user profile
router.put('/profile', authenticateToken, sanitizeRequestBody, async (req, res) => {
    try {
        const { username, firstName, lastName, email } = req.body;
        const userId = req.user.id;

        // Validate username if provided
        if (username && username !== req.user.username) {
            // Check username format
            if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
                return res.status(400).json({ 
                    error: 'Username must be 3-50 characters long and contain only letters, numbers, and underscores' 
                });
            }
            
            // Check if username is already taken
            const existingUser = await authService.findUserByUsername(username);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        // If email is being changed, validate it
        if (email && email !== req.user.email) {
            const existingUser = await authService.findUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({ error: 'Email already in use' });
            }
        }

        // Update profile
        const updatedUser = await authService.updateUserProfile(userId, {
            username: username || req.user.username,
            firstName,
            lastName,
            email: email || req.user.email
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                emailVerified: updatedUser.email_verified,
                isAdmin: updatedUser.is_admin
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.put('/change-password', authenticateToken, sanitizeRequestBody, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        // Get current user
        const user = await authService.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const passwordMatch = await authService.verifyPassword(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ error: passwordValidation.errors.join(', ') });
        }

        // Update password
        await authService.updateUserPassword(userId, newPassword);

        // Send security notification
        await emailService.sendSecurityNotificationEmail(
            user.email,
            user.username,
            'password_change'
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request password reset
router.post('/forgot-password', passwordResetLimiter, sanitizeRequestBody, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user exists
        const user = await authService.findUserByEmail(email);

        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetData = await authService.setPasswordResetToken(email);

        if (resetData.userUpdated) {
            // Send password reset email
            await emailService.sendPasswordResetEmail(email, user.username, resetData.resetToken);
        }

        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
            // In development, include the token for testing
            ...(process.env.NODE_ENV === 'development' && { resetToken: resetData.resetToken })
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset password with token
router.post('/reset-password', passwordResetLimiter, sanitizeRequestBody, async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ error: passwordValidation.errors.join(', ') });
        }

        // Verify reset token
        const user = await authService.verifyPasswordResetToken(token);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Update password
        await authService.updateUserPassword(user.id, newPassword);

        // Clear reset token
        await authService.clearPasswordResetToken(user.id);

        // Send security notification
        await emailService.sendSecurityNotificationEmail(
            user.email,
            user.username,
            'password_reset'
        );

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify email address
router.post('/verify-email', sanitizeRequestBody, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }

        // Verify email token
        const result = await authService.verifyEmailToken(token);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        // Send welcome email
        await emailService.sendWelcomeEmail(result.user.email, result.user.username);

        res.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Resend verification email (public route for unverified users)
router.post('/resend-verification-public', passwordResetLimiter, sanitizeRequestBody, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Use the new resend verification function
        const result = await authService.resendEmailVerification(email);
        
        if (!result.success) {
            return res.status(400).json({ error: result.error });
            }

        // Send verification email
        const emailSent = await emailService.sendVerificationEmail(
            result.user.email,
            result.user.firstName || 'User',
            result.verificationToken
        );

        if (!emailSent && process.env.EMAIL_USER) {
            return res.status(500).json({ error: 'Failed to send verification email' });
            }

        res.json({
            success: true,
            message: 'Verification email sent successfully. Please check your inbox.'
        });

    } catch (error) {
        console.error('Public resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Resend verification email (for authenticated users)
router.post('/resend-verification', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user details
        const user = await authService.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.email_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = await authService.generateNewVerificationToken(userId);

        // Send verification email
        const emailSent = await emailService.sendVerificationEmail(
            user.email,
            user.username,
            verificationToken
        );

        if (!emailSent && process.env.EMAIL_USER) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        res.json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update GPS permission status
router.put('/gps-permission', authenticateToken, async (req, res) => {
    try {
        const { permission } = req.body;
        const userId = req.user.id;

        if (!permission || !['granted', 'denied', 'not_asked'].includes(permission)) {
            return res.status(400).json({ error: 'Invalid GPS permission status' });
        }

        await authService.updateUserGPSPermission(userId, permission);

        res.json({
            success: true,
            message: 'GPS permission updated successfully',
            gps_permission: permission
        });

    } catch (error) {
        console.error('GPS permission update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get GPS permission status
router.get('/gps-permission', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const permissionData = await authService.getUserGPSPermission(userId);
        
        if (!permissionData) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            gps_permission: permissionData.gps_permission || 'not_asked',
            gps_permission_updated: permissionData.gps_permission_updated
        });

    } catch (error) {
        console.error('GPS permission get error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get authentication and email service status
router.get('/status', (req, res) => {
    try {
        res.json({
            success: true,
            emailEnabled: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
            registrationEnabled: true,
            loginEnabled: true,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Debug endpoint to check user existence (temporary for troubleshooting)
router.get('/debug/users', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ error: 'Email parameter required' });
        }
        
        const userCheck = await authService.checkUserExists('', email);
        const user = await authService.getUserByEmail(email);
        
        res.json({
            email,
            exists: userCheck.emailExists,
            userFound: !!user,
            environment: process.env.NODE_ENV,
            dbPath: process.env.DB_PATH || './server/locations.db',
            hasPassword: user ? !!user.password : false,
            isVerified: user ? !!user.emailVerified : false,
            createdAt: user ? user.createdAt : null
        });
    } catch (error) {
        console.error('Debug users error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;