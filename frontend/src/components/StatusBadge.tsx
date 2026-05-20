import type { ApplicationStatus } from "../types/application";

const STATUS_STYLES: Record<ApplicationStatus, { bg: string; color: string }> = {
  Draft:                   { bg: "var(--color-gray-bg)",   color: "var(--color-gray-text)" },
  Submitted:               { bg: "var(--color-blue-bg)",   color: "var(--color-blue-text)" },
  "Under Review":          { bg: "var(--color-purple-bg)", color: "var(--color-purple-text)" },
  "Need More Information": { bg: "var(--color-amber-bg)",  color: "var(--color-amber-text)" },
  Approved:                { bg: "var(--color-green-bg)",  color: "var(--color-green-text)" },
  Rejected:                { bg: "var(--color-red-bg)",    color: "var(--color-red-text)" },
};

interface Props {
  status: ApplicationStatus;
}

export default function StatusBadge({ status }: Props) {
  const { bg, color } = STATUS_STYLES[status];
  return (
    <span
      style={{
        background: bg,
        color,
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
