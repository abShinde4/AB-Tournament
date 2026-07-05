import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Instagram } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../context/useAuth";
import "./auth-page.css";

const INSTAGRAM_URL = "https://www.instagram.com/ab.tournament";

const initialLogin = { phoneNumber: "", password: "" };
const initialRegister = {
  fullName: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  bgmiUid: "",
  freeFireUid: "",
  acceptTerms: false,
};

const AuthPage = () => {
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [mode, setMode] = useState("login");
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

  const handlePhoneInput = (value, isRegister = false) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (isRegister) {
      setRegisterForm((prev) => ({ ...prev, phoneNumber: digits }));
    } else {
      setLoginForm((prev) => ({ ...prev, phoneNumber: digits }));
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    if (loginForm.phoneNumber.length !== 10) {
      setMessage("Enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const data = await api.login({
        phoneNumber: loginForm.phoneNumber,
        phone: loginForm.phoneNumber,
        password: loginForm.password,
      });
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
        phone: registerForm.phoneNumber,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
        bgmiUid: registerForm.bgmiUid.trim(),
        freeFireUid: registerForm.freeFireUid.trim(),
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
    <main className="page auth-page">
      <div className="auth-page-glow auth-page-glow-a" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-b" aria-hidden="true" />

      <div className={`auth-shell card ${mode === "login" ? "mode-login" : "mode-register"}`}>
        <div className="auth-shell-header">
          <img src="/favicon.png" alt="" className="auth-brand-icon" />
          <div>
            <h1>{mode === "login" ? "Welcome Back" : "Join AB Tournament"}</h1>
            <p>{mode === "login" ? "Sign in with your phone number" : "Create your player account"}</p>
          </div>
        </div>

        {message && <p className="auth-message">{message}</p>}

        {mode === "login" ? (
          <form onSubmit={submitLogin} className="auth-form">
            <label className="auth-label">
              Phone Number
              <input
                required
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={loginForm.phoneNumber}
                onChange={(e) => handlePhoneInput(e.target.value)}
                disabled={loading}
                className="auth-input"
                autoComplete="tel"
              />
            </label>
            <label className="auth-label">
              Password
              <input
                required
                type="password"
                placeholder="Your password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={loading}
                className="auth-input"
                autoComplete="current-password"
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
            <div className="auth-help">
              <span>Forgot password?</span>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="auth-instagram-link"
              >
                <Instagram size={18} aria-hidden="true" />
                <span>
                  Need Help? DM <strong>@ab.tournament</strong> on Instagram
                </span>
              </a>
            </div>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="auth-form">
            <label className="auth-label">
              Full Name
              <input
                required
                placeholder="Your full name"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                disabled={loading}
                className="auth-input"
              />
            </label>
            <label className="auth-label">
              Phone Number
              <input
                required
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={registerForm.phoneNumber}
                onChange={(e) => handlePhoneInput(e.target.value, true)}
                disabled={loading}
                className="auth-input"
              />
            </label>
            <label className="auth-label">
              Create Password
              <input
                required
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                disabled={loading}
                className="auth-input"
                autoComplete="new-password"
              />
            </label>
            <label className="auth-label">
              Confirm Password
              <input
                required
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                }
                disabled={loading}
                className="auth-input"
                autoComplete="new-password"
              />
            </label>
            <label className="auth-label">
              BGMI UID (optional)
              <input
                placeholder="Your BGMI UID"
                value={registerForm.bgmiUid}
                onChange={(e) => setRegisterForm({ ...registerForm, bgmiUid: e.target.value })}
                disabled={loading}
                className="auth-input"
              />
            </label>
            <label className="auth-label">
              Free Fire UID (optional)
              <input
                placeholder="Your Free Fire UID"
                value={registerForm.freeFireUid}
                onChange={(e) => setRegisterForm({ ...registerForm, freeFireUid: e.target.value })}
                disabled={loading}
                className="auth-input"
              />
            </label>
            <label className="auth-checkbox">
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
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        )}

        <button
          type="button"
          className="btn btn-secondary auth-switch"
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
