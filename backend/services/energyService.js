const Device = require("../models/Device");
const Energy = require("../models/Energy");

exports.processDevices = async (io) => {
  try {
    const devices = await Device.find({ status: true });
    const now = new Date();
    let recordsCreated = 0;

    for (const device of devices) {
      if (!device.startTime) {
        device.startTime = now;
        await device.save();
        continue;
      }

      const duration = (now.getTime() - new Date(device.startTime).getTime()) / (1000 * 60 * 60);

      if (duration <= 0) {
        continue;
      }

      const usage = device.power * (5 / 3600);

      await Energy.create({
        deviceId: device._id,
        usage,
        duration,
        source: "interval",
        timestamp: now
      });

      device.startTime = now;
      await device.save();
      recordsCreated += 1;
    }

    if (recordsCreated > 0 && io) {
      io.emit("analytics_update");
    }

    console.log(`Active devices: ${devices.length}, energy records created: ${recordsCreated}`);
  } catch (err) {
    console.error("Energy service error:", err.message);
  }
};
