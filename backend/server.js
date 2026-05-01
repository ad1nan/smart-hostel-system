const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

global.crypto = require("crypto").webcrypto;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/rooms", require("./routes/roomRoutes"));
app.use("/devices", require("./routes/deviceRoutes"));
app.use("/alerts", require("./routes/alertRoutes"));
app.use("/analytics", require("./routes/analyticsRoutes"));

mongoose.connect("mongodb://mongo:27017/hostelDB")
  .then(() => console.log("Mongo Connected"));

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);

const { processDevices } = require("./services/energyService");
const runAlerts = require("./services/alertEngine");

setInterval(() => processDevices(io), 5000);
setInterval(() => runAlerts(io), 30000);

server.listen(5000, () => console.log("Server running"));