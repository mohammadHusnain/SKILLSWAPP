"""
Email utilities for SkillSwap authentication.

This module handles sending verification and password reset emails.
"""

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)



PASSWORD_RESET_EMAIL_TEMPLATE = """
Password Reset Request

You requested a password reset for your SkillSwap account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
The SkillSwap Team

---
SkillSwap - Connect, Learn, Teach
"""


EMAIL_VERIFICATION_TEMPLATE = """
Welcome to SkillSwap!

Thank you for registering with SkillSwap. To complete your registration and activate your account, please verify your email address by clicking the link below:

{verification_url}

This link will expire in 24 hours.

If you didn't create an account with SkillSwap, please ignore this email.

Best regards,
The SkillSwap Team

---
SkillSwap - Connect, Learn, Teach
"""





def send_verification_email(email: str, name: str, verification_token: str) -> bool:
    """
    Send email verification email.
    
    Args:
        email: User email address
        name: User name
        verification_token: Email verification token
        
    Returns:
        True if email sent successfully
    """
    try:
        # Create verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        # Format email content
        subject = f"{settings.EMAIL_SUBJECT_PREFIX}Verify Your Email Address"
        message = EMAIL_VERIFICATION_TEMPLATE.format(verification_url=verification_url)
        
        # Send email with timeout
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        logger.info(f"Verification email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {e}")
        return False


def send_password_reset_email(email: str, name: str, reset_token: str) -> bool:
    """
    Send password reset email.
    
    Args:
        email: User email address
        name: User name
        reset_token: Password reset token
        
    Returns:
        True if email sent successfully
    """
    try:
        # Create reset URL
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        # Format email content
        subject = f"{settings.EMAIL_SUBJECT_PREFIX}Reset Your Password"
        message = PASSWORD_RESET_EMAIL_TEMPLATE.format(reset_url=reset_url)
        
        # Send email with timeout
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        return False


