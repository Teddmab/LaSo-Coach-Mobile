import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useGoogleAuth } from './useGoogleAuth';
import { useGoogleAuthExpo } from './useGoogleAuthExpo';

// Fonction pour vérifier si le module natif est disponible
// IMPORTANT: Sur iOS, on n'essaie PAS de charger le module pour éviter les erreurs TurboModuleRegistry
const checkNativeModuleAvailability = (): boolean => {
  // Ne pas charger le module sur iOS - utiliser toujours WebView
  if (Platform.OS === 'ios') {
    return false;
  }
  
  try {
    // Utiliser une fonction pour charger le module de manière sécurisée
    const loadGoogleSignInModule = () => {
      try {
        return require('@react-native-google-signin/google-signin');
      } catch (e) {
        return null;
      }
    };
    
    const googleSignInModule = loadGoogleSignInModule();
    
  // Vérifier que le module est bien disponible et que GoogleSignin existe avec ses méthodes
  if (googleSignInModule?.GoogleSignin && 
      typeof googleSignInModule.GoogleSignin.configure === 'function' &&
      typeof googleSignInModule.GoogleSignin.signIn === 'function') {
    // Tenter une vérification supplémentaire : vérifier si on peut appeler une méthode
    // Si on est dans Expo Go, cette vérification peut échouer silencieusement
    try {
      // Ne pas appeler configure() ici, juste vérifier que l'objet existe
        return true;
    } catch (e) {
        return false;
      }
    }
    return false;
  } catch (error: any) {
    // Module non disponible (Expo Go ou module non lié)
    // Ne pas logger l'erreur pour éviter le spam dans les logs
    return false;
  }
};

/**
 * Hook pour l'authentification Google
 * 
 * - iOS : Utilise WebView avec Expo AuthSession (le module natif cause des erreurs TurboModuleRegistry)
 * - Android : TOUJOURS utiliser le SDK natif (PAS de WebView, PAS de fallback)
 * 
 * IMPORTANT: Sur Android, la connexion Google est UNIQUEMENT en natif, jamais de webview.
 * Le module natif DOIT être disponible dans un dev build ou build de production.
 */
export const useGoogleAuthHybrid = (isRegistration: boolean = false) => {
  // Sur iOS, toujours utiliser WebView (le module natif cause des erreurs TurboModuleRegistry)
  if (Platform.OS === 'ios') {
    return useGoogleAuthExpo(isRegistration);
  }
  
  // Sur Android, TOUJOURS utiliser le SDK natif (pas de WebView, pas de fallback)
  // Le module natif DOIT être disponible dans un dev build ou build de production
  if (Platform.OS === 'android') {
    console.log('📱 [Android] Utilisation du SDK natif Google Sign-In (pas de WebView)');
    return useGoogleAuth(isRegistration);
  }
  
  // Fallback par défaut (ne devrait jamais arriver)
  return useGoogleAuthExpo(isRegistration);
};

export default useGoogleAuthHybrid;

