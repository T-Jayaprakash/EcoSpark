/**
 * models/Alert.js
 * Records WARNING and CRITICAL alerts.
 * Only one active (resolved: false) alert per lid_id at a time.
 */
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
    {
        lid_id: { type: String, required: true, index: true },
        area: { type: String },
        city: { type: String },
        status: { type: String, enum: ['WARNING', 'CRITICAL'], required: true },
        water_level_value: { type: Number, required: true },
        timestamp: { type: Date, required: true },
        resolved: { type: Boolean, default: false, index: true },
        resolved_at: { type: Date },
    },
    { timestamps: true }
);

// Fast lookup for active alerts
alertSchema.index({ resolved: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
