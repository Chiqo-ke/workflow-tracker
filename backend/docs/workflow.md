# Application Workflow

This document describes the state machine that governs an application's lifecycle.

---

## States

| State | Editable | Description |
|---|---|---|
| `Draft` | Yes | Created but not yet submitted |
| `Submitted` | No | Awaiting review |
| `Under Review` | No | A reviewer is actively reviewing it |
| `Need More Information` | Yes | Returned to applicant for clarification |
| `Approved` | No | Final — application approved |
| `Rejected` | No | Final — application rejected |

---

## State Diagram

```
                  ┌─────────────────┐
                  │      Draft       │ ◄──── initial state (on create)
                  └────────┬────────┘
                           │ submit
                           ▼
                  ┌─────────────────┐
                  │   Submitted      │
                  └────────┬────────┘
                           │ start-review
                           ▼
                  ┌─────────────────┐
                  │  Under Review    │
                  └──┬──────┬───────┘
          decision   │      │  decision          decision
          Approved   │      │  Rejected          Need More Info
                     ▼      ▼                        │
              ┌──────────┐  ┌──────────┐             ▼
              │ Approved │  │ Rejected │   ┌───────────────────────┐
              └──────────┘  └──────────┘   │  Need More Information │
              (terminal)    (terminal)      └──────────┬────────────┘
                                                       │ resubmit
                                                       ▼
                                              ┌─────────────────┐
                                              │   Submitted      │
                                              └─────────────────┘
```

---

## Transitions

### `submit` — Draft → Submitted

- **Trigger:** Applicant submits the application for review.
- **Role required:** `applicant` (own application only).
- **Allowed from:** `Draft` only.
- **Side effects:** `submitted_at` set to current UTC time.
- **API:** `POST /api/applications/{id}/submit`

---

### `start-review` — Submitted → Under Review

- **Trigger:** A reviewer picks up the application.
- **Role required:** `reviewer`.
- **Allowed from:** `Submitted` only.
- **Side effects:** None beyond status change.
- **API:** `POST /api/applications/{id}/start-review`

---

### `decision` — Under Review → Approved | Rejected | Need More Information

- **Trigger:** Reviewer records their decision.
- **Role required:** `reviewer`.
- **Allowed from:** `Under Review` only.
- **Side effects:** `reviewed_at` set to current UTC time; `reviewer_comment` saved.
- **Comment rules:**
  - `Approved` — comment optional.
  - `Rejected` — comment **required**.
  - `Need More Information` — comment **required** (tells the applicant what is missing).
- **API:** `POST /api/applications/{id}/decision`

---

### `resubmit` — Need More Information → Submitted

- **Trigger:** Applicant has addressed the reviewer's feedback and resubmits.
- **Role required:** `applicant` (own application only).
- **Allowed from:** `Need More Information` only.
- **Side effects:** `submitted_at` updated to current UTC time.
- **API:** `POST /api/applications/{id}/resubmit`

---

## Editability Rules

An application's fields (`applicant_name`, `applicant_email`, `company_name`, `application_type`, `description`) can only be modified via `PATCH` when the status is **Draft** or **Need More Information**. All other statuses are read-only.

This is enforced in `WorkflowService.can_edit()` and checked by the `PATCH` handler before persisting any changes.

---

## Error Behaviour

All invalid transition attempts raise a `django.core.exceptions.ValidationError` inside `WorkflowService`. The API layer catches this and returns `HTTP 400` with the error message in `{"detail": "..."}`.
