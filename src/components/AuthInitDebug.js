import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getFirebaseAuth } from '../config/firebaseApp';

/**
 * Small runtime debug helper to confirm Firebase Auth component registration
 * inside the React Native (Expo Go / Dev Client) environment.
 * Logs auth instance availability and currentUser state once on mount and again after 2s.
 */
export default function AuthInitDebug() {
  const [status, setStatus] = useState('initializing');
  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        console.log('[AuthInitDebug] ✅ Auth instance keys:', Object.keys(auth));
        console.log('[AuthInitDebug] currentUser:', auth.currentUser);
        setStatus('auth-instance-present');
        // Re-check after a short delay to see if user auto-loaded
        setTimeout(() => {
          console.log('[AuthInitDebug] (2s later) currentUser:', auth.currentUser);
        }, 2000);
      } else {
        console.warn('[AuthInitDebug] ❌ Auth instance is NULL');
        setStatus('auth-null');
      }
    } catch (e) {
      console.error('[AuthInitDebug] Exception accessing auth:', e);
      setStatus('error');
    }
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>Auth Debug: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 6,
    zIndex: 9999,
  },
  text: {
    fontSize: 10,
    color: '#fff',
  },
});
