const Device = require("../models/Device");

exports.processDevices = async () => {
  try {
    const devices = await Device.find({ status: true });

    console.log("Active devices:", devices.length);

    // ✅ NO crypto, NO advanced logic yet
    // Just keep it stable

  } catch (err) {
    console.error("Energy service error:", err.message);
  }
};