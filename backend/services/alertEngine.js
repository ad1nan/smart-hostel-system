const Device = require("../models/Device");
const Alert = require("../models/Alert");

module.exports = async (io) => {
  const devices = await Device.find();

  for (let d of devices) {
    // ⚠️ simple condition (you can improve later)
    if (d.status === true && d.power > 1000) {
      await Alert.create({
        message: `${d.type} high usage`,
        level: "critical",
        deviceId: d._id,
        roomId: d.roomId
      });
    }
  }

  if (io) io.emit("alertUpdate");
};