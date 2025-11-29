# How to Use Development Client (Not Expo Go)

## ⚠️ Important: You're Still Using Expo Go!

Your logs show you're still using **Expo Go**, which is why OAuth is still failing. You need to use the **Development Client** instead.

## How to Tell Which App You're Using

### Expo Go (Current - Has OAuth Issues):
- App icon: Blue Expo logo
- App name: "Expo Go"
- Logs show: `appOwnership: 'expo'`
- Warning: "expo-notifications functionality is not fully supported in Expo Go"

### Development Client (What You Need):
- App icon: Your app's icon
- App name: "LasoCoach" or your app name
- Logs show: `appOwnership: 'guest'` or `'standalone'`
- No Expo Go warnings

## Steps to Use Development Client

### Step 1: Wait for Build to Complete

The build is currently running. Check the terminal for:
- "BUILD SUCCESSFUL" message
- Or any error messages

### Step 2: Install Development Client

Once build completes, you have 3 options:

#### Option A: Auto-Install (If Device Connected)
If your device is connected via USB:
- Build will automatically install
- Check your device for the new app

#### Option B: Find and Install APK Manually
1. **Find the APK:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
2. **Transfer to device** (USB, email, cloud)
3. **Install APK** on device
4. **Enable "Install from unknown sources"** if needed

#### Option C: Use Android Studio
1. Open Android Studio
2. Open the `android` folder
3. Click "Run" button
4. Select your device/emulator

### Step 3: Start Dev Server with Dev Client

**IMPORTANT:** Use `--dev-client` flag:

```bash
npx expo start --dev-client
```

**NOT:**
```bash
npx expo start  # This starts for Expo Go!
```

### Step 4: Open the Development Client App

1. **Open the Development Client app** on your device (NOT Expo Go!)
2. **Scan the QR code** or **press 'a' for Android**
3. Your app should load in the Development Client

### Step 5: Verify You're Using Dev Client

Check the logs for:
- ✅ `appOwnership: 'guest'` (dev client) or `'standalone'`
- ✅ No "Expo Go" warnings
- ✅ `isExpoGo: false`

### Step 6: Test Google OAuth

Now OAuth should work perfectly with native redirects!

## Troubleshooting

### "I don't see the Development Client app"
- Build might still be running - wait for completion
- Check `android/app/build/outputs/apk/debug/` for APK
- Install manually if needed

### "App still shows Expo Go warnings"
- You're still using Expo Go
- Make sure you installed the Development Client
- Make sure you're opening the Development Client app (not Expo Go)

### "How do I know which app to open?"
- **Development Client:** Has your app's icon and name
- **Expo Go:** Has blue Expo logo and says "Expo Go"

## Summary

1. ⏳ Wait for build to complete
2. 📱 Install Development Client APK
3. 🚀 Run `npx expo start --dev-client` (NOT just `expo start`)
4. 📲 Open Development Client app (NOT Expo Go)
5. ✅ Test OAuth - should work!

## Current Status

- Build: 🔄 Running (Java process active)
- Using: ❌ Expo Go (needs to switch to Dev Client)
- OAuth: ❌ Failing (because using Expo Go)
- Next: ⏳ Wait for build, install Dev Client, test OAuth

