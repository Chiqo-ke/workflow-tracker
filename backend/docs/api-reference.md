# API Reference

Base URL: `http://localhost:8000/api`

Interactive docs (Swagger UI): `http://localhost:8000/api/docs`

All request and response bodies are JSON. All timestamps are ISO 8601 UTC.

---

## Authentication

All endpoints **except** `POST /api/auth/register` and `POST /api/auth/token` require a valid JWT access token passed as a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after **8 hours**. Use `POST /api/auth/token/refresh` to obtain a new one without re-entering credentials.

### Roles

Every user has one of two roles, set at registration time:

| Role | Capabilities |
|---|---|
| `applicant` | Create applications, view and edit their own applications, submit and resubmit |
| `reviewer` | View all applications, start reviews, record decisions — cannot create or edit |

Calling an endpoint with the wrong role returns `403 Forbidden`.

---

## Data Types

### ApplicationStatus

| Value | Description |
|---|---|
| `Draft` | Initial state — editable by the owning applicant |
| `Submitted` | Submitted for review |
| `Under Review` | Reviewer has picked it up |
| `Need More Information` | Reviewer returned it for clarification — editable by the owning applicant |
| `Approved` | Final — approved |
| `Rejected` | Final — rejected |

### ApplicationType

| Value |
|---|
| `Recordation` |
| `Renewal` |
| `Change of Ownership` |
| `Change of Name` |
| `Discontinuation` |

---

## Application Object

Returned by all endpoints that produce an application resource.

```json
{
  "id": 1,
  "tracking_number": "APP-20260520-A3F9C",
  "applicant_name": "Jane Doe",
  "applicant_email": "jane@example.com",
  "company_name": "Acme Ltd",
  "application_type": "Renewal",
  "description": "Annual licence renewal for permit #1234.",
  "status": "Draft",
  "reviewer_comment": null,
  "owner_id": 3,
  "created_at": "2026-05-20T09:00:00Z",
  "updated_at": "2026-05-20T09:00:00Z",
  "submitted_at": null,
  "reviewed_at": null
}
```

| Field | Type | Description |
|---|---|---|
| `id` | integer | Primary key |
| `tracking_number` | string | Auto-generated `APP-YYYYMMDD-XXXXX` |
| `applicant_name` | string | — |
| `applicant_email` | string | — |
| `company_name` | string | — |
| `application_type` | `ApplicationType` | — |
| `description` | string | — |
| `status` | `ApplicationStatus` | Current workflow state |
| `reviewer_comment` | string \| null | Comment left by the reviewer |
| `owner_id` | integer \| null | PK of the user who created this application |
| `created_at` | ISO 8601 | — |
| `updated_at` | ISO 8601 | — |
| `submitted_at` | ISO 8601 \| null | Set when submitted or resubmitted |
| `reviewed_at` | ISO 8601 \| null | Set when a decision is recorded |

## Error Object

Returned with 4xx responses.

```json
{
  "detail": "Human-readable error message."
}
```

---

## Endpoints

### Authentication

#### `POST /api/auth/register`

Register a new user account. **No token required.**

**Request body**

```json
{
  "username": "jane",
  "email": "jane@example.com",
  "password": "s3cr3tP@ss",
  "role": "applicant"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | string | yes | Must be unique |
| `email` | email string | yes | — |
| `password` | string | yes | — |
| `role` | `"applicant"` \| `"reviewer"` | yes | Cannot be changed after registration |

**Responses**

| Status | Body |
|---|---|
| `201 Created` | `{ "id": 1, "username": "jane", "email": "jane@example.com", "role": "applicant" }` |
| `400 Bad Request` | Error object (e.g. username already taken) |

---

#### `POST /api/auth/token`

Obtain a JWT access + refresh token pair. **No token required.**

**Request body**

```json
{
  "username": "jane",
  "password": "s3cr3tP@ss"
}
```

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "access": "<jwt>", "refresh": "<jwt>" }` |
| `401 Unauthorized` | Error object |

Access tokens are valid for **8 hours**. Refresh tokens are valid for **7 days**.

---

#### `POST /api/auth/token/refresh`

Exchange a refresh token for a new access token. **No token required.**

**Request body**

```json
{
  "refresh": "<refresh_token>"
}
```

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "access": "<new_jwt>" }` |
| `401 Unauthorized` | Error object (expired or invalid refresh token) |

---

#### `GET /api/auth/me`

Return the authenticated user's profile. **Token required.**

**Responses**

| Status | Body |
|---|---|
| `200 OK` | `{ "id": 1, "username": "jane", "email": "jane@example.com", "role": "applicant" }` |
| `401 Unauthorized` | Error object |

---

### Applications

> All application endpoints require a valid `Authorization: Bearer <token>` header.

#### `POST /api/applications/`

Create a new application in **Draft** status. A unique tracking number (`APP-YYYYMMDD-XXXXX`) is generated automatically.

**Role required:** `applicant`

**Request body**

```json
{
  "applicant_name": "Jane Doe",
  "applicant_email": "jane@example.com",
  "company_name": "Acme Ltd",
  "application_type": "Renewal",
  "description": "Annual licence renewal for permit #1234."
}
```

| Field | Type | Required |
|---|---|---|
| `applicant_name` | string | yes |
| `applicant_email` | email string | yes |
| `company_name` | string | yes |
| `application_type` | `ApplicationType` | yes |
| `description` | string | yes |

**Responses**

| Status | Body | When |
|---|---|---|
| `201 Created` | Application object | Created; `owner_id` set to the calling user |
| `401 Unauthorized` | Error object | Missing or invalid token |
| `403 Forbidden` | Error object | Caller is a reviewer |

---

#### `GET /api/applications/`

Return applications ordered by most recently created.

- **Reviewers** receive all applications.
- **Applicants** receive only their own applications.

**Responses**

| Status | Body |
|---|---|
| `200 OK` | Array of Application objects |
| `401 Unauthorized` | Error object |

---

#### `GET /api/applications/{id}`

Retrieve a single application by its primary key.

- **Reviewers** can retrieve any application.
- **Applicants** can only retrieve their own; returns `403` for others.

**Path parameters**

| Parameter | Type |
|---|---|
| `id` | integer |

**Responses**

| Status | Body |
|---|---|
| `200 OK` | Application object |
| `401 Unauthorized` | Error object |
| `403 Forbidden` | Error object (applicant accessing another user's application) |
| `404 Not Found` | Error object |

---

#### `PATCH /api/applications/{id}`

Update fields on an application. Only allowed when status is **Draft** or **Need More Information**.

**Role required:** `applicant` (own application only)

**Path parameters**

| Parameter | Type |
|---|---|
| `id` | integer |

**Request body** — all fields optional

```json
{
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "company_name": "New Corp",
  "application_type": "Recordation",
  "description": "Updated description."
}
```

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Update succeeded |
| `400 Bad Request` | Error object | Status does not allow editing |
| `401 Unauthorized` | Error object | Missing or invalid token |
| `403 Forbidden` | Error object | Reviewer, or applicant accessing another user's application |
| `404 Not Found` | Error object | Application not found |

---

### Workflow Actions

All workflow endpoints are `POST` requests with no request body unless noted. All require `Authorization: Bearer <token>`.

#### `POST /api/applications/{id}/submit`

Transition: **Draft → Submitted**

**Role required:** `applicant` (own application only)

Sets `submitted_at` to the current UTC time.

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Status is not `Draft` |
| `401 Unauthorized` | Error object | — |
| `403 Forbidden` | Error object | Reviewer, or applicant accessing another user's application |
| `404 Not Found` | Error object | Application not found |

---

#### `POST /api/applications/{id}/resubmit`

Transition: **Need More Information → Submitted**

**Role required:** `applicant` (own application only)

Sets `submitted_at` to the current UTC time.

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Status is not `Need More Information` |
| `401 Unauthorized` | Error object | — |
| `403 Forbidden` | Error object | Reviewer, or applicant accessing another user's application |
| `404 Not Found` | Error object | Application not found |

---

#### `POST /api/applications/{id}/start-review`

Transition: **Submitted → Under Review**

**Role required:** `reviewer`

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Status is not `Submitted` |
| `401 Unauthorized` | Error object | — |
| `403 Forbidden` | Error object | Applicant attempting this action |
| `404 Not Found` | Error object | Application not found |

---

#### `POST /api/applications/{id}/decision`

Transition: **Under Review → Approved / Rejected / Need More Information**

**Role required:** `reviewer`

Sets `reviewed_at` to the current UTC time.

**Request body**

```json
{
  "decision": "Rejected",
  "comment": "Missing supporting documents."
}
```

| Field | Type | Required |
|---|---|---|
| `decision` | `Approved` \| `Rejected` \| `Need More Information` | yes |
| `comment` | string | Required when decision is `Rejected` or `Need More Information` |

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Invalid status, invalid decision, or missing required comment |
| `401 Unauthorized` | Error object | — |
| `403 Forbidden` | Error object | Applicant attempting this action |
| `404 Not Found` | Error object | Application not found |
