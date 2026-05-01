const Alert = require("../models/Alert");

const emitAlertUpdate = (req) => {
  const io = req.app.get("io");

  if (io) {
    io.emit("alert_update");
  }
};

exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ resolved: false })
      .populate("roomId")
      .populate("deviceId")
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (err) {
    console.error("Alert fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    emitAlertUpdate(req);
    res.json(alert);
  } catch (err) {
    console.error("Alert resolve error:", err.message);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
};

exports.clearAlerts = async (req, res) => {
  try {
    const result = await Alert.updateMany({ resolved: false }, { resolved: true });

    if (result.modifiedCount > 0) {
      emitAlertUpdate(req);
    }

    res.json({ msg: "All alerts cleared" });
  } catch (err) {
    console.error("Alert clear error:", err.message);
    res.status(500).json({ error: "Failed to clear alerts" });
  }
};
