# Build and Install Development Client on Android Device

## Current Status
- ✅ Build configuration: Ready
- ⏳ Android build: In progress
- ⚠️ Device: Not connected yet

## Step-by-Step Instructions

### Step 1: Connect Your Android Device

1. **Enable Developer Options** (if not already):
   - Go to Settings > About phone/tablet
   - Tap "Build number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging**:
   - Go to Settings > Developer options
   - Enable "USB debugging"
   - Enable "Stay awake" (optional, keeps screen on while charging)

3. **Connect Device**:
   - Connect your Android device to computer via USB
   - On device, tap "Allow USB debugging" when prompted
   - Check "Always allow from this computer" if available

4. **Verify Connection**:
   ```powershell
   adb devices
   ```
   Should show your device listed.

### Step 2: Build and Install (Automatic)

The command `npx expo run:android` will:
1. Build the development client APK
2. Automatically install it on your connected device
3. Start the Metro bundler
4. Launch the app on your device

**If device is connected, this happens automatically!**

### Step 3: Manual Build and Install (If Needed)

If automatic install doesn't work:

#### Option A: Build APK Only
```powershell
cd android
.\gradlew.bat assemblePlayDebug
```

APK will be at:
```
android\app\build\outputs\apk\playDebug\app-play-debug.apk
```

#### Option B: Install APK Manually
```powershell
# Using helper script
.\install-apk.ps1

# Or manually
adb install android\app\build\outputs\apk\playDebug\app-play-debug.apk
```

### Step 4: Start Dev Server

Once the app is installed:

```powershell
npm start -- --dev-client
```

**IMPORTANT**: Use `--dev-client` flag, NOT just `npm start`!

### Step 5: Open Development Client App

1. **On your device**, find and open the app:
   - Look for "LasoCoach" (your app name)
   - Has your app's icon (NOT the Expo Go logo)
   - **DO NOT open Expo Go!**

2. The app should automatically connect to the dev server

3. You should see your app load

### Step 6: Verify You're Using Dev Client

Check the logs for:
```
🔍 App Ownership Detection: {
  appOwnership: 'guest',  ← Should be 'guest', NOT 'expo'!
  isExpoGo: false,        ← Should be false!
  isNativeLike: true,     ← Should be true!
  message: '✅ Using Development Build or Standalone - OAuth should work reliably!'
}
```

### Step 7: Test Google OAuth

1. Tap "Continuer avec Google" button
2. You should see:
   - Google account picker (with `select_account` prompt)
   - Native OAuth flow (no proxy)
   - Redirect URI: `lasocoach://auth` (not `https://auth.expo.io/...`)
   - Successful login!

## Troubleshooting

### "No devices/emulators found"
- Check USB cable connection
- Verify USB debugging is enabled
- Try different USB port
- Run `adb kill-server` then `adb devices`

### "Build failed"
- Check `android\build-output.log` for errors
- Ensure Android SDK is properly installed
- Check `android\local.properties` has correct SDK path

### "App installed but shows Expo Go"
- You opened the wrong app!
- Look for "LasoCoach" app (your icon), not "Expo Go" (blue logo)
- Uninstall Expo Go if it's confusing

### "OAuth still shows 'dismiss' error"
- Check logs for `appOwnership` - must be `'guest'`, not `'expo'`
- If it's `'expo'`, you're still using Expo Go
- Make sure you opened the Development Client app

### "Dev server not connecting"
- Ensure dev server is running: `npm start -- --dev-client`
- Check device and computer are on same network
- Try reloading app (shake device → Reload)

## Expected Logs (Success)

When using Dev Client correctly:
```
🔍 App Ownership Detection: {
  appOwnership: 'guest',
  isExpoGo: false,
  isNativeLike: true
}
🔑 Standalone/dev client mode: Using platform-specific client IDs
🔐 Google auth redirect URI (configured): lasocoach://auth
🚀 Google sign-in starting with config: {
  useProxy: false,  ← Should be false!
  redirectUri: 'lasocoach://auth',  ← Should be lasocoach://, not https://
  ...
}
📬 Google OAuth result received: {
  type: 'success',  ← Should be 'success', not 'dismiss'!
  hasIdToken: true,
  ...
}
```

## Quick Commands

```powershell
# Check device connection
adb devices

# Check build status
Get-Content android\build-output.log -Tail 20

# Build and install
npx expo run:android

# Start dev server
npm start -- --dev-client

# Install APK manually
.\install-apk.ps1

# View device logs
adb logcat | Select-String -Pattern "Google|OAuth|auth|Firebase|App Ownership"
```

## Next Steps After Installation

1. ✅ Verify `appOwnership: 'guest'` in logs
2. ✅ Test Google OAuth - should work now!
3. ✅ No more "dismiss" errors
4. ✅ Native redirects work reliably

