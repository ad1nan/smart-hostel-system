const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

// ✅ GET ACTIVE ALERTS
router.get("/", async (req, res) => {
  const alerts = await Alert.find({ resolved: false })
    .populate("roomId")
    .populate("deviceId")
    .sort({ createdAt: -1 });

  res.json(alerts);
});

// ✅ DISMISS ONE ALERT
router.patch("/:id/resolve", async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { resolved: true },
    { new: true }
  );

  res.json(alert);
});

// ✅ CLEAR ALL ALERTS
router.delete("/clear", async (req, res) => {
  await Alert.updateMany({}, { resolved: true });
  res.json({ msg: "All alerts cleared" });
});

module.exports = router;