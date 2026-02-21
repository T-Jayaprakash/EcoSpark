// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const lidSelector = document.getElementById('lidSelector');
const intervalSelector = document.getElementById('intervalSelector');
const apiUrlInput = document.getElementById('apiUrl');
const overrideSelector = document.getElementById('overrideSelector');
const connectionDot = document.getElementById('connectionDot');
const connectionStatus = document.getElementById('connectionStatus');
const jsonViewer = document.getElementById('jsonViewer');
const txCountBadge = document.getElementById('txCountBadge');

const valPulse = document.getElementById('valPulse');
const valDistance = document.getElementById('valDistance');
const valTemp = document.getElementById('valTemp');
const valSignal = document.getElementById('valSignal');
const multiSensorCheckbox = document.getElementById('multiSensorMode');

// Simulation State
let simulationInterval = null;
let txCount = 0;
let currentLidIndex = 0; // For multi-sensor mode
const LIDS = [
    "MKCE_LID_01", "MKCE_LID_02", "MKCE_LID_03", "MKCE_LID_04", "MKCE_LID_05",
    "MKCE_LID_06", "MKCE_LID_07", "MKCE_LID_08", "MKCE_LID_09", "MKCE_LID_10"
];
let pulse_us = 2941;
const manhole_depth_cm = 100;

// Start Simulation
function startSimulation() {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    lidSelector.disabled = true;
    intervalSelector.disabled = true;
    apiUrlInput.disabled = true;
    overrideSelector.disabled = true;
    multiSensorCheckbox.disabled = true;
    currentLidIndex = 0;

    updateStatus('Connecting and Emitting...', 'indicator-active');

    // Run first ping immediately, then loop
    emitSensorData();
    const msInterval = parseInt(intervalSelector.value, 10) || 5000;
    simulationInterval = setInterval(emitSensorData, msInterval);
}

// Stop Simulation
function stopSimulation() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    lidSelector.disabled = false;
    intervalSelector.disabled = false;
    apiUrlInput.disabled = false;
    overrideSelector.disabled = false;
    multiSensorCheckbox.disabled = false;

    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }

    updateStatus('Stopped', 'indicator-idle');
    jsonViewer.textContent = 'Simulation stopped.';
}

// Emulate physical phenomena
function simulatePhysics(forceMode = null) {
    // 1. Level specific pulse generation (µs)
    const mode = forceMode || overrideSelector.value;

    let min_pulse_us = 4000;
    let max_pulse_us = 6000;

    if (mode === 'WARNING') {
        min_pulse_us = 2500;
        max_pulse_us = 3500;
    } else if (mode === 'CRITICAL') {
        min_pulse_us = 800;
        max_pulse_us = 1500;
    }

    // Keep pulse_us relatively stable within the mode range
    if (pulse_us < min_pulse_us || pulse_us > max_pulse_us) {
        // Mode changed, jump directly into the middle of the new range
        pulse_us = min_pulse_us + Math.floor(Math.random() * (max_pulse_us - min_pulse_us));
    } else {
        // Natural drift within the current allowed range
        const driftPulse = Math.floor(Math.random() * 353) - 176;
        pulse_us = pulse_us + driftPulse;
        if (pulse_us < min_pulse_us) pulse_us = min_pulse_us;
        if (pulse_us > max_pulse_us) pulse_us = max_pulse_us;
    }

    // 2. MCU Layer conversion: Convert pulse to distance
    const distance_cm = Math.round((pulse_us * 0.034) / 2);

    // 3. Temperature ranges from 28 to 40
    const temperature_c = Math.floor(Math.random() * 13) + 28;

    // 4. Signal Quality (85% GOOD, 15% LOW)
    const signal_quality = Math.random() < 0.85 ? 'GOOD' : 'LOW';

    // Prepare exactly the payload requested by backend
    let lidId = lidSelector.value;
    if (multiSensorCheckbox.checked && !forceMode) {
        lidId = LIDS[currentLidIndex];
        currentLidIndex = (currentLidIndex + 1) % LIDS.length;
    }

    const payload = {
        lid_id: lidId,
        distance_cm: distance_cm,
        manhole_depth_cm: manhole_depth_cm,
        temperature_c: temperature_c,
        signal_quality: signal_quality,
        timestamp: new Date().toISOString()
    };

    return { payload, final_pulse_us: Math.round(pulse_us) };
}

// HTTP POST via fetch
async function emitSensorData(forceMode = null) {
    const { payload, final_pulse_us } = simulatePhysics(forceMode);

    // Update Live Simulation Panel UI
    valPulse.textContent = `${final_pulse_us} µs`;
    valDistance.textContent = `${payload.distance_cm} cm`;
    valTemp.textContent = `${payload.temperature_c} °C`;
    valSignal.textContent = payload.signal_quality;

    // Format JSON
    const jsonStr = JSON.stringify(payload, null, 2);
    jsonViewer.textContent = jsonStr;

    try {
        const response = await fetch(apiUrlInput.value, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonStr
        });

        if (response.ok) {
            updateStatus(forceMode === 'CRITICAL' ? 'PANIC EMITTED' : 'Connected & Emitting', 'indicator-success');
            txCount++;
            txCountBadge.textContent = `TX: ${txCount}`;
        } else {
            updateStatus(`Server Error: ${response.status}`, 'indicator-error');
        }
    } catch (err) {
        updateStatus('Connection Failed (Endpoint Down / Network Error)', 'indicator-error');
        console.error("Simulation Network Error:", err);
    }
}

// Panic Trigger
async function triggerPanic() {
    console.log("!!! PANIC BUTTON TRIGGERED !!!");
    await emitSensorData('CRITICAL');
}

// Helpers
function updateStatus(text, className) {
    connectionStatus.textContent = text;
    connectionDot.className = `status-dot ${className}`;
}

// Event Listeners
startBtn.addEventListener('click', startSimulation);
stopBtn.addEventListener('click', stopSimulation);
document.getElementById('panicBtn')?.addEventListener('click', triggerPanic);

// Init state
pulse_us = Math.floor(Math.random() * 4706) + 588; // init roughly between 10cm to 90cm
