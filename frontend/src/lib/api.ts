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

/* ── Weather ─────────────────────────────────────────────────────────────── */

export interface CurrentWeather {
    temperature_2m: number;
    relative_humidity_2m: number;
    rain: number;
    wind_speed_10m: number;
    weather_code: number;
    weather_description: string;
    weather_icon: string;
    time: string;
}

export interface DailyForecast {
    dates: string[];
    temperature_max: number[];
    temperature_min: number[];
    rain_sum: number[];
    weather_code: number[];
    weather_descriptions: string[];
    weather_icons: string[];
}

export interface WeatherData {
    current: CurrentWeather;
    daily: DailyForecast;
    location: { name: string; lat: number; lng: number };
}

export async function fetchWeather(): Promise<WeatherData | null> {
    try {
        const res = await fetch(`${BASE}/api/weather/full`);
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}
