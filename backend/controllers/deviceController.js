const Device = require("../models/Device");
const Energy = require("../models/Energy");

// ✅ GET ALL DEVICES (WITH ROOM POPULATION)
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().populate("roomId");
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Error fetching devices" });
  }
};

// ✅ TOGGLE DEVICE
exports.toggleDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ msg: "Device not found" });
    }

    // 🔥 If turning OFF → log energy
    if (device.status === true && device.startTime) {
      const durationMs = Date.now() - new Date(device.startTime).getTime();
      const hours = durationMs / (1000 * 60 * 60);
      const energyUsed = device.power * hours;

      await Energy.create({
        deviceId: device._id,
        usage: energyUsed,
        duration: hours,
        source: "manual"
      });
    }

    // 🔁 TOGGLE
    device.status = !device.status;

    if (device.status) {
      device.startTime = new Date();
    } else {
      device.startTime = null;
    }

    await device.save();

    res.json(device);

  } catch (err) {
    res.status(500).json({ error: "Toggle failed" });
  }
};