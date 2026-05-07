import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/useAuth";

const GoogleCallbackPage = () => {
  const { setUser } = useAuth();
  const [message, setMessage] = useState("Processing Google login...");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    if (!token) {
      setMessage("Google login failed. No token returned.");
      return;
    }

    localStorage.setItem("ab_token", token);
    api
      .me()
      .then((res) => {
        setUser(res.user);
        navigate("/dashboard", { replace: true });
      })
      .catch((error) => {
        setMessage(error.message || "Unable to complete Google login.");
      });
  }, [navigate, searchParams, setUser]);

  return (
    <main className="page auth">
      <div className="card auth-card">
        <h2>Google Login</h2>
        <p className="state-text">{message}</p>
      </div>
    </main>
  );
};

export default GoogleCallbackPage;
