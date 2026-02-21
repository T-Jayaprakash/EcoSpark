const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensorController");
const weatherController = require("../controllers/weatherController");

// POST /api/raw-sensor-data
router.post("/raw-sensor-data", sensorController.processSensorData);

// Weather routes
router.get("/weather/current", weatherController.getCurrentWeather);
router.get("/weather/forecast", weatherController.getDailyForecast);
router.get("/weather/full", weatherController.getFullWeather);

module.exports = router;
