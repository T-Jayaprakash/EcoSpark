/**
 * services/socketService.js
 * Singleton wrapper around the Socket.IO `io` instance.
 * Initialised once in server.js; imported everywhere else.
 *
 * Events emitted:
 *   sensor:update  — every successful sensor ingest
 *   alert:new      — whenever a WARNING or CRITICAL alert is created
 */
let _io = null;

function init(ioInstance) {
    _io = ioInstance;
    console.log('🔌  Socket.IO service initialised');
}

/**
 * Broadcast the latest sensor reading to all connected clients.
 * @param {Object} sensorDoc  Plain-object version of a SensorData document
 */
function emitSensorUpdate(sensorDoc) {
    if (!_io) return;
    _io.emit('sensor:update', sensorDoc);
}

/**
 * Broadcast a new alert to all connected clients.
 * @param {Object} alertDoc  Plain-object version of an Alert document
 */
function emitAlert(alertDoc) {
    if (!_io) return;
    _io.emit('alert:new', alertDoc);
}

/**
 * Emit to a specific room (lid channel) — useful in future for per-lid subscriptions.
 */
function emitToLid(lidId, event, data) {
    if (!_io) return;
    _io.to(`lid:${lidId}`).emit(event, data);
}

module.exports = { init, emitSensorUpdate, emitAlert, emitToLid };
