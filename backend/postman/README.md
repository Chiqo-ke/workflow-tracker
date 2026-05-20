# Postman Collections

Two files for importing into Postman:

| File | Import as |
|---|---|
| `workflow-tracker.postman_collection.json` | Collection |
| `workflow-tracker.postman_environment.json` | Environment |

---

## Import steps

1. Open Postman.
2. Click **Import** (top-left).
3. Drag both JSON files in, or click **Upload Files** and select them.
4. In the environment selector (top-right), choose **Workflow Tracker — Local Dev**.

---

## Collection structure

### Applications — CRUD

Individual requests for each endpoint:

| Request | Method | Path |
|---|---|---|
| Create Application | `POST` | `/api/applications/` |
| List Applications | `GET` | `/api/applications/` |
| Get Application | `GET` | `/api/applications/{{appId}}` |
| Update Application | `PATCH` | `/api/applications/{{appId}}` |

### Workflow Actions

One request per transition, with correct bodies and saved example responses for both success and error cases:

| Request | Transition |
|---|---|
| Submit | Draft → Submitted |
| Start Review | Submitted → Under Review |
| Decision — Approved | Under Review → Approved |
| Decision — Rejected | Under Review → Rejected |
| Decision — Need More Information | Under Review → Need More Information |
| Resubmit | Need More Information → Submitted |

### Happy Path — Full Workflow

Four requests run in order: Create → Submit → Start Review → Approve.  
The **Create Application** request includes a test script that automatically sets the `appId` collection variable from the response, so subsequent requests work without manual copy-paste.

### Need More Info — Re-review Workflow

Eight requests covering the full loop: Create → Submit → Review → Need More Info → Update → Resubmit → Review → Approve.

---

## Variables

| Variable | Set by | Description |
|---|---|---|
| `baseUrl` | Environment file | `http://localhost:8000/api` by default |
| `appId` | Test script or manually | Primary key of the application under test |

To test a specific application, set `appId` in the environment (pencil icon next to the environment selector).
