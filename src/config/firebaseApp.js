import 'firebase/auth'; // Ensure auth component registers (side-effect)
import { initializeApp, getApps } from 'firebase/app';
// Fallback React Native auth initialization imports
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
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

const firebaseConfig = {
  apiKey: firebaseExtra.apiKey || FIREBASE_API_KEY,
  authDomain: firebaseExtra.authDomain || FIREBASE_AUTH_DOMAIN,
  projectId: firebaseExtra.projectId || FIREBASE_PROJECT_ID,
  storageBucket: firebaseExtra.storageBucket || FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseExtra.messagingSenderId || FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseExtra.appId || FIREBASE_APP_ID,
  measurementId: firebaseExtra.measurementId || FIREBASE_MEASUREMENT_ID,
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
  throw new Error('Firebase configuration is missing required values.');
}

// Initialize Firebase app ONLY (not auth yet)
let firebaseApp;
let firebaseAuthInstance = null;

// Check if Firebase is already initialized
const existingApps = getApps();

if (existingApps.length === 0) {
  // First time initialization
  console.log('🔥 Initializing Firebase App...');
  firebaseApp = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized:', firebaseApp.name);
} else {
  // Firebase already initialized (hot reload scenario)
  console.log('♻️ Firebase App already initialized');
  firebaseApp = existingApps[0];
}

// Attempt simple getAuth first; if component registration error occurs, fallback to initializeAuth
// with explicit React Native persistence (AsyncStorage). This fallback is necessary in some Expo Go
// environments where auth component registration races the app initialization.
const { getAuth } = require('firebase/auth');
try {
  firebaseAuthInstance = getAuth(firebaseApp);
  console.log('✅ Firebase Auth (simple getAuth) initialized');
} catch (e) {
  console.error('❌ Simple getAuth initialization failed:', e);
  // Detect specific component registration issue to trigger fallback
  const msg = String(e?.message || '');
  if (msg.includes('Component auth has not been registered')) {
    console.log('🛟 Fallback: attempting initializeAuth with React Native persistence...');
    try {
      firebaseAuthInstance = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      console.log('✅ Firebase Auth fallback initializeAuth succeeded');
    } catch (fallbackErr) {
      console.error('❌ Fallback initializeAuth also failed:', fallbackErr);
      firebaseAuthInstance = null;
    }
  }
}

// Helper to expose debug status (used by AuthInitDebug or other diagnostics)
export const debugFirebaseAuthStatus = () => ({
  hasInstance: !!firebaseAuthInstance,
  currentUser: firebaseAuthInstance?.currentUser ?? null,
  persistence: firebaseAuthInstance?._getPersistence?.() ? 'custom' : 'memory',
});

export const getFirebaseApp = () => {
  return firebaseApp;
};

export const getFirebaseAuth = () => firebaseAuthInstance;

export const firebaseOAuthClientIds = {
  ios: firebaseExtra.iosClientId || FIREBASE_IOS_CLIENT_ID,
  android: firebaseExtra.androidClientId || FIREBASE_ANDROID_CLIENT_ID,
  web: firebaseExtra.webClientId || FIREBASE_WEB_CLIENT_ID,
};

export default getFirebaseApp;

