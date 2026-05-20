from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from ninja import Router

from .models import Application
from .schemas import (
    ApplicationCreateSchema,
    ApplicationOutSchema,
    ApplicationUpdateSchema,
    DecisionSchema,
    ErrorSchema,
)
from .services import WorkflowService

router = Router()


@router.post(
    "/",
    response={201: ApplicationOutSchema},
    tags=["Applications"],
    summary="Create a draft application",
)
def create_application(request, payload: ApplicationCreateSchema):
    app = Application.objects.create(**payload.dict())
    return 201, app


@router.get(
    "/",
    response=list[ApplicationOutSchema],
    tags=["Applications"],
    summary="List all applications",
)
def list_applications(request):
    return Application.objects.all()


@router.get(
    "/{app_id}",
    response={200: ApplicationOutSchema, 404: ErrorSchema},
    tags=["Applications"],
    summary="Retrieve a single application",
)
def get_application(request, app_id: int):
    return get_object_or_404(Application, id=app_id)


@router.patch(
    "/{app_id}",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Applications"],
    summary="Update a draft or NMI application",
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
    summary="Submit a draft application",
)
def submit_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.submit(app)
    except ValidationError as exc:
        return 400, {"detail": exc.message}


@router.post(
    "/{app_id}/resubmit",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
    summary="Resubmit after being asked for more information",
)
def resubmit_application(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.resubmit(app)
    except ValidationError as exc:
        return 400, {"detail": exc.message}


@router.post(
    "/{app_id}/start-review",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
    summary="Move a submitted application into review",
)
def start_review(request, app_id: int):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.start_review(app)
    except ValidationError as exc:
        return 400, {"detail": exc.message}


@router.post(
    "/{app_id}/decision",
    response={200: ApplicationOutSchema, 400: ErrorSchema, 404: ErrorSchema},
    tags=["Workflow"],
    summary="Record a review decision (Approved / Rejected / Need More Information)",
)
def record_decision(request, app_id: int, payload: DecisionSchema):
    app = get_object_or_404(Application, id=app_id)
    try:
        return WorkflowService.record_decision(app, payload.decision, payload.comment)
    except ValidationError as exc:
        return 400, {"detail": exc.message}
