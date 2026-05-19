import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand flex items-center gap-2">
        <img
            src="/favicon.png"
             alt="AB Tournament"
              style={{ width: "75px", height: "60px", borderRadius: "10px" }}
        /> 
      <span>AB Tournament</span>
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
            <span className="chip wallet-chip">₹{user?.walletBalance ?? 0}</span>
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
