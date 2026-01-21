import React from "react";
import Plot from 'react-plotly.js';
import { useLocation, Link } from "react-router-dom";


export default function DataPage() {
    const location = useLocation();
    const fig = location.state?.figure;
    const fig_table = location.state?.figure_table;
    const png_path = location.state?.png_path;
    const table_path = location.state?.table_path;

    if (!fig && !fig_table) {
        return (
            <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
                <h2>Insufficient Data to Display</h2>
                <Link to="/">Go Back</Link>
            </div>
        );
    }

    const columns = fig_table && fig_table.length > 0 ? Object.keys(fig_table[0]): [];

    console.log("Reminder payload preview:", {
      fig,
      fig_table_len: fig_table?.length,
      first_row: fig_table?.[0],
    });

    const handleSendReminder = async () => {
      try {
        const res = await fetch("https://127.0.0.1:5000/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: "send_reminder",
            payload: {
              png_path,
              table_path,
            },
          }),
        });

        const json = await res.json();
        if (!json.ok) {
          alert(json.message);
          return;
        }

        alert("Slack reminder sent!");
      } catch (err) {
        console.error(err);
        alert(`Failed to send reminder: ${err?.mesage ?? err}`);
      }
    };

    return (

  <div className="min-h-screen bg-slate-100">
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Disk Usage</h1>
          <p className="mt-1 text-sm text-slate-600">
            Summary chart and detailed filesystem breakdown.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            ← Back
          </Link>

          <button onClick={handleSendReminder}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Reminder
          </button>
        </div>
      </div>

      {/* If missing data */}
      {(!fig || !fig_table) ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Insufficient Data</h2>
          <p className="mt-2 text-sm text-slate-600">
            No figure or table data was passed to this page. Try logging in again.
          </p>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Go back
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Chart card */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Usage Distribution
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Updated on login
              </span>
            </div>

            <div className="mt-4 h-[420px]">
              <Plot
                data={fig.data}
                layout={{
                  ...fig.layout,
                  autosize: true,
                  margin: { l: 20, r: 20, t: 40, b: 20 },
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ displaylogo: false, responsive: true }}
              />
            </div>
          </div>

          {/* Table card */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Filesystem Details
              </h2>
              <span className="text-xs text-slate-500">
                {fig_table.length} rows
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700 border-b border-slate-200"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {fig_table.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      {columns.map((col) => (
                        <td
                          key={col}
                          className="whitespace-nowrap px-4 py-3 text-slate-700"
                        >
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Tip: Scroll horizontally if your filesystem names are long.
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

}


