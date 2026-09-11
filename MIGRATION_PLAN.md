# 🚀 EcoSpark — Architecture & Stack Migration Plan

> **Target Stack:** React 19 + Vite 7 + Express 5 (TypeScript) + PostgreSQL  
> **Source Stack:** Next.js 16 (Turbopack) + Node.js (CommonJS) + MongoDB (Mongoose)  
> **Author:** EcoSpark Core Team  
> **Date:** September 2026  

---

## 📋 Executive Summary

This document details the complete end-to-end technical migration plan for **EcoSpark** from its current Next.js + MongoDB architecture to a decoupled, high-performance, and type-safe stack:
- **Client:** React 19, Vite 7, TypeScript, Tailwind CSS, React Router DOM v6, Leaflet, Axios, Socket.IO Client.
- **Server:** Node.js, Express 5, TypeScript, PostgreSQL (`pg` pool), JWT/Cookies, Helmet, Socket.IO, PDFKit, SheetJS (XLSX).
- **Database:** PostgreSQL (Google Cloud SQL / Supabase / Local PostgreSQL) with raw SQL migrations.
- **AI & Integrations:** Ollama microservice (`llama3.2`), CallMeBot WhatsApp Gateway, Open-Meteo Weather API.

---

## 1. 🏗️ Target Architecture & Final Stack Comparison

| Component | Current Stack | Target Stack (Post-Migration) | Rational & Benefit |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.1 (App Router) | **React 19.2.0 + Vite 7.2.4** | Eliminates SSR overhead; pure client-side SPA with instant HMR and zero font-fetching bugs. |
| **Frontend Routing** | Next.js File-system Router | **React Router DOM 6.22.0** | Explicit client-side route control (`/`, `/analytics`, `/reports`, `/login`). |
| **Frontend Language** | TypeScript 5 | **TypeScript ~5.9.3** | Strict type interfaces for IoT telemetry payloads. |
| **Styling** | Tailwind CSS v4 (`@theme`) | **Tailwind CSS 3.4.1** | Standard `tailwind.config.js` configuration with Autoprefixer and PostCSS. |
| **GIS Mapping** | Leaflet 1.9.4 | **Leaflet 1.9.4** | Campus interactive map with real-time colored lid markers. |
| **Backend Runtime** | Node.js (CommonJS) | **Node.js (TypeScript 5.9.3 + ts-node / nodemon)** | Full type safety across Express controllers, services, and middlewares. |
| **Backend Framework** | Express 4.18.2 | **Express 5.2.1** | Modern async error handling and enhanced route resolution. |
| **Database Engine** | MongoDB (Mongoose 8.2) | **PostgreSQL 15+/16** | Relational integrity and optimized time-series indexing for sensor history. |
| **Database Driver** | Mongoose ODM / in-memory | **`pg` (node-postgres 8.23.0)** | Connection pooling (`pg.Pool`), raw parameterized SQL, sub-millisecond queries. |
| **Real-Time Engine** | Socket.IO 4.7.4 | **Socket.IO 4.7.4+** | Retained for low-latency push notifications of warning/critical sensor thresholds. |
| **Authentication** | None (public access) | **JWT + Bcryptjs + Cookie-Parser + Helmet** | Secure HTTP-only cookies and role-based access for Campus Zone Supervisors. |
| **Document Export** | Client-side DOM printing | **PDFKit + xlsx (SheetJS) + Multer** | Server-side generation of formal campus sewage inspection audits and Excel telemetry dumps. |
| **AI / Intelligence** | Ollama (llama3.2) | **Ollama (llama3.2)** (Retained) | Predictive sewage flood forecasting and weather correlation microservice. |

---

## 2. 🗂️ Target Project File Structure

```
EcoSpark/
├── client/                               # Frontend SPA (Vite + React 19)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.development
│   └── src/
│       ├── main.tsx                      # App entry point
│       ├── App.tsx                       # React Router configuration
│       ├── api/                          # Axios API client
│       │   ├── axiosClient.ts
│       │   ├── sensorApi.ts
│       │   ├── lidApi.ts
│       │   └── authApi.ts
│       ├── context/                      # Global context providers
│       │   ├── SocketContext.tsx         # WebSocket listener & state
│       │   └── AuthContext.tsx           # Supervisor login state
│       ├── components/                   # UI Modules
│       │   ├── Navbar.tsx
│       │   ├── MapView.tsx               # Leaflet 10-lid campus map
│       │   ├── StatCards.tsx             # Total lids, warnings, overflows
│       │   ├── LidGrid.tsx               # Status cards for all 10 lids
│       │   ├── AlertBanner.tsx           # Pulsing red critical banner
│       │   ├── WeatherWidget.tsx         # Open-Meteo live rain/temp
│       │   └── ReportDownloadModal.tsx   # PDF & Excel export modal
│       ├── pages/                        # Route Pages
│       │   ├── DashboardPage.tsx         # Main real-time command center
│       │   ├── LidDetailPage.tsx         # Per-lid history & charts
│       │   ├── ReportsPage.tsx           # Historical audits & exports
│       │   └── LoginPage.tsx             # Supervisor login page
│       └── types/
│           └── sensor.ts                 # Telemetry & Alert types
│
├── server/                               # Backend API (Express 5 + TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── .env
│   └── src/
│       ├── index.ts                      # Server bootstrap & Socket.IO init
│       ├── config/
│       │   └── db.ts                     # pg.Pool connection singleton
│       ├── controllers/
│       │   ├── sensorController.ts       # Ingest POST /api/sensor-data
│       │   ├── lidController.ts          # GET /api/lids & lid history
│       │   ├── alertController.ts        # GET /api/alerts & resolve
│       │   ├── authController.ts         # Login / Logout / Session
│       │   └── reportController.ts       # PDF & Excel export routes
│       ├── middlewares/
│       │   ├── authMiddleware.ts         # JWT cookie validation
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── sensorRoutes.ts
│       │   ├── lidRoutes.ts
│       │   ├── alertRoutes.ts
│       │   ├── authRoutes.ts
│       │   └── reportRoutes.ts
│       ├── services/
│       │   ├── socketService.ts          # Singleton for io.emit()
│       │   ├── alertService.ts           # Threshold logic & WhatsApp dispatch
│       │   └── pdfService.ts             # PDFKit report generation
│       └── types/
│           └── index.ts
│
├── database/                             # Relational Schema Management
│   ├── schema.sql                        # DDL table creation & indexes
│   ├── seed.sql                          # 10 MKCE campus lids & supervisors
│   └── docker-compose.yml                # 1-command local PostgreSQL container
│
├── sensor-intelligence/                  # Unchanged (Ollama AI microservice)
└── simulator/                            # Sensor test scripts (Node / Python)
```

---

## 3. 🗄️ Database Design (PostgreSQL Schema)

Create this in `database/schema.sql`:

```sql
-- 1. Supervisors & Technicians
CREATE TABLE IF NOT EXISTS supervisors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'SUPERVISOR', -- 'ADMIN', 'SUPERVISOR'
    assigned_zone VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Physical Manhole Lids (10 Seeded Campus Locations)
CREATE TABLE IF NOT EXISTS lids (
    lid_id VARCHAR(50) PRIMARY KEY,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(50) DEFAULT 'Karur',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    warning_threshold DOUBLE PRECISION DEFAULT 40.0,
    critical_threshold DOUBLE PRECISION DEFAULT 75.0,
    supervisor_id INT REFERENCES supervisors(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Telemetry Time-Series Data
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    lid_id VARCHAR(50) NOT NULL REFERENCES lids(lid_id) ON DELETE CASCADE,
    water_level DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'NORMAL', 'WARNING', 'CRITICAL'
    sensor_type VARCHAR(50) DEFAULT 'ultrasonic',
    battery_level INT,
    signal_strength VARCHAR(20),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- High-performance composite index for time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_lid_date 
ON sensor_readings(lid_id, recorded_at DESC);

-- 4. Alerts Lifecycle
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    lid_id VARCHAR(50) NOT NULL REFERENCES lids(lid_id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL, -- 'WARNING', 'CRITICAL'
    water_level DOUBLE PRECISION NOT NULL,
    whatsapp_dispatched BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by INT REFERENCES supervisors(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_unresolved 
ON alerts(is_resolved, severity);
```

### Seed Data (`database/seed.sql`)
```sql
-- Seed Supervisors
INSERT INTO supervisors (name, phone, email, password_hash, role, assigned_zone) VALUES
('Raj Kumar', '+917397139329', 'raj@mkce.ac.in', '$2a$10$X87...', 'SUPERVISOR', 'Main Gate'),
('Ananth S', '+918765432109', 'ananth@mkce.ac.in', '$2a$10$X87...', 'SUPERVISOR', 'Academic Block'),
('Admin Supervisor', '+917397139329', 'admin@ecospark.io', '$2a$10$X87...', 'ADMIN', 'MKCE Campus')
ON CONFLICT (email) DO NOTHING;

-- Seed 10 Campus Lids
INSERT INTO lids (lid_id, area, latitude, longitude) VALUES
('MKCE_LID_01', 'Main Gate Road', 11.0558, 78.0472),
('MKCE_LID_02', 'Academic Block Road', 11.0550, 78.0488),
('MKCE_LID_03', 'Central Avenue', 11.0542, 78.0495),
('MKCE_LID_04', 'Library Road', 11.0535, 78.0478),
('MKCE_LID_05', 'Workshop Road', 11.0528, 78.0502),
('MKCE_LID_06', 'Hostel Block Road', 11.0548, 78.0510),
('MKCE_LID_07', 'Hostel Ring Road', 11.0538, 78.0520),
('MKCE_LID_08', 'Playground Perimeter', 11.0525, 78.0465),
('MKCE_LID_09', 'Canteen Road', 11.0560, 78.0505),
('MKCE_LID_10', 'Back Gate Road', 11.0520, 78.0490)
ON CONFLICT (lid_id) DO NOTHING;
```

---

## 4. 📦 Dependencies Configuration

### `server/package.json`
```json
{
  "name": "ecospark-server",
  "version": "3.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --watch src --exec ts-node src/index.ts",
    "test": "vitest"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^5.2.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.15.0",
    "pg": "^8.11.3",
    "socket.io": "^4.7.4",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.7",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.24",
    "@types/pdfkit": "^0.13.4",
    "@types/pg": "^8.11.2",
    "nodemon": "^3.1.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.9.3",
    "vitest": "^4.1.10"
  }
}
```

### `client/package.json`
```json
{
  "name": "ecospark-client",
  "version": "3.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.13.4",
    "clsx": "^2.1.1",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.475.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^6.22.0",
    "socket.io-client": "^4.8.3",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

---

## 5. ⚙️ Environment Variables Specification

### Server (`server/.env`)
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# PostgreSQL Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecospark
# Or separate params:
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=ecospark
PG_USER=postgres
PG_PASSWORD=postgres

# Security & JWT
JWT_SECRET=super_secret_jwt_key_ecospark_2026
COOKIE_SECRET=super_secret_cookie_key

# Third-party Integrations
WHATSAPP_API_KEY=your_callmebot_api_key_here
INTELLIGENCE_URL=http://localhost:3003
```

### Client (`client/.env.development`)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
VITE_INTELLIGENCE_URL=http://localhost:3003
```

---

## 6. 🚀 Step-by-Step Execution Roadmap

### Phase 1: Database Setup
1. Create `database/schema.sql` and `database/seed.sql`.
2. Provision local PostgreSQL (or run `docker-compose.yml`) or connect to Supabase / Google Cloud SQL.
3. Execute `schema.sql` followed by `seed.sql`.

### Phase 2: Server Migration (`server/`)
1. Initialize TypeScript configuration (`tsconfig.json`, `nodemon.json`).
2. Build connection pool in `src/config/db.ts` using `pg.Pool`.
3. Migrate `sensorService.ts`, `alertService.ts`, and `socketService.ts` to TypeScript.
4. Replace Mongoose queries with parameterized SQL queries:
   - Recent lid statuses: `SELECT DISTINCT ON (lid_id) ... ORDER BY lid_id, recorded_at DESC`
   - History queries: `SELECT * FROM sensor_readings WHERE lid_id = $1 ORDER BY recorded_at DESC LIMIT $2`
5. Add JWT authentication middleware & controller (`authController.ts`).
6. Implement PDF/Excel generation routes (`reportController.ts`).
7. Bind Socket.IO server to the Express 5 HTTP instance.

### Phase 3: Client Migration (`client/`)
1. Initialize Vite 7 React 19 project with Tailwind CSS 3.4.1.
2. Set up React Router DOM v6 in `src/App.tsx`.
3. Migrate existing React components (`MapView`, `LidGrid`, `StatCards`, `AlertBanner`) from Next.js to Vite.
4. Setup `SocketContext.tsx` using `socket.io-client` for live WebSocket telemetry listening.
5. Create `ReportDownloadModal.tsx` for one-click PDF/Excel audit reports.

### Phase 4: Verification & Testing
1. Verify simulated sensor posts:
   ```bash
   curl -X POST http://localhost:3001/api/sensor-data \
     -H "Content-Type: application/json" \
     -d '{"lid_id":"MKCE_LID_01","water_level":{"value":85},"sensor_meta":{"battery_level":90,"signal_strength":"GOOD"}}'
   ```
2. Check real-time map pulse and Socket.IO broadcast.
3. Verify PostgreSQL insertion in `sensor_readings` and `alerts`.
4. Test report download endpoint: `GET /api/reports/lid/MKCE_LID_01/pdf`.
