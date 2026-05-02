const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27018/hostelDB")
  .then(() => console.log("Alerts Service DB Connected"))
  .catch(err => console.log(err));

app.use("/alerts", require("./routes/alertRoutes"));

app.listen(5003, () => {
  console.log("Alerts Service running on 5003");
});