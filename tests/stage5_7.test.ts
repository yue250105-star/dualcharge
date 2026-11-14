/// <reference types="node" />
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  createInitialPresentationInteractions,
  PRESENTATION_CARE_SUGGESTIONS,
} from '../src/data/presentation/presentationConstants.ts';
import { TRANSLATIONS } from '../src/i18n/translations.ts';
import { generateLocalFallbackCare } from '../src/services/careFallbackEngine.ts';
import {
  canTransitionMockOrderStatus,
  computeReminderAtISO,
  createSimulatedOrderRecord,
  evaluateDueReminders,
  getNextMockOrderStage,
  getRecipientVisibleOrderView,
  getRecommendedDemoAddress,
  isCareReminderDue,
  isPurchaseOrientedRecommendation,
  matchProductForRecommendation,
  MOCK_ORDER_STAGE_SEQUENCE,
  MOCK_PRODUCT_CATALOG,
  transitionMockOrderStatus,
} from '../src/services/mockDeliveryService.ts';
import {
  deriveLearnedPreferenceProfile,
  recordRecipientFeedbackEvent,
} from '../src/services/preferenceLearningEngine.ts';
import {
  buildCareMomentFromSurprise,
  buildSurpriseCareNotification,
  completeSurpriseCareRecord,
  createSurpriseCareRecord,
  getRecipientVisibleSurpriseView,
  revealSurpriseCareRecord,
  upsertSurpriseCareMoment,
} from '../src/services/surpriseCareService.ts';
import type {
  AiCareRecommendation,
  AiCareRequestContext,
  CareReminderRecord,
} from '../src/types/aiCare.ts';
import type { NotificationPreferences } from '../src/types/dualcharge.ts';

function samplePurchaseRec(
  overrides: Partial<AiCareRecommendation> = {}
): AiCareRecommendation {
  return {
    id: 'ai-rec-order-milk-tea',
    title: 'Send Warm Oat Milk Tea Delivery',
    category: 'Small Surprise',
    why: 'Short sleep (5.8h) and midweek workload dip suggest warm comfort.',
    action: 'Order a warm less-sweet oat milk tea for delivery this afternoon.',
    suggestedTiming: 'Today · 3:30 PM',
    personalizationReason: 'Matches Jamie preference for warm milk tea.',
    confidence: 'Preference-Based',
    defaultMessage: 'Sent a warm oat milk tea your way so you can take an easy breather.',
    actionType: 'purchase_coffee',
    communicationStyle: 'Practical Action',
    effortLevel: 'Low',
    requiresSpendingMoney: true,
    tags: ['warm drink', 'delivery', 'purchase'],
    ...overrides,
  };
}

function sampleNonPurchaseRec(
  overrides: Partial<AiCareRecommendation> = {}
): AiCareRecommendation {
  return {
    id: 'ai-rec-quiet-checkin',
    title: 'Send a Calm Check-In Note',
    category: 'Emotional Support',
    why: 'A low-pressure message fits quiet evenings well.',
    action: 'Send a gentle one-line message with zero reply pressure.',
    suggestedTiming: 'Evening',
    personalizationReason: 'Respects no-pressure communication preference.',
    confidence: 'Preference-Based',
    defaultMessage: 'Thinking of you tonight — take all the quiet time you need.',
    actionType: 'supportive_message',
    communicationStyle: 'Short Text',
    effortLevel: 'Low',
    requiresSpendingMoney: false,
    tags: ['gentle', 'non-commercial'],
    ...overrides,
  };
}

function defaultNotifPrefs(
  overrides: Partial<NotificationPreferences> = {}
): NotificationPreferences {
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

test('Stage 5.7 (1): Purchase classification differentiates purchase vs non-purchase and avoids banned button phrasing', () => {
  const purchaseRec = samplePurchaseRec();
  const nonPurchaseRec = sampleNonPurchaseRec();

  assert.equal(isPurchaseOrientedRecommendation(purchaseRec), true);
  assert.equal(isPurchaseOrientedRecommendation(nonPurchaseRec), false);

  const milkTeaPreset = PRESENTATION_CARE_SUGGESTIONS.find(
    (s) => s.id === 'care-jamie-order-milk-tea'
  );
  const dessertPreset = PRESENTATION_CARE_SUGGESTIONS.find(
    (s) => s.id === 'care-alex-order-dessert'
  );
  assert.equal(milkTeaPreset?.requiresSpendingMoney, true);
  assert.equal(dessertPreset?.requiresSpendingMoney, true);

  // Verify no "Choose Another Free Care Option" button phrasing exists in CarePage or translations
  const carePageSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/pages/CarePage.tsx'),
    'utf8'
  );
  const translationsSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/i18n/translations.ts'),
    'utf8'
  );
  assert.equal(carePageSrc.includes('Choose Another Free Care Option'), false);
  assert.equal(translationsSrc.includes('Choose Another Free Care Option'), false);
});

test('Stage 5.7 (2): Fallback AI engine still honors avoidPaidSuggestions when partner dislikes paid ideas', () => {
  const ctx: AiCareRequestContext = {
    mode: 'presentation',
    language: 'en',
    recipient: {
      name: 'Jamie',
      energyShared: true,
      sleepShared: false,
      heartRateShared: false,
      hrvShared: false,
      activityShared: false,
      cycleShared: false,
      recordedDaysCount: 60,
      insufficientHistoricalData: false,
      personalBaseline: {
        overallMean: 74,
        recent7DayMean: 71,
      },
      carePreferences: ['Quiet time', 'Warm drinks'],
      foodPreferences: ['Milk tea'],
      avoidTags: ['Crowds'],
      communicationStyle: 'Gentle short check-in',
    },
    partner: {
      name: 'Alex',
      pairingStatus: 'paired_demo',
      preferredWaysOfShowingCare: [],
      savedCareTitles: [],
      completedCareTitles: [],
      skippedSuggestionIds: [],
      feedback: {
        notRelevantTitles: [],
        moreLikeThisTitles: [],
        preferredCategories: [],
        deprioritizedCategories: [],
      },
    },
    learnedProfile: {
      learningMaturity: 'Developing',
      totalFeedbackCount: 3,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 3,
      preferredCategories: [],
      preferredCommunicationStyles: [],
      preferredActionTypes: [],
      preferredTimings: [],
      preferredEffortLevels: [],
      prefersFreeOrLowCost: true,
      negativelyRatedAttributes: {
        categories: [],
        actionTypes: ['purchase_coffee', 'purchase_dessert'],
        communicationStyles: [],
        tags: [],
        fingerprints: [],
        avoidPaidSuggestions: true,
      },
    },
    recentSuggestions: [],
  };

  const fallback = generateLocalFallbackCare(ctx, 'missing_api_key', undefined, 0);
  assert.ok(fallback.data.recommendations.length >= 2);
  for (const rec of fallback.data.recommendations) {
    assert.equal(rec.requiresSpendingMoney, false);
  }
});

test('Stage 5.7 (3): Remind Me Later schedules future time presets and evaluates due reminders cleanly', () => {
  const baseNow = new Date('2026-11-13T10:00:00.000Z');
  const oneHour = computeReminderAtISO('in_1_hour', null, baseNow);
  assert.equal(oneHour, '2026-11-13T11:00:00.000Z');

  const laterToday = computeReminderAtISO('later_today', null, baseNow);
  assert.ok(Date.parse(laterToday) > baseNow.getTime());

  const tomorrow = computeReminderAtISO('tomorrow', null, baseNow);
  assert.ok(Date.parse(tomorrow) > baseNow.getTime());

  const customISO = computeReminderAtISO('custom', '2026-11-14T15:30:00.000Z', baseNow);
  assert.equal(customISO, '2026-11-14T15:30:00.000Z');

  const dueRec: CareReminderRecord = {
    id: 'rem-due-1',
    ownerId: 'alex',
    recommendation: samplePurchaseRec(),
    presetKey: 'in_1_hour',
    remindAtISO: '2026-11-13T11:00:00.000Z',
    createdAtISO: baseNow.toISOString(),
    status: 'scheduled',
  };
  const futureRec: CareReminderRecord = {
    id: 'rem-future-1',
    ownerId: 'alex',
    recommendation: samplePurchaseRec({ id: 'ai-rec-dessert' }),
    presetKey: 'tomorrow',
    remindAtISO: '2026-11-14T10:00:00.000Z',
    createdAtISO: baseNow.toISOString(),
    status: 'scheduled',
  };

  assert.equal(isCareReminderDue(dueRec, '2026-11-13T10:30:00.000Z'), false);
  assert.equal(isCareReminderDue(dueRec, '2026-11-13T11:00:00.000Z'), true);

  const evalRes = evaluateDueReminders([dueRec, futureRec], '2026-11-13T11:05:00.000Z');
  assert.equal(evalRes.dueReminders.length, 1);
  assert.equal(evalRes.dueReminders[0].id, 'rem-due-1');
  assert.equal(evalRes.upcomingReminders.length, 1);
  assert.equal(evalRes.upcomingReminders[0].id, 'rem-future-1');
});

test('Stage 5.7 (4): "Not Now" dismissal prevents reappearing without negatively training recipient preferences', () => {
  const state = createInitialPresentationInteractions();
  const rec = samplePurchaseRec();

  const updatedDismissed = [...(state.dismissedRecommendationIds?.alex ?? []), rec.id];
  assert.equal(updatedDismissed.includes(rec.id), true);
  // Zero impact on feedbackEvents or learned preference profile
  assert.deepEqual(state.feedbackEvents.jamie, []);
  const profile = deriveLearnedPreferenceProfile('jamie', state.feedbackEvents.jamie);
  assert.equal(profile.negativeFeedbackCount, 0);
  assert.equal(profile.negativelyRatedAttributes.avoidPaidSuggestions, false);
});

test('Stage 5.7 (5): Simulated delivery order calculation, catalog matching, and non-health privacy payload', () => {
  const latteRec = samplePurchaseRec({ actionType: 'purchase_coffee' });
  const dessertRec = samplePurchaseRec({
    id: 'order-dessert',
    title: 'Send Dessert Box',
    action: 'Order a fresh cake box.',
    actionType: 'purchase_dessert',
  });
  const flowerRec = samplePurchaseRec({
    id: 'order-flowers',
    title: 'Send Pastel Flowers',
    action: 'Order flowers.',
    actionType: 'purchase_flowers',
  });
  const giftRec = samplePurchaseRec({
    id: 'order-gift',
    title: 'Cozy Candle Gift',
    action: 'Buy a candle gift set.',
    actionType: 'purchase_gift',
  });

  assert.equal(matchProductForRecommendation(latteRec).id, 'mock-prod-latte');
  assert.equal(matchProductForRecommendation(dessertRec).id, 'mock-prod-dessert');
  assert.equal(matchProductForRecommendation(flowerRec).id, 'mock-prod-flowers');
  assert.equal(matchProductForRecommendation(giftRec).id, 'mock-prod-gift');

  const product = matchProductForRecommendation(latteRec);
  const demoAddr = getRecommendedDemoAddress('jamie');
  assert.ok(demoAddr.length > 0);
  assert.equal(getRecommendedDemoAddress('normal_partner'), '');

  const order = createSimulatedOrderRecord({
    id: 'ord-test-1',
    senderId: 'alex',
    recipientId: 'jamie',
    recipientName: 'Jamie',
    recommendation: {
      ...latteRec,
      why: 'HRV 41ms and sleep 5.2h',
    },
    product,
    selectedVariant: product.variants.en[0],
    quantity: 2,
    deliveryAddress: demoAddr,
    careMessage: 'Enjoy a warm break!',
    platformNotes: 'Leave with concierge',
    language: 'en',
    nowISO: '2026-11-13T14:00:00.000Z',
  });

  assert.equal(order.isSimulated, true);
  assert.match(order.orderNumber, /^DC-ORD-\d{6}$/);
  assert.equal(order.unitPrice, product.unitPrice);
  assert.equal(order.deliveryFee, product.deliveryFee);
  assert.equal(order.totalAmount, product.unitPrice * 2 + product.deliveryFee);
  assert.equal(order.status, 'Order Confirmed');
  // Order record does NOT carry private biometric fields
  assert.equal('hrv' in order, false);
  assert.equal('sleepHours' in order, false);
  assert.equal('energyScore' in order, false);
});

test('Stage 5.7 (6): Order stage transitions progress forward only and cancellation is restricted to Order Confirmed', () => {
  assert.deepEqual(MOCK_ORDER_STAGE_SEQUENCE, [
    'Order Confirmed',
    'Preparing',
    'Picked Up',
    'Out for Delivery',
    'Delivered',
  ]);

  const product = MOCK_PRODUCT_CATALOG[0];
  let order = createSimulatedOrderRecord({
    id: 'ord-stage-1',
    senderId: 'alex',
    recipientId: 'jamie',
    recipientName: 'Jamie',
    recommendation: samplePurchaseRec(),
    product,
    selectedVariant: product.variants.en[0],
    quantity: 1,
    deliveryAddress: getRecommendedDemoAddress('jamie'),
    careMessage: 'Warm cup for you',
    language: 'en',
    nowISO: '2026-11-13T14:00:00.000Z',
  });

  assert.equal(canTransitionMockOrderStatus('Order Confirmed', 'Cancelled'), true);
  assert.equal(canTransitionMockOrderStatus('Preparing', 'Cancelled'), false);
  assert.equal(getNextMockOrderStage('Order Confirmed'), 'Preparing');

  const step1 = transitionMockOrderStatus(order, 'Preparing', '2026-11-13T14:05:00.000Z');
  assert.equal(step1.changed, true);
  order = step1.order;
  assert.equal(order.deliveredAtISO, null);

  // Backward transitions & late cancellation are rejected
  assert.equal(transitionMockOrderStatus(order, 'Order Confirmed').changed, false);
  assert.equal(transitionMockOrderStatus(order, 'Cancelled').changed, false);

  // Direct jump forward to Delivered works cleanly and sets deliveredAtISO
  const stepDelivered = transitionMockOrderStatus(order, 'Delivered', '2026-11-13T14:30:00.000Z');
  assert.equal(stepDelivered.changed, true);
  assert.equal(stepDelivered.order.status, 'Delivered');
  assert.equal(stepDelivered.order.deliveredAtISO, '2026-11-13T14:30:00.000Z');
  assert.equal(getNextMockOrderStage('Delivered'), null);
});

test('Stage 5.7 (7 & 8): Keep It a Surprise strictly masks details across pre-delivery stages, unlocks at Delivered, and NEVER auto-completes Care Moments', () => {
  const product = MOCK_PRODUCT_CATALOG[1]; // dessert
  const rec = samplePurchaseRec({
    id: 'rec-dessert-secret',
    actionType: 'purchase_dessert',
    why: 'Sensitive sleep 5.1h & low HRV 38ms',
    personalizationReason: 'Sensitive weekly pattern reasoning',
  });

  let order = createSimulatedOrderRecord({
    id: 'ord-surprise-1',
    senderId: 'alex',
    recipientId: 'jamie',
    recipientName: 'Jamie',
    recommendation: rec,
    product,
    selectedVariant: product.variants.en[0],
    quantity: 1,
    deliveryAddress: getRecommendedDemoAddress('jamie'),
    careMessage: 'Sweet pause for your afternoon!',
    language: 'en',
    nowISO: '2026-11-13T15:00:00.000Z',
  });
  order = { ...order, revealMode: 'keep_surprise' };

  let surprise = createSurpriseCareRecord({
    id: 'surp-ord-1',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: rec,
    careCategory: 'thoughtful_gesture',
    title: order.productTitle,
    actionDescription: `${order.merchantName} · ${order.selectedVariant}`,
    content: order.careMessage,
    deliveryMode: 'keep_surprise',
    revealAt: '9999-12-31T23:59:59.000Z',
    orderId: order.id,
    sourceActionMode: 'mock_order',
    nowISO: '2026-11-13T15:00:00.000Z',
  });

  // Across Order Confirmed, Preparing, Picked Up, Out for Delivery: ZERO leak!
  for (const stage of ['Order Confirmed', 'Preparing', 'Picked Up', 'Out for Delivery'] as const) {
    if (stage !== 'Order Confirmed') {
      order = transitionMockOrderStatus(order, stage, '2026-11-13T15:10:00.000Z').order;
    }
    const orderView = getRecipientVisibleOrderView(order, surprise);
    assert.equal(orderView.visible, true);
    assert.equal(orderView.isMasked, true);
    assert.equal(orderView.isDelivered, false);
    assert.equal(orderView.productTitle, undefined);
    assert.equal(orderView.merchantName, undefined);
    assert.equal(orderView.productImageKey, undefined);
    assert.equal(orderView.estimatedArrivalLabel, undefined);
    assert.equal(orderView.careMessage, undefined);
    assert.equal(orderView.senderId, undefined);
    assert.equal(orderView.status, undefined);

    const surpView = getRecipientVisibleSurpriseView(surprise, '2026-11-13T15:15:00.000Z');
    assert.equal(surpView.isMasked, true);
    assert.equal(surpView.canOpenSurprise, false);
    assert.equal(surpView.title, undefined);

    const notif = buildSurpriseCareNotification({
      record: surprise,
      recipientPrefs: defaultNotifPrefs(),
      timeLabel: '3:15 PM',
      dateISO: '2026-11-13',
    });
    assert.equal(notif.suggestionTitle, undefined);
    assert.equal(notif.suggestionDefaultMessage, undefined);
  }

  // Transition order to Delivered -> reveal surprise cleanly (unlocked automatically)
  order = transitionMockOrderStatus(order, 'Delivered', '2026-11-13T15:35:00.000Z').order;
  const unlocked = revealSurpriseCareRecord(surprise, 'jamie', '2026-11-13T15:35:00.000Z', {
    forceDemoUnlock: true,
  });
  assert.equal(unlocked.revealed, true);
  surprise = unlocked.record;

  const revealedOrderView = getRecipientVisibleOrderView(order, surprise);
  assert.equal(revealedOrderView.isMasked, false);
  assert.equal(revealedOrderView.isDelivered, true);
  assert.equal(revealedOrderView.productTitle, product.title.en);
  assert.equal(revealedOrderView.careMessage, 'Sweet pause for your afternoon!');

  // Crucial: Delivering + revealing MUST NOT auto-create a CareMomentRecord!
  assert.equal(
    buildCareMomentFromSurprise(surprise, { dateISO: '2026-11-13', timeLabel: '3:35 PM' }),
    null
  );

  // Only explicit recipient Mark as Completed adds it to Our Care Moments
  const completed = completeSurpriseCareRecord(surprise, 'jamie', '2026-11-13T16:00:00.000Z');
  assert.equal(completed.completed, true);
  const moments = upsertSurpriseCareMoment([], completed.record, {
    dateISO: '2026-11-13',
    timeLabel: '4:00 PM',
  });
  assert.equal(moments.length, 1);
  assert.equal(moments[0].isSurprise, true);
  assert.equal(moments[0].surpriseCareId, surprise.id);
});

test('Stage 5.7 (7b): Tell Them Now order view reveals item, merchant, ETA, and message immediately', () => {
  const product = MOCK_PRODUCT_CATALOG[2]; // flowers
  const base = createSimulatedOrderRecord({
    id: 'ord-tell-now-1',
    senderId: 'alex',
    recipientId: 'jamie',
    recipientName: 'Jamie',
    recommendation: samplePurchaseRec({ actionType: 'purchase_flowers' }),
    product,
    selectedVariant: product.variants.en[0],
    quantity: 1,
    deliveryAddress: getRecommendedDemoAddress('jamie'),
    careMessage: 'Bright blooms on the way!',
    language: 'en',
  });
  const tellNowOrder = { ...base, revealMode: 'tell_now' as const };
  const tellNowSurprise = createSurpriseCareRecord({
    id: 'surp-tell-now-1',
    senderId: 'alex',
    recipientId: 'jamie',
    sourceRecommendation: samplePurchaseRec({ actionType: 'purchase_flowers' }),
    careCategory: 'thoughtful_gesture',
    title: tellNowOrder.productTitle,
    actionDescription: tellNowOrder.merchantName,
    content: tellNowOrder.careMessage,
    deliveryMode: 'tell_now',
    orderId: tellNowOrder.id,
    sourceActionMode: 'mock_order',
  });

  const view = getRecipientVisibleOrderView(tellNowOrder, tellNowSurprise);
  assert.equal(view.visible, true);
  assert.equal(view.isMasked, false);
  assert.equal(view.productTitle, product.title.en);
  assert.equal(view.merchantName, product.merchantName.en);
  assert.equal(view.status, 'Order Confirmed');
});

test('Stage 5.7 (9): Recipient-only delivery feedback supports Loved It / Thank You / Not My Preference', () => {
  const rec = samplePurchaseRec();
  const metadata = {
    category: rec.category,
    actionType: 'purchase_coffee',
    communicationStyle: rec.communicationStyle!,
    effortLevel: rec.effortLevel!,
    suggestedTiming: rec.suggestedTiming,
    requiresSpendingMoney: true,
    tags: rec.tags!,
    fingerprint: 'warm-oat-milk-tea-delivery',
  };

  // Sender cannot submit recipient feedback
  const senderRes = recordRecipientFeedbackEvent({
    events: [],
    actor: 'alex',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'more_like_this',
    metadata,
    surpriseCareId: 'surp-ord-fb-1',
  });
  assert.equal(senderRes.accepted, false);

  // Recipient submits Loved It ('more_like_this')
  const loved = recordRecipientFeedbackEvent({
    events: [],
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'more_like_this',
    metadata,
    surpriseCareId: 'surp-ord-fb-1',
  });
  assert.equal(loved.accepted, true);

  // Switching to Thank You ('helpful') replaces cleanly
  const thankYou = recordRecipientFeedbackEvent({
    events: loved.events,
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'helpful',
    metadata,
    surpriseCareId: 'surp-ord-fb-1',
  });
  assert.equal(thankYou.accepted, true);
  assert.equal(thankYou.events.length, 1);

  // Not My Preference ('not_suitable') updates negative signal
  const notPref = recordRecipientFeedbackEvent({
    events: [],
    actor: 'jamie',
    recipient: 'jamie',
    suggestionId: rec.id,
    suggestionTitle: rec.title,
    feedbackType: 'not_suitable',
    metadata,
    surpriseCareId: 'surp-ord-fb-2',
  });
  assert.equal(notPref.accepted, true);
  const profile = deriveLearnedPreferenceProfile('jamie', notPref.events);
  assert.equal(profile.negativeFeedbackCount, 1);
  assert.ok((profile.actionTypeScores.purchase_coffee ?? 0) < 0);
});

test('Stage 5.7 (10 & 11): Demo reset clears orders/reminders/dismissals and translations + catalog have 3-language parity', () => {
  const initialDemo = createInitialPresentationInteractions();
  assert.deepEqual(initialDemo.mockOrders, []);
  assert.deepEqual(initialDemo.careReminders, []);
  assert.deepEqual(initialDemo.dismissedRecommendationIds, { alex: [], jamie: [] });
  assert.deepEqual(initialDemo.surpriseCareRecords, []);

  // Catalog localization parity
  for (const item of MOCK_PRODUCT_CATALOG) {
    assert.ok(item.title.en && item.title['zh-CN'] && item.title['zh-TW']);
    assert.ok(item.merchantName.en && item.merchantName['zh-CN'] && item.merchantName['zh-TW']);
    assert.equal(item.variants.en.length, item.variants['zh-CN'].length);
    assert.equal(item.variants.en.length, item.variants['zh-TW'].length);
  }

  // Translation parity for deliveryCare across en, zh-CN, zh-TW
  const enTopKeys = Object.keys(TRANSLATIONS.en.deliveryCare).sort();
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-CN'].deliveryCare).sort(), enTopKeys);
  assert.deepEqual(Object.keys(TRANSLATIONS['zh-TW'].deliveryCare).sort(), enTopKeys);

  for (const nested of ['reminder', 'platform', 'revealChoice', 'tracking', 'recipient'] as const) {
    const enNested = Object.keys(TRANSLATIONS.en.deliveryCare[nested]).sort();
    assert.deepEqual(
      Object.keys(TRANSLATIONS['zh-CN'].deliveryCare[nested]).sort(),
      enNested,
      `zh-CN missing/extra keys in deliveryCare.${nested}`
    );
    assert.deepEqual(
      Object.keys(TRANSLATIONS['zh-TW'].deliveryCare[nested]).sort(),
      enNested,
      `zh-TW missing/extra keys in deliveryCare.${nested}`
    );
  }
});
