const Energy = require("../models/Energy");

const roundUsage = (value) => Number((value || 0).toFixed(2));

const formatRows = (rows) =>
  rows.map((row) => ({
    ...row,
    totalUsage: roundUsage(row.totalUsage)
  }));

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
        $lookup: {
          from: "rooms",
          localField: "device.roomId",
          foreignField: "_id",
          as: "room"
        }
      },
      {
        $unwind: {
          path: "$room",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$device.roomId",
          roomName: { $first: { $ifNull: ["$room.name", "Unknown Room"] } },
          totalUsage: { $sum: { $ifNull: ["$usage", 0] } }
        }
      },
      {
        $project: {
          _id: "$_id",
          roomId: "$_id",
          roomName: 1,
          totalUsage: 1
        }
      },
      { $sort: { roomName: 1 } }
    ]);

    res.json(formatRows(data));
  } catch (err) {
    console.error("Room heatmap analytics error:", err);
    res.status(500).json({ error: "Failed to fetch room heatmap analytics" });
  }
};

exports.getDeviceAnalytics = async (req, res) => {
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
          _id: "$device.type",
          totalUsage: { $sum: { $ifNull: ["$usage", 0] } }
        }
      },
      {
        $project: {
          _id: "$_id",
          deviceType: { $ifNull: ["$_id", "Unknown Device"] },
          totalUsage: 1
        }
      },
      { $sort: { deviceType: 1 } }
    ]);

    res.json(formatRows(data));
  } catch (err) {
    console.error("Device analytics error:", err);
    res.status(500).json({ error: "Failed to fetch device analytics" });
  }
};

exports.getTimeSeries = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d %H:00",
              date: "$timestamp"
            }
          },
          totalUsage: { $sum: { $ifNull: ["$usage", 0] } }
        }
      },
      {
        $project: {
          _id: "$_id",
          period: "$_id",
          totalUsage: 1
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.json(formatRows(data));
  } catch (err) {
    console.error("Timeseries analytics error:", err);
    res.status(500).json({ error: "Failed to fetch timeseries analytics" });
  }
};

exports.getDeviceUsage = exports.getDeviceAnalytics;
exports.getEnergyTimeseries = exports.getTimeSeries;
