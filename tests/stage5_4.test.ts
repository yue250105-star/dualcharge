/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCareSystemInstruction,
  sanitizeContextForGemini,
} from '../server/geminiCareService.ts';
import { analyzeNormalBaseline } from '../src/data/normal/normalBaseline.ts';
import {
  analyzePresentationPartner,
  isValidSleepHours,
  parseISODateLocal,
} from '../src/data/presentation/presentationAnalytics.ts';
import rawDemoDataset from '../src/data/presentation/presentationDemoData.json';
import { TRANSLATIONS } from '../src/i18n/translations.ts';
import { parseAndValidateAiCareJson } from '../src/services/aiCareSchema.ts';
import {
  buildNormalCareContext,
  buildPresentationCareContext,
  createEmptyFeedbackState,
} from '../src/services/careContextBuilder.ts';
import { generateLocalFallbackCare } from '../src/services/careFallbackEngine.ts';
import {
  confirmDailyStatusUpdate,
  getAuthorizedPartnerStatusView,
  setDraftDailyCheckInState,
  upsertPartnerStatusNotification,
} from '../src/services/dailyStatusUpdateService.ts';
import {
  deriveLearnedPreferenceProfile,
  recordRecipientFeedbackEvent,
  SCORE_MAX,
  SCORE_MIN,
  summarizeProfileForGemini,
} from '../src/services/preferenceLearningEngine.ts';
import {
  appendToRecentSuggestionHistory,
  diversifyRecommendations,
  isRecommendationInCooldown,
  isSubstantiallyDuplicateSuggestion,
} from '../src/services/recommendationDiversity.ts';
import {
  buildMetadataFromPresetCare,
  normalizeRecommendationMetadata,
} from '../src/services/recommendationMetadata.ts';
import {
  removeSavedSuggestionById,
  saveSuggestionSnapshot,
  sortSavedSuggestionsNewestFirst,
} from '../src/services/savedSuggestionsStore.ts';
import type {
  AiCareRecommendation,
  AiCareSavedItem,
  CareFeedbackEvent,
  RecentSuggestionRecord,
} from '../src/types/aiCare.ts';
import type {
  CanonicalPartnerId,
  CareNotification,
  DailyCheckInState,
  EnergyRecord,
  HistoricalEnergyPoint,
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
    partnerCarePrefs: {
      alex: alexMeta.care_preferences,
      jamie: jamieMeta.care_preferences,
    },
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
    historicalPoints: { alex: alexPoints, jamie: jamiePoints },
    latestRecords: { alex: alexLatest, jamie: jamieLatest },
  };
}

function makeSampleRec(overrides: Partial<AiCareRecommendation> = {}): AiCareRecommendation {
  return {
    id: 'rec-1',
    title: 'Warm Tea Before Evening Wind-Down',
    category: 'Practical Help',
    why: 'Helps ease tired evenings.',
    action: 'Prepare a warm non-caffeinated drink at home.',
    suggestedTiming: 'Evening · Around 8:00 PM',
    personalizationReason: 'Matches preference for warm drinks.',
    confidence: 'Moderate',
    defaultMessage: 'Made a warm tea for you tonight.',
    actionType: 'warm_drink',
    communicationStyle: 'Practical Action',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    ...overrides,
  };
}

test('Stage 5.4: Sender Save/Send actions never alter recipient feedback or learned scores', () => {
  const bundle = buildTestPresentationBundle();
  const sharingPrefs: Record<PartnerId, SharingPreferences> = {
    alex: { energy: true, sleep: true, activity: false, cycleReserved: false },
    jamie: { energy: true, sleep: true, activity: false, cycleReserved: false },
  };

  // Sender (alex) saves a recommendation snapshot for library
  const rec = makeSampleRec();
  const saveRes = saveSuggestionSnapshot({
    existing: [],
    recommendation: rec,
    source: 'gemini',
    ownerId: 'alex',
  });
  assert.equal(saveRes.added, true);

  // Saving does NOT produce any CareFeedbackEvent for recipient (jamie)
  const recipientEvents: CareFeedbackEvent[] = [];
  const context = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs,
    dailyCheckInStatus: null,
    recipientCareTags: [],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: saveRes.items,
    notifications: [
      {
        id: 'n1',
        kind: 'care_message',
        sender: 'alex',
        recipient: 'jamie',
        suggestionId: rec.id,
        suggestionTitle: rec.title,
        timeLabel: '09:00',
        isToday: true,
        status: 'Completed',
      },
    ],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
    recipientFeedbackEvents: recipientEvents,
  });

  assert.equal(context.learnedProfile?.totalFeedbackCount, 0);
  assert.equal(context.learnedProfile?.learningMaturity, 'Initial');
  assert.equal(context.learnedProfile?.preferredCategories.length, 0);
});

test('Stage 5.4: Actor isolation and duplicate/contradictory feedback prevention', () => {
  const meta = normalizeRecommendationMetadata(makeSampleRec());

  // Non-recipient actor ('alex') cannot record feedback on Jamie's behalf
  const invalidActor = recordRecipientFeedbackEvent({
    events: [],
    actor: 'alex',
    recipient: 'jamie',
    suggestionId: 'notif-rec-1',
    suggestionTitle: 'Warm Tea Before Evening Wind-Down',
    feedbackType: 'more_like_this',
    metadata: meta,
    timestampISO: '2026-11-13T10:00:00.000Z',
  });
  assert.equal(invalidActor.accepted, false);
  assert.equal(invalidActor.reason, 'actor_must_be_recipient');
  assert.equal(invalidActor.events.length, 0);

  // Valid recipient ('jamie') submits Helpful
  const first = recordRecipientFeedbackEvent({
    events: [],
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'notif-rec-1',
    suggestionTitle: 'Warm Tea Before Evening Wind-Down',
    feedbackType: 'helpful',
    metadata: meta,
    timestampISO: '2026-11-13T10:05:00.000Z',
  });
  assert.equal(first.accepted, true);
  assert.equal(first.events.length, 1);

  // Duplicate identical feedback on same suggestionId is rejected
  const duplicate = recordRecipientFeedbackEvent({
    events: first.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'notif-rec-1',
    suggestionTitle: 'Warm Tea Before Evening Wind-Down',
    feedbackType: 'helpful',
    metadata: meta,
    timestampISO: '2026-11-13T10:06:00.000Z',
  });
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, 'duplicate_feedback');
  assert.equal(duplicate.events.length, 1);

  // Switching feedback replaces previous event instead of creating contradictory duplicates
  const switched = recordRecipientFeedbackEvent({
    events: first.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'notif-rec-1',
    suggestionTitle: 'Warm Tea Before Evening Wind-Down',
    feedbackType: 'not_relevant',
    metadata: meta,
    timestampISO: '2026-11-13T10:10:00.000Z',
  });
  assert.equal(switched.accepted, true);
  assert.equal(switched.replacedPrevious, true);
  assert.equal(switched.events.length, 1);
  assert.equal(switched.events[0].feedbackType, 'not_relevant');
});

test('Stage 5.4: Tiered scoring, score clamping [-5, +5], non-overreaction on paid item, and explicit preference override', () => {
  const expensiveSurpriseMeta = normalizeRecommendationMetadata(
    makeSampleRec({
      id: 'paid-gift',
      title: 'Order a Surprise Flower Bouquet Delivery',
      category: 'Small Surprise',
      action: 'Buy and send a luxury flower bouquet.',
      actionType: 'gift_or_purchase',
      communicationStyle: 'Surprise',
      effortLevel: 'Medium',
      requiresSpendingMoney: true,
    })
  );

  // Rejecting ONE expensive gift should NOT ban the entire 'Small Surprise' category
  const rejectedOnce = recordRecipientFeedbackEvent({
    events: [],
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'paid-gift',
    suggestionTitle: 'Order a Surprise Flower Bouquet Delivery',
    feedbackType: 'not_relevant',
    metadata: expensiveSurpriseMeta,
    timestampISO: '2026-11-13T11:00:00.000Z',
  });

  const profileAfterOnePaidRejection = deriveLearnedPreferenceProfile(
    'jamie',
    rejectedOnce.events
  );
  assert.equal(
    profileAfterOnePaidRejection.negativelyRatedAttributes.categories.includes('Small Surprise'),
    false,
    'Rejecting one expensive Small Surprise must not automatically ban all Small Surprise suggestions'
  );
  assert.equal(
    profileAfterOnePaidRejection.negativelyRatedAttributes.avoidPaidSuggestions,
    true,
    'Rejecting a paid suggestion raises lowCost preference to avoid paid items'
  );
  assert.equal(
    profileAfterOnePaidRejection.negativelyRatedAttributes.fingerprints.includes(
      expensiveSurpriseMeta.fingerprint
    ),
    true
  );
  assert.ok(profileAfterOnePaidRejection.auditLog.length > 0);

  // Explicit Profile preference protects Practical Help even after repeated negative feedback
  let events: CareFeedbackEvent[] = [];
  for (let i = 0; i < 6; i++) {
    const meta = normalizeRecommendationMetadata(
      makeSampleRec({
        id: `prac-${i}`,
        title: `Practical chore item ${i}`,
        category: 'Practical Help',
        actionType: `custom_chore_${i}`,
      })
    );
    const res = recordRecipientFeedbackEvent({
      events,
      actor: 'jamie',
      recipient: 'jamie',
      suggestionId: `prac-${i}`,
      suggestionTitle: `Practical chore item ${i}`,
      feedbackType: 'not_relevant',
      metadata: meta,
      timestampISO: `2026-11-13T12:0${i}:00.000Z`,
    });
    events = res.events;
  }

  const protectedProfile = deriveLearnedPreferenceProfile('jamie', events, {
    preferredCareLabels: ['Warm drinks or light meals'],
    avoidLabels: [],
  });
  assert.equal(
    protectedProfile.negativelyRatedAttributes.categories.includes('Practical Help'),
    false,
    'Explicit Profile preferences must override conflicting inferred category negatives'
  );
  assert.ok((protectedProfile.categoryScores['Practical Help'] ?? 0) >= SCORE_MIN);
  assert.ok((protectedProfile.categoryScores['Practical Help'] ?? 0) <= SCORE_MAX);
  assert.equal(protectedProfile.learningMaturity, 'Established');
});

test('Stage 5.4: Learning maturity levels strictly reflect feedback counts (Initial <3, Developing 3-5, Established >=6)', () => {
  const buildEvents = (count: number): CareFeedbackEvent[] => {
    const out: CareFeedbackEvent[] = [];
    for (let i = 0; i < count; i++) {
      const meta = normalizeRecommendationMetadata(
        makeSampleRec({ id: `s-${i}`, title: `Warm note ${i}` })
      );
      out.push({
        eventId: `ev-${i}`,
        actor: 'alex',
        recipient: 'alex',
        suggestionId: `s-${i}`,
        suggestionTitle: `Warm note ${i}`,
        fingerprint: meta.fingerprint,
        feedbackType: 'helpful',
        timestampISO: `2026-11-13T09:0${i}:00.000Z`,
        metadata: meta,
      });
    }
    return out;
  };

  assert.equal(deriveLearnedPreferenceProfile('alex', buildEvents(0)).learningMaturity, 'Initial');
  assert.equal(deriveLearnedPreferenceProfile('alex', buildEvents(2)).learningMaturity, 'Initial');
  assert.equal(
    deriveLearnedPreferenceProfile('alex', buildEvents(3)).learningMaturity,
    'Developing'
  );
  assert.equal(
    deriveLearnedPreferenceProfile('alex', buildEvents(5)).learningMaturity,
    'Developing'
  );
  assert.equal(
    deriveLearnedPreferenceProfile('alex', buildEvents(6)).learningMaturity,
    'Established'
  );
});

test('Stage 5.4: Diversity & cooldown detect duplicate suggestions across IDs and promote varied categories', () => {
  const first = makeSampleRec({
    id: 'gemini-a1',
    title: 'Brew Calm Herbal Tea',
    category: 'Practical Help',
    action: 'Prepare herbal tea tonight so Jamie can relax.',
    actionType: 'warm_drink',
  });
  const recent: RecentSuggestionRecord[] = appendToRecentSuggestionHistory([], [first]);

  // Same semantic concept under a different Gemini ID should trigger cooldown
  const duplicateDifferentId = makeSampleRec({
    id: 'gemini-b99',
    title: 'Make a Warm Fruit Tea Cup',
    category: 'Practical Help',
    action: 'Brew warm tea at home before evening rest.',
    actionType: 'warm_drink',
  });
  assert.equal(isSubstantiallyDuplicateSuggestion(duplicateDifferentId, recent[0]), true);
  assert.equal(isRecommendationInCooldown(duplicateDifferentId, recent), true);

  const pool: AiCareRecommendation[] = [
    duplicateDifferentId,
    makeSampleRec({
      id: 'rec-emo',
      title: 'Send a Calm Check-In',
      category: 'Emotional Support',
      action: 'Send a short message with zero reply pressure.',
      actionType: 'supportive_message',
      communicationStyle: 'Short Text',
    }),
    makeSampleRec({
      id: 'rec-rest',
      title: 'Quiet Low-Stimulus Evening',
      category: 'Rest & Recovery',
      action: 'Keep lighting dim and pace unscheduled tonight.',
      actionType: 'quiet_evening',
      communicationStyle: 'Shared Activity',
    }),
    makeSampleRec({
      id: 'rec-qt',
      title: 'Short Slow Evening Walk',
      category: 'Quality Time',
      action: 'Invite partner for a relaxed 15-minute neighborhood stroll.',
      actionType: 'evening_walk',
      communicationStyle: 'Shared Activity',
    }),
  ];

  const diversified = diversifyRecommendations(pool, recent, 3);
  assert.equal(diversified.length, 3);
  const categories = new Set(diversified.map((r) => r.category));
  assert.equal(categories.size, 3);
  assert.equal(
    diversified.some((r) => r.id === 'gemini-b99'),
    false,
    'Cooldown recommendation should be deprioritized behind fresh distinct categories'
  );
});

test('Stage 5.4: Saved Suggestions Library stores full snapshots newest-first, deduplicates, and removes cleanly', () => {
  const olderRec = makeSampleRec({ id: 'old-1', title: 'Quiet Evening Plan' });
  const newerRec = makeSampleRec({
    id: 'new-2',
    title: 'Handwritten Desk Note',
    category: 'Small Surprise',
    actionType: 'handwritten_note',
    communicationStyle: 'Surprise',
  });

  const s1 = saveSuggestionSnapshot({
    existing: [],
    recommendation: olderRec,
    source: 'fallback',
    ownerId: 'alex',
    savedAtISO: '2026-11-13T08:00:00.000Z',
  });
  assert.equal(s1.added, true);

  // Duplicate save returns added: false
  const dup = saveSuggestionSnapshot({
    existing: s1.items,
    recommendation: olderRec,
    source: 'fallback',
    ownerId: 'alex',
    savedAtISO: '2026-11-13T08:05:00.000Z',
  });
  assert.equal(dup.added, false);

  const s2 = saveSuggestionSnapshot({
    existing: s1.items,
    recommendation: newerRec,
    source: 'gemini',
    ownerId: 'alex',
    savedAtISO: '2026-11-13T09:30:00.000Z',
  });
  assert.equal(s2.added, true);
  assert.equal(s2.items.length, 2);

  const sorted: AiCareSavedItem[] = sortSavedSuggestionsNewestFirst(s2.items);
  assert.equal(sorted[0].id, 'new-2');
  assert.equal(sorted[1].id, 'old-1');
  assert.ok(sorted[0].metadata?.fingerprint);

  const afterRemove = removeSavedSuggestionById(sorted, 'new-2');
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].id, 'old-1');

  const presetMeta = buildMetadataFromPresetCare({
    suggestionId: 'jamie-warm-drink',
    title: 'Make a warm drink',
    description: 'Brew herbal tea',
    timing: 'Evening',
  });
  assert.equal(presetMeta.category, 'Practical Help');
  assert.equal(presetMeta.actionType, 'warm_drink');
});

test('Stage 5.4: Daily status confirmation separates draft from confirmed, deduplicates same-day notifications, and preserves live privacy', () => {
  const initial: DailyCheckInState = {
    status: null,
    draftStatus: null,
    confirmationState: 'unconfirmed',
    updatedAtTime: null,
    historyCount: 60,
  };

  // Selecting draft option does NOT mark it confirmed
  const draft = setDraftDailyCheckInState(initial, 'tired');
  assert.equal(draft.draftStatus, 'tired');
  assert.equal(draft.status, null);
  assert.equal(draft.confirmationState, 'draft');

  // Confirming with energy=true, sleep=false, activity=false must filter restricted sleep/activity fields
  const firstConfirm = confirmDailyStatusUpdate({
    prevCheckIn: draft,
    option: 'tired',
    dateISO: '2026-11-13',
    timeLabel: '09:15',
    sharingPrefs: { energy: true, sleep: false, activity: false, cycleReserved: false },
    energyIndex: 44,
    sleepHours: 5.5,
    sleepQuality: 2,
    activityMinutes: 18,
  });
  assert.equal(firstConfirm.confirmationState, 'confirmed');
  assert.equal(firstConfirm.snapshot.checkInStatus, 'tired');
  assert.equal(firstConfirm.snapshot.energyIndex, 44);
  assert.equal(firstConfirm.snapshot.sleepHours, undefined);
  assert.equal(firstConfirm.snapshot.activityMinutes, undefined);

  let notifications: CareNotification[] = upsertPartnerStatusNotification({
    notifications: [],
    sender: 'jamie',
    recipient: 'alex',
    snapshot: firstConfirm.snapshot,
  });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].id, 'status-notif-jamie-2026-11-13');
  assert.equal(notifications[0].statusSnapshot?.checkInStatus, 'tired');

  // Same-day update transitions confirmationState -> 'updated' and deduplicates same-day notification
  const secondConfirm = confirmDailyStatusUpdate({
    prevCheckIn: firstConfirm.nextCheckIn,
    option: 'rest',
    dateISO: '2026-11-13',
    timeLabel: '14:20',
    sharingPrefs: { energy: true, sleep: false, activity: false, cycleReserved: false },
    energyIndex: 38,
    sleepHours: 5.5,
  });
  assert.equal(secondConfirm.confirmationState, 'updated');
  notifications = upsertPartnerStatusNotification({
    notifications,
    sender: 'jamie',
    recipient: 'alex',
    snapshot: secondConfirm.snapshot,
  });
  assert.equal(notifications.length, 1, 'Same-day confirmation must update in place without duplicates');
  assert.equal(notifications[0].statusSnapshot?.checkInStatus, 'rest');
  assert.equal(notifications[0].statusSnapshot?.confirmationState, 'updated');

  // LIVE privacy enforcement: toggling energy sharing OFF hides status details immediately
  const livePrivateView = getAuthorizedPartnerStatusView(secondConfirm.snapshot, {
    energy: false,
    sleep: false,
    activity: false,
    cycleReserved: false,
  });
  assert.equal(livePrivateView.isPrivate, true);
  assert.equal(livePrivateView.checkInStatus, undefined);
  assert.equal(livePrivateView.energyIndex, undefined);
});

test('Stage 5.4: Schema validation, Gemini context sanitization, and fallback honor learned preferences without leaking restricted data', () => {
  const bundle = buildTestPresentationBundle();
  const expensiveGiftMeta = normalizeRecommendationMetadata(
    makeSampleRec({
      id: 'paid-item',
      title: 'Order a Surprise Flower Bouquet Delivery',
      category: 'Small Surprise',
      actionType: 'gift_or_purchase',
      communicationStyle: 'Surprise',
      requiresSpendingMoney: true,
    })
  );
  const quietEveningMeta = normalizeRecommendationMetadata(
    makeSampleRec({
      id: 'quiet-item',
      title: 'Quiet Low-Stimulus Evening',
      category: 'Rest & Recovery',
      actionType: 'quiet_evening',
      communicationStyle: 'Shared Activity',
      requiresSpendingMoney: false,
    })
  );

  const ev1 = recordRecipientFeedbackEvent({
    events: [],
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'paid-item',
    suggestionTitle: 'Order a Surprise Flower Bouquet Delivery',
    feedbackType: 'not_relevant',
    metadata: expensiveGiftMeta,
    timestampISO: '2026-11-13T10:00:00.000Z',
  });
  const ev2 = recordRecipientFeedbackEvent({
    events: ev1.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: 'quiet-item',
    suggestionTitle: 'Quiet Low-Stimulus Evening',
    feedbackType: 'more_like_this',
    metadata: quietEveningMeta,
    timestampISO: '2026-11-13T10:05:00.000Z',
  });

  // Energy is OFF -> partner status & biometrics must be stripped cleanly while learned profile stays intact
  const context = buildPresentationCareContext({
    bundle,
    senderId: 'alex',
    recipientId: 'jamie',
    language: 'en',
    sharingPrefs: {
      alex: { energy: true, sleep: true, activity: true, cycleReserved: false },
      jamie: { energy: false, sleep: false, activity: false, cycleReserved: false },
    },
    dailyCheckInStatus: 'rest',
    partnerStatusUpdate: {
      dateISO: '2026-11-13',
      confirmedAtISO: '2026-11-13T10:00:00.000Z',
      updatedAtTime: '10:00',
      confirmationState: 'confirmed',
      energyShared: true,
      sleepShared: false,
      activityShared: false,
      checkInStatus: 'rest',
      energyIndex: 42,
    },
    recipientCareTags: [],
    presetTagLabels: TRANSLATIONS.en.profile.presetTags,
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    notifications: [],
    suggestionTitleLookup: {},
    feedback: createEmptyFeedbackState(),
    recipientFeedbackEvents: ev2.events,
  });

  const sanitized = sanitizeContextForGemini(context);
  assert.equal(sanitized.recipient.dailyCheckInStatus, null);
  assert.equal(sanitized.recipient.currentEnergyIndex, undefined);
  assert.ok(sanitized.learnedProfile);
  assert.equal(sanitized.learnedProfile?.totalFeedbackCount, 2);
  assert.equal(sanitized.learnedProfile?.learningMaturity, 'Initial');
  assert.equal(sanitized.learnedProfile?.negativelyRatedAttributes.avoidPaidSuggestions, true);

  const instruction = buildCareSystemInstruction('en');
  assert.ok(instruction.includes('Explicit profile preferences'));

  const fallback = generateLocalFallbackCare(context, 'missing_api_key', undefined, 0);
  assert.equal(fallback.data.recommendations.length, 3);
  assert.ok(
    fallback.data.recommendations.every((r) => !r.requiresSpendingMoney),
    'Fallback honors avoidPaidSuggestions from learned profile'
  );

  // Schema validates & enriches missing optional Stage 5.4 metadata fields
  const rawJson = JSON.stringify({
    summary: 'Thoughtful suggestions.',
    recipientName: 'Jamie',
    evidence: ['Preference signal only'],
    limitations: 'Suggestions only.',
    recommendations: [
      {
        id: 'g-1',
        title: 'Prepare Herbal Tea',
        category: 'Practical Help',
        why: 'Warm and calming.',
        action: 'Make warm tea at home.',
        suggestedTiming: 'Evening',
        personalizationReason: 'Matches tea preference.',
        confidence: 'Preference-Based',
        defaultMessage: 'Making tea for you tonight.',
      },
      {
        id: 'g-2',
        title: 'Quiet Rest Window',
        category: 'Rest & Recovery',
        why: 'Reduces stimulation.',
        action: 'Keep tonight calm and quiet.',
        suggestedTiming: 'Evening',
        personalizationReason: 'Learned preference.',
        confidence: 'Low',
        defaultMessage: 'Take a quiet evening tonight.',
      },
      {
        id: 'g-3',
        title: 'Gentle Check-In',
        category: 'Emotional Support',
        why: 'Zero pressure warmth.',
        action: 'Send a short encouraging text.',
        suggestedTiming: 'Afternoon',
        personalizationReason: 'Low-pressure style.',
        confidence: 'Low',
        defaultMessage: 'Thinking of you today.',
      },
    ],
  });
  const parsed = parseAndValidateAiCareJson(rawJson);
  assert.equal(parsed.valid, true);
  assert.ok(parsed.data?.recommendations[0].fingerprint);
  assert.equal(parsed.data?.recommendations[0].actionType, 'warm_drink');
  assert.equal(parsed.data?.recommendations[0].communicationStyle, 'Practical Action');

  // Normal mode isolation check
  const normalUser: NormalUserProfile = {
    completed: true,
    completedAtISO: '2026-11-13T08:00:00.000Z',
    nickname: 'Sam',
    avatarId: 'coral-glow',
    baselineStartDate: '2026-11-13',
    baselineStatus: 'building',
    validCheckInDays: 1,
    sharingConsent: { energy: true, sleep: false, activity: false, cycleReserved: false },
    premiumDemoConfirmed: false,
  };
  const normalRecords: NormalDailyRecord[] = [
    {
      date: '2026-11-13',
      weekdayIndex: 5,
      weekKey: '2026-W46',
      checkInStatus: 'good',
      selfReportedScore1To5: 4,
      updatedAtTime: '09:00',
      updatedAtISO: '2026-11-13T09:00:00.000Z',
    },
  ];
  const normalBaseline = analyzeNormalBaseline(
    normalRecords,
    normalUser.baselineStartDate,
    new Date('2026-11-13T12:00:00')
  );
  const normalInteractions: NormalInteractionsState = {
    savedSuggestionIds: [],
    savedAiSuggestions: [],
    aiFeedback: createEmptyFeedbackState(),
    feedbackEvents: [],
    recentSuggestionHistory: [],
    notifications: [],
    careActivity: [],
  };
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
      preferredCare: ['warm_drinks'],
      avoidTags: [],
      communicationStyle: 'gentle_supportive',
      customTags: [],
    },
    normalBaseline,
    normalInteractions,
    preferredLabels: TRANSLATIONS.en.onboarding.step4.preferredCareOptions,
    avoidLabels: TRANSLATIONS.en.onboarding.step4.avoidOptions,
    communicationLabels: TRANSLATIONS.en.onboarding.step4.communicationOptions,
    suggestionTitleLookup: {},
    partnerDisplayName: 'Partner',
  });
  assert.equal(normalCtx.recipient.isStatusConfirmedToday, true);
  assert.equal(normalCtx.recipient.dailyCheckInStatus, 'good');
  assert.equal(summarizeProfileForGemini(deriveLearnedPreferenceProfile('normal_recipient', [])).learningMaturity, 'Initial');
});
