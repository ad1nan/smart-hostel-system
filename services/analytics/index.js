const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SAME DB (important)
mongoose.connect("mongodb://localhost:27018/hostelDB")
  .then(() => console.log("Analytics DB Connected"))
  .catch(err => console.log(err));

app.use("/analytics", require("./routes/analyticsRoutes"));

app.listen(5004, () => {
  console.log("Analytics Service running on 5004");
});