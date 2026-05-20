# Workflow Tracker — Backend

A REST API for managing permit/licence applications through a structured review workflow. Built with **Django 4.2**, **Django Ninja**, and **SQLite** (development) / **PostgreSQL** (production).

## Documentation Index

| Document | Description |
|---|---|
| [setup.md](setup.md) | Local development setup, environment variables, running tests |
| [api-reference.md](api-reference.md) | Full REST API endpoint reference |
| [workflow.md](workflow.md) | Application state machine and transition rules |

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Django 4.2 |
| API | Django Ninja 1.x (OpenAPI/JSON Schema) |
| Authentication | ninja-jwt 5.x (JWT via `ninja_jwt`) |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL 16 |
| CORS | django-cors-headers |
| Config | python-decouple |
| DB driver | psycopg2-binary (PostgreSQL only) |

## Project Structure

```
backend/
├── config/                  # Django project configuration
│   ├── settings.py          # Settings (env-driven via python-decouple)
│   ├── urls.py              # Root URL conf — mounts Ninja API at /api/
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/            # User authentication domain
│   │   ├── models.py        # Custom User model (extends AbstractUser, adds role field)
│   │   ├── schemas.py       # RegisterSchema, UserOutSchema
│   │   ├── api.py           # /register and /me endpoints
│   │   ├── apps.py
│   │   └── migrations/
│   └── applications/        # Core application domain
│       ├── enums.py         # ApplicationStatus & ApplicationType enums
│       ├── models.py        # Application model (with owner FK → accounts.User)
│       ├── services.py      # WorkflowService — all state transitions
│       ├── schemas.py       # Pydantic schemas (request / response)
│       ├── api.py           # Django Ninja router (HTTP handlers + role guards)
│       ├── tests.py         # Unit tests
│       └── migrations/
├── docs/                    # This folder
├── manage.py
├── requirements.txt
├── docker-compose.yml       # Local PostgreSQL (optional, for prod-parity testing)
├── .env                     # Local secrets (git-ignored)
└── .env.example             # Env var template
```

## Architecture Principles

- **Services own business logic.** The `WorkflowService` class is the single place where status transitions occur. API handlers only do HTTP routing.
- **Enums are the source of truth.** All status and type values come from `ApplicationStatus` and `ApplicationType` — never raw strings in logic.
- **Surgical saves.** Every service method calls `save(update_fields=[...])` to avoid accidental full-model overwrites.
- **Domain errors via `ValidationError`.** Service methods raise `django.core.exceptions.ValidationError` for invalid transitions; API handlers catch and convert to HTTP 400.
- **Role-based access.** Every endpoint checks `request.auth.role` (`applicant` or `reviewer`). Applicants can only act on their own applications; reviewers can access any application but cannot create or edit them.
