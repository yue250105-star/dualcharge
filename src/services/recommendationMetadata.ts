import type {
  AiCareCategory,
  AiCareCommunicationStyle,
  AiCareEffortLevel,
  AiCareRecommendation,
  AiCareRecommendationMetadata,
} from '../types/aiCare.ts';

export const AI_CARE_COMMUNICATION_STYLES: readonly AiCareCommunicationStyle[] = [
  'Short Text',
  'Voice Message',
  'Practical Action',
  'Shared Activity',
  'Surprise',
];

export const AI_CARE_EFFORT_LEVELS: readonly AiCareEffortLevel[] = ['Low', 'Medium', 'High'];

const ACTION_CONCEPT_RULES: Array<{
  actionType: string;
  keywords: string[];
  defaultStyle: AiCareCommunicationStyle;
  defaultEffort: AiCareEffortLevel;
}> = [
  {
    actionType: 'purchase_coffee',
    keywords: ['order a cup', 'buy a cup', 'order coffee', 'buy coffee', 'order milk tea', 'buy milk tea', 'latte delivery', '点一杯', '點一杯', '买一杯', '買一杯'],
    defaultStyle: 'Surprise',
    defaultEffort: 'Low',
  },
  {
    actionType: 'purchase_dessert',
    keywords: ['order dessert', 'order a dessert', 'buy pastry', 'pastry box', 'order snack', 'cake delivery', '订一份甜点', '訂一份甜點', '买甜品', '買甜品', '点一份点心', '點一份點心'],
    defaultStyle: 'Surprise',
    defaultEffort: 'Low',
  },
  {
    actionType: 'purchase_flowers',
    keywords: ['send flowers', 'fresh bouquet', 'order flowers', 'buy flowers', '送一束鲜花', '送一束鮮花', '订一束花', '訂一束花', '送花'],
    defaultStyle: 'Surprise',
    defaultEffort: 'Medium',
  },
  {
    actionType: 'warm_drink',
    keywords: ['tea', 'milk tea', 'drink', 'cocoa', 'brew', 'cup', '热饮', '奶茶', '果茶', '熱飲', '茶'],
    defaultStyle: 'Practical Action',
    defaultEffort: 'Low',
  },
  {
    actionType: 'evening_walk',
    keywords: ['walk', 'stroll', 'fresh air', '散步', '慢走'],
    defaultStyle: 'Shared Activity',
    defaultEffort: 'Low',
  },
  {
    actionType: 'quiet_evening',
    keywords: ['quiet', 'unwind', 'low-stimulus', 'rest', 'screen-free', 'unscheduled', '安静', '安靜', '休息', '休整'],
    defaultStyle: 'Shared Activity',
    defaultEffort: 'Low',
  },
  {
    actionType: 'light_meal',
    keywords: ['meal', 'dinner', 'lunch', 'cook', 'soup', '清淡', '晚餐', '简餐', '簡餐'],
    defaultStyle: 'Practical Action',
    defaultEffort: 'Medium',
  },
  {
    actionType: 'chore_help',
    keywords: ['chore', 'tidy', 'errand', 'dishes', 'laundry', '家务', '家務', '分担', '分擔', '琐事', '瑣事'],
    defaultStyle: 'Practical Action',
    defaultEffort: 'Medium',
  },
  {
    actionType: 'handwritten_note',
    keywords: ['handwritten', 'sticky note', 'desk', 'paper note', '纸条', '紙條', '便签', '便條'],
    defaultStyle: 'Surprise',
    defaultEffort: 'Low',
  },
  {
    actionType: 'voice_check_in',
    keywords: ['voice', 'audio', 'call', '语音', '語音'],
    defaultStyle: 'Voice Message',
    defaultEffort: 'Low',
  },
  {
    actionType: 'supportive_message',
    keywords: ['message', 'text', 'note', 'check-in', 'hello', 'encourag', '问候', '問候', '消息', '訊息', '鼓励', '鼓勵'],
    defaultStyle: 'Short Text',
    defaultEffort: 'Low',
  },
  {
    actionType: 'playlist_or_audio',
    keywords: ['playlist', 'music', 'song', '歌单', '歌單', '音乐', '音樂'],
    defaultStyle: 'Surprise',
    defaultEffort: 'Low',
  },
  {
    actionType: 'gift_or_purchase',
    keywords: ['buy', 'order', 'delivery', 'gift', 'purchase', 'restaurant', '订购', '訂購', '外卖', '外賣', '礼物', '禮物', '购买', '購買'],
    defaultStyle: 'Surprise',
    defaultEffort: 'Medium',
  },
];

const CATEGORY_DEFAULT_STYLE: Record<AiCareCategory, AiCareCommunicationStyle> = {
  'Emotional Support': 'Short Text',
  'Practical Help': 'Practical Action',
  'Rest & Recovery': 'Shared Activity',
  'Small Surprise': 'Surprise',
  'Quality Time': 'Shared Activity',
};

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeCommunicationStyle(
  raw: unknown,
  fallbackCategory: AiCareCategory,
  combinedText = ''
): AiCareCommunicationStyle {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if ((AI_CARE_COMMUNICATION_STYLES as readonly string[]).includes(trimmed)) {
      return trimmed as AiCareCommunicationStyle;
    }
    const lower = trimmed.toLowerCase();
    if (lower.includes('voice') || lower.includes('audio')) return 'Voice Message';
    if (lower.includes('text') || lower.includes('message') || lower.includes('note')) return 'Short Text';
    if (lower.includes('practical') || lower.includes('action') || lower.includes('chore')) {
      return 'Practical Action';
    }
    if (lower.includes('shared') || lower.includes('activity') || lower.includes('together')) {
      return 'Shared Activity';
    }
    if (lower.includes('surprise') || lower.includes('gift')) return 'Surprise';
  }

  const lowerText = combinedText.toLowerCase();
  for (const rule of ACTION_CONCEPT_RULES) {
    if (rule.keywords.some((kw) => lowerText.includes(kw))) {
      return rule.defaultStyle;
    }
  }
  return CATEGORY_DEFAULT_STYLE[fallbackCategory];
}

export function normalizeEffortLevel(
  raw: unknown,
  combinedText = ''
): AiCareEffortLevel {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if ((AI_CARE_EFFORT_LEVELS as readonly string[]).includes(trimmed)) {
      return trimmed as AiCareEffortLevel;
    }
    const lower = trimmed.toLowerCase();
    if (lower.includes('low') || lower.includes('light') || lower.includes('easy')) return 'Low';
    if (lower.includes('high') || lower.includes('deep')) return 'High';
    if (lower.includes('med') || lower.includes('mod')) return 'Medium';
  }
  const lowerText = combinedText.toLowerCase();
  if (lowerText.includes('cook') || lowerText.includes('chore') || lowerText.includes('dinner')) {
    return 'Medium';
  }
  return 'Low';
}

export function inferActionType(rawActionType: unknown, combinedText: string): string {
  if (typeof rawActionType === 'string' && rawActionType.trim().length > 0) {
    const slug = normalizeSlug(rawActionType);
    if (slug.length > 0) {
      // Map common variants into canonical actionType slugs
      const lower = rawActionType.toLowerCase();
      for (const rule of ACTION_CONCEPT_RULES) {
        if (rule.keywords.some((kw) => lower.includes(kw))) {
          return rule.actionType;
        }
      }
      return slug;
    }
  }

  const lower = combinedText.toLowerCase();
  for (const rule of ACTION_CONCEPT_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.actionType;
    }
  }
  return 'thoughtful_care';
}

export function inferRequiresSpendingMoney(raw: unknown, combinedText: string): boolean {
  if (typeof raw === 'boolean') return raw;
  const lower = combinedText.toLowerCase();
  const paidKeywords = [
    'buy ',
    'purchase',
    'order a ',
    'order coffee',
    'order milk tea',
    'order dessert',
    'order delivery',
    'send flowers',
    'takeout',
    'restaurant',
    'bouquet',
    'spa voucher',
    'expensive gift',
    'small gift',
    '购买',
    '購買',
    '点外卖',
    '點外賣',
    '点一杯',
    '點一杯',
    '订一份',
    '訂一份',
    '送一束',
    '买一份',
    '買一份',
    '餐厅',
    '餐廳',
  ];
  return paidKeywords.some((kw) => lower.includes(kw));
}

export function normalizeSuggestionTags(
  rawTags: unknown,
  category: AiCareCategory,
  actionType: string,
  communicationStyle: AiCareCommunicationStyle,
  requiresSpendingMoney: boolean
): string[] {
  const collected: string[] = [];
  if (Array.isArray(rawTags)) {
    for (const item of rawTags) {
      if (typeof item === 'string' && item.trim()) {
        const slug = normalizeSlug(item);
        if (slug) collected.push(slug);
      }
    }
  }
  collected.push(normalizeSlug(category));
  collected.push(normalizeSlug(actionType));
  collected.push(normalizeSlug(communicationStyle));
  if (!requiresSpendingMoney) {
    collected.push('free_low_cost');
  } else {
    collected.push('paid');
  }
  return Array.from(new Set(collected)).slice(0, 8);
}

export function normalizeTimingBucket(suggestedTiming: string): string {
  const lower = suggestedTiming.toLowerCase();
  if (lower.includes('morning') || lower.includes('早') || lower.includes('上午')) return 'morning';
  if (lower.includes('midday') || lower.includes('noon') || lower.includes('午间') || lower.includes('午間')) {
    return 'midday';
  }
  if (lower.includes('afternoon') || lower.includes('下午') || lower.includes('傍晚')) {
    return 'afternoon';
  }
  if (
    lower.includes('evening') ||
    lower.includes('night') ||
    lower.includes('tonight') ||
    lower.includes('晚')
  ) {
    return 'evening';
  }
  return 'flexible';
}

export function computeSuggestionFingerprint(params: {
  category: AiCareCategory;
  actionType: string;
  communicationStyle: AiCareCommunicationStyle;
  title?: string;
  action?: string;
  requiresSpendingMoney?: boolean;
}): string {
  const catSlug = normalizeSlug(params.category);
  const actSlug = normalizeSlug(params.actionType);
  const styleSlug = normalizeSlug(params.communicationStyle);
  const costTag = params.requiresSpendingMoney ? 'paid' : 'free';

  // If actionType is generic ('thoughtful_care'), include top normalized content tokens
  if (actSlug === 'thoughtful_care') {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'your',
      'their',
      'them',
      'that',
      'this',
      'from',
      'into',
      'about',
      'make',
      'send',
      'give',
      'offer',
      'share',
      'plan',
      'keep',
      'take',
      'have',
      'some',
      'small',
      'gentle',
      'warm',
      'today',
      'tonight',
    ]);
    const tokens = `${params.title ?? ''} ${params.action ?? ''}`
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, ' ')
      .split(/\s+/)
      .filter((tok) => tok.length >= 3 && !stopWords.has(tok))
      .slice(0, 4)
      .sort();
    const tokenSig = tokens.length > 0 ? tokens.join('_') : 'general';
    return `${catSlug}:${actSlug}:${styleSlug}:${costTag}:${tokenSig}`;
  }

  return `${catSlug}:${actSlug}:${styleSlug}:${costTag}`;
}

export function normalizeRecommendationMetadata(
  rec: Pick<
    AiCareRecommendation,
    | 'title'
    | 'category'
    | 'action'
    | 'suggestedTiming'
    | 'actionType'
    | 'communicationStyle'
    | 'effortLevel'
    | 'requiresSpendingMoney'
    | 'tags'
    | 'fingerprint'
  > & { why?: string }
): AiCareRecommendationMetadata {
  const combinedText = `${rec.title} ${rec.action} ${rec.why ?? ''}`;
  const actionType = inferActionType(rec.actionType, combinedText);
  const communicationStyle = normalizeCommunicationStyle(
    rec.communicationStyle,
    rec.category,
    combinedText
  );
  const effortLevel = normalizeEffortLevel(rec.effortLevel, combinedText);
  const requiresSpendingMoney = inferRequiresSpendingMoney(
    rec.requiresSpendingMoney,
    combinedText
  );
  const tags = normalizeSuggestionTags(
    rec.tags,
    rec.category,
    actionType,
    communicationStyle,
    requiresSpendingMoney
  );
  const fingerprint =
    typeof rec.fingerprint === 'string' && rec.fingerprint.trim().length > 0
      ? normalizeSlug(rec.fingerprint).includes(':')
        ? rec.fingerprint.trim().toLowerCase()
        : computeSuggestionFingerprint({
            category: rec.category,
            actionType,
            communicationStyle,
            title: rec.title,
            action: rec.action,
            requiresSpendingMoney,
          })
      : computeSuggestionFingerprint({
          category: rec.category,
          actionType,
          communicationStyle,
          title: rec.title,
          action: rec.action,
          requiresSpendingMoney,
        });

  return {
    category: rec.category,
    actionType,
    communicationStyle,
    suggestedTiming: rec.suggestedTiming,
    effortLevel,
    requiresSpendingMoney,
    tags,
    fingerprint,
  };
}

export function buildMetadataFromPresetCare(params: {
  suggestionId: string;
  title: string;
  description: string;
  timing: string;
}): AiCareRecommendationMetadata {
  const id = params.suggestionId;
  let category: AiCareCategory = 'Emotional Support';
  let actionType = 'supportive_message';
  let communicationStyle: AiCareCommunicationStyle = 'Short Text';

  if (id.includes('warm-drink') || id.includes('fruit-tea') || id.includes('warm_drinks')) {
    category = 'Practical Help';
    actionType = 'warm_drink';
    communicationStyle = 'Practical Action';
  } else if (id.includes('quiet-evening') || id.includes('quiet_time')) {
    category = 'Rest & Recovery';
    actionType = 'quiet_evening';
    communicationStyle = 'Shared Activity';
  } else if (id.includes('evening-walk') || id.includes('relaxing_walks')) {
    category = 'Quality Time';
    actionType = 'evening_walk';
    communicationStyle = 'Shared Activity';
  } else if (id.includes('light_meals')) {
    category = 'Practical Help';
    actionType = 'light_meal';
    communicationStyle = 'Practical Action';
  } else if (id.includes('small_surprises')) {
    category = 'Small Surprise';
    actionType = 'handwritten_note';
    communicationStyle = 'Surprise';
  } else if (id.includes('checkin') || id.includes('note') || id.includes('gentle_messages')) {
    category = 'Emotional Support';
    actionType = 'supportive_message';
    communicationStyle = 'Short Text';
  }

  return normalizeRecommendationMetadata({
    title: params.title,
    category,
    action: params.description,
    suggestedTiming: params.timing,
    actionType,
    communicationStyle,
    effortLevel: 'Low',
    requiresSpendingMoney: false,
  });
}
