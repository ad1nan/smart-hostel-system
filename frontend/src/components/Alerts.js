import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const getColor = (level) => {
  if (level === "critical") return "#ef4444"; // red
  if (level === "warning") return "#f59e0b"; // yellow
  return "#38bdf8"; // blue
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/alerts");
      setAlerts(res.data);
    } catch (err) {
      console.error("Alert fetch error:", err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // 🔁 auto refresh every 10 sec
    const interval = setInterval(fetchAlerts, 10000);

    // ⚡ realtime update (optional)
    socket.on("newAlert", (alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => {
      clearInterval(interval);
      socket.off("newAlert");
    };
  }, []);

  return (
    <div className="alerts-container">
      <h2>🚨 Alerts</h2>

      {alerts.length === 0 ? (
        <p className="no-alerts">No alerts detected</p>
      ) : (
        <div className="alerts-grid">
          {alerts.slice(0, 6).map((a) => (
            <div
              key={a._id}
              className="alert-card"
              style={{ borderLeft: `5px solid ${getColor(a.level)}` }}
            >
              <div className="alert-header">
                <strong>{a.level.toUpperCase()}</strong>
                <span>
                  {new Date(a.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <p>{a.message}</p>

              <div className="alert-meta">
                Room: {a.roomId?.name || "N/A"} | Device: {a.deviceId?.type || "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;