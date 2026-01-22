import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import "./ForgotPasswordModal.css";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [passwordRules, setPasswordRules] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    if (step === 3) {
      setPasswordRules({
        length: newPassword.length >= 6,
        upper: /[A-Z]/.test(newPassword),
        lower: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[@$!%*?&]/.test(newPassword),
      });
    }
  }, [newPassword, step]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    setLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setStep(2);
        setTimer(180); // 3 minutes
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter OTP");

    setLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        email,
        otp,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setStep(3);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    const allRulesMet = Object.values(passwordRules).every((rule) => rule);
    if (!allRulesMet)
      return toast.error("Please meet all password requirements");

    setLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        email,
        otp,
        newPassword,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        onClose();
        // Reset state
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <div className="modal-header">
          <h2>
            {step === 1
              ? "Forgot Password"
              : step === 2
                ? "Verify OTP"
                : "Reset Password"}
          </h2>
          <p>
            {step === 1
              ? "Enter your email to receive a 6-digit verification code"
              : step === 2
                ? `Enter the code sent to ${email}`
                : "Create a strong new password for your account"}
          </p>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="modal-form">
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="modal-form">
              <div className="otp-container">
                <div className="input-group" style={{ width: "100%" }}>
                  <label>Verification Code</label>
                  <input
                    type="text"
                    className="otp-input"
                    maxLength="6"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                </div>
                <div className="timer-section">
                  <p className="timer">
                    {timer > 0 ? (
                      <>
                        Expires in: <span>{formatTimer(timer)}</span>
                      </>
                    ) : (
                      <span style={{ color: "#ef4444" }}>Code expired</span>
                    )}
                  </p>
                  <button
                    type="button"
                    className="resend-btn"
                    onClick={handleSendOTP}
                    disabled={timer > 0 || loading}
                  >
                    Resend Code
                  </button>
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  "Verify & Continue"
                )}
              </button>
              <button
                type="button"
                className="back-btn"
                onClick={() => setStep(1)}
              >
                Back to Email
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="modal-form">
              <div className="input-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock"></i>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="password-requirements">
                <div
                  className={`requirement ${passwordRules.length ? "ok" : ""}`}
                >
                  <i
                    className={`bi bi-${passwordRules.length ? "check-circle-fill" : "circle"}`}
                  ></i>
                  <span>Min 6 characters</span>
                </div>
                <div
                  className={`requirement ${passwordRules.upper ? "ok" : ""}`}
                >
                  <i
                    className={`bi bi-${passwordRules.upper ? "check-circle-fill" : "circle"}`}
                  ></i>
                  <span>1 Uppercase letter</span>
                </div>
                <div
                  className={`requirement ${passwordRules.lower ? "ok" : ""}`}
                >
                  <i
                    className={`bi bi-${passwordRules.lower ? "check-circle-fill" : "circle"}`}
                  ></i>
                  <span>1 Lowercase letter</span>
                </div>
                <div
                  className={`requirement ${passwordRules.number ? "ok" : ""}`}
                >
                  <i
                    className={`bi bi-${passwordRules.number ? "check-circle-fill" : "circle"}`}
                  ></i>
                  <span>1 Number</span>
                </div>
                <div
                  className={`requirement ${passwordRules.special ? "ok" : ""}`}
                >
                  <i
                    className={`bi bi-${passwordRules.special ? "check-circle-fill" : "circle"}`}
                  ></i>
                  <span>1 Special character (@$!%*?&)</span>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <i className="bi bi-shield-check"></i>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <span className="error-text">Passwords do not match</span>
                )}
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={
                  loading || !Object.values(passwordRules).every((r) => r)
                }
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
