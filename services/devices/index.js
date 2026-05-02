require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// routes
app.use("/devices", require("./routes/deviceRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Devices Service DB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Devices Service running");
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Devices Service running on ${PORT}`);
});