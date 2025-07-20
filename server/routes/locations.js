/**
 * Locations Routes Module
 * Handles all location-related API endpoints
 */

import express from 'express';
const router = express.Router();

// Import services and middleware
import * as locationService from '../services/locationService.js';
import { Location } from '../models/Location.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validateLocationInput, sanitizeRequestBody } from '../middleware/validation.js';

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
        
        const limit = parseInt(req.query.limit) || 50;
        const locations = await locationService.searchLocations(searchTerm, limit);
        
        res.json({
            success: true,
            searchTerm: searchTerm,
            data: locations,
            count: locations.length
        });
    } catch (error) {
        console.error('Search locations error:', error);
        res.status(500).json({ error: 'Failed to search locations' });
    }
});

/**
 * Get user's saved locations
 * Requires authentication
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Users can only access their own locations unless they're admin
        if (req.user.userId !== parseInt(userId) && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const locations = await locationService.getUserLocations(parseInt(userId));
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
 * Save a location for the authenticated user
 * Requires authentication
 */
router.post('/save', 
    authenticateToken, 
    sanitizeRequestBody,
    validateLocationInput,
    async (req, res) => {
        try {
            const locationData = req.body;
            const userId = req.user.userId;
            
            const result = await locationService.saveLocationForUser(userId, locationData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Save location error:', error);
            if (error.message === 'Location already saved') {
                res.status(409).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to save location' });
            }
        }
    }
);

/**
 * Remove a location for the authenticated user
 * Requires authentication
 */
router.delete('/remove/:placeId', authenticateToken, async (req, res) => {
    try {
        const { placeId } = req.params;
        const userId = req.user.userId;
        
        const result = await locationService.removeLocationForUser(userId, placeId);
        res.json(result);
    } catch (error) {
        console.error('Remove location error:', error);
        res.status(500).json({ error: 'Failed to remove location' });
    }
});

/**
 * Update a location
 * Requires authentication, user must be admin or location creator
 */
router.put('/:placeId', 
    (req, res, next) => {
        console.log('🚨 RAW PUT REQUEST RECEIVED 🚨');
        console.log('URL:', req.originalUrl);
        console.log('Method:', req.method);
        console.log('PlaceId:', req.params.placeId);
        console.log('Has body:', !!req.body);
        console.log('User-Agent:', req.get('User-Agent'));
        console.log('🚨 END RAW PUT REQUEST 🚨');
        next();
    },
    authenticateToken,
    sanitizeRequestBody,
    async (req, res) => {
        try {
            const { placeId } = req.params;
            const updates = req.body;
            const userId = req.user.userId;
            const isAdmin = req.user.isAdmin;
            
            console.log('============= PUT ROUTE DEBUGGING =============');
            console.log('PUT request received for placeId:', placeId);
            console.log('userId:', userId);
            console.log('isAdmin:', isAdmin);
            console.log('Request body updates:', JSON.stringify(updates, null, 2));
            console.log('formatted_address in updates:', updates.formatted_address);
            console.log('============= CALLING updateLocation =============');
            
            const result = await locationService.updateLocation(userId, placeId, updates, isAdmin);
            
            console.log('============= updateLocation RESULT =============');
            console.log('Update result:', JSON.stringify(result, null, 2));
            console.log('============= END PUT ROUTE DEBUGGING =============');
            
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
 * Get location by place ID
 * Public endpoint
 */
router.get('/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const location = await locationService.getLocationByPlaceId(placeId);
        
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        console.error('Get location by place ID error:', error);
        res.status(500).json({ error: 'Failed to retrieve location' });
    }
});

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

export default router;
