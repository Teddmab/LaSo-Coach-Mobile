import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { firebaseOAuthClientIds } from '../config/firebaseApp';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

/**
 * Hook to initiate Google sign-in using Expo AuthSession providers.
 * Returns a function to trigger the flow and helpers for availability/loading.
 */
export const useGoogleAuth = () => {
  const { loginWithGoogle } = useAuth();
  const [isPrompting, setIsPrompting] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'lasocoach',
    useProxy: true,
    projectNameForProxy: '@teddmabulay/laso-coach',
  });

  const authRequestConfig = {
    scopes: ['openid', 'email', 'profile'],
    redirectUri,
  };

  if (firebaseOAuthClientIds.android) {
    authRequestConfig.androidClientId = firebaseOAuthClientIds.android;
  }
  if (firebaseOAuthClientIds.ios) {
    authRequestConfig.iosClientId = firebaseOAuthClientIds.ios;
  }
  if (firebaseOAuthClientIds.web) {
    authRequestConfig.webClientId = firebaseOAuthClientIds.web;
    authRequestConfig.expoClientId = firebaseOAuthClientIds.web;
  }

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    ...authRequestConfig,
  });

  console.log('🔐 Google auth redirect URI:', request?.redirectUri);
  console.log('🔐 Google client IDs configured:', {
    android: !!firebaseOAuthClientIds.android,
    ios: !!firebaseOAuthClientIds.ios,
    web: !!firebaseOAuthClientIds.web,
  });

  const signInWithGoogle = useCallback(async () => {
    const missingClientId = Platform.select({
      ios: !firebaseOAuthClientIds.ios,
      android: !firebaseOAuthClientIds.android,
      default: !firebaseOAuthClientIds.web,
    });

    if (missingClientId) {
      return {
        user: null,
        error: "Connexion Google indisponible. Identifiants OAuth manquants pour cette plateforme.",
      };
    }

    if (!request) {
      return {
        user: null,
        error: 'Configuration Google en cours. Veuillez réessayer dans un instant.',
      };
    }

    try {
      setIsPrompting(true);
      const result = await promptAsync({
        useProxy: Platform.OS !== 'web',
        projectNameForProxy: '@teddmabulay/laso-coach',
      });

      if (result.type === 'success' && result.params?.id_token) {
        return await loginWithGoogle(result.params.id_token);
      }

      if (result.type === 'cancel') {
        return { user: null, error: 'Connexion Google annulée.' };
      }

      const errorMessage =
        result.params?.error_description ||
        result.params?.error ||
        'Impossible de se connecter avec Google.';

      return { user: null, error: errorMessage };
    } catch (error) {
      return {
        user: null,
        error: error?.message || 'Impossible de se connecter avec Google.',
      };
    } finally {
      setIsPrompting(false);
    }
  }, [loginWithGoogle, promptAsync, request]);

  return {
    signInWithGoogle,
    isAvailable:
      !!request &&
      !!Platform.select({
        ios: firebaseOAuthClientIds.ios,
        android: firebaseOAuthClientIds.android,
        default: firebaseOAuthClientIds.web,
      }),
    isPrompting,
  };
};

export default useGoogleAuth;

