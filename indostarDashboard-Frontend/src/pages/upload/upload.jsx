import React, { useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { formFields } from "./constants"; // Assuming you have a constants file
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UploadPage = () => {
  toast.configure();
  const [pdfFile, setPdfFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [showLatLngFields, setShowLatLngFields] = useState(false);
  const [formValues, setFormValues] = useState({});
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  // console.log(formValues);
  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);

      // Create a URL for the selected file for preview
      const filePreviewUrl = URL.createObjectURL(file);
      setFileUrl(filePreviewUrl);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  // Handle input change for form fields
  const handleInputChange = (event) => {
    const { id, value } = event.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const handleCheck = async () => {
    if (!pdfFile) {
      alert("No file selected!");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    const response = await fetch(
      "http://localhost:8000/api/extraction_from_pdf/",
      {
        method: "POST",
        body: formData,
      }
    );
    const latlong = await response.json();
    setShowLatLngFields(true);
    if (latlong.latitude) {
      setFormValues((prevValues) => ({
        ...prevValues,
        ["Latitude"]: latlong.latitude,
        ["Longitude"]: latlong.longitude,
      }));
    }
  };

  // Handle form submission to upload file to backend
  const handleUpload = async () => {
    if (!pdfFile) {
      alert("No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    // Append all form values to FormData
    Object.entries(formValues).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch("http://localhost:8000/api/upload/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.save) {
          console.log("Success");
          alert(data.message);
          navigate("/searchtable");
        } else {
          console.log("Fail");
          alert(data.message);

          // Show latitude and longitude fields
          setShowLatLngFields(true);
        }

        console.log("File path on server:", data.file_path);
      } else {
        alert("Failed to upload the file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">
            Upload the Information
          </h2>
          <div className="row">
            {/* Render form fields dynamically */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="propertyType" className="form-label">
                  Property Type
                </label>
                <select
                  className="form-control"
                  id="propertyType"
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled selected>
                    Select Property Type
                  </option>
                  <option value="Plot">Plot</option>
                  <option value="Plot & Building">Plot & Building</option>
                  <option value="Apartment">Apartment</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="date" className="form-label">
                  Date
                </label>
                <div>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              {formFields.slice(0, 3).map((field) => (
                <div className="mb-3" key={field.id}>
                  <label htmlFor={field.id} className="form-label">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    className="form-control"
                    id={field.id}
                    placeholder={field.placeholder}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              ))}

              <div>
                <div className="mb-3">
                  <label htmlFor="latitude" className="form-label">
                    Latitude
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="Latitude"
                    placeholder="Enter latitude"
                    value={formValues.Latitude || ""}
                    onChange={handleInputChange}
                    required={showLatLngFields}
                    disabled={!showLatLngFields}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              {formFields.slice(3).map((field) => (
                <div className="mb-3" key={field.id}>
                  <label htmlFor={field.id} className="form-label">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    className="form-control"
                    id={field.id}
                    placeholder={field.placeholder}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              ))}

              <div>
                <div className="mb-3">
                  <label htmlFor="longitude" className="form-label">
                    Longitude
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="Longitude"
                    placeholder="Enter longitude"
                    value={formValues.Longitude || ""}
                    onChange={handleInputChange}
                    required={showLatLngFields}
                    disabled={!showLatLngFields}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">PDF Uploader and Viewer</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="form-control mb-4"
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn btn-primary" onClick={handleCheck}>
              Upload PDF
            </button>
            <button className="btn btn-primary" onClick={handleUpload}>
              Proceed
            </button>
          </div>

          {fileUrl && (
            <div
              className="border rounded bg-light p-3 mt-3"
              style={{ height: "600px" }}
            >
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={fileUrl}
                  plugins={[defaultLayoutPluginInstance]}
                />
              </Worker>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
