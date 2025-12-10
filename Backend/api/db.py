"""
MongoDB client layer for SkillSwap backend.

This module provides a centralized MongoDB client with helper functions
for database operations and connection management.
"""

import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from skillswap.settings_env import get_mongodb_uri

logger = logging.getLogger(__name__)

# Global MongoDB client instance
_client: Optional[MongoClient] = None
_database: Optional[Database] = None


def get_client() -> MongoClient:
    """
    Get or create MongoDB client instance.
    
    Returns:
        MongoClient instance
        
    Raises:
        ConnectionFailure: If unable to connect to MongoDB
    """
    global _client
    
    if _client is None:
        try:
            mongodb_uri = get_mongodb_uri()
            logger.info(f"Connecting to MongoDB at: {mongodb_uri}")
            
            _client = MongoClient(
                mongodb_uri,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            
            # Test the connection
            _client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise ConnectionFailure(
                f"Unable to connect to MongoDB. Please check your MONGODB_URI "
                f"and ensure MongoDB is running. Error: {e}"
            )
    
    return _client


def get_database(name: str = 'skillswap') -> Database:
    """
    Get database instance.
    
    Args:
        name: Database name (default: 'skillswap')
        
    Returns:
        Database instance
    """
    global _database
    
    if _database is None:
        client = get_client()
        _database = client[name]
        logger.info(f"Using database: {name}")
    
    return _database


def get_collection(name: str) -> Collection:
    """
    Get collection by name.
    
    Args:
        name: Collection name
        
    Returns:
        Collection instance
    """
    db = get_database()
    collection = db[name]
    logger.debug(f"Accessing collection: {name}")
    return collection


def health_check() -> bool:
    """
    Test MongoDB connection health.
    
    Returns:
        True if connection is healthy, False otherwise
    """
    try:
        client = get_client()
        # Ping the database
        client.admin.command('ping')
        logger.info("MongoDB health check passed")
        return True
    except Exception as e:
        logger.error(f"MongoDB health check failed: {e}")
        return False


def close_connection() -> None:
    """
    Gracefully close MongoDB connection.
    """
    global _client, _database
    
    if _client:
        try:
            _client.close()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {e}")
        finally:
            _client = None
            _database = None


def get_connection_info() -> dict:
    """
    Get MongoDB connection information.
    
    Returns:
        Dictionary with connection details
    """
    try:
        client = get_client()
        server_info = client.server_info()
        return {
            'connected': True,
            'version': server_info.get('version'),
            'host': client.address[0] if client.address else 'unknown',
            'port': client.address[1] if client.address else 'unknown',
            'database': get_database().name
        }
    except Exception as e:
        return {
            'connected': False,
            'error': str(e)
        }


# User Collection Helper Functions
def get_user_collection() -> Collection:
    """Get users collection."""
    return get_collection('users')


def get_token_collection() -> Collection:
    """Get tokens collection."""
    return get_collection('tokens')


def create_user_profile(django_user_id: int, email: str, name: str, 
                       avatar_url: str = None, phoneNumber: str = None, address: str = None, is_verified: bool = True) -> dict:
    """
    Create a new user profile in MongoDB.
    
    Args:
        django_user_id: Django User ID
        email: User email
        name: User name
        avatar_url: Optional avatar URL
        phoneNumber: Optional phone number
        address: Optional address
        
    Returns:
        Created user document
    """
    from datetime import datetime
    
    users = get_user_collection()
    
    user_data = {
        'django_user_id': django_user_id,
        'email': email,
        'name': name,
        'avatar_url': avatar_url or '',
        'phoneNumber': phoneNumber or '',
        'address': address or '',
        'created_at': datetime.utcnow(),
        'last_seen': datetime.utcnow(),
        'is_verified': is_verified,
        'profile_completed': False,
        'roles': ['user'],
        'skills_teaching': [],
        'skills_learning': []
    }
    
    result = users.insert_one(user_data)
    logger.info(f"Created user profile for {email} with ID {result.inserted_id}")
    return user_data


def get_user_by_email(email: str) -> dict:
    """
    Get user profile by email.
    
    Args:
        email: User email
        
    Returns:
        User document or None if not found
    """
    users = get_user_collection()
    return users.find_one({'email': email})


def get_user_by_django_id(django_user_id: int) -> dict:
    """
    Get user profile by Django User ID.
    
    Args:
        django_user_id: Django User ID
        
    Returns:
        User document or None if not found
    """
    users = get_user_collection()
    return users.find_one({'django_user_id': django_user_id})


def update_user_profile(django_user_id: int, **updates) -> bool:
    """
    Update user profile data.
    
    Args:
        django_user_id: Django User ID
        **updates: Fields to update
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    
    users = get_user_collection()
    
    # Add updated_at timestamp
    updates['updated_at'] = datetime.utcnow()
    
    result = users.update_one(
        {'django_user_id': django_user_id},
        {'$set': updates}
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated user profile for Django ID {django_user_id}")
        return True
    return False


def update_last_seen(django_user_id: int) -> bool:
    """
    Update user's last seen timestamp.
    
    Args:
        django_user_id: Django User ID
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    
    users = get_user_collection()
    result = users.update_one(
        {'django_user_id': django_user_id},
        {'$set': {'last_seen': datetime.utcnow()}}
    )
    return result.modified_count > 0


# Token Management Functions
def create_verification_token(user_id: int, email: str) -> str:
    """
    Create email verification token.
    
    Args:
        user_id: Django User ID
        email: User email
        
    Returns:
        Verification token
    """
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    
    tokens = get_token_collection()
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Store token in database
    token_data = {
        'user_id': user_id,
        'token': token_hash,
        'token_type': 'email_verification',
        'email': email,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24),
        'used': False
    }
    
    tokens.insert_one(token_data)
    logger.info(f"Created verification token for user {user_id}")
    return token


def create_reset_token(user_id: int, email: str) -> str:
    """
    Create password reset token.
    
    Args:
        user_id: Django User ID
        email: User email
        
    Returns:
        Reset token
    """
    import secrets
    import hashlib
    from datetime import datetime, timedelta
    
    tokens = get_token_collection()
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Store token in database
    token_data = {
        'user_id': user_id,
        'token': token_hash,
        'token_type': 'password_reset',
        'email': email,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=1),
        'used': False
    }
    
    tokens.insert_one(token_data)
    logger.info(f"Created reset token for user {user_id}")
    return token


def verify_token(token: str, token_type: str) -> dict:
    """
    Verify and consume a token.
    
    Args:
        token: Token to verify
        token_type: Type of token ('email_verification' or 'password_reset')
        
    Returns:
        Token document if valid, None if invalid
    """
    import hashlib
    from datetime import datetime
    
    tokens = get_token_collection()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    logger.info(f"Verifying {token_type} token. Token hash: {token_hash[:10]}...")
    
    # First check if token exists at all
    token_doc = tokens.find_one({
        'token': token_hash,
        'token_type': token_type
    })
    
    if not token_doc:
        logger.warning(f"Token not found for {token_type}")
        return None
    
    # Check if token is already used
    if token_doc.get('used', False):
        logger.warning(f"Token already used for {token_type}")
        return None
    
    # Check if token is expired
    if token_doc.get('expires_at') < datetime.utcnow():
        logger.warning(f"Token expired for {token_type}. Expires: {token_doc.get('expires_at')}")
        return None
    
    # Token is valid, mark as used
    tokens.update_one(
        {'_id': token_doc['_id']},
        {'$set': {'used': True, 'used_at': datetime.utcnow()}}
    )
    logger.info(f"Successfully verified and consumed {token_type} token for user {token_doc.get('user_id')}")
    return token_doc


def cleanup_expired_tokens() -> int:
    """
    Remove expired tokens from database.
    
    Returns:
        Number of tokens removed
    """
    from datetime import datetime
    
    tokens = get_token_collection()
    result = tokens.delete_many({
        'expires_at': {'$lt': datetime.utcnow()}
    })
    
    if result.deleted_count > 0:
        logger.info(f"Cleaned up {result.deleted_count} expired tokens")
    
    return result.deleted_count


def create_indexes() -> None:
    """
    Create MongoDB indexes for optimal performance.
    """
    try:
        # Users collection indexes
        users = get_user_collection()
        try:
            users.create_index('email', unique=True)
        except Exception as e:
            logger.warning(f"Email index may already exist: {e}")
        
        try:
            users.create_index('django_user_id', unique=True)
        except Exception as e:
            logger.warning(f"Django user ID index may already exist: {e}")
        
        try:
            users.create_index('created_at')
        except Exception as e:
            logger.warning(f"Created_at index may already exist: {e}")
        
        try:
            users.create_index('last_seen')
        except Exception as e:
            logger.warning(f"Last_seen index may already exist: {e}")
        
        # Tokens collection indexes
        tokens = get_token_collection()
        try:
            tokens.create_index('token', unique=True)
        except Exception as e:
            logger.warning(f"Token index may already exist: {e}")
        
        try:
            tokens.create_index('user_id')
        except Exception as e:
            logger.warning(f"Token user_id index may already exist: {e}")
        
        try:
            tokens.create_index('token_type')
        except Exception as e:
            logger.warning(f"Token type index may already exist: {e}")
        
        try:
            tokens.create_index('expires_at', expireAfterSeconds=0)  # TTL index
        except Exception as e:
            logger.warning(f"Token expires_at index may already exist: {e}")
        
        # Profiles collection indexes
        profiles = get_profile_collection()
        try:
            profiles.create_index('user_id', unique=True)  # One profile per user
        except Exception as e:
            logger.warning(f"Profile user_id index may already exist: {e}")
        
        try:
            profiles.create_index('skills_offered')  # For skill-based searches
        except Exception as e:
            logger.warning(f"Skills_offered index may already exist: {e}")
        
        try:
            profiles.create_index('skills_wanted')  # For skill-based searches
        except Exception as e:
            logger.warning(f"Skills_wanted index may already exist: {e}")
        
        try:
            profiles.create_index('rating')  # For sorting by rating
        except Exception as e:
            logger.warning(f"Rating index may already exist: {e}")
        
        try:
            profiles.create_index('created_at')  # For sorting by creation date
        except Exception as e:
            logger.warning(f"Profile created_at index may already exist: {e}")
        
        # Matches collection indexes
        matches = get_matches_collection()
        try:
            matches.create_index('user_id')
        except Exception as e:
            logger.warning(f"Matches user_id index may already exist: {e}")
        
        try:
            matches.create_index('matched_user_id')
        except Exception as e:
            logger.warning(f"Matches matched_user_id index may already exist: {e}")
        
        try:
            matches.create_index([('user_id', 1), ('match_score', -1)])  # Compound index
        except Exception as e:
            logger.warning(f"Matches compound index may already exist: {e}")
        
        try:
            matches.create_index('interest_status')
        except Exception as e:
            logger.warning(f"Matches interest_status index may already exist: {e}")
        
        # Conversations collection indexes
        conversations = get_conversations_collection()
        try:
            conversations.create_index('participants')  # Array index for finding conversations by participant
        except Exception as e:
            logger.warning(f"Conversations participants index may already exist: {e}")
        
        try:
            conversations.create_index([('participants', 1), ('updated_at', -1)])  # Compound index for user conversation queries
        except Exception as e:
            logger.warning(f"Conversations compound index may already exist: {e}")
        
        try:
            conversations.create_index('updated_at')  # For sorting by update time
        except Exception as e:
            logger.warning(f"Conversations updated_at index may already exist: {e}")
        
        # Messages collection indexes
        messages = get_messages_collection()
        try:
            messages.create_index('conversation_id')  # For finding messages by conversation
        except Exception as e:
            logger.warning(f"Messages conversation_id index may already exist: {e}")
        
        try:
            messages.create_index([('conversation_id', 1), ('timestamp', -1)])  # Composite index for fast sorting and querying
        except Exception as e:
            logger.warning(f"Messages composite index may already exist: {e}")
        
        try:
            messages.create_index('sender_id')  # For finding messages by sender
        except Exception as e:
            logger.warning(f"Messages sender_id index may already exist: {e}")
        
        try:
            messages.create_index('timestamp')  # For time-based queries
        except Exception as e:
            logger.warning(f"Messages timestamp index may already exist: {e}")
        
        try:
            messages.create_index('is_read')  # For filtering unread messages
        except Exception as e:
            logger.warning(f"Messages is_read index may already exist: {e}")
        
        try:
            # TTL index for temporary system messages (if is_system_message field exists)
            # This will auto-delete messages after 30 days if is_system_message is true
            messages.create_index('timestamp', expireAfterSeconds=2592000, partialFilterExpression={'is_system_message': True})
        except Exception as e:
            logger.warning(f"Messages TTL index may already exist: {e}")
        
        # Notifications collection indexes
        notifications = get_notifications_collection()
        try:
            notifications.create_index([('user_id', 1), ('created_at', -1)])  # Compound index for user notification queries
        except Exception as e:
            logger.warning(f"Notifications compound index may already exist: {e}")
        
        try:
            notifications.create_index([('user_id', 1), ('is_read', 1)])  # For unread count queries
        except Exception as e:
            logger.warning(f"Notifications user_id+is_read index may already exist: {e}")
        
        try:
            notifications.create_index('created_at')  # For sorting
        except Exception as e:
            logger.warning(f"Notifications created_at index may already exist: {e}")
        
        logger.info("Successfully created MongoDB indexes")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")
        raise


# Initialize connection on module import
try:
    get_client()
    logger.info("MongoDB client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB client: {e}")
    # Don't raise here to allow Django to start and show proper error messages


# Partial Registration Functions
def get_partial_user_collection() -> Collection:
    """Get partial_users collection for temporary registration data."""
    return get_collection('partial_users')


def save_partial_user_data(temp_user_id: str, firstName: str, lastName: str, 
                          phoneNumber: str, address: str) -> bool:
    """
    Save partial user registration data.
    
    Args:
        temp_user_id: Temporary user ID
        firstName: User's first name
        lastName: User's last name
        phoneNumber: User's phone number
        address: User's address
        
    Returns:
        True if saved successfully
    """
    from datetime import datetime, timedelta
    
    partial_users = get_partial_user_collection()
    
    partial_data = {
        'temp_user_id': temp_user_id,
        'firstName': firstName,
        'lastName': lastName,
        'phoneNumber': phoneNumber,
        'address': address,
        'created_at': datetime.utcnow(),
        'expires_at': datetime.utcnow() + timedelta(hours=24)  # Expire after 24 hours
    }
    
    try:
        result = partial_users.insert_one(partial_data)
        logger.info(f"Saved partial user data for temp ID {temp_user_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to save partial user data: {e}")
        return False


def get_partial_user_data(temp_user_id: str) -> dict:
    """
    Get partial user data by temporary ID.
    
    Args:
        temp_user_id: Temporary user ID
        
    Returns:
        Partial user data or None if not found/expired
    """
    from datetime import datetime
    
    partial_users = get_partial_user_collection()
    
    partial_data = partial_users.find_one({
        'temp_user_id': temp_user_id,
        'expires_at': {'$gt': datetime.utcnow()}
    })
    
    if partial_data:
        # Remove MongoDB _id field
        partial_data.pop('_id', None)
        logger.info(f"Retrieved partial user data for temp ID {temp_user_id}")
        return partial_data
    
    logger.warning(f"Partial user data not found or expired for temp ID {temp_user_id}")
    return None


def delete_partial_user_data(temp_user_id: str) -> bool:
    """
    Delete partial user data after successful registration.
    
    Args:
        temp_user_id: Temporary user ID
        
    Returns:
        True if deleted successfully
    """
    partial_users = get_partial_user_collection()
    
    try:
        result = partial_users.delete_one({'temp_user_id': temp_user_id})
        if result.deleted_count > 0:
            logger.info(f"Deleted partial user data for temp ID {temp_user_id}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete partial user data: {e}")
        return False


def cleanup_expired_partial_users() -> int:
    """
    Remove expired partial user data.
    
    Returns:
        Number of documents removed
    """
    from datetime import datetime
    
    partial_users = get_partial_user_collection()
    result = partial_users.delete_many({
        'expires_at': {'$lt': datetime.utcnow()}
    })
    
    if result.deleted_count > 0:
        logger.info(f"Cleaned up {result.deleted_count} expired partial user records")
    
    return result.deleted_count


# Profile Collection Helper Functions
def get_profile_collection() -> Collection:
    """Get profiles collection."""
    return get_collection('profiles')


def create_profile(user_id: str, name: str, bio: str = '', avatar_url: str = '',
                   skills_offered: list = None, skills_wanted: list = None,
                   location: dict = None, availability: list = None,
                   timezone: str = 'UTC', rating: float = 0.0, resume_url: str = '') -> dict:
    """
    Create a new user profile in MongoDB.
    
    Args:
        user_id: MongoDB ObjectId of the user (string)
        name: User's display name
        bio: User's bio/description
        avatar_url: URL to user's avatar image
        skills_offered: List of skills user can teach (1-10 items)
        skills_wanted: List of skills user wants to learn (1-10 items)
        location: Location object with city, country (no coordinates)
        availability: List of availability periods
        timezone: User's timezone
        rating: User's rating (default 0)
        resume_url: URL or base64 encoded resume file
        
    Returns:
        Created profile document
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    profiles = get_profile_collection()
    
    # Validate required fields
    if not user_id:
        raise ValueError("user_id is required")
    if not name or len(name.strip()) < 2:
        raise ValueError("name is required and must be at least 2 characters")
    
    # Validate skills
    if not skills_offered or len(skills_offered) == 0:
        raise ValueError("skills_offered is required and cannot be empty")
    if len(skills_offered) > 10:
        raise ValueError("skills_offered cannot have more than 10 items")
    
    if not skills_wanted or len(skills_wanted) == 0:
        raise ValueError("skills_wanted is required and cannot be empty")
    if len(skills_wanted) > 10:
        raise ValueError("skills_wanted cannot have more than 10 items")
    
    # Clean and validate skills
    skills_offered = [skill.strip().lower() for skill in skills_offered if skill.strip()]
    skills_wanted = [skill.strip().lower() for skill in skills_wanted if skill.strip()]
    
    if len(skills_offered) == 0:
        raise ValueError("skills_offered must contain at least one valid skill")
    if len(skills_wanted) == 0:
        raise ValueError("skills_wanted must contain at least one valid skill")
    
    # Validate location if provided
    if location:
        required_location_fields = ['city', 'country']
        for field in required_location_fields:
            if field not in location:
                raise ValueError(f"location.{field} is required when location is provided")
    
    # Check if profile already exists for this user
    existing_profile = profiles.find_one({'user_id': ObjectId(user_id)})
    if existing_profile:
        raise ValueError("Profile already exists for this user")
    
    profile_data = {
        'user_id': ObjectId(user_id),
        'name': name.strip(),
        'bio': bio.strip() if bio else '',
        'avatar_url': avatar_url.strip() if avatar_url else '',
        'resume_url': resume_url.strip() if resume_url else '',
        'skills_offered': skills_offered,
        'skills_wanted': skills_wanted,
        'location': location or {},
        'availability': availability or [],
        'timezone': timezone,
        'rating': float(rating),
        'total_matches': 0,
        'total_teaching_sessions': 0,
        'total_learning_sessions': 0,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = profiles.insert_one(profile_data)
    logger.info(f"Created profile for user {user_id} with ID {result.inserted_id}")
    return profile_data


def get_profile_by_user_id(user_id: str) -> dict:
    """
    Get user profile by MongoDB ObjectId.
    
    Args:
        user_id: MongoDB ObjectId of the user (string)
        
    Returns:
        Profile document or None if not found
    """
    from bson import ObjectId
    
    profiles = get_profile_collection()
    return profiles.find_one({'user_id': ObjectId(user_id)})


def update_profile(user_id: str, **updates) -> bool:
    """
    Update user profile data with validation.
    
    Args:
        user_id: MongoDB ObjectId of the user (string)
        **updates: Fields to update
        
    Returns:
        True if updated successfully
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    profiles = get_profile_collection()
    
    # Validate skills if provided
    if 'skills_offered' in updates:
        skills = updates['skills_offered']
        if skills is not None:
            # Allow empty array (user might be clearing skills)
            if len(skills) > 10:
                raise ValueError("skills_offered cannot have more than 10 items")
            # Clean skills
            cleaned = [skill.strip().lower() for skill in skills if skill.strip()]
            updates['skills_offered'] = cleaned
    
    if 'skills_wanted' in updates:
        skills = updates['skills_wanted']
        if skills is not None:
            # Allow empty array (user might be clearing skills)
            if len(skills) > 10:
                raise ValueError("skills_wanted cannot have more than 10 items")
            # Clean skills
            cleaned = [skill.strip().lower() for skill in skills if skill.strip()]
            updates['skills_wanted'] = cleaned
    
    # Validate name if provided
    if 'name' in updates:
        name = updates['name']
        if not name or len(name.strip()) < 2:
            raise ValueError("name must be at least 2 characters")
        updates['name'] = name.strip()
    
    # Validate location if provided
    if 'location' in updates and updates['location']:
        location = updates['location']
        required_location_fields = ['city', 'country']
        for field in required_location_fields:
            if field not in location:
                raise ValueError(f"location.{field} is required when location is provided")
    
    # Add updated_at timestamp
    updates['updated_at'] = datetime.utcnow()
    
    result = profiles.update_one(
        {'user_id': ObjectId(user_id)},
        {'$set': updates}
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated profile for user {user_id}")
        return True
    return False


def delete_profile(user_id: str) -> bool:
    """
    Delete user profile.
    
    Args:
        user_id: MongoDB ObjectId of the user (string)
        
    Returns:
        True if deleted successfully
    """
    from bson import ObjectId
    
    profiles = get_profile_collection()
    result = profiles.delete_one({'user_id': ObjectId(user_id)})
    
    if result.deleted_count > 0:
        logger.info(f"Deleted profile for user {user_id}")
        return True
    return False


def search_profiles_by_skills(skills: list, limit: int = 20) -> list:
    """
    Search profiles by skills offered or wanted.
    
    Args:
        skills: List of skills to search for
        limit: Maximum number of results
        
    Returns:
        List of matching profiles
    """
    profiles = get_profile_collection()
    
    # Search for profiles that offer any of the requested skills
    # or want any of the requested skills
    query = {
        '$or': [
            {'skills_offered': {'$in': skills}},
            {'skills_wanted': {'$in': skills}}
        ]
    }
    
    cursor = profiles.find(query).limit(limit)
    return list(cursor)


# Matches Collection Helper Functions
def get_matches_collection() -> Collection:
    """Get matches collection."""
    return get_collection('matches')


def create_or_update_match(user_id: str, matched_user_id: str, match_score: float) -> dict:
    """
    Create or update a match record.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        matched_user_id: MongoDB ObjectId string of the matched user
        match_score: Match score (0-100)
        
    Returns:
        Created or updated match document
    """
    from datetime import datetime
    from bson import ObjectId
    
    matches = get_matches_collection()
    
    match_data = {
        'user_id': ObjectId(user_id),
        'matched_user_id': ObjectId(matched_user_id),
        'match_score': match_score,
        'interest_status': 'none',
        'interested_by': None,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    # Check if match already exists
    existing = matches.find_one({
        'user_id': ObjectId(user_id),
        'matched_user_id': ObjectId(matched_user_id)
    })
    
    if existing:
        # Update existing match
        matches.update_one(
            {'_id': existing['_id']},
            {
                '$set': {
                    'match_score': match_score,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        match_data = existing
        match_data['match_score'] = match_score
        match_data['updated_at'] = datetime.utcnow()
    else:
        # Create new match
        result = matches.insert_one(match_data)
        match_data['_id'] = result.inserted_id
    
    logger.info(f"Created/updated match between {user_id} and {matched_user_id}")
    return match_data


def express_interest(user_id: str, matched_user_id: str) -> bool:
    """
    Express interest in a match.
    
    Args:
        user_id: User who is expressing interest
        matched_user_id: User being expressed interest to
        
    Returns:
        True if successful
    """
    from datetime import datetime
    from bson import ObjectId
    
    matches = get_matches_collection()
    
    # Update or create match record with interest
    result = matches.update_one(
        {
            'user_id': ObjectId(user_id),
            'matched_user_id': ObjectId(matched_user_id)
        },
        {
            '$set': {
                'interest_status': 'pending',
                'interested_by': ObjectId(user_id),
                'updated_at': datetime.utcnow()
            }
        },
        upsert=True
    )
    
    logger.info(f"User {user_id} expressed interest in {matched_user_id}")
    # With upsert=True, we should always have either modified_count > 0 or upserted_id
    # But to be safe, return True if either condition is met, or if acknowledged
    return result.acknowledged and (result.modified_count > 0 or result.upserted_id is not None)


def respond_to_interest(user_id: str, requester_user_id: str, accept: bool) -> bool:
    """
    Respond to an interest request (accept or reject).
    
    Args:
        user_id: User who is responding
        requester_user_id: User who expressed interest
        accept: True to accept, False to reject
        
    Returns:
        True if successful
    """
    from datetime import datetime
    from bson import ObjectId
    
    matches = get_matches_collection()
    
    # Update interest status
    new_status = 'accepted' if accept else 'rejected'
    
    result = matches.update_one(
        {
            'user_id': ObjectId(requester_user_id),
            'matched_user_id': ObjectId(user_id),
            'interest_status': 'pending'
        },
        {
            '$set': {
                'interest_status': new_status,
                'updated_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"User {user_id} {new_status} interest from {requester_user_id}")
        
        # If accepted, create mutual match record
        if accept:
            matches.update_one(
                {
                    'user_id': ObjectId(user_id),
                    'matched_user_id': ObjectId(requester_user_id)
                },
                {
                    '$set': {
                        'interest_status': 'accepted',
                        'interested_by': ObjectId(requester_user_id),
                        'updated_at': datetime.utcnow()
                    }
                },
                upsert=True
            )
        
        return True
    
    return False


def get_interested_users(user_id: str) -> list:
    """
    Get users who have expressed interest in the current user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        List of users who expressed interest
    """
    from bson import ObjectId
    
    matches = get_matches_collection()
    profiles = get_profile_collection()
    
    # Find all pending interests where user is the matched user
    interested_matches = matches.find({
        'matched_user_id': ObjectId(user_id),
        'interest_status': 'pending'
    })
    
    interested_users = []
    for match in interested_matches:
        user_id_obj = match.get('user_id')
        if user_id_obj:
            profile = profiles.find_one({'user_id': user_id_obj})
            if profile:
                interested_users.append({
                    'user_id': str(user_id_obj),
                    'profile': profile,
                    'interest_status': match.get('interest_status', 'pending'),
                    'created_at': match.get('created_at')
                })
    
    return interested_users


def get_mutual_matches(user_id: str) -> list:
    """
    Get mutual matches (accepted connections).
    
    Args:
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        List of mutual matches
    """
    from bson import ObjectId
    
    matches = get_matches_collection()
    profiles = get_profile_collection()
    
    # Find all accepted matches
    mutual_matches = matches.find({
        '$or': [
            {
                'user_id': ObjectId(user_id),
                'interest_status': 'accepted'
            },
            {
                'matched_user_id': ObjectId(user_id),
                'interest_status': 'accepted'
            }
        ]
    })
    
    mutual_list = []
    for match in mutual_matches:
        # Get the other user's ID
        if str(match['user_id']) == user_id:
            other_user_id = match['matched_user_id']
        else:
            other_user_id = match['user_id']
        
        profile = profiles.find_one({'user_id': other_user_id})
        if profile:
            mutual_list.append({
                'user_id': str(other_user_id),
                'profile': profile,
                'interest_status': 'accepted'
            })
    
    return mutual_list


def get_match_by_users(user_id: str, matched_user_id: str) -> dict:
    """
    Get match record between two users.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        matched_user_id: MongoDB ObjectId string of the matched user
        
    Returns:
        Match document or None
    """
    from bson import ObjectId
    
    matches = get_matches_collection()
    
    match = matches.find_one({
        'user_id': ObjectId(user_id),
        'matched_user_id': ObjectId(matched_user_id)
    })
    
    return match


# Subscription Collection Helper Functions
def get_subscriptions_collection() -> Collection:
    """Get subscriptions collection."""
    return get_collection('subscriptions')


def create_subscription(user_id: str, stripe_customer_id: str, stripe_subscription_id: str, 
                        plan_type: str = 'premium', status: str = 'active') -> dict:
    """
    Create a subscription record.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        stripe_customer_id: Stripe customer ID
        stripe_subscription_id: Stripe subscription ID
        plan_type: Subscription plan type (default: 'premium')
        status: Subscription status (default: 'active')
        
    Returns:
        Created subscription document
    """
    from datetime import datetime, timedelta
    from bson import ObjectId
    
    subscriptions = get_subscriptions_collection()
    
    subscription_data = {
        'user_id': ObjectId(user_id),
        'stripe_customer_id': stripe_customer_id,
        'stripe_subscription_id': stripe_subscription_id,
        'plan_type': plan_type,
        'status': status,
        'current_period_start': datetime.utcnow(),
        'current_period_end': datetime.utcnow() + timedelta(days=30),
        'cancel_at_period_end': False,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = subscriptions.insert_one(subscription_data)
    logger.info(f"Created subscription for user {user_id}")
    return subscription_data


def get_subscription_by_user(user_id: str) -> dict:
    """
    Get subscription by user ID.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        Subscription document or None
    """
    from bson import ObjectId
    
    subscriptions = get_subscriptions_collection()
    return subscriptions.find_one({'user_id': ObjectId(user_id)})


def get_subscription_by_stripe_id(stripe_subscription_id: str) -> dict:
    """
    Get subscription by Stripe subscription ID.
    
    Args:
        stripe_subscription_id: Stripe subscription ID
        
    Returns:
        Subscription document or None
    """
    subscriptions = get_subscriptions_collection()
    return subscriptions.find_one({'stripe_subscription_id': stripe_subscription_id})


def update_subscription_status(stripe_subscription_id: str, status: str, 
                                current_period_start=None, current_period_end=None,
                                cancel_at_period_end: bool = None) -> bool:
    """
    Update subscription status.
    
    Args:
        stripe_subscription_id: Stripe subscription ID
        status: New subscription status
        current_period_start: Period start datetime
        current_period_end: Period end datetime
        cancel_at_period_end: Whether to cancel at period end
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    from bson import ObjectId
    
    subscriptions = get_subscriptions_collection()
    
    update_data = {
        'status': status,
        'updated_at': datetime.utcnow()
    }
    
    if current_period_start:
        update_data['current_period_start'] = current_period_start
    if current_period_end:
        update_data['current_period_end'] = current_period_end
    if cancel_at_period_end is not None:
        update_data['cancel_at_period_end'] = cancel_at_period_end
    
    result = subscriptions.update_one(
        {'stripe_subscription_id': stripe_subscription_id},
        {'$set': update_data}
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated subscription {stripe_subscription_id} status to {status}")
        return True
    return False


def cancel_subscription(stripe_subscription_id: str, cancel_at_period_end: bool = True) -> bool:
    """
    Cancel a subscription (either immediately or at period end).
    
    Args:
        stripe_subscription_id: Stripe subscription ID
        cancel_at_period_end: If True, cancel at period end; if False, cancel immediately
        
    Returns:
        True if updated successfully
    """
    return update_subscription_status(stripe_subscription_id, 'canceled', 
                                     cancel_at_period_end=cancel_at_period_end)


# Payment Transactions Collection Helper Functions
def get_payments_collection() -> Collection:
    """Get payments collection."""
    return get_collection('payments')


def create_payment_transaction(transaction_type: str, from_user_id: str, amount: float,
                               stripe_payment_intent_id: str = None, stripe_session_id: str = None,
                               to_user_id: str = None, metadata: dict = None, status: str = 'pending') -> dict:
    """
    Create a payment transaction record.
    
    Args:
        transaction_type: 'subscription' or 'tip'
        from_user_id: User who paid (MongoDB ObjectId string)
        amount: Payment amount in USD
        stripe_payment_intent_id: Stripe payment intent ID
        stripe_session_id: Stripe session ID
        to_user_id: User who received payment (None for subscriptions)
        metadata: Additional metadata
        status: Transaction status (default: 'pending')
        
    Returns:
        Created transaction document
    """
    from datetime import datetime
    from bson import ObjectId
    
    payments = get_payments_collection()
    
    transaction_data = {
        'transaction_type': transaction_type,
        'from_user_id': ObjectId(from_user_id),
        'amount': float(amount),
        'currency': 'usd',
        'stripe_payment_intent_id': stripe_payment_intent_id or '',
        'stripe_session_id': stripe_session_id or '',
        'to_user_id': ObjectId(to_user_id) if to_user_id else None,
        'status': status,
        'metadata': metadata or {},
        'created_at': datetime.utcnow(),
        'completed_at': None
    }
    
    result = payments.insert_one(transaction_data)
    logger.info(f"Created {transaction_type} transaction for user {from_user_id}")
    return transaction_data


def update_payment_transaction_status(stripe_session_id: str, status: str) -> bool:
    """
    Update payment transaction status.
    
    Args:
        stripe_session_id: Stripe session ID
        status: New status ('pending', 'completed', 'failed', 'refunded')
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    
    payments = get_payments_collection()
    
    update_data = {'status': status}
    if status == 'completed':
        update_data['completed_at'] = datetime.utcnow()
    
    result = payments.update_one(
        {'stripe_session_id': stripe_session_id},
        {'$set': update_data}
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated payment transaction {stripe_session_id} status to {status}")
        return True
    return False


def get_user_payment_history(user_id: str, transaction_type: str = None, limit: int = 50) -> list:
    """
    Get payment history for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        transaction_type: Filter by type ('subscription' or 'tip')
        limit: Maximum number of results
        
    Returns:
        List of payment transactions
    """
    from bson import ObjectId
    
    payments = get_payments_collection()
    
    query = {'from_user_id': ObjectId(user_id)}
    if transaction_type:
        query['transaction_type'] = transaction_type
    
    cursor = payments.find(query).sort('created_at', -1).limit(limit)
    return list(cursor)


def get_user_tips_received(user_id: str, limit: int = 50) -> list:
    """
    Get tips received by a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        limit: Maximum number of results
        
    Returns:
        List of tip transactions
    """
    from bson import ObjectId
    
    payments = get_payments_collection()
    
    cursor = payments.find({
        'to_user_id': ObjectId(user_id),
        'transaction_type': 'tip',
        'status': 'completed'
    }).sort('created_at', -1).limit(limit)
    
    return list(cursor)


def get_user_tips_given(user_id: str, limit: int = 50) -> list:
    """
    Get tips given by a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        limit: Maximum number of results
        
    Returns:
        List of tip transactions
    """
    from bson import ObjectId
    
    payments = get_payments_collection()
    
    cursor = payments.find({
        'from_user_id': ObjectId(user_id),
        'transaction_type': 'tip',
        'status': 'completed'
    }).sort('created_at', -1).limit(limit)
    
    return list(cursor)


# Conversations Collection Helper Functions
def get_conversations_collection() -> Collection:
    """Get conversations collection."""
    return get_collection('conversations')


def get_messages_collection() -> Collection:
    """Get messages collection."""
    return get_collection('messages')


def get_or_create_conversation(participant_ids: list) -> dict:
    """
    Get existing conversation between participants or create a new one.
    
    Args:
        participant_ids: List of MongoDB ObjectId strings (exactly 2 participants)
        
    Returns:
        Conversation document
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    conversations = get_conversations_collection()
    
    # Validate participants
    if not participant_ids or len(participant_ids) != 2:
        raise ValueError("conversation must have exactly 2 participants")
    
    # Convert to ObjectIds and ensure uniqueness
    participant_oids = []
    for pid in participant_ids:
        try:
            oid = ObjectId(pid)
            if oid not in participant_oids:
                participant_oids.append(oid)
        except Exception:
            raise ValueError(f"Invalid participant ID: {pid}")
    
    if len(participant_oids) != 2:
        raise ValueError("participants must be unique")
    
    # Verify both participants exist in users collection
    users = get_user_collection()
    for oid in participant_oids:
        # Check if user exists (users collection uses django_user_id, but we need to check MongoDB _id)
        # Since users collection uses django_user_id, we need to check differently
        # For now, we'll assume the ObjectId references are valid
        pass
    
    # Sort participant IDs for consistent lookup
    participant_oids.sort()
    
    # Check if conversation already exists
    existing = conversations.find_one({
        'participants': participant_oids
    })
    
    if existing:
        logger.info(f"Found existing conversation {existing['_id']} between participants")
        return existing
    
    # Create new conversation
    conversation_data = {
        'participants': participant_oids,
        'last_message': '',
        'last_message_timestamp': None,
        'unread_counts': {
            str(participant_oids[0]): 0,
            str(participant_oids[1]): 0
        },
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = conversations.insert_one(conversation_data)
    conversation_data['_id'] = result.inserted_id
    logger.info(f"Created new conversation {result.inserted_id} between participants")
    return conversation_data


def get_conversation_by_id(conversation_id: str) -> dict:
    """
    Get conversation by ID.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        
    Returns:
        Conversation document or None if not found
    """
    from bson import ObjectId
    
    conversations = get_conversations_collection()
    try:
        return conversations.find_one({'_id': ObjectId(conversation_id)})
    except Exception:
        return None


def get_user_conversations(user_id: str) -> list:
    """
    Get all conversations for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        List of conversation documents
    """
    from bson import ObjectId
    
    conversations = get_conversations_collection()
    
    try:
        user_oid = ObjectId(user_id)
        cursor = conversations.find({
            'participants': user_oid
        }).sort('updated_at', -1)
        return list(cursor)
    except Exception as e:
        logger.error(f"Error getting conversations for user {user_id}: {e}")
        return []


def update_conversation_last_message(conversation_id: str, message_text: str, timestamp) -> bool:
    """
    Update conversation's last message and timestamp.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        message_text: Text of the last message
        timestamp: When the message was sent (datetime object)
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    from bson import ObjectId
    
    conversations = get_conversations_collection()
    
    result = conversations.update_one(
        {'_id': ObjectId(conversation_id)},
        {
            '$set': {
                'last_message': message_text,
                'last_message_timestamp': timestamp,
                'updated_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated last message for conversation {conversation_id}")
        return True
    return False


def increment_unread_count(conversation_id: str, user_id: str) -> bool:
    """
    Increment unread count for a participant in a conversation.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        True if updated successfully
    """
    from bson import ObjectId
    
    conversations = get_conversations_collection()
    
    result = conversations.update_one(
        {'_id': ObjectId(conversation_id)},
        {
            '$inc': {f'unread_counts.{user_id}': 1}
        }
    )
    
    if result.modified_count > 0:
        logger.debug(f"Incremented unread count for user {user_id} in conversation {conversation_id}")
        return True
    return False


def reset_unread_count(conversation_id: str, user_id: str) -> bool:
    """
    Reset unread count to 0 for a participant in a conversation.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        True if updated successfully
    """
    from bson import ObjectId
    
    conversations = get_conversations_collection()
    
    result = conversations.update_one(
        {'_id': ObjectId(conversation_id)},
        {
            '$set': {f'unread_counts.{user_id}': 0}
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Reset unread count for user {user_id} in conversation {conversation_id}")
        return True
    return False


# Messages Collection Helper Functions
def create_message(conversation_id: str = None, sender_id: str = None, 
                   recipient_id: str = None, text: str = '', 
                   attachments: list = None) -> dict:
    """
    Create a message with validation. Auto-creates conversation if needed.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation (optional)
        sender_id: MongoDB ObjectId string of the sender
        recipient_id: MongoDB ObjectId string of the recipient (required if conversation_id is None)
        text: Message content
        attachments: Optional list of file URLs
        
    Returns:
        Created message document
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    messages = get_messages_collection()
    conversations = get_conversations_collection()
    
    # Validate text
    if not text or not text.strip():
        raise ValueError("message text cannot be empty")
    
    if len(text.strip()) < 1:
        raise ValueError("message text must be at least 1 character")
    
    # Validate sender
    if not sender_id:
        raise ValueError("sender_id is required")
    
    try:
        sender_oid = ObjectId(sender_id)
    except Exception:
        raise ValueError(f"Invalid sender_id: {sender_id}")
    
    # Handle conversation creation/validation
    if conversation_id is None:
        # Auto-create conversation
        if not recipient_id:
            raise ValueError("recipient_id is required when conversation_id is not provided")
        
        try:
            recipient_oid = ObjectId(recipient_id)
        except Exception:
            raise ValueError(f"Invalid recipient_id: {recipient_id}")
        
        # Get or create conversation
        conversation = get_or_create_conversation([sender_id, recipient_id])
        conversation_id = str(conversation['_id'])
    else:
        # Validate conversation exists
        conversation = get_conversation_by_id(conversation_id)
        if not conversation:
            raise ValueError(f"conversation {conversation_id} does not exist")
        
        # Validate sender is a participant
        participant_oids = [str(p) for p in conversation['participants']]
        if sender_id not in participant_oids:
            raise ValueError("sender must be a participant in the conversation")
    
    # Validate attachments if provided
    if attachments:
        if not isinstance(attachments, list):
            raise ValueError("attachments must be a list")
        # Basic URL validation (can be enhanced)
        for url in attachments:
            if not isinstance(url, str) or not url.strip():
                raise ValueError("all attachment URLs must be non-empty strings")
    
    # Create message
    message_data = {
        'conversation_id': ObjectId(conversation_id),
        'sender_id': sender_oid,
        'text': text.strip(),
        'attachments': attachments or [],
        'timestamp': datetime.utcnow(),
        'is_read': False,
        'read_at': None
    }
    
    result = messages.insert_one(message_data)
    message_data['_id'] = result.inserted_id
    logger.info(f"Created message {result.inserted_id} in conversation {conversation_id}")
    
    # Update conversation's last message
    update_conversation_last_message(conversation_id, text.strip(), message_data['timestamp'])
    
    # Increment unread count for the other participant(s) and send notification
    conversation = get_conversation_by_id(conversation_id)
    if conversation:
        # Get sender's name for notification
        sender_user = get_user_by_django_id(None)  # We need MongoDB user, not Django
        sender_name = "Someone"
        try:
            from bson import ObjectId
            users = get_user_collection()
            sender_mongo = users.find_one({'_id': sender_oid})
            if sender_mongo:
                sender_name = sender_mongo.get('name', 'Someone')
        except Exception as e:
            logger.warning(f"Could not get sender name for notification: {e}")
        
        for participant_oid in conversation['participants']:
            participant_str = str(participant_oid)
            if participant_str != sender_id:
                increment_unread_count(conversation_id, participant_str)
                
                # Send notification to recipient
                try:
                    from api.notifications import send_notification, NOTIFICATION_TYPES
                    # Truncate message text for notification body
                    message_preview = text.strip()[:100] + ('...' if len(text.strip()) > 100 else '')
                    send_notification(
                        user_id=participant_str,
                        notification_type=NOTIFICATION_TYPES['NEW_MESSAGE'],
                        title=f"New message from {sender_name}",
                        body=message_preview,
                        related_id=conversation_id
                    )
                except Exception as e:
                    logger.error(f"Error sending message notification: {e}")
                    # Don't fail message creation if notification fails
    
    return message_data


def get_messages_by_conversation(conversation_id: str, limit: int = 50, skip: int = 0) -> list:
    """
    Get messages for a conversation, sorted by timestamp (newest first).
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        limit: Maximum number of messages to return
        skip: Number of messages to skip (for pagination)
        
    Returns:
        List of message documents
    """
    from bson import ObjectId
    
    messages = get_messages_collection()
    
    try:
        cursor = messages.find({
            'conversation_id': ObjectId(conversation_id)
        }).sort('timestamp', -1).skip(skip).limit(limit)
        return list(cursor)
    except Exception as e:
        logger.error(f"Error getting messages for conversation {conversation_id}: {e}")
        return []


def get_messages_after_timestamp(conversation_id: str, after_timestamp, limit: int = 50) -> list:
    """
    Get messages for a conversation after a specific timestamp.
    Used for fetching missed messages on reconnection.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        after_timestamp: datetime object - get messages after this timestamp
        limit: Maximum number of messages to return
        
    Returns:
        List of message documents sorted by timestamp ascending (oldest first)
    """
    from bson import ObjectId
    from datetime import datetime
    
    messages = get_messages_collection()
    
    try:
        # Ensure after_timestamp is a datetime object
        if isinstance(after_timestamp, str):
            # Try parsing ISO format first
            try:
                after_timestamp = datetime.fromisoformat(after_timestamp.replace('Z', '+00:00'))
            except ValueError:
                # Fallback to strptime for other formats
                try:
                    after_timestamp = datetime.strptime(after_timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
                except ValueError:
                    logger.error(f"Could not parse timestamp string: {after_timestamp}")
                    return []
        elif not isinstance(after_timestamp, datetime):
            logger.error(f"Invalid timestamp type: {type(after_timestamp)}")
            return []
        
        cursor = messages.find({
            'conversation_id': ObjectId(conversation_id),
            'timestamp': {'$gt': after_timestamp}
        }).sort('timestamp', 1).limit(limit)  # Sort ascending (oldest first)
        return list(cursor)
    except Exception as e:
        logger.error(f"Error getting messages after timestamp for conversation {conversation_id}: {e}")
        return []


def mark_message_as_read(message_id: str) -> bool:
    """
    Mark a message as read.
    
    Args:
        message_id: MongoDB ObjectId string of the message
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    from bson import ObjectId
    
    messages = get_messages_collection()
    
    result = messages.update_one(
        {'_id': ObjectId(message_id)},
        {
            '$set': {
                'is_read': True,
                'read_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Marked message {message_id} as read")
        return True
    return False


def mark_conversation_messages_as_read(conversation_id: str, user_id: str) -> int:
    """
    Mark all unread messages in a conversation as read for a user.
    
    Args:
        conversation_id: MongoDB ObjectId string of the conversation
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        Number of messages marked as read
    """
    from datetime import datetime
    from bson import ObjectId
    
    messages = get_messages_collection()
    
    # Mark all unread messages in conversation (except those sent by the user) as read
    result = messages.update_many(
        {
            'conversation_id': ObjectId(conversation_id),
            'sender_id': {'$ne': ObjectId(user_id)},
            'is_read': False
        },
        {
            '$set': {
                'is_read': True,
                'read_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Marked {result.modified_count} messages as read in conversation {conversation_id} for user {user_id}")
        # Reset unread count for the user
        reset_unread_count(conversation_id, user_id)
    
    return result.modified_count


def update_message(message_id: str, sender_id: str, new_text: str) -> dict:
    """
    Update a message's text. Only the sender can update their own message.
    
    Args:
        message_id: MongoDB ObjectId string of the message
        sender_id: MongoDB ObjectId string of the sender (for validation)
        new_text: New message text
        
    Returns:
        Updated message document or None if not found/unauthorized
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    messages = get_messages_collection()
    
    # Validate new text
    if not new_text or not new_text.strip():
        raise ValueError("message text cannot be empty")
    
    if len(new_text.strip()) < 1:
        raise ValueError("message text must be at least 1 character")
    
    # Validate message_id
    try:
        message_oid = ObjectId(message_id)
        sender_oid = ObjectId(sender_id)
    except Exception:
        raise ValueError(f"Invalid message_id or sender_id format")
    
    # Get message and verify sender
    message = messages.find_one({'_id': message_oid})
    if not message:
        return None
    
    # Verify sender owns the message
    if message.get('sender_id') != sender_oid:
        raise ValueError("Only the message sender can update the message")
    
    # Update message
    result = messages.update_one(
        {'_id': message_oid},
        {
            '$set': {
                'text': new_text.strip(),
                'edited_at': datetime.utcnow(),
                'is_edited': True
            }
        }
    )
    
    if result.modified_count > 0:
        # Get updated message
        updated_message = messages.find_one({'_id': message_oid})
        logger.info(f"Updated message {message_id} by sender {sender_id}")
        
        # Update conversation's last message if this was the last message
        conversation_id = str(message.get('conversation_id'))
        conversation = get_conversation_by_id(conversation_id)
        if conversation and conversation.get('last_message_timestamp') == message.get('timestamp'):
            update_conversation_last_message(conversation_id, new_text.strip(), message.get('timestamp'))
        
        return updated_message
    
    return None


def delete_message(message_id: str, sender_id: str) -> bool:
    """
    Delete a message. Only the sender can delete their own message.
    Uses soft delete (marks as deleted) to preserve conversation history.
    
    Args:
        message_id: MongoDB ObjectId string of the message
        sender_id: MongoDB ObjectId string of the sender (for validation)
        
    Returns:
        True if deleted successfully, False otherwise
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    messages = get_messages_collection()
    
    # Validate IDs
    try:
        message_oid = ObjectId(message_id)
        sender_oid = ObjectId(sender_id)
    except Exception:
        raise ValueError(f"Invalid message_id or sender_id format")
    
    # Get message and verify sender
    message = messages.find_one({'_id': message_oid})
    if not message:
        return False
    
    # Verify sender owns the message
    if message.get('sender_id') != sender_oid:
        raise ValueError("Only the message sender can delete the message")
    
    # Soft delete: mark as deleted instead of removing
    result = messages.update_one(
        {'_id': message_oid},
        {
            '$set': {
                'is_deleted': True,
                'deleted_at': datetime.utcnow(),
                'text': '[Message deleted]',  # Replace text with placeholder
                'attachments': []  # Remove attachments
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Deleted message {message_id} by sender {sender_id}")
        
        # Update conversation's last message if this was the last message
        conversation_id = str(message.get('conversation_id'))
        conversation = get_conversation_by_id(conversation_id)
        if conversation and conversation.get('last_message_timestamp') == message.get('timestamp'):
            # Find the most recent non-deleted message
            recent_messages = get_messages_by_conversation(conversation_id, limit=1)
            if recent_messages and len(recent_messages) > 0:
                last_msg = recent_messages[0]
                if not last_msg.get('is_deleted', False):
                    update_conversation_last_message(
                        conversation_id, 
                        last_msg.get('text', ''), 
                        last_msg.get('timestamp')
                    )
                else:
                    # All messages deleted, set empty
                    update_conversation_last_message(conversation_id, '', None)
            else:
                # No messages left
                update_conversation_last_message(conversation_id, '', None)
        
        return True
    
    return False


def get_message_by_id(message_id: str) -> dict:
    """
    Get a message by ID.
    
    Args:
        message_id: MongoDB ObjectId string of the message
        
    Returns:
        Message document or None if not found
    """
    from bson import ObjectId
    
    messages = get_messages_collection()
    try:
        return messages.find_one({'_id': ObjectId(message_id)})
    except Exception:
        return None


# Notifications Collection Helper Functions
def get_notifications_collection() -> Collection:
    """Get notifications collection."""
    return get_collection('notifications')


def create_notification(user_id: str, notification_type: str, title: str, body: str, related_id: str = None) -> dict:
    """
    Create a notification document.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        notification_type: Type of notification (e.g., "new_message", "payment_success")
        title: Notification title
        body: Notification body/message
        related_id: Optional reference to conversation, payment, or request
        
    Returns:
        Created notification document
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    
    # Validate required fields
    if not user_id:
        raise ValueError("user_id is required")
    if not notification_type:
        raise ValueError("notification_type is required")
    if not title:
        raise ValueError("title is required")
    if not body:
        raise ValueError("body is required")
    
    # Validate notification type
    valid_types = ['new_message', 'payment_success', 'payment_received', 'subscription_updated',
                   'session_request', 'session_accept', 'session_reject']
    if notification_type not in valid_types:
        raise ValueError(f"Invalid notification type. Must be one of: {valid_types}")
    
    notification_data = {
        'user_id': ObjectId(user_id),
        'type': notification_type,
        'title': title.strip(),
        'body': body.strip(),
        'related_id': ObjectId(related_id) if related_id else None,
        'is_read': False,
        'created_at': datetime.utcnow()
    }
    
    result = notifications.insert_one(notification_data)
    notification_data['_id'] = result.inserted_id
    logger.info(f"Created {notification_type} notification for user {user_id}")
    return notification_data


def get_user_notifications(user_id: str, limit: int = 50, skip: int = 0, unread_only: bool = False) -> list:
    """
    Get notifications for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        limit: Maximum number of notifications to return
        skip: Number of notifications to skip (for pagination)
        unread_only: If True, only return unread notifications
        
    Returns:
        List of notification documents sorted by created_at (newest first)
    """
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    
    try:
        query = {'user_id': ObjectId(user_id)}
        if unread_only:
            query['is_read'] = False
        
        cursor = notifications.find(query).sort('created_at', -1).skip(skip).limit(limit)
        return list(cursor)
    except Exception as e:
        logger.error(f"Error getting notifications for user {user_id}: {e}")
        return []


def mark_notification_as_read(notification_id: str) -> bool:
    """
    Mark a notification as read.
    
    Args:
        notification_id: MongoDB ObjectId string of the notification
        
    Returns:
        True if updated successfully
    """
    from datetime import datetime
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    
    result = notifications.update_one(
        {'_id': ObjectId(notification_id)},
        {
            '$set': {
                'is_read': True,
                'read_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Marked notification {notification_id} as read")
        return True
    return False


def mark_all_notifications_as_read(user_id: str) -> int:
    """
    Mark all notifications as read for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        Number of notifications marked as read
    """
    from datetime import datetime
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    
    result = notifications.update_many(
        {
            'user_id': ObjectId(user_id),
            'is_read': False
        },
        {
            '$set': {
                'is_read': True,
                'read_at': datetime.utcnow()
            }
        }
    )
    
    if result.modified_count > 0:
        logger.info(f"Marked {result.modified_count} notifications as read for user {user_id}")
    
    return result.modified_count


def get_unread_count(user_id: str) -> int:
    """
    Get count of unread notifications for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        
    Returns:
        Number of unread notifications
    """
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    
    try:
        count = notifications.count_documents({
            'user_id': ObjectId(user_id),
            'is_read': False
        })
        return count
    except Exception as e:
        logger.error(f"Error getting unread count for user {user_id}: {e}")
        return 0


def get_notification_by_id(notification_id: str) -> dict:
    """
    Get notification by ID.
    
    Args:
        notification_id: MongoDB ObjectId string of the notification
        
    Returns:
        Notification document or None if not found
    """
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    try:
        return notifications.find_one({'_id': ObjectId(notification_id)})
    except Exception:
        return None


def delete_notification(notification_id: str) -> bool:
    """
    Delete a notification.
    
    Args:
        notification_id: MongoDB ObjectId string of the notification
        
    Returns:
        True if deleted successfully
    """
    from bson import ObjectId
    
    notifications = get_notifications_collection()
    result = notifications.delete_one({'_id': ObjectId(notification_id)})
    
    if result.deleted_count > 0:
        logger.info(f"Deleted notification {notification_id}")
        return True
    return False


# Session Collection Helper Functions
def get_sessions_collection() -> Collection:
    """Get sessions collection."""
    return get_collection('sessions')


def create_session(teacher_id: str, learner_id: str, skill_taught: str, skill_learned: str,
                  scheduled_date: str, scheduled_time: str, duration_minutes: int = 60,
                  notes: str = '', status: str = 'pending') -> dict:
    """
    Create a new session in MongoDB.
    
    Args:
        teacher_id: MongoDB ObjectId string of the teacher
        learner_id: MongoDB ObjectId string of the learner
        skill_taught: Skill being taught
        skill_learned: Skill being learned
        scheduled_date: Date of session (YYYY-MM-DD format)
        scheduled_time: Time of session (HH:MM format)
        duration_minutes: Session duration in minutes (default: 60)
        notes: Session notes/description
        status: Session status (default: 'pending')
        
    Returns:
        Created session document
        
    Raises:
        ValueError: If validation fails
    """
    from datetime import datetime
    from bson import ObjectId
    
    sessions = get_sessions_collection()
    
    # Validate required fields
    if not teacher_id:
        raise ValueError("teacher_id is required")
    if not learner_id:
        raise ValueError("learner_id is required")
    if teacher_id == learner_id:
        raise ValueError("teacher_id and learner_id cannot be the same")
    if not skill_taught or not skill_taught.strip():
        raise ValueError("skill_taught is required")
    if not skill_learned or not skill_learned.strip():
        raise ValueError("skill_learned is required")
    if not scheduled_date:
        raise ValueError("scheduled_date is required")
    if not scheduled_time:
        raise ValueError("scheduled_time is required")
    
    # Validate status
    valid_statuses = ['pending', 'accepted', 'completed', 'cancelled']
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    # Validate duration
    if duration_minutes <= 0:
        raise ValueError("duration_minutes must be greater than 0")
    if duration_minutes > 480:  # Max 8 hours
        raise ValueError("duration_minutes cannot exceed 480 (8 hours)")
    
    # Validate date format (YYYY-MM-DD)
    try:
        parsed_date = datetime.strptime(scheduled_date, '%Y-%m-%d').date()
        # Ensure date is not in the past
        if parsed_date < datetime.utcnow().date():
            raise ValueError("scheduled_date cannot be in the past")
    except ValueError as e:
        if "cannot be in the past" in str(e):
            raise
        raise ValueError("scheduled_date must be in YYYY-MM-DD format")
    
    # Validate time format (HH:MM)
    try:
        time_parts = scheduled_time.split(':')
        if len(time_parts) != 2:
            raise ValueError("Invalid time format")
        hour = int(time_parts[0])
        minute = int(time_parts[1])
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            raise ValueError("Invalid time values")
    except (ValueError, IndexError):
        raise ValueError("scheduled_time must be in HH:MM format (24-hour)")
    
    # Check if users have accepted match
    match1 = get_match_by_users(teacher_id, learner_id)
    match2 = get_match_by_users(learner_id, teacher_id)
    
    has_accepted_match = False
    if match1 and match1.get('interest_status') == 'accepted':
        has_accepted_match = True
    elif match2 and match2.get('interest_status') == 'accepted':
        has_accepted_match = True
    
    if not has_accepted_match:
        raise ValueError("Users must have an accepted match/interest to create a session")
    
    # Create session document
    session_data = {
        'teacher_id': ObjectId(teacher_id),
        'learner_id': ObjectId(learner_id),
        'skill_taught': skill_taught.strip(),
        'skill_learned': skill_learned.strip(),
        'scheduled_date': scheduled_date,
        'scheduled_time': scheduled_time,
        'duration_minutes': int(duration_minutes),
        'status': status,
        'notes': notes.strip() if notes else '',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = sessions.insert_one(session_data)
    session_data['_id'] = result.inserted_id
    logger.info(f"Created session {result.inserted_id} between teacher {teacher_id} and learner {learner_id}")
    return session_data


def get_session(session_id: str) -> dict:
    """
    Get session by ID.
    
    Args:
        session_id: MongoDB ObjectId string of the session
        
    Returns:
        Session document or None if not found
    """
    from bson import ObjectId
    
    sessions = get_sessions_collection()
    try:
        return sessions.find_one({'_id': ObjectId(session_id)})
    except (InvalidId, Exception):
        return None


def update_session(session_id: str, **updates) -> bool:
    """
    Update session data.
    
    Args:
        session_id: MongoDB ObjectId string of the session
        **updates: Fields to update
        
    Returns:
        True if successful, False otherwise
    """
    from datetime import datetime
    from bson import ObjectId
    from bson.errors import InvalidId
    
    sessions = get_sessions_collection()
    
    try:
        session_obj_id = ObjectId(session_id)
    except InvalidId:
        logger.error(f"Invalid session_id format: {session_id}")
        return False
    
    # Validate status if provided
    if 'status' in updates:
        valid_statuses = ['pending', 'accepted', 'completed', 'cancelled']
        if updates['status'] not in valid_statuses:
            logger.error(f"Invalid status: {updates['status']}")
            return False
    
    # Validate date format if provided
    if 'scheduled_date' in updates:
        try:
            parsed_date = datetime.strptime(updates['scheduled_date'], '%Y-%m-%d').date()
            if parsed_date < datetime.utcnow().date():
                logger.error("scheduled_date cannot be in the past")
                return False
        except ValueError:
            logger.error("scheduled_date must be in YYYY-MM-DD format")
            return False
    
    # Validate time format if provided
    if 'scheduled_time' in updates:
        try:
            time_parts = updates['scheduled_time'].split(':')
            if len(time_parts) != 2:
                raise ValueError("Invalid time format")
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            if hour < 0 or hour > 23 or minute < 0 or minute > 59:
                raise ValueError("Invalid time values")
        except (ValueError, IndexError):
            logger.error("scheduled_time must be in HH:MM format (24-hour)")
            return False
    
    # Validate duration if provided
    if 'duration_minutes' in updates:
        duration = updates['duration_minutes']
        if duration <= 0 or duration > 480:
            logger.error("duration_minutes must be between 1 and 480")
            return False
    
    # Prepare update data
    update_data = {}
    for key, value in updates.items():
        if key in ['skill_taught', 'skill_learned', 'notes']:
            update_data[key] = value.strip() if value else ''
        elif key in ['scheduled_date', 'scheduled_time', 'status']:
            update_data[key] = value
        elif key == 'duration_minutes':
            update_data[key] = int(value)
    
    if not update_data:
        return False
    
    update_data['updated_at'] = datetime.utcnow()
    
    result = sessions.update_one(
        {'_id': session_obj_id},
        {'$set': update_data}
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated session {session_id}")
        return True
    
    return False


def get_user_sessions(user_id: str, status: str = None) -> list:
    """
    Get all sessions for a user (both teaching and learning).
    
    Args:
        user_id: MongoDB ObjectId string of the user
        status: Optional status filter
        
    Returns:
        List of session documents
    """
    from bson import ObjectId
    
    sessions = get_sessions_collection()
    
    query = {
        '$or': [
            {'teacher_id': ObjectId(user_id)},
            {'learner_id': ObjectId(user_id)}
        ]
    }
    
    if status:
        query['status'] = status
    
    return list(sessions.find(query).sort('scheduled_date', 1).sort('scheduled_time', 1))


def get_teaching_sessions(user_id: str, status: str = None) -> list:
    """
    Get teaching sessions for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        status: Optional status filter
        
    Returns:
        List of session documents where user is the teacher
    """
    from bson import ObjectId
    
    sessions = get_sessions_collection()
    
    query = {'teacher_id': ObjectId(user_id)}
    
    if status:
        query['status'] = status
    
    return list(sessions.find(query).sort('scheduled_date', 1).sort('scheduled_time', 1))


def get_learning_sessions(user_id: str, status: str = None) -> list:
    """
    Get learning sessions for a user.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        status: Optional status filter
        
    Returns:
        List of session documents where user is the learner
    """
    from bson import ObjectId
    
    sessions = get_sessions_collection()
    
    query = {'learner_id': ObjectId(user_id)}
    
    if status:
        query['status'] = status
    
    return list(sessions.find(query).sort('scheduled_date', 1).sort('scheduled_time', 1))


def delete_session(session_id: str) -> bool:
    """
    Delete a session.
    
    Args:
        session_id: MongoDB ObjectId string of the session
        
    Returns:
        True if deleted successfully
    """
    from bson import ObjectId
    from bson.errors import InvalidId
    
    sessions = get_sessions_collection()
    
    try:
        result = sessions.delete_one({'_id': ObjectId(session_id)})
        if result.deleted_count > 0:
            logger.info(f"Deleted session {session_id}")
            return True
        return False
    except InvalidId:
        logger.error(f"Invalid session_id format: {session_id}")
        return False


def update_profile_session_stats(user_id: str, session_type: str, increment: bool = True) -> bool:
    """
    Update profile session statistics.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        session_type: 'teaching' or 'learning'
        increment: True to increment, False to decrement
        
    Returns:
        True if successful
    """
    from bson import ObjectId
    from bson.errors import InvalidId
    
    profiles = get_profile_collection()
    
    try:
        user_obj_id = ObjectId(user_id)
    except InvalidId:
        logger.error(f"Invalid user_id format: {user_id}")
        return False
    
    if session_type not in ['teaching', 'learning']:
        logger.error(f"Invalid session_type: {session_type}")
        return False
    
    field_name = f'total_{session_type}_sessions'
    
    update_op = {'$inc': {field_name: 1 if increment else -1}}
    
    result = profiles.update_one(
        {'user_id': user_obj_id},
        update_op
    )
    
    if result.modified_count > 0:
        logger.info(f"Updated {field_name} for user {user_id}")
        return True
    
    return False

