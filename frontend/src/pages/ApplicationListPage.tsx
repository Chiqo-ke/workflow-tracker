import { Link, useSearchParams } from "react-router-dom";
import { useApplications } from "../hooks/useApplications";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import Button from "../components/Button";

export default function ApplicationListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") ?? undefined;
  const { data: applications, isLoading, isError } = useApplications(statusFilter);
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";

  const REVIEW_STATUSES = ["Submitted", "Under Review", "Need More Information"];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          {statusFilter ? `Applications — ${statusFilter}` : "Applications"}
        </h1>
        <div className="btn-row">
          {isReviewer && statusFilter && (
            <Button variant="secondary" onClick={() => setSearchParams({})}>
              Show All
            </Button>
          )}
          {isReviewer ? (
            <div className="btn-row">
              {REVIEW_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "primary" : "secondary"}
                  onClick={() => setSearchParams({ status: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          ) : (
            <Link to="/applications/new">
              <Button variant="primary">+ New Application</Button>
            </Link>
          )}
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message="Failed to load applications." />}

      {applications && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {["Tracking #", "Applicant", "Company", "Type", "Status", "Created"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <Link to={`/applications/${app.id}`} className="tracking-number">
                      {app.tracking_number}
                    </Link>
                  </td>
                  <td>{app.applicant_name}</td>
                  <td>{app.company_name}</td>
                  <td>{app.application_type}</td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>{new Date(app.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No applications yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
