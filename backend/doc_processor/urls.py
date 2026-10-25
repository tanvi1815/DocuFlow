from django.urls import path
from .views import health_check, upload_document, ask_question


urlpatterns = [
    path("health/", health_check),
    path("upload/", upload_document),
    path("ask/", ask_question, name="ask_question"),
]