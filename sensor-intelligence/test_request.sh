#!/bin/bash
curl -X POST http://localhost:3000/api/raw-sensor-data \
-H "Content-Type: application/json" \
-d '{
  "lid_id": "LID_12",
  "distance_cm": 28.4,
  "manhole_depth_cm": 100,
  "temperature_c": 34,
  "signal_quality": "GOOD",
  "timestamp": "2026-02-20T20:54:01Z"
}'
echo ""
