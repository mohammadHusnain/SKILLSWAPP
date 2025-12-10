"""
Matching views for SkillSwap API.

This module contains all views for skill matching, including match calculation,
interest management, and match retrieval.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
import logging

from api.db import (
    get_profile_by_user_id, get_matches_collection, get_profile_collection,
    get_user_by_django_id, create_or_update_match, express_interest,
    get_interested_users, respond_to_interest, get_match_by_users,
    get_mutual_matches
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
                # Keep _id but convert to string
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


def calculate_skill_match(user_skills_offered, other_skills_wanted):
    """
    Calculate skill compatibility score (0-30).
    
    Args:
        user_skills_offered: List of skills user can teach
        other_skills_wanted: List of skills other user wants to learn
        
    Returns:
        Score from 0-30 based on skill overlap percentage
    """
    if not user_skills_offered or not other_skills_wanted:
        return 0
    
    # Convert to lowercase sets for comparison
    user_set = set(skill.lower() for skill in user_skills_offered)
    other_set = set(skill.lower() for skill in other_skills_wanted)
    
    # Find overlapping skills
    overlap = user_set.intersection(other_set)
    
    if not overlap:
        return 0
    
    # Calculate percentage overlap
    # Score = 30 points for perfect match, scaled by overlap percentage
    overlap_percentage = len(overlap) / len(other_set)
    return round(overlap_percentage * 30, 2)


def calculate_availability_overlap(user_avail, other_avail):
    """
    Calculate availability overlap score (0-15).
    
    Args:
        user_avail: List of availability periods for user
        other_avail: List of availability periods for other user
        
    Returns:
        Score from 0-15 based on availability overlap
    """
    if not user_avail or not other_avail:
        return 0
    
    # Convert to lowercase sets
    user_set = set(period.lower() for period in user_avail)
    other_set = set(period.lower() for period in other_avail)
    
    # Find overlapping periods
    overlap = user_set.intersection(other_set)
    
    if not overlap:
        return 0
    
    # Calculate percentage overlap
    overlap_percentage = len(overlap) / len(other_set)
    return round(overlap_percentage * 15, 2)


def calculate_location_score(user_loc, other_loc):
    """
    Calculate location proximity score (0-10).
    
    Args:
        user_loc: User's location dict with city and country
        other_loc: Other user's location dict with city and country
        
    Returns:
        Score from 0-10 (same city = 10, same country = 5, no match = 0)
    """
    if not user_loc or not other_loc:
        return 0
    
    user_country = user_loc.get('country', '').lower().strip()
    user_city = user_loc.get('city', '').lower().strip()
    other_country = other_loc.get('country', '').lower().strip()
    other_city = other_loc.get('city', '').lower().strip()
    
    if not user_country or not other_country:
        return 0
    
    # Same city = 10 points
    if user_city == other_city and user_city:
        return 10
    
    # Same country = 5 points
    if user_country == other_country:
        return 5
    
    return 0


def calculate_rating_score(user_rating, other_rating):
    """
    Calculate rating-based score (0-15).
    
    Args:
        user_rating: User's current rating
        other_rating: Other user's rating
        
    Returns:
        Score from 0-15 based on average rating (5.0 = 15, 0.0 = 0)
    """
    if user_rating is None or other_rating is None:
        return 0
    
    # Average both ratings
    avg_rating = (float(user_rating) + float(other_rating)) / 2
    
    # Scale to 0-15 range (5.0 rating = 15 points)
    return round((avg_rating / 5.0) * 15, 2)


def calculate_match_score(user_profile, other_profile):
    """
    Calculate total match score (0-100).
    
    Uses weighted approach: Skills (60%), Availability (15%), Location (10%), Rating (15%)
    
    Args:
        user_profile: User's profile dict
        other_profile: Other user's profile dict
        
    Returns:
        Dictionary with total score (0-100) and breakdown
    """
    # Skills score (60% total: 30% for each direction)
    # 1. What I can teach = what they want to learn (30 points)
    my_teach_match = calculate_skill_match(
        user_profile.get('skills_offered', []),
        other_profile.get('skills_wanted', [])
    )
    
    # 2. What they can teach = what I want to learn (30 points)
    their_teach_match = calculate_skill_match(
        other_profile.get('skills_offered', []),
        user_profile.get('skills_wanted', [])
    )
    
    skills_score = my_teach_match + their_teach_match
    
    # Availability score (15%)
    avail_score = calculate_availability_overlap(
        user_profile.get('availability', []),
        other_profile.get('availability', [])
    )
    
    # Location score (10%)
    location_score = calculate_location_score(
        user_profile.get('location', {}),
        other_profile.get('location', {})
    )
    
    # Rating score (15%)
    rating_score = calculate_rating_score(
        user_profile.get('rating', 0),
        other_profile.get('rating', 0)
    )
    
    # Total score
    total_score = skills_score + avail_score + location_score + rating_score
    
    # Round to 2 decimal places
    total_score = round(total_score, 2)
    
    return {
        'total_score': total_score,
        'breakdown': {
            'skills_score': skills_score,
            'availability_score': avail_score,
            'location_score': location_score,
            'rating_score': rating_score
        }
    }


def get_matches_for_user(user_id, limit=20, offset=0, filters=None):
    """
    Get matches for a specific user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        limit: Maximum number of results
        offset: Number of results to skip
        filters: Dictionary with filters (min_score, skill, etc.)
        
    Returns:
        List of matches with scores and profiles
    """
    if filters is None:
        filters = {}
    
    # Get user's profile
    user_profile = get_profile_by_user_id(user_id)
    if not user_profile:
        return []
    
    # Check if user has any skills
    user_skills_offered = user_profile.get('skills_offered', [])
    user_skills_wanted = user_profile.get('skills_wanted', [])
    
    if not user_skills_offered or not user_skills_wanted:
        return []
    
    # Get all profiles except current user
    profiles_collection = get_profile_collection()
    all_profiles = list(profiles_collection.find({
        'user_id': {'$ne': ObjectId(user_id)}
    }))
    
    logger.info(f"Found {len(all_profiles)} profiles to match against")
    
    matches = []
    matched_user_ids = set()
    
    # Calculate matches for each profile
    for other_profile in all_profiles:
        other_user_id = str(other_profile['user_id'])
        
        # Skip if already matched
        if other_user_id in matched_user_ids:
            continue
        
        other_skills_offered = other_profile.get('skills_offered', [])
        other_skills_wanted = other_profile.get('skills_wanted', [])
        
        # Debug logging
        logger.info(f"Matching user {user_id} with {other_user_id}")
        logger.info(f"User skills offered: {user_skills_offered}")
        logger.info(f"User skills wanted: {user_skills_wanted}")
        logger.info(f"Other skills offered: {other_skills_offered}")
        logger.info(f"Other skills wanted: {other_skills_wanted}")
        
        # Check for complementary skills (basic filtering)
        # At least one skill must match:
        # - My teach matches their want OR
        # - Their teach matches my want
        user_set = set(s.lower() for s in user_skills_offered)
        other_want_set = set(s.lower() for s in other_skills_wanted)
        other_teach_set = set(s.lower() for s in other_skills_offered)
        user_want_set = set(s.lower() for s in user_skills_wanted)
        
        has_complementary_skills = (
            bool(user_set.intersection(other_want_set)) or
            bool(other_teach_set.intersection(user_want_set))
        )
        
        if not has_complementary_skills:
            continue  # Skip users with zero skill overlap
        
        # Calculate match score
        match_data = calculate_match_score(user_profile, other_profile)
        
        # Apply minimum score filter
        min_score = filters.get('min_score', 0)
        if match_data['total_score'] < min_score:
            continue
        
        # Check if interest exists
        match_record = get_match_by_users(user_id, other_user_id)
        interest_status = 'none'
        if match_record:
            interest_status = match_record.get('interest_status', 'none')
        
        matches.append({
            'matched_user_id': other_user_id,
            'matched_user_profile': other_profile,
            'match_score': match_data['total_score'],
            'breakdown': match_data['breakdown'],
            'interest_status': interest_status
        })
        
        matched_user_ids.add(other_user_id)
    
    logger.info(f"Found {len(matches)} total matches before pagination")
    
    # Sort by match score (highest first)
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    
    # Apply pagination
    matches = matches[offset:offset + limit]
    
    logger.info(f"Returning {len(matches)} matches after pagination")
    
    return matches


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_matches_view(request):
    """
    Get matches for the current authenticated user.
    
    GET /api/matches/?limit=20&offset=0&min_score=50&skill=python
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
        limit = int(request.GET.get('limit', 20))
        offset = int(request.GET.get('offset', 0))
        
        filters = {
            'min_score': float(request.GET.get('min_score', 0))
        }
        
        # Get matches
        matches = get_matches_for_user(user_id, limit, offset, filters)
        
        # Serialize matches and convert ObjectIds to strings
        serialized_matches = []
        for match in matches:
            # Convert the entire match data structure to handle ObjectIds
            converted_profile = convert_objectid_to_str(match['matched_user_profile'])
            
            match_data = {
                'user_id': user_id,
                'matched_user_id': match['matched_user_id'],
                'match_score': match['match_score'],
                'breakdown': match['breakdown'],
                'interest_status': match['interest_status'],
                'matched_user_profile': converted_profile
            }
            serialized_matches.append(match_data)
        
        # Get stats
        all_matches = get_matches_for_user(user_id, limit=1000, offset=0, filters={'min_score': 0})
        stats = {
            'total': len(all_matches),
            'new': len(all_matches),  # Simplified: count all matches for now
            'active': len(get_mutual_matches(user_id))
        }
        
        return Response({
            'matches': serialized_matches,
            'stats': stats,
            'pagination': {
                'limit': limit,
                'offset': offset,
                'total': len(all_matches)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving matches: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_match_detail_view(request, user_id):
    """
    Get detailed information about a specific match.
    
    GET /api/matches/<user_id>/
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
        
        # Get current user
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        current_user_id = str(mongo_user['_id'])
        
        # Get match details
        current_profile = get_profile_by_user_id(current_user_id)
        matched_profile = get_profile_by_user_id(user_id)
        
        if not current_profile or not matched_profile:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate match score and breakdown
        match_data = calculate_match_score(current_profile, matched_profile)
        
        # Get interest status
        match_record = get_match_by_users(current_user_id, user_id)
        interest_status = 'none'
        if match_record:
            interest_status = match_record.get('interest_status', 'none')
        
        # Convert ObjectIds to strings for JSON serialization
        converted_profile = convert_objectid_to_str(matched_profile)
        
        return Response({
            'matched_user_id': user_id,
            'matched_user_profile': converted_profile,
            'match_score': match_data['total_score'],
            'breakdown': match_data['breakdown'],
            'interest_status': interest_status
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving match detail: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def express_interest_view(request):
    """
    Express interest in a match.
    
    POST /api/matches/interest/
    Body: {"matched_user_id": "..."}
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
        
        # Get matched_user_id from request
        matched_user_id = request.data.get('matched_user_id')
        if not matched_user_id:
            return Response(
                {'error': 'matched_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate ObjectId
        try:
            ObjectId(matched_user_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid matched_user_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if match exists
        matched_profile = get_profile_by_user_id(matched_user_id)
        if not matched_profile:
            return Response(
                {'error': 'Matched user not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Express interest - this should always succeed with upsert
        try:
            success = express_interest(user_id, matched_user_id)
            if not success:
                logger.warning(f"express_interest returned False: user_id={user_id}, matched_user_id={matched_user_id}")
                # Still proceed - upsert should always work
        except Exception as e:
            logger.error(f"Error in express_interest: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to express interest. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Send notification to matched user
        try:
            from api.notifications import send_notification, NOTIFICATION_TYPES
            # Get sender's profile to get name
            sender_profile = get_profile_by_user_id(user_id)
            if sender_profile:
                sender_name = sender_profile.get('name', 'Someone')
            else:
                # Fallback to user name from mongo_user
                sender_name = mongo_user.get('name', 'Someone')
            
            # Send notification with proper message format
            send_notification(
                user_id=matched_user_id,
                notification_type=NOTIFICATION_TYPES['SESSION_REQUEST'],
                title=f"New Interest Expression",
                body=f"{sender_name} has shown interest in learning and teaching new skills",
                related_id=user_id  # Store sender's user_id so recipient can chat with sender
            )
            logger.info(f"Notification sent to {matched_user_id} about interest from {user_id}")
        except Exception as e:
            logger.error(f"Error sending interest notification: {e}", exc_info=True)
            # Don't fail the request if notification fails, but log it
        
        # Always return success if we got this far
        logger.info(f"Successfully expressed interest: user_id={user_id}, matched_user_id={matched_user_id}")
        return Response(
            {'message': 'Interest expressed successfully', 'success': True},
            status=status.HTTP_200_OK
        )
            
    except Exception as e:
        logger.error(f"Error expressing interest: {e}", exc_info=True)
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response(
            {'error': f'An error occurred: {str(e)}', 'success': False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interested_users_view(request):
    """
    Get users who have expressed interest in the current user.
    
    GET /api/matches/interested/
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
        
        # Get interested users
        interested_users = get_interested_users(user_id)
        
        return Response({
            'interested_users': interested_users,
            'count': len(interested_users)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving interested users: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_interest_view(request):
    """
    Respond to an interest request (accept or reject).
    
    POST /api/matches/respond/
    Body: {"requester_user_id": "...", "accept": true/false}
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
        
        # Get request parameters
        requester_user_id = request.data.get('requester_user_id')
        accept = request.data.get('accept', False)
        
        if not requester_user_id:
            return Response(
                {'error': 'requester_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate ObjectId
        try:
            ObjectId(requester_user_id)
        except InvalidId:
            return Response(
                {'error': 'Invalid requester_user_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Respond to interest
        success = respond_to_interest(user_id, requester_user_id, accept)
        
        if success:
            # If accepted, create a conversation automatically
            if accept:
                try:
                    from api.db import get_or_create_conversation
                    # Create conversation between the two users
                    conversation = get_or_create_conversation([user_id, requester_user_id])
                    logger.info(f"Created conversation {conversation.get('_id')} between {user_id} and {requester_user_id}")
                except Exception as e:
                    logger.error(f"Error creating conversation: {e}")
                    # Don't fail the request if conversation creation fails
            
            # Send notification to requester
            try:
                from api.notifications import send_notification, NOTIFICATION_TYPES
                # Get responder's name
                responder_name = mongo_user.get('name', 'Someone')
                notification_type = NOTIFICATION_TYPES['SESSION_ACCEPT'] if accept else NOTIFICATION_TYPES['SESSION_REJECT']
                title = f"Session Request Accepted by {responder_name}" if accept else f"Session Request Declined by {responder_name}"
                body = f"{responder_name} has {'accepted' if accept else 'declined'} your session request." if accept else f"{responder_name} has declined your session request."
                
                send_notification(
                    user_id=requester_user_id,
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    related_id=user_id  # Use responder's user_id as related_id
                )
            except Exception as e:
                logger.error(f"Error sending session response notification: {e}")
            
            status_str = 'accepted' if accept else 'rejected'
            return Response(
                {'message': f'Interest request {status_str} successfully'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': 'Failed to respond to interest'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error responding to interest: {e}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

