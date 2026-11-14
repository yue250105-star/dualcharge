/// <reference types="node" />
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildCareSystemInstruction,
  sanitizeContextForGemini,
} from '../server/geminiCareService.ts';
import { analyzeNormalBaseline, upsertNormalDailyRecord } from '../src/data/normal/normalBaseline.ts';
import {
  analyzePresentationPartner,
  isValidSleepHours,
  parseISODateLocal,
} from '../src/data/presentation/presentationAnalytics.ts';
import rawDemoDataset from '../src/data/presentation/presentationDemoData.json';
import { TRANSLATIONS } from '../src/i18n/translations.ts';
import { parseAndValidateAiCareJson, validateAiCareResponse } from '../src/services/aiCareSchema.ts';
import {
  buildNormalCareContext,
  buildPresentationCareContext,
  createEmptyFeedbackState,
} from '../src/services/careContextBuilder.ts';
import { requestAiCareRecommendations } from '../src/services/careEngineClient.ts';
import { generateLocalFallbackCare } from '../src/services/careFallbackEngine.ts';
import type { AiCareRequestContext } from '../src/types/aiCare.ts';
import type {
  CanonicalPartnerId,
  EnergyRecord,
  HistoricalEnergyPoint,
  LanguageCode,
  NormalDailyRecord,
  NormalInteractionsState,
  NormalUserProfile,
  PartnerId,
  PartnerProfile,
  PartnerProfileData,
  PresentationBundle,
  RawDemoDataset,
  SharingPreferences,
} from '../src/types/dualcharge.ts';

function buildTestPresentationBundle(): PresentationBundle {
  const dataset = rawDemoDataset as RawDemoDataset;
  const alexRecords = dataset.records
    .filter((r) => r.partner_id === 'partner_a')
    .sort((a, b) => a.date.localeCompare(b.date));
  const jamieRecords = dataset.records
    .filter((r) => r.partner_id === 'partner_b')
    .sort((a, b) => a.date.localeCompare(b.date));

  const alexAnalytics = analyzePresentationPartner(alexRecords);
  const jamieAnalytics = analyzePresentationPartner(jamieRecords);

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
    analytics: ReturnType<typeof analyzePresentationPartner>
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
    },
  });

  return {
    dateRange: dataset.date_range,
    disclaimer: dataset.disclaimer,
    partnerMeta: { alex: alexMeta, jamie: jamieMeta },
    partnerProfiles: {
      alex: buildProfile('alex', alexMeta, alexLatest, alexPoints, alexAnalytics),
      jamie: buildProfile('jamie', jamieMeta, jamieLatest, jamiePoints, jamieAnalytics),
    },
    summaries: {
      alex: {
        partnerId: 'alex',
        canonicalPartnerId: 'partner_a',
        recordCount: alexAnalytics.recordCount,
        dateRange: dataset.date_range,
        latestEnergy: alexLatest.estimated_energy_index_0_to_100,
        overallMean: alexAnalytics.overallMean,
        recent7DayMean: alexAnalytics.recent7DayMean,
        overallAvgSleepHours: alexAnalytics.overallAvgSleepHours,
        belowBaselineCount: alexAnalytics.belowBaselineCount,
        belowBaselineProportion: alexAnalytics.belowBaselinePct,
        thursdayMean: alexAnalytics.weekdayStats[4].averageEnergy ?? 0,
        thursdayCount: alexAnalytics.weekdayStats[4].observationCount,
        prevDayBeforeThursdaySleepMean: alexAnalytics.weekdayStats[4].prevNightAvgSleepHours,
      },
      jamie: {
        partnerId: 'jamie',
        canonicalPartnerId: 'partner_b',
        recordCount: jamieAnalytics.recordCount,
        dateRange: dataset.date_range,
        latestEnergy: jamieLatest.estimated_energy_index_0_to_100,
        overallMean: jamieAnalytics.overallMean,
        recent7DayMean: jamieAnalytics.recent7DayMean,
        overallAvgSleepHours: jamieAnalytics.overallAvgSleepHours,
        belowBaselineCount: jamieAnalytics.belowBaselineCount,
        belowBaselineProportion: jamieAnalytics.belowBaselinePct,
        thursdayMean: jamieAnalytics.weekdayStats[4].averageEnergy ?? 0,
        thursdayCount: jamieAnalytics.weekdayStats[4].observationCount,
        prevDayBeforeThursdaySleepMean: jamieAnalytics.weekdayStats[4].prevNightAvgSleepHours,
      },
    },
    latestRecords: {
      alex: alexLatest,
      jamie: jamieLatest,
    },
    historicalPoints: {
      alex: alexPoints,
      jamie: jamiePoints,
    },
    partnerCarePrefs: {
      alex: alexMeta.care_preferences,
      jamie: jamieMeta.care_preferences,
    },
  };
}

function defaultSharingPrefs(energy = true, sleep = true): Record<PartnerId, SharingPreferences> {
  return {
    alex: {
      energy: true,
      sleep: true,
      heartRate: true,
      hrv: true,
      activity: true,
      cycle: false,
      cycleTrackingEnabled: false,
      cycleReserved: false,
    },
    jamie: {
      energy,
      sleep,
      heartRate: energy,
      hrv: energy,
      activity: energy,
      cycle: false,
      cycleTrackingEnabled: false,
      cycleReserved: false,
    },
  };
}

function emptyNormalInteractions(): NormalInteractionsState {
  return {
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    careActivity: [],
    aiFeedback: createEmptyFeedbackState(),
    feedbackEvents: [],
    recentSuggestionHistory: [],
    skippedSuggestionIds: [],
    surpriseCareRecords: [],
    mockOrders: [],
    careReminders: [],
    dismissedRecommendationIds: [],
  };
}

test('canonical 60-day dataset obeys exact Stage 3 Energy Index and 7-day forecast formulas', () => {
  const dataset = rawDemoDataset as RawDemoDataset;
  const jamieRecords = dataset.records
    .filter((r) => r.partner_id === 'partner_b')
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const record of dataset.records) {
    const sleepDurationScore = Math.min((record.sleep_hours / 8) * 100, 100);
    const sleepQualityScore = ((record.sleep_quality_1_to_5 - 1) / 4) * 100;
    const selfReportScore = ((record.self_reported_energy_1_to_5 - 1) / 4) * 100;
    const rawEnergy = 0.3 * sleepDurationScore + 0.2 * sleepQualityScore + 0.5 * selfReportScore;
    assert.ok(
      Math.abs(record.estimated_energy_index_0_to_100 - rawEnergy) <= 0.51,
      `Energy mismatch on ${record.date} for ${record.partner_id}: got ${record.estimated_energy_index_0_to_100}, raw ${rawEnergy}`
    );
  }

  const jamieAnalytics = analyzePresentationPartner(jamieRecords);
  assert.equal(jamieAnalytics.pattern.hasPattern, true);
  assert.equal(jamieAnalytics.pattern.detectedWeekdayIndex, 4);
  assert.ok(jamieAnalytics.pattern.observationCount >= 6);

  const recent7 = jamieRecords.slice(-7);
  const recent7Raw = recent7.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0) / 7;

  assert.equal(jamieAnalytics.forecast7Days.length, 7);
  for (const day of jamieAnalytics.forecast7Days) {
    assert.notEqual(day.confidence, 'High' as string);
    assert.equal(day.confidence, 'Moderate');
    const wdRecords = jamieRecords.filter(
      (r) => parseISODateLocal(r.date).getDay() === day.weekdayIndex
    );
    const wdMeanRaw =
      wdRecords.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0) / wdRecords.length;
    const expectedForecast = Math.max(
      0,
      Math.min(100, Math.round(0.75 * wdMeanRaw + 0.25 * recent7Raw))
    );
    assert.equal(day.estimatedEnergy, expectedForecast);
  }

  const sparse10 = analyzePresentationPartner(jamieRecords.slice(0, 10));
  for (const day of sparse10.forecast7Days) {
    if (day.estimatedEnergy !== null) {
      assert.equal(day.confidence, 'Low');
    }
  }

  const insufficient5 = analyzePresentationPartner(jamieRecords.slice(0, 5));
  for (const day of insufficient5.forecast7Days) {
    assert.equal(day.confidence, 'Insufficient Data');
    assert.equal(day.estimatedEnergy, null);
  }
});

test('Presentation Mode context splits Care for Now and Plan Ahead cleanly without auto-ordering', () => {
  const bundle = buildTestPresentationBundle();
  const context = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: defaultSharingPrefs(true, true),
    dailyCheckInStatus: 'tired',
    recipientCareTags: [{ id: 'tag-1', presetKey: 'warmMilkTea' }],
    presetTagLabels: { warmMilkTea: 'warm oat milk tea' },
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
  });

  assert.equal(context.recipient.canShowFutureForecast, true);
  assert.ok(typeof context.recipient.weekdayPattern?.dropFromOverall === 'number');
  assert.ok(typeof context.recipient.weekdayPattern?.percentageBelowBaseline === 'number');

  const result = generateLocalFallbackCare(context, 'missing_api_key', undefined, 0);
  const { recommendations, planAheadRecommendations, planAheadSummary } = result.data;

  assert.equal(recommendations.length, 3);
  for (const rec of recommendations) {
    assert.equal(rec.timeHorizon, 'now');
    assert.ok(rec.evidenceSummary && rec.evidenceSummary.length > 0);
    assert.ok(Array.isArray(rec.evidenceDetails) && rec.evidenceDetails.length > 0);
  }
  assert.ok(recommendations.some((r) => !r.requiresSpendingMoney));

  assert.ok(planAheadSummary && planAheadSummary.length > 0);
  assert.ok(Array.isArray(planAheadRecommendations) && planAheadRecommendations.length >= 2);
  for (const rec of planAheadRecommendations ?? []) {
    assert.equal(rec.timeHorizon, 'ahead');
    assert.ok(rec.targetDateISO && /^\d{4}-\d{2}-\d{2}$/.test(rec.targetDateISO));
    assert.ok(typeof rec.targetWeekdayIndex === 'number');
    assert.ok(rec.evidenceSummary && rec.evidenceSummary.length > 0);
    assert.ok(Array.isArray(rec.evidenceDetails) && rec.evidenceDetails.length > 0);
    assert.notEqual(rec.confidence, 'High' as string);
  }
  assert.ok(
    (planAheadRecommendations ?? []).some((r) => Boolean(r.suggestedDatePlanId)),
    'Plan Ahead should propose at least one Date Planning link candidate'
  );
});

test('Privacy gates: paused energy clears Plan Ahead; disabled sleep hides all sleep signals', () => {
  const bundle = buildTestPresentationBundle();

  const noEnergyContext = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: defaultSharingPrefs(false, false),
    dailyCheckInStatus: 'rest',
    recipientCareTags: [],
    presetTagLabels: {},
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
  });

  assert.equal(noEnergyContext.recipient.canShowFutureForecast, false);
  const sanitizedNoEnergy = sanitizeContextForGemini(noEnergyContext);
  assert.equal(sanitizedNoEnergy.recipient.canShowFutureForecast, false);
  assert.equal(sanitizedNoEnergy.recipient.upcomingForecast, undefined);
  assert.equal(sanitizedNoEnergy.recipient.weekdayPattern, undefined);

  const fallbackNoEnergy = generateLocalFallbackCare(noEnergyContext, 'api_error', undefined, 0);
  assert.equal(fallbackNoEnergy.data.planAheadRecommendations?.length ?? 0, 0);
  assert.equal(fallbackNoEnergy.data.recommendations.length, 3);
  assert.ok(
    fallbackNoEnergy.data.recommendations.every((r) => r.timeHorizon === 'now')
  );

  const energyNoSleepContext = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: defaultSharingPrefs(true, false),
    dailyCheckInStatus: 'tired',
    recipientCareTags: [],
    presetTagLabels: {},
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
  });

  const sanitizedNoSleep = sanitizeContextForGemini(energyNoSleepContext);
  assert.equal(sanitizedNoSleep.recipient.sleepSummary, undefined);

  const fallbackNoSleep = generateLocalFallbackCare(energyNoSleepContext, 'api_error', undefined, 0);
  assert.ok((fallbackNoSleep.data.planAheadRecommendations?.length ?? 0) >= 2);
  assert.equal(
    JSON.stringify(fallbackNoSleep.data).toLowerCase().includes('sleep'),
    false,
    'Fallback output including evidenceDetails and Plan Ahead must not mention sleep when sleep sharing is off'
  );
});

test('Normal Mode cold start disables Plan Ahead cleanly without fabricated history', () => {
  const normalUser: NormalUserProfile = {
    completed: true,
    completedAtISO: '2026-11-01T10:00:00.000Z',
    nickname: 'Sam',
    avatarId: 'coral-glow',
    baselineStartDate: '2026-11-01',
    baselineStatus: 'building',
    validCheckInDays: 3,
    sharingConsent: {
      energy: true,
      sleep: false,
      activity: false,
      cycleReserved: false,
    },
    premiumDemoConfirmed: false,
  };
  let records: NormalDailyRecord[] = [];
  for (let i = 0; i < 3; i++) {
    records = upsertNormalDailyRecord(
      records,
      i % 2 === 0 ? 'tired' : 'good',
      '09:30 AM',
      new Date(2026, 10, i + 1)
    );
  }
  const baseline = analyzeNormalBaseline(records, '2026-11-01', new Date(2026, 10, 3));
  assert.equal(baseline.canShowFutureForecast, false);

  const context = buildNormalCareContext({
    language: 'en',
    normalUser,
    normalPairing: {
      status: 'paired_simulated',
      method: 'create',
      inviteCode: 'DC-TEST',
      partnerHasRecords: false,
    },
    normalPreferences: {
      preferredCare: ['warm_drinks'],
      avoidTags: [],
      communicationStyle: 'gentle_supportive',
      customTags: [],
    },
    normalBaseline: baseline,
    normalInteractions: emptyNormalInteractions(),
    preferredLabels: { warm_drinks: 'warm herbal tea' },
    avoidLabels: {},
    communicationLabels: { gentle_supportive: 'short gentle text' },
    suggestionTitleLookup: {},
    partnerDisplayName: 'Taylor',
  });

  assert.equal(context.recipient.canShowFutureForecast, false);
  const result = generateLocalFallbackCare(context, 'missing_api_key', undefined, 0);
  assert.equal(result.data.recommendations.length, 3);
  assert.equal(result.data.planAheadRecommendations?.length ?? 0, 0);
});

test('Schema validator, Gemini instructions, and careEngineClient support Stage 5.8 safely', async () => {
  const sysPrompt = buildCareSystemInstruction('en');
  assert.ok(sysPrompt.includes('planAheadRecommendations'));
  assert.ok(sysPrompt.includes('evidenceSummary'));
  assert.ok(sysPrompt.includes('NEVER output confidence="High"'));

  const validated = parseAndValidateAiCareJson(
    JSON.stringify({
      summary: 'Today favors gentle practical care.',
      planAheadSummary: 'Thursday averages are historically lower in shared records.',
      recipientName: 'Jamie',
      evidence: ['Observed 60-day history.'],
      recommendations: [
        {
          id: 'now-1',
          title: 'Send an Easy Check-In',
          category: 'Emotional Support',
          timeHorizon: 'now',
          why: 'Today check-in indicates tiredness.',
          action: 'Send a short zero-pressure message.',
          suggestedTiming: 'Afternoon',
          personalizationReason: 'Matches communication preference.',
          evidenceSummary: 'Based on shared check-in today.',
          evidenceDetails: ['Check-in: A Bit Tired', 'Energy sharing enabled'],
          confidence: 'Preference-Based',
          defaultMessage: 'Hope your afternoon feels calm.',
          actionType: 'supportive_message',
          requiresSpendingMoney: false,
        },
      ],
      planAheadRecommendations: [
        {
          id: 'ahead-1',
          title: 'Keep Thursday Evening Light',
          category: 'Rest & Recovery',
          timeHorizon: 'ahead',
          why: 'Historical Thursday average trends lower.',
          action: 'Prep an easy Wednesday night meal ahead of Thursday.',
          suggestedTiming: 'Thursday · 2026-11-19',
          personalizationReason: 'Fits home recovery preference.',
          evidenceSummary: '9 Thursdays averaged 51.0 vs 65.4 overall.',
          evidenceDetails: ['9 Thursdays observed', 'Pattern estimate only'],
          targetWeekdayIndex: 4,
          targetDateISO: '2026-11-19',
          suggestedDatePlanId: 'date-cozy-movie',
          confidence: 'High',
          defaultMessage: 'Let us keep Thursday super simple.',
          actionType: 'quiet_evening',
          requiresSpendingMoney: false,
        },
      ],
      limitations: 'Estimates only.',
    })
  );

  assert.equal(validated.valid, true);
  assert.equal(validated.data?.recommendations[0].timeHorizon, 'now');
  assert.equal(validated.data?.planAheadRecommendations?.[0].timeHorizon, 'ahead');
  assert.equal(
    validated.data?.planAheadRecommendations?.[0].confidence,
    'Moderate',
    'High confidence must be normalized down to Moderate'
  );
  assert.equal(validated.data?.planAheadRecommendations?.[0].suggestedDatePlanId, 'date-cozy-movie');

  // Verify live Gemini client filtering respects energyShared=false and avoidPaidSuggestions=true
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          ok: true,
          source: 'gemini',
          model: 'gemini-4-hydrogen',
          data: {
            summary: 'Live summary',
            planAheadSummary: 'Future summary',
            recipientName: 'Jamie',
            evidence: ['Shared baseline'],
            recommendations: [
              {
                id: 'live-now-1',
                title: 'Send Calm Note',
                category: 'Emotional Support',
                timeHorizon: 'now',
                why: 'Fits today.',
                action: 'Write one calm line.',
                suggestedTiming: 'Today',
                personalizationReason: 'Low pressure.',
                confidence: 'Moderate',
                defaultMessage: 'Thinking of you.',
                actionType: 'supportive_message',
                requiresSpendingMoney: false,
              },
            ],
            planAheadRecommendations: [
              {
                id: 'live-ahead-free',
                title: 'Plan Quiet Walk',
                category: 'Quality Time',
                timeHorizon: 'ahead',
                why: 'Steadier weekend day.',
                action: 'Suggest a walk.',
                suggestedTiming: 'Saturday · 2026-11-14',
                personalizationReason: 'Matches outdoor walk.',
                targetWeekdayIndex: 6,
                targetDateISO: '2026-11-14',
                suggestedDatePlanId: 'date-evening-walk',
                confidence: 'Moderate',
                defaultMessage: 'Walk this weekend?',
                actionType: 'evening_walk',
                requiresSpendingMoney: false,
              },
              {
                id: 'live-ahead-paid',
                title: 'Order Pastry Box',
                category: 'Small Surprise',
                timeHorizon: 'ahead',
                why: 'Midweek treat.',
                action: 'Order pastry.',
                suggestedTiming: 'Thursday · 2026-11-19',
                personalizationReason: 'Dessert cue.',
                confidence: 'Low',
                defaultMessage: 'Sweet treat.',
                actionType: 'purchase_dessert',
                requiresSpendingMoney: true,
              },
            ],
            limitations: 'Estimates only.',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch;

    const baseCtx: AiCareRequestContext = {
      mode: 'presentation',
      language: 'en',
      recipient: {
        name: 'Jamie',
        energyShared: true,
        sleepShared: true,
        activityShared: true,
        insufficientHistoricalData: false,
        canShowFutureForecast: true,
        recordedDaysCount: 60,
        dailyCheckInStatus: 'tired',
        carePreferences: ['quiet walks'],
        foodPreferences: [],
        avoidTags: [],
        communicationStyle: 'short texts',
      },
      partner: {
        name: 'Alex',
        pairingStatus: 'paired_demo',
        preferredWaysOfShowingCare: [],
        savedCareTitles: [],
        completedCareTitles: [],
        feedback: {
          notRelevantTitles: [],
          moreLikeThisTitles: [],
          preferredCategories: [],
          deprioritizedCategories: [],
        },
      },
      learnedProfile: {
        learningMaturity: 'Established',
        totalFeedbackCount: 6,
        positiveFeedbackCount: 3,
        negativeFeedbackCount: 3,
        preferredCategories: ['Quality Time'],
        preferredCommunicationStyles: ['Short Text'],
        preferredActionTypes: ['evening_walk'],
        preferredTimings: [],
        preferredEffortLevels: ['Low'],
        prefersFreeOrLowCost: true,
        negativelyRatedAttributes: {
          categories: [],
          actionTypes: [],
          communicationStyles: [],
          tags: [],
          fingerprints: [],
          avoidPaidSuggestions: true,
        },
      },
    };

    const filteredPaid = await requestAiCareRecommendations(baseCtx, 0);
    assert.equal(filteredPaid.data.planAheadRecommendations?.length, 1);
    assert.equal(filteredPaid.data.planAheadRecommendations?.[0].id, 'live-ahead-free');

    const blockedFuture = await requestAiCareRecommendations(
      {
        ...baseCtx,
        recipient: { ...baseCtx.recipient, energyShared: false, canShowFutureForecast: false },
      },
      0
    );
    assert.equal(blockedFuture.data.planAheadRecommendations?.length ?? 0, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Backward compatibility check for Stage 5.3–5.7 payload without planAheadRecommendations
  const legacyValid = validateAiCareResponse({
    summary: 'Legacy response',
    recipientName: 'Jamie',
    evidence: ['Observation'],
    recommendations: [
      {
        id: 'legacy-1',
        title: 'Warm Note',
        category: 'Emotional Support',
        why: 'Helpful today',
        action: 'Send a note',
        suggestedTiming: 'Today',
        personalizationReason: 'Matched preference',
        confidence: 'Preference-Based',
        defaultMessage: 'Thinking of you.',
      },
    ],
    limitations: 'Estimates only.',
  });
  assert.equal(legacyValid.valid, true);
  assert.equal(legacyValid.data?.recommendations[0].timeHorizon, 'now');
});

test('Translations & CarePage uphold Stage 5.8 trilingual parity and UI safeguards', () => {
  const langs: LanguageCode[] = ['en', 'zh-CN', 'zh-TW'];
  const baseStage58 = TRANSLATIONS.en.care.stage58;
  const nowKeys = Object.keys(baseStage58.careForNow).sort();
  const aheadKeys = Object.keys(baseStage58.planAhead).sort();

  for (const lang of langs) {
    assert.deepEqual(
      Object.keys(TRANSLATIONS[lang].care.stage58.careForNow).sort(),
      nowKeys,
      `careForNow keys mismatch for ${lang}`
    );
    assert.deepEqual(
      Object.keys(TRANSLATIONS[lang].care.stage58.planAhead).sort(),
      aheadKeys,
      `planAhead keys mismatch for ${lang}`
    );
  }

  // Verify fallback generates both horizons cleanly in all 3 languages
  const bundle = buildTestPresentationBundle();
  for (const lang of langs) {
    const ctx = buildPresentationCareContext({
      bundle,
      senderId: 'alex',
      recipientId: 'jamie',
      language: lang,
      sharingPrefs: defaultSharingPrefs(true, true),
      dailyCheckInStatus: 'tired',
      recipientCareTags: [],
      presetTagLabels: {},
      savedSuggestionIds: [],
      savedAiSuggestions: [],
      notifications: [],
      suggestionTitleLookup: {},
      feedback: createEmptyFeedbackState(),
    });
    const res = generateLocalFallbackCare(ctx, 'missing_api_key', undefined, 0);
    assert.equal(res.data.recommendations.length, 3);
    assert.ok((res.data.planAheadRecommendations?.length ?? 0) >= 2);
  }

  // Verify CarePage keeps bottom nav untouched & avoids banned copy
  const carePageSrc = fs.readFileSync(path.resolve('src/pages/CarePage.tsx'), 'utf8');
  assert.equal(carePageSrc.includes('Choose Another Free Care Option'), false);
  assert.ok(carePageSrc.includes('CareForNowHeader'));
  assert.ok(carePageSrc.includes('PlanAheadSection'));
  assert.ok(carePageSrc.includes('ExpandableEvidencePanel'));
});
