import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage/homePage";
import Login from "./pages/loginPage/loginPage";
import UploadPage from "./pages/upload/upload";
import AminityTable from "./pages/eminityTable/aminityTable";
import SearchTable from "./pages/searchTable/searchTable";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function App() {
  return (
    <>
      <ToastContainer
        position="top-right" // Position of the toast
        autoClose={3000} // Duration the toast will be visible
        hideProgressBar={false} // Show progress bar
        newestOnTop={false} // Display newest toasts on top
        closeOnClick={true} // Allow closing the toast by clicking
        rtl={false} // If you want right-to-left text direction
      />
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aminitytable"
            element={
              <ProtectedRoute>
                <AminityTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/searchtable"
            element={
              <ProtectedRoute>
                <SearchTable />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
