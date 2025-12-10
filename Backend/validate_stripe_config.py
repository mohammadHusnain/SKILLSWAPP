"""
Quick validation script for Stripe configuration.
Run this to check if your Stripe setup is correct.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import settings
sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    
    # Load .env file
    env_path = Path(__file__).parent / '.env'
    load_dotenv(env_path)
    
    print("=" * 60)
    print("Stripe Configuration Checker")
    print("=" * 60)
    print()
    
    # Check STRIPE_PRICE_ID
    stripe_price_id = os.getenv('STRIPE_PRICE_ID', '')
    
    if not stripe_price_id:
        print("❌ STRIPE_PRICE_ID is MISSING in .env file")
        print()
        print("ACTION REQUIRED:")
        print("1. Open Backend/.env file")
        print("2. Add this line:")
        print("   STRIPE_PRICE_ID=price_your_actual_price_id")
        print()
    elif stripe_price_id.startswith('prod_'):
        print("❌ ERROR: You're using a PRODUCT ID, not a PRICE ID!")
        print(f"   Current value: {stripe_price_id}")
        print()
        print("WHAT'S WRONG:")
        print("  Product ID: prod_xxxxx  (WRONG - Don't use this)")
        print("  Price ID:   price_xxxxx  (CORRECT - Use this)")
        print()
        print("HOW TO FIX:")
        print("1. Go to: https://dashboard.stripe.com/test/products")
        print("2. Click on your product")
        print("3. Go to 'Pricing' tab")
        print("4. Copy the 'Price ID' (starts with 'price_...')")
        print("5. Update Backend/.env:")
        print(f"   Change: STRIPE_PRICE_ID={stripe_price_id}")
        print("   To:     STRIPE_PRICE_ID=price_your_new_price_id")
        print()
    elif stripe_price_id.startswith('price_'):
        print("✅ STRIPE_PRICE_ID looks correct!")
        print(f"   Value: {stripe_price_id}")
        print()
        print("You're ready to test the payment flow!")
        print()
    else:
        print("⚠️  STRIPE_PRICE_ID doesn't match expected format")
        print(f"   Value: {stripe_price_id}")
        print("   Expected: Should start with 'price_'")
        print()
    
    # Check other Stripe settings
    stripe_secret_key = os.getenv('STRIPE_SECRET_KEY', '')
    if stripe_secret_key and (stripe_secret_key.startswith('sk_test_') or stripe_secret_key.startswith('sk_live_')):
        print("✅ STRIPE_SECRET_KEY is configured")
    else:
        print("⚠️  STRIPE_SECRET_KEY may not be properly configured")
    
    stripe_pub_key = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
    if stripe_pub_key and (stripe_pub_key.startswith('pk_test_') or stripe_pub_key.startswith('pk_live_')):
        print("✅ STRIPE_PUBLISHABLE_KEY is configured")
    else:
        print("⚠️  STRIPE_PUBLISHABLE_KEY may not be properly configured")
    
    print()
    print("=" * 60)
    
except ImportError as e:
    print("Error: Could not import required modules")
    print(f"Error: {e}")
    print()
    print("Please run this from the Backend directory:")
    print("  python validate_stripe_config.py")

