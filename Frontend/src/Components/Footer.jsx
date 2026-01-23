import Powered from "./Loading/Powered";
import "../Styles/Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <p className="footer-copyright">
            &copy; {currentYear} <span>Kumaran E-Services</span>. All rights
            reserved.
          </p>
          <div className="footer-v-divider"></div>
          <p className="footer-version">v {import.meta.env.VITE_TERMINAL_VERSION} Billing Terminal</p>
        </div>

        <div className="footer-right">
          <div className="footer-powered-wrapper">
            <Powered theme="light" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
