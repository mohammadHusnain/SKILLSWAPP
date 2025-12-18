# Admin Login Persistence - Debugging Guide

## Changes Made

### 1. Improved Response Interceptor (`adminApi.js`)
- Added better error handling for network errors
- Added console logging to track when logout is triggered
- Made the interceptor less aggressive about logging out

### 2. Enhanced Login Function (`adminApi.js`)
- Added detailed console logging for:
  - Login attempts
  - API responses
  - Token storage
  - Token verification
- This will help identify if the token is being stored correctly

### 3. Improved Admin Layout Auth Check (`admin/layout.js`)
- Added console logging for:
  - Path being checked
  - Token existence
  - Authorization decisions
- Reordered logic to set loading state before redirect

## How to Debug

### Step 1: Open Browser Console
1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Clear any existing logs

### Step 2: Attempt Admin Login
1. Navigate to `http://localhost:3000/admin/login`
2. Enter credentials: `admin@skillswap.com` / `AdminSecret123!`
3. Click "Secure Login"

### Step 3: Check Console Logs
You should see logs in this order:

```
Admin login attempt for: admin@skillswap.com
Admin login response: {access: "...", user: {...}}
Admin token stored successfully
Verified stored token exists: true
Admin layout checking auth for path: /admin/dashboard
Admin token exists: true
Admin token found, authorizing access
```

### Step 4: Check localStorage
1. In DevTools, go to Application tab
2. Expand "Local Storage"
3. Click on your localhost URL
4. Look for `admin_access_token` key
5. Verify it has a JWT value

## Possible Issues and Solutions

### Issue 1: Token Not Being Stored
**Symptoms:** Console shows "No access token in response"
**Solution:** Check backend response format - it should return `{access: "token"}`

### Issue 2: Token Stored But Immediately Cleared
**Symptoms:** Token appears then disappears from localStorage
**Solution:** Check if any API call is returning 401/403 immediately after login

### Issue 3: Infinite Redirect Loop
**Symptoms:** Page keeps redirecting between login and dashboard
**Solution:** Check if the layout is running multiple times (React strict mode)

### Issue 4: Network Error on API Calls
**Symptoms:** Console shows "Admin API Network Error"
**Solution:** Verify backend is running on `http://localhost:8000`

## Expected Behavior

After successful login:
1. Token should be stored in localStorage as `admin_access_token`
2. User should be redirected to `/admin/dashboard`
3. Dashboard should load with sidebar visible
4. Token should persist across page refreshes
5. Logout button in sidebar should clear token and redirect to login

## Logout Button Location

The logout button is already present in the AdminSidebar component at the bottom, styled with:
- Red text color (destructive variant)
- Logout icon
- Full width button
- Located in the bottom section with border-top

No changes needed for logout button - it's already implemented correctly!
