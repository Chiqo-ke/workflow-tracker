import { useState, useEffect } from "react";
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

  const [form, setForm] = useState<CreateApplicationPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        applicant_name: existing.applicant_name,
        applicant_email: existing.applicant_email,
        company_name: existing.company_name,
        application_type: existing.application_type,
        description: existing.description,
      });
    }
  }, [existing]);

  if (isEdit && isLoading) return <LoadingSpinner />;

  function handleChange(field: keyof CreateApplicationPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to={isEdit ? `/applications/${id}` : "/"}
          style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}
        >
          ← {isEdit ? "Back to application" : "All applications"}
        </Link>
      </div>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1.5rem" }}>
        {isEdit ? "Edit application" : "New application"}
      </h1>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {(
          [
            { label: "Applicant name", field: "applicant_name" as const, type: "text" },
            { label: "Applicant email", field: "applicant_email" as const, type: "email" },
            { label: "Company name", field: "company_name" as const, type: "text" },
          ]
        ).map(({ label, field, type }) => (
          <div key={field}>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              {label}
            </label>
            <input
              type={type}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          </div>
        ))}

        <div>
          <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Application type
          </label>
          <select
            value={form.application_type}
            onChange={(e) => handleChange("application_type", e.target.value as ApplicationType)}
          >
            {APPLICATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Description
          </label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          style={{ background: "var(--color-blue-text)", color: "#fff" }}
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create draft"}
        </button>
        <button
          onClick={() => navigate(isEdit ? `/applications/${id}` : "/")}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
