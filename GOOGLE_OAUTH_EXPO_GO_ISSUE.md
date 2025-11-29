# Google OAuth with Expo Go - Proxy Redirect Issue

## Current Issue
- OAuth flow starts successfully
- User can select Google account
- Google redirects to `auth.expo.io` successfully
- But Expo's proxy fails to redirect back to the app
- Result: `type: "dismiss"` with no parameters
- User sees "Something went wrong trying to finish signing in" on auth.expo.io

## Root Cause
This is a known limitation with Expo Go and the auth proxy. When using `useProxy: true` with Expo Go, the proxy tries to redirect back to the app using a deep link, but Expo Go sometimes fails to handle this redirect properly, especially when:
- The app goes to background during the OAuth flow
- There's a delay in the redirect
- The app loses focus

## Solutions

### Option 1: Use Development Build (Recommended)
Build a development client instead of using Expo Go:
```bash
npx eas build -p android --profile development
```

This will:
- Use native OAuth flows (no proxy needed)
- More reliable redirect handling
- Better performance
- Access to all native features

### Option 2: Try Alternative Approach
If you must use Expo Go, try:
1. Keep the app in foreground during OAuth flow
2. Don't switch apps while OAuth is processing
3. Ensure good network connection
4. Try clearing Expo Go cache and restarting

### Option 3: Manual Code Exchange (Advanced)
Instead of using `useIdTokenAuthRequest`, use `useAuthRequest` and manually exchange the authorization code for an ID token. This gives more control but is more complex.

## Current Status
- ✅ Redirect URI is correct: `https://auth.expo.io/@teddmabulay/laso-coach`
- ✅ Web client ID is being used correctly
- ✅ OAuth URL is correct
- ❌ Expo proxy redirect back to app is failing

## Next Steps
1. **Recommended**: Build a development client for more reliable OAuth
2. **Alternative**: Try keeping app in foreground and ensure stable network
3. **Debug**: Check if deep link handling is working properly in Expo Go

