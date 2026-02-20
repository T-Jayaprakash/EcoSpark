const express = require('express');
const router = express.Router();
const { getDb, run, all, get } = require('../db');
const { computeStatus } = require('../utils/statusCompute');

// ─── POST /api/sensor-data ────────────────────────────────────────────────────
router.post('/sensor-data', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.lid_id || !payload.water_level || payload.water_level.value === undefined) {
            return res.status(400).json({ error: 'Missing required fields: lid_id, water_level.value' });
        }

        const { lid_id, location = {}, water_level, timestamp, sensor_meta = {} } = payload;
        const ts = timestamp || new Date().toISOString();
        const status = computeStatus(water_level.value);
        const db = await getDb();

        run(db,
            `INSERT INTO sensor_data
         (lid_id, area, city, latitude, longitude,
          water_level_value, water_level_unit, status,
          sensor_type, battery_level, signal_strength, timestamp)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                lid_id,
                location.area || null,
                location.city || null,
                location.latitude || null,
                location.longitude || null,
                water_level.value,
                water_level.unit || 'percentage',
                status,
                sensor_meta.sensor_type || null,
                sensor_meta.battery_level || null,
                sensor_meta.signal_strength || null,
                ts
            ]
        );

        // Alert logic
        if (status === 'WARNING' || status === 'CRITICAL') {
            // Resolve previous active alert for this lid
            run(db, `UPDATE alerts SET resolved = 1 WHERE lid_id = ? AND resolved = 0`, [lid_id]);
            run(db,
                `INSERT INTO alerts (lid_id, area, city, status, water_level_value, timestamp)
         VALUES (?,?,?,?,?,?)`,
                [lid_id, location.area || null, location.city || null, status, water_level.value, ts]
            );
        } else {
            run(db, `UPDATE alerts SET resolved = 1 WHERE lid_id = ? AND resolved = 0`, [lid_id]);
        }

        // Get last inserted ID
        const row = get(db, `SELECT last_insert_rowid() as id`);
        return res.status(201).json({ success: true, id: row ? row.id : null, lid_id, status, message: `Data stored. Status: ${status}` });
    } catch (err) {
        console.error('POST /sensor-data error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ─── GET /api/live-status ─────────────────────────────────────────────────────
router.get('/live-status', async (req, res) => {
    try {
        const db = await getDb();
        const rows = all(db,
            `SELECT s.* FROM sensor_data s
       INNER JOIN (SELECT lid_id, MAX(id) AS max_id FROM sensor_data GROUP BY lid_id) latest
         ON s.lid_id = latest.lid_id AND s.id = latest.max_id
       ORDER BY s.lid_id ASC`
        );

        const formatted = rows.map(r => ({
            lid_id: r.lid_id,
            location: { area: r.area, city: r.city, latitude: r.latitude, longitude: r.longitude },
            water_level: { value: r.water_level_value, unit: r.water_level_unit },
            status: r.status,
            sensor_meta: { sensor_type: r.sensor_type, battery_level: r.battery_level, signal_strength: r.signal_strength },
            timestamp: r.timestamp, created_at: r.created_at
        }));

        return res.json({ count: formatted.length, data: formatted });
    } catch (err) {
        console.error('GET /live-status error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── GET /api/history ─────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const offset = parseInt(req.query.offset) || 0;
        const lid = req.query.lid_id || null;
        const db = await getDb();

        let query = `SELECT * FROM sensor_data`;
        let params = [];
        if (lid) { query += ` WHERE lid_id = ?`; params.push(lid); }
        query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const rows = all(db, query, params);
        const cRow = get(db, `SELECT COUNT(*) as cnt FROM sensor_data${lid ? ' WHERE lid_id = ?' : ''}`, lid ? [lid] : []);
        const total = cRow ? cRow.cnt : 0;

        const formatted = rows.map(r => ({
            id: r.id,
            lid_id: r.lid_id,
            location: { area: r.area, city: r.city, latitude: r.latitude, longitude: r.longitude },
            water_level: { value: r.water_level_value, unit: r.water_level_unit },
            status: r.status,
            sensor_meta: { sensor_type: r.sensor_type, battery_level: r.battery_level, signal_strength: r.signal_strength },
            timestamp: r.timestamp
        }));

        return res.json({ total, limit, offset, data: formatted });
    } catch (err) {
        console.error('GET /history error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
router.get('/alerts', async (req, res) => {
    try {
        const includeResolved = req.query.include_resolved === 'true';
        const db = await getDb();
        const rows = all(db,
            includeResolved
                ? `SELECT * FROM alerts ORDER BY id DESC LIMIT 100`
                : `SELECT * FROM alerts WHERE resolved = 0 ORDER BY id DESC LIMIT 100`
        );
        return res.json({ count: rows.length, data: rows });
    } catch (err) {
        console.error('GET /alerts error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
