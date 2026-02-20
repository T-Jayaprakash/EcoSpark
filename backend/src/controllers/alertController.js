/**
 * controllers/alertController.js
 * Handles GET /api/alerts
 */
const alertService = require('../services/alertService');

/** GET /api/alerts — returns active (unresolved) alerts */
async function getAlerts(req, res) {
    try {
        const data = await alertService.getActiveAlerts();
        return res.json({ count: data.length, data });
    } catch (err) {
        console.error('[alertController.getAlerts]', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getAlerts };
