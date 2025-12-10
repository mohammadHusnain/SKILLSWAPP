"""
Message views for SkillSwap API.

This module contains REST API endpoints for conversations and messages.
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
    get_user_conversations,
    get_conversation_by_id,
    get_messages_by_conversation,
    get_or_create_conversation,
    get_profile_by_user_id,
    get_profile_collection,
    update_message,
    delete_message,
    get_message_by_id
)

logger = logging.getLogger(__name__)


def convert_objectid_to_str(data):
    """
    Recursively convert ObjectId fields to strings for JSON serialization.
    """
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if key == '_id' or isinstance(value, ObjectId):
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
def get_conversations_view(request):
    """
    Get all conversations for the current user.
    
    GET /api/messages/conversations/
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
        
        # Get conversations
        conversations = get_user_conversations(user_id)
        
        # Convert ObjectIds to strings and format
        serialized_conversations = []
        for conv in conversations:
            conv_data = convert_objectid_to_str(conv)
            # Format timestamps
            if conv_data.get('updated_at'):
                conv_data['updated_at'] = conv_data['updated_at'].isoformat() if hasattr(conv_data['updated_at'], 'isoformat') else str(conv_data['updated_at'])
            if conv_data.get('created_at'):
                conv_data['created_at'] = conv_data['created_at'].isoformat() if hasattr(conv_data['created_at'], 'isoformat') else str(conv_data['created_at'])
            serialized_conversations.append(conv_data)
        
        return Response({
            'conversations': serialized_conversations
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving conversations: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages_view(request, conversation_id):
    """
    Get messages for a conversation.
    
    GET /api/messages/conversations/<conversation_id>/messages/?limit=50&skip=0
    """
    try:
        # Validate ObjectId format
        try:
            ObjectId(conversation_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid conversation ID format'},
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
        
        user_id = str(mongo_user['_id'])
        
        # Verify user is a participant
        conversation = get_conversation_by_id(conversation_id)
        if not conversation:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        participant_ids = [str(p) for p in conversation.get('participants', [])]
        if user_id not in participant_ids:
            return Response(
                {'error': 'Not authorized to access this conversation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get query parameters
        limit = int(request.GET.get('limit', 50))
        skip = int(request.GET.get('skip', 0))
        
        # Get messages
        messages = get_messages_by_conversation(conversation_id, limit=limit, skip=skip)
        
        # Convert ObjectIds to strings and format
        serialized_messages = []
        for msg in messages:
            msg_data = convert_objectid_to_str(msg)
            # Format timestamps
            if msg_data.get('timestamp'):
                msg_data['timestamp'] = msg_data['timestamp'].isoformat() if hasattr(msg_data['timestamp'], 'isoformat') else str(msg_data['timestamp'])
            if msg_data.get('read_at'):
                msg_data['read_at'] = msg_data['read_at'].isoformat() if hasattr(msg_data['read_at'], 'isoformat') else str(msg_data['read_at'])
            serialized_messages.append(msg_data)
        
        # Reverse to show oldest first (since we sorted newest first)
        serialized_messages.reverse()
        
        return Response({
            'messages': serialized_messages,
            'conversation_id': conversation_id,
            'pagination': {
                'limit': limit,
                'skip': skip,
                'count': len(serialized_messages)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving messages: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_conversation_view(request):
    """
    Create or get a conversation between two users.
    
    POST /api/messages/conversations/
    Body: {"recipient_id": "..."}
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
        recipient_id = request.data.get('recipient_id')
        
        if not recipient_id:
            return Response(
                {'error': 'recipient_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate ObjectId
        try:
            ObjectId(recipient_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid recipient_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user_id == recipient_id:
            return Response(
                {'error': 'Cannot create conversation with yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation
        conversation = get_or_create_conversation([user_id, recipient_id])
        
        # Convert ObjectIds to strings
        conv_data = convert_objectid_to_str(conversation)
        
        return Response({
            'conversation': conv_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_users_view(request):
    """
    Get all users with profiles for starting a chat, with match percentages.
    
    GET /api/messages/chat-users/
    Returns: List of users with match scores (only if current user has completed profile)
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
        
        # Get current user's profile
        user_profile = get_profile_by_user_id(user_id)
        
        # Check if current user has completed profile (has skills_offered and skills_wanted)
        if not user_profile:
            return Response({
                'users': [],
                'message': 'Please complete your profile to start chatting'
            }, status=status.HTTP_200_OK)
        
        skills_offered = user_profile.get('skills_offered', [])
        skills_wanted = user_profile.get('skills_wanted', [])
        
        if not skills_offered or not skills_wanted or len(skills_offered) == 0 or len(skills_wanted) == 0:
            return Response({
                'users': [],
                'message': 'Please add skills you can teach and skills you want to learn to start chatting'
            }, status=status.HTTP_200_OK)
        
        # Get all profiles (excluding current user)
        profiles_collection = get_profile_collection()
        all_profiles = list(profiles_collection.find({
            'user_id': {'$ne': ObjectId(user_id)}
        }))
        
        # Get current user's conversations to check existing conversations
        user_conversations = get_user_conversations(user_id)
        conversation_participants = set()
        for conv in user_conversations:
            for participant in conv.get('participants', []):
                participant_id = str(participant)
                if participant_id != user_id:
                    conversation_participants.add(participant_id)
        
        # Import matching functions
        from api.matching_views import calculate_match_score
        
        # Get user collection for names
        from api.db import get_user_collection
        users_collection = get_user_collection()
        
        # Calculate match scores and format response
        users_list = []
        for profile in all_profiles:
            other_user_id = str(profile.get('user_id'))
            
            # Calculate match score
            match_data = calculate_match_score(user_profile, profile)
            match_percentage = match_data.get('total_score', 0)
            
            # Check if conversation exists
            has_existing_conversation = other_user_id in conversation_participants
            
            # Get user document for name and avatar
            other_user = users_collection.find_one({'_id': ObjectId(other_user_id)})
            
            users_list.append({
                'user_id': other_user_id,
                'name': profile.get('name', other_user.get('name', 'Unknown') if other_user else 'Unknown'),
                'avatar_url': profile.get('avatar_url', other_user.get('avatar_url', '') if other_user else ''),
                'match_percentage': round(match_percentage, 1),
                'has_existing_conversation': has_existing_conversation
            })
        
        # Sort by match percentage (highest first)
        users_list.sort(key=lambda x: x['match_percentage'], reverse=True)
        
        return Response({
            'users': users_list
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving chat users: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file_view(request):
    """
    Upload a file for message attachments.
    
    POST /api/messages/upload-file/
    Body: multipart/form-data with 'file' field
    Returns: {file_url: "/media/messages/{filename}"}
    """
    try:
        from django.conf import settings
        import os
        import uuid
        from pathlib import Path
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validate file size (10MB = 10485760 bytes)
        max_size = 10 * 1024 * 1024  # 10MB
        if uploaded_file.size > max_size:
            return Response(
                {'error': 'File size exceeds 10MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_name = uploaded_file.name
        file_ext = os.path.splitext(file_name)[1].lower()
        
        if file_ext not in allowed_extensions:
            return Response(
                {'error': f'File type not allowed. Allowed types: PDF, Word documents, Images'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Create messages directory if it doesn't exist
        messages_dir = Path(settings.MEDIA_ROOT) / 'messages'
        messages_dir.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = messages_dir / unique_filename
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        # Return file URL
        file_url = f"/media/messages/{unique_filename}"
        
        logger.info(f"File uploaded: {file_url}")
        
        return Response({
            'file_url': file_url,
            'filename': unique_filename,
            'size': uploaded_file.size
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return Response(
            {'error': 'Internal server error while uploading file'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_message_view(request, message_id):
    """
    Update a message's text.
    
    PUT/PATCH /api/messages/<message_id>/
    Body: {"text": "new message text"}
    """
    try:
        # Validate ObjectId format
        try:
            ObjectId(message_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid message ID format'},
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
        
        user_id = str(mongo_user['_id'])
        
        # Get new text from request
        new_text = request.data.get('text')
        if not new_text:
            return Response(
                {'error': 'text field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update message
        try:
            updated_message = update_message(message_id, user_id, new_text)
            
            if not updated_message:
                return Response(
                    {'error': 'Message not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Convert ObjectIds to strings
            msg_data = convert_objectid_to_str(updated_message)
            
            # Format timestamps
            if msg_data.get('timestamp'):
                msg_data['timestamp'] = msg_data['timestamp'].isoformat() if hasattr(msg_data['timestamp'], 'isoformat') else str(msg_data['timestamp'])
            if msg_data.get('edited_at'):
                msg_data['edited_at'] = msg_data['edited_at'].isoformat() if hasattr(msg_data['edited_at'], 'isoformat') else str(msg_data['edited_at'])
            if msg_data.get('read_at'):
                msg_data['read_at'] = msg_data['read_at'].isoformat() if hasattr(msg_data['read_at'], 'isoformat') else str(msg_data['read_at'])
            
            return Response({
                'message': msg_data
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    except Exception as e:
        logger.error(f"Error updating message: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message_view(request, message_id):
    """
    Delete a message (soft delete).
    
    DELETE /api/messages/<message_id>/
    """
    try:
        # Validate ObjectId format
        try:
            ObjectId(message_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid message ID format'},
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
        
        user_id = str(mongo_user['_id'])
        
        # Get message to verify it exists
        message = get_message_by_id(message_id)
        if not message:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete message
        try:
            success = delete_message(message_id, user_id)
            
            if not success:
                return Response(
                    {'error': 'Failed to delete message'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response({
                'message': 'Message deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

