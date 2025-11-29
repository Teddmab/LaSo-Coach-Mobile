# Development Build Setup for Google OAuth

## Why Development Build?
Expo Go has limitations with OAuth redirects. A development build uses native OAuth flows which are more reliable.

## Setup Steps

### 1. Install expo-dev-client ✅
```bash
npm install expo-dev-client
```
Already done!

### 2. Add Plugin to app.json ✅
Added `expo-dev-client` to plugins. Already done!

### 3. Check Build Error
The build failed but the error message was cut off. To see the full error:

1. **Check EAS Dashboard:**
   - Go to: https://expo.dev/accounts/teddmabulay/projects/laso-coach/builds
   - Find the latest build
   - Click on it to see the full error logs

2. **Common Issues:**
   - Native code conflicts (you have an `android/` directory)
   - Missing dependencies
   - Configuration issues

### 4. Alternative: Build Locally
If EAS build continues to fail, you can build locally:

```bash
# For Android
npx expo prebuild --clean
npx expo run:android
```

### 5. After Build Succeeds
Once you have the development build installed:

1. **Install the APK** on your device
2. **Start the dev server:**
   ```bash
   npx expo start --dev-client
   ```
3. **Open the app** on your device
4. **Test Google OAuth** - it should work with native redirects!

## Current Status
- ✅ expo-dev-client installed
- ✅ Plugin added to app.json
- ⏳ Build failed - need to check EAS dashboard for full error
- ⏳ Need to resolve build error before testing OAuth

## Next Steps
1. Check EAS dashboard for full build error
2. Fix the build error
3. Install development build on device
4. Test Google OAuth with native redirects

