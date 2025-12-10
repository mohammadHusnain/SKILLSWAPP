"""
Notification service module for SkillSwap.

This module provides centralized notification creation and delivery,
integrating with MongoDB for persistence and WebSocket for real-time delivery.
"""

import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from api.db import (
    create_notification,
    get_user_by_django_id,
    get_user_by_email
)

logger = logging.getLogger(__name__)

# Notification types
NOTIFICATION_TYPES = {
    'NEW_MESSAGE': 'new_message',
    'PAYMENT_SUCCESS': 'payment_success',
    'PAYMENT_RECEIVED': 'payment_received',
    'SUBSCRIPTION_UPDATED': 'subscription_updated',
    'SESSION_REQUEST': 'session_request',
    'SESSION_ACCEPT': 'session_accept',
    'SESSION_REJECT': 'session_reject'
}


def send_notification(user_id: str, notification_type: str, title: str, body: str, related_id: str = None) -> dict:
    """
    Create and send a notification to a user.
    
    This function:
    1. Creates the notification in MongoDB
    2. Attempts to send via WebSocket if user is online
    3. If user is offline, notification is stored and will be delivered on reconnect
    
    Args:
        user_id: MongoDB ObjectId string of the user
        notification_type: Type of notification (use NOTIFICATION_TYPES constants)
        title: Notification title
        body: Notification body/message
        related_id: Optional reference to conversation, payment, or request
        
    Returns:
        Created notification document
        
    Raises:
        ValueError: If validation fails
    """
    try:
        # Create notification in database
        notification = create_notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            related_id=related_id
        )
        
        # Attempt to send via WebSocket if user is online
        send_notification_websocket(user_id, notification)
        
        return notification
        
    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {e}")
        raise


def send_notification_websocket(user_id: str, notification: dict):
    """
    Send notification via WebSocket if user is online.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        notification: Notification document from MongoDB
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured, cannot send WebSocket notification")
            return
        
        # Format notification for WebSocket
        notification_data = {
            'id': str(notification.get('_id')),
            'type': notification.get('type'),
            'title': notification.get('title'),
            'body': notification.get('body'),
            'related_id': str(notification.get('related_id')) if notification.get('related_id') else None,
            'is_read': notification.get('is_read', False),
            'created_at': notification.get('created_at').isoformat() if notification.get('created_at') else None
        }
        
        # Send to user's notification group
        group_name = f'notifications_{user_id}'
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_received',
                'notification': notification_data
            }
        )
        
        logger.info(f"Sent notification {notification.get('_id')} to user {user_id} via WebSocket")
        
    except Exception as e:
        logger.error(f"Error sending notification via WebSocket: {e}")
        # Don't raise - notification is already saved, will be delivered on reconnect


def send_notification_to_django_user(django_user_id: int, notification_type: str, title: str, body: str, related_id: str = None) -> dict:
    """
    Convenience function to send notification using Django User ID.
    
    Args:
        django_user_id: Django User ID
        notification_type: Type of notification
        title: Notification title
        body: Notification body
        related_id: Optional related ID
        
    Returns:
        Created notification document
    """
    try:
        # Get MongoDB user
        mongo_user = get_user_by_django_id(django_user_id)
        if not mongo_user:
            raise ValueError(f"MongoDB user not found for Django user {django_user_id}")
        
        mongo_user_id = str(mongo_user['_id'])
        return send_notification(mongo_user_id, notification_type, title, body, related_id)
        
    except Exception as e:
        logger.error(f"Error sending notification to Django user {django_user_id}: {e}")
        raise

