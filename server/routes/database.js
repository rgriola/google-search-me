/**
 * Database Routes
 * API endpoints for database schema and data viewing
 */

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');

/**
 * Get table schema
 */
router.get('/schema/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const db = getDatabase();
        
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
        const db = getDatabase();
        
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
        const db = getDatabase();
        
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

module.exports = router;
