# Recovered Code Before App.js Fix

Target point: latest VS Code history entries at or before App.js history id `48g6.js` (`2026-05-01 12:03:44 +05:30`, UTC `2026-05-01 06:33:44`).
This is a VS Code local-history reconstruction, not a Git snapshot. Files without a matching VS Code history entry are listed separately at the bottom.
Excluded: node_modules, build output, package-lock.json, generated export files, and binary image/icon files.

## Recovered Files

### backend\.dockerignore

Recovered from VS Code history `k61a` saved at `2026-04-30 17:57:14 +05:30`.

````
node_modules
npm-debug.log
.env
````

### backend\controllers\analyticsController.js

Recovered from VS Code history `X8T7.js` saved at `2026-04-30 16:15:42 +05:30`.

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

### backend\controllers\deviceController.js

Recovered from VS Code history `SLuF.js` saved at `2026-05-01 01:12:08 +05:30`.

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

### backend\controllers\motionController.js

Recovered from VS Code history `fezH.js` saved at `2026-04-30 17:28:51 +05:30`.

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

### backend\controllers\roomController.js

Recovered from VS Code history `wIMW.js` saved at `2026-04-30 12:33:25 +05:30`.

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

### backend\Dockerfile

Recovered from VS Code history `qpcZ` saved at `2026-04-30 18:47:55 +05:30`.

````dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
````

### backend\models\Alert.js

Recovered from VS Code history `qaIn.js` saved at `2026-05-01 11:38:18 +05:30`.

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

  // âœ… NEW
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

### backend\models\Device.js

Recovered from VS Code history `yD0I.js` saved at `2026-05-01 09:18:24 +05:30`.

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

### backend\models\Energy.js

Recovered from VS Code history `3mfT.js` saved at `2026-04-30 16:00:32 +05:30`.

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

### backend\models\Room.js

Recovered from VS Code history `9pQe.js` saved at `2026-04-30 12:35:07 +05:30`.

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

### backend\package.json

Recovered from VS Code history `REXc.json` saved at `2026-04-30 20:38:01 +05:30`.

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

### backend\routes\alertRoutes.js

Recovered from VS Code history `o4th.js` saved at `2026-05-01 11:39:24 +05:30`.

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

### backend\routes\analyticsRoutes.js

Recovered from VS Code history `k5lx.js` saved at `2026-04-30 16:16:09 +05:30`.

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

### backend\routes\deviceRoutes.js

Recovered from VS Code history `hyAS.js` saved at `2026-05-01 01:11:46 +05:30`.

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

### backend\routes\motionRoutes.js

Recovered from VS Code history `sJ8A.js` saved at `2026-04-30 12:41:22 +05:30`.

````javascript
const express = require("express");
const router = express.Router();
const motionController = require("../controllers/motionController");

router.post("/:roomId", motionController.triggerMotion);

module.exports = router;
````

### backend\routes\roomRoutes.js

Recovered from VS Code history `B9z0.js` saved at `2026-04-30 12:35:24 +05:30`.

````javascript
const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");

router.post("/", roomController.createRoom);
router.get("/", roomController.getRooms);

module.exports = router;
````

### backend\seed.js

Recovered from VS Code history `Wwa1.js` saved at `2026-04-30 20:45:35 +05:30`.

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

### backend\server.js

Recovered from VS Code history `uIZg.js` saved at `2026-05-01 09:17:24 +05:30`.

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
const analyticsRoutes = require("./routes/analyticsRoutes");
const alertRoutes = require("./routes/alertRoutes");

app.use("/rooms", roomRoutes);
app.use("/devices", deviceRoutes); // âœ… ONLY ONCE
app.use("/motion", motionRoutes);
app.use("/analytics", analyticsRoutes);
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
cron.schedule("*/5 * * * * *", async () => {
  const io = app.get("io");
  await processDevices(io);
});

server.listen(5000, () => console.log("Server started on 5000"));
````

### backend\services\alertEngine.js

Recovered from VS Code history `SQG6.js` saved at `2026-05-01 11:39:01 +05:30`.

````javascript
const Device = require("../models/Device");
const Alert = require("../models/Alert");

// âœ… DEMO-FRIENDLY THRESHOLDS
const RUNTIME_THRESHOLD_SEC = 20;   // 20 sec
const ENERGY_THRESHOLD = 5;         // Wh

async function runAlertChecks(io) {
  try {
    const devices = await Device.find().populate("roomId");

    for (let device of devices) {

      // -------------------------
      // ðŸš¨ RULE 1: LONG RUNTIME
      // -------------------------
      if (device.lastOnTime) {
        const runtimeSec =
          (Date.now() - new Date(device.lastOnTime)) / 1000;

        if (runtimeSec > RUNTIME_THRESHOLD_SEC) {
          await createAlert(
            device,
            `âš ï¸ ${device.type} used for long duration (${Math.round(runtimeSec)} sec)`,
            "warning",
            io
          );
        }
      }

      // -------------------------
      // ðŸš¨ RULE 2: HIGH ENERGY
      // -------------------------
      if (device.energy && device.energy > ENERGY_THRESHOLD) {
        await createAlert(
          device,
          `ðŸ”¥ High energy usage (${device.energy.toFixed(2)} Wh)`,
          "critical",
          io
        );
      }
    }

  } catch (err) {
    console.error("Alert Engine Error:", err.message);
  }
}

// âœ… DUPLICATE PREVENTION
async function createAlert(device, message, level, io) {
  // âœ… CHECK EXISTING UNRESOLVED ALERT
  const existing = await Alert.findOne({
    deviceId: device._id,
    message,
    resolved: false
  });

  if (existing) return; // ðŸš« STOP SPAM

  const alert = await Alert.create({
    roomId: device.roomId?._id,
    deviceId: device._id,
    message,
    level
  });

  console.log("ðŸš¨ ALERT CREATED:", message);

  if (io) io.emit("newAlert", alert);
}

module.exports = runAlertChecks;
````

### backend\services\energyService.js

Recovered from VS Code history `YUrg.js` saved at `2026-05-01 11:20:48 +05:30`.

````javascript
const Device = require("../models/Device");
const Energy = require("../models/Energy");
const Alert = require("../models/Alert");

exports.processDevices = async (io) => {
  try {
    const devices = await Device.find({ status: true });

    const now = new Date();

    for (let d of devices) {
      if (!d.startTime) continue;

      const durationSec = (now - d.startTime) / 1000;
      const durationHours = durationSec / 3600;

      // âœ… Calculate incremental energy
      const energyUsed = d.power * durationHours;

      // âœ… Add energy
      d.energy = (d.energy || 0) + energyUsed;

      // âœ… Reset timer for next cycle
      d.startTime = new Date();

      await d.save();
    }

    if (io) io.emit("deviceUpdate");
  } catch (err) {
    console.error("Energy Service Error:", err.message);
  }
};
````

### docker-compose.yml

Recovered from VS Code history `r1tW.yml` saved at `2026-04-30 18:19:51 +05:30`.

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

volumes:
  mongo_data:
````

### frontend\.dockerignore

Recovered from VS Code history `JotN` saved at `2026-04-30 17:59:15 +05:30`.

````
node_modules
build
.env
````

### frontend\.env

Recovered from VS Code history `Dl8b` saved at `2026-04-30 20:59:33 +05:30`.

````
REACT_APP_API=http://backend:5000
````

### frontend\Dockerfile

Recovered from VS Code history `JdtJ` saved at `2026-04-30 17:58:30 +05:30`.

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

### frontend\package.json

Recovered from VS Code history `eaEl.json` saved at `2026-04-30 21:31:24 +05:30`.

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

### frontend\src\App.css

Recovered from VS Code history `7aPs.css` saved at `2026-05-01 11:41:53 +05:30`.

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
````

### frontend\src\App.js

Recovered from VS Code history `48g6.js` saved at `2026-05-01 12:03:44 +05:30`.

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

### frontend\src\components\Alerts.js

Recovered from VS Code history `s7IB.js` saved at `2026-05-01 09:01:38 +05:30`.

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

### frontend\src\docker-compose.yml

Recovered from VS Code history `YDEw.yml` saved at `2026-04-30 18:18:13 +05:30`.

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

volumes:
  mongo_data:
````

### root\docker-compose.yml

Recovered from VS Code history `diU2.yml` saved at `2026-04-30 18:16:21 +05:30`.

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

volumes:
  mongo_data:
````

## Current Files Without Matching Pre-Fix VS Code History

- device-service\controllers\deviceController.js
- device-service\Dockerfile
- device-service\models\Device.js
- device-service\models\Energy.js
- device-service\models\Room.js
- device-service\package.json
- device-service\routes\deviceRoutes.js
- device-service\server.js
- frontend\.gitignore
- frontend\public\index.html
- frontend\public\manifest.json
- frontend\public\robots.txt
- frontend\README.md
- frontend\src\App.test.js
- frontend\src\index.css
- frontend\src\index.js
- frontend\src\logo.svg
- frontend\src\reportWebVitals.js
- frontend\src\setupTests.js
