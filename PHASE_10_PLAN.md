# Phase 10: Permission Strings - Implementation Plan

**Phase**: 10 of 12  
**Status**: ⏳ IN PROGRESS  
**Date Started**: January 17, 2026  
**Estimated TODOs**: 8-10

---

## Overview

Phase 10 focuses on adding proper permission strings (iOS) and permissions declarations (Android) to handle app permissions transparently to users.

## Required Permissions for LaSo Coach

### By Feature

#### 1. Display/Notifications
- iOS: `NSUserNotificationUsageDescription`
- Android: `android.permission.POST_NOTIFICATIONS`
- Purpose: Send push notifications

#### 2. Camera (Video Calls/Recording)
- iOS: `NSCameraUsageDescription`
- Android: `android.permission.CAMERA`
- Purpose: Video calls, fitness video recording
- Status: May not be needed currently

#### 3. Microphone (Video Calls/Audio)
- iOS: `NSMicrophoneUsageDescription`
- Android: `android.permission.RECORD_AUDIO`
- Purpose: Video calls, audio recording
- Status: May not be needed currently

#### 4. Photos/Media Access
- iOS: `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddOnlyUsageDescription`
- Android: `android.permission.READ_EXTERNAL_STORAGE`, `android.permission.WRITE_EXTERNAL_STORAGE`
- Purpose: Upload profile pictures, share photos
- Status: Likely needed

#### 5. Health Kit (Fitness Data)
- iOS: `NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`
- Android: Health Connect permission (if used)
- Purpose: Sync fitness data, health tracking
- Status: Depends on implementation

#### 6. Calendar (Event Scheduling)
- iOS: `NSCalendarsUsageDescription`
- Android: `android.permission.READ_CALENDAR`, `android.permission.WRITE_CALENDAR`
- Purpose: Schedule workouts
- Status: Depends on implementation

#### 7. Location (Not needed currently)
- iOS: `NSLocationWhenInUseUsageDescription`
- Android: `android.permission.ACCESS_FINE_LOCATION`
- Purpose: Geolocation features
- Status: NOT NEEDED

#### 8. Bluetooth (Fitness Trackers - if supported)
- iOS: `NSBluetoothPeripheralUsageDescription`
- Android: `android.permission.BLUETOOTH`
- Purpose: Connect to fitness wearables
- Status: NOT NEEDED currently

---

## Current State Analysis

### What Exists
- app.json has basic iOS/Android config
- Custom plugins system in place
- Notification setup in app.json
- No explicit permission strings currently

### What's Missing
- iOS InfoPlist permission descriptions
- Android manifest permissions declaration
- Custom plugin for permission handling
- Permission request code (runtime permissions)

---

## Implementation Strategy

### Step 1: Create Permission Plugin
Create `plugins/withPermissionStrings.js` to handle:
- iOS InfoPlist modifications
- Android manifest modifications

### Step 2: Update app.json
Add plugin configuration with permission strings

### Step 3: Add iOS Permissions
In InfoPlist via plugin

### Step 4: Add Android Permissions
In AndroidManifest via plugin

### Step 5: Update app.config.js
Ensure permissions are properly merged

---

## Permissions to Implement (MVP - Phase 10)

### Essential (Must Have)
1. ✅ Notifications
   - iOS: `NSUserNotificationUsageDescription`
   - Android: `android.permission.POST_NOTIFICATIONS`

2. ✅ Photo/Media
   - iOS: `NSPhotoLibraryUsageDescription`
   - Android: `android.permission.READ_EXTERNAL_STORAGE`

### Nice to Have (Phase 10+)
3. Camera (For future video calls)
4. Microphone (For future audio)
5. HealthKit (For fitness integration)
6. Calendar (For schedule integration)

---

## TODO Items

### Phase 10 TODOs
- [ ] TODO #14: Analyze app features for required permissions
- [ ] TODO #15: Create withPermissionStrings.js plugin
- [ ] TODO #16: Add iOS permission descriptions
- [ ] TODO #17: Add Android manifest permissions
- [ ] TODO #18: Update app.json with plugin
- [ ] TODO #19: Add runtime permission request code (if needed)
- [ ] TODO #20: Test permissions on iOS
- [ ] TODO #21: Test permissions on Android
- [ ] TODO #22: Verify build succeeds

**Est. 8-9 TODOs**

---

## Files to Modify/Create

```
CREATED:
- plugins/withPermissionStrings.js

MODIFIED:
- app.json (add plugin)
- app.config.js (ensure proper merging)

POTENTIAL:
- Permission request utility (if runtime requests needed)
```

---

## Implementation Details

### withPermissionStrings.js Structure
```typescript
export default function withPermissionStrings(config) {
  // iOS modifications
  config.ios.infoPlist = {
    ...config.ios.infoPlist,
    NSUserNotificationUsageDescription: "...",
    NSPhotoLibraryUsageDescription: "...",
    // ... more as needed
  };

  // Android modifications
  config.android.permissions = [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.READ_EXTERNAL_STORAGE",
    // ... more as needed
  ];

  return config;
}
```

---

## Permission Descriptions (French)

### Notifications
```
"We send notifications about your workouts, achievements, and messages."
"Nous envoyons des notifications sur vos entraînements, réalisations et messages."
```

### Photos
```
"Access your photos to upload profile pictures and share achievements."
"Accédez à vos photos pour télécharger des images de profil et partager vos réalisations."
```

### Camera
```
"Camera access for video calls and fitness video recording."
"Accès à la caméra pour les appels vidéo et l'enregistrement de vidéos d'entraînement."
```

### Microphone
```
"Microphone access for video calls and audio recording."
"Accès au microphone pour les appels vidéo et l'enregistrement audio."
```

---

## Build Validation

### Pre-Deployment Checks
- [ ] npm run android builds without errors
- [ ] npm run ios builds without errors
- [ ] Expo start works correctly
- [ ] No TypeScript errors
- [ ] Permissions visible in built app

---

## Next Steps

1. Identify exact permissions needed (MVP)
2. Create withPermissionStrings.js plugin
3. Add iOS descriptions to app.json
4. Add Android permissions to app.json
5. Test builds

---

**Status**: Ready to implement  
**Blocking**: None  
**Dependencies**: None  
**Complexity**: Medium
