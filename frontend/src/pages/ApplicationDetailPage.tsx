import { useParams, Link } from "react-router-dom";
import { useApplication } from "../hooks/useApplications";
import StatusBadge from "../components/StatusBadge";
import ActionButtons from "../components/ActionButtons";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: app, isLoading, isError } = useApplication(Number(id));

  if (isLoading) return <LoadingSpinner />;
  if (isError || !app) return <ErrorMessage message="Application not found." />;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/" style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          ← All applications
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
            {app.tracking_number}
          </h1>
          <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            {app.application_type}
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
          <Field label="Applicant name" value={app.applicant_name} />
          <Field label="Applicant email" value={app.applicant_email} />
          <Field label="Company" value={app.company_name} />
          <Field label="Type" value={app.application_type} />
        </div>
        <Field label="Description" value={<p style={{ whiteSpace: "pre-wrap" }}>{app.description}</p>} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 2rem", marginTop: "0.5rem" }}>
          <Field label="Created" value={new Date(app.created_at).toLocaleString()} />
          {app.submitted_at && <Field label="Submitted" value={new Date(app.submitted_at).toLocaleString()} />}
          {app.reviewed_at && <Field label="Reviewed" value={new Date(app.reviewed_at).toLocaleString()} />}
        </div>
      </div>

      {app.reviewer_comment && (
        <div
          style={{
            background: "var(--color-amber-bg)",
            border: "1px solid",
            borderColor: "var(--color-amber-text)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--color-amber-text)", marginBottom: "0.5rem", fontWeight: 500, textTransform: "uppercase" }}>
            Reviewer comment
          </div>
          <p style={{ color: "var(--color-amber-text)" }}>{app.reviewer_comment}</p>
        </div>
      )}

      <ActionButtons application={app} />
    </div>
  );
}
