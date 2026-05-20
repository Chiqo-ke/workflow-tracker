import { Link } from "react-router-dom";
import { useApplications } from "../hooks/useApplications";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function ApplicationListPage() {
  const { data: applications, isLoading, isError } = useApplications();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500 }}>Applications</h1>
        <Link to="/applications/new">
          <button style={{ background: "var(--color-blue-text)", color: "#fff" }}>
            + New Application
          </button>
        </Link>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message="Failed to load applications." />}

      {applications && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
              {["Tracking #", "Applicant", "Company", "Type", "Status", "Created"].map((h) => (
                <th key={h} style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td style={{ padding: "0.875rem 1rem" }}>
                  <Link
                    to={`/applications/${app.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}
                  >
                    {app.tracking_number}
                  </Link>
                </td>
                <td style={{ padding: "0.875rem 1rem" }}>{app.applicant_name}</td>
                <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-secondary)" }}>{app.company_name}</td>
                <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-secondary)" }}>{app.application_type}</td>
                <td style={{ padding: "0.875rem 1rem" }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  {new Date(app.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
