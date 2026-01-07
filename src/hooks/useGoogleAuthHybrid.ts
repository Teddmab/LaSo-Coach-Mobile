import { Platform } from 'react-native';
import { useGoogleAuth } from './useGoogleAuth';
import { useGoogleAuthExpo } from './useGoogleAuthExpo';

/**
 * Hook hybride pour l'authentification Google
 * 
 * - iOS : Utilise expo-auth-session (WebView) - Plus stable, pas de crash
 * - Android : Utilise SDK natif - UI native, meilleure performance
 * 
 * Cette approche combine le meilleur des deux mondes :
 * - Stabilité sur iOS (pas de crash natif)
 * - Performance native sur Android
 */
export const useGoogleAuthHybrid = (isRegistration: boolean = false) => {
  if (Platform.OS === 'ios') {
    // Sur iOS, utiliser expo-auth-session pour éviter les crashes
    console.log('🍎 [iOS] Utilisation de expo-auth-session (WebView) - Plus stable');
    return useGoogleAuthExpo(isRegistration);
  } else {
    // Sur Android, utiliser le SDK natif pour une meilleure expérience
    console.log('🤖 [Android] Utilisation du SDK natif - UI native');
    return useGoogleAuth(isRegistration);
  }
};

export default useGoogleAuthHybrid;

