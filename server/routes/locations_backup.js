/**
 * Locations Routes Module
 * Handles all location-related API endpoints
 */

const express = require('express');
const router = express.Router();

// Import services and middleware
const locationService = require('../services/locationService');
const { Location } = require('../models/Location');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateLocationInput, sanitizeRequestBody } = require('../middleware/validation');

/**
 * Get all saved locations
 * Public endpoint, returns all locations ordered by popularity
 */
router.get('/', async (req, res) => {
    try {
        const locations = await locationService.getAllLocations();
        res.json({
            success: true,
            data: locations,
            count: locations.length
        });
    } catch (error) {
        console.error('Get all locations error:', error);
        res.status(500).json({ error: 'Failed to retrieve locations' });
    }
});

/**
 * Get all locations with creator information
 * Public endpoint that includes who created each location
 */
router.get('/with-creators', async (req, res) => {
    try {
        const locations = await locationService.getLocationsWithCreators();
        res.json({
            success: true,
            data: locations,
            count: locations.length
        });
    } catch (error) {
        console.error('Get locations with creators error:', error);
        res.status(500).json({ error: 'Failed to retrieve locations with creator information' });
    }
});

/**
 * Update a location
 * Requires authentication, user must be admin or location creator
 */
router.put('/:placeId', 
    authenticateToken,
    sanitizeRequestBody,
    async (req, res) => {
        try {
            const { placeId } = req.params;
            const updates = req.body;
            const userId = req.user.userId;
            const isAdmin = req.user.isAdmin;
            
            const result = await locationService.updateLocation(userId, placeId, updates, isAdmin);
            res.json(result);
        } catch (error) {
            console.error('Update location error:', error);
            if (error.message === 'Insufficient permissions to edit this location') {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to update location' });
            }
        }
    }
);

/**
 * Delete a location
 * Requires authentication, user must be admin or location creator
 */
router.delete('/:placeId', 
    authenticateToken,
    async (req, res) => {
        try {
            const { placeId } = req.params;
            const userId = req.user.userId;
            const isAdmin = req.user.isAdmin;
            
            const result = await locationService.deleteLocation(userId, placeId, isAdmin);
            res.json(result);
        } catch (error) {
            console.error('Delete location error:', error);
            if (error.message === 'Insufficient permissions to delete this location') {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to delete location' });
            }
        }
    }
);

/**
 * Check if user can edit a location
 * Requires authentication
 */
router.get('/:placeId/can-edit', 
    authenticateToken,
    async (req, res) => {
        try {
            const { placeId } = req.params;
            const userId = req.user.userId;
            const isAdmin = req.user.isAdmin;
            
            const canEdit = await locationService.canUserEditLocation(userId, placeId, isAdmin);
            res.json({
                success: true,
                canEdit: canEdit,
                reason: canEdit ? 'User has permission' : 'User is not admin or creator'
            });
        } catch (error) {
            console.error('Check edit permission error:', error);
            res.status(500).json({ error: 'Failed to check edit permissions' });
        }
    }
);

/**
 * Get location statistics
 * Public endpoint for analytics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await locationService.getLocationStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Get location stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve location statistics' });
    }
});

module.exports = router; express.Router();

// Import services and middleware
const locationService = require('../services/locationService');
const { Location } = require('../models/Location');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateLocationInput, sanitizeRequestBody } = require('../middleware/validation');

/**
 * Get all saved locations
 * Public endpoint, returns all locations ordered by popularity
 */
router.get('/', async (req, res) => {
    try {
        const locations = await locationService.getAllLocations();
        res.json({
            success: true,
            data: locations,
            count: locations.length
        });
    } catch (error) {
        console.error('Get all locations error:', error);
        res.status(500).json({ error: 'Failed to retrieve locations' });
    }
});

/**
 * Get popular locations
 * Public endpoint, returns locations with more than 1 save
 */
router.get('/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const locations = await locationService.getPopularLocations(limit);
        res.json(locations);
    } catch (error) {
        console.error('Get popular locations error:', error);
        res.status(500).json({ error: 'Failed to retrieve popular locations' });
    }
});

/**
 * Search locations by name or address
 * Public endpoint with optional search term
 */
router.get('/search', async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        
        if (!searchTerm || searchTerm.trim().length === 0) {
            return res.status(400).json({ error: 'Search term is required' });
        }
        
        const limit = parseInt(req.query.limit) || 10;
        const locations = await locationService.searchLocations(searchTerm, limit);
        
        res.json({
            success: true,
            searchTerm: searchTerm,
            results: locations,
            count: locations.length
        });
    } catch (error) {
        console.error('Search locations error:', error);
        res.status(500).json({ error: 'Failed to search locations' });
    }
});

/**
 * Get location by place ID
 * Public endpoint to get specific location details
 */
router.get('/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const location = await locationService.getLocationByPlaceId(placeId);
        
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        res.json(location);
    } catch (error) {
        console.error('Get location by place ID error:', error);
        res.status(500).json({ error: 'Failed to retrieve location' });
    }
});

/**
 * Legacy endpoint for backwards compatibility
 * Requires authentication for actual saves, returns guidance for anonymous users
 */
router.post('/', sanitizeRequestBody, async (req, res) => {
    const { userId, placeId, name, address, lat, lng, rating, website, photoUrl } = req.body;

    // If userId is numeric, it's a real user ID, require authentication
    if (userId && !isNaN(userId)) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // For anonymous users, just return success without saving
    res.json({
        success: true,
        message: 'Please log in to save locations',
        placeId: placeId
    });
});

/**
 * Get location statistics
 * Public endpoint for dashboard/analytics
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await locationService.getLocationStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('Get location stats error:', error);
        res.status(500).json({ error: 'Failed to retrieve location statistics' });
    }
});

module.exports = router;
