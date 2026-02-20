/**
 * models/SensorData.js
 * Persists every sensor reading.
 * Indexed on (lid_id, timestamp) for efficient history queries.
 */
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    area: { type: String },
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
}, { _id: false });

const waterLevelSchema = new mongoose.Schema({
    value: { type: Number, required: true },
    unit: { type: String, default: 'percentage' },
}, { _id: false });

const sensorMetaSchema = new mongoose.Schema({
    sensor_type: { type: String },
    battery_level: { type: Number },
    signal_strength: { type: String },
}, { _id: false });

const sensorDataSchema = new mongoose.Schema(
    {
        lid_id: { type: String, required: true, index: true },
        location: { type: locationSchema },
        water_level: { type: waterLevelSchema, required: true },
        status: { type: String, enum: ['NORMAL', 'WARNING', 'CRITICAL'], required: true },
        sensor_meta: { type: sensorMetaSchema },
        timestamp: { type: Date, required: true, index: true },
    },
    { timestamps: true }
);

// Compound index for efficient per-lid history queries
sensorDataSchema.index({ lid_id: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);
