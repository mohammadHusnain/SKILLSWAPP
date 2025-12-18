from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from api.admin_auth.permissions import IsAdminUser
from .services import (
    get_all_users_service, 
    get_user_details_service, 
    delete_user_service,
    get_all_matches_service,
    update_user_service
)
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_list_view(request):
    """
    Get all users (paginated, filtered).
    """
    try:
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        status_filter = request.query_params.get('status')
        
        filters = {}
        if status_filter:
            filters['status'] = status_filter
            
        data = get_all_users_service(page, page_size, filters)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Admin user list error: {e}")
        return Response({'error': 'Failed to fetch users'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'DELETE', 'PATCH'])
@permission_classes([IsAdminUser])
def admin_user_detail_view(request, user_id):
    """
    Get user details, delete user, or update user.
    """
    if request.method == 'GET':
        data = get_user_details_service(user_id)
        if not data:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(data, status=status.HTTP_200_OK)
        
    elif request.method == 'DELETE':
        success, message = delete_user_service(user_id)
        if success:
            logger.info(f"User {user_id} deleted by admin {request.user.email}")
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
            
    elif request.method == 'PATCH':
        success, message = update_user_service(user_id, request.data)
        if success:
            return Response({'message': message}, status=status.HTTP_200_OK)
        else:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_match_list_view(request):
    """
    Get all matches with pagination.
    Query params: page, page_size
    """
    try:
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        data = get_all_matches_service(page, page_size)
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Admin match list error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
