# 🚀 EcoSpark — Prototype Demo & Production Readiness Guide

> **Project:** EcoSpark (AI-Powered Smart Sewage Monitoring & Decision Support System)  
> **Target Milestone:** Working Benchtop Hardware Prototype Demo + Production Deployment  
> **Document Purpose:** Complete status audit, gap analysis, and step-by-step execution roadmap.

---

## 📋 Table of Contents

1. [Executive Summary & Architecture Comparison](#1-executive-summary--architecture-comparison)
2. [What Is Already Built (Completed Features)](#2-what-is-already-built-completed-features)
3. [What Remains to Be Completed (Gaps & Deficits)](#3-what-remains-to-be-completed-gaps--deficits)
4. [Hardware Prototype Specifications & Circuit Setup](#4-hardware-prototype-specifications--circuit-setup)
5. [Step-by-Step Execution Roadmap](#5-step-by-step-execution-roadmap)
6. [Benchtop Prototype Demo Runbook](#6-benchtop-prototype-demo-runbook)
7. [Production Hardening Checklist](#7-production-hardening-checklist)

---

## 1. Executive Summary & Architecture Comparison

EcoSpark monitors underground urban sewage levels in real time to prevent flooding and pipe overflows. Telemetry gathered by ultrasonic sensors is evaluated by an engineering rule engine and augmented with weather intelligence and AI recommendations for municipal and campus authorities.

### Architecture Comparison: Vision vs. Current Implementation

| Dimension | `PROJECT_IDEA.md` (Original Vision) | Current Implementation (`PROJECT_KNOWLEDGE.md`) | Production / Demo Target |
| :--- | :--- | :--- | :--- |
| **Physical Hardware** | AJ-SR04M + ESP32 via HTTP POST | Currently simulated via web UI & CLI scripts | **ESP32 + AJ-SR04M working benchtop model** |
| **Backend** | Node.js + Express + Rule Engine | Node.js + Express (Port 3001) + Socket.IO | Express backend with live WebSockets |
| **Database** | SQLite (Prototype) / PostgreSQL | MongoDB / `mongodb-memory-server` | Persistent MongoDB Atlas or PostgreSQL |
| **Real-time Pipeline** | Socket.IO to Next.js | Socket.IO `sensor:update` & `alert:new` | Socket.IO client-server event bus |
| **Alerts & Messaging** | Dashboard notifications | Automated WhatsApp to supervisors (CallMeBot API) | WhatsApp alerts + sound + visual beacon |
| **AI Intelligence Layer** | Google Gemini API | Microservice (Port 3003) with Ollama + Local Heuristics | **Google Gemini API adapter + Local Fallback** |
| **Weather Engine** | Open-Meteo Weather API | Open-Meteo API integrated in microservice & UI | Real-time rainfall & surge prediction |
| **Web Dashboard** | Next.js + React + Leaflet + Tailwind | Next.js 16 + Tailwind v4 + Leaflet + Shadcn | Interactive Map + Gauge Cards + AI Panel |

---

## 2. What Is Already Built (Completed Features)

Approximately **75% of the end-to-end software stack** is built and functional:

### 2.1 Backend Core & Event Bus (`backend/` · Port 3001)
- **Telemetry Ingestion REST Endpoints**:
  - `POST /api/raw-sensor-data`: Accepts raw distance (`distance_cm`, `manhole_depth_cm`), calculates water level percentage, evaluates alert status, persists to DB, and broadcasts via Socket.IO.
  - `POST /api/sensor-data`: Standard telemetry ingestion endpoint.
  - `GET /api/lids`: Retrieves latest readings and statuses for all 10 campus nodes.
  - `GET /api/lids/:id/history`: Paginated history per lid (`?limit=50&skip=0`).
  - `GET /api/alerts`: Active, unresolved warnings and critical alerts.
  - `GET /api/notifications`: Log of all outbound supervisor WhatsApp alerts.
  - `GET /health`: Server health check.
- **Seeding Engine (`src/utils/seedLids.js`)**: Seeds 10 realistic manhole nodes with precise GPS coordinates across MKCE Campus, Karur.
- **Status Threshold Logic (`src/utils/statusCompute.js`)**: Single source of truth:
  - `0% – 39%`: **NORMAL** (🟢 Green)
  - `40% – 70%`: **WARNING** (🟡 Yellow)
  - `71% – 100%`: **CRITICAL** (🔴 Red)
- **Real-Time WebSocket Server (`src/services/socketService.js`)**: Broadcasts `sensor:update`, `alert:new`, and room-targeted events (`lid:{id}`).
- **WhatsApp Notification Pipeline (`src/services/notificationService.js`)**:
  - Automatically dispatches WhatsApp alert messages via CallMeBot API on `CRITICAL` events.
  - Maps specific lids to assigned zone supervisors.
  - Records notification history to `backend/data/notifications.json`.

### 2.2 Frontend Operations Dashboard (`frontend/` · Port 3000)
- **Framework**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.
- **Key Metrics KPI Cards (`StatCards.tsx`)**: Real-time counter of total lids, normal, warning, and critical nodes.
- **Interactive Campus GIS Map (`MapView.tsx`)**: Leaflet map displaying 10 campus lids with status-colored pulsing markers.
- **Active Node Matrix (`LidGrid.tsx` & `LidCard.tsx`)**: Real-time cards showing water levels (progress bars), signal strength, battery %, and status badges.
- **Alert Stream (`AlertPanel.tsx`)**: Unresolved alert list with severity filters.
- **Telemetry History (`HistoryTable.tsx`)**: Paginated audit table per manhole node.
- **Live Environmental Panel (`WeatherPanel.tsx`)**: Live weather data for Karur via Open-Meteo.
- **Intelligence Reports Panel (`LidReportPanel.tsx`)**: Displays operational AI reports per selected lid.
- **Global Context (`SocketProvider.tsx`)**: Handles client Socket.IO connections and state synchronization.

### 2.3 Sensor Intelligence Microservice (`sensor-intelligence/` · Port 3003)
- **Environmental Correlation (`weatherService.js`)**: Fetches current rain and 3-day precipitation forecasts from Open-Meteo.
- **Dual-Engine LLM Analysis (`llmService.js`)**:
  - Primary: Local Ollama model (`llama3.2`) with engineering prompt.
  - Fallback: Comprehensive rule-based heuristic generation (`generateLocalReport`) if Ollama is not installed or offline.
  - Outputs structured municipal action reports: water level, trend, risk assessment, cleaning schedule, priority, and next action.

### 2.4 Test Suites & Simulators
- **In-Browser Simulator (`sensor-simulator/` / `http://localhost:3001/simulator`)**:
  - Interactive UI with Lid selector, transmission interval (3s, 5s, 10s), and manual status override.
  - **PANIC Button** for instant CRITICAL threshold testing.
- **CLI Simulators**: Node.js script (`simulator/simulate.js`) and Python script (`simulator/simulate.py`).
- **Field View (`supervisor-mobile/index.html`)**: Lightweight mobile HTML interface for supervisors.

---

## 3. What Remains to Be Completed (Gaps & Deficits)

To demonstrate a live physical prototype and prepare for production, the following gaps must be resolved:

| # | Missing Component | Severity | Description |
|---|---|---|---|
| **1** | **ESP32 Firmware Sketch** | 🔴 Critical | No microcontroller C++ code (`.ino`) exists in the repository for ESP32 + AJ-SR04M. |
| **2** | **Physical Circuit Setup** | 🔴 Critical | Need circuit pinout, voltage divider for 5V echo to 3.3V GPIO, and wiring instructions. |
| **3** | **Gemini Cloud AI Integration** | 🟡 High | `PROJECT_IDEA.md` targets Google Gemini API, but the microservice currently targets local Ollama. Adding Gemini enables cloud deployment without local GPU requirements. |
| **4** | **Database Persistence** | 🟡 High | Backend falls back to in-memory MongoDB. Need persistent MongoDB Atlas or PostgreSQL configuration. |
| **5** | **Frontend Hardcoded URL Fix** | 🟡 High | `LidReportPanel.tsx` has `http://localhost:3003` hardcoded. Must be swapped with `NEXT_PUBLIC_INTELLIGENCE_URL`. |
| **6** | **Device Authentication** | 🔵 Medium | Ingestion routes are open to any device. Need a shared secret header (`X-Device-Token`). |
| **7** | **Unified Startup Orchestration** | 🔵 Medium | Must run 3 separate terminals. Need a single `npm run demo` or Docker script. |

---

## 4. Hardware Prototype Specifications & Circuit Setup

### 4.1 Bill of Materials (BOM) for Prototype
1. **ESP32 Development Board** (NodeMCU-32S / ESP-WROOM-32).
2. **AJ-SR04M Waterproof Ultrasonic Sensor Module** (includes ultrasonic probe and transceiver board).
3. **Resistors for Voltage Divider**: $1\text{ k}\Omega$ and $2\text{ k}\Omega$ (protects ESP32 GPIO from 5V echo signal).
4. **Power Source**: 5V micro-USB cable or 5V battery bank.
5. **Breadboard & Jumper Wires**.
6. **Physical Test Rig**: A container (e.g., 30–50 cm tall transparent cylinder, pipe, or bucket) with water.

### 4.2 Circuit Wiring Diagram

```
           AJ-SR04M Board                       ESP32 Dev Board
        ┌──────────────────┐                  ┌──────────────────┐
        │ 5V (VCC)         │──────────────────│ 5V / VIN         │
        │ GND              │──────────────────│ GND              │
        │ TRIG             │──────────────────│ GPIO 5           │
        │                  │                  │                  │
        │ ECHO (5V Out)    │───┐              │                  │
        └──────────────────┘   │              │                  │
                               │              │                  │
                         ┌─────┴─────┐        │                  │
                         │ R1 (1kΩ)  │        │                  │
                         └─────┬─────┘        │                  │
                               ├───[Tap to]───│ GPIO 18          │
                         ┌─────┴─────┐        │                  │
                         │ R2 (2kΩ)  │        │                  │
                         └─────┬─────┘        │                  │
                               │              │                  │
                              GND ────────────│ GND              │
                                              └──────────────────┘
```

> ⚠️ **IMPORTANT**: The AJ-SR04M runs on **5V** and outputs a **5V Echo pulse**. The ESP32 GPIO pins tolerate a maximum of **3.3V**. The voltage divider ($1\text{ k}\Omega + 2\text{ k}\Omega$) scales $5\text{V} \times \frac{2}{1+2} \approx 3.33\text{V}$ to protect the ESP32 pin.

### 4.3 Sensor Calculation Principle
- **Time of flight** to distance:
  $$\text{distance\_cm} = \frac{\text{duration\_microseconds} \times 0.0343}{2}$$
- **Water level percentage** (computed in backend or ESP32):
  $$\text{water\_level\_pct} = \left(\frac{\text{manhole\_depth\_cm} - \text{distance\_cm}}{\text{manhole\_depth\_cm}}\right) \times 100$$

---

## 5. Step-by-Step Execution Roadmap

```
Phase 1: Code Fixes & Integrations (Days 1–2)
  ├── 1.1 Fix hardcoded frontend URL in LidReportPanel.tsx
  ├── 1.2 Implement Google Gemini API adapter in sensor-intelligence
  ├── 1.3 Add root package.json with concurrent demo launch script
  └── 1.4 Add device token validation to backend ingest route

Phase 2: Firmware & Benchtop Model (Days 3–4)
  ├── 2.1 Create firmware/esp32_sensor.ino sketch
  ├── 2.2 Wire ESP32 and AJ-SR04M on breadboard
  ├── 2.3 Calibrate depth parameter against container height
  └── 2.4 Verify end-to-end HTTP POST to backend

Phase 3: Prototype Demo & Testing (Day 5)
  ├── 3.1 Water pouring test (Normal → Warning → Critical)
  ├── 3.2 Verify real-time dashboard gauge update (< 500ms latency)
  ├── 3.3 Verify WhatsApp alert dispatch to supervisor phone
  └── 3.4 Verify AI report generation in dashboard

Phase 4: Production Hardening (Days 6–7)
  ├── 4.1 Switch to persistent cloud database (MongoDB Atlas or PostgreSQL)
  ├── 4.2 Dockerize all services (Docker Compose)
  └── 4.3 Cloud hosting deployment (Vercel + Render / Cloud Run)
```

---

## 6. Benchtop Prototype Demo Runbook

Follow these steps for an interactive demonstration:

### Step 1: Start the EcoSpark Stack
From the project root:
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Sensor Intelligence Layer
cd sensor-intelligence && node index.js

# Terminal 3: Frontend Dashboard
cd frontend && npm run dev
```

### Step 2: Open Dashboard & Confirm Connection
- Open `http://localhost:3000`.
- Verify top-right status reads **"SYSTEM ACTIVE"** with a pulsing cyan indicator.
- Verify the 10 map pins load on the MKCE campus map.

### Step 3: Power the ESP32 Prototype
- Mount the AJ-SR04M sensor face-down over an empty bucket or cylinder (calibrated depth: e.g., 40 cm).
- Plug the ESP32 into a USB power source.
- Open the Arduino Serial Monitor at 115200 baud to verify:
  - Wi-Fi connected with local IP.
  - Ultrasonic distance reading output.
  - HTTP `200 OK` response received from `http://<YOUR_IP>:3001/api/raw-sensor-data`.

### Step 4: Perform the Live Demonstration Flow
1. **Initial State (Empty Container - Normal)**:
   - Water level reads $< 20\%$. Card glows green.
2. **Inflow / Rain Simulation (Pouring Water)**:
   - Slowly pour water into the container.
   - Distance shrinks $\rightarrow$ Water percentage increases in real-time on the dashboard via Socket.IO without page reload.
3. **Threshold Crossing (Warning $\ge 40\%$)**:
   - Card transitions from Green to Yellow.
4. **Critical Condition ($\ge 71\%$)**:
   - Card turns bright Red with an alert banner.
   - Campus map pin pulses Red.
   - **WhatsApp Alert Delivered**: Supervisor phone receives an instant message:
     ```
     🚨 CRITICAL SEWAGE ALERT 🚨
     Lid: MKCE_LID_01
     Area: Main Gate Road
     Level: 78% (CRITICAL)
     Action Required: Inspect manhole immediately.
     ```
   - **AI Decision Report**: Click on the node in **Intelligence Insights** to review the Gemini-generated risk assessment and maintenance dispatch action.

---

## 7. Production Hardening Checklist

Before deploying to a municipal or live campus environment:

- [ ] **Database Persistence**: Set `MONGO_URI` in `backend/.env` pointing to a managed MongoDB Atlas cluster (or complete PostgreSQL migration as outlined in `MIGRATION_PLAN.md`).
- [ ] **Environment Separation**: Ensure all endpoints in `frontend/.env.production` use secure HTTPS/WSS production domains.
- [ ] **Device Security**: Enforce `X-Device-Token` header verification on `/api/sensor-data` and `/api/raw-sensor-data`.
- [ ] **Hardware Enclosure**: House the ESP32 and wiring in an **IP67/IP68 waterproof junction box**.
- [ ] **Sensor Corrosion Resistance**: Ensure the AJ-SR04M transducer is treated for hydrogen sulfide ($H_2S$) and moisture resistance in sewage environments.
- [ ] **Power Management**: For field battery operation, enable ESP32 **Deep Sleep** (wake every 60–120 seconds, take reading, transmit, and return to sleep).
- [ ] **Monitoring & Health Checks**: Configure uptime monitoring for the Express backend and WebSocket endpoints.
