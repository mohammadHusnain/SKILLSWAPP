"""
Payment views for SkillSwap API.

This module contains all views for Stripe payment processing including
subscription management and tip/donation handling.
"""

import stripe
import logging
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth.models import User
from bson import ObjectId
from bson.errors import InvalidId

from api.db import (
    get_user_by_django_id, get_subscription_by_user, create_subscription,
    get_subscription_by_stripe_id, update_subscription_status,
    create_payment_transaction, update_payment_transaction_status,
    get_user_payment_history, get_user_tips_received, get_user_tips_given
)

logger = logging.getLogger(__name__)

# Set Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY


# Helper function to get MongoDB user ID from Django user
def get_mongo_user_id(django_user):
    """Get MongoDB user ID from Django user."""
    mongo_user = get_user_by_django_id(django_user.id)
    if not mongo_user:
        return None
    return str(mongo_user['_id'])


# Subscription Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_premium_payment_checkout_view(request):
    """
    Create Stripe Checkout session for one-time premium payment.
    
    POST /api/payments/premium/create-checkout/
    Body: {
        "success_url": "https://example.com/success",
        "cancel_url": "https://example.com/cancel"
    }
    """
    try:
        logger.info(f"Starting premium payment checkout creation for user: {request.user.email}")
        
        # Get Django user and MongoDB user
        django_user = request.user
        mongo_user = get_user_by_django_id(django_user.id)
        
        if not mongo_user:
            logger.error(f"MongoDB user not found for Django user ID: {django_user.id}")
            return Response(
                {'error': 'User not found in MongoDB', 'message': 'Please ensure your profile is properly set up'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        mongo_user_id = str(mongo_user['_id'])
        logger.info(f"Found MongoDB user: {mongo_user_id}")
        
        # Check if user already has premium access (check for successful premium payment)
        from api.db import get_payments_collection
        from bson import ObjectId
        
        payments = get_payments_collection()
        existing_premium = payments.find_one({
            'from_user_id': ObjectId(mongo_user_id),
            'transaction_type': 'premium',
            'status': 'completed'
        })
        
        if existing_premium:
            logger.warning(f"User {mongo_user_id} already has premium access")
            return Response(
                {'error': 'User already has premium access'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get URLs from request
        success_url = request.data.get('success_url', f'{settings.FRONTEND_URL}/dashboard/payments/success')
        cancel_url = request.data.get('cancel_url', f'{settings.FRONTEND_URL}/dashboard/payments/cancel')
        logger.info(f"Checkout URLs - Success: {success_url}, Cancel: {cancel_url}")
        
        # Get customer email
        customer_email = mongo_user.get('email')
        if not customer_email:
            logger.error(f"No email found for MongoDB user: {mongo_user_id}")
            return Response(
                {'error': 'User email not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create Stripe customer
        logger.info(f"Looking for existing Stripe customer with email: {customer_email}")
        customers = stripe.Customer.list(email=customer_email, limit=1)
        if customers.data:
            stripe_customer_id = customers.data[0].id
            logger.info(f"Found existing Stripe customer: {stripe_customer_id}")
        else:
            # Create new Stripe customer
            logger.info(f"Creating new Stripe customer for email: {customer_email}")
            customer = stripe.Customer.create(
                email=customer_email,
                name=mongo_user.get('name', ''),
                metadata={'user_id': str(mongo_user_id)}
            )
            stripe_customer_id = customer.id
            logger.info(f"Created Stripe customer: {stripe_customer_id}")
        
        # Premium payment amount: $9.99 (999 cents)
        amount = 999  # in cents
        currency = 'usd'
        
        # Create Stripe Checkout session in payment mode (one-time payment)
        logger.info(f"Creating Stripe checkout session for premium payment: ${amount/100}")
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            mode='payment',  # One-time payment mode instead of subscription
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'product_data': {
                        'name': 'Premium Plan - SkillSwap',
                        'description': 'Unlimited matches, priority recommendations, and premium features'
                    },
                    'unit_amount': amount,  # $9.99 in cents
                },
                'quantity': 1,
            }],
            success_url=success_url + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=cancel_url,
            metadata={
                'user_id': str(mongo_user_id),
                'type': 'premium',
                'amount': str(amount / 100)  # Store as dollars
            }
        )
        
        # Create pending payment transaction in MongoDB
        create_payment_transaction(
            transaction_type='premium',
            from_user_id=mongo_user_id,
            amount=amount / 100,  # Convert cents to dollars
            stripe_session_id=checkout_session.id,
            metadata={'checkout_type': 'premium_upgrade'},
            status='pending'
        )
        
        logger.info(f"Created premium payment checkout session for user {mongo_user_id}: {checkout_session.id}")
        
        return Response({
            'session_id': checkout_session.id,
            'url': checkout_session.url
        }, status=status.HTTP_200_OK)
        
    except stripe.StripeError as e:
        logger.error(f"Stripe error creating premium payment checkout: {str(e)}")
        logger.error(f"Stripe error type: {type(e).__name__}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {'error': f'Stripe error: {str(e)}', 'message': 'Please check your Stripe configuration'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error creating premium payment checkout: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {'error': 'Failed to create checkout session', 'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscription_status_view(request):
    """
    Get current user's premium status (one-time payment).
    
    GET /api/payments/subscription/status/
    """
    try:
        django_user = request.user
        mongo_user_id = get_mongo_user_id(django_user)
        
        if not mongo_user_id:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check for completed premium payment
        from api.db import get_payments_collection
        from bson import ObjectId
        
        payments = get_payments_collection()
        premium_payment = payments.find_one({
            'from_user_id': ObjectId(mongo_user_id),
            'transaction_type': 'premium',
            'status': 'completed'
        })
        
        if not premium_payment:
            return Response({
                'is_premium': False,
                'status': 'none',
                'subscription': None
            }, status=status.HTTP_200_OK)
        
        # User has premium access via one-time payment
        return Response({
            'is_premium': True,
            'status': 'active',
            'subscription': {
                'plan_type': 'premium',
                'current_period_end': None,  # One-time payment, no expiration
                'current_period_start': premium_payment.get('completed_at').isoformat() if premium_payment.get('completed_at') else None,
                'cancel_at_period_end': False
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting premium status: {e}")
        return Response(
            {'error': 'Failed to get premium status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription_view(request):
    """
    Cancel subscription at period end.
    
    POST /api/payments/subscription/cancel/
    Body: {
        "cancel_immediately": false  # Optional, defaults to false
    }
    """
    try:
        django_user = request.user
        mongo_user_id = get_mongo_user_id(django_user)
        
        if not mongo_user_id:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        subscription = get_subscription_by_user(mongo_user_id)
        
        if not subscription:
            return Response(
                {'error': 'No active subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cancel_immediately = request.data.get('cancel_immediately', False)
        stripe_subscription_id = subscription.get('stripe_subscription_id')
        
        if cancel_immediately:
            # Cancel immediately via Stripe API
            try:
                stripe.Subscription.delete(stripe_subscription_id)
                update_subscription_status(stripe_subscription_id, 'canceled')
            except Exception as e:
                logger.error(f"Error canceling subscription immediately: {e}")
                return Response(
                    {'error': 'Failed to cancel subscription'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Cancel at period end via Stripe API
            try:
                stripe.Subscription.modify(
                    stripe_subscription_id,
                    cancel_at_period_end=True
                )
                update_subscription_status(stripe_subscription_id, 'active', cancel_at_period_end=True)
            except Exception as e:
                logger.error(f"Error canceling subscription at period end: {e}")
                return Response(
                    {'error': 'Failed to cancel subscription'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        logger.info(f"Canceled subscription for user {mongo_user_id}")
        
        return Response({
            'message': 'Subscription will be cancelled at the end of the billing period' if not cancel_immediately else 'Subscription cancelled immediately'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        return Response(
            {'error': 'Failed to cancel subscription'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_customer_portal_view(request):
    """
    Generate Stripe Customer Portal link.
    
    POST /api/payments/subscription/portal/
    Body: {
        "return_url": "https://example.com/subscription"
    }
    """
    try:
        django_user = request.user
        mongo_user_id = get_mongo_user_id(django_user)
        
        if not mongo_user_id:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        subscription = get_subscription_by_user(mongo_user_id)
        
        if not subscription:
            return Response(
                {'error': 'No subscription found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return_url = request.data.get('return_url', f'{settings.FRONTEND_URL}/dashboard/subscription')
        
        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.get('stripe_customer_id'),
            return_url=return_url
        )
        
        logger.info(f"Created customer portal session for user {mongo_user_id}")
        
        return Response({
            'url': portal_session.url
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error creating customer portal session: {e}")
        return Response(
            {'error': 'Failed to create portal session'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Tip/Donation Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tip_checkout_view(request):
    """
    Create Stripe Checkout session for tip/donation.
    
    POST /api/payments/tip/create/
    Body: {
        "to_user_id": "user_id",
        "amount": 10.00,
        "message": "Thank you for the great session!",
        "success_url": "https://example.com/success",
        "cancel_url": "https://example.com/cancel"
    }
    """
    try:
        django_user = request.user
        mongo_user_id = get_mongo_user_id(django_user)
        
        if not mongo_user_id:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        to_user_id = request.data.get('to_user_id')
        amount = float(request.data.get('amount', 0))
        message = request.data.get('message', '')
        
        # Validate tip amount (min $1, max $1000)
        if amount < 1.0 or amount > 1000.0:
            return Response(
                {'error': 'Tip amount must be between $1 and $1000'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate to_user_id
        try:
            ObjectId(to_user_id)
        except (InvalidId, TypeError):
            return Response(
                {'error': 'Invalid user ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get recipient user info
        from api.db import get_profile_by_user_id
        recipient_profile = get_profile_by_user_id(to_user_id)
        
        if not recipient_profile:
            return Response(
                {'error': 'Recipient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        success_url = request.data.get('success_url', f'{settings.FRONTEND_URL}/dashboard/payments/success')
        cancel_url = request.data.get('cancel_url', f'{settings.FRONTEND_URL}/dashboard/payments/cancel')
        
        # Get sender profile
        sender_profile = get_profile_by_user_id(mongo_user_id)
        sender_name = sender_profile.get('name', 'Anonymous') if sender_profile else 'Anonymous'
        
        # Create Stripe Checkout session for one-time payment
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='payment',
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Tip to {recipient_profile.get("name", "User")}',
                        'description': message or f'Thank you for the skill exchange!'
                    },
                    'unit_amount': int(amount * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            success_url=success_url + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=cancel_url,
            metadata={
                'from_user_id': str(mongo_user_id),
                'to_user_id': str(to_user_id),
                'type': 'tip',
                'message': message
            }
        )
        
        # Create pending transaction in MongoDB
        create_payment_transaction(
            transaction_type='tip',
            from_user_id=mongo_user_id,
            amount=amount,
            to_user_id=to_user_id,
            stripe_session_id=checkout_session.id,
            metadata={'message': message},
            status='pending'
        )
        
        logger.info(f"Created tip checkout session from user {mongo_user_id} to {to_user_id}")
        
        return Response({
            'session_id': checkout_session.id,
            'url': checkout_session.url
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating tip checkout: {e}")
        return Response(
            {'error': 'Failed to create checkout session'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tip_history_view(request):
    """
    Get tip history for current user (sent and received).
    
    GET /api/payments/tip/history/
    """
    try:
        django_user = request.user
        mongo_user_id = get_mongo_user_id(django_user)
        
        if not mongo_user_id:
            return Response(
                {'error': 'User not found in MongoDB'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get tips sent
        tips_sent = get_user_tips_given(mongo_user_id)
        # Get tips received
        tips_received = get_user_tips_received(mongo_user_id)
        
        # Convert ObjectIds to strings for JSON serialization
        def convert_ids(tip):
            tip['_id'] = str(tip['_id'])
            tip['from_user_id'] = str(tip['from_user_id'])
            if tip.get('to_user_id'):
                tip['to_user_id'] = str(tip['to_user_id'])
            return tip
        
        tips_sent = [convert_ids(tip) for tip in tips_sent]
        tips_received = [convert_ids(tip) for tip in tips_received]
        
        return Response({
            'tips_sent': tips_sent,
            'tips_received': tips_received,
            'total_sent': len(tips_sent),
            'total_received': len(tips_received)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting tip history: {e}")
        return Response(
            {'error': 'Failed to get tip history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Webhook Handler
@csrf_exempt
def stripe_webhook_view(request):
    """
    Handle Stripe webhook events.
    
    POST /api/payments/webhook/
    """
    import json
    
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', None)
    
    if not webhook_secret:
        logger.error("Stripe webhook secret not configured")
        return JsonResponse({'error': 'Webhook secret not configured'}, status=500)
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return JsonResponse({'error': 'Invalid signature'}, status=400)
    
    # Handle the event
    event_type = event['type']
    logger.info(f"Received webhook event: {event_type}")
    
    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        
        # Handle subscription checkout (legacy)
        if session.get('mode') == 'subscription' and session.get('subscription'):
            handle_subscription_checkout_completed(session)
        
        # Handle one-time payment (premium or tip)
        if session.get('mode') == 'payment':
            metadata = session.get('metadata', {})
            payment_type = metadata.get('type', 'tip')
            
            if payment_type == 'premium':
                handle_premium_payment_completed(session)
            else:
                handle_tip_payment_completed(session)
    
    elif event_type == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
    
    elif event_type == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription)
    
    elif event_type == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        handle_payment_intent_succeeded(payment_intent)
    
    elif event_type == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        handle_payment_intent_failed(payment_intent)
    
    else:
        logger.info(f"Unhandled event type: {event_type}")
    
    return JsonResponse({'status': 'success'})


def handle_subscription_checkout_completed(session):
    """Handle subscription checkout completion."""
    try:
        subscription_id = session.get('subscription')
        customer_id = session.get('customer')
        
        if not subscription_id or not customer_id:
            logger.error("Missing subscription or customer ID in checkout session")
            return
        
        # Get subscription from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        user_id = subscription.metadata.get('user_id')
        
        if not user_id:
            # Try to get from session metadata
            user_id = session.get('metadata', {}).get('user_id')
        
        if not user_id:
            logger.error("Could not find user_id in subscription metadata")
            return
        
        # Check if subscription already exists
        existing = get_subscription_by_stripe_id(subscription_id)
        
        if not existing:
            # Create subscription record
            create_subscription(
                user_id=user_id,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                plan_type='premium',
                status=subscription.status
            )
            logger.info(f"Created subscription record for user {user_id}")
        
        # Create payment transaction
        create_payment_transaction(
            transaction_type='subscription',
            from_user_id=user_id,
            amount=subscription.items.data[0].price.unit_amount / 100,
            stripe_payment_intent_id=session.get('payment_intent'),
            stripe_session_id=session['id'],
            status='completed'
        )
        
        # Send notification to user
        try:
            from api.notifications import send_notification, NOTIFICATION_TYPES
            amount = subscription.items.data[0].price.unit_amount / 100
            send_notification(
                user_id=user_id,
                notification_type=NOTIFICATION_TYPES['SUBSCRIPTION_UPDATED'],
                title="Subscription Activated",
                body=f"Your premium subscription has been activated. You will be charged ${amount:.2f} monthly.",
                related_id=subscription_id
            )
        except Exception as e:
            logger.error(f"Error sending subscription notification: {e}")
        
    except Exception as e:
        logger.error(f"Error handling subscription checkout: {e}")


def handle_premium_payment_completed(session):
    """Handle premium payment completion."""
    try:
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id')
        
        if not user_id:
            logger.error("Missing user_id in premium payment session metadata")
            return
        
        # Update payment transaction status
        update_payment_transaction_status(session['id'], 'completed')
        logger.info(f"Completed premium payment for user {user_id}")
        
        # Send notification to user
        try:
            from api.notifications import send_notification_to_django_user, NOTIFICATION_TYPES
            amount = session.get('amount_total', 0) / 100  # Convert from cents
            send_notification_to_django_user(
                django_user_id=int(user_id),
                notification_type=NOTIFICATION_TYPES['PAYMENT_SUCCESS'],
                title="Premium Payment Successful",
                body=f"Your premium payment of ${amount:.2f} has been processed successfully.",
                related_id=session.get('id')
            )
        except Exception as e:
            logger.error(f"Error sending premium payment notification: {e}")
        
        # User now has premium access (no subscription needed, just mark as premium)
        # Premium status is determined by checking for completed premium payment
        
    except Exception as e:
        logger.error(f"Error handling premium payment: {e}")


def handle_tip_payment_completed(session):
    """Handle tip payment completion."""
    try:
        metadata = session.get('metadata', {})
        from_user_id = metadata.get('from_user_id')
        to_user_id = metadata.get('to_user_id')
        
        if not from_user_id or not to_user_id:
            logger.error("Missing user IDs in tip payment session metadata")
            return
        
        # Update payment transaction status
        update_payment_transaction_status(session['id'], 'completed')
        logger.info(f"Completed tip payment from user {from_user_id} to {to_user_id}")
        
        # Send notifications
        try:
            from api.notifications import send_notification_to_django_user, NOTIFICATION_TYPES
            amount = session.get('amount_total', 0) / 100  # Convert from cents
            
            # Get sender's name for notification
            from_user = get_user_by_django_id(int(from_user_id))
            sender_name = from_user.get('name', 'Someone') if from_user else 'Someone'
            
            # Notify recipient
            send_notification_to_django_user(
                django_user_id=int(to_user_id),
                notification_type=NOTIFICATION_TYPES['PAYMENT_RECEIVED'],
                title=f"Tip Received from {sender_name}",
                body=f"You received a tip of ${amount:.2f} from {sender_name}.",
                related_id=session.get('id')
            )
            
            # Notify sender
            send_notification_to_django_user(
                django_user_id=int(from_user_id),
                notification_type=NOTIFICATION_TYPES['PAYMENT_SUCCESS'],
                title="Tip Sent Successfully",
                body=f"Your tip of ${amount:.2f} has been sent successfully.",
                related_id=session.get('id')
            )
        except Exception as e:
            logger.error(f"Error sending tip payment notifications: {e}")
        
    except Exception as e:
        logger.error(f"Error handling tip payment: {e}")


def handle_subscription_updated(subscription):
    """Handle subscription update."""
    try:
        stripe_subscription_id = subscription.get('id')
        
        # Get subscription to find user
        sub = get_subscription_by_stripe_id(stripe_subscription_id)
        if not sub:
            logger.warning(f"Subscription {stripe_subscription_id} not found in database")
            return
        
        # Update subscription in MongoDB
        update_subscription_status(
            stripe_subscription_id,
            subscription.get('status'),
            current_period_start=datetime.fromtimestamp(subscription.get('current_period_start')),
            current_period_end=datetime.fromtimestamp(subscription.get('current_period_end')),
            cancel_at_period_end=subscription.get('cancel_at_period_end')
        )
        
        logger.info(f"Updated subscription {stripe_subscription_id}")
        
        # Send notification to user
        try:
            from api.notifications import send_notification, NOTIFICATION_TYPES
            user_id = str(sub.get('user_id'))
            status = subscription.get('status', 'active')
            
            status_messages = {
                'active': 'Your subscription is now active.',
                'canceled': 'Your subscription has been canceled.',
                'past_due': 'Your subscription payment is past due.',
                'unpaid': 'Your subscription payment failed.'
            }
            
            send_notification(
                user_id=user_id,
                notification_type=NOTIFICATION_TYPES['SUBSCRIPTION_UPDATED'],
                title="Subscription Updated",
                body=status_messages.get(status, f"Your subscription status is now: {status}"),
                related_id=stripe_subscription_id
            )
        except Exception as e:
            logger.error(f"Error sending subscription update notification: {e}")
        
    except Exception as e:
        logger.error(f"Error handling subscription update: {e}")


def handle_subscription_deleted(subscription):
    """Handle subscription deletion."""
    try:
        stripe_subscription_id = subscription.get('id')
        
        # Update subscription status to canceled
        update_subscription_status(
            stripe_subscription_id,
            'canceled'
        )
        
        logger.info(f"Canceled subscription {stripe_subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription deletion: {e}")


def handle_payment_intent_succeeded(payment_intent):
    """Handle successful payment intent."""
    try:
        payment_intent_id = payment_intent.get('id')
        logger.info(f"Payment intent succeeded: {payment_intent_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment intent success: {e}")


def handle_payment_intent_failed(payment_intent):
    """Handle failed payment intent."""
    try:
        payment_intent_id = payment_intent.get('id')
        
        # Update payment transaction status
        # Note: We need to find the transaction by payment_intent_id
        from api.db import get_payments_collection
        payments = get_payments_collection()
        
        result = payments.update_one(
            {'stripe_payment_intent_id': payment_intent_id},
            {'$set': {'status': 'failed'}}
        )
        
        if result.modified_count > 0:
            logger.info(f"Marked payment transaction as failed: {payment_intent_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment intent failure: {e}")


