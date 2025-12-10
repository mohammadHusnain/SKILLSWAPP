from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin
from .models import (
    MongoUser, Token, Profile, Match, Subscription, 
    Payment, Conversation, Message, Notification, 
    Session, PartialUser
)


# Register your models here.

# Customize admin site headers
admin.site.site_header = "SkillSwap Administration"
admin.site.site_title = "SkillSwap Admin"
admin.site.index_title = "Welcome to SkillSwap Administration"

# Ensure User and Group are registered (they should be by default)
# This is just to make sure they're available
if not admin.site.is_registered(User):
    admin.site.register(User, UserAdmin)

if not admin.site.is_registered(Group):
    admin.site.register(Group)


# MongoDB User Admin
@admin.register(MongoUser)
class MongoUserAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'django_user', 'is_verified', 'profile_completed', 'created_at')
    list_filter = ('is_verified', 'profile_completed', 'created_at')
    search_fields = ('name', 'email', 'django_user__username', 'django_user__email')
    readonly_fields = ('created_at', 'last_seen')
    fieldsets = (
        ('User Information', {
            'fields': ('django_user', 'email', 'name', 'avatar_url')
        }),
        ('Contact Information', {
            'fields': ('phoneNumber', 'address')
        }),
        ('Status', {
            'fields': ('is_verified', 'profile_completed', 'roles')
        }),
        ('Skills', {
            'fields': ('skills_teaching', 'skills_learning')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_seen')
        }),
    )


# Token Admin
@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ('token_type', 'email', 'django_user', 'used', 'created_at', 'expires_at')
    list_filter = ('token_type', 'used', 'created_at', 'expires_at')
    search_fields = ('email', 'token', 'django_user__username')
    readonly_fields = ('created_at', 'used_at')
    fieldsets = (
        ('Token Information', {
            'fields': ('django_user', 'token', 'token_type', 'email')
        }),
        ('Status', {
            'fields': ('used', 'used_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )


# Profile Admin
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'user_id', 'rating', 'total_matches', 'created_at')
    list_filter = ('rating', 'created_at', 'timezone')
    search_fields = ('name', 'user_id', 'bio')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('user_id', 'name', 'bio', 'avatar_url', 'resume_url')
        }),
        ('Skills', {
            'fields': ('skills_offered', 'skills_wanted')
        }),
        ('Location & Availability', {
            'fields': ('location', 'availability', 'timezone')
        }),
        ('Statistics', {
            'fields': ('rating', 'total_matches', 'total_teaching_sessions', 'total_learning_sessions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


# Match Admin
@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'matched_user_id', 'match_score', 'interest_status', 'created_at')
    list_filter = ('interest_status', 'created_at')
    search_fields = ('user_id', 'matched_user_id')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Match Information', {
            'fields': ('user_id', 'matched_user_id', 'match_score')
        }),
        ('Interest Status', {
            'fields': ('interest_status', 'interested_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


# Subscription Admin
@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'plan_type', 'status', 'stripe_subscription_id', 'current_period_end', 'created_at')
    list_filter = ('plan_type', 'status', 'cancel_at_period_end', 'created_at')
    search_fields = ('user_id', 'stripe_customer_id', 'stripe_subscription_id')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('User Information', {
            'fields': ('user_id', 'stripe_customer_id', 'stripe_subscription_id')
        }),
        ('Subscription Details', {
            'fields': ('plan_type', 'status')
        }),
        ('Billing Period', {
            'fields': ('current_period_start', 'current_period_end', 'cancel_at_period_end')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


# Payment Admin
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'from_user_id', 'to_user_id', 'amount', 'status', 'created_at')
    list_filter = ('transaction_type', 'status', 'currency', 'created_at')
    search_fields = ('from_user_id', 'to_user_id', 'stripe_session_id', 'stripe_payment_intent_id')
    readonly_fields = ('created_at', 'completed_at')
    fieldsets = (
        ('Transaction Information', {
            'fields': ('transaction_type', 'from_user_id', 'to_user_id', 'amount', 'currency')
        }),
        ('Stripe Information', {
            'fields': ('stripe_payment_intent_id', 'stripe_session_id')
        }),
        ('Status', {
            'fields': ('status', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at')
        }),
    )


# Conversation Admin
@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'participants', 'last_message_timestamp', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('participants', 'last_message')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Participants', {
            'fields': ('participants',)
        }),
        ('Last Message', {
            'fields': ('last_message', 'last_message_timestamp')
        }),
        ('Unread Counts', {
            'fields': ('unread_counts',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


# Message Admin
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation_id', 'sender_id', 'is_read', 'timestamp')
    list_filter = ('is_read', 'is_edited', 'is_deleted', 'timestamp')
    search_fields = ('conversation_id', 'sender_id', 'text')
    readonly_fields = ('timestamp', 'read_at', 'edited_at', 'deleted_at')
    fieldsets = (
        ('Message Information', {
            'fields': ('conversation_id', 'sender_id', 'text', 'attachments')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'is_edited', 'edited_at', 'is_deleted', 'deleted_at')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )


# Notification Admin
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('type', 'user_id', 'title', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('user_id', 'title', 'body', 'related_id')
    readonly_fields = ('created_at', 'read_at')
    fieldsets = (
        ('Notification Information', {
            'fields': ('user_id', 'type', 'title', 'body', 'related_id')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )


# Session Admin
@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'teacher_id', 'learner_id', 'skill_taught', 'status', 'scheduled_date', 'scheduled_time')
    list_filter = ('status', 'scheduled_date', 'created_at')
    search_fields = ('teacher_id', 'learner_id', 'skill_taught', 'skill_learned')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Participants', {
            'fields': ('teacher_id', 'learner_id')
        }),
        ('Session Details', {
            'fields': ('skill_taught', 'skill_learned', 'notes')
        }),
        ('Schedule', {
            'fields': ('scheduled_date', 'scheduled_time', 'duration_minutes')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


# Partial User Admin
@admin.register(PartialUser)
class PartialUserAdmin(admin.ModelAdmin):
    list_display = ('firstName', 'lastName', 'temp_user_id', 'phoneNumber', 'created_at', 'expires_at')
    list_filter = ('created_at', 'expires_at')
    search_fields = ('temp_user_id', 'firstName', 'lastName', 'phoneNumber')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Temporary User Information', {
            'fields': ('temp_user_id', 'firstName', 'lastName', 'phoneNumber', 'address')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )
