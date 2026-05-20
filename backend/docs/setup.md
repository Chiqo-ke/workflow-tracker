# Local Development Setup

## Prerequisites

- Python 3.10+
- pip
- Docker Desktop (optional — only needed for PostgreSQL in production-parity mode)

---

## 1. Clone and enter the backend directory

```bash
cd workflow-tracker/backend
```

---

## 2. Create and activate a virtual environment

```bash
python -m venv venv
```

**Windows (PowerShell)**
```powershell
.\venv\Scripts\Activate.ps1
```

**macOS / Linux**
```bash
source venv/bin/activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure environment variables

Copy the example file and fill in your values:

```bash
copy .env.example .env   # Windows
cp .env.example .env     # macOS / Linux
```

Open `.env` and set at minimum:

```ini
SECRET_KEY=<any long random string>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8081

# SQLite for local dev (no database server required)
DB_ENGINE=sqlite
```

> Leave the `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` values as-is —  
> they are ignored when `DB_ENGINE=sqlite`.

---

## 5. Run database migrations

```bash
python manage.py migrate
```

This creates `db.sqlite3` in the `backend/` directory.

---

## 6. Start the development server

> Per project convention, **start the server yourself** — it is never started automatically.

```bash
python manage.py runserver
```

The API will be available at:

| URL | Description |
|---|---|
| `http://localhost:8000/api/` | API root |
| `http://localhost:8000/api/docs` | Swagger UI (interactive docs) |

---

## Running Tests

```bash
python manage.py test apps.applications
```

Tests use SQLite in-memory by default (no running database required).

---

## Production: PostgreSQL setup

To switch to PostgreSQL (locally or in production), update `.env`:

```ini
DB_ENGINE=postgresql
DB_NAME=workflow_tracker
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

A Docker Compose file is included for a local Postgres instance:

```bash
docker compose up -d
python manage.py migrate
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | Yes | — | Django secret key |
| `DEBUG` | No | `False` | Enable debug mode |
| `ALLOWED_HOSTS` | Yes | — | Comma-separated list of allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Yes | — | Comma-separated list of allowed CORS origins |
| `DB_ENGINE` | No | `postgresql` | `sqlite` or `postgresql` |
| `DB_NAME` | No* | `workflow_tracker` | PostgreSQL database name |
| `DB_USER` | No* | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | No* | — | PostgreSQL password |
| `DB_HOST` | No* | `localhost` | PostgreSQL host |
| `DB_PORT` | No* | `5432` | PostgreSQL port |

\* Only used when `DB_ENGINE=postgresql`.
