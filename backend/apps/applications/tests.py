from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.accounts.models import User

from .enums import ApplicationStatus, ApplicationType
from .models import Application
from .services import WorkflowService


def make_user(username: str = "testuser") -> User:
    return User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="testpass123",
        role=User.ROLE_APPLICANT,
    )


def make_app(status: str = ApplicationStatus.DRAFT, owner: User | None = None) -> Application:
    if owner is None:
        owner = make_user(username=f"user_{status}_{id(object())}")
    return Application.objects.create(
        applicant_name="Jane Doe",
        applicant_email="jane@example.com",
        company_name="Acme Ltd",
        application_type=ApplicationType.RENEWAL,
        description="Test application",
        status=status,
        owner=owner,
    )


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
        non_draft_statuses = [
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.APPROVED,
            ApplicationStatus.REJECTED,
        ]
        for status in non_draft_statuses:
            with self.subTest(status=status):
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

    def test_reviewed_at_set_on_decision(self):
        app = make_app(ApplicationStatus.UNDER_REVIEW)
        WorkflowService.record_decision(app, ApplicationStatus.APPROVED, None)
        self.assertIsNotNone(app.reviewed_at)


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
        self.assertIsNotNone(app.submitted_at)

    def test_resubmit_from_draft_raises(self):
        with self.assertRaises(ValidationError):
            WorkflowService.resubmit(make_app(ApplicationStatus.DRAFT))
