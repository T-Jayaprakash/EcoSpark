const llmService = require("../services/llmService");
const weatherService = require("../services/weatherService");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

exports.processSensorData = async (req, res) => {
    try {
        const rawData = req.body;

        // Basic validation of incoming data
        if (!rawData.lid_id || !rawData.distance_cm || !rawData.manhole_depth_cm) {
            return res.status(400).json({ error: "Missing required sensor data fields" });
        }

        console.log(`Received raw sensor data for ${rawData.lid_id}`);

        // Fetch weather data to enrich the LLM analysis
        let weatherData = null;
        try {
            weatherData = await weatherService.getWeather();
        } catch (err) {
            console.warn(`Could not fetch weather for LLM context: ${err.message}`);
        }

        // Call LLM (Ollama / local fallback) to interpret the data
        const interpretedData = await llmService.analyzeSensorData(rawData, weatherData);

        // Emit live Socket.IO event to all connected frontend clients
        const io = req.app.get("io");
        if (io) {
            io.emit("lid:update", interpretedData);
            console.log(`Emitted lid:update for ${interpretedData.lid_id} with status ${interpretedData.status}`);
        }

        // Forward to the main backend for persistence in MongoDB
        try {
            const response = await fetch(`${BACKEND_URL}/api/raw-sensor-data`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rawData),
            });
            if (response.ok) {
                console.log(`Forwarded data to backend for ${rawData.lid_id}`);
            } else {
                console.warn(`Backend returned ${response.status} for ${rawData.lid_id}`);
            }
        } catch (forwardErr) {
            console.warn(`Could not forward to backend: ${forwardErr.message}`);
        }

        res.status(200).json({ message: "Data processed and streamed successfully", data: interpretedData });
    } catch (error) {
        console.error("Error processing sensor data:", error.message);
        res.status(500).json({ error: "Failed to process sensor data" });
    }
};
