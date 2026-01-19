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

// Vérifier si on est dans Expo Go (le module natif ne fonctionne pas dans Expo Go)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/**
 * Hook pour l'authentification Google avec fallback automatique
 * 
 * - Si le module natif est disponible ET qu'on n'est pas dans Expo Go : Utilise le SDK natif (UI native, meilleure performance)
 * - Sinon (Expo Go ou module non lié) : Utilise WebView avec Expo AuthSession (fallback)
 * 
 * Cela permet de fonctionner à la fois dans Expo Go et dans les dev builds.
 */
export const useGoogleAuthHybrid = (isRegistration: boolean = false) => {
  // Sur iOS, toujours utiliser WebView (le module natif cause des erreurs TurboModuleRegistry)
  if (Platform.OS === 'ios' || isExpoGo) {
    return useGoogleAuthExpo(isRegistration);
  }
  
  // Sur Android, vérifier si le module natif est disponible (vérification lazy)
  const isNativeModuleAvailable = checkNativeModuleAvailability();
  
  if (isNativeModuleAvailable) {
    // Module natif disponible - utiliser le SDK natif
    return useGoogleAuth(isRegistration);
  } else {
    // Module natif non disponible - utiliser WebView avec Expo AuthSession
    return useGoogleAuthExpo(isRegistration);
  }
};

export default useGoogleAuthHybrid;

