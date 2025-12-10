"""
WebSocket URL routing for chat messaging.

This module defines the URL patterns for WebSocket connections.
"""

from django.urls import re_path
from api.messages.consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<conversation_id>[^/]+)/$', ChatConsumer.as_asgi()),
]

