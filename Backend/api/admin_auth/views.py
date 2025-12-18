from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.conf import settings
from .serializers import AdminLoginSerializer
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_view(request):
    """
    Admin Login API.
    Validates strictly for superuser status.
    Returns JWT with custom admin claims.
    """
    serializer = AdminLoginSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Double check checks (redundant but safe)
        if not (user.is_superuser and user.is_staff):
             return Response({
                'error': 'Unauthorized access'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Generate Token with Custom Claims
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims
            refresh['is_admin'] = True
            refresh['role'] = 'ADMIN'
            
            # Access token automatically gets these claims when created from refresh
            access_token = str(refresh.access_token)
            
            logger.info(f"Admin logged in: {user.email}")
            
            return Response({
                'message': 'Admin login successful',
                'access_token': access_token,
                'refresh_token': str(refresh),
                'admin': {
                    'id': user.id,
                    'email': user.email,
                    'is_superuser': user.is_superuser
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Admin login failed for {user.email}: {e}")
            return Response({
                'error': 'Login failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
