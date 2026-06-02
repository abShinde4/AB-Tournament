import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMobileMenu = () => setMenuOpen(false);

  return (
    <header className={`navbar ${menuOpen ? "open" : ""}`}>
      <Link to="/" className="brand flex items-center gap-2" onClick={closeMobileMenu}>
        <img
            src="/favicon.png"
             alt="AB Tournament"
              style={{ width: "75px", height: "60px", borderRadius: "10px" }}
        /> 
      <span>AB Tournament</span>
      </Link>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav>
        <NavLink to="/" onClick={closeMobileMenu}>Home</NavLink>
        <NavLink to="/tournaments" onClick={closeMobileMenu}>Tournaments</NavLink>
        <NavLink to="/results" onClick={closeMobileMenu}>Results</NavLink>
        <NavLink to="/leaderboard" onClick={closeMobileMenu}>Leaderboard</NavLink>
        {isAuthenticated && <NavLink to="/dashboard" onClick={closeMobileMenu}>Dashboard</NavLink>}
        {isAuthenticated && <NavLink to="/profile" onClick={closeMobileMenu}>Profile</NavLink>}
        {isAuthenticated && user?.role === "admin" && <NavLink to="/admin" onClick={closeMobileMenu}>Admin</NavLink>}
      </nav>
      <div className="actions">
        {isAuthenticated ? (
          <>
            <NotificationBell />
            <span className="chip">{user?.username}</span>
            <span className="chip wallet-chip">₹{user?.walletBalance ?? 0}</span>
            <button
              className="btn btn-secondary"
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
              type="button"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="btn btn-primary" onClick={closeMobileMenu}>
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
