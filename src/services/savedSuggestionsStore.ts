import type { AiCareRecommendation, AiCareSavedItem } from '../types/aiCare.ts';
import { normalizeRecommendationMetadata } from './recommendationMetadata.ts';

export const MAX_SAVED_SUGGESTIONS = 40;

export function sortSavedSuggestionsNewestFirst(items: AiCareSavedItem[]): AiCareSavedItem[] {
  return [...items].sort((a, b) => (b.savedAtISO || '').localeCompare(a.savedAtISO || ''));
}

export function isSuggestionAlreadySaved(
  items: AiCareSavedItem[],
  candidate: { id: string; title: string; fingerprint?: string }
): boolean {
  const lowerTitle = candidate.title.trim().toLowerCase();
  return items.some(
    (item) =>
      item.id === candidate.id ||
      (candidate.fingerprint &&
        item.metadata?.fingerprint &&
        item.metadata.fingerprint === candidate.fingerprint) ||
      item.title.trim().toLowerCase() === lowerTitle
  );
}

export function saveSuggestionSnapshot(params: {
  existing: AiCareSavedItem[];
  recommendation: AiCareRecommendation;
  source: 'gemini' | 'fallback' | 'preset';
  ownerId: string;
  savedAtISO?: string;
}): { added: boolean; items: AiCareSavedItem[]; savedItem?: AiCareSavedItem } {
  const {
    existing,
    recommendation,
    source,
    ownerId,
    savedAtISO = new Date().toISOString(),
  } = params;

  const metadata = normalizeRecommendationMetadata(recommendation);

  if (
    isSuggestionAlreadySaved(existing, {
      id: recommendation.id,
      title: recommendation.title,
      fingerprint: metadata.fingerprint,
    })
  ) {
    return { added: false, items: existing };
  }

  const savedItem: AiCareSavedItem = {
    id: recommendation.id,
    title: recommendation.title,
    category: recommendation.category,
    action: recommendation.action,
    suggestedTiming: recommendation.suggestedTiming,
    defaultMessage: recommendation.defaultMessage,
    why: recommendation.why,
    personalizationReason: recommendation.personalizationReason,
    confidence: recommendation.confidence,
    source,
    savedAtISO,
    ownerId,
    metadata,
  };

  const next = sortSavedSuggestionsNewestFirst([savedItem, ...existing]).slice(
    0,
    MAX_SAVED_SUGGESTIONS
  );
  return { added: true, items: next, savedItem };
}

export function removeSavedSuggestionById(
  existing: AiCareSavedItem[],
  suggestionId: string
): AiCareSavedItem[] {
  return existing.filter((item) => item.id !== suggestionId);
}
