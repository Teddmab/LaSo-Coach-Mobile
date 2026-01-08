import { useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { firebaseOAuthClientIds } from '../config/firebaseApp';
import { useAuth } from '../context/FirebaseAuthContext';

// Fermer la WebView après authentification
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthResult {
  user: any | null;
  error: string | null;
}

interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<GoogleAuthResult>;
  isAvailable: boolean;
  isPrompting: boolean;
}

/**
 * Hook pour l'authentification Google utilisant expo-auth-session avec WebView et proxy Expo
 * Alternative plus stable au SDK natif pour iOS
 * 
 * Avantages :
 * - Pas de crash natif
 * - Proxy Expo génère une URL HTTPS valide (requis par Google OAuth Web Client)
 * - Configuration simple
 * - Fonctionne avec Firebase Auth
 * 
 * Note: Garder l'app au premier plan pendant l'authentification pour éviter "Something went wrong"
 */
export const useGoogleAuthExpo = (isRegistration: boolean = false): UseGoogleAuthReturn => {
  const { loginWithGoogle, registerWithGoogle } = useAuth();
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  const googleAuthFunction = isRegistration ? registerWithGoogle : loginWithGoogle;

  // Configuration de l'authentification Google avec expo-auth-session
  useEffect(() => {
    const configureGoogleAuth = async (): Promise<void> => {
      try {
        // Vérifier que le Web Client ID est disponible
        if (!firebaseOAuthClientIds.web) {
          console.error('❌ FIREBASE_WEB_CLIENT_ID manquant !');
          setIsConfigured(false);
          return;
        }

        console.log('🔧 Configuration Google Auth avec expo-auth-session');
        console.log('🌐 Web Client ID:', firebaseOAuthClientIds.web?.substring(0, 30) + '...');
        console.log('📱 Plateforme:', Platform.OS);
        console.log('🌐 Utilisation de WebView avec proxy Expo (URL HTTPS valide pour Google OAuth)');
        
        setIsConfigured(true);
      } catch (error: any) {
        console.error('❌ Erreur configuration Google Auth:', error);
        setIsConfigured(false);
      }
    };

    configureGoogleAuth();
  }, []);

  /**
   * Fonction pour se connecter avec Google via expo-auth-session
   * Utilise une WebView avec proxy Expo (URL HTTPS valide requise par Google OAuth Web Client)
   * IMPORTANT: Garder l'app au premier plan pendant l'authentification
   */
  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    // Vérifier que la configuration est prête
    if (!isConfigured) {
      return {
        user: null,
        error: 'Configuration Google en cours. Veuillez réessayer dans un instant.',
      };
    }

    if (!firebaseOAuthClientIds.web) {
      return {
        user: null,
        error: 'Configuration Google incomplète (webClientId manquant).',
      };
    }

    let result: GoogleAuthResult | null = null;

    try {
      setIsPrompting(true);

      console.log('🚀 Lancement de l\'authentification Google via WebView avec proxy Expo...');
      console.log('⚠️ IMPORTANT: Gardez l\'app au premier plan pendant l\'authentification');

      // Configuration OAuth Google
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // CRITIQUE: Utiliser le proxy Expo avec useProxy: true
      // Google OAuth Web Client n'accepte que les URLs HTTPS (pas les deep links)
      // Le proxy Expo génère une URL HTTPS valide: https://auth.expo.io/@owner/slug
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true, // CRITIQUE: Utiliser le proxy Expo pour obtenir une URL HTTPS
      });
      console.log(`🌐 [${Platform.OS}] Redirect URI (proxy Expo):`, redirectUri);

      // CRITIQUE: Générer un nonce aléatoire pour responseType: IdToken
      // Google exige un nonce pour des raisons de sécurité (prévention des attaques de rejeu)
      const nonce = await Crypto.randomUUID();
      console.log('🔐 Nonce généré pour sécurité OAuth:', nonce.substring(0, 20) + '...');

      // CRITIQUE: Utiliser responseType: IdToken pour obtenir directement l'id_token
      // Le proxy Expo gère parfaitement le flow IdToken avec WebView
      const request = new AuthSession.AuthRequest({
        clientId: firebaseOAuthClientIds.web,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri: redirectUri,
        usePKCE: false, // PKCE non compatible avec IdToken
        extraParams: {
          prompt: 'consent', // Forcer la sélection de compte à chaque fois
          nonce: nonce, // CRITIQUE: Requis par Google pour responseType: IdToken (sécurité)
        },
      });

      console.log('📱 Ouverture de la WebView Google avec proxy Expo...');
      console.log('🔗 Redirect URI:', request.redirectUri);

      // CRITIQUE: Utiliser promptAsync() avec useProxy: true pour utiliser le proxy Expo
      // Le proxy Expo génère une URL HTTPS valide que Google accepte
      // IMPORTANT: Garder l'app au premier plan pendant l'authentification pour éviter "Something went wrong"
      const authResult = await request.promptAsync(discovery, {
        useProxy: true, // CRITIQUE: Utiliser le proxy Expo pour obtenir une URL HTTPS valide
      });

      console.log('📬 Résultat authentification:', authResult.type);
      console.log('📋 Détails du résultat:', JSON.stringify(authResult, null, 2));

      // Vérifier le résultat
      if (authResult.type === 'cancel') {
        console.log('ℹ️ Authentification Google annulée par l\'utilisateur');
        result = {
          user: null,
          error: null,
        };
        setIsPrompting(false);
        return result;
      }

      // CRITIQUE: Gérer le cas "dismiss" qui arrive quand le proxy Expo ne peut pas rediriger
      if (authResult.type === 'dismiss') {
        console.warn('⚠️ Authentification Google dismissée - Le proxy Expo n\'a pas pu rediriger');
        console.warn('⚠️ Cela peut arriver si l\'app est passée en arrière-plan pendant l\'authentification');
        console.warn('⚠️ Solution: Gardez l\'app au premier plan pendant toute l\'authentification');
        
        result = {
          user: null,
          error: 'L\'authentification a été interrompue. Veuillez réessayer en gardant l\'application au premier plan pendant toute la durée de l\'authentification.',
        };
        setIsPrompting(false);
        return result;
      }

      if (authResult.type === 'error') {
        console.error('❌ Erreur authentification Google:', authResult.error);
        result = {
          user: null,
          error: authResult.error?.message || 'Erreur lors de l\'authentification Google',
        };
        setIsPrompting(false);
        return result;
      }

      // Vérifier le résultat et extraire l'id_token
      if (authResult.type === 'success') {
        // Avec promptAsync(), l'id_token est directement dans authResult.params
        const idToken = authResult.params?.id_token;
        
        if (idToken) {
          console.log('✅ idToken reçu depuis proxy Expo:', idToken.substring(0, 50) + '...');
          console.log(`📞 Appel ${isRegistration ? 'registerWithGoogle' : 'loginWithGoogle'}...`);

          // Utiliser la fonction appropriée (login ou register) avec Firebase
          result = await googleAuthFunction(idToken);

          console.log('✅ Authentification Firebase réussie');
        } else {
          console.error('❌ Réponse OAuth invalide - idToken manquant:', authResult.params);
          result = {
            user: null,
            error: 'Réponse OAuth invalide. Veuillez réessayer.',
          };
        }
      } else {
        console.error('❌ Réponse OAuth invalide:', authResult.type);
        result = {
          user: null,
          error: 'Réponse OAuth invalide. Veuillez réessayer.',
        };
      }

    } catch (error: any) {
      console.error('❌ Erreur Google Auth:', error);
      console.error('❌ Message:', error.message);
      console.error('❌ Stack:', error.stack);

      let userMessage = 'Impossible de se connecter avec Google.';

      if (error.message?.includes('network') || error.message?.includes('Network')) {
        userMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error.message?.includes('timeout')) {
        userMessage = 'La connexion a pris trop de temps. Veuillez réessayer.';
      } else if (error.message) {
        userMessage = error.message;
      }

      result = {
        user: null,
        error: userMessage,
      };
    } finally {
      setIsPrompting(false);
    }

    return result || { user: null, error: 'Erreur inconnue' };
  }, [googleAuthFunction, isConfigured, isRegistration]);

  return {
    signInWithGoogle,
    isAvailable: isConfigured,
    isPrompting,
  };
};

export default useGoogleAuthExpo;

