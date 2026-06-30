import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/useAuth";

const initialLogin = { identifier: "", password: "" };
const initialRegister = {
  fullName: "",
  phoneNumber: "",
  whatsappNumber: "",
  password: "",
  confirmPassword: "",
  bgmiUid: "",
  acceptTerms: false,
};

const AuthPage = () => {
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [mode, setMode] = useState("login");
  const [loginMethod, setLoginMethod] = useState("phone");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(
    () => location.state?.from?.pathname || "/tournaments",
    [location.state]
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handlePhoneChange = (field, value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setRegisterForm((prev) => ({ ...prev, [field]: digits }));
  };

  const buildLoginPayload = () => {
    const identifier = loginForm.identifier.trim();
    const payload = { password: loginForm.password };
    if (loginMethod === "email" || identifier.includes("@")) {
      payload.email = identifier.toLowerCase();
    } else {
      payload.phoneNumber = identifier.replace(/\D/g, "").slice(-10);
    }
    return payload;
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    const payload = buildLoginPayload();
    if (!payload.email && (!payload.phoneNumber || payload.phoneNumber.length !== 10)) {
      setMessage(loginMethod === "email" ? "Enter a valid email." : "Enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await api.login(payload);
      setSession(data);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    if (!registerForm.acceptTerms) {
      setMessage("You must accept the terms and conditions.");
      return;
    }
    if (registerForm.phoneNumber.length !== 10) {
      setMessage("Enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        fullName: registerForm.fullName.trim(),
        phoneNumber: registerForm.phoneNumber,
        whatsappNumber: registerForm.whatsappNumber || registerForm.phoneNumber,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
        bgmiUid: registerForm.bgmiUid.trim(),
        acceptTerms: true,
      };
      const data = await api.register(payload);
      setSession(data);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth v2-page">
      <div className="card auth-card v2-auth-card">
        <h2>{mode === "login" ? "Login" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {mode === "login"
            ? loginMethod === "email"
              ? "Sign in with your email (legacy account)"
              : "Sign in with phone number and password"
            : "Register with phone — no email required"}
        </p>
        {message && <p className="state-text">{message}</p>}

        {mode === "login" ? (
          <form onSubmit={submitLogin} className="v2-form">
            <label className="v2-label">
              {loginMethod === "email" ? "Email" : "Phone Number"}
              <input
                required
                type={loginMethod === "email" ? "email" : "tel"}
                inputMode={loginMethod === "email" ? "email" : "numeric"}
                placeholder={loginMethod === "email" ? "you@example.com" : "10-digit mobile number"}
                value={loginForm.identifier}
                onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                disabled={loading}
                className="v2-input"
                autoComplete={loginMethod === "email" ? "email" : "tel"}
              />
            </label>
            <label className="v2-label">
              Password
              <input
                required
                type="password"
                placeholder="Your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={loading}
                className="v2-input"
                autoComplete="current-password"
              />
            </label>
            <button className="btn btn-primary v2-btn-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
            <button
              type="button"
              className="btn btn-tertiary v2-btn-full"
              onClick={() => {
                setLoginMethod(loginMethod === "phone" ? "email" : "phone");
                setLoginForm(initialLogin);
                setMessage("");
              }}
            >
              {loginMethod === "phone" ? "Login with email instead" : "Login with phone instead"}
            </button>
            <p className="auth-forgot">
              Forgot password?{" "}
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">
                Contact Admin
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="v2-form">
            <label className="v2-label">
              Full Name
              <input
                required
                placeholder="Your full name"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                disabled={loading}
                className="v2-input"
              />
            </label>
            <label className="v2-label">
              Phone Number
              <input
                required
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={registerForm.phoneNumber}
                onChange={(e) => handlePhoneChange("phoneNumber", e.target.value)}
                disabled={loading}
                className="v2-input"
              />
            </label>
            <label className="v2-label">
              WhatsApp Number
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Same as phone (default)"
                value={registerForm.whatsappNumber}
                onChange={(e) => handlePhoneChange("whatsappNumber", e.target.value)}
                disabled={loading}
                className="v2-input"
              />
            </label>
            <label className="v2-label">
              Password
              <input
                required
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                disabled={loading}
                className="v2-input"
                autoComplete="new-password"
              />
            </label>
            <label className="v2-label">
              Confirm Password
              <input
                required
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                }
                disabled={loading}
                className="v2-input"
                autoComplete="new-password"
              />
            </label>
            <label className="v2-label">
              BGMI UID (optional)
              <input
                placeholder="Your BGMI UID"
                value={registerForm.bgmiUid}
                onChange={(e) => setRegisterForm({ ...registerForm, bgmiUid: e.target.value })}
                disabled={loading}
                className="v2-input"
              />
            </label>
            <label className="v2-checkbox">
              <input
                type="checkbox"
                checked={registerForm.acceptTerms}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, acceptTerms: e.target.checked })
                }
                disabled={loading}
              />
              <span>
                I accept the{" "}
                <Link to="/terms-and-conditions" target="_blank">
                  Terms & Conditions
                </Link>
              </span>
            </label>
            <button className="btn btn-primary v2-btn-full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        )}

        <button
          type="button"
          className="btn btn-secondary v2-btn-full"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setMessage("");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
};

export default AuthPage;
