import type { ApplicationStatus } from "../types/application";

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  Draft:                   "badge--draft",
  Submitted:               "badge--submitted",
  "Under Review":          "badge--under-review",
  "Need More Information": "badge--need-more-info",
  Approved:                "badge--approved",
  Rejected:                "badge--rejected",
};

interface Props {
  status: ApplicationStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`badge ${STATUS_CLASSES[status]}`}>
      {status}
    </span>
  );
}
