import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        AB Tournament
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/tournaments">Tournaments</NavLink>
        <NavLink to="/results">Results</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
        {isAuthenticated && <NavLink to="/dashboard">Dashboard</NavLink>}
        {isAuthenticated && <NavLink to="/profile">Profile</NavLink>}
        {isAuthenticated && user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="actions">
        {isAuthenticated ? (
          <>
            <NotificationBell />
            <span className="chip">{user?.username}</span>
            <span className="chip wallet-chip">INR {user?.walletBalance ?? 0}</span>
            <button className="btn btn-secondary" onClick={logout} type="button">
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="btn btn-primary">
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
