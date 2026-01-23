import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import Powered from "../../Components/Loading/Powered";
import { getDecrypted } from "../../utils/storage";
import ForgotPasswordModal from "../../Components/Modals/ForgotPasswordModal";
import "../../Styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const branch = getDecrypted("branch");
  const branchCode = branch ? branch.code : null;

  const [formData, setFormData] = useState({
    identifier: "", // Can be email or employee ID
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.identifier || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await login(
        formData.identifier.trim(),
        formData.password,
        branchCode,
      );

      if (result.success) {
        toast.success("Login successful!");
        setTimeout(() => {
          navigate("/billing");
        }, 1000);
      } else {
        toast.error(result.message || "Login failed. Check credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card-wide">
          {/* Left Panel: Visual Branding */}
          <div className="login-visual-panel">
            <div className="visual-overlay"></div>
            <div className="visual-content">
              <div className="staff-login-logo">
                <img src="kes_logo.jpeg" alt="Kumaran E-Services" />
              </div>
              <h2 className="company-name-large">Kumaran E-Services</h2>

              <div className="terminal-info">
                <div className="terminal-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                      strokeWidth="2"
                    />
                    <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                    <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
                  </svg>
                </div>
                <h3>Internal Billing Terminal</h3>
                <p>
                  Authorized personnel only. All access is logged and monitored
                  for security compliance.
                </p>
              </div>

              {branchCode && (
                <div className="branch-id-box">
                  <span className="label">ACTIVE BRANCH</span>
                  <span className="code">{branchCode}</span>
                </div>
              )}
            </div>

            <div className="visual-footer">
              <Powered theme="dark" />
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div className="login-form-panel">
            <div className="form-header">
              <h1>Staff Login</h1>
              <p>Enter your credentials to access the terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="identifier">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="7"
                      r="4"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Email or Employee ID
                </label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                      strokeWidth="2"
                    />
                    <path
                      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                      strokeWidth="2"
                    />
                  </svg>
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash text-dark fs-4"></i>
                    ) : (
                      <i className="bi bi-eye text-dark fs-4"></i>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-utils">
                <button
                  type="button"
                  className="forgot-password-trigger"
                  onClick={() => setIsForgotPasswordOpen(true)}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="login-button-elegant"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    Sign In
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      width="20"
                      height="20"
                    >
                      <path
                        d="M5 12H19M19 12L12 5M19 12L12 19"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="footer-copyright ">
              © {new Date().getFullYear()} Kumaran E-Services. All rights
              reserved.
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default Login;
