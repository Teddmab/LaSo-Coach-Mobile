// Minimal Firebase Auth smoke test in Node (to isolate environment issue)
// Run: node scripts/firebaseAuthSmokeTest.js
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

// Use env vars injected by dotenv if available
require('dotenv').config();

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

console.log('[SmokeTest] Firebase config keys present:', Object.keys(config).filter(k => !!config[k]));

try {
  const app = initializeApp(config);
  console.log('[SmokeTest] App initialized:', app.name);
  const auth = getAuth(app);
  console.log('[SmokeTest] getAuth(app) returned object keys:', Object.keys(auth));
  console.log('[SmokeTest] currentUser initially:', auth.currentUser);
  console.log('[SmokeTest] SUCCESS: Auth component is registered in Node environment');
} catch (e) {
  console.error('[SmokeTest] FAILURE: getAuth/app threw error:', e);
  process.exit(1);
}
