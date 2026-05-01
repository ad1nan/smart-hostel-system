const mongoose = require("mongoose");

global.crypto = require("crypto").webcrypto;

const { ensureSeedData } = require("./services/seedService");

const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017/hostelDB";

(async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoUri}`);

    await ensureSeedData();

    console.log("Seed check completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
