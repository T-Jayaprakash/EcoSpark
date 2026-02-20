/**
 * services/alertService.js
 * Handles all alert lifecycle operations:
 *   - Create / replace alert when WARNING or CRITICAL is detected
 *   - Auto-resolve when NORMAL reading arrives for a lid
 *   - Query active alerts
 */
const Alert = require('../models/Alert');
const socketService = require('./socketService');

/**
 * Called after status is computed for an incoming reading.
 * Opens a new alert (and closes any existing one) on WARNING/CRITICAL,
 * or auto-resolves an existing alert when the lid returns to NORMAL.
 *
 * @returns {Object|null}  The newly created alert doc, or null if NORMAL
 */
async function handleAlert({ lid_id, area, city, status, water_level_value, timestamp }) {
    if (status === 'NORMAL') {
        // Auto-resolve any active alert for this lid
        await Alert.updateMany(
            { lid_id, resolved: false },
            { resolved: true, resolved_at: new Date() }
        );
        return null;
    }

    // WARNING or CRITICAL — resolve stale alert first, then create fresh one
    await Alert.updateMany(
        { lid_id, resolved: false },
        { resolved: true, resolved_at: new Date() }
    );

    const alert = await Alert.create({
        lid_id,
        area,
        city,
        status,
        water_level_value,
        timestamp: new Date(timestamp),
        resolved: false,
    });

    // Broadcast the new alert in real time
    socketService.emitAlert(alert.toObject());

    return alert;
}

/** Return all active (unresolved) alerts, newest first */
async function getActiveAlerts() {
    return Alert.find({ resolved: false }).sort({ createdAt: -1 }).limit(100).lean();
}

/** Return all alerts (including resolved) for a specific lid */
async function getAlertsByLid(lidId) {
    return Alert.find({ lid_id: lidId }).sort({ createdAt: -1 }).limit(50).lean();
}

module.exports = { handleAlert, getActiveAlerts, getAlertsByLid };
