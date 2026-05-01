const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device"
  },
  usage: Number,
  duration: Number,
  source: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Energy", schema);