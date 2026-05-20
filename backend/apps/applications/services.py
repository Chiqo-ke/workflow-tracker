from django.core.exceptions import ValidationError
from django.utils import timezone

from .enums import ApplicationStatus
from .models import Application


class WorkflowService:
    """Owns all workflow business logic. The only place status transitions occur."""

    EDITABLE_STATUSES: frozenset[str] = frozenset(
        {ApplicationStatus.DRAFT, ApplicationStatus.NEED_MORE_INFO}
    )

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

        allowed_decisions: frozenset[str] = frozenset(
            {
                ApplicationStatus.APPROVED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.NEED_MORE_INFO,
            }
        )
        if decision not in allowed_decisions:
            raise ValidationError(f"Invalid decision: {decision}")

        requires_comment: frozenset[str] = frozenset(
            {ApplicationStatus.REJECTED, ApplicationStatus.NEED_MORE_INFO}
        )
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
