# Google OAuth Redirect Mismatch Troubleshooting Guide

## Current Status
- **Error**: `Error 400: redirect_uri_mismatch`
- **Environment**: Expo Go (development)
- **Platform**: Android
- **Expected redirect**: `https://auth.expo.io/@teddmabulay/laso-coach`

## Root Cause Analysis
The redirect_uri_mismatch means Google is receiving a redirect URI that is NOT in your Web OAuth client's authorized redirect URIs list.

## CRITICAL: Verify Google Console Configuration

### Step 1: Check Web OAuth Client
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find and click: **"Client ID for Web application"** (ID ending in ...r239q8v3pq6r37156hddd7lrt6j5mfc2)
3. In **"Authorized redirect URIs"** section, verify you have EXACTLY:
   ```
   https://auth.expo.io/@teddmabulay/laso-coach
   ```
   ⚠️ **NO trailing slash**
   ⚠️ **Case-sensitive**
   ⚠️ **Must match EXACTLY**

### Step 2: Common Mistakes to Avoid
- ❌ `https://auth.expo.io/@teddmabulay/laso-coach/` (trailing slash)
- ❌ `https://auth.expo.io/@Teddmabulay/laso-coach` (capital T)
- ❌ `https://auth.expo.io/@teddmabulay/laso-coach/auth` (extra path)
- ✅ `https://auth.expo.io/@teddmabulay/laso-coach` (CORRECT)

### Step 3: Changes Propagation
After adding/editing redirect URIs:
- Save the changes
- Wait 1-2 minutes for propagation
- Clear Metro cache: `npx expo start -c`

## Current Client IDs in Use
```
Web: 855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com
Android: 855620848279-urs0dvsvoa45k74uhedk0odosfsfuh28.apps.googleusercontent.com
iOS: 855620848279-vsqoisa0hfcgb997ni1oubk7fnuk1nms.apps.googleusercontent.com
```

## Testing Checklist
1. ✅ Android OAuth client created with package `com.laso.coach` and correct SHA-1
2. ⏳ Web OAuth client redirect URI verified (DO THIS NOW)
3. ⏳ Test Google sign-in and capture new logs with 🚀 emoji
4. ⏳ Verify logs show `forcedRedirect: "https://auth.expo.io/@teddmabulay/laso-coach"`

## Next Steps If Still Failing
If mismatch persists after verifying redirect URI:
1. **Option A**: Screenshot your Web client's redirect URIs section
2. **Option B**: Try using only Android client ID (remove web/expo from config temporarily)
3. **Option C**: Build a development client instead of using Expo Go:
   ```powershell
   npx eas build -p android --profile development
   ```

## Expected Logs After Fix
When you trigger Google sign-in, you should see:
```
🧭 AuthSession environment { appOwnership: 'expo', isExpoGo: true, ... forcedRedirect: 'https://auth.expo.io/@teddmabulay/laso-coach' }
🔐 Google auth redirect URI (configured): https://auth.expo.io/@teddmabulay/laso-coach
🔐 Google client IDs (effective): { ... }
🚀 Google sign-in starting with config: { useProxy: true, redirectUri: 'https://auth.expo.io/@teddmabulay/laso-coach', ... }
📬 Google OAuth result: { type: 'success', ... }
```

If you see `type: 'error'` instead of `'success'`, send me the complete error details.
