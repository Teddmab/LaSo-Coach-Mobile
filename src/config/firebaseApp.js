import 'firebase/auth'; // Ensure auth component registers
import { initializeApp, getApps } from 'firebase/app';
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

// Simple, immediate auth initialization using getAuth for React Native Expo Go environment.
// Using initializeAuth + persistence caused repeated component registration errors in Expo Go.
// We fall back to plain getAuth; persistence will be memory-only until a dev build is used.
const { getAuth } = require('firebase/auth');
try {
  firebaseAuthInstance = getAuth(firebaseApp);
  console.log('✅ Firebase Auth (simple getAuth) initialized');
} catch (e) {
  console.error('❌ Simple getAuth initialization failed:', e);
  firebaseAuthInstance = null;
}

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

