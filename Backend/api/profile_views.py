"""
Profile management views for SkillSwap API.

This module contains all views for user profile CRUD operations,
including creation, retrieval, updating, and deletion of profiles.
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
    create_profile, get_profile_by_user_id, update_profile, 
    delete_profile, get_user_by_django_id, search_profiles_by_skills
)
from api.serializers import (
    ProfileCreateSerializer, ProfileUpdateSerializer, ProfileSerializer
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_profile_view(request):
    """
    Create a new user profile.
    
    POST /api/profile/
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
        
        # Serialize and validate the request data
        serializer = ProfileCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the profile
        profile_data = serializer.validated_data
        user_id = str(mongo_user['_id'])  # Convert ObjectId to string
        
        try:
            profile = create_profile(
                user_id=user_id,
                name=profile_data['name'],
                bio=profile_data.get('bio', ''),
                avatar_url=profile_data.get('avatar_url', ''),
                skills_offered=profile_data['skills_offered'],
                skills_wanted=profile_data['skills_wanted'],
                location=profile_data.get('location', {}),
                availability=profile_data.get('availability', []),
                timezone=profile_data.get('timezone', 'UTC'),
                rating=profile_data.get('rating', 0.0)
            )
            
            # Serialize the response
            response_serializer = ProfileSerializer(profile)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile_view(request):
    """
    Get the authenticated user's profile.
    
    GET /api/profile/
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
        
        # Get the profile
        user_id = str(mongo_user['_id'])
        profile = get_profile_by_user_id(user_id)
        
        if not profile:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize the response
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving profile: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Update the authenticated user's profile.
    
    PUT/PATCH /api/profile/update/
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
        
        # Check if profile exists
        user_id = str(mongo_user['_id'])
        existing_profile = get_profile_by_user_id(user_id)
        
        if not existing_profile:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Log the incoming request data for debugging
        logger.info(f"Updating profile for user {user_id} with data: {request.data}")
        
        # Serialize and validate the request data
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update the profile
        try:
            success = update_profile(user_id, **serializer.validated_data)
            
            if success:
                # Get the updated profile
                updated_profile = get_profile_by_user_id(user_id)
                response_serializer = ProfileSerializer(updated_profile)
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Profile update failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_view(request):
    """
    Delete the authenticated user's profile.
    
    DELETE /api/profile/delete/
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
        
        # Delete the profile
        user_id = str(mongo_user['_id'])
        success = delete_profile(user_id)
        
        if success:
            return Response(
                {'message': 'Profile deleted successfully'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Profile not found or already deleted'},
                status=status.HTTP_404_NOT_FOUND
            )
            
    except Exception as e:
        logger.error(f"Error deleting profile: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile_view(request, user_id):
    """
    Get a specific user's profile by user_id.
    
    GET /api/profile/<user_id>/
    """
    try:
        # Validate ObjectId format
        try:
            ObjectId(user_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid user ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the profile
        profile = get_profile_by_user_id(user_id)
        
        if not profile:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize the response
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving user profile: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_profiles_view(request):
    """
    Search profiles by skills.
    
    GET /api/profile/search/?skills=python,javascript&limit=20
    """
    try:
        skills_param = request.GET.get('skills', '')
        limit_param = request.GET.get('limit', '20')
        
        if not skills_param:
            return Response(
                {'error': 'Skills parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse skills
        skills = [skill.strip().lower() for skill in skills_param.split(',') if skill.strip()]
        
        if not skills:
            return Response(
                {'error': 'At least one skill is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse limit
        try:
            limit = int(limit_param)
            if limit <= 0 or limit > 100:
                limit = 20
        except ValueError:
            limit = 20
        
        # Search profiles
        profiles = search_profiles_by_skills(skills, limit)
        
        # Serialize the response
        serializer = ProfileSerializer(profiles, many=True)
        return Response({
            'profiles': serializer.data,
            'count': len(profiles),
            'skills_searched': skills
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error searching profiles: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def create_or_get_profile_view(request):
    """
    Create or get the authenticated user's profile.
    
    GET /api/profile/ - Get profile if exists
    POST /api/profile/ - Create profile
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
        
        if request.method == 'GET':
            # Get the profile
            profile = get_profile_by_user_id(user_id)
            
            if not profile:
                return Response(
                    {'error': 'Profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize the response
            serializer = ProfileSerializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':
            # Serialize and validate the request data
            serializer = ProfileCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the profile
            profile_data = serializer.validated_data
            
            try:
                profile = create_profile(
                    user_id=user_id,
                    name=profile_data['name'],
                    bio=profile_data.get('bio', ''),
                    avatar_url=profile_data.get('avatar_url', ''),
                    skills_offered=profile_data['skills_offered'],
                    skills_wanted=profile_data['skills_wanted'],
                    location=profile_data.get('location', {}),
                    availability=profile_data.get('availability', []),
                    timezone=profile_data.get('timezone', 'UTC'),
                    rating=profile_data.get('rating', 0.0)
                )
                
                # Serialize the response
                response_serializer = ProfileSerializer(profile)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
    except Exception as e:
        logger.error(f"Error in create_or_get_profile_view: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
