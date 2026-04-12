import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Expo Go n’embarque pas les libs natives tierces : le JS de react-native-onesignal
 * appelle TurboModuleRegistry.getEnforcing('OneSignal') au require() → erreur fatale
 * si on charge le package. Il faut un dev client (`expo run:ios`) ou un build EAS.
 */
function isRunningInExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** require() paresseux : ne jamais charger le SDK sous Expo Go / hors mobile. */
function loadOneSignalSdk(): typeof import('react-native-onesignal') | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return null;
  }
  if (isRunningInExpoGo()) {
    return null;
  }
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
/** Évite les appels répétés à OneSignal.login avec le même external_id. */
let lastLoggedInExternalId = '';

/**
 * Instant où OneSignal a fini sa phase « critique » (ou a été ignoré : pas d’app id / pas de SDK).
 * Sert à espacer **expo-notifications** pour éviter les conflits natifs au cold start.
 */
let oneSignalNativeGateEpochMs: number | null = null;

function signalOneSignalGateForExpoPush(): void {
  oneSignalNativeGateEpochMs = Date.now();
}

/**
 * Attend au moins `minGapMs` après le signal OneSignal avant de toucher à expo-notifications.
 * Si le signal n’arrive pas (anomalie), abandonne après `maxWaitMs`.
 */
export async function waitForMinDelayAfterOneSignalInit(options?: {
  minGapMs?: number;
  maxWaitMs?: number;
  pollMs?: number;
}): Promise<void> {
  const defaultGap =
    Platform.OS === 'ios' && !__DEV__ ? 4800 : Platform.OS === 'android' && !__DEV__ ? 3200 : 1200;
  const minGapMs = options?.minGapMs ?? defaultGap;
  const maxWaitMs = options?.maxWaitMs ?? 25000;
  const pollMs = options?.pollMs ?? 100;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    if (oneSignalNativeGateEpochMs === null) {
      await new Promise<void>((r) => setTimeout(r, pollMs));
      continue;
    }
    const elapsed = Date.now() - oneSignalNativeGateEpochMs;
    if (elapsed >= minGapMs) {
      return;
    }
    await new Promise<void>((r) => setTimeout(r, Math.min(minGapMs - elapsed, pollMs)));
  }
}

/**
 * Initialise le SDK OneSignal. Nécessite un dev client / build native (pas Expo Go).
 * À appeler une seule fois au démarrage de l’app.
 */
export function initializeOneSignal(): void {
  try {
    if (initialized) {
      return;
    }

    const appId = getOneSignalAppId();
    if (!appId) {
      if (__DEV__) {
        console.warn('[OneSignal] extra.onesignal.appId manquant — vérifie app.config.js / app.json');
      }
      signalOneSignalGateForExpoPush();
      return;
    }

    const sdk = loadOneSignalSdk();
    if (!sdk) {
      if (__DEV__) {
        if (isRunningInExpoGo()) {
          console.warn(
            '[OneSignal] Désactivé sous Expo Go (pas de module natif). Pour tester OneSignal : npx expo run:ios ou un build dev EAS.'
          );
        } else {
          console.warn(
            '[OneSignal] Module react-native-onesignal introuvable — rebuild le dev client / IPA (prebuild + plugin OneSignal).'
          );
        }
      }
      signalOneSignalGateForExpoPush();
      return;
    }
    const { OneSignal, LogLevel } = sdk;
    try {
      if (__DEV__) {
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      }
      OneSignal.initialize(appId);
      initialized = true;
      signalOneSignalGateForExpoPush();
      // Après le signal : permission OneSignal un peu plus tard (ne pas empiler avec la 1re phase Expo)
      setTimeout(() => {
        try {
          void OneSignal.Notifications.requestPermission(false).catch(() => {
            /* utilisateur peut refuser */
          });
        } catch {
          /* ignore */
        }
      }, __DEV__ ? 0 : 400);
    } catch (e) {
      console.warn('[OneSignal] Échec initialisation:', e);
      signalOneSignalGateForExpoPush();
    }
  } catch (e) {
    console.warn('[OneSignal] Erreur inattendue au démarrage:', e);
    signalOneSignalGateForExpoPush();
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
  if (trimmed === lastLoggedInExternalId) {
    return;
  }
  const sdk = loadOneSignalSdk();
  if (!sdk) {
    return;
  }
  try {
    sdk.OneSignal.login(trimmed);
    lastLoggedInExternalId = trimmed;
  } catch (e) {
    console.warn('[OneSignal] login failed:', e);
  }
}

export function logoutOneSignalUser(): void {
  lastLoggedInExternalId = '';
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
