import requests
import time
import random
import json
from datetime import datetime, timezone

# EcoSpark Sensor Simulator (Python version)
# Simulates 10 sensor nodes across MKCE Campus, Karur.

API_URL = 'http://localhost:3003/api/raw-sensor-data'

SENSORS = [
    {'lid_id': 'MKCE_LID_01', 'area': 'Main Gate Road', 'city': 'Karur', 'latitude': 11.0558, 'longitude': 78.0472},
    {'lid_id': 'MKCE_LID_02', 'area': 'Academic Block Road', 'city': 'Karur', 'latitude': 11.0550, 'longitude': 78.0488},
    {'lid_id': 'MKCE_LID_03', 'area': 'Central Avenue', 'city': 'Karur', 'latitude': 11.0542, 'longitude': 78.0495},
    {'lid_id': 'MKCE_LID_04', 'area': 'Library Road', 'city': 'Karur', 'latitude': 11.0535, 'longitude': 78.0478},
    {'lid_id': 'MKCE_LID_05', 'area': 'Workshop Road', 'city': 'Karur', 'latitude': 11.0528, 'longitude': 78.0502},
    {'lid_id': 'MKCE_LID_06', 'area': 'Hostel Block Road', 'city': 'Karur', 'latitude': 11.0548, 'longitude': 78.0510},
    {'lid_id': 'MKCE_LID_07', 'area': 'Hostel Ring Road', 'city': 'Karur', 'latitude': 11.0538, 'longitude': 78.0520},
    {'lid_id': 'MKCE_LID_08', 'area': 'Playground Perimeter Rd', 'city': 'Karur', 'latitude': 11.0525, 'longitude': 78.0465},
    {'lid_id': 'MKCE_LID_09', 'area': 'Canteen Road', 'city': 'Karur', 'latitude': 11.0560, 'longitude': 78.0505},
    {'lid_id': 'MKCE_LID_10', 'area': 'Back Gate Road', 'city': 'Karur', 'latitude': 11.0520, 'longitude': 78.0490},
]

# Depth of all manholes in CM
MANHOLE_DEPTH = 100

SIGNAL_LEVELS = ['EXCELLENT', 'GOOD', 'FAIR', 'WEAK']

# Initialize sensor states (distance from sensor to water)
# 100 = empty, 5 = full
sensor_state = {
    s['lid_id']: {
        'current_dist': random.uniform(20, 90),
        'trend': random.uniform(-1, 1)
    } for s in SENSORS
}

def clamp(v, min_v, max_v):
    return max(min_v, min(max_v, v))

def build_payload(sensor):
    state = sensor_state[sensor['lid_id']]
    
    # Drift the distance (simulate water level moving)
    state['trend'] += random.uniform(-0.5, 0.5)
    state['trend'] = clamp(state['trend'], -3, 3)
    # Reducing distance means water is rising
    state['current_dist'] = clamp(state['current_dist'] - state['trend'], 5, 100)
    
    # Random spikes
    if random.random() < 0.05:
        state['current_dist'] = clamp(state['current_dist'] + (20 if random.random() > 0.5 else -20), 5, 100)
        
    return {
        "lid_id": sensor['lid_id'],
        "distance_cm": round(state['current_dist'], 1),
        "manhole_depth_cm": MANHOLE_DEPTH,
        "temperature_c": random.randint(28, 42),
        "signal_quality": random.choice(SIGNAL_LEVELS),
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    }

def send_data(sensor):
    payload = build_payload(sensor)
    try:
        response = requests.post(API_URL, json=payload, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Get interpreted data back from Intelligence layer
        interpreted = data.get('data', {})
        status = interpreted.get('status', 'NORMAL')
        water_level = interpreted.get('water_level_percentage', '--')
        
        indicator = '[!!]' if status == 'CRITICAL' else '[! ]' if status == 'WARNING' else '[  ]'
        
        print(f"{indicator} {sensor['lid_id']:<12} | {sensor['area']:<22} | {water_level:>5}% | {status}")
    except Exception as e:
        print(f"[-] {sensor['lid_id']:<12} Failed: {str(e)}")

def main():
    print("EcoSpark Python Simulator started — 10 MKCE sensors")
    print(f"   Target: {API_URL}")
    print("   Press Ctrl+C to stop.\n")
    
    while True:
        print(f"\n⏱ {datetime.now().strftime('%H:%M:%S')} {'─'*40}")
        for sensor in SENSORS:
            send_data(sensor)
        time.sleep(3)

if __name__ == "__main__":
    main()
