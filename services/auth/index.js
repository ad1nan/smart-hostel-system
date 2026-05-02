global.crypto = require("crypto").webcrypto;

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/authRoutes"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Auth Service DB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Auth Service running");
});

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Auth Service running on ${PORT}`);
});