import React from "react";
import Plot from 'react-plotly.js';
import { useLocation, Link } from "react-router-dom";


export default function DataPage() {
    const location = useLocation();
    const fig = location.state?.figure;
    const fig_table = location.state?.figure_table;

    if (!fig && !fig_table) {
        return (
            <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
                <h2>Insufficient Data to Display</h2>
                <Link to="/">Go Back</Link>
            </div>
        );
    }

    const columns = fig_table && fig_table.length > 0 ? Object.keys(fig_table[0]): [];

    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h2>Disk Usage Data</h2>
            <Plot
                data={fig.data}
                layout={fig.layout}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ displaylogo: false, responsive: true}}
            />
            <h3 style={{ marginTop: "2rem" }}>Disk Usage Details</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            border: "1px solid #ddd",
          }}
        >
          <thead style={{ backgroundColor: "#f0f0f0" }}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    textAlign: "left",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fig_table.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      padding: "8px",
                      border: "1px solid #ddd",
                    }}
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
            <div>
                <button> Send Reminder </button>
            </div>
            <div style= {{ marginTop:'1rem' }}>
                <Link to="/">Go Back</Link>
            </div>
        </div>
    );
}


