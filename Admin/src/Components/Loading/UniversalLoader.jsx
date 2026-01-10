import React from "react";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Powered from "./Powered";
import "../../Styles/Connection.css";

const UniversalLoader = ({
  status = "checking",
  title = "Loading...",
  message = "Please wait...",
  onRetry = null,
  showPowered = true,
}) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        {/* Icon Section */}
        <div className="loading-icon-wrapper">
          {status === "checking" && (
            <Loader2 className="loading-spinner" size={64} />
          )}
          {status === "connected" && (
            <CheckCircle2 className="success-icon" size={64} />
          )}
          {status === "error" && <XCircle className="error-icon" size={64} />}
        </div>

        {/* Text Section */}
        <h1 className="loading-title">{title}</h1>

        <p className="loading-message">{message}</p>

        {/* Retry Section */}
        {status === "error" && onRetry && (
          <button id="retry" className="retry-button text-center " onClick={onRetry}>
            <div className="d-flex align-items-center text-center " style={{marginLeft:"100px"}}>
                   <RefreshCw size={20} className="me-3" />
            Retry Connection
            </div>
         
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

      {showPowered && (
        <div className="loading-powered">
          <Powered theme="light" />
        </div>
      )}
    </div>
  );
};

export default UniversalLoader;
