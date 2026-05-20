from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from ninja import Router
from ninja_jwt.authentication import JWTAuth

from .models import User
from .schemas import RegisterSchema, UserOutSchema

router = Router(tags=["Auth"])


@router.post("/register", response={201: UserOutSchema, 400: dict}, auth=None)
def register(request, payload: RegisterSchema):
    if User.objects.filter(username=payload.username).exists():
        return 400, {"detail": "Username already taken."}

    if payload.role not in (User.ROLE_APPLICANT, User.ROLE_REVIEWER):
        return 400, {"detail": "Role must be 'applicant' or 'reviewer'."}

    try:
        validate_password(payload.password)
    except DjangoValidationError as exc:
        return 400, {"detail": " ".join(exc.messages)}

    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        role=payload.role,
    )
    return 201, user


@router.get("/me", response=UserOutSchema, auth=JWTAuth())
def me(request):
    return request.auth
