import React from "react";
import Powered from "./Loading/Powered";
import "../Styles/Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-copyright">
            &copy; {currentYear} Kumaran E-Services. All rights reserved.
          </span>
        </div>

        <div className="footer-right">
          <Powered theme="dark" />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
