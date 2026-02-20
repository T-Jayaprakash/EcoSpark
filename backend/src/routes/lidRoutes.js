const express = require('express');
const router = express.Router();
const { getLiveStatus, getHistory } = require('../controllers/lidController');

// GET /api/lids
router.get('/', getLiveStatus);

// GET /api/lids/:id/history
router.get('/:id/history', getHistory);

module.exports = router;
