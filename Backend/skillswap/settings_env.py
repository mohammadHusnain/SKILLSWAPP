"""
Centralized environment configuration loader for SkillSwap backend.

This module provides a centralized way to load and validate environment variables
with fail-fast behavior and descriptive error messages.
"""

import os
from typing import Optional, Union
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class EnvironmentError(Exception):
    """Custom exception for environment configuration errors."""
    pass


def get_env(key: str, required: bool = True, default: Optional[str] = None) -> str:
    """
    Get environment variable with validation and fail-fast behavior.
    
    Args:
        key: Environment variable name
        required: Whether the variable is required (default: True)
        default: Default value if variable is not set and not required
        
    Returns:
        Environment variable value as string
        
    Raises:
        EnvironmentError: If required variable is missing or empty
    """
    value = os.getenv(key)
    
    # Check if value is missing or empty
    if not value:
        if required:
            raise EnvironmentError(
                f"Required environment variable '{key}' is not set or is empty. "
                f"Please check your .env file and ensure all required variables are configured."
            )
        else:
            return default or ""
    
    return value


def validate_required_env_vars() -> None:
    """
    Validate all required environment variables at module import.
    
    This function is called automatically when the module is imported to ensure
    all required configuration is present before Django starts.
    
    Raises:
        EnvironmentError: If any required variables are missing
    """
    required_vars = [
        'SECRET_KEY',
        'MONGODB_URI', 
        'JWT_SECRET',
    ]
    
    # Stripe keys and webhook secret are optional (only needed for payment features)
    
    missing_vars = []
    
    for var in required_vars:
        try:
            get_env(var, required=True)
        except EnvironmentError:
            missing_vars.append(var)
    
    if missing_vars:
        raise EnvironmentError(
            f"Missing required environment variables: {', '.join(missing_vars)}. "
            f"Please check your .env file and ensure all required variables are configured. "
            f"See env.example for reference."
        )


# Validate environment variables on import
validate_required_env_vars()


# Convenience functions for common environment variables
def get_secret_key() -> str:
    """Get Django SECRET_KEY."""
    return get_env('SECRET_KEY')


def get_mongodb_uri() -> str:
    """Get MongoDB connection URI."""
    return get_env('MONGODB_URI')


def get_jwt_secret() -> str:
    """Get JWT signing secret."""
    return get_env('JWT_SECRET')


def get_stripe_secret_key() -> str:
    """Get Stripe secret key (optional for development)."""
    return get_env('STRIPE_SECRET_KEY', required=False, default='sk_test_placeholder')


def get_stripe_publishable_key() -> str:
    """Get Stripe publishable key (optional for development)."""
    return get_env('STRIPE_PUBLISHABLE_KEY', required=False, default='pk_test_placeholder')


def get_stripe_webhook_secret() -> str:
    """Get Stripe webhook secret (optional)."""
    return get_env('STRIPE_WEBHOOK_SECRET', required=False, default='')


def get_stripe_price_id() -> str:
    """Get Stripe price ID (optional for development)."""
    return get_env('STRIPE_PRICE_ID', required=False, default='price_test_default')


def get_hf_token() -> str:
    """Get Hugging Face API token for ML model integration."""
    return get_env('HF_TOKEN')


def get_debug() -> bool:
    """Get DEBUG setting (optional, defaults to False)."""
    debug_value = get_env('DEBUG', required=False, default='False')
    return debug_value.lower() in ('true', '1', 'yes', 'on')


# Email configuration functions
def get_email_backend() -> str:
    """Get email backend setting (optional, defaults to console backend)."""
    return get_env('EMAIL_BACKEND', required=False, default='django.core.mail.backends.console.EmailBackend')


def get_email_host() -> str:
    """Get email host setting (optional)."""
    return get_env('EMAIL_HOST', required=False, default='')


def get_email_port() -> int:
    """Get email port setting (optional, defaults to 587)."""
    port_value = get_env('EMAIL_PORT', required=False, default='587')
    try:
        return int(port_value)
    except ValueError:
        return 587


def get_email_use_tls() -> bool:
    """Get EMAIL_USE_TLS setting (optional, defaults to True)."""
    tls_value = get_env('EMAIL_USE_TLS', required=False, default='True')
    return tls_value.lower() in ('true', '1', 'yes', 'on')


def get_email_host_user() -> str:
    """Get email host user setting (optional)."""
    return get_env('EMAIL_HOST_USER', required=False, default='')


def get_email_host_password() -> str:
    """Get email host password setting (optional)."""
    return get_env('EMAIL_HOST_PASSWORD', required=False, default='')


def get_default_from_email() -> str:
    """Get default from email setting (optional)."""
    return get_env('DEFAULT_FROM_EMAIL', required=False, default='SkillSwap <noreply@skillswap.com>')


def get_frontend_url() -> str:
    """Get frontend URL for email links (optional)."""
    return get_env('FRONTEND_URL', required=False, default='http://localhost:3000')