from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class MongoUser(models.Model):
    """
    MongoDB user profile model.
    Represents user data stored in MongoDB users collection.
    Links to Django User via django_user_id.
    """
    django_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mongo_profile',
        help_text="Link to Django User model"
    )
    email = models.EmailField(unique=True, help_text="User email address")
    name = models.CharField(max_length=255, help_text="User's display name")
    avatar_url = models.URLField(blank=True, null=True, help_text="URL to user's avatar image")
    phoneNumber = models.CharField(max_length=20, blank=True, null=True, help_text="User's phone number")
    address = models.TextField(blank=True, null=True, help_text="User's address")
    is_verified = models.BooleanField(default=True, help_text="Whether user email is verified")
    profile_completed = models.BooleanField(default=False, help_text="Whether user has completed profile setup")
    roles = models.JSONField(
        default=list,
        help_text="User roles (e.g., 'user', 'admin')"
    )
    skills_teaching = models.JSONField(
        default=list,
        help_text="Skills user can teach"
    )
    skills_learning = models.JSONField(
        default=list,
        help_text="Skills user wants to learn"
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="Account creation timestamp")
    last_seen = models.DateTimeField(auto_now=True, help_text="Last activity timestamp")
    
    class Meta:
        verbose_name = "MongoDB User"
        verbose_name_plural = "MongoDB Users"
        db_table = "mongo_users"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['django_user']),
            models.Index(fields=['created_at']),
            models.Index(fields=['last_seen']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.email})"


class Token(models.Model):
    """
    Token model for email verification and password reset.
    Represents tokens stored in MongoDB tokens collection.
    """
    TOKEN_TYPE_CHOICES = [
        ('email_verification', 'Email Verification'),
        ('password_reset', 'Password Reset'),
    ]
    
    django_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tokens',
        help_text="Link to Django User model"
    )
    token = models.CharField(max_length=64, unique=True, help_text="Hashed token value")
    token_type = models.CharField(
        max_length=20,
        choices=TOKEN_TYPE_CHOICES,
        help_text="Type of token"
    )
    email = models.EmailField(help_text="Email associated with the token")
    used = models.BooleanField(default=False, help_text="Whether token has been used")
    used_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when token was used")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Token creation timestamp")
    expires_at = models.DateTimeField(help_text="Token expiration timestamp")
    
    class Meta:
        verbose_name = "Token"
        verbose_name_plural = "Tokens"
        db_table = "tokens"
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['django_user']),
            models.Index(fields=['token_type']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.token_type} token for {self.email}"


class Profile(models.Model):
    """
    Detailed user profile model.
    Represents user profiles stored in MongoDB profiles collection.
    """
    user_id = models.CharField(
        max_length=24,
        unique=True,
        help_text="MongoDB ObjectId of the user"
    )
    name = models.CharField(max_length=255, help_text="User's display name")
    bio = models.TextField(blank=True, max_length=1000, help_text="User's bio/description")
    avatar_url = models.URLField(blank=True, null=True, help_text="URL to user's avatar image")
    resume_url = models.URLField(blank=True, null=True, help_text="URL to user's resume")
    skills_offered = models.JSONField(
        default=list,
        help_text="List of skills user can teach (1-10 items)"
    )
    skills_wanted = models.JSONField(
        default=list,
        help_text="List of skills user wants to learn (1-10 items)"
    )
    location = models.JSONField(
        default=dict,
        blank=True,
        help_text="Location object with city, country, and optional coordinates"
    )
    availability = models.JSONField(
        default=list,
        blank=True,
        help_text="List of availability periods"
    )
    timezone = models.CharField(max_length=50, default='UTC', help_text="User's timezone")
    rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="User's rating (0-5)"
    )
    total_matches = models.IntegerField(default=0, help_text="Total number of matches")
    total_teaching_sessions = models.IntegerField(default=0, help_text="Total teaching sessions")
    total_learning_sessions = models.IntegerField(default=0, help_text="Total learning sessions")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Profile creation timestamp")
    updated_at = models.DateTimeField(auto_now=True, help_text="Profile last update timestamp")
    
    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"
        db_table = "profiles"
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['skills_offered']),
            models.Index(fields=['skills_wanted']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Profile for {self.name}"


class Match(models.Model):
    """
    User matching model.
    Represents matches stored in MongoDB matches collection.
    """
    INTEREST_STATUS_CHOICES = [
        ('none', 'None'),
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    user_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the user"
    )
    matched_user_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the matched user"
    )
    match_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Match score (0-100)"
    )
    interest_status = models.CharField(
        max_length=20,
        choices=INTEREST_STATUS_CHOICES,
        default='none',
        help_text="Interest status between users"
    )
    interested_by = models.CharField(
        max_length=24,
        null=True,
        blank=True,
        help_text="MongoDB ObjectId of user who expressed interest"
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="Match creation timestamp")
    updated_at = models.DateTimeField(auto_now=True, help_text="Match last update timestamp")
    
    class Meta:
        verbose_name = "Match"
        verbose_name_plural = "Matches"
        db_table = "matches"
        unique_together = [['user_id', 'matched_user_id']]
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['matched_user_id']),
            models.Index(fields=['user_id', 'match_score']),
            models.Index(fields=['interest_status']),
        ]
    
    def __str__(self):
        return f"Match: {self.user_id} <-> {self.matched_user_id} ({self.interest_status})"


class Subscription(models.Model):
    """
    Subscription model for Stripe subscriptions.
    Represents subscriptions stored in MongoDB subscriptions collection.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('canceled', 'Canceled'),
        ('past_due', 'Past Due'),
        ('unpaid', 'Unpaid'),
    ]
    
    PLAN_TYPE_CHOICES = [
        ('premium', 'Premium'),
        ('basic', 'Basic'),
    ]
    
    user_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the user"
    )
    stripe_customer_id = models.CharField(max_length=255, help_text="Stripe customer ID")
    stripe_subscription_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Stripe subscription ID"
    )
    plan_type = models.CharField(
        max_length=20,
        choices=PLAN_TYPE_CHOICES,
        default='premium',
        help_text="Subscription plan type"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        help_text="Subscription status"
    )
    current_period_start = models.DateTimeField(help_text="Current billing period start")
    current_period_end = models.DateTimeField(help_text="Current billing period end")
    cancel_at_period_end = models.BooleanField(
        default=False,
        help_text="Whether subscription will cancel at period end"
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="Subscription creation timestamp")
    updated_at = models.DateTimeField(auto_now=True, help_text="Subscription last update timestamp")
    
    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"
        db_table = "subscriptions"
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['stripe_subscription_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Subscription {self.stripe_subscription_id} for user {self.user_id}"


class Payment(models.Model):
    """
    Payment transaction model.
    Represents payment transactions stored in MongoDB payments collection.
    """
    TRANSACTION_TYPE_CHOICES = [
        ('subscription', 'Subscription'),
        ('tip', 'Tip'),
        ('premium', 'Premium'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        help_text="Type of transaction"
    )
    from_user_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of user who paid"
    )
    to_user_id = models.CharField(
        max_length=24,
        null=True,
        blank=True,
        help_text="MongoDB ObjectId of user who received payment (None for subscriptions)"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
        help_text="Payment amount in USD"
    )
    currency = models.CharField(max_length=3, default='usd', help_text="Currency code")
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Stripe payment intent ID"
    )
    stripe_session_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Stripe checkout session ID"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Transaction status"
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata"
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="Transaction creation timestamp")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="Transaction completion timestamp")
    
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        db_table = "payments"
        indexes = [
            models.Index(fields=['from_user_id']),
            models.Index(fields=['to_user_id']),
            models.Index(fields=['stripe_session_id']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} payment: ${self.amount} ({self.status})"


class Conversation(models.Model):
    """
    Conversation model for chat conversations.
    Represents conversations stored in MongoDB conversations collection.
    """
    participants = models.JSONField(
        default=list,
        help_text="List of MongoDB ObjectIds of conversation participants (exactly 2)"
    )
    last_message = models.TextField(blank=True, help_text="Text of the last message")
    last_message_timestamp = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of the last message"
    )
    unread_counts = models.JSONField(
        default=dict,
        help_text="Dictionary mapping user_id to unread message count"
    )
    created_at = models.DateTimeField(auto_now_add=True, help_text="Conversation creation timestamp")
    updated_at = models.DateTimeField(auto_now=True, help_text="Conversation last update timestamp")
    
    class Meta:
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"
        db_table = "conversations"
        indexes = [
            models.Index(fields=['participants']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"Conversation between {self.participants[0]} and {self.participants[1]}"


class Message(models.Model):
    """
    Message model for chat messages.
    Represents messages stored in MongoDB messages collection.
    """
    conversation_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the conversation"
    )
    sender_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the message sender"
    )
    text = models.TextField(help_text="Message content")
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text="List of attachment URLs"
    )
    timestamp = models.DateTimeField(auto_now_add=True, help_text="Message timestamp")
    is_read = models.BooleanField(default=False, help_text="Whether message has been read")
    read_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when message was read")
    is_edited = models.BooleanField(default=False, help_text="Whether message has been edited")
    edited_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when message was edited")
    is_deleted = models.BooleanField(default=False, help_text="Whether message has been deleted")
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when message was deleted")
    
    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        db_table = "messages"
        indexes = [
            models.Index(fields=['conversation_id']),
            models.Index(fields=['conversation_id', 'timestamp']),
            models.Index(fields=['sender_id']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['is_read']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender_id} at {self.timestamp}"


class Notification(models.Model):
    """
    Notification model for user notifications.
    Represents notifications stored in MongoDB notifications collection.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('new_message', 'New Message'),
        ('payment_success', 'Payment Success'),
        ('payment_received', 'Payment Received'),
        ('subscription_updated', 'Subscription Updated'),
        ('session_request', 'Session Request'),
        ('session_accept', 'Session Accepted'),
        ('session_reject', 'Session Rejected'),
    ]
    
    user_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the user"
    )
    type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPE_CHOICES,
        help_text="Type of notification"
    )
    title = models.CharField(max_length=255, help_text="Notification title")
    body = models.TextField(help_text="Notification body/message")
    related_id = models.CharField(
        max_length=24,
        null=True,
        blank=True,
        help_text="MongoDB ObjectId reference to related entity (conversation, payment, etc.)"
    )
    is_read = models.BooleanField(default=False, help_text="Whether notification has been read")
    read_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when notification was read")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Notification creation timestamp")
    
    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        db_table = "notifications"
        indexes = [
            models.Index(fields=['user_id', 'created_at']),
            models.Index(fields=['user_id', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.type} notification for {self.user_id}"


class Session(models.Model):
    """
    Session model for teaching/learning sessions.
    Represents sessions stored in MongoDB sessions collection.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    teacher_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the teacher"
    )
    learner_id = models.CharField(
        max_length=24,
        help_text="MongoDB ObjectId of the learner"
    )
    skill_taught = models.CharField(max_length=100, help_text="Skill being taught")
    skill_learned = models.CharField(max_length=100, help_text="Skill being learned")
    scheduled_date = models.DateField(help_text="Date of session (YYYY-MM-DD)")
    scheduled_time = models.TimeField(help_text="Time of session (HH:MM)")
    duration_minutes = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(480)],
        default=60,
        help_text="Session duration in minutes (1-480)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Session status"
    )
    notes = models.TextField(blank=True, help_text="Session notes/description")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Session creation timestamp")
    updated_at = models.DateTimeField(auto_now=True, help_text="Session last update timestamp")
    
    class Meta:
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        db_table = "sessions"
        indexes = [
            models.Index(fields=['teacher_id']),
            models.Index(fields=['learner_id']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_date', 'scheduled_time']),
        ]
    
    def __str__(self):
        return f"Session: {self.skill_taught} ({self.status})"


class PartialUser(models.Model):
    """
    Partial user model for temporary registration data.
    Represents partial user data stored in MongoDB partial_users collection.
    """
    temp_user_id = models.CharField(
        max_length=255,
        unique=True,
        help_text="Temporary user ID"
    )
    firstName = models.CharField(max_length=100, help_text="User's first name")
    lastName = models.CharField(max_length=100, help_text="User's last name")
    phoneNumber = models.CharField(max_length=20, help_text="User's phone number")
    address = models.TextField(help_text="User's address")
    created_at = models.DateTimeField(auto_now_add=True, help_text="Partial user creation timestamp")
    expires_at = models.DateTimeField(help_text="Expiration timestamp (24 hours from creation)")
    
    class Meta:
        verbose_name = "Partial User"
        verbose_name_plural = "Partial Users"
        db_table = "partial_users"
        indexes = [
            models.Index(fields=['temp_user_id']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Partial user: {self.firstName} {self.lastName} ({self.temp_user_id})"
