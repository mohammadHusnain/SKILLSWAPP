from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from api.admin_auth.permissions import IsAdminUser
from api.db import get_collection, get_profile_collection
from collections import Counter
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats_view(request):
    """
    Get admin dashboard statistics (Profile-driven).
    Returns:
    - Total profiles count
    - Total matches count (profile-to-profile)
    - Most offered skills (top 10)
    - Most wanted skills (top 10)
    """
    try:
        profiles_col = get_profile_collection()
        total_profiles = profiles_col.count_documents({})
        
        # Get all profiles for skill analysis
        all_profiles = list(profiles_col.find({}, {'skills_offered': 1, 'skills_wanted': 1}))
        
        # Count offered and wanted skills separately
        offered_counter = Counter()
        wanted_counter = Counter()
        
        for profile in all_profiles:
            skills_offered = profile.get('skills_offered', [])
            skills_wanted = profile.get('skills_wanted', [])
            
            for skill in skills_offered:
                if skill:
                    offered_counter[skill.lower()] += 1
            
            for skill in skills_wanted:
                if skill:
                    wanted_counter[skill.lower()] += 1
        
        # Get top 10 most offered skills
        top_offered = [
            {'skill': skill, 'count': count}
            for skill, count in offered_counter.most_common(10)
        ]
        
        # Get top 10 most wanted skills
        top_wanted = [
            {'skill': skill, 'count': count}
            for skill, count in wanted_counter.most_common(10)
        ]
        
        # Get total matches
        matches_col = get_collection('matches')
        total_matches = matches_col.count_documents({})
        
        # Active profiles (completed)
        active_profiles = profiles_col.count_documents({
            'skills_offered': {'$exists': True, '$ne': []},
            'skills_wanted': {'$exists': True, '$ne': []}
        })
        
        return Response({
            'total_profiles': total_profiles,
            'active_profiles': active_profiles,
            'total_matches': total_matches,
            'top_offered_skills': top_offered,
            'top_wanted_skills': top_wanted,
            # Backward compatibility for frontend if needed
            'total_users': total_profiles,
            'active_users': active_profiles,
            'top_skills': top_offered 
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Admin stats error: {e}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
