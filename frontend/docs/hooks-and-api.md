# Hooks & API Client Reference

---

## API Client — `src/api/client.ts`

A thin `fetch` wrapper. **No component or hook should call `fetch` directly** — all network requests go through this module.

### `api`

```ts
api.get<T>(path: string): Promise<T>
api.post<T>(path: string, body?: unknown): Promise<T>
api.patch<T>(path: string, body: unknown): Promise<T>
```

The `path` argument is appended to `VITE_API_URL` (or left as-is when the env var is empty, relying on the Vite dev proxy). All requests send `Content-Type: application/json`.

**Error handling:** Non-2xx responses throw an `ApiError`. A `204 No Content` response resolves with `undefined`.

### `ApiError`

```ts
class ApiError extends Error {
  status: number   // HTTP status code
  detail: string   // Message from the backend's "detail" field, or "Request failed"
}
```

Use `instanceof ApiError` to distinguish network errors from backend validation errors.

---

## Query Hooks — `src/hooks/useApplications.ts`

All hooks are built on TanStack Query v5. They return the same `UseQueryResult` / `UseMutationResult` shapes documented in [the TanStack Query docs](https://tanstack.com/query/latest).

### Query Key Factory

```ts
applicationKeys.all              // ["applications"]              — unfiltered list
applicationKeys.filtered(status) // ["applications", { status }]  — filtered list
applicationKeys.detail(id)       // ["applications", id]          — single record
```

Always use these constants when referencing cache keys — never hard-code strings.

---

### `useApplications(status?)`

Fetches the list of applications. Accepts an optional `status` string to filter results.

Reviewers use this hook with a status value to power the filter buttons on the list page.
Applicants call it with no argument to fetch all their own applications.

```ts
// All applications (applicant's own, or all for reviewers)
const { data, isLoading, isError } = useApplications();

// Filtered by status (reviewer filter buttons)
const { data } = useApplications("Submitted");
const { data } = useApplications("Under Review");
const { data } = useApplications("Need More Information");

// data: Application[] | undefined
```

**Endpoint:** `GET /api/applications/` (no filter) or `GET /api/applications/?status=<value>` (filtered)

---

### `useApplication(id)`

Fetches a single application by numeric ID.

```ts
const { data, isLoading, isError } = useApplication(42);
// data: Application | undefined
```

**Endpoint:** `GET /api/applications/{id}`

**Note:** The query is disabled (`enabled: false`) when `id` is falsy (e.g. `0` or `NaN`), so it is safe to call with `Number(undefined)` before an ID is available.

---

### `useCreateApplication()`

Creates a new application as a Draft.

```ts
const mutation = useCreateApplication();
mutation.mutate(payload, {
  onSuccess: (application) => { /* navigate, show toast, etc. */ },
  onError: (error) => { /* handle ApiError */ },
});
```

**Payload:** `CreateApplicationPayload`

```ts
{
  applicant_name: string;
  applicant_email: string;
  company_name: string;
  application_type: ApplicationType;
  description: string;
}
```

**Endpoint:** `POST /api/applications/`  
**On success:** Invalidates `applicationKeys.all`.

---

### `useUpdateApplication(id)`

Updates fields on a Draft or Need More Information application.

```ts
const mutation = useUpdateApplication(42);
mutation.mutate(partialPayload);
```

**Payload:** `UpdateApplicationPayload` — `Partial<CreateApplicationPayload>` (any subset of fields).

**Endpoint:** `PATCH /api/applications/{id}`  
**On success:** Invalidates `applicationKeys.all` and `applicationKeys.detail(id)`.

---

### `useSubmitApplication()`

Transitions a Draft application to Submitted.

```ts
const mutation = useSubmitApplication();
mutation.mutate(id);
```

**Endpoint:** `POST /api/applications/{id}/submit`  
**On success:** Invalidates list and detail queries for `id`.

---

### `useResubmitApplication()`

Transitions a Need More Information application back to Submitted after the applicant has made changes.

```ts
const mutation = useResubmitApplication();
mutation.mutate(id);
```

**Endpoint:** `POST /api/applications/{id}/resubmit`  
**On success:** Invalidates list and detail queries for `id`.

---

### `useStartReview()`

Transitions a Submitted application to Under Review.

```ts
const mutation = useStartReview();
mutation.mutate(id);
```

**Endpoint:** `POST /api/applications/{id}/start-review`  
**On success:** Invalidates list and detail queries for `id`.

---

### `useRecordDecision()`

Records a reviewer decision (Approve, Request More Information, or Reject) for an Under Review application.

```ts
const mutation = useRecordDecision();
mutation.mutate({
  id: 42,
  payload: {
    decision: "Approved",         // or "Need More Information" | "Rejected"
    comment: "Looks good.",       // required for Rejected / Need More Information
  },
});
```

**Payload:** `{ id: number; payload: DecisionPayload }`

```ts
interface DecisionPayload {
  decision: "Approved" | "Need More Information" | "Rejected";
  comment?: string;
}
```

**Endpoint:** `POST /api/applications/{id}/decision`  
**On success:** Invalidates list and detail queries for `id`.

---

## Adding a New Hook

1. Add the mutation function to `api/client.ts` if a new endpoint is needed.
2. Write the hook in `useApplications.ts` following the existing pattern.
3. Invalidate the relevant query keys in `onSuccess`.
4. Export the hook and import it in the component that needs it.

Do **not** create new `QueryClient` instances or call `useQueryClient` outside of `src/hooks/`.
