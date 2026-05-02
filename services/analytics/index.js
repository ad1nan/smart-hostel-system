require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Analytics DB Connected"))
  .catch(err => console.log(err));

app.use("/analytics", require("./routes/analyticsRoutes"));

app.get("/", (req, res) => {
  res.send("Analytics Service running");
});

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`Analytics Service running on ${PORT}`);
});