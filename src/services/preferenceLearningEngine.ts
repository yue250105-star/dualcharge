import type {
  AiCareCategory,
  AiCareCommunicationStyle,
  AiCareEffortLevel,
  AiCareRecommendationMetadata,
  CareFeedbackEvent,
  CompactLearnedProfileForPrompt,
  LearnedPreferenceProfile,
  LearningMaturityLevel,
  PreferenceScoreChangeRecord,
  RecipientFeedbackType,
} from '../types/aiCare.ts';
import { AI_CARE_CATEGORIES } from './aiCareSchema.ts';
import {
  AI_CARE_COMMUNICATION_STYLES,
  AI_CARE_EFFORT_LEVELS,
  normalizeTimingBucket,
} from './recommendationMetadata.ts';

export const FEEDBACK_BASE_WEIGHTS: Record<RecipientFeedbackType, number> = {
  helpful: 1,
  more_like_this: 2,
  not_relevant: -2,
  not_helpful: -1.5,
  not_suitable: -2.5,
};

export const INFLUENCE_TIERS = {
  fingerprint: 1.0,
  actionType: 0.75,
  communicationStyle: 0.75,
  effortLevel: 0.5,
  timing: 0.5,
  lowCost: 0.5,
  tag: 0.45,
  category: 0.4,
} as const;

export const SCORE_MIN = -5;
export const SCORE_MAX = 5;

export function clampPreferenceScore(score: number): number {
  const clamped = Math.max(SCORE_MIN, Math.min(SCORE_MAX, score));
  return Math.round(clamped * 100) / 100;
}

export function computeLearningMaturity(totalFeedbackCount: number): LearningMaturityLevel {
  if (totalFeedbackCount >= 6) return 'Established';
  if (totalFeedbackCount >= 3) return 'Developing';
  return 'Initial';
}

export interface ExplicitPreferencesContext {
  preferredCareLabels: string[];
  avoidLabels: string[];
  communicationStyleLabel?: string | null;
}

export interface RecordFeedbackInput {
  events: CareFeedbackEvent[];
  actor: string;
  recipient: string;
  suggestionId: string;
  suggestionTitle: string;
  feedbackType: RecipientFeedbackType;
  metadata: AiCareRecommendationMetadata;
  timestampISO?: string;
  surpriseCareId?: string;
}

export interface RecordFeedbackResult {
  accepted: boolean;
  reason?: 'actor_must_be_recipient' | 'duplicate_feedback';
  replacedPrevious?: boolean;
  events: CareFeedbackEvent[];
  event?: CareFeedbackEvent;
}

/**
 * Records explicit recipient feedback.
 * Enforces:
 * - Only the recipient may record recipient preference feedback (actor === recipient).
 * - Duplicate feedback on the same suggestionId (or surpriseCareId) is rejected.
 * - Switching feedback on the same suggestionId / surpriseCareId replaces the earlier event to avoid contradictions.
 */
export function recordRecipientFeedbackEvent(input: RecordFeedbackInput): RecordFeedbackResult {
  const {
    events,
    actor,
    recipient,
    suggestionId,
    suggestionTitle,
    feedbackType,
    metadata,
    timestampISO = new Date().toISOString(),
    surpriseCareId,
  } = input;

  if (!actor || !recipient || actor !== recipient) {
    return {
      accepted: false,
      reason: 'actor_must_be_recipient',
      events,
    };
  }

  const matchesSameTarget = (e: CareFeedbackEvent) => {
    if (e.recipient !== recipient) return false;
    if (surpriseCareId) {
      return e.surpriseCareId === surpriseCareId;
    }
    return !e.surpriseCareId && e.suggestionId === suggestionId;
  };

  const existingForTarget = events.find(matchesSameTarget);

  if (existingForTarget && existingForTarget.feedbackType === feedbackType) {
    return {
      accepted: false,
      reason: 'duplicate_feedback',
      events,
    };
  }

  const newEvent: CareFeedbackEvent = {
    eventId: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actor,
    recipient,
    suggestionId,
    suggestionTitle,
    fingerprint: metadata.fingerprint,
    feedbackType,
    timestampISO,
    metadata,
    ...(surpriseCareId ? { surpriseCareId } : {}),
  };

  const filtered = events.filter((e) => !matchesSameTarget(e));

  return {
    accepted: true,
    replacedPrevious: Boolean(existingForTarget),
    events: [...filtered, newEvent].slice(-50),
    event: newEvent,
  };
}

function explicitPreferencesProtectCategory(
  category: AiCareCategory,
  explicit?: ExplicitPreferencesContext
): boolean {
  if (!explicit) return false;
  const combined = explicit.preferredCareLabels.join(' ').toLowerCase();
  if (category === 'Emotional Support') {
    return /message|note|check-in|问候|問候|鼓励|鼓勵/.test(combined);
  }
  if (category === 'Practical Help') {
    return /tea|drink|meal|dinner|chore|热饮|熱飲|奶茶|果茶|餐/.test(combined);
  }
  if (category === 'Rest & Recovery') {
    return /quiet|rest|calm|安静|安靜|休息/.test(combined);
  }
  if (category === 'Quality Time') {
    return /walk|together|dinner|散步|陪伴/.test(combined);
  }
  if (category === 'Small Surprise') {
    return /surprise|note|惊喜|驚喜/.test(combined);
  }
  return false;
}

function explicitPreferencesProtectActionType(
  actionType: string,
  explicit?: ExplicitPreferencesContext
): boolean {
  if (!explicit) return false;
  const combined = explicit.preferredCareLabels.join(' ').toLowerCase();
  if (actionType === 'warm_drink') return /tea|drink|热饮|熱飲|奶茶|果茶/.test(combined);
  if (actionType === 'evening_walk') return /walk|散步/.test(combined);
  if (actionType === 'quiet_evening') return /quiet|rest|安静|安靜/.test(combined);
  if (actionType === 'light_meal') return /meal|dinner|清淡|餐/.test(combined);
  if (actionType === 'supportive_message') return /message|check-in|问候|問候|消息|訊息/.test(combined);
  if (actionType === 'handwritten_note') return /surprise|note|惊喜|驚喜/.test(combined);
  return false;
}

export function deriveLearnedPreferenceProfile(
  recipientId: string,
  events: CareFeedbackEvent[],
  explicitPreferences?: ExplicitPreferencesContext
): LearnedPreferenceProfile {
  const recipientEvents = [...events]
    .filter((e) => e.recipient === recipientId && e.actor === recipientId)
    .sort((a, b) => a.timestampISO.localeCompare(b.timestampISO));

  const categoryScores: Partial<Record<AiCareCategory, number>> = {};
  const communicationStyleScores: Partial<Record<AiCareCommunicationStyle, number>> = {};
  const actionTypeScores: Record<string, number> = {};
  const effortLevelScores: Partial<Record<AiCareEffortLevel, number>> = {};
  const timingScores: Record<string, number> = {};
  const fingerprintScores: Record<string, number> = {};
  const tagScores: Record<string, number> = {};
  let lowCostScore = 0;

  let positiveFeedbackCount = 0;
  let negativeFeedbackCount = 0;
  const auditLog: PreferenceScoreChangeRecord[] = [];

  const total = recipientEvents.length;

  const applyScoreDelta = (
    map: Record<string, number>,
    key: string,
    delta: number,
    ev: CareFeedbackEvent,
    targetType: PreferenceScoreChangeRecord['targetType'],
    note: string
  ) => {
    const prev = map[key] ?? 0;
    const next = clampPreferenceScore(prev + delta);
    map[key] = next;
    auditLog.push({
      eventId: ev.eventId,
      timestampISO: ev.timestampISO,
      feedbackType: ev.feedbackType,
      suggestionId: ev.suggestionId,
      fingerprint: ev.fingerprint,
      targetType,
      targetKey: key,
      delta: Math.round(delta * 100) / 100,
      previousScore: prev,
      newScore: next,
      note,
    });
  };

  recipientEvents.forEach((ev, idx) => {
    const baseWeight = FEEDBACK_BASE_WEIGHTS[ev.feedbackType];
    if (baseWeight > 0) positiveFeedbackCount++;
    if (baseWeight < 0) negativeFeedbackCount++;

    // Gentle recency factor: recent events carry slightly more weight without wiping out prior history
    const recencyMultiplier = total <= 1 ? 1 : 0.8 + 0.3 * ((idx + 1) / total);
    const weighted = baseWeight * recencyMultiplier;

    const meta = ev.metadata;
    const timingBucket = normalizeTimingBucket(meta.suggestedTiming);

    applyScoreDelta(
      fingerprintScores,
      meta.fingerprint,
      weighted * INFLUENCE_TIERS.fingerprint,
      ev,
      'fingerprint',
      'Exact suggestion fingerprint signal'
    );

    applyScoreDelta(
      actionTypeScores,
      meta.actionType,
      weighted * INFLUENCE_TIERS.actionType,
      ev,
      'actionType',
      'Action type preference signal'
    );

    applyScoreDelta(
      communicationStyleScores as Record<string, number>,
      meta.communicationStyle,
      weighted * INFLUENCE_TIERS.communicationStyle,
      ev,
      'communicationStyle',
      'Communication style preference signal'
    );

    applyScoreDelta(
      effortLevelScores as Record<string, number>,
      meta.effortLevel,
      weighted * INFLUENCE_TIERS.effortLevel,
      ev,
      'effortLevel',
      'Effort level preference signal'
    );

    applyScoreDelta(
      timingScores,
      timingBucket,
      weighted * INFLUENCE_TIERS.timing,
      ev,
      'timing',
      'Timing bucket preference signal'
    );

    // Low-cost / free signal:
    // - Positive feedback on free item boosts lowCostScore (+).
    // - Negative feedback on paid item ALSO boosts lowCostScore (+) so paid items are avoided without banning the category!
    const lowCostDelta = meta.requiresSpendingMoney
      ? -weighted * INFLUENCE_TIERS.lowCost
      : weighted > 0
        ? weighted * INFLUENCE_TIERS.lowCost
        : 0;
    if (lowCostDelta !== 0) {
      const prevLow = lowCostScore;
      lowCostScore = clampPreferenceScore(prevLow + lowCostDelta);
      auditLog.push({
        eventId: ev.eventId,
        timestampISO: ev.timestampISO,
        feedbackType: ev.feedbackType,
        suggestionId: ev.suggestionId,
        fingerprint: ev.fingerprint,
        targetType: 'lowCost',
        targetKey: 'free_low_cost',
        delta: Math.round(lowCostDelta * 100) / 100,
        previousScore: prevLow,
        newScore: lowCostScore,
        note: meta.requiresSpendingMoney
          ? 'Paid suggestion feedback adjusted low-cost preference'
          : 'Free/non-commercial suggestion feedback',
      });
    }

    for (const tag of meta.tags) {
      if (tag === 'paid' || tag === 'free_low_cost') continue;
      applyScoreDelta(
        tagScores,
        tag,
        weighted * INFLUENCE_TIERS.tag,
        ev,
        'tag',
        'Tag preference signal'
      );
    }

    // Category gets weaker influence (0.4x) so rejecting one specific item doesn't ban the entire category
    applyScoreDelta(
      categoryScores as Record<string, number>,
      meta.category,
      weighted * INFLUENCE_TIERS.category,
      ev,
      'category',
      'General category signal (weaker tier)'
    );
  });

  // Sort preferred & negatively rated attributes
  const preferredCategories = AI_CARE_CATEGORIES.filter(
    (cat) => (categoryScores[cat] ?? 0) >= 0.4
  ).sort((a, b) => (categoryScores[b] ?? 0) - (categoryScores[a] ?? 0));

  const preferredCommunicationStyles = AI_CARE_COMMUNICATION_STYLES.filter(
    (style) => (communicationStyleScores[style] ?? 0) >= 0.7
  ).sort((a, b) => (communicationStyleScores[b] ?? 0) - (communicationStyleScores[a] ?? 0));

  const preferredActionTypes = Object.entries(actionTypeScores)
    .filter(([, score]) => score >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const preferredTimings = Object.entries(timingScores)
    .filter(([, score]) => score >= 0.5)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const preferredEffortLevels = AI_CARE_EFFORT_LEVELS.filter(
    (lvl) => (effortLevelScores[lvl] ?? 0) >= 0.5
  ).sort((a, b) => (effortLevelScores[b] ?? 0) - (effortLevelScores[a] ?? 0));

  // Threshold for category deprioritization is -1.4 (requires repeated negative signals, not 1 rejection of an expensive gift)
  // Explicit profile preferences override conflicting inferred negatives!
  const negativeCategories = AI_CARE_CATEGORIES.filter(
    (cat) =>
      (categoryScores[cat] ?? 0) <= -1.4 &&
      !explicitPreferencesProtectCategory(cat, explicitPreferences)
  );

  const negativeActionTypes = Object.entries(actionTypeScores)
    .filter(
      ([key, score]) =>
        score <= -1.0 && !explicitPreferencesProtectActionType(key, explicitPreferences)
    )
    .map(([key]) => key);

  const negativeCommunicationStyles = AI_CARE_COMMUNICATION_STYLES.filter(
    (style) => (communicationStyleScores[style] ?? 0) <= -1.2
  );

  const negativeTags = Object.entries(tagScores)
    .filter(([, score]) => score <= -1.2)
    .map(([key]) => key);

  const negativeFingerprints = Object.entries(fingerprintScores)
    .filter(([, score]) => score <= -1.0)
    .map(([key]) => key);

  const lastUpdatedISO =
    recipientEvents.length > 0 ? recipientEvents[recipientEvents.length - 1].timestampISO : null;

  return {
    recipientId,
    preferredCategories,
    preferredCommunicationStyles,
    preferredActionTypes,
    preferredTimings,
    preferredEffortLevels,
    prefersFreeOrLowCost: lowCostScore >= 0,
    negativelyRatedAttributes: {
      categories: negativeCategories,
      actionTypes: negativeActionTypes,
      communicationStyles: negativeCommunicationStyles,
      tags: negativeTags,
      fingerprints: negativeFingerprints,
      avoidPaidSuggestions: lowCostScore >= 0.8,
    },
    categoryScores,
    communicationStyleScores,
    actionTypeScores,
    effortLevelScores,
    timingScores,
    fingerprintScores,
    tagScores,
    lowCostScore,
    totalFeedbackCount: total,
    positiveFeedbackCount,
    negativeFeedbackCount,
    learningMaturity: computeLearningMaturity(total),
    lastUpdatedISO,
    auditLog,
  };
}

export function summarizeProfileForGemini(
  profile: LearnedPreferenceProfile
): CompactLearnedProfileForPrompt {
  return {
    learningMaturity: profile.learningMaturity,
    totalFeedbackCount: profile.totalFeedbackCount,
    positiveFeedbackCount: profile.positiveFeedbackCount,
    negativeFeedbackCount: profile.negativeFeedbackCount,
    preferredCategories: profile.preferredCategories.slice(0, 4),
    preferredCommunicationStyles: profile.preferredCommunicationStyles.slice(0, 3),
    preferredActionTypes: profile.preferredActionTypes.slice(0, 5),
    preferredTimings: profile.preferredTimings.slice(0, 3),
    preferredEffortLevels: profile.preferredEffortLevels.slice(0, 2),
    prefersFreeOrLowCost: profile.prefersFreeOrLowCost,
    negativelyRatedAttributes: {
      categories: profile.negativelyRatedAttributes.categories.slice(0, 3),
      actionTypes: profile.negativelyRatedAttributes.actionTypes.slice(0, 5),
      communicationStyles: profile.negativelyRatedAttributes.communicationStyles.slice(0, 3),
      tags: profile.negativelyRatedAttributes.tags.slice(0, 6),
      fingerprints: profile.negativelyRatedAttributes.fingerprints.slice(0, 8),
      avoidPaidSuggestions: profile.negativelyRatedAttributes.avoidPaidSuggestions,
    },
  };
}
