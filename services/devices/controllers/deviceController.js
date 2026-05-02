const Device = require("../models/Device");

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (err) {
    console.error("Device fetch error:", err.message);
    res.status(500).json({ error: "Error fetching devices" });
  }
};

exports.toggleDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    const io = req.app.get("io");

    if (!device) {
      return res.status(404).json({ msg: "Device not found" });
    }

    if (device.status === true && device.startTime) {
      const duration = (Date.now() - new Date(device.startTime).getTime()) / (1000 * 60 * 60);

      
    }

    device.status = !device.status;

    if (device.status) {
      device.startTime = new Date();
    } else {
      device.startTime = null;

    }

    await device.save();

    if (io) {
      io.emit("device_update");
      io.emit("analytics_update");
    }

    res.json(device);
  } catch (err) {
    console.error("Toggle device error:", err.message);
    res.status(500).json({ error: "Toggle failed" });
  }
};
