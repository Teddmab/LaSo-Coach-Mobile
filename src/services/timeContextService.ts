import api from './api';

export interface TimeContextPayload {
  timeZone: string;
  utcOffsetMinutes: number;
  deviceTimeIso: string;
  sentAt: string;
}

const TIME_CONTEXT_ENDPOINTS = [
  '/users/time-context',
  '/user/time-context',
  '/profile/time-context',
];

export const buildTimeContextPayload = (): TimeContextPayload => {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return {
    timeZone,
    utcOffsetMinutes: -now.getTimezoneOffset(),
    deviceTimeIso: now.toISOString(),
    sentAt: now.toISOString(),
  };
};

export const syncTimeContext = async (): Promise<boolean> => {
  const payload = buildTimeContextPayload();

  for (const endpoint of TIME_CONTEXT_ENDPOINTS) {
    try {
      await api.patch(endpoint, payload);
      return true;
    } catch (error: any) {
      // Try next endpoint if current one is not available
      if (error?.response?.status && error.response.status !== 404) {
        continue;
      }
    }
  }

  return false;
};

