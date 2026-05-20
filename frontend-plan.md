# Frontend Build Plan — Application Workflow Tracker

## Stack

- React 18 + TypeScript
- Vite 5
- React Router v6
- TanStack Query v5
- Plain CSS with custom properties (no UI framework)

---

## Repository Structure

```
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── application.ts
    ├── api/
    │   └── client.ts
    ├── hooks/
    │   └── useApplications.ts
    ├── pages/
    │   ├── ApplicationListPage.tsx
    │   ├── ApplicationDetailPage.tsx
    │   └── ApplicationFormPage.tsx
    └── components/
        ├── StatusBadge.tsx
        ├── ActionButtons.tsx
        ├── ReviewerDecisionForm.tsx
        ├── LoadingSpinner.tsx
        └── ErrorMessage.tsx
```

---

## Step 1 — Bootstrap

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom @tanstack/react-query
npm install -D @types/react @types/react-dom
```

### `.env.example`

```
VITE_API_URL=http://localhost:8000
```

---

## Step 2 — Vite Config

### `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

The proxy means the frontend calls `/api/applications/` in dev and Vite forwards it to Django. No CORS issues. In production, point `VITE_API_URL` at the real backend.

---

## Step 3 — Types

### `src/types/application.ts`

This is the single source of truth for all type definitions in the frontend. Every component, hook, and utility imports from here.

```ts
export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Need More Information"
  | "Approved"
  | "Rejected";

export type ApplicationType =
  | "Recordation"
  | "Renewal"
  | "Change of Ownership"
  | "Change of Name"
  | "Discontinuation";

export interface Application {
  id: number;
  tracking_number: string;
  applicant_name: string;
  applicant_email: string;
  company_name: string;
  application_type: ApplicationType;
  description: string;
  status: ApplicationStatus;
  reviewer_comment: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface CreateApplicationPayload {
  applicant_name: string;
  applicant_email: string;
  company_name: string;
  application_type: ApplicationType;
  description: string;
}

export type UpdateApplicationPayload = Partial<CreateApplicationPayload>;

export interface DecisionPayload {
  decision: "Approved" | "Need More Information" | "Rejected";
  comment?: string;
}

export const APPLICATION_TYPES: ApplicationType[] = [
  "Recordation",
  "Renewal",
  "Change of Ownership",
  "Change of Name",
  "Discontinuation",
];

export const EDITABLE_STATUSES: ApplicationStatus[] = [
  "Draft",
  "Need More Information",
];
```

---

## Step 4 — API Client

### `src/api/client.ts`

A thin wrapper around `fetch`. All components and hooks go through this — never call `fetch` directly in a component.

```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new ApiError(res.status, error.detail ?? "Request failed");
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
};

export { ApiError };
```

---

## Step 5 — Query Hooks

### `src/hooks/useApplications.ts`

All TanStack Query logic in one file. Components never manage fetch state themselves.

```ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "../api/client";
import type {
  Application,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  DecisionPayload,
} from "../types/application";

// Query key factory — centralises cache key structure
export const applicationKeys = {
  all: ["applications"] as const,
  detail: (id: number) => ["applications", id] as const,
};

export function useApplications(): UseQueryResult<Application[]> {
  return useQuery({
    queryKey: applicationKeys.all,
    queryFn: () => api.get<Application[]>("/api/applications/"),
  });
}

export function useApplication(id: number): UseQueryResult<Application> {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => api.get<Application>(`/api/applications/${id}`),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) =>
      api.post<Application>("/api/applications/", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicationKeys.all }),
  });
}

export function useUpdateApplication(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateApplicationPayload) =>
      api.patch<Application>(`/api/applications/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Application>(`/api/applications/${id}/submit`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useResubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Application>(`/api/applications/${id}/resubmit`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useStartReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.post<Application>(`/api/applications/${id}/start-review`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}

export function useRecordDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DecisionPayload }) =>
      api.post<Application>(`/api/applications/${id}/decision`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}
```

---

## Step 6 — Global Setup

### `src/main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### `src/App.tsx`

```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import ApplicationListPage from "./pages/ApplicationListPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import ApplicationFormPage from "./pages/ApplicationFormPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationListPage />} />
      <Route path="/applications/new" element={<ApplicationFormPage />} />
      <Route path="/applications/:id" element={<ApplicationDetailPage />} />
      <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

### `src/index.css`

Define all design tokens here. Components reference variables — no hardcoded colors anywhere.

```css
:root {
  --color-bg: #f9f9f8;
  --color-surface: #ffffff;
  --color-border: #e4e2db;
  --color-text-primary: #1a1a18;
  --color-text-secondary: #6b6b66;
  --color-text-muted: #9c9a92;

  --color-blue-bg: #e6f1fb;
  --color-blue-text: #0c447c;
  --color-purple-bg: #eeedfe;
  --color-purple-text: #3c3489;
  --color-amber-bg: #faeeda;
  --color-amber-text: #633806;
  --color-green-bg: #eaf3de;
  --color-green-text: #27500a;
  --color-red-bg: #fcebeb;
  --color-red-text: #791f1f;
  --color-gray-bg: #f1efe8;
  --color-gray-text: #444441;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", monospace;

  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--color-text-primary);
  background-color: var(--color-bg);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

a {
  color: var(--color-blue-text);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: 0.875rem;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  transition: opacity 0.15s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input, select, textarea {
  font-family: inherit;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  width: 100%;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color 0.15s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--color-blue-text);
}
```

---

## Step 7 — Shared Components

### `src/components/StatusBadge.tsx`

```tsx
import type { ApplicationStatus } from "../types/application";

const STATUS_STYLES: Record<ApplicationStatus, { bg: string; color: string }> = {
  Draft:                  { bg: "var(--color-gray-bg)",   color: "var(--color-gray-text)" },
  Submitted:              { bg: "var(--color-blue-bg)",   color: "var(--color-blue-text)" },
  "Under Review":         { bg: "var(--color-purple-bg)", color: "var(--color-purple-text)" },
  "Need More Information":{ bg: "var(--color-amber-bg)",  color: "var(--color-amber-text)" },
  Approved:               { bg: "var(--color-green-bg)",  color: "var(--color-green-text)" },
  Rejected:               { bg: "var(--color-red-bg)",    color: "var(--color-red-text)" },
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
```

### `src/components/LoadingSpinner.tsx`

```tsx
export default function LoadingSpinner() {
  return (
    <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
      Loading…
    </div>
  );
}
```

### `src/components/ErrorMessage.tsx`

```tsx
interface Props {
  message?: string;
}

export default function ErrorMessage({ message = "Something went wrong." }: Props) {
  return (
    <div
      style={{
        background: "var(--color-red-bg)",
        color: "var(--color-red-text)",
        padding: "1rem",
        borderRadius: "var(--radius-md)",
        marginBottom: "1rem",
      }}
    >
      {message}
    </div>
  );
}
```

### `src/components/ReviewerDecisionForm.tsx`

```tsx
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
```

### `src/components/ActionButtons.tsx`

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSubmitApplication,
  useResubmitApplication,
  useStartReview,
} from "../hooks/useApplications";
import type { Application } from "../types/application";
import ReviewerDecisionForm from "./ReviewerDecisionForm";

interface Props {
  application: Application;
}

type DecisionType = "Approved" | "Need More Information" | "Rejected";

export default function ActionButtons({ application }: Props) {
  const navigate = useNavigate();
  const [activeDecision, setActiveDecision] = useState<DecisionType | null>(null);
  const submit = useSubmitApplication();
  const resubmit = useResubmitApplication();
  const startReview = useStartReview();

  const { id, status } = application;

  if (status === "Draft") {
    return (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => navigate(`/applications/${id}/edit`)}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Edit
        </button>
        <button
          onClick={() => submit.mutate(id)}
          disabled={submit.isPending}
          style={{ background: "var(--color-blue-text)", color: "#fff" }}
        >
          {submit.isPending ? "Submitting…" : "Submit"}
        </button>
      </div>
    );
  }

  if (status === "Submitted") {
    return (
      <button
        onClick={() => startReview.mutate(id)}
        disabled={startReview.isPending}
        style={{ background: "var(--color-purple-text)", color: "#fff" }}
      >
        {startReview.isPending ? "Starting…" : "Start Review"}
      </button>
    );
  }

  if (status === "Under Review") {
    return (
      <div>
        {!activeDecision && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setActiveDecision("Approved")}
              style={{ background: "var(--color-green-text)", color: "#fff" }}
            >
              Approve
            </button>
            <button
              onClick={() => setActiveDecision("Need More Information")}
              style={{ background: "var(--color-amber-text)", color: "#fff" }}
            >
              Request More Info
            </button>
            <button
              onClick={() => setActiveDecision("Rejected")}
              style={{ background: "var(--color-red-text)", color: "#fff" }}
            >
              Reject
            </button>
          </div>
        )}
        {activeDecision && (
          <ReviewerDecisionForm
            applicationId={id}
            decision={activeDecision}
            onClose={() => setActiveDecision(null)}
          />
        )}
      </div>
    );
  }

  if (status === "Need More Information") {
    return (
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => navigate(`/applications/${id}/edit`)}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Edit
        </button>
        <button
          onClick={() => resubmit.mutate(id)}
          disabled={resubmit.isPending}
          style={{ background: "var(--color-blue-text)", color: "#fff" }}
        >
          {resubmit.isPending ? "Resubmitting…" : "Resubmit"}
        </button>
      </div>
    );
  }

  // Approved / Rejected — no actions
  return null;
}
```

---

## Step 8 — Pages

### `src/pages/ApplicationListPage.tsx`

```tsx
import { Link } from "react-router-dom";
import { useApplications } from "../hooks/useApplications";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function ApplicationListPage() {
  const { data: applications, isLoading, isError } = useApplications();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 500 }}>Applications</h1>
        <Link to="/applications/new">
          <button style={{ background: "var(--color-blue-text)", color: "#fff" }}>
            + New Application
          </button>
        </Link>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message="Failed to load applications." />}

      {applications && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
              {["Tracking #", "Applicant", "Company", "Type", "Status", "Created"].map((h) => (
                <th key={h} style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td style={{ padding: "0.875rem 1rem" }}>
                  <Link
                    to={`/applications/${app.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}
                  >
                    {app.tracking_number}
                  </Link>
                </td>
                <td style={{ padding: "0.875rem 1rem" }}>{app.applicant_name}</td>
                <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-secondary)" }}>{app.company_name}</td>
                <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-secondary)" }}>{app.application_type}</td>
                <td style={{ padding: "0.875rem 1rem" }}>
                  <StatusBadge status={app.status} />
                </td>
                <td style={{ padding: "0.875rem 1rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  {new Date(app.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### `src/pages/ApplicationDetailPage.tsx`

```tsx
import { useParams, Link } from "react-router-dom";
import { useApplication } from "../hooks/useApplications";
import StatusBadge from "../components/StatusBadge";
import ActionButtons from "../components/ActionButtons";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: app, isLoading, isError } = useApplication(Number(id));

  if (isLoading) return <LoadingSpinner />;
  if (isError || !app) return <ErrorMessage message="Application not found." />;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to="/" style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          ← All applications
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
            {app.tracking_number}
          </h1>
          <div style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            {app.application_type}
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
          <Field label="Applicant name" value={app.applicant_name} />
          <Field label="Applicant email" value={app.applicant_email} />
          <Field label="Company" value={app.company_name} />
          <Field label="Type" value={app.application_type} />
        </div>
        <Field label="Description" value={<p style={{ whiteSpace: "pre-wrap" }}>{app.description}</p>} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 2rem", marginTop: "0.5rem" }}>
          <Field label="Created" value={new Date(app.created_at).toLocaleString()} />
          {app.submitted_at && <Field label="Submitted" value={new Date(app.submitted_at).toLocaleString()} />}
          {app.reviewed_at && <Field label="Reviewed" value={new Date(app.reviewed_at).toLocaleString()} />}
        </div>
      </div>

      {app.reviewer_comment && (
        <div
          style={{
            background: "var(--color-amber-bg)",
            border: "1px solid",
            borderColor: "var(--color-amber-text)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "var(--color-amber-text)", marginBottom: "0.5rem", fontWeight: 500, textTransform: "uppercase" }}>
            Reviewer comment
          </div>
          <p style={{ color: "var(--color-amber-text)" }}>{app.reviewer_comment}</p>
        </div>
      )}

      <ActionButtons application={app} />
    </div>
  );
}
```

### `src/pages/ApplicationFormPage.tsx`

Used for both create and edit. When `id` is in the URL, it fetches and pre-fills the form.

```tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApplication, useCreateApplication, useUpdateApplication } from "../hooks/useApplications";
import type { CreateApplicationPayload, ApplicationType } from "../types/application";
import { APPLICATION_TYPES } from "../types/application";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const EMPTY_FORM: CreateApplicationPayload = {
  applicant_name: "",
  applicant_email: "",
  company_name: "",
  application_type: "Recordation",
  description: "",
};

export default function ApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading } = useApplication(Number(id));
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication(Number(id));

  const [form, setForm] = useState<CreateApplicationPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        applicant_name: existing.applicant_name,
        applicant_email: existing.applicant_email,
        company_name: existing.company_name,
        application_type: existing.application_type,
        description: existing.description,
      });
    }
  }, [existing]);

  if (isEdit && isLoading) return <LoadingSpinner />;

  function handleChange(field: keyof CreateApplicationPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    setError(null);
    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(form as never, {
      onSuccess: (result: { id: number }) => navigate(`/applications/${result.id}`),
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to save application.";
        setError(msg);
      },
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link to={isEdit ? `/applications/${id}` : "/"} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          ← {isEdit ? "Back to application" : "All applications"}
        </Link>
      </div>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 500, marginBottom: "1.5rem" }}>
        {isEdit ? "Edit application" : "New application"}
      </h1>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {(
          [
            { label: "Applicant name", field: "applicant_name", type: "text" },
            { label: "Applicant email", field: "applicant_email", type: "email" },
            { label: "Company name", field: "company_name", type: "text" },
          ] as const
        ).map(({ label, field, type }) => (
          <div key={field}>
            <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              {label}
            </label>
            <input
              type={type}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
            />
          </div>
        ))}

        <div>
          <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Application type
          </label>
          <select
            value={form.application_type}
            onChange={(e) => handleChange("application_type", e.target.value as ApplicationType)}
          >
            {APPLICATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Description
          </label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          style={{ background: "var(--color-blue-text)", color: "#fff" }}
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create draft"}
        </button>
        <button
          onClick={() => navigate(isEdit ? `/applications/${id}` : "/")}
          style={{ background: "var(--color-gray-bg)", color: "var(--color-gray-text)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
```

---

## Step 9 — Run

```bash
# Install dependencies
cd frontend
npm install

# Copy env
cp .env.example .env

# Start dev server
npm run dev
```

App available at `http://localhost:5173`. The Vite proxy forwards `/api/*` to Django on port 8000.

---

## Architecture Principles

- **TanStack Query owns all server state.** No `useState` or `useEffect` for fetching. Components call hooks; hooks call the API client. The query cache handles loading, error, and stale states.
- **One hook file.** All query and mutation logic lives in `useApplications.ts`. This makes it trivial to see every API call the frontend makes.
- **Query key factory.** `applicationKeys` centralises cache key structure. Mutations invalidate by key — no string duplication across the codebase.
- **API client is the only place `fetch` is called.** Every request goes through `api.get`, `api.post`, or `api.patch`. Error handling and base URL live in one place.
- **Types are the contract.** `src/types/application.ts` mirrors the backend schemas exactly. If the backend changes a field, TypeScript surfaces it immediately across the whole frontend.
- **CSS custom properties, no framework.** Design tokens defined once at `:root`. Components use variables — no hardcoded hex values. Easy to retheme.
- **`ActionButtons` is the workflow enforcer.** All status-conditional UI logic is colocated here. No scattered `if status === "Draft"` checks across pages.
