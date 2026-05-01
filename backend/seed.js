global.crypto = require("crypto").webcrypto;

const mongoose = require("mongoose");
const Room = require("./models/Room");
const Device = require("./models/Device");
const Energy = require("./models/Energy");
const Alert = require("./models/Alert");

mongoose.connect("mongodb://mongo:27017/hostelDB");

(async () => {
  try {
    // 🧹 Clear old data
    await Room.deleteMany();
    await Device.deleteMany();
    await Energy.deleteMany();
    await Alert.deleteMany();

    // 🏠 Create 3 rooms
    const rooms = await Room.create([
      { name: "Room 101" },
      { name: "Room 102" },
      { name: "Room 103" }
    ]);

    // ⚡ Add 1 Fan + 1 Light per room
    const devices = [];

    for (let room of rooms) {
      devices.push(
        {
          type: "Light",
          power: 60,
          roomId: room._id,
          status: false
        },
        {
          type: "Fan",
          power: 75,
          roomId: room._id,
          status: false
        }
      );
    }

    const createdDevices = await Device.insertMany(devices);

    // 🔥 OPTIONAL: generate sample energy (so analytics works)
    const energyData = [];

    for (let d of createdDevices) {
      energyData.push({
        deviceId: d._id,
        usage: Math.random() * 5 + 1, // realistic usage
        duration: Math.random() * 2 + 1,
        source: "seed"
      });
    }

    await Energy.insertMany(energyData);

    console.log("✅ Database seeded successfully");
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();