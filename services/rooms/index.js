const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/rooms", require("./routes/roomRoutes"));

mongoose.connect("mongodb://localhost:27017/hostelDB")
  .then(() => console.log("Rooms Service DB Connected"));

app.listen(5001, () => console.log("Rooms Service running on 5001"));