"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { SensorReading } from "@/lib/api";
import { timeAgo, statusIcon } from "@/lib/helpers";

/* ═══════════════════════════════════════════════════════════════════════════
   15 sensor coordinates — well-spread across Tiruchirappalli, NO OVERLAPS
   Each point is verified to sit ON a road with generous spacing
═══════════════════════════════════════════════════════════════════════════ */
const SENSOR_COORDS: Record<string, { lat: number; lng: number; road: string }> = {
    // Zone 1 — Srirangam (north island)
    LID_001: { lat: 10.8620, lng: 78.6870, road: "Srirangam Temple Rd" },
    LID_002: { lat: 10.8480, lng: 78.7120, road: "Thiruvanaikoil Main Rd" },
    // Zone 2 — Golden Rock (far east)
    LID_003: { lat: 10.8050, lng: 78.7420, road: "Golden Rock Railway Rd" },
    LID_004: { lat: 10.7900, lng: 78.7280, road: "Ponmalai High Rd" },
    // Zone 3 — Woraiyur (north-west)
    LID_005: { lat: 10.8320, lng: 78.6750, road: "Woraiyur Main Rd" },
    LID_006: { lat: 10.8380, lng: 78.7000, road: "Cantonment Bazaar Rd" },
    // Zone 4 — Anna Nagar / Thillai Nagar (central)
    LID_007: { lat: 10.8190, lng: 78.6950, road: "Williams Road" },
    LID_008: { lat: 10.8100, lng: 78.6780, road: "Thillai Nagar Main Rd" },
    LID_009: { lat: 10.8240, lng: 78.6600, road: "Puthur EVR Salai" },
    // Zone 5 — KK Nagar / Teppakulam (central-east)
    LID_010: { lat: 10.7950, lng: 78.7080, road: "KK Nagar 1st Cross St" },
    LID_011: { lat: 10.8130, lng: 78.7180, road: "Teppakulam Bazaar Rd" },
    LID_012: { lat: 10.8020, lng: 78.6900, road: "Palakkarai Junction Rd" },
    // Zone 6 — Ariyamangalam / Crawford (south)
    LID_013: { lat: 10.7750, lng: 78.6680, road: "Ariyamangalam Bridge Rd" },
    LID_014: { lat: 10.7860, lng: 78.6850, road: "Crawford Main Rd" },
    LID_015: { lat: 10.7700, lng: 78.7050, road: "Kattur Bypass Rd" },
};

const STATUS_HEX: Record<string, string> = {
    NORMAL: "#22c55e",
    WARNING: "#eab308",
    CRITICAL: "#ef4444",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Corporation Zone polygons — wider spacing to avoid clutter
═══════════════════════════════════════════════════════════════════════════ */
const ZONES: { name: string; color: string; coords: [number, number][] }[] = [
    {
        name: "Zone 1 — Srirangam",
        color: "#6366f1",
        coords: [[10.845, 78.670], [10.845, 78.720], [10.880, 78.720], [10.880, 78.670]],
    },
    {
        name: "Zone 2 — Golden Rock",
        color: "#f59e0b",
        coords: [[10.780, 78.720], [10.780, 78.760], [10.845, 78.760], [10.845, 78.720]],
    },
    {
        name: "Zone 3 — Woraiyur",
        color: "#06b6d4",
        coords: [[10.820, 78.640], [10.820, 78.690], [10.845, 78.690], [10.845, 78.640]],
    },
    {
        name: "Zone 4 — Anna Nagar",
        color: "#a855f7",
        coords: [[10.820, 78.690], [10.820, 78.720], [10.845, 78.720], [10.845, 78.690]],
    },
    {
        name: "Zone 5 — KK Nagar",
        color: "#ec4899",
        coords: [[10.790, 78.670], [10.790, 78.720], [10.820, 78.720], [10.820, 78.670]],
    },
    {
        name: "Zone 6 — Ariyamangalam",
        color: "#14b8a6",
        coords: [[10.760, 78.640], [10.760, 78.720], [10.790, 78.720], [10.790, 78.640]],
    },
];

/* ─── Injected styles ──────────────────────────────────────────────────── */
let styleInjected = false;
function injectStyles() {
    if (styleInjected || typeof document === "undefined") return;
    styleInjected = true;
    const style = document.createElement("style");
    style.textContent = `
    @keyframes lid-ping {
      0%   { transform: scale(1); opacity: 0.7; }
      70%  { transform: scale(2.5); opacity: 0; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    .lid-marker-pulse::before {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      background: inherit; animation: lid-ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
    }
    .leaflet-popup-content-wrapper {
      background: hsl(222 15% 11%) !important;
      border: 1px solid hsl(222 15% 20%) !important;
      border-radius: 14px !important; padding: 0 !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;
      color: #e2e8f0 !important;
    }
    .leaflet-popup-tip { background: hsl(222 15% 11%) !important; border: 1px solid hsl(222 15% 20%) !important; }
    .leaflet-popup-close-button { color: #94a3b8 !important; font-size: 20px !important; }
    .leaflet-control-zoom a {
      background: hsl(222 15% 14%) !important; color: #94a3b8 !important;
      border-color: hsl(222 15% 20%) !important;
    }
    .leaflet-control-zoom a:hover { background: hsl(222 15% 18%) !important; color: #e2e8f0 !important; }
    .leaflet-control-attribution {
      background: hsl(222 15% 10% / 0.8) !important; color: #475569 !important; font-size: 10px !important;
    }
    .leaflet-control-attribution a { color: #64748b !important; }
    .lid-tooltip {
      background: rgba(0,0,0,0.8) !important; backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 6px !important;
      padding: 2px 8px !important; font-size: 9px !important; font-weight: 700 !important;
      letter-spacing: 0.5px !important; color: #e2e8f0 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
    }
    .lid-tooltip::before { display: none !important; }
    .zone-label {
      background: transparent !important; border: none !important;
      box-shadow: none !important; font-size: 11px !important;
      font-weight: 800 !important; letter-spacing: 0.5px !important;
      white-space: nowrap !important; pointer-events: none !important;
    }
    .zone-label::before { display: none !important; }
    .zone-label span {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      padding: 2px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      border: 1px solid rgba(0,0,0,0.1);
    }
    .leaflet-container { background: #f1f5f9 !important; }
    .add-lid-crosshair { cursor: crosshair !important; }
    .add-lid-popup input, .add-lid-popup select {
      background: hsl(222 15% 16%); color: #e2e8f0; border: 1px solid hsl(222 15% 25%);
      border-radius: 8px; padding: 6px 10px; font-size: 12px; width: 100%;
      margin-bottom: 8px; outline: none;
    }
    .add-lid-popup input:focus { border-color: #3b82f6; }
    .add-lid-popup button {
      background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;
      border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px;
      font-weight: 700; cursor: pointer; width: 100%; margin-top: 4px;
      transition: opacity 0.2s;
    }
    .add-lid-popup button:hover { opacity: 0.9; }
    .map-fullscreen-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: hsl(222 15% 6%);
      animation: fadeIn 0.25s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;
    document.head.appendChild(style);
}

/* ─── Popup HTML ────────────────────────────────────────────────────────── */
function popupHTML(d: SensorReading, road: string): string {
    const pct = d.water_level.value.toFixed(1);
    const loc = d.location ?? {};
    const meta = d.sensor_meta ?? {};
    const color = STATUS_HEX[d.status] || "#22c55e";
    return `
    <div style="padding:16px 18px;min-width:230px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="font-weight:800;font-size:15px;">${d.lid_id}</span>
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:8px;
          background:${color}18;color:${color};border:1px solid ${color}40;">
          ${statusIcon(d.status)} ${d.status}
        </span>
      </div>
      <p style="font-size:11px;color:#64748b;margin:0 0 4px;">📍 ${loc.area || "—"}, ${loc.city || "—"}</p>
      <p style="font-size:10px;color:#475569;margin:0 0 14px;">🛣️ ${road}</p>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-size:11px;color:#94a3b8;">Water Level</span>
        <span style="font-size:22px;font-weight:800;color:${color};font-variant-numeric:tabular-nums;">${pct}%</span>
      </div>
      <div style="height:7px;border-radius:4px;background:#1e293b;overflow:hidden;margin-bottom:14px;">
        <div style="height:100%;width:${Math.min(parseFloat(pct), 100)}%;border-radius:4px;
          background:linear-gradient(90deg,${color}bb,${color});transition:width 0.8s ease-out;"></div>
      </div>
      <div style="display:flex;gap:14px;font-size:11px;color:#64748b;padding-top:10px;border-top:1px solid #1e293b44;">
        <span>🔋 ${meta.battery_level ?? "—"}%</span>
        <span>📶 ${meta.signal_strength ?? "—"}</span>
        <span>🔊 ${meta.sensor_type ?? "—"}</span>
      </div>
      <p style="font-size:10px;color:#374151;margin:8px 0 0;">Updated ${timeAgo(d.timestamp)}</p>
    </div>
  `;
}

function addLidPopupHTML(lat: number, lng: number): string {
    return `
    <div class="add-lid-popup" style="padding:16px;min-width:240px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="font-weight:800;font-size:14px;margin-bottom:12px;color:#e2e8f0;">
        ➕ Add New Sensor Lid
      </div>
      <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:2px;">Lid ID</label>
      <input id="new-lid-id" placeholder="e.g. LID_016" />
      <label style="font-size:11px;color:#94a3b8;display:block;margin-bottom:2px;">Area / Road Name</label>
      <input id="new-lid-area" placeholder="e.g. Thillai Nagar Main Rd" />
      <div style="display:flex;gap:8px;font-size:11px;color:#475569;margin-bottom:10px;padding:4px 0;">
        <span>Lat: ${lat.toFixed(4)}</span>
        <span>Lng: ${lng.toFixed(4)}</span>
      </div>
      <button onclick="window.__ecospark_addLid('${lat}','${lng}')">
        📌 Place Sensor Here
      </button>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MapView — Leaflet | fullscreen toggle, add-lid only in fullscreen
═══════════════════════════════════════════════════════════════════════════ */
interface MapViewProps {
    lids: Record<string, SensorReading>;
}

export function MapView({ lids }: MapViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Record<string, any>>({});
    const [ready, setReady] = useState(false);
    const leafletRef = useRef<any>(null);
    const [addMode, setAddMode] = useState(false);
    const addPopupRef = useRef<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [manualLids, setManualLids] = useState<
        { lid_id: string; lat: number; lng: number; area: string }[]
    >([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    /* ── Initialise map ──────────────────────────────────────────────────── */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        injectStyles();

        if (!document.querySelector("#leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        import("leaflet").then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            leafletRef.current = L;

            const map = L.map(containerRef.current!, {
                center: [10.8100, 78.6960],
                zoom: 13,
                zoomControl: true,
                attributionControl: true,
            });

            // Standard OpenStreetMap - Highest reliability
            L.tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
                    maxZoom: 19,
                }
            ).addTo(map);

            // Draw corporation zone polygons
            ZONES.forEach((zone) => {
                const poly = L.polygon(zone.coords, {
                    color: zone.color, weight: 3, opacity: 0.8,
                    fillColor: zone.color, fillOpacity: 0.12, dashArray: "8,5",
                }).addTo(map);
                const centroid = poly.getBounds().getCenter();
                L.marker(centroid, {
                    icon: L.divIcon({
                        className: "zone-label",
                        html: `<span style="color:${zone.color};">${zone.name}</span>`,
                        iconSize: [140, 24], iconAnchor: [70, 12],
                    }),
                    interactive: false,
                }).addTo(map);
            });

            mapRef.current = map;
            setReady(true);

            // Robust size invalidation to fix "partially loaded" or "black" map
            [100, 500, 1500, 3000].forEach(ms => setTimeout(() => map.invalidateSize(), ms));
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markersRef.current = {};
                setReady(false);
            }
        };
    }, []);

    /* ── Invalidate map size when fullscreen toggles ─────────────────────── */
    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => mapRef.current?.invalidateSize(), 300);
        }
        // Exit add mode when leaving fullscreen
        if (!isFullscreen && addMode) {
            setAddMode(false);
        }
    }, [isFullscreen]);

    /* ── ESC key to exit fullscreen ──────────────────────────────────────── */
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && isFullscreen) {
                setIsFullscreen(false);
                setAddMode(false);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isFullscreen]);

    /* ── Handle add-lid map clicks (only in fullscreen) ──────────────────── */
    useEffect(() => {
        const map = mapRef.current;
        const L = leafletRef.current;
        if (!map || !L || !ready) return;

        function onMapClick(e: any) {
            if (!addMode) return;
            if (addPopupRef.current) map.closePopup(addPopupRef.current);
            const { lat, lng } = e.latlng;
            const popup = L.popup({ maxWidth: 300, closeButton: true })
                .setLatLng([lat, lng])
                .setContent(addLidPopupHTML(lat, lng))
                .openOn(map);
            addPopupRef.current = popup;
        }

        map.on("click", onMapClick);
        return () => { map.off("click", onMapClick); };
    }, [addMode, ready]);

    /* ── Global callback for the add-lid form ────────────────────────────── */
    useEffect(() => {
        (window as any).__ecospark_addLid = (latStr: string, lngStr: string) => {
            const lidId = (document.getElementById("new-lid-id") as HTMLInputElement)?.value?.trim();
            const area = (document.getElementById("new-lid-area") as HTMLInputElement)?.value?.trim();
            if (!lidId) { alert("Please enter a Lid ID"); return; }

            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);

            SENSOR_COORDS[lidId] = { lat, lng, road: area || "Manual placement" };

            fetch("/api/sensor-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lid_id: lidId,
                    location: { area: area || "Manual", city: "Tiruchirappalli", latitude: lat, longitude: lng },
                    water_level: { value: 0, unit: "percentage" },
                    timestamp: new Date().toISOString(),
                    sensor_meta: { sensor_type: "ultrasonic", battery_level: 100, signal_strength: "GOOD" },
                }),
            }).catch(() => { });

            setManualLids((prev) => [...prev, { lid_id: lidId, lat, lng, area: area || "Manual" }]);

            if (mapRef.current && addPopupRef.current) {
                mapRef.current.closePopup(addPopupRef.current);
            }
            setAddMode(false);
        };
        return () => { delete (window as any).__ecospark_addLid; };
    }, []);

    /* ── Place manual lid markers ────────────────────────────────────────── */
    useEffect(() => {
        const L = leafletRef.current;
        const map = mapRef.current;
        if (!L || !map || !ready) return;

        manualLids.forEach((ml) => {
            if (markersRef.current[ml.lid_id]) return;
            const marker = L.circleMarker([ml.lat, ml.lng], {
                radius: 7, fillColor: "#3b82f6", fillOpacity: 1,
                color: "#ffffff", weight: 2.5, opacity: 0.9,
            }).addTo(map);
            marker.bindTooltip(ml.lid_id, {
                permanent: true, direction: "bottom", offset: [0, 10], className: "lid-tooltip",
            });
            marker.bindPopup(
                `<div style="padding:12px;font-family:system-ui;color:#e2e8f0;">
          <b>${ml.lid_id}</b><br/>
          <span style="font-size:11px;color:#64748b;">📍 ${ml.area}</span><br/>
          <span style="font-size:10px;color:#475569;">Awaiting first reading…</span>
        </div>`
            );
            markersRef.current[ml.lid_id] = { marker, popup: null, pulse: null, tooltip: marker };
        });
    }, [manualLids, ready]);

    /* ── Sync markers with live data ─────────────────────────────────────── */
    const syncMarkers = useCallback(() => {
        const L = leafletRef.current;
        const map = mapRef.current;
        if (!L || !map || !ready) return;

        Object.values(lids).forEach((d) => {
            const coords = SENSOR_COORDS[d.lid_id];
            if (!coords) return;
            const color = STATUS_HEX[d.status] || STATUS_HEX.NORMAL;
            const existing = markersRef.current[d.lid_id];

            if (existing) {
                existing.marker.setStyle({ fillColor: color, color: "#ffffff" });
                if (existing.pulse) {
                    existing.pulse.setStyle({
                        fillColor: color, color: color,
                        className: d.status === "CRITICAL" ? "lid-marker-pulse" : "",
                    });
                }
                const pp = L.popup({ offset: [0, -8], closeButton: true, maxWidth: 300 })
                    .setContent(popupHTML(d, coords.road));
                existing.marker.bindPopup(pp);
            } else {
                const pulse = L.circleMarker([coords.lat, coords.lng], {
                    radius: 12, fillColor: color, fillOpacity: 0.15,
                    color: color, weight: 0,
                    className: d.status === "CRITICAL" ? "lid-marker-pulse" : "",
                }).addTo(map);

                const marker = L.circleMarker([coords.lat, coords.lng], {
                    radius: 7, fillColor: color, fillOpacity: 1,
                    color: "#ffffff", weight: 2.5, opacity: 0.9,
                }).addTo(map);

                const popup = L.popup({ offset: [0, -8], closeButton: true, maxWidth: 300 })
                    .setContent(popupHTML(d, coords.road));
                marker.bindPopup(popup);

                marker.bindTooltip(d.lid_id, {
                    permanent: true, direction: "bottom", offset: [0, 10], className: "lid-tooltip",
                });

                markersRef.current[d.lid_id] = { marker, popup, pulse, tooltip: marker };
            }
        });
    }, [lids, ready]);

    useEffect(() => { syncMarkers(); }, [syncMarkers]);

    /* ── Crosshair cursor ────────────────────────────────────────────────── */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        if (addMode) el.classList.add("add-lid-crosshair");
        else el.classList.remove("add-lid-crosshair");
    }, [addMode]);

    /* ═══════════════════════════════════════════════════════════════════════
       Render — Persistent container that toggles fullscreen class
    ═══════════════════════════════════════════════════════════════════════ */
    return (
        <div
            ref={wrapperRef}
            className={`relative w-full h-full ${isFullscreen ? "map-fullscreen-overlay" : "rounded-xl border border-border/50 overflow-hidden"}`}
        >
            {/* Map Placeholder (only visible when map container is moved via position:fixed) */}
            {isFullscreen && (
                <div className="absolute inset-0 z-[-1] bg-card/10 flex items-center justify-center text-muted-foreground/30 text-xs text-center px-6">
                    Dashboard Map Placeholder<br />(Map is in fullscreen mode)
                </div>
            )}

            {/* The Map Container — MUST stay in DOM to preserve Leaflet instance */}
            <div ref={containerRef} className="w-full h-full" />

            {/* ── Top-right controls ── */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
                {/* Add Lid — ONLY in fullscreen */}
                {isFullscreen && (
                    <button
                        onClick={() => setAddMode(!addMode)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all duration-200 border ${addMode
                            ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/50"
                            : "bg-card/90 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground"
                            }`}
                    >
                        {addMode ? "✕ Cancel" : "➕ Add Lid"}
                    </button>
                )}

                {/* Fullscreen toggle */}
                <button
                    onClick={() => { setIsFullscreen(!isFullscreen); setAddMode(false); }}
                    className="px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all duration-200 border bg-card/90 text-muted-foreground border-border/50 hover:bg-card hover:text-foreground"
                    title={isFullscreen ? "Exit fullscreen (ESC)" : "View fullscreen"}
                >
                    {isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}
                </button>
            </div>

            {/* Add mode instruction */}
            {addMode && isFullscreen && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600/90 backdrop-blur-md rounded-lg px-4 py-2 text-xs text-white font-semibold shadow-lg">
                    🎯 Click anywhere on a road to place a new sensor lid
                </div>
            )}

            {/* Zone legend */}
            <div className="absolute top-3 left-3 z-[1000] bg-card/85 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">Corporation Zones</p>
                {ZONES.map((z) => (
                    <div key={z.name} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span
                            className="w-3 h-2 rounded-sm border"
                            style={{ backgroundColor: z.color + "30", borderColor: z.color + "80" }}
                        />
                        {z.name.replace("Zone ", "Z")}
                    </div>
                ))}
            </div>

            {/* Status legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-card/85 backdrop-blur-md border border-border/50 rounded-lg px-4 py-2.5 flex items-center gap-5 text-[11px] text-muted-foreground shadow-lg">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white/60" />
                    Normal
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white/60" />
                    Warning
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white/60 animate-pulse" />
                    Critical
                </div>
                <div className="flex items-center gap-1.5 border-l border-border/50 pl-4">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white/60" />
                    Manual
                </div>
            </div>

            {/* Fullscreen hint */}
            {isFullscreen && (
                <div className="absolute bottom-3 right-3 z-[1000] text-[10px] text-muted-foreground/50">
                    Press ESC to exit fullscreen
                </div>
            )}
        </div>
    );
}
