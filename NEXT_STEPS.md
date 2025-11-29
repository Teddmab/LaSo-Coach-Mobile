# Next Steps - Development Client Setup

## Current Status
✅ Build configuration fixed (SDK, NDK, react-native-iap variant)
⏳ Android development client build in progress

## Step 1: Wait for Build to Complete

The build is currently running. Monitor it with:

```powershell
# Watch build progress
Get-Content android\build-output.log -Wait -Tail 20

# Or check status periodically
Test-Path "android\app\build\outputs\apk\play\debug\app-play-debug.apk"
```

**Expected time:** 10-15 minutes for first build

## Step 2: Verify Build Success

Once build completes, check for the APK:

```powershell
# Check if APK exists
$apk = Get-Item "android\app\build\outputs\apk\play\debug\app-play-debug.apk" -ErrorAction SilentlyContinue
if ($apk) {
    Write-Host "✅ Build successful! APK: $($apk.FullName)" -ForegroundColor Green
} else {
    Write-Host "❌ APK not found. Check build-output.log for errors." -ForegroundColor Red
}
```

## Step 3: Install Development Client on Device

### Option A: Using ADB (if device connected via USB)
```powershell
# Make sure device is connected
adb devices

# Install the APK
adb install android/app/build/outputs/apk/play/debug/app-play-debug.apk
```

### Option B: Manual Installation
1. Transfer `android/app/build/outputs/apk/play/debug/app-play-debug.apk` to your device
2. On your device, enable "Install from Unknown Sources" in settings
3. Open the APK file and install it

## Step 4: Start Development Server

Once the development client is installed:

```bash
# Start Expo dev server with dev client mode
npx expo start --dev-client
```

This will:
- Start the Metro bundler
- Show a QR code
- Wait for your development client to connect

## Step 5: Connect Development Client

1. Open the **LaSo Coach** development client app on your device
2. The app should automatically connect to the dev server
3. If not, scan the QR code or enter the connection URL manually

## Step 6: Test Google OAuth

Now test Google Sign-In:

1. In the app, tap "Sign in with Google"
2. The OAuth flow should work without `redirect_uri_mismatch` errors
3. The development client uses native OAuth (not Expo Go proxy), so it should work correctly

## Troubleshooting

### If Build Fails
1. Check `android/build-output.log` for errors
2. Common issues:
   - Out of memory: Increase Gradle memory in `android/gradle.properties`
   - NDK warnings: Usually non-fatal, but may need NDK reinstall
   - Dependency issues: Try `cd android && .\gradlew.bat clean`

### If Device Not Detected by ADB
```powershell
# Check USB debugging is enabled
adb devices

# If empty, try:
adb kill-server
adb start-server
adb devices
```

### If Dev Server Won't Connect
- Make sure device and computer are on the same network
- Check firewall isn't blocking Metro bundler port (usually 8081)
- Try `npx expo start --dev-client --tunnel` for tunnel mode

## Alternative: Use EAS Build (Cloud Build)

If local build continues to have issues:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build development client in the cloud
eas build -p android --profile development
```

This handles all dependencies automatically and provides a download link for the APK.

