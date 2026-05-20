import { useState } from "react";
import { useRecordDecision } from "../hooks/useApplications";
import type { DecisionPayload } from "../types/application";
import ErrorMessage from "./ErrorMessage";

interface Props {
  applicationId: number;
  decision: "Approved" | "Need More Information" | "Rejected";
  onClose: () => void;
}

const REQUIRES_COMMENT: DecisionPayload["decision"][] = [
  "Need More Information",
  "Rejected",
];

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

  const LABEL: Record<string, string> = {
    Approved: "Confirm approval",
    "Need More Information": "Request more information",
    Rejected: "Confirm rejection",
  };

  const BUTTON_COLOR: Record<string, string> = {
    Approved: "var(--color-green-text)",
    "Need More Information": "var(--color-amber-text)",
    Rejected: "var(--color-red-text)",
  };

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        marginTop: "1rem",
      }}
    >
      <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>{LABEL[decision]}</h3>

      {error && <ErrorMessage message={error} />}

      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
        Comment {requiresComment ? "(required)" : "(optional)"}
      </label>
      <textarea
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a reviewer comment…"
        style={{ marginBottom: "1rem" }}
      />

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          style={{
            background: BUTTON_COLOR[decision],
            color: "#fff",
          }}
        >
          {isPending ? "Saving…" : "Confirm"}
        </button>
        <button
          onClick={onClose}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
