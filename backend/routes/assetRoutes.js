const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');

// GET /api/assets - Get all assets
router.get('/', assetController.getAllAssets);

// GET /api/assets/dropdown - Get assets for dropdown
router.get('/dropdown', assetController.getAssetsForDropdown);

// GET /api/assets/:code - Get single asset with relationships
router.get('/:code', assetController.getAssetByCode);

// POST /api/assets - Create new asset
router.post('/', assetController.createAsset);

module.exports = router;