/* ─────────────────────────────────────────────────────────────────────────────
   EcoSpark Pro — Enterprise Intelligence Dashboard
   Optimized for Real-time Scalability & Aesthetic Excellence
   ───────────────────────────────────────────────────────────────────────────── */

// ── Internal State ──────────────────────────────────────────────────────────
let liveData = {};      // lid_id → latest sensor payload
let alertHistory = [];  // recent alerts
let knownAlerts = new Set();

// ── Real-time Status Clock ───────────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const now = new Date();
    el.innerHTML = `<span style="color:var(--text-main)">${now.toLocaleTimeString('en-IN', { hour12: false })}</span> • ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Utility Helpers ─────────────────────────────────────────────────────────
const getStatusLabel = (s) => s === 'CRITICAL' ? 'PANIC / CRITICAL' : s === 'WARNING' ? 'WARNING' : 'STABLE';

function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
    if (!iso) return '—';
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 10) return `Just now`;
    if (s < 60) return `${Math.round(s)}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
}

function getWhatsAppURl(d) {
    const phone = "917397139329";
    const text = `🚨 *ECOSPARK CRITICAL REPORT*%0A---------------------------%0A*LID:* ${d.lid_id}%0A*LOCATION:* ${d.location.area}%0A*LEVEL:* ${d.water_level.value}%%0A*TIME:* ${formatTime(d.timestamp)}%0A---------------------------%0A_Immediate dispatch required!_`;
    return `https://wa.me/${phone}?text=${text}`;
}

// ── Master UI Components ─────────────────────────────────────────────────────

function createSensorNodeHTML(d) {
    const pct = parseFloat(d.water_level.value).toFixed(1);
    const loc = d.location || {};
    const meta = d.sensor_meta || {};

    return `
    <div class="sensor-node ${d.status}" id="node-${d.lid_id}">
        <div class="node-top">
            <div class="node-info">
                <h3>${d.lid_id}</h3>
                <span>📍 ${loc.area || 'Active Zone'}</span>
            </div>
            <div class="node-badge">${getStatusLabel(d.status)}</div>
        </div>

        <div class="level-visual">
            <div class="level-text">
                <span>Capacity Utilisation</span>
                <strong>${pct}%</strong>
            </div>
            <div class="progress-track">
                <div class="progress-bar" style="width: ${pct}%"></div>
            </div>
        </div>

        <div class="node-footer">
            <div class="footer-stat">
                <div class="f-label">Battery</div>
                <div class="f-val">${meta.battery_level ?? '--'}%</div>
            </div>
            <div class="footer-stat">
                <div class="f-label">Signal</div>
                <div class="f-val">${meta.signal_strength ?? '--'}</div>
            </div>
            <div class="footer-stat" style="text-align: right;">
                <div class="f-label">Latency</div>
                <div class="f-val">${timeAgo(d.timestamp)}</div>
            </div>
        </div>

        ${d.status === 'CRITICAL' ? `
            <a href="${getWhatsAppURl(d)}" target="_blank" class="btn-whatsapp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.539 2.016 2.069-.534c.942.547 1.958.915 3.22.914 3.178 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.783-5.77-5.783zm0 10.455c-1.181 0-2.115-.33-3.05-.873l-1.187.307.309-1.157c-.633-.951-.958-1.996-.957-3.066 0-2.61 2.122-4.733 4.735-4.733 2.612 0 4.735 2.121 4.735 4.733.001 2.613-2.122 4.789-4.885 4.789zM19.03 3.125c-2.322-2.314-5.411-3.589-8.697-3.601-6.772.023-12.27 5.522-12.293 12.293-.01 2.164.557 4.276 1.642 6.16l-1.742 6.362 6.51-1.708c1.815.99 3.86 1.512 5.941 1.514l.006.002c6.766 0 12.261-5.495 12.284-12.261s-2.619-11.41-8.651-13.76z"/></svg>
                IMMEDIATE RESPONSE
            </a>
        ` : ''}
    </div>`;
}

// ── Interface Orchestration ──────────────────────────────────────────────────

function renderDashboard() {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;

    const nodes = Object.values(liveData).sort((a, b) => a.lid_id.localeCompare(b.lid_id));

    if (nodes.length === 0) {
        grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Searching for telemetry streams...</p></div>`;
        return;
    }

    grid.innerHTML = nodes.map(createSensorNodeHTML).join('');
    updateGlobalMetrics();
}

function updateGlobalMetrics() {
    const arr = Object.values(liveData);
    const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
    arr.forEach(d => counts[d.status]++);

    document.getElementById('stat-total').textContent = arr.length;
    document.getElementById('stat-normal').textContent = counts.NORMAL;
    document.getElementById('stat-warning').textContent = counts.WARNING;
    document.getElementById('stat-critical').textContent = counts.CRITICAL;

    // Apply specific classes for intensity
    const warnCard = document.getElementById('card-warning-metric');
    const critCard = document.getElementById('card-critical-metric');

    if (counts.CRITICAL > 0) critCard.classList.add('critical'); else critCard.classList.remove('critical');
    if (counts.WARNING > 0) warnCard.classList.add('warning'); else warnCard.classList.remove('warning');
}

function renderHistoryTable(records) {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: var(--text-mute);">No historical data found for this node.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(r => `
        <tr>
            <td style="color:#fff; font-weight:700;">${r.lid_id}</td>
            <td>${r.location?.area || '—'}</td>
            <td style="font-weight:700;">${parseFloat(r.water_level.value).toFixed(1)}%</td>
            <td>
                <span class="node-badge" style="background:${r.status === 'CRITICAL' ? 'var(--critical-glow)' : r.status === 'WARNING' ? 'var(--warning-dim)' : 'var(--normal-dim)'}; color:${r.status === 'CRITICAL' ? 'var(--critical)' : r.status === 'WARNING' ? 'var(--warning)' : 'var(--normal)'};">
                    ${r.status}
                </span>
            </td>
            <td>${r.sensor_meta?.battery_level ?? '--'}%</td>
            <td>${r.sensor_meta?.signal_strength ?? '--'}</td>
            <td>${formatTime(r.timestamp)}</td>
        </tr>
    `).join('');
}

// ── Notifications (System Alerts) ───────────────────────────────────────────

function triggerPremiumToast(alert) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `premium-toast ${alert.status}`;

    const icon = alert.status === 'CRITICAL' ? '🚨' : '⚠️';
    const color = alert.status === 'CRITICAL' ? 'var(--critical)' : 'var(--warning)';

    toast.innerHTML = `
        <div class="toast-icon" style="background:${color}22; color:${color}">${icon}</div>
        <div class="toast-body">
            <div style="font-weight:800; font-size:0.85rem;">${alert.lid_id} — ${alert.status}</div>
            <div style="font-size:0.75rem; color:var(--text-sec);">${alert.area} reached ${alert.water_level_value}%</div>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// ── Core Data Subscriptions ──────────────────────────────────────────────────

const socket = io();

socket.on('connect', () => console.log('✅ Telemetry Stream Active'));

socket.on('sensor:update', (doc) => {
    const isNew = !liveData[doc.lid_id];
    liveData[doc.lid_id] = doc;

    // Smoothly update grid
    if (isNew) {
        renderDashboard();
    } else {
        const node = document.getElementById(`node-${doc.lid_id}`);
        if (node) {
            node.outerHTML = createSensorNodeHTML(doc);
            updateGlobalMetrics();
        } else {
            renderDashboard();
        }
    }
});

socket.on('alert:new', (alert) => {
    const id = String(alert._id);
    if (!knownAlerts.has(id)) {
        knownAlerts.add(id);
        triggerPremiumToast(alert);
        fetchRecentHistory(); // refresh the table too
    }
});

// ── Initialization ───────────────────────────────────────────────────────────

async function fetchInitialData() {
    try {
        const [lidsRes, alertsRes] = await Promise.all([
            fetch('/api/lids'),
            fetch('/api/alerts')
        ]);

        const lidsJson = await lidsRes.json();
        const records = lidsJson.data || [];
        records.forEach(d => liveData[d.lid_id] = d);

        renderDashboard();
        fetchRecentHistory();
    } catch (e) {
        console.error('Critical initialization failure:', e);
    }
}

async function fetchRecentHistory() {
    const lids = Object.keys(liveData);
    if (lids.length === 0) return;
    try {
        const res = await fetch(`/api/lids/${lids[0]}/history?limit=15`);
        const json = await res.json();
        renderHistoryTable(json.data || []);
    } catch (e) { console.warn('History fetch paused'); }
}

// Global Boot
fetchInitialData();
setInterval(fetchRecentHistory, 15000);
