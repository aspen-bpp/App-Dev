import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {

  console.log("✅ Running src/pages/Login.js", new Date().toISOString());

  const [username, setUsername] = useState('' );
  const [password, setPassword] = useState('' );
  const [ip, setIp] = useState('' );
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch("https://127.0.0.1:5000/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, ip }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(`Login failed: ${json.message}`);
      return;
    }

    navigate("/Data", { state: { figure: json.figure_pie, figure_table: json.figure_table } });
  } catch (err) {
    console.error(err);
    alert("Request failed. If using Flask HTTPS adhoc, open https://127.0.0.1:5000/health in the browser and click Proceed once.");
  }

};

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleIpChange = (e) => {
    setIp(e.target.value);
  };

  return (
    <div style= {{ padding: '2rem', fontFamily: 'sans-serif'}}>
      <h2> Login with username, password and ip address of ETX instance</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username"
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              required
            />
          </label>
        </div>
        <div>
          <label>
            IP Adress:
            <input
              type="text"
              value={ip}
              onChange={handleIpChange}
              placeholder="IP Address"
              required
            />
          </label>
        </div>
        <div>
          <label>
            <button type="submit" style={{ marginTop: '1rem' }}>Login</button>
          </label>
        </div>
      </form>
    </div>
  );
}

export default Login;