import { useState, useEffect, useRef } from "react";
import React from "react";
import "./homePage.css";
import {
  FaHospital,
  FaMoneyBillWave,
  FaShoppingBag,
  FaTree,
  FaSchool,
  FaTrain,
  FaPlaneDeparture,
  FaBus,
  FaGasPump,
} from "react-icons/fa";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
const HomePage = () => {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState({
    hospital: false,
    bankATM: false,
    shopping_mall: false,
    park: false,
    school: false,
    train: false,
    airport: false,
    bus: false,
    gas: false,
  });
  const navigate = useNavigate();
  // console.log(selectedDeal);
  const variableMapping = {
    hospital: ["hospital", "doctor", "pharmacy"],
    bankATM: ["atm", "bank"],
    gas: ["gas_station"],
    shopping_mall: ["shopping_mall"],
    park: ["park"],
    school: ["primary_school", "secondary_school", "university"],
    train: ["train_station"],
    airport: ["airport"],
    bus: ["bus_station"],
  };
  const amenitiesList = [
    {
      name: "hospital",
      label: "Hospital",
      icon: (
        <FaHospital
          size={35}
          style={{ color: "#00796b", marginRight: "8px" }}
        />
      ),
    },
    {
      name: "bankATM",
      label: "Banks & ATM",
      icon: (
        <FaMoneyBillWave
          size={35}
          style={{ color: "#00796b", marginRight: "8px" }}
        />
      ),
    },
    {
      name: "shopping_mall",
      label: "Shopping Mall",
      icon: (
        <FaShoppingBag
          size={35}
          style={{ color: "#00796b", marginRight: "8px" }}
        />
      ),
    },
    {
      name: "park",
      label: "Park",
      icon: (
        <FaTree size={35} style={{ color: "#00796b", marginRight: "8px" }} />
      ),
    },
    {
      name: "school",
      label: "School",
      icon: (
        <FaSchool size={35} style={{ color: "#00796b", marginRight: "8px" }} />
      ),
    },
    {
      name: "train",
      label: "Train Station",
      icon: (
        <FaTrain size={35} style={{ color: "#00796b", marginRight: "8px" }} />
      ),
    },
    {
      name: "airport",
      label: "Airport",
      icon: (
        <FaPlaneDeparture
          size={35}
          style={{ color: "#00796b", marginRight: "8px" }}
        />
      ),
    },
    {
      name: "bus",
      label: "Bus Station",
      icon: (
        <FaBus size={35} style={{ color: "#00796b", marginRight: "8px" }} />
      ),
    },
    {
      name: "gas",
      label: "Gas Station",
      icon: (
        <FaGasPump size={35} style={{ color: "#00796b", marginRight: "8px" }} />
      ),
    },
  ];
  const location = useLocation();
  const [kmRange, setKmRange] = useState(2); // Default range is 5 KM
  const [showSlider, setShowSlider] = useState(false); // Toggle for slider popup
  const [comment, setComment] = useState("");

  const handleSliderChange = (event) => {
    setKmRange(event.target.value);
  };

  const toggleSliderPopup = () => {
    setShowSlider(!showSlider);
  };
  // setSelectedDeal();
  console.log(comment);
  useEffect(() => {
    if (location?.state) {
      setSelectedDeal(location.state); // Set selectedDeal from passed data
      if (location?.state?.comment) {
        setComment(location?.state?.comment);
      }
    }
    console.log(selectedDeal);
  }, []);

  const [imageSrc, setImageSrc] = useState("");

  const imagePath ='map_image.png'; ;
  

  useEffect(() => {
    const updateImage = () => {
      // Append a timestamp to the image path to prevent caching
      setImageSrc(`${selectedDeal
        ? `/map_image_${Number(selectedDeal.Latitude).toFixed(6)}_${Number(selectedDeal.Longitude).toFixed(6)}.png`
        : ""}?t=${new Date().getTime()}`);
    };

   ;
    // Set interval to check for image updates every second (1000 ms)
    const intervalId = setInterval(updateImage, 1000);

    // Initial image load
    updateImage();

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [imagePath, selectedDeal]);
  console.log(imageSrc)
  // Handle checkbox change
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedAmenities((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Function to get selected amenities
  const getSelectedAmenities = () => {
    return Object.keys(selectedAmenities).filter(
      (key) => selectedAmenities[key]
    );
  };
  const printOrDownload = async () => {
    try {
      // Select the entire webpage
      const element = document.body;

      // Capture the content as a canvas
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      // Option to print the webpage
      const link = document.createElement("a");
      link.href = imgData;
      link.download = "webpage-content.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Optional: Save as PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 page width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } catch (error) {
      console.error("Error capturing content:", error);
    }
  };
  const sendSelectedAmenities = async () => {
    // Filter selected amenities

    const selectedAmenitiesArray = getSelectedAmenities();

    const dataToSend = {
      Lat: selectedDeal?.Latitude,
      Long: selectedDeal?.Longitude,
      amenity: selectedAmenitiesArray,
      raw_places_data: selectedDeal?.raw_places_data,
    };
    // console.log(dataToSend);
    if (dataToSend.Lat) {
      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/get_google_data/",
          dataToSend,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error sending data to backend:", error);
      }
    }
  };
  const fetchCityStatePincode = async () => {
    if (!selectedDeal?.Latitude || !selectedDeal?.Longitude) {
      return;
    }
    // try {
    //   const response = await fetch(
    //     "http://127.0.0.1:8000/api/fetch_city_state_pincode/",
    //     {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify({
    //         Lat: selectedDeal?.Latitude,
    //         Long: selectedDeal?.Longitude,
    //       }),
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error("Failed to fetch location details.");
    //   }

    //   const data = await response.json();
    //   setLocationDetails(data);
    //   setError(null);
    // } catch (err) {
    //   setError(err.message);
    // }
  };
  console.log(locationDetails);
  useEffect(() => {

    sendSelectedAmenities();
    fetchCityStatePincode();
  }, [selectedDeal, selectedAmenities]);

  const googleMapsUrl = selectedDeal
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyCW2KbJR_ECwHKYd9H_v_su1-MCakvfNcY&q=${selectedDeal.Latitude},${selectedDeal.Longitude}&maptype=satellite`
    : "";
  const handleSave = async () => {
    if (!comment.trim()) {
      alert("Comment cannot be empty!");
      return;
    }

    // Retrieve user data from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.username) {
      alert("User not logged in. Please log in to save a comment.");
      return;
    }

    const filteredSelectedDeal = {
      Latitude: selectedDeal.Latitude,
      Longitude: selectedDeal.Longitude,
    };

    const payload = {
      comment,
      selectedDeal: filteredSelectedDeal, // Send only required data
      username: user.username, // Include the username in the payload
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/save-comment/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Comment saved successfully!", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000, // Duration of the toast in milliseconds
        });
        navigate("/searchtable");
      } else {
        const errorData = await response.json();
        if (errorData.message.includes("already exists")) {
          toast.warning(
            "This latitude and longitude is already present in the database.",
            {
              position: toast.POSITION.TOP_RIGHT,
              autoClose: 3000,
            }
          );
        } else {
          toast.error(`Failed to save comment: ${errorData.message}`, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the comment.", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      console.error("Error:", error);
    }
  };

  return (
    <div className="property-scorecard">
      <header className="header">
        <h1>Indostar Property Scorecard Dashboard</h1>
      </header>

      <div className="deal-details">
        <div style={{ display: "flex" }}>
          <p>Deal Id -</p>
          <div style={{ alignContent: "normal" }}>
            {location?.state?.["LAN ID"]}
          </div>
        </div>

        <p>
          Date - <span className="date">07-11-2024</span>
        </p>
        <button onClick={printOrDownload}>Print/Download Webpage</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "7fr 8fr",
          margin: "0px 16px",
          gap: "1em",
          height: "65vh",
        }}
      >
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr ",
              gap: "8px",
              height: "100%",
            }}
          >
            {" "}
            {selectedDeal && (
              <div className="customer-details" style={{}}>
                <div className="heading-container">
                  <h2 className="heading-dashboard">Property Details</h2>
                </div>
                <p>Property Type: {selectedDeal?.propertyType}</p>
                <p>Area: {selectedDeal["Land Area"]}</p>
                <p>BUA: {selectedDeal["BUA"]}</p>
                <p>Residual Age: {selectedDeal["Residual Age"]}</p>
                <p>Access Road Width: {selectedDeal["Access road width"]}</p>
                <p>Per sqft. Rate: {selectedDeal["Land Per sqft rate"]}</p>
                <p>Market Value: {selectedDeal["Market Value"]}</p>
                <p>Latitude: {selectedDeal?.Latitude}</p>
                <p>Longitude: {selectedDeal?.Longitude}</p>
                <p>City: {locationDetails?.city}</p>
                <p>State: {locationDetails?.state}</p>
                <p>PIN: {locationDetails?.pincode}</p>
              </div>
            )}
            <div className="amenities" style={{ display: "35%" }}>
              <div className="heading-container">
                <h2 className="heading-dashboard" onClick={toggleSliderPopup}>
                  Amenities {kmRange} KMs-Aerial
                </h2>
              </div>

              {/* Slider Popup */}

              <div className="slider-popup">
                <div className="popup-content">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={kmRange}
                    onChange={handleSliderChange}
                    className="slider"
                  />

                  {/* <button onClick={toggleSliderPopup}>Close</button> */}
                </div>
              </div>

              {amenitiesList?.map((amenity) => {
                const filteredData =
                  selectedDeal?.raw_places_data[amenity.name]?.filter(
                    (item) => parseFloat(item.distance_value) <= kmRange
                  ) || [];

                return (
                  <div
                    className="icon-div"
                    title={amenity.label}
                    key={amenity.name}
                  >
                    <div
                      style={{
                        display: "flex",
                        borderRight: "1px solid black",
                        justifyContent: "space-evenly",
                      }}
                    >
                      <input
                        type="checkbox"
                        name={amenity.name}
                        className="amenity-checkbox"
                        checked={selectedAmenities[amenity.name]}
                        onChange={handleCheckboxChange}
                      />

                      {amenity.icon}
                      {selectedDeal && (
                        <p
                          onClick={() => {
                            navigate("/aminityTable", {
                              state: filteredData,
                            });
                          }}
                        >
                          {filteredData.length}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-around",
                      }}
                    >
                      {selectedDeal && (
                        <p>
                          {isFinite(
                            Math.min(
                              ...filteredData.map((item) =>
                                parseFloat(item.distance_value)
                              )
                            )
                          )
                            ? `${Math.min(
                                ...filteredData.map((item) =>
                                  parseFloat(item.distance_value)
                                )
                              ).toFixed(2)} KMs`
                            : "NA"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ position: "relative", heigh: "100%", width: "100%" }}>
          <img
            src={imageSrc}
            alt="Map"
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              left: "0",
              top: "0",
            }}
          />
          <button
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              zIndex: "1",
            }}
            type="button"
            onClick={() => {
              window.scrollTo(0, document.body.scrollHeight);
            }}
          >
            Interactive Map
          </button>
        </div>
      </div>

      <div className="grid-container">
        {/* Left Section */}

        {/* Customer Details Section */}

        {/* Amenities Section */}
      </div>

      <div
        className="mapSection"
        style={{
          display: "grid",
          gridTemplateColumns: "2.45fr  8fr",
          marginLeft: "16px",
        }}
      >
        {/* Map Section */}
        <div
          style={{
            display: "grid",
            gap: "8px",
          }}
        >
          {" "}
          {/* Credit History Section */}
          {selectedDeal && (
            <div className="customer-details" style={{}}>
              <div className="heading-container">
                <h2 className="heading-dashboard">Property Scorecard</h2>
              </div>

              <p>In Progress, Coming Soon</p>
            </div>
          )}
          <div className="customer-details" style={{}}>
            <div>
              <div className="heading-container">
                <h2 className="heading-dashboard">Comment Section</h2>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",

                  height: "90%",
                }}
              >
                {/* Full-width text box */}
                <textarea
                  style={{
                    width: "100%",

                    height: "80%",
                    padding: "10px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    resize: "vertical",
                  }}
                  placeholder="Write your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>

                {/* Full-width button */}
                <button
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    backgroundColor: "#007BFF",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
          {/* {selectedDeal && (
            <div className="credit-history" style={{ display: "35%" }}>
              <div className="heading-container">
                <h2 className="heading-dashboard">Credit History</h2>
              </div>
             
              <p>CIBIL Score: {selectedDeal["CIBIL"]}</p>
              <p>Timely payments: {selectedDeal["Timley Payments"]}</p>
              <p>Credit Utilization: {selectedDeal["Credit Utilization"]}</p>
              <p>Credit Age:{selectedDeal["Credit Age"]}</p>
              <p>Enquiry: {selectedDeal["Past 6 months Enquiry"]}</p>
              <p>Active Accounts: {selectedDeal["Active accounts"]}</p>
            </div>
          )} */}
        </div>
        <div className="map" style={{ margin: "1em 16px" }}>
          <iframe
            style={{ border: 0, width: "100%", height: "100vh" }} // Changed to object syntax
            loading="lazy"
            allowFullScreen // You can keep it in camel case
            src={googleMapsUrl}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
