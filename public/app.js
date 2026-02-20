/* ─────────────────────────────────────────────────────────────────────────────
   EcoSpark v2 — Real-time Dashboard (Socket.IO + REST polling fallback)
   
   Real-time events:
     sensor:update  → updates the relevant sensor card instantly
     alert:new      → adds toast + refreshes alerts panel
   
   REST polling (every 30s as fallback / initial load):
     GET /api/lids           → initial card render
     GET /api/alerts         → initial alert panel
     GET /api/lids/:id/... is fetched on-demand
───────────────────────────────────────────────────────────────────────────── */

// ── State ──────────────────────────────────────────────────────────────────
let liveData = {};   // lid_id → latest sensor doc
let alertsData = [];   // active alerts array
let knownAlerts = new Set();

// ── Live Clock ──────────────────────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById('live-clock');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) +
            ' — ' + now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
}
setInterval(updateClock, 1000);
updateClock();

// ── Helpers ─────────────────────────────────────────────────────────────────
const statusIcon = s => s === 'CRITICAL' ? '🔴' : s === 'WARNING' ? '🟡' : '🟢';

function formatTime(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('en-IN', { hour12: false }); } catch { return iso; }
}

function timeAgo(iso) {
    if (!iso) return '—';
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return `${Math.round(s)}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'WARNING') {
    const c = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    c.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '.4s ease'; }, 3500);
    setTimeout(() => toast.remove(), 4000);
}

// ── Stats Bar ────────────────────────────────────────────────────────────────
function updateStats() {
    const arr = Object.values(liveData);
    const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0 };
    arr.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    document.getElementById('stat-total').textContent = arr.length;
    document.getElementById('stat-normal').textContent = counts.NORMAL || 0;
    document.getElementById('stat-warning').textContent = counts.WARNING || 0;
    document.getElementById('stat-critical').textContent = counts.CRITICAL || 0;
}

// ── Sensor Card (single) ─────────────────────────────────────────────────────
function cardHTML(d) {
    const pct = parseFloat(d.water_level.value).toFixed(1);
    const loc = d.location || {};
    const meta = d.sensor_meta || {};
    return `
    <div class="sensor-card ${d.status}" id="card-${d.lid_id}" data-lid="${d.lid_id}">
      <div class="card-header">
        <span class="lid-id">${d.lid_id}</span>
        <span class="status-badge ${d.status}">${statusIcon(d.status)} ${d.status}</span>
      </div>
      <p class="card-area">📍 ${loc.area || '—'}, ${loc.city || '—'}</p>
      <div class="gauge-label">
        <span>Water Level</span>
        <strong class="${d.status}">${pct}%</strong>
      </div>
      <div class="gauge-track">
        <div class="gauge-fill ${d.status}" style="width:${pct}%"></div>
      </div>
      <div class="card-meta">
        <div class="meta-item">🔋 <span>${meta.battery_level ?? '—'}%</span></div>
        <div class="meta-item">📶 <span>${meta.signal_strength ?? '—'}</span></div>
        <div class="meta-item">🔊 <span>${meta.sensor_type ?? '—'}</span></div>
      </div>
      <p class="card-updated">🕐 Updated ${timeAgo(d.timestamp)}</p>
    </div>`;
}

// ── Render Entire Cards Grid ─────────────────────────────────────────────────
function renderCards() {
    const grid = document.getElementById('cards-grid');
    const arr = Object.values(liveData).sort((a, b) => a.lid_id.localeCompare(b.lid_id));
    if (!arr.length) {
        grid.innerHTML = `<div class="loading-state"><div style="font-size:32px;margin-bottom:12px">📡</div>No sensor data yet. Start the simulator to see live readings.</div>`;
        return;
    }
    grid.innerHTML = arr.map(cardHTML).join('');
}

// ── Update ONE card in-place via Socket.IO ───────────────────────────────────
function updateCard(d) {
    const existing = document.getElementById(`card-${d.lid_id}`);
    if (existing) {
        existing.outerHTML = cardHTML(d);  // hot-swap just this card
    } else {
        // New lid appeared — rebuild grid
        renderCards();
    }
}

// ── Alerts Panel ─────────────────────────────────────────────────────────────
function renderAlerts() {
    const list = document.getElementById('alerts-list');
    if (!alertsData.length) {
        list.innerHTML = `<div class="no-alerts"><div class="no-alerts-icon">✅</div>All systems normal — no active alerts.</div>`;
        return;
    }
    list.innerHTML = alertsData.map(a => `
    <div class="alert-item ${a.status}">
      <span class="alert-icon">${a.status === 'CRITICAL' ? '🚨' : '⚠️'}</span>
      <div class="alert-body">
        <div class="alert-title">${a.lid_id} — ${a.area || 'Unknown Area'}</div>
        <div class="alert-sub">Water level: <strong>${a.water_level_value}%</strong> · ${a.city || ''}</div>
      </div>
      <span class="alert-badge ${a.status}">${a.status}</span>
      <span class="alert-time">${timeAgo(a.timestamp)}</span>
    </div>`).join('');
}

// ── History Table ─────────────────────────────────────────────────────────────
function renderHistory(records) {
    const tbody = document.getElementById('history-tbody');
    if (!records || !records.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px">No records yet.</td></tr>';
        return;
    }
    tbody.innerHTML = records.map(r => `
    <tr>
      <td><strong>${r.lid_id}</strong></td>
      <td>${(r.location && r.location.area) || '—'}</td>
      <td><strong>${parseFloat(r.water_level.value).toFixed(1)}%</strong></td>
      <td><span class="tbl-status ${r.status}">${statusIcon(r.status)} ${r.status}</span></td>
      <td>${(r.sensor_meta && r.sensor_meta.sensor_type) || '—'}</td>
      <td>${(r.sensor_meta && r.sensor_meta.battery_level != null) ? r.sensor_meta.battery_level + '%' : '—'}</td>
      <td>${(r.sensor_meta && r.sensor_meta.signal_strength) || '—'}</td>
      <td>${formatTime(r.timestamp)}</td>
    </tr>`).join('');
}

// ── REST — Initial Load ──────────────────────────────────────────────────────
async function fetchLiveStatus() {
    try {
        const res = await fetch('/api/lids');
        const json = await res.json();
        (json.data || []).forEach(d => { liveData[d.lid_id] = d; });
        renderCards();
        updateStats();
    } catch (e) { console.warn('fetchLiveStatus', e); }
}

async function fetchAlerts() {
    try {
        const res = await fetch('/api/alerts');
        const json = await res.json();
        alertsData = json.data || [];
        alertsData.forEach(a => knownAlerts.add(String(a._id)));
        renderAlerts();
    } catch (e) { console.warn('fetchAlerts', e); }
}

async function fetchRecentHistory() {
    // Grab history of the first lid we have, for the table
    const lids = Object.keys(liveData);
    if (!lids.length) return;
    try {
        const res = await fetch(`/api/lids/${lids[0]}/history?limit=20`);
        const json = await res.json();
        renderHistory(json.data || []);
    } catch (e) { console.warn('fetchHistory', e); }
}

// ── Socket.IO — Real-time Events ─────────────────────────────────────────────
const socket = io();   // connects to same origin automatically

socket.on('connect', () => {
    console.log('🔌 Socket.IO connected:', socket.id);
    document.getElementById('live-clock').style.opacity = '1';
});

socket.on('disconnect', () => {
    console.warn('💤 Socket.IO disconnected — will reconnect automatically');
});

// sensor:update → update state + hot-swap that one card
socket.on('sensor:update', (doc) => {
    liveData[doc.lid_id] = doc;
    updateCard(doc);
    updateStats();
});

// alert:new → prepend to alerts array + show toast
socket.on('alert:new', (alert) => {
    const id = String(alert._id);
    if (!knownAlerts.has(id)) {
        knownAlerts.add(id);
        alertsData.unshift(alert);
        renderAlerts();
        showToast(
            `${alert.status}: ${alert.lid_id} (${alert.area}) — ${alert.water_level_value}%`,
            alert.status
        );
    }
});

// ── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
    await fetchLiveStatus();
    await fetchAlerts();
    await fetchRecentHistory();

    // Light fallback polling every 30s in case a socket event was missed
    setInterval(async () => {
        await fetchAlerts();
        await fetchRecentHistory();
    }, 30_000);
})();
