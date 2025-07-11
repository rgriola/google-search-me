/**
 * Users Routes Module
 * Handles user-specific operations including saved locations
 */

const express = require('express');
const router = express.Router();

// Import services and middleware
const locationService = require('../services/locationService');
const authService = require('../services/authService');
const { Location } = require('../models/Location');
const { authenticateToken, validateUserOwnership } = require('../middleware/auth');
const { validateLocationInput, sanitizeRequestBody } = require('../middleware/validation');

/**
 * Get current user's saved locations
 * Requires authentication
 */
router.get('/locations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const locations = await locationService.getUserLocations(userId);
        res.json({
            success: true,
            data: locations,
            count: locations.length
        });
    } catch (error) {
        console.error('Get user locations error:', error);
        res.status(500).json({ error: 'Failed to retrieve user locations' });
    }
});

/**
 * Save a location for the current user
 * Requires authentication
 */
router.post('/locations', authenticateToken, sanitizeRequestBody, validateLocationInput, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const locationData = req.body;

        // Validate location data using the model
        const validation = Location.validate(locationData);
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Invalid location data',
                details: validation.errors 
            });
        }

        // Save location
        const result = await locationService.saveLocationForUser(userId, locationData);
        
        res.status(201).json(result);
    } catch (error) {
        console.error('Save user location error:', error);
        
        if (error.message === 'Location already saved') {
            return res.status(409).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to save location' });
    }
});

/**
 * Remove a location for the current user
 * Requires authentication
 */
router.delete('/locations/:placeId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { placeId } = req.params;

        const result = await locationService.removeLocationForUser(userId, placeId);
        res.json(result);
    } catch (error) {
        console.error('Remove user location error:', error);
        
        if (error.message === 'Location not found for user') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to remove location' });
    }
});

/**
 * Check if a location is saved by the current user
 * Requires authentication
 */
router.get('/locations/:placeId/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { placeId } = req.params;

        const isSaved = await locationService.isLocationSavedByUser(userId, placeId);
        
        res.json({
            success: true,
            placeId: placeId,
            isSaved: isSaved
        });
    } catch (error) {
        console.error('Check location saved error:', error);
        res.status(500).json({ error: 'Failed to check location status' });
    }
});

/**
 * Get locations saved by a specific user (admin or own data)
 * Requires authentication and proper authorization
 */
router.get('/:userId/locations', authenticateToken, validateUserOwnership, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate that userId is numeric (real user ID)
        if (isNaN(userId)) {
            return res.json([]); // Return empty for anonymous user IDs
        }

        const locations = await locationService.getUserLocations(parseInt(userId));
        res.json(locations);
    } catch (error) {
        console.error('Get user locations by ID error:', error);
        res.status(500).json({ error: 'Failed to retrieve user locations' });
    }
});

/**
 * Remove a location for a specific user (admin only)
 * Requires authentication and admin privileges
 */
router.delete('/:userId/locations/:placeId', authenticateToken, async (req, res) => {
    try {
        const { userId, placeId } = req.params;
        
        // Validate that userId is numeric (real user ID)
        if (isNaN(userId)) {
            return res.json({
                success: true,
                message: 'Please log in to manage saved locations'
            });
        }

        // Only allow admins to delete other users' locations
        const currentUserId = req.user.userId || req.user.id;
        if (parseInt(userId) !== currentUserId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await locationService.removeLocationForUser(parseInt(userId), placeId);
        res.json(result);
    } catch (error) {
        console.error('Admin remove user location error:', error);
        
        if (error.message === 'Location not found for user') {
            return res.status(404).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Failed to remove location' });
    }
});

/**
 * Get user statistics (locations saved, etc.)
 * Requires authentication
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const userLocations = await locationService.getUserLocations(userId);
        
        const stats = {
            totalLocationsSaved: userLocations.length,
            oldestSave: userLocations.length > 0 ? 
                Math.min(...userLocations.map(l => new Date(l.saved_at).getTime())) : null,
            newestSave: userLocations.length > 0 ? 
                Math.max(...userLocations.map(l => new Date(l.saved_at).getTime())) : null,
            averageRating: userLocations.filter(l => l.rating).length > 0 ?
                userLocations.filter(l => l.rating).reduce((sum, l) => sum + l.rating, 0) / 
                userLocations.filter(l => l.rating).length : null
        };
        
        if (stats.oldestSave) stats.oldestSave = new Date(stats.oldestSave).toISOString();
        if (stats.newestSave) stats.newestSave = new Date(stats.newestSave).toISOString();
        if (stats.averageRating) stats.averageRating = Math.round(stats.averageRating * 10) / 10;
        
        res.json({
            success: true,
            userId: userId,
            stats: stats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve user statistics' });
    }
});

/**
 * Generate user ID endpoint (legacy compatibility)
 * Returns a simple anonymous user ID
 */
router.get('/generate-id', (req, res) => {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    res.json({ 
        success: true,
        userId: userId,
        message: 'Note: This is an anonymous ID. Please register for full functionality.'
    });
});

/**
 * Get current user's profile
 * Requires authentication
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await authService.findUserById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Return user profile without password
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
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
});

module.exports = router;
