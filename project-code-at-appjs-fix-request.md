# Project Code Export - At App.js Fix Request

Best available reconstruction from the earlier captured export. App.js is the pre-fix content I read before editing. Excluded: node_modules, build output, package-lock.json, and binary image/icon files.

## analytics-service\controllers\analyticsController.js

````javascript
const Energy = require("../models/Energy");

const COST_PER_WH = 0.01; // â‚¹ per Wh (adjust if needed)

// ðŸ”¹ TOTAL ENERGY
exports.totalEnergy = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      { $group: { _id: null, total: { $sum: "$usage" } } }
    ]);

    const total = data[0]?.total || 0;

    res.json({
      totalEnergy: total,
      cost: total * COST_PER_WH
    });

  } catch (err) {
    res.status(500).json({ error: "Error fetching total energy" });
  }
};

// ðŸ”¹ ENERGY BY ROOM (WITH ROOM NAME)
exports.energyByRoom = async (req, res) => {
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
      { $unwind: "$room" },
      {
        $group: {
          _id: "$room.name",
          total: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching room energy" });
  }
};

// ðŸ”¹ ENERGY BY DEVICE TYPE
exports.energyByDevice = async (req, res) => {
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
          total: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching device energy" });
  }
};

// ðŸ”¥ NEW â€” ENERGY BY SOURCE (manual vs motion)
exports.energyBySource = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: "$source",
          total: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching source data" });
  }
};

// ðŸ”¥ NEW â€” EFFICIENCY (motion vs manual %)
exports.efficiency = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: "$source",
          total: { $sum: "$usage" }
        }
      }
    ]);

    let motion = 0;
    let manual = 0;

    data.forEach(d => {
      if (d._id === "motion") motion = d.total;
      if (d._id === "manual") manual = d.total;
    });

    const total = motion + manual;

    res.json({
      motionPercentage: total ? (motion / total) * 100 : 0,
      manualPercentage: total ? (manual / total) * 100 : 0
    });

  } catch (err) {
    res.status(500).json({ error: "Error calculating efficiency" });
  }
};

// ðŸ”¥ NEW â€” DAILY ENERGY
exports.energyOverTime = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          total: { $sum: "$usage" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching time data" });
  }
};
````

## analytics-service\Dockerfile

````dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5002

CMD ["npm", "start"]
````

## analytics-service\models\Energy.js

````javascript
const mongoose = require("mongoose");

const EnergySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true
  },
  usage: Number,
  duration: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ["motion", "manual"],
    required: true
  }
});

module.exports = mongoose.model("Energy", EnergySchema);
````

## analytics-service\package.json

````json
{
  "name": "analytics-service",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5"
  }
}
````

## analytics-service\routes\analyticsRoutes.js

````javascript
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/total", analyticsController.totalEnergy);
router.get("/room", analyticsController.energyByRoom);
router.get("/device", analyticsController.energyByDevice);

// ðŸ”¥ NEW
router.get("/source", analyticsController.energyBySource);
router.get("/efficiency", analyticsController.efficiency);
router.get("/timeline", analyticsController.energyOverTime);

module.exports = router;
````

## analytics-service\server.js

````javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// âœ… ROUTES
const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/analytics", analyticsRoutes);

// âœ… MongoDB
mongoose.connect("mongodb://mongo:27017/hostelDB")
  .then(() => console.log("Analytics Service DB Connected"))
  .catch(err => console.log(err));

// test route
app.get("/", (req, res) => {
  res.send("Analytics Service Running");
});

app.listen(5002, () => console.log("Analytics Service on 5002"));
````

## backend\.dockerignore

````
node_modules
npm-debug.log
.env
````

## backend\controllers\analyticsController.js

````javascript
const Energy = require("../models/Energy");

const COST_PER_WH = 0.01; // â‚¹ per Wh (adjust if needed)

// ðŸ”¹ TOTAL ENERGY
exports.totalEnergy = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      { $group: { _id: null, total: { $sum: "$usage" } } }
    ]);

    const total = data[0]?.total || 0;

    res.json({
      totalEnergy: total,
      cost: total * COST_PER_WH
    });

  } catch (err) {
    res.status(500).json({ error: "Error fetching total energy" });
  }
};

// ðŸ”¹ ENERGY BY ROOM (WITH ROOM NAME)
exports.energyByRoom = async (req, res) => {
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
      { $unwind: "$room" },
      {
        $group: {
          _id: "$room.name",
          total: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching room energy" });
  }
};

// ðŸ”¹ ENERGY BY DEVICE TYPE
exports.energyByDevice = async (req, res) => {
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
          total: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching device energy" });
  }
};

// ðŸ”¥ NEW â€” ENERGY BY SOURCE (manual vs motion)
exports.energyBySource = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: "$source",
          total: { $sum: "$usage" }
        }
      }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching source data" });
  }
};

// ðŸ”¥ NEW â€” EFFICIENCY (motion vs manual %)
exports.efficiency = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: "$source",
          total: { $sum: "$usage" }
        }
      }
    ]);

    let motion = 0;
    let manual = 0;

    data.forEach(d => {
      if (d._id === "motion") motion = d.total;
      if (d._id === "manual") manual = d.total;
    });

    const total = motion + manual;

    res.json({
      motionPercentage: total ? (motion / total) * 100 : 0,
      manualPercentage: total ? (manual / total) * 100 : 0
    });

  } catch (err) {
    res.status(500).json({ error: "Error calculating efficiency" });
  }
};

// ðŸ”¥ NEW â€” DAILY ENERGY
exports.energyOverTime = async (req, res) => {
  try {
    const data = await Energy.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          total: { $sum: "$usage" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Error fetching time data" });
  }
};
````

## backend\controllers\deviceController.js

````javascript
const Device = require("../models/Device");
const Energy = require("../models/Energy");
const Alert = require("../models/Alert");

exports.createDevice = async (req, res) => {
  const device = await Device.create({
    ...req.body,
    status: false,
    startTime: null
  });
  res.json(device);
};

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().populate("roomId");
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ðŸ”¥ TOGGLE DEVICE
exports.toggleDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) return res.status(404).json({ msg: "Device not found" });

    // âœ… If turning OFF â†’ calculate energy
    if (device.status === true && device.startTime) {
      const durationMs = Date.now() - new Date(device.startTime).getTime();
      const hours = durationMs / (1000 * 60 * 60);

      const energyUsed = device.power * hours;
      device.energy += energyUsed;
    }

    // âœ… Toggle state
    device.status = !device.status;

    if (device.status) {
      device.startTime = new Date();
      device.lastOnTime = new Date();
    } else {
      device.startTime = null;
    }

    await device.save();

    res.json(device);
  } catch (err) {
    console.error("Toggle Error:", err);
    res.status(500).json({ error: err.message });
  }
};
````

## backend\controllers\motionController.js

````javascript
const mongoose = require("mongoose");
const Device = require("../models/Device");

exports.triggerMotion = async (req, res) => {
  try {
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);
    const io = req.app.get("io");

    const devices = await Device.find({ roomId });

    for (let device of devices) {
      if (device.status === true) continue;

      device.status = true;
      device.startTime = new Date();
      await device.save();
    }

    io.emit("deviceUpdate");

    res.json({ message: "Motion detected â†’ devices ON" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Motion error" });
  }
};
````

## backend\controllers\roomController.js

````javascript
const Room = require("../models/Room");

exports.createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRooms = async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
};
````

## backend\Dockerfile

````dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
````

## backend\models\Alert.js

````javascript
const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device"
  },
  message: String,

  level: {
    type: String,
    enum: ["info", "warning", "critical"],
    default: "warning"
  },

  // âœ… NEW (VERY IMPORTANT)
  typeKey: String,

  resolved: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Alert", AlertSchema);
````

## backend\models\Device.js

````javascript
const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  type: String,
  status: { type: Boolean, default: false },
  power: Number,
  startTime: Date,

  // ðŸ”¥ ADD THESE
  energy: { type: Number, default: 0 },
  lastOnTime: Date
});

module.exports = mongoose.model("Device", DeviceSchema);
````

## backend\models\Energy.js

````javascript
const mongoose = require("mongoose");

const EnergySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true
  },
  usage: Number,
  duration: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ["motion", "manual"],
    required: true
  }
});

module.exports = mongoose.model("Energy", EnergySchema);
````

## backend\models\Room.js

````javascript
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model("Room", RoomSchema);
````

## backend\package.json

````json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "seed": "node seed.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "mongoose": "^9.6.1",
    "node-cron": "^4.2.1",
    "socket.io": "^4.8.3"
  }
}
````

## backend\routes\alertRoutes.js

````javascript
const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

// âœ… GET ACTIVE ALERTS ONLY
router.get("/", async (req, res) => {
  const alerts = await Alert.find({ resolved: false })
    .populate("roomId")
    .populate("deviceId")
    .sort({ createdAt: -1 });

  res.json(alerts);
});

// âœ… DISMISS ONE ALERT
router.patch("/:id/resolve", async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { resolved: true },
    { new: true }
  );

  res.json(alert);
});

// âœ… CLEAR ALL ALERTS (optional)
router.delete("/clear", async (req, res) => {
  await Alert.updateMany({}, { resolved: true });
  res.json({ msg: "All alerts cleared" });
});

module.exports = router;
````

## backend\routes\analyticsRoutes.js

````javascript
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/total", analyticsController.totalEnergy);
router.get("/room", analyticsController.energyByRoom);
router.get("/device", analyticsController.energyByDevice);

// ðŸ”¥ NEW
router.get("/source", analyticsController.energyBySource);
router.get("/efficiency", analyticsController.efficiency);
router.get("/timeline", analyticsController.energyOverTime);

module.exports = router;
````

## backend\routes\deviceRoutes.js

````javascript
const express = require("express");
const router = express.Router();

const deviceController = require("../controllers/deviceController");

// âœ… GET ALL DEVICES (THIS WAS MISSING)
router.get("/", deviceController.getDevices);

// âœ… TOGGLE DEVICE
router.post("/toggle/:id", deviceController.toggleDevice);

module.exports = router;
````

## backend\routes\motionRoutes.js

````javascript
const express = require("express");
const router = express.Router();
const motionController = require("../controllers/motionController");

router.post("/:roomId", motionController.triggerMotion);

module.exports = router;
````

## backend\routes\roomRoutes.js

````javascript
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");

router.post("/", roomController.createRoom);
router.get("/", roomController.getRooms);

module.exports = router;
````

## backend\seed.js

````javascript
const crypto = require("crypto");
global.crypto = crypto;

const mongoose = require("mongoose");
const Room = require("./models/Room");
const Device = require("./models/Device");
const Energy = require("./models/Energy");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelDB";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB Connected for Seeding");

    await Room.deleteMany();
    await Device.deleteMany();
    await Energy.deleteMany();

    console.log("Old data cleared");

    const rooms = await Room.insertMany([
      { name: "Room 101" },
      { name: "Room 102" },
      { name: "Room 103" }
    ]);

    console.log("Rooms created");

    let devices = [];

    for (let room of rooms) {
      devices.push(
        {
          roomId: room._id,
          type: "light",
          power: 10,
          status: false
        },
        {
          roomId: room._id,
          type: "fan",
          power: 75,
          status: false
        }
      );
    }

    const createdDevices = await Device.insertMany(devices);
    console.log("Devices created");

    const energyData = [];

    for (let device of createdDevices) {
      for (let i = 0; i < 5; i++) {
        const duration = Math.random() * 0.5;
        const usage = device.power * duration;

        energyData.push({
          deviceId: device._id,
          usage,
          duration,
          source: Math.random() > 0.5 ? "motion" : "manual",
          timestamp: new Date(Date.now() - Math.random() * 86400000)
        });
      }
    }

    await Energy.insertMany(energyData);

    console.log("Energy data generated");
    console.log("âœ… SEEDING COMPLETED SUCCESSFULLY");

    process.exit();
  } catch (err) {
    console.error("âŒ Seeding Error:", err);
    process.exit(1);
  }
};

seed();
````

## backend\server.js

````javascript
const crypto = require("crypto");
global.crypto = crypto;

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// âœ… ROUTES
const roomRoutes = require("./routes/roomRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const motionRoutes = require("./routes/motionRoutes");
const alertRoutes = require("./routes/alertRoutes");

app.use("/rooms", roomRoutes);
app.use("/devices", deviceRoutes); // âœ… ONLY ONCE
app.use("/motion", motionRoutes);
app.use("/alerts", alertRoutes);

// âœ… MongoDB
mongoose.connect("mongodb://mongo:27017/hostelDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// test route
app.get("/", (req, res) => {
  res.send("Server Running");
});

const http = require("http");
const { Server } = require("socket.io");

const cron = require("node-cron");
const { processDevices } = require("./services/energyService");
const runAlertChecks = require("./services/alertEngine");

// ðŸ”¥ ALERT ENGINE
setInterval(() => {
  const io = app.get("io");
  runAlertChecks(io);
}, 30000);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

// ðŸ”¥ ENERGY SIMULATION


server.listen(5000, () => console.log("Server started on 5000"));
````

## backend\services\alertEngine.js

````javascript
const Device = require("../models/Device");
const Alert = require("../models/Alert");

// âœ… thresholds
const RUNTIME_THRESHOLD_SEC = 60;
const ENERGY_THRESHOLD = 5;

async function runAlertChecks(io) {
  try {
    const devices = await Device.find().populate("roomId");

    for (let device of devices) {

      // âœ… ONLY ACTIVE DEVICES
      if (!device.status || !device.startTime) continue;

      const runtimeSec =
        (Date.now() - new Date(device.startTime)) / 1000;

      // -------------------------
      // ðŸš¨ LONG RUNTIME
      // -------------------------
      if (runtimeSec > RUNTIME_THRESHOLD_SEC) {
        await createAlert(
          device,
          "LONG_RUNTIME",
          `âš ï¸ ${device.roomId?.name} - ${device.type} running too long`,
          "warning",
          io
        );
      }

      // -------------------------
      // ðŸš¨ HIGH ENERGY (FIXED)
      // -------------------------
      if (device.energy && device.energy > ENERGY_THRESHOLD) {
        await createAlert(
          device,
          "HIGH_ENERGY",
          `ðŸ”¥ ${device.roomId?.name} - ${device.type} high energy usage`,
          "critical",
          io
        );
      }
    }

  } catch (err) {
    console.error("Alert Engine Error:", err.message);
  }
}

// âœ… NO SPAM
async function createAlert(device, typeKey, message, level, io) {

  const existing = await Alert.findOne({
    deviceId: device._id,
    typeKey,
    resolved: false
  });

  if (existing) return;

  const alert = await Alert.create({
    roomId: device.roomId?._id,
    deviceId: device._id,
    message,
    level,
    typeKey
  });

  console.log("ðŸš¨ ALERT:", message);

  if (io) io.emit("newAlert", alert);
}

module.exports = runAlertChecks;
````

## backend\services\energyService.js

````javascript
````

## device-service\controllers\deviceController.js

````javascript
const Device = require("../models/Device");
const Energy = require("../models/Energy");

exports.toggleDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ msg: "Device not found" });
    }

    // ðŸ”¥ IF TURNING OFF â†’ LOG ENERGY ONCE
    if (device.status === true && device.startTime) {
      const durationMs =
        Date.now() - new Date(device.startTime).getTime();

      const hours = durationMs / (1000 * 60 * 60);
      const energyUsed = device.power * hours;

      await Energy.create({
        deviceId: device._id,
        usage: energyUsed,
        duration: hours,
        source: "manual"
      });
    }

    // ðŸ” TOGGLE
    device.status = !device.status;

    if (device.status) {
      device.startTime = new Date();
    } else {
      device.startTime = null;
    }

    await device.save();

    res.json(device);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
````

## device-service\Dockerfile

````dockerfile
FROM node:18

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

CMD ["node", "server.js"]
````

## device-service\models\Device.js

````javascript
const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  type: String,
  status: { type: Boolean, default: false },
  power: Number,
  startTime: Date,

  // ðŸ”¥ ADD THESE
  energy: { type: Number, default: 0 },
  lastOnTime: Date
});

module.exports = mongoose.model("Device", DeviceSchema);
````

## device-service\models\Energy.js

````javascript
const mongoose = require("mongoose");

const EnergySchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true
  },
  usage: Number,
  duration: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ["manual", "motion"],
    required: true
  }
});

module.exports = mongoose.model("Energy", EnergySchema);
````

## device-service\models\Room.js

````javascript
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model("Room", RoomSchema);
````

## device-service\package.json

````json
{
  "name": "device-service",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5"
  }
}
````

## device-service\routes\deviceRoutes.js

````javascript
const express = require("express");
const router = express.Router();
const controller = require("../controllers/deviceController");

router.get("/", controller.getDevices);
router.post("/toggle/:id", controller.toggleDevice);

module.exports = router;
````

## device-service\server.js

````javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// âœ… REGISTER MODELS (FIX)
require("./models/Device");
require("./models/Room");

// âœ… ROUTES
const deviceRoutes = require("./routes/deviceRoutes");
app.use("/devices", deviceRoutes);

// âœ… Mongo
mongoose.connect("mongodb://mongo:27017/hostelDB")
  .then(() => console.log("Device Service DB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Device Service Running");
});

app.listen(5001, () => console.log("Device Service on 5001"));
````

## docker-compose.yml

````yaml
services:

  mongo:
    image: mongo
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    container_name: backend
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    environment:
      - MONGO_URI=mongodb://mongo:27017/hostelDB

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

  device-service:
    build: ./device-service
    container_name: device-service
    ports:
     - "5001:5001"
    depends_on:
      - mongo  

  analytics-service:
    build: ./analytics-service
    container_name: analytics-service
    ports:
      - "5002:5002"
    depends_on:
      - mongo        

volumes:
  mongo_data:

````

## frontend\.dockerignore

````
node_modules
build
.env
````

## frontend\.gitignore

````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
````

## frontend\Dockerfile

````dockerfile
# frontend/Dockerfile

FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
````

## frontend\package.json

````json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.15.2",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-scripts": "5.0.1",
    "recharts": "^3.8.1",
    "socket.io-client": "^4.8.3",
    "web-vitals": "^2.1.4",
    "react-chartjs-2": "^5.2.0",
    "chart.js": "^4.4.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
````

## frontend\public\index.html

````html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the `public` folder during the build.
      Only files inside the `public` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running `npm run build`.
    -->
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
</html>
````

## frontend\public\manifest.json

````json
{
  "short_name": "React App",
  "name": "Create React App Sample",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
````

## frontend\public\robots.txt

````
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
````

## frontend\README.md

````markdown
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
````

## frontend\src\App.css

````css
body {
  background: #0f172a;
  color: white;
  font-family: sans-serif;
}

.app {
  padding: 20px;
}

.kpi-grid {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.kpi {
  background: #1e293b;
  padding: 15px;
  border-radius: 10px;
  width: 200px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.card {
  background: #1e293b;
  padding: 15px;
  border-radius: 10px;
}

.heatmap {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.heat-card {
  padding: 20px;
  border-radius: 10px;
  width: 200px;
  cursor: pointer;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #1e293b;
  padding: 20px;
  border-radius: 10px;
  width: 400px;
}

.device-list {
  display: flex;
  gap: 10px;
}

.device {
  background: #0f172a;
  padding: 10px;
  border-radius: 8px;
}

.alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin: 8px 0;
  border-radius: 8px;
}

.alert.warning {
  background: orange;
}

.alert.critical {
  background: red;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: white;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
````

## frontend\src\App.js

````javascript
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import {
Chart as ChartJS,
ArcElement,
BarElement,
CategoryScale,
LinearScale,
Tooltip,
Legend,
LineElement,
PointElement
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
ArcElement,
BarElement,
CategoryScale,
LinearScale,
Tooltip,
Legend,
LineElement,
PointElement
);

function App() {
const [rooms, setRooms] = useState([]);
const [devices, setDevices] = useState([]);
const [alerts, setAlerts] = useState([]);
const [selectedRoom, setSelectedRoom] = useState(null);

useEffect(() => {
fetchData();
}, []);

const fetchData = async () => {
try {
const roomsRes = await axios.get("http://localhost:5000/rooms");
const devicesRes = await axios.get("http://localhost:5000/devices");
const alertsRes = await axios.get("http://localhost:5000/alerts");


  setRooms(roomsRes.data);
  setDevices(devicesRes.data);
  setAlerts(alertsRes.data);
} catch (err) {
  console.error("Fetch error:", err);
}


};

// âœ… FIXED ALERT REFRESH
const fetchAlerts = async () => {
try {
const res = await axios.get("http://localhost:5000/alerts");
setAlerts(res.data);
} catch (err) {
console.error("Alert fetch error:", err);
}
};

const dismissAlert = async (id) => {
try {
await axios.patch(`http://localhost:5000/alerts/${id}/resolve`);
fetchAlerts(); // âœ… NO ERROR NOW
} catch (err) {
console.error(err);
}
};

// ENERGY
const getRoomEnergy = (roomId) => {
return devices
.filter((d) => d.roomId?._id === roomId)
.reduce((sum, d) => sum + (d.energy || 0), 0);
};

const energies = rooms.map((r) => getRoomEnergy(r._id));
const max = Math.max(...energies, 1);

const getColor = (value) => {
const ratio = value / max;
if (ratio < 0.3) return "#22c55e";
if (ratio < 0.6) return "#f97316";
return "#ef4444";
};

// TOGGLE
const toggleDevice = async (id) => {
try {
await axios.post(`http://localhost:5000/devices/toggle/${id}`);
fetchData();
} catch (err) {
console.error(err);
}
};

return ( <div className="app"> <h1>âš¡ Smart Hostel Dashboard</h1>

```
  {/* ALERTS */}
  <h2>ðŸš¨ Alerts</h2>

  {alerts.length === 0 ? (
    <p>No alerts</p>
  ) : (
    alerts.map((a) => (
      <div key={a._id} className={`alert ${a.level}`}>
        <span>{a.message}</span>
        <button
          className="close-btn"
          onClick={() => dismissAlert(a._id)}
        >
          âœ–
        </button>
      </div>
    ))
  )}

  {/* KPIs */}
  <div className="kpi-grid">
    <div className="kpi">
      <h3>Total Energy</h3>
      <p>{energies.reduce((a, b) => a + b, 0).toFixed(2)} Wh</p>
    </div>

    <div className="kpi">
      <h3>Total Cost</h3>
      <p>â‚¹ {(energies.reduce((a, b) => a + b, 0) * 0.01).toFixed(2)}</p>
    </div>
  </div>

  {/* CHARTS */}
  <div className="grid">
    <div className="card">
      <h3>Energy by Room</h3>
      <Bar
        data={{
          labels: rooms.map((r) => r.name),
          datasets: [
            {
              label: "Energy",
              data: energies,
              backgroundColor: "#22c55e"
            }
          ]
        }}
      />
    </div>

    <div className="card">
      <h3>Energy by Device</h3>
      <Pie
        data={{
          labels: ["light", "fan"],
          datasets: [
            {
              data: [
                devices
                  .filter((d) => d.type === "light")
                  .reduce((a, b) => a + (b.energy || 0), 0),
                devices
                  .filter((d) => d.type === "fan")
                  .reduce((a, b) => a + (b.energy || 0), 0)
              ],
              backgroundColor: ["#f97316", "#22c55e"]
            }
          ]
        }}
      />
    </div>

    <div className="card">
      <h3>Energy Timeline</h3>
      <Line
        data={{
          labels: ["Now"],
          datasets: [
            {
              label: "Energy",
              data: [energies.reduce((a, b) => a + b, 0)],
              borderColor: "#3b82f6"
            }
          ]
        }}
      />
    </div>
  </div>

  {/* HEATMAP */}
  <h2>ðŸ”¥ Room Heatmap</h2>
  <div className="heatmap">
    {rooms.map((room) => {
      const energy = getRoomEnergy(room._id);

      return (
        <div
          key={room._id}
          className="heat-card"
          style={{ background: getColor(energy) }}
          onClick={() => setSelectedRoom(room)}
        >
          <h3>{room.name}</h3>
          <p>{energy.toFixed(2)} Wh</p>
        </div>
      );
    })}
  </div>

  {/* MODAL */}
  {selectedRoom && (
    <div className="modal">
      <div className="modal-content">
        <h2>{selectedRoom.name}</h2>

        <p>
          Total Energy:{" "}
          {getRoomEnergy(selectedRoom._id).toFixed(2)} Wh
        </p>

        <h3>Devices</h3>

        <div className="device-list">
          {devices
            .filter((d) => d.roomId?._id === selectedRoom._id)
            .map((d) => (
              <div key={d._id} className="device">
                <h4>{d.type}</h4>
                <p>Status: {d.status ? "ON" : "OFF"}</p>

                <button onClick={() => toggleDevice(d._id)}>
                  Toggle
                </button>
              </div>
            ))}
        </div>

        <button onClick={() => setSelectedRoom(null)}>Close</button>
      </div>
    </div>
  )}
</div>

);
}

export default App;
````

## frontend\src\App.test.js

````javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
````

## frontend\src\components\Alerts.js

````javascript
import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const getColor = (level) => {
  if (level === "critical") return "#ef4444"; // red
  if (level === "warning") return "#f59e0b"; // yellow
  return "#38bdf8"; // blue
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/alerts");
      setAlerts(res.data);
    } catch (err) {
      console.error("Alert fetch error:", err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // ðŸ” auto refresh every 10 sec
    const interval = setInterval(fetchAlerts, 10000);

    // âš¡ realtime update (optional)
    socket.on("newAlert", (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => {
      clearInterval(interval);
      socket.off("newAlert");
    };
  }, []);

  return (
    <div className="alerts-container">
      <h2>ðŸš¨ Alerts</h2>

      {alerts.length === 0 ? (
        <p className="no-alerts">No alerts detected</p>
      ) : (
        <div className="alerts-grid">
          {alerts.slice(0, 6).map((a) => (
            <div
              key={a._id}
              className="alert-card"
              style={{ borderLeft: `5px solid ${getColor(a.level)}` }}
            >
              <div className="alert-header">
                <strong>{a.level.toUpperCase()}</strong>
                <span>
                  {new Date(a.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <p>{a.message}</p>

              <div className="alert-meta">
                Room: {a.roomId?.name || "N/A"} | Device: {a.deviceId?.type || "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
````

## frontend\src\index.css

````css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
````

## frontend\src\index.js

````javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
````

## frontend\src\logo.svg

````xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 841.9 595.3"><g fill="#61DAFB"><path d="M666.3 296.5c0-32.5-40.7-63.3-103.1-82.4 14.4-63.6 8-114.2-20.2-130.4-6.5-3.8-14.1-5.6-22.4-5.6v22.3c4.6 0 8.3.9 11.4 2.6 13.6 7.8 19.5 37.5 14.9 75.7-1.1 9.4-2.9 19.3-5.1 29.4-19.6-4.8-41-8.5-63.5-10.9-13.5-18.5-27.5-35.3-41.6-50 32.6-30.3 63.2-46.9 84-46.9V78c-27.5 0-63.5 19.6-99.9 53.6-36.4-33.8-72.4-53.2-99.9-53.2v22.3c20.7 0 51.4 16.5 84 46.6-14 14.7-28 31.4-41.3 49.9-22.6 2.4-44 6.1-63.6 11-2.3-10-4-19.7-5.2-29-4.7-38.2 1.1-67.9 14.6-75.8 3-1.8 6.9-2.6 11.5-2.6V78.5c-8.4 0-16 1.8-22.6 5.6-28.1 16.2-34.4 66.7-19.9 130.1-62.2 19.2-102.7 49.9-102.7 82.3 0 32.5 40.7 63.3 103.1 82.4-14.4 63.6-8 114.2 20.2 130.4 6.5 3.8 14.1 5.6 22.5 5.6 27.5 0 63.5-19.6 99.9-53.6 36.4 33.8 72.4 53.2 99.9 53.2 8.4 0 16-1.8 22.6-5.6 28.1-16.2 34.4-66.7 19.9-130.1 62-19.1 102.5-49.9 102.5-82.3zm-130.2-66.7c-3.7 12.9-8.3 26.2-13.5 39.5-4.1-8-8.4-16-13.1-24-4.6-8-9.5-15.8-14.4-23.4 14.2 2.1 27.9 4.7 41 7.9zm-45.8 106.5c-7.8 13.5-15.8 26.3-24.1 38.2-14.9 1.3-30 2-45.2 2-15.1 0-30.2-.7-45-1.9-8.3-11.9-16.4-24.6-24.2-38-7.6-13.1-14.5-26.4-20.8-39.8 6.2-13.4 13.2-26.8 20.7-39.9 7.8-13.5 15.8-26.3 24.1-38.2 14.9-1.3 30-2 45.2-2 15.1 0 30.2.7 45 1.9 8.3 11.9 16.4 24.6 24.2 38 7.6 13.1 14.5 26.4 20.8 39.8-6.3 13.4-13.2 26.8-20.7 39.9zm32.3-13c5.4 13.4 10 26.8 13.8 39.8-13.1 3.2-26.9 5.9-41.2 8 4.9-7.7 9.8-15.6 14.4-23.7 4.6-8 8.9-16.1 13-24.1zM421.2 430c-9.3-9.6-18.6-20.3-27.8-32 9 .4 18.2.7 27.5.7 9.4 0 18.7-.2 27.8-.7-9 11.7-18.3 22.4-27.5 32zm-74.4-58.9c-14.2-2.1-27.9-4.7-41-7.9 3.7-12.9 8.3-26.2 13.5-39.5 4.1 8 8.4 16 13.1 24 4.7 8 9.5 15.8 14.4 23.4zM420.7 163c9.3 9.6 18.6 20.3 27.8 32-9-.4-18.2-.7-27.5-.7-9.4 0-18.7.2-27.8.7 9-11.7 18.3-22.4 27.5-32zm-74 58.9c-4.9 7.7-9.8 15.6-14.4 23.7-4.6 8-8.9 16-13 24-5.4-13.4-10-26.8-13.8-39.8 13.1-3.1 26.9-5.8 41.2-7.9zm-90.5 125.2c-35.4-15.1-58.3-34.9-58.3-50.6 0-15.7 22.9-35.6 58.3-50.6 8.6-3.7 18-7 27.7-10.1 5.7 19.6 13.2 40 22.5 60.9-9.2 20.8-16.6 41.1-22.2 60.6-9.9-3.1-19.3-6.5-28-10.2zM310 490c-13.6-7.8-19.5-37.5-14.9-75.7 1.1-9.4 2.9-19.3 5.1-29.4 19.6 4.8 41 8.5 63.5 10.9 13.5 18.5 27.5 35.3 41.6 50-32.6 30.3-63.2 46.9-84 46.9-4.5-.1-8.3-1-11.3-2.7zm237.2-76.2c4.7 38.2-1.1 67.9-14.6 75.8-3 1.8-6.9 2.6-11.5 2.6-20.7 0-51.4-16.5-84-46.6 14-14.7 28-31.4 41.3-49.9 22.6-2.4 44-6.1 63.6-11 2.3 10.1 4.1 19.8 5.2 29.1zm38.5-66.7c-8.6 3.7-18 7-27.7 10.1-5.7-19.6-13.2-40-22.5-60.9 9.2-20.8 16.6-41.1 22.2-60.6 9.9 3.1 19.3 6.5 28.1 10.2 35.4 15.1 58.3 34.9 58.3 50.6-.1 15.7-23 35.6-58.4 50.6zM320.8 78.4z"/><circle cx="420.9" cy="296.5" r="45.7"/><path d="M520.5 78.1z"/></g></svg>
````

## frontend\src\reportWebVitals.js

````javascript
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
````

## frontend\src\setupTests.js

````javascript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
````


