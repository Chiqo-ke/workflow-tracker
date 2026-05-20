import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSubmitApplication,
  useResubmitApplication,
  useStartReview,
} from "../hooks/useApplications";
import type { Application } from "../types/application";
import ReviewerDecisionForm from "./ReviewerDecisionForm";
import { useAuth } from "../context/AuthContext";

interface Props {
  application: Application;
}

type DecisionType = "Approved" | "Need More Information" | "Rejected";

export default function ActionButtons({ application }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";
  const isApplicant = user?.role === "applicant";
  const [activeDecision, setActiveDecision] = useState<DecisionType | null>(null);
  const submit = useSubmitApplication();
  const resubmit = useResubmitApplication();
  const startReview = useStartReview();

  const { id, status } = application;

  if (status === "Draft") {
    if (!isApplicant) return null;
    return (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => navigate(`/applications/${id}/edit`)}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Edit
        </button>
        <button
          onClick={() => submit.mutate(id)}
          disabled={submit.isPending}
          style={{ background: "var(--color-blue-text)", color: "#fff" }}
        >
          {submit.isPending ? "Submitting…" : "Submit"}
        </button>
      </div>
    );
  }

  if (status === "Submitted") {
    if (!isReviewer) return null;
    return (
      <button
        onClick={() => startReview.mutate(id)}
        disabled={startReview.isPending}
        style={{ background: "var(--color-purple-text)", color: "#fff" }}
      >
        {startReview.isPending ? "Starting…" : "Start Review"}
      </button>
    );
  }

  if (status === "Under Review") {
    if (!isReviewer) return null;
    return (
      <div>
        {!activeDecision && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setActiveDecision("Approved")}
              style={{ background: "var(--color-green-text)", color: "#fff" }}
            >
              Approve
            </button>
            <button
              onClick={() => setActiveDecision("Need More Information")}
              style={{ background: "var(--color-amber-text)", color: "#fff" }}
            >
              Request More Info
            </button>
            <button
              onClick={() => setActiveDecision("Rejected")}
              style={{ background: "var(--color-red-text)", color: "#fff" }}
            >
              Reject
            </button>
          </div>
        )}
        {activeDecision && (
          <ReviewerDecisionForm
            applicationId={id}
            decision={activeDecision}
            onClose={() => setActiveDecision(null)}
          />
        )}
      </div>
    );
  }

  if (status === "Need More Information") {
    if (!isApplicant) return null;
    return (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => navigate(`/applications/${id}/edit`)}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Edit
        </button>
        <button
          onClick={() => resubmit.mutate(id)}
          disabled={resubmit.isPending}
          style={{ background: "var(--color-blue-text)", color: "#fff" }}
        >
          {resubmit.isPending ? "Resubmitting…" : "Resubmit"}
        </button>
      </div>
    );
  }

  // Approved / Rejected — no actions
  return null;
}
