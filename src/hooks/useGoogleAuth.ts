import { useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { firebaseOAuthClientIds } from '../config/firebaseApp';
import { useAuth } from '../context/FirebaseAuthContext';

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
 * Hook pour l'authentification Google en utilisant le SDK NATIF.
 * Plus de WebView ! Plus de proxy Expo ! Authentification native directe.
 */
export const useGoogleAuth = (isRegistration: boolean = false): UseGoogleAuthReturn => {
  const { loginWithGoogle, registerWithGoogle } = useAuth();
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  // Sélectionner la bonne fonction selon le mode
  // Pour l'inscription, utiliser registerWithGoogle, sinon loginWithGoogle
  const googleAuthFunction = isRegistration ? registerWithGoogle : loginWithGoogle;

  // Configuration du SDK Google Sign-In (une seule fois)
  // IMPORTANT: Configuration lazy pour éviter les crashes au démarrage sur iOS
  useEffect(() => {
    const configureGoogleSignIn = async (): Promise<void> => {
      try {
        // Vérifier que le Web Client ID est disponible
        if (!firebaseOAuthClientIds.web) {
          console.error('❌ FIREBASE_WEB_CLIENT_ID manquant !');
          setIsConfigured(false);
          return;
        }

        // Sur iOS, vérifier que iosClientId est présent AVANT de configurer
        if (Platform.OS === 'ios') {
          if (!firebaseOAuthClientIds.ios) {
            console.error('❌ [iOS] FIREBASE_IOS_CLIENT_ID manquant ! Le SDK Google Sign-In ne peut pas être configuré.');
            setIsConfigured(false);
            return;
          }
        }

        // Configuration du SDK natif
        // IMPORTANT: offlineAccess DOIT être true pour obtenir l'idToken !
        const config: any = {
          webClientId: firebaseOAuthClientIds.web, // Pour Firebase Auth
          offlineAccess: true, // IMPORTANT: true pour obtenir idToken
          forceCodeForRefreshToken: true, // Force l'obtention du token
          scopes: ['email', 'profile'], // Scopes demandés
          // CRITICAL: Force account selection on every sign-in attempt
          // This prevents "signing back in" message and auto-reconnection
          hostedDomain: undefined, // Don't restrict to specific domain
        };
        
        // Sur iOS, ajouter iosClientId pour éviter l'erreur "failed to determine clientId"
        if (Platform.OS === 'ios' && firebaseOAuthClientIds.ios) {
          config.iosClientId = firebaseOAuthClientIds.ios;
          console.log('🍎 [iOS] Ajout de iosClientId à la configuration Google Sign-In');
        }
        
        console.log('🔧 Configuration GoogleSignin avec:', {
          webClientId: firebaseOAuthClientIds.web,
          iosClientId: Platform.OS === 'ios' ? firebaseOAuthClientIds.ios : undefined,
          hasWebClientId: !!firebaseOAuthClientIds.web,
          hasIosClientId: Platform.OS === 'ios' ? !!firebaseOAuthClientIds.ios : false,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          scopes: ['email', 'profile'],
        });

        // Sur iOS, wrapper dans try-catch pour éviter les crashes lors de la configuration
        try {
          GoogleSignin.configure(config);
          console.log('✅ Google Sign-In SDK natif configuré');
          console.log('🔐 Web Client ID:', firebaseOAuthClientIds.web);
          console.log('📱 Plateforme:', Platform.OS);
          console.log('🚀 SDK NATIF - Pas de WebView !');
          setIsConfigured(true);
        } catch (configError: any) {
          console.error('❌ Erreur lors de GoogleSignin.configure():', configError);
          console.error('❌ Message:', configError.message);
          console.error('❌ Stack:', configError.stack);
          
          // Sur iOS, si la configuration échoue, ne pas faire crash l'app
          if (Platform.OS === 'ios') {
            console.error('⚠️ [iOS] Configuration Google Sign-In échouée. L\'authentification Google ne sera pas disponible.');
            setIsConfigured(false);
          } else {
            throw configError;
          }
        }
      } catch (error: any) {
        console.error('❌ Erreur configuration Google Sign-In:', error);
        console.error('❌ Message:', error.message);
        console.error('❌ Stack:', error.stack);
        setIsConfigured(false);
      }
    };

    // Délai pour éviter l'initialisation au démarrage (peut causer des crashes)
    // Initialisation lazy : seulement quand nécessaire
    const timeoutId = setTimeout(() => {
      configureGoogleSignIn();
    }, 500); // Attendre 500ms après le montage du composant

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Fonction pour se connecter avec Google (SDK natif)
   * Ouvre l'UI native de Google (pas de WebView)
   */
  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    // Vérifier que le SDK est configuré
    if (!isConfigured) {
      return {
        user: null,
        error: 'Configuration Google en cours. Veuillez réessayer dans un instant.',
      };
    }

    // Variable pour stocker le résultat
    let result: GoogleAuthResult | null = null;

    try {
      setIsPrompting(true);

      // Vérifier que les Google Play Services sont disponibles (Android uniquement)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      console.log('🚀 Lancement de l\'authentification Google native...');
      
      // Sur iOS, simplifier le processus pour éviter les crashes
      if (Platform.OS === 'ios') {
        console.log('🍎 [iOS] Configuration simplifiée pour éviter les crashes...');
        
        // Configuration minimale et robuste pour iOS
        const iosConfig: any = {
          webClientId: firebaseOAuthClientIds.web,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          scopes: ['email', 'profile'],
        };
        
        if (firebaseOAuthClientIds.ios) {
          iosConfig.iosClientId = firebaseOAuthClientIds.ios;
          console.log('🍎 [iOS] iosClientId configuré:', firebaseOAuthClientIds.ios.substring(0, 30) + '...');
        } else {
          console.warn('⚠️ [iOS] iosClientId manquant !');
        }
        
        try {
          GoogleSignin.configure(iosConfig);
          console.log('✅ [iOS] Configuration Google Sign-In réussie');
        } catch (configError: any) {
          console.error('❌ [iOS] Erreur lors de la configuration:', configError);
          throw new Error(`Configuration Google Sign-In échouée: ${configError.message || 'Erreur inconnue'}`);
        }
        
        // Attendre un peu pour que la configuration soit appliquée
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Sur Android, garder la logique de révocation pour éviter la reconnexion automatique
        console.log('🤖 [Android] Révocation de l\'accès précédent...');
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.log('ℹ️ Pas de session précédente');
        }
      }
      
      console.log('📱 Ouverture de l\'UI Google pour sélection de compte...');
      
      let userInfo: any;
      try {
        // Utiliser signIn() avec gestion d'erreurs robuste
        userInfo = await GoogleSignin.signIn();
      } catch (signInError: any) {
        console.error('❌ [Google Sign-In] Erreur lors de signIn():', signInError);
        console.error('❌ [Google Sign-In] Code erreur:', signInError.code);
        console.error('❌ [Google Sign-In] Message:', signInError.message);
        console.error('❌ [Google Sign-In] Stack:', signInError.stack);
        
        // Gérer les erreurs spécifiques iOS avec gestion robuste pour éviter les crashes
        if (Platform.OS === 'ios') {
          // Erreur commune iOS : Connexion annulée
          if (signInError.code === 'SIGN_IN_CANCELLED' || 
              signInError.code === '10' || 
              signInError.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('ℹ️ [iOS] Connexion Google annulée par l\'utilisateur');
            result = {
              user: null,
              error: null,
            };
            setIsPrompting(false);
            return result;
          }
          
          // Erreur de configuration - ne pas faire crash l'app
          if (signInError.message?.includes('configuration') || 
              signInError.message?.includes('clientId') ||
              signInError.message?.includes('REVERSED_CLIENT_ID') ||
              signInError.message?.includes('URL scheme')) {
            const errorMsg = 'Configuration Google Sign-In incorrecte. Vérifiez que REVERSED_CLIENT_ID est dans les URL schemes.';
            console.error('❌ [iOS]', errorMsg);
            result = {
              user: null,
              error: errorMsg,
            };
            setIsPrompting(false);
            return result;
          }
          
          // Erreur réseau ou autre - ne pas faire crash
          if (signInError.message?.includes('network') || 
              signInError.message?.includes('Network') ||
              signInError.message?.includes('timeout')) {
            const errorMsg = 'Erreur de connexion. Vérifiez votre connexion internet.';
            console.error('❌ [iOS]', errorMsg);
            result = {
              user: null,
              error: errorMsg,
            };
            setIsPrompting(false);
            return result;
          }
          
          // Pour toute autre erreur iOS, retourner gracieusement sans crash
          const errorMsg = signInError.message || 'Erreur lors de la connexion Google';
          console.error('❌ [iOS] Erreur inconnue:', errorMsg);
          result = {
            user: null,
            error: errorMsg,
          };
          setIsPrompting(false);
          return result;
        }
        
        // Pour Android, propager l'erreur normalement
        throw signInError;
      }

      console.log('📦 USERINFO BRUT:', JSON.stringify(userInfo, null, 2));
      console.log('👤 User présent ?', !!(userInfo as any)?.user);
      console.log('📧 Email:', (userInfo as any)?.user?.email);
      console.log('🔑 idToken dans userInfo ?', !!(userInfo as any)?.idToken);

      // CRITICAL: Check if user cancelled - but be more lenient
      // userInfo can be returned even if idToken is not directly in it
      // We should check if userInfo exists and has a user object
      // Only treat as cancellation if userInfo is completely null/undefined
      if (!userInfo) {
        console.log('ℹ️ [useGoogleAuth] Connexion Google annulée - userInfo est null/undefined');
        result = {
          user: null,
          error: null, // No error for cancellation - user made a choice
        };
        setIsPrompting(false);
        return result;
      }

      // If userInfo exists but has no user, it might still be valid
      // Some SDK versions return userInfo without user object directly
      // We'll try to get the idToken anyway

      console.log('✅ userInfo reçu, tentative de récupération de l\'idToken...');

      // OPTIMIZED: Get ID Token efficiently
      // Try to get idToken from userInfo first, then fallback to getTokens()
      let idToken: string | null = (userInfo as any)?.idToken || null;

      // If idToken not in userInfo, get it via getTokens() (most reliable method)
      if (!idToken) {
        console.log('⚠️ idToken absent, récupération via getTokens()...');
        try {
          const tokens: any = await GoogleSignin.getTokens();
          idToken = (tokens as any)?.idToken || null;
          
          if (idToken) {
            console.log('✅ idToken récupéré');
          }
        } catch (tokenError: any) {
          // Only treat as cancellation if explicitly cancelled
          if (tokenError?.code === statusCodes.SIGN_IN_CANCELLED || 
              tokenError?.code === 'SIGN_IN_CANCELLED' ||
              tokenError?.message?.toLowerCase().includes('cancel')) {
            console.log('ℹ️ Connexion annulée');
            result = {
              user: null,
              error: null,
            };
            setIsPrompting(false);
            return result;
          }
          // Continue for other errors - will be handled below
        }
      } else {
        console.log('✅ idToken présent dans userInfo');
      }

      console.log('🔑 idToken final:', idToken ? idToken.substring(0, 50) + '...' : 'VIDE');

      // OPTIMIZED: Simplified token validation
      // If no idToken after getTokens(), check if user selected an account
      if (!idToken) {
        // If userInfo has user data, user selected an account but token failed
        if ((userInfo as any)?.user) {
          console.error('❌ Compte sélectionné mais idToken introuvable');
          result = {
            user: null,
            error: 'Impossible de récupérer le token. Veuillez réessayer.',
          };
          setIsPrompting(false);
          return result;
        } else {
          // No user data and no token = cancellation
          console.log('ℹ️ Connexion annulée');
          result = {
            user: null,
            error: null,
          };
          setIsPrompting(false);
          return result;
        }
      }

      // If we reach here, we should have an idToken
      if (!idToken) {
        console.error('❌ CRITIQUE: Pas d\'idToken après toutes les tentatives');
        result = {
          user: null,
          error: 'Erreur lors de l\'authentification. Veuillez réessayer.',
        };
        setIsPrompting(false);
        return result;
      }

      // Utiliser la fonction appropriée (login ou register) avec Firebase
      console.log(`📞 Appel ${isRegistration ? 'registerWithGoogle' : 'loginWithGoogle'}...`);
      console.log('📤 Envoi idToken à Firebase...');
      result = await googleAuthFunction(idToken);

      console.log('✅ Authentification Firebase réussie');

    } catch (error: any) {
      console.error('❌ Erreur Google Sign-In:', error);
      console.error('❌ Code erreur:', error.code);
      console.error('❌ Message erreur:', error.message);

      // CRITICAL: Check for cancellation FIRST - multiple ways user can cancel
      const isCancelled = 
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        error.code === 'SIGN_IN_CANCELLED' ||
        error.message?.toLowerCase().includes('cancel') ||
        error.message?.toLowerCase().includes('annulé') ||
        error.message?.toLowerCase().includes('cancelled');

      if (isCancelled) {
        // CRITICAL: User cancelled - STOP immediately, don't proceed
        console.log('ℹ️ [useGoogleAuth] Connexion Google annulée par l\'utilisateur');
        console.log('🛑 Arrêt du processus d\'authentification - aucune connexion ne sera effectuée');
        // Return early - don't proceed with any authentication
        // No error message for cancellation (it's a user choice, not an error)
        result = {
          user: null,
          error: null, // No error for cancellation - user made a choice
        };
        setIsPrompting(false);
        return result;
      }

      // Gestion des erreurs spécifiques du SDK Google Sign-In
      let userMessage = 'Impossible de se connecter avec Google.';

      if (error.code === statusCodes.IN_PROGRESS) {
        userMessage = 'Une connexion est déjà en cours.';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        userMessage = 'Google Play Services n\'est pas disponible. Mettez à jour Google Play Services.';
      } else if (
        error.code === 10 || 
        error.message?.includes('DEVELOPER_ERROR') || 
        error.message?.includes('Developer_error') ||
        error.message?.includes('developer_error')
      ) {
        // Erreur DEVELOPER_ERROR (code 10) - Problème de configuration SHA-1/SHA-256
        console.error('❌ DEVELOPER_ERROR détecté - Problème de configuration SHA dans Firebase');
        userMessage = 'Erreur de configuration. Les empreintes SHA-1/SHA-256 doivent être ajoutées dans Firebase Console. Consultez FIREBASE_SHA_CONFIG.md pour les instructions.';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        userMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error.message?.includes('timeout')) {
        userMessage = 'La connexion a pris trop de temps. Veuillez réessayer.';
      } else if (error.message) {
        // Erreurs venant de Firebase (via googleAuthFunction)
        userMessage = error.message;
      }

      result = {
        user: null,
        error: userMessage,
      };
    } finally {
      // CRITIQUE: Toujours remettre isPrompting à false pour réactiver le bouton
      setIsPrompting(false);
    }

    // Retourner le résultat après que finally soit exécuté
    return result || { user: null, error: 'Erreur inconnue' };
  }, [googleAuthFunction, isConfigured, isRegistration]);

  return {
    signInWithGoogle,
    isAvailable: isConfigured,
    isPrompting,
  };
};

export default useGoogleAuth;

