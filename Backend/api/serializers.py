"""
Serializers for SkillSwap authentication API.

This module contains all serializers for user registration, login,
profile management, and password operations.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from api.db import get_user_by_email, get_user_by_django_id


class PartialRegistrationSerializer(serializers.Serializer):
    """Serializer for partial user registration (Step 1)."""
    
    firstName = serializers.CharField(max_length=150)
    lastName = serializers.CharField(max_length=150)
    phoneNumber = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=500)


class CompleteRegistrationSerializer(serializers.Serializer):
    """Serializer for completing user registration (Step 2)."""
    
    tempUserId = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_password_confirm(self, value):
        """Validate password confirmation matches."""
        if self.initial_data.get('password') != value:
            raise serializers.ValidationError("Passwords do not match.")
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in value)
        has_number = any(c.isdigit() for c in value)
        
        if not (has_letter and has_number):
            raise serializers.ValidationError(
                "Password must contain at least one letter and one number."
            )
        
        return value


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration."""
    
    firstName = serializers.CharField(max_length=150)
    lastName = serializers.CharField(max_length=150)
    phoneNumber = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=500)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_password_confirm(self, value):
        """Validate password confirmation matches."""
        if self.initial_data.get('password') != value:
            raise serializers.ValidationError("Passwords do not match.")
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in value)
        has_number = any(c.isdigit() for c in value)
        
        if not (has_letter and has_number):
            raise serializers.ValidationError(
                "Password must contain at least one letter and one number."
            )
        
        return value
    
    def validate_firstName(self, value):
        """Validate first name."""
        if len(value) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long.")
        if not value.replace(' ', '').isalpha():
            raise serializers.ValidationError("First name can only contain letters.")
        return value
    
    def validate_lastName(self, value):
        """Validate last name."""
        if len(value) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long.")
        if not value.replace(' ', '').isalpha():
            raise serializers.ValidationError("Last name can only contain letters.")
        return value
    
    def validate_phoneNumber(self, value):
        """Validate phone number."""
        if not value.isdigit() or len(value) != 11:
            raise serializers.ValidationError("Phone number must be exactly 11 digits.")
        return value
    
    def validate_address(self, value):
        """Validate address."""
        if len(value) < 10:
            raise serializers.ValidationError("Address must be at least 10 characters long.")
        return value


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        """Normalize email."""
        return value.lower()


class UserSerializer(serializers.Serializer):
    """Serializer for user profile data."""
    
    id = serializers.IntegerField(source='django_user_id')
    email = serializers.EmailField()
    name = serializers.CharField()
    avatar_url = serializers.CharField(allow_blank=True)
    is_verified = serializers.BooleanField()
    profile_completed = serializers.BooleanField()
    roles = serializers.ListField(child=serializers.CharField())
    skills_teaching = serializers.ListField(child=serializers.CharField())
    skills_learning = serializers.ListField(child=serializers.CharField())
    created_at = serializers.DateTimeField()
    last_seen = serializers.DateTimeField()


class UserUpdateSerializer(serializers.Serializer):
    """Serializer for updating user profile."""
    
    name = serializers.CharField(max_length=150, required=False)
    avatar_url = serializers.URLField(required=False, allow_blank=True)
    skills_teaching = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False
    )
    skills_learning = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False
    )
    
    def validate_skills_teaching(self, value):
        """Validate skills teaching list."""
        if len(value) > 20:
            raise serializers.ValidationError("Cannot teach more than 20 skills.")
        return [skill.strip().lower() for skill in value if skill.strip()]
    
    def validate_skills_learning(self, value):
        """Validate skills learning list."""
        if len(value) > 20:
            raise serializers.ValidationError("Cannot learn more than 20 skills.")
        return [skill.strip().lower() for skill in value if skill.strip()]


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_new_password_confirm(self, value):
        """Validate new password confirmation."""
        if self.initial_data.get('new_password') != value:
            raise serializers.ValidationError("New passwords do not match.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in value)
        has_number = any(c.isdigit() for c in value)
        
        if not (has_letter and has_number):
            raise serializers.ValidationError(
                "Password must contain at least one letter and one number."
            )
        
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists."""
        email = value.lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return email


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_new_password_confirm(self, value):
        """Validate new password confirmation."""
        if self.initial_data.get('new_password') != value:
            raise serializers.ValidationError("New passwords do not match.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength."""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in value)
        has_number = any(c.isdigit() for c in value)
        
        if not (has_letter and has_number):
            raise serializers.ValidationError(
                "Password must contain at least one letter and one number."
            )
        
        return value


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    
    token = serializers.CharField()


class ResendVerificationSerializer(serializers.Serializer):
    """Serializer for resending verification email."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists."""
        email = value.lower()
        if not User.objects.filter(email=email).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return email




class PasswordStrengthSerializer(serializers.Serializer):
    """Serializer for password strength checking."""
    
    password = serializers.CharField()
    
    def validate_password(self, value):
        """Calculate password strength."""
        return value


# Profile Serializers
class ProfileCreateSerializer(serializers.Serializer):
    """Serializer for creating user profiles."""
    
    name = serializers.CharField(max_length=150)
    bio = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True)
    skills_offered = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=1,
        max_length=10
    )
    skills_wanted = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=1,
        max_length=10
    )
    location = serializers.DictField(required=False, allow_empty=True)
    availability = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    timezone = serializers.CharField(max_length=50, required=False, default='UTC')
    rating = serializers.FloatField(required=False, default=0.0, min_value=0.0, max_value=5.0)
    
    def validate_name(self, value):
        """Validate name field."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()
    
    def validate_skills_offered(self, value):
        """Validate skills offered list."""
        if not value:
            raise serializers.ValidationError("At least one skill offered is required.")
        
        # Clean and validate skills
        cleaned_skills = [skill.strip().lower() for skill in value if skill.strip()]
        if len(cleaned_skills) == 0:
            raise serializers.ValidationError("At least one valid skill offered is required.")
        
        if len(cleaned_skills) > 10:
            raise serializers.ValidationError("Cannot offer more than 10 skills.")
        
        return cleaned_skills
    
    def validate_skills_wanted(self, value):
        """Validate skills wanted list."""
        if not value:
            raise serializers.ValidationError("At least one skill wanted is required.")
        
        # Clean and validate skills
        cleaned_skills = [skill.strip().lower() for skill in value if skill.strip()]
        if len(cleaned_skills) == 0:
            raise serializers.ValidationError("At least one valid skill wanted is required.")
        
        if len(cleaned_skills) > 10:
            raise serializers.ValidationError("Cannot want more than 10 skills.")
        
        return cleaned_skills
    
    def validate_location(self, value):
        """Validate location object."""
        if not value:
            return {}
        
        required_fields = ['city', 'country']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Location {field} is required when location is provided.")
        
        return value
    
    def validate_availability(self, value):
        """Validate availability list."""
        if not value:
            return []
        
        valid_periods = ['weekdays', 'weekends', 'monday', 'tuesday', 'wednesday', 
                        'thursday', 'friday', 'saturday', 'sunday', 'morning', 
                        'afternoon', 'evening', 'night']
        
        cleaned_availability = []
        for period in value:
            period_lower = period.strip().lower()
            if period_lower in valid_periods:
                cleaned_availability.append(period_lower)
            else:
                raise serializers.ValidationError(f"Invalid availability period: {period}")
        
        return cleaned_availability
    
    def validate_timezone(self, value):
        """Validate timezone."""
        if not value:
            return 'UTC'
        
        # Basic timezone validation - could be enhanced with pytz
        valid_timezones = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
                          'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo']
        
        if value not in valid_timezones:
            # For now, accept any string as timezone
            pass
        
        return value


class ProfileUpdateSerializer(serializers.Serializer):
    """Serializer for updating user profiles."""
    
    name = serializers.CharField(max_length=150, required=False)
    bio = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    avatar_url = serializers.CharField(required=False, allow_blank=True)  # Changed to CharField to support base64
    resume_url = serializers.CharField(required=False, allow_blank=True)  # Support base64 or URL for resume
    skills_offered = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        min_length=1,
        max_length=10
    )
    skills_wanted = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        min_length=1,
        max_length=10
    )
    location = serializers.DictField(required=False, allow_empty=True)
    availability = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    timezone = serializers.CharField(max_length=50, required=False)
    rating = serializers.FloatField(required=False, min_value=0.0, max_value=5.0)
    
    def validate_name(self, value):
        """Validate name field."""
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip() if value else value
    
    def validate_skills_offered(self, value):
        """Validate skills offered list."""
        if value is None:
            return value
        
        # Allow empty array (partial update might not include this field)
        if not value:
            return value
        
        # Clean and validate skills
        cleaned_skills = [skill.strip().lower() for skill in value if skill.strip()]
        if len(cleaned_skills) == 0:
            return []
        
        if len(cleaned_skills) > 10:
            raise serializers.ValidationError("Cannot offer more than 10 skills.")
        
        return cleaned_skills
    
    def validate_skills_wanted(self, value):
        """Validate skills wanted list."""
        if value is None:
            return value
        
        # Allow empty array (partial update might not include this field)
        if not value:
            return value
        
        # Clean and validate skills
        cleaned_skills = [skill.strip().lower() for skill in value if skill.strip()]
        if len(cleaned_skills) == 0:
            return []
        
        if len(cleaned_skills) > 10:
            raise serializers.ValidationError("Cannot want more than 10 skills.")
        
        return cleaned_skills
    
    def validate_location(self, value):
        """Validate location object."""
        if not value:
            return {}
        
        required_fields = ['city', 'country']
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Location {field} is required when location is provided.")
        
        return value
    
    def validate_availability(self, value):
        """Validate availability list - more permissive to allow custom entries."""
        if not value:
            return []
        
        valid_periods = ['weekdays', 'weekends', 'monday', 'tuesday', 'wednesday', 
                        'thursday', 'friday', 'saturday', 'sunday', 'morning', 
                        'afternoon', 'evening', 'night']
        
        cleaned_availability = []
        for period in value:
            period_stripped = period.strip()
            period_lower = period_stripped.lower()
            
            # Check if period matches valid periods
            if period_lower in valid_periods:
                cleaned_availability.append(period_lower)
            else:
                # If it contains a dash (date format), extract just the time part
                if '-' in period_stripped:
                    # Split by dash and check each part
                    parts = period_stripped.split('-')
                    for part in parts:
                        part_lower = part.strip().lower()
                        if part_lower in valid_periods:
                            if part_lower not in cleaned_availability:
                                cleaned_availability.append(part_lower)
                else:
                    # For partial matches (e.g., "Morning" should match "morning")
                    matched = False
                    for valid in valid_periods:
                        if valid in period_lower or period_lower in valid:
                            cleaned_availability.append(valid)
                            matched = True
                            break
                    
                    # If no match found, allow it anyway for flexibility (user can enter custom text)
                    if not matched:
                        cleaned_availability.append(period_lower)
        
        return cleaned_availability
    
    def validate_avatar_url(self, value):
        """Validate avatar_url - accept any value or empty string."""
        # Allow empty strings or any value - no validation
        return value
    
    def validate_resume_url(self, value):
        """Validate resume_url - accept any value or empty string."""
        # Allow empty strings or any value - no validation
        return value


class ProfileSerializer(serializers.Serializer):
    """Serializer for reading/displaying profile data."""
    
    id = serializers.CharField(source='_id')
    user_id = serializers.CharField()
    name = serializers.CharField()
    bio = serializers.CharField()
    avatar_url = serializers.CharField()
    resume_url = serializers.CharField()
    skills_offered = serializers.ListField(child=serializers.CharField())
    skills_wanted = serializers.ListField(child=serializers.CharField())
    location = serializers.DictField()
    availability = serializers.ListField(child=serializers.CharField())
    timezone = serializers.CharField()
    rating = serializers.FloatField()
    total_matches = serializers.IntegerField()
    total_teaching_sessions = serializers.IntegerField()
    total_learning_sessions = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


# Match Serializers
class ExpressInterestSerializer(serializers.Serializer):
    """Serializer for expressing interest in a match."""
    
    matched_user_id = serializers.CharField()


class RespondInterestSerializer(serializers.Serializer):
    """Serializer for responding to an interest request."""
    
    requester_user_id = serializers.CharField()
    accept = serializers.BooleanField()


# Session Serializers
class CreateSessionSerializer(serializers.Serializer):
    """Serializer for creating a new session."""
    
    teacher_id = serializers.CharField(required=False)  # Optional, will use current user if not provided
    learner_id = serializers.CharField()
    skill_taught = serializers.CharField(max_length=200)
    skill_learned = serializers.CharField(max_length=200)
    scheduled_date = serializers.CharField()  # YYYY-MM-DD format
    scheduled_time = serializers.CharField()  # HH:MM format
    duration_minutes = serializers.IntegerField(min_value=15, max_value=480, default=60)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_scheduled_date(self, value):
        """Validate date format and ensure it's not in the past."""
        from datetime import datetime
        try:
            parsed_date = datetime.strptime(value, '%Y-%m-%d').date()
            if parsed_date < datetime.now().date():
                raise serializers.ValidationError("Scheduled date cannot be in the past.")
            return value
        except ValueError:
            raise serializers.ValidationError("Date must be in YYYY-MM-DD format.")
    
    def validate_scheduled_time(self, value):
        """Validate time format."""
        try:
            time_parts = value.split(':')
            if len(time_parts) != 2:
                raise ValueError("Invalid format")
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            if hour < 0 or hour > 23 or minute < 0 or minute > 59:
                raise ValueError("Invalid values")
            return value
        except (ValueError, IndexError):
            raise serializers.ValidationError("Time must be in HH:MM format (24-hour).")


class UpdateSessionSerializer(serializers.Serializer):
    """Serializer for updating a session."""
    
    skill_taught = serializers.CharField(max_length=200, required=False)
    skill_learned = serializers.CharField(max_length=200, required=False)
    scheduled_date = serializers.CharField(required=False)  # YYYY-MM-DD format
    scheduled_time = serializers.CharField(required=False)  # HH:MM format
    duration_minutes = serializers.IntegerField(min_value=15, max_value=480, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=['pending', 'accepted', 'completed', 'cancelled'],
        required=False
    )
    
    def validate_scheduled_date(self, value):
        """Validate date format and ensure it's not in the past."""
        from datetime import datetime
        try:
            parsed_date = datetime.strptime(value, '%Y-%m-%d').date()
            if parsed_date < datetime.now().date():
                raise serializers.ValidationError("Scheduled date cannot be in the past.")
            return value
        except ValueError:
            raise serializers.ValidationError("Date must be in YYYY-MM-DD format.")
    
    def validate_scheduled_time(self, value):
        """Validate time format."""
        try:
            time_parts = value.split(':')
            if len(time_parts) != 2:
                raise ValueError("Invalid format")
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            if hour < 0 or hour > 23 or minute < 0 or minute > 59:
                raise ValueError("Invalid values")
            return value
        except (ValueError, IndexError):
            raise serializers.ValidationError("Time must be in HH:MM format (24-hour).")