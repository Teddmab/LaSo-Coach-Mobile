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

    // S'assurer que la version est correcte (toujours mettre à jour pour correspondre à app.json)
    const expectedVersion = config.version || '1.0.5';
    if (!infoPlist.CFBundleShortVersionString || infoPlist.CFBundleShortVersionString !== expectedVersion) {
      infoPlist.CFBundleShortVersionString = expectedVersion;
      console.log(`✅ [withIOSCrashFix] Updated CFBundleShortVersionString to: ${expectedVersion}`);
    }

    // S'assurer que le build number est correct (toujours mettre à jour pour correspondre à app.json)
    const expectedBuildNumber = config.ios?.buildNumber || config.buildNumber || '7';
    if (!infoPlist.CFBundleVersion || infoPlist.CFBundleVersion !== expectedBuildNumber) {
      infoPlist.CFBundleVersion = expectedBuildNumber;
      console.log(`✅ [withIOSCrashFix] Updated CFBundleVersion to: ${expectedBuildNumber}`);
    }

    // Configuration pour éviter les crashes liés aux permissions
    if (!infoPlist.ITSAppUsesNonExemptEncryption) {
      infoPlist.ITSAppUsesNonExemptEncryption = false;
      console.log('✅ [withIOSCrashFix] Added ITSAppUsesNonExemptEncryption');
    }

    // Désactiver la nouvelle architecture React Native dans Info.plist
    if (infoPlist.RCTNewArchEnabled !== undefined && infoPlist.RCTNewArchEnabled === true) {
      infoPlist.RCTNewArchEnabled = false;
      console.log('✅ [withIOSCrashFix] Disabled RCTNewArchEnabled');
    }

    // Configuration pour éviter les crashes au démarrage
    // S'assurer que UIViewControllerBasedStatusBarAppearance est défini
    if (infoPlist.UIViewControllerBasedStatusBarAppearance === undefined) {
      infoPlist.UIViewControllerBasedStatusBarAppearance = false;
      console.log('✅ [withIOSCrashFix] Added UIViewControllerBasedStatusBarAppearance');
    }

    // S'assurer que UIStatusBarStyle est défini
    if (!infoPlist.UIStatusBarStyle) {
      infoPlist.UIStatusBarStyle = 'UIStatusBarStyleLightContent';
      console.log('✅ [withIOSCrashFix] Added UIStatusBarStyle');
    }

    // Configuration pour éviter les crashes liés à la sécurité
    if (!infoPlist.NSAppTransportSecurity) {
      infoPlist.NSAppTransportSecurity = {
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: {},
      };
      console.log('✅ [withIOSCrashFix] Added NSAppTransportSecurity');
    }

    // Configuration pour les deep links et Google Sign-In
    // Le REVERSED_CLIENT_ID est nécessaire pour Google Sign-In sur iOS
    const reversedClientId = 'com.googleusercontent.apps.855620848279-2cjfq731f6f8ts6fmicqg2ieumssvcl9';
    
    if (!infoPlist.CFBundleURLTypes) {
      infoPlist.CFBundleURLTypes = [
        {
          CFBundleURLSchemes: ['lasocoach', 'com.laso.coach', reversedClientId],
          CFBundleURLName: 'com.afrotouch.lasocoach',
        },
      ];
      console.log('✅ [withIOSCrashFix] Added CFBundleURLTypes for deep links and Google Sign-In');
    } else {
      // Si CFBundleURLTypes existe déjà, ajouter le REVERSED_CLIENT_ID au premier élément
      if (infoPlist.CFBundleURLTypes.length > 0 && Array.isArray(infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes)) {
        const schemes = infoPlist.CFBundleURLTypes[0].CFBundleURLSchemes;
        if (!schemes.includes(reversedClientId)) {
          schemes.push(reversedClientId);
          console.log('✅ [withIOSCrashFix] Added REVERSED_CLIENT_ID to existing CFBundleURLSchemes');
        }
      }
    }

    // CRITIQUE: LSApplicationQueriesSchemes pour Google Sign-In iOS
    // Permet à l'app d'interroger les apps Google/Safari pour l'authentification
    // Sans cela, l'app peut crash lors de l'initialisation du SDK Google
    const essentialGoogleSchemes = [
      'googlegmail',
      'googleplus',
      'googledrive',
      'googlechrome',
      'googleyoutube',
      'googlemaps',
      'googlephotos',
    ];
    
    if (!infoPlist.LSApplicationQueriesSchemes) {
      infoPlist.LSApplicationQueriesSchemes = essentialGoogleSchemes;
      console.log('✅ [withIOSCrashFix] Added LSApplicationQueriesSchemes for Google Sign-In');
    } else {
      // Ajouter les schemes Google essentiels s'ils ne sont pas déjà présents
      essentialGoogleSchemes.forEach(scheme => {
        if (!infoPlist.LSApplicationQueriesSchemes.includes(scheme)) {
          infoPlist.LSApplicationQueriesSchemes.push(scheme);
        }
      });
      console.log('✅ [withIOSCrashFix] Added essential Google schemes to LSApplicationQueriesSchemes');
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

