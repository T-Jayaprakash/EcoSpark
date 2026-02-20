# 📡 Smart Sewage Sensor Simulator

A standalone IoT Sensor Simulator for the Smart Sewage Monitoring Platform. This application acts like a **REAL** physical ultrasonic sensor, generating raw environmental data (distance, temperature, signal quality) and pushing it to a backend.

This is strictly a simulation of the *hardware data generation phase*.

## 🚀 Features
- **Raw Physical Simulation**: Incrementally changing water distance and random real-world temperatures.
- **Configurable Emissions**: Change target endpoint URL, transmission intervals (2s, 5s, 10s), and Lid IDs from an intuitive interface.
- **Glassmorphism UI**: Beautifully designed Dashboard to monitor JSON payloads in real-time.
- **Multi-Device Support**: Run on any number of tabs, browsers, or network devices securely as distinct hardware sensors.

## 🛠️ How to Run Simulator

### Option 1: The Easiest Way (No Installation)
Since it's built using pure native HTML/CSS/JS, you can just open the file directly in any browser:
1. Double click on `index.html` inside the `sensor-simulator` folder.
2. The UI will launch immediately in your default browser.

### Option 2: Using Node.js App Server (Recommended for Networks)
If you want to host it so you can access the simulator page from your mobile phone or another computer:
1. Open this folder (`sensor-simulator`) in your terminal.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the node server:
   ```bash
   npm start
   ```
4. Open your browser to `http://localhost:3002`.

---

## 🎛️ How to Change Lid ID

1. Open the Simulator UI.
2. In the **Control Panel** (left side), locate the dropdown labeled **Select Sensor Identity (LID ID)**.
3. Select your desired LID ID (e.g. `LID_01`, `LID_02`, `LID_03`).
4. Press **▶ Start Emitting**. The live payload viewer will now show that ID in the JSON packet.

> **Note**: To change the ID while a simulation is running, stop it first using **⏹ Stop Emitting**, switch the ID, and then start it again.

---

## 💻 How to Simulate Multiple Sensors Using Multiple Devices

Each simulator runs completely independently on the client side. To simulate multiple physical hardware sensors pushing to the backend simultaneously:

### In the Same Browser
1. Open `index.html` in **Tab 1**, select `LID_01`, and press **Start**.
2. Open a **New Tab (Tab 2)** with the same `index.html` file, select `LID_02`, and press **Start**.
3. Both tabs will independently run their physics engine and push payloads to your backend.

### Using Different Devices (E.g., Laptop & Mobile Phone)
1. Run the Node app server (`npm start`) on your main machine (e.g., `192.168.1.5`).
2. On your Laptop, open `http://localhost:3002`, target `localhost:3001` backend, select `LID_01`, and hit Start.
3. On your **Mobile Phone** (connected to the same Wi-Fi), open the browser to `http://192.168.1.5:3002`.
4. Change the **Target Backend API** on your phone from `localhost` to `192.168.1.5` (so it targets your laptop's backend API rather than the phone itself).
5. Select `LID_02` on your phone and press Start.
6. Now two physical devices are acting as distinct ultrasonic sewage lid sensors!

---

## ✨ Format Expected by Backend
This simulator produces ONLY raw physical metrics in this format. The translation to "Water Level %" and "Status" will be done down the line by Sonnet LLM / Backend.

```json
{
  "lid_id": "LID_12",
  "distance_cm": 28,
  "manhole_depth_cm": 100,
  "temperature_c": 35,
  "signal_quality": "GOOD",
  "timestamp": "2026-02-20T11:00:23.000Z"
}
```

**Enjoy Monitoring your Virtual Smart Sewers!**
