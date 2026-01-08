import { Platform } from 'react-native';
import { useGoogleAuth } from './useGoogleAuth';
import { useGoogleAuthExpo } from './useGoogleAuthExpo';

/**
 * Hook hybride pour l'authentification Google
 * 
 * - iOS : Utilise WebView avec proxy Expo - Stable, pas de crash, évite "Something went wrong"
 * - Android : Utilise SDK natif - UI native, meilleure performance
 * 
 * Pourquoi WebView avec proxy Expo sur iOS maintenant ?
 * - Le SDK natif crash sur iOS
 * - Le proxy Expo fonctionne parfaitement avec WebView
 * - Pas besoin de sessionStorage (le proxy Expo gère tout)
 * - Plus stable et fiable
 */
export const useGoogleAuthHybrid = (isRegistration: boolean = false) => {
  if (Platform.OS === 'ios') {
    // Sur iOS, utiliser WebView avec proxy Expo (stable et fiable)
    console.log('🍎 [iOS] Utilisation de WebView avec proxy Expo - Stable et fonctionnel');
    return useGoogleAuthExpo(isRegistration);
  } else {
    // Sur Android, utiliser le SDK natif pour une meilleure expérience
    console.log('🤖 [Android] Utilisation du SDK natif - UI native');
    return useGoogleAuth(isRegistration);
  }
};

export default useGoogleAuthHybrid;

