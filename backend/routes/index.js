const express = require('express');
const router = express.Router();
const assetRoutes = require('./assetRoutes');
const relationshipRoutes = require('./relationshipRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: "OK",
    message: "Asset Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/assets",
      "/api/assets/:code",
      "/api/assets/dropdown",
      "/api/health",
    ],
  });
});

// Mount the routes
router.use('/assets', assetRoutes);
router.use('/assets', relationshipRoutes); // Mount relationship routes under /api/assets

module.exports = router;