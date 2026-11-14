import type {
  AiCareCategory,
  AiCareRecommendation,
  RecentSuggestionRecord,
} from '../types/aiCare.ts';
import { normalizeRecommendationMetadata } from './recommendationMetadata.ts';

export const RECENT_HISTORY_LIMIT = 12;
export const DEFAULT_COOLDOWN_WINDOW = 6; // last 6 generated suggestions are in active cooldown

function tokenizeContent(text: string): Set<string> {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'your',
    'their',
    'that',
    'this',
    'from',
    'into',
    'about',
    'today',
    'tonight',
    'make',
    'send',
    'give',
    'offer',
    'share',
    'keep',
  ]);
  const rawTokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 3 && !stopWords.has(tok));
  return new Set(rawTokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((tok) => {
    if (b.has(tok)) intersection++;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks whether a recommendation substantially duplicates a recent suggestion
 * across different Gemini-generated IDs by comparing normalized fingerprint,
 * actionType + category, and actual action content (not title similarity alone).
 */
export function isSubstantiallyDuplicateSuggestion(
  candidate: Pick<
    AiCareRecommendation,
    'title' | 'category' | 'action' | 'why' | 'suggestedTiming' | 'actionType' | 'communicationStyle' | 'fingerprint'
  >,
  recentItem: RecentSuggestionRecord
): boolean {
  const meta = normalizeRecommendationMetadata(candidate);
  if (meta.fingerprint === recentItem.fingerprint) {
    return true;
  }

  // Same category + same specific actionType (when not generic) counts as substantially similar
  if (
    meta.category === recentItem.category &&
    meta.actionType === recentItem.actionType &&
    meta.actionType !== 'thoughtful_care'
  ) {
    return true;
  }

  // Content overlap on action + title (not title alone)
  const candContent = tokenizeContent(`${candidate.title} ${candidate.action}`);
  const recentContent = tokenizeContent(recentItem.title);
  if (
    meta.category === recentItem.category &&
    jaccardSimilarity(candContent, recentContent) >= 0.72
  ) {
    return true;
  }

  return false;
}

export function isRecommendationInCooldown(
  candidate: AiCareRecommendation,
  recentHistory: RecentSuggestionRecord[],
  cooldownWindow = DEFAULT_COOLDOWN_WINDOW
): boolean {
  const activeCooldownSlice = recentHistory.slice(0, cooldownWindow);
  return activeCooldownSlice.some((item) => isSubstantiallyDuplicateSuggestion(candidate, item));
}

/**
 * Selects up to `limit` recommendations ensuring:
 * 1. Cooldown suggestions are deprioritized unless needed to reach `limit`.
 * 2. Category diversity is maximized across the batch (different categories preferred),
 *    while still allowing previously used categories when relevant on later generations.
 */
export function diversifyRecommendations(
  recommendations: AiCareRecommendation[],
  recentHistory: RecentSuggestionRecord[],
  limit = 3
): AiCareRecommendation[] {
  if (recommendations.length <= 1) return recommendations.slice(0, limit);

  const normalized = recommendations.map((rec) => {
    const meta = normalizeRecommendationMetadata(rec);
    return {
      ...rec,
      actionType: meta.actionType,
      communicationStyle: meta.communicationStyle,
      effortLevel: meta.effortLevel,
      requiresSpendingMoney: meta.requiresSpendingMoney,
      tags: meta.tags,
      fingerprint: meta.fingerprint,
    };
  });

  // Deduplicate within the same batch by fingerprint
  const uniqueInBatch: AiCareRecommendation[] = [];
  const seenFingerprints = new Set<string>();
  for (const rec of normalized) {
    const fp = rec.fingerprint ?? rec.id;
    if (!seenFingerprints.has(fp)) {
      seenFingerprints.add(fp);
      uniqueInBatch.push(rec);
    }
  }

  // Partition into non-cooldown and cooldown items
  const fresh = uniqueInBatch.filter((rec) => !isRecommendationInCooldown(rec, recentHistory));
  const cooled = uniqueInBatch.filter((rec) => isRecommendationInCooldown(rec, recentHistory));
  const orderedPool = [...fresh, ...cooled];

  // Pick with category diversity first
  const selected: AiCareRecommendation[] = [];
  const usedCategories = new Set<AiCareCategory>();

  for (const rec of orderedPool) {
    if (selected.length >= limit) break;
    if (!usedCategories.has(rec.category)) {
      selected.push(rec);
      usedCategories.add(rec.category);
    }
  }

  // Fill remaining slots if fewer than `limit` distinct categories were present
  for (const rec of orderedPool) {
    if (selected.length >= limit) break;
    if (!selected.some((s) => s.id === rec.id && s.fingerprint === rec.fingerprint)) {
      selected.push(rec);
    }
  }

  return selected.slice(0, limit);
}

export function appendToRecentSuggestionHistory(
  existing: RecentSuggestionRecord[],
  recommendations: AiCareRecommendation[],
  generatedAtISO = new Date().toISOString()
): RecentSuggestionRecord[] {
  const newRecords: RecentSuggestionRecord[] = recommendations.map((rec) => {
    const meta = normalizeRecommendationMetadata(rec);
    return {
      id: rec.id,
      title: rec.title,
      category: rec.category,
      actionType: meta.actionType,
      communicationStyle: meta.communicationStyle,
      fingerprint: meta.fingerprint,
      generatedAtISO,
    };
  });

  // Prepend newest, keeping most recent occurrence per fingerprint
  const combined = [...newRecords, ...existing];
  const deduped: RecentSuggestionRecord[] = [];
  const seen = new Set<string>();
  for (const item of combined) {
    if (!seen.has(item.fingerprint)) {
      seen.add(item.fingerprint);
      deduped.push(item);
    }
  }
  return deduped.slice(0, RECENT_HISTORY_LIMIT);
}
