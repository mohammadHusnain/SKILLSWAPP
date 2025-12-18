from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_token_refresh_view(request):
    """
    Refresh admin access token using refresh token.
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response({
            'error': 'Refresh token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Validate and decode the refresh token
        refresh = RefreshToken(refresh_token)
        
        # Check if this is an admin token
        if not refresh.get('is_admin') or refresh.get('role') != 'ADMIN':
            return Response({
                'error': 'Invalid admin token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate new access token
        access_token = str(refresh.access_token)
        
        logger.info(f"Admin token refreshed for user: {refresh.get('user_id')}")
        
        return Response({
            'access_token': access_token,
            'access': access_token,  # Support both formats
        }, status=status.HTTP_200_OK)
        
    except TokenError as e:
        logger.error(f"Admin token refresh failed: {e}")
        return Response({
            'error': 'Invalid or expired refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Admin token refresh error: {e}")
        return Response({
            'error': 'Token refresh failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
