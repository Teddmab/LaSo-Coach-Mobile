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
let authInitializationPromise = null;

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

// Lazy initialization of Firebase Auth to avoid "runtime not ready" error
const initializeAuthLazy = async () => {
  if (firebaseAuthInstance) {
    return firebaseAuthInstance;
  }

  if (authInitializationPromise) {
    return authInitializationPromise;
  }

  authInitializationPromise = new Promise((resolve, reject) => {
    try {
      // Delay to ensure Hermes runtime is ready
      setTimeout(() => {
        try {
          console.log('🔐 Initializing Firebase Auth (lazy)...');
          const { getAuth } = require('firebase/auth');
          firebaseAuthInstance = getAuth(firebaseApp);
          console.log('✅ Firebase Auth initialized successfully');
          resolve(firebaseAuthInstance);
        } catch (error) {
          console.error('❌ Firebase Auth initialization failed:', error);
          reject(error);
        }
      }, 100); // 100ms delay to ensure runtime is ready
    } catch (error) {
      reject(error);
    }
  });

  return authInitializationPromise;
};

export const getFirebaseApp = () => {
  return firebaseApp;
};

export const getFirebaseAuth = async () => {
  return await initializeAuthLazy();
};

export const firebaseOAuthClientIds = {
  ios: firebaseExtra.iosClientId || FIREBASE_IOS_CLIENT_ID,
  android: firebaseExtra.androidClientId || FIREBASE_ANDROID_CLIENT_ID,
  web: firebaseExtra.webClientId || FIREBASE_WEB_CLIENT_ID,
};

export default getFirebaseApp;

