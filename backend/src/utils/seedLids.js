/**
 * seedLids.js — Pre-populate 10 sensor lids on startup
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
    {
        lid_id: 'MKCE_LID_06',
        location: { area: 'Hostel Block Road', city: 'Karur', latitude: 11.0548, longitude: 78.0510 },
        water_level: { value: 20, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 82, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_07',
        location: { area: 'Hostel Ring Road', city: 'Karur', latitude: 11.0538, longitude: 78.0520 },
        water_level: { value: 15, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 78, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_08',
        location: { area: 'Playground Perimeter Rd', city: 'Karur', latitude: 11.0525, longitude: 78.0465 },
        water_level: { value: 10, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 94, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_09',
        location: { area: 'Canteen Road', city: 'Karur', latitude: 11.0560, longitude: 78.0505 },
        water_level: { value: 22, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 89, signal_strength: 'GOOD' },
    },
    {
        lid_id: 'MKCE_LID_10',
        location: { area: 'Back Gate Road', city: 'Karur', latitude: 11.0520, longitude: 78.0490 },
        water_level: { value: 5, unit: 'percentage' },
        status: 'NORMAL',
        sensor_meta: { sensor_type: 'ultrasonic', battery_level: 97, signal_strength: 'GOOD' },
    },
];

async function seedLids() {
    const count = await SensorData.countDocuments();
    if (count > 0) {
        // Find missing lids and seed them
        for (const lid of SEED_LIDS) {
            const exists = await SensorData.findOne({ lid_id: lid.lid_id });
            if (!exists) {
                await new SensorData({ ...lid, timestamp: new Date() }).save();
                console.log(`🌱  Seeded missing lid: ${lid.lid_id}`);
            }
        }
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
