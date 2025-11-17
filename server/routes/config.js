/**
 * Configuration API Routes
 * Provides secure access to client-side configuration
 */

import express from 'express';
const router = express.Router();
import { config } from '../config/environment.js';

/**
 * Get Google Maps API key for client-side use
 * @route GET /api/config/google-maps-key
 * @access Public (key should be domain-restricted)
 */
router.get('/google-maps-key', (req, res) => {
    try {
        if (!config.GOOGLE_MAPS_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Google Maps API key not configured'
            });
        }
        
        res.json({
            success: true,
            apiKey: config.GOOGLE_MAPS_API_KEY
        });
    } catch (error) {
        console.error('Error serving Google Maps API key:', error);
        res.status(500).json({
            success: false,
            error: 'Configuration error'
        });
    }
});

/**
 * Get safe configuration summary for client-side use
 * @route GET /api/config/summary
 * @access Public (no secrets exposed)
 */
router.get('/summary', (req, res) => {
    try {
        res.json({
            success: true,
            config: {
                environment: config.NODE_ENV,
                apiBaseUrl: config.API_BASE_URL,
                frontendUrl: config.FRONTEND_URL,
                features: {
                    emailEnabled: !!(config.EMAIL_HOST && config.EMAIL_PASS),
                    imagekitEnabled: !!(config.IMAGEKIT_PUBLIC_KEY && config.IMAGEKIT_PRIVATE_KEY),
                    mapsEnabled: !!config.GOOGLE_MAPS_API_KEY
                }
            }
        });
    } catch (error) {
        console.error('Error serving configuration summary:', error);
        res.status(500).json({
            success: false,
            error: 'Configuration error'
        });
    }
});

export default router;
