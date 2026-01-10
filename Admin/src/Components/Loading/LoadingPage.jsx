import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { API_ENDPOINTS } from "../../config/api.jsx";
import UniversalLoader from "./UniversalLoader";

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

          // Redirect based on authentication status
          setTimeout(() => {
            if (isAuthenticated) {
              navigate("/dashboard");
            } else {
              navigate("/login");
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
          "Unable to connect to server. Please check your connection."
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

  return (
    <UniversalLoader
      status={status}
      title={
        status === "checking"
          ? "Initializing..."
          : status === "connected"
          ? "Ready!"
          : "Connection Failed"
      }
      message={message}
      onRetry={handleRetry}
    />
  );
}

export default LoadingPage;
