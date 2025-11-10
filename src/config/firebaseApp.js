import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

let firebaseApp;
export const getFirebaseApp = () => {
  if (!firebaseApp) {
    if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
      throw new Error('Firebase configuration is missing required values.');
    }
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return firebaseApp;
};

export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  return getAuth(app);
};

export const firebaseOAuthClientIds = {
  ios: firebaseExtra.iosClientId || FIREBASE_IOS_CLIENT_ID,
  android: firebaseExtra.androidClientId || FIREBASE_ANDROID_CLIENT_ID,
  web: firebaseExtra.webClientId || FIREBASE_WEB_CLIENT_ID,
};

export default getFirebaseApp;

