import React from "react";
import "../../Styles/powered.css";
const Powered = ({ theme, className = "" }) => {
  const isDark = theme === "dark"; // theme="dark" for dark backgrounds (light text)

  return (
    <div className={`powered-container ${className}`}>
      <span
        style={{
          color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)",
          fontSize: "0.75rem",
          fontWeight: "500",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Powered by
      </span>

      {/* Logo + Name wrapper */}
      <div className="powered-group">
        {/* Circular Logo */}
        <div className="powered-logo-wrapper">
          <img src="zyrix tech.png" alt="TharByte Technologies" />
        </div>

        {/* Company Name */}
        <span
          className="powered-text"
          style={{
            color: isDark ? "#ffffff" : "#1e293b",
            fontSize: "0.9rem",
            fontWeight: "700",
            textShadow: isDark ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
          }}
        >
          Zyrix Technologies
        </span>
      </div>
    </div>
  );
};

export default Powered;
