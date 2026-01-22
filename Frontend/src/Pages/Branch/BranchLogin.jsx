import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { Shield, Layout, LogIn, Hash } from "lucide-react";
import Powered from "../../Components/Loading/Powered";
import { API_ENDPOINTS } from "../../config/api.jsx";
import { saveEncrypted } from "../../utils/storage";
import "../../Styles/BranchLogin.css";

const BranchLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    branchCode: "",
    accessCode: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value.toUpperCase(),
    });
  };

  const handleAccessCodeChange = (e) => {
    setFormData({
      ...formData,
      accessCode: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.branchCode || !formData.accessCode) {
      toast.error("Please enter Branch Code and Access Code");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        API_ENDPOINTS.AUTH.VERIFY_BRANCH,
        formData,
        { skipAuthRefresh: true },
      );

      if (response.data.success) {
        // Store full branch object encrypted
        saveEncrypted("branch", response.data.branch);
        // localStorage.setItem("branchCode", response.data.branch.code); // Removed in favor of encrypted object
        localStorage.setItem("branchToken", `verified_${Date.now()}`);
        toast.success("Branch authenticated successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      console.error("Branch Assignment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to authenticate branch",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="branch-login-container">
      <div className="branch-login-background"></div>

      <div className="branch-login-content">
        <div className="branch-login-card-wide">
          {/* Left Panel: Visual Branding */}
          <div className="branch-login-visual-panel">
            <div className="visual-overlay"></div>
            <div className="visual-content">
              <div className="company-logo-large">
                <img src="/zyrix tech.png" alt="Kumaran E-Services" />
              </div>
              <h2 className="company-name-large">Kumaran E-Services</h2>

              <div className="setup-info">
                <div className="setup-icon">
                  <Layout size={28} />
                </div>
                <h3>Terminal Registration</h3>
                <p>
                  Register this workstation to your specific branch ecosystem.
                  This link is permanent and secures your terminal data.
                </p>
              </div>
            </div>

            <div className="visual-footer">
              <Powered theme="dark" />
            </div>
          </div>

          {/* Right Panel: Setup Form */}
          <div className="branch-login-form-panel">
            <div className="form-header">
              <h1>Branch Setup</h1>
              <p>Authorize this terminal for operations</p>
            </div>

            <form onSubmit={handleSubmit} className="branch-login-form">
              <div className="branch-form-group">
                <label htmlFor="branchCode">
                  <Hash size={18} />
                  Branch Code
                </label>
                <input
                  type="text"
                  id="branchCode"
                  name="branchCode"
                  value={formData.branchCode}
                  onChange={handleChange}
                  placeholder="EX: BRANCH-01"
                  required
                />
              </div>

              <div className="branch-form-group">
                <label htmlFor="accessCode">
                  <Shield size={18} />
                  Secure Access Code
                </label>
                <input
                  type="password"
                  id="accessCode"
                  name="accessCode"
                  value={formData.accessCode}
                  onChange={handleAccessCodeChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="branch-login-button"
                disabled={loading}
              >
                {loading ? (
                  <span className="branch-spinner"></span>
                ) : (
                  <>
                    <LogIn size={20} />
                    Register Terminal
                  </>
                )}
              </button>
            </form>

            <div className="footer-copyright">
              © {new Date().getFullYear()} Kumaran E-Services. All rights
              reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchLogin;
