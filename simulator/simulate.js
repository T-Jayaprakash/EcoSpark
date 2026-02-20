/**
 * EcoSpark Sensor Simulator v2
 * Simulates 15 sensor nodes across Tiruchirappalli Corporation zones.
 * Run: node simulator/simulate.js
 */

const API_URL = 'http://localhost:3001/api/sensor-data';

const SENSORS = [
    // ── Zone 1 — Srirangam & North ──
    { lid_id: 'LID_001', area: 'Srirangam', city: 'Tiruchirappalli', latitude: 10.8560, longitude: 78.6880 },
    { lid_id: 'LID_002', area: 'Thiruvanaikoil', city: 'Tiruchirappalli', latitude: 10.8450, longitude: 78.7020 },

    // ── Zone 2 — Golden Rock & Ponmalai ──
    { lid_id: 'LID_003', area: 'Golden Rock', city: 'Tiruchirappalli', latitude: 10.8020, longitude: 78.7310 },
    { lid_id: 'LID_004', area: 'Ponmalai', city: 'Tiruchirappalli', latitude: 10.7980, longitude: 78.7200 },

    // ── Zone 3 — Woraiyur & Cantonment ──
    { lid_id: 'LID_005', area: 'Woraiyur', city: 'Tiruchirappalli', latitude: 10.8260, longitude: 78.6830 },
    { lid_id: 'LID_006', area: 'Cantonment', city: 'Tiruchirappalli', latitude: 10.8320, longitude: 78.6950 },

    // ── Zone 4 — Anna Nagar & Thillai Nagar ──
    { lid_id: 'LID_007', area: 'Anna Nagar', city: 'Tiruchirappalli', latitude: 10.8155, longitude: 78.6965 },
    { lid_id: 'LID_008', area: 'Thillai Nagar', city: 'Tiruchirappalli', latitude: 10.8100, longitude: 78.6850 },
    { lid_id: 'LID_009', area: 'Puthur', city: 'Tiruchirappalli', latitude: 10.8200, longitude: 78.6760 },

    // ── Zone 5 — KK Nagar & Teppakulam ──
    { lid_id: 'LID_010', area: 'KK Nagar', city: 'Tiruchirappalli', latitude: 10.7950, longitude: 78.7040 },
    { lid_id: 'LID_011', area: 'Teppakulam', city: 'Tiruchirappalli', latitude: 10.8100, longitude: 78.7100 },
    { lid_id: 'LID_012', area: 'Palakkarai', city: 'Tiruchirappalli', latitude: 10.8050, longitude: 78.6900 },

    // ── Zone 6 — Ariyamangalam & Crawford ──
    { lid_id: 'LID_013', area: 'Ariyamangalam', city: 'Tiruchirappalli', latitude: 10.7880, longitude: 78.6720 },
    { lid_id: 'LID_014', area: 'Crawford', city: 'Tiruchirappalli', latitude: 10.7920, longitude: 78.6830 },
    { lid_id: 'LID_015', area: 'Kattur', city: 'Tiruchirappalli', latitude: 10.7780, longitude: 78.6950 },
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
console.log('🌊  EcoSpark Simulator v2 started — 15 sensors across 6 zones');
console.log('     Sending data to', API_URL);
console.log('     Press Ctrl+C to stop.\n');
tick();
setInterval(tick, 3000);
