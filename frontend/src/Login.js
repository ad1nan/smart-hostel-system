// src/Login.js
import { useState } from "react";
import axios from "axios";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5005/auth/login", // ✅ AUTH SERVICE
        {
          username,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);

      onLogin();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="app">
      <h1>Login</h1>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}