const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const Device = require("../models/Device");
const Energy = require("../models/Energy");

// 🔥 lower for testing (you can increase later)
const ENERGY_THRESHOLD_WH = Number(process.env.ALERT_THRESHOLD_WH || 1);

// ✅ Get recent usage (last 5 minutes)
const getDeviceUsage = async (deviceId) => {
  const last5Min = new Date(Date.now() - 5 * 60 * 1000);

  const [result] = await Energy.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId),
        timestamp: { $gte: last5Min }
      }
    },
    {
      $group: {
        _id: "$deviceId",
        totalUsage: { $sum: { $ifNull: ["$usage", 0] } }
      }
    }
  ]);

  return result?.totalUsage || 0;
};

// ✅ Emit socket update
const emitAlertUpdate = (io) => {
  if (io) io.emit("alert_update");
};

module.exports = async (io) => {
  try {
    const devices = await Device.find().populate("roomId");
    let changed = false;

    for (const device of devices) {
      const totalUsage = await getDeviceUsage(device._id);

      console.log(
        `Device: ${device.type} | Status: ${device.status} | Usage: ${totalUsage.toFixed(2)} Wh`
      );

      const activeAlert = await Alert.findOne({
        deviceId: device._id,
        resolved: false
      });

      // ❌ If OFF or below threshold → resolve alert
      if (!device.status || totalUsage <= ENERGY_THRESHOLD_WH) {
        if (activeAlert) {
          activeAlert.resolved = true;
          await activeAlert.save();
          console.log(`✅ Alert resolved for ${device.type}`);
          changed = true;
        }
        continue;
      }

      // ⛔ Prevent duplicate alerts
      if (activeAlert) continue;

      const roomName = device.roomId?.name || "Unknown Room";

      const level =
        totalUsage > ENERGY_THRESHOLD_WH * 2 ? "high" : "warning";

      console.log(`🚨 Creating alert for ${device.type} in ${roomName}`);

      await Alert.create({
        roomId: device.roomId?._id || device.roomId,
        deviceId: device._id,
        message: `${roomName} ${device.type} is consuming too much energy`,
        level
      });

      changed = true;
    }

    if (changed) {
      emitAlertUpdate(io);
    }
  } catch (err) {
    console.error("❌ Alert engine error:", err.message);
  }
};