import { Platform } from 'react-native';
import { useGoogleAuth } from './useGoogleAuth';

/**
 * Hook hybride pour l'authentification Google
 * 
 * - iOS : Utilise SDK natif Google Sign-In - UI native, pas de WebView, pas de problème sessionStorage
 * - Android : Utilise SDK natif - UI native, meilleure performance
 * 
 * Pourquoi SDK natif sur iOS maintenant ?
 * - Firebase Auth handler nécessite sessionStorage (non disponible dans WebView)
 * - Le SDK natif ouvre l'UI native de Google (Safari/App Google)
 * - Gère correctement les redirections via REVERSED_CLIENT_ID
 * - Retourne directement l'idToken sans passer par Firebase Auth handler
 * - Plus stable maintenant que REVERSED_CLIENT_ID est configuré dans Info.plist
 */
export const useGoogleAuthHybrid = (isRegistration: boolean = false) => {
  // Utiliser le SDK natif sur toutes les plateformes
  // Plus de WebView = Plus de problème avec sessionStorage/Firebase Auth handler
  console.log(`📱 [${Platform.OS}] Utilisation du SDK natif Google Sign-In - UI native, pas de WebView`);
  return useGoogleAuth(isRegistration);
};

export default useGoogleAuthHybrid;

