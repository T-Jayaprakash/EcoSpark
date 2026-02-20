/**
 * server.js — EcoSpark Production Entry Point
 *
 * Bootstrap order:
 *   1. Load .env
 *   2. Connect to MongoDB (in-memory if MONGO_URI is blank)
 *   3. Create Express app
 *   4. Wrap with http.Server
 *   5. Attach Socket.IO, initialise socketService singleton
 *   6. Mount routes
 *   7. Start listening
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB } = require('./src/config/db');
const socketService = require('./src/services/socketService');
const sensorRoutes = require('./src/routes/sensorRoutes');
const lidRoutes = require('./src/routes/lidRoutes');
const alertRoutes = require('./src/routes/alertRoutes');

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

async function bootstrap() {
    // ── 1. Database ─────────────────────────────────────────────────────────────
    await connectDB();

    // ── 2. Express app ───────────────────────────────────────────────────────────
    const app = express();
    app.use(cors({ origin: CORS_ORIGIN }));
    app.use(express.json());

    // Serve static frontend from /public
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // ── 3. HTTP server + Socket.IO ───────────────────────────────────────────────
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
    });

    // Initialise the socket singleton used throughout services
    socketService.init(io);

    // Socket.IO connection lifecycle
    io.on('connection', (socket) => {
        console.log(`⚡  Client connected   [${socket.id}]`);

        // Allow clients to subscribe to a specific lid channel
        socket.on('subscribe:lid', (lidId) => {
            socket.join(`lid:${lidId}`);
            console.log(`   → ${socket.id} joined room lid:${lidId}`);
        });

        socket.on('disconnect', () => {
            console.log(`💤  Client disconnected [${socket.id}]`);
        });
    });

    // ── 4. REST API Routes ───────────────────────────────────────────────────────
    app.use('/api/sensor-data', sensorRoutes);
    app.use('/api/lids', lidRoutes);
    app.use('/api/alerts', alertRoutes);

    app.post('/api/raw-sensor-data', (req, res) => {
        const { lid_id, distance_cm, manhole_depth_cm, temperature_c, signal_quality, timestamp } = req.body;

        const depth = manhole_depth_cm || 100;
        const distance = distance_cm || 0;

        let water_level = ((depth - distance) / depth) * 100;
        water_level = Math.max(0, Math.min(100, Math.round(water_level)));

        let status = 'NORMAL';
        if (water_level < 40) {
            status = 'NORMAL';
        } else if (water_level >= 40 && water_level <= 70) {
            status = 'WARNING';
        } else {
            status = 'CRITICAL';
        }

        const processedData = {
            lid_id,
            distance_cm: distance,
            manhole_depth_cm: depth,
            temperature_c,
            signal_quality,
            timestamp: timestamp || new Date().toISOString(),
            water_level,
            status
        };

        io.emit("lid:update", processedData);

        if (status === 'WARNING' || status === 'CRITICAL') {
            const alertData = {
                lid_id,
                status,
                message: `Water level reached ${water_level}%`,
                timestamp: processedData.timestamp
            };
            io.emit("alert:new", alertData);
        }

        res.status(200).json({
            success: true,
            message: "Sensor data received"
        });
    });

    // Health check
    app.get('/health', (_req, res) =>
        res.json({ status: 'ok', time: new Date().toISOString(), db: 'connected' })
    );

    // SPA catch-all — serve frontend for any non-API route
    app.get('*', (_req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    // ── 5. Start ─────────────────────────────────────────────────────────────────
    server.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
        console.log(`\n🌊  EcoSpark v2.0 — Smart Sewage Monitoring System`);
        console.log(`🚀  Server    → http://localhost:${PORT}`);
        console.log(`📡  API base  → http://localhost:${PORT}/api`);
        console.log(`🔌  Socket.IO → ws://localhost:${PORT}\n`);
    });
}

bootstrap().catch((err) => {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
});
