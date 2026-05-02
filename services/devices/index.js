const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/devices", require("./routes/deviceRoutes"));

mongoose.connect("mongodb://localhost:27017/hostelDB")
  .then(() => console.log("Devices Service DB Connected"));

app.listen(5002, () => console.log("Devices Service running on 5002"));