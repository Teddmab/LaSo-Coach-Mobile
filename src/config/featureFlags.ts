import { Platform } from 'react-native';

/**
 * Expo Push (`expo-notifications` + token Expo) : désactivé pour éviter les crashs natifs
 * iOS en parallèle de OneSignal. Les pushes distants passent par **OneSignal** uniquement.
 * L’in-app (liste, badge, toasts) reste géré par WebSocket / API.
 */
export const ENABLE_EXPO_PUSH_NOTIFICATIONS = false;

/**
 * Feature Flags Configuration
 * 
 * IOS_COMPANION_MODE: When enabled on iOS, the app becomes a "companion app"
 * that only allows login and entitlement-based access. No purchase flows.
 * 
 * This is for App Store compliance (3.1.1) - users purchase externally,
 * iOS app is just for accessing content they already paid for.
 */

/**
 * iOS Companion Mode Flag
 * 
 * When TRUE on iOS:
 * - All purchase UI hidden (Stripe, PayPal, IAP)
 * - No subscription CTAs or upgrade messaging
 * - No pricing, trials, or discount information
 * - No deep links to subscription pages
 * - Only server-driven entitlement checking
 * 
 * When FALSE or on Android:
 * - Full purchase flows available
 * - Normal subscription UI
 */
export const IOS_COMPANION_MODE = true; // Set to true for App Store compliance

/**
 * Check if companion mode is active
 * Only applies to iOS platform
 */
export const isIOSCompanionMode = (): boolean => {
  return Platform.OS === 'ios' && IOS_COMPANION_MODE;
};

/**
 * Check if purchase flows should be shown
 * Returns false if iOS companion mode is active
 */
export const shouldShowPurchaseFlows = (): boolean => {
  return !isIOSCompanionMode();
};

/**
 * Check if payment providers should initialize
 * Returns false if iOS companion mode is active
 */
export const shouldInitializePaymentProviders = (): boolean => {
  return !isIOSCompanionMode();
};

/**
 * Check if IAP (In-App Purchases) should be enabled
 * Returns false if iOS companion mode is active
 */
export const shouldEnableIAP = (): boolean => {
  return !isIOSCompanionMode();
};

/**
 * Get neutral message for companion mode
 * Shows when user tries to access purchase features
 */
export const getCompanionModeMessage = (): string => {
  return 'Manage your subscription on the web at lasocoach.com';
};

/**
 * Feature Flags Object
 * Export all flags for easy access
 */
export const FeatureFlags = {
  IOS_COMPANION_MODE,
  ENABLE_EXPO_PUSH_NOTIFICATIONS,
  isIOSCompanionMode,
  shouldShowPurchaseFlows,
  shouldInitializePaymentProviders,
  shouldEnableIAP,
  getCompanionModeMessage,
};

export default FeatureFlags;
