/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeContextForGemini } from '../server/geminiCareService.ts';
import {
  computeMultiDimensionalSummary,
  enrichDemoRecordWithMultiDimensionalMetrics,
} from '../src/data/presentation/multidimensionalData.ts';
import {
  analyzePresentationPartner,
  isValidSleepHours,
  parseISODateLocal,
} from '../src/data/presentation/presentationAnalytics.ts';
import {
  INITIAL_CARE_MOMENTS,
  INITIAL_PRESENTATION_MEMBERSHIP,
  INITIAL_PRESENTATION_SHARING_PREFS,
} from '../src/data/presentation/presentationConstants.ts';
import rawDemoDataset from '../src/data/presentation/presentationDemoData.json';
import { TRANSLATIONS } from '../src/i18n/translations.ts';
import { buildPresentationCareContext, createEmptyFeedbackState } from '../src/services/careContextBuilder.ts';
import { generateLocalFallbackCare } from '../src/services/careFallbackEngine.ts';
import {
  buildDatePlanSuggestions,
  DATE_PLAN_CATEGORIES,
} from '../src/services/datePlanningService.ts';
import {
  COUPLE_PROPOSED_PRICING,
  filterCareMomentsByMembership,
  FREE_CARE_HISTORY_WINDOW_DAYS,
  FREE_INSIGHTS_TREND_DAYS,
  FREE_MONTHLY_AI_CARE_LIMIT,
  getBasicActivitySuggestions,
  getCurrentMonthKey,
  getMembershipCapabilities,
  MEMBERSHIP_COMPARISON_MATRIX,
} from '../src/services/membershipService.ts';
import {
  deriveLearnedPreferenceProfile,
  recordRecipientFeedbackEvent,
} from '../src/services/preferenceLearningEngine.ts';
import { buildMetadataFromPresetCare } from '../src/services/recommendationMetadata.ts';
import {
  evaluateNotificationDelivery,
  isNotificationAlertActive,
  isWithinQuietHours,
  shouldMaskSensitivePreview,
} from '../src/services/smartNotificationService.ts';
import type { CareFeedbackEvent } from '../src/types/aiCare.ts';
import {
  CanonicalPartnerId,
  CareMomentRecord,
  CareNotification,
  EnergyRecord,
  HistoricalEnergyPoint,
  NotificationPreferences,
  normalizeSharingPreferences,
  PartnerId,
  PartnerProfile,
  PartnerProfileData,
  PresentationBundle,
  RawDemoDataset,
  SharingPreferences,
} from '../src/types/dualcharge.ts';

function buildTestPresentationBundle(): PresentationBundle {
  const dataset = rawDemoDataset as RawDemoDataset;
  const alexRaw = dataset.records
    .filter((r) => r.partner_id === 'partner_a')
    .sort((a, b) => a.date.localeCompare(b.date));
  const jamieRaw = dataset.records
    .filter((r) => r.partner_id === 'partner_b')
    .sort((a, b) => a.date.localeCompare(b.date));

  const alexRecords = alexRaw.map((r, i) =>
    enrichDemoRecordWithMultiDimensionalMetrics(r, i, 'alex')
  );
  const jamieRecords = jamieRaw.map((r, i) =>
    enrichDemoRecordWithMultiDimensionalMetrics(r, i, 'jamie')
  );

  const alexAnalytics = analyzePresentationPartner(alexRecords);
  const jamieAnalytics = analyzePresentationPartner(jamieRecords);
  const alexMulti = computeMultiDimensionalSummary(alexRecords, 'alex');
  const jamieMulti = computeMultiDimensionalSummary(jamieRecords, 'jamie');

  const toPoints = (recs: EnergyRecord[]): HistoricalEnergyPoint[] =>
    recs.map((record) => {
      const d = parseISODateLocal(record.date);
      return {
        dateISO: record.date,
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        dayOfMonth: d.getDate(),
        weekdayIndex: d.getDay(),
        isThursday: d.getDay() === 4,
        energy: record.estimated_energy_index_0_to_100,
        prevNightSleepHours: isValidSleepHours(record.sleep_hours) ? record.sleep_hours : null,
      };
    });

  const buildMeta = (id: PartnerId, cid: CanonicalPartnerId): PartnerProfile => {
    const raw = dataset.partners[cid];
    return {
      id,
      canonicalId: cid,
      display_name: raw.display_name,
      role: raw.role,
      care_preferences: {
        preferred_care: [...raw.care_preferences.preferred_care],
        food_preferences: [...raw.care_preferences.food_preferences],
        avoid: [...raw.care_preferences.avoid],
        communication_style: raw.care_preferences.communication_style,
      },
      shared_fields: [...raw.shared_fields],
      pattern_note: raw.pattern_note,
    };
  };

  const alexMeta = buildMeta('alex', 'partner_a');
  const jamieMeta = buildMeta('jamie', 'partner_b');
  const alexLatest = alexRecords[alexRecords.length - 1];
  const jamieLatest = jamieRecords[jamieRecords.length - 1];
  const alexPoints = toPoints(alexRecords);
  const jamiePoints = toPoints(jamieRecords);

  const buildProfile = (
    id: PartnerId,
    meta: PartnerProfile,
    latest: EnergyRecord,
    points: HistoricalEnergyPoint[],
    analytics: ReturnType<typeof analyzePresentationPartner>,
    multiDimensional: ReturnType<typeof computeMultiDimensionalSummary>
  ): PartnerProfileData => ({
    id,
    name: meta.display_name,
    avatarUrl: `/test-avatar-${id}.jpg`,
    latestEnergy: latest.estimated_energy_index_0_to_100,
    todaySummary: {
      sleepDurationHours: latest.sleep_hours,
      sleepQualityScore: latest.sleep_quality_1_to_5,
      activityMinutes: latest.activity_minutes,
    },
    insights: {
      hasPattern: analytics.pattern.hasPattern,
      detectedWeekdayIndex: analytics.pattern.detectedWeekdayIndex,
      overallAvgEnergy: analytics.overallMean,
      recent7DayMean: analytics.recent7DayMean,
      analytics,
      historical60Days: points,
      forecast7Days: analytics.forecast7Days,
      multiDimensional,
    },
  });

  return {
    dateRange: dataset.date_range,
    disclaimer: dataset.disclaimer,
    partnerMeta: { alex: alexMeta, jamie: jamieMeta },
    partnerCarePrefs: {
      alex: alexMeta.care_preferences,
      jamie: jamieMeta.care_preferences,
    },
    partnerProfiles: {
      alex: buildProfile('alex', alexMeta, alexLatest, alexPoints, alexAnalytics, alexMulti),
      jamie: buildProfile('jamie', jamieMeta, jamieLatest, jamiePoints, jamieAnalytics, jamieMulti),
    },
    summaries: {
      alex: {
        partnerId: 'alex',
        canonicalPartnerId: 'partner_a',
        recordCount: alexRecords.length,
        dateRange: dataset.date_range,
        latestEnergy: alexLatest.estimated_energy_index_0_to_100,
        overallMean: alexAnalytics.overallMean,
        recent7DayMean: alexAnalytics.recent7DayMean,
        overallAvgSleepHours: alexAnalytics.overallAvgSleepHours,
        belowBaselineCount: alexAnalytics.belowBaselineCount,
        belowBaselineProportion: alexAnalytics.belowBaselinePct / 100,
        thursdayMean: alexAnalytics.weekdayStats[4].averageEnergy ?? 0,
        thursdayCount: alexAnalytics.weekdayStats[4].observationCount,
        prevDayBeforeThursdaySleepMean: alexAnalytics.weekdayStats[4].prevNightAvgSleepHours,
      },
      jamie: {
        partnerId: 'jamie',
        canonicalPartnerId: 'partner_b',
        recordCount: jamieRecords.length,
        dateRange: dataset.date_range,
        latestEnergy: jamieLatest.estimated_energy_index_0_to_100,
        overallMean: jamieAnalytics.overallMean,
        recent7DayMean: jamieAnalytics.recent7DayMean,
        overallAvgSleepHours: jamieAnalytics.overallAvgSleepHours,
        belowBaselineCount: jamieAnalytics.belowBaselineCount,
        belowBaselineProportion: jamieAnalytics.belowBaselinePct / 100,
        thursdayMean: jamieAnalytics.weekdayStats[4].averageEnergy ?? 0,
        thursdayCount: jamieAnalytics.weekdayStats[4].observationCount,
        prevDayBeforeThursdaySleepMean: jamieAnalytics.weekdayStats[4].prevNightAvgSleepHours,
      },
    },
    latestRecords: { alex: alexLatest, jamie: jamieLatest },
    historicalPoints: { alex: alexPoints, jamie: jamiePoints },
    multiDimensionalSummaries: { alex: alexMulti, jamie: jamieMulti },
  };
}

test('Stage 5.5 Data Integrity: Nullable health schema preserves null for missing days and keeps canonical Stage 3 metrics intact', () => {
  const bundle = buildTestPresentationBundle();

  assert.equal(bundle.summaries.alex.overallMean, 87.3);
  assert.equal(bundle.summaries.jamie.overallMean, 67.6);
  assert.equal(bundle.summaries.jamie.thursdayMean, 40.3);
  assert.equal(bundle.summaries.jamie.thursdayCount, 9);
  assert.equal(bundle.summaries.jamie.prevDayBeforeThursdaySleepMean, 5.7);

  const alexMulti = bundle.multiDimensionalSummaries!.alex;
  const jamieMulti = bundle.multiDimensionalSummaries!.jamie;

  assert.equal(alexMulti.measurementSource, 'Simulated Apple Health');
  assert.equal(jamieMulti.measurementSource, 'Simulated Health Connect');
  assert.ok(alexMulti.validRhrDays < 60 && alexMulti.validRhrDays >= 55);
  assert.ok(jamieMulti.validHrvDays < 60 && jamieMulti.validHrvDays >= 55);

  const missingRhrPoint = alexMulti.series.find((p) => p.restingHeartRateBpm === null);
  assert.ok(missingRhrPoint, 'Expected intentional missing RHR days to remain null, not 0');
  assert.ok(alexMulti.series.every((p) => p.restingHeartRateBpm !== 0));
  assert.ok(jamieMulti.series.every((p) => p.hrvValueMs !== 0));
});

test('Stage 5.5 Metric Isolation: SDNN and RMSSD are kept separated and sparse mixed records never merge incompatible HRV scales', () => {
  const bundle = buildTestPresentationBundle();
  assert.equal(bundle.multiDimensionalSummaries!.alex.hrvMetricType, 'RMSSD');
  assert.equal(bundle.multiDimensionalSummaries!.jamie.hrvMetricType, 'SDNN');

  const mixedSample: EnergyRecord[] = [
    {
      date: '2026-11-10',
      weekday: 'Tuesday',
      partner_id: 'partner_a',
      sleep_hours: 7.5,
      sleep_quality_1_to_5: 4,
      activity_minutes: 30,
      self_reported_energy_1_to_5: 4,
      estimated_energy_index_0_to_100: 82,
      is_simulated: true,
      hrv_metric_type: 'RMSSD',
      hrv_value_ms: 40,
      resting_heart_rate_bpm: null,
    },
    {
      date: '2026-11-11',
      weekday: 'Wednesday',
      partner_id: 'partner_a',
      sleep_hours: 7.0,
      sleep_quality_1_to_5: 4,
      activity_minutes: 25,
      self_reported_energy_1_to_5: 4,
      estimated_energy_index_0_to_100: 80,
      is_simulated: true,
      hrv_metric_type: 'SDNN',
      hrv_value_ms: 90,
      resting_heart_rate_bpm: null,
    },
  ];
  const summary = computeMultiDimensionalSummary(mixedSample, 'alex');
  assert.equal(summary.hrvMetricType, 'RMSSD');
  assert.equal(summary.hrvBaselineMs, 40, 'Must never average RMSSD 40 with SDNN 90 into 65');
  assert.equal(summary.rhrBaselineBpm, null);
});

test('Stage 5.5 Privacy & Sanitization: Granular toggles default OFF, Cycle requires explicit opt-in, and AI context strips disabled metrics', () => {
  assert.equal(INITIAL_PRESENTATION_SHARING_PREFS.alex.heartRate, false);
  assert.equal(INITIAL_PRESENTATION_SHARING_PREFS.alex.hrv, false);
  assert.equal(INITIAL_PRESENTATION_SHARING_PREFS.alex.cycle, false);
  assert.equal(INITIAL_PRESENTATION_SHARING_PREFS.alex.cycleTrackingEnabled, false);

  // Turning off cycleTrackingEnabled must force cycle share OFF
  const clearedCycle = normalizeSharingPreferences({
    energy: true,
    cycleTrackingEnabled: false,
    cycle: true,
  });
  assert.equal(clearedCycle.cycle, false);

  const bundle = buildTestPresentationBundle();
  const sharingPrefs: Record<PartnerId, SharingPreferences> = {
    alex: normalizeSharingPreferences({ energy: true, sleep: true, activity: true }),
    jamie: normalizeSharingPreferences({
      energy: true,
      sleep: false,
      heartRate: false,
      hrv: false,
      activity: false,
      cycleTrackingEnabled: true,
      cycle: false,
    }),
  };

  const context = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs,
    dailyCheckInStatus: 'tired',
    recipientCareTags: [],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    recipientWeeklyRecharge: {
      partnerId: 'jamie',
      weekKey: '2026-W46',
      status: 'completed',
      supportChoice: 'rest_recovery',
      nextWeekWish: 'more_quiet_time',
      optionalComment: 'Private note for myself only',
      shareWithPartner: false,
      submittedAtISO: '2026-11-13T10:00:00Z',
      updatedAtISO: '2026-11-13T10:00:00Z',
    },
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
  });

  assert.equal(context.recipient.rhrSummary, undefined);
  assert.equal(context.recipient.hrvSummary, undefined);
  assert.equal(context.recipient.sleepSummary, undefined);
  assert.equal(context.recipient.activitySummary, undefined);
  assert.equal(context.recipient.cycleSummary, undefined);
  assert.equal(context.recipient.sharedWeeklyRecharge, undefined);

  // Defense-in-depth sanitizer also strips unauthorized metrics even if forcibly injected
  const tampered = {
    ...context,
    recipient: {
      ...context.recipient,
      rhrSummary: { latestBpm: 72, personalBaselineBpm: 67, deviationBpm: 5, recent7DayMeanBpm: 69 },
      hrvSummary: { metricType: 'SDNN' as const, latestMs: 50, personalBaselineMs: 55, deviationMs: -5, recent7DayMeanMs: 52 },
      cycleSummary: { recordedCycleDay: 24, recordedCyclePhase: 'Luteal', isEstimated: true },
    },
  };
  const sanitized = sanitizeContextForGemini(tampered);
  assert.equal(sanitized.recipient.rhrSummary, undefined);
  assert.equal(sanitized.recipient.hrvSummary, undefined);
  assert.equal(sanitized.recipient.cycleSummary, undefined);

  const fallback = generateLocalFallbackCare(sanitized, 'missing_api_key', undefined, 0);
  assert.equal(fallback.data.recommendations.length, 3);
});

test('Stage 5.5 Care Loop & Feedback Isolation: Sender Sent/Saved/Skipped never alters recipient scores; Not Helpful / Not Suitable deduct recipient scores', () => {
  const initialEvents: CareFeedbackEvent[] = [];
  const meta = buildMetadataFromPresetCare({
    suggestionId: 'care-jamie-warm-drink',
    title: 'Prepare a Warm Drink',
    description: 'Make a warm drink for Jamie.',
    timing: 'Evening',
  });

  // Sender workflow does NOT emit CareFeedbackEvent; only explicit recipient feedback on Notifications does.
  const helpfulRes = recordRecipientFeedbackEvent({
    events: initialEvents,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'care-jamie-warm-drink',
    suggestionTitle: 'Prepare a Warm Drink',
    metadata: meta,
    feedbackType: 'helpful',
    timestampISO: '2026-11-13T10:00:00Z',
  });
  assert.equal(helpfulRes.accepted, true);

  const notSuitableRes = recordRecipientFeedbackEvent({
    events: helpfulRes.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'care-expensive-gift',
    suggestionTitle: 'Fancy Gift',
    metadata: {
      ...meta,
      category: 'Small Surprise',
      actionType: 'gift_surprise',
      requiresSpendingMoney: true,
      fingerprint: 'gift-fancy',
    },
    feedbackType: 'not_suitable',
    timestampISO: '2026-11-13T11:00:00Z',
  });
  assert.equal(notSuitableRes.accepted, true);

  const notHelpfulRes = recordRecipientFeedbackEvent({
    events: notSuitableRes.events,
    actor: 'alex',
    recipient: 'alex',
    suggestionId: 'care-alex-evening-walk',
    suggestionTitle: 'Evening Walk',
    metadata: buildMetadataFromPresetCare({
      suggestionId: 'care-alex-evening-walk',
      title: 'Evening Walk',
      description: 'Take a calm evening walk together.',
      timing: 'Evening',
    }),
    feedbackType: 'not_helpful',
    timestampISO: '2026-11-13T12:00:00Z',
  });

  const jamieProfile = deriveLearnedPreferenceProfile('jamie', notHelpfulRes.events);
  const alexProfile = deriveLearnedPreferenceProfile('alex', notHelpfulRes.events);

  assert.equal(jamieProfile.positiveFeedbackCount, 1);
  assert.equal(jamieProfile.negativeFeedbackCount, 1);
  assert.equal(jamieProfile.negativelyRatedAttributes.avoidPaidSuggestions, true);

  // Alex's not_helpful stays strictly on Alex
  assert.equal(alexProfile.negativeFeedbackCount, 1);
  assert.equal(alexProfile.positiveFeedbackCount, 0);
});

test('Stage 5.5 Care Moments Integrity: Only Completed care actions qualify (status updates & Sent/Received excluded)', () => {
  const sampleNotifs: CareNotification[] = [
    {
      id: 'n1',
      kind: 'care_message',
      sender: 'alex',
      recipient: 'jamie',
      suggestionId: 'care-jamie-warm-drink',
      suggestionTitle: 'Prepare a Warm Drink',
      timeLabel: '09:00',
      dateISO: '2026-11-13',
      isToday: true,
      status: 'Completed',
    },
    {
      id: 'n2',
      kind: 'status_update',
      sender: 'jamie',
      recipient: 'alex',
      suggestionId: 'daily-status-update',
      timeLabel: '09:15',
      dateISO: '2026-11-13',
      isToday: true,
      status: 'Completed',
    },
    {
      id: 'n3',
      kind: 'care_message',
      sender: 'alex',
      recipient: 'jamie',
      suggestionId: 'care-jamie-quiet-evening',
      timeLabel: '09:30',
      dateISO: '2026-11-13',
      isToday: true,
      status: 'Received',
    },
  ];

  const moments: CareMomentRecord[] = sampleNotifs
    .filter((n) => n.kind !== 'status_update' && n.status === 'Completed')
    .map((n) => ({
      id: `moment-${n.id}`,
      sourceNotificationId: n.id,
      dateTimeISO: '2026-11-13T09:00:00Z',
      timeLabel: n.timeLabel,
      dateISO: n.dateISO ?? '2026-11-13',
      careActionTitle: n.suggestionTitle ?? n.suggestionId,
      sender: n.sender,
      recipient: n.recipient,
      status: 'Completed',
      sharedVisibility: true,
    }));

  assert.equal(moments.length, 1);
  assert.equal(moments[0].sourceNotificationId, 'n1');
});

test('Stage 5.5 Smart Notifications: Quiet Hours overnight wrapping, frequency filter, status opt-out, and neutral preview masking', () => {
  const quietPrefs: NotificationPreferences = {
    quietHoursEnabled: true,
    quietStartTime: '22:30',
    quietEndTime: '07:30',
    allowImportantDuringQuietHours: true,
    frequency: 'standard',
    shareStatusNotifications: true,
    sensitivePreview: 'neutral',
  };

  assert.equal(isWithinQuietHours(quietPrefs, '23:15'), true);
  assert.equal(isWithinQuietHours(quietPrefs, '06:45'), true);
  assert.equal(isWithinQuietHours(quietPrefs, '14:00'), false);
  assert.equal(shouldMaskSensitivePreview(quietPrefs), true);

  // Ordinary care suppressed quietly during Quiet Hours
  const ordinaryDecision = evaluateNotificationDelivery({
    kind: 'care_message',
    importance: 'ordinary',
    recipientPrefs: quietPrefs,
    nowOrHHMM: '23:30',
  });
  assert.equal(ordinaryDecision.deliverNow, false);
  assert.equal(ordinaryDecision.suppressedByQuietHours, true);

  // Important update bypasses Quiet Hours when allowImportantDuringQuietHours is true
  const importantDecision = evaluateNotificationDelivery({
    kind: 'status_update',
    importance: 'important',
    recipientPrefs: quietPrefs,
    senderShareStatusNotifications: true,
    nowOrHHMM: '23:30',
  });
  assert.equal(importantDecision.deliverNow, true);

  // Important-only frequency filter mutes ordinary care outside quiet hours
  const importantOnlyDecision = evaluateNotificationDelivery({
    kind: 'care_message',
    importance: 'ordinary',
    recipientPrefs: { ...quietPrefs, frequency: 'important_only' },
    nowOrHHMM: '14:00',
  });
  assert.equal(importantOnlyDecision.suppressedReason, 'frequency_filter');

  const suppressedNotif: CareNotification = {
    id: 'n-quiet',
    sender: 'alex',
    recipient: 'jamie',
    suggestionId: 's1',
    importance: 'ordinary',
    suppressedByQuietHours: true,
    timeLabel: '23:30',
    isToday: true,
    status: 'Sent',
  };
  assert.equal(isNotificationAlertActive(suppressedNotif, quietPrefs), false);
});

test('Stage 5.5 Date Planning: Covers all 6 categories, adapts to low energy & shared recharge without pushing going out on high energy', () => {
  assert.equal(DATE_PLAN_CATEGORIES.length, 6);

  const lowEnergyPlans = buildDatePlanSuggestions({
    viewerId: 'alex',
    partnerId: 'jamie',
    partnerEnergy: 42,
    partnerSharing: normalizeSharingPreferences({ energy: true }),
    partnerAvoidLabels: ['crowds'],
    partnerSharedRecharge: {
      partnerId: 'jamie',
      weekKey: '2026-W46',
      status: 'completed',
      supportChoice: 'rest_recovery',
      nextWeekWish: 'more_quiet_time',
      shareWithPartner: true,
      submittedAtISO: '2026-11-13T10:00:00Z',
      updatedAtISO: '2026-11-13T10:00:00Z',
    },
  });
  assert.equal(lowEnergyPlans.length, 6);
  assert.equal(lowEnergyPlans[0].energyFit, 'low_pressure');

  const filteredMovies = buildDatePlanSuggestions({
    viewerId: 'alex',
    partnerId: 'jamie',
    partnerEnergy: 85,
    partnerSharing: normalizeSharingPreferences({ energy: true }),
    partnerAvoidLabels: [],
    selectedCategory: 'Movie Nights',
  });
  assert.equal(filteredMovies.length, 1);
  assert.equal(filteredMovies[0].category, 'Movie Nights');
});

test('Stage 5.5 i18n Completeness: Deep key parity and non-empty strings across en, zh-CN, and zh-TW', () => {
  function verifyLocaleParity(refObj: unknown, targetObj: unknown, pathLabel: string): void {
    if (Array.isArray(refObj)) {
      assert.ok(Array.isArray(targetObj), `Expected array at ${pathLabel}`);
      assert.equal(targetObj.length, refObj.length, `Array length mismatch at ${pathLabel}`);
      return;
    }
    if (refObj && typeof refObj === 'object') {
      assert.ok(targetObj && typeof targetObj === 'object', `Expected object at ${pathLabel}`);
      const refRecord = refObj as Record<string, unknown>;
      const tgtRecord = targetObj as Record<string, unknown>;
      for (const key of Object.keys(refRecord)) {
        assert.ok(key in tgtRecord, `Missing translation key ${pathLabel}.${key}`);
        verifyLocaleParity(refRecord[key], tgtRecord[key], `${pathLabel}.${key}`);
      }
      return;
    }
    if (typeof refObj === 'string') {
      assert.equal(typeof targetObj, 'string', `Expected string at ${pathLabel}`);
      assert.ok((targetObj as string).trim().length > 0, `Empty translation string at ${pathLabel}`);
    }
  }

  verifyLocaleParity(TRANSLATIONS.en, TRANSLATIONS['zh-CN'], 'zh-CN');
  verifyLocaleParity(TRANSLATIONS.en, TRANSLATIONS['zh-TW'], 'zh-TW');
});

test('Stage 5.5 Membership Defaults: Presentation & Couple start strictly on Free plan with expected seeded archive moment', () => {
  assert.equal(INITIAL_PRESENTATION_MEMBERSHIP.tier, 'free');
  assert.equal(INITIAL_PRESENTATION_MEMBERSHIP.purchasedBy, null);
  assert.equal(INITIAL_PRESENTATION_MEMBERSHIP.startDateISO, null);
  assert.equal(COUPLE_PROPOSED_PRICING.monthlyPrice, 38);
  assert.equal(COUPLE_PROPOSED_PRICING.yearlyPrice, 288);
  assert.equal(COUPLE_PROPOSED_PRICING.isIllustrativeProposal, true);

  // Verify seeded Care Moments contain both a recent (<=7d) and archived (>7d) item relative to 2026-11-13
  const freeFilter = filterCareMomentsByMembership(
    INITIAL_CARE_MOMENTS,
    INITIAL_PRESENTATION_MEMBERSHIP,
    '2026-11-13'
  );
  assert.equal(freeFilter.visibleMoments.length, 1);
  assert.equal(freeFilter.visibleMoments[0].id, 'moment-seed-recent');
  assert.equal(freeFilter.lockedOlderCount, 1);
  assert.equal(freeFilter.lockedOlderMoments[0].id, 'moment-seed-archive');
});

test('Stage 5.5 Capabilities & Quota Enforcement: Free retains essentials with 5/mo AI Care, 30d trend, 7d history; Premium unlocks both partners', () => {
  const freeLinkedCaps = getMembershipCapabilities(INITIAL_PRESENTATION_MEMBERSHIP, true);
  assert.equal(freeLinkedCaps.isPremium, false);
  assert.equal(freeLinkedCaps.canPurchaseCouplePremium, true);
  assert.equal(freeLinkedCaps.insightsTrendDaysLimit, FREE_INSIGHTS_TREND_DAYS);
  assert.equal(freeLinkedCaps.careHistoryWindowDays, FREE_CARE_HISTORY_WINDOW_DAYS);
  assert.equal(freeLinkedCaps.aiCareMonthlyLimit, FREE_MONTHLY_AI_CARE_LIMIT);
  assert.equal(freeLinkedCaps.canUseExtended60DayTrends, false);
  assert.equal(freeLinkedCaps.canUseAdvancedInsights, false);
  assert.equal(freeLinkedCaps.canUseAdvancedFeedbackLearning, false);
  assert.equal(freeLinkedCaps.canUseFullCareHistory, false);
  assert.equal(freeLinkedCaps.canUsePersonalizedDatePlanning, false);
  assert.equal(freeLinkedCaps.canUseCoupleWidgets, false);
  assert.equal(freeLinkedCaps.canUseAdvancedNotifications, false);

  // Monthly AI Care quota boundary: 0..4 allowed, 5 blocked on Free
  for (let i = 0; i < FREE_MONTHLY_AI_CARE_LIMIT; i += 1) {
    assert.equal(freeLinkedCaps.canGenerateAiCare(i), true);
  }
  assert.equal(freeLinkedCaps.canGenerateAiCare(FREE_MONTHLY_AI_CARE_LIMIT), false);
  assert.equal(freeLinkedCaps.remainingFreeAiCare(3), 2);
  assert.equal(freeLinkedCaps.remainingFreeAiCare(6), 0);

  // Unpaired guard prevents Couple Premium purchase when no partner is linked
  const unpairedCaps = getMembershipCapabilities(INITIAL_PRESENTATION_MEMBERSHIP, false);
  assert.equal(unpairedCaps.canPurchaseCouplePremium, false);

  // Shared Couple Premium unlocks all features across the couple plan
  const upgradedMembership = {
    tier: 'premium' as const,
    plan: 'yearly' as const,
    startDateISO: '2026-11-13',
    purchasedBy: 'alex' as const,
    isSimulated: true,
  };
  const premiumCaps = getMembershipCapabilities(upgradedMembership, true);
  assert.equal(premiumCaps.isPremium, true);
  assert.equal(premiumCaps.canUseExtended60DayTrends, true);
  assert.equal(premiumCaps.canUseAdvancedInsights, true);
  assert.equal(premiumCaps.canUseAdvancedFeedbackLearning, true);
  assert.equal(premiumCaps.canUseFullCareHistory, true);
  assert.equal(premiumCaps.canUsePersonalizedDatePlanning, true);
  assert.equal(premiumCaps.canUseCoupleWidgets, true);
  assert.equal(premiumCaps.canUseAdvancedNotifications, true);
  assert.equal(premiumCaps.canGenerateAiCare(99), true);
  assert.equal(premiumCaps.remainingFreeAiCare(99), null);

  const premiumFilter = filterCareMomentsByMembership(
    INITIAL_CARE_MOMENTS,
    upgradedMembership,
    '2026-11-13'
  );
  assert.equal(premiumFilter.visibleMoments.length, INITIAL_CARE_MOMENTS.length);
  assert.equal(premiumFilter.lockedOlderCount, 0);
});

test('Stage 5.5 Basic Activity Suggestions, Month Key & 12-Row Comparison Matrix Parity', () => {
  const allPlans = buildDatePlanSuggestions({
    viewerId: 'alex',
    partnerId: 'jamie',
    partnerEnergy: 80,
    partnerSharing: normalizeSharingPreferences({ energy: true }),
    partnerAvoidLabels: [],
  });
  const starterPlans = getBasicActivitySuggestions(allPlans);
  assert.equal(starterPlans.length, 3);
  assert.equal(getCurrentMonthKey(new Date(2026, 10, 13)), '2026-11');

  assert.equal(MEMBERSHIP_COMPARISON_MATRIX.length, 12);
  for (const locale of ['en', 'zh-CN', 'zh-TW'] as const) {
    const matrix = TRANSLATIONS[locale].profile.membershipUpgrade.matrixRows;
    for (const row of MEMBERSHIP_COMPARISON_MATRIX) {
      const entry = matrix[row.id];
      assert.ok(entry, `Missing matrix row ${row.id} in ${locale}`);
      assert.ok(entry.label.trim().length > 0);
      assert.ok(entry.free.trim().length > 0);
      assert.ok(entry.premium.trim().length > 0);
    }
  }
});
