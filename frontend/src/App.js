import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

function App() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const roomsRes = await axios.get("http://localhost:5000/rooms");
    const devicesRes = await axios.get("http://localhost:5000/devices");
    const alertsRes = await axios.get("http://localhost:5000/alerts");
    const heatmapRes = await axios.get("http://localhost:5000/analytics/heatmap");

    setRooms(roomsRes.data);
    setDevices(devicesRes.data);
    setAlerts(alertsRes.data);
    setHeatmap(heatmapRes.data);   // ✅ ADD THIS

  } catch (err) {
    console.error("Fetch error:", err);
  }
};

  const dismissAlert = async (id) => {
    await axios.patch(`http://localhost:5000/alerts/${id}/resolve`);
    fetchData();
  };

const getRoomEnergy = (roomId) => {
  const roomData = heatmap.find((h) => h._id === roomId);
  return roomData ? roomData.totalUsage : 0;
};

  const energies = rooms.map((r) => getRoomEnergy(r._id));
  const max = Math.max(...energies, 1);

  const getColor = (value) => {
    const ratio = value / max;
    if (ratio < 0.3) return "#22c55e";
    if (ratio < 0.6) return "#f97316";
    return "#ef4444";
  };

  const toggleDevice = async (id) => {
    await axios.post(`http://localhost:5000/devices/toggle/${id}`);
    fetchData();
  };

  return (
    <div className="app">
      <h1>⚡ Smart Hostel Dashboard</h1>

      <h2>🚨 Alerts</h2>
      {alerts.length === 0 ? (
        <p>No alerts</p>
      ) : (
        alerts.map((a) => (
          <div key={a._id} className={`alert ${a.level}`}>
            <span>{a.message}</span>
            <button onClick={() => dismissAlert(a._id)}>✖</button>
          </div>
        ))
      )}

      <h2>🔥 Room Heatmap</h2>
      <div className="heatmap">
        {rooms.map((room) => {
          const energy = getRoomEnergy(room._id);

          return (
            <div
              key={room._id}
              className="heat-card"
              style={{ background: getColor(energy) }}
              onClick={() => setSelectedRoom(room)}
            >
              <h3>{room.name}</h3>
              <p>{energy.toFixed(2)} Wh</p>
            </div>
          );
        })}
      </div>

      {selectedRoom && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedRoom.name}</h2>

            <h3>Devices</h3>
            {devices
              .filter((d) => d.roomId?._id === selectedRoom._id)
              .map((d) => (
                <div key={d._id}>
                  {d.type} — {d.status ? "ON" : "OFF"}
                  <button onClick={() => toggleDevice(d._id)}>
                    Toggle
                  </button>
                </div>
              ))}

            <button onClick={() => setSelectedRoom(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;