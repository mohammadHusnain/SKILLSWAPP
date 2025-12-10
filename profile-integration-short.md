<<<<<<< HEAD
# Profile Management System

## Overview
Complete profile CRUD with MongoDB persistence, avatar/resume uploads, and real-time updates.

## API Endpoints

**GET `/api/profile/`** - Get current user's profile  
**PUT `/api/profile/update/`** - Update profile (supports partial updates)  
**POST `/api/profile/`** - Create new profile (auto-created on registration)  
**DELETE `/api/profile/delete/`** - Delete profile  
**GET `/api/profile/<user_id>/`** - Get specific user's profile  
**GET `/api/profile/search/?skills=python,javascript&limit=20`** - Search by skills

## Key Features
- Auto-created on registration with user's name and defaults
- Avatar upload: any image format, 5MB max, base64 encoded
- Resume upload: PDF/DOC/DOCX, 10MB max, base64 encoded
- Real-time MongoDB sync: all changes save immediately
- Flexible validation: accepts any uploads, empty arrays allowed
- Stats tracking: total_matches, total_teaching_sessions, total_learning_sessions

## Implementation Status
✅ All bugs fixed (request wrapping, 404 errors, validation)  
✅ Resume field added to schema and serializers  
✅ Profile API service with getProfile, updateProfile, searchProfiles  
✅ Complete frontend with avatar/resume upload UI  
✅ All data persists to MongoDB

=======
# Profile Management System

## Overview
Complete profile CRUD with MongoDB persistence, avatar/resume uploads, and real-time updates.

## API Endpoints

**GET `/api/profile/`** - Get current user's profile  
**PUT `/api/profile/update/`** - Update profile (supports partial updates)  
**POST `/api/profile/`** - Create new profile (auto-created on registration)  
**DELETE `/api/profile/delete/`** - Delete profile  
**GET `/api/profile/<user_id>/`** - Get specific user's profile  
**GET `/api/profile/search/?skills=python,javascript&limit=20`** - Search by skills

## Key Features
- Auto-created on registration with user's name and defaults
- Avatar upload: any image format, 5MB max, base64 encoded
- Resume upload: PDF/DOC/DOCX, 10MB max, base64 encoded
- Real-time MongoDB sync: all changes save immediately
- Flexible validation: accepts any uploads, empty arrays allowed
- Stats tracking: total_matches, total_teaching_sessions, total_learning_sessions

## Implementation Status
✅ All bugs fixed (request wrapping, 404 errors, validation)  
✅ Resume field added to schema and serializers  
✅ Profile API service with getProfile, updateProfile, searchProfiles  
✅ Complete frontend with avatar/resume upload UI  
✅ All data persists to MongoDB

>>>>>>> c1d12894fcd46bb09e5ff2c906f091ee1d1b5f64
