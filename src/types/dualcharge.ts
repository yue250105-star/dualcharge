import type {
  AiCareFeedbackState,
  AiCareRecommendationMetadata,
  AiCareSavedItem,
  CareFeedbackEvent,
  CareReminderRecord,
  MockOrderRecord,
  MockProductImageKey,
  RecentSuggestionRecord,
  RecipientFeedbackType,
  SurpriseCareCategory,
  SurpriseCareDeliveryMode,
  SurpriseCareRecord,
} from './aiCare.ts';

export type PartnerId = 'alex' | 'jamie';

export type CanonicalPartnerId = 'partner_a' | 'partner_b';

export type AppPage = 'home' | 'insights' | 'care' | 'notifications' | 'profile';

export type CheckInOption = 'good' | 'tired' | 'rest';

export type NotificationStatus = 'Sent' | 'Received' | 'Completed';

export type LanguageCode = 'en' | 'zh-CN' | 'zh-TW';

export type HrvMetricType = 'SDNN' | 'RMSSD';
export type ActivityIntensity = 'Low' | 'Moderate' | 'Vigorous';
export type HealthDataSource =
  | 'Simulated Apple Health'
  | 'Simulated Health Connect'
  | 'Self-Reported';

export interface EnergyRecord {
  date: string;
  weekday: string;
  partner_id: CanonicalPartnerId;
  sleep_hours: number;
  sleep_quality_1_to_5: number;
  activity_minutes: number;
  self_reported_energy_1_to_5: number;
  estimated_energy_index_0_to_100: number;
  is_simulated: boolean;
  // Optional nullable multi-dimensional health metrics (never use 0 for missing/unavailable)
  measurement_source?: HealthDataSource | null;
  measurement_date?: string | null;
  sleep_stage_deep_minutes?: number | null;
  sleep_stage_rem_minutes?: number | null;
  sleep_stage_light_minutes?: number | null;
  sleep_stage_awake_minutes?: number | null;
  resting_heart_rate_bpm?: number | null;
  hrv_value_ms?: number | null;
  hrv_metric_type?: HrvMetricType | null;
  steps?: number | null;
  activity_intensity?: ActivityIntensity | null;
  // Optional cycle tracking metadata (requires explicit opt-in & separate sharing toggle)
  period_start_date?: string | null;
  period_end_date?: string | null;
  recorded_cycle_day?: number | null;
  recorded_cycle_phase?: string | null;
  is_estimated?: boolean | null;
  explicit_cycle_tracking_consent?: boolean | null;
}

export interface MultiDimensionalDayPoint {
  dateISO: string;
  monthIndex: number;
  dayOfMonth: number;
  weekdayIndex: number;
  restingHeartRateBpm: number | null;
  hrvValueMs: number | null;
  hrvMetricType: HrvMetricType | null;
  sleepHours: number | null;
  sleepDeepMinutes: number | null;
  sleepRemMinutes: number | null;
  sleepLightMinutes: number | null;
  sleepAwakeMinutes: number | null;
  steps: number | null;
  activityMinutes: number | null;
  activityIntensity: ActivityIntensity | null;
  measurementSource: HealthDataSource | null;
}

export interface MultiDimensionalPartnerSummary {
  partnerId: PartnerId;
  measurementSource: HealthDataSource;
  validRhrDays: number;
  rhrBaselineBpm: number | null;
  rhrLatestBpm: number | null;
  rhrLatestDeviationBpm: number | null;
  rhrRecent7MeanBpm: number | null;
  rhrMinBpm: number | null;
  rhrMaxBpm: number | null;
  hrvMetricType: HrvMetricType;
  validHrvDays: number;
  hrvBaselineMs: number | null;
  hrvLatestMs: number | null;
  hrvLatestDeviationMs: number | null;
  hrvRecent7MeanMs: number | null;
  hrvMinMs: number | null;
  hrvMaxMs: number | null;
  validSleepStageDays: number;
  avgDeepMinutes: number | null;
  avgRemMinutes: number | null;
  avgLightMinutes: number | null;
  avgAwakeMinutes: number | null;
  latestDeepMinutes: number | null;
  latestRemMinutes: number | null;
  latestLightMinutes: number | null;
  latestAwakeMinutes: number | null;
  validStepsDays: number;
  avgStepsAll: number | null;
  avgSteps7d: number | null;
  latestSteps: number | null;
  latestIntensity: ActivityIntensity | null;
  intensityBreakdown: Record<ActivityIntensity, number>;
  weekdayActivityAverages: Array<{
    weekdayIndex: number;
    avgMinutes: number | null;
    avgSteps: number | null;
    count: number;
  }>;
  series: MultiDimensionalDayPoint[];
}

export interface PartnerCarePreferences {
  preferred_care: string[];
  food_preferences: string[];
  avoid: string[];
  communication_style: string;
}

export interface PartnerProfile {
  id: PartnerId;
  canonicalId: CanonicalPartnerId;
  display_name: string;
  role: string;
  care_preferences: PartnerCarePreferences;
  shared_fields: string[];
  pattern_note: string;
}

export interface DatasetDateRange {
  start: string;
  end: string;
  days: number;
}

export interface PartnerHistory {
  partnerId: PartnerId;
  canonicalPartnerId: CanonicalPartnerId;
  dateRange: DatasetDateRange;
  records: EnergyRecord[];
  latestRecord: EnergyRecord;
}

export interface EnergyIndexSummary {
  partnerId: PartnerId;
  canonicalPartnerId: CanonicalPartnerId;
  recordCount: number;
  dateRange: DatasetDateRange;
  latestEnergy: number;
  overallMean: number;
  recent7DayMean: number;
  overallAvgSleepHours: number | null;
  belowBaselineCount: number;
  belowBaselineProportion: number;
  thursdayMean: number;
  thursdayCount: number;
  prevDayBeforeThursdaySleepMean: number | null;
}

export interface RawDemoDataset {
  project: string;
  dataset_version: string;
  dataset_type: string;
  date_range: DatasetDateRange;
  disclaimer: string;
  energy_index_formula: {
    sleep_duration_score: string;
    sleep_quality_score: string;
    self_report_score: string;
    final: string;
    interpretation: string;
  };
  partners: Record<
    CanonicalPartnerId,
    {
      display_name: string;
      role: string;
      care_preferences: PartnerCarePreferences;
      shared_fields: string[];
      pattern_note: string;
    }
  >;
  records: EnergyRecord[];
  validation_summary: Record<
    CanonicalPartnerId,
    {
      n_days: number;
      overall_mean_energy_index: number;
      weekday_means: Record<string, { n: number; mean_energy_index: number }>;
    }
  >;
}

export type DailyStatusConfirmationState = 'unconfirmed' | 'draft' | 'confirmed' | 'updated';

export interface DailyCheckInState {
  status: CheckInOption | null;
  draftStatus?: CheckInOption | null;
  confirmationState?: DailyStatusConfirmationState;
  updatedAtTime: string | null;
  confirmedAtISO?: string | null;
  confirmedDateISO?: string | null;
  historyCount: number;
}

export interface PartnerStatusSnapshot {
  dateISO: string;
  confirmedAtISO: string;
  updatedAtTime: string;
  confirmationState: 'confirmed' | 'updated';
  energyShared: boolean;
  sleepShared: boolean;
  heartRateShared?: boolean;
  hrvShared?: boolean;
  activityShared: boolean;
  cycleShared?: boolean;
  checkInStatus?: CheckInOption;
  energyIndex?: number;
  sleepHours?: number;
  sleepQuality?: number;
  restingHeartRateBpm?: number | null;
  hrvValueMs?: number | null;
  hrvMetricType?: HrvMetricType | null;
  activityMinutes?: number;
  steps?: number | null;
  recordedCyclePhase?: string | null;
}

export interface SharingPreferences {
  energy: boolean;
  sleep: boolean;
  heartRate?: boolean;
  hrv?: boolean;
  activity: boolean;
  cycle?: boolean;
  cycleTrackingEnabled?: boolean;
  cycleReserved: boolean;
}

export type SharingPrefKey =
  | 'energy'
  | 'sleep'
  | 'heartRate'
  | 'hrv'
  | 'activity'
  | 'cycle'
  | 'cycleTrackingEnabled';

export function normalizeSharingPreferences(
  raw?: Partial<SharingPreferences> | null
): SharingPreferences {
  const cycleTrackingEnabled = Boolean(raw?.cycleTrackingEnabled);
  return {
    energy: Boolean(raw?.energy),
    sleep: Boolean(raw?.sleep),
    heartRate: Boolean(raw?.heartRate),
    hrv: Boolean(raw?.hrv),
    activity: Boolean(raw?.activity),
    cycleTrackingEnabled,
    // Cycle sharing cannot remain active if explicit tracking opt-in is turned off
    cycle: cycleTrackingEnabled ? Boolean(raw?.cycle) : false,
    cycleReserved: Boolean(raw?.cycleReserved),
  };
}

export interface WeekdayAnalyticsItem {
  weekdayIndex: number; // 0 (Sun) - 6 (Sat)
  observationCount: number;
  qualifyingWeeks: number;
  averageEnergy: number | null;
  averageSleepHours: number | null;
  prevNightAvgSleepHours: number | null;
  otherNightsAvgSleepHours: number | null;
  belowThreshold8Count: number;
  belowThreshold8Pct: number;
  dropFromOverall: number | null;
}

export interface WeekdayPatternResult {
  hasPattern: boolean;
  detectedWeekdayIndex: number | null;
  overallMean: number;
  weekdayMean: number | null;
  dropFromOverall: number | null;
  observationCount: number;
  qualifyingWeeks: number;
  belowThresholdCount: number;
  percentageBelowBaseline: number;
  prevNightAvgSleepHours: number | null;
  otherNightsAvgSleepHours: number | null;
  sleepDifferenceHours: number | null;
  supportingEvidence: {
    totalRecords: number;
    minEnergy: number;
    maxEnergy: number;
    overallAvgSleepHours: number | null;
    recent7DayMean: number;
    belowBaselineCount: number;
    belowBaselinePct: number;
  };
}

export type ForecastConfidence = 'Moderate' | 'Low' | 'Insufficient Data';

export interface HistoricalEnergyPoint {
  dateISO: string;
  year: number;
  monthIndex: number;
  dayOfMonth: number;
  weekdayIndex: number;
  isThursday: boolean;
  energy: number;
  prevNightSleepHours: number | null;
}

export interface ForecastDay {
  dateISO: string;
  year: number;
  monthIndex: number;
  dayOfMonth: number;
  weekdayIndex: number;
  estimatedEnergy: number | null;
  confidence: ForecastConfidence;
  isHighlighted?: boolean;
  supportingEvidence: {
    weekdayObservationCount: number;
    qualifyingWeeks: number;
    weekdayMean: number | null;
    recent7DayMean: number;
    overallMean: number;
  };
}

export interface PresentationPartnerAnalytics {
  recordCount: number;
  overallMean: number;
  recent7DayMean: number;
  overallAvgSleepHours: number | null;
  minEnergy: number;
  maxEnergy: number;
  belowBaselineCount: number;
  belowBaselinePct: number;
  weekdayStats: WeekdayAnalyticsItem[];
  pattern: WeekdayPatternResult;
  forecast7Days: ForecastDay[];
}

export interface CareSuggestion {
  id: string;
  recipient: PartnerId;
  category: 'warmth' | 'calm' | 'message';
  requiresSpendingMoney?: boolean;
}

export type NotificationKind = 'care_message' | 'status_update' | 'surprise_care';

export type NotificationImportance = 'ordinary' | 'important';

export interface CareNotification {
  id: string;
  kind?: NotificationKind;
  sender: PartnerId;
  recipient: PartnerId;
  suggestionId: string;
  surpriseCareId?: string;
  mockOrderId?: string;
  productImageKey?: MockProductImageKey;
  suggestionTitle?: string;
  suggestionDefaultMessage?: string;
  customMessage?: string;
  recommendationMetadata?: AiCareRecommendationMetadata;
  feedbackSubmitted?: RecipientFeedbackType;
  statusSnapshot?: PartnerStatusSnapshot;
  importance?: NotificationImportance;
  suppressedByQuietHours?: boolean;
  suppressedReason?: 'quiet_hours' | 'frequency_filter' | 'status_disabled' | null;
  timeLabel: string;
  dateISO?: string;
  isToday: boolean;
  status: NotificationStatus;
}

export interface CareActivityItem {
  id: string;
  kind:
    | 'sent_care'
    | 'saved_care'
    | 'completed_care'
    | 'confirmed_status'
    | 'weekly_recharge'
    | 'date_invite'
    | 'date_agreed'
    | 'surprise_scheduled'
    | 'surprise_sent'
    | 'surprise_revealed'
    | 'surprise_completed'
    | 'order_placed_revealed'
    | 'order_secret_prepared'
    | 'order_progress'
    | 'order_delivered'
    | 'seed_supportive'
    | 'seed_saved_evening';
  actor: PartnerId;
  target?: PartnerId;
  suggestionId?: string;
  suggestionTitle?: string;
  mockOrderId?: string;
  revealMode?: SurpriseCareDeliveryMode;
  timeLabel: string;
  dayKind: 'today' | 'yesterday';
}

export type WeeklyRechargeSupportChoice =
  | 'emotional_support'
  | 'practical_help'
  | 'rest_recovery'
  | 'quality_time';

export type WeeklyRechargeNextWeekWish =
  | 'more_quiet_time'
  | 'more_light_help'
  | 'more_gentle_checkins'
  | 'more_shared_outings';

export interface WeeklyRechargeEntry {
  partnerId: string;
  weekKey: string;
  status: 'completed' | 'skipped';
  supportChoice: WeeklyRechargeSupportChoice | null;
  nextWeekWish: WeeklyRechargeNextWeekWish | null;
  optionalComment?: string;
  shareWithPartner: boolean;
  submittedAtISO: string;
  updatedAtISO: string;
}

export interface CareMomentRecord {
  id: string;
  sourceNotificationId: string;
  dateTimeISO: string;
  timeLabel: string;
  dateISO: string;
  careActionTitle: string;
  sender: PartnerId;
  recipient: PartnerId;
  status: 'Completed';
  optionalNote?: string;
  noteAuthor?: PartnerId;
  sharedVisibility: boolean;
  isSurprise?: boolean;
  surpriseCareId?: string;
  surpriseCategory?: SurpriseCareCategory;
}

export type NotificationFrequencyPreference = 'low' | 'standard' | 'important_only';
export type SensitivePreviewMode = 'full' | 'neutral';

export interface NotificationPreferences {
  quietHoursEnabled: boolean;
  quietStartTime: string; // HH:MM (24h)
  quietEndTime: string; // HH:MM (24h)
  allowImportantDuringQuietHours: boolean;
  frequency: NotificationFrequencyPreference;
  shareStatusNotifications: boolean;
  sensitivePreview: SensitivePreviewMode;
}

export type DatePlanCategory =
  | 'Outdoor Activities'
  | 'Movie Nights'
  | 'Restaurant Dates'
  | 'Weekend Trips'
  | 'Shared Hobbies'
  | 'Relaxing Time at Home';

export type DatePlanInviteStatus = 'none' | 'invited' | 'accepted' | 'declined' | 'agreed';

export interface DatePlanSuggestion {
  id: string;
  category: DatePlanCategory;
  titleKey: string;
  suggestedSlot: string;
  suggestedTimeISO: string;
  energyFit: 'low_pressure' | 'balanced' | 'active';
  estimatedBudget: 'free_or_low' | 'moderate';
  availabilityNote: string;
}

export interface DatePlanInteraction {
  planId: string;
  reactionByPartner: Partial<Record<PartnerId, 'like' | 'skip'>>;
  invitedBy?: PartnerId;
  invitee?: PartnerId;
  status: DatePlanInviteStatus;
  updatedAtISO: string;
  updatedTimeLabel: string;
}

export type HealthPlatformName = 'Apple Health' | 'Health Connect';

export interface HealthSyncState {
  connected: boolean;
  platform: HealthPlatformName | null;
  permissionGranted: boolean;
  lastSyncISO: string | null;
  lastSyncLabel: string | null;
  availableCategories: Array<'sleep' | 'heartRate' | 'hrv' | 'activity' | 'cycle'>;
  isSimulated: boolean;
}

export type CoupleMembershipTier = 'free' | 'premium';
export type CoupleBillingPlan = 'monthly' | 'yearly';

export interface CoupleMembershipState {
  tier: CoupleMembershipTier;
  plan: CoupleBillingPlan;
  startDateISO: string | null;
  purchasedBy: PartnerId | null;
  isSimulated: boolean;
}

export type WidgetPreviewStyle =
  | 'shared_energy'
  | 'care_reminder'
  | 'daily_goal'
  | 'date_countdown';

export interface PreferenceTagItem {
  id: string;
  presetKey?: string;
  customLabel?: string;
}

export interface PartnerProfileData {
  id: PartnerId;
  name: string;
  avatarUrl: string;
  latestEnergy: number;
  todaySummary: {
    sleepDurationHours: number;
    sleepQualityScore: number;
    activityMinutes: number;
  };
  insights: {
    hasPattern: boolean;
    detectedWeekdayIndex: number | null;
    overallAvgEnergy: number;
    recent7DayMean: number;
    thursdayAvgEnergy?: number;
    thursdayObservations?: number;
    prevDayAvgSleepHours?: number;
    analytics: PresentationPartnerAnalytics;
    historical60Days: HistoricalEnergyPoint[];
    forecast7Days: ForecastDay[];
    multiDimensional?: MultiDimensionalPartnerSummary;
  };
}

export interface PresentationBundle {
  dateRange: DatasetDateRange;
  disclaimer: string;
  partnerMeta: Record<PartnerId, PartnerProfile>;
  partnerProfiles: Record<PartnerId, PartnerProfileData>;
  summaries: Record<PartnerId, EnergyIndexSummary>;
  latestRecords: Record<PartnerId, EnergyRecord>;
  historicalPoints: Record<PartnerId, HistoricalEnergyPoint[]>;
  multiDimensionalSummaries?: Record<PartnerId, MultiDimensionalPartnerSummary>;
  partnerCarePrefs: Record<PartnerId, PartnerCarePreferences>;
}

export interface PresentationInteractionsState {
  dailyCheckIns: Record<PartnerId, DailyCheckInState>;
  partnerStatusUpdates: Record<PartnerId, PartnerStatusSnapshot | null>;
  sharingPrefs: Record<PartnerId, SharingPreferences>;
  healthSyncState: Record<PartnerId, HealthSyncState>;
  notificationPrefs: Record<PartnerId, NotificationPreferences>;
  weeklyRecharge: Record<PartnerId, WeeklyRechargeEntry | null>;
  careMoments: CareMomentRecord[];
  datePlanInteractions: Record<string, DatePlanInteraction>;
  skippedSuggestionIds: Record<PartnerId, string[]>;
  membership: CoupleMembershipState;
  widgetPreviewStyle: Record<PartnerId, WidgetPreviewStyle>;
  carePreferences: Record<PartnerId, PreferenceTagItem[]>;
  savedSuggestionIds: Record<PartnerId, string[]>;
  savedAiSuggestions: Record<PartnerId, AiCareSavedItem[]>;
  aiFeedback: Record<PartnerId, AiCareFeedbackState>;
  feedbackEvents: Record<PartnerId, CareFeedbackEvent[]>;
  recentSuggestionHistory: Record<PartnerId, RecentSuggestionRecord[]>;
  notifications: CareNotification[];
  surpriseCareRecords?: SurpriseCareRecord[];
  mockOrders?: MockOrderRecord[];
  careReminders?: CareReminderRecord[];
  dismissedRecommendationIds?: Record<PartnerId, string[]>;
  careActivity: CareActivityItem[];
  premiumDemoConfirmed: boolean;
  aiCareUsage?: {
    monthKey: string;
    count: number;
  };
}

export type AppEntryMode = 'welcome' | 'onboarding' | 'normal' | 'presentation';

export type OnboardingAvatarId =
  | 'coral-glow'
  | 'lavender-mist'
  | 'sage-calm'
  | 'warm-amber'
  | 'photo-a'
  | 'photo-b';

export type PreferredCareTagKey =
  | 'warm_drinks'
  | 'gentle_messages'
  | 'quiet_time'
  | 'light_meals'
  | 'relaxing_walks'
  | 'small_surprises';

export type AvoidTagKey =
  | 'crowded_places'
  | 'surprise_visits'
  | 'frequent_messages'
  | 'last_minute_plans';

export type CommunicationStyleKey =
  | 'gentle_supportive'
  | 'short_direct'
  | 'playful_cheerful';

export type NormalPairingMethod = 'create' | 'join' | 'later';
export type NormalPairingStatus = 'unpaired' | 'paired_simulated';
export type NormalBaselineStatus = 'building' | 'preliminary';

export interface OnboardingDraft {
  nickname: string;
  avatarId: OnboardingAvatarId;
  pairingMethod: NormalPairingMethod;
  inviteCode: string;
  joinCodeInput: string;
  pairingStatus: NormalPairingStatus;
  sharingConsent: SharingPreferences;
  preferredCare: PreferredCareTagKey[];
  avoidTags: AvoidTagKey[];
  communicationStyle: CommunicationStyleKey | null;
}

export interface NormalUserProfile {
  completed: boolean;
  completedAtISO: string | null;
  nickname: string;
  avatarId: OnboardingAvatarId;
  baselineStartDate: string;
  baselineStatus: NormalBaselineStatus;
  validCheckInDays: number;
  sharingConsent: SharingPreferences;
  premiumDemoConfirmed: boolean;
}

export interface NormalDailyRecord {
  date: string; // YYYY-MM-DD local calendar date
  weekdayIndex: number; // 0 (Sun) - 6 (Sat)
  weekKey: string; // YYYY-Www (Monday-based local week)
  checkInStatus: CheckInOption;
  selfReportedScore1To5: number;
  updatedAtTime: string;
  updatedAtISO: string;
  confirmedAtISO?: string;
  confirmationCount?: number;
}

export interface NormalPairingState {
  status: NormalPairingStatus;
  method: NormalPairingMethod;
  inviteCode: string;
  partnerHasRecords: boolean;
}

export interface NormalPreferencesState {
  preferredCare: PreferredCareTagKey[];
  avoidTags: AvoidTagKey[];
  communicationStyle: CommunicationStyleKey | null;
  customTags: PreferenceTagItem[];
}

export interface NormalCareNotification {
  id: string;
  direction: 'outgoing';
  kind?: NotificationKind;
  suggestionId: string;
  surpriseCareId?: string;
  mockOrderId?: string;
  productImageKey?: MockProductImageKey;
  suggestionTitle?: string;
  suggestionDefaultMessage?: string;
  customMessage?: string;
  dateISO: string;
  timeLabel: string;
  status: NotificationStatus;
}

export interface NormalCareActivityItem {
  id: string;
  kind:
    | 'sent_care'
    | 'saved_care'
    | 'surprise_scheduled'
    | 'surprise_sent'
    | 'surprise_completed'
    | 'order_placed_revealed'
    | 'order_secret_prepared'
    | 'order_progress'
    | 'order_delivered';
  suggestionId: string;
  suggestionTitle?: string;
  mockOrderId?: string;
  dateISO: string;
  timeLabel: string;
}

export interface NormalInteractionsState {
  savedSuggestionIds: string[];
  savedAiSuggestions: AiCareSavedItem[];
  aiFeedback: AiCareFeedbackState;
  feedbackEvents?: CareFeedbackEvent[];
  recentSuggestionHistory?: RecentSuggestionRecord[];
  skippedSuggestionIds?: string[];
  weeklyRecharge?: WeeklyRechargeEntry | null;
  notificationPrefs?: NotificationPreferences;
  draftCheckInStatus?: CheckInOption | null;
  draftCheckInDateISO?: string | null;
  confirmedStatusSnapshot?: PartnerStatusSnapshot | null;
  notifications: NormalCareNotification[];
  surpriseCareRecords?: SurpriseCareRecord[];
  mockOrders?: MockOrderRecord[];
  careReminders?: CareReminderRecord[];
  dismissedRecommendationIds?: string[];
  careActivity: NormalCareActivityItem[];
  aiCareUsage?: {
    monthKey: string;
    count: number;
  };
}

export interface NormalCareSuggestion {
  id: string;
  category: 'warmth' | 'calm' | 'message';
  matchedPreferenceKey?: PreferredCareTagKey;
  excludedByAvoidKeys?: AvoidTagKey[];
}

export interface NormalEarlyInsightSummary {
  averageScore1To5: number;
  minScore1To5: number;
  maxScore1To5: number;
  variationKind: 'steady' | 'fluctuating' | 'low_reserve';
  transitionsCount: number;
  dominantStatus: CheckInOption;
}

export interface NormalWeekdayPatternSummary {
  hasEnoughWeekdayRepeats: boolean;
  maxDistinctWeeksObserved: number;
  requiredDistinctWeeks: number;
  preliminaryLowWeekdayIndex: number | null;
  preliminaryLowWeekdayMean: number | null;
  preliminaryLowWeekdayWeeks: number;
}

export interface NormalBaselineAnalysis {
  todayDateISO: string;
  currentDayNumber: number;
  recordedDaysCount: number;
  progressTargetDays: number;
  phase: NormalBaselineStatus;
  todayRecord: NormalDailyRecord | undefined;
  sortedRecords: NormalDailyRecord[];
  earlyInsight: NormalEarlyInsightSummary | null;
  weekdayPattern: NormalWeekdayPatternSummary;
  canShowFutureForecast: boolean;
}
