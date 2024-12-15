import React from "react";
import { useLocation } from "react-router-dom";
import "./aminityTable.css";

const AminityTable = () => {
  const location = useLocation();
  let data = location.state;

  // Ensure data is valid
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No data available!</p>;
  }

  // Flatten the nested "location" key
  data = data.map((item) => ({
    ...item,
    latitude: item.location?.latitude || "N/A",
    longitude: item.location?.longitude || "N/A",
  }));

  // Remove the "location" key after extracting latitude and longitude
  data = data.map(({ location, ...rest }) => rest);

  // Extract column headers dynamically
  const columns = Object.keys(data[0]);

  return (
    <div className="responsive-table-wrapper">
      <h1>Aminities Information Table</h1>
      <div className="table-wrapper" style={{ overflowX: "auto" }}>
        <table
          className="fl-table"
          border="1"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} style={{ padding: "8px", textAlign: "left" }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    style={{ padding: "8px", textAlign: "left" }}
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AminityTable;
