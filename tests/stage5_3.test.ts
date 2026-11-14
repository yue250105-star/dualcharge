/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCareSystemInstruction,
  generateGeminiCareRecommendations,
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
import type { AiCareRequestContext, AiCareResponse } from '../src/types/aiCare.ts';
import type {
  CanonicalPartnerId,
  EnergyRecord,
  HistoricalEnergyPoint,
  NormalDailyRecord,
  NormalUserProfile,
  PartnerId,
  PartnerProfile,
  PartnerProfileData,
  PresentationBundle,
  RawDemoDataset,
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
    latestRecords: { alex: alexLatest, jamie: jamieLatest },
    historicalPoints: { alex: alexPoints, jamie: jamiePoints },
    partnerCarePrefs: {
      alex: alexMeta.care_preferences,
      jamie: jamieMeta.care_preferences,
    },
  };
}

function buildValidSamplePayload(): AiCareResponse {
  return {
    summary: 'Jamie may appreciate extra calm and low-pressure support on Thursday.',
    recipientName: 'Jamie',
    evidence: [
      'Observed 9 Thursdays averaging below overall 60-day baseline.',
      'Estimated upcoming Thursday index is 48 / 100 (Moderate confidence).',
    ],
    recommendations: [
      {
        id: 'rec-1',
        title: 'Prepare a Warm Milk Tea at Home',
        category: 'Practical Help',
        why: 'Jamie has shown lower average energy on Thursdays and appreciates cozy home gestures.',
        action: 'Make a warm cup of milk tea around 4:30 PM and handle evening tidying.',
        suggestedTiming: 'Thursday · 4:30 PM',
        personalizationReason: 'Matches preference for warm milk tea and calm evenings.',
        confidence: 'Moderate',
        defaultMessage: 'Saving a warm cup of milk tea for you when you wrap up today.',
      },
    ],
    limitations: 'Pattern-based estimate only; not a medical or emotional diagnosis.',
  };
}

test('Stage 5.3 Scenario 1: AI schema validation accepts valid/fenced JSON and rejects malformed payloads', () => {
  const valid = buildValidSamplePayload();
  const res1 = validateAiCareResponse(valid);
  assert.equal(res1.valid, true);
  assert.equal(res1.data?.recommendations.length, 1);

  const fenced = '```json\n' + JSON.stringify(valid) + '\n```';
  const resFenced = parseAndValidateAiCareJson(fenced);
  assert.equal(resFenced.valid, true);
  assert.equal(resFenced.data?.recipientName, 'Jamie');

  const invalidJson = parseAndValidateAiCareJson('{ broken json');
  assert.equal(invalidJson.valid, false);
  assert.ok(invalidJson.errors.length > 0);

  const emptyRecs = validateAiCareResponse({ ...valid, recommendations: [] });
  assert.equal(emptyRecs.valid, false);

  const aliasCategory = validateAiCareResponse({
    ...valid,
    recommendations: [{ ...valid.recommendations[0], category: 'Small Gift' }],
  });
  assert.equal(aliasCategory.valid, true);
  assert.equal(aliasCategory.data?.recommendations[0].category, 'Small Surprise');

  const badCategory = validateAiCareResponse({
    ...valid,
    recommendations: [{ ...valid.recommendations[0], category: 'Unrelated Topic' }],
  });
  assert.equal(badCategory.valid, false);

  const missingAction = validateAiCareResponse({
    ...valid,
    recommendations: [{ ...valid.recommendations[0], action: '   ' }],
  });
  assert.equal(missingAction.valid, false);
});

test('Stage 5.3 Scenario 2 & 3: Privacy toggles strictly filter sleep, activity, and energy context', () => {
  const bundle = buildTestPresentationBundle();
  const noSleepContext = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: {
      alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
      jamie: { energy: true, sleep: false, activity: false, cycleReserved: false },
    },
    dailyCheckInStatus: 'tired',
    recipientCareTags: [{ id: 't1', presetKey: 'warm_drink' }],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
  });

  assert.equal(noSleepContext.recipient.sleepShared, false);
  assert.equal(noSleepContext.recipient.sleepSummary, undefined);
  assert.equal(noSleepContext.recipient.activitySummary, undefined);
  assert.equal(noSleepContext.recipient.energyShared, true);
  assert.ok(noSleepContext.recipient.weekdayPattern?.hasPattern);

  // Fallback output with sleepShared=false must never mention sleep hours
  const fallbackNoSleep = generateLocalFallbackCare(noSleepContext, 'missing_api_key');
  const serializedFallback = JSON.stringify(fallbackNoSleep.data).toLowerCase();
  assert.equal(serializedFallback.includes('sleep'), false);
  assert.equal(serializedFallback.includes('5.7'), false);

  // Defense-in-depth sanitizer strips unauthorized fields even if passed manually
  const tampered: AiCareRequestContext = {
    ...noSleepContext,
    recipient: {
      ...noSleepContext.recipient,
      energyShared: false,
      sleepShared: false,
      activityShared: false,
      sleepSummary: { latestSleepHours: 4.5, overallAvgSleepHours: 6.1 },
      activitySummary: { latestActivityMinutes: 25 },
      currentEnergyIndex: 44,
    },
  };
  const sanitized = sanitizeContextForGemini(tampered);
  assert.equal(sanitized.recipient.sleepSummary, undefined);
  assert.equal(sanitized.recipient.activitySummary, undefined);
  assert.equal(sanitized.recipient.currentEnergyIndex, undefined);
  assert.equal(sanitized.recipient.recordedDaysCount, 0);
});

test('Stage 5.3 Scenario 4 & 5: Normal User Mode stays strictly isolated and cold-start honest', () => {
  const normalUser: NormalUserProfile = {
    completed: true,
    completedAtISO: '2026-11-10T09:00:00.000Z',
    nickname: 'Sam',
    avatarId: 'coral-glow',
    baselineStartDate: '2026-11-10',
    baselineStatus: 'building',
    validCheckInDays: 2,
    sharingConsent: { energy: true, sleep: false, activity: false, cycleReserved: false },
    premiumDemoConfirmed: false,
  };

  let records: NormalDailyRecord[] = [];
  records = upsertNormalDailyRecord(records, 'good', '9:00 AM', new Date(2026, 10, 10));
  records = upsertNormalDailyRecord(records, 'tired', '9:00 AM', new Date(2026, 10, 11));
  const baseline = analyzeNormalBaseline(records, '2026-11-10', new Date(2026, 10, 11));

  const normalCtx = buildNormalCareContext({
    language: 'en',
    normalUser,
    normalPairing: {
      status: 'paired_simulated',
      method: 'create',
      inviteCode: 'DC-7315',
      partnerHasRecords: false,
    },
    normalPreferences: {
      preferredCare: ['warm_drinks', 'gentle_messages'],
      avoidTags: ['crowded_places'],
      communicationStyle: 'gentle_supportive',
      customTags: [],
    },
    normalBaseline: baseline,
    normalInteractions: {
      savedSuggestionIds: [],
      savedAiSuggestions: [],
      aiFeedback: createEmptyFeedbackState(),
      notifications: [],
      careActivity: [],
    },
    preferredLabels: TRANSLATIONS.en.onboarding.step4.preferredCareOptions,
    avoidLabels: TRANSLATIONS.en.onboarding.step4.avoidOptions,
    communicationLabels: TRANSLATIONS.en.onboarding.step4.communicationOptions,
    suggestionTitleLookup: {},
    partnerDisplayName: 'Partner',
  });

  const ctxJson = JSON.stringify(normalCtx).toLowerCase();
  assert.equal(ctxJson.includes('alex'), false);
  assert.equal(ctxJson.includes('jamie'), false);
  assert.equal(normalCtx.mode, 'normal');
  assert.equal(normalCtx.recipient.insufficientHistoricalData, true);
  assert.equal(normalCtx.recipient.upcomingForecast, undefined);
  assert.equal(normalCtx.recipient.weekdayPattern, undefined);

  const fallbackNormal = generateLocalFallbackCare(normalCtx, 'missing_api_key');
  assert.ok(fallbackNormal.data.recommendations.length > 0);
  assert.ok(
    fallbackNormal.data.recommendations.every((r) => r.confidence === 'Preference-Based')
  );
});

test('Stage 5.3 Scenario 6: Presentation Demo Mode builds symmetric contexts for Alex->Jamie and Jamie->Alex', () => {
  const bundle = buildTestPresentationBundle();
  const alexFeedback = createEmptyFeedbackState();
  alexFeedback.preferredCategories = ['Emotional Support'];
  const jamieFeedback = createEmptyFeedbackState();
  jamieFeedback.preferredCategories = ['Quality Time'];

  const alexToJamie = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: {
      alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
      jamie: { energy: true, sleep: true, activity: false, cycleReserved: false },
    },
    dailyCheckInStatus: null,
    recipientCareTags: [{ id: 'j1', presetKey: 'warm_drink' }],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: alexFeedback,
  });

  const jamieToAlex = buildPresentationCareContext({
    bundle,
    senderId: 'jamie',
    recipientId: 'alex',
    language: 'en',
    sharingPrefs: {
      alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
      jamie: { energy: true, sleep: true, activity: false, cycleReserved: false },
    },
    dailyCheckInStatus: null,
    recipientCareTags: [{ id: 'a1', presetKey: 'walk' }],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: jamieFeedback,
  });

  assert.equal(alexToJamie.recipient.name, 'Jamie');
  assert.equal(alexToJamie.recipient.weekdayPattern?.hasPattern, true);
  assert.equal(jamieToAlex.recipient.name, 'Alex');
  assert.equal(jamieToAlex.recipient.weekdayPattern?.hasPattern, false);
  // Feedback stays isolated per partner
  assert.deepEqual(alexToJamie.partner.feedback.preferredCategories, ['Emotional Support']);
  assert.deepEqual(jamieToAlex.partner.feedback.preferredCategories, ['Quality Time']);
});

test('Stage 5.3 Scenario 7: Feedback learning adjusts fallback ranking for Not Relevant and More Like This', () => {
  const bundle = buildTestPresentationBundle();
  const baseFeedback = createEmptyFeedbackState();
  const baseCtx = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: {
      alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
      jamie: { energy: true, sleep: true, activity: false, cycleReserved: false },
    },
    dailyCheckInStatus: null,
    recipientCareTags: [],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: baseFeedback,
  });

  const firstRun = generateLocalFallbackCare(baseCtx, 'missing_api_key', undefined, 0);
  const firstTop = firstRun.data.recommendations[0];
  assert.ok(firstTop);

  // Mark top item Not Relevant and boost Small Surprise via More Like This
  const updatedCtx: AiCareRequestContext = {
    ...baseCtx,
    partner: {
      ...baseCtx.partner,
      feedback: {
        notRelevantTitles: [firstTop.title],
        moreLikeThisTitles: ['Leave a Short Handwritten Appreciation Note'],
        preferredCategories: ['Small Surprise'],
        deprioritizedCategories: [firstTop.category],
      },
    },
  };

  const secondRun = generateLocalFallbackCare(updatedCtx, 'missing_api_key', undefined, 1);
  assert.equal(
    secondRun.data.recommendations.some((r) => r.title === firstTop.title),
    false
  );
  assert.ok(
    secondRun.data.recommendations.some((r) => r.category === 'Small Surprise')
  );
});

test('Stage 5.3 Scenario 8: Client engine handles missing key, API errors, timeouts, invalid payloads, and live success cleanly', async () => {
  const bundle = buildTestPresentationBundle();
  const ctx = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: {
      alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
      jamie: { energy: true, sleep: false, activity: false, cycleReserved: false },
    },
    dailyCheckInStatus: null,
    recipientCareTags: [],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
  });

  const originalFetch = globalThis.fetch;

  try {
    // 1. Missing API key (HTTP 503) -> honest fallback
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ ok: false, errorCode: 'missing_api_key', message: 'Missing key' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch;
    const missingRes = await requestAiCareRecommendations(ctx, 0);
    assert.equal(missingRes.source, 'fallback');
    assert.equal(missingRes.fallbackReason, 'missing_api_key');

    // 2. Network rejection -> network_error fallback
    globalThis.fetch = (async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    const netRes = await requestAiCareRecommendations(ctx, 0);
    assert.equal(netRes.source, 'fallback');
    assert.equal(netRes.fallbackReason, 'network_error');

    // 3. Abort timeout -> timeout fallback
    globalThis.fetch = (async () => {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }) as typeof fetch;
    const timeoutRes = await requestAiCareRecommendations(ctx, 0);
    assert.equal(timeoutRes.source, 'fallback');
    assert.equal(timeoutRes.fallbackReason, 'timeout');

    // 4. Invalid schema JSON from backend -> invalid_response fallback
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({ ok: true, source: 'gemini', model: 'gemini-4-hydrogen', data: {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch;
    const invalidRes = await requestAiCareRecommendations(ctx, 0);
    assert.equal(invalidRes.source, 'fallback');
    assert.equal(invalidRes.fallbackReason, 'invalid_response');

    // 5. Valid Gemini payload -> source: 'gemini'
    const validData = buildValidSamplePayload();
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          ok: true,
          source: 'gemini',
          model: 'gemini-4-hydrogen',
          data: validData,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch;
    const okRes = await requestAiCareRecommendations(ctx, 0);
    assert.equal(okRes.source, 'gemini');
    assert.equal(okRes.model, 'gemini-4-hydrogen');
    assert.equal(okRes.data.recommendations[0].title, validData.recommendations[0].title);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Stage 5.3 Scenario 9: Server Gemini service refuses safely without API key and enforces responsible prompts', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const bundle = buildTestPresentationBundle();
    const ctx = buildPresentationCareContext({
      bundle,
      senderId: 'alex',
      recipientId: 'jamie',
      language: 'en',
      sharingPrefs: {
        alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
        jamie: { energy: true, sleep: false, activity: false, cycleReserved: false },
      },
      dailyCheckInStatus: null,
      recipientCareTags: [],
      presetTagLabels: TRANSLATIONS.en.profile.presetTags,
      savedSuggestionIds: [],
      savedAiSuggestions: [],
      notifications: [],
      suggestionTitleLookup: {},
      feedback: createEmptyFeedbackState(),
    });

    const result = await generateGeminiCareRecommendations(ctx, 0);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.statusCode, 503);
      assert.equal(result.errorCode, 'missing_api_key');
    }

    const enPrompt = buildCareSystemInstruction('en');
    assert.ok(enPrompt.includes('NEVER diagnose'));
    assert.ok(enPrompt.includes('sleepShared is false'));

    const zhCnPrompt = buildCareSystemInstruction('zh-CN');
    assert.ok(zhCnPrompt.includes('Simplified Chinese'));

    const zhTwPrompt = buildCareSystemInstruction('zh-TW');
    assert.ok(zhTwPrompt.includes('Traditional Chinese'));
  } finally {
    if (prevKey !== undefined) {
      process.env.GEMINI_API_KEY = prevKey;
    }
  }
});

test('Stage 5.3 Scenario 10: Fallback outputs and AI Care Engine UI copy work across en, zh-CN, and zh-TW', () => {
  const bundle = buildTestPresentationBundle();
  for (const lang of ['en', 'zh-CN', 'zh-TW'] as const) {
    const ctx = buildPresentationCareContext({
      bundle,
      senderId: 'alex',
      recipientId: 'jamie',
      language: lang,
      sharingPrefs: {
        alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
        jamie: { energy: true, sleep: true, activity: false, cycleReserved: false },
      },
      dailyCheckInStatus: null,
      recipientCareTags: [],
      presetTagLabels: TRANSLATIONS[lang].profile.presetTags,
      savedSuggestionIds: [],
      savedAiSuggestions: [],
      notifications: [],
      suggestionTitleLookup: {},
      feedback: createEmptyFeedbackState(),
    });
    const res = generateLocalFallbackCare(ctx, 'missing_api_key');
    assert.equal(res.source, 'fallback');
    assert.equal(res.data.recommendations.length, 3);
    assert.ok(res.data.summary.length > 0);
    assert.ok(res.data.limitations.length > 0);
  }
});
