import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** require() paresseux : évite « module not found » / crash au chargement si natif absent (Expo Go). */
function loadOneSignalSdk(): typeof import('react-native-onesignal') | null {
  try {
    return require('react-native-onesignal');
  } catch {
    return null;
  }
}

/**
 * App ID OneSignal pour la plateforme courante (Android / iOS peuvent être des projets distincts dans le dashboard).
 */
export function getOneSignalAppId(): string {
  const o = Constants.expoConfig?.extra?.onesignal as
    | { appId?: string; appIdIos?: string; appIdAndroid?: string }
    | undefined;
  const legacy = typeof o?.appId === 'string' ? o.appId.trim() : '';
  const ios = typeof o?.appIdIos === 'string' ? o.appIdIos.trim() : '';
  const android = typeof o?.appIdAndroid === 'string' ? o.appIdAndroid.trim() : '';
  if (Platform.OS === 'ios') {
    return ios || legacy;
  }
  return android || legacy;
}

let initialized = false;

/**
 * Initialise le SDK OneSignal. Nécessite un dev client / build native (pas Expo Go).
 * À appeler une seule fois au démarrage de l’app.
 */
export function initializeOneSignal(): void {
  if (initialized) {
    return;
  }

  const appId = getOneSignalAppId();
  if (!appId) {
    if (__DEV__) {
      console.warn('[OneSignal] extra.onesignal.appId manquant — vérifie app.config.js / app.json');
    }
    return;
  }

  const sdk = loadOneSignalSdk();
  if (!sdk) {
    if (__DEV__) {
      console.warn(
        '[OneSignal] Module react-native-onesignal introuvable — utilise un dev client / build EAS (pas Expo Go).'
      );
    }
    return;
  }
  const { OneSignal, LogLevel } = sdk;
  try {
    if (__DEV__) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    }
    OneSignal.initialize(appId);
    initialized = true;
    void OneSignal.Notifications.requestPermission(false).catch(() => {
      /* utilisateur peut refuser */
    });
  } catch (e) {
    console.warn('[OneSignal] Échec initialisation (normal sous Expo Go sans module natif):', e);
  }
}

/**
 * Associe l’utilisateur backend à OneSignal (external_id) pour que l’API serveur puisse cibler par userId.
 */
export function syncOneSignalExternalUser(externalId: string): void {
  const trimmed = String(externalId || '').trim();
  if (!trimmed) {
    return;
  }
  const sdk = loadOneSignalSdk();
  if (!sdk) {
    return;
  }
  try {
    sdk.OneSignal.login(trimmed);
  } catch (e) {
    console.warn('[OneSignal] login failed:', e);
  }
}

export function logoutOneSignalUser(): void {
  const sdk = loadOneSignalSdk();
  if (!sdk) {
    return;
  }
  try {
    sdk.OneSignal.logout();
  } catch (e) {
    console.warn('[OneSignal] logout failed:', e);
  }
}
