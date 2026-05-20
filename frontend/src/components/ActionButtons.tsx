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
import Button from "./Button";

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
      <div className="btn-row">
        <Button variant="secondary" onClick={() => navigate(`/applications/${id}/edit`)}>
          Edit
        </Button>
        <Button variant="primary" onClick={() => submit.mutate(id)} disabled={submit.isPending}>
          {submit.isPending ? "Submitting…" : "Submit"}
        </Button>
      </div>
    );
  }

  if (status === "Submitted") {
    if (!isReviewer) return null;
    return (
      <Button
        variant="primary"
        className="btn-review"
        onClick={() => startReview.mutate(id)}
        disabled={startReview.isPending}
      >
        {startReview.isPending ? "Starting…" : "Start Review"}
      </Button>
    );
  }

  if (status === "Under Review") {
    if (!isReviewer) return null;
    return (
      <div>
        {!activeDecision && (
          <div className="btn-row">
            <Button variant="success" onClick={() => setActiveDecision("Approved")}>
              Approve
            </Button>
            <Button variant="warning" onClick={() => setActiveDecision("Need More Information")}>
              Request More Info
            </Button>
            <Button variant="danger" onClick={() => setActiveDecision("Rejected")}>
              Reject
            </Button>
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
      <div className="btn-row">
        <Button variant="secondary" onClick={() => navigate(`/applications/${id}/edit`)}>
          Edit
        </Button>
        <Button variant="primary" onClick={() => resubmit.mutate(id)} disabled={resubmit.isPending}>
          {resubmit.isPending ? "Resubmitting…" : "Resubmit"}
        </Button>
      </div>
    );
  }

  // Approved / Rejected — no actions
  return null;
}
