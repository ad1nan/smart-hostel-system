import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io as createSocket } from "socket.io-client";
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

axios.defaults.timeout = 5000;

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:4000").replace(/\/$/, "");

const chartColors = ["#22c55e", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#14b8a6"];

function App() {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [roomAnalytics, setRoomAnalytics] = useState([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState([]);
  const [timeSeriesAnalytics, setTimeSeriesAnalytics] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [kpi, setKpi] = useState({
    totalEnergy: 0,
    activeDevices: 0,
    activeAlerts: 0,
    topRoom: ""
  });

  const fetchData = useCallback(async () => {
    try {
      const [
        roomsRes,
        devicesRes,
        alertsRes,
        heatmapRes,
        deviceAnalyticsRes,
        timeSeriesRes
      ] = await Promise.all([
        axios.get(`${API_URL}/rooms`),
        axios.get(`${API_URL}/devices`),
        axios.get(`${API_URL}/alerts`),
        axios.get(`${API_URL}/analytics/heatmap`),
        axios.get(`${API_URL}/analytics/devices`),
        axios.get(`${API_URL}/analytics/timeseries`)
      ]);

      setRooms(roomsRes.data);
      setDevices(devicesRes.data);
      setAlerts(alertsRes.data);
      setRoomAnalytics(heatmapRes.data);
      setDeviceAnalytics(deviceAnalyticsRes.data);
      setTimeSeriesAnalytics(timeSeriesRes.data);
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const socket = createSocket("http://localhost:5000", {
    transports: ["websocket"]
   });

    const refreshDashboard = () => fetchData();
    const pollId = setInterval(refreshDashboard, 5000);

    socket.on("alert_update", refreshDashboard);
    socket.on("analytics_update", refreshDashboard);
    socket.on("device_update", refreshDashboard);

    return () => {
      clearInterval(pollId);
      socket.off("alert_update", refreshDashboard);
      socket.off("analytics_update", refreshDashboard);
      socket.off("device_update", refreshDashboard);
      socket.disconnect();
    };
  }, [fetchData]);

  useEffect(() => {
    if (rooms.length === 0) return;

    const totalEnergy = roomAnalytics.reduce(
      (sum, r) => sum + (r.totalUsage || r.totalEnergy || 0),
      0
    );

    const activeDevices = devices.filter((d) => d.status).length;
    const activeAlerts = alerts.length;

    let maxRoom = "";
    let maxEnergy = 0;

    roomAnalytics.forEach((r) => {
      const usage = r.totalUsage || r.totalEnergy || 0;

      if (usage > maxEnergy) {
        maxEnergy = usage;

        const room = rooms.find(
          (rm) => rm._id === r.roomId || rm._id === r._id
        );

        maxRoom = room?.name || "";
      }
    });

    setKpi({
      totalEnergy: totalEnergy.toFixed(2),
      activeDevices,
      activeAlerts,
      topRoom: maxRoom
    });

  }, [roomAnalytics, devices, alerts, rooms]);

  const dismissAlert = async (id) => {
    await axios.patch(`${API_URL}/alerts/${id}/resolve`);
    fetchData();
  };

  const getRoomEnergy = (roomId) => {
    const roomData = roomAnalytics.find(
      (item) => item.roomId === roomId || item._id === roomId
    );

    return Number(roomData?.totalUsage || roomData?.totalEnergy || 0);
  };

  const energies = rooms.map((room) => getRoomEnergy(room._id));
  const maxEnergy = Math.max(...energies, 1);

  const getColor = (value) => {
    const ratio = value / maxEnergy;

    if (ratio < 0.3) return "#22c55e";
    if (ratio < 0.6) return "#f97316";
    return "#ef4444";
  };

  const toggleDevice = async (id) => {
  try {
    await axios.post(`${API_URL}/devices/toggle/${id}`);
    fetchData();
  } catch (err) {
    console.error("Toggle failed:", err.response?.data || err.message);
  }
  };

  const roomChartData = {
    labels: rooms.map((room) => room.name),
    datasets: [
      {
        label: "Energy Usage",
        data: energies,
        backgroundColor: rooms.map((_, index) => chartColors[index % chartColors.length])
      }
    ]
  };

  const deviceChartData = {
    labels: deviceAnalytics.map((item) => item.deviceType),
    datasets: [
      {
        label: "Energy Usage",
        data: deviceAnalytics.map((item) => item.totalUsage || item.totalEnergy || 0),
        backgroundColor: "#3b82f6"
      }
    ]
  };

  const timeSeriesChartData = {
    labels: timeSeriesAnalytics.map((item) => item.period),
    datasets: [
      {
        label: "Energy Usage",
        data: timeSeriesAnalytics.map((item) => item.totalUsage || item.totalEnergy || 0),
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        tension: 0.35
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#e2e8f0" }
      }
    }
  };

  const axisChartOptions = {
    ...pieChartOptions,
    scales: {
      x: {
        ticks: { color: "#cbd5e1" },
        grid: { color: "rgba(148, 163, 184, 0.18)" }
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#cbd5e1" },
        grid: { color: "rgba(148, 163, 184, 0.18)" }
      }
    }
  };

  const hasRoomUsage = energies.some((value) => value > 0);
  const hasDeviceUsage = deviceAnalytics.some((item) => (item.totalUsage || item.totalEnergy || 0) > 0);
  const hasTimeSeriesUsage = timeSeriesAnalytics.some((item) => (item.totalUsage || item.totalEnergy || 0) > 0);

  const alertRoomIds = useMemo(
    () =>
      new Set(
        alerts
          .map((alert) => alert.roomId?._id || alert.roomId)
          .filter(Boolean)
      ),
    [alerts]
  );

  return (
    <div className="app">
      <h1>Smart Hostel Dashboard</h1>

      <section>
        <h2>Overview</h2>
        <div className="kpi-container">
          <div className="kpi-card">
            <h3>Total Energy</h3>
            <p>{kpi.totalEnergy} Wh</p>
          </div>
          <div className="kpi-card">
            <h3>Active Devices</h3>
            <p>{kpi.activeDevices}</p>
          </div>
          <div className="kpi-card">
            <h3>Active Alerts</h3>
            <p>{kpi.activeAlerts}</p>
          </div>
          <div className="kpi-card">
            <h3>Top Room</h3>
            <p>{kpi.topRoom || "N/A"}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Alerts</h2>
        {alerts.length === 0 ? (
          <p className="empty-state">No alerts</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert._id} className={`alert ${alert.level}`}>
              <span>{alert.message}</span>
              <button onClick={() => dismissAlert(alert._id)}>X</button>
            </div>
          ))
        )}
      </section>

      <section>
        <h2>Room Heatmap</h2>
        <div className="heatmap">
          {rooms.map((room) => {
            const energy = getRoomEnergy(room._id);

            return (
              <button
                key={room._id}
                className={`heat-card ${alertRoomIds.has(room._id) ? "has-alert" : ""}`}
                style={{ background: getColor(energy) }}
                onClick={() => setSelectedRoom(room)}
              >
                <span>{room.name}</span>
                <strong>{energy.toFixed(2)} Wh</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="analytics-grid">
        <div className="card chart-card">
          <h2>Energy by Room</h2>
          {hasRoomUsage ? <Pie data={roomChartData} options={pieChartOptions} /> : <p>No data</p>}
        </div>

        <div className="card chart-card">
          <h2>Energy by Device</h2>
          {hasDeviceUsage ? <Bar data={deviceChartData} options={axisChartOptions} /> : <p>No data</p>}
        </div>

        <div className="card chart-card wide">
          <h2>Energy Over Time</h2>
          {hasTimeSeriesUsage ? <Line data={timeSeriesChartData} options={axisChartOptions} /> : <p>No data</p>}
        </div>
      </section>

      {selectedRoom && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedRoom.name}</h2>

            {devices
              .filter((device) => {
                const roomId = device.roomId?._id || device.roomId;
                return roomId === selectedRoom._id;
              })
              .map((device) => (
                <div key={device._id}>
                  {device.type} - {device.status ? "ON" : "OFF"}
                  <button onClick={() => toggleDevice(device._id)}>Toggle</button>
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