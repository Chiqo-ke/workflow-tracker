# Frontend — Application Workflow Tracker

A single-page application for managing regulatory applications through a defined review workflow. Built with React, TypeScript, and Vite.

---

## Quick Start

```bash
cd frontend
cp .env.example .env        # configure API URL if needed
npm install
npm run dev                 # starts at http://localhost:5173
```

The dev server proxies all `/api/*` requests to the Django backend at `http://localhost:8000`, so no CORS configuration is needed during development.

---

## Environment Variables

| Variable        | Default                   | Description                              |
|-----------------|---------------------------|------------------------------------------|
| `VITE_API_URL`  | `""` (uses Vite proxy)    | Backend base URL. Leave blank in dev. Set to the full URL (e.g. `https://api.example.com`) in production builds. |

Copy `.env.example` to `.env` before running the app.

---

## Available Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start dev server with HMR at `http://localhost:5173` |
| `npm run build`   | Type-check then compile to `dist/`               |
| `npm run preview` | Serve the production build locally               |
| `npm run lint`    | Run ESLint across all `.ts` / `.tsx` files       |

---

## Project Structure

```
frontend/
├── .env.example              # Required environment variable template
├── vite.config.ts            # Vite config — dev proxy lives here
├── tsconfig.json
├── index.html
├── docs/                     # This documentation
└── src/
    ├── main.tsx              # App entry point — mounts providers
    ├── App.tsx               # Route definitions
    ├── index.css             # Design tokens + global resets
    │
    ├── types/
    │   └── application.ts    # All TypeScript types and constants
    │
    ├── api/
    │   └── client.ts         # Thin fetch wrapper (never call fetch elsewhere)
    │
    ├── hooks/
    │   └── useApplications.ts  # All TanStack Query hooks
    │
    ├── pages/
    │   ├── ApplicationListPage.tsx    # "/" — table of all applications
    │   ├── ApplicationDetailPage.tsx  # "/applications/:id"
    │   └── ApplicationFormPage.tsx    # "/applications/new" and "/:id/edit"
    │
    └── components/
        ├── StatusBadge.tsx            # Colored status pill
        ├── ActionButtons.tsx          # Workflow action controls
        ├── ReviewerDecisionForm.tsx   # Inline reviewer decision form
        ├── LoadingSpinner.tsx         # Loading state indicator
        └── ErrorMessage.tsx           # Error display box
```

---

## Routes

| Path                        | Page                    | Description                     |
|-----------------------------|-------------------------|---------------------------------|
| `/`                         | `ApplicationListPage`   | Table of all applications       |
| `/applications/new`         | `ApplicationFormPage`   | Create a new draft application  |
| `/applications/:id`         | `ApplicationDetailPage` | Full detail view for one record |
| `/applications/:id/edit`    | `ApplicationFormPage`   | Edit a draft or returned application |
| `*`                         | Redirect to `/`         | Unknown paths fall back to list |

---

## Further Reading

- [Architecture & Data Flow](./architecture.md)
- [Components Reference](./components.md)
- [Hooks & API Client](./hooks-and-api.md)
