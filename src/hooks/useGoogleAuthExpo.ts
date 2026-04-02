import { useCallback, useState, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { firebaseOAuthClientIds } from '../config/firebaseApp';
import { useAuth } from '../context/FirebaseAuthContext';
import { getGoogleAuthHostingUrl } from '../config/googleAuthHosting';

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
   * Fonction pour se connecter avec Google via WebBrowser natif
   * Utilise WebBrowser.openBrowserAsync avec écoute des deep links
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

      console.log('🚀 Lancement de l\'authentification Google via Firebase Hosting...');

      // ✅ Utiliser la fonction de configuration qui pointe vers l'URL déjà déployée
      // Cette page gère le flux OAuth Google directement et redirige vers l'app
      const firebaseAuthUrl = getGoogleAuthHostingUrl();
      
      console.log(`🌐 [${Platform.OS}] Ouverture de Firebase Hosting:`, firebaseAuthUrl);
      console.log('🔗 [Google Auth] Écoute des deep links: lasocoach://auth');
      
      // Créer une promesse pour attendre le deep link
      let deepLinkResolve: ((url: string) => void) | null = null;
      let deepLinkReject: ((error: Error) => void) | null = null;
      
      const deepLinkPromise = new Promise<string>((resolve, reject) => {
        deepLinkResolve = resolve;
        deepLinkReject = reject;
      });
      
      // Écouter les deep links
      const deepLinkHandler = (event: { url: string }) => {
        console.log('🔗 [Google Auth] Deep link reçu:', event.url);
        if (event.url.startsWith('lasocoach://auth')) {
          if (deepLinkResolve) {
            deepLinkResolve(event.url);
          }
        }
      };
      
      const linkingSubscription = Linking.addEventListener('url', deepLinkHandler);
      
      // Ouvrir le browser natif
      const browserResult = await WebBrowser.openBrowserAsync(firebaseAuthUrl, {
        showInRecents: true,
      });
      
      console.log('📱 [Google Auth] Browser ouvert:', browserResult.type);
      
      // Si l'utilisateur ferme le browser immédiatement, annuler
      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        linkingSubscription.remove();
        console.log('ℹ️ Authentification Google annulée par l\'utilisateur');
        result = {
          user: null,
          error: null,
        };
        setIsPrompting(false);
        return result;
      }
      
      // Attendre le deep link avec un timeout
      try {
        const deepLinkUrl = await Promise.race([
          deepLinkPromise,
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Deep link non reçu dans les 60 secondes')), 60000)
          )
        ]);
        
        // Fermer le browser une fois le deep link reçu
        try {
          await WebBrowser.dismissBrowser();
        } catch (e) {
          // Ignorer si le browser est déjà fermé
        }
        
        linkingSubscription.remove();
        
        console.log('✅ [Google Auth] Deep link capturé:', deepLinkUrl);
        
        // Extraire l'id_token depuis le deep link
        try {
          const url = new URL(deepLinkUrl);
          const idToken = url.searchParams.get('id_token');
          const error = url.searchParams.get('error');
          
          if (error) {
            console.error('❌ Erreur OAuth:', error);
            result = {
              user: null,
              error: error || 'Erreur lors de l\'authentification Google',
            };
          } else if (idToken) {
            console.log('✅ idToken reçu depuis Firebase Hosting:', idToken.substring(0, 50) + '...');
            console.log(`📞 Appel ${isRegistration ? 'registerWithGoogle' : 'loginWithGoogle'}...`);

            // Utiliser la fonction appropriée (login ou register) avec Firebase
            result = await googleAuthFunction(idToken);

            console.log('✅ Authentification Firebase réussie');
          } else {
            console.error('❌ idToken manquant dans le deep link');
            result = {
              user: null,
              error: 'Token manquant. Veuillez réessayer.',
            };
          }
        } catch (parseError) {
          console.error('❌ Erreur parsing deep link:', parseError);
          result = {
            user: null,
            error: 'Erreur lors du traitement de la réponse. Veuillez réessayer.',
          };
        }
      } catch (timeoutError: any) {
        linkingSubscription.remove();
        console.error('❌ Timeout ou erreur:', timeoutError.message);
        result = {
          user: null,
          error: timeoutError.message || 'Le flux d\'authentification a pris trop de temps.',
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

