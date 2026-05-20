# Postman — Workflow Tracker API

This folder contains a ready-to-import Postman collection and environment for the Workflow Tracker REST API.

## Files

| File | Description |
|---|---|
| `workflow-tracker.postman_collection.json` | All API endpoints organised into folders |
| `workflow-tracker.postman_environment.json` | Environment variables (base URL, tokens, application ID) |

---

## Quick Start

### 1. Import the environment

1. Open Postman → **Environments** (left sidebar) → **Import**.
2. Select `workflow-tracker.postman_environment.json`.
3. Click the environment dropdown (top-right) and select **Workflow Tracker — Local**.

### 2. Import the collection

1. Go to **Collections** → **Import**.
2. Select `workflow-tracker.postman_collection.json`.
3. The collection **Workflow Tracker API** will appear with three folders: **Auth**, **Applications**, **Workflow Actions**.

### 3. Start the backend

Make sure the Django server is running:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

### 4. Log in

1. Open **Auth → Login**.
2. Edit the request body with a valid `username` and `password`.
3. Send the request.

The built-in test script automatically saves the returned `access` and `refresh` tokens to the environment. All subsequent requests use `{{accessToken}}` in the `Authorization` header — no manual copy-pasting needed.

---

## Environment Variables

| Variable | Description | Set automatically? |
|---|---|---|
| `baseUrl` | Backend root URL (`http://localhost:8000`) | No — pre-filled in the environment file |
| `accessToken` | JWT access token | Yes — by the **Login** and **Refresh Token** requests |
| `refreshToken` | JWT refresh token | Yes — by the **Login** request |
| `applicationId` | ID used in detail/workflow requests | Yes — by the **Create Application** request |

---

## Typical Workflow to Test End-to-End

The numbered steps below mirror the actual application lifecycle. Use two separate Postman environments (or swap credentials) to simulate both roles.

**As an applicant:**
1. `Auth / Register` — create an account with `"role": "applicant"`.
2. `Auth / Login` — obtain tokens (saved automatically).
3. `Applications / Create Application` — creates a Draft; `applicationId` is saved.
4. `Applications / Update Application (PATCH)` — optional: edit any field.
5. `Workflow Actions / Submit` — moves to **Submitted**.

**As a reviewer:**
1. `Auth / Register` — create an account with `"role": "reviewer"`.
2. `Auth / Login` — obtain tokens.
3. `Applications / List Applications — Filter by Status` — set `status=Submitted` to find the application.
4. Update `applicationId` in the environment to the application's ID.
5. `Workflow Actions / Start Review` — moves to **Under Review**.
6. Send one of the three **Decision** requests:
   - **Approve** — terminal state.
   - **Reject** — terminal state (comment required).
   - **Need More Information** — returns to applicant for edits (comment required).

**Back as the applicant (if Need More Info):**
7. `Applications / Update Application (PATCH)` — address the reviewer's comment.
8. `Workflow Actions / Resubmit` — moves back to **Submitted**.

---

## Interactive API Docs

The Django backend also serves auto-generated Swagger UI at:

```
http://localhost:8000/api/docs
```

This is useful for exploring the schema and response shapes without Postman.
