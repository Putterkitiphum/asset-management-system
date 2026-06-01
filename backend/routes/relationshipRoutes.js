const express = require('express');
const router = express.Router();
const relationshipController = require('../controllers/relationshipController');
const { requireAdmin } = require('../middleware/auth');

// POST /api/assets/:childCode/parents/:parentCode - Add parent relationship (admin only)
router.post('/:childCode/parents/:parentCode', requireAdmin, relationshipController.addParentRelationship);

// DELETE /api/assets/:childCode/parents/:parentCode - Remove parent relationship (admin only)
router.delete('/:childCode/parents/:parentCode', requireAdmin, relationshipController.removeParentRelationship);

module.exports = router;