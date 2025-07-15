/**
 * Health Check Route
 * Provides basic server health information
 */

import express from 'express';
const router = express.Router();

/**
 * GET /health - Basic health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/details - Detailed health check with memory usage
 */
router.get('/details', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100} MB`
    }
  });
});

export default router;
