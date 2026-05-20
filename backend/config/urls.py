from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from ninja_extra import exceptions as ninja_extra_exceptions
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.routers.obtain import obtain_pair_router
from ninja_jwt.routers.verify import verify_router

from apps.accounts.api import router as accounts_router
from apps.applications.api import router as applications_router

api = NinjaAPI(
    title="Workflow Tracker API",
    version="1.0.0",
    description="REST API for tracking application workflows.",
    auth=JWTAuth(),
)


def api_exception_handler(request, exc):
    headers = {}
    if isinstance(exc.detail, (list, dict)):
        data = exc.detail
    else:
        data = {"detail": exc.detail}
    response = api.create_response(request, data, status=exc.status_code)
    for k, v in headers.items():
        response.setdefault(k, v)
    return response


api.exception_handler(ninja_extra_exceptions.APIException)(api_exception_handler)

api.add_router("/applications", applications_router)
api.add_router("/auth", accounts_router)
api.add_router("/auth", obtain_pair_router)
api.add_router("/auth", verify_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
