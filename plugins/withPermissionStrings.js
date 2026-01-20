/**
 * Permission Strings Plugin for LaSo Coach
 * Handles iOS InfoPlist permission descriptions and Android manifest permissions
 * 
 * This plugin configures all necessary permissions for:
 * - Push notifications
 * - Photo/media access
 * - Camera (video calls)
 * - Microphone (audio)
 * - HealthKit (fitness data)
 * - Calendar (scheduling)
 */

module.exports = function withPermissionStrings(config) {
  // ========== iOS Configuration ==========
  // Add permission descriptions to iOS Info.plist
  config.ios = config.ios || {};
  config.ios.infoPlist = {
    ...(config.ios.infoPlist || {}),
    
    // Notifications - Push notification permission description
    // Required for: Push notifications, reminders, messaging
    NSUserNotificationUsageDescription:
      'We send notifications about your workouts, achievements, messages, and reminders. ' +
      'This helps keep you motivated and informed about your fitness journey.',
    
    // Photos/Media Access - Photo library read access
    // Required for: Profile pictures, progress photos, achievements
    NSPhotoLibraryUsageDescription:
      'Access your photos to upload profile pictures, share fitness progress, and store workout photos. ' +
      'Your photos are private and only used for your fitness journey.',
    
    // Photos/Media - Photo library add-only access (iOS 11+)
    // Allows saving edited photos without full library access
    NSPhotoLibraryAddOnlyUsageDescription:
      'Allow us to save edited photos and filtered images to your photo library.',
    
    // Camera - Camera access for video
    // Required for: Video calls, fitness video recording, form checks
    NSCameraUsageDescription:
      'Nous avons besoin d\'accéder à votre appareil photo pour vous permettre de prendre des photos pour compléter vos défis.',
    
    // Microphone - Audio recording
    // Required for: Video calls, audio messages, voice notes
    NSMicrophoneUsageDescription:
      'Microphone access is needed for video calls with trainers, audio messages with the community, ' +
      'and voice coaching feedback.',
    
    // Calendar - Calendar access
    // Required for: Schedule workouts, create calendar events, sync with calendar
    NSCalendarsUsageDescription:
      'Access your calendar to schedule workouts, create events, and sync your fitness schedule.',
    
    // HealthKit - Health data access
    // Required for: Sync fitness data, track workouts, health monitoring
    NSHealthShareUsageDescription:
      'Read your health and fitness data (workouts, steps, calories) to provide personalized coaching.',
    
    NSHealthUpdateUsageDescription:
      'Write your workout data to the Health app to keep your fitness records synchronized.',
    
    // Motion & Fitness - Step counter and activity data
    // Required for: Step counting, activity tracking
    NSMotionUsageDescription:
      'Access your motion data for step counting, activity tracking, and personalized recommendations.',
  };

  // ========== Android Configuration ==========
  // Add permissions to Android manifest
  config.android = config.android || {};
  config.android.permissions = [
    ...(config.android.permissions || []),
    
    // Notifications - Post notifications permission (Android 13+)
    'android.permission.POST_NOTIFICATIONS',
    
    // Photos/Media - Read external storage
    'android.permission.READ_EXTERNAL_STORAGE',
    
    // Photos/Media - Write external storage (legacy devices)
    'android.permission.WRITE_EXTERNAL_STORAGE',
    
    // Camera - Camera permission
    'android.permission.CAMERA',
    
    // Microphone - Audio recording
    'android.permission.RECORD_AUDIO',
    
    // Calendar - Read calendar
    'android.permission.READ_CALENDAR',
    
    // Calendar - Write calendar
    'android.permission.WRITE_CALENDAR',
    
    // Fitness - Body Sensors (pedometer/step counter)
    'android.permission.BODY_SENSORS',
    
    // Fitness - Health Connect (if using Google Health Connect)
    'android.permission.HEALTH_CONNECT',
  ];

  return config;
}
