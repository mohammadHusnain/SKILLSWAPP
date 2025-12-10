#!/usr/bin/env python3
"""
Test script for Profile API endpoints.

This script tests the profile creation, retrieval, update, and deletion functionality.
"""

import requests
import json
import sys
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api"

def test_profile_endpoints():
    """Test all profile endpoints."""
    
    print("🧪 Testing Profile API Endpoints")
    print("=" * 50)
    
    # Test data
    test_profile_data = {
        "name": "John Doe",
        "bio": "Experienced software developer passionate about teaching and learning.",
        "avatar_url": "https://example.com/avatar.jpg",
        "skills_offered": ["python", "javascript", "react", "django"],
        "skills_wanted": ["machine learning", "docker", "kubernetes"],
        "location": {
            "city": "New York",
            "country": "USA",
            "lat": 40.7128,
            "lng": -74.0060
        },
        "availability": ["weekdays", "evening"],
        "timezone": "America/New_York",
        "rating": 4.5
    }
    
    # Headers for authenticated requests (you'll need to get a token first)
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN_HERE"  # Replace with actual token
    }
    
    print("📋 Test Profile Data:")
    print(json.dumps(test_profile_data, indent=2))
    print()
    
    # Test 1: Create Profile (POST /api/profile/)
    print("1️⃣ Testing Profile Creation...")
    try:
        response = requests.post(
            f"{BASE_URL}/profile/",
            json=test_profile_data,
            headers=headers
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 201:
            print("   ✅ Profile created successfully!")
            profile_data = response.json()
            print(f"   Profile ID: {profile_data.get('id')}")
        else:
            print(f"   ❌ Profile creation failed: {response.text}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection failed - make sure Django server is running")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 2: Get Profile (GET /api/profile/)
    print("2️⃣ Testing Profile Retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/profile/", headers=headers)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Profile retrieved successfully!")
            profile_data = response.json()
            print(f"   Name: {profile_data.get('name')}")
            print(f"   Skills Offered: {profile_data.get('skills_offered')}")
        else:
            print(f"   ❌ Profile retrieval failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 3: Update Profile (PUT /api/profile/update/)
    print("3️⃣ Testing Profile Update...")
    update_data = {
        "bio": "Updated bio with more experience",
        "skills_offered": ["python", "javascript", "react", "django", "fastapi"],
        "rating": 4.8
    }
    try:
        response = requests.put(
            f"{BASE_URL}/profile/update/",
            json=update_data,
            headers=headers
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Profile updated successfully!")
            profile_data = response.json()
            print(f"   Updated Bio: {profile_data.get('bio')}")
            print(f"   Updated Rating: {profile_data.get('rating')}")
        else:
            print(f"   ❌ Profile update failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 4: Search Profiles (GET /api/profile/search/)
    print("4️⃣ Testing Profile Search...")
    try:
        response = requests.get(
            f"{BASE_URL}/profile/search/?skills=python,javascript&limit=5",
            headers=headers
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Profile search successful!")
            search_data = response.json()
            print(f"   Found {search_data.get('count')} profiles")
            print(f"   Skills searched: {search_data.get('skills_searched')}")
        else:
            print(f"   ❌ Profile search failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 5: Search by Location (GET /api/profile/search/location/)
    print("5️⃣ Testing Location-based Search...")
    try:
        response = requests.get(
            f"{BASE_URL}/profile/search/location/?lat=40.7128&lng=-74.0060&max_distance=100",
            headers=headers
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Location search successful!")
            search_data = response.json()
            print(f"   Found {search_data.get('count')} profiles near location")
        else:
            print(f"   ❌ Location search failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 6: Validation Errors
    print("6️⃣ Testing Validation Errors...")
    invalid_data = {
        "name": "A",  # Too short
        "skills_offered": [],  # Empty
        "skills_wanted": ["skill1"] * 15,  # Too many
        "location": {
            "city": "Test",
            "country": "Test",
            "lat": 200,  # Invalid latitude
            "lng": -200   # Invalid longitude
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/profile/",
            json=invalid_data,
            headers=headers
        )
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 400:
            print("   ✅ Validation errors caught successfully!")
            errors = response.json()
            print(f"   Validation errors: {json.dumps(errors, indent=2)}")
        else:
            print(f"   ❌ Validation should have failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    print("🎉 Profile API Testing Complete!")
    print("=" * 50)
    print()
    print("📝 Notes:")
    print("- Make sure Django server is running on localhost:8000")
    print("- Replace 'YOUR_TOKEN_HERE' with a valid JWT token")
    print("- You can get a token by registering/logging in via /api/auth/")
    print("- Check MongoDB Compass to verify documents and indexes")


if __name__ == "__main__":
    test_profile_endpoints()
