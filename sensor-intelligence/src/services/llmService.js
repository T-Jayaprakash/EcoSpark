const { Ollama } = require("ollama");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const ollama = new Ollama({ host: OLLAMA_URL });

/* ───────────────────────────────────────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────────────────────────────────────── */
function classifyStatus(pct) {
    if (pct > 70) return "CRITICAL";
    if (pct >= 40) return "WARNING";
    return "NORMAL";
}

function determineTrend(pct) {
    if (pct > 70) return "Rising - approaching overflow threshold";
    if (pct >= 40) return "Elevated - requires monitoring";
    if (pct >= 20) return "Stable - within acceptable range";
    return "Low and stable";
}

function determinePriority(status, anomaly) {
    if (status === "CRITICAL") return "HIGH";
    if (status === "WARNING" || anomaly) return "MEDIUM";
    return "LOW";
}

/* ───────────────────────────────────────────────────────────────────────────
   Local report generation (fallback)
   ─────────────────────────────────────────────────────────────────────────── */
function generateLocalReport(rawData, weatherData) {
    const depth = rawData.manhole_depth_cm || 100;
    const distance = rawData.distance_cm || 0;

    let waterLevelPct = ((depth - distance) / depth) * 100;
    waterLevelPct = Math.max(0, Math.min(100, Math.round(waterLevelPct)));
    const status = classifyStatus(waterLevelPct);

    const isLowSignal = rawData.signal_quality === "LOW";
    const tempExtreme = rawData.temperature_c > 45 || rawData.temperature_c < 5;
    const anomalyFlag = isLowSignal || tempExtreme;

    let confidence = "HIGH";
    if (isLowSignal || anomalyFlag) confidence = "MEDIUM";
    if (isLowSignal && tempExtreme) confidence = "LOW";

    const trend = determineTrend(waterLevelPct);
    const priority = determinePriority(status, anomalyFlag);

    // ── Build environmental impact ──
    const envParts = [];
    if (rawData.temperature_c !== undefined) {
        if (rawData.temperature_c > 40) envParts.push(`High temperature (${rawData.temperature_c} C) may indicate industrial discharge or prolonged stagnation`);
        else if (rawData.temperature_c < 10) envParts.push(`Low temperature (${rawData.temperature_c} C) may slow microbial decomposition in the line`);
        else envParts.push(`Temperature at ${rawData.temperature_c} C is within normal range`);
    }
    if (isLowSignal) envParts.push("Low signal quality may indicate sensor fouling or obstruction");
    if (waterLevelPct > 70) envParts.push("High water level increases risk of surface flooding and potential contamination of surrounding areas");
    if (envParts.length === 0) envParts.push("No adverse environmental factors detected at this time");
    const envImpact = envParts.join(". ");

    // ── Build weather impact ──
    let weatherImpact = "Weather data not available for this analysis.";
    if (weatherData && weatherData.current) {
        const w = weatherData.current;
        const parts = [];
        if (w.temperature_2m !== undefined) parts.push(`Current temperature: ${w.temperature_2m}°C`);
        if (w.rain !== undefined && w.rain > 0) parts.push(`Active rainfall: ${w.rain} mm — increased inflow expected`);
        if (w.relative_humidity_2m !== undefined) parts.push(`Humidity: ${w.relative_humidity_2m}%`);
        if (weatherData.daily && weatherData.daily.rain_sum) {
            const upcomingRain = weatherData.daily.rain_sum.slice(0, 3);
            const totalRain = upcomingRain.reduce((a, b) => a + b, 0);
            if (totalRain > 10) parts.push(`Heavy rain forecast (${totalRain.toFixed(1)} mm in next 3 days) — prepare for drainage surge`);
            else if (totalRain > 0) parts.push(`Light rainfall forecast (${totalRain.toFixed(1)} mm in next 3 days)`);
            else parts.push("No rainfall expected in next 3 days");
        }
        weatherImpact = parts.join(". ");
    }

    // ── Build risk assessment ──
    let riskText = "";
    if (status === "CRITICAL") {
        riskText = `Water level at ${rawData.lid_id} has reached ${waterLevelPct}% of manhole capacity. ` +
            `At this level, overflow is likely if inflow continues or if downstream drainage is restricted. ` +
            `Immediate inspection is required to prevent surface flooding and environmental contamination.`;
    } else if (status === "WARNING") {
        riskText = `Water level at ${rawData.lid_id} stands at ${waterLevelPct}%, which is above the routine operating range. ` +
            `Without intervention, sustained inflow from upstream or rainfall could push levels into the critical zone. ` +
            `Monitoring frequency should be increased and field teams placed on standby.`;
    } else {
        riskText = `Water level at ${rawData.lid_id} is at ${waterLevelPct}%, well within safe operating limits. ` +
            `No evidence of drainage stress or pending overflow at this point. ` +
            `Standard monitoring intervals are sufficient.`;
    }

    // ── Build recommended actions ──
    const actions = [];
    if (status === "CRITICAL") {
        actions.push("Dispatch field crew to inspect the manhole and verify sensor reading on site");
        actions.push("Check downstream path for blockages, debris, or collapsed sections");
        actions.push("Activate upstream flow diversion if available");
        actions.push("Prepare portable pumping equipment for deployment");
        actions.push("Notify campus maintenance supervisor immediately");
        actions.push("Monitor adjacent lid sensors for signs of wider drainage stress");
    } else if (status === "WARNING") {
        actions.push("Increase sensor polling frequency to every 2 minutes");
        actions.push("Review weather forecast for expected rainfall in the next 6-12 hours");
        actions.push("Alert nearest maintenance crew for possible rapid response");
        actions.push("Inspect downstream junctions for any partial blockages");
        actions.push("Cross-check with neighbouring lid readings to assess network load");
    } else {
        actions.push("Continue routine monitoring at standard intervals");
        actions.push("No immediate field action required");
        actions.push("Log reading for historical trend analysis");
    }
    if (anomalyFlag) {
        actions.push("Investigate sensor anomaly: schedule physical inspection of sensor hardware");
    }

    // ── Cleaning schedule ──
    let cleaningSchedule = "";
    if (waterLevelPct > 60) {
        cleaningSchedule = "Immediate cleaning recommended — schedule within 24 hours";
    } else if (waterLevelPct > 30) {
        cleaningSchedule = "Routine cleaning — schedule within the next 7 days";
    } else {
        cleaningSchedule = "No cleaning required — next scheduled clean in 30 days";
    }

    // ── Next action ──
    let nextAction = "";
    if (status === "CRITICAL") {
        nextAction = "Deploy emergency crew within 2 hours. Verify blockage and pump if needed.";
    } else if (status === "WARNING") {
        nextAction = "Schedule inspection within 12 hours. Monitor closely for further rise.";
    } else {
        nextAction = "No action required. Continue standard monitoring cycle.";
    }

    // ── Assemble the final report string ──
    const lines = [];
    lines.push(`Title: ${rawData.lid_id} - ${status === "CRITICAL" ? "Critical Level Alert" : status === "WARNING" ? "Elevated Level Warning" : "Normal Operations"}`);
    lines.push(``);
    lines.push(`Current Status:`);
    lines.push(`- Water level: ${waterLevelPct}% of manhole capacity (${depth - distance} cm of ${depth} cm depth utilized)`);
    lines.push(`- Trend: ${trend}`);
    lines.push(`- Environmental impact: ${envImpact}`);
    lines.push(``);
    lines.push(`Weather Impact:`);
    lines.push(`- ${weatherImpact}`);
    lines.push(``);
    lines.push(`Risk Assessment:`);
    lines.push(`- ${riskText}`);
    lines.push(``);
    lines.push(`Recommended Actions:`);
    actions.forEach(a => lines.push(`- ${a}`));
    lines.push(``);
    lines.push(`Cleaning Schedule:`);
    lines.push(`- ${cleaningSchedule}`);
    lines.push(``);
    lines.push(`Next Action:`);
    lines.push(`- ${nextAction}`);
    lines.push(``);
    lines.push(`Priority Level:`);
    lines.push(`- ${priority}`);

    return {
        lid_id: rawData.lid_id,
        water_level_percentage: waterLevelPct,
        status,
        confidence,
        anomaly_flag: anomalyFlag,
        priority,
        timestamp: rawData.timestamp || new Date().toISOString(),
        report: lines.join("\n"),
        cleaning_schedule: cleaningSchedule,
        next_action: nextAction,
        weather_impact: weatherImpact,
        source: "local_computation",
    };
}

/* ───────────────────────────────────────────────────────────────────────────
   Main export — Ollama analysis with professional analyst prompt
   ─────────────────────────────────────────────────────────────────────────── */
exports.analyzeSensorData = async (rawData, weatherData) => {
    try {
        const systemPrompt = `You are an urban drainage monitoring analyst working for a campus maintenance department at M. Kumarasamy College of Engineering (MKCE), Karur.

Your role is to analyze sewage monitoring data and provide clear, professional, and actionable summaries for campus engineers and maintenance staff. You are generating official operational reports.

Rules:
- Use simple, clear English
- Be factual and neutral
- Do NOT use emojis
- Do NOT use hype, metaphors, or speculative language
- Do NOT mention AI, LLM, or any automated system
- Do NOT guess missing data
- Base conclusions only on the provided sensor inputs and weather data
- Explain how trends, rainfall potential, and campus geography might affect risk
- Identify the likelihood of overflow or drainage stress
- Provide clear, practical recommendations for campus maintenance authorities
- Include specific cleaning schedule recommendations based on current conditions
- Factor weather forecast data into your risk assessment and recommendations

CALCULATION RULES:
- water_level_percentage = ((manhole_depth_cm - distance_cm) / manhole_depth_cm) * 100, rounded to nearest integer
- Status: below 40% = NORMAL, 40-70% = WARNING, above 70% = CRITICAL
- anomaly_flag = true if signal_quality is LOW, or temperature is outside 5-45 C range
- confidence: HIGH normally; MEDIUM if anomaly or LOW signal; LOW if both
- priority: HIGH if CRITICAL, MEDIUM if WARNING or anomaly, LOW otherwise

CLEANING SCHEDULE RULES:
- CRITICAL (>70%): Immediate cleaning within 24 hours
- WARNING (40-70%): Schedule cleaning within 7 days
- NORMAL (<40%): Routine cleaning within 30 days
- If rain is forecast, move cleaning schedule up by 1 urgency level

OUTPUT must be strictly valid JSON with NO markdown wrapping:
{
  "lid_id": "string",
  "water_level_percentage": number,
  "status": "NORMAL" | "WARNING" | "CRITICAL",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "anomaly_flag": boolean,
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "timestamp": "ISO 8601 string from input",
  "cleaning_schedule": "string — specific cleaning recommendation with timing",
  "next_action": "string — the single most important next step to take",
  "weather_impact": "string — how current and forecast weather affects this lid",
  "report": "string — the full report in this EXACT format:\\n\\nTitle: <Lid ID> - <Situation Summary>\\n\\nCurrent Status:\\n- Water level: <percentage and absolute values>\\n- Trend: <describe the trend based on level>\\n- Environmental impact: <factors like temp, signal, rainfall risk>\\n\\nWeather Impact:\\n- <current weather conditions and forecast impact>\\n\\nRisk Assessment:\\n- <2-3 sentence explanation of overflow or drainage stress likelihood>\\n\\nRecommended Actions:\\n- <bullet list of realistic, operational actions>\\n\\nCleaning Schedule:\\n- <specific cleaning recommendation with timing>\\n\\nNext Action:\\n- <single most important next step>\\n\\nPriority Level:\\n- <LOW / MEDIUM / HIGH>"
}`;

        // Build user message with sensor data and weather context
        let userMessage = `Sensor Reading:\n${JSON.stringify(rawData, null, 2)}`;
        if (weatherData) {
            userMessage += `\n\nCurrent Weather & Forecast for MKCE Campus, Karur:\n${JSON.stringify(weatherData, null, 2)}`;
        }

        const response = await ollama.chat({
            model: OLLAMA_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            format: "json",
            options: {
                temperature: 0.1,
            },
        });

        const responseText = response.message.content.trim();

        let jsonString = responseText;
        const jsonMatch = jsonString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) jsonString = jsonMatch[1];

        const parsed = JSON.parse(jsonString);
        parsed.source = "ollama_analyst";
        return parsed;
    } catch (error) {
        console.warn(`Ollama unavailable: ${error.message}. Using local computation.`);
        return generateLocalReport(rawData, weatherData);
    }
};
