import uuid

from django.db import models
from django.utils import timezone

from .enums import ApplicationStatus, ApplicationType


def generate_tracking_number() -> str:
    date_part = timezone.now().strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:5].upper()
    return f"APP-{date_part}-{unique_part}"


class Application(models.Model):
    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(max_length=50, choices=ApplicationType.choices)
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

    def __str__(self) -> str:
        return self.tracking_number
