import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const roleBadgeClass = user.role === "reviewer" ? "badge badge--reviewer" : "badge badge--applicant";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-brand-icon">W</div>
        Workflow Tracker
      </div>
      <div className="navbar-right">
        <span className="navbar-username">{user.username}</span>
        <span className={roleBadgeClass}>
          {user.role}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
  );
}
