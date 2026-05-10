import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img
            src="/favicon.png"
            alt="AB Tournament"
            style={{ width: "50px", height: "40px", borderRadius: "8px" }}
          />
          <span>AB Tournament</span>
        </div>
        <nav className="footer-nav">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms & Conditions</Link>
          <Link to="/refund-policy">Refund Policy</Link>
        </nav>
        <div className="footer-copyright">
          <p>&copy; 2024 AB Tournament. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;