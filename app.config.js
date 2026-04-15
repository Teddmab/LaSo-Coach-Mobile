import 'dotenv/config';
import appJson from './app.json';

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_IOS_CLIENT_ID,
  FIREBASE_ANDROID_CLIENT_ID,
  FIREBASE_WEB_CLIENT_ID,
  API_BASE_URL,
  API_BASE_URL_DEV,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION = '1.1.5',
  DEBUG_MODE,
  OFFLINE_MODE,
  NODE_ENV,
  STRIPE_PUBLISHABLE_KEY,
  ONESIGNAL_APP_ID,
  ONESIGNAL_APP_ID_IOS,
  ONESIGNAL_APP_ID_ANDROID,
  ENABLE_ONESIGNAL,
  ONESIGNAL_REQUEST_PERMISSION_AT_STARTUP,
} = process.env;

/** App IDs OneSignal — Android / iOS (même clé si un seul projet multi-plateformes : utiliser ONESIGNAL_APP_ID). */
const DEFAULT_ONESIGNAL_APP_ID_ANDROID = '85b6a1dc-5ec6-46b3-8e78-9df1bb2422f3';
const DEFAULT_ONESIGNAL_APP_ID_IOS = '42fea0e5-c168-48c5-bfd9-beaded8233f1';

const DEFAULT_FIREBASE = {
  apiKey: 'AIzaSyDubBwQF27OUZyOMhzmNpIizw2D4dHxzO0',
  authDomain: 'lasocoach-39710.firebaseapp.com',
  projectId: 'lasocoach-39710',
  storageBucket: 'lasocoach-39710.appspot.com',
  messagingSenderId: '855620848279',
  appId: '1:855620848279:web:f93cbbf9c0d8f42faef7d2',
  measurementId: 'G-8JK6R4BGYG',
  iosClientId:
    '855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com',
  androidClientId:
    '855620848279-urs0dvsvoa45k74uhedk0odosfsfuh28.apps.googleusercontent.com',
  webClientId:
    '855620848279-r239q8v3pq6r37156hddd7lrt6j5mfc2.apps.googleusercontent.com',
};

const DEFAULT_ENV = {
  nodeEnv: 'development',
  apiBaseUrl: 'https://laso-coach-backend.onrender.com/api/v1',
  apiTimeout: '30000',
  debugMode: 'true',
  offlineMode: 'false',
};

/** Si ONESIGNAL_APP_ID est défini, il s’applique aux deux plateformes. Sinon IDs séparés. */
const resolvedOnesignalAppIdIos =
  ONESIGNAL_APP_ID || ONESIGNAL_APP_ID_IOS || DEFAULT_ONESIGNAL_APP_ID_IOS;
const resolvedOnesignalAppIdAndroid =
  ONESIGNAL_APP_ID || ONESIGNAL_APP_ID_ANDROID || DEFAULT_ONESIGNAL_APP_ID_ANDROID;

/** Projet EAS — toujours présent dans extra (évite projectId absent hors build EAS). */
const DEFAULT_EAS_PROJECT_ID = 'f509eb43-52af-44a9-b7f0-e8a7179a0aa3';

const easBuildProfile = String(process.env.EAS_BUILD_PROFILE || '');

/**
 * APNs : l’entitlement aps-environment doit être présent sur l’IPA (souvent oublié en bare workflow).
 * - production : App Store / TestFlight / profils « distribution »
 * - development : dev client / certificats dev
 * Surcharge : IOS_APS_ENVIRONMENT=production|development
 */
const iosApsEnvironment =
  process.env.IOS_APS_ENVIRONMENT ||
  ((['production', 'preview', 'store'].includes(easBuildProfile) ||
    NODE_ENV === 'production')
    ? 'production'
    : 'development');

/**
 * onesignal-expo-plugin `mode` doit suivre le même monde que `aps-environment`.
 * Ne pas se baser uniquement sur NODE_ENV : au prebuild local / certaines CI, NODE_ENV peut
 * différer de EAS_BUILD_PROFILE → plugin "development" + IPA prod = comportements iOS incorrects / crash au cold start.
 * Surcharge explicite : ONESIGNAL_PLUGIN_MODE=production|development
 */
const oneSignalPluginMode =
  typeof process.env.ONESIGNAL_PLUGIN_MODE === 'string' &&
  ['production', 'development'].includes(process.env.ONESIGNAL_PLUGIN_MODE)
    ? process.env.ONESIGNAL_PLUGIN_MODE
    : iosApsEnvironment === 'production'
      ? 'production'
      : 'development';

export default ({ config }) => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    ...config,
    name: APP_NAME || appJson.expo.name,
    version: APP_VERSION || appJson.expo.version,
    ios: {
      ...(appJson.expo.ios ?? {}),
      entitlements: {
        ...(appJson.expo.ios?.entitlements ?? {}),
        'aps-environment': iosApsEnvironment,
      },
    },
    /** Le plugin OneSignal doit rester en tête (recommandation OneSignal / Expo). */
    plugins: [
      [
        'onesignal-expo-plugin',
        {
          mode: oneSignalPluginMode,
          /** Icône status bar Android (blanc + transparence, source 96×96) → génère ic_stat_onesignal_default */
          smallIcons: ['./assets/android-notification/ic_stat_onesignal_source.png'],
          smallIconAccentColor: '#8BC34A',
        },
      ],
      ...(appJson.expo.plugins ?? []).filter(
        (p) =>
          !(
            Array.isArray(p) &&
            p[0] === 'onesignal-expo-plugin'
          ) && p !== 'onesignal-expo-plugin'
      ),
    ],
    extra: {
      ...(appJson.expo.extra ?? {}),
      env: {
        nodeEnv: NODE_ENV || DEFAULT_ENV.nodeEnv,
        apiBaseUrl: API_BASE_URL || DEFAULT_ENV.apiBaseUrl,
        apiBaseUrlDev: API_BASE_URL_DEV, // Development API URL
        apiTimeout: API_TIMEOUT || DEFAULT_ENV.apiTimeout,
        debugMode:
          typeof DEBUG_MODE !== 'undefined'
            ? DEBUG_MODE
            : DEFAULT_ENV.debugMode,
        offlineMode:
          typeof OFFLINE_MODE !== 'undefined'
            ? OFFLINE_MODE
            : DEFAULT_ENV.offlineMode,
        stripePublishableKey: STRIPE_PUBLISHABLE_KEY, // Stripe publishable key
        // Kill-switch runtime pour isoler un crash OneSignal sur iOS prod.
        enableOneSignal:
          typeof ENABLE_ONESIGNAL !== 'undefined'
            ? ENABLE_ONESIGNAL
            : 'true',
        // Par défaut, ne pas demander la permission OneSignal au cold start en prod.
        onesignalRequestPermissionAtStartup:
          typeof ONESIGNAL_REQUEST_PERMISSION_AT_STARTUP !== 'undefined'
            ? ONESIGNAL_REQUEST_PERMISSION_AT_STARTUP
            : 'false',
      },
      firebase: {
        apiKey: FIREBASE_API_KEY || DEFAULT_FIREBASE.apiKey,
        authDomain: FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE.authDomain,
        projectId: FIREBASE_PROJECT_ID || DEFAULT_FIREBASE.projectId,
        storageBucket:
          FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE.storageBucket,
        messagingSenderId:
          FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE.messagingSenderId,
        appId: FIREBASE_APP_ID || DEFAULT_FIREBASE.appId,
        measurementId:
          FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE.measurementId,
        iosClientId: FIREBASE_IOS_CLIENT_ID || DEFAULT_FIREBASE.iosClientId,
        androidClientId:
          FIREBASE_ANDROID_CLIENT_ID || DEFAULT_FIREBASE.androidClientId,
        webClientId: FIREBASE_WEB_CLIENT_ID || DEFAULT_FIREBASE.webClientId,
      },
      onesignal: {
        appIdIos: resolvedOnesignalAppIdIos,
        appIdAndroid: resolvedOnesignalAppIdAndroid,
      },
      /** Métadonnées build : vérifier en prod que plugin OneSignal et APNs sont alignés (Constants.expoConfig.extra). */
      onesignalBuild: {
        pluginMode: oneSignalPluginMode,
        iosApsEnvironment,
        easBuildProfile: easBuildProfile || null,
        nodeEnv: NODE_ENV || null,
      },
      /** Repris explicitement pour getExpoPushTokenAsync / Constants.expoConfig.extra.eas.projectId */
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ||
          appJson.expo.extra?.eas?.projectId ||
          DEFAULT_EAS_PROJECT_ID,
      },
    },
  },
});

