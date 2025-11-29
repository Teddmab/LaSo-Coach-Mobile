# OAuth "Dismiss" Error - Why It's Happening Again

## 🔴 The Problem

You're getting this error:
```
ERROR  📬 Google OAuth result received: {
  "type": "dismiss",
  "hasIdToken": false,
  "hasCode": false
}
```

## 🔍 Root Cause

**You are still using Expo Go, not the Development Client!**

The "dismiss" error is a **known limitation of Expo Go**:
1. Expo Go uses a proxy server (`auth.expo.io`) for OAuth
2. Google redirects to the proxy successfully
3. The proxy tries to redirect back to Expo Go
4. **Expo Go fails to handle this redirect** → Result: `type: "dismiss"`

## ✅ How to Verify You're Using Expo Go

Check your logs for this line:
```
🔍 App Ownership Detection: {
  appOwnership: 'expo',  ← This means Expo Go!
  isExpoGo: true,
  ...
}
```

**If you see `appOwnership: 'expo'` → You're using Expo Go ❌**

**If you see `appOwnership: 'guest'` → You're using Dev Client ✅**

## 🎯 The Solution

### You MUST use the Development Client, not Expo Go!

**Development Client:**
- Has your app's icon (not Expo logo)
- App name: "LasoCoach" or your app name
- Logs show: `appOwnership: 'guest'`
- OAuth works with native redirects (no proxy)

**Expo Go:**
- Blue Expo logo
- App name: "Expo Go"
- Logs show: `appOwnership: 'expo'`
- OAuth fails with "dismiss" error

## 📋 Steps to Fix

### Step 1: Wait for Build to Complete

Check build status:
```powershell
Get-Content android\build-output.log -Tail 20
```

Wait for: `BUILD SUCCESSFUL`

### Step 2: Install Development Client APK

**DO NOT use Expo Go!**

1. Find the APK:
   ```
   android\app\build\outputs\apk\playDebug\app-play-debug.apk
   ```

2. Install on your tablet:
   ```powershell
   .\install-apk.ps1
   ```
   Or manually:
   ```powershell
   adb install android\app\build\outputs\apk\playDebug\app-play-debug.apk
   ```

### Step 3: Start Dev Server with Dev Client Flag

**IMPORTANT:** Use `--dev-client` flag:
```powershell
npm start -- --dev-client
```

**NOT:**
```powershell
npm start  # This is for Expo Go!
```

### Step 4: Open Development Client App

1. **On your tablet, open the Development Client app**
   - Look for your app's icon (NOT the Expo Go logo)
   - App name should be "LasoCoach" or your app name

2. **DO NOT open Expo Go!**

3. The app should connect to the dev server automatically

### Step 5: Verify You're Using Dev Client

Check logs for:
```
🔍 App Ownership Detection: {
  appOwnership: 'guest',  ← Should be 'guest', NOT 'expo'!
  isExpoGo: false,        ← Should be false!
  isNativeLike: true,     ← Should be true!
  message: '✅ Using Development Build or Standalone - OAuth should work reliably!'
}
```

### Step 6: Test Google OAuth

Now OAuth should work! You should see:
- `redirectUri: 'lasocoach://auth'` (not `https://auth.expo.io/...`)
- `useProxy: false` (not true)
- OAuth completes successfully with `type: 'success'`

## 🚨 Common Mistakes

### Mistake 1: Opening Expo Go Instead of Dev Client
- ❌ Opening the blue "Expo Go" app
- ✅ Opening your app (with your icon)

### Mistake 2: Using `npm start` Instead of `npm start -- --dev-client`
- ❌ `npm start` → Starts for Expo Go
- ✅ `npm start -- --dev-client` → Starts for Dev Client

### Mistake 3: Installing Expo Go Instead of Dev Client APK
- ❌ Installing Expo Go from Play Store
- ✅ Installing the APK you built

## 🔧 Quick Diagnostic Commands

```powershell
# Check if dev client is installed
adb shell pm list packages | Select-String "laso"

# Check build status
Get-Content android\build-output.log -Tail 20

# Check tablet connection
adb devices

# View app logs (look for appOwnership)
adb logcat | Select-String -Pattern "App Ownership|appOwnership|OAuth"
```

## 📊 Expected Logs (Success)

When using Dev Client correctly, you should see:
```
🔍 App Ownership Detection: {
  appOwnership: 'guest',
  isExpoGo: false,
  isNativeLike: true,
  message: '✅ Using Development Build or Standalone - OAuth should work reliably!'
}
🔑 Standalone/dev client mode: Using platform-specific client IDs
🔐 Google auth redirect URI (configured): lasocoach://auth
🚀 Google sign-in starting with config: {
  useProxy: false,  ← Should be false!
  redirectUri: 'lasocoach://auth',  ← Should be lasocoach://, not https://auth.expo.io
  ...
}
📬 Google OAuth result received: {
  type: 'success',  ← Should be 'success', not 'dismiss'!
  hasIdToken: true,
  ...
}
```

## ⚠️ Why This Keeps Happening

The "dismiss" error will **always** happen with Expo Go because:
- It's a limitation of Expo Go's proxy system
- The proxy can't reliably redirect back to Expo Go
- This is why we're building a development client

**The fix is to use the Development Client, not to fix Expo Go!**

## 📝 Summary

1. ❌ **Current**: Using Expo Go → OAuth fails with "dismiss"
2. ✅ **Solution**: Use Development Client → OAuth works
3. 🔧 **Action**: Install dev client APK, open dev client app (not Expo Go)
4. ✅ **Result**: OAuth works with native redirects

