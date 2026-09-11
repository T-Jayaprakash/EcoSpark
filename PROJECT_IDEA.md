# EcoSpark
# AI-Powered Smart Sewage Monitoring & Decision Support System

> **Version:** 1.0  
> **Project Type:** Full-Stack IoT + AI Smart City Solution  
> **Purpose:** Technical onboarding and project overview for new contributors.

---

# Table of Contents

1. Project Overview
2. Why EcoSpark?
3. The Core Idea
4. Problem Statement
5. Proposed Solution
6. Objectives
7. High-Level Architecture
8. Complete System Workflow
9. Technology Stack
10. Hardware Requirements
11. Sensor Working Principle
12. Communication Layer
13. Data Flow
14. Backend Processing
15. AI Intelligence Layer
16. Dashboard Features
17. Project Structure
18. Future Scope
19. Development Workflow
20. Vision

---

# 1. Project Overview

EcoSpark is an AI-powered Smart Sewage Monitoring and Decision Support System developed to help municipal corporations monitor underground drainage networks in real time.

The project combines IoT, Cloud Computing, Artificial Intelligence, and Web Technologies to provide continuous monitoring of sewage levels and generate intelligent recommendations before overflow occurs.

Unlike traditional monitoring systems that only display sensor values, EcoSpark provides operational intelligence by combining:

- Live sensor data
- Historical trends
- Weather forecasts
- Geographic context
- AI-generated recommendations

into a single monitoring platform.

---

# 2. Why EcoSpark?

Cities still rely heavily on manual inspection of underground drainage systems.

This creates several challenges:

- Overflow is detected only after flooding occurs.
- Manual inspections are expensive and time-consuming.
- Sewage blockages remain unnoticed.
- Heavy rainfall increases overflow risks.
- Authorities lack real-time visibility of underground infrastructure.
- Maintenance is reactive instead of preventive.

EcoSpark was developed to solve these problems by enabling proactive monitoring and early intervention.

---

# 3. The Core Idea

Instead of waiting for sewage overflow to occur, EcoSpark continuously monitors every manhole using ultrasonic sensors.

The collected sensor data is transmitted to a centralized backend where it is processed, analyzed, and combined with environmental information such as rainfall forecasts and historical trends.

An AI analysis layer generates simple operational reports and recommends preventive actions for municipal authorities.

The result is a platform that helps cities:

- Prevent flooding
- Improve maintenance planning
- Reduce operational costs
- Increase public safety
- Support smart city initiatives

---

# 4. Problem Statement

Urban sewage systems are primarily monitored through manual inspections, making it difficult to detect blockages and overflow risks in real time. This reactive approach often leads to flooding, environmental pollution, public health hazards, and costly infrastructure damage.

There is a need for an intelligent, real-time monitoring system capable of continuously tracking sewage levels, predicting potential overflow risks, and providing actionable recommendations for municipal authorities.

---

# 5. Proposed Solution

EcoSpark provides a real-time monitoring platform that integrates:

- Ultrasonic level sensors
- IoT communication
- Cloud backend
- Weather intelligence
- AI-assisted analysis
- Interactive dashboard

The system continuously collects sewage level information, analyzes current and historical conditions, predicts possible risks, and delivers operational recommendations through a modern web dashboard.

---

# 6. Objectives

- Monitor sewage levels continuously
- Detect overflow risks early
- Reduce manual inspections
- Improve maintenance efficiency
- Generate operational alerts
- Assist authorities with intelligent recommendations
- Build a scalable smart city solution

---

# 7. High-Level Architecture

```
AJ-SR04M Ultrasonic Sensor
            │
            ▼
ESP32 Microcontroller
            │
            ▼
HTTP Communication
            │
            ▼
Node.js + Express Backend
            │
            ├──────────────► SQLite (Prototype)
            │
            ├──────────────► Open-Meteo Weather API
            │
            ▼
Rule Engine
            │
            ▼
Gemini AI Analysis
            │
            ▼
Socket.IO
            │
            ▼
Next.js Dashboard
```

---

# 8. Complete System Workflow

### Step 1
Ultrasonic sensor measures the distance between the sensor and sewage surface.

↓

### Step 2
ESP32 measures the ultrasonic echo pulse.

↓

### Step 3
The pulse is converted into distance.

↓

### Step 4
ESP32 sends telemetry to the backend using HTTP.

↓

### Step 5
Backend validates incoming data.

↓

### Step 6
Water level percentage is calculated.

↓

### Step 7
Status is classified:

- Normal
- Warning
- Critical

↓

### Step 8
Historical sensor records are retrieved.

↓

### Step 9
Weather forecast is fetched from Open-Meteo.

↓

### Step 10
Gemini AI analyzes:

- Sensor data
- Historical trends
- Weather
- Risk

↓

### Step 11
Socket.IO broadcasts updates.

↓

### Step 12
Dashboard updates in real time.

---

# 9. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Leaflet
- Socket.IO Client

---

## Backend

- Node.js
- Express.js
- REST API
- Socket.IO
- CORS
- dotenv

---

## Database (Prototype)

- SQLite (sql.js)

### Enterprise Upgrade

- PostgreSQL
- TimescaleDB

---

## AI Layer

Google Gemini API

Used for:

- Trend analysis
- Situation summaries
- Risk explanation
- Operational recommendations

---

## External APIs

Open-Meteo Weather API

Used for:

- Current weather
- Rainfall forecast
- Environmental context

---

# 10. Hardware Requirements

## Prototype

- AJ-SR04M Waterproof Ultrasonic Sensor
- ESP32 Development Board
- Power Supply
- Waterproof Enclosure

---

## Enterprise Deployment

- Industrial Ultrasonic Level Sensor
- ESP32 / Industrial Controller
- NB-IoT / LoRaWAN / 4G Communication
- Cloud Infrastructure
- PostgreSQL + TimescaleDB

---

# 11. Sensor Working Principle

EcoSpark uses the AJ-SR04M waterproof ultrasonic sensor.

Working principle:

1. Sensor emits ultrasonic waves.
2. Waves travel to sewage surface.
3. Waves reflect back.
4. Echo time is measured.
5. Microcontroller converts time into distance.
6. Backend converts distance into water level percentage.

Formula:

```
Distance = (Time × Speed of Sound) / 2
```

---

# 12. Communication Layer

Communication Flow

```
Sensor
   │
ESP32
   │
HTTP POST
   │
Backend API
   │
Socket.IO
   │
Dashboard
```

Responsibilities:

- Reliable telemetry transfer
- Real-time communication
- Data validation
- Multi-device synchronization

---

# 13. Data Flow

```
Ultrasonic Pulse

↓

Distance

↓

JSON Telemetry

↓

Backend Validation

↓

Water Level Calculation

↓

Risk Classification

↓

Weather Integration

↓

AI Analysis

↓

Dashboard
```

Example Payload

```json
{
  "lid_id": "LID_01",
  "distance_cm": 42,
  "manhole_depth_cm": 100,
  "temperature_c": 31,
  "signal_quality": "GOOD",
  "timestamp": "2026-09-11T10:00:00Z"
}
```

---

# 14. Backend Processing

The backend performs:

- Input validation
- Water level calculation
- Rule-based status classification
- Alert generation
- Database storage
- Weather retrieval
- AI request preparation
- Socket broadcasting

Water level calculation:

```
Water Level %

=

(Manhole Depth − Distance)

÷

Manhole Depth × 100
```

Status Logic

| Water Level | Status |
|-------------|---------|
| 0–39% | Normal |
| 40–70% | Warning |
| 71–100% | Critical |

---

# 15. AI Intelligence Layer

Gemini AI is **not responsible for sensor calculations**.

The backend performs all engineering calculations.

Gemini receives processed information including:

- Current water level
- Historical trends
- Weather forecast
- Rainfall prediction
- Previous alerts
- Area information

Gemini generates:

- Situation summary
- Risk explanation
- Operational recommendations
- Preventive actions

Example:

> "Water levels have been rising steadily over the past six hours. Heavy rainfall is expected later today, increasing the possibility of overflow. Schedule inspection and keep pumping equipment ready."

---

# 16. Dashboard Features

- Live sewage level monitoring
- Interactive city map
- Sensor status
- Alert notifications
- Historical trends
- Weather information
- AI-generated operational summary
- Search by lid ID
- Multi-device real-time updates

---

# 17. Project Structure

```
EcoSpark
│
├── frontend/
│   ├── Next.js
│   ├── React
│   ├── Dashboard
│   └── Maps
│
├── backend/
│   ├── Express API
│   ├── Socket.IO
│   ├── Rule Engine
│   ├── Database
│   └── AI Services
│
├── sensor-simulator/
│   ├── Digital Twin
│   ├── Ultrasonic Simulation
│   └── HTTP Telemetry
│
└── docs/
    └── Documentation
```

---

# 18. Future Scope

- Real hardware deployment
- Cloud-native infrastructure
- PostgreSQL + TimescaleDB
- Mobile application
- GIS integration
- Predictive maintenance
- Machine Learning forecasting
- Multiple city deployment
- Offline AI using Ollama
- Role-based authentication
- Analytics dashboard

---

# 19. Development Workflow

```
Feature Branch

↓

Development

↓

Testing

↓

Code Review

↓

Merge

↓

Deployment
```

Git is used for version control.

The project follows a modular architecture where every component can be upgraded independently.

---

# 20. Vision

EcoSpark aims to become a scalable smart city platform that enables municipalities to monitor underground drainage infrastructure in real time, reduce flooding risks, improve maintenance efficiency, and make data-driven operational decisions using IoT and Artificial Intelligence.

Our long-term vision is to transform urban sewage management from a reactive maintenance process into a predictive, intelligent, and sustainable public infrastructure system.