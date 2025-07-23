/**
 * Permanent Locations API Routes
 * Admin-only endpoints for managing headquarters/bureau locations
 */

const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validationResult, body, param } = require('express-validator');
const Database = require('../config/database');

/**
 * @route   POST /api/admin/locations/set-permanent
 * @desc    Mark a location as permanent or remove permanent status
 * @access  Admin only
 */
router.post('/set-permanent', 
  requireAuth,
  requireAdmin,
  [
    body('location_id').isInt({ min: 1 }).withMessage('Valid location ID required'),
    body('is_permanent').isBoolean().withMessage('is_permanent must be boolean'),
    body('admin_notes').optional().isString().isLength({ max: 500 }).withMessage('Admin notes too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { location_id, is_permanent, admin_notes } = req.body;
      const db = await Database.getInstance();

      // Check if location exists
      const location = await db.get(
        'SELECT * FROM saved_locations WHERE id = ?',
        [location_id]
      );

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Update permanent status
      const result = await db.run(`
        UPDATE saved_locations 
        SET is_permanent = ?, 
            admin_notes = COALESCE(?, admin_notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [is_permanent, admin_notes, location_id]);

      if (result.changes === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update location'
        });
      }

      // Log admin action
      console.log(`🏢 Admin ${req.user.id} ${is_permanent ? 'marked' : 'unmarked'} location ${location_id} as permanent`);

      res.json({
        success: true,
        message: `Location ${is_permanent ? 'marked as' : 'removed from'} permanent`,
        data: {
          location_id,
          is_permanent,
          admin_notes
        }
      });

    } catch (error) {
      console.error('Error updating permanent status:', error);
      res.status(500).json({
        success: false,
        message: 'Server error updating permanent status'
      });
    }
  }
);

/**
 * @route   GET /api/admin/locations/permanent
 * @desc    Get all permanent locations
 * @access  Admin only
 */
router.get('/permanent',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const db = await Database.getInstance();

      const permanentLocations = await db.all(`
        SELECT l.*, u.email as creator_email
        FROM saved_locations l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.is_permanent = TRUE 
           OR LOWER(l.location_type) IN ('headquarters', 'bureau', 'office')
        ORDER BY l.location_type, l.name
      `);

      // Get statistics
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total_permanent,
          COUNT(CASE WHEN LOWER(location_type) = 'headquarters' THEN 1 END) as headquarters_count,
          COUNT(CASE WHEN LOWER(location_type) = 'bureau' THEN 1 END) as bureau_count,
          COUNT(CASE WHEN LOWER(location_type) = 'office' THEN 1 END) as office_count
        FROM saved_locations 
        WHERE is_permanent = TRUE 
           OR LOWER(location_type) IN ('headquarters', 'bureau', 'office')
      `);

      res.json({
        success: true,
        data: {
          locations: permanentLocations,
          statistics: stats
        }
      });

    } catch (error) {
      console.error('Error fetching permanent locations:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching permanent locations'
      });
    }
  }
);

/**
 * @route   POST /api/admin/locations/permanent
 * @desc    Create a new permanent location
 * @access  Admin only
 */
router.post('/permanent',
  requireAuth,
  requireAdmin,
  [
    body('name').notEmpty().isLength({ max: 100 }).withMessage('Name is required (max 100 chars)'),
    body('location_type').isIn(['headquarters', 'bureau', 'office']).withMessage('Invalid location type for permanent location'),
    body('formatted_address').notEmpty().isLength({ max: 200 }).withMessage('Address is required'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('admin_notes').optional().isString().isLength({ max: 500 }).withMessage('Admin notes too long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        location_type,
        formatted_address,
        lat,
        lng,
        admin_notes,
        street = '',
        number = '',
        city = '',
        state = '',
        zipcode = ''
      } = req.body;

      const db = await Database.getInstance();

      // Insert new permanent location
      const result = await db.run(`
        INSERT INTO saved_locations (
          user_id, name, location_type, formatted_address, address,
          lat, lng, is_permanent, admin_notes,
          street, number, city, state, zipcode,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        req.user.id, name, location_type, formatted_address, formatted_address,
        lat, lng, true, admin_notes,
        street, number, city, state, zipcode
      ]);

      // Log admin action
      console.log(`🏢 Admin ${req.user.id} created permanent location: ${name} (${location_type})`);

      res.status(201).json({
        success: true,
        message: 'Permanent location created successfully',
        data: {
          id: result.lastID,
          name,
          location_type,
          is_permanent: true
        }
      });

    } catch (error) {
      console.error('Error creating permanent location:', error);
      res.status(500).json({
        success: false,
        message: 'Server error creating permanent location'
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/locations/permanent/:id
 * @desc    Delete a permanent location
 * @access  Admin only
 */
router.delete('/permanent/:id',
  requireAuth,
  requireAdmin,
  [
    param('id').isInt({ min: 1 }).withMessage('Valid location ID required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const locationId = req.params.id;
      const db = await Database.getInstance();

      // Check if location exists and is permanent
      const location = await db.get(
        'SELECT * FROM saved_locations WHERE id = ? AND is_permanent = TRUE',
        [locationId]
      );

      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Permanent location not found'
        });
      }

      // Delete the location
      const result = await db.run(
        'DELETE FROM saved_locations WHERE id = ?',
        [locationId]
      );

      if (result.changes === 0) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete location'
        });
      }

      // Log admin action
      console.log(`🗑️ Admin ${req.user.id} deleted permanent location: ${location.name} (ID: ${locationId})`);

      res.json({
        success: true,
        message: 'Permanent location deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting permanent location:', error);
      res.status(500).json({
        success: false,
        message: 'Server error deleting permanent location'
      });
    }
  }
);

/**
 * @route   GET /api/admin/locations/statistics
 * @desc    Get comprehensive location statistics including permanent locations
 * @access  Admin only
 */
router.get('/statistics',
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const db = await Database.getInstance();

      // Get overall statistics
      const totalStats = await db.get(`
        SELECT 
          COUNT(*) as total_locations,
          COUNT(CASE WHEN is_permanent = TRUE THEN 1 END) as permanent_locations,
          COUNT(CASE WHEN is_permanent = FALSE OR is_permanent IS NULL THEN 1 END) as regular_locations,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(created_at) as oldest_location,
          MAX(created_at) as newest_location
        FROM saved_locations
      `);

      // Get type breakdown
      const typeStats = await db.all(`
        SELECT 
          location_type,
          COUNT(*) as count,
          COUNT(CASE WHEN is_permanent = TRUE THEN 1 END) as permanent_count,
          COUNT(CASE WHEN is_permanent = FALSE OR is_permanent IS NULL THEN 1 END) as regular_count
        FROM saved_locations
        GROUP BY location_type
        ORDER BY count DESC
      `);

      // Get recent permanent location activity
      const recentActivity = await db.all(`
        SELECT l.name, l.location_type, l.created_at, l.updated_at, u.email as creator
        FROM saved_locations l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.is_permanent = TRUE
        ORDER BY l.updated_at DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        data: {
          total_statistics: totalStats,
          type_breakdown: typeStats,
          recent_permanent_activity: recentActivity
        }
      });

    } catch (error) {
      console.error('Error fetching admin statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Server error fetching statistics'
      });
    }
  }
);

module.exports = router;
