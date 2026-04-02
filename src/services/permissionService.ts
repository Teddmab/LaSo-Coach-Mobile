/**
 * Permission Management Utility
 * 
 * Handles runtime permission requests for iOS and Android
 * Uses expo-permissions for consistent cross-platform handling
 */

import * as Permissions from 'expo-permissions';

/**
 * Permission types enum
 */
export enum PermissionType {
  NOTIFICATIONS = 'NOTIFICATIONS',
  CAMERA = 'CAMERA',
  MICROPHONE = 'MICROPHONE',
  PHOTO_LIBRARY = 'PHOTO_LIBRARY',
  CALENDAR = 'CALENDAR',
}

/**
 * Request a single permission
 * @param permission - The permission type to request
 * @returns Promise<boolean> - true if granted, false otherwise
 */
export async function requestPermission(permission: PermissionType): Promise<boolean> {
  try {
    const { status } = await Permissions.askAsync(mapPermissionTypeToExpoPermission(permission));
    return status === 'granted';
  } catch (error) {
    console.error(`[Permissions] Error requesting ${permission}:`, error);
    return false;
  }
}

/**
 * Request multiple permissions at once
 * @param permissions - Array of permission types to request
 * @returns Promise<Record<string, boolean>> - Map of permission types to grant status
 */
export async function requestMultiplePermissions(
  permissions: PermissionType[]
): Promise<Record<PermissionType, boolean>> {
  try {
    const expoPermissions = permissions.map(mapPermissionTypeToExpoPermission);
    const results = await Permissions.askAsync(...expoPermissions);
    
    const permissionMap: Record<PermissionType, boolean> = {} as any;
    permissions.forEach((permission, index) => {
      permissionMap[permission] = results[expoPermissions[index]] === 'granted';
    });
    
    return permissionMap;
  } catch (error) {
    console.error('[Permissions] Error requesting multiple permissions:', error);
    // Return all as false if error
    const permissionMap: Record<PermissionType, boolean> = {} as any;
    permissions.forEach((permission) => {
      permissionMap[permission] = false;
    });
    return permissionMap;
  }
}

/**
 * Check permission status without requesting
 * @param permission - The permission type to check
 * @returns Promise<boolean> - true if granted, false otherwise
 */
export async function checkPermission(permission: PermissionType): Promise<boolean> {
  try {
    const expoPermission = mapPermissionTypeToExpoPermission(permission);
    const { status } = await Permissions.getAsync(expoPermission);
    return status === 'granted';
  } catch (error) {
    console.error(`[Permissions] Error checking ${permission}:`, error);
    return false;
  }
}

/**
 * Request permission with explanation to user
 * @param permission - The permission type
 * @param explanationTitle - Title for permission request
 * @param explanationMessage - Message for permission request
 * @returns Promise<boolean> - true if granted
 */
export async function requestPermissionWithExplanation(
  permission: PermissionType,
  explanationTitle: string,
  explanationMessage: string
): Promise<boolean> {
  try {
    // Check if already granted
    const alreadyGranted = await checkPermission(permission);
    if (alreadyGranted) {
      return true;
    }

    // Request the permission
    const granted = await requestPermission(permission);
    return granted;
  } catch (error) {
    console.error(`[Permissions] Error in permission request flow:`, error);
    return false;
  }
}

/**
 * Map our permission enum to Expo permission types
 * @param permission - Our permission type
 * @returns Expo permission type
 */
function mapPermissionTypeToExpoPermission(permission: PermissionType): Permissions.PermissionType {
  switch (permission) {
    case PermissionType.NOTIFICATIONS:
      return Permissions.NOTIFICATIONS;
    case PermissionType.CAMERA:
      return Permissions.CAMERA;
    case PermissionType.MICROPHONE:
      return Permissions.AUDIO;
    case PermissionType.PHOTO_LIBRARY:
      return Permissions.MEDIA_LIBRARY;
    case PermissionType.CALENDAR:
      return Permissions.CALENDAR;
    default:
      throw new Error(`Unknown permission type: ${permission}`);
  }
}

/**
 * Request permissions on app startup
 * Only requests essential permissions that are needed immediately
 */
export async function requestEssentialPermissions(): Promise<void> {
  try {
    // Request notifications (essential for the app)
    await requestPermission(PermissionType.NOTIFICATIONS);

    // Optional permissions can be requested when needed
    // Don't block app startup on these
  } catch (error) {
    console.error('[Permissions] Error requesting essential permissions:', error);
  }
}

/**
 * Request permissions on-demand when features are used
 * E.g., request camera when user wants to record video
 */
export async function requestPermissionOnDemand(
  permission: PermissionType,
  featureName: string
): Promise<boolean> {
  try {
    const granted = await requestPermission(permission);
    return granted;
  } catch (error) {
    console.error(`[Permissions] Error requesting ${permission}:`, error);
    return false;
  }
}

/**
 * Permission descriptions for user education
 */
export const PermissionDescriptions: Record<PermissionType, { title: string; description: string }> = {
  [PermissionType.NOTIFICATIONS]: {
    title: 'Notifications',
    description:
      'Allow notifications to get reminders about your workouts, achievements, and messages.',
  },
  [PermissionType.CAMERA]: {
    title: 'Camera',
    description:
      'Allow camera access for video calls with trainers and recording workout videos for form analysis.',
  },
  [PermissionType.MICROPHONE]: {
    title: 'Microphone',
    description:
      'Allow microphone access for video calls, audio messages, and voice coaching feedback.',
  },
  [PermissionType.PHOTO_LIBRARY]: {
    title: 'Photos',
    description:
      'Allow access to your photos to upload profile pictures and share fitness progress.',
  },
  [PermissionType.CALENDAR]: {
    title: 'Calendar',
    description: 'Allow calendar access to schedule workouts and sync with your calendar app.',
  },
};
