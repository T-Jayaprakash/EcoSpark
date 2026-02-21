"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { SensorReading } from "@/lib/api";
import { timeAgo } from "@/lib/helpers";

/* ═══════════════════════════════════════════════════════════════════════════
   Sensor coordinates
═══════════════════════════════════════════════════════════════════════════ */
const SENSOR_COORDS: Record<string, { lat: number; lng: number; road: string }> = {
    // MKCE Campus Lids — placed along campus roads
    MKCE_LID_01: { lat: 11.0558, lng: 78.0472, road: "Main Gate Road" },
    MKCE_LID_02: { lat: 11.0550, lng: 78.0488, road: "Academic Block Road" },
    MKCE_LID_03: { lat: 11.0542, lng: 78.0495, road: "Central Avenue" },
    MKCE_LID_04: { lat: 11.0535, lng: 78.0478, road: "Library Road" },
    MKCE_LID_05: { lat: 11.0528, lng: 78.0502, road: "Workshop Road" },
    MKCE_LID_06: { lat: 11.0548, lng: 78.0510, road: "Hostel Block Road" },
    MKCE_LID_07: { lat: 11.0538, lng: 78.0520, road: "Hostel Ring Road" },
    MKCE_LID_08: { lat: 11.0525, lng: 78.0465, road: "Playground Perimeter Rd" },
    MKCE_LID_09: { lat: 11.0560, lng: 78.0505, road: "Canteen Road" },
    MKCE_LID_10: { lat: 11.0520, lng: 78.0490, road: "Back Gate Road" },
};

const STATUS_HEX: Record<string, string> = {
    NORMAL: "#16a34a",
    WARNING: "#ca8a04",
    CRITICAL: "#dc2626",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Corporation Zone polygons
═══════════════════════════════════════════════════════════════════════════ */
const ZONES: { name: string; color: string; coords: [number, number][] }[] = [
    {
        name: "Academic Zone",
        color: "#4f46e5",
        coords: [[11.0545, 78.0465], [11.0545, 78.0500], [11.0565, 78.0500], [11.0565, 78.0465]],
    },
    {
        name: "Hostel Zone",
        color: "#d97706",
        coords: [[11.0530, 78.0500], [11.0530, 78.0530], [11.0555, 78.0530], [11.0555, 78.0500]],
    },
    {
        name: "Sports & Amenities",
        color: "#0891b2",
        coords: [[11.0515, 78.0455], [11.0515, 78.0500], [11.0535, 78.0500], [11.0535, 78.0455]],
    },
];

/* ─── Injected styles — LIGHT THEME ───────────────────────────────────── */
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
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 14px !important; padding: 0 !important;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
      color: #1e293b !important;
    }
    .leaflet-popup-content { margin: 0 !important; }
    .leaflet-popup-tip { background: #ffffff !important; border: 1px solid #e2e8f0 !important; }
    .leaflet-popup-close-button { color: #64748b !important; font-size: 20px !important; }
    .leaflet-control-zoom a {
      background: #ffffff !important; color: #475569 !important;
      border-color: #e2e8f0 !important;
    }
    .leaflet-control-zoom a:hover { background: #f8fafc !important; color: #1e293b !important; }
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.85) !important; color: #94a3b8 !important; font-size: 10px !important;
    }
    .leaflet-control-attribution a { color: #64748b !important; }
    .lid-tooltip {
      background: #1e293b !important; backdrop-filter: blur(8px);
      border: 1px solid #334155 !important; border-radius: 6px !important;
      padding: 2px 8px !important; font-size: 9px !important; font-weight: 700 !important;
      letter-spacing: 0.5px !important; color: #f1f5f9 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
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
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      padding: 2px 8px; border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 1px solid rgba(0,0,0,0.08);
    }
    .leaflet-container { background: #f1f5f9 !important; }
    .add-lid-crosshair { cursor: crosshair !important; }
    .add-lid-popup input, .add-lid-popup select {
      background: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0;
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
      background: #f8fafc;
      animation: fadeIn 0.25s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .report-section { margin-bottom: 10px; }
    .report-section-title {
      font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
      text-transform: uppercase; color: #64748b; margin-bottom: 4px;
      padding-bottom: 3px; border-bottom: 1px solid #f1f5f9;
    }
    .report-section-body { font-size: 11px; color: #334155; line-height: 1.5; }
    .report-action-item {
      font-size: 11px; color: #334155; padding: 2px 0;
      padding-left: 12px; position: relative;
    }
    .report-action-item::before {
      content: ''; position: absolute; left: 0; top: 9px;
      width: 4px; height: 4px; border-radius: 50%; background: #94a3b8;
    }
  `;
    document.head.appendChild(style);
}

/* ─── Status label without emojis ──────────────────────────────────────── */
function statusLabel(s: string): string {
    if (s === "CRITICAL") return "CRITICAL";
    if (s === "WARNING") return "WARNING";
    return "NORMAL";
}

/* ─── Popup HTML — shows report when available ─────────────────────────── */
function popupHTML(d: SensorReading, road: string, report?: string): string {
    const pct = d.water_level.value.toFixed(1);
    const loc = d.location ?? {};
    const meta = d.sensor_meta ?? {};
    const color = STATUS_HEX[d.status] || "#16a34a";

    // Parse the report into sections
    let reportHTML = "";
    if (report) {
        reportHTML = parseReportToHTML(report);
    }

    return `
    <div style="padding:16px 18px;min-width:280px;max-width:380px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="font-weight:800;font-size:15px;color:#0f172a;">${d.lid_id}</span>
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:8px;
          background:${color}14;color:${color};border:1px solid ${color}30;">
          ${statusLabel(d.status)}
        </span>
      </div>
      <p style="font-size:11px;color:#64748b;margin:0 0 2px;">Location: ${loc.area || "—"}, ${loc.city || "—"}</p>
      <p style="font-size:10px;color:#94a3b8;margin:0 0 12px;">Road: ${road}</p>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-size:11px;color:#64748b;">Water Level</span>
        <span style="font-size:24px;font-weight:800;color:${color};font-variant-numeric:tabular-nums;">${pct}%</span>
      </div>
      <div style="height:6px;border-radius:3px;background:#f1f5f9;overflow:hidden;margin-bottom:12px;">
        <div style="height:100%;width:${Math.min(parseFloat(pct), 100)}%;border-radius:3px;
          background:linear-gradient(90deg,${color}bb,${color});transition:width 0.8s ease-out;"></div>
      </div>
      <div style="display:flex;gap:14px;font-size:11px;color:#64748b;padding-top:8px;border-top:1px solid #f1f5f9;">
        <span>Battery: ${meta.battery_level ?? "—"}%</span>
        <span>Signal: ${meta.signal_strength ?? "—"}</span>
        <span>Type: ${meta.sensor_type ?? "—"}</span>
      </div>
      <p style="font-size:10px;color:#94a3b8;margin:6px 0 0;">Updated ${timeAgo(d.timestamp)}</p>
      ${reportHTML ? `
      <div style="margin-top:12px;padding-top:12px;border-top:2px solid #f1f5f9;">
        <div style="font-size:10px;font-weight:800;letter-spacing:0.5px;color:#3b82f6;text-transform:uppercase;margin-bottom:10px;">
          Analysis Report
        </div>
        ${reportHTML}
      </div>` : `
      <div style="margin-top:12px;padding-top:10px;border-top:2px solid #f1f5f9;text-align:center;">
        <button onclick="window.__ecospark_fetchReport('${d.lid_id}')"
          style="background:#3b82f6;color:white;border:none;border-radius:8px;padding:8px 20px;
          font-size:12px;font-weight:700;cursor:pointer;transition:opacity 0.2s;">
          View Analysis Report
        </button>
      </div>`}
    </div>
  `;
}

/* ─── Parse report text into styled HTML sections ──────────────────────── */
function parseReportToHTML(report: string): string {
    const lines = report.split("\n");
    let html = "";
    let currentSection = "";
    let sectionBody: string[] = [];

    function flushSection() {
        if (currentSection && sectionBody.length > 0) {
            const isActionsList = currentSection.toLowerCase().includes("action");
            const bodyContent = sectionBody
                .filter(l => l.trim())
                .map(l => {
                    const trimmed = l.replace(/^\s*-\s*/, "").trim();
                    if (isActionsList && trimmed) {
                        return `<div class="report-action-item">${trimmed}</div>`;
                    }
                    return `<div class="report-section-body">${trimmed}</div>`;
                })
                .join("");
            html += `<div class="report-section">
                <div class="report-section-title">${currentSection}</div>
                ${bodyContent}
            </div>`;
        }
        sectionBody = [];
    }

    for (const line of lines) {
        // Skip the title line
        if (line.startsWith("Title:")) continue;

        // Detect section headers
        const sectionMatch = line.match(/^(Current Status|Risk Assessment|Recommended Actions|Priority Level):/i);
        if (sectionMatch) {
            flushSection();
            currentSection = sectionMatch[1];
            continue;
        }

        // Numbered section headers
        const numMatch = line.match(/^\d+\.\s+(.+)/);
        if (numMatch && !line.startsWith("   ")) {
            flushSection();
            currentSection = numMatch[1];
            continue;
        }

        sectionBody.push(line);
    }
    flushSection();

    return html;
}

function addLidPopupHTML(lat: number, lng: number): string {
    return `
    <div class="add-lid-popup" style="padding:16px;min-width:240px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="font-weight:800;font-size:14px;margin-bottom:12px;color:#0f172a;">
        Add New Sensor Lid
      </div>
      <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">Lid ID</label>
      <input id="new-lid-id" placeholder="e.g. LID_016" />
      <label style="font-size:11px;color:#64748b;display:block;margin-bottom:2px;">Area / Road Name</label>
      <input id="new-lid-area" placeholder="e.g. Thillai Nagar Main Rd" />
      <div style="display:flex;gap:8px;font-size:11px;color:#94a3b8;margin-bottom:10px;padding:4px 0;">
        <span>Lat: ${lat.toFixed(4)}</span>
        <span>Lng: ${lng.toFixed(4)}</span>
      </div>
      <button onclick="window.__ecospark_addLid('${lat}','${lng}')">
        Place Sensor Here
      </button>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   MapView — Leaflet | fullscreen toggle, add-lid, report popup
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
    const reportsRef = useRef<Record<string, string>>({});

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
                center: [11.0542, 78.0485],
                zoom: 17,
                zoomControl: true,
                attributionControl: true,
            });

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
                    color: zone.color, weight: 2, opacity: 0.6,
                    fillColor: zone.color, fillOpacity: 0.08, dashArray: "8,5",
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

    /* ── Global callback for fetching analysis report ────────────────────── */
    useEffect(() => {
        (window as any).__ecospark_fetchReport = async (lidId: string) => {
            const L = leafletRef.current;
            const map = mapRef.current;
            if (!L || !map) return;

            // Get the lid data
            const d = lids[lidId];
            const coords = SENSOR_COORDS[lidId];
            if (!d || !coords) return;

            // Send to intelligence layer for analysis
            const btn = document.querySelector(`button[onclick*="${lidId}"]`) as HTMLButtonElement;
            if (btn) {
                btn.textContent = "Analyzing...";
                btn.style.opacity = "0.6";
                btn.disabled = true;
            }

            try {
                const res = await fetch("http://localhost:3003/api/raw-sensor-data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lid_id: lidId,
                        distance_cm: (100 - d.water_level.value),
                        manhole_depth_cm: 100,
                        temperature_c: 30,
                        signal_quality: d.sensor_meta?.signal_strength || "GOOD",
                        timestamp: d.timestamp,
                    }),
                });
                const result = await res.json();
                const report = result.data?.report || "Report not available.";
                reportsRef.current[lidId] = report;

                // Re-open the popup with the report
                const marker = markersRef.current[lidId]?.marker;
                if (marker) {
                    const pp = L.popup({ offset: [0, -8], closeButton: true, maxWidth: 400, minWidth: 300 })
                        .setContent(popupHTML(d, coords.road, report));
                    marker.bindPopup(pp);
                    marker.openPopup();
                }
            } catch {
                if (btn) {
                    btn.textContent = "Error — retry";
                    btn.style.opacity = "1";
                    btn.disabled = false;
                }
            }
        };
        return () => { delete (window as any).__ecospark_fetchReport; };
    }, [lids]);

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
                `<div style="padding:12px;font-family:system-ui;color:#1e293b;">
          <b>${ml.lid_id}</b><br/>
          <span style="font-size:11px;color:#64748b;">Location: ${ml.area}</span><br/>
          <span style="font-size:10px;color:#94a3b8;">Awaiting first reading</span>
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
            const cachedReport = reportsRef.current[d.lid_id];

            if (existing) {
                existing.marker.setStyle({ fillColor: color, color: "#ffffff" });
                if (existing.pulse) {
                    existing.pulse.setStyle({
                        fillColor: color, color: color,
                        className: d.status === "CRITICAL" ? "lid-marker-pulse" : "",
                    });
                }
                const pp = L.popup({ offset: [0, -8], closeButton: true, maxWidth: 400, minWidth: 280 })
                    .setContent(popupHTML(d, coords.road, cachedReport));
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

                const popup = L.popup({ offset: [0, -8], closeButton: true, maxWidth: 400, minWidth: 280 })
                    .setContent(popupHTML(d, coords.road, cachedReport));
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
       Render
    ═══════════════════════════════════════════════════════════════════════ */
    return (
        <div
            ref={wrapperRef}
            className={`relative w-full h-full ${isFullscreen ? "map-fullscreen-overlay" : "rounded-xl border border-border/50 overflow-hidden"}`}
        >
            {isFullscreen && (
                <div className="absolute inset-0 z-[-1] bg-card/10 flex items-center justify-center text-muted-foreground/30 text-xs text-center px-6">
                    Dashboard Map Placeholder<br />(Map is in fullscreen mode)
                </div>
            )}

            <div ref={containerRef} className="w-full h-full" />

            {/* Top-right controls */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
                {isFullscreen && (
                    <button
                        onClick={() => setAddMode(!addMode)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all duration-200 border ${addMode
                            ? "bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/50"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                    >
                        {addMode ? "Cancel" : "Add Lid"}
                    </button>
                )}

                <button
                    onClick={() => { setIsFullscreen(!isFullscreen); setAddMode(false); }}
                    className="px-3 py-2 rounded-lg text-xs font-bold shadow-lg transition-all duration-200 border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    title={isFullscreen ? "Exit fullscreen (ESC)" : "View fullscreen"}
                >
                    {isFullscreen ? "Exit" : "Fullscreen"}
                </button>
            </div>

            {/* Add mode instruction */}
            {addMode && isFullscreen && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600/90 backdrop-blur-md rounded-lg px-4 py-2 text-xs text-white font-semibold shadow-lg">
                    Click anywhere on a road to place a new sensor lid
                </div>
            )}

            {/* Zone legend */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg px-3 py-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campus Zones</p>
                {ZONES.map((z) => (
                    <div key={z.name} className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span
                            className="w-3 h-2 rounded-sm border"
                            style={{ backgroundColor: z.color + "20", borderColor: z.color + "60" }}
                        />
                        {z.name.replace("Zone ", "Z")}
                    </div>
                ))}
            </div>

            {/* Status legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg px-4 py-2.5 flex items-center gap-5 text-[11px] text-slate-600 shadow-lg">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-green-600 border-2 border-white" />
                    Normal
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-yellow-600 border-2 border-white" />
                    Warning
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-600 border-2 border-white animate-pulse" />
                    Critical
                </div>
            </div>

            {/* Fullscreen hint */}
            {isFullscreen && (
                <div className="absolute bottom-3 right-3 z-[1000] text-[10px] text-slate-400">
                    Press ESC to exit fullscreen
                </div>
            )}
        </div>
    );
}
