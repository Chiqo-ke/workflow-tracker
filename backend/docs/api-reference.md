# API Reference

Base URL: `http://localhost:8000/api`

Interactive docs (Swagger UI): `http://localhost:8000/api/docs`

All request and response bodies are JSON. All timestamps are ISO 8601 UTC.

---

## Data Types

### ApplicationStatus

| Value | Description |
|---|---|
| `Draft` | Initial state — editable |
| `Submitted` | Submitted for review |
| `Under Review` | Reviewer has picked it up |
| `Need More Information` | Reviewer returned it for clarification — editable |
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
  "created_at": "2026-05-20T09:00:00Z",
  "updated_at": "2026-05-20T09:00:00Z",
  "submitted_at": null,
  "reviewed_at": null
}
```

## Error Object

Returned with 4xx responses.

```json
{
  "detail": "Human-readable error message."
}
```

---

## Endpoints

### Applications

#### `POST /api/applications/`

Create a new application in **Draft** status. A unique tracking number (`APP-YYYYMMDD-XXXXX`) is generated automatically.

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

| Status | Body |
|---|---|
| `201 Created` | Application object |

---

#### `GET /api/applications/`

Return all applications ordered by most recently created.

**Responses**

| Status | Body |
|---|---|
| `200 OK` | Array of Application objects |

---

#### `GET /api/applications/{id}`

Retrieve a single application by its primary key.

**Path parameters**

| Parameter | Type |
|---|---|
| `id` | integer |

**Responses**

| Status | Body |
|---|---|
| `200 OK` | Application object |
| `404 Not Found` | Error object |

---

#### `PATCH /api/applications/{id}`

Update fields on an application. Only allowed when status is **Draft** or **Need More Information**.

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
| `404 Not Found` | Error object | Application not found |

---

### Workflow Actions

All workflow endpoints are `POST` requests with no request body unless noted.

#### `POST /api/applications/{id}/submit`

Transition: **Draft → Submitted**

Sets `submitted_at` to the current UTC time.

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Status is not `Draft` |
| `404 Not Found` | Error object | Application not found |

---

#### `POST /api/applications/{id}/resubmit`

Transition: **Need More Information → Submitted**

Sets `submitted_at` to the current UTC time.

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Status is not `Need More Information` |
| `404 Not Found` | Error object | Application not found |

---

#### `POST /api/applications/{id}/start-review`

Transition: **Submitted → Under Review**

**Responses**

| Status | Body | When |
|---|---|---|
| `200 OK` | Application object | Transition succeeded |
| `400 Bad Request` | Error object | Status is not `Submitted` |
| `404 Not Found` | Error object | Application not found |

---

#### `POST /api/applications/{id}/decision`

Transition: **Under Review → Approved / Rejected / Need More Information**

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
| `404 Not Found` | Error object | Application not found |
