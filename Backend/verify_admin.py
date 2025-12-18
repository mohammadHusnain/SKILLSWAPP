
import os
import django
import sys
import json
from rest_framework.test import APIClient
from django.contrib.auth.models import User

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillswap.settings')
django.setup()

def run_tests():
    print("Starting verification...")
    client = APIClient()
    
    # 1. Admin Login
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@skillswap.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'AdminSecret123!')
    
    print(f"\n1. Testing Admin Login ({admin_email})...")
    response = client.post('/api/admin/auth/login/', {
        'email': admin_email,
        'password': admin_password
    }, format='json')
    
    if response.status_code == 200:
        print("✅ Admin login successful")
        token = response.data['access_token']
        client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
    else:
        print(f"❌ Admin login failed: {response.status_code} - {response.data}")
        return

    # 2. View All Users
    print("\n2. Testing View All Users...")
    response = client.get('/api/admin/users/')
    if response.status_code == 200:
        print(f"✅ Users fetched successfully. Count: {response.data['total']}")
    else:
        print(f"❌ Failed to fetch users: {response.status_code}")

    # 3. View Matches
    print("\n3. Testing View Matches...")
    response = client.get('/api/admin/matches/')
    if response.status_code == 200:
        print(f"✅ Matches fetched successfully. Count: {len(response.data['matches'])}")
    else:
        print(f"❌ Failed to fetch matches: {response.status_code}")

    # 4. View Sessions
    print("\n4. Testing View Sessions...")
    response = client.get('/api/admin/sessions/')
    if response.status_code == 200:
        print(f"✅ Sessions fetched successfully. Count: {len(response.data['sessions'])}")
    else:
        print(f"❌ Failed to fetch sessions: {response.status_code}")
        
    # 5. Test Normal User Access (Should Fail)
    print("\n5. Testing Normal User Access Forbidden...")
    
    # Create temp user
    temp_user_email = "verify_test_user@example.com"
    if not User.objects.filter(email=temp_user_email).exists():
        user = User.objects.create_user(username=temp_user_email, email=temp_user_email, password="password123")
    else:
        user = User.objects.get(email=temp_user_email)
    
    # Login as normal user to get token
    user_client = APIClient()
    # Mocking normal login flow or just manually creating token for quick test
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    user_token = str(refresh.access_token)
    user_client.credentials(HTTP_AUTHORIZATION='Bearer ' + user_token)
    
    # Try to access admin endpoint
    response = user_client.get('/api/admin/users/')
    if response.status_code == 403:
        print("✅ Normal user denied access (403 Forbidden)")
    else:
        print(f"❌ Access control failure! Status: {response.status_code}")

    print("\nVerification Complete!")

if __name__ == "__main__":
    run_tests()
