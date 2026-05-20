from pydantic import EmailStr
from ninja import Schema


class RegisterSchema(Schema):
    username: str
    email: EmailStr
    password: str
    role: str = "applicant"


class UserOutSchema(Schema):
    id: int
    username: str
    email: str
    role: str
