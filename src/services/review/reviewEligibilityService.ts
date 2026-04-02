import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@laso/reviewEligibility/v1';

export interface ReviewEligibilityPersisted {
  coreActionCount: number;
  /** Dates uniques d’utilisation (YYYY-MM-DD), conservées pour calculer les jours distincts */
  activeDayKeys: string[];
  lastPromptedAt: number | null;
  lastDismissedAt: number | null;
  lastNativeReviewFlowAt: number | null;
  blockedUntil: number | null;
  /** Après connexion : ne pas proposer tout de suite */
  authGraceUntil: number | null;
  /** Après fin d’onboarding profil : délai avant éligibilité */
  onboardingGraceUntil: number | null;
  /** Une seule application du délai post-onboarding (évite de repousser à chaque session) */
  onboardingGraceScheduled: boolean;
}

const emptyState = (): ReviewEligibilityPersisted => ({
  coreActionCount: 0,
  activeDayKeys: [],
  lastPromptedAt: null,
  lastDismissedAt: null,
  lastNativeReviewFlowAt: null,
  blockedUntil: null,
  authGraceUntil: null,
  onboardingGraceUntil: null,
  onboardingGraceScheduled: false,
});

export const REVIEW_RULES = {
  MIN_CORE_ACTIONS: 3,
  MIN_ACTIVE_DAYS: 2,
  /** Entre deux affichages du prompt (sentiment) */
  PROMPT_COOLDOWN_MS: 90 * 24 * 60 * 60 * 1000,
  /** Après fermeture / refus sans aller au store */
  DISMISS_COOLDOWN_MS: 14 * 24 * 60 * 60 * 1000,
  AUTH_GRACE_MS: 5 * 60 * 1000,
  ONBOARDING_GRACE_MS: 60 * 60 * 1000,
  PAYMENT_FAILURE_BLOCK_MS: 3 * 24 * 60 * 60 * 1000,
  COMPLAINT_BLOCK_MS: 7 * 24 * 60 * 60 * 1000,
  MAX_STORED_DAYS: 120,
};

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function readState(): Promise<ReviewEligibilityPersisted> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ReviewEligibilityPersisted & Record<string, unknown>;
    const legacy =
      parsed &&
      typeof parsed === 'object' &&
      !Object.prototype.hasOwnProperty.call(parsed, 'onboardingGraceScheduled');
    return {
      ...emptyState(),
      ...parsed,
      activeDayKeys: Array.isArray(parsed.activeDayKeys) ? parsed.activeDayKeys : [],
      onboardingGraceScheduled: legacy ? true : !!parsed.onboardingGraceScheduled,
    };
  } catch {
    return emptyState();
  }
}

async function writeState(s: ReviewEligibilityPersisted): Promise<void> {
  const days = [...new Set(s.activeDayKeys)].sort();
  const trimmed =
    days.length > REVIEW_RULES.MAX_STORED_DAYS
      ? days.slice(days.length - REVIEW_RULES.MAX_STORED_DAYS)
      : days;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, activeDayKeys: trimmed }));
}

export interface EligibilityCheckInput {
  now: number;
  profileComplete: boolean;
  /** Erreur globale / état bloquant côté app (optionnel) */
  appInErrorState?: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

async function evaluate(input: EligibilityCheckInput, s: ReviewEligibilityPersisted): Promise<EligibilityResult> {
  const { now, profileComplete, appInErrorState } = input;

  if (appInErrorState) {
    return { eligible: false, reason: 'app_error' };
  }

  if (!profileComplete) {
    return { eligible: false, reason: 'profile_incomplete' };
  }

  if (s.blockedUntil != null && now < s.blockedUntil) {
    return { eligible: false, reason: 'blocked' };
  }

  if (s.authGraceUntil != null && now < s.authGraceUntil) {
    return { eligible: false, reason: 'auth_grace' };
  }

  if (s.onboardingGraceUntil != null && now < s.onboardingGraceUntil) {
    return { eligible: false, reason: 'onboarding_grace' };
  }

  if (s.coreActionCount < REVIEW_RULES.MIN_CORE_ACTIONS) {
    return { eligible: false, reason: 'insufficient_actions' };
  }

  const distinctDays = new Set(s.activeDayKeys).size;
  if (distinctDays < REVIEW_RULES.MIN_ACTIVE_DAYS) {
    return { eligible: false, reason: 'insufficient_days' };
  }

  if (s.lastDismissedAt != null && now - s.lastDismissedAt < REVIEW_RULES.DISMISS_COOLDOWN_MS) {
    return { eligible: false, reason: 'dismiss_cooldown' };
  }

  if (s.lastPromptedAt != null && now - s.lastPromptedAt < REVIEW_RULES.PROMPT_COOLDOWN_MS) {
    return { eligible: false, reason: 'prompt_cooldown' };
  }

  return { eligible: true };
}

export const reviewEligibilityService = {
  async getState(): Promise<ReviewEligibilityPersisted> {
    return readState();
  },

  async checkEligibility(input: EligibilityCheckInput): Promise<EligibilityResult> {
    const s = await readState();
    return evaluate(input, s);
  },

  /** À appeler après une connexion réussie */
  async onAuthSessionStarted(): Promise<void> {
    const s = await readState();
    const now = Date.now();
    s.authGraceUntil = now + REVIEW_RULES.AUTH_GRACE_MS;
    await writeState(s);
  },

  /** Quand le profil / onboarding est complété (une seule fois persistée) */
  async onProfileOnboardingComplete(): Promise<void> {
    const s = await readState();
    if (s.onboardingGraceScheduled) {
      return;
    }
    const now = Date.now();
    s.onboardingGraceScheduled = true;
    s.onboardingGraceUntil = now + REVIEW_RULES.ONBOARDING_GRACE_MS;
    await writeState(s);
  },

  async recordAppForegroundDay(): Promise<void> {
    const s = await readState();
    const key = todayKey();
    if (!s.activeDayKeys.includes(key)) {
      s.activeDayKeys.push(key);
    }
    await writeState(s);
  },

  async recordCoreAction(): Promise<void> {
    const s = await readState();
    s.coreActionCount += 1;
    const key = todayKey();
    if (!s.activeDayKeys.includes(key)) {
      s.activeDayKeys.push(key);
    }
    await writeState(s);
  },

  async blockForMs(durationMs: number, _reason?: string): Promise<void> {
    const s = await readState();
    const until = Date.now() + durationMs;
    s.blockedUntil = s.blockedUntil != null ? Math.max(s.blockedUntil, until) : until;
    await writeState(s);
  },

  async blockAfterPaymentFailure(): Promise<void> {
    await this.blockForMs(REVIEW_RULES.PAYMENT_FAILURE_BLOCK_MS, 'payment_failure');
  },

  async blockAfterPaymentCancelled(): Promise<void> {
    await this.blockForMs(REVIEW_RULES.PAYMENT_FAILURE_BLOCK_MS, 'payment_cancelled');
  },

  async blockAfterComplaintFlow(): Promise<void> {
    await this.blockForMs(REVIEW_RULES.COMPLAINT_BLOCK_MS, 'complaint');
  },

  async recordPromptShown(): Promise<void> {
    const s = await readState();
    s.lastPromptedAt = Date.now();
    await writeState(s);
  },

  async recordDismissed(): Promise<void> {
    const s = await readState();
    s.lastDismissedAt = Date.now();
    await writeState(s);
  },

  async recordNativeReviewFlowOpened(): Promise<void> {
    const s = await readState();
    const now = Date.now();
    s.lastNativeReviewFlowAt = now;
    s.lastPromptedAt = now;
    await writeState(s);
  },

  async recordInternalFeedbackSubmitted(): Promise<void> {
    const s = await readState();
    s.lastPromptedAt = Date.now();
    await writeState(s);
  },
};
