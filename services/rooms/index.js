require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// routes
app.use("/rooms", require("./routes/roomRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Rooms Service DB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Rooms Service running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Rooms Service running on ${PORT}`);
});