import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import { API_BASE_URL, formatFetchError } from "../utils/apiConfig";

const initialForm = { username: "", email: "", password: "" };
const initialOtpForm = { email: "", otp: "" };

const AuthPage = () => {
  const [form, setForm] = useState(initialForm);
  const [otpForm, setOtpForm] = useState(initialOtpForm);
  const [mode, setMode] = useState("login"); // login, register, otp, otp-verify
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const { isAuthenticated, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(
    () => location.state?.from?.pathname || "/dashboard",
    [location.state]
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "login") {
        const payload = { email: form.email, password: form.password };
        const data = await api.login(payload);
        setSession(data);
        navigate(redirectPath, { replace: true });
      } else if (mode === "register") {
        const payload = { username: form.username, email: form.email, password: form.password };
        const data = await api.register(payload);
        setSession(data);
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    if (!otpForm.email) {
      setMessage("Please enter your email");
      return;
    }
    
    setLoading(true);
    setMessage("");
    try {
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/otp/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpForm.email }),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("API URL:", API_BASE_URL);
        // eslint-disable-next-line no-console
        console.log("Error:", error);
        throw new Error(formatFetchError(error, "/otp/send-otp"));
      }

      // eslint-disable-next-line no-console
      console.log("Response:", response);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send OTP");
      }

      const data = await response.json();
      setMessage(data.message);
      setOtpSent(true);
      setOtpCountdown(300); // 5 minutes
      setMode("otp-verify");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otpForm.email || !otpForm.otp) {
      setMessage("Please enter email and OTP");
      return;
    }
    
    setLoading(true);
    setMessage("");
    try {
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/otp/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpForm.email, otp: otpForm.otp }),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("API URL:", API_BASE_URL);
        // eslint-disable-next-line no-console
        console.log("Error:", error);
        throw new Error(formatFetchError(error, "/otp/verify-otp"));
      }

      // eslint-disable-next-line no-console
      console.log("Response:", response);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "OTP verification failed");
      }

      const data = await response.json();
      setSession(data);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth">
      <div className="card auth-card">
        <h2>
          {mode === "login" ? "Login" : mode === "register" ? "Register" : "OTP Login"}
        </h2>
        {message && <p className="state-text">{message}</p>}

        {/* Standard Login/Register Form */}
        {(mode === "login" || mode === "register") && (
          <form onSubmit={submit}>
            {mode === "register" && (
              <input
                required
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={loading}
              />
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        )}

        {/* OTP Send Form */}
        {mode === "otp" && !otpSent && (
          <form onSubmit={handleSendOtp}>
            <input
              required
              type="email"
              placeholder="Enter your email"
              value={otpForm.email}
              onChange={(e) => setOtpForm({ ...otpForm, email: e.target.value })}
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* OTP Verify Form */}
        {mode === "otp-verify" && (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="email"
              placeholder="Email"
              value={otpForm.email}
              disabled
              style={{ opacity: 0.7 }}
            />
            <input
              required
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpForm.otp}
              onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              maxLength="6"
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            {otpCountdown > 0 && (
              <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
                OTP expires in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, "0")}
              </p>
            )}
            {otpCountdown === 0 && otpSent && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setOtpSent(false);
                  setMode("otp");
                  setOtpForm({ ...otpForm, otp: "" });
                }}
              >
                Request New OTP
              </button>
            )}
          </form>
        )}

        {/* Mode Switcher Buttons */}
        {(mode === "login" || mode === "register") && (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
                setForm(initialForm);
              }}
            >
              {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMode("otp");
                setMessage("");
                setForm(initialForm);
                setOtpForm(initialOtpForm);
                setOtpSent(false);
              }}
            >
              Login with OTP
            </button>
          </>
        )}

        {(mode === "otp" || mode === "otp-verify") && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMode("login");
              setMessage("");
              setOtpForm(initialOtpForm);
              setOtpSent(false);
              setOtpCountdown(0);
            }}
          >
            Back to Password Login
          </button>
        )}
      </div>
    </main>
  );
};

export default AuthPage;
