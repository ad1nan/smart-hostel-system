const mongoose = require("mongoose");
const db = mongoose.connection;

/* ---------- HEATMAP (TEMP USING DEVICE) ---------- */
exports.getHeatmap = async (req, res) => {
  try {
    const data = await db.collection("energy").aggregate([
      {
        $group: {
          _id: "$deviceId",   // ⚠️ no roomId exists
          totalEnergy: { $sum: "$usage" } // ✅ correct field
        }
      }
    ]).toArray();

    res.json(data);
  } catch (err) {
    console.error("Heatmap error:", err);
    res.status(500).json({ error: "Heatmap error" });
  }
};

/* ---------- DEVICE ANALYTICS ---------- */
exports.getDeviceAnalytics = async (req, res) => {
  try {
    const data = await db.collection("energy").aggregate([
      {
        $group: {
          _id: "$deviceId",
          totalEnergy: { $sum: "$usage" } // ✅ correct
        }
      }
    ]).toArray();

    res.json(data);
  } catch (err) {
    console.error("Device analytics error:", err);
    res.status(500).json({ error: "Device analytics error" });
  }
};

/* ---------- TIMESERIES ---------- */
exports.getTimeseries = async (req, res) => {
  try {
    const data = await db.collection("energy").aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%H:%M",
              date: "$timestamp" // ✅ correct
            }
          },
          totalEnergy: { $sum: "$usage" } // ✅ correct
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(data);
  } catch (err) {
    console.error("Timeseries error:", err);
    res.status(500).json({ error: "Timeseries error" });
  }
};