/**
 * controllers/sensorController.js
 * Handles POST /api/sensor-data
 */
const sensorService = require('../services/sensorService');

/**
 * POST /api/sensor-data
 * Validates the strict data contract, delegates to sensorService.
 */
async function ingest(req, res) {
    try {
        const { lid_id, location, water_level, timestamp, sensor_meta } = req.body;

        // ── Input validation ──────────────────────────────────────────────────────
        if (!lid_id || typeof lid_id !== 'string') {
            return res.status(400).json({ error: 'lid_id is required and must be a string' });
        }
        if (!water_level || water_level.value === undefined || water_level.value === null) {
            return res.status(400).json({ error: 'water_level.value is required' });
        }
        const value = parseFloat(water_level.value);
        if (isNaN(value) || value < 0 || value > 100) {
            return res.status(400).json({ error: 'water_level.value must be a number between 0 and 100' });
        }

        const { doc, alert, status } = await sensorService.ingestReading(req.body);

        return res.status(201).json({
            success: true,
            id: doc._id,
            lid_id: doc.lid_id,
            status,
            alert: alert ? { id: alert._id, status: alert.status } : null,
            message: `Reading ingested. Status: ${status}`,
        });
    } catch (err) {
        console.error('[sensorController.ingest]', err.message);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}

module.exports = { ingest };
