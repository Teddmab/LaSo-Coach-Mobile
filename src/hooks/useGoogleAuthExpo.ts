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
 * Hook pour l'authentification Google utilisant expo-auth-session avec WebView
 * Utilise un redirect URI direct (comme sur la version web) au lieu du proxy Expo
 * 
 * Avantages :
 * - Pas de crash natif
 * - Redirect URI direct (pas de proxy)
 * - Configuration simple
 * - Fonctionne avec Firebase Auth
 * - Même approche que la version web
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
        console.log('🌐 Utilisation de WebView avec redirect URI direct (comme version web)');
        
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
   * Utilise une WebView avec redirect URI direct (comme version web)
   * Pas de proxy Expo - utilise le custom scheme de l'app
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

      console.log('🚀 Lancement de l\'authentification Google via WebView (redirect URI direct)...');

      // Configuration OAuth Google
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Utiliser le custom scheme directement pour éviter le problème de sessionStorage
      // Le handler Firebase nécessite sessionStorage qui n'est pas accessible dans WebView
      // On utilise donc le custom scheme et on gère l'échange du code nous-mêmes
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: false, // Pas de proxy
        scheme: 'lasocoach', // Custom scheme de l'app
        path: 'oauth', // Path pour le redirect
      });
      
      console.log(`🌐 [${Platform.OS}] Redirect URI (custom scheme, sans Firebase handler):`, redirectUri);
      console.log('⚠️ IMPORTANT: Ce redirect URI doit être configuré dans Google Cloud Console');

      // Utiliser responseType: 'id_token' directement avec un nonce
      // Cela évite complètement le handler Firebase qui nécessite sessionStorage
      // Le nonce garantit la sécurité sans avoir besoin de sessionStorage
      const nonce = await Crypto.randomUUID();
      console.log('🔐 Nonce généré pour sécurité OAuth:', nonce.substring(0, 20) + '...');

      const request = new AuthSession.AuthRequest({
        clientId: firebaseOAuthClientIds.web,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken, // Obtenir directement l'id_token
        redirectUri: redirectUri,
        usePKCE: false, // PKCE non compatible avec IdToken
        extraParams: {
          prompt: 'consent', // Forcer la sélection de compte à chaque fois
          nonce: nonce, // CRITIQUE: Requis par Google pour responseType: IdToken (sécurité)
        },
      });

      console.log('📱 Ouverture de la WebView Google avec redirect URI direct...');
      console.log('🔗 Redirect URI:', request.redirectUri);

      // Utiliser promptAsync() sans proxy - redirect URI direct (comme version web)
      const authResult = await request.promptAsync(discovery, {
        useProxy: false, // Pas de proxy - redirect URI direct
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

      // Gérer le cas "dismiss" qui arrive quand l'authentification est annulée
      if (authResult.type === 'dismiss') {
        console.log('ℹ️ Authentification Google dismissée par l\'utilisateur');
        result = {
          user: null,
          error: null, // Pas d'erreur pour une annulation utilisateur
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

      // Vérifier le résultat et extraire l'id_token directement
      if (authResult.type === 'success') {
        // Avec responseType: 'id_token', l'id_token est directement dans authResult.params
        const idToken = authResult.params?.id_token;
        
        if (idToken) {
          console.log('✅ idToken reçu directement (sans handler Firebase):', idToken.substring(0, 50) + '...');
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

