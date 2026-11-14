import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  AI_CARE_CATEGORIES,
  AI_CARE_CONFIDENCES,
  parseAndValidateAiCareJson,
} from '../src/services/aiCareSchema.ts';
import {
  AI_CARE_COMMUNICATION_STYLES,
  AI_CARE_EFFORT_LEVELS,
} from '../src/services/recommendationMetadata.ts';
import type {
  AiCareFallbackReason,
  AiCareRequestContext,
  AiCareResponse,
} from '../src/types/aiCare.ts';

export const GEMINI_CARE_MODEL = 'gemini-4-hydrogen';
const GEMINI_TIMEOUT_MS = 18000;

export type GeminiCareServiceResult =
  | {
      ok: true;
      source: 'gemini';
      model: string;
      generatedAtISO: string;
      data: AiCareResponse;
    }
  | {
      ok: false;
      statusCode: number;
      errorCode: AiCareFallbackReason;
      message: string;
    };

/**
 * Defense-in-depth sanitizer: removes any unauthorized fields before constructing
 * the Gemini prompt, even if a caller attempted to include them.
 */
export function sanitizeContextForGemini(context: AiCareRequestContext): AiCareRequestContext {
  const rec = context.recipient;
  const energyAllowed = Boolean(rec.energyShared);
  const sleepAllowed = Boolean(rec.sleepShared);
  const heartRateAllowed = Boolean(rec.heartRateShared);
  const hrvAllowed = Boolean(rec.hrvShared);
  const activityAllowed = Boolean(rec.activityShared);
  const cycleAllowed = Boolean(rec.cycleShared);

  const sanitizedRecipient: AiCareRequestContext['recipient'] = {
    name: rec.name,
    energyShared: energyAllowed,
    sleepShared: sleepAllowed,
    heartRateShared: heartRateAllowed,
    hrvShared: hrvAllowed,
    activityShared: activityAllowed,
    cycleShared: cycleAllowed,
    insufficientHistoricalData: !energyAllowed || Boolean(rec.insufficientHistoricalData),
    canShowFutureForecast:
      energyAllowed && !rec.insufficientHistoricalData
        ? Boolean(rec.canShowFutureForecast ?? true)
        : false,
    baselinePhase: rec.baselinePhase,
    recordedDaysCount: energyAllowed ? rec.recordedDaysCount : 0,
    dailyCheckInStatus: energyAllowed ? rec.dailyCheckInStatus ?? null : null,
    statusConfirmedAtTime: energyAllowed ? rec.statusConfirmedAtTime ?? null : null,
    isStatusConfirmedToday: energyAllowed ? Boolean(rec.isStatusConfirmedToday) : false,
    carePreferences: Array.isArray(rec.carePreferences) ? rec.carePreferences.slice(0, 12) : [],
    foodPreferences: Array.isArray(rec.foodPreferences) ? rec.foodPreferences.slice(0, 8) : [],
    avoidTags: Array.isArray(rec.avoidTags) ? rec.avoidTags.slice(0, 10) : [],
    communicationStyle: rec.communicationStyle ?? null,
  };

  if (energyAllowed) {
    if (typeof rec.currentEnergyIndex === 'number') {
      sanitizedRecipient.currentEnergyIndex = rec.currentEnergyIndex;
    }
    if (Array.isArray(rec.recentEnergyRecords)) {
      sanitizedRecipient.recentEnergyRecords = rec.recentEnergyRecords.slice(-7);
    }
    if (rec.personalBaseline) {
      sanitizedRecipient.personalBaseline = { ...rec.personalBaseline };
    }
    if (rec.weekdayPattern) {
      sanitizedRecipient.weekdayPattern = { ...rec.weekdayPattern };
    }
    if (Array.isArray(rec.upcomingForecast) && !rec.insufficientHistoricalData) {
      sanitizedRecipient.upcomingForecast = rec.upcomingForecast.slice(0, 7);
    }
    if (rec.predictionConfidence !== undefined) {
      sanitizedRecipient.predictionConfidence = rec.predictionConfidence;
    }
  }

  if (sleepAllowed && rec.sleepSummary) {
    sanitizedRecipient.sleepSummary = { ...rec.sleepSummary };
  }

  if (heartRateAllowed && rec.rhrSummary) {
    sanitizedRecipient.rhrSummary = { ...rec.rhrSummary };
  }

  if (hrvAllowed && rec.hrvSummary) {
    sanitizedRecipient.hrvSummary = { ...rec.hrvSummary };
  }

  if (activityAllowed && rec.activitySummary) {
    sanitizedRecipient.activitySummary = { ...rec.activitySummary };
  }

  if (cycleAllowed && rec.cycleSummary) {
    sanitizedRecipient.cycleSummary = { ...rec.cycleSummary };
  }

  if (rec.sharedWeeklyRecharge) {
    sanitizedRecipient.sharedWeeklyRecharge = { ...rec.sharedWeeklyRecharge };
  }

  const sanitized: AiCareRequestContext = {
    mode: context.mode,
    language: context.language,
    recipient: sanitizedRecipient,
    partner: {
      name: context.partner.name,
      pairingStatus: context.partner.pairingStatus,
      preferredWaysOfShowingCare: context.partner.preferredWaysOfShowingCare.slice(0, 8),
      savedCareTitles: context.partner.savedCareTitles.slice(0, 8),
      completedCareTitles: context.partner.completedCareTitles.slice(0, 8),
      feedback: {
        notRelevantTitles: context.partner.feedback.notRelevantTitles.slice(0, 10),
        moreLikeThisTitles: context.partner.feedback.moreLikeThisTitles.slice(0, 10),
        preferredCategories: context.partner.feedback.preferredCategories.slice(0, 5),
        deprioritizedCategories: context.partner.feedback.deprioritizedCategories.slice(0, 5),
      },
    },
  };

  if (context.learnedProfile) {
    const lp = context.learnedProfile;
    sanitized.learnedProfile = {
      learningMaturity: lp.learningMaturity,
      totalFeedbackCount: lp.totalFeedbackCount,
      positiveFeedbackCount: lp.positiveFeedbackCount,
      negativeFeedbackCount: lp.negativeFeedbackCount,
      preferredCategories: lp.preferredCategories.slice(0, 4),
      preferredCommunicationStyles: lp.preferredCommunicationStyles.slice(0, 3),
      preferredActionTypes: lp.preferredActionTypes.slice(0, 5),
      preferredTimings: lp.preferredTimings.slice(0, 3),
      preferredEffortLevels: lp.preferredEffortLevels.slice(0, 2),
      prefersFreeOrLowCost: Boolean(lp.prefersFreeOrLowCost),
      negativelyRatedAttributes: {
        categories: lp.negativelyRatedAttributes.categories.slice(0, 3),
        actionTypes: lp.negativelyRatedAttributes.actionTypes.slice(0, 5),
        communicationStyles: lp.negativelyRatedAttributes.communicationStyles.slice(0, 3),
        tags: lp.negativelyRatedAttributes.tags.slice(0, 6),
        fingerprints: lp.negativelyRatedAttributes.fingerprints.slice(0, 8),
        avoidPaidSuggestions: Boolean(lp.negativelyRatedAttributes.avoidPaidSuggestions),
      },
    };
  }

  if (Array.isArray(context.recentSuggestions)) {
    sanitized.recentSuggestions = context.recentSuggestions.slice(0, 12).map((item) => ({
      title: String(item.title || '').slice(0, 120),
      category: item.category,
      actionType: String(item.actionType || '').slice(0, 60),
      fingerprint: String(item.fingerprint || '').slice(0, 120),
    }));
  }

  return sanitized;
}

function getLanguageInstruction(language: AiCareRequestContext['language']): string {
  if (language === 'zh-CN') {
    return 'Write ALL natural-language fields (summary, planAheadSummary, evidence, evidenceSummary, evidenceDetails, title, why, action, suggestedTiming, personalizationReason, defaultMessage, limitations, tags) in Simplified Chinese (简体中文), EXCEPT keep enum fields "category", "confidence", "communicationStyle", "effortLevel", "timeHorizon", "suggestedDatePlanId", and "actionType" slug in exact English schema enum strings.';
  }
  if (language === 'zh-TW') {
    return 'Write ALL natural-language fields (summary, planAheadSummary, evidence, evidenceSummary, evidenceDetails, title, why, action, suggestedTiming, personalizationReason, defaultMessage, limitations, tags) in Traditional Chinese (繁體中文), EXCEPT keep enum fields "category", "confidence", "communicationStyle", "effortLevel", "timeHorizon", "suggestedDatePlanId", and "actionType" slug in exact English schema enum strings.';
  }
  return 'Write ALL natural-language fields in natural, warm English.';
}

export function buildCareSystemInstruction(language: AiCareRequestContext['language']): string {
  return [
    'You are the personalized care engine for DualCharge, an AI-powered couple care companion.',
    'Organize care suggestions into TWO complementary time horizons:',
    'A. "recommendations" (timeHorizon="now"): 3 Care for Now suggestions for today/tonight grounded in current-day energy, confirmed check-in status, authorized recent signals, and partner preferences.',
    'B. "planAheadRecommendations" (timeHorizon="ahead"): 2 to 3 Plan Ahead suggestions for upcoming days ONLY when energyShared is true, insufficientHistoricalData is false, canShowFutureForecast is true, and upcomingForecast is present. If energyShared is false or insufficientHistoricalData is true or canShowFutureForecast is false, return an EMPTY array [] for planAheadRecommendations.',
    '',
    'CRITICAL RESPONSIBLE INTERPRETATION RULES:',
    '1. Sleep duration/stages, activity minutes/steps, resting heart rate, HRV, menstrual cycle phase, daily check-in labels, and Energy Index ONLY describe general recovery/energy patterns. NEVER claim a person is sad, angry, stressed, anxious, lonely, depressed, or emotionally unstable from physiological or sleep numbers.',
    '2. NEVER diagnose any physical, cardiovascular, hormonal, or mental health condition. Never interpret HRV or resting heart rate as a clinical/medical signal; compare them ONLY against the same individual\'s personal baseline provided in "rhrSummary" or "hrvSummary".',
    '3. NEVER mix SDNN and RMSSD HRV metrics or compare values between partners.',
    '4. NEVER present an estimated Energy Index, weekday pattern, or 7-day forecast as a high-confidence or guaranteed outcome (NEVER output confidence="High"). Use cautious expressions such as "may need more rest", "patterns suggest", or "estimated around".',
    '5. Clearly distinguish observed historical records and confirmed daily check-in status from pattern-based future estimates. NEVER invent, extrapolate, or fabricate numbers not present in the provided JSON context. Never claim a single factor like sleep caused everything.',
    '6. Strict Privacy Scoping: If "energyShared" is false, NEVER mention energy numbers or daily check-in status. If "sleepSummary" is absent (sleepShared is false), NEVER mention sleep duration/stages. If "rhrSummary" or "hrvSummary" or "cycleSummary" is absent, NEVER mention heart rate, HRV, or cycle phase.',
    '7. Default to non-commercial everyday care (requiresSpendingMoney: false; supportive messages, quiet home time, small chores, homemade warm drink, unhurried walk). When "learnedProfile.negativelyRatedAttributes.avoidPaidSuggestions" is false, at most 1 option MAY be a small thoughtful treat purchase (requiresSpendingMoney: true, e.g. purchase_coffee, purchase_dessert, purchase_flowers, or purchase_gift), keeping non-commercial options primary.',
    '',
    'ADAPTIVE PERSONALIZATION & EVIDENCE RULES:',
    '8. Explicit profile preferences ("carePreferences", "avoidTags", "communicationStyle", and "sharedWeeklyRecharge" when shared) ALWAYS take higher priority than inferred feedback scores.',
    '9. Use "learnedProfile" (derived from explicit recipient feedback only) transparently and respect "learnedProfile.learningMaturity" ("Initial" <3 events = keep exploratory and modest).',
    '10. Diversity & Anti-Repetition: Each of the 3 "recommendations" (timeHorizon="now") MUST span a distinct "category" and a distinct "actionType". Plan Ahead items should also avoid repeating Care for Now titles.',
    '11. Evidence Transparency: Populate "evidenceSummary" (1-2 concise sentences) and "evidenceDetails" (2-3 short factual bullets) on each recommendation citing ONLY authorized observed facts, preferences, or explicitly labeled estimates from context.',
    '12. For "planAheadRecommendations": focus on practical advance prep before recurring lower-energy windows (e.g. Wednesday evening / Thursday afternoon when weekdayPattern shows Thursday dips) OR planning relaxed quality time / dates on higher-energy upcoming days (set "suggestedDatePlanId" to one of "date-warm-tea-vinyl", "date-cozy-movie", "date-evening-walk", "date-slow-cooking", "date-quiet-dinner", "date-half-day-escape" when fitting).',
    getLanguageInstruction(language),
  ].join('\n');
}

const RECOMMENDATION_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: [...AI_CARE_CATEGORIES],
    },
    timeHorizon: {
      type: Type.STRING,
      enum: ['now', 'ahead'],
    },
    why: { type: Type.STRING },
    action: { type: Type.STRING },
    suggestedTiming: { type: Type.STRING },
    personalizationReason: { type: Type.STRING },
    evidenceSummary: {
      type: Type.STRING,
      description: '1-2 concise sentences linking suggestion to authorized observations, preferences, or labeled estimates.',
    },
    evidenceDetails: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2-3 short bullets distinguishing observed history vs pattern-based estimates.',
    },
    targetWeekdayIndex: { type: Type.INTEGER },
    targetDateISO: { type: Type.STRING },
    suggestedDatePlanId: { type: Type.STRING },
    confidence: {
      type: Type.STRING,
      enum: [...AI_CARE_CONFIDENCES],
    },
    defaultMessage: {
      type: Type.STRING,
      description: 'Short warm message the partner can send or customize.',
    },
    actionType: {
      type: Type.STRING,
      description:
        'Short snake_case slug for the care action, e.g. warm_drink, quiet_evening, supportive_message, evening_walk, handwritten_note, chore_help, voice_check_in, light_meal.',
    },
    communicationStyle: {
      type: Type.STRING,
      enum: [...AI_CARE_COMMUNICATION_STYLES],
    },
    effortLevel: {
      type: Type.STRING,
      enum: [...AI_CARE_EFFORT_LEVELS],
    },
    requiresSpendingMoney: {
      type: Type.BOOLEAN,
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'id',
    'title',
    'category',
    'timeHorizon',
    'why',
    'action',
    'suggestedTiming',
    'personalizationReason',
    'evidenceSummary',
    'confidence',
    'defaultMessage',
    'actionType',
    'communicationStyle',
    'effortLevel',
    'requiresSpendingMoney',
    'tags',
  ],
};

const CARE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'Brief 1-sentence overview of the recipient current care context.',
    },
    planAheadSummary: {
      type: Type.STRING,
      description: 'Brief 1-sentence forward-looking note based on historical patterns or upcoming estimates.',
    },
    recipientName: {
      type: Type.STRING,
      description: 'Display name of the care recipient.',
    },
    evidence: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Bullet points citing ONLY authorized observed numbers, confirmed check-in status, forecast estimates (labeled as estimates), or stating insufficient data.',
    },
    recommendations: {
      type: Type.ARRAY,
      items: RECOMMENDATION_ITEM_SCHEMA,
      description: '3 Care for Now (timeHorizon="now") suggestions.',
    },
    planAheadRecommendations: {
      type: Type.ARRAY,
      items: RECOMMENDATION_ITEM_SCHEMA,
      description: '2-3 Plan Ahead (timeHorizon="ahead") suggestions, or [] if insufficientHistoricalData or energyShared is false.',
    },
    limitations: {
      type: Type.STRING,
      description:
        'Short responsible-AI note explaining data/confidence limits and that estimates are non-diagnostic.',
    },
  },
  required: [
    'summary',
    'recipientName',
    'evidence',
    'recommendations',
    'planAheadRecommendations',
    'limitations',
  ],
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini request exceeded ${ms}ms timeout.`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function generateGeminiCareRecommendations(
  rawContext: AiCareRequestContext,
  variationSeed = 0
): Promise<GeminiCareServiceResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      ok: false,
      statusCode: 503,
      errorCode: 'missing_api_key',
      message: 'GEMINI_API_KEY is not configured in server environment secrets.',
    };
  }

  const sanitized = sanitizeContextForGemini(rawContext);

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const userPrompt = [
      `Generate 3 distinct Care for Now suggestions (timeHorizon="now") across 3 different categories PLUS 2-3 Plan Ahead suggestions (timeHorizon="ahead", or [] if insufficient historical data or energyShared is false) with variationSeed=${variationSeed} for this authorized DualCharge context:`,
      JSON.stringify(sanitized),
    ].join('\n\n');

    const response = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_CARE_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: buildCareSystemInstruction(sanitized.language),
          responseMimeType: 'application/json',
          responseSchema: CARE_RESPONSE_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      }),
      GEMINI_TIMEOUT_MS
    );

    const validation = parseAndValidateAiCareJson(response.text ?? '');
    if (!validation.valid || !validation.data) {
      return {
        ok: false,
        statusCode: 502,
        errorCode: 'invalid_response',
        message: `Structured output validation failed: ${validation.errors.join(' ')}`,
      };
    }

    return {
      ok: true,
      source: 'gemini',
      model: GEMINI_CARE_MODEL,
      generatedAtISO: new Date().toISOString(),
      data: validation.data,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Gemini API error';
    const isTimeout = msg.toLowerCase().includes('timeout');
    return {
      ok: false,
      statusCode: isTimeout ? 504 : 502,
      errorCode: isTimeout ? 'timeout' : 'api_error',
      message: msg,
    };
  }
}
