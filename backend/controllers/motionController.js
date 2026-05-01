const mongoose = require("mongoose");
const Device = require("../models/Device");

exports.triggerMotion = async (req, res) => {
  try {
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);
    const io = req.app.get("io");

    const devices = await Device.find({ roomId });

    for (let device of devices) {
      if (device.status === true) continue;

      device.status = true;
      device.startTime = new Date();
      await device.save();
    }

    io.emit("deviceUpdate");

    res.json({ message: "Motion detected → devices ON" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Motion error" });
  }
};