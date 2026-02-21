require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const sensorRoutes = require("./src/routes/sensorRoutes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // In production this should be restricted to the frontend URL
        methods: ["GET", "POST"]
    }
});

// Make io accessible in controllers
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", sensorRoutes);

// Socket.IO connections
io.on("connection", (socket) => {
    console.log(`Frontend client connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Frontend client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
    console.log(`Sensor Intelligence Layer listening on port ${PORT}`);
});
