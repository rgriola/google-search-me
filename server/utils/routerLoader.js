/**
 * ES Module Router Loader
 * A utility to load ES Module router modules
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import express from 'express';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load a router module from the routes directory
 * @param {string} routeName - The name of the route file (without extension)
 * @returns {object} - The loaded router
 */
export async function loadRouter(routeName) {
  try {
    // Make sure to add .js if not present
    const routePath = routeName.endsWith('.js') 
      ? `../routes/${routeName}`
      : `../routes/${routeName}.js`;
      
    // For dynamic imports, we need a URL path with correct format
    const moduleUrl = new URL(routePath, import.meta.url).href;
    
    // Check if the file exists
    const fullPath = path.resolve(__dirname, routePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Route file not found: ${fullPath}`);
    }
    
    try {
      // Load the router using dynamic import
      const routerModule = await import(moduleUrl);
      const router = routerModule.default; // ES modules default export
      
      console.log(`✅ Loaded route module: ${routeName}`);
      return router;
    } catch (importError) {
      console.error(`❌ Module loading error for ${routeName}: ${importError.message}`);
      throw importError;
    }
  } catch (err) {
    console.error(`❌ Failed to load route module ${routeName}:`, err);
    // Return an empty router to prevent crashes
    const express = require('express');
    const emptyRouter = express.Router();
    
    // Add a fallback error route
    emptyRouter.all('*', (req, res) => {
      res.status(500).json({ 
        error: 'Failed to load router module', 
        details: `Could not load ${routeName} router` 
      });
    });
    
    return emptyRouter;
  }
}

/**
 * Create a fallback router when the original router can't be loaded
 * @param {string} routeName - The name of the route
 * @returns {object} - A basic Express router with fallback routes
 */
export function createFallbackRouter(routeName) {
  const router = express.Router();
  
  router.all('*', (req, res) => {
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: `The ${routeName} service is currently unavailable due to maintenance.`,
      routeName: routeName
    });
  });
  
  console.log(`⚠️ Created fallback router for ${routeName}`);
  return router;
}

export default { loadRouter, createFallbackRouter };
