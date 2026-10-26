import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";
import useTheme from "../hooks/useTheme";

const Login = () => {
  const [email, setEmail] = useState("admin@fittrack.in");
  const [password, setPassword] = useState("admin123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back, Admin!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.message || "Login failed. Please verify credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-body p-3">
      <div className="position-absolute top-0 end-0 p-3">
        <button
          type="button"
          className={`btn ${isDark ? "btn-outline-warning" : "btn-outline-dark"} btn-sm rounded-pill px-3 shadow-sm`}
          onClick={toggleTheme}
        >
          <i
            className={`bi ${isDark ? "bi-sun-fill text-warning" : "bi-moon-stars-fill text-primary"} me-2`}
          ></i>
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ maxWidth: "440px", width: "100%" }}
      >
        <div
          className="p-4 text-center text-white"
          style={{ background: "var(--ft-btn-gradient)" }}
        >
          <div
            className="icon-glow-box bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2 shadow-lg"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-activity fs-2 text-primary"></i>
          </div>
          <h2 className="glow-heading h3 mb-1 tracking-tight">
            FitTrack Admin
          </h2>
          <p className="text-white-50 mb-0 small">
            Gym Management System (India)
          </p>
        </div>

        <div className="card-body p-4 p-sm-5">
          {errorMessage && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4 rounded-3 small"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label
                htmlFor="adminEmail"
                className="form-label fw-semibold small text-uppercase text-secondary"
              >
                Admin Email
              </label>
              <div className="input-group">
                <span className="input-group-text bg-body-tertiary">
                  <i className="bi bi-envelope text-muted"></i>
                </span>
                <input
                  type="email"
                  className="form-control form-control-lg fs-6"
                  id="adminEmail"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="adminPassword"
                className="form-label fw-semibold small text-uppercase text-secondary"
              >
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-body-tertiary">
                  <i className="bi bi-lock text-muted"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg fs-6"
                  id="adminPassword"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-body-tertiary"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-muted`}
                  ></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-glow btn-lg w-100 fw-bold rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-3 border-top text-center text-muted small">
            <div className="fw-semibold text-secondary mb-1">
              Demo Credentials:
            </div>
            <code>admin@fittrack.in</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
