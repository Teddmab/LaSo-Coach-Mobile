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

      // CRITICAL: ALWAYS force complete disconnection before sign-in
      // This ensures account selection screen is shown and no auto-reconnection
      try {
        console.log('🔌 Déconnexion complète de Google Sign-In pour forcer la sélection de TOUS les comptes...');
        
        // 1. ALWAYS revoke access FIRST to completely destroy the session
        // This removes all cached account information and forces account selection
        console.log('🔓 Révoquation de l\'accès Google (force sélection de compte)...');
        try {
          await GoogleSignin.revokeAccess();
          console.log('✅ Accès Google révoqué - cache supprimé');
        } catch (revokeError: any) {
          // Even if revokeAccess fails, try to sign out
          console.warn('⚠️ Erreur lors de la révocation (tentative signOut):', revokeError);
        }
        
        // 2. ALWAYS sign out (even if not signed in) to clear any cached state
        console.log('🚪 Déconnexion de Google Sign-In (nettoyage complet)...');
        try {
          await GoogleSignin.signOut();
          console.log('✅ Google Sign-In déconnecté');
        } catch (signOutError: any) {
          // Ignore errors - we want to proceed anyway
          console.log('ℹ️ SignOut appelé (peut échouer si pas de session active)');
        }
        
        // 3. Additional cleanup: Try to get current user and sign out if exists
        // This ensures we disconnect from any cached account
        try {
          const currentUser = await GoogleSignin.getCurrentUser();
          if (currentUser) {
            console.log('🧹 Compte actuel détecté, déconnexion supplémentaire...');
            await GoogleSignin.revokeAccess(); // Revoke again for this specific account
            await GoogleSignin.signOut();
          }
        } catch (getUserError) {
          // Ignore - no current user
        }
        
        // 4. CRITICAL: Force sign out one more time to ensure complete cleanup
        // Sometimes Android keeps a cached account even after revokeAccess
        try {
          await GoogleSignin.signOut();
        } catch (finalSignOutError) {
          // Ignore - we've already tried
        }
        
        // 5. Longer delay to ensure disconnection is complete and cache is cleared
        // Android may need more time to clear the account cache
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Déconnexion complète terminée - sélection de TOUS les comptes forcée');
      } catch (signOutError) {
        // Non-fatal: Continue even if sign out fails
        console.warn('⚠️ Erreur lors de la déconnexion Google (non bloquant):', signOutError);
      }

      // Ouvrir l'UI native de Google (SDK Android/iOS)
      // PAS de WebView ! C'est l'UI native de Google
      // After complete disconnection, this should show ALL accounts on the device
      console.log('📱 Ouverture de l\'UI Google pour sélection de compte (tous les comptes)...');
      // Note: signIn() without parameters should show account picker with all accounts
      // However, Android may still show the last used account first
      // To force showing all accounts, we pass an empty object or no parameters
      // The SDK should then show the account picker with all available accounts
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

      // Récupérer l'ID Token (peut être dans userInfo directement ou via getTokens())
      let idToken: string | null = (userInfo as any)?.idToken || null;

      // Solution de secours : si idToken n'est pas présent, essayer getTokens()
      // This is the most reliable way to get the idToken after sign-in
      if (!idToken) {
        console.log('⚠️ idToken absent dans userInfo, tentative avec getTokens()...');
        try {
          const tokens: any = await GoogleSignin.getTokens();
          console.log('📦 Tokens récupérés:', Object.keys(tokens || {}));
          idToken = (tokens as any)?.idToken || null;
          
          if (idToken) {
            console.log('✅ idToken récupéré via getTokens()');
          } else {
            console.warn('⚠️ getTokens() retourné mais idToken toujours null');
          }
        } catch (tokenError: any) {
          console.error('❌ Erreur getTokens():', tokenError);
          console.error('❌ Code erreur getTokens:', tokenError?.code);
          console.error('❌ Message erreur getTokens:', tokenError?.message);
          
          // Only treat as cancellation if it's explicitly a cancellation error
          // Other errors (network, etc.) should be treated as real errors, not cancellations
          if (tokenError?.code === statusCodes.SIGN_IN_CANCELLED || 
              tokenError?.code === 'SIGN_IN_CANCELLED' ||
              tokenError?.message?.toLowerCase().includes('cancelled') ||
              tokenError?.message?.toLowerCase().includes('canceled')) {
            console.log('ℹ️ [useGoogleAuth] Connexion annulée lors de getTokens()');
            result = {
              user: null,
              error: null,
            };
            setIsPrompting(false);
            return result;
          }
          // If it's not a cancellation error, continue - we'll try to use userInfo.user
        }
      } else {
        console.log('✅ idToken présent directement dans userInfo');
      }

      console.log('🔑 idToken final:', idToken ? idToken.substring(0, 50) + '...' : 'VIDE');

      // CRITICAL: If still no idToken, check if we have user info
      // If userInfo has a user object, it means user selected an account
      // We should try to proceed with authentication even without idToken initially
      // The idToken might be available after authentication
      if (!idToken) {
        // Check if userInfo has user data - if yes, user selected an account
        if ((userInfo as any)?.user) {
          console.log('⚠️ Pas d\'idToken mais userInfo.user présent - tentative de récupération...');
          // Try one more time with getCurrentUser and getTokens
          try {
            const currentUser = await GoogleSignin.getCurrentUser();
            if (currentUser) {
              console.log('✅ getCurrentUser() retourné:', currentUser.user?.email);
              const tokens: any = await GoogleSignin.getTokens();
              idToken = (tokens as any)?.idToken || null;
              if (idToken) {
                console.log('✅ idToken récupéré via getCurrentUser() + getTokens()');
              }
            }
          } catch (finalError: any) {
            console.error('❌ Erreur lors de la récupération finale:', finalError);
          }
        }
        
        // If still no idToken after all attempts, it's likely a cancellation
        // BUT: Only if userInfo is also empty/incomplete
        if (!idToken && !(userInfo as any)?.user) {
          console.log('ℹ️ [useGoogleAuth] Pas d\'ID Token et pas de userInfo.user - probablement annulé');
          result = {
            user: null,
            error: null, // No error for cancellation
          };
          setIsPrompting(false);
          return result;
        } else if (!idToken && (userInfo as any)?.user) {
          // User selected account but no idToken - this is an error, not cancellation
          console.error('❌ Utilisateur a sélectionné un compte mais idToken introuvable');
          result = {
            user: null,
            error: 'Impossible de récupérer le token d\'authentification. Veuillez réessayer.',
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
    isAvailable: isConfigured, // Le SDK est prêt quand il est configuré
    isPrompting,
  };
};

export default useGoogleAuth;

