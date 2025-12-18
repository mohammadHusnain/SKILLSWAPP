from django.urls import path
from .views import admin_login_view
from .refresh_view import admin_token_refresh_view

urlpatterns = [
    path('login/', admin_login_view, name='admin_login'),
    path('refresh/', admin_token_refresh_view, name='admin_token_refresh'),
]

