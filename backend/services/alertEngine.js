const mongoose = require("mongoose");
const Alert = require("../models/Alert");
const Device = require("../models/Device");
const Energy = require("../models/Energy");

const ENERGY_THRESHOLD_WH = Number(process.env.ALERT_THRESHOLD_WH || 5);

const getDeviceUsage = async (deviceId) => {
  const [result] = await Energy.aggregate([
    {
      $match: {
        deviceId: new mongoose.Types.ObjectId(deviceId)
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

const emitAlertUpdate = (io) => {
  if (io) {
    io.emit("alert_update");
  }
};

module.exports = async (io) => {
  try {
    const devices = await Device.find().populate("roomId");
    let changed = false;

    for (const device of devices) {
      const totalUsage = await getDeviceUsage(device._id);
      const activeAlert = await Alert.findOne({
        deviceId: device._id,
        resolved: false
      });

      if (!device.status || totalUsage <= ENERGY_THRESHOLD_WH) {
        if (activeAlert) {
          activeAlert.resolved = true;
          await activeAlert.save();
          changed = true;
        }

        continue;
      }

      if (activeAlert) {
        continue;
      }

      const roomName = device.roomId?.name || "Unknown Room";
      const level = totalUsage > ENERGY_THRESHOLD_WH * 2 ? "high" : "warning";

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
    console.error("Alert engine error:", err.message);
  }
};
