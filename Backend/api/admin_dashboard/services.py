from api.db import (
    get_collection, 
    get_profile_collection
)
from bson import ObjectId
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all_users_service(page=1, page_size=10, filters=None):
    """
    Service to get all profiles with pagination and filters.
    Replaces get_all_users_service but uses profiles collection.
    """
    profiles_col = get_profile_collection()
    
    query = {}
    # Filters can be added here if needed, e.g. status filter on profiles if it exists
    
    total_profiles = profiles_col.count_documents(query)
    
    # Pagination
    skip = (page - 1) * page_size
    profiles_cursor = profiles_col.find(query).sort('created_at', -1).skip(skip).limit(page_size)
    
    profiles_data = []
    for profile in profiles_cursor:
        profiles_data.append({
            'id': str(profile['_id']),
            'name': profile.get('name', 'N/A'),
            'avatar_url': profile.get('avatar_url', ''),
            'skills_offered': profile.get('skills_offered', []),
            'skills_wanted': profile.get('skills_wanted', []),
            'availability': profile.get('availability', []),
            'timezone': profile.get('timezone', 'UTC'),
            'rating': profile.get('rating', 0),
            'created_at': profile.get('created_at'),
            'profile_completed': bool(profile.get('skills_offered') and profile.get('skills_wanted'))
        })
        
    total_pages = (total_profiles + page_size - 1) // page_size if total_profiles > 0 else 1
        
    return {
        'users': profiles_data,  # Keeping 'users' key for frontend compatibility if needed, but data is profiles
        'total': total_profiles,
        'pages': total_pages,
        'current_page': page
    }

def get_user_details_service(profile_id):
    """
    Service to get detailed profile info.
    """
    try:
        profiles_col = get_profile_collection()
        profile = profiles_col.find_one({'_id': ObjectId(profile_id)})
        
        if not profile:
            return None
            
        profile_data = {
            'id': str(profile['_id']),
            'name': profile.get('name', ''),
            'avatar_url': profile.get('avatar_url', ''),
            'skills_offered': profile.get('skills_offered', []),
            'skills_wanted': profile.get('skills_wanted', []),
            'location': profile.get('location', {}),
            'bio': profile.get('bio', ''),
            'rating': profile.get('rating', 0),
            'timezone': profile.get('timezone', 'UTC'),
            'availability': profile.get('availability', []),
            'created_at': profile.get('created_at'),
        }
        
        # Get matches count for this profile
        matches_col = get_collection('matches')
        matches_count = matches_col.count_documents({
            '$or': [{'profile_id': profile_id}, {'matched_profile_id': profile_id}]
        })
        
        # Get sessions count for this profile
        sessions_col = get_collection('sessions')
        sessions_count = sessions_col.count_documents({
            '$or': [{'teacher_profile_id': profile_id}, {'learner_profile_id': profile_id}]
        })
        
        profile_data['stats'] = {
            'matches': matches_count,
            'sessions': sessions_count
        }
        
        return {
            'user': profile_data, # Use 'user' key for frontend compatibility
            'profile': profile_data
        }
    except Exception as e:
        logger.error(f"Error fetching profile details for {profile_id}: {e}")
        return None

def get_all_matches_service(page=1, page_size=10):
    """
    Service to get all matches between profiles.
    """
    from api.matching_views import calculate_match_score
    
    try:
        profiles_col = get_profile_collection()
        all_profiles = list(profiles_col.find({}))
        
        logger.info(f"Computing matches for {len(all_profiles)} profiles")
        
        matches_data = []
        processed_pairs = set()
        
        # Compute matches between all profile pairs based on the intersection rule
        for i, profile1 in enumerate(all_profiles):
            id1 = str(profile1['_id'])
            
            for profile2 in all_profiles[i+1:]:
                id2 = str(profile2['_id'])
                
                # Skip if same profile
                if id1 == id2:
                    continue
                
                pair_key = tuple(sorted([id1, id2]))
                if pair_key in processed_pairs:
                    continue
                
                # Check for complementary skills (Mutual Intersection)
                offered1 = set(s.lower() for s in profile1.get('skills_offered', []))
                wanted1 = set(s.lower() for s in profile1.get('skills_wanted', []))
                offered2 = set(s.lower() for s in profile2.get('skills_offered', []))
                wanted2 = set(s.lower() for s in profile2.get('skills_wanted', []))
                
                # Intersection A: Profile 1 offers what Profile 2 wants
                intersection1 = offered1.intersection(wanted2)
                # Intersection B: Profile 2 offers what Profile 1 wants
                intersection2 = offered2.intersection(wanted1)
                
                # A match exists when BOTH intersections are non-empty
                if intersection1 and intersection2:
                    # Calculate match score (optional, but good for sorting)
                    match_result = calculate_match_score(profile1, profile2)
                    match_score = match_result.get('total_score', 0)
                    
                    common_skills = list(intersection1.union(intersection2))
                    
                    matches_data.append({
                        'id': f"{id1}_{id2}",
                        'profile_id': id1,
                        'profile_name': profile1.get('name', 'Unknown'),
                        'matched_profile_id': id2,
                        'matched_profile_name': profile2.get('name', 'Unknown'),
                        'common_skills': common_skills,
                        'score': round(match_score, 2),
                        'created_at': datetime.utcnow()
                    })
                
                processed_pairs.add(pair_key)
        
        # Sort by score
        matches_data.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        # Pagination
        total_matches = len(matches_data)
        total_pages = (total_matches + page_size - 1) // page_size if total_matches > 0 else 1
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_matches = matches_data[start_idx:end_idx]
        
        return {
            'matches': paginated_matches,
            'total': total_matches,
            'pages': total_pages,
            'current_page': page
        }
        
    except Exception as e:
        logger.error(f"Error computing profile matches: {e}", exc_info=True)
        raise e

def update_user_service(profile_id, update_data):
    """
    Service to update profile details.
    """
    try:
        profiles_col = get_profile_collection()
        
        # Clean up data
        fields_to_update = {}
        valid_fields = ['name', 'bio', 'timezone', 'rating', 'location', 'skills_offered', 'skills_wanted', 'availability']
        
        for field in valid_fields:
            if field in update_data:
                val = update_data[field]
                # Ensure skills are lists
                if field in ['skills_offered', 'skills_wanted', 'availability'] and isinstance(val, str):
                    val = [item.strip() for item in val.split(',') if item.strip()]
                fields_to_update[field] = val
        
        if not fields_to_update:
            return False, "No valid fields to update"
            
        result = profiles_col.update_one(
            {'_id': ObjectId(profile_id)},
            {'$set': fields_to_update}
        )
        
        if result.matched_count == 0:
            return False, "Profile not found"
            
        logger.info(f"Successfully updated profile {profile_id}")
        return True, "Profile updated successfully"
        
    except Exception as e:
        logger.error(f"Error updating profile {profile_id}: {e}")
        return False, str(e)

def delete_user_service(profile_id):
    """
    Service to delete a profile and its related matches.
    """
    try:
        profiles_col = get_profile_collection()
        profile = profiles_col.find_one({'_id': ObjectId(profile_id)})
        
        if not profile:
            return False, "Profile not found"
            
        # Delete profile
        profiles_col.delete_one({'_id': ObjectId(profile_id)})
        
        # Delete related matches
        matches_col = get_collection('matches')
        matches_col.delete_many({
            '$or': [{'profile_id': profile_id}, {'matched_profile_id': profile_id}]
        })
        
        logger.info(f"Successfully deleted profile {profile_id} and its matches")
        return True, "Profile deleted successfully"
        
    except Exception as e:
        logger.error(f"Error deleting profile {profile_id}: {e}")
        return False, str(e)
