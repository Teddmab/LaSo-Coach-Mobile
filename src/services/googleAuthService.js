import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebaseApp';

export const signInWithFirebaseIdToken = async (googleIdToken) => {
  if (!googleIdToken) {
    throw new Error('Google ID token is required.');
  }

  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(googleIdToken);
  const userCredential = await signInWithCredential(auth, credential);
  const firebaseIdToken = await userCredential.user.getIdToken();

  return {
    firebaseUser: userCredential.user,
    firebaseIdToken,
  };
};

export const signOutFromFirebase = async () => {
  const auth = getFirebaseAuth();
  try {
    await signOut(auth);
  } catch (error) {
    // Swallow sign-out errors to avoid blocking logout flow
    console.log('Firebase sign-out failed:', error?.message);
  }
};

export const getFreshFirebaseIdToken = async (forceRefresh = false) => {
  const auth = getFirebaseAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken(forceRefresh);
};

