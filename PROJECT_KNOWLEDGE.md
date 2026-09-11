# 🌊 EcoSpark — Project Knowledge Base

> **Version:** 2.0 | **Last Updated:** September 2026  
> **Maintainer:** EcoSpark Engineering Team — MKCE Campus, Karur  
> **SDG Alignment:** UN SDG 11 · Sustainable Cities & Communities

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Module Breakdown](#3-module-breakdown)
4. [Data Flow — End-to-End](#4-data-flow--end-to-end)
5. [API Reference](#5-api-reference)
6. [WebSocket Events](#6-websocket-events)
7. [MongoDB Schemas](#7-mongodb-schemas)
8. [Status Threshold Logic](#8-status-threshold-logic)
9. [Alert & Notification Pipeline](#9-alert--notification-pipeline)
10. [Sensor Nodes (Seeded Lids)](#10-sensor-nodes-seeded-lids)
11. [Environment Variables](#11-environment-variables)
12. [Developer Setup Guide](#12-developer-setup-guide)
13. [Project File Structure](#13-project-file-structure)
14. [Coding Conventions](#14-coding-conventions)

---

## 1. Project Overview

**EcoSpark** is a real-time smart sewage / stormwater manhole monitoring system deployed across the **MKCE College campus in Karur, Tamil Nadu**. It uses IoT ultrasonic sensors to measure the water level inside manhole lids and reports the data to a live web dashboard. Supervisors are notified via **WhatsApp** when any lid reaches a critical level.

### Why it exists
Manual inspection of sewage lids is slow, hazardous, and reactive. EcoSpark turns this into a **proactive, automated, zero-human-check** operation. Overflow is prevented before it happens.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔴 Real-time alerts | Socket.IO pushes WARNING/CRITICAL instantly to all connected clients |
| 📍 Campus map | Interactive Leaflet map showing all 10 lid locations with live status |
| 📊 History & analytics | Per-lid paginated history, status trends, battery & signal tracking |
| 📲 WhatsApp notifications | Auto-WhatsApp to the zone supervisor on every CRITICAL reading |
| 🌡 Weather panel | Live environmental data shown alongside sensor data |
| 🧪 Built-in simulator | In-browser tool to simulate sensor payloads at adjustable intervals |
| 🧠 AI Intelligence Layer | Separate microservice (port 3003) for advanced sensor logic |

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    HARDWARE / PHYSICAL LAYER                        │
│  Ultrasonic Sensor (HC-SR04) → MCU (Arduino/ESP32) → HTTP POST     │
└──────────────────────┬─────────────────────────────────────────────┘
                       │  POST /api/raw-sensor-data  (raw pulse → %)
                       ▼
┌────────────────────────────────────────────────────────────────────┐
│                  BACKEND  (Node.js · Port 3001)                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  Express API  │  │ Socket.IO Server  │  │ MongoDB (Mongoose)   │ │
│  │  (REST Routes)│  │ (Real-time push)  │  │ SensorData model    │ │
│  └──────┬───────┘  └────────┬─────────┘  │ Alert model         │ │
│         │                   │             └──────────────────────┘ │
│  ┌──────▼───────────────────▼──────────────────────────────────┐  │
│  │  Service Layer: sensorService · alertService · socketService │  │
│  │                · notificationService                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────────────────┘
         │ REST + WS   │
         ▼             ▼
┌──────────────────┐  ┌──────────────────────────────────────────────┐
│  Sensor          │  │        FRONTEND (Next.js · Port 3000)         │
│  Simulator       │  │  SocketProvider → useSocketData hook          │
│  (Browser app)   │  │  StatCards · MapView · LidGrid · AlertPanel   │
│  served by       │  │  HistoryTable · WeatherPanel · LidReportPanel │
│  backend         │  └──────────────────────────────────────────────┘
└──────────────────┘
             ┌─────────────────────────────────────────────────────┐
             │  Sensor Intelligence Layer (Node.js · Port 3003)    │
             └─────────────────────────────────────────────────────┘
             ┌─────────────────────────────────────────────────────┐
             │  Supervisor Mobile View (Static HTML)               │
             │  supervisor-mobile/index.html                       │
             └─────────────────────────────────────────────────────┘
             ┌─────────────────────────────────────────────────────┐
             │  WhatsApp Gateway (CallMeBot API)                   │
             │  Triggered on every CRITICAL alert                  │
             └─────────────────────────────────────────────────────┘
```

---

## 3. Module Breakdown

### 3.1 Backend

**Location:** `backend/`  
**Runtime:** Node.js  
**Entry point:** `backend/server.js`  
**Port:** `3001`

The backend is the **central hub** of EcoSpark. It handles everything: REST APIs, real-time WebSocket events, database persistence, alert lifecycle, and outbound notifications.

#### Bootstrap Order (server.js)
1. Load `.env` (dotenv)
2. Connect to MongoDB — Atlas URI or falls back to in-memory (mongodb-memory-server) for dev
3. Seed 10 initial lid records if DB is empty (`seedLids`)
4. Create Express app + attach CORS + JSON parser
5. Wrap app in `http.Server`
6. Attach Socket.IO; initialize `socketService` singleton
7. Mount REST routes
8. Start listening

#### Directory Structure
```
backend/
├── server.js                    # Entry point (bootstrap)
├── .env                         # Secrets (not committed)
├── package.json
├── data/
│   └── notifications.json       # Persisted WhatsApp notification log (auto-created)
└── src/
    ├── config/
    │   └── db.js                # Mongoose connect + in-memory fallback
    ├── models/
    │   ├── SensorData.js        # Stores every sensor reading
    │   └── Alert.js             # Stores WARNING/CRITICAL alerts
    ├── services/
    │   ├── sensorService.js     # Core: ingest → compute → save → emit
    │   ├── alertService.js      # Alert lifecycle: create / resolve
    │   ├── socketService.js     # Socket.IO singleton emitter
    │   └── notificationService.js # WhatsApp alerts + notification log
    ├── controllers/
    │   ├── sensorController.js  # Validates POST /api/sensor-data
    │   ├── lidController.js     # GET /api/lids + history
    │   └── alertController.js   # GET /api/alerts
    ├── routes/
    │   ├── sensorRoutes.js
    │   ├── lidRoutes.js
    │   └── alertRoutes.js
    └── utils/
        ├── statusCompute.js     # Threshold computation (< 40 / 40-70 / > 70)
        └── seedLids.js          # Seeds 10 MKCE campus lids on startup
```

#### Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | REST API framework |
| `socket.io` | Real-time bidirectional WebSocket events |
| `mongoose` | MongoDB ODM |
| `mongodb-memory-server` | In-memory MongoDB for development (no Atlas needed) |
| `cors` | Cross-origin request handling |
| `dotenv` | Environment variable loading |

---

### 3.2 Frontend Dashboard

**Location:** `frontend/`  
**Framework:** Next.js 16 (App Router) + TypeScript + TailwindCSS v4  
**Port:** `3000` (dev server)

The frontend is an **Admin Dashboard** showing all 10 campus sensor nodes in real time. It connects to the backend via Socket.IO and REST.

#### Page Layout (`src/app/page.tsx`)
```
DashboardPage
├── Sidebar (mini icon rail)
├── Header (title + connection status badge + live clock)
└── Main Content
    ├── Section 1: StatCards (total / normal / warning / critical counts)
    ├── Section 2: Campus Sensor Map (Leaflet) + WeatherPanel
    ├── Section 3: Active Node Matrix (LidGrid with LidCards)
    ├── Section 4: AlertPanel + HistoryTable (side-by-side)
    └── Section 5: LidReportPanel (AI intelligence insights per lid)
```

#### Component Reference

| File | What it does |
|------|-------------|
| `SocketProvider.tsx` | Wraps the app; connects to backend Socket.IO; exposes `lids` and `alerts` state via `useSocketData()` hook |
| `StatCards.tsx` | Top-level KPI cards — Total, Normal, Warning, Critical counts |
| `MapView.tsx` | Leaflet interactive map with pin markers for each lid; colour-coded by status |
| `LidGrid.tsx` | Grid of LidCard components |
| `LidCard.tsx` | Individual sensor card: lid ID, area, water level, battery, signal, status badge |
| `AlertPanel.tsx` | Scrollable list of active (unresolved) alerts |
| `HistoryTable.tsx` | Paginated table of sensor readings per selected lid |
| `WeatherPanel.tsx` | Displays live weather data for Karur |
| `LidReportPanel.tsx` | AI-powered analytics and insights per lid |

#### Data Flow in Frontend
```
Server (Socket.IO)
  → SocketProvider (event listeners)
    → updates React state: { lids: {}, alerts: [] }
      → useSocketData() hook (consumed by all dashboard components)
```

#### Key Dependencies

| Package | Purpose |
|---------|---------|
| `socket.io-client` | Connects to backend Socket.IO |
| `leaflet` | Interactive maps |
| `lucide-react` | Icon library |
| `next` | React framework |
| `tailwindcss v4` | Utility-first CSS |
| `radix-ui` | Accessible UI primitives |
| `shadcn` | Component library based on Radix |

---

### 3.3 Sensor Simulator

**Location:** `sensor-simulator/`  
**Type:** Browser-based HTML app  
**Served at:** `http://localhost:3001/simulator`

The sensor simulator lets developers and testers emulate a real IoT sensor **directly from the browser** without any hardware.

#### How it works
1. User selects **Lid ID** and **Interval** (e.g. 3s, 5s, 10s)
2. User picks a **Status Override**: NORMAL / WARNING / CRITICAL (or AUTO)
3. `simulatePhysics()` converts a simulated ultrasonic pulse (µs) → distance (cm):
   ```
   distance_cm = (pulse_us × 0.034) / 2
   ```
4. Water level % is computed in the backend:
   ```
   water_level = ((manhole_depth_cm - distance_cm) / manhole_depth_cm) × 100
   ```
5. A **PANIC button** immediately fires a CRITICAL-level reading

#### Simulated Payload (raw sensor format)
```json
{
  "lid_id": "MKCE_LID_01",
  "distance_cm": 25,
  "manhole_depth_cm": 100,
  "temperature_c": 34,
  "signal_quality": "GOOD",
  "timestamp": "2026-09-11T05:00:00Z"
}
```

---

### 3.4 Sensor Intelligence Layer

**Location:** `sensor-intelligence/`  
**Runtime:** Node.js  
**Port:** `3003`

A **separate microservice** for advanced sensor intelligence and analytics. Runs independently from the main backend.

```
sensor-intelligence/
├── index.js          # Entry point — Express + Socket.IO on port 3003
└── src/
    ├── controllers/
    ├── routes/       # API routes mounted at /api
    └── services/
```

---

### 3.5 Supervisor Mobile View

**Location:** `supervisor-mobile/`  
**Type:** Static single-page HTML app

A lightweight mobile-friendly view for field supervisors to check WhatsApp notification history and current lid statuses. No build step required.

---

## 4. Data Flow — End-to-End

```
[Physical Sensor / Simulator]
        │
        │  POST /api/raw-sensor-data  (or /api/sensor-data)
        ▼
[sensorController.js]  ← validates input (lid_id, water_level)
        │
        ▼
[sensorService.ingestReading()]
        ├── computeStatus(water_level.value)  →  NORMAL / WARNING / CRITICAL
        ├── SensorData.create(...)             →  persisted to MongoDB
        ├── socketService.emitSensorUpdate()   →  broadcasts sensor:update to WS clients
        └── alertService.handleAlert()
                ├── if NORMAL  → auto-resolve any open alert for this lid
                └── if WARNING/CRITICAL
                        ├── resolve existing open alert
                        ├── Alert.create(...)           → persisted to MongoDB
                        ├── socketService.emitAlert()   → broadcasts alert:new to WS clients
                        └── if CRITICAL → notificationService.sendCriticalAlert()
                                            ├── HTTP GET to CallMeBot WhatsApp API
                                            └── saveToHistory() → data/notifications.json
        │
        ▼
[Frontend SocketProvider]
        ├── sensor:update event → updates lids state in React
        └── alert:new event     → appends to alerts state in React
                │
                ▼
        All dashboard components re-render with live data
```

---

## 5. API Reference

Base URL: `http://localhost:3001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sensor-data` | Ingest a standard sensor reading |
| `POST` | `/api/raw-sensor-data` | Ingest a raw ultrasonic reading (pulse → % conversion done server-side) |
| `GET` | `/api/lids` | Latest reading per lid (live status of all nodes) |
| `GET` | `/api/lids/:id/history` | Paginated history for one lid (`?limit=50&skip=0`) |
| `GET` | `/api/alerts` | All active (unresolved) alerts |
| `GET` | `/api/notifications` | WhatsApp notification log |
| `GET` | `/health` | Health check |

### Standard Sensor Payload (`POST /api/sensor-data`)
```json
{
  "lid_id": "MKCE_LID_01",
  "location": {
    "area": "Main Gate Road",
    "city": "Karur",
    "latitude": 11.0558,
    "longitude": 78.0472
  },
  "water_level": {
    "value": 72,
    "unit": "percentage"
  },
  "timestamp": "2026-09-11T05:00:00Z",
  "sensor_meta": {
    "sensor_type": "ultrasonic",
    "battery_level": 85,
    "signal_strength": "GOOD"
  }
}
```

### Raw Sensor Payload (`POST /api/raw-sensor-data`)
```json
{
  "lid_id": "MKCE_LID_01",
  "distance_cm": 30,
  "manhole_depth_cm": 100,
  "temperature_c": 35,
  "signal_quality": "GOOD",
  "timestamp": "2026-09-11T05:00:00Z"
}
```

### Success Response
```json
{
  "success": true,
  "id": "66f12345abc...",
  "lid_id": "MKCE_LID_01",
  "status": "CRITICAL",
  "alert": { "id": "66f12346abc...", "status": "CRITICAL" },
  "message": "Reading ingested. Status: CRITICAL"
}
```

---

## 6. WebSocket Events

Socket.IO runs on the same port as the REST API (`3001`).

| Event Name | Direction | Payload | Description |
|-----------|-----------|---------|-------------|
| `sensor:update` | Server → Client | SensorData document | Emitted after every new reading is persisted |
| `alert:new` | Server → Client | Alert document | Emitted when a WARNING or CRITICAL alert is created |
| `lid:update` | Server → Client | SensorData document | Emitted after raw-sensor-data ingest |
| `subscribe:lid` | Client → Server | `lidId` string | Client joins room `lid:{lidId}` for targeted updates |

### Client Connection Example
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('sensor:update', (data) => {
  console.log('New reading:', data.lid_id, data.status, data.water_level.value);
});

socket.on('alert:new', (alert) => {
  console.log('ALERT:', alert.status, 'for', alert.lid_id);
});

// Subscribe to a specific lid room
socket.emit('subscribe:lid', 'MKCE_LID_01');
```

---

## 7. MongoDB Schemas

### SensorData (`sensordatas` collection)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `lid_id` | String | ✅ | Identifier for the manhole lid |
| `location.area` | String | | Human-readable area name |
| `location.city` | String | | City name |
| `location.latitude` | Number | | GPS latitude |
| `location.longitude` | Number | | GPS longitude |
| `water_level.value` | Number | ✅ | 0–100 percentage |
| `water_level.unit` | String | | Always "percentage" |
| `status` | String | ✅ | NORMAL \| WARNING \| CRITICAL |
| `sensor_meta.sensor_type` | String | | e.g. "ultrasonic" |
| `sensor_meta.battery_level` | Number | | Battery % |
| `sensor_meta.signal_strength` | String | | GOOD \| LOW |
| `timestamp` | Date | ✅ | Reading timestamp |
| `createdAt` / `updatedAt` | Date | | Auto-managed by Mongoose |

**Indexes:** `lid_id`, `timestamp`, compound `{ lid_id: 1, timestamp: -1 }`

### Alert (`alerts` collection)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `lid_id` | String | ✅ | Which lid triggered the alert |
| `area` | String | | Location area |
| `city` | String | | Location city |
| `status` | String | ✅ | WARNING \| CRITICAL |
| `water_level_value` | Number | ✅ | Water level at time of alert |
| `timestamp` | Date | ✅ | Time of the reading that triggered the alert |
| `resolved` | Boolean | | `false` = active, `true` = resolved |
| `resolved_at` | Date | | When it was auto-resolved |

**Alert Rule:** Only 1 active alert (`resolved: false`) per `lid_id` at any time.

---

## 8. Status Threshold Logic

All threshold computation lives in `backend/src/utils/statusCompute.js` — the **single source of truth**.

| Water Level (%) | Status | Colour |
|----------------|--------|--------|
| 0 – 39 | NORMAL | 🟢 Green |
| 40 – 70 | WARNING | 🟡 Yellow |
| 71 – 100 | CRITICAL | 🔴 Red |

```js
function computeStatus(value) {
    if (value > 70)  return 'CRITICAL';
    if (value >= 40) return 'WARNING';
    return 'NORMAL';
}
```

> ⚠️ **Rule:** If thresholds need to change, update ONLY `statusCompute.js`. Never hardcode threshold values anywhere else.

---

## 9. Alert & Notification Pipeline

```
New sensor reading arrives
         │
         ▼
computeStatus(water_level.value)
         │
    ┌────┴──────────────────────────────────┐
    │ NORMAL                                │ WARNING / CRITICAL
    ▼                                       ▼
Auto-resolve any                  Resolve any existing open alert
open alert for lid                         │
                                  Alert.create({...})     ← persist to MongoDB
                                           │
                                  socketService.emitAlert() ← push to WS clients
                                           │
                                  ┌────────┴──────────────┐
                                  │ if CRITICAL only       │
                                  ▼                        │
                    notificationService.sendCriticalAlert() │
                         │                                  │
                         ├── CallMeBot WhatsApp API         │
                         └── saveToHistory()                │
                             (data/notifications.json)      │
```

### Supervisor Phone Mapping

| Lid ID | Supervisor | Phone | Zone |
|--------|-----------|-------|------|
| MKCE_LID_01 | Raj Kumar | +917397139329 | Main Gate |
| MKCE_LID_02 | Ananth S | +918765432109 | Academic Block |
| MKCE_LID_03 | Deepak V | +917654321098 | Central Avenue |
| DEFAULT | General Supervisor | +917397139329 | MKCE Campus |

> 💡 Set `WHATSAPP_API_KEY` in `backend/.env` to enable real WhatsApp messages.

---

## 10. Sensor Nodes (Seeded Lids)

All 10 lids are seeded into MongoDB on first startup by `backend/src/utils/seedLids.js`.

| Lid ID | Area | Latitude | Longitude | Default Water Level |
|--------|------|----------|-----------|---------------------|
| MKCE_LID_01 | Main Gate Road | 11.0558 | 78.0472 | 25% (NORMAL) |
| MKCE_LID_02 | Academic Block Road | 11.0550 | 78.0488 | 18% (NORMAL) |
| MKCE_LID_03 | Central Avenue | 11.0542 | 78.0495 | 45% (WARNING) |
| MKCE_LID_04 | Library Road | 11.0535 | 78.0478 | 12% (NORMAL) |
| MKCE_LID_05 | Workshop Road | 11.0528 | 78.0502 | 30% (NORMAL) |
| MKCE_LID_06 | Hostel Block Road | 11.0548 | 78.0510 | 20% (NORMAL) |
| MKCE_LID_07 | Hostel Ring Road | 11.0538 | 78.0520 | 15% (NORMAL) |
| MKCE_LID_08 | Playground Perimeter | 11.0525 | 78.0465 | 10% (NORMAL) |
| MKCE_LID_09 | Canteen Road | 11.0560 | 78.0505 | 22% (NORMAL) |
| MKCE_LID_10 | Back Gate Road | 11.0520 | 78.0490 | 5% (NORMAL) |

---

## 11. Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |
| `MONGO_URI` | *(blank)* | MongoDB URI. Blank = in-memory dev DB |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `WHATSAPP_API_KEY` | `your_apikey_here` | CallMeBot API key for WhatsApp alerts |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3001` | Backend API base URL |

---

## 12. Developer Setup Guide

### Prerequisites
- Node.js v18+
- npm v9+
- (Optional) MongoDB Atlas account for production

### Step 1 — Start the Backend
```bash
cd backend
npm install
npm start
# → http://localhost:3001
# → MongoDB starts in-memory automatically
# → 10 sensor lids are seeded on first run
```

### Step 2 — Start the Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Step 3 — Use the Sensor Simulator (no hardware needed)
```
Open browser: http://localhost:3001/simulator
Select lid → Choose interval → Start
Use PANIC button to trigger an immediate CRITICAL reading
```

### Step 4 — Start the Intelligence Layer (optional)
```bash
cd sensor-intelligence
npm install
node index.js
# → http://localhost:3003
```

### curl Quick Tests
```bash
# Health check
curl http://localhost:3001/health

# Get all lid statuses
curl http://localhost:3001/api/lids

# Post a CRITICAL reading
curl -X POST http://localhost:3001/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"lid_id":"MKCE_LID_01","location":{"area":"Main Gate Road","city":"Karur"},"water_level":{"value":85,"unit":"percentage"},"timestamp":"2026-09-11T05:00:00Z","sensor_meta":{"sensor_type":"ultrasonic","battery_level":85,"signal_strength":"GOOD"}}'

# Get active alerts
curl http://localhost:3001/api/alerts

# Get lid history
curl "http://localhost:3001/api/lids/MKCE_LID_01/history?limit=10"
```

---

## 13. Project File Structure

```
EcoSpark/
├── README.md                        # Quick-start reference
├── PROJECT_KNOWLEDGE.md             # This file — full team knowledge base
├── .gitignore
│
├── backend/                         # Main server (Node.js · Port 3001)
│   ├── server.js                    # Entry point
│   ├── package.json
│   ├── data/
│   │   └── notifications.json       # Auto-generated WhatsApp log
│   └── src/
│       ├── config/db.js
│       ├── models/
│       │   ├── SensorData.js
│       │   └── Alert.js
│       ├── services/
│       │   ├── sensorService.js     # Core ingest pipeline
│       │   ├── alertService.js      # Alert lifecycle
│       │   ├── socketService.js     # Socket.IO singleton emitter
│       │   └── notificationService.js
│       ├── controllers/
│       │   ├── sensorController.js
│       │   ├── lidController.js
│       │   └── alertController.js
│       ├── routes/
│       │   ├── sensorRoutes.js
│       │   ├── lidRoutes.js
│       │   └── alertRoutes.js
│       └── utils/
│           ├── statusCompute.js     # Threshold logic
│           └── seedLids.js          # Initial 10 lid data seeder
│
├── frontend/                        # Web Dashboard (Next.js · Port 3000)
│   ├── package.json
│   ├── next.config.ts
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx             # Main dashboard page
│       │   └── globals.css
│       ├── components/
│       │   ├── SocketProvider.tsx   # Real-time state context
│       │   ├── dashboard/
│       │   │   ├── StatCards.tsx
│       │   │   ├── MapView.tsx
│       │   │   ├── LidGrid.tsx
│       │   │   ├── LidCard.tsx
│       │   │   ├── AlertPanel.tsx
│       │   │   ├── HistoryTable.tsx
│       │   │   ├── WeatherPanel.tsx
│       │   │   └── LidReportPanel.tsx
│       │   └── ui/                  # Shadcn/Radix primitives
│       └── lib/
│
├── sensor-simulator/                # In-browser sensor emulator
│   ├── index.html
│   └── simulator.js
│
├── sensor-intelligence/             # Analytics microservice (Port 3003)
│   ├── index.js
│   └── src/
│       ├── controllers/
│       ├── routes/
│       └── services/
│
├── supervisor-mobile/               # Supervisor lightweight view
│   └── index.html
│
├── public/                          # Static assets served by backend
└── simulator/                       # Legacy simulator scripts
    └── simulate.js
```

---

## 14. Coding Conventions

### General Rules
- **Async:** Always use `async/await` — never raw `.then()/.catch()` chains
- **Error handling:** All async functions wrapped in `try/catch`; log errors and return HTTP 500 with details
- **No secrets in code:** All keys and URIs go in `.env` — never hardcode

### Backend Rules
- **MVC strictly enforced:** Business logic only in `src/services/` — never in routes or controllers
- **Controllers only validate:** Validate → call service → respond
- **Single Socket emitter:** Always use `socketService.emit*()` — never call `io.emit()` directly outside `socketService.js`
- **Single threshold file:** Always call `computeStatus()` from `utils/statusCompute.js` — never hardcode `40` or `70` elsewhere
- **Alert uniqueness:** Always resolve stale alerts before creating new ones

### Frontend Rules
- **Single source of truth:** Use `useSocketData()` hook for all live data — no duplicate state
- **TypeScript required:** All new components must be typed — avoid `any`
- **TailwindCSS only:** No inline styles, no custom CSS modules unless absolutely necessary

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Backend files | camelCase | `sensorService.js` |
| Frontend files | PascalCase | `LidCard.tsx` |
| Variables | camelCase | `water_level_value` |
| Constants | UPPER_SNAKE_CASE | `WHATSAPP_API_KEY` |
| Lid IDs | UPPER_SNAKE with prefix | `MKCE_LID_01` |

---

## 🤝 Team Guidelines

1. **Never commit `.env` files.** Use `.env.example` as a template.
2. **Test with the simulator first.** Use the browser simulator before pushing sensor-related changes.
3. **One threshold file.** Only `statusCompute.js` controls alert thresholds.
4. **Socket events are contracts.** Changing an event name requires updating both backend emit and frontend listener — and updating Section 6 in this file.
5. **Adding new lids?** Update both `seedLids.js` (location data) and `notificationService.js` (supervisor mapping) together.

---

*© 2026 EcoSpark Engineering — MKCE Campus, Karur, Tamil Nadu*  
*Built with ❤️ for SDG 11 · Sustainable Cities & Communities*
