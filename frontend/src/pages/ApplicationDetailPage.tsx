import { useParams, Link } from "react-router-dom";
import { useApplication } from "../hooks/useApplications";
import StatusBadge from "../components/StatusBadge";
import ActionButtons from "../components/ActionButtons";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: app, isLoading, isError } = useApplication(Number(id));

  if (isLoading) return <LoadingSpinner />;
  if (isError || !app) return <ErrorMessage message="Application not found." />;

  return (
    <div className="page-container-narrow">
      <Link to="/" className="back-link">
        ← All applications
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title page-title--mono">
            {app.tracking_number}
          </h1>
          <div className="page-subtitle">
            {app.application_type}
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="card card--mb">
        <div className="card-body">
          <div className="detail-grid">
            <Field label="Applicant name" value={app.applicant_name} />
            <Field label="Applicant email" value={app.applicant_email} />
            <Field label="Company" value={app.company_name} />
            <Field label="Type" value={app.application_type} />
          </div>
          <Field label="Description" value={<p className="description-text">{app.description}</p>} />
          <div className="detail-grid-3 detail-grid--mt">
            <Field label="Created" value={new Date(app.created_at).toLocaleString()} />
            {app.submitted_at && <Field label="Submitted" value={new Date(app.submitted_at).toLocaleString()} />}
            {app.reviewed_at && <Field label="Reviewed" value={new Date(app.reviewed_at).toLocaleString()} />}
          </div>
        </div>
      </div>

      {app.reviewer_comment && (
        <div className="reviewer-comment">
          <div className="reviewer-comment-label">Reviewer comment</div>
          <p>{app.reviewer_comment}</p>
        </div>
      )}

      <ActionButtons application={app} />
    </div>
  );
}
