/**
 * config/db.js
 * Mongoose connection bootstrapper.
 * - If MONGO_URI is set in .env → connect to that URI (Atlas / local).
 * - Otherwise             → spin up mongodb-memory-server (zero-config dev).
 */
const mongoose = require('mongoose');

let _memServer = null;

async function connectDB() {
    let uri = process.env.MONGO_URI || '';

    if (!uri) {
        // Zero-config: use in-memory MongoDB (perfect for dev / hackathon)
        const { MongoMemoryServer } = require('mongodb-memory-server');
        _memServer = await MongoMemoryServer.create();
        uri = _memServer.getUri();
        console.log('🗄️  Using in-memory MongoDB (set MONGO_URI in .env for production)');
    } else {
        console.log('🗄️  Connecting to MongoDB:', uri.replace(/\/\/.*@/, '//<credentials>@'));
    }

    await mongoose.connect(uri, {
        dbName: 'ecospark',
    });

    console.log('✅  MongoDB connected');
}

async function disconnectDB() {
    await mongoose.disconnect();
    if (_memServer) await _memServer.stop();
}

module.exports = { connectDB, disconnectDB };
