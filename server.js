// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

// Optional MQTT (you can leave it or remove entirely)
const mqtt = require("mqtt");

const app = express();
app.use(cors());
app.use(express.json());

// Serve index.html and assets from current directory
app.use(express.static(path.join(__dirname)));

// In-memory store for latest data
let latestData = {};

// Optional: connect to broker (comment out if not using MQTT)
const mqttClient = mqtt.connect("mqtt://localhost:1887", {
    clientId: "server-consumer-" + Math.random().toString(16).slice(2),
});

mqttClient.on("connect", () => {
    console.log("🔌 Server connected to MQTT (1887)");
    mqttClient.subscribe("buoy/data", (err) => {
        if (err) console.error("Subscribe error:", err.message);
        else console.log("📩 Subscribed to buoy/data");
    });
});

mqttClient.on("message", (topic, message) => {
    try {
        latestData = JSON.parse(message.toString());
        console.log("📡 Received MQTT:", latestData);
    } catch (e) {
        console.error("Parse error:", e.message);
    }
});

// POST endpoint — Postman pushes data here
app.post("/data", (req, res) => {
    latestData = req.body;
    console.log("📩 Data received from Postman:", latestData);
    res.json({ status: "ok", received: latestData });
});

// GET endpoint — dashboard polls this
app.get("/data", (req, res) => {
    res.json(latestData);
});

// Optional: serve index at root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(80, () => {
    console.log("🌐 Server running on http://localhost:80");
});
