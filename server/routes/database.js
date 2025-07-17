/**
 * Database Routes
 * API endpoints for database schema and data viewing
 */

import express from 'express';
const router = express.Router();
import { getDatabase } from '../config/database.js';

// Get database instance once at module level
const db = getDatabase();

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
        
        // Get all table names
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
                    tablesCleared: []
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
                            tablesCleared: clearedTables
                        });
                    } else {
                        console.log('✅ All tables cleared successfully:', clearedTables);
                        res.json({
                            success: true,
                            message: `Successfully cleared ${clearedTables.length} tables`,
                            tablesCleared: clearedTables
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
