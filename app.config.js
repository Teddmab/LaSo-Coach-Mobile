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
  APP_VERSION = '1.1.4',
  DEBUG_MODE,
  OFFLINE_MODE,
  NODE_ENV,
  STRIPE_PUBLISHABLE_KEY,
} = process.env;

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

export default ({ config }) => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    ...config,
    name: APP_NAME || appJson.expo.name,
    version: APP_VERSION || appJson.expo.version,
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
    },
  },
});

