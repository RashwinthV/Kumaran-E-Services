import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import { API_ENDPOINTS } from "../../config/api.jsx";
import Powered from "./Powered";
import "../../Styles/Connection.css";
import { getDecrypted } from "../../utils/storage";

function LoadingPage() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Connecting to server...");
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  const checkBackendHealth = async () => {
    try {
      setStatus("checking");
      setMessage("Connecting to server...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(API_ENDPOINTS.HEALTH, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        if (data.database === "connected") {
          setStatus("connected");
          setMessage("Connected successfully!");

          // Wait for auth context to finish loading
          setTimeout(() => {
            const branch = getDecrypted("branch");
            const branchCode = branch ? branch.code : null;
            const branchToken = localStorage.getItem("branchToken");

            if (!branchCode || !branchToken) {
              // UNASSIGNED - First time setup
              navigate("/branch-login");
            } else {
              // ASSIGNED - Continue to login flow
              if (isAuthenticated) {
                navigate("/billing");
              } else {
                navigate("/login");
              }
            }
          }, 1000);
        } else {
          setStatus("error");
          setMessage("Database not ready. Please try again.");
        }
      } else {
        throw new Error("Server responded with error");
      }
    } catch (error) {
      setStatus("error");

      if (error.name === "AbortError") {
        setMessage("Connection timeout. Server might be starting up...");
      } else {
        setMessage(
          "Unable to connect to server. Please check your connection.",
        );
      }

      console.error("Backend health check failed:", error);
    }
  };

  useEffect(() => {
    // Only check backend health after auth context has finished loading
    if (!loading) {
      checkBackendHealth();
    }
  }, [retryCount, loading, isAuthenticated]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // Show loading while auth context is initializing
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-icon-wrapper">
            <Loader2 className="loading-spinner" size={64} />
          </div>
          <h1 className="loading-title">Initializing...</h1>
          <p className="loading-message">Checking authentication...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="loading-powered">
        <Powered theme="dark" />
      </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="loading-content">
        {/* Logo/Icon */}
        <div className="loading-icon-wrapper">
          {status === "checking" && (
            <Loader2 className="loading-spinner" size={64} />
          )}
          {status === "connected" && (
            <CheckCircle2 className="success-icon" size={64} />
          )}
          {status === "error" && <XCircle className="error-icon" size={64} />}
        </div>

        {/* Status Message */}
        <h1 className="loading-title">
          {status === "checking" && "Initializing..."}
          {status === "connected" && "Ready!"}
          {status === "error" && "Connection Failed"}
        </h1>

        <p className="loading-message">{message}</p>

        {/* Retry Button */}
        {status === "error" && (
          <button id="retry" className="retry-button" onClick={handleRetry}>
            <RefreshCw size={20} />
            Retry Connection
          </button>
        )}

        {/* Progress Dots */}
        {status === "checking" && (
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      <div className="loading-powered">
        <Powered theme="dark" />
      </div>
    </div>
  );
}

export default LoadingPage;
