# Architecture & Data Flow

## Technology Stack

| Concern         | Library / Tool                  | Version   |
|-----------------|---------------------------------|-----------|
| UI framework    | React                           | 19.x      |
| Language        | TypeScript                      | 5.x       |
| Build tool      | Vite                            | 8.x       |
| Routing         | React Router DOM                | 7.x       |
| Server state    | TanStack Query (React Query)    | 5.x       |
| Styling         | Plain CSS with custom properties | —        |

No UI component library is used. All styles are written in vanilla CSS using design tokens and utility classes defined in `src/index.css`. Components reference these via CSS class names (e.g. `.badge--submitted`, `.btn-row`, `.btn-review`) rather than inline styles.

---

## Folder Responsibilities

```
types/        Single source of truth for TypeScript types. No business logic.
api/          Network layer. The only place fetch() is called.
hooks/        Server-state layer. The only place TanStack Query is used.
pages/        Route-level components. Compose hooks + components into views.
components/   Reusable presentational and interactive UI pieces.
```

The layers form a strict one-way dependency chain:

```
pages / components
       ↓
     hooks
       ↓
    api/client
       ↓
  Django REST API
```

No component calls `fetch` directly. No component imports from `api/client` directly. All network access flows through a hook.

---

## Request Lifecycle

```
User action (e.g. click Submit)
  → ActionButtons calls useSubmitApplication().mutate(id)
  → TanStack Query sends the request via api.post(...)
  → api/client.ts calls fetch(`/api/applications/${id}/submit`)
  → Vite dev proxy (or VITE_API_URL in prod) forwards to Django
  → Django returns updated Application JSON
  → onSuccess invalidates ["applications"] and ["applications", id] query keys
  → TanStack Query refetches stale queries
  → React re-renders with fresh data
```

---

## Application Status Workflow

The backend enforces all state transitions. The frontend only shows actions that are valid for the current status.

```
           ┌──────────┐
           │  Draft   │ ← created here (ApplicationFormPage)
           └────┬─────┘
                │ Submit
                ▼
         ┌─────────────┐
         │  Submitted  │
         └──────┬──────┘
                │ Start Review
                ▼
        ┌──────────────┐
        │ Under Review │
        └──────┬───────┘
         ┌─────┼──────┐
         │     │      │
      Approve  │   Reject
         │   Need More │
         │   Info      │
         ▼     ▼       ▼
     ┌────────┐ ┌──────────────────┐ ┌──────────┐
     │Approved│ │Need More Info    │ │ Rejected │
     └────────┘ └────────┬─────────┘ └──────────┘
                         │ Resubmit (applicant edits + resubmits)
                         └──────────────────► Submitted
```

`EDITABLE_STATUSES` (exported from `types/application.ts`) lists the statuses where an applicant can still edit the form: `["Draft", "Need More Information"]`.

---

## Caching Strategy

TanStack Query is configured globally in `src/main.tsx`:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,   // data considered fresh for 30 seconds
      retry: 1,            // retry failed requests once before showing error
    },
  },
})
```

Query keys are centralised in `useApplications.ts`:

```ts
applicationKeys.all              // ["applications"]              — unfiltered list
applicationKeys.filtered(status) // ["applications", { status }]  — status-filtered list
applicationKeys.detail(id)       // ["applications", id]          — single record
```

Every mutation invalidates the relevant keys on success, so the UI always reflects the latest state after a workflow action.

---

## Styling System

All design tokens are CSS custom properties defined in `:root` in `src/index.css`. Components use them via `var(--token-name)` in inline styles.

### Color Tokens

| Token                    | Use                                   |
|--------------------------|---------------------------------------|
| `--color-bg`             | Page background                       |
| `--color-surface`        | Card / panel background               |
| `--color-border`         | Borders and dividers                  |
| `--color-text-primary`   | Main body text                        |
| `--color-text-secondary` | Labels, captions                      |
| `--color-text-muted`     | Placeholder, empty states             |
| `--color-blue-bg/text`   | Info highlights, primary buttons      |
| `--color-green-bg/text`  | Approved status                       |
| `--color-amber-bg/text`  | Need More Information, reviewer notes |
| `--color-red-bg/text`    | Rejected status, errors               |
| `--color-gray-bg/text`   | Neutral secondary actions             |
| `--color-purple-bg/text` | Under Review status                   |

### Other Tokens

| Token           | Use              |
|-----------------|------------------|
| `--radius-sm`   | Small elements   |
| `--radius-md`   | Inputs, buttons  |
| `--radius-lg`   | Cards, panels    |
| `--font-sans`   | Body text        |
| `--font-mono`   | Tracking numbers |
