import 'firebase/auth'; // side-effect: registers auth component definitions
import { initializeApp, getApps } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import Constants from 'expo-constants';
import {
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
} from '@env';

const firebaseExtra = Constants.expoConfig?.extra?.firebase ?? {};

// Fallback Firebase config from app.json (always available)
const defaultFirebaseConfig = {
  apiKey: 'AIzaSyDubBwQF27OUZyOMhzmNpIizw2D4dHxzO0',
  authDomain: 'lasocoach-39710.firebaseapp.com',
  projectId: 'lasocoach-39710',
  storageBucket: 'lasocoach-39710.appspot.com',
  messagingSenderId: '855620848279',
  appId: '1:855620848279:web:f93cbbf9c0d8f42faef7d2',
  measurementId: 'G-8JK6R4BGYG',
};

// Safely get env variables with fallbacks
const getEnvVar = (envVar: string | undefined, fallback: string): string => {
  // Check if envVar is defined and not empty
  if (envVar && typeof envVar === 'string' && envVar.trim() !== '') {
    return envVar;
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: firebaseExtra.apiKey || getEnvVar(FIREBASE_API_KEY, defaultFirebaseConfig.apiKey),
  authDomain: firebaseExtra.authDomain || getEnvVar(FIREBASE_AUTH_DOMAIN, defaultFirebaseConfig.authDomain),
  projectId: firebaseExtra.projectId || getEnvVar(FIREBASE_PROJECT_ID, defaultFirebaseConfig.projectId),
  storageBucket: firebaseExtra.storageBucket || getEnvVar(FIREBASE_STORAGE_BUCKET, defaultFirebaseConfig.storageBucket),
  messagingSenderId: firebaseExtra.messagingSenderId || getEnvVar(FIREBASE_MESSAGING_SENDER_ID, defaultFirebaseConfig.messagingSenderId),
  appId: firebaseExtra.appId || getEnvVar(FIREBASE_APP_ID, defaultFirebaseConfig.appId),
  measurementId: firebaseExtra.measurementId || getEnvVar(FIREBASE_MEASUREMENT_ID, defaultFirebaseConfig.measurementId),
};

// Validate configuration with fallbacks - don't throw, use defaults instead
if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
  console.warn('⚠️ [Firebase] Some config values missing, using defaults');
  // Use default config if critical values are missing
  Object.assign(firebaseConfig, defaultFirebaseConfig);
}

// Initialize Firebase app ONLY (not auth yet)
let firebaseApp;
let firebaseAuthInstance = null;
let firebaseInitError: Error | null = null;

// Safely initialize Firebase with error handling
try {
  // Check if Firebase is already initialized
  const existingApps = getApps();

  if (existingApps.length === 0) {
    // First time initialization
    firebaseApp = initializeApp(firebaseConfig);
    console.log('✅ [Firebase] App initialized successfully');
  } else {
    // Firebase already initialized (hot reload scenario)
    firebaseApp = existingApps[0];
    console.log('✅ [Firebase] Using existing app instance');
  }
} catch (error: any) {
  firebaseInitError = error;
  console.error('❌ [Firebase] Failed to initialize app:', error.message);
  // Don't throw - let the app continue, Firebase will be retried later
}

// Attempt simple getAuth first; if component registration error occurs, fallback to initializeAuth
// with explicit React Native persistence (AsyncStorage). This fallback is necessary in some Expo Go
// environments where auth component registration races the app initialization.
// Attempt initializeAuth with persistence; if component registration race occurs, schedule retries.
function attemptAuthInit(stage) {
  if (firebaseAuthInstance) return;
  if (!firebaseApp) {
    console.warn(`⚠️ [Firebase] Cannot initialize Auth at stage ${stage}: Firebase App not initialized`);
    return;
  }
  try {
    firebaseAuthInstance = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log(`✅ [Firebase] Auth initialized at stage ${stage}`);
  } catch (e: any) {
    console.warn(`⚠️ [Firebase] Auth init failed at stage ${stage}:`, e.message);
  }
}

// Only attempt auth init if Firebase App is initialized
if (firebaseApp) {
  attemptAuthInit('immediate');
  if (!firebaseAuthInstance) {
    setTimeout(() => {
      if (firebaseApp) attemptAuthInit('timeout-50ms');
    }, 50);
    setTimeout(() => {
      if (!firebaseAuthInstance && firebaseApp) {
        try {
          firebaseAuthInstance = getAuth(firebaseApp);
          if (firebaseAuthInstance) {
            console.log('✅ [Firebase] Auth obtained via getAuth');
          }
        } catch (finalErr: any) {
          console.warn('⚠️ [Firebase] getAuth failed, trying compat API:', finalErr.message);
          // Last resort: compat API fallback
          try {
            const compatApp = require('firebase/compat/app');
            require('firebase/compat/auth');
            if (!compatApp.apps.length) {
              compatApp.initializeApp(firebaseConfig);
            }
            firebaseAuthInstance = compatApp.auth();
            if (firebaseAuthInstance) {
              console.log('✅ [Firebase] Auth initialized via compat API');
            }
          } catch (compatErr: any) {
            console.error('❌ [Firebase] Compat API fallback also failed:', compatErr.message);
          }
        }
      }
    }, 300);
  }
} else {
  console.warn('⚠️ [Firebase] Skipping Auth initialization: Firebase App not initialized');
}

// Helper to expose debug status (used by AuthInitDebug or other diagnostics)
export const debugFirebaseAuthStatus = () => ({
  hasInstance: !!firebaseAuthInstance,
  currentUser: firebaseAuthInstance?.currentUser ?? null,
  persistence: firebaseAuthInstance?._getPersistence?.() ? 'custom' : 'memory',
});

export const getFirebaseApp = () => {
  if (!firebaseApp && !firebaseInitError) {
    // Retry initialization if it failed before
    try {
      const existingApps = getApps();
      if (existingApps.length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
        console.log('✅ [Firebase] App initialized on retry');
      } else {
        firebaseApp = existingApps[0];
      }
      firebaseInitError = null;
    } catch (error: any) {
      firebaseInitError = error;
      console.error('❌ [Firebase] Retry initialization failed:', error.message);
    }
  }
  
  if (!firebaseApp) {
    console.warn('⚠️ [Firebase] App not initialized, returning null');
  }
  
  return firebaseApp;
};

export const getFirebaseAuth = () => firebaseAuthInstance;
export const isCompatAuth = () => {
  if (!firebaseAuthInstance) return false;
  // Compat auth instances have functions as methods instead of modular symbols
  return typeof firebaseAuthInstance.signInWithEmailAndPassword === 'function';
};

export const firebaseOAuthClientIds = {
  ios: firebaseExtra.iosClientId || FIREBASE_IOS_CLIENT_ID,
  android: firebaseExtra.androidClientId || FIREBASE_ANDROID_CLIENT_ID,
  web: firebaseExtra.webClientId || FIREBASE_WEB_CLIENT_ID,
};

export default getFirebaseApp;

