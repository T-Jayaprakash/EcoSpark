const weatherService = require("../services/weatherService");

/**
 * GET /api/weather/current — current conditions for MKCE campus
 */
exports.getCurrentWeather = async (_req, res) => {
    try {
        const data = await weatherService.getWeather();
        if (!data) {
            return res.status(503).json({ error: "Weather data temporarily unavailable" });
        }
        res.json({ data: data.current, location: data.location });
    } catch (err) {
        console.error("[Weather]", err.message);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
};

/**
 * GET /api/weather/forecast — 7-day daily forecast for MKCE campus
 */
exports.getDailyForecast = async (_req, res) => {
    try {
        const data = await weatherService.getWeather();
        if (!data) {
            return res.status(503).json({ error: "Weather data temporarily unavailable" });
        }
        res.json({ data: data.daily, location: data.location });
    } catch (err) {
        console.error("[Weather]", err.message);
        res.status(500).json({ error: "Failed to fetch forecast data" });
    }
};

/**
 * GET /api/weather/full — full weather data (current + forecast + location)
 */
exports.getFullWeather = async (_req, res) => {
    try {
        const data = await weatherService.getWeather();
        if (!data) {
            return res.status(503).json({ error: "Weather data temporarily unavailable" });
        }
        res.json({ data });
    } catch (err) {
        console.error("[Weather]", err.message);
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
};
