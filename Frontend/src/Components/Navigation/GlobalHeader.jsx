import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { getDecrypted } from "../../utils/storage";
import { Link } from "react-router-dom";

const GlobalHeader = ({ Online }) => {
  const { user } = useAuth();
  const [dateTime, setDateTime] = useState(new Date());
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    const saved = getDecrypted("app_settings");
    if (saved) {
      setAppSettings(saved);
    }
  }, []);

  // Sync Time
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="bg-white border-bottom d-flex flex-column"
      style={{ minHeight: "65px", position: "relative" }}
    >
      <div className="px-4 py-2 d-flex justify-content-between align-items-center flex-grow-1">
        <div className="d-flex align-items-center gap-4">
          {/* Logo Section */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center"
              style={{ width: "32px", height: "32px" }}
            >
              <img
                src="kes_logo.jpeg"
                alt="KES"
                style={{ width: "32px", height: "32px" }}
                className="rounded"
              />
            </div>

            <div>
              <h6
                className="mb-0 fw-bold"
                style={{ fontSize: "1rem", color: "#000000ff" }}
              >
                KES-BILLING TERMINAL
              </h6>
            </div>
          </div>

          {/* Branch Info */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center"
              style={{ width: "32px", height: "32px" }}
            >
              <i className="bi bi-shop fs-6"></i>
            </div>

            <div>
              <h6
                className="mb-0 fw-bold"
                style={{ fontSize: "0.7rem", color: "#6c757d" }}
              >
                BRANCH
              </h6>
              <div className="fw-bold text-dark small">{user?.branchCode}</div>
            </div>
          </div>

          <div className="vr opacity-10" style={{ height: "30px" }}></div>

          {/* Staff Info */}
     
            <div
              className="bg-success bg-opacity-10 text-success rounded d-flex align-items-center justify-content-center"
              style={{ width: "32px", height: "32px" }}
            >
              <i className="bi bi-person fs-6"></i>
            </div>
            <div>
              <h6
                className="mb-0 fw-bold"
                style={{ fontSize: "0.7rem", color: "#6c757d" }}
              >
                STAFF
              </h6>
              <div className="fw-bold text-dark small">
                {user?.name?.toUpperCase()}
              </div>
            </div>

          <div className="vr opacity-10" style={{ height: "30px" }}></div>

          {/* Connection Status */}
          <div className="d-flex align-items-center gap-2">
            <div
              className={`rounded d-flex align-items-center justify-content-center ${
                Online
                  ? "bg-success bg-opacity-10 text-success pulse-online"
                  : "bg-danger bg-opacity-10 text-danger pulse-offline"
              }`}
              style={{ width: "32px", height: "32px", borderRadius: "8px" }}
            >
              <i
                className={`bi ${Online ? "bi-wifi" : "bi-wifi-off"} fs-6`}
              ></i>
            </div>
            <div>
              <h6
                className="mb-0 fw-bold"
                style={{ fontSize: "0.7rem", color: "#6c757d" }}
              >
                SERVER
              </h6>
              <div
                className={`fw-bold small ${
                  Online ? "text-success" : "text-danger"
                }`}
                style={{ fontSize: "0.75rem" }}
              >
                {Online ? "ONLINE" : "OFFLINE"}
              </div>
            </div>
          </div>
        </div>

        {/* Status Group: Shortcuts & Time */}
        <div className="d-flex align-items-center gap-4">
          {/* Shortcuts Section */}
          <div className="d-flex align-items-center gap-3">
            <span
              className="text-uppercase fw-bold text-muted"
              style={{ fontSize: "0.6rem", letterSpacing: "0.05em" }}
            >
              Shortcuts:
            </span>
            <div className="d-flex gap-3">
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                <kbd className="bg-secondary text-white fw-normal me-1">F1</kbd>
                New Cust
              </small>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                <kbd className="bg-secondary text-white fw-normal me-1">F2</kbd>
                Search
              </small>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                <kbd className="bg-secondary text-white fw-normal me-1">F9</kbd>
                Save
              </small>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                <kbd className="bg-secondary text-white fw-normal me-1">
                  F10
                </kbd>
                Print
              </small>
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                <kbd className="bg-info text-white fw-normal me-1">F12</kbd>
                Help
              </small>
            </div>
          </div>

          <div className="vr opacity-10" style={{ height: "30px" }}></div>

          {/* Time and Date */}
          <div className="text-end">
            <div className="d-flex align-items-center gap-2 justify-content-end">
              <i className="bi bi-clock text-primary small"></i>
              <h6 className="mb-0 fw-bold text-primary small">
                {dateTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </h6>
            </div>
            <small
              className="text-muted d-block mt-1"
              style={{ fontSize: "0.75rem" }}
            >
              {appSettings?.dateFormat === "MM/DD/YYYY"
                ? dateTime.toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })
                : appSettings?.dateFormat === "YYYY-MM-DD"
                  ? dateTime.toLocaleDateString("en-CA") // ISO format
                  : dateTime.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
