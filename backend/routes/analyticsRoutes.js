const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

router.get("/heatmap", analyticsController.getRoomHeatmap);
router.get("/devices", analyticsController.getDeviceAnalytics);
router.get("/timeseries", analyticsController.getTimeSeries);

module.exports = router;
