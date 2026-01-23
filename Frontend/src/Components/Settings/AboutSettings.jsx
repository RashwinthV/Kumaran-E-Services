import React from "react";

const AboutSettings = () => {
  return (
    <div className="settings-section">
      <h3 className="settings-section-title">About Kumaran E-Services</h3>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-info">
            <h4>App Version</h4>
            <p>Current software build version</p>
          </div>
          <div className="fw-bold text-primary">v {import.meta.env.VITE_TERMINAL_VERSION}</div>
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <h4>Backend Status</h4>
            <p>Connection with central management server</p>
          </div>
          <span className="badge bg-success-subtle text-success border border-success px-3">
            Online
          </span>
          
        </div>

        <div className="setting-row border-top pt-4">
          <div className="setting-info">
            <h4>Support Contact</h4>
            <p>For technical issues and hardware faults</p>
          </div>
          <div className="text-end">
            <div className="fw-bold">Zyrix Technologies</div>
            <small className="text-muted">support@Zyrix.com</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSettings;
