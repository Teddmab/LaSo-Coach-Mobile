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
  useEffect(() => {
    const configureGoogleSignIn = async (): Promise<void> => {
      try {
        // Vérifier que le Web Client ID est disponible
        if (!firebaseOAuthClientIds.web) {
          console.error('❌ FIREBASE_WEB_CLIENT_ID manquant !');
          return;
        }

        // Configuration du SDK natif
        // IMPORTANT: offlineAccess DOIT être true pour obtenir l'idToken !
        const config = {
          webClientId: firebaseOAuthClientIds.web, // Pour Firebase Auth
          offlineAccess: true, // IMPORTANT: true pour obtenir idToken
          forceCodeForRefreshToken: true, // Force l'obtention du token
          scopes: ['email', 'profile'], // Scopes demandés
          // CRITICAL: Force account selection on every sign-in attempt
          // This prevents "signing back in" message and auto-reconnection
          hostedDomain: undefined, // Don't restrict to specific domain
        };
        
        console.log('🔧 Configuration GoogleSignin avec:', {
          webClientId: firebaseOAuthClientIds.web,
          hasWebClientId: !!firebaseOAuthClientIds.web,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          scopes: ['email', 'profile'],
        });

        GoogleSignin.configure(config);

        console.log('✅ Google Sign-In SDK natif configuré');
        console.log('🔐 Web Client ID:', firebaseOAuthClientIds.web);
        console.log('📱 Plateforme:', Platform.OS);
        console.log('🚀 SDK NATIF - Pas de WebView !');
        
        setIsConfigured(true);
      } catch (error: any) {
        console.error('❌ Erreur configuration Google Sign-In:', error);
        setIsConfigured(false);
      }
    };

    configureGoogleSignIn();
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
      
      // ============================================================
      // NOUVELLE APPROCHE: Sans signInSilently() qui RECONNECTE le compte
      // On fait juste revokeAccess() + signOut() avec des délais longs
      // ============================================================
      
      console.log('💀 ÉTAPE 1: Révocation complète de l\'accès...');
      try {
        await GoogleSignin.revokeAccess();
        console.log('✅ revokeAccess() réussi');
      } catch (revokeError: any) {
        console.log('ℹ️ revokeAccess():', revokeError?.code || 'pas de compte');
      }
      
      // Attendre que Google traite la révocation (requête réseau)
      console.log('⏳ Attente de 1 seconde pour traitement de la révocation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('💀 ÉTAPE 2: Déconnexion...');
      try {
        await GoogleSignin.signOut();
        console.log('✅ signOut() réussi');
      } catch (e) {
        console.log('ℹ️ signOut(): pas de session');
      }
      
      // Attendre
      console.log('⏳ Attente de 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('💀 ÉTAPE 3: Deuxième révocation (pour être sûr)...');
      try {
        await GoogleSignin.revokeAccess();
        console.log('✅ 2ème revokeAccess() réussi');
      } catch (e) {
        console.log('ℹ️ 2ème revokeAccess(): déjà révoqué');
      }
      
      // Attendre
      console.log('⏳ Attente de 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('💀 ÉTAPE 4: Deuxième déconnexion...');
      try {
        await GoogleSignin.signOut();
        console.log('✅ 2ème signOut() réussi');
      } catch (e) {
        console.log('ℹ️ 2ème signOut(): déjà déconnecté');
      }
      
      // Attendre
      console.log('⏳ Attente de 500ms...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ============================================================
      // ÉTAPE 5: RÉINITIALISATION COMPLÈTE DU SDK
      // On reconfigure plusieurs fois pour forcer un état "frais"
      // ============================================================
      console.log('🔧 ÉTAPE 5: RÉINITIALISATION COMPLÈTE du SDK (3 fois)...');
      
      // Première reconfiguration - config minimale pour "reset"
      console.log('🔧 Config 1/3: Reset minimal...');
      GoogleSignin.configure({
        webClientId: firebaseOAuthClientIds.web,
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Deuxième reconfiguration - config complète avec accountName: undefined
      console.log('🔧 Config 2/3: Config complète avec accountName undefined...');
      GoogleSignin.configure({
        webClientId: firebaseOAuthClientIds.web,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['email', 'profile'],
        accountName: undefined, // Force à ne pas prioriser un compte
        hostedDomain: '', // Chaîne vide = pas de restriction
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Troisième reconfiguration - config finale propre
      console.log('🔧 Config 3/3: Config finale...');
      GoogleSignin.configure({
        webClientId: firebaseOAuthClientIds.web,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['email', 'profile'],
      });
      console.log('✅ SDK reconfiguré 3 fois');
      
      // Attendre plus longtemps
      console.log('⏳ Attente de 1 seconde...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérification finale
      console.log('🔍 ÉTAPE 6: Vérification finale...');
      try {
        const user = await GoogleSignin.getCurrentUser();
        if (user) {
          const email = (user as any)?.user?.email || (user as any)?.data?.user?.email;
          console.log(`⚠️ Compte encore présent: ${email || 'inconnu'} - dernière déconnexion...`);
          try { await GoogleSignin.revokeAccess(); } catch (e) { /* ignore */ }
          try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
          
          // Reconfigurer une dernière fois
          GoogleSignin.configure({
            webClientId: firebaseOAuthClientIds.web,
            offlineAccess: true,
            forceCodeForRefreshToken: true,
            scopes: ['email', 'profile'],
          });
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log('✅ Aucun compte détecté');
        }
      } catch (e) {
        console.log('✅ Pas de compte');
      }
      
      console.log('✅✅✅ Processus terminé');
      console.log('📱 Ouverture de l\'UI Google pour sélection de compte...');
      const userInfo: any = await GoogleSignin.signIn();

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

