# Google OAuth Testing Guide - Clean Session

## Problem
You're already logged into Google, so the OAuth flow auto-selects your account and immediately hits the redirect_uri_mismatch error before you can see the full flow.

## Solution: Force Account Selection

### Option 1: Add Account Picker to OAuth Request (Recommended)
This forces Google to show the account selection screen every time.

Already implemented in the code with `prompt: 'consent'` but we can enhance it.

### Option 2: Clear Google Session Manually

**On Android Device/Emulator:**
1. Open Chrome browser app
2. Go to: `https://accounts.google.com`
3. Click your profile icon (top right)
4. Click "Sign out"
5. Close Chrome
6. Go back to your app and try "Continuer avec Google" again

**Alternative - Clear Browser Data:**
1. Settings > Apps > Chrome > Storage > Clear Data
2. Return to your app and retry

### Option 3: Use Incognito/Private Mode
The OAuth flow should open in a web view. If possible:
1. Long-press the Google sign-in button
2. Select "Open in incognito" if available
(This may not work in Expo Go's web view)

### Option 4: Test with Different Account
Add a test Google account temporarily:
1. When you see the redirect error, go to Chrome
2. Add another Google account
3. Return to app and retry - should show account picker

## Expected Flow After Clean Session
1. Click "Continuer avec Google"
2. Browser opens showing Google account selection
3. Select account or enter email
4. Enter password
5. Accept consent screen (if shown)
6. Redirect back to app with success OR specific error

## What to Capture
After completing the flow with a clean session, send:
```
🧭 AuthSession environment { ... }
🚀 Google sign-in starting with config: { ... }
📬 Google OAuth result: { ... }
```

## Current Status
- ✅ Redirect URI configured: `https://auth.expo.io/@teddmabulay/laso-coach`
- ✅ Web OAuth client ID correct
- ✅ Android OAuth client ID created
- ⏳ Waiting for clean test without cached Google session

## Next Steps
1. Clear Google session using Option 2 (easiest)
2. Restart app: `npx expo start -c`
3. Try Google sign-in again
4. Complete full flow (select account, enter password, accept consent)
5. Send the 🧭, 🚀, and 📬 logs that appear
