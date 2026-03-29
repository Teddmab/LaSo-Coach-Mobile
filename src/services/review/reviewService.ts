import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

const ANDROID_PACKAGE = 'com.afrotouch.lasocoach';

/**
 * Lance le flux d’avis natif (Play In-App Review / SKStoreReview).
 * Ne soumet aucun avis programmatiquement — uniquement l’UI système.
 * Si indisponible, ouvre la fiche store.
 */
export async function requestNativeReviewFlow(): Promise<{ usedNativeUI: boolean }> {
  try {
    const available = await StoreReview.isAvailableAsync();
    if (available) {
      await StoreReview.requestReview();
      return { usedNativeUI: true };
    }
  } catch {
    // ignore
  }
  await openStoreListing();
  return { usedNativeUI: false };
}

export async function openStoreListing(): Promise<boolean> {
  try {
    const url = StoreReview.storeUrl();
    if (url) {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
        return true;
      }
    }
  } catch {
    // fall through
  }

  if (Platform.OS === 'android') {
    const market = `market://details?id=${ANDROID_PACKAGE}`;
    const web = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
    try {
      if (await Linking.canOpenURL(market)) {
        await Linking.openURL(market);
        return true;
      }
    } catch {
      // ignore
    }
    await Linking.openURL(web);
    return true;
  }

  // iOS : sans ID App Store explicite, on tente l’URL fournie par Expo uniquement
  return false;
}
