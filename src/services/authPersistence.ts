import * as Keychain from 'react-native-keychain';

// Auth tokens and user data are stored in the device Keychain / Keystore
// (react-native-keychain) instead of AsyncStorage so the data is encrypted
// at rest and not accessible to other apps (Sprint 0 security fix).

const SERVICE = 'laso_auth_v2';

export async function loadPersistedUser() {
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    if (!result) return null;
    return JSON.parse(result.password);
  } catch {
    return null;
  }
}

export async function savePersistedUser(user: any) {
  try {
    if (!user) return;
    const minimal = {
      uid: user.uid,
      email: user.email,
      name: user.name || user.displayName || 'User',
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      emailVerified: user.emailVerified || false,
      subscriptionStatus: user.subscriptionStatus || null,
    };
    await Keychain.setGenericPassword(
      minimal.email ?? 'laso_user',
      JSON.stringify(minimal),
      {
        service: SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }
    );
  } catch {
    // Silently fail — user will need to re-authenticate next launch
  }
}

export async function clearPersistedUser() {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch {
    // No-op if nothing was stored
  }
}
