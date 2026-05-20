import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useApplication,
  useCreateApplication,
  useUpdateApplication,
} from "../hooks/useApplications";
import type { CreateApplicationPayload, ApplicationType } from "../types/application";
import { APPLICATION_TYPES } from "../types/application";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import Button from "../components/Button";

const EMPTY_FORM: CreateApplicationPayload = {
  applicant_name: "",
  applicant_email: "",
  company_name: "",
  application_type: "Recordation",
  description: "",
};

export default function ApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading } = useApplication(Number(id));
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication(Number(id));

  const [patch, setPatch] = useState<Partial<CreateApplicationPayload>>({});
  const [error, setError] = useState<string | null>(null);

  const form: CreateApplicationPayload = {
    applicant_name: patch.applicant_name ?? existing?.applicant_name ?? EMPTY_FORM.applicant_name,
    applicant_email: patch.applicant_email ?? existing?.applicant_email ?? EMPTY_FORM.applicant_email,
    company_name: patch.company_name ?? existing?.company_name ?? EMPTY_FORM.company_name,
    application_type: patch.application_type ?? existing?.application_type ?? EMPTY_FORM.application_type,
    description: patch.description ?? existing?.description ?? EMPTY_FORM.description,
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  function handleChange(field: keyof CreateApplicationPayload, value: string) {
    setPatch((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    setError(null);
    const mutation = isEdit ? updateMutation : createMutation;
    (mutation as ReturnType<typeof useCreateApplication>).mutate(form, {
      onSuccess: (result) => navigate(`/applications/${result.id}`),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to save application.";
        setError(msg);
      },
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-container-narrow">
      <Link to={isEdit ? `/applications/${id}` : "/"} className="back-link">
        ← {isEdit ? "Back to application" : "All applications"}
      </Link>

      <h1 className="page-title">{isEdit ? "Edit application" : "New application"}</h1>

      {error && <ErrorMessage message={error} />}

      <div className="form-card">
        <div className="form-stack">
          {(
            [
              { label: "Applicant name", field: "applicant_name" as const, type: "text" },
              { label: "Applicant email", field: "applicant_email" as const, type: "email" },
              { label: "Company name", field: "company_name" as const, type: "text" },
            ]
          ).map(({ label, field, type }) => (
            <div key={field} className="form-group">
              <label className="form-label" htmlFor={field}>{label}</label>
              <input
                id={field}
                type={type}
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </div>
          ))}

          <div className="form-group">
            <label className="form-label" htmlFor="application_type">Application type</label>
            <select
              id="application_type"
              value={form.application_type}
              onChange={(e) => handleChange("application_type", e.target.value as ApplicationType)}
            >
              {APPLICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Create draft"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(isEdit ? `/applications/${id}` : "/")}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
