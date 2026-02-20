// lib/api.ts — REST fetch helpers

const BASE = "";  // proxied via next.config.ts rewrites

export interface Location {
    area?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
}

export interface WaterLevel {
    value: number;
    unit: string;
}

export interface SensorMeta {
    sensor_type?: string;
    battery_level?: number;
    signal_strength?: string;
}

export interface SensorReading {
    _id: string;
    lid_id: string;
    location: Location;
    water_level: WaterLevel;
    status: "NORMAL" | "WARNING" | "CRITICAL";
    sensor_meta: SensorMeta;
    timestamp: string;
    createdAt: string;
}

export interface Alert {
    _id: string;
    lid_id: string;
    area?: string;
    city?: string;
    status: "WARNING" | "CRITICAL";
    water_level_value: number;
    timestamp: string;
    resolved: boolean;
    createdAt: string;
}

export async function fetchLids(): Promise<SensorReading[]> {
    const res = await fetch(`${BASE}/api/lids`);
    const json = await res.json();
    return json.data ?? [];
}

export async function fetchAlerts(): Promise<Alert[]> {
    const res = await fetch(`${BASE}/api/alerts`);
    const json = await res.json();
    return json.data ?? [];
}

export async function fetchLidHistory(
    lidId: string,
    limit = 20
): Promise<SensorReading[]> {
    const res = await fetch(`${BASE}/api/lids/${lidId}/history?limit=${limit}`);
    const json = await res.json();
    return json.data ?? [];
}
