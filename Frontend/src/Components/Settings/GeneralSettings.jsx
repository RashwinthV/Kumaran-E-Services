import React from "react";

import currencies from "../../data/currencies.json";

const GeneralSettings = ({ branchInfo, settings, handleChange }) => {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">General Settings</h3>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-info">
            <h4>Assigned Branch</h4>
            <p>Primary branch code for this device</p>
          </div>
          <div className="read-only-box">{branchInfo.code}</div>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Branch Name</h4>
            <p>Trading as listed in registration</p>
          </div>
          <div className="read-only-box">{branchInfo.name}</div>
        </div>

        <div className="setting-row border-top pt-4">
          <div className="setting-info">
            <h4>Currency</h4>
            <p>Select the billing currency symbol</p>
          </div>
          <select
            className="settings-select"
            value={settings.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
          >
            {currencies.map((curr) => (
              <option key={curr.code} value={`${curr.code} (${curr.symbol})`}>
                {curr.name} - {curr.code} ({curr.symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Date & Time Format</h4>
            <p>How dates are displayed in bills and reports</p>
          </div>
          <select
            className="settings-select"
            value={settings.dateFormat}
            onChange={(e) => handleChange("dateFormat", e.target.value)}
          >
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Rounding Method</h4>
            <p>How total amounts are calculated (Rounding)</p>
          </div>
          <select
            className="settings-select"
            value={settings.rounding}
            onChange={(e) => handleChange("rounding", e.target.value)}
          >
            <option value="none">None (2 Decimals)</option>
            <option value="round">Nearest Integer (1)</option>
            <option value="nearest">Nearest Multiple</option>
            <option value="ceil">Round Up (Ceil)</option>
            <option value="floor">Round Down (Floor)</option>
          </select>
        </div>

        {settings.rounding === "nearest" && (
          <div className="setting-row">
            <div className="setting-info">
              <h4>Rounding Multiple</h4>
              <p>Value to round to (e.g., 5 or 10)</p>
            </div>
            <div
              className="d-flex align-items-center bg-light rounded-2 px-2 ms-auto"
              style={{
                width: "120px",
                height: "38px",
                border: "1px solid #dee2e8",
              }}
            >
              <input
                type="number"
                className="form-control border-0 bg-transparent shadow-none p-0 text-center fw-bold"
                value={settings.roundingValue || 10}
                onChange={(e) =>
                  handleChange("roundingValue", parseInt(e.target.value) || 1)
                }
                style={{ fontSize: "1rem" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralSettings;
