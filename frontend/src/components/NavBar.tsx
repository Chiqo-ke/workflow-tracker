import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        background: "var(--color-card-bg, #fff)",
        borderBottom: "1px solid var(--color-border, #e5e7eb)",
        marginBottom: "1rem",
      }}
    >
      <span style={{ fontWeight: 600, fontSize: "1rem" }}>Workflow Tracker</span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.875rem" }}>
          {user.username}
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "9999px",
            background: user.role === "reviewer" ? "var(--color-purple-bg, #f3e8ff)" : "var(--color-blue-bg, #eff6ff)",
            color: user.role === "reviewer" ? "var(--color-purple-text, #7c3aed)" : "var(--color-blue-text, #1d4ed8)",
            fontWeight: 500,
            textTransform: "capitalize",
          }}
        >
          {user.role}
        </span>
        <button
          onClick={handleLogout}
          style={{
            fontSize: "0.875rem",
            padding: "0.25rem 0.75rem",
            background: "var(--color-gray-bg, #f3f4f6)",
            color: "var(--color-gray-text, #374151)",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
