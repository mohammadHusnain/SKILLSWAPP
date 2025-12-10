"""
Notification views for SkillSwap API.

This module contains REST API endpoints for managing notifications.
"""

import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from bson.errors import InvalidId

from api.db import (
    get_user_by_django_id,
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    get_unread_count,
    get_notification_by_id,
    delete_notification
)

logger = logging.getLogger(__name__)


def convert_objectid_to_str(data):
    """
    Recursively convert ObjectId fields to strings for JSON serialization.
    
    Args:
        data: Any data structure that may contain ObjectIds
        
    Returns:
        Data structure with all ObjectIds converted to strings
    """
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if key == '_id':
                result[key] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, (dict, list)):
                result[key] = convert_objectid_to_str(value)
            else:
                result[key] = value
        return result
    elif isinstance(data, list):
        return [convert_objectid_to_str(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications_view(request):
    """
    Get user's notifications with pagination.
    
    GET /api/notifications/?limit=50&skip=0&unread_only=false
    """
    try:
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Get query parameters
        limit = int(request.GET.get('limit', 50))
        skip = int(request.GET.get('skip', 0))
        unread_only = request.GET.get('unread_only', 'false').lower() == 'true'
        
        # Get notifications
        notifications = get_user_notifications(
            user_id=user_id,
            limit=limit,
            skip=skip,
            unread_only=unread_only
        )
        
        # Convert ObjectIds to strings
        serialized_notifications = [convert_objectid_to_str(notif) for notif in notifications]
        
        # Format timestamps
        for notif in serialized_notifications:
            if notif.get('created_at'):
                notif['created_at'] = notif['created_at'].isoformat() if hasattr(notif['created_at'], 'isoformat') else str(notif['created_at'])
            if notif.get('read_at'):
                notif['read_at'] = notif['read_at'].isoformat() if hasattr(notif['read_at'], 'isoformat') else str(notif['read_at'])
        
        return Response({
            'notifications': serialized_notifications,
            'pagination': {
                'limit': limit,
                'skip': skip,
                'count': len(serialized_notifications)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving notifications: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count_view(request):
    """
    Get count of unread notifications for the current user.
    
    GET /api/notifications/unread-count/
    """
    try:
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Get unread count
        count = get_unread_count(user_id)
        
        return Response({
            'unread_count': count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read_view(request, notification_id):
    """
    Mark a notification as read.
    
    POST /api/notifications/<notification_id>/read/
    """
    try:
        # Validate ObjectId format
        try:
            ObjectId(notification_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid notification ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get notification and verify ownership
        notification = get_notification_by_id(notification_id)
        if not notification:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        notification_user_id = str(notification.get('user_id'))
        
        if notification_user_id != user_id:
            return Response(
                {'error': 'Not authorized to mark this notification as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark as read
        success = mark_notification_as_read(notification_id)
        
        if success:
            return Response({
                'message': 'Notification marked as read'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to mark notification as read'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read_view(request):
    """
    Mark all notifications as read for the current user.
    
    POST /api/notifications/mark-all-read/
    """
    try:
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Mark all as read
        count = mark_all_notifications_as_read(user_id)
        
        return Response({
            'message': 'All notifications marked as read',
            'count': count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification_view(request, notification_id):
    """
    Delete a notification.
    
    DELETE /api/notifications/<notification_id>/
    """
    try:
        # Validate ObjectId format
        try:
            ObjectId(notification_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid notification ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get notification and verify ownership
        notification = get_notification_by_id(notification_id)
        if not notification:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        notification_user_id = str(notification.get('user_id'))
        
        if notification_user_id != user_id:
            return Response(
                {'error': 'Not authorized to delete this notification'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete notification
        success = delete_notification(notification_id)
        
        if success:
            return Response({
                'message': 'Notification deleted'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to delete notification'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

