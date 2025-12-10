"""
Authentication views for SkillSwap API.

This module contains all authentication-related views including registration,
login, logout, profile management, email verification, and password reset.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import logging

from api.serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PartialRegistrationSerializer,
    CompleteRegistrationSerializer,
    PasswordStrengthSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer
)
from api.db import (
    create_user_profile,
    get_user_by_email,
    get_user_by_django_id,
    update_user_profile,
    update_last_seen,
    create_reset_token,
    create_verification_token,
    verify_token,
    create_profile
)
from api.email_utils import (
    send_password_reset_email,
    send_verification_email
)
from api.password_utils import (
    calculate_password_strength,
    get_strength_bar_color,
    get_strength_bar_width
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new user account.
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Create Django User (inactive until email verified)
            user = User.objects.create_user(
                username=serializer.validated_data['email'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data['firstName'],
                last_name=serializer.validated_data['lastName'],
                is_active=False  # Inactive until email verified
            )
            
            # Create MongoDB user profile
            full_name = f"{serializer.validated_data['firstName']} {serializer.validated_data['lastName']}"
            mongo_user = create_user_profile(
                django_user_id=user.id,
                email=serializer.validated_data['email'],
                name=full_name,
                phoneNumber=serializer.validated_data['phoneNumber'],
                address=serializer.validated_data['address'],
                avatar_url=serializer.validated_data.get('avatar_url', ''),
                is_verified=False  # Not verified until email verified
            )
            
            # Create verification token and send email
            verification_token = create_verification_token(user.id, user.email)
            send_verification_email(user.email, full_name, verification_token)
            
            # Auto-create empty profile with default values
            try:
                create_profile(
                    user_id=str(mongo_user['_id']),
                    name=full_name,
                    bio='',
                    avatar_url='',
                    skills_offered=['update'],
                    skills_wanted=['update'],
                    location={},
                    availability=[],
                    timezone='UTC',
                    rating=0.0
                )
                logger.info(f"Auto-created profile for user: {user.email}")
            except Exception as e:
                logger.warning(f"Could not auto-create profile for user {user.email}: {e}")
            
            logger.info(f"User registered: {user.email}")
            
            return Response({
                'message': 'Registration successful! Please check your email to verify your account.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Registration failed for {serializer.validated_data['email']}: {e}")
            return Response({
                'error': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user and return JWT tokens.
    """
    serializer = UserLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Check if user exists first
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Email address not found. Please check your email or register.',
                'field': 'email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        authenticated_user = authenticate(username=email, password=password)
        
        if authenticated_user:
            user_profile = get_user_by_django_id(user.id)
            
            # Check if email is verified
            is_verified = user_profile.get('is_verified', False) if user_profile else False
            
            if not is_verified:
                return Response({
                    'error': 'Email not verified. Please check your email and verify your account before logging in.',
                    'field': 'email',
                    'requires_verification': True
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user is active
            if not authenticated_user.is_active:
                return Response({
                    'error': 'Account is not active. Please verify your email to activate your account.',
                    'field': 'email',
                    'requires_verification': True
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Generate tokens
            refresh = RefreshToken.for_user(authenticated_user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Update last seen
            update_last_seen(authenticated_user.id)
            
            # Create response
            response = Response({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': authenticated_user.id,
                    'email': authenticated_user.email,
                    'name': authenticated_user.first_name,
                    'is_verified': is_verified
                }
            }, status=status.HTTP_200_OK)
            
            # Set refresh token as HttpOnly cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_NAME'],
                value=refresh_token,
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                httponly=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_HTTPONLY'],
                secure=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_SECURE'],
                samesite=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_SAMESITE'],
                path=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_PATH']
            )
            
            logger.info(f"User logged in: {authenticated_user.email}")
            return response
        else:
            return Response({
                'error': 'Incorrect password. Please try again.',
                'field': 'password'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user and blacklist refresh token.
    """
    try:
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_NAME'])
        
        if refresh_token:
            # Blacklist the token
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Create response
        response = Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
        # Clear refresh token cookie
        response.delete_cookie(
            key=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_NAME'],
            path=settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_PATH']
        )
        
        logger.info(f"User logged out: {request.user.email}")
        return response
        
    except TokenError:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail_view(request):
    """
    Get current user details.
    """
    try:
        user_profile = get_user_by_django_id(request.user.id)
        
        if not user_profile:
            return Response({
                'error': 'User profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Merge Django User and MongoDB profile data
        user_data = {
            'django_user_id': request.user.id,
            'email': request.user.email,
            'name': user_profile.get('name', request.user.first_name),
            'avatar_url': user_profile.get('avatar_url', ''),
            'is_verified': user_profile.get('is_verified', False),
            'profile_completed': user_profile.get('profile_completed', False),
            'roles': user_profile.get('roles', ['user']),
            'skills_teaching': user_profile.get('skills_teaching', []),
            'skills_learning': user_profile.get('skills_learning', []),
            'created_at': user_profile.get('created_at'),
            'last_seen': user_profile.get('last_seen')
        }
        
        serializer = UserSerializer(user_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to get user details for {request.user.email}: {e}")
        return Response({
            'error': 'Failed to retrieve user details'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_update_view(request):
    """
    Update user profile.
    """
    serializer = UserUpdateSerializer(data=request.data, partial=True)
    
    if serializer.is_valid():
        try:
            # Update MongoDB profile
            success = update_user_profile(request.user.id, **serializer.validated_data)
            
            if success:
                # Update Django User if name changed
                if 'name' in serializer.validated_data:
                    request.user.first_name = serializer.validated_data['name']
                    request.user.save()
                
                logger.info(f"User profile updated: {request.user.email}")
                return Response({
                    'message': 'Profile updated successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to update profile'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Failed to update profile for {request.user.email}: {e}")
            return Response({
                'error': 'Failed to update profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






@api_view(['POST'])
@permission_classes([IsAuthenticated])
def password_change_view(request):
    """
    Change password for authenticated user.
    """
    serializer = PasswordChangeSerializer(data=request.data)
    
    if serializer.is_valid():
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify old password
        if not request.user.check_password(old_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Update password
            request.user.set_password(new_password)
            request.user.save()
            
            logger.info(f"Password changed for user: {request.user.email}")
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to change password for {request.user.email}: {e}")
            return Response({
                'error': 'Failed to change password'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    """
    Send password reset email.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Create reset token
            reset_token = create_reset_token(user.id, user.email)
            send_password_reset_email(user.email, user.first_name, reset_token)
            
            logger.info(f"Password reset email sent to: {email}")
            
            return Response({
                'message': 'Password reset email sent'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            return Response({
                'error': 'Failed to send password reset email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    """
    Reset password with token.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if serializer.is_valid():
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Verify token
            token_doc = verify_token(token, 'password_reset')
            
            if token_doc:
                user_id = token_doc['user_id']
                
                # Update password
                user = User.objects.get(id=user_id)
                user.set_password(new_password)
                user.save()
                
                logger.info(f"Password reset for user: {user.email}")
                
                return Response({
                    'message': 'Password reset successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired reset token'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Password reset failed: {e}")
            return Response({
                'error': 'Password reset failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """
    Exchange refresh cookie for new access token.
    """
    try:
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_NAME'])
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create new access token
        token = RefreshToken(refresh_token)
        access_token = str(token.access_token)
        
        return Response({
            'access_token': access_token
        }, status=status.HTTP_200_OK)
        
    except TokenError:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def socket_token_view(request):
    """
    Exchange refresh cookie for socket access token.
    """
    try:
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_TOKEN_COOKIE_NAME'])
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create short-lived socket token
        token = RefreshToken(refresh_token)
        socket_token = str(token.access_token)
        
        return Response({
            'socket_token': socket_token
        }, status=status.HTTP_200_OK)
        
    except TokenError:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def partial_register_view(request):
    """
    Save partial user registration data (Step 1).
    """
    serializer = PartialRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Generate temporary user ID
            import uuid
            temp_user_id = str(uuid.uuid4())
            
            # Store partial data in MongoDB
            from api.db import save_partial_user_data
            success = save_partial_user_data(
                temp_user_id=temp_user_id,
                firstName=serializer.validated_data['firstName'],
                lastName=serializer.validated_data['lastName'],
                phoneNumber=serializer.validated_data['phoneNumber'],
                address=serializer.validated_data['address']
            )
            
            if success:
                logger.info(f"Partial registration saved: {temp_user_id}")
                return Response({
                    'message': 'Personal information saved successfully',
                    'tempUserId': temp_user_id
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Failed to save personal information'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Partial registration failed: {e}")
            return Response({
                'error': 'Failed to save personal information. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_register_view(request):
    """
    Complete user registration with credentials (Step 2).
    """
    serializer = CompleteRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            temp_user_id = serializer.validated_data['tempUserId']
            
            # Retrieve partial data from MongoDB
            from api.db import get_partial_user_data, delete_partial_user_data
            partial_data = get_partial_user_data(temp_user_id)
            
            if not partial_data:
                return Response({
                    'error': 'Invalid or expired registration session'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create Django User (inactive until email verified)
            full_name = f"{partial_data['firstName']} {partial_data['lastName']}"
            user = User.objects.create_user(
                username=serializer.validated_data['email'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=partial_data['firstName'],
                last_name=partial_data['lastName'],
                is_active=False  # Inactive until email verified
            )
            
            # Create MongoDB user profile
            mongo_user = create_user_profile(
                django_user_id=user.id,
                email=serializer.validated_data['email'],
                name=full_name,
                phoneNumber=partial_data['phoneNumber'],
                address=partial_data['address'],
                avatar_url='',
                is_verified=False  # Not verified until email verified
            )
            
            # Create verification token and send email
            verification_token = create_verification_token(user.id, user.email)
            send_verification_email(user.email, full_name, verification_token)
            
            # Auto-create empty profile with default values
            try:
                create_profile(
                    user_id=str(mongo_user['_id']),
                    name=full_name,
                    bio='',
                    avatar_url='',
                    skills_offered=['update'],
                    skills_wanted=['update'],
                    location={},
                    availability=[],
                    timezone='UTC',
                    rating=0.0
                )
                logger.info(f"Auto-created profile for user: {user.email}")
            except Exception as e:
                logger.warning(f"Could not auto-create profile for user {user.email}: {e}")
            
            # Clean up partial data
            delete_partial_user_data(temp_user_id)
            
            logger.info(f"User registration completed: {user.email}")
            
            return Response({
                'message': 'Registration successful! Please check your email to verify your account.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Complete registration failed: {e}")
            return Response({
                'error': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_strength_view(request):
    """
    Check password strength and return strength analysis.
    """
    serializer = PasswordStrengthSerializer(data=request.data)
    
    if serializer.is_valid():
        password = serializer.validated_data['password']
        
        # Calculate password strength
        strength_data = calculate_password_strength(password)
        
        # Add visual indicators for frontend
        strength_data['bar_color'] = get_strength_bar_color(strength_data['level'])
        strength_data['bar_width'] = get_strength_bar_width(strength_data['score'])
        
        logger.info(f"Password strength checked: {strength_data['level']} ({strength_data['score']}/100)")
        
        return Response(strength_data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_view(request):
    """
    Verify user email address with token.
    """
    serializer = EmailVerificationSerializer(data=request.data)
    
    if serializer.is_valid():
        token = serializer.validated_data['token']
        
        try:
            # Verify token
            token_doc = verify_token(token, 'email_verification')
            
            if token_doc:
                user_id = token_doc['user_id']
                
                # Activate Django User
                user = User.objects.get(id=user_id)
                user.is_active = True
                user.save()
                
                # Update MongoDB user profile
                update_user_profile(user_id, is_verified=True)
                
                logger.info(f"Email verified for user: {user.email}")
                
                return Response({
                    'message': 'Email verified successfully. You can now login.'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid or expired verification token'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Email verification failed: {e}")
            return Response({
                'error': 'Email verification failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_verification_view(request):
    """
    Resend verification email.
    """
    serializer = ResendVerificationSerializer(data=request.data)
    
    if serializer.is_valid():
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            user_profile = get_user_by_django_id(user.id)
            
            # Check if already verified
            if user_profile and user_profile.get('is_verified', False):
                return Response({
                    'message': 'Email is already verified'
                }, status=status.HTTP_200_OK)
            
            # Create new verification token
            verification_token = create_verification_token(user.id, user.email)
            
            # Get user name
            name = user_profile.get('name', user.first_name) if user_profile else user.first_name
            
            # Send verification email
            send_verification_email(user.email, name, verification_token)
            
            logger.info(f"Verification email resent to: {email}")
            
            return Response({
                'message': 'Verification email sent'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to resend verification email to {email}: {e}")
            return Response({
                'error': 'Failed to resend verification email'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
