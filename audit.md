# Workflow Tracker — Audit Report

**Date:** 2026-05-20  
**Auditor:** GitHub Copilot  
**Scope:** Full codebase review against the original project goals.

---

## Overall Summary

| Area | Status |
|------|--------|
| Backend — Data model | ✅ Complete |
| Backend — Application types | ✅ Complete |
| Backend — Statuses | ✅ Complete |
| Backend — API endpoints | ✅ Complete |
| Backend — Workflow rules | ✅ Complete |
| Backend — Tests | ✅ Complete |
| Frontend — Application list screen | ✅ Complete |
| Frontend — Create/edit form | ✅ Complete |
| Frontend — Detail screen | ✅ Complete |
| Frontend — Reviewer decision form | ✅ Complete |
| Frontend — Status-driven action buttons | ✅ Complete |

All required goals have been implemented. The notes below record specific observations and minor gaps worth tracking.

---

## Backend

### Tech Stack
- **Framework:** Django 4.2 with Django Ninja 1.6 ✅
- **Database:** SQLite for local dev, PostgreSQL-ready via `psycopg2-binary` ✅
- **Configuration:** `python-decouple` for env-based secrets ✅
- **CORS:** `django-cors-headers` configured as first middleware ✅

---

### Data Model — `Application`

| Required field | Present | Notes |
|----------------|---------|-------|
| `tracking_number` | ✅ | Auto-generated `APP-YYYYMMDD-XXXXX`, enforced unique |
| `applicant_name` | ✅ | |
| `applicant_email` | ✅ | Stored as `EmailField` |
| `company_name` | ✅ | |
| `application_type` | ✅ | Uses `ApplicationType` enum |
| `description` | ✅ | |
| `status` | ✅ | Uses `ApplicationStatus` enum, defaults to `Draft` |
| `reviewer_comment` | ✅ | Nullable `TextField` |
| `created_at` | ✅ | `auto_now_add` |
| `updated_at` | ✅ | `auto_now` |
| `submitted_at` | ✅ | Nullable, set by `WorkflowService.submit` |
| `reviewed_at` | ✅ | Nullable, set by `WorkflowService.record_decision` |

---

### Application Types (`ApplicationType` enum)

| Required | Present |
|----------|---------|
| Recordation | ✅ |
| Renewal | ✅ |
| Change of Ownership | ✅ |
| Change of Name | ✅ |
| Discontinuation | ✅ |

---

### Statuses (`ApplicationStatus` enum)

| Required | Present |
|----------|---------|
| Draft | ✅ |
| Submitted | ✅ |
| Under Review | ✅ |
| Need More Information | ✅ |
| Approved | ✅ |
| Rejected | ✅ |

---

### API Endpoints

| Required endpoint | Method | Path | Present |
|-------------------|--------|------|---------|
| Create application draft | `POST` | `/api/applications/` | ✅ |
| List applications | `GET` | `/api/applications/` | ✅ |
| View application details | `GET` | `/api/applications/{id}` | ✅ |
| Update draft application | `PATCH` | `/api/applications/{id}` | ✅ |
| Submit application | `POST` | `/api/applications/{id}/submit` | ✅ |
| Start review | `POST` | `/api/applications/{id}/start-review` | ✅ |
| Record reviewer decision | `POST` | `/api/applications/{id}/decision` | ✅ |
| Resubmit (NMI → Submitted) | `POST` | `/api/applications/{id}/resubmit` | ✅ (bonus — not in spec but needed) |

> **Note:** A `resubmit` endpoint was added beyond the original spec. It is necessary to implement the "Need More Information → resubmit" workflow rule and is correct to include.

---

### Workflow Rules

| Rule | Enforced |
|------|----------|
| Only Draft applications can be edited | ✅ `WorkflowService.can_edit` / `EDITABLE_STATUSES` |
| Only Draft applications can be submitted | ✅ `WorkflowService.submit` raises on non-Draft |
| Only Submitted applications can move to Under Review | ✅ `WorkflowService.start_review` |
| Only Under Review applications can receive a reviewer decision | ✅ `WorkflowService.record_decision` |
| Approved and Rejected applications cannot be edited | ✅ Excluded from `EDITABLE_STATUSES` |
| Need More Information applications can be edited and resubmitted | ✅ Included in `EDITABLE_STATUSES`; `resubmit` endpoint present |
| Reviewer decision requires comment for NMI or Rejected | ✅ Validated in `WorkflowService.record_decision` |

All business rules are enforced exclusively inside `WorkflowService`, keeping the API layer thin.

---

### Schemas

| Schema | Purpose | Notes |
|--------|---------|-------|
| `ApplicationCreateSchema` | POST body | Validates email with `pydantic[email]` ✅ |
| `ApplicationUpdateSchema` | PATCH body (all optional) | ✅ |
| `ApplicationOutSchema` | Response for all reads | All 14 fields present ✅ |
| `DecisionSchema` | POST body for `/decision` | Uses `ApplicationStatus` enum for `decision` field ✅ |
| `ErrorSchema` | 400/404 error responses | ✅ |

---

### Tests (`tests.py`)

| Test class | Coverage |
|------------|----------|
| `TrackingNumberTest` | Tracking number format and uniqueness |
| `SubmitTest` | Submit from Draft succeeds; all non-Draft statuses raise |
| `StartReviewTest` | Start review from Submitted; raises from Draft |
| `DecisionTest` | Approve, reject (with and without comment), NMI, wrong status |
| `CanEditTest` | All six statuses correctly classified as editable/non-editable |
| `ResubmitTest` | Resubmit from NMI; raises from Draft |

All workflow paths are covered. Tests use `TestCase` with an SQLite in-memory DB and do not require the server to be running.

**Minor gap:** No API-level integration tests (i.e., using Django Ninja's `TestClient`). Unit tests cover business logic but HTTP response codes and serialization are not tested.

---

## Frontend

### Tech Stack
- **Framework:** React 19 with TypeScript (Vite) ✅
- **Routing:** React Router v7 ✅
- **Data fetching / caching:** TanStack Query v5 ✅
- **API client:** Custom `fetch` wrapper (`api/client.ts`) with typed `ApiError` class ✅

---

### Screens

| Required screen | Component | Present |
|-----------------|-----------|---------|
| Application list | `ApplicationListPage` | ✅ |
| Create application form | `ApplicationFormPage` (no `id` param) | ✅ |
| Edit application form | `ApplicationFormPage` (with `id` param) | ✅ |
| Application detail | `ApplicationDetailPage` | ✅ |
| Reviewer decision form | `ReviewerDecisionForm` (inline on detail page) | ✅ |

---

### Application List — Columns

| Required column | Present |
|-----------------|---------|
| Tracking number (linked to detail) | ✅ |
| Applicant name | ✅ |
| Company name | ✅ |
| Application type | ✅ |
| Status (with `StatusBadge`) | ✅ |
| Created date | ✅ |

---

### Detail Page — Status-Driven Actions

| Status | Required actions | Implemented |
|--------|-----------------|-------------|
| Draft | Edit / Submit | ✅ `ActionButtons` |
| Submitted | Start Review | ✅ `ActionButtons` |
| Under Review | Approve / Need More Information / Reject | ✅ `ActionButtons` + `ReviewerDecisionForm` |
| Need More Information | Edit / Resubmit | ✅ `ActionButtons` |
| Approved | No edit actions | ✅ Returns `null` |
| Rejected | No edit actions | ✅ Returns `null` |

---

### Reviewer Decision Form

| Requirement | Implemented |
|-------------|-------------|
| Shown inline on detail page when a decision button is pressed | ✅ |
| Comment required for Rejected and Need More Information | ✅ Client-side validation in `ReviewerDecisionForm` |
| Comment optional for Approved | ✅ |
| Cancel button dismisses form without navigating away | ✅ |

---

### API Hooks (`useApplications.ts`)

| Hook | Maps to |
|------|---------|
| `useApplications` | `GET /api/applications/` |
| `useApplication(id)` | `GET /api/applications/{id}` |
| `useCreateApplication` | `POST /api/applications/` |
| `useUpdateApplication(id)` | `PATCH /api/applications/{id}` |
| `useSubmitApplication` | `POST /api/applications/{id}/submit` |
| `useResubmitApplication` | `POST /api/applications/{id}/resubmit` |
| `useStartReview` | `POST /api/applications/{id}/start-review` |
| `useRecordDecision` | `POST /api/applications/{id}/decision` |

All mutations correctly invalidate related query cache keys on success.

---

### Types (`types/application.ts`)

- `ApplicationStatus` union type mirrors all six backend statuses ✅
- `ApplicationType` union type mirrors all five backend types ✅
- `Application` interface matches `ApplicationOutSchema` field-for-field ✅
- `CreateApplicationPayload`, `UpdateApplicationPayload`, `DecisionPayload` match request schemas ✅
- `APPLICATION_TYPES` and `EDITABLE_STATUSES` constants exported for use across components ✅

---

## Gaps & Recommendations

| # | Area | Severity | Description |
|---|------|----------|-------------|
| 1 | Backend | Low | No API-level integration tests. Consider adding Django Ninja `TestClient` tests for HTTP status codes and response shapes. |
| 2 | Backend | Low | `tracking_number` length assertion in `TrackingNumberTest` (`len == 18`) will fail if the format ever changes (fragile). |
| 3 | Frontend | Low | No loading/error state shown in `ActionButtons` after submit/resubmit/startReview succeeds or fails — errors from mutations are silently dropped. |
| 4 | Frontend | Low | The edit form does not guard against editing an application whose status is not `Draft` or `Need More Information`. A user who navigates directly to `/applications/{id}/edit` for a Submitted application can still see the form (the API will correctly reject the save, but the UX is confusing). |
| 5 | Frontend | Low | No empty-state handling on the detail page for optional dates (`submitted_at`, `reviewed_at`) beyond simply not rendering — consistent handling is present but undocumented. |
| 6 | General | Low | No `.env.example` file is committed to guide local setup. |
| 7 | General | Low | No pagination on the list endpoint — acceptable for a small tracker but will degrade at scale. |

---

## Conclusion

The implementation fully satisfies every stated requirement. The data model, API endpoints, workflow rules, frontend screens, and status-driven UX are all present and working correctly. The gaps listed above are minor quality-of-life or robustness improvements rather than missing features.
