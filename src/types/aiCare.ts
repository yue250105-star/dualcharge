import type { CheckInOption, ForecastConfidence, LanguageCode } from './dualcharge.ts';

export type AiCareCategory =
  | 'Emotional Support'
  | 'Practical Help'
  | 'Rest & Recovery'
  | 'Small Surprise'
  | 'Quality Time';

export type AiCareConfidence = 'Moderate' | 'Low' | 'Preference-Based';

export type AiCareCommunicationStyle =
  | 'Short Text'
  | 'Voice Message'
  | 'Practical Action'
  | 'Shared Activity'
  | 'Surprise';

export type AiCareEffortLevel = 'Low' | 'Medium' | 'High';

export type RecipientFeedbackType =
  | 'helpful'
  | 'more_like_this'
  | 'not_relevant'
  | 'not_helpful'
  | 'not_suitable';

export type SenderActionType = 'sent' | 'saved' | 'skipped';

export type LearningMaturityLevel = 'Initial' | 'Developing' | 'Established';

export interface AiCareRecommendationMetadata {
  category: AiCareCategory;
  actionType: string;
  communicationStyle: AiCareCommunicationStyle;
  suggestedTiming: string;
  effortLevel: AiCareEffortLevel;
  requiresSpendingMoney: boolean;
  tags: string[];
  fingerprint: string;
}

export type AiCareTimeHorizon = 'now' | 'ahead';

export interface AiCareRecommendation {
  id: string;
  title: string;
  category: AiCareCategory;
  why: string;
  action: string;
  suggestedTiming: string;
  personalizationReason: string;
  confidence: AiCareConfidence;
  defaultMessage: string;
  timeHorizon?: AiCareTimeHorizon;
  evidenceSummary?: string;
  evidenceDetails?: string[];
  targetWeekdayIndex?: number;
  targetDateISO?: string;
  suggestedDatePlanId?: string;
  actionType?: string;
  communicationStyle?: AiCareCommunicationStyle;
  effortLevel?: AiCareEffortLevel;
  requiresSpendingMoney?: boolean;
  tags?: string[];
  fingerprint?: string;
}

export interface AiCareResponse {
  summary: string;
  recipientName: string;
  evidence: string[];
  recommendations: AiCareRecommendation[];
  planAheadSummary?: string;
  planAheadRecommendations?: AiCareRecommendation[];
  limitations: string;
}

export type AiCareFallbackReason =
  | 'missing_api_key'
  | 'api_error'
  | 'network_error'
  | 'timeout'
  | 'invalid_response';

export interface AiCareGenerationResult {
  source: 'gemini' | 'fallback';
  model?: string;
  fallbackReason?: AiCareFallbackReason;
  errorMessage?: string;
  generatedAtISO: string;
  data: AiCareResponse;
}

export interface AiCareFeedbackEntry {
  id: string;
  title: string;
  category: AiCareCategory;
  timestampISO: string;
}

export interface AiCareFeedbackState {
  notRelevantItems: AiCareFeedbackEntry[];
  moreLikeThisItems: AiCareFeedbackEntry[];
  preferredCategories: AiCareCategory[];
  deprioritizedCategories: AiCareCategory[];
}

export interface CareFeedbackEvent {
  eventId: string;
  actor: string;
  recipient: string;
  suggestionId: string;
  suggestionTitle: string;
  fingerprint: string;
  feedbackType: RecipientFeedbackType;
  timestampISO: string;
  metadata: AiCareRecommendationMetadata;
  surpriseCareId?: string;
}

export type SurpriseCareCategory =
  | 'personal_touch'
  | 'thoughtful_gesture'
  | 'shared_moments';

export type SurpriseCareDeliveryMode = 'tell_now' | 'keep_surprise';

export type SurpriseCareStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Sent'
  | 'Revealed'
  | 'Completed'
  | 'Cancelled';

export type SurpriseCareNoteStyle =
  | 'standard'
  | 'handwritten_note'
  | 'voice_placeholder';

export type SurpriseCareVisibility = 'shared' | 'private';

export interface SurpriseCareRecord {
  id: string;
  senderId: string;
  recipientId: string;
  sourceRecommendationId: string;
  recommendationMetadata?: AiCareRecommendationMetadata;
  careCategory: SurpriseCareCategory;
  noteStyle?: SurpriseCareNoteStyle;
  title: string;
  actionDescription: string;
  content: string;
  deliveryMode: SurpriseCareDeliveryMode;
  createdAt: string;
  updatedAt?: string;
  revealAt: string | null;
  revealedAt: string | null;
  completedAt: string | null;
  status: SurpriseCareStatus;
  recipientFeedback?: RecipientFeedbackType;
  recipientFeedbackAt?: string | null;
  relatedDatePlanId?: string;
  visibility: SurpriseCareVisibility;
  notificationId?: string;
  orderId?: string;
  sourceActionMode?: 'in_app' | 'mock_order';
  sourceWhy?: string;
  sourceSuggestedTiming?: string;
  revealPresetKey?: 'this_evening' | 'tomorrow_morning' | 'next_pattern_window' | 'demo_quick' | 'custom';
}

export type MockOrderStatus =
  | 'Order Confirmed'
  | 'Preparing'
  | 'Picked Up'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type MockProductImageKey =
  | 'hot_latte'
  | 'dessert_pastry'
  | 'fresh_flowers'
  | 'cozy_gift';

export interface MockProductCatalogItem {
  id: string;
  imageKey: MockProductImageKey;
  actionTypes: string[];
  keywords: string[];
  merchantName: Record<LanguageCode, string>;
  title: Record<LanguageCode, string>;
  subtitle: Record<LanguageCode, string>;
  variants: Record<LanguageCode, string[]>;
  unitPrice: number;
  deliveryFee: number;
  currencySymbol: string;
  estimatedEtaMinutes: [number, number];
}

export interface MockOrderRecord {
  id: string;
  orderNumber: string;
  senderId: string;
  recipientId: string;
  recipientName: string;
  sourceRecommendationId: string;
  recommendationMetadata?: AiCareRecommendationMetadata;
  productId: string;
  productImageKey: MockProductImageKey;
  productTitle: string;
  merchantName: string;
  selectedVariant: string;
  quantity: number;
  unitPrice: number;
  deliveryFee: number;
  totalAmount: number;
  currencySymbol: string;
  deliveryAddress: string;
  careMessage: string;
  platformNotes?: string;
  estimatedArrivalLabel: string;
  status: MockOrderStatus;
  revealMode: SurpriseCareDeliveryMode;
  surpriseCareId?: string;
  notificationId?: string;
  createdAtISO: string;
  updatedAtISO: string;
  deliveredAtISO?: string | null;
  isSimulated: true;
}

export type CareReminderPresetKey =
  | 'in_1_hour'
  | 'later_today'
  | 'tomorrow'
  | 'custom';

export interface CareReminderRecord {
  id: string;
  ownerId: string;
  recommendation: AiCareRecommendation;
  presetKey: CareReminderPresetKey;
  remindAtISO: string;
  createdAtISO: string;
  status: 'scheduled' | 'dismissed' | 'acted';
}

export interface PreferenceScoreChangeRecord {
  eventId: string;
  timestampISO: string;
  feedbackType: RecipientFeedbackType;
  suggestionId: string;
  fingerprint: string;
  targetType:
    | 'fingerprint'
    | 'actionType'
    | 'communicationStyle'
    | 'effortLevel'
    | 'timing'
    | 'lowCost'
    | 'tag'
    | 'category';
  targetKey: string;
  delta: number;
  previousScore: number;
  newScore: number;
  note: string;
}

export interface LearnedPreferenceProfile {
  recipientId: string;
  preferredCategories: AiCareCategory[];
  preferredCommunicationStyles: AiCareCommunicationStyle[];
  preferredActionTypes: string[];
  preferredTimings: string[];
  preferredEffortLevels: AiCareEffortLevel[];
  prefersFreeOrLowCost: boolean;
  negativelyRatedAttributes: {
    categories: AiCareCategory[];
    actionTypes: string[];
    communicationStyles: AiCareCommunicationStyle[];
    tags: string[];
    fingerprints: string[];
    avoidPaidSuggestions: boolean;
  };
  categoryScores: Partial<Record<AiCareCategory, number>>;
  communicationStyleScores: Partial<Record<AiCareCommunicationStyle, number>>;
  actionTypeScores: Record<string, number>;
  effortLevelScores: Partial<Record<AiCareEffortLevel, number>>;
  timingScores: Record<string, number>;
  fingerprintScores: Record<string, number>;
  tagScores: Record<string, number>;
  lowCostScore: number;
  totalFeedbackCount: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  learningMaturity: LearningMaturityLevel;
  lastUpdatedISO: string | null;
  auditLog: PreferenceScoreChangeRecord[];
}

export interface RecentSuggestionRecord {
  id: string;
  title: string;
  category: AiCareCategory;
  actionType: string;
  communicationStyle: AiCareCommunicationStyle;
  fingerprint: string;
  generatedAtISO: string;
}

export interface AiCareSavedItem {
  id: string;
  title: string;
  category: AiCareCategory;
  action: string;
  suggestedTiming: string;
  defaultMessage: string;
  why: string;
  personalizationReason: string;
  confidence: AiCareConfidence;
  source: 'gemini' | 'fallback' | 'preset';
  savedAtISO: string;
  ownerId?: string;
  metadata?: AiCareRecommendationMetadata;
}

export interface CompactLearnedProfileForPrompt {
  learningMaturity: LearningMaturityLevel;
  totalFeedbackCount: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  preferredCategories: AiCareCategory[];
  preferredCommunicationStyles: AiCareCommunicationStyle[];
  preferredActionTypes: string[];
  preferredTimings: string[];
  preferredEffortLevels: AiCareEffortLevel[];
  prefersFreeOrLowCost: boolean;
  negativelyRatedAttributes: {
    categories: AiCareCategory[];
    actionTypes: string[];
    communicationStyles: AiCareCommunicationStyle[];
    tags: string[];
    fingerprints: string[];
    avoidPaidSuggestions: boolean;
  };
}

export interface AiCareRequestContext {
  mode: 'presentation' | 'normal';
  language: LanguageCode;
  recipient: {
    name: string;
    energyShared: boolean;
    sleepShared: boolean;
    heartRateShared?: boolean;
    hrvShared?: boolean;
    activityShared: boolean;
    cycleShared?: boolean;
    insufficientHistoricalData: boolean;
    canShowFutureForecast?: boolean;
    baselinePhase?: 'building' | 'preliminary';
    recordedDaysCount: number;
    currentEnergyIndex?: number;
    recentEnergyRecords?: Array<{
      date: string;
      weekdayIndex: number;
      energy?: number;
      selfReportedScore1To5?: number;
    }>;
    personalBaseline?: {
      overallMean?: number;
      recent7DayMean?: number;
      avgSelfReported1To5?: number;
    };
    weekdayPattern?: {
      hasPattern: boolean;
      detectedWeekdayIndex: number | null;
      weekdayMean: number | null;
      dropFromOverall?: number | null;
      observationCount: number;
      qualifyingWeeks: number;
      percentageBelowBaseline?: number;
    };
    upcomingForecast?: Array<{
      dateISO: string;
      weekdayIndex: number;
      estimatedEnergy: number | null;
      confidence: ForecastConfidence;
    }>;
    predictionConfidence?: ForecastConfidence | null;
    sleepSummary?: {
      latestSleepHours?: number;
      latestSleepQuality?: number;
      overallAvgSleepHours?: number | null;
      patternPrevNightAvgSleepHours?: number | null;
      avgDeepMinutes?: number | null;
      avgRemMinutes?: number | null;
      avgLightMinutes?: number | null;
      avgAwakeMinutes?: number | null;
    };
    rhrSummary?: {
      latestBpm: number | null;
      personalBaselineBpm: number | null;
      deviationBpm: number | null;
      recent7DayMeanBpm: number | null;
    };
    hrvSummary?: {
      metricType: 'SDNN' | 'RMSSD';
      latestMs: number | null;
      personalBaselineMs: number | null;
      deviationMs: number | null;
      recent7DayMeanMs: number | null;
    };
    activitySummary?: {
      latestActivityMinutes?: number;
      latestSteps?: number | null;
      avgSteps7d?: number | null;
      latestIntensity?: 'Low' | 'Moderate' | 'Vigorous' | null;
    };
    cycleSummary?: {
      recordedCycleDay: number | null;
      recordedCyclePhase: string | null;
      isEstimated: boolean;
    } | null;
    sharedWeeklyRecharge?: {
      supportChoice: string;
      nextWeekWish: string;
      optionalComment?: string;
      weekKey: string;
    } | null;
    dailyCheckInStatus?: CheckInOption | null;
    statusConfirmedAtTime?: string | null;
    isStatusConfirmedToday?: boolean;
    carePreferences: string[];
    foodPreferences: string[];
    avoidTags: string[];
    communicationStyle: string | null;
  };
  partner: {
    name: string;
    pairingStatus: 'paired_demo' | 'paired_simulated' | 'unpaired';
    preferredWaysOfShowingCare: string[];
    savedCareTitles: string[];
    completedCareTitles: string[];
    skippedSuggestionIds?: string[];
    feedback: {
      notRelevantTitles: string[];
      moreLikeThisTitles: string[];
      preferredCategories: AiCareCategory[];
      deprioritizedCategories: AiCareCategory[];
    };
  };
  learnedProfile?: CompactLearnedProfileForPrompt;
  recentSuggestions?: Array<{
    title: string;
    category: AiCareCategory;
    actionType: string;
    fingerprint: string;
  }>;
}
