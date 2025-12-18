"""
URL configuration for api app.
"""
from django.urls import path, include
from . import views
from .auth_views import (
    register_view,
    login_view,
    logout_view,
    user_detail_view,
    user_update_view,
    password_change_view,
    password_reset_request_view,
    password_reset_confirm_view,
    refresh_token_view,
    socket_token_view,
    partial_register_view,
    complete_register_view,
    password_strength_view,
    verify_email_view,
    resend_verification_view
)
from .contact_views import contact_form_view
from .profile_views import (
    create_or_get_profile_view,
    update_profile_view,
    delete_profile_view,
    get_user_profile_view,
    search_profiles_view
)
from .matching_views import (
    get_matches_view,
    get_match_detail_view,
    express_interest_view,
    get_interested_users_view,
    respond_to_interest_view
)
from .payment_views import (
    create_premium_payment_checkout_view,
    get_subscription_status_view,
    cancel_subscription_view,
    create_customer_portal_view,
    create_tip_checkout_view,
    get_tip_history_view,
    stripe_webhook_view
)
from .notification_views import (
    get_notifications_view,
    get_unread_count_view,
    mark_notification_read_view,
    mark_all_read_view,
    delete_notification_view
)
from .message_views import (
    get_conversations_view,
    get_messages_view,
    create_conversation_view,
    get_chat_users_view,
    upload_file_view,
    update_message_view,
    delete_message_view
)
from .session_views import (
    create_session_view,
    get_sessions_view,
    get_teaching_sessions_view,
    get_learning_sessions_view,
    get_session_detail_view,
    update_session_view,
    accept_session_view,
    reject_session_view,
    complete_session_view,
    cancel_session_view,
    delete_session_view
)

urlpatterns = [
    path('health/', views.health_check_view, name='health_check'),
    
    # Contact endpoint
    path('contact/', contact_form_view, name='contact_form'),
    
    # Authentication endpoints
    path('auth/', include([
        path('register/', register_view, name='register'),
        path('partial-register/', partial_register_view, name='partial_register'),
        path('complete-register/', complete_register_view, name='complete_register'),
        path('login/', login_view, name='login'),
        path('logout/', logout_view, name='logout'),
        path('user/', user_detail_view, name='user_detail'),
        path('user/update/', user_update_view, name='user_update'),
        path('verify-email/', verify_email_view, name='verify_email'),
        path('resend-verification/', resend_verification_view, name='resend_verification'),
        path('password/change/', password_change_view, name='password_change'),
        path('password/reset/', password_reset_request_view, name='password_reset_request'),
        path('password/reset/confirm/', password_reset_confirm_view, name='password_reset_confirm'),
        path('password/strength/', password_strength_view, name='password_strength'),
        path('token/refresh/', refresh_token_view, name='refresh_token'),
        path('token/socket/', socket_token_view, name='socket_token'),
    ])),
    
    # Profile endpoints
    path('profile/', include([
        path('', create_or_get_profile_view, name='create_or_get_profile'),
        path('update/', update_profile_view, name='update_profile'),
        path('delete/', delete_profile_view, name='delete_profile'),
        path('search/', search_profiles_view, name='search_profiles'),
        path('<str:user_id>/', get_user_profile_view, name='get_user_profile'),
    ])),
    
    # Matching endpoints
    path('matches/', include([
        path('', get_matches_view, name='get_matches'),
        path('interest/', express_interest_view, name='express_interest'),
        path('interested/', get_interested_users_view, name='get_interested_users'),
        path('respond/', respond_to_interest_view, name='respond_to_interest'),
        path('<str:user_id>/', get_match_detail_view, name='get_match_detail'),
    ])),
    
    # Payment endpoints
    path('payments/', include([
        path('premium/create-checkout/', create_premium_payment_checkout_view, name='create_premium_payment_checkout'),
        path('subscription/status/', get_subscription_status_view, name='get_subscription_status'),
        path('subscription/cancel/', cancel_subscription_view, name='cancel_subscription'),
        path('subscription/portal/', create_customer_portal_view, name='create_customer_portal'),
        path('tip/create/', create_tip_checkout_view, name='create_tip_checkout'),
        path('tip/history/', get_tip_history_view, name='get_tip_history'),
        path('webhook/', stripe_webhook_view, name='stripe_webhook'),
    ])),
    
    # Notification endpoints
    path('notifications/', include([
        path('', get_notifications_view, name='get_notifications'),
        path('unread-count/', get_unread_count_view, name='get_unread_count'),
        path('mark-all-read/', mark_all_read_view, name='mark_all_read'),
        path('<str:notification_id>/read/', mark_notification_read_view, name='mark_notification_read'),
        path('<str:notification_id>/', delete_notification_view, name='delete_notification'),
    ])),
    
    # Message endpoints
    path('messages/', include([
        path('conversations/', get_conversations_view, name='get_conversations'),
        path('conversations/create/', create_conversation_view, name='create_conversation'),
        path('conversations/<str:conversation_id>/messages/', get_messages_view, name='get_messages'),
        path('chat-users/', get_chat_users_view, name='get_chat_users'),
        path('upload-file/', upload_file_view, name='upload_file'),
        path('<str:message_id>/update/', update_message_view, name='update_message'),
        path('<str:message_id>/delete/', delete_message_view, name='delete_message'),
    ])),
    
    # Session endpoints
    path('sessions/', include([
        path('create/', create_session_view, name='create_session'),
        path('', get_sessions_view, name='get_sessions'),
        path('teaching/', get_teaching_sessions_view, name='get_teaching_sessions'),
        path('learning/', get_learning_sessions_view, name='get_learning_sessions'),
        path('<str:session_id>/', get_session_detail_view, name='get_session_detail'),
        path('<str:session_id>/update/', update_session_view, name='update_session'),
        path('<str:session_id>/accept/', accept_session_view, name='accept_session'),
        path('<str:session_id>/reject/', reject_session_view, name='reject_session'),
        path('<str:session_id>/complete/', complete_session_view, name='complete_session'),
        path('<str:session_id>/cancel/', cancel_session_view, name='cancel_session'),
        path('<str:session_id>/delete/', delete_session_view, name='delete_session'),
    ])),

    # Admin endpoints
    path('admin/', include([
        path('auth/', include('api.admin_auth.urls')),
        path('', include('api.admin_dashboard.urls')),
    ])),
]
