import { useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
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
 * Hook pour l'authentification Google utilisant expo-auth-session (WebView)
 * Alternative plus stable au SDK natif pour iOS
 * 
 * Avantages :
 * - Pas de crash natif
 * - Pas besoin de REVERSED_CLIENT_ID dans Info.plist
 * - Configuration plus simple
 * - Fonctionne avec Firebase Auth
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
        console.log('🚀 Utilisation de WebView (plus stable que SDK natif)');
        
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
   * Utilise une WebView au lieu du SDK natif
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

      console.log('🚀 Lancement de l\'authentification Google via WebView...');

      // Configuration OAuth Google
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Créer la requête d'authentification
      // IMPORTANT: Utiliser IdToken pour obtenir un token compatible Firebase
      // CRITIQUE: Pour éviter PKCE, créer la requête avec responseType: IdToken
      // et ne pas définir codeChallenge (PKCE est automatique pour Code, pas pour IdToken)
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'lasocoach', // Utiliser le scheme de l'app
      });

      // Créer AuthRequest avec responseType: IdToken
      // CRITIQUE: Désactiver PKCE explicitement car incompatible avec responseType: IdToken
      // PKCE est activé par défaut dans AuthRequest (usePKCE: true), il faut le désactiver
      const request = new AuthSession.AuthRequest({
        clientId: firebaseOAuthClientIds.web,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.IdToken,
        redirectUri: redirectUri,
        usePKCE: false, // CRITIQUE: Désactiver PKCE car incompatible avec IdToken
        extraParams: {
          prompt: 'consent', // Forcer la sélection de compte à chaque fois
        },
      });

      console.log('📱 Ouverture de la WebView Google...');
      console.log('🔗 Redirect URI:', request.redirectUri);

      // Ouvrir la WebView pour l'authentification
      const authResult = await request.promptAsync(discovery);

      console.log('📬 Résultat authentification:', authResult.type);

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

      if (authResult.type === 'error') {
        console.error('❌ Erreur authentification Google:', authResult.error);
        result = {
          user: null,
          error: authResult.error?.message || 'Erreur lors de l\'authentification Google',
        };
        setIsPrompting(false);
        return result;
      }

      if (authResult.type === 'success' && authResult.params?.id_token) {
        const idToken = authResult.params.id_token;
        console.log('✅ idToken reçu:', idToken.substring(0, 50) + '...');

        // Utiliser la fonction appropriée (login ou register) avec Firebase
        console.log(`📞 Appel ${isRegistration ? 'registerWithGoogle' : 'loginWithGoogle'}...`);
        result = await googleAuthFunction(idToken);

        console.log('✅ Authentification Firebase réussie');
      } else {
        console.error('❌ Réponse OAuth invalide:', authResult);
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

