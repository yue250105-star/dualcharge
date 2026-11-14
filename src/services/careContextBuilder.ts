import type {
  AiCareFeedbackState,
  AiCareRequestContext,
  CareFeedbackEvent,
  RecentSuggestionRecord,
} from '../types/aiCare.ts';
import type {
  CareMomentRecord,
  CareNotification,
  CheckInOption,
  LanguageCode,
  NormalBaselineAnalysis,
  NormalInteractionsState,
  NormalPairingState,
  NormalPreferencesState,
  NormalUserProfile,
  PartnerId,
  PartnerStatusSnapshot,
  PreferenceTagItem,
  PresentationBundle,
  SharingPreferences,
  WeeklyRechargeEntry,
} from '../types/dualcharge.ts';
import {
  deriveLearnedPreferenceProfile,
  summarizeProfileForGemini,
} from './preferenceLearningEngine.ts';
import { RECENT_HISTORY_LIMIT } from './recommendationDiversity.ts';

export function createEmptyFeedbackState(): AiCareFeedbackState {
  return {
    notRelevantItems: [],
    moreLikeThisItems: [],
    preferredCategories: [],
    deprioritizedCategories: [],
  };
}

export interface BuildPresentationCareContextInput {
  bundle: PresentationBundle;
  senderId: PartnerId;
  recipientId: PartnerId;
  language: LanguageCode;
  sharingPrefs: Record<PartnerId, SharingPreferences>;
  dailyCheckInStatus: CheckInOption | null;
  partnerStatusUpdate?: PartnerStatusSnapshot | null;
  recipientCareTags: PreferenceTagItem[];
  presetTagLabels: Record<string, string>;
  savedSuggestionIds: string[];
  savedAiSuggestions: Array<{ id: string; title: string; category: string }>;
  notifications: CareNotification[];
  careMoments?: CareMomentRecord[];
  recipientWeeklyRecharge?: WeeklyRechargeEntry | null;
  skippedSuggestionIds?: string[];
  suggestionTitleLookup: Record<string, string>;
  feedback: AiCareFeedbackState;
  recipientFeedbackEvents?: CareFeedbackEvent[];
  recentSuggestionHistory?: RecentSuggestionRecord[];
}

export function buildPresentationCareContext(
  input: BuildPresentationCareContextInput
): AiCareRequestContext {
  const {
    bundle,
    senderId,
    recipientId,
    language,
    sharingPrefs,
    dailyCheckInStatus,
    partnerStatusUpdate,
    recipientCareTags,
    presetTagLabels,
    savedSuggestionIds,
    savedAiSuggestions,
    notifications,
    careMoments = [],
    recipientWeeklyRecharge = null,
    skippedSuggestionIds = [],
    suggestionTitleLookup,
    feedback,
    recipientFeedbackEvents = [],
    recentSuggestionHistory = [],
  } = input;

  const recipientMeta = bundle.partnerMeta[recipientId];
  const senderMeta = bundle.partnerMeta[senderId];
  const recipientProfile = bundle.partnerProfiles[recipientId];
  const latestRecord = bundle.latestRecords[recipientId];
  const analytics = recipientProfile.insights.analytics;
  const multiDim =
    recipientProfile.insights.multiDimensional ??
    bundle.multiDimensionalSummaries?.[recipientId];
  const recipientSharing = sharingPrefs[recipientId];

  const heartRateShared = Boolean(recipientSharing.heartRate);
  const hrvShared = Boolean(recipientSharing.hrv);
  const cycleShared = Boolean(recipientSharing.cycleTrackingEnabled && recipientSharing.cycle);

  const resolvedTags = recipientCareTags
    .map((tag) =>
      tag.presetKey ? presetTagLabels[tag.presetKey] ?? tag.presetKey : tag.customLabel ?? ''
    )
    .map((s) => s.trim())
    .filter(Boolean);

  const mergedPreferences = Array.from(
    new Set([...resolvedTags, ...recipientMeta.care_preferences.preferred_care])
  );

  const savedCareTitles = Array.from(
    new Set([
      ...savedSuggestionIds.map((id) => suggestionTitleLookup[id]).filter(Boolean),
      ...savedAiSuggestions.map((s) => s.title).filter(Boolean),
    ])
  );

  const completedCareTitles = Array.from(
    new Set([
      ...notifications
        .filter((n) => n.sender === senderId && n.status === 'Completed')
        .map((n) => n.suggestionTitle || suggestionTitleLookup[n.suggestionId] || '')
        .filter(Boolean),
      ...careMoments
        .filter((m) => m.sender === senderId && m.status === 'Completed')
        .map((m) => m.careActionTitle)
        .filter(Boolean),
    ])
  );

  const recentRecords = recipientSharing.energy
    ? bundle.historicalPoints[recipientId].slice(-7).map((pt) => ({
        date: pt.dateISO,
        weekdayIndex: pt.weekdayIndex,
        energy: pt.energy,
      }))
    : undefined;

  // Derive adaptive preference profile strictly from the recipient's explicit feedback events.
  // Sender workflow actions (save, send, complete, skip) never alter the recipient's learned profile.
  const learnedProfile = deriveLearnedPreferenceProfile(recipientId, recipientFeedbackEvents, {
    preferredCareLabels: mergedPreferences,
    avoidLabels: recipientMeta.care_preferences.avoid,
    communicationStyleLabel: recipientMeta.care_preferences.communication_style,
  });

  const compactLearned = summarizeProfileForGemini(learnedProfile);

  // Only expose confirmed daily status when energy-summary sharing is active
  const authorizedDailyCheckIn = recipientSharing.energy
    ? partnerStatusUpdate?.checkInStatus ?? dailyCheckInStatus
    : null;
  const statusConfirmedAtTime =
    recipientSharing.energy && partnerStatusUpdate ? partnerStatusUpdate.updatedAtTime : null;
  const isStatusConfirmedToday = Boolean(recipientSharing.energy && partnerStatusUpdate);

  const highlightedForecast = recipientSharing.energy
    ? analytics.forecast7Days.find((d) => d.isHighlighted) ?? analytics.forecast7Days[0]
    : undefined;

  const mergedNotRelevantTitles = Array.from(
    new Set([
      ...feedback.notRelevantItems.map((i) => i.title),
      ...learnedProfile.negativelyRatedAttributes.fingerprints,
    ])
  );

  const sharedWeeklyRecharge =
    recipientWeeklyRecharge &&
    recipientWeeklyRecharge.status === 'completed' &&
    recipientWeeklyRecharge.shareWithPartner &&
    recipientWeeklyRecharge.supportChoice &&
    recipientWeeklyRecharge.nextWeekWish
      ? {
          supportChoice: recipientWeeklyRecharge.supportChoice,
          nextWeekWish: recipientWeeklyRecharge.nextWeekWish,
          ...(recipientWeeklyRecharge.optionalComment
            ? { optionalComment: recipientWeeklyRecharge.optionalComment }
            : {}),
          weekKey: recipientWeeklyRecharge.weekKey,
        }
      : null;

  return {
    mode: 'presentation',
    language,
    recipient: {
      name: recipientMeta.display_name,
      energyShared: recipientSharing.energy,
      sleepShared: recipientSharing.sleep,
      heartRateShared,
      hrvShared,
      activityShared: recipientSharing.activity,
      cycleShared,
      insufficientHistoricalData: !recipientSharing.energy || analytics.recordCount < 7,
      canShowFutureForecast: Boolean(recipientSharing.energy && analytics.recordCount >= 7),
      recordedDaysCount: recipientSharing.energy ? analytics.recordCount : 0,
      ...(recipientSharing.energy
        ? {
            currentEnergyIndex: latestRecord.estimated_energy_index_0_to_100,
            recentEnergyRecords: recentRecords,
            personalBaseline: {
              overallMean: analytics.overallMean,
              recent7DayMean: analytics.recent7DayMean,
            },
            weekdayPattern: {
              hasPattern: analytics.pattern.hasPattern,
              detectedWeekdayIndex: analytics.pattern.detectedWeekdayIndex,
              weekdayMean: analytics.pattern.weekdayMean,
              dropFromOverall: analytics.pattern.dropFromOverall,
              observationCount: analytics.pattern.observationCount,
              qualifyingWeeks: analytics.pattern.qualifyingWeeks,
              percentageBelowBaseline: analytics.pattern.percentageBelowBaseline,
            },
            upcomingForecast: analytics.forecast7Days.map((day) => ({
              dateISO: day.dateISO,
              weekdayIndex: day.weekdayIndex,
              estimatedEnergy: day.estimatedEnergy,
              confidence: day.confidence,
            })),
            predictionConfidence: highlightedForecast?.confidence ?? null,
          }
        : {}),
      ...(recipientSharing.sleep
        ? {
            sleepSummary: {
              latestSleepHours: latestRecord.sleep_hours,
              latestSleepQuality: latestRecord.sleep_quality_1_to_5,
              overallAvgSleepHours: analytics.overallAvgSleepHours,
              patternPrevNightAvgSleepHours: analytics.pattern.prevNightAvgSleepHours,
              ...(multiDim
                ? {
                    avgDeepMinutes: multiDim.avgDeepMinutes,
                    avgRemMinutes: multiDim.avgRemMinutes,
                    avgLightMinutes: multiDim.avgLightMinutes,
                    avgAwakeMinutes: multiDim.avgAwakeMinutes,
                  }
                : {}),
            },
          }
        : {}),
      ...(heartRateShared && multiDim
        ? {
            rhrSummary: {
              latestBpm: multiDim.rhrLatestBpm,
              personalBaselineBpm: multiDim.rhrBaselineBpm,
              deviationBpm: multiDim.rhrLatestDeviationBpm,
              recent7DayMeanBpm: multiDim.rhrRecent7MeanBpm,
            },
          }
        : {}),
      ...(hrvShared && multiDim
        ? {
            hrvSummary: {
              metricType: multiDim.hrvMetricType,
              latestMs: multiDim.hrvLatestMs,
              personalBaselineMs: multiDim.hrvBaselineMs,
              deviationMs: multiDim.hrvLatestDeviationMs,
              recent7DayMeanMs: multiDim.hrvRecent7MeanMs,
            },
          }
        : {}),
      ...(recipientSharing.activity
        ? {
            activitySummary: {
              latestActivityMinutes: latestRecord.activity_minutes,
              ...(multiDim
                ? {
                    latestSteps: multiDim.latestSteps,
                    avgSteps7d: multiDim.avgSteps7d,
                    latestIntensity: multiDim.latestIntensity,
                  }
                : {}),
            },
          }
        : {}),
      ...(cycleShared && latestRecord.recorded_cycle_phase
        ? {
            cycleSummary: {
              recordedCycleDay: latestRecord.recorded_cycle_day ?? null,
              recordedCyclePhase: latestRecord.recorded_cycle_phase ?? null,
              isEstimated: Boolean(latestRecord.is_estimated),
            },
          }
        : {}),
      ...(sharedWeeklyRecharge ? { sharedWeeklyRecharge } : {}),
      dailyCheckInStatus: authorizedDailyCheckIn,
      statusConfirmedAtTime,
      isStatusConfirmedToday,
      carePreferences: mergedPreferences,
      foodPreferences: [...recipientMeta.care_preferences.food_preferences],
      avoidTags: [...recipientMeta.care_preferences.avoid],
      communicationStyle: recipientMeta.care_preferences.communication_style,
    },
    partner: {
      name: senderMeta.display_name,
      pairingStatus: 'paired_demo',
      preferredWaysOfShowingCare: [...savedCareTitles],
      savedCareTitles,
      completedCareTitles,
      ...(skippedSuggestionIds.length > 0 ? { skippedSuggestionIds } : {}),
      feedback: {
        notRelevantTitles: mergedNotRelevantTitles,
        moreLikeThisTitles: feedback.moreLikeThisItems.map((i) => i.title),
        preferredCategories:
          learnedProfile.preferredCategories.length > 0
            ? [...learnedProfile.preferredCategories]
            : [...feedback.preferredCategories],
        deprioritizedCategories:
          learnedProfile.negativelyRatedAttributes.categories.length > 0
            ? [...learnedProfile.negativelyRatedAttributes.categories]
            : [...feedback.deprioritizedCategories],
      },
    },
    learnedProfile: compactLearned,
    recentSuggestions: recentSuggestionHistory.slice(0, RECENT_HISTORY_LIMIT).map((item) => ({
      title: item.title,
      category: item.category,
      actionType: item.actionType,
      fingerprint: item.fingerprint,
    })),
  };
}

export interface BuildNormalCareContextInput {
  language: LanguageCode;
  normalUser: NormalUserProfile;
  normalPairing: NormalPairingState;
  normalPreferences: NormalPreferencesState;
  normalBaseline: NormalBaselineAnalysis;
  normalInteractions: NormalInteractionsState;
  preferredLabels: Record<string, string>;
  avoidLabels: Record<string, string>;
  communicationLabels: Record<string, string>;
  suggestionTitleLookup: Record<string, string>;
  partnerDisplayName: string;
}

export function buildNormalCareContext(
  input: BuildNormalCareContextInput
): AiCareRequestContext {
  const {
    language,
    normalUser,
    normalPairing,
    normalPreferences,
    normalBaseline,
    normalInteractions,
    preferredLabels,
    avoidLabels,
    communicationLabels,
    suggestionTitleLookup,
    partnerDisplayName,
  } = input;

  const customPrefLabels = normalPreferences.customTags
    .map((t) => t.customLabel?.trim() ?? '')
    .filter(Boolean);

  const selectedPreferred = normalPreferences.preferredCare
    .map((key) => preferredLabels[key] ?? key)
    .filter(Boolean);

  const selectedAvoid = normalPreferences.avoidTags
    .map((key) => avoidLabels[key] ?? key)
    .filter(Boolean);

  const commStyle = normalPreferences.communicationStyle
    ? communicationLabels[normalPreferences.communicationStyle] ??
      normalPreferences.communicationStyle
    : null;

  const savedCareTitles = Array.from(
    new Set([
      ...normalInteractions.savedSuggestionIds
        .map((id) => suggestionTitleLookup[id])
        .filter(Boolean),
      ...normalInteractions.savedAiSuggestions.map((s) => s.title).filter(Boolean),
    ])
  );

  const completedCareTitles = Array.from(
    new Set(
      normalInteractions.notifications
        .filter((n) => n.status === 'Completed')
        .map((n) => n.suggestionTitle || suggestionTitleLookup[n.suggestionId] || '')
        .filter(Boolean)
    )
  );

  const energyAuthorized = normalUser.sharingConsent.energy;
  const hasAnyRecords = normalBaseline.recordedDaysCount > 0;
  const recentRecords =
    energyAuthorized && hasAnyRecords
      ? normalBaseline.sortedRecords.slice(-7).map((rec) => ({
          date: rec.date,
          weekdayIndex: rec.weekdayIndex,
          selfReportedScore1To5: rec.selfReportedScore1To5,
        }))
      : undefined;

  const allPreferred = Array.from(new Set([...selectedPreferred, ...customPrefLabels]));
  const feedbackEvents = normalInteractions.feedbackEvents ?? [];
  const learnedProfile = deriveLearnedPreferenceProfile('normal_recipient', feedbackEvents, {
    preferredCareLabels: allPreferred,
    avoidLabels: selectedAvoid,
    communicationStyleLabel: commStyle,
  });
  const compactLearned = summarizeProfileForGemini(learnedProfile);

  const authorizedDailyCheckIn = energyAuthorized
    ? normalBaseline.todayRecord?.checkInStatus ?? null
    : null;
  const statusConfirmedAtTime =
    energyAuthorized && normalBaseline.todayRecord ? normalBaseline.todayRecord.updatedAtTime : null;
  const isStatusConfirmedToday = Boolean(energyAuthorized && normalBaseline.todayRecord);

  const recentHistory = normalInteractions.recentSuggestionHistory ?? [];

  return {
    mode: 'normal',
    language,
    recipient: {
      name: partnerDisplayName,
      energyShared: energyAuthorized,
      sleepShared: false,
      activityShared: false,
      insufficientHistoricalData: normalBaseline.recordedDaysCount < 7,
      canShowFutureForecast: Boolean(energyAuthorized && normalBaseline.canShowFutureForecast),
      baselinePhase: normalBaseline.phase,
      recordedDaysCount: normalBaseline.recordedDaysCount,
      ...(recentRecords ? { recentEnergyRecords: recentRecords } : {}),
      ...(energyAuthorized && normalBaseline.earlyInsight
        ? {
            personalBaseline: {
              avgSelfReported1To5: normalBaseline.earlyInsight.averageScore1To5,
            },
          }
        : {}),
      dailyCheckInStatus: authorizedDailyCheckIn,
      statusConfirmedAtTime,
      isStatusConfirmedToday,
      carePreferences: allPreferred,
      foodPreferences: [],
      avoidTags: selectedAvoid,
      communicationStyle: commStyle,
    },
    partner: {
      name: normalUser.nickname || 'You',
      pairingStatus: normalPairing.status === 'paired_simulated' ? 'paired_simulated' : 'unpaired',
      preferredWaysOfShowingCare: [...savedCareTitles],
      savedCareTitles,
      completedCareTitles,
      feedback: {
        notRelevantTitles: normalInteractions.aiFeedback.notRelevantItems.map((i) => i.title),
        moreLikeThisTitles: normalInteractions.aiFeedback.moreLikeThisItems.map((i) => i.title),
        preferredCategories:
          learnedProfile.preferredCategories.length > 0
            ? [...learnedProfile.preferredCategories]
            : [...normalInteractions.aiFeedback.preferredCategories],
        deprioritizedCategories:
          learnedProfile.negativelyRatedAttributes.categories.length > 0
            ? [...learnedProfile.negativelyRatedAttributes.categories]
            : [...normalInteractions.aiFeedback.deprioritizedCategories],
      },
    },
    learnedProfile: compactLearned,
    recentSuggestions: recentHistory.slice(0, RECENT_HISTORY_LIMIT).map((item) => ({
      title: item.title,
      category: item.category,
      actionType: item.actionType,
      fingerprint: item.fingerprint,
    })),
  };
}
