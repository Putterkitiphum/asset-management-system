const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { requireAdmin } = require('../middleware/auth');

// GET /api/assets - Get all assets
router.get('/', assetController.getAllAssets);

// GET /api/assets/dropdown - Get assets for dropdown
router.get('/dropdown', assetController.getAssetsForDropdown);

// GET /api/assets/:code - Get single asset with relationships
router.get('/:code', assetController.getAssetByCode);

// POST /api/assets - Create new asset (admin only)
router.post('/', requireAdmin, assetController.createAsset);

// PUT /api/assets/:code - Update asset (admin only)
router.put('/:code', requireAdmin, assetController.updateAsset);

// DELETE /api/assets/:code - Delete asset and its relationships (admin only)
router.delete('/:code', requireAdmin, assetController.deleteAsset);

module.exports = router;