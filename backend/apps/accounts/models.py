from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_APPLICANT = "applicant"
    ROLE_REVIEWER = "reviewer"

    ROLE_CHOICES = [
        (ROLE_APPLICANT, "Applicant"),
        (ROLE_REVIEWER, "Reviewer"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_APPLICANT,
    )

    def __str__(self):
        return f"{self.email} ({self.role})"
