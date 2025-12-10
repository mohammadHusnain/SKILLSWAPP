"""
Session management views for SkillSwap API.

This module contains all views for session CRUD operations,
including creation, retrieval, updating, and status management of sessions.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from bson import ObjectId
from bson.errors import InvalidId
import logging

from api.db import (
    get_user_by_django_id, create_session, get_session, update_session,
    get_user_sessions, get_teaching_sessions, get_learning_sessions,
    delete_session, update_profile_session_stats, get_profile_by_user_id
)
from api.serializers import CreateSessionSerializer, UpdateSessionSerializer

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session_view(request):
    """
    Create a new session request.
    
    POST /api/sessions/create/
    Body: {
        "learner_id": "...",
        "skill_taught": "...",
        "skill_learned": "...",
        "scheduled_date": "YYYY-MM-DD",
        "scheduled_time": "HH:MM",
        "duration_minutes": 60,
        "notes": "..."
    }
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
        
        # Serialize and validate the request data
        serializer = CreateSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get validated data
        data = serializer.validated_data
        
        # Use current user as teacher if teacher_id not provided
        teacher_id = data.get('teacher_id', user_id)
        
        # If teacher_id is provided, verify it matches current user
        if 'teacher_id' in request.data and teacher_id != user_id:
            return Response(
                {'error': 'You can only create sessions where you are the teacher'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create the session
        try:
            session = create_session(
                teacher_id=teacher_id,
                learner_id=data['learner_id'],
                skill_taught=data['skill_taught'],
                skill_learned=data['skill_learned'],
                scheduled_date=data['scheduled_date'],
                scheduled_time=data['scheduled_time'],
                duration_minutes=data.get('duration_minutes', 60),
                notes=data.get('notes', ''),
                status='pending'
            )
            
            # Convert ObjectIds to strings
            session_data = convert_objectid_to_str(session)
            
            # Send notification to learner
            try:
                from api.notifications import send_notification, NOTIFICATION_TYPES
                teacher_profile = get_profile_by_user_id(teacher_id)
                teacher_name = teacher_profile.get('name', 'Someone') if teacher_profile else mongo_user.get('name', 'Someone')
                
                send_notification(
                    user_id=data['learner_id'],
                    notification_type=NOTIFICATION_TYPES['SESSION_REQUEST'],
                    title=f"New Session Request from {teacher_name}",
                    body=f"{teacher_name} has requested a session to teach you {data['skill_taught']}.",
                    related_id=str(session['_id'])
                )
            except Exception as e:
                logger.error(f"Error sending session request notification: {e}")
            
            return Response(session_data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions_view(request):
    """
    Get all sessions for the current user (teaching + learning).
    
    GET /api/sessions/?status=pending
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
        
        # Get optional status filter
        status_filter = request.query_params.get('status', None)
        
        # Get sessions
        sessions = get_user_sessions(user_id, status=status_filter)
        
        # Convert ObjectIds to strings
        sessions_data = [convert_objectid_to_str(session) for session in sessions]
        
        return Response({
            'sessions': sessions_data,
            'count': len(sessions_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving sessions: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_teaching_sessions_view(request):
    """
    Get teaching sessions for the current user.
    
    GET /api/sessions/teaching/?status=pending
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
        
        # Get optional status filter
        status_filter = request.query_params.get('status', None)
        
        # Get teaching sessions
        sessions = get_teaching_sessions(user_id, status=status_filter)
        
        # Convert ObjectIds to strings
        sessions_data = [convert_objectid_to_str(session) for session in sessions]
        
        return Response({
            'sessions': sessions_data,
            'count': len(sessions_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving teaching sessions: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_learning_sessions_view(request):
    """
    Get learning sessions for the current user.
    
    GET /api/sessions/learning/?status=pending
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
        
        # Get optional status filter
        status_filter = request.query_params.get('status', None)
        
        # Get learning sessions
        sessions = get_learning_sessions(user_id, status=status_filter)
        
        # Convert ObjectIds to strings
        sessions_data = [convert_objectid_to_str(session) for session in sessions]
        
        return Response({
            'sessions': sessions_data,
            'count': len(sessions_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving learning sessions: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_detail_view(request, session_id):
    """
    Get session details by ID.
    
    GET /api/sessions/<session_id>/
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is part of this session
        if str(session['teacher_id']) != user_id and str(session['learner_id']) != user_id:
            return Response(
                {'error': 'You do not have permission to view this session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Convert ObjectIds to strings
        session_data = convert_objectid_to_str(session)
        
        return Response(session_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_session_view(request, session_id):
    """
    Update session details.
    
    PUT /api/sessions/<session_id>/update/
    Body: {
        "skill_taught": "...",
        "skill_learned": "...",
        "scheduled_date": "YYYY-MM-DD",
        "scheduled_time": "HH:MM",
        "duration_minutes": 60,
        "notes": "...",
        "status": "pending"
    }
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is part of this session
        if str(session['teacher_id']) != user_id and str(session['learner_id']) != user_id:
            return Response(
                {'error': 'You do not have permission to update this session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Serialize and validate the request data
        serializer = UpdateSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the session
        updates = serializer.validated_data
        success = update_session(session_id, **updates)
        
        if not success:
            return Response(
                {'error': 'Failed to update session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get updated session
        updated_session = get_session(session_id)
        session_data = convert_objectid_to_str(updated_session)
        
        return Response(session_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_session_view(request, session_id):
    """
    Accept a session request.
    
    POST /api/sessions/<session_id>/accept/
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is the learner (only learner can accept)
        if str(session['learner_id']) != user_id:
            return Response(
                {'error': 'Only the learner can accept a session request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session is in pending status
        if session['status'] != 'pending':
            return Response(
                {'error': f'Cannot accept session with status: {session["status"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        success = update_session(session_id, status='accepted')
        
        if not success:
            return Response(
                {'error': 'Failed to accept session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get updated session
        updated_session = get_session(session_id)
        session_data = convert_objectid_to_str(updated_session)
        
        # Send notification to teacher
        try:
            from api.notifications import send_notification, NOTIFICATION_TYPES
            learner_profile = get_profile_by_user_id(user_id)
            learner_name = learner_profile.get('name', 'Someone') if learner_profile else mongo_user.get('name', 'Someone')
            
            send_notification(
                user_id=str(session['teacher_id']),
                notification_type=NOTIFICATION_TYPES['SESSION_ACCEPT'],
                title=f"Session Accepted by {learner_name}",
                body=f"{learner_name} has accepted your session request.",
                related_id=session_id
            )
        except Exception as e:
            logger.error(f"Error sending session accept notification: {e}")
        
        return Response(session_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error accepting session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_session_view(request, session_id):
    """
    Reject a session request.
    
    POST /api/sessions/<session_id>/reject/
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is the learner (only learner can reject)
        if str(session['learner_id']) != user_id:
            return Response(
                {'error': 'Only the learner can reject a session request'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session is in pending status
        if session['status'] != 'pending':
            return Response(
                {'error': f'Cannot reject session with status: {session["status"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        success = update_session(session_id, status='cancelled')
        
        if not success:
            return Response(
                {'error': 'Failed to reject session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get updated session
        updated_session = get_session(session_id)
        session_data = convert_objectid_to_str(updated_session)
        
        # Send notification to teacher
        try:
            from api.notifications import send_notification, NOTIFICATION_TYPES
            learner_profile = get_profile_by_user_id(user_id)
            learner_name = learner_profile.get('name', 'Someone') if learner_profile else mongo_user.get('name', 'Someone')
            
            send_notification(
                user_id=str(session['teacher_id']),
                notification_type=NOTIFICATION_TYPES['SESSION_REJECT'],
                title=f"Session Rejected by {learner_name}",
                body=f"{learner_name} has rejected your session request.",
                related_id=session_id
            )
        except Exception as e:
            logger.error(f"Error sending session reject notification: {e}")
        
        return Response(session_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error rejecting session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_session_view(request, session_id):
    """
    Mark a session as completed.
    
    POST /api/sessions/<session_id>/complete/
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is part of this session
        if str(session['teacher_id']) != user_id and str(session['learner_id']) != user_id:
            return Response(
                {'error': 'You do not have permission to complete this session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session is in accepted status
        if session['status'] != 'accepted':
            return Response(
                {'error': f'Cannot complete session with status: {session["status"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        success = update_session(session_id, status='completed')
        
        if not success:
            return Response(
                {'error': 'Failed to complete session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update profile stats
        try:
            update_profile_session_stats(str(session['teacher_id']), 'teaching', increment=True)
            update_profile_session_stats(str(session['learner_id']), 'learning', increment=True)
        except Exception as e:
            logger.error(f"Error updating profile stats: {e}")
        
        # Get updated session
        updated_session = get_session(session_id)
        session_data = convert_objectid_to_str(updated_session)
        
        return Response(session_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_session_view(request, session_id):
    """
    Cancel a session.
    
    POST /api/sessions/<session_id>/cancel/
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is part of this session
        if str(session['teacher_id']) != user_id and str(session['learner_id']) != user_id:
            return Response(
                {'error': 'You do not have permission to cancel this session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session can be cancelled
        if session['status'] in ['completed', 'cancelled']:
            return Response(
                {'error': f'Cannot cancel session with status: {session["status"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update session status
        success = update_session(session_id, status='cancelled')
        
        if not success:
            return Response(
                {'error': 'Failed to cancel session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get updated session
        updated_session = get_session(session_id)
        session_data = convert_objectid_to_str(updated_session)
        
        # Send notification to the other user
        try:
            from api.notifications import send_notification, NOTIFICATION_TYPES
            user_profile = get_profile_by_user_id(user_id)
            user_name = user_profile.get('name', 'Someone') if user_profile else mongo_user.get('name', 'Someone')
            
            # Determine the other user
            other_user_id = str(session['learner_id']) if str(session['teacher_id']) == user_id else str(session['teacher_id'])
            
            send_notification(
                user_id=other_user_id,
                notification_type=NOTIFICATION_TYPES['SESSION_REJECT'],
                title=f"Session Cancelled by {user_name}",
                body=f"{user_name} has cancelled the session.",
                related_id=session_id
            )
        except Exception as e:
            logger.error(f"Error sending session cancel notification: {e}")
        
        return Response(session_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error cancelling session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session_view(request, session_id):
    """
    Delete a session.
    
    DELETE /api/sessions/<session_id>/
    """
    try:
        # Validate ObjectId
        try:
            ObjectId(session_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid session_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get session
        session = get_session(session_id)
        
        if not session:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the MongoDB user document
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user_id = str(mongo_user['_id'])
        
        # Check if user is the teacher (only teacher can delete)
        if str(session['teacher_id']) != user_id:
            return Response(
                {'error': 'Only the teacher can delete a session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if session can be deleted (only pending sessions can be deleted)
        if session['status'] not in ['pending', 'cancelled']:
            return Response(
                {'error': f'Cannot delete session with status: {session["status"]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete session
        success = delete_session(session_id)
        
        if not success:
            return Response(
                {'error': 'Failed to delete session'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            {'message': 'Session deleted successfully'},
            status=status.HTTP_200_OK
        )
        
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

