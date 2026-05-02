const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const ROOMS_SERVICE = "http://localhost:5001";
const DEVICES_SERVICE = "http://localhost:5002";
const BACKEND_SERVICE = "http://localhost:5000";
const ALERTS_SERVICE = "http://localhost:5003";
const ANALYTICS_SERVICE = "http://localhost:5004";

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
    const response = await axios.get("http://localhost:5003/alerts", {
      timeout: 5000,
      validateStatus: () => true, // ✅ prevents axios from throwing
    });

    if (response.status !== 200) {
      console.error("Alerts service returned error:", response.data);
      return res.status(500).json({ error: "Alerts service error" });
    }

    res.json(response.data);
  } catch (err) {
    console.error("Gateway error:", err.message);
    res.status(500).json({ error: "Alerts service error" });
  }
});

app.patch("/alerts/:id/resolve", async (req, res) => {
  try {
    const response = await axios.patch(
      `${ALERTS_SERVICE}/alerts/${req.params.id}/resolve`
    );
    res.json(response.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Alert resolve error" });
  }
});

/* ---------- ANALYTICS (MICROSERVICE) ---------- */

app.get("/analytics/heatmap", async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE}/analytics/heatmap`);
    res.json(response.data);
  } catch (err) {
    console.error("Analytics heatmap error:", err.message);
    res.status(500).json({ error: "Analytics heatmap error" });
  }
});

app.get("/analytics/devices", async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE}/analytics/devices`);
    res.json(response.data);
  } catch (err) {
    console.error("Analytics devices error:", err.message);
    res.status(500).json({ error: "Analytics devices error" });
  }
});

app.get("/analytics/timeseries", async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE}/analytics/timeseries`);
    res.json(response.data);
  } catch (err) {
    console.error("Analytics timeseries error:", err.message);
    res.status(500).json({ error: "Analytics timeseries error" });
  }
});

/* ---------- START ---------- */

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});