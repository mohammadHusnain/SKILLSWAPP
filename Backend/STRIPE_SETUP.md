# Stripe Payment Gateway Setup

This guide will help you set up Stripe for the subscription payment gateway.

## Step 1: Get Your Stripe Test API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test API keys**:
   - **Publishable key**: `pk_test_xxxxxxxxxxxxx`
   - **Secret key**: `sk_test_xxxxxxxxxxxxx`

## Step 2: Create a Product and Price

1. Go to [Products](https://dashboard.stripe.com/test/products) in Stripe Dashboard
2. Click **"+ Add product"**
3. Fill in the product details:
   - **Name**: Premium Plan
   - **Description**: Premium subscription for SkillSwap
4. Under **Pricing**, select **Recurring**
5. Set the price:
   - **Price**: $9.99
   - **Billing period**: Monthly
   - **Currency**: USD
6. Click **Save product**

## Step 3: Get Your Price ID

1. After creating the product, click on it to view details
2. Find the **Price ID** (format: `price_xxxxxxxxxxxxx`)
3. Copy this ID - you'll need it for the `.env` file

## Step 4: Configure Environment Variables

1. Create a `.env` file in the `Backend` directory (if you don't have one):
   ```bash
   cd Backend
   cp env.example .env
   ```

2. Edit the `.env` file and add your Stripe credentials:
   ```env
   # Stripe Settings (Test Mode)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_PRICE_ID=price_your_test_price_id_here
   STRIPE_WEBHOOK_SECRET=  # Optional for local development
   ```

3. Replace the placeholders with your actual values:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key from Step 1
   - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key from Step 1
   - `STRIPE_PRICE_ID`: The Price ID you copied in Step 3

## Step 5: Restart the Backend Server

After updating the `.env` file, restart your Django backend server:

```bash
# In the Backend directory
python manage.py runserver
```

## Testing the Payment Flow

1. **Go to the Subscription Page**
   - Navigate to `/dashboard/subscription` in your frontend app

2. **Click "Upgrade to Premium"**
   - This will redirect you to Stripe Checkout

3. **Use Stripe Test Card**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Complete the Payment**
   - Submit the payment
   - You'll be redirected back to the success page

## Troubleshooting

### Error: "No such price: 'price_test_default'"
- **Solution**: Make sure you've added the `STRIPE_PRICE_ID` to your `.env` file

### Error: "Invalid API Key"
- **Solution**: Check that your Stripe keys are in test mode (start with `sk_test_` and `pk_test_`)

### Error: "Price not found"
- **Solution**: Verify that the Price ID you added matches exactly what's in Stripe Dashboard (no extra spaces)

## Additional Resources

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Dashboard](https://dashboard.stripe.com/test)
- [Stripe Documentation](https://stripe.com/docs)

## Notes

- The backend runs in **test mode** by default
- Test payments won't charge real money
- For production, you'll need to use **live mode** API keys and set up webhook endpoints
