# Backend Build Plan — Application Workflow Tracker

## Stack

- Python 3.11+
- Django 4.2
- Django Ninja 1.x
- PostgreSQL 16
- psycopg2-binary
- python-decouple
- django-cors-headers

---

## Repository Structure

```
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── docker-compose.yml
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── apps/
    └── applications/
        ├── __init__.py
        ├── enums.py
        ├── models.py
        ├── schemas.py
        ├── services.py
        ├── api.py
        └── tests.py
```

---

## Step 1 — Project Bootstrap

### Commands

```bash
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate
pip install django==4.2 django-ninja django-cors-headers python-decouple psycopg2-binary
django-admin startproject config .
python manage.py startapp applications
mkdir -p apps/applications
mv applications/* apps/applications/
rm -rf applications
```

### `requirements.txt`

```
django>=4.2,<5.0
django-ninja>=1.0
django-cors-headers>=4.0
python-decouple>=3.8
psycopg2-binary>=2.9
```

### `.env.example`

```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DB_NAME=workflow_tracker
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

---

## Step 2 — Settings

### `config/settings.py`

Key sections only — keep everything else Django generated:

```python
from decouple import config, Csv

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

INSTALLED_APPS = [
    # django defaults...
    "corsheaders",
    "apps.applications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # must be first
    # django defaults...
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="workflow_tracker"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv())

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
```

---

## Step 3 — Docker Compose (local Postgres)

### `docker-compose.yml` (repo root)

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: workflow_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: yourpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Step 4 — Enums

### `apps/applications/enums.py`

```python
from django.db import models


class ApplicationStatus(models.TextChoices):
    DRAFT = "Draft", "Draft"
    SUBMITTED = "Submitted", "Submitted"
    UNDER_REVIEW = "Under Review", "Under Review"
    NEED_MORE_INFO = "Need More Information", "Need More Information"
    APPROVED = "Approved", "Approved"
    REJECTED = "Rejected", "Rejected"


class ApplicationType(models.TextChoices):
    RECORDATION = "Recordation", "Recordation"
    RENEWAL = "Renewal", "Renewal"
    CHANGE_OF_OWNERSHIP = "Change of Ownership", "Change of Ownership"
    CHANGE_OF_NAME = "Change of Name", "Change of Name"
    DISCONTINUATION = "Discontinuation", "Discontinuation"
```

---

## Step 5 — Model

### `apps/applications/models.py`

```python
import uuid
from django.db import models
from django.utils import timezone
from .enums import ApplicationStatus, ApplicationType


def generate_tracking_number():
    date_part = timezone.now().strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:5].upper()
    return f"APP-{date_part}-{unique_part}"


class Application(models.Model):
    tracking_number = models.CharField(
        max_length=20, unique=True, editable=False
    )
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(
        max_length=50, choices=ApplicationType.choices
    )
    description = models.TextField()
    status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.DRAFT,
    )
    reviewer_comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = generate_tracking_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.tracking_number
```

---

## Step 6 — Services Layer

All workflow business logic lives here. The API layer never directly mutates status fields.

### `apps/applications/services.py`

```python
from django.core.exceptions import ValidationError
from django.utils import timezone
from .enums import ApplicationStatus
from .models import Application


class WorkflowService:

    EDITABLE_STATUSES = {
        ApplicationStatus.DRAFT,
        ApplicationStatus.NEED_MORE_INFO,
    }

    @staticmethod
    def can_edit(application: Application) -> bool:
        return application.status in WorkflowService.EDITABLE_STATUSES

    @staticmethod
    def submit(application: Application) -> Application:
        if application.status != ApplicationStatus.DRAFT:
            raise ValidationError(
                f"Only Draft applications can be submitted. "
                f"Current status: {application.status}"
            )
        application.status = ApplicationStatus.SUBMITTED
        application.submitted_at = timezone.now()
        application.save(update_fields=["status", "submitted_at", "updated_at"])
        return application

    @staticmethod
    def resubmit(application: Application) -> Application:
        if application.status != ApplicationStatus.NEED_MORE_INFO:
            raise ValidationError(
                "Only applications with status 'Need More Information' can be resubmitted."
            )
        application.status = ApplicationStatus.SUBMITTED
        application.submitted_at = timezone.now()
        application.save(update_fields=["status", "submitted_at", "updated_at"])
        return application

    @staticmethod
    def start_review(application: Application) -> Application:
        if application.status != ApplicationStatus.SUBMITTED:
            raise ValidationError(
                f"Only Submitted applications can move to Under Review. "
                f"Current status: {application.status}"
            )
        application.status = ApplicationStatus.UNDER_REVIEW
        application.save(update_fields=["status", "updated_at"])
        return application

    @staticmethod
    def record_decision(
        application: Application,
        decision: str,
        comment: str | None,
    ) -> Application:
        if application.status != ApplicationStatus.UNDER_REVIEW:
            raise ValidationError(
                "Only Under Review applications can receive a decision."
            )

        allowed_decisions = {
            ApplicationStatus.APPROVED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.NEED_MORE_INFO,
        }
        if decision not in allowed_decisions:
            raise ValidationError(f"Invalid decision: {decision}")

        requires_comment = {
            ApplicationStatus.REJECTED,
            ApplicationStatus.NEED_MORE_INFO,
        }
        if decision in requires_comment and not comment:
            raise ValidationError(
                f"A comment is required when decision is '{decision}'."
            )

        application.status = decision
        application.reviewer_comment = comment or ""
        application.reviewed_at = timezone.now()
        application.save(
            update_fields=["status", "reviewer_comment", "reviewed_at", "updated_at"]
        )
        return application
```

---

## Step 7 — Schemas

### `apps/applications/schemas.py`

```python
from datetime import datetime
from typing import Optional
from ninja import Schema
from pydantic import EmailStr
from .enums import ApplicationStatus, ApplicationType


class ApplicationCreateSchema(Schema):
    applicant_name: str
    applicant_email: EmailStr
    company_name: str
    application_type: ApplicationType
    description: str


class ApplicationUpdateSchema(Schema):
    applicant_name: Optional[str] = None
    applicant_email: Optional[EmailStr] = None
    company_name: Optional[str] = None
    application_type: Optional[ApplicationType] = None
    description: Optional[str] = None


class ApplicationOutSchema(Schema):
    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str
    status: str
    reviewer_comment: Optional[str]
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]


class DecisionSchema(Schema):
    decision: ApplicationStatus
    comment: Optional[str] = None


class ErrorSchema(Schema):
    detail: str
```

---

## Step 8 — API Router

### `apps/applications/api.py`

```python
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from ninja import Router
from .models import Application
from .schemas import (
    ApplicationCreateSchema,
    ApplicationUpdateSchema,
    ApplicationOutSchema,
    DecisionSchema,
    ErrorSchema,
)
from .services import WorkflowService

router = Router()


@router.post("/", response={201: ApplicationOutSchema}, tags=["Applications"])
def create_application(request, payload: ApplicationCreateSchema):
    app = Application.objects.create(**payload.dict())
    return 201, app


@router.get("/", response=list[ApplicationOutSchema], tags=["Applications"])
def list_applications(request):
    return Application.objects.all()


@router.get("/{app_id}", response={200: ApplicationOutSchema, 404: ErrorSchema}, tags=["Applications"])
def get_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    return app


@router.patch(
    "/{app_id}",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Applications"],
)
def update_application(request, app_id: int, payload: ApplicationUpdateSchema):
    app = get_object_or_404(Application, id=app_id)
    if not WorkflowService.can_edit(app):
        return 400, {"detail": f"Applications with status '{app.status}' cannot be edited."}
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(app, attr, value)
    app.save()
    return app


@router.post(
    "/{app_id}/submit",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
)
def submit_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.submit(app)
    except ValidationError as e:
        return 400, {"detail": str(e.message)}


@router.post(
    "/{app_id}/resubmit",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
)
def resubmit_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.resubmit(app)
    except ValidationError as e:
        return 400, {"detail": str(e.message)}


@router.post(
    "/{app_id}/start-review",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
)
def start_review(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.start_review(app)
    except ValidationError as e:
        return 400, {"detail": str(e.message)}


@router.post(
    "/{app_id}/decision",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
)
def record_decision(request, app_id: int, payload: DecisionSchema):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.record_decision(app, payload.decision, payload.comment)
    except ValidationError as e:
        return 400, {"detail": str(e.message)}
```

### `config/urls.py`

```python
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from apps.applications.api import router as applications_router

api = NinjaAPI(title="Workflow Tracker API", version="1.0.0")
api.add_router("/applications", applications_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
```

---

## Step 9 — Tests

### `apps/applications/tests.py`

Write tests in this structure. Each class maps to one area of behaviour:

```python
from django.test import TestCase
from django.core.exceptions import ValidationError
from .models import Application
from .enums import ApplicationStatus, ApplicationType
from .services import WorkflowService


def make_app(status=ApplicationStatus.DRAFT) -> Application:
    app = Application.objects.create(
        applicant_name="Jane Doe",
        applicant_email="jane@example.com",
        company_name="Acme Ltd",
        application_type=ApplicationType.RENEWAL,
        description="Test application",
        status=status,
    )
    return app


class TrackingNumberTest(TestCase):
    def test_tracking_number_generated_on_create(self):
        app = make_app()
        self.assertTrue(app.tracking_number.startswith("APP-"))
        self.assertEqual(len(app.tracking_number), 18)  # APP-YYYYMMDD-XXXXX

    def test_tracking_number_unique(self):
        a1 = make_app()
        a2 = make_app()
        self.assertNotEqual(a1.tracking_number, a2.tracking_number)


class SubmitTest(TestCase):
    def test_submit_draft_succeeds(self):
        app = make_app(ApplicationStatus.DRAFT)
        WorkflowService.submit(app)
        self.assertEqual(app.status, ApplicationStatus.SUBMITTED)
        self.assertIsNotNone(app.submitted_at)

    def test_submit_non_draft_raises(self):
        for status in [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW,
                       ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]:
            with self.assertRaises(ValidationError):
                WorkflowService.submit(make_app(status))


class StartReviewTest(TestCase):
    def test_start_review_from_submitted(self):
        app = make_app(ApplicationStatus.SUBMITTED)
        WorkflowService.start_review(app)
        self.assertEqual(app.status, ApplicationStatus.UNDER_REVIEW)

    def test_start_review_from_draft_raises(self):
        with self.assertRaises(ValidationError):
            WorkflowService.start_review(make_app(ApplicationStatus.DRAFT))


class DecisionTest(TestCase):
    def test_approve(self):
        app = make_app(ApplicationStatus.UNDER_REVIEW)
        WorkflowService.record_decision(app, ApplicationStatus.APPROVED, None)
        self.assertEqual(app.status, ApplicationStatus.APPROVED)

    def test_reject_requires_comment(self):
        app = make_app(ApplicationStatus.UNDER_REVIEW)
        with self.assertRaises(ValidationError):
            WorkflowService.record_decision(app, ApplicationStatus.REJECTED, None)

    def test_reject_with_comment_succeeds(self):
        app = make_app(ApplicationStatus.UNDER_REVIEW)
        WorkflowService.record_decision(app, ApplicationStatus.REJECTED, "Incomplete documents.")
        self.assertEqual(app.status, ApplicationStatus.REJECTED)

    def test_need_more_info_requires_comment(self):
        app = make_app(ApplicationStatus.UNDER_REVIEW)
        with self.assertRaises(ValidationError):
            WorkflowService.record_decision(app, ApplicationStatus.NEED_MORE_INFO, "")

    def test_decision_from_non_under_review_raises(self):
        app = make_app(ApplicationStatus.SUBMITTED)
        with self.assertRaises(ValidationError):
            WorkflowService.record_decision(app, ApplicationStatus.APPROVED, None)


class CanEditTest(TestCase):
    def test_draft_is_editable(self):
        self.assertTrue(WorkflowService.can_edit(make_app(ApplicationStatus.DRAFT)))

    def test_need_more_info_is_editable(self):
        self.assertTrue(WorkflowService.can_edit(make_app(ApplicationStatus.NEED_MORE_INFO)))

    def test_submitted_not_editable(self):
        self.assertFalse(WorkflowService.can_edit(make_app(ApplicationStatus.SUBMITTED)))

    def test_approved_not_editable(self):
        self.assertFalse(WorkflowService.can_edit(make_app(ApplicationStatus.APPROVED)))

    def test_rejected_not_editable(self):
        self.assertFalse(WorkflowService.can_edit(make_app(ApplicationStatus.REJECTED)))


class ResubmitTest(TestCase):
    def test_resubmit_from_need_more_info(self):
        app = make_app(ApplicationStatus.NEED_MORE_INFO)
        WorkflowService.resubmit(app)
        self.assertEqual(app.status, ApplicationStatus.SUBMITTED)

    def test_resubmit_from_draft_raises(self):
        with self.assertRaises(ValidationError):
            WorkflowService.resubmit(make_app(ApplicationStatus.DRAFT))
```

---

## Step 10 — Migrations & Run

```bash
# Start Postgres
docker compose up -d

# Copy env
cp .env.example .env  # fill in real values

# Run migrations
python manage.py makemigrations applications
python manage.py migrate

# Run tests
python manage.py test apps.applications

# Start server
python manage.py runserver
```

API docs auto-generated by Django Ninja at: `http://localhost:8000/api/docs`

---

## API Endpoint Summary

| Method | Endpoint | Description | Edits state |
|--------|----------|-------------|-------------|
| POST | `/api/applications/` | Create draft | — |
| GET | `/api/applications/` | List all | — |
| GET | `/api/applications/{id}` | Get single | — |
| PATCH | `/api/applications/{id}` | Update (Draft or NMI only) | — |
| POST | `/api/applications/{id}/submit` | Draft → Submitted | ✓ |
| POST | `/api/applications/{id}/resubmit` | NMI → Submitted | ✓ |
| POST | `/api/applications/{id}/start-review` | Submitted → Under Review | ✓ |
| POST | `/api/applications/{id}/decision` | Under Review → decision | ✓ |

---

## Architecture Principles

- **Services layer owns all business logic.** `WorkflowService` is the only place that changes `status`. The API layer only handles HTTP — parsing, routing, and error formatting.
- **Enums are the single source of truth.** Defined once in `enums.py`, imported everywhere. No hardcoded status strings anywhere else.
- **`update_fields` on every service save.** Prevents accidental overwrites of unrelated fields and is more efficient on Postgres.
- **`ValidationError` as the domain error type.** Services raise it; the API layer catches it and maps it to HTTP 400. Clean separation.
- **No business logic in models.** Models are responsible for persistence only. `save()` only generates the tracking number — nothing else.
