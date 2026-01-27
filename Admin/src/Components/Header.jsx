import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../Context/AuthContext";
import { Link } from "react-router-dom";
import "../Styles/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav className="dashboard-nav">
      <div className="nav-brand">
        <div className="brand-icon">
          <img src="kes_logo.jpeg" alt="KES Logo" />
        </div>
        <Link
          to="/dashboard"
          className="nav-brand-text text-dark"
          style={{ textDecoration: "none" }}
        >
          <span className="text-dark">KES Admin Console</span>
        </Link>
      </div>

      <div className="nav-user">
        <Link
          to="/profile"
          className="user-info"
          style={{ textDecoration: "none" }}
        >
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="user-details">
            <span className="user-name">{user?.name || "User"}</span>
            <span className="user-email">
              {user?.email || "user@example.com"}
            </span>
          </div>
        </Link>

        <button className="logout-button" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Header;
