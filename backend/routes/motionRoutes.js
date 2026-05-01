const express = require("express");
const router = express.Router();
const motionController = require("../controllers/motionController");

router.post("/:roomId", motionController.triggerMotion);

module.exports = router;