/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialPresentationInteractions } from '../src/data/presentation/presentationConstants.ts';
import { TRANSLATIONS } from '../src/i18n/translations.ts';
import { getMembershipCapabilities } from '../src/services/membershipService.ts';
import {
  deriveLearnedPreferenceProfile,
  recordRecipientFeedbackEvent,
} from '../src/services/preferenceLearningEngine.ts';
import {
  buildCareMomentFromSurprise,
  buildSurpriseCareNotification,
  cancelSurpriseCareRecord,
  completeSurpriseCareRecord,
  computeSuggestedRevealAtISO,
  createSurpriseCareRecord,
  editSurpriseCareRecord,
  getRecipientVisibleSurpriseView,
  inferSurpriseCategoryFromRecommendation,
  isDatePlanHiddenAsSurprise,
  isSurpriseReadyToReveal,
  revealSurpriseCareRecord,
  SURPRISE_CARE_CATEGORIES,
  upsertSurpriseCareMoment,
  upsertSurpriseNotification,
} from '../src/services/surpriseCareService.ts';
import type { AiCareRecommendation } from '../src/types/aiCare.ts';
import type { NotificationPreferences } from '../src/types/dualcharge.ts';

function sampleRecommendation(overrides: Partial<AiCareRecommendation> = {}): AiCareRecommendation {
  return {
    id: 'ai-rec-evening-tea',
    title: 'Warm Milk Tea & Quiet Wind-Down',
    category: 'Rest & Recovery',
    why: 'Short sleep (5.9h) + lowered HRV suggest extra gentle support tonight.',
    action: 'Prepare warm oat milk tea and offer 20 minutes of quiet space.',
    suggestedTiming: 'Around 8:00 PM',
    personalizationReason: 'Matches Jamie preference for warm drinks and quiet evenings.',
    confidence: 'Moderate',
    defaultMessage: 'Made a warm cup of milk tea for you whenever you want a breather.',
    actionType: 'warm_drink',
    communicationStyle: 'Practical Action',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['warm drink', 'quiet', 'non-commercial'],
    ...overrides,
  };
}

function defaultNotifPrefs(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    quietHoursEnabled: false,
    quietStartTime: '22:30',
    quietEndTime: '08:00',
    allowImportantDuringQuietHours: true,
    frequency: 'standard',
    shareStatusNotifications: true,
    sensitivePreview: 'full',
    ...overrides,
  };
}

test('Stage 5.6: Surprise Care creation & category inference support non-commercial workflows', () => {
  assert.deepEqual(SURPRISE_CARE_CATEGORIES, [
    'personal_touch',
    'thoughtful_gesture',
    'shared_moments',
  ]);

  assert.equal(
    inferSurpriseCategoryFromRecommendation(
      sampleRecommendation({ communicationStyle: 'Short Text', category: 'Emotional Support' })
    ),
    'personal_touch'
  );
  assert.equal(
    inferSurpriseCategoryFromRecommendation(sampleRecommendation()),
    'thoughtful_gesture'
  );
  assert.equal(
    inferSurpriseCategoryFromRecommendation(
      sampleRecommendation({ communicationStyle: 'Shared Activity', category: 'Quality Time' })
    ),
    'shared_moments'
  );

  const rec = sampleRecommendation();
  const tellNow = createSurpriseCareRecord({
    id: 'surp-tell-now',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: rec,
    careCategory: 'thoughtful_gesture',
    noteStyle: 'handwritten_note',
    title: rec.title,
    actionDescription: rec.action,
    content: rec.defaultMessage,
    deliveryMode: 'tell_now',
    visibility: 'shared',
    nowISO: '2026-11-13T18:00:00.000Z',
  });

  assert.equal(tellNow.status, 'Sent');
  assert.equal(tellNow.revealedAt, '2026-11-13T18:00:00.000Z');
  assert.equal(tellNow.revealAt, null);
  assert.equal(tellNow.sourceRecommendationId, rec.id);
  assert.equal(tellNow.recommendationMetadata?.requiresSpendingMoney, false);

  const scheduled = createSurpriseCareRecord({
    id: 'surp-sched',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: rec,
    careCategory: 'personal_touch',
    noteStyle: 'voice_placeholder',
    title: 'Pocket Note for Tomorrow',
    actionDescription: 'Leave a kind note for the morning.',
    content: 'Hope your morning starts calm and light.',
    deliveryMode: 'keep_surprise',
    revealAt: '2026-11-14T09:00:00.000Z',
    visibility: 'private',
    nowISO: '2026-11-13T18:00:00.000Z',
  });

  assert.equal(scheduled.status, 'Scheduled');
  assert.equal(scheduled.revealedAt, null);
  assert.equal(scheduled.visibility, 'private');
});

test('Stage 5.6: Unrevealed Scheduled surprises can be edited or cancelled by sender only, and not after reveal', () => {
  const scheduled = createSurpriseCareRecord({
    id: 'surp-edit-1',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: sampleRecommendation(),
    careCategory: 'shared_moments',
    title: 'Cozy Movie Evening',
    actionDescription: 'Pick a calming film together.',
    content: 'Pick any cozy movie tonight.',
    deliveryMode: 'keep_surprise',
    revealAt: '2026-11-13T20:00:00.000Z',
    relatedDatePlanId: 'date-cozy-movie',
    nowISO: '2026-11-13T14:00:00.000Z',
  });

  const editRes = editSurpriseCareRecord(
    scheduled,
    {
      title: 'Cozy Tea & Film Evening',
      careCategory: 'thoughtful_gesture',
    },
    '2026-11-13T15:00:00.000Z'
  );
  assert.equal(editRes.updated, true);
  assert.equal(editRes.record.title, 'Cozy Tea & Film Evening');
  // Changing away from shared_moments clears relatedDatePlanId
  assert.equal(editRes.record.relatedDatePlanId, undefined);

  // Non-sender cannot cancel
  const wrongCancel = cancelSurpriseCareRecord(editRes.record, 'jamie');
  assert.equal(wrongCancel.cancelled, false);

  // Sender can cancel while Scheduled
  const validCancel = cancelSurpriseCareRecord(editRes.record, 'alex');
  assert.equal(validCancel.cancelled, true);
  assert.equal(validCancel.record.status, 'Cancelled');

  // Cannot edit cancelled or revealed
  const editAfterCancel = editSurpriseCareRecord(validCancel.record, { title: 'New' });
  assert.equal(editAfterCancel.updated, false);

  const revealedRes = revealSurpriseCareRecord(
    scheduled,
    'jamie',
    '2026-11-13T21:00:00.000Z'
  );
  assert.equal(revealedRes.revealed, true);
  assert.equal(
    editSurpriseCareRecord(revealedRes.record, { title: 'Too Late' }).updated,
    false
  );
  assert.equal(cancelSurpriseCareRecord(revealedRes.record, 'alex').cancelled, false);
});

test('Stage 5.6: Privacy masking hides unrevealed details, AI reasoning, health metrics, and linked Date Plans', () => {
  const scheduledDateSurprise = createSurpriseCareRecord({
    id: 'surp-secret-date',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: sampleRecommendation({
      why: 'HRV dropped 14% and sleep was 5.4h',
      personalizationReason: 'Sensitive baseline pattern evidence',
    }),
    careCategory: 'shared_moments',
    noteStyle: 'handwritten_note',
    title: 'Secret Sunset Walk & Tea',
    actionDescription: 'Short park walk together',
    content: 'Meet me at 6pm for a quiet walk!',
    deliveryMode: 'keep_surprise',
    revealAt: '2026-11-13T18:00:00.000Z',
    relatedDatePlanId: 'date-evening-walk',
    nowISO: '2026-11-13T10:00:00.000Z',
  });

  // Before reveal time: strictly masked & not ready to reveal
  const beforeView = getRecipientVisibleSurpriseView(
    scheduledDateSurprise,
    '2026-11-13T12:00:00.000Z'
  );
  assert.equal(beforeView.visible, true);
  assert.equal(beforeView.isMasked, true);
  assert.equal(beforeView.canOpenSurprise, false);
  assert.equal(beforeView.title, undefined);
  assert.equal(beforeView.content, undefined);
  assert.equal(beforeView.senderId, undefined);
  assert.equal(beforeView.relatedDatePlanId, undefined);
  assert.equal(isSurpriseReadyToReveal(scheduledDateSurprise, '2026-11-13T12:00:00.000Z'), false);

  // Even after reveal time passes, details stay masked until recipient clicks "Open My Surprise"
  const readyView = getRecipientVisibleSurpriseView(
    scheduledDateSurprise,
    '2026-11-13T18:05:00.000Z'
  );
  assert.equal(readyView.isMasked, true);
  assert.equal(readyView.canOpenSurprise, true);
  assert.equal(readyView.title, undefined);
  assert.equal(readyView.relatedDatePlanId, undefined);

  // Date Plan invite MUST stay hidden for recipient while unrevealed, visible once revealed
  assert.equal(
    isDatePlanHiddenAsSurprise('date-evening-walk', [scheduledDateSurprise], 'jamie'),
    true
  );
  assert.equal(
    isDatePlanHiddenAsSurprise('date-evening-walk', [scheduledDateSurprise], 'alex'),
    false
  );

  // Sender cannot reveal on behalf of recipient
  assert.equal(
    revealSurpriseCareRecord(scheduledDateSurprise, 'alex', '2026-11-13T18:05:00.000Z').revealed,
    false
  );

  // Recipient opens surprise -> unmasked, date visible, NO private why/health fields leaked
  const revealed = revealSurpriseCareRecord(
    scheduledDateSurprise,
    'jamie',
    '2026-11-13T18:05:00.000Z'
  );
  assert.equal(revealed.revealed, true);
  assert.equal(revealed.record.status, 'Revealed');
  assert.equal(
    isDatePlanHiddenAsSurprise('date-evening-walk', [revealed.record], 'jamie'),
    false
  );

  const afterView = getRecipientVisibleSurpriseView(revealed.record, '2026-11-13T18:06:00.000Z');
  assert.equal(afterView.isMasked, false);
  assert.equal(afterView.title, 'Secret Sunset Walk & Tea');
  assert.equal(afterView.relatedDatePlanId, 'date-evening-walk');
  assert.equal('sourceWhy' in afterView, false);
  assert.equal('personalizationReason' in afterView, false);

  // Force demo unlock works immediately
  const quickDemoAt = computeSuggestedRevealAtISO(
    'demo_quick',
    new Date('2026-11-13T10:00:00.000Z')
  );
  assert.equal(quickDemoAt, '2026-11-13T10:00:05.000Z');
  assert.equal(
    revealSurpriseCareRecord(scheduledDateSurprise, 'jamie', '2026-11-13T10:00:01.000Z', {
      forceDemoUnlock: true,
    }).revealed,
    true
  );
});

test('Stage 5.6: Notification delivery respects Quiet Hours & frequency and avoids duplicates on upsert', () => {
  const scheduled = createSurpriseCareRecord({
    id: 'surp-notif-1',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: sampleRecommendation(),
    careCategory: 'personal_touch',
    title: 'Secret Appreciation Note',
    actionDescription: 'Appreciation note',
    content: 'Thank you for being so steady this week.',
    deliveryMode: 'keep_surprise',
    revealAt: '2026-11-13T23:00:00.000Z',
    nowISO: '2026-11-13T22:45:00.000Z',
  });

  const quietPrefs = defaultNotifPrefs({
    quietHoursEnabled: true,
    quietStartTime: '22:00',
    quietEndTime: '08:00',
  });

  const notifScheduled = buildSurpriseCareNotification({
    record: scheduled,
    recipientPrefs: quietPrefs,
    timeLabel: '10:45 PM',
    dateISO: '2026-11-13',
    nowOrHHMM: '22:45',
  });

  assert.equal(notifScheduled.kind, 'surprise_care');
  assert.equal(notifScheduled.suppressedByQuietHours, true);
  // Neutral notification never stores secret title/message while Scheduled
  assert.equal(notifScheduled.suggestionTitle, undefined);
  assert.equal(notifScheduled.suggestionDefaultMessage, undefined);

  const revealed = revealSurpriseCareRecord(scheduled, 'jamie', '2026-11-14T09:00:00.000Z').record;
  const notifRevealed = buildSurpriseCareNotification({
    record: revealed,
    recipientPrefs: quietPrefs,
    timeLabel: '9:00 AM',
    dateISO: '2026-11-14',
    nowOrHHMM: '09:00',
  });

  const listAfterFirst = upsertSurpriseNotification([], notifScheduled);
  const listAfterReveal = upsertSurpriseNotification(listAfterFirst, notifRevealed);
  assert.equal(listAfterReveal.length, 1);
  assert.equal(listAfterReveal[0].suggestionTitle, 'Secret Appreciation Note');
  assert.equal(listAfterReveal[0].suppressedByQuietHours, false);

  const importantOnlyPrefs = defaultNotifPrefs({ frequency: 'important_only' });
  const freqFilteredNotif = buildSurpriseCareNotification({
    record: revealed,
    recipientPrefs: importantOnlyPrefs,
    timeLabel: '9:00 AM',
    dateISO: '2026-11-14',
    nowOrHHMM: '09:00',
  });
  assert.equal(freqFilteredNotif.suppressedReason, 'frequency_filter');
});

test('Stage 5.6: Recipient-only feedback trains PreferenceLearningEngine without duplicates or sender bias', () => {
  const rec = sampleRecommendation();
  const metadata = {
    category: rec.category,
    actionType: rec.actionType!,
    communicationStyle: rec.communicationStyle!,
    effortLevel: rec.effortLevel!,
    suggestedTiming: rec.suggestedTiming,
    requiresSpendingMoney: false,
    tags: rec.tags!,
    fingerprint: 'warm-milk-tea-quiet-wind-down',
  };

  // Sender cannot submit preference feedback for recipient
  const senderAttempt = recordRecipientFeedbackEvent({
    events: [],
    actor: 'alex',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'more_like_this',
    metadata,
    surpriseCareId: 'surp-1',
  });
  assert.equal(senderAttempt.accepted, false);

  // Recipient submits "❤️ That Made My Day" -> more_like_this (+2 weight)
  const firstFeedback = recordRecipientFeedbackEvent({
    events: [],
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'more_like_this',
    metadata,
    surpriseCareId: 'surp-1',
  });
  assert.equal(firstFeedback.accepted, true);
  assert.equal(firstFeedback.events.length, 1);

  // Identical duplicate feedback for same surpriseCareId is blocked
  const duplicateFeedback = recordRecipientFeedbackEvent({
    events: firstFeedback.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'more_like_this',
    metadata,
    surpriseCareId: 'surp-1',
  });
  assert.equal(duplicateFeedback.accepted, false);
  assert.equal(duplicateFeedback.reason, 'duplicate_feedback');

  // Changing feedback type on same surpriseCareId replaces cleanly without duplicating events
  const switchedFeedback = recordRecipientFeedbackEvent({
    events: firstFeedback.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'helpful',
    metadata,
    surpriseCareId: 'surp-1',
  });
  assert.equal(switchedFeedback.accepted, true);
  assert.equal(switchedFeedback.replacedPrevious, true);
  assert.equal(switchedFeedback.events.length, 1);

  // Distinct surpriseCareId on same underlying suggestionId IS allowed
  const secondSurpriseFeedback = recordRecipientFeedbackEvent({
    events: switchedFeedback.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'helpful',
    metadata,
    surpriseCareId: 'surp-2',
  });
  assert.equal(secondSurpriseFeedback.accepted, true);
  assert.equal(secondSurpriseFeedback.events.length, 2);

  const profile = deriveLearnedPreferenceProfile('jamie', secondSurpriseFeedback.events);
  assert.equal(profile.positiveFeedbackCount, 2);
  assert.ok((profile.actionTypeScores.warm_drink ?? 0) > 0);
  assert.ok((profile.fingerprintScores['warm-milk-tea-quiet-wind-down'] ?? 0) > 0);
});

test('Stage 5.6: Only explicitly Completed surprises enter Our Care Moments with isSurprise flag and zero duplicates', () => {
  const scheduled = createSurpriseCareRecord({
    id: 'surp-moment-1',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: sampleRecommendation(),
    careCategory: 'thoughtful_gesture',
    title: 'Warm Herbal Tea Surprise',
    actionDescription: 'Brew chamomile tea',
    content: 'Left a warm cup on your desk.',
    deliveryMode: 'keep_surprise',
    revealAt: '2026-11-13T17:00:00.000Z',
    visibility: 'shared',
    nowISO: '2026-11-13T15:00:00.000Z',
  });

  // Scheduled -> NOT a moment
  assert.equal(
    buildCareMomentFromSurprise(scheduled, { dateISO: '2026-11-13', timeLabel: '5:00 PM' }),
    null
  );

  // Revealed (not yet completed) -> NOT a moment
  const revealed = revealSurpriseCareRecord(scheduled, 'jamie', '2026-11-13T17:05:00.000Z').record;
  assert.equal(
    buildCareMomentFromSurprise(revealed, { dateISO: '2026-11-13', timeLabel: '5:05 PM' }),
    null
  );

  // Completed -> added cleanly with isSurprise: true
  const completed = completeSurpriseCareRecord(
    revealed,
    'jamie',
    '2026-11-13T19:00:00.000Z'
  );
  assert.equal(completed.completed, true);

  const afterAdd = upsertSurpriseCareMoment([], completed.record, {
    dateISO: '2026-11-13',
    timeLabel: '7:00 PM',
  });
  assert.equal(afterAdd.length, 1);
  assert.equal(afterAdd[0].isSurprise, true);
  assert.equal(afterAdd[0].surpriseCareId, 'surp-moment-1');
  assert.equal(afterAdd[0].surpriseCategory, 'thoughtful_gesture');
  assert.equal(afterAdd[0].sharedVisibility, true);

  // Duplicate upsert does not create a second Care Moment
  const afterDup = upsertSurpriseCareMoment(afterAdd, completed.record, {
    dateISO: '2026-11-13',
    timeLabel: '7:05 PM',
  });
  assert.equal(afterDup.length, 1);
});

test('Stage 5.6: Demo reset clean state, Free membership availability, and 3-language i18n parity', () => {
  const initialDemo = createInitialPresentationInteractions();
  assert.deepEqual(initialDemo.surpriseCareRecords, []);

  // Core AI Care & Surprise Care works on Free tier as well as Premium
  const freeCaps = getMembershipCapabilities(
    { tier: 'free', plan: 'monthly', startDateISO: null, purchasedBy: null, isSimulated: true },
    true
  );
  assert.equal(freeCaps.canGenerateAiCare(0), true);

  // Check 3-language key parity for surpriseCare & activityTemplates
  const enSurpriseKeys = Object.keys(TRANSLATIONS.en.surpriseCare).sort();
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-CN'].surpriseCare).sort(), enSurpriseKeys);
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-TW'].surpriseCare).sort(), enSurpriseKeys);

  const enModalKeys = Object.keys(TRANSLATIONS.en.surpriseCare.modal).sort();
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-CN'].surpriseCare.modal).sort(), enModalKeys);
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-TW'].surpriseCare.modal).sort(), enModalKeys);

  const enRecipientKeys = Object.keys(TRANSLATIONS.en.surpriseCare.recipient).sort();
  assert.deepEqual(
    Object.keys(TRANSLATIONS['zh-CN'].surpriseCare.recipient).sort(),
    enRecipientKeys
  );
  assert.deepEqual(
    Object.keys(TRANSLATIONS['zh-TW'].surpriseCare.recipient).sort(),
    enRecipientKeys
  );

  const enActKeys = Object.keys(TRANSLATIONS.en.activityTemplates).sort();
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-CN'].activityTemplates).sort(), enActKeys);
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-TW'].activityTemplates).sort(), enActKeys);
});
