const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Plugin Expo pour corriger les crashes au démarrage iOS
 * Ajoute les permissions manquantes et configure les entitlements
 */
const withIOSCrashFix = (config) => {
  // Ajouter les permissions manquantes dans Info.plist
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    // Permissions pour expo-image-picker
    if (!infoPlist.NSPhotoLibraryUsageDescription) {
      infoPlist.NSPhotoLibraryUsageDescription = 
        'Nous avons besoin d\'accéder à vos photos pour vous permettre de changer votre avatar et d\'ajouter des photos de progression.';
      console.log('✅ [withIOSCrashFix] Added NSPhotoLibraryUsageDescription');
    }

    if (!infoPlist.NSCameraUsageDescription) {
      infoPlist.NSCameraUsageDescription = 
        'Nous avons besoin d\'accéder à votre appareil photo pour vous permettre de prendre des photos pour compléter vos défis.';
      console.log('✅ [withIOSCrashFix] Added NSCameraUsageDescription');
    }

    if (!infoPlist.NSPhotoLibraryAddUsageDescription) {
      infoPlist.NSPhotoLibraryAddUsageDescription = 
        'Nous avons besoin de votre permission pour sauvegarder des photos dans votre galerie.';
      console.log('✅ [withIOSCrashFix] Added NSPhotoLibraryAddUsageDescription');
    }

    // Permissions pour expo-notifications
    if (!infoPlist.NSUserNotificationsUsageDescription) {
      infoPlist.NSUserNotificationsUsageDescription = 
        'Nous envoyons des notifications pour vous informer de vos défis, messages et mises à jour importantes.';
      console.log('✅ [withIOSCrashFix] Added NSUserNotificationsUsageDescription');
    }

    // S'assurer que CFBundleIconName est présent
    if (!infoPlist.CFBundleIconName) {
      infoPlist.CFBundleIconName = 'AppIcon';
      console.log('✅ [withIOSCrashFix] Added CFBundleIconName');
    }

    // S'assurer que la version est correcte
    if (!infoPlist.CFBundleShortVersionString) {
      infoPlist.CFBundleShortVersionString = config.version || '1.0.4';
      console.log(`✅ [withIOSCrashFix] Added CFBundleShortVersionString: ${infoPlist.CFBundleShortVersionString}`);
    }

    // Configuration pour éviter les crashes liés aux permissions
    if (!infoPlist.ITSAppUsesNonExemptEncryption) {
      infoPlist.ITSAppUsesNonExemptEncryption = false;
      console.log('✅ [withIOSCrashFix] Added ITSAppUsesNonExemptEncryption');
    }

    // Configuration pour les deep links
    if (!infoPlist.CFBundleURLTypes) {
      infoPlist.CFBundleURLTypes = [
        {
          CFBundleURLSchemes: ['lasocoach', 'com.laso.coach'],
          CFBundleURLName: 'com.afrotouch.lasocoach',
        },
      ];
      console.log('✅ [withIOSCrashFix] Added CFBundleURLTypes for deep links');
    }

    return config;
  });

  // Configurer les entitlements
  config = withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    // Push Notifications
    if (!entitlements['aps-environment']) {
      entitlements['aps-environment'] = 'production';
      console.log('✅ [withIOSCrashFix] Added aps-environment entitlement');
    }

    // Associated Domains pour deep links
    if (!entitlements['com.apple.developer.associated-domains']) {
      entitlements['com.apple.developer.associated-domains'] = [
        'applinks:app.lasocoach.com',
      ];
      console.log('✅ [withIOSCrashFix] Added associated-domains entitlement');
    }

    return config;
  });

  return config;
};

module.exports = withIOSCrashFix;

