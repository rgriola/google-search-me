/**
 * Database Routes
 * API endpoints for database schema and data viewing
 */

import express from 'express';
const router = express.Router();
import { getDatabase } from '../config/database.js';
import { config } from '../config/environment.js';

// Get database instance once at module level
const db = getDatabase();

/**
 * Get safe configuration for client
 */
router.get('/config/imagekit-url', (req, res) => {
    try {
        // Only expose ImageKit base URL, not sensitive config
        const imagekitUrl = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/yourapp';
        res.json({ imagekitUrl });
    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: 'Configuration not available' });
    }
});

/**
 * Get table schema
 */
router.get('/schema/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        
        // Get table schema using PRAGMA table_info
        db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Convert sqlite pragma output to readable format
            const schema = rows.map(row => ({
                name: row.name,
                type: row.type,
                constraints: [
                    row.notnull ? 'NOT NULL' : '',
                    row.pk ? 'PRIMARY KEY' : '',
                    row.dflt_value ? `DEFAULT ${row.dflt_value}` : ''
                ].filter(c => c).join(', ')
            }));
            
            res.json(schema);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get table data
 */
router.get('/data/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const { limit = 100 } = req.query;
        
        // Get table data with limit for performance
        db.all(`SELECT * FROM ${tableName} LIMIT ?`, [parseInt(limit)], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            res.json(rows);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all tables in database
 */
router.get('/tables', async (req, res) => {
    try {
        
        db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            const tables = rows.map(row => row.name);
            res.json(tables);
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete all data from all tables (NUCLEAR OPTION)
 * WARNING: This permanently deletes ALL data from ALL tables
 */
router.delete('/delete-all', async (req, res) => {
    try {
        
        console.log('🚨 NUCLEAR DELETE: Deleting all data from all tables');
        
        // Step 1: Delete all photos from ImageKit first (before clearing database)
        console.log('📸 Step 1: Deleting all photos from ImageKit...');
        let photosDeletionResult = null;
        try {
            // Import the photo service
            const { getDatabase } = await import('../config/database.js');
            const photoDb = getDatabase();
            
            // Get all photo records
            const allPhotos = await new Promise((resolve, reject) => {
                photoDb.all('SELECT id, imagekit_file_id, place_id FROM location_photos', [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log(`📸 Found ${allPhotos.length} photos to delete from ImageKit`);
            
            if (allPhotos.length > 0) {
                const { deleteImage } = await import('../config/imagekit.js');
                let deletedCount = 0;
                let errorCount = 0;
                const errors = [];
                
                for (const photo of allPhotos) {
                    try {
                        if (photo.imagekit_file_id) {
                            await deleteImage(photo.imagekit_file_id);
                            deletedCount++;
                            console.log(`✅ Deleted photo ${photo.id} from ImageKit`);
                        }
                    } catch (error) {
                        errorCount++;
                        errors.push({ photoId: photo.id, imagekitFileId: photo.imagekit_file_id, error: error.message });
                        console.error(`❌ Failed to delete photo ${photo.id} from ImageKit:`, error.message);
                    }
                }
                
                photosDeletionResult = {
                    totalPhotos: allPhotos.length,
                    deletedCount,
                    errorCount,
                    errors
                };
                console.log(`📸 Photo deletion complete: ${deletedCount}/${allPhotos.length} photos deleted`);
            } else {
                photosDeletionResult = { totalPhotos: 0, deletedCount: 0, errorCount: 0, errors: [] };
                console.log('📸 No photos found to delete');
            }
        } catch (photoError) {
            console.error('❌ Error during photo deletion:', photoError);
            photosDeletionResult = { error: photoError.message, deletedCount: 0, errorCount: 0 };
        }
        
        // Step 2: Get all table names
        console.log('🗄️ Step 2: Clearing database tables...');
        db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`, [], (err, tables) => {
            if (err) {
                console.error('❌ Error getting table names:', err);
                return res.status(500).json({ error: 'Failed to get table names' });
            }
            
            const tableNames = tables.map(row => row.name);
            console.log('📋 Tables to clear:', tableNames);
            
            if (tableNames.length === 0) {
                return res.json({
                    success: true,
                    message: 'No tables found to clear',
                    tablesCleared: [],
                    photosDeletion: photosDeletionResult
                });
            }
            
            // Delete data from each table (preserve structure)
            let clearedTables = [];
            let errors = [];
            let completed = 0;
            
            const checkCompletion = () => {
                completed++;
                if (completed === tableNames.length) {
                    if (errors.length > 0) {
                        console.error('❌ Some tables failed to clear:', errors);
                        res.status(500).json({
                            success: false,
                            error: 'Some tables failed to clear',
                            details: errors,
                            tablesCleared: clearedTables,
                            photosDeletion: photosDeletionResult
                        });
                    } else {
                        console.log('✅ All tables cleared successfully:', clearedTables);
                        res.json({
                            success: true,
                            message: `Successfully cleared ${clearedTables.length} tables`,
                            tablesCleared: clearedTables,
                            photosDeletion: photosDeletionResult
                        });
                    }
                }
            };
            
            // Clear each table
            tableNames.forEach(tableName => {
                db.run(`DELETE FROM ${tableName}`, [], function(err) {
                    if (err) {
                        console.error(`❌ Error clearing table ${tableName}:`, err);
                        errors.push({ table: tableName, error: err.message });
                    } else {
                        console.log(`✅ Cleared table ${tableName} (${this.changes} rows deleted)`);
                        clearedTables.push(tableName);
                    }
                    checkCompletion();
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Nuclear delete error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete all data',
            details: error.message 
        });
    }
});

export default router;
