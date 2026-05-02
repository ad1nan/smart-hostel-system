const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const ROOMS_SERVICE = "http://localhost:5001";
const DEVICES_SERVICE = "http://localhost:5002";
const BACKEND_SERVICE = "http://localhost:5000";

/* ---------- ROOMS ---------- */

app.get("/rooms", async (req, res) => {
  try {
    const response = await axios.get(`${ROOMS_SERVICE}/rooms`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Rooms service error" });
  }
});

/* ---------- DEVICES ---------- */

app.get("/devices", async (req, res) => {
  try {
    const response = await axios.get(`${DEVICES_SERVICE}/devices`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Devices service error" });
  }
});

app.patch("/devices/:id/toggle", async (req, res) => {
  try {
    const response = await axios.patch(
      `${DEVICES_SERVICE}/devices/${req.params.id}/toggle`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Toggle failed" });
  }
});

/* ---------- ALERTS ---------- */

app.get("/alerts", async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_SERVICE}/alerts`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Alerts service error" });
  }
});

app.patch("/alerts/:id/resolve", async (req, res) => {
  try {
    const response = await axios.patch(
      `${BACKEND_SERVICE}/alerts/${req.params.id}/resolve`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Alert resolve error" });
  }
});

/* ---------- ANALYTICS ---------- */

app.get("/analytics/heatmap", async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_SERVICE}/analytics/heatmap`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Heatmap error" });
  }
});

app.get("/analytics/devices", async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_SERVICE}/analytics/devices`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Device analytics error" });
  }
});

app.get("/analytics/timeseries", async (req, res) => {
  try {
    const response = await axios.get(`${BACKEND_SERVICE}/analytics/timeseries`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Timeseries error" });
  }
});

/* ---------- START ---------- */

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});