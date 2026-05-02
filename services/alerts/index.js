require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Alerts Service DB Connected"))
  .catch(err => console.log(err));

app.use("/alerts", require("./routes/alertRoutes"));

app.get("/", (req, res) => {
  res.send("Alerts Service running");
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`Alerts Service running on ${PORT}`);
});