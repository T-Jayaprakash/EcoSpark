/**
 * db.js — SQLite via sql.js (pure WebAssembly, no native compilation)
 * Persists data to disk at backend/data/ecospark.db
 */
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'ecospark.db');

const initSqlJs = require('sql.js');

let _db = null;

async function getDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Create tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      lid_id            TEXT    NOT NULL,
      area              TEXT,
      city              TEXT,
      latitude          REAL,
      longitude         REAL,
      water_level_value REAL    NOT NULL,
      water_level_unit  TEXT    DEFAULT 'percentage',
      status            TEXT    NOT NULL,
      sensor_type       TEXT,
      battery_level     INTEGER,
      signal_strength   TEXT,
      timestamp         TEXT    NOT NULL,
      created_at        TEXT    DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      lid_id            TEXT    NOT NULL,
      area              TEXT,
      city              TEXT,
      status            TEXT    NOT NULL,
      water_level_value REAL    NOT NULL,
      timestamp         TEXT    NOT NULL,
      resolved          INTEGER DEFAULT 0,
      created_at        TEXT    DEFAULT (datetime('now'))
    );
  `);

  persist(); // initial save
  return _db;
}

/** Persist in-memory DB to disk after every write */
function persist() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/** Run a write statement, then persist */
function run(db, sql, params = []) {
  db.run(sql, params);
  persist();
}

/** Return array of row objects from a SELECT */
function all(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

/** Return a single row object */
function get(db, sql, params = []) {
  const rows = all(db, sql, params);
  return rows[0] || null;
}

module.exports = { getDb, run, all, get, persist };
