from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access the view.
    Checks for:
    1. Authentication
    2. is_superuser = True
    3. is_staff = True
    4. Token has 'is_admin': True claim
    5. Token has 'role': 'ADMIN' claim
    """

    def has_permission(self, request, view):
        # 1. Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # 2. & 3. Check Django user flags
        if not (request.user.is_superuser and request.user.is_staff):
            return False

        # 4. & 5. Check Token claims
        # Note: request.auth is the validated token object in SimpleJWT
        try:
            token = request.auth
            if not token:
                return False
            
            # Verify admin claims
            is_admin = token.get('is_admin', False)
            role = token.get('role', '')

            if not is_admin or role != 'ADMIN':
                return False
            
            return True

        except Exception:
            return False
