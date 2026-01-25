import React from "react";

const ServerOfflineModal = ({ isOpen }) => {
  if (!isOpen) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: "9999",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-2xl border-0 rounded-4 overflow-hidden">
          <div className="modal-body p-5 text-center">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle pulse-offline"
                style={{ width: "80px", height: "80px" }}
              >
                <i className="bi bi-wifi-off fs-1"></i>
              </div>
            </div>

            <h3 className="fw-bold text-dark mb-3">Server Offline</h3>
            <p className="text-muted mb-4 fs-5">
              The billing terminal has lost connection to the server. Please
              check your internet connection and the server status.
            </p>

            <div className="alert alert-warning border-0 rounded-3 mb-4 d-flex align-items-center gap-3 text-start">
              <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
              <div className="small">
                Transactions and billing functions may not work until connection
                is restored.
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg w-100 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
              onClick={handleRefresh}
            >
              <i className="bi bi-arrow-clockwise fs-5"></i>
              Refresh Page
            </button>

            <p className="text-muted mt-4 small mb-0">
              Auto-reconnecting every 10 seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerOfflineModal;
