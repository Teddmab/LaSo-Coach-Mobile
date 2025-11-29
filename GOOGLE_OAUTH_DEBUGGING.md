# Google OAuth Redirect URI Mismatch - Debugging Guide

## Current Issue
- Error: `Error 400: redirect_uri_mismatch`
- Redirect URI in code: `https://auth.expo.io/@teddmabulay/laso-coach`
- Redirect URI in Google Cloud Console: `https://auth.expo.io/@teddmabulay/laso-coach`

## Possible Causes

### 1. URL Encoding Issues
The redirect_uri might be URL-encoded differently than expected. Check the logs for:
- `🔍 OAuth URL redirect_uri parameter (encoded):`
- `🔍 OAuth URL redirect_uri parameter (decoded):`

### 2. Hidden Characters
There might be hidden characters (spaces, special characters) in Google Cloud Console. Try:
1. Delete the redirect URI in Google Cloud Console
2. Type it fresh (don't copy-paste)
3. Save and wait 2-3 minutes

### 3. OAuth Consent Screen
Make sure the OAuth consent screen is **published** (not just saved):
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Check if it says "Published" (not "Testing")
3. If testing, add your email to test users

### 4. Multiple OAuth Clients
Make sure you're editing the **correct** OAuth client:
- Web Client ID: `855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com`

## Testing with USB-Connected Tablet

### Setup Steps:
1. **Connect tablet via USB**
2. **Enable USB debugging** on tablet:
   - Settings → About tablet → Tap "Build number" 7 times
   - Settings → Developer options → Enable "USB debugging"
3. **Authorize computer** when prompted on tablet
4. **Verify connection**:
   ```bash
   adb devices
   ```
   Should show your tablet

5. **Start Expo**:
   ```bash
   npx expo start
   ```

6. **Open app on tablet** via Expo Go (scan QR code or press 'a' for Android)

7. **Capture logs**:
   ```bash
   adb logcat | findstr /i "google oauth redirect expo"
   ```
   Or for all logs:
   ```bash
   adb logcat > oauth_logs.txt
   ```

## What to Look For in Logs

When you click "Google Sign In", look for:
1. `🔍 OAuth URL redirect_uri parameter (decoded):` - Should match exactly
2. `❌ OAuth Error Details:` - Will show the exact error from Google
3. `📬 Google OAuth result:` - Full OAuth response

## Alternative: Check Browser Network Tab

If testing on web or if you can intercept the OAuth request:
1. Open Chrome DevTools → Network tab
2. Click "Google Sign In"
3. Look for the request to `accounts.google.com/o/oauth2/v2/auth`
4. Check the `redirect_uri` parameter in the URL
5. Compare it exactly with what's in Google Cloud Console

## Quick Fix to Try

1. **Remove and re-add redirect URI** in Google Cloud Console:
   - Delete: `https://auth.expo.io/@teddmabulay/laso-coach`
   - Wait 1 minute
   - Add it back exactly: `https://auth.expo.io/@teddmabulay/laso-coach`
   - Save
   - Wait 2-3 minutes for propagation

2. **Check for trailing spaces** - Make sure there are no spaces before or after the URI

3. **Verify case sensitivity** - Make sure it's exactly:
   - `https://auth.expo.io/@teddmabulay/laso-coach`
   - NOT `https://auth.expo.io/@Teddmabulay/laso-coach` (capital T)
   - NOT `https://auth.expo.io/@teddmabulay/Laso-Coach` (capital L, C)

## Next Steps

1. Test with USB-connected tablet to get detailed ADB logs
2. Check the decoded redirect_uri parameter in the logs
3. Compare it character-by-character with Google Cloud Console
4. If still failing, try removing and re-adding the redirect URI

