<<<<<<< HEAD
# Complete Payment Gateway Documentation

## Overview

SkillSwap uses **Stripe** as the payment gateway for one-time premium payments and tip/donation transactions. The system uses Stripe Checkout Sessions in payment mode (one-time payments) for premium upgrades, and supports tips between users.

**Payment Type**: One-Time Payment (Not Subscription)
**Premium Price**: $9.99 USD
**Currency**: USD

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend APIs](#backend-apis)
3. [Frontend Implementation](#frontend-implementation)
4. [Database Schema](#database-schema)
5. [Environment Configuration](#environment-configuration)
6. [Webhook Events](#webhook-events)
7. [File Structure](#file-structure)
8. [Payment Flow](#payment-flow)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Architecture Overview

### Payment Flow

```
User clicks "Upgrade" 
  ↓
Frontend: /dashboard/subscription/create
  ↓
Backend: POST /api/payments/premium/create-checkout/
  ↓
Stripe: Create Checkout Session (payment mode)
  ↓
User redirected to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe Webhook: checkout.session.completed
  ↓
Backend: Update payment status to 'completed'
  ↓
User redirected to success page
  ↓
User has premium access
```

### Technology Stack

- **Backend**: Django REST Framework
- **Frontend**: Next.js 15 (React)
- **Payment Gateway**: Stripe API
- **Database**: MongoDB (payment transactions)
- **Authentication**: JWT (Bearer tokens)

---

## Backend APIs

### Base URL
```
http://localhost:8000/api
```

### Authentication
All payment endpoints require authentication via JWT token:
```
Authorization: Bearer <access_token>
```

---

### 1. Create Premium Payment Checkout

**Endpoint**: `POST /api/payments/premium/create-checkout/`

**Description**: Creates a Stripe Checkout Session for one-time premium payment ($9.99).

**Request Body**:
```json
{
  "success_url": "http://localhost:3000/dashboard/payments/success",
  "cancel_url": "http://localhost:3000/dashboard/payments/cancel"
}
```

**Response** (Success - 200):
```json
{
  "session_id": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxxghtml#fidkdWxOYHwnPyd1blpxYHZxWjUrbanRjRkVgdk1SaGNHanxPXXVzUXxUdkpcc2NNcWZ0cXZNXGFKYXxPfGpTQmsxfF9UZnxwQ2NnSGFkU2pzQmJRfGN3ZHB3XWtWYWEzfHZdbW5NdV1qU2VtZCVyQXZwdUl4JSUl"
}
```

**Response** (Error - 400):
```json
{
  "error": "User already has premium access"
}
```

**Response** (Error - 404):
```json
{
  "error": "User not found in MongoDB",
  "message": "Please ensure your profile is properly set up"
}
```

**Response** (Error - 500):
```json
{
  "error": "Stripe error: <error_message>",
  "message": "Please check your Stripe configuration"
}
```

**Implementation**: `Backend/api/payment_views.py::create_premium_payment_checkout_view()`

---

コンパイ: 2. Get Premium Status

**Endpoint**: `GET /api/payments/subscription/status/`

**Description**: Gets the current user's premium status (checks for completed premium payments).

**Response** (Success - 200):
```json
{
  "is_premium": true,
  "status": "active",
  "subscription": {
    "plan_type": "premium",
    "current_period_end": null,
    "current_period_start": "2025-01-29T12:00:00",
    "cancel_at_period_end": false
  }
}
```

**Response** (Not Premium - 200):
```json
{
  "is_premium": false,
  "status": "none",
  "subscription": null
}
```

**Implementation**: `Backend/api/payment_views.py::get_subscription_status_view()`

---

### 3. Create Tip Checkout

**Endpoint**: `POST /api/payments/tip/create/`

**Description**: Creates a Stripe Checkout Session for tipping another user.

**Request Body**:
```json
{
  "to_user_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "amount": 10.00,
  "message": "Thank you for the great session!",
  "success_url": "http://localhost:3000/dashboard/payments/success",
  "cancel_url": "http://localhost:3000/dashboard/payments/cancel"
}
```

**Response** (Success - 200):
```json
{
  "session_id": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

**Validation**:
- Amount must be between $1.00 and $1000.00
- to_user_id must be a valid MongoDB ObjectId

**Implementation**: `Backend/api/payment_views.py::create_tip_checkout_view()`

---

### 4. Get Tip History

**Endpoint**: `GET /api/payments/tip/history/`

**Description**: Gets tip history for the current user (both sent and received).

**Response** (Success - 200):
```json
{
  "tips_sent": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "from_user_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "to_user_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "amount": 10.00,
      "status": "completed",
      "created_at": "2025-01-29T12:00:00"
    }
  ],
  "tips_received": [],
  "total_sent": 1,
  "total_received": 0
}
```

**Implementation**: `Backend/api/payment_views.py::get_tip_history_view()`

---

### 5. Stripe Webhook Handler

**Endpoint**: `POST /api/payments/webhook/`

**Description**: Handles Stripe webhook events for payment status updates.

**Authentication**: Uses Stripe webhook signature verification (not JWT)

**Headers Required**:
```
Stripe-Signature: <signature>
```

**Supported Events**:
- `checkout.session.completed` - Payment completed
- `payment_intent.succeeded` - Payment intent succeeded
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.updated` - Subscription updated (legacy)
- `customer.subscription.deleted` - Subscription deleted (legacy)

**Response**:
```json
{
  "status": "success"
}
```

**Implementation**: `Backend/api/payment_views.py::stripe_webhook_view()`

---

## Frontend Implementation

### API Client

**File**: `Frontend/src/lib/api.js`

**Methods**:
```javascript
// Premium payment methods (one-time payment)
paymentAPI.createPremiumCheckout(successUrl, cancelUrl)
  → Returns: { session_id, url }

// Legacy method for backwards compatibility
paymentAPI.createSubscriptionCheckout(successUrl, cancelUrl)
  → Calls createPremiumCheckout()

// Get premium status
paymentAPI.getSubscriptionStatus()
  → Returns: { is_premium, status, subscription }

// Tip methods
paymentAPI.createTipCheckout(toUserId, amount, message, successUrl, cancelUrl)
  → Returns: { session_id, url }

paymentAPI.getTipHistory()
  → Returns: { tips_sent, tips_received, total_sent, total_received }
```

### Pages

#### 1. Subscription Page
**File**: `Frontend/src/app/dashboard/subscription/page.jsx`

**Features**:
- Displays current premium status
- Shows plan benefits (Free vs Premium)
- "Upgrade to Premium" button (one-time $9.99)
- "Manage Subscription" button (if premium)

**Route**: `/dashboard/subscription`

---

#### 2. Create Checkout Page
**File**: `Frontend/src/app/dashboard/subscription/create/page.jsx`

**Features**:
- Loading state while creating checkout session
- Error handling and display
- Automatic redirect to Stripe Checkout
- Redirects back to subscription page on error

**Route**: `/dashboard/subscription/create`

**Flow**:
1. Page loads → Calls `createPremiumCheckout()`
2. Receives checkout URL → Redirects to Stripe
3. On error → Shows error message and redirects back

---

#### ้3. Payment Success Page
**File**: `Frontend/src/app/dashboard/payments/success/page.jsx`

**Features**:
- Success confirmation
- Displays session ID
- "Go to Subscription Settings" button

**Route**: `/dashboard/payments/success`

---

#### 4. Payment Cancel Page
**File**: `Frontend/src/app/dashboard/payments/cancel/page.jsx`

**Features**:
- Cancellation confirmation
- Options to go back or return to dashboard

**Route**: `/dashboard/payments/cancel`

---

## Database Schema

### MongoDB Collections

#### 1. payments Collection

Stores all payment transactions (premium and tips).

**Schema**:
```javascript
{
  _id: ObjectId,
  transaction_type: String,      // 'premium' | 'tip' | 'subscription' (leg割
  from_user_id: ObjectId,         // User who paid
  to_user_id: ObjectId,           // User who received (null for premium)
  amount: Number,                 // Amount in USD (e.g., 9.99)
  currency: String,               // 'usd'
  stripe_payment_intent_id: String,  // Stripe payment intent ID (optional)
  stripe_session_id: String,      // Stripe checkout session ID
  status: String,                 // 'pending' | 'completed' | 'failed' | 'refunded'
  metadata: Object,               // Additional metadata
  created_at: Date,
  completed_at: Date              // Set when status becomes 'completed'
}
```

**Indexes**:
- `from_user_id` + `transaction_type` + `status`
- `stripe_session_id`
- `created_at` (for sorting)

**Helper Functions**: `Backend/api/db.py`
- `create_payment_transaction()` - Create new payment record
- `update_payment_transaction_status()` - Update payment status
- `get_user_payment_history()` - Get user's payment history
- `get_user_tips_received()` - Get tips received
- `get_user_tips_given()` - Get tips given

---

#### 2. subscriptions Collection (Legacy)

Stores subscription records (legacy, kept for compatibility).

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  stripe_customer_id: String,
  stripe_subscription_id: String,
  plan_type: String,              // 'premium'
  status: String,                 // 'active' | 'canceled' | 'past_due'
  current_period_start: Date,
  current_period_end: Date,
  cancel_at_period_end: Boolean,
  created_at: Date,
  updated_at: Date
}
```

**Note**: Current implementation uses one-time payments instead of subscriptions. Premium status is determined by completed payments in the `payments` collection.

---

## Environment Configuration

### Required Environment Variables

**File**: `Backend/.env`

```env
# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Optional for local dev

# Note: STRIPE_PRICE_ID is no longer required for one-time payments
# (Previously used for subscriptions, kept in settings for compatibility)
```

### Configuration Loading

**File**: `Backend/skillswap/settings.py`
```python
STRIPE_SECRET_KEY = get_stripe_secret_key()
STRIPE_PUBLISHABLE_KEY = get_stripe_publishable_key()
STRIPE_WEBHOOK_SECRET = get_stripe_webhook_secret()
```

**File**: `Backend/skillswap/settings_env.py`
- `get_stripe_secret_key()` - Loads from .env
- `get_stripe_publishable_key()` - Loads from .env
- `get_stripe_webhook_secret()` 's - Loads from .env (optional)

### Frontend Environment

**File**: `Frontend/.env.local` (optional)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Default**: `http://localhost:8000/api`

---

## Webhook Events

### Event Handlers

**File**: `Backend/api/payment_views.py`

#### 1. `checkout.session.completed`

Triggered when a checkout session is completed.

**Handler**: Checks `session.mode` and `session.metadata.type`
- If `mode == 'payment'` and `type == 'premium'` → `handle_premium_payment_completed()`
- If `mode == 'payment'` and `type == 'tip'` → `handle_tip_payment_completed()`

**Actions**:
- Updates payment transaction status to 'completed'
- Sets `completed_at` timestamp
- Logs the completion

---

#### 2. `payment_intent.succeeded`

Triggered when a payment intent succeeds.

**Handler**: `handle_payment_intent_succeeded()`
- Updates payment transaction if found by payment_intent_id

---

#### 3. `payment_intent.payment_failed`

Triggered when a payment intent fails.

**Handler**: `handle_payment_intent_failed()`
- Updates payment transaction status to 'failed'

---

### Webhook Setup

1. **In Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Add endpoint: `http://your-domain.com/api/payments/webhook/`
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy webhook signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`

2. **Local Testing**:
   - Use Stripe CLI: `stripe listen --forward-to localhost:8000/api/payments/webhook/`
   - Copy webhook signing secret from CLI output

---

## File Structure

### Backend Files

```
Backend/
├── api/
│   ├── payment_views.py          # Main payment logic and API endpoints
│   ├── db.py                     # MongoDB helper functions for payments
│   └── urls.py                   # URL routing for payment endpoints
├── skillswap/
│   ├── settings.py               # Django settings (includes Stripe config)
│   └── settings_env.py           # Environment variable loading
├── validate_stripe_config.py     # Stripe configuration validation script
├── check_env.py                  # Environment variable checker
└── .env                          # Environment variables (not in git)
```

### Frontend Files

```
Frontend/
├── src/
│   ├── lib/
│   │   └── api.js                # API client with payment methods
│   └── app/
│       ├── dashboard/
│       │   ├── subscription/
│       │   │   ├── page.jsx      # Subscription management page
│       │   │   └── create/
│       │   │       └── page.jsx  # Checkout creation page
│       │   └── payments/
│       │       ├── success/
│       │       │   └── page.jsx  # Payment success page
│       │       └── cancel/
│       │           └──맹 page.jsx  # Payment cancel page
```

---

## Payment Flow

### Premium Payment Flow

1. **User initiates payment**:
   ```
   User → Clicks "Upgrade to Premium" button
   → Frontend: router.push('/dashboard/subscription/create')
   ```

2. **Create checkout session**:
   ```
   Frontend → POST /api/payments/premium/create-checkout/
   → Backend: Validates user, checks for existing premium
   → Backend: Creates Stripe customer (if needed)
   → Backend: Creates Stripe Checkout Session (mode='payment')
   → Backend: Creates payment transaction (status='pending')
   → Backend: Returns checkout URL
   ```

3. **User completes payment**:
   ```
   Frontend → Redirects to Stripe Checkout URL
   → User enters card details
   → User submits payment
   → Stripe processes payment
   ```

4. **Webhook updates status**:
   ```
   Stripe → POST /api/payments/webhook/
   → Event: checkout.session.completed
   → Backend: handle_premium_payment_completed()
   → Backend: Updates payment status to 'completed'
   → Backend: Sets completed_at timestamp
   ```

5. **User redirected**:
   ```
   Stripe → Redirects to success_url
   → Frontend: /dashboard/payments/success
   → User sees success message
   ```

### Tip Payment Flow

Similar to premium payment, but:
- Requires `to_user_id` parameter
- Amount is variable (validated: $1-$1000)
- Creates tip transaction type

---

## Error Handling

### Backend Error Responses

#### 400 Bad Request
- User already has premium access
- Invalid tip amount (outside $1-$1000 range)
- Invalid user ID format

#### 404 Not Found
- User not found in MongoDB
- Recipient user not found (for tips)

#### 500 Internal Server Error
- Stripe API errors
- Database errors
- Configuration errors

### Frontend Error Handling

**File**: `Frontend/src/lib/api.js`

- Axios interceptors handle 401 (token refresh)
- Error messages displayed via toast notifications
- Automatic redirect on authentication errors

**Example**:
```javascript
try {
  const { url } = await paymentAPI.createPremiumCheckout(...);
  window.location.href = url;
} catch (error) {
  toast({
    title: 'Error',
    description: error.message || 'Failed to start checkout process',
    variant: 'destructive',
  });
}
```

---

## Testing

### Test Cards (Stripe Test Mode)

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**Expiry**: Any future date (e.g., `12/34`)
**CVC**: Any 3 digits (e.g., `123`)
**ZIP**: Any 5 digits (e.g., `12345`)

### Testing Checklist

- [ ] Create premium checkout session
- [ ] Prevent duplicate premium purchases
- [ ] Complete payment with test card
- [ ] Webhook updates payment status
- [ ] Premium status check returns correct value
- [ ] Tip checkout creation
- [ ] Tip history retrieval
- [ ] Error handling (invalid amounts, missing users)
- [ ] Authentication required for all endpoints

### Manual Testing Steps

1. **Start Backend**:
   ```bash
   cd Backend
   python manage.py runserver
   ```

2. **Start Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Test Premium Payment**:
   - Login to application
   - Navigate to `/dashboard/subscription`
   - Click "Upgrade to Premium"
   - Complete payment with test card `4242 4242 4242 4242`
   - Verify redirect to success page
   - Check premium status is `true`

4. **Test Webhook** (Local):
   ```bash
   stripe listen --forward-to localhost:8000/api/payments/webhook/
   ```
   - Copy webhook signing secret to `.env`
   - Payments will trigger webhooks automatically

---

## Stripe Dashboard

### Required Setup

1. **API Keys**:
   - Get from: https://dashboard.stripe.com/test/apikeys
   - Add to `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`

2. **Webhooks**:
   - Create endpoint: `/api/payments/webhook/`
   - Select events: `checkout.session.completed`, `payment_intent.*`
   - Copy signing secret to `.env`: `STRIPE_WEBHOOK_SECRET`

3. **Test Mode**:
   - Ensure "Test mode" toggle is ON
   - Use test API keys (start with `sk_test_` and `pk_test_`)

---

## API Reference Summary

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/premium/create-checkout/` | Create premium checkout | Yes |
| GET | `/api/payments/subscription/status/` | Get premium status | Yes |
| POST | `/api/payments/tip/create/` | Create tip checkout | Yes |
| GET | `/api/payments/tip/history/` | Get tip history | Yes |
| POST | `/api/payments/webhook/` | Stripe webhook handler | No (signature) |

---

## Configuration Files

### Backend

- `Backend/api/payment_views.py` - Payment API endpoints and logic
- `Backend/api/db.py` - MongoDB payment transaction helpers
- `Backend/api/urls.py` - URL routing
- `Backend/skillswap/settings.py` - Stripe configuration
- `Backend/skillswap/settings_env.py` - Environment variable loaders

### Frontend

- `Frontend/src/lib/api.js` - Payment API client
- `Frontend/src/app/dashboard/subscription/page.jsx` - Subscription page
- `Frontend/src/app/dashboard/subscription/create/page.jsx` - Checkout creation
- `Frontend/src/app/dashboard/payments/success/page.jsx` - Success page
- `Frontend/src/app/dashboard/payments/cancel/page.jsx` - Cancel page

---

## Security Considerations

1. **Authentication**: All payment endpoints require JWT authentication
2. **Webhook Verification**: Stripe webhook signature verification prevents unauthorized requests
3. **Input Validation**: Amounts, user IDs, and URLs are validated
4. **HTTPS**: Production should use HTTPS for all payment endpoints
5. **API Keys**: Never expose `STRIPE_SECRET_KEY` in frontend code

---

## Troubleshooting

### Common Issues

1. **"User not found in MongoDB"**
   - Ensure user profile exists in MongoDB
   - Check `django_user_id` mapping

2. **"Stripe error: Invalid API key"**
   - Verify `STRIPE_SECRET_KEY` in `.env`
   - Ensure using test keys in test mode

3. **"Webhook secret not configured"**
   - Add `STRIPE_WEBHOOK_SECRET` to `.env`
   - Optional for local development

4. **"User already has premium access"**
   - User has completed premium payment
   - Check `payments` collection for completed premium transaction

5. **Payment status not updating**
   - Verify webhook is configured correctly
   - Check webhook events are being received
   - Review backend logs for webhook processing

---

## Future Enhancements

- Payment refunds for premium purchases
- Payment history page with filtering
- Admin dashboard for payment analytics
- Email notifications on payment completion
- Support for multiple currencies
- Discount codes/promotional pricing

---

## Related Documentation

- `Backend/STRIPE_SETUP.md` - Stripe setup guide
- `Backend/COMPLETE_PAYMENT_FLOW.md` - Payment flow details
- `Backend/validate_stripe_config.py` - Configuration validator

---

**Last Updated**: January 2025
**Payment Type**: One-Time Payment (Stripe Checkout)
**Version**: 1.0

=======
# Complete Payment Gateway Documentation

## Overview

SkillSwap uses **Stripe** as the payment gateway for one-time premium payments and tip/donation transactions. The system uses Stripe Checkout Sessions in payment mode (one-time payments) for premium upgrades, and supports tips between users.

**Payment Type**: One-Time Payment (Not Subscription)
**Premium Price**: $9.99 USD
**Currency**: USD

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend APIs](#backend-apis)
3. [Frontend Implementation](#frontend-implementation)
4. [Database Schema](#database-schema)
5. [Environment Configuration](#environment-configuration)
6. [Webhook Events](#webhook-events)
7. [File Structure](#file-structure)
8. [Payment Flow](#payment-flow)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Architecture Overview

### Payment Flow

```
User clicks "Upgrade" 
  ↓
Frontend: /dashboard/subscription/create
  ↓
Backend: POST /api/payments/premium/create-checkout/
  ↓
Stripe: Create Checkout Session (payment mode)
  ↓
User redirected to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe Webhook: checkout.session.completed
  ↓
Backend: Update payment status to 'completed'
  ↓
User redirected to success page
  ↓
User has premium access
```

### Technology Stack

- **Backend**: Django REST Framework
- **Frontend**: Next.js 15 (React)
- **Payment Gateway**: Stripe API
- **Database**: MongoDB (payment transactions)
- **Authentication**: JWT (Bearer tokens)

---

## Backend APIs

### Base URL
```
http://localhost:8000/api
```

### Authentication
All payment endpoints require authentication via JWT token:
```
Authorization: Bearer <access_token>
```

---

### 1. Create Premium Payment Checkout

**Endpoint**: `POST /api/payments/premium/create-checkout/`

**Description**: Creates a Stripe Checkout Session for one-time premium payment ($9.99).

**Request Body**:
```json
{
  "success_url": "http://localhost:3000/dashboard/payments/success",
  "cancel_url": "http://localhost:3000/dashboard/payments/cancel"
}
```

**Response** (Success - 200):
```json
{
  "session_id": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxxghtml#fidkdWxOYHwnPyd1blpxYHZxWjUrbanRjRkVgdk1SaGNHanxPXXVzUXxUdkpcc2NNcWZ0cXZNXGFKYXxPfGpTQmsxfF9UZnxwQ2NnSGFkU2pzQmJRfGN3ZHB3XWtWYWEzfHZdbW5NdV1qU2VtZCVyQXZwdUl4JSUl"
}
```

**Response** (Error - 400):
```json
{
  "error": "User already has premium access"
}
```

**Response** (Error - 404):
```json
{
  "error": "User not found in MongoDB",
  "message": "Please ensure your profile is properly set up"
}
```

**Response** (Error - 500):
```json
{
  "error": "Stripe error: <error_message>",
  "message": "Please check your Stripe configuration"
}
```

**Implementation**: `Backend/api/payment_views.py::create_premium_payment_checkout_view()`

---

コンパイ: 2. Get Premium Status

**Endpoint**: `GET /api/payments/subscription/status/`

**Description**: Gets the current user's premium status (checks for completed premium payments).

**Response** (Success - 200):
```json
{
  "is_premium": true,
  "status": "active",
  "subscription": {
    "plan_type": "premium",
    "current_period_end": null,
    "current_period_start": "2025-01-29T12:00:00",
    "cancel_at_period_end": false
  }
}
```

**Response** (Not Premium - 200):
```json
{
  "is_premium": false,
  "status": "none",
  "subscription": null
}
```

**Implementation**: `Backend/api/payment_views.py::get_subscription_status_view()`

---

### 3. Create Tip Checkout

**Endpoint**: `POST /api/payments/tip/create/`

**Description**: Creates a Stripe Checkout Session for tipping another user.

**Request Body**:
```json
{
  "to_user_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "amount": 10.00,
  "message": "Thank you for the great session!",
  "success_url": "http://localhost:3000/dashboard/payments/success",
  "cancel_url": "http://localhost:3000/dashboard/payments/cancel"
}
```

**Response** (Success - 200):
```json
{
  "session_id": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

**Validation**:
- Amount must be between $1.00 and $1000.00
- to_user_id must be a valid MongoDB ObjectId

**Implementation**: `Backend/api/payment_views.py::create_tip_checkout_view()`

---

### 4. Get Tip History

**Endpoint**: `GET /api/payments/tip/history/`

**Description**: Gets tip history for the current user (both sent and received).

**Response** (Success - 200):
```json
{
  "tips_sent": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "from_user_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "to_user_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "amount": 10.00,
      "status": "completed",
      "created_at": "2025-01-29T12:00:00"
    }
  ],
  "tips_received": [],
  "total_sent": 1,
  "total_received": 0
}
```

**Implementation**: `Backend/api/payment_views.py::get_tip_history_view()`

---

### 5. Stripe Webhook Handler

**Endpoint**: `POST /api/payments/webhook/`

**Description**: Handles Stripe webhook events for payment status updates.

**Authentication**: Uses Stripe webhook signature verification (not JWT)

**Headers Required**:
```
Stripe-Signature: <signature>
```

**Supported Events**:
- `checkout.session.completed` - Payment completed
- `payment_intent.succeeded` - Payment intent succeeded
- `payment_intent.payment_failed` - Payment failed
- `customer.subscription.updated` - Subscription updated (legacy)
- `customer.subscription.deleted` - Subscription deleted (legacy)

**Response**:
```json
{
  "status": "success"
}
```

**Implementation**: `Backend/api/payment_views.py::stripe_webhook_view()`

---

## Frontend Implementation

### API Client

**File**: `Frontend/src/lib/api.js`

**Methods**:
```javascript
// Premium payment methods (one-time payment)
paymentAPI.createPremiumCheckout(successUrl, cancelUrl)
  → Returns: { session_id, url }

// Legacy method for backwards compatibility
paymentAPI.createSubscriptionCheckout(successUrl, cancelUrl)
  → Calls createPremiumCheckout()

// Get premium status
paymentAPI.getSubscriptionStatus()
  → Returns: { is_premium, status, subscription }

// Tip methods
paymentAPI.createTipCheckout(toUserId, amount, message, successUrl, cancelUrl)
  → Returns: { session_id, url }

paymentAPI.getTipHistory()
  → Returns: { tips_sent, tips_received, total_sent, total_received }
```

### Pages

#### 1. Subscription Page
**File**: `Frontend/src/app/dashboard/subscription/page.jsx`

**Features**:
- Displays current premium status
- Shows plan benefits (Free vs Premium)
- "Upgrade to Premium" button (one-time $9.99)
- "Manage Subscription" button (if premium)

**Route**: `/dashboard/subscription`

---

#### 2. Create Checkout Page
**File**: `Frontend/src/app/dashboard/subscription/create/page.jsx`

**Features**:
- Loading state while creating checkout session
- Error handling and display
- Automatic redirect to Stripe Checkout
- Redirects back to subscription page on error

**Route**: `/dashboard/subscription/create`

**Flow**:
1. Page loads → Calls `createPremiumCheckout()`
2. Receives checkout URL → Redirects to Stripe
3. On error → Shows error message and redirects back

---

#### ้3. Payment Success Page
**File**: `Frontend/src/app/dashboard/payments/success/page.jsx`

**Features**:
- Success confirmation
- Displays session ID
- "Go to Subscription Settings" button

**Route**: `/dashboard/payments/success`

---

#### 4. Payment Cancel Page
**File**: `Frontend/src/app/dashboard/payments/cancel/page.jsx`

**Features**:
- Cancellation confirmation
- Options to go back or return to dashboard

**Route**: `/dashboard/payments/cancel`

---

## Database Schema

### MongoDB Collections

#### 1. payments Collection

Stores all payment transactions (premium and tips).

**Schema**:
```javascript
{
  _id: ObjectId,
  transaction_type: String,      // 'premium' | 'tip' | 'subscription' (leg割
  from_user_id: ObjectId,         // User who paid
  to_user_id: ObjectId,           // User who received (null for premium)
  amount: Number,                 // Amount in USD (e.g., 9.99)
  currency: String,               // 'usd'
  stripe_payment_intent_id: String,  // Stripe payment intent ID (optional)
  stripe_session_id: String,      // Stripe checkout session ID
  status: String,                 // 'pending' | 'completed' | 'failed' | 'refunded'
  metadata: Object,               // Additional metadata
  created_at: Date,
  completed_at: Date              // Set when status becomes 'completed'
}
```

**Indexes**:
- `from_user_id` + `transaction_type` + `status`
- `stripe_session_id`
- `created_at` (for sorting)

**Helper Functions**: `Backend/api/db.py`
- `create_payment_transaction()` - Create new payment record
- `update_payment_transaction_status()` - Update payment status
- `get_user_payment_history()` - Get user's payment history
- `get_user_tips_received()` - Get tips received
- `get_user_tips_given()` - Get tips given

---

#### 2. subscriptions Collection (Legacy)

Stores subscription records (legacy, kept for compatibility).

**Schema**:
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  stripe_customer_id: String,
  stripe_subscription_id: String,
  plan_type: String,              // 'premium'
  status: String,                 // 'active' | 'canceled' | 'past_due'
  current_period_start: Date,
  current_period_end: Date,
  cancel_at_period_end: Boolean,
  created_at: Date,
  updated_at: Date
}
```

**Note**: Current implementation uses one-time payments instead of subscriptions. Premium status is determined by completed payments in the `payments` collection.

---

## Environment Configuration

### Required Environment Variables

**File**: `Backend/.env`

```env
# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Optional for local dev

# Note: STRIPE_PRICE_ID is no longer required for one-time payments
# (Previously used for subscriptions, kept in settings for compatibility)
```

### Configuration Loading

**File**: `Backend/skillswap/settings.py`
```python
STRIPE_SECRET_KEY = get_stripe_secret_key()
STRIPE_PUBLISHABLE_KEY = get_stripe_publishable_key()
STRIPE_WEBHOOK_SECRET = get_stripe_webhook_secret()
```

**File**: `Backend/skillswap/settings_env.py`
- `get_stripe_secret_key()` - Loads from .env
- `get_stripe_publishable_key()` - Loads from .env
- `get_stripe_webhook_secret()` 's - Loads from .env (optional)

### Frontend Environment

**File**: `Frontend/.env.local` (optional)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Default**: `http://localhost:8000/api`

---

## Webhook Events

### Event Handlers

**File**: `Backend/api/payment_views.py`

#### 1. `checkout.session.completed`

Triggered when a checkout session is completed.

**Handler**: Checks `session.mode` and `session.metadata.type`
- If `mode == 'payment'` and `type == 'premium'` → `handle_premium_payment_completed()`
- If `mode == 'payment'` and `type == 'tip'` → `handle_tip_payment_completed()`

**Actions**:
- Updates payment transaction status to 'completed'
- Sets `completed_at` timestamp
- Logs the completion

---

#### 2. `payment_intent.succeeded`

Triggered when a payment intent succeeds.

**Handler**: `handle_payment_intent_succeeded()`
- Updates payment transaction if found by payment_intent_id

---

#### 3. `payment_intent.payment_failed`

Triggered when a payment intent fails.

**Handler**: `handle_payment_intent_failed()`
- Updates payment transaction status to 'failed'

---

### Webhook Setup

1. **In Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Add endpoint: `http://your-domain.com/api/payments/webhook/`
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy webhook signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`

2. **Local Testing**:
   - Use Stripe CLI: `stripe listen --forward-to localhost:8000/api/payments/webhook/`
   - Copy webhook signing secret from CLI output

---

## File Structure

### Backend Files

```
Backend/
├── api/
│   ├── payment_views.py          # Main payment logic and API endpoints
│   ├── db.py                     # MongoDB helper functions for payments
│   └── urls.py                   # URL routing for payment endpoints
├── skillswap/
│   ├── settings.py               # Django settings (includes Stripe config)
│   └── settings_env.py           # Environment variable loading
├── validate_stripe_config.py     # Stripe configuration validation script
├── check_env.py                  # Environment variable checker
└── .env                          # Environment variables (not in git)
```

### Frontend Files

```
Frontend/
├── src/
│   ├── lib/
│   │   └── api.js                # API client with payment methods
│   └── app/
│       ├── dashboard/
│       │   ├── subscription/
│       │   │   ├── page.jsx      # Subscription management page
│       │   │   └── create/
│       │   │       └── page.jsx  # Checkout creation page
│       │   └── payments/
│       │       ├── success/
│       │       │   └── page.jsx  # Payment success page
│       │       └── cancel/
│       │           └──맹 page.jsx  # Payment cancel page
```

---

## Payment Flow

### Premium Payment Flow

1. **User initiates payment**:
   ```
   User → Clicks "Upgrade to Premium" button
   → Frontend: router.push('/dashboard/subscription/create')
   ```

2. **Create checkout session**:
   ```
   Frontend → POST /api/payments/premium/create-checkout/
   → Backend: Validates user, checks for existing premium
   → Backend: Creates Stripe customer (if needed)
   → Backend: Creates Stripe Checkout Session (mode='payment')
   → Backend: Creates payment transaction (status='pending')
   → Backend: Returns checkout URL
   ```

3. **User completes payment**:
   ```
   Frontend → Redirects to Stripe Checkout URL
   → User enters card details
   → User submits payment
   → Stripe processes payment
   ```

4. **Webhook updates status**:
   ```
   Stripe → POST /api/payments/webhook/
   → Event: checkout.session.completed
   → Backend: handle_premium_payment_completed()
   → Backend: Updates payment status to 'completed'
   → Backend: Sets completed_at timestamp
   ```

5. **User redirected**:
   ```
   Stripe → Redirects to success_url
   → Frontend: /dashboard/payments/success
   → User sees success message
   ```

### Tip Payment Flow

Similar to premium payment, but:
- Requires `to_user_id` parameter
- Amount is variable (validated: $1-$1000)
- Creates tip transaction type

---

## Error Handling

### Backend Error Responses

#### 400 Bad Request
- User already has premium access
- Invalid tip amount (outside $1-$1000 range)
- Invalid user ID format

#### 404 Not Found
- User not found in MongoDB
- Recipient user not found (for tips)

#### 500 Internal Server Error
- Stripe API errors
- Database errors
- Configuration errors

### Frontend Error Handling

**File**: `Frontend/src/lib/api.js`

- Axios interceptors handle 401 (token refresh)
- Error messages displayed via toast notifications
- Automatic redirect on authentication errors

**Example**:
```javascript
try {
  const { url } = await paymentAPI.createPremiumCheckout(...);
  window.location.href = url;
} catch (error) {
  toast({
    title: 'Error',
    description: error.message || 'Failed to start checkout process',
    variant: 'destructive',
  });
}
```

---

## Testing

### Test Cards (Stripe Test Mode)

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

**Expiry**: Any future date (e.g., `12/34`)
**CVC**: Any 3 digits (e.g., `123`)
**ZIP**: Any 5 digits (e.g., `12345`)

### Testing Checklist

- [ ] Create premium checkout session
- [ ] Prevent duplicate premium purchases
- [ ] Complete payment with test card
- [ ] Webhook updates payment status
- [ ] Premium status check returns correct value
- [ ] Tip checkout creation
- [ ] Tip history retrieval
- [ ] Error handling (invalid amounts, missing users)
- [ ] Authentication required for all endpoints

### Manual Testing Steps

1. **Start Backend**:
   ```bash
   cd Backend
   python manage.py runserver
   ```

2. **Start Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Test Premium Payment**:
   - Login to application
   - Navigate to `/dashboard/subscription`
   - Click "Upgrade to Premium"
   - Complete payment with test card `4242 4242 4242 4242`
   - Verify redirect to success page
   - Check premium status is `true`

4. **Test Webhook** (Local):
   ```bash
   stripe listen --forward-to localhost:8000/api/payments/webhook/
   ```
   - Copy webhook signing secret to `.env`
   - Payments will trigger webhooks automatically

---

## Stripe Dashboard

### Required Setup

1. **API Keys**:
   - Get from: https://dashboard.stripe.com/test/apikeys
   - Add to `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`

2. **Webhooks**:
   - Create endpoint: `/api/payments/webhook/`
   - Select events: `checkout.session.completed`, `payment_intent.*`
   - Copy signing secret to `.env`: `STRIPE_WEBHOOK_SECRET`

3. **Test Mode**:
   - Ensure "Test mode" toggle is ON
   - Use test API keys (start with `sk_test_` and `pk_test_`)

---

## API Reference Summary

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/premium/create-checkout/` | Create premium checkout | Yes |
| GET | `/api/payments/subscription/status/` | Get premium status | Yes |
| POST | `/api/payments/tip/create/` | Create tip checkout | Yes |
| GET | `/api/payments/tip/history/` | Get tip history | Yes |
| POST | `/api/payments/webhook/` | Stripe webhook handler | No (signature) |

---

## Configuration Files

### Backend

- `Backend/api/payment_views.py` - Payment API endpoints and logic
- `Backend/api/db.py` - MongoDB payment transaction helpers
- `Backend/api/urls.py` - URL routing
- `Backend/skillswap/settings.py` - Stripe configuration
- `Backend/skillswap/settings_env.py` - Environment variable loaders

### Frontend

- `Frontend/src/lib/api.js` - Payment API client
- `Frontend/src/app/dashboard/subscription/page.jsx` - Subscription page
- `Frontend/src/app/dashboard/subscription/create/page.jsx` - Checkout creation
- `Frontend/src/app/dashboard/payments/success/page.jsx` - Success page
- `Frontend/src/app/dashboard/payments/cancel/page.jsx` - Cancel page

---

## Security Considerations

1. **Authentication**: All payment endpoints require JWT authentication
2. **Webhook Verification**: Stripe webhook signature verification prevents unauthorized requests
3. **Input Validation**: Amounts, user IDs, and URLs are validated
4. **HTTPS**: Production should use HTTPS for all payment endpoints
5. **API Keys**: Never expose `STRIPE_SECRET_KEY` in frontend code

---

## Troubleshooting

### Common Issues

1. **"User not found in MongoDB"**
   - Ensure user profile exists in MongoDB
   - Check `django_user_id` mapping

2. **"Stripe error: Invalid API key"**
   - Verify `STRIPE_SECRET_KEY` in `.env`
   - Ensure using test keys in test mode

3. **"Webhook secret not configured"**
   - Add `STRIPE_WEBHOOK_SECRET` to `.env`
   - Optional for local development

4. **"User already has premium access"**
   - User has completed premium payment
   - Check `payments` collection for completed premium transaction

5. **Payment status not updating**
   - Verify webhook is configured correctly
   - Check webhook events are being received
   - Review backend logs for webhook processing

---

## Future Enhancements

- Payment refunds for premium purchases
- Payment history page with filtering
- Admin dashboard for payment analytics
- Email notifications on payment completion
- Support for multiple currencies
- Discount codes/promotional pricing

---

## Related Documentation

- `Backend/STRIPE_SETUP.md` - Stripe setup guide
- `Backend/COMPLETE_PAYMENT_FLOW.md` - Payment flow details
- `Backend/validate_stripe_config.py` - Configuration validator

---

**Last Updated**: January 2025
**Payment Type**: One-Time Payment (Stripe Checkout)
**Version**: 1.0

>>>>>>> c1d12894fcd46bb09e5ff2c906f091ee1d1b5f64
