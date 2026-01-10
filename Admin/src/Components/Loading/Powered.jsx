import React from "react";
import "../../Styles/powered.css";
const Powered = ({ theme, className = "" }) => {
  const isDark = theme === "dark";
  // console.log(theme,"        ",isDark);
  

  return (
    <div className={`powered-container ${className}`}>
      <span
        style={{
          color: isDark ? "#94a3b8" : "#64748b",
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Powered by
      </span>

      {/* Logo + Name wrapper */}
      <div className="powered-group">
        {/* Circular Logo */}
        <div className="powered-logo-wrapper">
          <img src="/zyrix tech.png" alt="TharByte Technologies" />
        </div>

        {/* Company Name */}
        <span
          className="powered-text"
          style={{
            color: isDark ? "#000000ff" : "#ffffffff",
            fontSize: "0.875rem",
          }}
        >
          Zyrix Technologies
        </span>
      </div>
    </div>
  );
};

export default Powered;
