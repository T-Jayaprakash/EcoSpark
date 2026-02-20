# 🌊 EcoSpark — Smart Sewage Monitoring System v2.0

> **SDG 11 · Sustainable Cities & Communities**  
> Production-ready real-time sewage monitoring with **Socket.IO** + **MongoDB** + **MVC architecture**.

---

## 🚀 Quick Start

```bash
# 1. Install
cd backend && npm install

# 2. Start server (MongoDB auto-starts in-memory for dev)
npm start
# → http://localhost:3001

# 3. Run simulator (new terminal)
cd .. && node simulator/simulate.js
```

> Set `MONGO_URI` in `backend/.env` to connect to MongoDB Atlas or a local instance.

---

## 🗂 Architecture

```
backend/
├── server.js                   # Express + Socket.IO + DB bootstrap
├── .env                        # PORT, MONGO_URI, CORS_ORIGIN
├── src/
│   ├── config/
│   │   └── db.js               # Mongoose (in-memory fallback)
│   ├── models/
│   │   ├── SensorData.js       # Indexed on (lid_id, timestamp)
│   │   └── Alert.js            # resolved flag, auto-lifecycle
│   ├── services/
│   │   ├── sensorService.js    # Ingest → status → save → emit
│   │   ├── alertService.js     # Alert create / resolve / query
│   │   └── socketService.js    # Socket.IO singleton emitter
│   ├── controllers/
│   │   ├── sensorController.js # Input validation + ingest
│   │   ├── lidController.js    # Live status + history
│   │   └── alertController.js # Active alerts
│   └── routes/
│       ├── sensorRoutes.js
│       ├── lidRoutes.js
│       └── alertRoutes.js
simulator/
└── simulate.js                 # 5-node sensor simulator (3s)
public/
├── index.html                  # SPA dashboard
├── style.css                   # Premium dark theme
└── app.js                      # Socket.IO client + REST fallback
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensor-data` | Ingest reading → compute status → emit via Socket.IO |
| GET  | `/api/lids` | Latest reading per lid (live status) |
| GET  | `/api/lids/:id/history` | Paginated history for one lid |
| GET  | `/api/alerts` | Active (unresolved) alerts |
| GET  | `/health` | Health check |

### Data Contract (strict)
```json
{
  "lid_id": "LID_001",
  "location": { "area": "Anna Nagar", "city": "Tiruchirappalli", "latitude": 10.7905, "longitude": 78.7047 },
  "water_level": { "value": 72, "unit": "percentage" },
  "timestamp": "2026-02-20T07:36:00Z",
  "sensor_meta": { "sensor_type": "ultrasonic", "battery_level": 85, "signal_strength": "GOOD" }
}
```

### Thresholds
| Level | Status |
|-------|--------|
| < 40% | 🟢 NORMAL |
| 40–70% | 🟡 WARNING |
| > 70% | 🔴 CRITICAL |

---

## 🔌 Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `sensor:update` | Server → Client | Latest SensorData doc |
| `alert:new` | Server → Client | New Alert doc |
| `subscribe:lid` | Client → Server | `lidId` string — joins a lid-specific room |

---

## 🧪 curl Tests

```bash
# POST a CRITICAL reading
curl -X POST http://localhost:3001/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"lid_id":"LID_001","location":{"area":"Anna Nagar","city":"Tiruchirappalli","latitude":10.7905,"longitude":78.7047},"water_level":{"value":82,"unit":"percentage"},"timestamp":"2026-02-20T07:36:00Z","sensor_meta":{"sensor_type":"ultrasonic","battery_level":85,"signal_strength":"GOOD"}}'

# GET live status
curl http://localhost:3001/api/lids

# GET lid history
curl "http://localhost:3001/api/lids/LID_001/history?limit=10"

# GET active alerts
curl http://localhost:3001/api/alerts
```

---

## ⚙️ Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |
| `MONGO_URI` | *(blank)* | MongoDB URI (blank = in-memory) |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |