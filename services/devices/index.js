global.crypto = require("crypto").webcrypto;

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ IMPORTANT: import Device model
const Device = require("./models/Device");

// routes
app.use("/devices", require("./routes/deviceRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Devices Service DB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Devices Service running");
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Devices Service running on ${PORT}`);
});


// ================= MQTT SECTION =================

const mqtt = require("mqtt");

// inside docker use service name
const mqttClient = mqtt.connect("mqtt://mqtt:1883");

mqttClient.on("connect", () => {
  console.log("Devices service connected to MQTT");

  mqttClient.subscribe("hostel/devices");
});

mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("Received MQTT:", data);

    // ✅ CORRECT MATCH (FINAL FIX)
    const device = await Device.findOne({
      deviceId: data.deviceId
    });

    if (!device) {
      console.log("⚠ Device not found in DB for:", data.deviceId);
      return;
    }

    // ✅ UPDATE DEVICE
    device.power = data.power;
    device.status = data.status;

    await device.save();

    console.log(`✅ Device ${data.deviceId} updated`);

  } catch (err) {
    console.error("MQTT error:", err.message);
  }
});