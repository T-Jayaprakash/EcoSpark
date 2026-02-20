/**
 * services/sensorService.js
 * Core business logic for sensor data ingestion and querying.
 */
const SensorData = require('../models/SensorData');
const alertService = require('./alertService');
const socketService = require('./socketService');
const { computeStatus } = require('../utils/statusCompute');

/**
 * Persist a validated sensor payload:
 * 1. Compute status
 * 2. Save SensorData document
 * 3. Handle alert lifecycle
 * 4. Broadcast sensor:update via Socket.IO
 *
 * @param {Object} payload  Raw validated request body
 * @returns {{ doc, alert, status }}
 */
async function ingestReading(payload) {
    const { lid_id, location = {}, water_level, timestamp, sensor_meta = {} } = payload;

    const ts = timestamp ? new Date(timestamp) : new Date();
    const status = computeStatus(water_level.value);

    const doc = await SensorData.create({
        lid_id,
        location,
        water_level,
        status,
        sensor_meta,
        timestamp: ts,
    });

    // Broadcast to all connected Socket.IO clients immediately
    socketService.emitSensorUpdate(doc.toObject());

    // Delegate alert handling (also triggers socket emit if WARNING/CRITICAL)
    const alert = await alertService.handleAlert({
        lid_id,
        area: location.area || null,
        city: location.city || null,
        status,
        water_level_value: water_level.value,
        timestamp: ts,
    });

    return { doc, alert, status };
}

/**
 * Aggregation: returns the latest SensorData document per lid_id.
 * Uses MongoDB $group + $sort to find the most recent reading for each lid.
 */
async function getLiveStatus() {
    const results = await SensorData.aggregate([
        { $sort: { lid_id: 1, timestamp: -1 } },
        {
            $group: {
                _id: '$lid_id',
                doc_id: { $first: '$_id' },
                lid_id: { $first: '$lid_id' },
                location: { $first: '$location' },
                water_level: { $first: '$water_level' },
                status: { $first: '$status' },
                sensor_meta: { $first: '$sensor_meta' },
                timestamp: { $first: '$timestamp' },
                createdAt: { $first: '$createdAt' },
            },
        },
        { $sort: { lid_id: 1 } },
        {
            $project: {
                _id: '$doc_id',
                lid_id: 1,
                location: 1,
                water_level: 1,
                status: 1,
                sensor_meta: 1,
                timestamp: 1,
                createdAt: 1,
            },
        },
    ]);
    return results;
}

/**
 * Paginated history for a single lid_id, newest first.
 */
async function getHistoryByLid(lidId, { limit = 50, skip = 0 } = {}) {
    const [data, total] = await Promise.all([
        SensorData.find({ lid_id: lidId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SensorData.countDocuments({ lid_id: lidId }),
    ]);
    return { data, total, limit, skip };
}

module.exports = { ingestReading, getLiveStatus, getHistoryByLid };
