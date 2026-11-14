import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import {
  analyzeNormalBaseline,
  getTodayLocalDateISO,
  upsertNormalDailyRecord,
} from '@/src/data/normal/normalBaseline';
import {
  createDefaultNotificationPreferences,
  createInitialPresentationInteractions,
  INITIAL_PRESENTATION_HEALTH_SYNC,
  INITIAL_PRESENTATION_MEMBERSHIP,
  PRESENTATION_PAIRING_CODE,
} from '@/src/data/presentation/presentationConstants';
import {
  getCachedPresentationBundle,
  loadPresentationBundle,
} from '@/src/data/presentation/presentationSelectors';
import { createEmptyFeedbackState } from '@/src/services/careContextBuilder';
import { TRANSLATIONS, TranslationDictionary } from '@/src/i18n/translations';
import {
  confirmDailyStatusUpdate,
  setDraftDailyCheckInState,
  upsertPartnerStatusNotification,
} from '@/src/services/dailyStatusUpdateService';
import { getCurrentMonthKey } from '@/src/services/membershipService';
import {
  deriveLearnedPreferenceProfile,
  recordRecipientFeedbackEvent,
} from '@/src/services/preferenceLearningEngine';
import { appendToRecentSuggestionHistory } from '@/src/services/recommendationDiversity';
import {
  buildMetadataFromPresetCare,
  normalizeRecommendationMetadata,
} from '@/src/services/recommendationMetadata';
import {
  removeSavedSuggestionById,
  saveSuggestionSnapshot,
  sortSavedSuggestionsNewestFirst,
} from '@/src/services/savedSuggestionsStore';
import {
  evaluateNotificationDelivery,
  isNotificationAlertActive,
} from '@/src/services/smartNotificationService';
import {
  computeReminderAtISO,
  createSimulatedOrderRecord,
  transitionMockOrderStatus,
} from '@/src/services/mockDeliveryService';
import {
  buildSurpriseCareNotification,
  cancelSurpriseCareRecord,
  completeSurpriseCareRecord,
  createSurpriseCareRecord,
  editSurpriseCareRecord,
  isSurpriseReadyToReveal,
  revealSurpriseCareRecord,
  SurpriseRevealPresetKey,
  upsertSurpriseCareMoment,
  upsertSurpriseNotification,
} from '@/src/services/surpriseCareService';
import {
  AiCareFeedbackEntry,
  AiCareFeedbackState,
  AiCareRecommendation,
  AiCareRecommendationMetadata,
  AiCareSavedItem,
  CareFeedbackEvent,
  CareReminderPresetKey,
  CareReminderRecord,
  LearnedPreferenceProfile,
  MockOrderRecord,
  MockOrderStatus,
  MockProductCatalogItem,
  RecentSuggestionRecord,
  RecipientFeedbackType,
  SurpriseCareCategory,
  SurpriseCareDeliveryMode,
  SurpriseCareNoteStyle,
  SurpriseCareRecord,
  SurpriseCareVisibility,
} from '@/src/types/aiCare';
import {
  AppEntryMode,
  AppPage,
  AvoidTagKey,
  CareActivityItem,
  CareMomentRecord,
  CareNotification,
  CareScenarioView,
  CareSuggestion,
  CheckInOption,
  CoupleBillingPlan,
  CoupleMembershipState,
  DailyCheckInState,
  DatePlanInteraction,
  DatePlanInviteStatus,
  HealthSyncState,
  InsightsSubView,
  LanguageCode,
  NotificationsCategoryView,
  NormalBaselineAnalysis,
  NormalCareActivityItem,
  NormalCareNotification,
  NormalCareSuggestion,
  NormalDailyRecord,
  NormalInteractionsState,
  normalizeSharingPreferences,
  NormalPairingState,
  NormalPreferencesState,
  NormalUserProfile,
  NotificationPreferences,
  NotificationStatus,
  OnboardingDraft,
  PartnerId,
  PartnerStatusSnapshot,
  PreferenceTagItem,
  PreferredCareTagKey,
  PresentationBundle,
  PresentationInteractionsState,
  SharingPreferences,
  SharingPrefKey,
  WeeklyRechargeEntry,
  WeeklyRechargeNextWeekWish,
  WeeklyRechargeSupportChoice,
  WidgetPreviewStyle,
} from '@/src/types/dualcharge';

export const STORAGE_KEYS = {
  MODE: 'dualcharge:mode:v2',
  NORMAL_USER: 'dualcharge:normalUser:v1',
  NORMAL_RECORDS: 'dualcharge:normalRecords:v1',
  NORMAL_PAIRING: 'dualcharge:normalPairing:v1',
  NORMAL_PREFERENCES: 'dualcharge:normalPreferences:v1',
  NORMAL_INTERACTIONS: 'dualcharge:normalInteractions:v1',
  NORMAL_SAVED_SUGGESTIONS: 'dualcharge:normalSavedSuggestions:v1',
  PRESENTATION_INTERACTIONS: 'dualcharge:presentationInteractions:v1',
  PRESENTATION_SAVED_SUGGESTIONS: 'dualcharge:presentationSavedSuggestions:v1',
  LANGUAGE: 'dualcharge:language:v1',
} as const;

const LEGACY_STORAGE_KEYS = {
  DEMO_STATE: 'dualcharge_demo_state_v2',
  ONBOARDING: 'dualcharge_onboarding_v1',
  ENTRY_MODE: 'dualcharge_entry_mode_v1',
  LANGUAGE: 'dualcharge_language_v1',
} as const;

export const NORMAL_LOCAL_INVITE_CODE = 'DC-7315';

function createInitialNormalUserProfile(): NormalUserProfile {
  return {
    completed: false,
    completedAtISO: null,
    nickname: '',
    avatarId: 'coral-glow',
    baselineStartDate: getTodayLocalDateISO(),
    baselineStatus: 'building',
    validCheckInDays: 0,
    sharingConsent: normalizeSharingPreferences({ energy: false, sleep: false, activity: false }),
    premiumDemoConfirmed: false,
  };
}

function createInitialNormalPairingState(): NormalPairingState {
  return {
    status: 'unpaired',
    method: 'later',
    inviteCode: NORMAL_LOCAL_INVITE_CODE,
    partnerHasRecords: false,
  };
}

function createInitialNormalPreferencesState(): NormalPreferencesState {
  return {
    preferredCare: [],
    avoidTags: [],
    communicationStyle: null,
    customTags: [],
  };
}

function normalizeMonthlyAiCareUsage(raw?: { monthKey?: string; count?: number }) {
  const currentKey = getCurrentMonthKey();
  if (raw && raw.monthKey === currentKey && typeof raw.count === 'number' && raw.count >= 0) {
    return { monthKey: currentKey, count: raw.count };
  }
  return { monthKey: currentKey, count: 0 };
}

function createInitialNormalInteractionsState(): NormalInteractionsState {
  return {
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    aiFeedback: createEmptyFeedbackState(),
    feedbackEvents: [],
    recentSuggestionHistory: [],
    skippedSuggestionIds: [],
    weeklyRecharge: null,
    notificationPrefs: createDefaultNotificationPreferences(),
    draftCheckInStatus: null,
    draftCheckInDateISO: null,
    confirmedStatusSnapshot: null,
    notifications: [],
    surpriseCareRecords: [],
    mockOrders: [],
    careReminders: [],
    dismissedRecommendationIds: [],
    careActivity: [],
    aiCareUsage: normalizeMonthlyAiCareUsage(),
  };
}

function normalizeFeedbackState(raw: unknown): AiCareFeedbackState {
  const empty = createEmptyFeedbackState();
  if (!raw || typeof raw !== 'object') return empty;
  const obj = raw as Partial<AiCareFeedbackState>;
  return {
    notRelevantItems: Array.isArray(obj.notRelevantItems) ? obj.notRelevantItems : [],
    moreLikeThisItems: Array.isArray(obj.moreLikeThisItems) ? obj.moreLikeThisItems : [],
    preferredCategories: Array.isArray(obj.preferredCategories) ? obj.preferredCategories : [],
    deprioritizedCategories: Array.isArray(obj.deprioritizedCategories)
      ? obj.deprioritizedCategories
      : [],
  };
}

function syncAiFeedbackSummaryFromEvents(
  recipientId: string,
  events: CareFeedbackEvent[],
  preferredLabels: string[] = [],
  avoidLabels: string[] = []
): AiCareFeedbackState {
  const derived = deriveLearnedPreferenceProfile(recipientId, events, {
    preferredCareLabels: preferredLabels,
    avoidLabels,
  });
  const sortedDesc = [...events]
    .filter((e) => e.recipient === recipientId && e.actor === recipientId)
    .sort((a, b) => b.timestampISO.localeCompare(a.timestampISO));

  const notRelevantItems: AiCareFeedbackEntry[] = sortedDesc
    .filter(
      (e) =>
        e.feedbackType === 'not_relevant' ||
        e.feedbackType === 'not_helpful' ||
        e.feedbackType === 'not_suitable'
    )
    .slice(0, 12)
    .map((e) => ({
      id: e.suggestionId,
      title: e.suggestionTitle,
      category: e.metadata.category,
      timestampISO: e.timestampISO,
    }));

  const moreLikeThisItems: AiCareFeedbackEntry[] = sortedDesc
    .filter((e) => e.feedbackType === 'helpful' || e.feedbackType === 'more_like_this')
    .slice(0, 12)
    .map((e) => ({
      id: e.suggestionId,
      title: e.suggestionTitle,
      category: e.metadata.category,
      timestampISO: e.timestampISO,
    }));

  return {
    notRelevantItems,
    moreLikeThisItems,
    preferredCategories: derived.preferredCategories,
    deprioritizedCategories: derived.negativelyRatedAttributes.categories,
  };
}

function updateFeedbackState(
  prev: AiCareFeedbackState,
  kind: 'not_relevant' | 'more_like_this',
  rec: Pick<AiCareRecommendation, 'id' | 'title' | 'category'>
): AiCareFeedbackState {
  const entry: AiCareFeedbackEntry = {
    id: rec.id,
    title: rec.title,
    category: rec.category,
    timestampISO: new Date().toISOString(),
  };

  if (kind === 'not_relevant') {
    const dedupNotRelevant = [
      entry,
      ...prev.notRelevantItems.filter(
        (i) => i.title.toLowerCase() !== rec.title.toLowerCase()
      ),
    ].slice(0, 12);
    const deprioritized = prev.deprioritizedCategories.includes(rec.category)
      ? prev.deprioritizedCategories
      : [...prev.deprioritizedCategories, rec.category];
    const preferred = prev.preferredCategories.filter((c) => c !== rec.category);
    return {
      ...prev,
      notRelevantItems: dedupNotRelevant,
      deprioritizedCategories: deprioritized,
      preferredCategories: preferred,
    };
  }

  const dedupMore = [
    entry,
    ...prev.moreLikeThisItems.filter(
      (i) => i.title.toLowerCase() !== rec.title.toLowerCase()
    ),
  ].slice(0, 12);
  const preferred = prev.preferredCategories.includes(rec.category)
    ? prev.preferredCategories
    : [...prev.preferredCategories, rec.category];
  const deprioritized = prev.deprioritizedCategories.filter((c) => c !== rec.category);
  return {
    ...prev,
    moreLikeThisItems: dedupMore,
    preferredCategories: preferred,
    deprioritizedCategories: deprioritized,
  };
}

/**
 * Migrate legacy storage keys cleanly without ever leaking old Alex/Jamie demo records
 * into Normal User Mode storage.
 */
function runSafeStorageMigration(): void {
  try {
    // 1. Preserve language preference
    if (!window.localStorage.getItem(STORAGE_KEYS.LANGUAGE)) {
      const legacyLang = window.localStorage.getItem(LEGACY_STORAGE_KEYS.LANGUAGE);
      if (legacyLang === 'en' || legacyLang === 'zh-CN' || legacyLang === 'zh-TW') {
        window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, legacyLang);
      }
    }

    // 2. Migrate legacy presentation demo state ONLY into presentationInteractions
    if (!window.localStorage.getItem(STORAGE_KEYS.PRESENTATION_INTERACTIONS)) {
      const legacyDemo = window.localStorage.getItem(LEGACY_STORAGE_KEYS.DEMO_STATE);
      if (legacyDemo) {
        const parsed = JSON.parse(legacyDemo) as Partial<PresentationInteractionsState>;
        const defaults = createInitialPresentationInteractions();
        const migratedPresentation: PresentationInteractionsState = {
          ...defaults,
          dailyCheckIns: parsed.dailyCheckIns ?? defaults.dailyCheckIns,
          sharingPrefs: {
            alex: normalizeSharingPreferences(parsed.sharingPrefs?.alex ?? defaults.sharingPrefs.alex),
            jamie: normalizeSharingPreferences(parsed.sharingPrefs?.jamie ?? defaults.sharingPrefs.jamie),
          },
          carePreferences: parsed.carePreferences ?? defaults.carePreferences,
          savedSuggestionIds: parsed.savedSuggestionIds ?? defaults.savedSuggestionIds,
          notifications: Array.isArray(parsed.notifications)
            ? parsed.notifications
            : defaults.notifications,
          careActivity: Array.isArray(parsed.careActivity)
            ? parsed.careActivity
            : defaults.careActivity,
          premiumDemoConfirmed: Boolean(parsed.premiumDemoConfirmed),
        };
        window.localStorage.setItem(
          STORAGE_KEYS.PRESENTATION_INTERACTIONS,
          JSON.stringify(migratedPresentation)
        );
      }
    }

    // 3. Remove legacy keys so no prior mixed onboarding/demo schema can contaminate normal mode
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS.DEMO_STATE);
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS.ONBOARDING);
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS.ENTRY_MODE);
    window.localStorage.removeItem(LEGACY_STORAGE_KEYS.LANGUAGE);
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

function readJsonStorage<T>(key: string, fallback: () => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

function loadPersistedLanguage(): LanguageCode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (raw === 'en' || raw === 'zh-CN' || raw === 'zh-TW') {
      return raw;
    }
    return 'en';
  } catch {
    return 'en';
  }
}

function loadPersistedNormalUser(): NormalUserProfile {
  const defaults = createInitialNormalUserProfile();
  const parsed = readJsonStorage<Partial<NormalUserProfile>>(
    STORAGE_KEYS.NORMAL_USER,
    () => defaults
  );
  return {
    ...defaults,
    ...parsed,
    sharingConsent: normalizeSharingPreferences(parsed.sharingConsent),
    baselineStatus: parsed.baselineStatus === 'preliminary' ? 'preliminary' : 'building',
    validCheckInDays: typeof parsed.validCheckInDays === 'number' ? parsed.validCheckInDays : 0,
  };
}

function loadPersistedNormalRecords(): NormalDailyRecord[] {
  const raw = readJsonStorage<unknown>(STORAGE_KEYS.NORMAL_RECORDS, () => []);
  if (!Array.isArray(raw)) return [];
  // Filter valid normal daily records and deduplicate by date
  const byDate = new Map<string, NormalDailyRecord>();
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as NormalDailyRecord).date === 'string' &&
      typeof (item as NormalDailyRecord).checkInStatus === 'string' &&
      typeof (item as NormalDailyRecord).selfReportedScore1To5 === 'number'
    ) {
      const rec = item as NormalDailyRecord;
      byDate.set(rec.date, rec);
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function loadPersistedNormalPairing(): NormalPairingState {
  const defaults = createInitialNormalPairingState();
  const parsed = readJsonStorage<Partial<NormalPairingState>>(
    STORAGE_KEYS.NORMAL_PAIRING,
    () => defaults
  );
  return {
    status: parsed.status === 'paired_simulated' ? 'paired_simulated' : 'unpaired',
    method:
      parsed.method === 'create' || parsed.method === 'join' || parsed.method === 'later'
        ? parsed.method
        : 'later',
    inviteCode:
      typeof parsed.inviteCode === 'string' && parsed.inviteCode.trim()
        ? parsed.inviteCode.trim().toUpperCase()
        : NORMAL_LOCAL_INVITE_CODE,
    partnerHasRecords: false, // Single-device prototype never fabricates remote partner records
  };
}

function loadPersistedNormalPreferences(): NormalPreferencesState {
  const defaults = createInitialNormalPreferencesState();
  const parsed = readJsonStorage<Partial<NormalPreferencesState>>(
    STORAGE_KEYS.NORMAL_PREFERENCES,
    () => defaults
  );
  return {
    preferredCare: Array.isArray(parsed.preferredCare) ? parsed.preferredCare : [],
    avoidTags: Array.isArray(parsed.avoidTags) ? parsed.avoidTags : [],
    communicationStyle: parsed.communicationStyle ?? null,
    customTags: Array.isArray(parsed.customTags) ? parsed.customTags : [],
  };
}

function loadPersistedNormalInteractions(): NormalInteractionsState {
  const defaults = createInitialNormalInteractionsState();
  const parsed = readJsonStorage<Partial<NormalInteractionsState>>(
    STORAGE_KEYS.NORMAL_INTERACTIONS,
    () => defaults
  );
  const dedicatedSaved = readJsonStorage<AiCareSavedItem[] | null>(
    STORAGE_KEYS.NORMAL_SAVED_SUGGESTIONS,
    () => null
  );
  const savedItems = sortSavedSuggestionsNewestFirst(
    Array.isArray(dedicatedSaved)
      ? dedicatedSaved
      : Array.isArray(parsed.savedAiSuggestions)
        ? parsed.savedAiSuggestions
        : []
  );
  const feedbackEvents = Array.isArray(parsed.feedbackEvents) ? parsed.feedbackEvents : [];
  const mergedSavedIds = Array.from(
    new Set([
      ...(Array.isArray(parsed.savedSuggestionIds) ? parsed.savedSuggestionIds : []),
      ...savedItems.map((item) => item.id),
    ])
  );
  return {
    savedSuggestionIds: mergedSavedIds,
    savedAiSuggestions: savedItems,
    aiFeedback:
      feedbackEvents.length > 0
        ? syncAiFeedbackSummaryFromEvents('normal_recipient', feedbackEvents)
        : normalizeFeedbackState(parsed.aiFeedback),
    feedbackEvents,
    recentSuggestionHistory: Array.isArray(parsed.recentSuggestionHistory)
      ? parsed.recentSuggestionHistory
      : [],
    skippedSuggestionIds: Array.isArray(parsed.skippedSuggestionIds)
      ? parsed.skippedSuggestionIds
      : [],
    weeklyRecharge: parsed.weeklyRecharge ?? null,
    notificationPrefs: {
      ...createDefaultNotificationPreferences(),
      ...(parsed.notificationPrefs ?? {}),
    },
    draftCheckInStatus: parsed.draftCheckInStatus ?? null,
    draftCheckInDateISO: parsed.draftCheckInDateISO ?? null,
    confirmedStatusSnapshot: parsed.confirmedStatusSnapshot ?? null,
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    surpriseCareRecords: Array.isArray(parsed.surpriseCareRecords)
      ? parsed.surpriseCareRecords
      : [],
    mockOrders: Array.isArray(parsed.mockOrders) ? parsed.mockOrders : [],
    careReminders: Array.isArray(parsed.careReminders) ? parsed.careReminders : [],
    dismissedRecommendationIds: Array.isArray(parsed.dismissedRecommendationIds)
      ? parsed.dismissedRecommendationIds
      : [],
    careActivity: Array.isArray(parsed.careActivity) ? parsed.careActivity : [],
    aiCareUsage: normalizeMonthlyAiCareUsage(parsed.aiCareUsage),
  };
}

function loadPersistedPresentationInteractions(): PresentationInteractionsState {
  const defaults = createInitialPresentationInteractions();
  const parsed = readJsonStorage<Partial<PresentationInteractionsState>>(
    STORAGE_KEYS.PRESENTATION_INTERACTIONS,
    () => defaults
  );
  const dedicatedSaved = readJsonStorage<Record<PartnerId, AiCareSavedItem[]> | null>(
    STORAGE_KEYS.PRESENTATION_SAVED_SUGGESTIONS,
    () => null
  );
  const alexSaved = sortSavedSuggestionsNewestFirst(
    Array.isArray(dedicatedSaved?.alex)
      ? dedicatedSaved.alex
      : Array.isArray(parsed.savedAiSuggestions?.alex)
        ? parsed.savedAiSuggestions.alex
        : []
  );
  const jamieSaved = sortSavedSuggestionsNewestFirst(
    Array.isArray(dedicatedSaved?.jamie)
      ? dedicatedSaved.jamie
      : Array.isArray(parsed.savedAiSuggestions?.jamie)
        ? parsed.savedAiSuggestions.jamie
        : []
  );
  const alexFeedbackEvents = Array.isArray(parsed.feedbackEvents?.alex)
    ? parsed.feedbackEvents.alex
    : [];
  const jamieFeedbackEvents = Array.isArray(parsed.feedbackEvents?.jamie)
    ? parsed.feedbackEvents.jamie
    : [];

  return {
    dailyCheckIns: {
      alex: {
        ...defaults.dailyCheckIns.alex,
        ...(parsed.dailyCheckIns?.alex ?? {}),
      },
      jamie: {
        ...defaults.dailyCheckIns.jamie,
        ...(parsed.dailyCheckIns?.jamie ?? {}),
      },
    },
    partnerStatusUpdates: {
      alex: parsed.partnerStatusUpdates?.alex ?? null,
      jamie: parsed.partnerStatusUpdates?.jamie ?? null,
    },
    sharingPrefs: {
      alex: normalizeSharingPreferences(parsed.sharingPrefs?.alex ?? defaults.sharingPrefs.alex),
      jamie: normalizeSharingPreferences(parsed.sharingPrefs?.jamie ?? defaults.sharingPrefs.jamie),
    },
    healthSyncState: {
      alex: {
        ...INITIAL_PRESENTATION_HEALTH_SYNC.alex,
        ...(parsed.healthSyncState?.alex ?? {}),
      },
      jamie: {
        ...INITIAL_PRESENTATION_HEALTH_SYNC.jamie,
        ...(parsed.healthSyncState?.jamie ?? {}),
      },
    },
    notificationPrefs: {
      alex: {
        ...createDefaultNotificationPreferences(),
        ...(parsed.notificationPrefs?.alex ?? {}),
      },
      jamie: {
        ...createDefaultNotificationPreferences(),
        ...(parsed.notificationPrefs?.jamie ?? {}),
      },
    },
    weeklyRecharge: {
      alex: parsed.weeklyRecharge?.alex ?? null,
      jamie: parsed.weeklyRecharge?.jamie ?? null,
    },
    careMoments: Array.isArray(parsed.careMoments) ? parsed.careMoments : defaults.careMoments,
    datePlanInteractions:
      parsed.datePlanInteractions && typeof parsed.datePlanInteractions === 'object'
        ? parsed.datePlanInteractions
        : {},
    skippedSuggestionIds: {
      alex: Array.isArray(parsed.skippedSuggestionIds?.alex) ? parsed.skippedSuggestionIds.alex : [],
      jamie: Array.isArray(parsed.skippedSuggestionIds?.jamie)
        ? parsed.skippedSuggestionIds.jamie
        : [],
    },
    membership: parsed.membership
      ? { ...INITIAL_PRESENTATION_MEMBERSHIP, ...parsed.membership }
      : {
          ...INITIAL_PRESENTATION_MEMBERSHIP,
          tier: parsed.premiumDemoConfirmed ? 'premium' : 'free',
        },
    widgetPreviewStyle: {
      alex: parsed.widgetPreviewStyle?.alex ?? defaults.widgetPreviewStyle.alex,
      jamie: parsed.widgetPreviewStyle?.jamie ?? defaults.widgetPreviewStyle.jamie,
    },
    carePreferences: parsed.carePreferences ?? defaults.carePreferences,
    savedSuggestionIds: {
      alex: Array.from(
        new Set([
          ...(parsed.savedSuggestionIds?.alex ?? defaults.savedSuggestionIds.alex),
          ...alexSaved.map((s) => s.id),
        ])
      ),
      jamie: Array.from(
        new Set([
          ...(parsed.savedSuggestionIds?.jamie ?? defaults.savedSuggestionIds.jamie),
          ...jamieSaved.map((s) => s.id),
        ])
      ),
    },
    savedAiSuggestions: {
      alex: alexSaved,
      jamie: jamieSaved,
    },
    aiFeedback: {
      alex:
        alexFeedbackEvents.length > 0
          ? syncAiFeedbackSummaryFromEvents('alex', alexFeedbackEvents)
          : normalizeFeedbackState(parsed.aiFeedback?.alex),
      jamie:
        jamieFeedbackEvents.length > 0
          ? syncAiFeedbackSummaryFromEvents('jamie', jamieFeedbackEvents)
          : normalizeFeedbackState(parsed.aiFeedback?.jamie),
    },
    feedbackEvents: {
      alex: alexFeedbackEvents,
      jamie: jamieFeedbackEvents,
    },
    recentSuggestionHistory: {
      alex: Array.isArray(parsed.recentSuggestionHistory?.alex)
        ? parsed.recentSuggestionHistory.alex
        : [],
      jamie: Array.isArray(parsed.recentSuggestionHistory?.jamie)
        ? parsed.recentSuggestionHistory.jamie
        : [],
    },
    notifications: Array.isArray(parsed.notifications)
      ? parsed.notifications
      : defaults.notifications,
    surpriseCareRecords: Array.isArray(parsed.surpriseCareRecords)
      ? parsed.surpriseCareRecords
      : [],
    mockOrders: Array.isArray(parsed.mockOrders) ? parsed.mockOrders : [],
    careReminders: Array.isArray(parsed.careReminders) ? parsed.careReminders : [],
    dismissedRecommendationIds: {
      alex: Array.isArray(parsed.dismissedRecommendationIds?.alex)
        ? parsed.dismissedRecommendationIds.alex
        : [],
      jamie: Array.isArray(parsed.dismissedRecommendationIds?.jamie)
        ? parsed.dismissedRecommendationIds.jamie
        : [],
    },
    careActivity: Array.isArray(parsed.careActivity)
      ? parsed.careActivity
      : defaults.careActivity,
    premiumDemoConfirmed: Boolean(parsed.premiumDemoConfirmed),
    aiCareUsage: normalizeMonthlyAiCareUsage(parsed.aiCareUsage),
  };
}

function loadInitialEntryMode(normalCompleted: boolean): AppEntryMode {
  try {
    const storedMode = window.localStorage.getItem(STORAGE_KEYS.MODE);
    if (storedMode === 'presentation') {
      return 'presentation';
    }
    if (storedMode === 'normal' && normalCompleted) {
      return 'normal';
    }
    if (normalCompleted) {
      return 'normal';
    }
    return 'welcome';
  } catch {
    return normalCompleted ? 'normal' : 'welcome';
  }
}

type PresentationAction =
  | { type: 'SET_DRAFT_CHECK_IN'; partner: PartnerId; option: CheckInOption }
  | {
      type: 'CONFIRM_DAILY_STATUS';
      partner: PartnerId;
      option: CheckInOption;
      dateISO: string;
      timeLabel: string;
      energyIndex?: number;
      sleepHours?: number;
      sleepQuality?: number;
      restingHeartRateBpm?: number | null;
      hrvValueMs?: number | null;
      hrvMetricType?: 'SDNN' | 'RMSSD' | null;
      activityMinutes?: number;
      steps?: number | null;
      recordedCyclePhase?: string | null;
    }
  | { type: 'TOGGLE_SHARING'; partner: PartnerId; key: SharingPrefKey }
  | { type: 'SYNC_DEMO_HEALTH'; partner: PartnerId; timeLabel: string; iso: string }
  | {
      type: 'UPDATE_NOTIFICATION_PREFS';
      partner: PartnerId;
      patch: Partial<NotificationPreferences>;
    }
  | {
      type: 'SUBMIT_WEEKLY_RECHARGE';
      partner: PartnerId;
      entry: WeeklyRechargeEntry;
      timeLabel: string;
    }
  | {
      type: 'UPDATE_CARE_MOMENT_NOTE';
      momentId: string;
      note: string;
      author: PartnerId;
    }
  | {
      type: 'TOGGLE_CARE_MOMENT_VISIBILITY';
      momentId: string;
    }
  | {
      type: 'TOGGLE_DATE_PLAN_REACTION';
      partner: PartnerId;
      planId: string;
      reaction: 'like' | 'skip';
      timeLabel: string;
    }
  | {
      type: 'SEND_DATE_PLAN_INVITE';
      sender: PartnerId;
      planId: string;
      timeLabel: string;
    }
  | {
      type: 'RESPOND_DATE_PLAN_INVITE';
      responder: PartnerId;
      planId: string;
      status: DatePlanInviteStatus;
      timeLabel: string;
    }
  | {
      type: 'PROPOSE_DATE_PLAN_ALTERNATIVE_TIME';
      proposer: PartnerId;
      planId: string;
      slotLabel: string;
      note?: string;
      timeLabel: string;
    }
  | { type: 'TRACK_SKIPPED_SUGGESTION'; partner: PartnerId; suggestionId: string }
  | { type: 'UPGRADE_COUPLE_PREMIUM'; partner: PartnerId; plan: CoupleBillingPlan; dateISO: string }
  | { type: 'SET_WIDGET_PREVIEW_STYLE'; partner: PartnerId; style: WidgetPreviewStyle }
  | { type: 'ADD_PREFERENCE'; partner: PartnerId; label: string }
  | { type: 'REMOVE_PREFERENCE'; partner: PartnerId; tagId: string }
  | {
      type: 'SAVE_SUGGESTION';
      partner: PartnerId;
      suggestion: CareSuggestion;
      localizedCopy?: {
        title: string;
        description: string;
        reason: string;
        timing: string;
        defaultMessage: string;
      };
      timeLabel: string;
    }
  | {
      type: 'SAVE_AI_SUGGESTION';
      partner: PartnerId;
      recommendation: AiCareRecommendation;
      source: 'gemini' | 'fallback';
      timeLabel: string;
    }
  | { type: 'REMOVE_SAVED_SUGGESTION'; partner: PartnerId; suggestionId: string }
  | {
      type: 'SEND_CARE';
      sender: PartnerId;
      suggestion: CareSuggestion;
      localizedCopy?: {
        title: string;
        description: string;
        timing: string;
      };
      customMessage?: string;
      timeLabel: string;
    }
  | {
      type: 'SEND_AI_CARE';
      sender: PartnerId;
      recommendation: AiCareRecommendation;
      customMessage?: string;
      timeLabel: string;
    }
  | {
      type: 'RECORD_RECIPIENT_NOTIFICATION_FEEDBACK';
      notificationId: string;
      responder: PartnerId;
      feedbackType: RecipientFeedbackType;
      fallbackTitle?: string;
      fallbackDescription?: string;
      fallbackTiming?: string;
    }
  | {
      type: 'RECORD_AI_FEEDBACK';
      partner: PartnerId;
      kind: 'not_relevant' | 'more_like_this';
      recommendation: AiCareRecommendation;
    }
  | { type: 'CLEAR_LEARNED_PREFERENCES'; partner: PartnerId }
  | {
      type: 'RECORD_RECENT_SUGGESTIONS';
      partner: PartnerId;
      recommendations: AiCareRecommendation[];
    }
  | {
      type: 'UPDATE_NOTIFICATION_STATUS';
      notificationId: string;
      status: NotificationStatus;
      responder: PartnerId;
      timeLabel: string;
      dateISO: string;
      fallbackTitle?: string;
    }
  | { type: 'INCREMENT_AI_CARE_USAGE'; monthKey: string }
  | { type: 'CONFIRM_PREMIUM_DEMO' }
  | {
      type: 'CREATE_SURPRISE_CARE';
      sender: PartnerId;
      sourceRecommendation: AiCareRecommendation;
      careCategory: SurpriseCareCategory;
      noteStyle: SurpriseCareNoteStyle;
      title: string;
      actionDescription: string;
      content: string;
      deliveryMode: SurpriseCareDeliveryMode;
      revealAt: string | null;
      revealPresetKey?: SurpriseRevealPresetKey;
      relatedDatePlanId?: string;
      visibility: SurpriseCareVisibility;
      timeLabel: string;
      dateISO: string;
      nowISO: string;
    }
  | {
      type: 'UPDATE_SURPRISE_CARE';
      sender: PartnerId;
      surpriseId: string;
      patch: Partial<
        Pick<
          SurpriseCareRecord,
          | 'careCategory'
          | 'noteStyle'
          | 'title'
          | 'actionDescription'
          | 'content'
          | 'revealAt'
          | 'revealPresetKey'
          | 'relatedDatePlanId'
          | 'visibility'
        >
      >;
      timeLabel: string;
      dateISO: string;
      nowISO: string;
    }
  | {
      type: 'CANCEL_SURPRISE_CARE';
      sender: PartnerId;
      surpriseId: string;
      nowISO: string;
    }
  | {
      type: 'REVEAL_SURPRISE_CARE';
      recipient: PartnerId;
      surpriseId: string;
      nowISO: string;
      timeLabel: string;
      dateISO: string;
      forceDemoUnlock?: boolean;
    }
  | {
      type: 'UNLOCK_DEMO_SURPRISE_REVEAL';
      surpriseId: string;
      nowISO: string;
    }
  | {
      type: 'COMPLETE_SURPRISE_CARE';
      actor: PartnerId;
      surpriseId: string;
      nowISO: string;
      timeLabel: string;
      dateISO: string;
    }
  | {
      type: 'DISMISS_RECOMMENDATION_NOT_NOW';
      partner: PartnerId;
      recommendationId: string;
    }
  | {
      type: 'SCHEDULE_CARE_REMINDER';
      partner: PartnerId;
      recommendation: AiCareRecommendation;
      presetKey: CareReminderPresetKey;
      remindAtISO: string;
      nowISO: string;
    }
  | {
      type: 'DISMISS_CARE_REMINDER';
      reminderId: string;
    }
  | {
      type: 'ACT_ON_CARE_REMINDER';
      reminderId: string;
    }
  | {
      type: 'CREATE_SIMULATED_ORDER_FLOW';
      sender: PartnerId;
      recipientName: string;
      recommendation: AiCareRecommendation;
      product: MockProductCatalogItem;
      selectedVariant: string;
      quantity: number;
      deliveryAddress: string;
      careMessage: string;
      platformNotes?: string;
      revealMode: SurpriseCareDeliveryMode;
      language: LanguageCode;
      reminderId?: string;
      timeLabel: string;
      dateISO: string;
      nowISO: string;
    }
  | {
      type: 'ADVANCE_MOCK_ORDER_STATUS';
      sender: PartnerId;
      orderId: string;
      nextStatus: MockOrderStatus;
      timeLabel: string;
      dateISO: string;
      nowISO: string;
    }
  | {
      type: 'CANCEL_MOCK_ORDER';
      sender: PartnerId;
      orderId: string;
      nowISO: string;
    }
  | { type: 'RESET_DEMO' };

function presentationReducer(
  state: PresentationInteractionsState,
  action: PresentationAction
): PresentationInteractionsState {
  switch (action.type) {
    case 'SET_DRAFT_CHECK_IN':
      return {
        ...state,
        dailyCheckIns: {
          ...state.dailyCheckIns,
          [action.partner]: setDraftDailyCheckInState(
            state.dailyCheckIns[action.partner],
            action.option
          ),
        },
      };

    case 'CONFIRM_DAILY_STATUS': {
      const recipient: PartnerId = action.partner === 'alex' ? 'jamie' : 'alex';
      const result = confirmDailyStatusUpdate({
        prevCheckIn: state.dailyCheckIns[action.partner],
        option: action.option,
        dateISO: action.dateISO,
        timeLabel: action.timeLabel,
        sharingPrefs: state.sharingPrefs[action.partner],
        energyIndex: action.energyIndex,
        sleepHours: action.sleepHours,
        sleepQuality: action.sleepQuality,
        restingHeartRateBpm: action.restingHeartRateBpm,
        hrvValueMs: action.hrvValueMs,
        hrvMetricType: action.hrvMetricType,
        activityMinutes: action.activityMinutes,
        steps: action.steps,
        recordedCyclePhase: action.recordedCyclePhase,
      });

      const senderShareNotifs = state.notificationPrefs[action.partner].shareStatusNotifications;
      const recipientNotifPrefs = state.notificationPrefs[recipient];
      const delivery = evaluateNotificationDelivery({
        kind: 'status_update',
        importance: 'important',
        recipientPrefs: recipientNotifPrefs,
        senderShareStatusNotifications: senderShareNotifs,
      });

      const nextNotifications = upsertPartnerStatusNotification({
        notifications: state.notifications,
        sender: action.partner,
        recipient,
        snapshot: result.snapshot,
        shareStatusNotifications: senderShareNotifs,
        suppressedByQuietHours: delivery.suppressedByQuietHours,
        suppressedReason: delivery.suppressedReason,
      });

      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'confirmed_status',
        actor: action.partner,
        suggestionTitle: action.option,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };

      return {
        ...state,
        dailyCheckIns: {
          ...state.dailyCheckIns,
          [action.partner]: result.nextCheckIn,
        },
        partnerStatusUpdates: {
          ...state.partnerStatusUpdates,
          [action.partner]: result.snapshot,
        },
        notifications: nextNotifications,
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'TOGGLE_SHARING': {
      const prev = normalizeSharingPreferences(state.sharingPrefs[action.partner]);
      let nextSharing: SharingPreferences;
      if (action.key === 'cycleTrackingEnabled') {
        const nextEnabled = !prev.cycleTrackingEnabled;
        nextSharing = {
          ...prev,
          cycleTrackingEnabled: nextEnabled,
          cycle: nextEnabled ? prev.cycle : false,
        };
      } else if (action.key === 'cycle') {
        nextSharing = {
          ...prev,
          cycle: prev.cycleTrackingEnabled ? !prev.cycle : false,
        };
      } else {
        nextSharing = {
          ...prev,
          [action.key]: !prev[action.key],
        };
      }
      return {
        ...state,
        sharingPrefs: {
          ...state.sharingPrefs,
          [action.partner]: nextSharing,
        },
      };
    }

    case 'SYNC_DEMO_HEALTH':
      return {
        ...state,
        healthSyncState: {
          ...state.healthSyncState,
          [action.partner]: {
            ...state.healthSyncState[action.partner],
            connected: true,
            permissionGranted: true,
            lastSyncISO: action.iso,
            lastSyncLabel: action.timeLabel,
          },
        },
      };

    case 'UPDATE_NOTIFICATION_PREFS':
      return {
        ...state,
        notificationPrefs: {
          ...state.notificationPrefs,
          [action.partner]: {
            ...state.notificationPrefs[action.partner],
            ...action.patch,
          },
        },
      };

    case 'SUBMIT_WEEKLY_RECHARGE': {
      const nextWeekly = {
        ...state.weeklyRecharge,
        [action.partner]: action.entry,
      };
      const newActivity: CareActivityItem | null =
        action.entry.status === 'completed' && action.entry.shareWithPartner
          ? {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'weekly_recharge',
              actor: action.partner,
              timeLabel: action.timeLabel,
              dayKind: 'today',
            }
          : null;
      return {
        ...state,
        weeklyRecharge: nextWeekly,
        careActivity: newActivity ? [newActivity, ...state.careActivity].slice(0, 8) : state.careActivity,
      };
    }

    case 'UPDATE_CARE_MOMENT_NOTE':
      return {
        ...state,
        careMoments: state.careMoments.map((m) =>
          m.id === action.momentId
            ? { ...m, optionalNote: action.note.trim() || undefined, noteAuthor: action.author }
            : m
        ),
      };

    case 'TOGGLE_CARE_MOMENT_VISIBILITY':
      return {
        ...state,
        careMoments: state.careMoments.map((m) =>
          m.id === action.momentId ? { ...m, sharedVisibility: !m.sharedVisibility } : m
        ),
      };

    case 'TOGGLE_DATE_PLAN_REACTION': {
      const prev = state.datePlanInteractions[action.planId] ?? {
        planId: action.planId,
        reactionByPartner: {},
        status: 'none' as DatePlanInviteStatus,
        updatedAtISO: new Date().toISOString(),
        updatedTimeLabel: action.timeLabel,
      };
      const currentReaction = prev.reactionByPartner[action.partner];
      const nextReaction = currentReaction === action.reaction ? undefined : action.reaction;
      return {
        ...state,
        datePlanInteractions: {
          ...state.datePlanInteractions,
          [action.planId]: {
            ...prev,
            reactionByPartner: {
              ...prev.reactionByPartner,
              [action.partner]: nextReaction,
            },
            updatedAtISO: new Date().toISOString(),
            updatedTimeLabel: action.timeLabel,
          },
        },
      };
    }

    case 'SEND_DATE_PLAN_INVITE': {
      const invitee: PartnerId = action.sender === 'alex' ? 'jamie' : 'alex';
      const prev = state.datePlanInteractions[action.planId] ?? {
        planId: action.planId,
        reactionByPartner: {},
        status: 'none' as DatePlanInviteStatus,
        updatedAtISO: new Date().toISOString(),
        updatedTimeLabel: action.timeLabel,
      };
      const newAct: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'date_invite',
        actor: action.sender,
        target: invitee,
        suggestionId: action.planId,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };
      return {
        ...state,
        datePlanInteractions: {
          ...state.datePlanInteractions,
          [action.planId]: {
            ...prev,
            invitedBy: action.sender,
            invitee,
            status: 'invited',
            alternativeTimeProposal: undefined,
            updatedAtISO: new Date().toISOString(),
            updatedTimeLabel: action.timeLabel,
          },
        },
        careActivity: [newAct, ...state.careActivity].slice(0, 8),
      };
    }

    case 'RESPOND_DATE_PLAN_INVITE': {
      const prev = state.datePlanInteractions[action.planId];
      if (!prev) return state;
      const newAct: CareActivityItem | null =
        action.status === 'agreed' || action.status === 'accepted'
          ? {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'date_agreed',
              actor: action.responder,
              target: prev.invitedBy,
              suggestionId: action.planId,
              timeLabel: action.timeLabel,
              dayKind: 'today',
            }
          : null;
      return {
        ...state,
        datePlanInteractions: {
          ...state.datePlanInteractions,
          [action.planId]: {
            ...prev,
            status: action.status,
            updatedAtISO: new Date().toISOString(),
            updatedTimeLabel: action.timeLabel,
          },
        },
        careActivity: newAct ? [newAct, ...state.careActivity].slice(0, 8) : state.careActivity,
      };
    }

    case 'PROPOSE_DATE_PLAN_ALTERNATIVE_TIME': {
      const prev = state.datePlanInteractions[action.planId];
      if (!prev) return state;
      const invitee: PartnerId = action.proposer === 'alex' ? 'jamie' : 'alex';
      const newAct: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'date_invite',
        actor: action.proposer,
        target: invitee,
        suggestionId: action.planId,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };
      return {
        ...state,
        datePlanInteractions: {
          ...state.datePlanInteractions,
          [action.planId]: {
            ...prev,
            invitedBy: action.proposer,
            invitee,
            status: 'invited',
            alternativeTimeProposal: {
              proposedBy: action.proposer,
              slotLabel: action.slotLabel,
              note: action.note?.trim() || undefined,
              updatedAtTime: action.timeLabel,
            },
            updatedAtISO: new Date().toISOString(),
            updatedTimeLabel: action.timeLabel,
          },
        },
        careActivity: [newAct, ...state.careActivity].slice(0, 8),
      };
    }

    case 'TRACK_SKIPPED_SUGGESTION': {
      const existing = state.skippedSuggestionIds[action.partner] ?? [];
      if (existing.includes(action.suggestionId)) return state;
      // Sender skip action NEVER alters feedbackEvents or aiFeedback
      return {
        ...state,
        skippedSuggestionIds: {
          ...state.skippedSuggestionIds,
          [action.partner]: [action.suggestionId, ...existing].slice(0, 30),
        },
      };
    }

    case 'UPGRADE_COUPLE_PREMIUM':
      return {
        ...state,
        premiumDemoConfirmed: true,
        membership: {
          tier: 'premium',
          plan: action.plan,
          startDateISO: action.dateISO,
          purchasedBy: action.partner,
          isSimulated: true,
        },
      };

    case 'SET_WIDGET_PREVIEW_STYLE':
      return {
        ...state,
        widgetPreviewStyle: {
          ...state.widgetPreviewStyle,
          [action.partner]: action.style,
        },
      };

    case 'ADD_PREFERENCE': {
      const trimmed = action.label.trim();
      if (!trimmed) return state;
      const existing = state.carePreferences[action.partner];
      const hasDuplicate = existing.some(
        (item) => (item.customLabel ?? '').toLowerCase() === trimmed.toLowerCase()
      );
      if (hasDuplicate) return state;
      return {
        ...state,
        carePreferences: {
          ...state.carePreferences,
          [action.partner]: [
            ...existing,
            {
              id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              customLabel: trimmed,
            },
          ],
        },
      };
    }

    case 'REMOVE_PREFERENCE':
      return {
        ...state,
        carePreferences: {
          ...state.carePreferences,
          [action.partner]: state.carePreferences[action.partner].filter(
            (item) => item.id !== action.tagId
          ),
        },
      };

    case 'SAVE_SUGGESTION': {
      const currentSaved = state.savedSuggestionIds[action.partner];
      if (currentSaved.includes(action.suggestion.id)) {
        return state;
      }

      const copy = action.localizedCopy;
      const meta = buildMetadataFromPresetCare({
        suggestionId: action.suggestion.id,
        title: copy?.title || action.suggestion.id,
        description: copy?.description || action.suggestion.id,
        timing: copy?.timing || 'Today',
      });
      const presetRec: AiCareRecommendation = {
        id: action.suggestion.id,
        title: copy?.title || action.suggestion.id,
        category: meta.category,
        why: copy?.reason || '',
        action: copy?.description || copy?.title || action.suggestion.id,
        suggestedTiming: copy?.timing || 'Today',
        personalizationReason: copy?.reason || '',
        confidence: 'Preference-Based',
        defaultMessage: copy?.defaultMessage || '',
        actionType: meta.actionType,
        communicationStyle: meta.communicationStyle,
        effortLevel: meta.effortLevel,
        requiresSpendingMoney: meta.requiresSpendingMoney,
        tags: meta.tags,
        fingerprint: meta.fingerprint,
      };
      const savedSnap = saveSuggestionSnapshot({
        existing: state.savedAiSuggestions[action.partner],
        recommendation: presetRec,
        source: 'preset',
        ownerId: action.partner,
      });

      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'saved_care',
        actor: action.partner,
        suggestionId: action.suggestion.id,
        suggestionTitle: copy?.title,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };
      // IMPORTANT: Saving NEVER alters aiFeedback or feedbackEvents!
      return {
        ...state,
        savedSuggestionIds: {
          ...state.savedSuggestionIds,
          [action.partner]: [...currentSaved, action.suggestion.id],
        },
        savedAiSuggestions: {
          ...state.savedAiSuggestions,
          [action.partner]: savedSnap.items,
        },
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'SAVE_AI_SUGGESTION': {
      const currentSaved = state.savedSuggestionIds[action.partner];
      const rec = action.recommendation;
      if (currentSaved.includes(rec.id)) {
        return state;
      }
      const savedSnap = saveSuggestionSnapshot({
        existing: state.savedAiSuggestions[action.partner],
        recommendation: rec,
        source: action.source,
        ownerId: action.partner,
      });
      if (!savedSnap.added) {
        return state;
      }

      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'saved_care',
        actor: action.partner,
        suggestionId: rec.id,
        suggestionTitle: rec.title,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };
      // IMPORTANT: Saving is a sender action and NEVER alters recipient preference scores!
      return {
        ...state,
        savedSuggestionIds: {
          ...state.savedSuggestionIds,
          [action.partner]: [...currentSaved, rec.id],
        },
        savedAiSuggestions: {
          ...state.savedAiSuggestions,
          [action.partner]: savedSnap.items,
        },
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'REMOVE_SAVED_SUGGESTION':
      return {
        ...state,
        savedSuggestionIds: {
          ...state.savedSuggestionIds,
          [action.partner]: state.savedSuggestionIds[action.partner].filter(
            (id) => id !== action.suggestionId
          ),
        },
        savedAiSuggestions: {
          ...state.savedAiSuggestions,
          [action.partner]: removeSavedSuggestionById(
            state.savedAiSuggestions[action.partner],
            action.suggestionId
          ),
        },
      };

    case 'SEND_CARE': {
      const recipient: PartnerId = action.sender === 'alex' ? 'jamie' : 'alex';
      const meta = buildMetadataFromPresetCare({
        suggestionId: action.suggestion.id,
        title: action.localizedCopy?.title || action.suggestion.id,
        description: action.localizedCopy?.description || action.suggestion.id,
        timing: action.localizedCopy?.timing || 'Today',
      });
      const delivery = evaluateNotificationDelivery({
        kind: 'care_message',
        importance: 'ordinary',
        recipientPrefs: state.notificationPrefs[recipient],
      });
      const newNotification: CareNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'care_message',
        sender: action.sender,
        recipient,
        suggestionId: action.suggestion.id,
        recommendationMetadata: meta,
        customMessage: action.customMessage?.trim() || undefined,
        importance: 'ordinary',
        suppressedByQuietHours: delivery.suppressedByQuietHours,
        suppressedReason: delivery.suppressedReason,
        timeLabel: action.timeLabel,
        isToday: true,
        status: 'Sent',
      };
      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'sent_care',
        actor: action.sender,
        target: recipient,
        suggestionId: action.suggestion.id,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'SEND_AI_CARE': {
      const recipient: PartnerId = action.sender === 'alex' ? 'jamie' : 'alex';
      const rec = action.recommendation;
      const metadata = normalizeRecommendationMetadata(rec);
      const delivery = evaluateNotificationDelivery({
        kind: 'care_message',
        importance: 'ordinary',
        recipientPrefs: state.notificationPrefs[recipient],
      });
      const newNotification: CareNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'care_message',
        sender: action.sender,
        recipient,
        suggestionId: rec.id,
        suggestionTitle: rec.title,
        suggestionDefaultMessage: rec.defaultMessage,
        recommendationMetadata: metadata,
        customMessage: action.customMessage?.trim() || undefined,
        importance: 'ordinary',
        suppressedByQuietHours: delivery.suppressedByQuietHours,
        suppressedReason: delivery.suppressedReason,
        timeLabel: action.timeLabel,
        isToday: true,
        status: 'Sent',
      };
      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'sent_care',
        actor: action.sender,
        target: recipient,
        suggestionId: rec.id,
        suggestionTitle: rec.title,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'RECORD_RECIPIENT_NOTIFICATION_FEEDBACK': {
      const targetNotif = state.notifications.find((n) => n.id === action.notificationId);
      if (
        !targetNotif ||
        targetNotif.kind === 'status_update' ||
        targetNotif.recipient !== action.responder
      ) {
        return state;
      }

      // Guard: unrevealed Surprise Care cannot accept feedback before reveal
      if (targetNotif.kind === 'surprise_care' && targetNotif.surpriseCareId) {
        const targetSurprise = (state.surpriseCareRecords ?? []).find(
          (s) => s.id === targetNotif.surpriseCareId
        );
        if (
          targetSurprise &&
          targetSurprise.deliveryMode === 'keep_surprise' &&
          targetSurprise.status === 'Scheduled'
        ) {
          return state;
        }
      }

      const title =
        targetNotif.suggestionTitle || action.fallbackTitle || targetNotif.suggestionId;
      const metadata: AiCareRecommendationMetadata =
        targetNotif.recommendationMetadata ??
        buildMetadataFromPresetCare({
          suggestionId: targetNotif.suggestionId,
          title,
          description: action.fallbackDescription || targetNotif.suggestionDefaultMessage || title,
          timing: action.fallbackTiming || 'Today',
        });

      const recorded = recordRecipientFeedbackEvent({
        events: state.feedbackEvents[action.responder],
        actor: action.responder,
        recipient: targetNotif.recipient,
        suggestionId: targetNotif.suggestionId,
        suggestionTitle: title,
        feedbackType: action.feedbackType,
        metadata,
        surpriseCareId: targetNotif.surpriseCareId,
      });

      if (!recorded.accepted) {
        return state;
      }

      const nextNotifications = state.notifications.map((n) =>
        n.id === action.notificationId
          ? { ...n, feedbackSubmitted: action.feedbackType }
          : n
      );

      const nextSurprises = targetNotif.surpriseCareId
        ? (state.surpriseCareRecords ?? []).map((s) =>
            s.id === targetNotif.surpriseCareId
              ? {
                  ...s,
                  recipientFeedback: action.feedbackType,
                  recipientFeedbackAt: recorded.event?.timestampISO ?? new Date().toISOString(),
                }
              : s
          )
        : state.surpriseCareRecords;

      return {
        ...state,
        feedbackEvents: {
          ...state.feedbackEvents,
          [action.responder]: recorded.events,
        },
        aiFeedback: {
          ...state.aiFeedback,
          [action.responder]: syncAiFeedbackSummaryFromEvents(
            action.responder,
            recorded.events
          ),
        },
        notifications: nextNotifications,
        surpriseCareRecords: nextSurprises,
      };
    }

    case 'RECORD_AI_FEEDBACK':
      return {
        ...state,
        aiFeedback: {
          ...state.aiFeedback,
          [action.partner]: updateFeedbackState(
            state.aiFeedback[action.partner],
            action.kind,
            action.recommendation
          ),
        },
      };

    case 'CLEAR_LEARNED_PREFERENCES':
      return {
        ...state,
        feedbackEvents: {
          ...state.feedbackEvents,
          [action.partner]: [],
        },
        aiFeedback: {
          ...state.aiFeedback,
          [action.partner]: createEmptyFeedbackState(),
        },
        notifications: state.notifications.map((n) =>
          n.recipient === action.partner && n.feedbackSubmitted
            ? { ...n, feedbackSubmitted: undefined }
            : n
        ),
      };

    case 'RECORD_RECENT_SUGGESTIONS':
      return {
        ...state,
        recentSuggestionHistory: {
          ...state.recentSuggestionHistory,
          [action.partner]: appendToRecentSuggestionHistory(
            state.recentSuggestionHistory[action.partner],
            action.recommendations
          ),
        },
      };

    case 'UPDATE_NOTIFICATION_STATUS': {
      const targetNotif = state.notifications.find((n) => n.id === action.notificationId);
      const updatedNotifications = state.notifications.map((item) =>
        item.id === action.notificationId ? { ...item, status: action.status } : item
      );

      let updatedActivity = state.careActivity;
      let updatedMoments = state.careMoments;
      let updatedSurprises = state.surpriseCareRecords ?? [];

      if (
        targetNotif &&
        targetNotif.kind !== 'status_update' &&
        action.status === 'Completed'
      ) {
        if (targetNotif.kind === 'surprise_care' && targetNotif.surpriseCareId) {
          const matchingSurprise = updatedSurprises.find(
            (s) => s.id === targetNotif.surpriseCareId
          );
          if (matchingSurprise) {
            const completedRes = completeSurpriseCareRecord(
              matchingSurprise,
              action.responder,
              new Date().toISOString()
            );
            if (completedRes.completed) {
              updatedSurprises = updatedSurprises.map((s) =>
                s.id === matchingSurprise.id ? completedRes.record : s
              );
              updatedMoments = upsertSurpriseCareMoment(updatedMoments, completedRes.record, {
                dateISO: targetNotif.dateISO || action.dateISO,
                timeLabel: action.timeLabel,
              });
              const completionActivity: CareActivityItem = {
                id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                kind: 'surprise_completed',
                actor: action.responder,
                suggestionId: targetNotif.suggestionId,
                timeLabel: action.timeLabel,
                dayKind: 'today',
              };
              updatedActivity = [completionActivity, ...state.careActivity].slice(0, 8);
            }
          }
        } else {
          const resolvedTitle =
            targetNotif.suggestionTitle || action.fallbackTitle || targetNotif.suggestionId;
          const completionActivity: CareActivityItem = {
            id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            kind: 'completed_care',
            actor: action.responder,
            suggestionId: targetNotif.suggestionId,
            suggestionTitle: resolvedTitle,
            timeLabel: action.timeLabel,
            dayKind: 'today',
          };
          updatedActivity = [completionActivity, ...state.careActivity].slice(0, 8);

          // Deduplicated Care Moment record — ONLY Completed care_message notifications enter Care History
          const alreadyRecorded = state.careMoments.some(
            (m) => m.sourceNotificationId === targetNotif.id
          );
          if (!alreadyRecorded) {
            const moment: CareMomentRecord = {
              id: `moment-${targetNotif.id}`,
              sourceNotificationId: targetNotif.id,
              dateTimeISO: new Date().toISOString(),
              timeLabel: action.timeLabel,
              dateISO: targetNotif.dateISO || action.dateISO,
              careActionTitle: resolvedTitle,
              sender: targetNotif.sender,
              recipient: targetNotif.recipient,
              status: 'Completed',
              sharedVisibility: true,
            };
            updatedMoments = [moment, ...state.careMoments];
          }
        }
      }

      return {
        ...state,
        notifications: updatedNotifications,
        careActivity: updatedActivity,
        careMoments: updatedMoments,
        surpriseCareRecords: updatedSurprises,
      };
    }

    case 'INCREMENT_AI_CARE_USAGE': {
      const currentCount =
        state.aiCareUsage?.monthKey === action.monthKey ? state.aiCareUsage.count : 0;
      return {
        ...state,
        aiCareUsage: {
          monthKey: action.monthKey,
          count: currentCount + 1,
        },
      };
    }

    case 'CONFIRM_PREMIUM_DEMO':
      return {
        ...state,
        premiumDemoConfirmed: true,
        membership: {
          ...state.membership,
          tier: 'premium',
          startDateISO: state.membership.startDateISO ?? new Date().toISOString().slice(0, 10),
          isSimulated: true,
        },
      };

    case 'CREATE_SURPRISE_CARE': {
      const recipient: PartnerId = action.sender === 'alex' ? 'jamie' : 'alex';
      const record = createSurpriseCareRecord({
        senderId: action.sender,
        recipientId: recipient,
        sourceRecommendation: action.sourceRecommendation,
        careCategory: action.careCategory,
        noteStyle: action.noteStyle,
        title: action.title,
        actionDescription: action.actionDescription,
        content: action.content,
        deliveryMode: action.deliveryMode,
        revealAt: action.revealAt,
        revealPresetKey: action.revealPresetKey,
        relatedDatePlanId: action.relatedDatePlanId,
        visibility: action.visibility,
        confirmNow: true,
        nowISO: action.nowISO,
      });

      const notif = buildSurpriseCareNotification({
        record,
        recipientPrefs: state.notificationPrefs[recipient],
        timeLabel: action.timeLabel,
        dateISO: action.dateISO,
      });

      let nextDateInteractions = state.datePlanInteractions;
      if (record.relatedDatePlanId) {
        const prevDate = state.datePlanInteractions[record.relatedDatePlanId] ?? {
          planId: record.relatedDatePlanId,
          reactionByPartner: {},
          status: 'none' as DatePlanInviteStatus,
          updatedAtISO: action.nowISO,
          updatedTimeLabel: action.timeLabel,
        };
        nextDateInteractions = {
          ...state.datePlanInteractions,
          [record.relatedDatePlanId]: {
            ...prevDate,
            invitedBy: action.sender,
            invitee: recipient,
            status: 'invited',
            updatedAtISO: action.nowISO,
            updatedTimeLabel: action.timeLabel,
          },
        };
      }

      const actKind =
        record.deliveryMode === 'keep_surprise' ? 'surprise_scheduled' : 'surprise_sent';
      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: actKind,
        actor: action.sender,
        target: recipient,
        suggestionId: record.sourceRecommendationId,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };

      return {
        ...state,
        surpriseCareRecords: [record, ...(state.surpriseCareRecords ?? [])],
        notifications: upsertSurpriseNotification(state.notifications, notif),
        datePlanInteractions: nextDateInteractions,
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'UPDATE_SURPRISE_CARE': {
      const existingList = state.surpriseCareRecords ?? [];
      const target = existingList.find((s) => s.id === action.surpriseId);
      if (!target || target.senderId !== action.sender) return state;

      const edited = editSurpriseCareRecord(target, action.patch, action.nowISO);
      if (!edited.updated) return state;

      const recipient = edited.record.recipientId as PartnerId;
      const updatedNotif = buildSurpriseCareNotification({
        record: edited.record,
        recipientPrefs: state.notificationPrefs[recipient],
        timeLabel: action.timeLabel,
        dateISO: action.dateISO,
      });

      return {
        ...state,
        surpriseCareRecords: existingList.map((s) =>
          s.id === edited.record.id ? edited.record : s
        ),
        notifications: upsertSurpriseNotification(state.notifications, updatedNotif),
      };
    }

    case 'CANCEL_SURPRISE_CARE': {
      const existingList = state.surpriseCareRecords ?? [];
      const target = existingList.find((s) => s.id === action.surpriseId);
      if (!target) return state;

      const cancelled = cancelSurpriseCareRecord(target, action.sender, action.nowISO);
      if (!cancelled.cancelled) return state;

      const nextNotifications = state.notifications.filter(
        (n) => n.surpriseCareId !== target.id && n.id !== target.notificationId
      );

      let nextDateInteractions = state.datePlanInteractions;
      if (target.relatedDatePlanId && state.datePlanInteractions[target.relatedDatePlanId]) {
        const currentDate = state.datePlanInteractions[target.relatedDatePlanId];
        if (currentDate.status === 'invited' && currentDate.invitedBy === action.sender) {
          const rest = { ...state.datePlanInteractions };
          delete rest[target.relatedDatePlanId];
          nextDateInteractions = rest;
        }
      }

      return {
        ...state,
        surpriseCareRecords: existingList.map((s) =>
          s.id === target.id ? cancelled.record : s
        ),
        notifications: nextNotifications,
        datePlanInteractions: nextDateInteractions,
      };
    }

    case 'UNLOCK_DEMO_SURPRISE_REVEAL': {
      const existingList = state.surpriseCareRecords ?? [];
      const target = existingList.find((s) => s.id === action.surpriseId);
      if (!target || target.status !== 'Scheduled') return state;

      return {
        ...state,
        surpriseCareRecords: existingList.map((s) =>
          s.id === target.id ? { ...s, revealAt: action.nowISO, updatedAt: action.nowISO } : s
        ),
      };
    }

    case 'REVEAL_SURPRISE_CARE': {
      const existingList = state.surpriseCareRecords ?? [];
      const target = existingList.find((s) => s.id === action.surpriseId);
      if (!target) return state;

      const revealed = revealSurpriseCareRecord(
        target,
        action.recipient,
        action.nowISO,
        { forceDemoUnlock: action.forceDemoUnlock }
      );
      if (!revealed.revealed) return state;

      const updatedNotif = buildSurpriseCareNotification({
        record: revealed.record,
        recipientPrefs: state.notificationPrefs[action.recipient],
        timeLabel: action.timeLabel,
        dateISO: action.dateISO,
      });

      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'surprise_revealed',
        actor: action.recipient,
        target: target.senderId as PartnerId,
        suggestionId: target.sourceRecommendationId,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };

      return {
        ...state,
        surpriseCareRecords: existingList.map((s) =>
          s.id === target.id ? revealed.record : s
        ),
        notifications: upsertSurpriseNotification(state.notifications, updatedNotif),
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'COMPLETE_SURPRISE_CARE': {
      const existingList = state.surpriseCareRecords ?? [];
      const target = existingList.find((s) => s.id === action.surpriseId);
      if (!target) return state;

      const completed = completeSurpriseCareRecord(target, action.actor, action.nowISO);
      if (!completed.completed) return state;

      const recipient = completed.record.recipientId as PartnerId;
      const updatedNotif = buildSurpriseCareNotification({
        record: completed.record,
        recipientPrefs: state.notificationPrefs[recipient],
        timeLabel: action.timeLabel,
        dateISO: action.dateISO,
      });

      const updatedMoments = upsertSurpriseCareMoment(state.careMoments, completed.record, {
        dateISO: action.dateISO,
        timeLabel: action.timeLabel,
        nowISO: action.nowISO,
      });

      const newActivity: CareActivityItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'surprise_completed',
        actor: action.actor,
        suggestionId: target.sourceRecommendationId,
        timeLabel: action.timeLabel,
        dayKind: 'today',
      };

      return {
        ...state,
        surpriseCareRecords: existingList.map((s) =>
          s.id === target.id ? completed.record : s
        ),
        notifications: upsertSurpriseNotification(state.notifications, updatedNotif),
        careMoments: updatedMoments,
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'DISMISS_RECOMMENDATION_NOT_NOW': {
      const currentDismissed = state.dismissedRecommendationIds ?? { alex: [], jamie: [] };
      const existingForPartner = currentDismissed[action.partner] ?? [];
      if (existingForPartner.includes(action.recommendationId)) {
        return state;
      }
      // Strictly non-learning dismissal: never modifies aiFeedback or feedbackEvents.
      return {
        ...state,
        dismissedRecommendationIds: {
          ...currentDismissed,
          [action.partner]: [action.recommendationId, ...existingForPartner].slice(0, 60),
        },
      };
    }

    case 'SCHEDULE_CARE_REMINDER': {
      const existing = state.careReminders ?? [];
      const nextReminder: CareReminderRecord = {
        id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ownerId: action.partner,
        recommendation: action.recommendation,
        presetKey: action.presetKey,
        remindAtISO: action.remindAtISO,
        createdAtISO: action.nowISO,
        status: 'scheduled',
      };
      const filtered = existing.filter(
        (r) =>
          !(
            r.ownerId === action.partner &&
            r.recommendation.id === action.recommendation.id &&
            r.status === 'scheduled'
          )
      );
      return {
        ...state,
        careReminders: [nextReminder, ...filtered],
      };
    }

    case 'DISMISS_CARE_REMINDER':
      return {
        ...state,
        careReminders: (state.careReminders ?? []).map((r) =>
          r.id === action.reminderId ? { ...r, status: 'dismissed' } : r
        ),
      };

    case 'ACT_ON_CARE_REMINDER':
      return {
        ...state,
        careReminders: (state.careReminders ?? []).map((r) =>
          r.id === action.reminderId ? { ...r, status: 'acted' } : r
        ),
      };

    case 'CREATE_SIMULATED_ORDER_FLOW': {
      const recipient: PartnerId = action.sender === 'alex' ? 'jamie' : 'alex';
      const baseOrder = createSimulatedOrderRecord({
        senderId: action.sender,
        recipientId: recipient,
        recipientName: action.recipientName,
        recommendation: action.recommendation,
        product: action.product,
        selectedVariant: action.selectedVariant,
        quantity: action.quantity,
        deliveryAddress: action.deliveryAddress,
        careMessage: action.careMessage,
        platformNotes: action.platformNotes,
        language: action.language,
        nowISO: action.nowISO,
      });

      const surpriseRecord = createSurpriseCareRecord({
        senderId: action.sender,
        recipientId: recipient,
        sourceRecommendation: {
          ...action.recommendation,
          requiresSpendingMoney: true,
        },
        careCategory: 'thoughtful_gesture',
        noteStyle: 'standard',
        title: baseOrder.productTitle,
        actionDescription: `${baseOrder.merchantName} · ${baseOrder.selectedVariant} (×${baseOrder.quantity})`,
        content: baseOrder.careMessage,
        deliveryMode: action.revealMode,
        revealAt:
          action.revealMode === 'keep_surprise' ? '9999-12-31T23:59:59.000Z' : null,
        visibility: 'shared',
        orderId: baseOrder.id,
        sourceActionMode: 'mock_order',
        confirmNow: true,
        nowISO: action.nowISO,
      });

      const finalOrder: MockOrderRecord = {
        ...baseOrder,
        revealMode: action.revealMode,
        surpriseCareId: surpriseRecord.id,
        notificationId: surpriseRecord.notificationId,
      };

      const notif = buildSurpriseCareNotification({
        record: surpriseRecord,
        recipientPrefs: state.notificationPrefs[recipient],
        timeLabel: action.timeLabel,
        dateISO: action.dateISO,
      });
      if (action.revealMode === 'tell_now') {
        notif.productImageKey = finalOrder.productImageKey;
      }

      const newActivity: CareActivityItem =
        action.revealMode === 'keep_surprise'
          ? {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'order_secret_prepared',
              actor: action.sender,
              target: recipient,
              suggestionId: finalOrder.sourceRecommendationId,
              timeLabel: action.timeLabel,
              dayKind: 'today',
            }
          : {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'order_placed_revealed',
              actor: action.sender,
              target: recipient,
              suggestionId: finalOrder.sourceRecommendationId,
              suggestionTitle: finalOrder.productTitle,
              timeLabel: action.timeLabel,
              dayKind: 'today',
            };

      const nextReminders = action.reminderId
        ? (state.careReminders ?? []).map((r) =>
            r.id === action.reminderId ? { ...r, status: 'acted' as const } : r
          )
        : state.careReminders ?? [];

      return {
        ...state,
        mockOrders: [finalOrder, ...(state.mockOrders ?? [])],
        surpriseCareRecords: [surpriseRecord, ...(state.surpriseCareRecords ?? [])],
        notifications: upsertSurpriseNotification(state.notifications, notif),
        careReminders: nextReminders,
        careActivity: [newActivity, ...state.careActivity].slice(0, 8),
      };
    }

    case 'ADVANCE_MOCK_ORDER_STATUS': {
      const existingOrders = state.mockOrders ?? [];
      const targetOrder = existingOrders.find((o) => o.id === action.orderId);
      if (!targetOrder || targetOrder.senderId !== action.sender) return state;

      const transitioned = transitionMockOrderStatus(
        targetOrder,
        action.nextStatus,
        action.nowISO
      );
      if (!transitioned.changed) return state;

      const updatedOrder = transitioned.order;
      const recipient: PartnerId = updatedOrder.recipientId as PartnerId;
      const existingSurprises = state.surpriseCareRecords ?? [];
      const linkedSurprise = existingSurprises.find(
        (s) => s.id === updatedOrder.surpriseCareId || s.orderId === updatedOrder.id
      );

      let nextSurprises = existingSurprises;
      let nextNotifications = state.notifications;
      let nextActivity = state.careActivity;

      if (updatedOrder.status === 'Delivered') {
        let activeSurprise = linkedSurprise;
        if (
          linkedSurprise &&
          linkedSurprise.deliveryMode === 'keep_surprise' &&
          linkedSurprise.status === 'Scheduled'
        ) {
          activeSurprise = {
            ...linkedSurprise,
            status: 'Revealed',
            revealedAt: action.nowISO,
            updatedAt: action.nowISO,
          };
          nextSurprises = existingSurprises.map((s) =>
            s.id === activeSurprise!.id ? activeSurprise! : s
          );
        }
        if (activeSurprise) {
          const updatedNotif = buildSurpriseCareNotification({
            record: activeSurprise,
            recipientPrefs: state.notificationPrefs[recipient],
            timeLabel: action.timeLabel,
            dateISO: action.dateISO,
          });
          updatedNotif.productImageKey = updatedOrder.productImageKey;
          nextNotifications = upsertSurpriseNotification(state.notifications, updatedNotif);
        }
        const deliveredActivity: CareActivityItem = {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: 'order_delivered',
          actor: action.sender,
          target: recipient,
          suggestionId: updatedOrder.sourceRecommendationId,
          suggestionTitle: updatedOrder.productTitle,
          timeLabel: action.timeLabel,
          dayKind: 'today',
        };
        nextActivity = [deliveredActivity, ...state.careActivity].slice(0, 8);
      } else if (updatedOrder.revealMode === 'tell_now') {
        const progressActivity: CareActivityItem = {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: 'order_progress',
          actor: action.sender,
          target: recipient,
          suggestionId: updatedOrder.sourceRecommendationId,
          suggestionTitle: updatedOrder.status,
          timeLabel: action.timeLabel,
          dayKind: 'today',
        };
        nextActivity = [progressActivity, ...state.careActivity].slice(0, 8);
      }

      return {
        ...state,
        mockOrders: existingOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
        surpriseCareRecords: nextSurprises,
        notifications: nextNotifications,
        careActivity: nextActivity,
      };
    }

    case 'CANCEL_MOCK_ORDER': {
      const existingOrders = state.mockOrders ?? [];
      const targetOrder = existingOrders.find((o) => o.id === action.orderId);
      if (!targetOrder || targetOrder.senderId !== action.sender) return state;

      const cancelled = transitionMockOrderStatus(targetOrder, 'Cancelled', action.nowISO);
      if (!cancelled.changed) return state;

      const nextSurprises = (state.surpriseCareRecords ?? []).map((s) =>
        s.id === targetOrder.surpriseCareId || s.orderId === targetOrder.id
          ? { ...s, status: 'Cancelled' as const, updatedAt: action.nowISO }
          : s
      );
      const nextNotifications = state.notifications.filter(
        (n) =>
          n.mockOrderId !== targetOrder.id &&
          n.surpriseCareId !== targetOrder.surpriseCareId &&
          n.id !== targetOrder.notificationId
      );

      return {
        ...state,
        mockOrders: existingOrders.map((o) =>
          o.id === targetOrder.id ? cancelled.order : o
        ),
        surpriseCareRecords: nextSurprises,
        notifications: nextNotifications,
      };
    }

    case 'RESET_DEMO':
      return createInitialPresentationInteractions();

    default:
      return state;
  }
}

interface DualChargeContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;

  // Explicit Application Mode Routing
  entryMode: AppEntryMode;
  enterOnboarding: () => void;
  enterPresentationDemo: () => void;
  exitPresentationDemo: () => void;
  returnToWelcome: () => void;
  resumeNormalApp: () => void;

  // Normal User Mode (strictly isolated Day 1+ state)
  normalUser: NormalUserProfile;
  normalRecords: NormalDailyRecord[];
  normalPairing: NormalPairingState;
  normalPreferences: NormalPreferencesState;
  normalInteractions: NormalInteractionsState;
  normalBaseline: NormalBaselineAnalysis;
  normalActivePage: AppPage;
  setNormalActivePage: (page: AppPage) => void;
  normalLastMainPage: Exclude<AppPage, 'profile'>;
  normalInsightsSubView: InsightsSubView;
  setNormalInsightsSubView: (view: InsightsSubView) => void;
  openNormalInsightsSubView: (view: InsightsSubView) => void;
  normalCareSubView: CareScenarioView;
  setNormalCareSubView: (view: CareScenarioView) => void;
  openNormalCareSubView: (view: CareScenarioView) => void;
  normalNotificationsSubView: NotificationsCategoryView;
  setNormalNotificationsSubView: (view: NotificationsCategoryView) => void;
  openNormalNotificationsSubView: (view: NotificationsCategoryView) => void;
  normalProfileSubView: 'main' | 'premium';
  setNormalProfileSubView: (view: 'main' | 'premium') => void;
  openNormalPremiumMembership: () => void;
  returnFromNormalProfile: () => void;
  normalAiCareUsageCount: number;
  incrementNormalAiCareUsage: () => void;
  completeOnboarding: (draft: OnboardingDraft) => void;
  resetNormalAccount: () => void;
  setNormalDraftCheckIn: (option: CheckInOption) => void;
  confirmNormalDailyStatus: (option?: CheckInOption) => void;
  recordNormalCheckIn: (option: CheckInOption) => void;
  pairNormalLocalPartner: (code?: string) => void;
  toggleNormalSharing: (key: SharingPrefKey) => void;
  addNormalCustomPreference: (label: string) => void;
  removeNormalCustomPreference: (tagId: string) => void;
  removeNormalPresetPreference: (
    kind: 'preferred' | 'avoid',
    key: PreferredCareTagKey | AvoidTagKey
  ) => void;
  saveNormalSuggestion: (suggestion: NormalCareSuggestion) => boolean;
  saveNormalAiSuggestion: (
    recommendation: AiCareRecommendation,
    source: 'gemini' | 'fallback'
  ) => boolean;
  removeNormalSavedSuggestion: (suggestionId: string) => void;
  reuseNormalSavedSuggestion: (item: AiCareSavedItem, customMessage?: string) => void;
  sendNormalCare: (suggestion: NormalCareSuggestion, customMessage?: string) => void;
  sendNormalAiCare: (recommendation: AiCareRecommendation, customMessage?: string) => void;
  trackNormalSkippedSuggestion: (suggestionId: string) => void;
  submitNormalWeeklyRecharge: (params: {
    supportChoice: WeeklyRechargeSupportChoice;
    nextWeekWish: WeeklyRechargeNextWeekWish;
    optionalComment?: string;
    shareWithPartner: boolean;
  }) => void;
  skipNormalWeeklyRecharge: () => void;
  updateNormalNotificationPrefs: (patch: Partial<NotificationPreferences>) => void;
  updateNormalNotificationStatus: (notificationId: string, status: NotificationStatus) => void;
  recordNormalAiFeedback: (
    kind: 'not_relevant' | 'more_like_this',
    recommendation: AiCareRecommendation
  ) => void;
  recordNormalRecipientFeedback: (
    feedbackType: RecipientFeedbackType,
    recommendation: AiCareRecommendation
  ) => void;
  clearNormalLearnedPreferences: () => void;
  recordNormalRecentSuggestions: (recommendations: AiCareRecommendation[]) => void;
  normalLearnedProfile: LearnedPreferenceProfile;
  confirmNormalPremiumDemo: () => void;
  createNormalSurpriseCare: (params: {
    sourceRecommendation: AiCareRecommendation;
    careCategory: SurpriseCareCategory;
    noteStyle: SurpriseCareNoteStyle;
    title: string;
    actionDescription: string;
    content: string;
    deliveryMode: SurpriseCareDeliveryMode;
    revealAt: string | null;
    revealPresetKey?: SurpriseRevealPresetKey;
    relatedDatePlanId?: string;
    visibility: SurpriseCareVisibility;
  }) => boolean;
  updateNormalSurpriseCare: (
    surpriseId: string,
    patch: Partial<
      Pick<
        SurpriseCareRecord,
        | 'careCategory'
        | 'noteStyle'
        | 'title'
        | 'actionDescription'
        | 'content'
        | 'revealAt'
        | 'revealPresetKey'
        | 'relatedDatePlanId'
        | 'visibility'
      >
    >
  ) => void;
  cancelNormalSurpriseCare: (surpriseId: string) => void;
  completeNormalSurpriseCare: (surpriseId: string) => void;
  dismissNormalRecommendationNotNow: (recommendationId: string) => void;
  scheduleNormalCareReminder: (params: {
    recommendation: AiCareRecommendation;
    presetKey: CareReminderPresetKey;
    customISO?: string | null;
  }) => CareReminderRecord;
  dismissNormalCareReminder: (reminderId: string) => void;
  createNormalSimulatedOrderFlow: (params: {
    recommendation: AiCareRecommendation;
    product: MockProductCatalogItem;
    selectedVariant: string;
    quantity: number;
    deliveryAddress: string;
    careMessage: string;
    platformNotes?: string;
    revealMode: SurpriseCareDeliveryMode;
    reminderId?: string;
  }) => MockOrderRecord;
  advanceNormalMockOrderStatus: (orderId: string, nextStatus: MockOrderStatus) => void;
  cancelNormalMockOrder: (orderId: string) => void;

  // Presentation Demo Mode (lazy-loaded 60-day Alex & Jamie data + separate demo state)
  presentationBundle: PresentationBundle | null;
  presentationLoading: boolean;
  activePages: Record<PartnerId, AppPage>;
  setActivePage: (partner: PartnerId, page: AppPage) => void;
  lastMainPages: Record<PartnerId, Exclude<AppPage, 'profile'>>;
  insightsSubViews: Record<PartnerId, InsightsSubView>;
  setInsightsSubView: (partner: PartnerId, view: InsightsSubView) => void;
  openInsightsSubView: (partner: PartnerId, view: InsightsSubView) => void;
  careSubViews: Record<PartnerId, CareScenarioView>;
  setCareSubView: (partner: PartnerId, view: CareScenarioView) => void;
  openCareSubView: (partner: PartnerId, view: CareScenarioView) => void;
  notificationsSubViews: Record<PartnerId, NotificationsCategoryView>;
  setNotificationsSubView: (partner: PartnerId, view: NotificationsCategoryView) => void;
  openNotificationsSubView: (partner: PartnerId, view: NotificationsCategoryView) => void;
  profileSubViews: Record<PartnerId, 'main' | 'premium'>;
  setProfileSubView: (partner: PartnerId, view: 'main' | 'premium') => void;
  openPremiumMembership: (partner: PartnerId) => void;
  returnFromProfile: (partner: PartnerId) => void;
  shouldHideBottomNav: (scope: 'demo' | 'normal', partner: PartnerId) => boolean;
  presentationAiCareUsageCount: number;
  incrementPresentationAiCareUsage: () => void;
  dailyCheckIns: Record<PartnerId, DailyCheckInState>;
  partnerStatusUpdates: Record<PartnerId, PartnerStatusSnapshot | null>;
  setDraftCheckIn: (partner: PartnerId, option: CheckInOption) => void;
  confirmDailyStatus: (partner: PartnerId, option?: CheckInOption) => void;
  recordCheckIn: (partner: PartnerId, option: CheckInOption) => void;
  sharingPrefs: Record<PartnerId, SharingPreferences>;
  toggleSharingPref: (partner: PartnerId, key: SharingPrefKey) => void;
  healthSyncState: Record<PartnerId, HealthSyncState>;
  syncDemoHealth: (partner: PartnerId) => void;
  notificationPrefs: Record<PartnerId, NotificationPreferences>;
  updateNotificationPrefs: (partner: PartnerId, patch: Partial<NotificationPreferences>) => void;
  weeklyRecharge: Record<PartnerId, WeeklyRechargeEntry | null>;
  submitWeeklyRecharge: (
    partner: PartnerId,
    params: {
      supportChoice: WeeklyRechargeSupportChoice;
      nextWeekWish: WeeklyRechargeNextWeekWish;
      optionalComment?: string;
      shareWithPartner: boolean;
    }
  ) => void;
  skipWeeklyRecharge: (partner: PartnerId) => void;
  careMoments: CareMomentRecord[];
  updateCareMomentNote: (momentId: string, note: string, author: PartnerId) => void;
  toggleCareMomentVisibility: (momentId: string) => void;
  datePlanInteractions: Record<string, DatePlanInteraction>;
  toggleDatePlanReaction: (partner: PartnerId, planId: string, reaction: 'like' | 'skip') => void;
  sendDatePlanInvite: (sender: PartnerId, planId: string) => void;
  respondDatePlanInvite: (responder: PartnerId, planId: string, status: DatePlanInviteStatus) => void;
  proposeDatePlanAlternativeTime: (
    proposer: PartnerId,
    planId: string,
    slotLabel: string,
    note?: string
  ) => void;
  skippedSuggestionIds: Record<PartnerId, string[]>;
  trackSkippedSuggestion: (partner: PartnerId, suggestionId: string) => void;
  membership: CoupleMembershipState;
  upgradeDemoPremium: (partner: PartnerId, plan: CoupleBillingPlan) => void;
  widgetPreviewStyle: Record<PartnerId, WidgetPreviewStyle>;
  setWidgetPreviewStyle: (partner: PartnerId, style: WidgetPreviewStyle) => void;
  carePreferences: Record<PartnerId, PreferenceTagItem[]>;
  addCarePreference: (partner: PartnerId, label: string) => void;
  removeCarePreference: (partner: PartnerId, tagId: string) => void;
  savedSuggestionIds: Record<PartnerId, string[]>;
  savedAiSuggestions: Record<PartnerId, AiCareSavedItem[]>;
  aiFeedback: Record<PartnerId, AiCareFeedbackState>;
  feedbackEvents: Record<PartnerId, CareFeedbackEvent[]>;
  recentSuggestionHistory: Record<PartnerId, RecentSuggestionRecord[]>;
  learnedProfileForPartner: (partner: PartnerId) => LearnedPreferenceProfile;
  saveCareSuggestion: (partner: PartnerId, suggestion: CareSuggestion) => boolean;
  saveAiCareSuggestion: (
    partner: PartnerId,
    recommendation: AiCareRecommendation,
    source: 'gemini' | 'fallback'
  ) => boolean;
  removePresentationSavedSuggestion: (partner: PartnerId, suggestionId: string) => void;
  reusePresentationSavedSuggestion: (
    sender: PartnerId,
    item: AiCareSavedItem,
    customMessage?: string
  ) => void;
  notifications: CareNotification[];
  sendCareNotification: (
    sender: PartnerId,
    suggestion: CareSuggestion,
    customMessage?: string
  ) => void;
  sendAiCareNotification: (
    sender: PartnerId,
    recommendation: AiCareRecommendation,
    customMessage?: string
  ) => void;
  recordRecipientNotificationFeedback: (
    notificationId: string,
    responder: PartnerId,
    feedbackType: RecipientFeedbackType
  ) => boolean;
  recordAiCareFeedback: (
    partner: PartnerId,
    kind: 'not_relevant' | 'more_like_this',
    recommendation: AiCareRecommendation
  ) => void;
  clearLearnedPreferences: (partner: PartnerId) => void;
  recordRecentSuggestions: (
    partner: PartnerId,
    recommendations: AiCareRecommendation[]
  ) => void;
  careStatusResponseFocus: Record<
    PartnerId,
    { active: boolean; updatedAtTime?: string; checkInStatus?: CheckInOption }
  >;
  respondWithCareFromStatus: (partner: PartnerId) => void;
  clearCareStatusResponseFocus: (partner: PartnerId) => void;
  updateNotificationStatus: (
    notificationId: string,
    status: NotificationStatus,
    responder: PartnerId
  ) => void;
  careActivity: CareActivityItem[];
  unreadCountForPartner: (partner: PartnerId) => number;
  surpriseCareRecords: SurpriseCareRecord[];
  createSurpriseCare: (
    sender: PartnerId,
    params: {
      sourceRecommendation: AiCareRecommendation;
      careCategory: SurpriseCareCategory;
      noteStyle: SurpriseCareNoteStyle;
      title: string;
      actionDescription: string;
      content: string;
      deliveryMode: SurpriseCareDeliveryMode;
      revealAt: string | null;
      revealPresetKey?: SurpriseRevealPresetKey;
      relatedDatePlanId?: string;
      visibility: SurpriseCareVisibility;
    }
  ) => void;
  updateSurpriseCare: (
    sender: PartnerId,
    surpriseId: string,
    patch: Partial<
      Pick<
        SurpriseCareRecord,
        | 'careCategory'
        | 'noteStyle'
        | 'title'
        | 'actionDescription'
        | 'content'
        | 'revealAt'
        | 'revealPresetKey'
        | 'relatedDatePlanId'
        | 'visibility'
      >
    >
  ) => void;
  cancelSurpriseCare: (sender: PartnerId, surpriseId: string) => void;
  unlockDemoSurpriseReveal: (surpriseId: string) => void;
  revealSurpriseCare: (
    recipient: PartnerId,
    surpriseId: string,
    options?: { forceDemoUnlock?: boolean }
  ) => void;
  completeSurpriseCare: (actor: PartnerId, surpriseId: string) => void;
  mockOrders: MockOrderRecord[];
  careReminders: CareReminderRecord[];
  dismissedRecommendationIds: Record<PartnerId, string[]>;
  dismissRecommendationNotNow: (partner: PartnerId, recommendationId: string) => void;
  scheduleCareReminder: (
    partner: PartnerId,
    params: {
      recommendation: AiCareRecommendation;
      presetKey: CareReminderPresetKey;
      customISO?: string | null;
    }
  ) => string;
  dismissCareReminder: (reminderId: string) => void;
  actOnCareReminder: (reminderId: string) => void;
  createSimulatedOrderFlow: (
    sender: PartnerId,
    params: {
      recommendation: AiCareRecommendation;
      product: MockProductCatalogItem;
      selectedVariant: string;
      quantity: number;
      deliveryAddress: string;
      careMessage: string;
      platformNotes?: string;
      revealMode: SurpriseCareDeliveryMode;
      reminderId?: string;
    }
  ) => void;
  advanceMockOrderStatus: (
    sender: PartnerId,
    orderId: string,
    nextStatus: MockOrderStatus
  ) => void;
  cancelMockOrder: (sender: PartnerId, orderId: string) => void;
  premiumDemoConfirmed: boolean;
  confirmPremiumDemo: () => void;
  resetDemo: () => void;
}

const DualChargeContext = createContext<DualChargeContextValue | null>(null);

function formatNowTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function DualChargeProvider({ children }: { children: React.ReactNode }) {
  // Perform safe legacy migration once synchronously on initial render
  useState(() => {
    runSafeStorageMigration();
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => loadPersistedLanguage());

  // Normal User Mode stores (completely independent from Presentation Demo)
  const [normalUser, setNormalUser] = useState<NormalUserProfile>(() => loadPersistedNormalUser());
  const [normalRecords, setNormalRecords] = useState<NormalDailyRecord[]>(() =>
    loadPersistedNormalRecords()
  );
  const [normalPairing, setNormalPairing] = useState<NormalPairingState>(() =>
    loadPersistedNormalPairing()
  );
  const [normalPreferences, setNormalPreferences] = useState<NormalPreferencesState>(() =>
    loadPersistedNormalPreferences()
  );
  const [normalInteractions, setNormalInteractions] = useState<NormalInteractionsState>(() =>
    loadPersistedNormalInteractions()
  );
  const [normalActivePage, setNormalActivePageState] = useState<AppPage>('home');
  const [normalLastMainPage, setNormalLastMainPage] =
    useState<Exclude<AppPage, 'profile'>>('home');
  const [normalInsightsSubView, setNormalInsightsSubView] =
    useState<InsightsSubView>('overview');
  const [normalCareSubView, setNormalCareSubView] = useState<CareScenarioView>('now');
  const [normalNotificationsSubView, setNormalNotificationsSubView] =
    useState<NotificationsCategoryView>('overview');
  const [normalProfileSubView, setNormalProfileSubView] = useState<'main' | 'premium'>('main');

  const setNormalActivePage = (page: AppPage) => {
    if (page !== 'profile') {
      setNormalLastMainPage(page);
    }
    setNormalActivePageState(page);
  };

  const openNormalInsightsSubView = (view: InsightsSubView) => {
    setNormalInsightsSubView(view);
    setNormalActivePage('insights');
  };

  const openNormalCareSubView = (view: CareScenarioView) => {
    setNormalCareSubView(view);
    setNormalActivePage('care');
  };

  const openNormalNotificationsSubView = (view: NotificationsCategoryView) => {
    setNormalNotificationsSubView(view);
    setNormalActivePage('notifications');
  };

  const returnFromNormalProfile = () => {
    setNormalProfileSubView('main');
    setNormalActivePageState(normalLastMainPage);
  };

  // Application Mode
  const [entryMode, setEntryMode] = useState<AppEntryMode>(() =>
    loadInitialEntryMode(normalUser.completed)
  );

  // Presentation Demo Mode stores + lazy-loaded canonical 60-day dataset
  const [presentationState, dispatchPresentation] = useReducer(
    presentationReducer,
    undefined,
    loadPersistedPresentationInteractions
  );
  const [presentationBundle, setPresentationBundle] = useState<PresentationBundle | null>(() =>
    getCachedPresentationBundle()
  );
  const [presentationLoading, setPresentationLoading] = useState<boolean>(false);
  const [activePages, setActivePages] = useState<Record<PartnerId, AppPage>>({
    alex: 'home',
    jamie: 'home',
  });
  const [lastMainPages, setLastMainPages] = useState<
    Record<PartnerId, Exclude<AppPage, 'profile'>>
  >({
    alex: 'home',
    jamie: 'home',
  });
  const [insightsSubViews, setInsightsSubViews] = useState<Record<PartnerId, InsightsSubView>>({
    alex: 'overview',
    jamie: 'overview',
  });
  const [careSubViews, setCareSubViews] = useState<Record<PartnerId, CareScenarioView>>({
    alex: 'now',
    jamie: 'now',
  });
  const [notificationsSubViews, setNotificationsSubViews] = useState<
    Record<PartnerId, NotificationsCategoryView>
  >({
    alex: 'overview',
    jamie: 'overview',
  });
  const [profileSubViews, setProfileSubViews] = useState<Record<PartnerId, 'main' | 'premium'>>({
    alex: 'main',
    jamie: 'main',
  });
  const [careStatusResponseFocus, setCareStatusResponseFocus] = useState<
    Record<PartnerId, { active: boolean; updatedAtTime?: string; checkInStatus?: CheckInOption }>
  >({
    alex: { active: false },
    jamie: { active: false },
  });

  // Lazy-load presentationDemoData.json ONLY when entering Presentation Demo Mode
  useEffect(() => {
    if (entryMode !== 'presentation' || presentationBundle) {
      return;
    }
    let cancelled = false;
    setPresentationLoading(true);
    loadPresentationBundle()
      .then((bundle) => {
        if (!cancelled) {
          setPresentationBundle(bundle);
          setPresentationLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPresentationLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [entryMode, presentationBundle]);

  // Persist Normal User Mode keys independently
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.NORMAL_USER, JSON.stringify(normalUser));
    } catch {
      // Ignore storage quota errors
    }
  }, [normalUser]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.NORMAL_RECORDS, JSON.stringify(normalRecords));
    } catch {
      // Ignore storage quota errors
    }
  }, [normalRecords]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.NORMAL_PAIRING, JSON.stringify(normalPairing));
    } catch {
      // Ignore storage quota errors
    }
  }, [normalPairing]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.NORMAL_PREFERENCES,
        JSON.stringify(normalPreferences)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [normalPreferences]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.NORMAL_INTERACTIONS,
        JSON.stringify(normalInteractions)
      );
      window.localStorage.setItem(
        STORAGE_KEYS.NORMAL_SAVED_SUGGESTIONS,
        JSON.stringify(normalInteractions.savedAiSuggestions)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [normalInteractions]);

  // Persist Presentation Demo interactions & saved suggestions independently
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.PRESENTATION_INTERACTIONS,
        JSON.stringify(presentationState)
      );
      window.localStorage.setItem(
        STORAGE_KEYS.PRESENTATION_SAVED_SUGGESTIONS,
        JSON.stringify(presentationState.savedAiSuggestions)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [presentationState]);

  // Persist current application mode
  useEffect(() => {
    try {
      const modeToPersist = entryMode === 'onboarding' ? 'welcome' : entryMode;
      window.localStorage.setItem(STORAGE_KEYS.MODE, modeToPersist);
    } catch {
      // Ignore storage quota errors
    }
  }, [entryMode]);

  // Persist language across both modes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch {
      // Ignore storage quota errors
    }
  }, [language]);

  const normalBaseline = useMemo(
    () => analyzeNormalBaseline(normalRecords, normalUser.baselineStartDate),
    [normalRecords, normalUser.baselineStartDate]
  );

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  // Explicit mode navigation
  const enterOnboarding = () => {
    setEntryMode('onboarding');
  };

  const enterPresentationDemo = () => {
    setEntryMode('presentation');
  };

  const exitPresentationDemo = () => {
    if (normalUser.completed) {
      setNormalActivePage('home');
      setEntryMode('normal');
    } else {
      setEntryMode('welcome');
    }
  };

  const returnToWelcome = () => {
    setEntryMode('welcome');
  };

  const resumeNormalApp = () => {
    if (normalUser.completed) {
      setNormalActivePage('home');
      setEntryMode('normal');
    } else {
      setEntryMode('onboarding');
    }
  };

  /**
   * Complete Normal User Onboarding:
   * Initializes a clean Day 1 account with baselineStatus='building', validCheckInDays=0,
   * and an empty historical records array ([]). Never imports demo data.
   */
  const completeOnboarding = (draft: OnboardingDraft) => {
    const todayISO = getTodayLocalDateISO();
    const nowISO = new Date().toISOString();

    const cleanProfile: NormalUserProfile = {
      completed: true,
      completedAtISO: nowISO,
      nickname: draft.nickname.trim(),
      avatarId: draft.avatarId,
      baselineStartDate: todayISO,
      baselineStatus: 'building',
      validCheckInDays: 0,
      sharingConsent: normalizeSharingPreferences(draft.sharingConsent),
      premiumDemoConfirmed: false,
    };

    const pairingCode =
      draft.pairingMethod === 'join' && draft.joinCodeInput.trim()
        ? draft.joinCodeInput.trim().toUpperCase()
        : draft.inviteCode || NORMAL_LOCAL_INVITE_CODE;

    const cleanPairing: NormalPairingState = {
      status: draft.pairingStatus,
      method: draft.pairingMethod,
      inviteCode: pairingCode,
      partnerHasRecords: false,
    };

    const cleanPreferences: NormalPreferencesState = {
      preferredCare: [...draft.preferredCare],
      avoidTags: [...draft.avoidTags],
      communicationStyle: draft.communicationStyle,
      customTags: [],
    };

    setNormalUser(cleanProfile);
    setNormalRecords([]); // Day 1 starts with 0 historical records
    setNormalPairing(cleanPairing);
    setNormalPreferences(cleanPreferences);
    setNormalInteractions(createInitialNormalInteractionsState());
    setNormalActivePage('home');
    setNormalInsightsSubView('overview');
    setNormalCareSubView('now');
    setNormalNotificationsSubView('overview');
    setNormalProfileSubView('main');
    setEntryMode('normal');
  };

  /**
   * Explicitly resets Normal User Mode data only.
   * Never deletes Presentation Demo interactions or Language preference.
   */
  const resetNormalAccount = () => {
    setNormalUser(createInitialNormalUserProfile());
    setNormalRecords([]);
    setNormalPairing(createInitialNormalPairingState());
    setNormalPreferences(createInitialNormalPreferencesState());
    setNormalInteractions(createInitialNormalInteractionsState());
    setNormalLastMainPage('home');
    setNormalActivePage('home');
    setNormalInsightsSubView('overview');
    setNormalCareSubView('now');
    setNormalNotificationsSubView('overview');
    setNormalProfileSubView('main');
    setEntryMode('welcome');
  };

  /**
   * Updates only the unconfirmed local draft check-in selection without creating or overwriting a daily record.
   */
  const setNormalDraftCheckIn = (option: CheckInOption) => {
    const todayISO = getTodayLocalDateISO();
    setNormalInteractions((prev) => ({
      ...prev,
      draftCheckInStatus: option,
      draftCheckInDateISO: todayISO,
    }));
  };

  /**
   * Explicitly confirms today's daily status and writes/updates the single same-day NormalDailyRecord.
   */
  const confirmNormalDailyStatus = (explicitOption?: CheckInOption) => {
    const option = explicitOption ?? normalInteractions.draftCheckInStatus;
    if (!option) return;
    const now = new Date();
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO(now);
    const prevToday = normalRecords.find((r) => r.date === dateISO);
    const nextRecordsRaw = upsertNormalDailyRecord(normalRecords, option, timeLabel, now);
    const nextRecords = nextRecordsRaw.map((rec) =>
      rec.date === dateISO
        ? {
            ...rec,
            confirmedAtISO: now.toISOString(),
            confirmationCount: (prevToday?.confirmationCount ?? 0) + 1,
          }
        : rec
    );
    setNormalRecords(nextRecords);
    setNormalUser((prev) => ({
      ...prev,
      validCheckInDays: nextRecords.length,
      baselineStatus: nextRecords.length >= 7 ? 'preliminary' : 'building',
    }));

    const snapshot: PartnerStatusSnapshot = {
      dateISO,
      confirmedAtISO: now.toISOString(),
      updatedAtTime: timeLabel,
      confirmationState: prevToday ? 'updated' : 'confirmed',
      energyShared: Boolean(normalUser.sharingConsent.energy),
      sleepShared: false,
      activityShared: false,
      ...(normalUser.sharingConsent.energy ? { checkInStatus: option } : {}),
    };

    setNormalInteractions((prev) => ({
      ...prev,
      draftCheckInStatus: option,
      draftCheckInDateISO: dateISO,
      confirmedStatusSnapshot: snapshot,
    }));
  };

  /**
   * Legacy alias preserving compatibility: confirms today's local date record cleanly.
   */
  const recordNormalCheckIn = (option: CheckInOption) => {
    confirmNormalDailyStatus(option);
  };

  const pairNormalLocalPartner = (code?: string) => {
    const normalized = code?.trim().toUpperCase();
    setNormalPairing((prev) => ({
      status: 'paired_simulated',
      method: normalized ? 'join' : 'create',
      inviteCode: normalized || prev.inviteCode || NORMAL_LOCAL_INVITE_CODE,
      partnerHasRecords: false,
    }));
  };

  const toggleNormalSharing = (key: SharingPrefKey) => {
    setNormalUser((prev) => {
      const current = normalizeSharingPreferences(prev.sharingConsent);
      let next: SharingPreferences;
      if (key === 'cycleTrackingEnabled') {
        const nextEnabled = !current.cycleTrackingEnabled;
        next = {
          ...current,
          cycleTrackingEnabled: nextEnabled,
          cycle: nextEnabled ? current.cycle : false,
        };
      } else if (key === 'cycle') {
        next = {
          ...current,
          cycle: current.cycleTrackingEnabled ? !current.cycle : false,
        };
      } else {
        next = {
          ...current,
          [key]: !current[key],
        };
      }
      return {
        ...prev,
        sharingConsent: next,
      };
    });
  };

  const addNormalCustomPreference = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setNormalPreferences((prev) => {
      const exists = prev.customTags.some(
        (tag) => (tag.customLabel ?? '').toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return prev;
      return {
        ...prev,
        customTags: [
          ...prev.customTags,
          {
            id: `norm-pref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            customLabel: trimmed,
          },
        ],
      };
    });
  };

  const removeNormalCustomPreference = (tagId: string) => {
    setNormalPreferences((prev) => ({
      ...prev,
      customTags: prev.customTags.filter((tag) => tag.id !== tagId),
    }));
  };

  const removeNormalPresetPreference = (
    kind: 'preferred' | 'avoid',
    key: PreferredCareTagKey | AvoidTagKey
  ) => {
    setNormalPreferences((prev) => ({
      ...prev,
      preferredCare:
        kind === 'preferred'
          ? prev.preferredCare.filter((k) => k !== key)
          : prev.preferredCare,
      avoidTags:
        kind === 'avoid' ? prev.avoidTags.filter((k) => k !== key) : prev.avoidTags,
    }));
  };

  const saveNormalSuggestion = (suggestion: NormalCareSuggestion): boolean => {
    if (normalInteractions.savedSuggestionIds.includes(suggestion.id)) {
      return false;
    }
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    const copy = TRANSLATIONS[language].normalMode.careSuggestions[suggestion.id];
    const meta = buildMetadataFromPresetCare({
      suggestionId: suggestion.id,
      title: copy?.title || suggestion.id,
      description: copy?.description || suggestion.id,
      timing: copy?.timing || 'Today',
    });
    const presetRec: AiCareRecommendation = {
      id: suggestion.id,
      title: copy?.title || suggestion.id,
      category: meta.category,
      why: copy?.reason || '',
      action: copy?.description || copy?.title || suggestion.id,
      suggestedTiming: copy?.timing || 'Today',
      personalizationReason: copy?.reason || '',
      confidence: 'Preference-Based',
      defaultMessage: copy?.defaultMessage || '',
      actionType: meta.actionType,
      communicationStyle: meta.communicationStyle,
      effortLevel: meta.effortLevel,
      requiresSpendingMoney: meta.requiresSpendingMoney,
      tags: meta.tags,
      fingerprint: meta.fingerprint,
    };

    let wasAdded = false;
    setNormalInteractions((prev) => {
      if (prev.savedSuggestionIds.includes(suggestion.id)) return prev;
      const savedSnap = saveSuggestionSnapshot({
        existing: prev.savedAiSuggestions,
        recommendation: presetRec,
        source: 'preset',
        ownerId: normalUser.nickname || 'normal_user',
      });
      wasAdded = true;
      const newActivity: NormalCareActivityItem = {
        id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'saved_care',
        suggestionId: suggestion.id,
        suggestionTitle: copy?.title,
        dateISO,
        timeLabel,
      };
      return {
        ...prev,
        savedSuggestionIds: [...prev.savedSuggestionIds, suggestion.id],
        savedAiSuggestions: savedSnap.items,
        careActivity: [newActivity, ...prev.careActivity].slice(0, 8),
      };
    });
    return wasAdded || true;
  };

  const saveNormalAiSuggestion = (
    recommendation: AiCareRecommendation,
    source: 'gemini' | 'fallback'
  ): boolean => {
    if (normalInteractions.savedSuggestionIds.includes(recommendation.id)) {
      return false;
    }
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    const savedSnapPreview = saveSuggestionSnapshot({
      existing: normalInteractions.savedAiSuggestions,
      recommendation,
      source,
      ownerId: normalUser.nickname || 'normal_user',
    });
    if (!savedSnapPreview.added) {
      return false;
    }

    setNormalInteractions((prev) => {
      if (prev.savedSuggestionIds.includes(recommendation.id)) return prev;
      const savedSnap = saveSuggestionSnapshot({
        existing: prev.savedAiSuggestions,
        recommendation,
        source,
        ownerId: normalUser.nickname || 'normal_user',
      });
      if (!savedSnap.added) return prev;
      const newActivity: NormalCareActivityItem = {
        id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'saved_care',
        suggestionId: recommendation.id,
        suggestionTitle: recommendation.title,
        dateISO,
        timeLabel,
      };
      // Saving never alters aiFeedback or feedbackEvents
      return {
        ...prev,
        savedSuggestionIds: [...prev.savedSuggestionIds, recommendation.id],
        savedAiSuggestions: savedSnap.items,
        careActivity: [newActivity, ...prev.careActivity].slice(0, 8),
      };
    });
    return true;
  };

  const removeNormalSavedSuggestion = (suggestionId: string) => {
    setNormalInteractions((prev) => ({
      ...prev,
      savedSuggestionIds: prev.savedSuggestionIds.filter((id) => id !== suggestionId),
      savedAiSuggestions: removeSavedSuggestionById(prev.savedAiSuggestions, suggestionId),
    }));
  };

  const sendNormalCare = (suggestion: NormalCareSuggestion, customMessage?: string) => {
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    setNormalInteractions((prev) => {
      const newNotification: NormalCareNotification = {
        id: `norm-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        direction: 'outgoing',
        suggestionId: suggestion.id,
        customMessage: customMessage?.trim() || undefined,
        dateISO,
        timeLabel,
        status: 'Sent',
      };
      const newActivity: NormalCareActivityItem = {
        id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'sent_care',
        suggestionId: suggestion.id,
        dateISO,
        timeLabel,
      };
      return {
        ...prev,
        notifications: [newNotification, ...prev.notifications],
        careActivity: [newActivity, ...prev.careActivity].slice(0, 8),
      };
    });
  };

  const sendNormalAiCare = (recommendation: AiCareRecommendation, customMessage?: string) => {
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    setNormalInteractions((prev) => {
      const newNotification: NormalCareNotification = {
        id: `norm-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        direction: 'outgoing',
        suggestionId: recommendation.id,
        suggestionTitle: recommendation.title,
        suggestionDefaultMessage: recommendation.defaultMessage,
        customMessage: customMessage?.trim() || undefined,
        dateISO,
        timeLabel,
        status: 'Sent',
      };
      const newActivity: NormalCareActivityItem = {
        id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'sent_care',
        suggestionId: recommendation.id,
        suggestionTitle: recommendation.title,
        dateISO,
        timeLabel,
      };
      return {
        ...prev,
        notifications: [newNotification, ...prev.notifications],
        careActivity: [newActivity, ...prev.careActivity].slice(0, 8),
      };
    });
  };

  const reuseNormalSavedSuggestion = (item: AiCareSavedItem, customMessage?: string) => {
    const rec: AiCareRecommendation = {
      id: item.id,
      title: item.title,
      category: item.category,
      why: item.why,
      action: item.action,
      suggestedTiming: item.suggestedTiming,
      personalizationReason: item.personalizationReason,
      confidence: item.confidence,
      defaultMessage: item.defaultMessage,
      actionType: item.metadata?.actionType,
      communicationStyle: item.metadata?.communicationStyle,
      effortLevel: item.metadata?.effortLevel,
      requiresSpendingMoney: item.metadata?.requiresSpendingMoney,
      tags: item.metadata?.tags,
      fingerprint: item.metadata?.fingerprint,
    };
    sendNormalAiCare(rec, customMessage);
  };

  const trackNormalSkippedSuggestion = (suggestionId: string) => {
    setNormalInteractions((prev) => {
      const existing = prev.skippedSuggestionIds ?? [];
      if (existing.includes(suggestionId)) return prev;
      return {
        ...prev,
        skippedSuggestionIds: [suggestionId, ...existing].slice(0, 30),
      };
    });
  };

  const submitNormalWeeklyRecharge = (params: {
    supportChoice: WeeklyRechargeSupportChoice;
    nextWeekWish: WeeklyRechargeNextWeekWish;
    optionalComment?: string;
    shareWithPartner: boolean;
  }) => {
    const nowISO = new Date().toISOString();
    const weekKey = getTodayLocalDateISO().slice(0, 7);
    setNormalInteractions((prev) => ({
      ...prev,
      weeklyRecharge: {
        partnerId: 'normal_user',
        weekKey,
        status: 'completed',
        supportChoice: params.supportChoice,
        nextWeekWish: params.nextWeekWish,
        optionalComment: params.optionalComment?.trim() || undefined,
        shareWithPartner: params.shareWithPartner,
        submittedAtISO: prev.weeklyRecharge?.submittedAtISO ?? nowISO,
        updatedAtISO: nowISO,
      },
    }));
  };

  const skipNormalWeeklyRecharge = () => {
    const nowISO = new Date().toISOString();
    const weekKey = getTodayLocalDateISO().slice(0, 7);
    setNormalInteractions((prev) => ({
      ...prev,
      weeklyRecharge: {
        partnerId: 'normal_user',
        weekKey,
        status: 'skipped',
        supportChoice: null,
        nextWeekWish: null,
        shareWithPartner: false,
        submittedAtISO: prev.weeklyRecharge?.submittedAtISO ?? nowISO,
        updatedAtISO: nowISO,
      },
    }));
  };

  const updateNormalNotificationPrefs = (patch: Partial<NotificationPreferences>) => {
    setNormalInteractions((prev) => ({
      ...prev,
      notificationPrefs: {
        ...createDefaultNotificationPreferences(),
        ...(prev.notificationPrefs ?? {}),
        ...patch,
      },
    }));
  };

  const updateNormalNotificationStatus = (notificationId: string, status: NotificationStatus) => {
    setNormalInteractions((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, status } : n
      ),
    }));
  };

  const recordNormalAiFeedback = (
    kind: 'not_relevant' | 'more_like_this',
    recommendation: AiCareRecommendation
  ) => {
    setNormalInteractions((prev) => ({
      ...prev,
      aiFeedback: updateFeedbackState(prev.aiFeedback, kind, recommendation),
    }));
  };

  const recordNormalRecipientFeedback = (
    feedbackType: RecipientFeedbackType,
    recommendation: AiCareRecommendation
  ) => {
    const meta = normalizeRecommendationMetadata(recommendation);
    setNormalInteractions((prev) => {
      const recorded = recordRecipientFeedbackEvent({
        events: prev.feedbackEvents ?? [],
        actor: 'normal_recipient',
        recipient: 'normal_recipient',
        suggestionId: recommendation.id,
        suggestionTitle: recommendation.title,
        feedbackType,
        metadata: meta,
      });
      if (!recorded.accepted) return prev;
      return {
        ...prev,
        feedbackEvents: recorded.events,
        aiFeedback: syncAiFeedbackSummaryFromEvents('normal_recipient', recorded.events),
      };
    });
  };

  const clearNormalLearnedPreferences = () => {
    setNormalInteractions((prev) => ({
      ...prev,
      feedbackEvents: [],
      aiFeedback: createEmptyFeedbackState(),
    }));
  };

  const recordNormalRecentSuggestions = (recommendations: AiCareRecommendation[]) => {
    setNormalInteractions((prev) => ({
      ...prev,
      recentSuggestionHistory: appendToRecentSuggestionHistory(
        prev.recentSuggestionHistory ?? [],
        recommendations
      ),
    }));
  };

  const normalLearnedProfile = useMemo(() => {
    const tDict = TRANSLATIONS[language];
    const preferredCareLabels = [
      ...normalPreferences.preferredCare.map(
        (k) => tDict.onboarding.step4.preferredCareOptions[k] ?? k
      ),
      ...normalPreferences.customTags.map((tag) => tag.customLabel ?? '').filter(Boolean),
    ];
    const avoidLabels = normalPreferences.avoidTags.map(
      (k) => tDict.onboarding.step4.avoidOptions[k] ?? k
    );
    return deriveLearnedPreferenceProfile(
      'normal_recipient',
      normalInteractions.feedbackEvents ?? [],
      {
        preferredCareLabels,
        avoidLabels,
        communicationStyleLabel: normalPreferences.communicationStyle
          ? tDict.onboarding.step4.communicationOptions[normalPreferences.communicationStyle]
          : null,
      }
    );
  }, [language, normalInteractions.feedbackEvents, normalPreferences]);

  const confirmNormalPremiumDemo = () => {
    setNormalUser((prev) => ({
      ...prev,
      premiumDemoConfirmed: true,
    }));
  };

  const openNormalPremiumMembership = () => {
    setNormalNotificationsSubView('membership');
    setNormalActivePage('notifications');
  };

  const currentMonthKey = getCurrentMonthKey();
  const normalAiCareUsageCount =
    normalInteractions.aiCareUsage?.monthKey === currentMonthKey
      ? normalInteractions.aiCareUsage.count
      : 0;

  const incrementNormalAiCareUsage = () => {
    const key = getCurrentMonthKey();
    setNormalInteractions((prev) => {
      const prevCount = prev.aiCareUsage?.monthKey === key ? prev.aiCareUsage.count : 0;
      return {
        ...prev,
        aiCareUsage: {
          monthKey: key,
          count: prevCount + 1,
        },
      };
    });
  };

  const createNormalSurpriseCare = (params: {
    sourceRecommendation: AiCareRecommendation;
    careCategory: SurpriseCareCategory;
    noteStyle: SurpriseCareNoteStyle;
    title: string;
    actionDescription: string;
    content: string;
    deliveryMode: SurpriseCareDeliveryMode;
    revealAt: string | null;
    revealPresetKey?: SurpriseRevealPresetKey;
    relatedDatePlanId?: string;
    visibility: SurpriseCareVisibility;
  }): boolean => {
    if (normalPairing.status !== 'paired_simulated') {
      return false;
    }
    const nowISO = new Date().toISOString();
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    const senderId = normalUser.nickname || 'normal_user';
    const record = createSurpriseCareRecord({
      senderId,
      recipientId: 'normal_partner',
      sourceRecommendation: params.sourceRecommendation,
      careCategory: params.careCategory,
      noteStyle: params.noteStyle,
      title: params.title,
      actionDescription: params.actionDescription,
      content: params.content,
      deliveryMode: params.deliveryMode,
      revealAt: params.revealAt,
      revealPresetKey: params.revealPresetKey,
      relatedDatePlanId: params.relatedDatePlanId,
      visibility: params.visibility,
      confirmNow: true,
      nowISO,
    });
    const outNotif: NormalCareNotification = {
      id: record.notificationId ?? `notif-surprise-${record.id}`,
      direction: 'outgoing',
      kind: 'surprise_care',
      suggestionId: record.sourceRecommendationId,
      surpriseCareId: record.id,
      suggestionTitle: record.title,
      suggestionDefaultMessage: record.content,
      dateISO,
      timeLabel,
      status: 'Sent',
    };
    const actKind =
      record.deliveryMode === 'keep_surprise' ? 'surprise_scheduled' : 'surprise_sent';
    const newAct: NormalCareActivityItem = {
      id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: actKind,
      suggestionId: record.sourceRecommendationId,
      suggestionTitle: record.title,
      dateISO,
      timeLabel,
    };
    setNormalInteractions((prev) => ({
      ...prev,
      surpriseCareRecords: [record, ...(prev.surpriseCareRecords ?? [])],
      notifications: [outNotif, ...prev.notifications],
      careActivity: [newAct, ...prev.careActivity].slice(0, 8),
    }));
    return true;
  };

  const updateNormalSurpriseCare = (
    surpriseId: string,
    patch: Partial<
      Pick<
        SurpriseCareRecord,
        | 'careCategory'
        | 'noteStyle'
        | 'title'
        | 'actionDescription'
        | 'content'
        | 'revealAt'
        | 'revealPresetKey'
        | 'relatedDatePlanId'
        | 'visibility'
      >
    >
  ) => {
    const nowISO = new Date().toISOString();
    setNormalInteractions((prev) => {
      const list = prev.surpriseCareRecords ?? [];
      const target = list.find((s) => s.id === surpriseId);
      if (!target) return prev;
      const edited = editSurpriseCareRecord(target, patch, nowISO);
      if (!edited.updated) return prev;
      return {
        ...prev,
        surpriseCareRecords: list.map((s) => (s.id === surpriseId ? edited.record : s)),
        notifications: prev.notifications.map((n) =>
          n.surpriseCareId === surpriseId
            ? {
                ...n,
                suggestionTitle: edited.record.title,
                suggestionDefaultMessage: edited.record.content,
              }
            : n
        ),
      };
    });
  };

  const cancelNormalSurpriseCare = (surpriseId: string) => {
    const nowISO = new Date().toISOString();
    const senderId = normalUser.nickname || 'normal_user';
    setNormalInteractions((prev) => {
      const list = prev.surpriseCareRecords ?? [];
      const target = list.find((s) => s.id === surpriseId);
      if (!target) return prev;
      const cancelled = cancelSurpriseCareRecord(target, senderId, nowISO);
      if (!cancelled.cancelled) return prev;
      return {
        ...prev,
        surpriseCareRecords: list.map((s) => (s.id === surpriseId ? cancelled.record : s)),
        notifications: prev.notifications.filter((n) => n.surpriseCareId !== surpriseId),
      };
    });
  };

  const completeNormalSurpriseCare = (surpriseId: string) => {
    const nowISO = new Date().toISOString();
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    const senderId = normalUser.nickname || 'normal_user';
    setNormalInteractions((prev) => {
      const list = prev.surpriseCareRecords ?? [];
      const target = list.find((s) => s.id === surpriseId);
      if (!target) return prev;
      const completed = completeSurpriseCareRecord(target, senderId, nowISO);
      if (!completed.completed) return prev;
      const newAct: NormalCareActivityItem = {
        id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'surprise_completed',
        suggestionId: target.sourceRecommendationId,
        suggestionTitle: target.title,
        dateISO,
        timeLabel,
      };
      return {
        ...prev,
        surpriseCareRecords: list.map((s) => (s.id === surpriseId ? completed.record : s)),
        notifications: prev.notifications.map((n) =>
          n.surpriseCareId === surpriseId ? { ...n, status: 'Completed' } : n
        ),
        careActivity: [newAct, ...prev.careActivity].slice(0, 8),
      };
    });
  };

  const dismissNormalRecommendationNotNow = (recommendationId: string) => {
    setNormalInteractions((prev) => {
      const existing = prev.dismissedRecommendationIds ?? [];
      if (existing.includes(recommendationId)) return prev;
      return {
        ...prev,
        dismissedRecommendationIds: [recommendationId, ...existing].slice(0, 60),
      };
    });
  };

  const scheduleNormalCareReminder = (params: {
    recommendation: AiCareRecommendation;
    presetKey: CareReminderPresetKey;
    customISO?: string | null;
  }): CareReminderRecord => {
    const now = new Date();
    const remindAtISO = computeReminderAtISO(params.presetKey, params.customISO, now);
    const nextReminder: CareReminderRecord = {
      id: `norm-rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ownerId: normalUser.nickname || 'normal_user',
      recommendation: params.recommendation,
      presetKey: params.presetKey,
      remindAtISO,
      createdAtISO: now.toISOString(),
      status: 'scheduled',
    };
    setNormalInteractions((prev) => ({
      ...prev,
      careReminders: [
        nextReminder,
        ...(prev.careReminders ?? []).filter(
          (r) => !(r.recommendation.id === params.recommendation.id && r.status === 'scheduled')
        ),
      ],
    }));
    return nextReminder;
  };

  const dismissNormalCareReminder = (reminderId: string) => {
    setNormalInteractions((prev) => ({
      ...prev,
      careReminders: (prev.careReminders ?? []).map((r) =>
        r.id === reminderId ? { ...r, status: 'dismissed' } : r
      ),
    }));
  };

  const createNormalSimulatedOrderFlow = (params: {
    recommendation: AiCareRecommendation;
    product: MockProductCatalogItem;
    selectedVariant: string;
    quantity: number;
    deliveryAddress: string;
    careMessage: string;
    platformNotes?: string;
    revealMode: SurpriseCareDeliveryMode;
    reminderId?: string;
  }): MockOrderRecord => {
    const nowISO = new Date().toISOString();
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();
    const senderId = normalUser.nickname || 'normal_user';
    const recipientName = TRANSLATIONS[language].normalMode.partnerDisplayName;

    const baseOrder = createSimulatedOrderRecord({
      senderId,
      recipientId: 'normal_partner',
      recipientName,
      recommendation: params.recommendation,
      product: params.product,
      selectedVariant: params.selectedVariant,
      quantity: params.quantity,
      deliveryAddress: params.deliveryAddress,
      careMessage: params.careMessage,
      platformNotes: params.platformNotes,
      language,
      nowISO,
    });

    const surpriseRecord = createSurpriseCareRecord({
      senderId,
      recipientId: 'normal_partner',
      sourceRecommendation: { ...params.recommendation, requiresSpendingMoney: true },
      careCategory: 'thoughtful_gesture',
      noteStyle: 'standard',
      title: baseOrder.productTitle,
      actionDescription: `${baseOrder.merchantName} · ${baseOrder.selectedVariant} (×${baseOrder.quantity})`,
      content: baseOrder.careMessage,
      deliveryMode: params.revealMode,
      revealAt: params.revealMode === 'keep_surprise' ? '9999-12-31T23:59:59.000Z' : null,
      visibility: 'shared',
      orderId: baseOrder.id,
      sourceActionMode: 'mock_order',
      confirmNow: true,
      nowISO,
    });

    const finalOrder: MockOrderRecord = {
      ...baseOrder,
      revealMode: params.revealMode,
      surpriseCareId: surpriseRecord.id,
      notificationId: surpriseRecord.notificationId,
    };

    const outNotif: NormalCareNotification = {
      id: finalOrder.notificationId ?? `notif-surprise-${surpriseRecord.id}`,
      direction: 'outgoing',
      kind: 'surprise_care',
      suggestionId: finalOrder.sourceRecommendationId,
      surpriseCareId: surpriseRecord.id,
      mockOrderId: finalOrder.id,
      productImageKey: params.revealMode === 'tell_now' ? finalOrder.productImageKey : undefined,
      suggestionTitle:
        params.revealMode === 'tell_now' ? finalOrder.productTitle : undefined,
      suggestionDefaultMessage:
        params.revealMode === 'tell_now' ? finalOrder.careMessage : undefined,
      dateISO,
      timeLabel,
      status: 'Sent',
    };

    const newAct: NormalCareActivityItem = {
      id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind: params.revealMode === 'keep_surprise' ? 'order_secret_prepared' : 'order_placed_revealed',
      suggestionId: finalOrder.sourceRecommendationId,
      suggestionTitle: params.revealMode === 'tell_now' ? finalOrder.productTitle : undefined,
      mockOrderId: finalOrder.id,
      dateISO,
      timeLabel,
    };

    setNormalInteractions((prev) => ({
      ...prev,
      mockOrders: [finalOrder, ...(prev.mockOrders ?? [])],
      surpriseCareRecords: [surpriseRecord, ...(prev.surpriseCareRecords ?? [])],
      notifications: [outNotif, ...prev.notifications],
      careReminders: params.reminderId
        ? (prev.careReminders ?? []).map((r) =>
            r.id === params.reminderId ? { ...r, status: 'acted' as const } : r
          )
        : prev.careReminders ?? [],
      careActivity: [newAct, ...prev.careActivity].slice(0, 8),
    }));

    return finalOrder;
  };

  const advanceNormalMockOrderStatus = (orderId: string, nextStatus: MockOrderStatus) => {
    const nowISO = new Date().toISOString();
    const timeLabel = formatNowTime();
    const dateISO = getTodayLocalDateISO();

    setNormalInteractions((prev) => {
      const orders = prev.mockOrders ?? [];
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return prev;
      const transitioned = transitionMockOrderStatus(targetOrder, nextStatus, nowISO);
      if (!transitioned.changed) return prev;
      const updatedOrder = transitioned.order;

      let nextSurprises = prev.surpriseCareRecords ?? [];
      let nextNotifs = prev.notifications;
      let nextActs = prev.careActivity;

      if (updatedOrder.status === 'Delivered') {
        nextSurprises = nextSurprises.map((s) =>
          (s.id === updatedOrder.surpriseCareId || s.orderId === updatedOrder.id) &&
          s.status === 'Scheduled'
            ? { ...s, status: 'Revealed' as const, revealedAt: nowISO, updatedAt: nowISO }
            : s
        );
        nextNotifs = prev.notifications.map((n) =>
          n.mockOrderId === updatedOrder.id || n.surpriseCareId === updatedOrder.surpriseCareId
            ? {
                ...n,
                productImageKey: updatedOrder.productImageKey,
                suggestionTitle: updatedOrder.productTitle,
                suggestionDefaultMessage: updatedOrder.careMessage,
                status: 'Received' as const,
              }
            : n
        );
        const delAct: NormalCareActivityItem = {
          id: `norm-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kind: 'order_delivered',
          suggestionId: updatedOrder.sourceRecommendationId,
          suggestionTitle: updatedOrder.productTitle,
          mockOrderId: updatedOrder.id,
          dateISO,
          timeLabel,
        };
        nextActs = [delAct, ...prev.careActivity].slice(0, 8);
      }

      return {
        ...prev,
        mockOrders: orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        surpriseCareRecords: nextSurprises,
        notifications: nextNotifs,
        careActivity: nextActs,
      };
    });
  };

  const cancelNormalMockOrder = (orderId: string) => {
    const nowISO = new Date().toISOString();
    setNormalInteractions((prev) => {
      const orders = prev.mockOrders ?? [];
      const target = orders.find((o) => o.id === orderId);
      if (!target) return prev;
      const cancelled = transitionMockOrderStatus(target, 'Cancelled', nowISO);
      if (!cancelled.changed) return prev;
      return {
        ...prev,
        mockOrders: orders.map((o) => (o.id === orderId ? cancelled.order : o)),
        surpriseCareRecords: (prev.surpriseCareRecords ?? []).map((s) =>
          s.id === target.surpriseCareId || s.orderId === target.id
            ? { ...s, status: 'Cancelled' as const, updatedAt: nowISO }
            : s
        ),
        notifications: prev.notifications.filter(
          (n) => n.mockOrderId !== target.id && n.surpriseCareId !== target.surpriseCareId
        ),
      };
    });
  };

  // Presentation Demo Mode actions (strictly scoped to presentationState)
  const setActivePage = (partner: PartnerId, page: AppPage) => {
    if (page !== 'profile') {
      setLastMainPages((prev) => ({ ...prev, [partner]: page }));
    }
    setActivePages((prev) => ({ ...prev, [partner]: page }));
  };

  const setInsightsSubView = (partner: PartnerId, view: InsightsSubView) => {
    setInsightsSubViews((prev) => ({ ...prev, [partner]: view }));
  };

  const openInsightsSubView = (partner: PartnerId, view: InsightsSubView) => {
    setInsightsSubViews((prev) => ({ ...prev, [partner]: view }));
    setActivePage(partner, 'insights');
  };

  const setCareSubView = (partner: PartnerId, view: CareScenarioView) => {
    setCareSubViews((prev) => ({ ...prev, [partner]: view }));
  };

  const openCareSubView = (partner: PartnerId, view: CareScenarioView) => {
    setCareSubViews((prev) => ({ ...prev, [partner]: view }));
    setActivePage(partner, 'care');
  };

  const setNotificationsSubView = (partner: PartnerId, view: NotificationsCategoryView) => {
    setNotificationsSubViews((prev) => ({ ...prev, [partner]: view }));
  };

  const openNotificationsSubView = (partner: PartnerId, view: NotificationsCategoryView) => {
    setNotificationsSubViews((prev) => ({ ...prev, [partner]: view }));
    setActivePage(partner, 'notifications');
  };

  const setProfileSubView = (partner: PartnerId, view: 'main' | 'premium') => {
    setProfileSubViews((prev) => ({ ...prev, [partner]: view }));
  };

  const openPremiumMembership = (partner: PartnerId) => {
    setNotificationsSubViews((prev) => ({ ...prev, [partner]: 'membership' }));
    setActivePage(partner, 'notifications');
  };

  const returnFromProfile = (partner: PartnerId) => {
    setProfileSubViews((prev) => ({ ...prev, [partner]: 'main' }));
    setActivePages((prev) => ({ ...prev, [partner]: lastMainPages[partner] }));
  };

  const shouldHideBottomNav = (scope: 'demo' | 'normal', partner: PartnerId): boolean => {
    if (scope === 'normal') {
      if (normalActivePage === 'profile') return true;
      if (normalActivePage === 'insights' && normalInsightsSubView !== 'overview') return true;
      if (
        normalActivePage === 'care' &&
        (normalCareSubView === 'detail' || normalCareSubView === 'surprise')
      ) {
        return true;
      }
      if (normalActivePage === 'notifications' && normalNotificationsSubView !== 'overview') {
        return true;
      }
      return false;
    }
    const page = activePages[partner];
    if (page === 'profile') return true;
    if (page === 'insights' && insightsSubViews[partner] !== 'overview') return true;
    if (
      page === 'care' &&
      (careSubViews[partner] === 'detail' || careSubViews[partner] === 'surprise')
    ) {
      return true;
    }
    if (page === 'notifications' && notificationsSubViews[partner] !== 'overview') return true;
    return false;
  };

  const presentationAiCareUsageCount =
    presentationState.aiCareUsage?.monthKey === currentMonthKey
      ? presentationState.aiCareUsage.count
      : 0;

  const incrementPresentationAiCareUsage = () => {
    dispatchPresentation({
      type: 'INCREMENT_AI_CARE_USAGE',
      monthKey: getCurrentMonthKey(),
    });
  };

  const setDraftCheckIn = (partner: PartnerId, option: CheckInOption) => {
    dispatchPresentation({
      type: 'SET_DRAFT_CHECK_IN',
      partner,
      option,
    });
  };

  const confirmDailyStatus = (partner: PartnerId, explicitOption?: CheckInOption) => {
    const checkIn = presentationState.dailyCheckIns[partner];
    const option = explicitOption ?? checkIn.draftStatus ?? checkIn.status;
    if (!option) return;
    const latestRec = presentationBundle?.latestRecords[partner];
    const dateISO = presentationBundle?.dateRange.end ?? '2026-11-13';
    dispatchPresentation({
      type: 'CONFIRM_DAILY_STATUS',
      partner,
      option,
      dateISO,
      timeLabel: formatNowTime(),
      energyIndex: latestRec?.estimated_energy_index_0_to_100,
      sleepHours: latestRec?.sleep_hours,
      sleepQuality: latestRec?.sleep_quality_1_to_5,
      restingHeartRateBpm: latestRec?.resting_heart_rate_bpm ?? null,
      hrvValueMs: latestRec?.hrv_value_ms ?? null,
      hrvMetricType: latestRec?.hrv_metric_type ?? null,
      activityMinutes: latestRec?.activity_minutes,
      steps: latestRec?.steps ?? null,
      recordedCyclePhase: latestRec?.recorded_cycle_phase ?? null,
    });
  };

  const recordCheckIn = (partner: PartnerId, option: CheckInOption) => {
    confirmDailyStatus(partner, option);
  };

  const toggleSharingPref = (partner: PartnerId, key: SharingPrefKey) => {
    dispatchPresentation({ type: 'TOGGLE_SHARING', partner, key });
  };

  const syncDemoHealth = (partner: PartnerId) => {
    dispatchPresentation({
      type: 'SYNC_DEMO_HEALTH',
      partner,
      timeLabel: formatNowTime(),
      iso: new Date().toISOString(),
    });
  };

  const updateNotificationPrefs = (
    partner: PartnerId,
    patch: Partial<NotificationPreferences>
  ) => {
    dispatchPresentation({ type: 'UPDATE_NOTIFICATION_PREFS', partner, patch });
  };

  const submitWeeklyRecharge = (
    partner: PartnerId,
    params: {
      supportChoice: WeeklyRechargeSupportChoice;
      nextWeekWish: WeeklyRechargeNextWeekWish;
      optionalComment?: string;
      shareWithPartner: boolean;
    }
  ) => {
    const nowISO = new Date().toISOString();
    const existing = presentationState.weeklyRecharge[partner];
    dispatchPresentation({
      type: 'SUBMIT_WEEKLY_RECHARGE',
      partner,
      entry: {
        partnerId: partner,
        weekKey: '2026-W46',
        status: 'completed',
        supportChoice: params.supportChoice,
        nextWeekWish: params.nextWeekWish,
        optionalComment: params.optionalComment?.trim() || undefined,
        shareWithPartner: params.shareWithPartner,
        submittedAtISO: existing?.submittedAtISO ?? nowISO,
        updatedAtISO: nowISO,
      },
      timeLabel: formatNowTime(),
    });
  };

  const skipWeeklyRecharge = (partner: PartnerId) => {
    const nowISO = new Date().toISOString();
    const existing = presentationState.weeklyRecharge[partner];
    dispatchPresentation({
      type: 'SUBMIT_WEEKLY_RECHARGE',
      partner,
      entry: {
        partnerId: partner,
        weekKey: '2026-W46',
        status: 'skipped',
        supportChoice: null,
        nextWeekWish: null,
        shareWithPartner: false,
        submittedAtISO: existing?.submittedAtISO ?? nowISO,
        updatedAtISO: nowISO,
      },
      timeLabel: formatNowTime(),
    });
  };

  const updateCareMomentNote = (momentId: string, note: string, author: PartnerId) => {
    dispatchPresentation({ type: 'UPDATE_CARE_MOMENT_NOTE', momentId, note, author });
  };

  const toggleCareMomentVisibility = (momentId: string) => {
    dispatchPresentation({ type: 'TOGGLE_CARE_MOMENT_VISIBILITY', momentId });
  };

  const toggleDatePlanReaction = (
    partner: PartnerId,
    planId: string,
    reaction: 'like' | 'skip'
  ) => {
    dispatchPresentation({
      type: 'TOGGLE_DATE_PLAN_REACTION',
      partner,
      planId,
      reaction,
      timeLabel: formatNowTime(),
    });
  };

  const sendDatePlanInvite = (sender: PartnerId, planId: string) => {
    dispatchPresentation({
      type: 'SEND_DATE_PLAN_INVITE',
      sender,
      planId,
      timeLabel: formatNowTime(),
    });
  };

  const respondDatePlanInvite = (
    responder: PartnerId,
    planId: string,
    status: DatePlanInviteStatus
  ) => {
    dispatchPresentation({
      type: 'RESPOND_DATE_PLAN_INVITE',
      responder,
      planId,
      status,
      timeLabel: formatNowTime(),
    });
  };

  const proposeDatePlanAlternativeTime = (
    proposer: PartnerId,
    planId: string,
    slotLabel: string,
    note?: string
  ) => {
    dispatchPresentation({
      type: 'PROPOSE_DATE_PLAN_ALTERNATIVE_TIME',
      proposer,
      planId,
      slotLabel,
      note,
      timeLabel: formatNowTime(),
    });
  };

  const trackSkippedSuggestion = (partner: PartnerId, suggestionId: string) => {
    dispatchPresentation({ type: 'TRACK_SKIPPED_SUGGESTION', partner, suggestionId });
  };

  const upgradeDemoPremium = (partner: PartnerId, plan: CoupleBillingPlan) => {
    dispatchPresentation({
      type: 'UPGRADE_COUPLE_PREMIUM',
      partner,
      plan,
      dateISO: getTodayLocalDateISO(),
    });
  };

  const setWidgetPreviewStyle = (partner: PartnerId, style: WidgetPreviewStyle) => {
    dispatchPresentation({ type: 'SET_WIDGET_PREVIEW_STYLE', partner, style });
  };

  const addCarePreference = (partner: PartnerId, label: string) => {
    dispatchPresentation({ type: 'ADD_PREFERENCE', partner, label });
  };

  const removeCarePreference = (partner: PartnerId, tagId: string) => {
    dispatchPresentation({ type: 'REMOVE_PREFERENCE', partner, tagId });
  };

  const saveCareSuggestion = (partner: PartnerId, suggestion: CareSuggestion): boolean => {
    const alreadySaved = presentationState.savedSuggestionIds[partner].includes(suggestion.id);
    if (alreadySaved) return false;
    const copy = TRANSLATIONS[language].care.suggestions[suggestion.id];
    dispatchPresentation({
      type: 'SAVE_SUGGESTION',
      partner,
      suggestion,
      localizedCopy: copy,
      timeLabel: formatNowTime(),
    });
    return true;
  };

  const saveAiCareSuggestion = (
    partner: PartnerId,
    recommendation: AiCareRecommendation,
    source: 'gemini' | 'fallback'
  ): boolean => {
    const alreadySaved = presentationState.savedSuggestionIds[partner].includes(recommendation.id);
    if (alreadySaved) return false;
    const preview = saveSuggestionSnapshot({
      existing: presentationState.savedAiSuggestions[partner],
      recommendation,
      source,
      ownerId: partner,
    });
    if (!preview.added) return false;
    dispatchPresentation({
      type: 'SAVE_AI_SUGGESTION',
      partner,
      recommendation,
      source,
      timeLabel: formatNowTime(),
    });
    return true;
  };

  const removePresentationSavedSuggestion = (partner: PartnerId, suggestionId: string) => {
    dispatchPresentation({
      type: 'REMOVE_SAVED_SUGGESTION',
      partner,
      suggestionId,
    });
  };

  const sendCareNotification = (
    sender: PartnerId,
    suggestion: CareSuggestion,
    customMessage?: string
  ) => {
    const copy = TRANSLATIONS[language].care.suggestions[suggestion.id];
    dispatchPresentation({
      type: 'SEND_CARE',
      sender,
      suggestion,
      localizedCopy: copy,
      customMessage,
      timeLabel: formatNowTime(),
    });
  };

  const sendAiCareNotification = (
    sender: PartnerId,
    recommendation: AiCareRecommendation,
    customMessage?: string
  ) => {
    dispatchPresentation({
      type: 'SEND_AI_CARE',
      sender,
      recommendation,
      customMessage,
      timeLabel: formatNowTime(),
    });
  };

  const recordRecipientNotificationFeedback = (
    notificationId: string,
    responder: PartnerId,
    feedbackType: RecipientFeedbackType
  ): boolean => {
    const target = presentationState.notifications.find((n) => n.id === notificationId);
    if (!target || target.kind === 'status_update' || target.recipient !== responder) {
      return false;
    }
    const presetCopy = TRANSLATIONS[language].care.suggestions[target.suggestionId];
    dispatchPresentation({
      type: 'RECORD_RECIPIENT_NOTIFICATION_FEEDBACK',
      notificationId,
      responder,
      feedbackType,
      fallbackTitle: presetCopy?.title,
      fallbackDescription: presetCopy?.description,
      fallbackTiming: presetCopy?.timing,
    });
    return true;
  };

  const recordAiCareFeedback = (
    partner: PartnerId,
    kind: 'not_relevant' | 'more_like_this',
    recommendation: AiCareRecommendation
  ) => {
    dispatchPresentation({
      type: 'RECORD_AI_FEEDBACK',
      partner,
      kind,
      recommendation,
    });
  };

  const clearLearnedPreferences = (partner: PartnerId) => {
    dispatchPresentation({ type: 'CLEAR_LEARNED_PREFERENCES', partner });
  };

  const recordRecentSuggestions = (
    partner: PartnerId,
    recommendations: AiCareRecommendation[]
  ) => {
    dispatchPresentation({
      type: 'RECORD_RECENT_SUGGESTIONS',
      partner,
      recommendations,
    });
  };

  const learnedProfileForPartner = (partner: PartnerId): LearnedPreferenceProfile => {
    const tDict = TRANSLATIONS[language];
    const tags = presentationState.carePreferences[partner] ?? [];
    const preferredCareLabels = tags
      .map((tag) =>
        tag.presetKey ? tDict.profile.presetTags[tag.presetKey] ?? tag.presetKey : tag.customLabel ?? ''
      )
      .filter(Boolean);
    const metaAvoid = presentationBundle?.partnerMeta[partner]?.care_preferences.avoid ?? [];
    const commStyle =
      presentationBundle?.partnerMeta[partner]?.care_preferences.communication_style ?? null;
    return deriveLearnedPreferenceProfile(
      partner,
      presentationState.feedbackEvents[partner] ?? [],
      {
        preferredCareLabels,
        avoidLabels: metaAvoid,
        communicationStyleLabel: commStyle,
      }
    );
  };

  const reusePresentationSavedSuggestion = (
    sender: PartnerId,
    item: AiCareSavedItem,
    customMessage?: string
  ) => {
    const rec: AiCareRecommendation = {
      id: item.id,
      title: item.title,
      category: item.category,
      why: item.why,
      action: item.action,
      suggestedTiming: item.suggestedTiming,
      personalizationReason: item.personalizationReason,
      confidence: item.confidence,
      defaultMessage: item.defaultMessage,
      actionType: item.metadata?.actionType,
      communicationStyle: item.metadata?.communicationStyle,
      effortLevel: item.metadata?.effortLevel,
      requiresSpendingMoney: item.metadata?.requiresSpendingMoney,
      tags: item.metadata?.tags,
      fingerprint: item.metadata?.fingerprint,
    };
    sendAiCareNotification(sender, rec, customMessage);
  };

  const respondWithCareFromStatus = (partner: PartnerId) => {
    const otherPartner: PartnerId = partner === 'alex' ? 'jamie' : 'alex';
    const snapshot = presentationState.partnerStatusUpdates[otherPartner];
    const sharing = presentationState.sharingPrefs[otherPartner];
    setCareStatusResponseFocus((prev) => ({
      ...prev,
      [partner]: {
        active: true,
        updatedAtTime: sharing.energy && snapshot ? snapshot.updatedAtTime : undefined,
        checkInStatus: sharing.energy && snapshot ? snapshot.checkInStatus : undefined,
      },
    }));
    setCareSubViews((prev) => ({ ...prev, [partner]: 'now' }));
    setActivePage(partner, 'care');
  };

  const clearCareStatusResponseFocus = (partner: PartnerId) => {
    setCareStatusResponseFocus((prev) => ({
      ...prev,
      [partner]: { active: false },
    }));
  };

  const updateNotificationStatus = (
    notificationId: string,
    status: NotificationStatus,
    responder: PartnerId
  ) => {
    const target = presentationState.notifications.find((n) => n.id === notificationId);
    const presetCopy = target
      ? TRANSLATIONS[language].care.suggestions[target.suggestionId]
      : undefined;
    dispatchPresentation({
      type: 'UPDATE_NOTIFICATION_STATUS',
      notificationId,
      status,
      responder,
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
      fallbackTitle: presetCopy?.title,
    });
  };

  const createSurpriseCare = (
    sender: PartnerId,
    params: {
      sourceRecommendation: AiCareRecommendation;
      careCategory: SurpriseCareCategory;
      noteStyle: SurpriseCareNoteStyle;
      title: string;
      actionDescription: string;
      content: string;
      deliveryMode: SurpriseCareDeliveryMode;
      revealAt: string | null;
      revealPresetKey?: SurpriseRevealPresetKey;
      relatedDatePlanId?: string;
      visibility: SurpriseCareVisibility;
    }
  ) => {
    dispatchPresentation({
      type: 'CREATE_SURPRISE_CARE',
      sender,
      sourceRecommendation: params.sourceRecommendation,
      careCategory: params.careCategory,
      noteStyle: params.noteStyle,
      title: params.title,
      actionDescription: params.actionDescription,
      content: params.content,
      deliveryMode: params.deliveryMode,
      revealAt: params.revealAt,
      revealPresetKey: params.revealPresetKey,
      relatedDatePlanId: params.relatedDatePlanId,
      visibility: params.visibility,
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
      nowISO: new Date().toISOString(),
    });
  };

  const updateSurpriseCare = (
    sender: PartnerId,
    surpriseId: string,
    patch: Partial<
      Pick<
        SurpriseCareRecord,
        | 'careCategory'
        | 'noteStyle'
        | 'title'
        | 'actionDescription'
        | 'content'
        | 'revealAt'
        | 'revealPresetKey'
        | 'relatedDatePlanId'
        | 'visibility'
      >
    >
  ) => {
    dispatchPresentation({
      type: 'UPDATE_SURPRISE_CARE',
      sender,
      surpriseId,
      patch,
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
      nowISO: new Date().toISOString(),
    });
  };

  const cancelSurpriseCare = (sender: PartnerId, surpriseId: string) => {
    dispatchPresentation({
      type: 'CANCEL_SURPRISE_CARE',
      sender,
      surpriseId,
      nowISO: new Date().toISOString(),
    });
  };

  const unlockDemoSurpriseReveal = (surpriseId: string) => {
    dispatchPresentation({
      type: 'UNLOCK_DEMO_SURPRISE_REVEAL',
      surpriseId,
      nowISO: new Date().toISOString(),
    });
  };

  const revealSurpriseCare = (
    recipient: PartnerId,
    surpriseId: string,
    options?: { forceDemoUnlock?: boolean }
  ) => {
    dispatchPresentation({
      type: 'REVEAL_SURPRISE_CARE',
      recipient,
      surpriseId,
      nowISO: new Date().toISOString(),
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
      forceDemoUnlock: options?.forceDemoUnlock,
    });
  };

  const completeSurpriseCare = (actor: PartnerId, surpriseId: string) => {
    dispatchPresentation({
      type: 'COMPLETE_SURPRISE_CARE',
      actor,
      surpriseId,
      nowISO: new Date().toISOString(),
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
    });
  };

  const dismissRecommendationNotNow = (partner: PartnerId, recommendationId: string) => {
    dispatchPresentation({
      type: 'DISMISS_RECOMMENDATION_NOT_NOW',
      partner,
      recommendationId,
    });
  };

  const scheduleCareReminder = (
    partner: PartnerId,
    params: {
      recommendation: AiCareRecommendation;
      presetKey: CareReminderPresetKey;
      customISO?: string | null;
    }
  ): string => {
    const now = new Date();
    const remindAtISO = computeReminderAtISO(params.presetKey, params.customISO, now);
    dispatchPresentation({
      type: 'SCHEDULE_CARE_REMINDER',
      partner,
      recommendation: params.recommendation,
      presetKey: params.presetKey,
      remindAtISO,
      nowISO: now.toISOString(),
    });
    return remindAtISO;
  };

  const dismissCareReminder = (reminderId: string) => {
    dispatchPresentation({ type: 'DISMISS_CARE_REMINDER', reminderId });
  };

  const actOnCareReminder = (reminderId: string) => {
    dispatchPresentation({ type: 'ACT_ON_CARE_REMINDER', reminderId });
  };

  const createSimulatedOrderFlow = (
    sender: PartnerId,
    params: {
      recommendation: AiCareRecommendation;
      product: MockProductCatalogItem;
      selectedVariant: string;
      quantity: number;
      deliveryAddress: string;
      careMessage: string;
      platformNotes?: string;
      revealMode: SurpriseCareDeliveryMode;
      reminderId?: string;
    }
  ) => {
    const recipient: PartnerId = sender === 'alex' ? 'jamie' : 'alex';
    const recipientName = recipient === 'alex' ? 'Alex' : 'Jamie';
    dispatchPresentation({
      type: 'CREATE_SIMULATED_ORDER_FLOW',
      sender,
      recipientName,
      recommendation: params.recommendation,
      product: params.product,
      selectedVariant: params.selectedVariant,
      quantity: params.quantity,
      deliveryAddress: params.deliveryAddress,
      careMessage: params.careMessage,
      platformNotes: params.platformNotes,
      revealMode: params.revealMode,
      language,
      reminderId: params.reminderId,
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
      nowISO: new Date().toISOString(),
    });
  };

  const advanceMockOrderStatus = (
    sender: PartnerId,
    orderId: string,
    nextStatus: MockOrderStatus
  ) => {
    dispatchPresentation({
      type: 'ADVANCE_MOCK_ORDER_STATUS',
      sender,
      orderId,
      nextStatus,
      timeLabel: formatNowTime(),
      dateISO: presentationBundle?.dateRange.end ?? getTodayLocalDateISO(),
      nowISO: new Date().toISOString(),
    });
  };

  const cancelMockOrder = (sender: PartnerId, orderId: string) => {
    dispatchPresentation({
      type: 'CANCEL_MOCK_ORDER',
      sender,
      orderId,
      nowISO: new Date().toISOString(),
    });
  };

  const confirmPremiumDemo = () => {
    dispatchPresentation({ type: 'CONFIRM_PREMIUM_DEMO' });
  };

  /**
   * Resets Presentation Demo interactions ONLY.
   * Preserves Normal User Mode profile/records and Language preference.
   */
  const resetDemo = () => {
    dispatchPresentation({ type: 'RESET_DEMO' });
    setActivePages({ alex: 'home', jamie: 'home' });
    setLastMainPages({ alex: 'home', jamie: 'home' });
    setInsightsSubViews({ alex: 'overview', jamie: 'overview' });
    setCareSubViews({ alex: 'now', jamie: 'now' });
    setNotificationsSubViews({ alex: 'overview', jamie: 'overview' });
    setProfileSubViews({ alex: 'main', jamie: 'main' });
    setCareStatusResponseFocus({ alex: { active: false }, jamie: { active: false } });
  };

  const unreadCountForPartner = (partner: PartnerId) => {
    const prefs = presentationState.notificationPrefs[partner];
    return presentationState.notifications.filter(
      (n) => n.recipient === partner && isNotificationAlertActive(n, prefs)
    ).length;
  };

  const t = TRANSLATIONS[language];

  return (
    <DualChargeContext.Provider
      value={{
        language,
        setLanguage,
        t,
        entryMode,
        enterOnboarding,
        enterPresentationDemo,
        exitPresentationDemo,
        returnToWelcome,
        resumeNormalApp,
        normalUser,
        normalRecords,
        normalPairing,
        normalPreferences,
        normalInteractions,
        normalBaseline,
        normalActivePage,
        setNormalActivePage,
        normalLastMainPage,
        normalInsightsSubView,
        setNormalInsightsSubView,
        openNormalInsightsSubView,
        normalCareSubView,
        setNormalCareSubView,
        openNormalCareSubView,
        normalNotificationsSubView,
        setNormalNotificationsSubView,
        openNormalNotificationsSubView,
        normalProfileSubView,
        setNormalProfileSubView,
        openNormalPremiumMembership,
        returnFromNormalProfile,
        normalAiCareUsageCount,
        incrementNormalAiCareUsage,
        completeOnboarding,
        resetNormalAccount,
        setNormalDraftCheckIn,
        confirmNormalDailyStatus,
        recordNormalCheckIn,
        pairNormalLocalPartner,
        toggleNormalSharing,
        addNormalCustomPreference,
        removeNormalCustomPreference,
        removeNormalPresetPreference,
        saveNormalSuggestion,
        saveNormalAiSuggestion,
        removeNormalSavedSuggestion,
        reuseNormalSavedSuggestion,
        sendNormalCare,
        sendNormalAiCare,
        trackNormalSkippedSuggestion,
        submitNormalWeeklyRecharge,
        skipNormalWeeklyRecharge,
        updateNormalNotificationPrefs,
        updateNormalNotificationStatus,
        recordNormalAiFeedback,
        recordNormalRecipientFeedback,
        clearNormalLearnedPreferences,
        recordNormalRecentSuggestions,
        normalLearnedProfile,
        confirmNormalPremiumDemo,
        createNormalSurpriseCare,
        updateNormalSurpriseCare,
        cancelNormalSurpriseCare,
        completeNormalSurpriseCare,
        dismissNormalRecommendationNotNow,
        scheduleNormalCareReminder,
        dismissNormalCareReminder,
        createNormalSimulatedOrderFlow,
        advanceNormalMockOrderStatus,
        cancelNormalMockOrder,
        presentationBundle,
        presentationLoading,
        activePages,
        setActivePage,
        lastMainPages,
        insightsSubViews,
        setInsightsSubView,
        openInsightsSubView,
        careSubViews,
        setCareSubView,
        openCareSubView,
        notificationsSubViews,
        setNotificationsSubView,
        openNotificationsSubView,
        profileSubViews,
        setProfileSubView,
        openPremiumMembership,
        returnFromProfile,
        shouldHideBottomNav,
        presentationAiCareUsageCount,
        incrementPresentationAiCareUsage,
        dailyCheckIns: presentationState.dailyCheckIns,
        partnerStatusUpdates: presentationState.partnerStatusUpdates,
        setDraftCheckIn,
        confirmDailyStatus,
        recordCheckIn,
        sharingPrefs: presentationState.sharingPrefs,
        toggleSharingPref,
        healthSyncState: presentationState.healthSyncState,
        syncDemoHealth,
        notificationPrefs: presentationState.notificationPrefs,
        updateNotificationPrefs,
        weeklyRecharge: presentationState.weeklyRecharge,
        submitWeeklyRecharge,
        skipWeeklyRecharge,
        careMoments: presentationState.careMoments,
        updateCareMomentNote,
        toggleCareMomentVisibility,
        datePlanInteractions: presentationState.datePlanInteractions,
        toggleDatePlanReaction,
        sendDatePlanInvite,
        respondDatePlanInvite,
        proposeDatePlanAlternativeTime,
        skippedSuggestionIds: presentationState.skippedSuggestionIds,
        trackSkippedSuggestion,
        membership: presentationState.membership,
        upgradeDemoPremium,
        widgetPreviewStyle: presentationState.widgetPreviewStyle,
        setWidgetPreviewStyle,
        carePreferences: presentationState.carePreferences,
        addCarePreference,
        removeCarePreference,
        savedSuggestionIds: presentationState.savedSuggestionIds,
        savedAiSuggestions: presentationState.savedAiSuggestions,
        aiFeedback: presentationState.aiFeedback,
        feedbackEvents: presentationState.feedbackEvents,
        recentSuggestionHistory: presentationState.recentSuggestionHistory,
        learnedProfileForPartner,
        saveCareSuggestion,
        saveAiCareSuggestion,
        removePresentationSavedSuggestion,
        reusePresentationSavedSuggestion,
        notifications: presentationState.notifications,
        sendCareNotification,
        sendAiCareNotification,
        recordRecipientNotificationFeedback,
        recordAiCareFeedback,
        clearLearnedPreferences,
        recordRecentSuggestions,
        careStatusResponseFocus,
        respondWithCareFromStatus,
        clearCareStatusResponseFocus,
        updateNotificationStatus,
        careActivity: presentationState.careActivity,
        unreadCountForPartner,
        surpriseCareRecords: presentationState.surpriseCareRecords ?? [],
        createSurpriseCare,
        updateSurpriseCare,
        cancelSurpriseCare,
        unlockDemoSurpriseReveal,
        revealSurpriseCare,
        completeSurpriseCare,
        mockOrders: presentationState.mockOrders ?? [],
        careReminders: presentationState.careReminders ?? [],
        dismissedRecommendationIds: presentationState.dismissedRecommendationIds ?? {
          alex: [],
          jamie: [],
        },
        dismissRecommendationNotNow,
        scheduleCareReminder,
        dismissCareReminder,
        actOnCareReminder,
        createSimulatedOrderFlow,
        advanceMockOrderStatus,
        cancelMockOrder,
        premiumDemoConfirmed: presentationState.premiumDemoConfirmed,
        confirmPremiumDemo,
        resetDemo,
      }}
    >
      {children}
    </DualChargeContext.Provider>
  );
}

export function useDualCharge() {
  const ctx = useContext(DualChargeContext);
  if (!ctx) {
    throw new Error('useDualCharge must be used within DualChargeProvider');
  }
  return ctx;
}

export { PRESENTATION_PAIRING_CODE };
