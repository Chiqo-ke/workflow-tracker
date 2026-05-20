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
    reviewer_comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    owner_id: Optional[int] = None


class DecisionSchema(Schema):
    decision: ApplicationStatus
    comment: Optional[str] = None


class ErrorSchema(Schema):
    detail: str
