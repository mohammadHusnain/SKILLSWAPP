"""
WebSocket consumers for real-time chat messaging.

This module contains the ChatConsumer that handles WebSocket connections
for real-time messaging between users.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from bson import ObjectId
from bson.errors import InvalidId

from api.db import (
    get_user_by_django_id,
    get_conversation_by_id,
    create_message,
    mark_conversation_messages_as_read,
    mark_message_as_read,
    get_user_conversations,
    get_messages_after_timestamp,
    update_last_seen,
    get_user_notifications,
    update_message,
    delete_message,
    get_message_by_id
)

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Verify JWT token and return Django User and MongoDB user ID.
    
    Args:
        token_string: JWT access token string
        
    Returns:
        tuple: (django_user, mongo_user_id) or (None, None) if invalid
    """
    try:
        # Remove 'Bearer ' prefix if present
        if token_string.startswith('Bearer '):
            token_string = token_string[7:]
        
        # Verify and decode token
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        
        # Get Django User
        try:
            django_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User {user_id} not found in Django")
            return None, None
        
        # Get MongoDB user ID
        mongo_user = get_user_by_django_id(django_user.id)
        if not mongo_user:
            logger.warning(f"MongoDB user not found for Django user {django_user.id}")
            return None, None
        
        mongo_user_id = str(mongo_user['_id'])
        return django_user, mongo_user_id
        
    except (TokenError, InvalidToken, Exception) as e:
        logger.error(f"Token verification failed: {e}")
        return None, None


@database_sync_to_async
def validate_conversation_access(user_id, conversation_id):
    """
    Validate that user is a participant in the conversation.
    
    Args:
        user_id: MongoDB ObjectId string of the user
        conversation_id: MongoDB ObjectId string of the conversation
        
    Returns:
        tuple: (is_valid, conversation) or (False, None)
    """
    try:
        conversation = get_conversation_by_id(conversation_id)
        if not conversation:
            return False, None
        
        # Check if user is a participant
        user_oid = ObjectId(user_id)
        participant_ids = [str(p) for p in conversation.get('participants', [])]
        
        if user_id not in participant_ids:
            logger.warning(f"User {user_id} is not a participant in conversation {conversation_id}")
            return False, None
        
        return True, conversation
        
    except (InvalidId, Exception) as e:
        logger.error(f"Error validating conversation access: {e}")
        return False, None


@database_sync_to_async
def save_message_to_db(conversation_id, sender_id, text, attachments=None):
    """
    Save message to MongoDB.
    
    Args:
        conversation_id: MongoDB ObjectId string
        sender_id: MongoDB ObjectId string
        text: Message text
        attachments: Optional list of attachment URLs
        
    Returns:
        dict: Created message document or None
    """
    try:
        message = create_message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            text=text,
            attachments=attachments
        )
        return message
    except Exception as e:
        logger.error(f"Error saving message to database: {e}")
        return None


@database_sync_to_async
def mark_messages_read(conversation_id, user_id, message_ids=None):
    """
    Mark messages as read.
    
    Args:
        conversation_id: MongoDB ObjectId string
        user_id: MongoDB ObjectId string
        message_ids: Optional list of specific message IDs to mark as read
        
    Returns:
        int: Number of messages marked as read
    """
    try:
        if message_ids:
            # Mark specific messages as read
            count = 0
            for msg_id in message_ids:
                if mark_message_as_read(msg_id):
                    count += 1
            return count
        else:
            # Mark all unread messages in conversation as read
            return mark_conversation_messages_as_read(conversation_id, user_id)
    except Exception as e:
        logger.error(f"Error marking messages as read: {e}")
        return 0


@database_sync_to_async
def fetch_user_conversations(user_id):
    """
    Get all conversations for a user.
    
    Args:
        user_id: MongoDB ObjectId string
        
    Returns:
        List of conversation documents
    """
    try:
        return get_user_conversations(user_id)
    except Exception as e:
        logger.error(f"Error fetching user conversations: {e}")
        return []


@database_sync_to_async
def fetch_missed_messages(conversation_id, after_timestamp, limit=50):
    """
    Fetch missed messages after a timestamp.
    
    Args:
        conversation_id: MongoDB ObjectId string
        after_timestamp: datetime object
        limit: Maximum number of messages
        
    Returns:
        List of message documents
    """
    try:
        return get_messages_after_timestamp(conversation_id, after_timestamp, limit)
    except Exception as e:
        logger.error(f"Error fetching missed messages: {e}")
        return []


@database_sync_to_async
def update_user_last_seen_db(django_user_id):
    """
    Update user's last seen timestamp.
    
    Args:
        django_user_id: Django User ID
        
    Returns:
        bool: True if updated successfully
    """
    try:
        return update_last_seen(django_user_id)
    except Exception as e:
        logger.error(f"Error updating last seen: {e}")
        return False


@database_sync_to_async
def fetch_user_notifications_db(user_id, limit=50, unread_only=False):
    """
    Fetch notifications for a user.
    
    Args:
        user_id: MongoDB ObjectId string
        limit: Maximum number of notifications
        unread_only: If True, only fetch unread notifications
        
    Returns:
        List of notification documents
    """
    try:
        from api.db import get_user_notifications
        return get_user_notifications(user_id, limit=limit, unread_only=unread_only)
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        return []


def format_message_response(message):
    """
    Format message document for WebSocket response.
    
    Args:
        message: Message document from MongoDB
        
    Returns:
        dict: Formatted message for WebSocket
    """
    return {
        'id': str(message.get('_id')),
        'conversation_id': str(message.get('conversation_id')),
        'sender_id': str(message.get('sender_id')),
        'text': message.get('text', ''),
        'attachments': message.get('attachments', []),
        'timestamp': message.get('timestamp').isoformat() if message.get('timestamp') else None,
        'is_read': message.get('is_read', False),
        'read_at': message.get('read_at').isoformat() if message.get('read_at') else None
    }


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat messaging.
    
    Handles:
    - WebSocket connections with flexible JWT authentication (headers/query or first message)
    - Automatic reconnection with missed message recovery
    - Presence tracking (online/offline status)
    - Message deduplication
    - Sending and receiving messages
    - Typing indicators
    - Read receipts
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Connection state
        self.authenticated = False
        self.user = None
        self.mongo_user_id = None
        self.conversation_id = None
        self.room_group_name = None
        self.conversation_groups = set()  # Track all groups user is in
        self.sent_message_ids = set()  # Track sent messages for deduplication
        self.last_seen_timestamps = {}  # Track last seen per conversation
    
    async def connect(self):
        """
        Handle WebSocket connection.
        Allows unauthenticated connections initially, authentication can happen via headers/query or first message.
        """
        # Extract conversation_id from URL path (optional for general connection)
        self.conversation_id = self.scope['url_route']['kwargs'].get('conversation_id')
        
        # Extract token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        # Parse query string for token
        if query_string:
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = params.get('token')
        
        # Also check headers for token
        if not token:
            headers = dict(self.scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode()
            if auth_header:
                # Remove 'Bearer ' prefix if present
                if auth_header.startswith('Bearer '):
                    token = auth_header[7:]
                else:
                    token = auth_header
        
        # Accept connection first (even without token)
        await self.accept()
        
        # If token provided, authenticate immediately
        if token:
            await self.authenticate_user(token)
        else:
            # Send message requesting authentication
            await self.send(text_data=json.dumps({
                'type': 'auth_required',
                'message': 'Please authenticate by sending an authenticate event with your token'
            }))
    
    async def authenticate_user(self, token):
        """
        Authenticate user with JWT token and set up connection.
        """
        # Verify token and get user
        django_user, mongo_user_id = await get_user_from_token(token)
        
        if not django_user or not mongo_user_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'AUTH_FAILED',
                'error': 'Invalid or expired token'
            }))
            await self.close(code=4001)  # Unauthorized
            return
        
        # Store user info
        self.user = django_user
        self.mongo_user_id = mongo_user_id
        self.authenticated = True
        
        # Update last seen
        await update_user_last_seen_db(django_user.id)
        
        # If conversation_id provided, validate and join that conversation
        # Special case: "notifications" is used for notification-only connections
        if self.conversation_id and self.conversation_id != 'notifications':
            is_valid, conversation = await validate_conversation_access(
                mongo_user_id,
                self.conversation_id
            )
            
            if not is_valid:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'FORBIDDEN',
                    'error': f'Not authorized for conversation {self.conversation_id}'
                }))
                await self.close(code=4003)  # Forbidden
                return
            
            # Join conversation group
            self.room_group_name = f'chat_{self.conversation_id}'
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            self.conversation_groups.add(self.room_group_name)
            
            # Broadcast user online status
            await self.broadcast_presence('online')
        
        # Join notification group
        notification_group_name = f'notifications_{mongo_user_id}'
        await self.channel_layer.group_add(
            notification_group_name,
            self.channel_name
        )
        self.conversation_groups.add(notification_group_name)
        
        # Fetch all user conversations and join groups (for reconnection)
        await self.reconnect_to_conversations()
        
        # Fetch and send missed notifications
        await self.send_missed_notifications()
        
        # Send authentication success
        await self.send(text_data=json.dumps({
            'type': 'authenticated',
            'status': 'success',
            'user_id': mongo_user_id,
            'conversation_id': self.conversation_id
        }))
        
        logger.info(f"User {mongo_user_id} authenticated and connected")
    
    async def reconnect_to_conversations(self):
        """
        Reconnect to all user's conversations, fetch missed messages, and join groups.
        """
        if not self.authenticated or not self.mongo_user_id:
            return
        
        try:
            # Fetch all user conversations
            conversations = await fetch_user_conversations(self.mongo_user_id)
            
            for conversation in conversations:
                conv_id = str(conversation['_id'])
                group_name = f'chat_{conv_id}'
                
                # Join conversation group if not already joined
                if group_name not in self.conversation_groups:
                    await self.channel_layer.group_add(
                        group_name,
                        self.channel_name
                    )
                    self.conversation_groups.add(group_name)
                
                # Get last seen timestamp for this conversation
                last_seen = self.last_seen_timestamps.get(conv_id)
                if not last_seen:
                    # Use conversation's last_message_timestamp or user's last_seen
                    last_seen = conversation.get('last_message_timestamp')
                    if not last_seen and self.user:
                        mongo_user = await database_sync_to_async(get_user_by_django_id)(self.user.id)
                        if mongo_user:
                            last_seen = mongo_user.get('last_seen')
                
                # Fetch missed messages if we have a last seen timestamp
                if last_seen:
                    missed_messages = await fetch_missed_messages(conv_id, last_seen, limit=50)
                    if missed_messages:
                        # Send missed messages to client
                        for msg in missed_messages:
                            msg_id = str(msg.get('_id'))
                            if msg_id not in self.sent_message_ids:
                                await self.send(text_data=json.dumps({
                                    'type': 'missed_message',
                                    'conversation_id': conv_id,
                                    'message': format_message_response(msg)
                                }))
                                self.sent_message_ids.add(msg_id)
                
                # Update last seen timestamp for this conversation
                self.last_seen_timestamps[conv_id] = conversation.get('last_message_timestamp')
        
        except Exception as e:
            logger.error(f"Error reconnecting to conversations: {e}")
    
    async def send_missed_notifications(self):
        """
        Fetch and send missed notifications to the user.
        """
        if not self.authenticated or not self.mongo_user_id:
            return
        
        try:
            # Fetch unread notifications
            notifications = await fetch_user_notifications_db(
                self.mongo_user_id,
                limit=50,
                unread_only=True
            )
            
            if notifications:
                # Format notifications for WebSocket
                formatted_notifications = []
                for notif in notifications:
                    formatted_notifications.append({
                        'id': str(notif.get('_id')),
                        'type': notif.get('type'),
                        'title': notif.get('title'),
                        'body': notif.get('body'),
                        'related_id': str(notif.get('related_id')) if notif.get('related_id') else None,
                        'is_read': notif.get('is_read', False),
                        'created_at': notif.get('created_at').isoformat() if notif.get('created_at') else None
                    })
                
                # Send missed notifications
                await self.send(text_data=json.dumps({
                    'type': 'missed_notifications',
                    'notifications': formatted_notifications
                }))
                
        except Exception as e:
            logger.error(f"Error sending missed notifications: {e}")
    
    async def broadcast_presence(self, status):
        """
        Broadcast user online/offline status to all conversation groups.
        
        Args:
            status: 'online' or 'offline'
        """
        if not self.authenticated or not self.mongo_user_id:
            return
        
        for group_name in self.conversation_groups:
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'presence_update',
                    'user_id': self.mongo_user_id,
                    'status': status
                }
            )
    
    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        """
        if self.authenticated:
            # Broadcast offline status
            await self.broadcast_presence('offline')
            
            # Remove from all conversation groups
            for group_name in self.conversation_groups:
                await self.channel_layer.group_discard(
                    group_name,
                    self.channel_name
                )
            
            logger.info(f"User {self.mongo_user_id} disconnected")
        
        # Clean up
        self.conversation_groups.clear()
        self.sent_message_ids.clear()
        self.last_seen_timestamps.clear()
    
    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages.
        """
        try:
            data = json.loads(text_data)
            event_type = data.get('type')
            
            # Handle authentication event (can happen before other events)
            if event_type == 'authenticate':
                token = data.get('token')
                if not token:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'code': 'VALIDATION_ERROR',
                        'error': 'Token is required for authentication'
                    }))
                    return
                await self.authenticate_user(token)
                return
            
            # All other events require authentication
            if not self.authenticated:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'AUTH_REQUIRED',
                    'error': 'Authentication required. Please send an authenticate event first.'
                }))
                return
            
            # Route to appropriate handler
            if event_type == 'send_message':
                await self.handle_send_message(data)
            elif event_type == 'typing':
                await self.handle_typing(data)
            elif event_type == 'read_receipt':
                await self.handle_read_receipt(data)
            elif event_type == 'reconnect':
                await self.handle_reconnect(data)
            elif event_type == 'get_missed_messages':
                await self.handle_get_missed_messages(data)
            elif event_type == 'notifications_sync':
                await self.handle_notifications_sync(data)
            elif event_type == 'edit_message':
                await self.handle_edit_message(data)
            elif event_type == 'delete_message':
                await self.handle_delete_message(data)
            elif event_type == 'ping':
                # Heartbeat to keep connection alive
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'UNKNOWN_EVENT',
                    'error': f'Unknown event type: {event_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'VALIDATION_ERROR',
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Internal server error'
            }))
    
    async def handle_send_message(self, data):
        """
        Handle send_message event.
        """
        try:
            # Get conversation_id from data or use default
            conversation_id = data.get('conversation_id') or self.conversation_id
            if not conversation_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'conversation_id is required'
                }))
                return
            
            # Validate conversation access
            is_valid, conversation = await validate_conversation_access(
                self.mongo_user_id,
                conversation_id
            )
            if not is_valid:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'FORBIDDEN',
                    'error': 'Not authorized for this conversation'
                }))
                return
            
            # Validate required fields
            text = data.get('text', '').strip()
            if not text:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'Message text cannot be empty'
                }))
                return
            
            # Get optional attachments
            attachments = data.get('attachments', [])
            if attachments and not isinstance(attachments, list):
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'Attachments must be a list'
                }))
                return
            
            # Save message to database
            message = await save_message_to_db(
                conversation_id=conversation_id,
                sender_id=self.mongo_user_id,
                text=text,
                attachments=attachments
            )
            
            if not message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'INTERNAL_ERROR',
                    'error': 'Failed to save message'
                }))
                return
            
            # Update last seen timestamp
            if message.get('timestamp'):
                self.last_seen_timestamps[conversation_id] = message['timestamp']
            
            # Update user's last_seen
            await update_user_last_seen_db(self.user.id)
            
            # Format message for response
            message_data = format_message_response(message)
            message_id = message_data['id']
            
            # Add to sent messages set (prevent duplicates)
            self.sent_message_ids.add(message_id)
            
            # Broadcast to conversation group
            group_name = f'chat_{conversation_id}'
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
            
            # Send confirmation to sender
            await self.send(text_data=json.dumps({
                'type': 'message_sent',
                'message': message_data
            }))
            
        except Exception as e:
            logger.error(f"Error handling send_message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Failed to send message'
            }))
    
    async def handle_typing(self, data):
        """
        Handle typing event.
        """
        try:
            conversation_id = data.get('conversation_id') or self.conversation_id
            if not conversation_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'conversation_id is required'
                }))
                return
            
            is_typing = data.get('is_typing', True)
            group_name = f'chat_{conversation_id}'
            
            # Broadcast typing indicator to conversation group
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': self.mongo_user_id,
                    'is_typing': is_typing
                }
            )
            
        except Exception as e:
            logger.error(f"Error handling typing event: {e}")
    
    async def handle_read_receipt(self, data):
        """
        Handle read_receipt event.
        """
        try:
            conversation_id = data.get('conversation_id') or self.conversation_id
            if not conversation_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'conversation_id is required'
                }))
                return
            
            # Get optional message IDs
            message_ids = data.get('message_ids', [])
            
            # Mark messages as read
            count = await mark_messages_read(
                conversation_id=conversation_id,
                user_id=self.mongo_user_id,
                message_ids=message_ids if message_ids else None
            )
            
            # Broadcast read receipt to conversation group
            group_name = f'chat_{conversation_id}'
            await self.channel_layer.group_send(
                group_name,
                {
                    'type': 'read_receipt',
                    'user_id': self.mongo_user_id,
                    'conversation_id': conversation_id,
                    'message_count': count
                }
            )
            
            # Send confirmation
            await self.send(text_data=json.dumps({
                'type': 'read_receipt_sent',
                'message_count': count
            }))
            
        except Exception as e:
            logger.error(f"Error handling read_receipt: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Failed to process read receipt'
            }))
    
    async def handle_reconnect(self, data):
        """
        Handle explicit reconnection request.
        """
        try:
            await self.reconnect_to_conversations()
            await self.send(text_data=json.dumps({
                'type': 'reconnected',
                'status': 'success'
            }))
        except Exception as e:
            logger.error(f"Error handling reconnect: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'RECONNECT_FAILED',
                'error': 'Failed to reconnect'
            }))
    
    async def handle_get_missed_messages(self, data):
        """
        Handle request for missed messages for a specific conversation.
        """
        try:
            conversation_id = data.get('conversation_id')
            if not conversation_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'conversation_id is required'
                }))
                return
            
            # Validate conversation access
            is_valid, conversation = await validate_conversation_access(
                self.mongo_user_id,
                conversation_id
            )
            if not is_valid:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'FORBIDDEN',
                    'error': 'Not authorized for this conversation'
                }))
                return
            
            # Get last seen timestamp
            last_seen = self.last_seen_timestamps.get(conversation_id)
            if not last_seen:
                last_seen = conversation.get('last_message_timestamp')
            
            if last_seen:
                missed_messages = await fetch_missed_messages(conversation_id, last_seen, limit=50)
                formatted_messages = [format_message_response(msg) for msg in missed_messages]
                
                await self.send(text_data=json.dumps({
                    'type': 'missed_messages',
                    'conversation_id': conversation_id,
                    'messages': formatted_messages
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'missed_messages',
                    'conversation_id': conversation_id,
                    'messages': []
                }))
                
        except Exception as e:
            logger.error(f"Error handling get_missed_messages: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Failed to fetch missed messages'
            }))
    
    async def handle_notifications_sync(self, data):
        """
        Handle request to sync notifications.
        """
        try:
            unread_only = data.get('unread_only', False)
            limit = data.get('limit', 50)
            
            notifications = await fetch_user_notifications_db(
                self.mongo_user_id,
                limit=limit,
                unread_only=unread_only
            )
            
            formatted_notifications = []
            for notif in notifications:
                formatted_notifications.append({
                    'id': str(notif.get('_id')),
                    'type': notif.get('type'),
                    'title': notif.get('title'),
                    'body': notif.get('body'),
                    'related_id': str(notif.get('related_id')) if notif.get('related_id') else None,
                    'is_read': notif.get('is_read', False),
                    'created_at': notif.get('created_at').isoformat() if notif.get('created_at') else None
                })
            
            await self.send(text_data=json.dumps({
                'type': 'notifications_sync',
                'notifications': formatted_notifications
            }))
            
        except Exception as e:
            logger.error(f"Error handling notifications sync: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Failed to sync notifications'
            }))
    
    async def handle_edit_message(self, data):
        """
        Handle edit_message event.
        """
        try:
            message_id = data.get('message_id')
            if not message_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'message_id is required'
                }))
                return
            
            new_text = data.get('text', '').strip()
            if not new_text:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'text is required and cannot be empty'
                }))
                return
            
            # Get message to find conversation_id
            message = await database_sync_to_async(get_message_by_id)(message_id)
            if not message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'NOT_FOUND',
                    'error': 'Message not found'
                }))
                return
            
            conversation_id = str(message.get('conversation_id'))
            
            # Validate conversation access
            is_valid, conversation = await validate_conversation_access(
                self.mongo_user_id,
                conversation_id
            )
            if not is_valid:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'FORBIDDEN',
                    'error': 'Not authorized for this conversation'
                }))
                return
            
            # Update message
            try:
                updated_message = await database_sync_to_async(update_message)(
                    message_id,
                    self.mongo_user_id,
                    new_text
                )
                
                if not updated_message:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'code': 'INTERNAL_ERROR',
                        'error': 'Failed to update message'
                    }))
                    return
                
                # Format message for response
                message_data = format_message_response(updated_message)
                
                # Broadcast to conversation group
                group_name = f'chat_{conversation_id}'
                await self.channel_layer.group_send(
                    group_name,
                    {
                        'type': 'message_edited',
                        'message': message_data
                    }
                )
                
                # Send confirmation to sender
                await self.send(text_data=json.dumps({
                    'type': 'message_edited',
                    'message': message_data
                }))
                
            except ValueError as e:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': str(e)
                }))
            
        except Exception as e:
            logger.error(f"Error handling edit_message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Failed to edit message'
            }))
    
    async def handle_delete_message(self, data):
        """
        Handle delete_message event.
        """
        try:
            message_id = data.get('message_id')
            if not message_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': 'message_id is required'
                }))
                return
            
            # Get message to find conversation_id
            message = await database_sync_to_async(get_message_by_id)(message_id)
            if not message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'NOT_FOUND',
                    'error': 'Message not found'
                }))
                return
            
            conversation_id = str(message.get('conversation_id'))
            
            # Validate conversation access
            is_valid, conversation = await validate_conversation_access(
                self.mongo_user_id,
                conversation_id
            )
            if not is_valid:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'FORBIDDEN',
                    'error': 'Not authorized for this conversation'
                }))
                return
            
            # Delete message
            try:
                success = await database_sync_to_async(delete_message)(
                    message_id,
                    self.mongo_user_id
                )
                
                if not success:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'code': 'INTERNAL_ERROR',
                        'error': 'Failed to delete message'
                    }))
                    return
                
                # Get updated message (soft delete)
                deleted_message = await database_sync_to_async(get_message_by_id)(message_id)
                if deleted_message:
                    message_data = format_message_response(deleted_message)
                else:
                    # Fallback if message not found
                    message_data = {
                        'id': message_id,
                        'conversation_id': conversation_id,
                        'is_deleted': True
                    }
                
                # Broadcast to conversation group
                group_name = f'chat_{conversation_id}'
                await self.channel_layer.group_send(
                    group_name,
                    {
                        'type': 'message_deleted',
                        'message': message_data
                    }
                )
                
                # Send confirmation to sender
                await self.send(text_data=json.dumps({
                    'type': 'message_deleted',
                    'message': message_data
                }))
                
            except ValueError as e:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'code': 'VALIDATION_ERROR',
                    'error': str(e)
                }))
            
        except Exception as e:
            logger.error(f"Error handling delete_message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'code': 'INTERNAL_ERROR',
                'error': 'Failed to delete message'
            }))
    
    # Handler methods for group messages
    
    async def chat_message(self, event):
        """
        Receive message from conversation group and send to WebSocket.
        Includes deduplication to prevent duplicate messages.
        """
        message = event['message']
        message_id = message.get('id')
        
        # Check if message was already sent (deduplication)
        if message_id and message_id not in self.sent_message_ids:
            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': message
            }))
            self.sent_message_ids.add(message_id)
            
            # Update last seen timestamp
            conversation_id = message.get('conversation_id')
            if conversation_id and message.get('timestamp'):
                from datetime import datetime
                timestamp = message['timestamp']
                if isinstance(timestamp, str):
                    # Try parsing ISO format
                    try:
                        self.last_seen_timestamps[conversation_id] = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except ValueError:
                        try:
                            self.last_seen_timestamps[conversation_id] = datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
                        except ValueError:
                            logger.warning(f"Could not parse timestamp: {timestamp}")
                else:
                    self.last_seen_timestamps[conversation_id] = timestamp
    
    async def typing_indicator(self, event):
        """
        Receive typing indicator from conversation group and send to WebSocket.
        """
        # Don't send typing indicator back to the user who is typing
        if event['user_id'] != self.mongo_user_id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))
    
    async def read_receipt(self, event):
        """
        Receive read receipt from conversation group and send to WebSocket.
        """
        # Don't send read receipt back to the user who marked as read
        if event['user_id'] != self.mongo_user_id:
            await self.send(text_data=json.dumps({
                'type': 'read_receipt',
                'user_id': event['user_id'],
                'conversation_id': event['conversation_id'],
                'message_count': event['message_count']
            }))
    
    async def presence_update(self, event):
        """
        Receive presence update (online/offline) from conversation group and send to WebSocket.
        """
        # Don't send presence update back to the user
        if event['user_id'] != self.mongo_user_id:
            await self.send(text_data=json.dumps({
                'type': 'presence',
                'user_id': event['user_id'],
                'status': event['status']
            }))
    
    async def notification_received(self, event):
        """
        Receive notification from notification group and send to WebSocket.
        """
        notification = event['notification']
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification
        }))
    
    async def message_edited(self, event):
        """
        Receive message edit from conversation group and send to WebSocket.
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'message_edited',
            'message': message
        }))
    
    async def message_deleted(self, event):
        """
        Receive message delete from conversation group and send to WebSocket.
        """
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message': message
        }))

