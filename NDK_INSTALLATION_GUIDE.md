# NDK Installation Guide

## Problem
The NDK (Native Development Kit) version 27.1.12297006 is installed but incomplete - missing `source.properties` file.

## Solution: Install NDK via Android Studio

### Step 1: Open Android Studio
1. Launch Android Studio

### Step 2: Open SDK Manager
1. Go to: **Tools** → **SDK Manager**
   - Or: **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**

### Step 3: Install NDK
1. Click the **"SDK Tools"** tab
2. Check the box for **"NDK (Side by side)"**
3. Make sure version **27.1.12297006** is selected/installed
4. If it's already checked but incomplete:
   - Uncheck it and click **Apply** (to uninstall)
   - Check it again and click **Apply** (to reinstall)
5. Click **Apply** to install

### Step 4: Verify Installation
After installation, verify:
```
C:\Users\temabulay\AppData\Local\Android\Sdk\ndk\27.1.12297006\source.properties
```
This file should exist.

### Step 5: Rebuild
Once NDK is installed:
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

## Alternative: Use EAS Build (Recommended)

EAS Build handles all native dependencies automatically, including NDK. This is easier and more reliable:

```bash
npx eas build -p android --profile development
```

EAS Build will:
- ✅ Handle NDK installation automatically
- ✅ Handle all native dependencies
- ✅ Build in the cloud (no local setup needed)
- ✅ Provide download link for APK

## Quick Fix: Try EAS Build

Since local builds are having dependency issues, EAS Build is the fastest solution:

1. **Build on EAS:**
   ```bash
   npx eas build -p android --profile development
   ```

2. **Wait for build** (10-20 minutes)

3. **Download APK** from EAS dashboard

4. **Install and test** OAuth

This avoids all local NDK/SDK configuration issues!

