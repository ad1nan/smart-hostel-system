const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

// ✅ CORRECT
router.get("/heatmap", analyticsController.getRoomHeatmap);

module.exports = router;