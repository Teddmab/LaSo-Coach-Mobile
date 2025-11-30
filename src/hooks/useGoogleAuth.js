import { useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { firebaseOAuthClientIds } from '../config/firebaseApp';
import { useAuth } from '../context/FirebaseAuthContext';

/**
 * Hook pour l'authentification Google en utilisant le SDK NATIF.
 * Plus de WebView ! Plus de proxy Expo ! Authentification native directe.
 * 
 * @param {boolean} isRegistration - Si true, utilise registerWithGoogle, sinon loginWithGoogle
 * @returns {{ signInWithGoogle: Function, isAvailable: boolean, isPrompting: boolean }}
 */
export const useGoogleAuth = (isRegistration = false) => {
  const { loginWithGoogle, registerWithGoogle } = useAuth();
  const [isPrompting, setIsPrompting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Sélectionner la bonne fonction selon le mode
  const googleAuthFunction = isRegistration ? registerWithGoogle : loginWithGoogle;

  // Configuration du SDK Google Sign-In (une seule fois)
  useEffect(() => {
    const configureGoogleSignIn = async () => {
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
      } catch (error) {
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
  const signInWithGoogle = useCallback(async () => {
    // Vérifier que le SDK est configuré
    if (!isConfigured) {
      return {
        user: null,
        error: 'Configuration Google en cours. Veuillez réessayer dans un instant.',
      };
    }

    // Variable pour stocker le résultat
    let result = null;

    try {
      setIsPrompting(true);

      // Vérifier que les Google Play Services sont disponibles (Android uniquement)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      console.log('🚀 Lancement de l\'authentification Google native...');

      // Ouvrir l'UI native de Google (SDK Android/iOS)
      // PAS de WebView ! C'est l'UI native de Google
      const userInfo = await GoogleSignin.signIn();

      console.log('✅ Authentification Google réussie');
      console.log('📦 USERINFO COMPLET:', JSON.stringify(userInfo, null, 2));
      console.log('👤 User:', userInfo.user?.email);
      console.log('🔑 idToken présent ?', !!userInfo.idToken);

      // Récupérer l'ID Token (peut être dans userInfo directement ou via getTokens())
      let idToken = userInfo.idToken;

      // Solution de secours : si idToken n'est pas présent, essayer getTokens()
      if (!idToken) {
        console.log('⚠️ idToken absent dans userInfo, tentative avec getTokens()...');
        try {
          const tokens = await GoogleSignin.getTokens();
          console.log('📦 Tokens récupérés:', Object.keys(tokens));
          idToken = tokens.idToken;
        } catch (tokenError) {
          console.error('❌ Erreur getTokens():', tokenError);
        }
      }

      console.log('🔑 idToken final:', idToken ? idToken.substring(0, 50) + '...' : 'VIDE');

      // Vérifier que l'ID Token est présent
      if (!idToken) {
        console.error('❌ Pas d\'ID Token reçu de Google');
        console.error('📦 Structure userInfo reçue:', Object.keys(userInfo));
        console.error('🔍 Vérifiez:');
        console.error('  1. Web Client ID dans .env');
        console.error('  2. SHA-1/SHA-256 dans Firebase Console');
        console.error('  3. google-services.json à jour');
        // IMPORTANT: Ne pas faire return ici, sinon le finally ne s'exécute pas
        result = {
          user: null,
          error: 'Impossible de récupérer les informations d\'authentification. Vérifiez la configuration Firebase.',
        };
      } else {
        // Utiliser la fonction appropriée (login ou register) avec Firebase
        console.log(`📞 Appel ${isRegistration ? 'registerWithGoogle' : 'loginWithGoogle'}...`);
        console.log('📤 Envoi idToken à Firebase...');
        result = await googleAuthFunction(idToken);

        console.log('✅ Authentification Firebase réussie');
      }

    } catch (error) {
      console.error('❌ Erreur Google Sign-In:', error);
      console.error('❌ Code erreur:', error.code);
      console.error('❌ Message erreur:', error.message);

      // Gestion des erreurs spécifiques du SDK Google Sign-In
      let userMessage = 'Impossible de se connecter avec Google.';

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        userMessage = 'Connexion annulée.';
      } else if (error.code === statusCodes.IN_PROGRESS) {
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
    return result;
  }, [googleAuthFunction, isConfigured, isRegistration]);

  return {
    signInWithGoogle,
    isAvailable: isConfigured, // Le SDK est prêt quand il est configuré
    isPrompting,
  };
};

export default useGoogleAuth;
