import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-title">AB Tournament</span>
          <p className="footer-subtitle">Owned &amp; Managed by Arman Balaji Shinde</p>
          <a className="footer-email" href="mailto:shindearman1910@gmail.com">
            Email: shindearman1910@gmail.com
          </a>
        </div>
        <nav className="footer-nav">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link to="/refund-policy">Refund Policy</Link>
          <a href="mailto:shindearman1910@gmail.com">Contact Us</a>
        </nav>
        <div className="footer-trust">
          <p>Modern, secure gaming experience crafted for AB Tournament.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;