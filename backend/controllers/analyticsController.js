const Energy = require("../models/Energy");
const Device = require("../models/Device");

// 🔥 ROOM HEATMAP
exports.getRoomHeatmap = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $lookup: {
          from: "devices",
          localField: "deviceId",
          foreignField: "_id",
          as: "device"
        }
      },
      { $unwind: "$device" },
      {
        $group: {
          _id: "$device.roomId",
          totalUsage: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Analytics error" });
  }
};