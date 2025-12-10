"""
Contact form views for SkillSwap API.

This module handles contact form submissions and sends emails.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def contact_form_view(request):
    """
    Handle contact form submission and send email.
    """
    try:
        # Extract form data
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        message = request.data.get('message', '').strip()
        
        # Validate required fields
        if not name or not email or not message:
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        if '@' not in email or '.' not in email.split('@')[1]:
            return Response({
                'error': 'Please enter a valid email address'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare email content
        subject = f"New Contact Form Submission from {name}"
        email_body = f"""
New contact form submission received:

Name: {name}
Email: {email}
Message:
{message}

---
This message was sent from the SkillSwap contact form.
        """.strip()
        
        # Send email
        try:
            send_mail(
                subject=subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=['husnainbhinder682@gmail.com'],
                fail_silently=False,
            )
            
            logger.info(f"Contact form email sent successfully from {email}")
            
            return Response({
                'message': 'Message sent successfully! We\'ll get back to you soon.'
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            logger.error(f"Failed to send contact form email: {email_error}")
            return Response({
                'error': 'Failed to send message. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Contact form submission error: {e}")
        return Response({
            'error': 'An error occurred while processing your request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
