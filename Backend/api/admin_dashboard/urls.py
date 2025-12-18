from django.urls import path
from .views import (
    admin_user_list_view,
    admin_user_detail_view,
    admin_match_list_view
)
from .stats_view import admin_stats_view

urlpatterns = [
    path('users/', admin_user_list_view, name='admin_user_list'),
    path('users/<str:user_id>/', admin_user_detail_view, name='admin_user_detail'),
    path('matches/', admin_match_list_view, name='admin_match_list'),
    path('stats/', admin_stats_view, name='admin_stats'),
]
