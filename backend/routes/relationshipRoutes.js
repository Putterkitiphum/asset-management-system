const express = require('express');
const router = express.Router();
const relationshipController = require('../controllers/relationshipController');

// POST /api/assets/:childCode/parents/:parentCode - Add parent relationship
router.post('/:childCode/parents/:parentCode', relationshipController.addParentRelationship);

// DELETE /api/assets/:childCode/parents/:parentCode - Remove parent relationship
router.delete('/:childCode/parents/:parentCode', relationshipController.removeParentRelationship);

module.exports = router;