const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS if this server needs to accept anything, though mostly it serves statics
app.use(cors());

// Serve static files from the root and 'public' directory
app.use(express.static(path.join(__dirname, '../')));

// Serve the index.html on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`📡 SENSOR SIMULATOR SERVER is now running!`);
    console.log(`=================================================`);
    console.log(`🔌 Local URL: http://localhost:${PORT}`);
    console.log(`📝 Description: Serves the Web UI to simulate ultrasonic sensors.`);
    console.log(`⚠️  Note: Ensure your main backend (port 3001) is running.`);
    console.log(`=================================================\n`);
});
