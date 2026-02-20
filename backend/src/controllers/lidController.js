/**
 * controllers/lidController.js
 * Handles:
 *   GET /api/lids         — live status (latest reading per lid)
 *   GET /api/lids/:id/history  — paginated history for one lid
 */
const sensorService = require('../services/sensorService');

/** GET /api/lids — latest reading per lid_id */
async function getLiveStatus(req, res) {
    try {
        const data = await sensorService.getLiveStatus();
        return res.json({ count: data.length, data });
    } catch (err) {
        console.error('[lidController.getLiveStatus]', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/** GET /api/lids/:id/history — paginated sensor history for one lid */
async function getHistory(req, res) {
    try {
        const lidId = req.params.id;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const skip = parseInt(req.query.skip) || 0;

        const result = await sensorService.getHistoryByLid(lidId, { limit, skip });
        return res.json(result);
    } catch (err) {
        console.error('[lidController.getHistory]', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getLiveStatus, getHistory };
