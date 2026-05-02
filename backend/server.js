const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

global.crypto = require("crypto").webcrypto;

const { processDevices } = require("./services/energyService");
const runAlerts = require("./services/alertEngine");
const { ensureSeedData } = require("./services/seedService");

const app = express();
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27018/hostelDB";
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/rooms", require("./routes/roomRoutes"));
app.use("/devices", require("./routes/deviceRoutes"));
app.use("/alerts", require("./routes/alertRoutes"));
app.use("/analytics", require("./routes/analyticsRoutes"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectMongo = async (attempt = 1) => {
  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoUri}`);
  } catch (err) {
    console.error(`MongoDB connection failed on attempt ${attempt}:`, err.message);

    if (attempt >= 10) {
      throw err;
    }

    await delay(3000);
    return connectMongo(attempt + 1);
  }
};

const startServer = async () => {
  try {
    await connectMongo();
    await ensureSeedData();

    processDevices(io);
    runAlerts(io);

    setInterval(() => processDevices(io), 5000);
    setInterval(() => runAlerts(io), 5000);

    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Backend startup failed:", err);
    process.exit(1);
  }
};

startServer();
