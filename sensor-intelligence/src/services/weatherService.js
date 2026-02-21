/**
 * weatherService.js — Open-Meteo weather data for MKCE Campus, Karur
 * Free API, no key required. Results cached for 15 minutes.
 */

// MKCE Campus coordinates
const MKCE_LAT = 11.0542;
const MKCE_LNG = 78.0485;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let cachedWeather = null;
let cacheTimestamp = 0;

/**
 * Weather code → human-readable description
 */
function weatherCodeToDescription(code) {
    const map = {
        0: "Clear sky",
        1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Foggy", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        56: "Freezing drizzle (light)", 57: "Freezing drizzle (dense)",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        66: "Freezing rain (light)", 67: "Freezing rain (heavy)",
        71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall",
        77: "Snow grains",
        80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
        85: "Slight snow showers", 86: "Heavy snow showers",
        95: "Thunderstorm", 96: "Thunderstorm with hail (slight)", 99: "Thunderstorm with hail (heavy)",
    };
    return map[code] || "Unknown";
}

/**
 * Weather code → icon emoji
 */
function weatherCodeToIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 57) return "🌧️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "🌤️";
}

/**
 * Fetch weather from Open-Meteo API
 */
async function fetchWeatherFromAPI() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MKCE_LAT}&longitude=${MKCE_LNG}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,rain_sum,weather_code&timezone=Asia/Kolkata&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Open-Meteo API returned ${response.status}`);
    }

    const data = await response.json();

    // Parse current weather
    const current = {
        temperature_2m: data.current?.temperature_2m,
        relative_humidity_2m: data.current?.relative_humidity_2m,
        rain: data.current?.rain,
        wind_speed_10m: data.current?.wind_speed_10m,
        weather_code: data.current?.weather_code,
        weather_description: weatherCodeToDescription(data.current?.weather_code),
        weather_icon: weatherCodeToIcon(data.current?.weather_code),
        time: data.current?.time,
    };

    // Parse daily forecast
    const daily = {
        dates: data.daily?.time || [],
        temperature_max: data.daily?.temperature_2m_max || [],
        temperature_min: data.daily?.temperature_2m_min || [],
        rain_sum: data.daily?.rain_sum || [],
        weather_code: data.daily?.weather_code || [],
        weather_descriptions: (data.daily?.weather_code || []).map(weatherCodeToDescription),
        weather_icons: (data.daily?.weather_code || []).map(weatherCodeToIcon),
    };

    return { current, daily, location: { name: "MKCE Campus, Karur", lat: MKCE_LAT, lng: MKCE_LNG } };
}

/**
 * Get current + forecast weather (cached for 15 min)
 */
async function getWeather() {
    const now = Date.now();
    if (cachedWeather && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedWeather;
    }

    try {
        cachedWeather = await fetchWeatherFromAPI();
        cacheTimestamp = now;
        console.log(`[Weather] Fetched fresh weather data for MKCE Campus`);
        return cachedWeather;
    } catch (err) {
        console.warn(`[Weather] Failed to fetch: ${err.message}`);
        // Return stale cache if available
        if (cachedWeather) return cachedWeather;
        return null;
    }
}

/**
 * Get just current conditions
 */
async function getCurrentWeather() {
    const data = await getWeather();
    return data ? data.current : null;
}

/**
 * Get 7-day daily forecast
 */
async function getDailyForecast() {
    const data = await getWeather();
    return data ? data.daily : null;
}

module.exports = { getWeather, getCurrentWeather, getDailyForecast };
