"""
Password strength calculation utilities for SkillSwap.

This module provides password strength calculation and validation functions
for real-time password strength checking and validation.
"""

import re
from typing import Dict, List, Tuple


def calculate_password_strength(password: str) -> Dict[str, any]:
    """
    Calculate password strength and return detailed analysis.
    
    Args:
        password: The password to analyze
        
    Returns:
        Dictionary containing:
        - score: Integer from 0-100
        - level: String ('very_weak', 'weak', 'fair', 'good', 'strong')
        - feedback: List of feedback messages
        - requirements: Dictionary of requirement checks
    """
    if not password:
        return {
            'score': 0,
            'level': 'very_weak',
            'feedback': ['Password is required'],
            'requirements': {
                'length': False,
                'has_letter': False,
                'has_number': False,
                'has_special': False,
                'has_uppercase': False,
                'has_lowercase': False
            }
        }
    
    # Initialize requirements
    requirements = {
        'length': len(password) >= 8,
        'has_letter': bool(re.search(r'[a-zA-Z]', password)),
        'has_number': bool(re.search(r'[0-9]', password)),
        'has_special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
        'has_uppercase': bool(re.search(r'[A-Z]', password)),
        'has_lowercase': bool(re.search(r'[a-z]', password))
    }
    
    # Calculate score
    score = 0
    feedback = []
    
    # Length scoring
    if len(password) >= 8:
        score += 20
    elif len(password) >= 6:
        score += 10
    else:
        feedback.append('Password should be at least 8 characters long')
    
    # Character variety scoring
    if requirements['has_letter']:
        score += 15
    else:
        feedback.append('Password should contain at least one letter')
    
    if requirements['has_number']:
        score += 15
    else:
        feedback.append('Password should contain at least one number')
    
    if requirements['has_special']:
        score += 20
    else:
        feedback.append('Password should contain at least one special character')
    
    if requirements['has_uppercase']:
        score += 10
    else:
        feedback.append('Password should contain at least one uppercase letter')
    
    if requirements['has_lowercase']:
        score += 10
    else:
        feedback.append('Password should contain at least one lowercase letter')
    
    # Bonus for length
    if len(password) >= 12:
        score += 10
    
    # Bonus for complexity
    unique_chars = len(set(password))
    if unique_chars >= len(password) * 0.7:
        score += 10
    
    # Cap score at 100
    score = min(score, 100)
    
    # Determine level
    if score >= 80:
        level = 'strong'
    elif score >= 60:
        level = 'good'
    elif score >= 40:
        level = 'fair'
    elif score >= 20:
        level = 'weak'
    else:
        level = 'very_weak'
    
    # Add positive feedback for strong passwords
    if score >= 80:
        feedback.append('Excellent password strength!')
    elif score >= 60:
        feedback.append('Good password strength')
    elif score >= 40:
        feedback.append('Fair password strength')
    
    return {
        'score': score,
        'level': level,
        'feedback': feedback,
        'requirements': requirements
    }


def get_strength_bar_color(level: str) -> str:
    """
    Get color for strength bar based on password level.
    
    Args:
        level: Password strength level
        
    Returns:
        Color string (CSS color)
    """
    colors = {
        'very_weak': '#dc3545',  # Red
        'weak': '#fd7e14',       # Orange
        'fair': '#ffc107',       # Yellow
        'good': '#20c997',       # Teal
        'strong': '#28a745'      # Green
    }
    return colors.get(level, '#6c757d')  # Default gray


def get_strength_bar_width(score: int) -> int:
    """
    Get width percentage for strength bar.
    
    Args:
        score: Password strength score (0-100)
        
    Returns:
        Width percentage (0-100)
    """
    return max(0, min(100, score))


def validate_password_requirements(password: str) -> Tuple[bool, List[str]]:
    """
    Validate password against minimum requirements.
    
    Args:
        password: The password to validate
        
    Returns:
        Tuple of (is_valid, error_messages)
    """
    errors = []
    
    if len(password) < 8:
        errors.append('Password must be at least 8 characters long')
    
    if not re.search(r'[a-zA-Z]', password):
        errors.append('Password must contain at least one letter')
    
    if not re.search(r'[0-9]', password):
        errors.append('Password must contain at least one number')
    
    return len(errors) == 0, errors
