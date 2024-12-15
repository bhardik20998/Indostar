import React, { useEffect, useState } from "react";
import "./searchTable.css"; // Scoped CSS file for this component
import { useNavigate } from "react-router-dom";

const SearchTable = () => {
  const [data, setData] = useState(null); // Original data from API
  const [filteredData, setFilteredData] = useState(null); // Filtered rows to display
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(false); // Error state
  const columns = [
    "Name",
    "LAN ID",
    "Latitude",
    "Longitude",
    "Amenities Data",
    "Creation Date",
    "Review By",
    "Review",
  ]; // Include new columns

  const navigate = useNavigate();

  const handleRowClick = (row) => {
    navigate("/", { state: row }); // Set the clicked row's data
  };

  useEffect(() => {
    // Define async function to fetch data
    const fetchData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/example/", {
          method: "GET",
        }); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        // console.log(result);
        // Sort data by creation date (latest first)
        const sortedData = result.sort((a, b) => {
          const dateA = new Date(a.creation_date || "1970-01-01");
          const dateB = new Date(b.creation_date || "1970-01-01");
          return dateB - dateA; // Latest first
        });

        setData(sortedData); // Update state with sorted data
        setFilteredData(sortedData); // Initialize filtered data
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(true); // Set error state
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };

    fetchData(); // Call the function
  }, []);
  //   console.log(data);
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase(); // Get search query
    setSearchQuery(query); // Update search query state

    if (data && Array.isArray(data)) {
      const filtered = data.filter((row) => {
        const name = row["Name"] ? row["Name"].toLowerCase() : "";
        const lanId = row["LAN ID"] ? row["LAN ID"].toLowerCase() : "";
        return name.includes(query) || lanId.includes(query);
      });
      setFilteredData(filtered); // Update filtered rows
    }
  };

  if (loading) {
    return <div>Loading data...</div>;
  }

  if (error) {
    return <div>Error fetching data. Please try again later.</div>;
  }

  if (!data || !Array.isArray(data)) {
    return <div>No data available.</div>;
  }

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Name or LAN ID..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>
      <div className="table-container">
        <div className="table-horizontal-container">
          <table className="fixed-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} onClick={() => handleRowClick(row)}>
                  {columns.map((column) => {
                    if (column === "Amenities Data") {
                      const rawPlacesData =
                        row["raw_places_data"] &&
                        Object.keys(row["raw_places_data"]).length > 0;

                      return (
                        <td key={`${rowIndex}-${column}`}>
                          {rawPlacesData ? (
                            <span
                              style={{ color: "green", fontWeight: "bold" }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span>⏳</span>
                          )}
                        </td>
                      );
                    }
                    if (column === "Review By") {
                      const review =
                        row["username"] &&
                        Object.keys(row["username"]).length > 0;

                      return (
                        <td key={`${rowIndex}-${column}`}>
                          {review ? (
                            <span>
                              {" "}
                              <strong>{row["username"]}</strong>{" "}
                            </span>
                          ) : (
                            <span style={{ color: "red", fontWeight: "bold" }}>
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    }
                    if (column === "Review") {
                      const review =
                        row["comment"] &&
                        Object.keys(row["comment"]).length > 0;

                      return (
                        <td key={`${rowIndex}-${column}`}>
                          {review ? (
                            <span> {row["comment"]}</span>
                          ) : (
                            <span style={{ color: "red", fontWeight: "bold" }}>
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    }
                    if (column === "Creation Date") {
                      const creationDate = row["creation_date"]
                        ? new Date(row["creation_date"]).toLocaleDateString()
                        : "N/A";
                      return (
                        <td key={`${rowIndex}-${column}`}>{creationDate}</td>
                      );
                    }
                    return (
                      <td key={`${rowIndex}-${column}`}>
                        {row[column] || "N/A"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SearchTable;
