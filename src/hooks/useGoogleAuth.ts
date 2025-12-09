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

        GoogleSignin.configure(config);

        
        setIsConfigured(true);
      } catch (error: any) {
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


      // IMPORTANT: Force complete disconnection to show all accounts
      // We need to revoke access AND sign out to completely clear the session
      // This ensures user sees ALL accounts and can choose any account, not just the previous one
      try {
        // 1. Check if user is currently signed in
        let currentUser = null;
        try {
          currentUser = await GoogleSignin.getCurrentUser();
        } catch (error) {
          // Ignore - user might not be signed in
        }
        
        // 2. If user is signed in, revoke access FIRST to completely remove cached account
        // This removes all account information from device cache
        if (currentUser) {
          try {
            await GoogleSignin.revokeAccess();
          } catch (revokeError: any) {
            // Ignore - continue anyway
          }
        }
        
        // 3. Sign out from Google Sign-In to clear the session (even if not signed in)
        // This ensures clean state
        try {
          await GoogleSignin.signOut();
        } catch (signOutError: any) {
          // Ignore - continue anyway
        }
        
        // 4. Longer delay to ensure disconnection is complete
        // Google needs time to clear the session cache
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 5. Verify disconnection by checking if still signed in
        // If still signed in, try revokeAccess again
        try {
          const stillSignedIn = await GoogleSignin.getCurrentUser();
          if (stillSignedIn) {
            // Force revoke again
            try {
              await GoogleSignin.revokeAccess();
              await GoogleSignin.signOut();
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
              // Ignore
            }
          }
        } catch (error) {
          // Good - user is not signed in
        }
      } catch (disconnectError: any) {
        // Non-fatal: Continue even if disconnection fails
      }

      // Always call signIn() to show account picker with ALL available accounts
      // After revokeAccess() + signOut(), Google will show ALL accounts without any preference
      // User can choose any account from the list
      const userInfo: any = await GoogleSignin.signIn();


      // CRITICAL: Check if user cancelled - but be more lenient
      // userInfo can be returned even if idToken is not directly in it
      // We should check if userInfo exists and has a user object
      // Only treat as cancellation if userInfo is completely null/undefined
      if (!userInfo) {
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


      // OPTIMIZED: Get ID Token efficiently
      // Try to get idToken from userInfo first, then fallback to getTokens()
      let idToken: string | null = (userInfo as any)?.idToken || null;

      // If idToken not in userInfo, get it via getTokens() (most reliable method)
      if (!idToken) {
        try {
          const tokens: any = await GoogleSignin.getTokens();
          idToken = (tokens as any)?.idToken || null;
          
          if (idToken) {
          }
        } catch (tokenError: any) {
          // Only treat as cancellation if explicitly cancelled
          if (tokenError?.code === statusCodes.SIGN_IN_CANCELLED || 
              tokenError?.code === 'SIGN_IN_CANCELLED' ||
              tokenError?.message?.toLowerCase().includes('cancel')) {
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
      }


      // OPTIMIZED: Simplified token validation
      // If no idToken after getTokens(), check if user selected an account
      if (!idToken) {
        // If userInfo has user data, user selected an account but token failed
        if ((userInfo as any)?.user) {
          result = {
            user: null,
            error: 'Impossible de récupérer le token. Veuillez réessayer.',
          };
          setIsPrompting(false);
          return result;
        } else {
          // No user data and no token = cancellation
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
        result = {
          user: null,
          error: 'Erreur lors de l\'authentification. Veuillez réessayer.',
        };
        setIsPrompting(false);
        return result;
      }

      // Utiliser la fonction appropriée (login ou register) avec Firebase
      result = await googleAuthFunction(idToken);


    } catch (error: any) {

      // CRITICAL: Check for cancellation FIRST - multiple ways user can cancel
      const isCancelled = 
        error.code === statusCodes.SIGN_IN_CANCELLED ||
        error.code === 'SIGN_IN_CANCELLED' ||
        error.message?.toLowerCase().includes('cancel') ||
        error.message?.toLowerCase().includes('annulé') ||
        error.message?.toLowerCase().includes('cancelled');

      if (isCancelled) {
        // CRITICAL: User cancelled - STOP immediately, don't proceed
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

