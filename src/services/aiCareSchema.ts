import type {
  AiCareCategory,
  AiCareConfidence,
  AiCareRecommendation,
  AiCareResponse,
} from '../types/aiCare.ts';
import {
  AI_CARE_COMMUNICATION_STYLES,
  AI_CARE_EFFORT_LEVELS,
  normalizeRecommendationMetadata,
} from './recommendationMetadata.ts';

export const AI_CARE_CATEGORIES: readonly AiCareCategory[] = [
  'Emotional Support',
  'Practical Help',
  'Rest & Recovery',
  'Small Surprise',
  'Quality Time',
];

export const AI_CARE_CONFIDENCES: readonly AiCareConfidence[] = [
  'Moderate',
  'Low',
  'Preference-Based',
];

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function normalizeCategory(raw: unknown): AiCareCategory | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if ((AI_CARE_CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as AiCareCategory;
  }
  const lower = normalized.toLowerCase();
  if (lower.includes('emotion')) return 'Emotional Support';
  if (lower.includes('practical') || lower.includes('help') || lower.includes('task')) {
    return 'Practical Help';
  }
  if (lower.includes('rest') || lower.includes('recover') || lower.includes('sleep')) {
    return 'Rest & Recovery';
  }
  if (lower.includes('surprise') || lower.includes('gift') || lower.includes('treat')) {
    return 'Small Surprise';
  }
  if (lower.includes('quality') || lower.includes('time') || lower.includes('together')) {
    return 'Quality Time';
  }
  return null;
}

function normalizeConfidence(raw: unknown): AiCareConfidence | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if ((AI_CARE_CONFIDENCES as readonly string[]).includes(trimmed)) {
    return trimmed as AiCareConfidence;
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'moderate' || lower === 'high') return 'Moderate';
  if (lower === 'low') return 'Low';
  if (lower.includes('pref') || lower.includes('insufficient')) return 'Preference-Based';
  return null;
}

function isValidOptionalCommunicationStyle(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  if (typeof raw !== 'string' || !raw.trim()) return false;
  const lower = raw.trim().toLowerCase();
  if ((AI_CARE_COMMUNICATION_STYLES as readonly string[]).includes(raw.trim())) return true;
  return (
    lower.includes('voice') ||
    lower.includes('audio') ||
    lower.includes('text') ||
    lower.includes('message') ||
    lower.includes('note') ||
    lower.includes('practical') ||
    lower.includes('action') ||
    lower.includes('shared') ||
    lower.includes('activity') ||
    lower.includes('surprise') ||
    lower.includes('gift')
  );
}

function isValidOptionalEffortLevel(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  if (typeof raw !== 'string' || !raw.trim()) return false;
  const lower = raw.trim().toLowerCase();
  if ((AI_CARE_EFFORT_LEVELS as readonly string[]).includes(raw.trim())) return true;
  return (
    lower.includes('low') ||
    lower.includes('light') ||
    lower.includes('easy') ||
    lower.includes('med') ||
    lower.includes('mod') ||
    lower.includes('high')
  );
}

export interface SchemaValidationResult {
  valid: boolean;
  data?: AiCareResponse;
  errors: string[];
}

export function validateAiCareResponse(payload: unknown): SchemaValidationResult {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['Response root must be a JSON object.'] };
  }

  const obj = payload as Record<string, unknown>;

  if (!isNonEmptyString(obj.summary)) {
    errors.push('Missing or empty "summary".');
  }
  if (!isNonEmptyString(obj.recipientName)) {
    errors.push('Missing or empty "recipientName".');
  }
  if (!isNonEmptyString(obj.limitations)) {
    errors.push('Missing or empty "limitations".');
  }

  if (!Array.isArray(obj.evidence)) {
    errors.push('"evidence" must be an array of strings.');
  }
  const cleanEvidence = Array.isArray(obj.evidence)
    ? obj.evidence.filter((e): e is string => isNonEmptyString(e)).map((e) => e.trim())
    : [];

  if (!Array.isArray(obj.recommendations) || obj.recommendations.length === 0) {
    errors.push('"recommendations" must be a non-empty array.');
  }

  const cleanRecommendations: AiCareRecommendation[] = [];
  if (Array.isArray(obj.recommendations)) {
    obj.recommendations.forEach((item, idx) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`Recommendation at index ${idx} must be an object.`);
        return;
      }
      const rec = item as Record<string, unknown>;
      const category = normalizeCategory(rec.category);
      const confidence = normalizeConfidence(rec.confidence);

      if (!isNonEmptyString(rec.id)) {
        errors.push(`Recommendation[${idx}] missing "id".`);
      }
      if (!isNonEmptyString(rec.title)) {
        errors.push(`Recommendation[${idx}] missing "title".`);
      }
      if (!category) {
        errors.push(`Recommendation[${idx}] has invalid "category".`);
      }
      if (!isNonEmptyString(rec.why)) {
        errors.push(`Recommendation[${idx}] missing "why".`);
      }
      if (!isNonEmptyString(rec.action)) {
        errors.push(`Recommendation[${idx}] missing "action".`);
      }
      if (!isNonEmptyString(rec.suggestedTiming)) {
        errors.push(`Recommendation[${idx}] missing "suggestedTiming".`);
      }
      if (!isNonEmptyString(rec.personalizationReason)) {
        errors.push(`Recommendation[${idx}] missing "personalizationReason".`);
      }
      if (!confidence) {
        errors.push(`Recommendation[${idx}] has invalid "confidence".`);
      }
      if (!isValidOptionalCommunicationStyle(rec.communicationStyle)) {
        errors.push(`Recommendation[${idx}] has invalid "communicationStyle".`);
      }
      if (!isValidOptionalEffortLevel(rec.effortLevel)) {
        errors.push(`Recommendation[${idx}] has invalid "effortLevel".`);
      }
      if (
        rec.requiresSpendingMoney !== undefined &&
        typeof rec.requiresSpendingMoney !== 'boolean'
      ) {
        errors.push(`Recommendation[${idx}] "requiresSpendingMoney" must be boolean.`);
      }
      if (
        rec.tags !== undefined &&
        (!Array.isArray(rec.tags) || rec.tags.some((tag) => typeof tag !== 'string'))
      ) {
        errors.push(`Recommendation[${idx}] "tags" must be an array of strings.`);
      }

      if (
        isNonEmptyString(rec.id) &&
        isNonEmptyString(rec.title) &&
        category &&
        isNonEmptyString(rec.why) &&
        isNonEmptyString(rec.action) &&
        isNonEmptyString(rec.suggestedTiming) &&
        isNonEmptyString(rec.personalizationReason) &&
        confidence &&
        isValidOptionalCommunicationStyle(rec.communicationStyle) &&
        isValidOptionalEffortLevel(rec.effortLevel) &&
        (rec.requiresSpendingMoney === undefined || typeof rec.requiresSpendingMoney === 'boolean') &&
        (rec.tags === undefined ||
          (Array.isArray(rec.tags) && rec.tags.every((tag) => typeof tag === 'string')))
      ) {
        const meta = normalizeRecommendationMetadata({
          title: rec.title.trim(),
          category,
          action: rec.action.trim(),
          why: rec.why.trim(),
          suggestedTiming: rec.suggestedTiming.trim(),
          actionType: typeof rec.actionType === 'string' ? rec.actionType : undefined,
          communicationStyle:
            typeof rec.communicationStyle === 'string'
              ? (rec.communicationStyle as AiCareRecommendation['communicationStyle'])
              : undefined,
          effortLevel:
            typeof rec.effortLevel === 'string'
              ? (rec.effortLevel as AiCareRecommendation['effortLevel'])
              : undefined,
          requiresSpendingMoney:
            typeof rec.requiresSpendingMoney === 'boolean' ? rec.requiresSpendingMoney : undefined,
          tags: Array.isArray(rec.tags) ? (rec.tags as string[]) : undefined,
          fingerprint: typeof rec.fingerprint === 'string' ? rec.fingerprint : undefined,
        });

        cleanRecommendations.push({
          id: rec.id.trim(),
          title: rec.title.trim(),
          category,
          why: rec.why.trim(),
          action: rec.action.trim(),
          suggestedTiming: rec.suggestedTiming.trim(),
          personalizationReason: rec.personalizationReason.trim(),
          confidence,
          defaultMessage: isNonEmptyString(rec.defaultMessage)
            ? rec.defaultMessage.trim()
            : rec.action.trim(),
          actionType: meta.actionType,
          communicationStyle: meta.communicationStyle,
          effortLevel: meta.effortLevel,
          requiresSpendingMoney: meta.requiresSpendingMoney,
          tags: meta.tags,
          fingerprint: meta.fingerprint,
        });
      }
    });
  }

  if (errors.length > 0 || cleanRecommendations.length === 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      summary: (obj.summary as string).trim(),
      recipientName: (obj.recipientName as string).trim(),
      evidence: cleanEvidence,
      recommendations: cleanRecommendations,
      limitations: (obj.limitations as string).trim(),
    },
  };
}

export function parseAndValidateAiCareJson(rawText: string): SchemaValidationResult {
  if (!isNonEmptyString(rawText)) {
    return { valid: false, errors: ['Empty response text from Gemini.'] };
  }

  // Strip optional markdown code fences if present
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return {
      valid: false,
      errors: [`Invalid JSON response: ${err instanceof Error ? err.message : 'parse error'}`],
    };
  }

  return validateAiCareResponse(parsed);
}
