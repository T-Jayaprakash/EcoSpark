/**
 * EcoSpark Sensor Simulator v2
 * Simulates 15 sensor nodes across Tiruchirappalli Corporation zones.
 * Run: node simulator/simulate.js
 */

const API_URL = 'http://localhost:3001/api/sensor-data';

const SENSORS = [
    { lid_id: 'MKCE_LID_01', area: 'Main Gate Road', city: 'Karur', latitude: 11.0558, longitude: 78.0472 },
    { lid_id: 'MKCE_LID_02', area: 'Academic Block Road', city: 'Karur', latitude: 11.0550, longitude: 78.0488 },
    { lid_id: 'MKCE_LID_03', area: 'Central Avenue', city: 'Karur', latitude: 11.0542, longitude: 78.0495 },
    { lid_id: 'MKCE_LID_04', area: 'Library Road', city: 'Karur', latitude: 11.0535, longitude: 78.0478 },
    { lid_id: 'MKCE_LID_05', area: 'Workshop Road', city: 'Karur', latitude: 11.0528, longitude: 78.0502 },
    { lid_id: 'MKCE_LID_06', area: 'Hostel Block Road', city: 'Karur', latitude: 11.0548, longitude: 78.0510 },
    { lid_id: 'MKCE_LID_07', area: 'Hostel Ring Road', city: 'Karur', latitude: 11.0538, longitude: 78.0520 },
    { lid_id: 'MKCE_LID_08', area: 'Playground Perimeter Rd', city: 'Karur', latitude: 11.0525, longitude: 78.0465 },
    { lid_id: 'MKCE_LID_09', area: 'Canteen Road', city: 'Karur', latitude: 11.0560, longitude: 78.0505 },
    { lid_id: 'MKCE_LID_10', area: 'Back Gate Road', city: 'Karur', latitude: 11.0520, longitude: 78.0490 },
];

const SIGNAL_LEVELS = ['EXCELLENT', 'GOOD', 'FAIR', 'WEAK'];

// Each sensor drifts independently with its own base level
const sensorState = {};
SENSORS.forEach(s => {
    sensorState[s.lid_id] = {
        current: Math.random() * 100,
        trend: (Math.random() - 0.45) * 3  // slight upward bias to trigger alerts
    };
});

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function buildPayload(sensor) {
    const state = sensorState[sensor.lid_id];
    // Drift the water level
    state.trend += (Math.random() - 0.5) * 2;
    state.trend = clamp(state.trend, -5, 5);
    state.current = clamp(state.current + state.trend, 0, 100);

    // Occasionally spike or drop
    if (Math.random() < 0.05) state.current = clamp(state.current + (Math.random() > 0.5 ? 20 : -20), 0, 100);

    return {
        lid_id: sensor.lid_id,
        location: {
            area: sensor.area,
            city: sensor.city,
            latitude: sensor.latitude,
            longitude: sensor.longitude
        },
        water_level: {
            value: parseFloat(state.current.toFixed(1)),
            unit: 'percentage'
        },
        timestamp: new Date().toISOString(),
        sensor_meta: {
            sensor_type: 'ultrasonic',
            battery_level: Math.floor(Math.random() * 30 + 70),  // 70-100%
            signal_strength: SIGNAL_LEVELS[Math.floor(Math.random() * SIGNAL_LEVELS.length)]
        }
    };
}

async function sendData(sensor) {
    const payload = buildPayload(sensor);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        const icon = json.status === 'CRITICAL' ? '🔴' : json.status === 'WARNING' ? '🟡' : '🟢';
        console.log(`${icon} [${sensor.lid_id}] ${sensor.area.padEnd(16)} | ${payload.water_level.value.toString().padStart(5)}% | ${json.status}`);
    } catch (err) {
        console.error(`❌ [${sensor.lid_id}] Failed to send: ${err.message}`);
    }
}

async function tick() {
    console.log(`\n⏱  ${new Date().toLocaleTimeString()}  ─────────────────────────────`);
    await Promise.all(SENSORS.map(sendData));
}

// Send immediately, then every 3 seconds
console.log('🌊  EcoSpark Simulator v2 started — 10 sensors across MKCE Campus');
console.log('     Sending data to', API_URL);
console.log('     Press Ctrl+C to stop.\n');
tick();
setInterval(tick, 3000);
