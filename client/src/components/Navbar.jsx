import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import NotificationBell from "./NotificationBell";
import {
  Home,
  Trophy,
  Award,
  BarChart,
  TrendingUp,
  LayoutDashboard,
  User,
  ShieldCheck,
} from "lucide-react";

const menuItems = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/tournaments", label: "Tournaments", Icon: Trophy },
  { to: "/results", label: "Results", Icon: Award },
  { to: "/leaderboard", label: "Leaderboard", Icon: TrendingUp },
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, auth: true },
  { to: "/profile", label: "Profile", Icon: User, auth: true },
  { to: "/admin", label: "Admin", Icon: ShieldCheck, role: "admin" },
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMobileMenu = () => setMenuOpen(false);

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.role === "admin") return isAuthenticated && user?.role === "admin";
    if (item.auth) return isAuthenticated;
    return true;
  });

  const bottomNavItems = [
    { to: "/", label: "Home", Icon: Home },
    { to: "/tournaments", label: "Tournaments", Icon: Trophy },
    { to: "/results", label: "Results", Icon: Award },
    { to: "/leaderboard", label: "Leaderboard", Icon: BarChart },
    { to: "/profile", label: "Profile", Icon: User },
  ];

  return (
    <>
      <header className={`navbar ${menuOpen ? "open" : ""}`}>
      <div className="navbar-brand-row">
        <Link to="/" className="brand" onClick={closeMobileMenu}>
          <img src="/favicon.png" alt="AB Tournament" className="brand-logo" />
          <div className="brand-copy">
            <span>AB Tournament</span>
            <small>Esports arena</small>
          </div>
        </Link>
        <button
          type="button"
          className={`nav-toggle flex md:hidden ${menuOpen ? "active" : ""}`}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="line line-1" />
          <span className="line line-2" />
          <span className="line line-3" />
        </button>
      </div>

      <nav className="desktop-nav hidden md:flex">
        {visibleMenuItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} onClick={closeMobileMenu} className="nav-link">
            <Icon className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="desktop-actions hidden md:flex">
        {isAuthenticated ? (
          <>
            <NotificationBell />
            <span className="chip">{user?.username}</span>
            <span className="chip wallet-chip">₹{user?.walletBalance ?? 0}</span>
            <button
              className="btn btn-secondary logout-btn"
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

      <div className={`mobile-backdrop ${menuOpen ? "visible" : ""}`} onClick={closeMobileMenu} />

      <aside className={`mobile-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-inner">
          <div className="mobile-profile">
            <div className="mobile-avatar-shell">
              <img src="/favicon.png" alt="Profile avatar" />
            </div>
            <div className="mobile-profile-copy">
              <span>Welcome back</span>
              <h3>{isAuthenticated ? user?.username ?? "Champion" : "AB Challenger"}</h3>
              <p>{isAuthenticated ? "Step into the arena" : "Login to unlock rewards"}</p>
            </div>
          </div>

          <div className="sidebar-links">
            {visibleMenuItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMobileMenu}
                className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
              >
                <Icon className="menu-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-actions">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="mobile-chips">
                  <span className="chip">{user?.username}</span>
                  <span className="chip wallet-chip">₹{user?.walletBalance ?? 0}</span>
                </div>
                <button
                  className="btn btn-secondary mobile-logout"
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
              <Link to="/auth" className="btn btn-primary mobile-login" onClick={closeMobileMenu}>
                Login
              </Link>
            )}
          </div>
        </div>
      </aside>
    </header>

      <nav className="bottom-nav md:hidden">
        {bottomNavItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon className="bottom-nav-icon" />
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Navbar;
