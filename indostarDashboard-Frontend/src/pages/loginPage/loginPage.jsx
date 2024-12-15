import React, { useState } from "react";
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBIcon,
} from "mdb-react-ui-kit";
import "./loginPage.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",

        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user to localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/upload");
        console.log("Login successful", data.user);
      } else {
        console.error("Login failed", data);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MDBContainer fluid>
      <MDBRow className="d-flex justify-content-center align-items-center h-100">
        <MDBCol col="12">
          <MDBCard
            className="bg-dark text-white my-5 mx-auto"
            style={{ borderRadius: "1rem", maxWidth: "400px" }}
          >
            <MDBCardBody className="p-5 d-flex flex-column align-items-center mx-auto w-100">
              <h2 className="fw-bold mb-2 text-uppercase">Login</h2>
              <p className="text-white-50 mb-5">
                Please enter your login and password!
              </p>

              {error && <p className="text-danger">{error}</p>}

              <form onSubmit={handleLogin}>
                <MDBInput
                  wrapperClass="mb-4  w-100"
                  style={{ marginLeft: "0 !important" }}
                  labelClass="text-white"
                  label="User Name"
                  id="username"
                  type="text"
                  size="lg"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <MDBInput
                  wrapperClass="mb-4  w-100"
                  labelClass="text-white"
                  label="Password"
                  id="password"
                  type="password"
                  size="lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <MDBBtn
                  type="submit"
                  className="mx-2 px-5"
                  color="light"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Login"}
                </MDBBtn>
              </form>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Login;
