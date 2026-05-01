const Room = require("../models/Room");
const Device = require("../models/Device");
const Energy = require("../models/Energy");

const defaultRoomNames = ["Room 101", "Room 102", "Room 103"];
const defaultDevices = [
  { type: "Light", power: 60 },
  { type: "Fan", power: 75 }
];

const getOrCreateRooms = async () => {
  const existingRooms = await Room.find();

  if (existingRooms.length > 0) {
    return existingRooms;
  }

  return Room.create(defaultRoomNames.map((name) => ({ name })));
};

const getOrCreateDevices = async (rooms) => {
  const devices = [];

  for (const room of rooms) {
    for (const deviceConfig of defaultDevices) {
      const device = await Device.findOneAndUpdate(
        { roomId: room._id, type: deviceConfig.type },
        {
          $setOnInsert: {
            roomId: room._id,
            type: deviceConfig.type,
            power: deviceConfig.power,
            status: false,
            startTime: null
          }
        },
        { new: true, upsert: true }
      );

      devices.push(device);
    }
  }

  return devices;
};

const buildEnergySeedRows = (devices) => {
  const now = Date.now();
  const rows = [];

  devices.forEach((device, deviceIndex) => {
    for (let hourOffset = 5; hourOffset >= 0; hourOffset -= 1) {
      const duration = 0.5 + hourOffset * 0.1;
      const usage = device.power * duration + (deviceIndex + 1) * 3;

      rows.push({
        deviceId: device._id,
        usage,
        duration,
        source: "auto-seed",
        timestamp: new Date(now - hourOffset * 60 * 60 * 1000)
      });
    }
  });

  return rows;
};

exports.ensureSeedData = async () => {
  const roomCount = await Room.countDocuments();
  const deviceCount = await Device.countDocuments();
  const energyCount = await Energy.countDocuments();
  const usableEnergy = await Energy.aggregate([
    {
      $lookup: {
        from: "devices",
        localField: "deviceId",
        foreignField: "_id",
        as: "device"
      }
    },
    { $unwind: "$device" },
    { $limit: 1 }
  ]);

  if (roomCount > 0 && deviceCount > 0 && energyCount > 0 && usableEnergy.length > 0) {
    console.log(`Seed skipped: ${energyCount} energy records already exist`);
    return;
  }

  const rooms = await getOrCreateRooms();
  const devices = await getOrCreateDevices(rooms);
  const energyRows = buildEnergySeedRows(devices);

  await Energy.insertMany(energyRows);

  console.log(
    `Auto-seeded analytics data: ${rooms.length} rooms, ${devices.length} devices, ${energyRows.length} energy records`
  );
};
