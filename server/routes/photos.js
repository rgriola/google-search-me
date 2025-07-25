/**
 * Photo Routes
 * API endpoints for photo upload, management, and retrieval
 */

import express from 'express';
import multer from 'multer';
import { getAuthenticationParameters } from '../config/imagekit.js';
import { 
    uploadLocationPhoto, 
    getLocationPhotos, 
    deleteLocationPhoto, 
    setPrimaryPhoto 
} from '../services/photoService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads (memory storage for ImageKit)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
        }
    }
});

/**
 * GET /api/photos/auth-params
 * Get ImageKit authentication parameters for client-side uploads
 */
router.get('/auth-params', (req, res) => {
    try {
        const authParams = getAuthenticationParameters();
        res.json({
            success: true,
            authParams
        });
    } catch (error) {
        console.error('❌ Error getting auth params:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get authentication parameters'
        });
    }
});

/**
 * POST /api/photos/upload
 * Upload a photo for a location
 */
router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        const { placeId, caption } = req.body;
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo file provided'
            });
        }
        
        if (!placeId) {
            return res.status(400).json({
                success: false,
                message: 'Place ID is required'
            });
        }
        
        const result = await uploadLocationPhoto({
            fileBuffer: req.file.buffer,
            originalFilename: req.file.originalname,
            placeId,
            userId,
            caption
        });
        
        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            data: result
        });
        
    } catch (error) {
        console.error('❌ Photo upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Photo upload failed'
        });
    }
});

/**
 * GET /api/photos/location/:placeId
 * Get all photos for a specific location
 */
router.get('/location/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        const photos = await getLocationPhotos(placeId);
        
        res.json({
            success: true,
            data: photos
        });
        
    } catch (error) {
        console.error('❌ Error fetching photos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch photos'
        });
    }
});

/**
 * DELETE /api/photos/:photoId
 * Delete a photo (only by the user who uploaded it or admin)
 */
router.delete('/:photoId', authenticateToken, async (req, res) => {
    try {
        const { photoId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.is_admin;
        
        // Admin can delete any photo, users can only delete their own
        const result = await deleteLocationPhoto(photoId, isAdmin ? null : userId);
        
        res.json({
            success: true,
            message: 'Photo deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Photo deletion error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Photo deletion failed'
        });
    }
});

/**
 * PUT /api/photos/:photoId/primary
 * Set a photo as the primary photo for its location
 */
router.put('/:photoId/primary', authenticateToken, async (req, res) => {
    try {
        const { photoId } = req.params;
        const { placeId } = req.body;
        
        if (!placeId) {
            return res.status(400).json({
                success: false,
                message: 'Place ID is required'
            });
        }
        
        const result = await setPrimaryPhoto(photoId, placeId);
        
        res.json({
            success: true,
            message: 'Primary photo updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Primary photo update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update primary photo'
        });
    }
});

/**
 * Error handling middleware for multer
 */
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
});

export default router;
