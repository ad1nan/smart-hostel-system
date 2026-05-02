require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const authMiddleware = require("./middleware/authMiddleware");

const ROOMS_SERVICE = process.env.ROOMS_SERVICE_URL;
const DEVICES_SERVICE = process.env.DEVICES_SERVICE_URL;
const ALERTS_SERVICE = process.env.ALERTS_SERVICE_URL;
const ANALYTICS_SERVICE = process.env.ANALYTICS_SERVICE_URL;

/* ---------- ROOMS ---------- */

app.get("/rooms", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${ROOMS_SERVICE}/rooms`);
    res.json(response.data);
  } catch (err) {
    console.error("Rooms error:", err.message);
    res.status(500).json({ error: "Rooms service error" });
  }
});

/* ---------- DEVICES ---------- */

app.get("/devices",authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${DEVICES_SERVICE}/devices`);
    res.json(response.data);
  } catch (err) {
    console.error("Devices error:", err.message);
    res.status(500).json({ error: "Devices service error" });
  }
});

app.post("/devices/toggle/:id", authMiddleware, async (req, res) => {
  try {
    const response = await axios.post(
      `${DEVICES_SERVICE}/devices/toggle/${req.params.id}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Toggle error:", err.response?.data || err.message);
    res.status(500).json({ error: "Toggle failed" });
  }
});

/* ---------- ALERTS ---------- */

app.get("/alerts", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${ALERTS_SERVICE}/alerts`, {
      timeout: 5000,
      validateStatus: () => true,
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

app.patch("/alerts/:id/resolve",authMiddleware, async (req, res) => {
  try {
    const response = await axios.patch(
      `${ALERTS_SERVICE}/alerts/${req.params.id}/resolve`
    );
    res.json(response.data);
  } catch (err) {
    console.error("Resolve error:", err.message);
    res.status(500).json({ error: "Alert resolve error" });
  }
});

/* ---------- ANALYTICS ---------- */

app.get("/analytics/heatmap", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE}/analytics/heatmap`);
    res.json(response.data);
  } catch (err) {
    console.error("Analytics heatmap error:", err.message);
    res.status(500).json({ error: "Analytics heatmap error" });
  }
});

app.get("/analytics/devices",authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE}/analytics/devices`);
    res.json(response.data);
  } catch (err) {
    console.error("Analytics devices error:", err.message);
    res.status(500).json({ error: "Analytics devices error" });
  }
});

app.get("/analytics/timeseries", authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_SERVICE}/analytics/timeseries`);
    res.json(response.data);
  } catch (err) {
    console.error("Analytics timeseries error:", err.message);
    res.status(500).json({ error: "Analytics timeseries error" });
  }
});

/* ---------- HEALTH ---------- */

app.get("/", (req, res) => {
  res.send("API Gateway running");
});

/* ---------- START ---------- */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});