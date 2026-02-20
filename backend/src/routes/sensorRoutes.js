const express = require('express');
const router = express.Router();
const { ingest } = require('../controllers/sensorController');

// POST /api/sensor-data
router.post('/', ingest);

module.exports = router;
