import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_DISMISS_MAP = '@laso/reminderBanner/dismissedUntilByKind';
const COOLDOWN_MS = 3 * 60 * 60 * 1000;

export type ReminderKind = 'hydration' | 'sleep';

export interface ReminderPick {
  kind: ReminderKind;
  title: string;
  body: string;
  identifier: string;
  date: number;
}

type DismissMap = Partial<Record<ReminderKind, number>>;

async function loadDismissMap(): Promise<DismissMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DISMISS_MAP);
    if (!raw) return {};
    const p = JSON.parse(raw) as DismissMap;
    return typeof p === 'object' && p !== null ? p : {};
  } catch {
    return {};
  }
}

async function saveDismissMap(map: DismissMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_DISMISS_MAP, JSON.stringify(map));
}

function kindOnCooldown(kind: ReminderKind, map: DismissMap): boolean {
  const until = map[kind];
  return typeof until === 'number' && Date.now() < until;
}

function classifyReminder(
  title: string,
  body: string,
  data: Record<string, unknown> | undefined
): ReminderKind | null {
  const dataStr = JSON.stringify(data ?? {}).toLowerCase();
  const blob = `${title} ${body} ${dataStr}`.toLowerCase();

  const dataType = String(data?.type ?? data?.reminderType ?? data?.category ?? '').toLowerCase();
  if (dataType.includes('hydrat') || dataType.includes('hydration') || dataType === 'water') {
    return 'hydration';
  }
  if (dataType.includes('sleep') || dataType.includes('sommeil')) {
    return 'sleep';
  }

  if (/\bhydrat|hydration|\beau\b|water|drink|\bboire\b|\bbuvez\b/.test(blob)) {
    return 'hydration';
  }
  if (/\bsommeil|sleep|dormir|bedtime|coucher|repos\b/.test(blob)) {
    return 'sleep';
  }

  return null;
}

async function getNotificationsModule(): Promise<typeof import('expo-notifications') | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Dernière notification « rappel » pertinente parmi celles encore présentes côté OS,
 * en respectant le cooldown de 3 h par type après « OK ».
 */
export async function fetchLatestSystemReminder(): Promise<ReminderPick | null> {
  const dismissMap = await loadDismissMap();

  const Notifications = await getNotificationsModule();
  if (!Notifications?.getPresentedNotificationsAsync) {
    return null;
  }

  let presented: import('expo-notifications').Notification[];
  try {
    presented = await Notifications.getPresentedNotificationsAsync();
  } catch {
    return null;
  }

  if (!presented?.length) {
    return null;
  }

  const candidates: ReminderPick[] = [];

  for (const n of presented) {
    const title = n.request?.content?.title ?? '';
    const body = n.request?.content?.body ?? '';
    const data = n.request?.content?.data as Record<string, unknown> | undefined;
    const kind = classifyReminder(String(title), String(body), data);
    if (!kind) continue;
    if (kindOnCooldown(kind, dismissMap)) continue;

    candidates.push({
      kind,
      title: String(title).trim() || 'Rappel',
      body: String(body).trim(),
      identifier: n.request.identifier,
      date: n.date,
    });
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => b.date - a.date);
  return candidates[0];
}

export async function dismissReminderKind(kind: ReminderKind): Promise<void> {
  const map = await loadDismissMap();
  map[kind] = Date.now() + COOLDOWN_MS;
  await saveDismissMap(map);
}
