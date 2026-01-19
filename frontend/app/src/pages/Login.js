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

    navigate("/Data", { state: { figure: json.figure_pie, figure_table: json.figure_table, png_path: json.png_path, table_path: json.table_path } });
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
  <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-900 text-center">
          ETX Login
        </h1>
        <p className="mt-2 text-sm text-slate-600 text-center">
          Enter your username, password and ETX instance IP.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              IP Address
            </label>
            <input
              type="text"
              value={ip}
              onChange={handleIpChange}
              placeholder="IP address"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-slate-500">
              Tip: use the private IP that your SSH client connects to.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white font-medium
                       hover:bg-blue-700 active:bg-blue-800 transition
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        If login fails, check the IP/credentials and that the backend is running.
      </p>
    </div>
  </div>
);
}

export default Login;