"""
Quick script to check if Stripe environment variables are properly configured.
Run this before starting the server to ensure all required variables are set.
"""

import os
from dotenv import load_dotenv

load_dotenv()

def check_stripe_config():
    """Check if Stripe environment variables are configured."""
    print("Checking Stripe Configuration...\n")
    
    stripe_secret_key = os.getenv('STRIPE_SECRET_KEY', '')
    stripe_publishable_key = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
    stripe_price_id = os.getenv('STRIPE_PRICE_ID', '')
    
    # Check Secret Key
    if not stripe_secret_key:
        print("❌ STRIPE_SECRET_KEY is missing")
    elif stripe_secret_key.startswith('sk_test_') or stripe_secret_key.startswith('sk_live_'):
        print(f"✅ STRIPE_SECRET_KEY is set: {stripe_secret_key[:15]}...")
    else:
        print(f"⚠️  STRIPE_SECRET_KEY doesn't look valid: {stripe_secret_key[:20]}...")
    
    # Check Publishable Key
    if not stripe_publishable_key:
        print("❌ STRIPE_PUBLISHABLE_KEY is missing")
    elif stripe_publishable_key.startswith('pk_test_') or stripe_publishable_key.startswith('pk_live_'):
        print(f"✅ STRIPE_PUBLISHABLE_KEY is set: {stripe_publishable_key[:15]}...")
    else:
        print(f"⚠️  STRIPE_PUBLISHABLE_KEY doesn't look valid: {stripe_publishable_key[:20]}...")
    
    # Check Price ID
    if not stripe_price_id:
        print("❌ STRIPE_PRICE_ID is missing")
        print("   This is required for creating checkout sessions!")
        print("   See STRIPE_SETUP.md for instructions on how to set this up.")
    elif stripe_price_id.startswith('price_'):
        print(f"✅ STRIPE_PRICE_ID is set: {stripe_price_id}")
    elif stripe_price_id == 'price_test_default':
        print("⚠️  STRIPE_PRICE_ID is set to the default test value")
        print("   This won't work! Please set a real Stripe Price ID in your .env file.")
        print("   See STRIPE_SETUP.md for instructions.")
    else:
        print(f"⚠️  STRIPE_PRICE_ID doesn't look valid: {stripe_price_id}")
    
    print("\n" + "="*50)
    
    # Summary
    all_set = (
        stripe_secret_key and 
        stripe_publishable_key and 
        stripe_price_id and 
        stripe_price_id != 'price_test_default' and
        stripe_price_id.startswith('price_')
    )
    
    if all_set:
        print("✅ All Stripe configuration looks good!")
        print("You can now test the subscription payment flow.")
    else:
        print("❌ Stripe configuration is incomplete.")
        print("\nTo fix this:")
        print("1. Copy env.example to .env if you haven't already: cp env.example .env")
        print("2. Get your Stripe keys from: https://dashboard.stripe.com/test/apikeys")
        print("3. Create a product and price in: https://dashboard.stripe.com/test/products")
        print("4. Add STRIPE_PRICE_ID=price_xxxxx to your .env file")
        print("5. See STRIPE_SETUP.md for detailed instructions")
    
    return all_set

if __name__ == '__main__':
    check_stripe_config()
