/**
 * seedLids.js — Pre-populate 5 sensor lids on startup
 * Only seeds if the database is empty (no existing SensorData docs).
 */
const SensorData = require('../models/SensorData');

const SEED_LIDS = [
    {
        lid_id: 'MKCE_LID_01',
        location: { area: 'Main Gate Road', city: 'Karur', latitude: 11.0558, longitude: 78.0472 },
        water_level: { value: 25, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 95, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_02',
        location: { area: 'Academic Block Road', city: 'Karur', latitude: 11.0550, longitude: 78.0488 },
        water_level: { value: 18, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 88, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_03',
        location: { area: 'Central Avenue', city: 'Karur', latitude: 11.0542, longitude: 78.0495 },
        water_level: { value: 45, unit: 'percentage' },
        status: 'WARNING',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 72, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_04',
        location: { area: 'Library Road', city: 'Karur', latitude: 11.0535, longitude: 78.0478 },
        water_level: { value: 12, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 91, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_05',
        location: { area: 'Workshop Road', city: 'Karur', latitude: 11.0528, longitude: 78.0502 },
        water_level: { value: 30, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 85, signal_strength: 'GOOD' },
    },
];

async function seedLids() {
    const count = await SensorData.countDocuments();
    if (count > 0) {
        console.log(`📊  Database has ${count} readings — skipping seed`);
        return;
    }

    const now = new Date();
    const docs = SEED_LIDS.map((lid, i) => ({
        ...lid,
        timestamp: new Date(now.getTime() - (i * 60000)), // stagger timestamps by 1 min each
    }));

    await SensorData.insertMany(docs);
    console.log(`🌱  Seeded ${docs.length} initial lid readings`);
}

module.exports = { seedLids };
