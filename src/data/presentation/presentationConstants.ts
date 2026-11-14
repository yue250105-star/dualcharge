import { createEmptyFeedbackState } from '@/src/services/careContextBuilder';
import { getCurrentMonthKey } from '@/src/services/membershipService';
import { buildMetadataFromPresetCare } from '@/src/services/recommendationMetadata';
import {
  CareActivityItem,
  CareMomentRecord,
  CareNotification,
  CareSuggestion,
  CoupleMembershipState,
  HealthSyncState,
  NotificationPreferences,
  PartnerId,
  PreferenceTagItem,
  PresentationInteractionsState,
  SharingPreferences,
} from '@/src/types/dualcharge';

export const PRESENTATION_PAIRING_CODE = 'DC-4829';

export const PRESENTATION_CARE_SUGGESTIONS: CareSuggestion[] = [
  { id: 'care-jamie-warm-drink', recipient: 'jamie', category: 'warmth', requiresSpendingMoney: false },
  { id: 'care-jamie-order-milk-tea', recipient: 'jamie', category: 'warmth', requiresSpendingMoney: true },
  { id: 'care-jamie-quiet-evening', recipient: 'jamie', category: 'calm', requiresSpendingMoney: false },
  { id: 'care-jamie-gentle-checkin', recipient: 'jamie', category: 'message', requiresSpendingMoney: false },
  { id: 'care-alex-evening-walk', recipient: 'alex', category: 'calm', requiresSpendingMoney: false },
  { id: 'care-alex-fruit-tea', recipient: 'alex', category: 'warmth', requiresSpendingMoney: false },
  { id: 'care-alex-order-dessert', recipient: 'alex', category: 'warmth', requiresSpendingMoney: true },
  { id: 'care-alex-supportive-note', recipient: 'alex', category: 'message', requiresSpendingMoney: false },
];

export const INITIAL_PRESENTATION_SHARING_PREFS: Record<PartnerId, SharingPreferences> = {
  alex: {
    energy: true,
    sleep: false,
    heartRate: false,
    hrv: false,
    activity: false,
    cycle: false,
    cycleTrackingEnabled: false,
    cycleReserved: false,
  },
  jamie: {
    energy: true,
    sleep: false,
    heartRate: false,
    hrv: false,
    activity: false,
    cycle: false,
    cycleTrackingEnabled: false,
    cycleReserved: false,
  },
};

export const INITIAL_PRESENTATION_HEALTH_SYNC: Record<PartnerId, HealthSyncState> = {
  alex: {
    connected: true,
    platform: 'Apple Health',
    permissionGranted: true,
    lastSyncISO: '2026-11-13T08:40:00',
    lastSyncLabel: '8:40 AM',
    availableCategories: ['sleep', 'heartRate', 'hrv', 'activity'],
    isSimulated: true,
  },
  jamie: {
    connected: true,
    platform: 'Health Connect',
    permissionGranted: true,
    lastSyncISO: '2026-11-13T08:32:00',
    lastSyncLabel: '8:32 AM',
    availableCategories: ['sleep', 'heartRate', 'hrv', 'activity', 'cycle'],
    isSimulated: true,
  },
};

export function createDefaultNotificationPreferences(): NotificationPreferences {
  return {
    quietHoursEnabled: false,
    quietStartTime: '22:30',
    quietEndTime: '07:30',
    allowImportantDuringQuietHours: true,
    frequency: 'standard',
    shareStatusNotifications: true,
    sensitivePreview: 'full',
  };
}

export const INITIAL_PRESENTATION_MEMBERSHIP: CoupleMembershipState = {
  tier: 'free',
  plan: 'monthly',
  startDateISO: null,
  purchasedBy: null,
  isSimulated: true,
};

export const INITIAL_CARE_MOMENTS: CareMomentRecord[] = [
  {
    id: 'moment-seed-recent',
    sourceNotificationId: 'notif-history-recent',
    dateTimeISO: '2026-11-11T19:45:00Z',
    timeLabel: '7:45 PM',
    dateISO: '2026-11-11',
    careActionTitle: 'Prepare a Warm Drink',
    sender: 'alex',
    recipient: 'jamie',
    status: 'Completed',
    sharedVisibility: true,
    optionalNote: 'Warm milk tea waiting right after wrapping up evening work.',
  },
  {
    id: 'moment-seed-archive',
    sourceNotificationId: 'notif-history-archive',
    dateTimeISO: '2026-10-29T20:10:00Z',
    timeLabel: '8:10 PM',
    dateISO: '2026-10-29',
    careActionTitle: 'Invite for an Evening Walk',
    sender: 'jamie',
    recipient: 'alex',
    status: 'Completed',
    sharedVisibility: true,
    optionalNote: 'Unhurried 20-minute evening walk around the block.',
  },
];

export const INITIAL_PRESENTATION_PREFERENCES: Record<PartnerId, PreferenceTagItem[]> = {
  alex: [
    { id: 'pref-a1', presetKey: 'alex_short_messages' },
    { id: 'pref-a2', presetKey: 'alex_evening_walks' },
    { id: 'pref-a3', presetKey: 'alex_fruit_tea' },
    { id: 'pref-a4', presetKey: 'alex_no_surprise_visits' },
  ],
  jamie: [
    { id: 'pref-j1', presetKey: 'jamie_quiet_time' },
    { id: 'pref-j2', presetKey: 'jamie_light_dinner' },
    { id: 'pref-j3', presetKey: 'jamie_warm_milk_tea' },
    { id: 'pref-j4', presetKey: 'jamie_gentle_checkins' },
    { id: 'pref-j5', presetKey: 'jamie_no_crowds' },
  ],
};

export const INITIAL_PRESENTATION_NOTIFICATIONS: CareNotification[] = [
  {
    id: 'notif-seed-1',
    kind: 'care_message',
    sender: 'alex',
    recipient: 'jamie',
    suggestionId: 'care-jamie-gentle-checkin',
    recommendationMetadata: buildMetadataFromPresetCare({
      suggestionId: 'care-jamie-gentle-checkin',
      title: 'Send a Gentle Check-in',
      description: 'Share a short, supportive message with no pressure to reply quickly.',
      timing: 'Thursday, 19 Nov · Midday',
    }),
    timeLabel: '9:15 AM',
    isToday: true,
    status: 'Sent',
  },
];

export const INITIAL_PRESENTATION_CARE_ACTIVITY: CareActivityItem[] = [
  {
    id: 'act-seed-1',
    kind: 'seed_supportive',
    actor: 'alex',
    target: 'jamie',
    timeLabel: '9:15 AM',
    dayKind: 'today',
  },
  {
    id: 'act-seed-2',
    kind: 'seed_saved_evening',
    actor: 'jamie',
    timeLabel: '8:40 PM',
    dayKind: 'yesterday',
  },
];

export function createInitialPresentationInteractions(): PresentationInteractionsState {
  return {
    dailyCheckIns: {
      alex: {
        status: null,
        draftStatus: null,
        confirmationState: 'unconfirmed',
        updatedAtTime: null,
        confirmedAtISO: null,
        confirmedDateISO: null,
        historyCount: 60,
      },
      jamie: {
        status: null,
        draftStatus: null,
        confirmationState: 'unconfirmed',
        updatedAtTime: null,
        confirmedAtISO: null,
        confirmedDateISO: null,
        historyCount: 60,
      },
    },
    partnerStatusUpdates: {
      alex: null,
      jamie: null,
    },
    sharingPrefs: {
      alex: { ...INITIAL_PRESENTATION_SHARING_PREFS.alex },
      jamie: { ...INITIAL_PRESENTATION_SHARING_PREFS.jamie },
    },
    healthSyncState: {
      alex: {
        ...INITIAL_PRESENTATION_HEALTH_SYNC.alex,
        availableCategories: [...INITIAL_PRESENTATION_HEALTH_SYNC.alex.availableCategories],
      },
      jamie: {
        ...INITIAL_PRESENTATION_HEALTH_SYNC.jamie,
        availableCategories: [...INITIAL_PRESENTATION_HEALTH_SYNC.jamie.availableCategories],
      },
    },
    notificationPrefs: {
      alex: createDefaultNotificationPreferences(),
      jamie: createDefaultNotificationPreferences(),
    },
    weeklyRecharge: {
      alex: null,
      jamie: null,
    },
    careMoments: [...INITIAL_CARE_MOMENTS],
    datePlanInteractions: {},
    skippedSuggestionIds: {
      alex: [],
      jamie: [],
    },
    membership: { ...INITIAL_PRESENTATION_MEMBERSHIP },
    widgetPreviewStyle: {
      alex: 'shared_energy',
      jamie: 'care_reminder',
    },
    carePreferences: {
      alex: [...INITIAL_PRESENTATION_PREFERENCES.alex],
      jamie: [...INITIAL_PRESENTATION_PREFERENCES.jamie],
    },
    savedSuggestionIds: {
      alex: [],
      jamie: [],
    },
    savedAiSuggestions: {
      alex: [],
      jamie: [],
    },
    aiFeedback: {
      alex: createEmptyFeedbackState(),
      jamie: createEmptyFeedbackState(),
    },
    feedbackEvents: {
      alex: [],
      jamie: [],
    },
    recentSuggestionHistory: {
      alex: [],
      jamie: [],
    },
    notifications: INITIAL_PRESENTATION_NOTIFICATIONS.map((n) => ({ ...n })),
    surpriseCareRecords: [],
    mockOrders: [],
    careReminders: [],
    dismissedRecommendationIds: {
      alex: [],
      jamie: [],
    },
    careActivity: INITIAL_PRESENTATION_CARE_ACTIVITY.map((a) => ({ ...a })),
    premiumDemoConfirmed: false,
    aiCareUsage: {
      monthKey: getCurrentMonthKey(),
      count: 0,
    },
  };
}
