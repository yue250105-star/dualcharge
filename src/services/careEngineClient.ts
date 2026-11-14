import { validateAiCareResponse } from './aiCareSchema.ts';
import { generateLocalFallbackCare } from './careFallbackEngine.ts';
import { diversifyRecommendations } from './recommendationDiversity.ts';
import type {
  AiCareFallbackReason,
  AiCareGenerationResult,
  AiCareRequestContext,
  RecentSuggestionRecord,
} from '../types/aiCare.ts';

const CLIENT_TIMEOUT_MS = 22000;

interface ServerErrorPayload {
  ok?: false;
  errorCode?: AiCareFallbackReason;
  message?: string;
}

interface ServerSuccessPayload {
  ok: true;
  source: 'gemini';
  model: string;
  generatedAtISO?: string;
  data: unknown;
}

export async function requestAiCareRecommendations(
  context: AiCareRequestContext,
  variationSeed = 0
): Promise<AiCareGenerationResult> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/care/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, variationSeed }),
      signal: controller.signal,
    });

    let jsonBody: ServerSuccessPayload | ServerErrorPayload | null = null;
    try {
      jsonBody = (await response.json()) as ServerSuccessPayload | ServerErrorPayload;
    } catch {
      return generateLocalFallbackCare(
        context,
        'invalid_response',
        'Server returned non-JSON response.',
        variationSeed
      );
    }

    if (!response.ok || !jsonBody || !('ok' in jsonBody) || !jsonBody.ok) {
      const errPayload = (jsonBody ?? {}) as ServerErrorPayload;
      const reason: AiCareFallbackReason = errPayload.errorCode ?? 'api_error';
      return generateLocalFallbackCare(context, reason, errPayload.message, variationSeed);
    }

    const validation = validateAiCareResponse(jsonBody.data);
    if (!validation.valid || !validation.data) {
      return generateLocalFallbackCare(
        context,
        'invalid_response',
        validation.errors.join(' '),
        variationSeed
      );
    }

    const recentHistory: RecentSuggestionRecord[] = (context.recentSuggestions ?? []).map(
      (item) => ({
        id: item.fingerprint,
        title: item.title,
        category: item.category,
        actionType: item.actionType,
        communicationStyle: 'Short Text',
        fingerprint: item.fingerprint,
        generatedAtISO: '',
      })
    );

    const diversified =
      recentHistory.length > 0 && validation.data.recommendations.length > 1
        ? diversifyRecommendations(validation.data.recommendations, recentHistory, 3)
        : validation.data.recommendations;

    return {
      source: 'gemini',
      model: jsonBody.model,
      generatedAtISO: jsonBody.generatedAtISO ?? new Date().toISOString(),
      data: {
        ...validation.data,
        recommendations: diversified,
      },
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return generateLocalFallbackCare(
      context,
      isAbort ? 'timeout' : 'network_error',
      err instanceof Error ? err.message : 'Network failure',
      variationSeed
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
