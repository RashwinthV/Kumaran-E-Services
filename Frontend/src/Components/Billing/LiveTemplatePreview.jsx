import React from "react";
import PrintTemplate from "./PrintTemplate";

const LiveTemplatePreview = ({ settings, sale, branchInfo, scale = 0.35 }) => {
  // Auto-calculate scale if not provided based on paper size
  let autoScale = scale;
  if (settings.paperSize === "A5") autoScale = 0.5;
  if (settings.paperSize === "80mm" || settings.paperSize === "58mm")
    autoScale = 0.8;
  if (settings.orientation === "landscape") autoScale = autoScale * 0.7;

  return (
    <div className="mini-preview-container p-3 bg-white rounded-4 border shadow-sm d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "0.9rem" }}>
          <i className="bi bi-eye me-2 text-primary"></i>Live Bill Preview
        </h5>
        <div className="d-flex gap-2">
          <span
            className="badge bg-light text-primary border border-primary-subtle"
            style={{ fontSize: "0.7rem" }}
          >
            {settings.paperSize}
          </span>
          <span
            className="badge bg-primary text-white"
            style={{ fontSize: "0.7rem" }}
          >
            {settings.billTemplate === "dynamic"
              ? (
                  settings.templateMap?.[settings.paperSize] || "Standard"
                ).toUpperCase()
              : settings.billTemplate?.toUpperCase()}
          </span>
        </div>
      </div>

      <div
        className="preview-outer shadow-inner flex-grow-1"
        style={{
          minHeight: "400px",
          overflow: "auto",
          background: "#f1f5f9",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
          border: "1px inset rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            transform: `scale(${autoScale})`,
            transformOrigin: "top center",
            width: "fit-content",
            height: "fit-content",
            background: "white",
            boxShadow:
              "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
          }}
        >
          <PrintTemplate
            sale={sale}
            settings={settings}
            branchInfo={branchInfo}
          />
        </div>
      </div>

      <div className="mt-3 p-2 bg-light rounded-3">
        <div className="d-flex justify-content-between align-items-center small">
          <span className="text-muted">Print Mode:</span>
          <span className="fw-bold">
            {window.electron ? "Direct (Electron)" : "Browser (Manual)"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveTemplatePreview;
