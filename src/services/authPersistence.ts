import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = 'laso_auth_user_v1';

export async function loadPersistedUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function savePersistedUser(user) {
  try {
    if (!user) return;
    const minimal = {
      uid: user.uid,
      email: user.email,
      name: user.name || user.displayName || 'User',
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      emailVerified: user.emailVerified || false,
      // Include any app-specific fields that help restore UI without extra calls
      subscriptionStatus: user.subscriptionStatus || null,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(minimal));
  } catch (e) {
  }
}

export async function clearPersistedUser() {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
  }
}
