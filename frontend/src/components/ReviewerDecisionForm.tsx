import { useState } from "react";
import { useRecordDecision } from "../hooks/useApplications";
import type { DecisionPayload } from "../types/application";
import ErrorMessage from "./ErrorMessage";
import Button from "./Button";

interface Props {
  applicationId: number;
  decision: "Approved" | "Need More Information" | "Rejected";
  onClose: () => void;
}

const REQUIRES_COMMENT: DecisionPayload["decision"][] = [
  "Need More Information",
  "Rejected",
];

const LABEL: Record<string, string> = {
  Approved: "Confirm approval",
  "Need More Information": "Request more information",
  Rejected: "Confirm rejection",
};

const BUTTON_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  Approved: "success",
  "Need More Information": "warning",
  Rejected: "danger",
};

export default function ReviewerDecisionForm({ applicationId, decision, onClose }: Props) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate, isPending } = useRecordDecision();

  const requiresComment = REQUIRES_COMMENT.includes(decision);

  function handleSubmit() {
    if (requiresComment && !comment.trim()) {
      setError("A comment is required for this decision.");
      return;
    }
    mutate(
      { id: applicationId, payload: { decision, comment: comment || undefined } },
      {
        onSuccess: onClose,
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to record decision.";
          setError(msg);
        },
      }
    );
  }

  return (
    <div className="decision-form">
      <div className="decision-form-title">{LABEL[decision]}</div>
      <div className="decision-form-subtitle">This action will update the application status.</div>

      {error && <ErrorMessage message={error} />}

      <div className="form-group">
        <label className="form-label">
          Comment {requiresComment ? "(required)" : "(optional)"}
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a reviewer comment…"
        />
      </div>

      <div className="form-actions form-actions--flush">
        <Button variant={BUTTON_VARIANT[decision]} onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving…" : "Confirm"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
