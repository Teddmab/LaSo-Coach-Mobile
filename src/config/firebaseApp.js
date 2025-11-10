import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
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
  ios: FIREBASE_IOS_CLIENT_ID,
  android: FIREBASE_ANDROID_CLIENT_ID,
  web: FIREBASE_WEB_CLIENT_ID,
};

export default getFirebaseApp;

