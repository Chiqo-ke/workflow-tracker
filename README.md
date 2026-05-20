# Workflow Tracker

**Author:** ROBINSON MACHARIA  
**Email:** nyagamacharia6@gmail.com

---

A full-stack permit/licence application management system. Applicants submit applications through an online form; reviewers process them through a structured review workflow with approval, rejection, and clarification states.

**Tech stack:** Django 4.2 + Django Ninja (backend) · React 18 + TypeScript + Vite (frontend) · SQLite (development)

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Set up the backend](#2-set-up-the-backend)
  - [3. Set up the frontend](#3-set-up-the-frontend)
  - [4. Create test accounts](#4-create-test-accounts)
- [How It Works](#how-it-works)
  - [Roles](#roles)
  - [Application Lifecycle](#application-lifecycle)
  - [Reviewer Workflow](#reviewer-workflow)
- [Project Structure](#project-structure)
- [Detailed Documentation](#detailed-documentation)
- [API Testing with Postman](#api-testing-with-postman)

---

## Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Python | 3.10+ | Backend runtime |
| pip | latest | Comes with Python |
| Node.js | 18+ | Frontend build tooling |
| npm | 9+ | Comes with Node.js |
| Git | any | For cloning |

Docker Desktop is **optional** — only needed if you want to run PostgreSQL for production-parity testing. SQLite works out of the box for local development.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Chiqo-ke/workflow-tracker.git
cd workflow-tracker
```

### 2. Set up the backend

Open a terminal in the `backend/` directory.

#### a. Create and activate a virtual environment

```powershell
# Windows (PowerShell)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
cd backend
python -m venv venv
source venv/bin/activate
```

#### b. Install dependencies

```bash
pip install -r requirements.txt
```

#### c. Configure environment variables

```powershell
# Windows
copy .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Open `.env` and set at minimum:

```ini
SECRET_KEY=any-long-random-string-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DB_ENGINE=sqlite
```

#### d. Run database migrations

```bash
python manage.py migrate
```

#### e. Start the backend server

```bash
python manage.py runserver
```

The API is now available at **http://localhost:8000/api** and the interactive Swagger docs at **http://localhost:8000/api/docs**.

---

### 3. Set up the frontend

Open a **second** terminal in the `frontend/` directory.

#### a. Install dependencies

```bash
cd frontend
npm install
```

#### b. Configure environment variables (optional)

The frontend works with no configuration in development — the Vite dev server proxies `/api/*` requests to the Django backend automatically.

If you need to point at a different backend URL:

```powershell
# Windows
copy .env.example .env
```

```bash
cp .env.example .env
```

Then edit `VITE_API_URL` in `.env`. Leave it blank for local development.

#### c. Start the frontend dev server

```bash
npm run dev
```

The app is now available at **http://localhost:5173**.

---

### 4. Create test accounts

The quickest way to create test users is via the Django management shell:

```bash
# From backend/, with venv active
python manage.py shell
```

```python
from apps.accounts.models import User

User.objects.create_user(username="applicant1", password="testpass123", role="applicant")
User.objects.create_user(username="reviewer1",  password="testpass123", role="reviewer")
exit()
```

Alternatively, register accounts through the UI at **http://localhost:5173/register** or via the API — see [Postman setup](#api-testing-with-postman).

---

## How It Works

### Roles

Every user account has one of two roles, chosen at registration and fixed thereafter:

| Role | What they can do |
|---|---|
| **Applicant** | Create applications, edit their own drafts, submit and resubmit after clarification |
| **Reviewer** | View all applications, filter by status, start reviews, approve / reject / request more information |

Calling an endpoint with the wrong role returns `403 Forbidden`. The frontend hides irrelevant actions automatically based on the logged-in user's role.

### Application Lifecycle

Applications move through six states. The backend enforces all transitions; the frontend only shows the actions that are valid for the current state.

```
              ┌──────────┐
              │  Draft   │  ← Created here (applicant fills in the form)
              └────┬─────┘
                   │  Submit
                   ▼
           ┌──────────────┐
           │  Submitted   │  ← Reviewer picks it up
           └──────┬───────┘
                  │  Start Review
                  ▼
         ┌────────────────┐
         │  Under Review  │
         └──┬──────┬──────┘
            │      │      └─────────────────────────────┐
          Approve  Reject              Need More Information
            │      │                           │
            ▼      ▼                           ▼
        ┌────────┐ ┌──────────┐  ┌──────────────────────────┐
        │Approved│ │ Rejected │  │  Need More Information    │
        └────────┘ └──────────┘  └────────────┬─────────────┘
        (terminal) (terminal)                  │  Resubmit (applicant edits + resubmits)
                                               └───────────────► Submitted
```

| State | Who can act | Editable? |
|---|---|---|
| Draft | Applicant | Yes |
| Submitted | Reviewer | No |
| Under Review | Reviewer | No |
| Need More Information | Applicant | Yes |
| Approved | — | No (terminal) |
| Rejected | — | No (terminal) |

For full transition rules and comment requirements, see [backend/docs/workflow.md](backend/docs/workflow.md).

### Reviewer Workflow

After logging in as a reviewer, the application list page shows three filter buttons:

- **Submitted** — applications waiting to be picked up
- **Under Review** — applications you (or another reviewer) have started
- **Need More Information** — applications returned to applicants, awaiting resubmission

Click a button to filter the list to that queue. Click **Show All** to clear the filter. Click any row to open the full detail view where you can start a review or record a decision.

---

## Project Structure

```
workflow-tracker/
├── README.md                   ← You are here
│
├── backend/                    ← Django REST API
│   ├── apps/
│   │   ├── accounts/           ← User auth (register, login, roles)
│   │   └── applications/       ← Application CRUD + workflow engine
│   ├── config/                 ← Django settings, URLs, WSGI/ASGI
│   ├── docs/                   ← Backend documentation
│   │   ├── README.md
│   │   ├── setup.md
│   │   ├── api-reference.md
│   │   └── workflow.md
│   ├── manage.py
│   ├── requirements.txt
│   └── docker-compose.yml      ← Optional PostgreSQL for prod-parity
│
├── frontend/                   ← React + TypeScript SPA
│   ├── src/
│   │   ├── api/                ← Fetch wrapper (api/client.ts)
│   │   ├── hooks/              ← TanStack Query hooks
│   │   ├── pages/              ← Route-level components
│   │   ├── components/         ← Reusable UI components
│   │   ├── context/            ← Auth context (useAuth)
│   │   └── types/              ← TypeScript types and constants
│   ├── docs/                   ← Frontend documentation
│   │   ├── README.md
│   │   ├── architecture.md
│   │   ├── components.md
│   │   └── hooks-and-api.md
│   ├── vite.config.ts
│   └── package.json
│
└── postman/                    ← Postman collection for API testing
    ├── README.md
    ├── workflow-tracker.postman_collection.json
    └── workflow-tracker.postman_environment.json
```

---

## Detailed Documentation

### Backend

| Document | Description |
|---|---|
| [backend/docs/README.md](backend/docs/README.md) | Backend overview, architecture principles, project structure |
| [backend/docs/setup.md](backend/docs/setup.md) | Full local development setup, environment variables, running tests |
| [backend/docs/api-reference.md](backend/docs/api-reference.md) | Complete REST API endpoint reference with request/response examples |
| [backend/docs/workflow.md](backend/docs/workflow.md) | Application state machine — all states, transitions, and business rules |

### Frontend

| Document | Description |
|---|---|
| [frontend/docs/README.md](frontend/docs/README.md) | Frontend overview, scripts, routes, and environment variables |
| [frontend/docs/architecture.md](frontend/docs/architecture.md) | Data flow, caching strategy, styling system, and layer responsibilities |
| [frontend/docs/components.md](frontend/docs/components.md) | Props and behaviour for all components and pages |
| [frontend/docs/hooks-and-api.md](frontend/docs/hooks-and-api.md) | API client and all TanStack Query hooks |

### API Reference (interactive)

The live Swagger UI (auto-generated by Django Ninja) is available while the backend server is running:

**http://localhost:8000/api/docs**

---

## API Testing with Postman

A complete Postman collection is included in the `postman/` folder. It covers every endpoint with pre-filled request bodies, auto-saves tokens on login, and walks through the full applicant → reviewer lifecycle.

See [postman/README.md](postman/README.md) for step-by-step import instructions and a guide to testing the end-to-end workflow.
