import { DeviceEventEmitter } from 'react-native';

export const NOTIFICATION_NAVIGATION_EVENT = 'laso-notification-navigate';

export type NotificationNavigationIntent = {
  raw: Record<string, unknown>;
};

function flattenPushPayload(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  const nested = data.additionalData;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
      if (out[k] === undefined) {
        out[k] = v;
      }
    }
  }
  const rawData = data.data;
  if (typeof rawData === 'string' && rawData.trim()) {
    try {
      const parsed = JSON.parse(rawData) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (out[k] === undefined) {
            out[k] = v;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function emitNotificationNavigationFromPayload(
  data: Record<string, unknown> | undefined | null
): void {
  if (!data || typeof data !== 'object') {
    return;
  }
  const raw = flattenPushPayload({ ...(data as Record<string, unknown>) });
  DeviceEventEmitter.emit(NOTIFICATION_NAVIGATION_EVENT, { raw } satisfies NotificationNavigationIntent);
}

export function subscribeNotificationNavigation(
  handler: (intent: NotificationNavigationIntent) => void
): { remove: () => void } {
  return DeviceEventEmitter.addListener(NOTIFICATION_NAVIGATION_EVENT, handler);
}
