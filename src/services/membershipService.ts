import type {
  CareMomentRecord,
  CoupleMembershipState,
  DatePlanSuggestion,
} from '../types/dualcharge.ts';

export const FREE_MONTHLY_AI_CARE_LIMIT = 5;
export const FREE_CARE_HISTORY_WINDOW_DAYS = 7;
export const FREE_INSIGHTS_TREND_DAYS = 30;

export const COUPLE_PROPOSED_PRICING = {
  currency: 'HK$',
  monthlyPrice: 38,
  yearlyPrice: 288,
  monthlyLabel: 'HK$38',
  yearlyLabel: 'HK$288',
  isIllustrativeProposal: true,
} as const;

export type ComparisonAccessKind =
  | 'free_included'
  | 'premium_enhanced'
  | 'premium_exclusive';

export interface MembershipComparisonRow {
  id:
    | 'pairing'
    | 'daily_checkin'
    | 'privacy_controls'
    | 'weekly_recharge'
    | 'energy_trends'
    | 'ai_care'
    | 'feedback_learning'
    | 'care_history'
    | 'date_planning'
    | 'multidimensional_insights'
    | 'notifications_custom'
    | 'couple_widgets';
  accessKind: ComparisonAccessKind;
}

export const MEMBERSHIP_COMPARISON_MATRIX: readonly MembershipComparisonRow[] = [
  { id: 'pairing', accessKind: 'free_included' },
  { id: 'daily_checkin', accessKind: 'free_included' },
  { id: 'privacy_controls', accessKind: 'free_included' },
  { id: 'weekly_recharge', accessKind: 'free_included' },
  { id: 'energy_trends', accessKind: 'premium_enhanced' },
  { id: 'ai_care', accessKind: 'premium_enhanced' },
  { id: 'feedback_learning', accessKind: 'premium_enhanced' },
  { id: 'care_history', accessKind: 'premium_enhanced' },
  { id: 'date_planning', accessKind: 'premium_enhanced' },
  { id: 'multidimensional_insights', accessKind: 'premium_exclusive' },
  { id: 'notifications_custom', accessKind: 'premium_exclusive' },
  { id: 'couple_widgets', accessKind: 'premium_exclusive' },
] as const;

export interface MembershipCapabilities {
  tier: 'free' | 'premium';
  isPremium: boolean;
  isCoupleLinked: boolean;
  canPurchaseCouplePremium: boolean;
  insightsTrendDaysLimit: number | null;
  canUseExtended60DayTrends: boolean;
  canUseAdvancedInsights: boolean;
  aiCareMonthlyLimit: number | null;
  canGenerateAiCare: (usedThisMonth: number) => boolean;
  remainingFreeAiCare: (usedThisMonth: number) => number | null;
  canUseAdvancedFeedbackLearning: boolean;
  careHistoryWindowDays: number | null;
  canUseFullCareHistory: boolean;
  canUsePersonalizedDatePlanning: boolean;
  canUseCoupleWidgets: boolean;
  canUseAdvancedNotifications: boolean;
}

export function getMembershipCapabilities(
  membership: CoupleMembershipState,
  isCoupleLinked: boolean
): MembershipCapabilities {
  const isPremium = membership.tier === 'premium';

  return {
    tier: membership.tier,
    isPremium,
    isCoupleLinked,
    canPurchaseCouplePremium: isCoupleLinked,
    insightsTrendDaysLimit: isPremium ? null : FREE_INSIGHTS_TREND_DAYS,
    canUseExtended60DayTrends: isPremium,
    canUseAdvancedInsights: isPremium,
    aiCareMonthlyLimit: isPremium ? null : FREE_MONTHLY_AI_CARE_LIMIT,
    canGenerateAiCare: (usedThisMonth: number) =>
      isPremium || usedThisMonth < FREE_MONTHLY_AI_CARE_LIMIT,
    remainingFreeAiCare: (usedThisMonth: number) =>
      isPremium ? null : Math.max(0, FREE_MONTHLY_AI_CARE_LIMIT - usedThisMonth),
    canUseAdvancedFeedbackLearning: isPremium,
    careHistoryWindowDays: isPremium ? null : FREE_CARE_HISTORY_WINDOW_DAYS,
    canUseFullCareHistory: isPremium,
    canUsePersonalizedDatePlanning: isPremium,
    canUseCoupleWidgets: isPremium,
    canUseAdvancedNotifications: isPremium,
  };
}

function parseIsoDayUTC(dateISO: string): number {
  const parts = dateISO.split('-').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return NaN;
  }
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

export function filterCareMomentsByMembership(
  moments: CareMomentRecord[],
  membership: CoupleMembershipState,
  referenceDateISO: string
): {
  visibleMoments: CareMomentRecord[];
  lockedOlderMoments: CareMomentRecord[];
  lockedOlderCount: number;
} {
  if (membership.tier === 'premium') {
    return {
      visibleMoments: moments,
      lockedOlderMoments: [],
      lockedOlderCount: 0,
    };
  }

  const refMs = parseIsoDayUTC(referenceDateISO);
  if (Number.isNaN(refMs)) {
    return {
      visibleMoments: moments,
      lockedOlderMoments: [],
      lockedOlderCount: 0,
    };
  }

  const maxAgeMs = FREE_CARE_HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const visibleMoments: CareMomentRecord[] = [];
  const lockedOlderMoments: CareMomentRecord[] = [];

  for (const moment of moments) {
    const momentMs = parseIsoDayUTC(moment.dateISO);
    if (Number.isNaN(momentMs) || refMs - momentMs <= maxAgeMs) {
      visibleMoments.push(moment);
    } else {
      lockedOlderMoments.push(moment);
    }
  }

  return {
    visibleMoments,
    lockedOlderMoments,
    lockedOlderCount: lockedOlderMoments.length,
  };
}

/**
 * Returns up to 3 classic non-personalized activity ideas for Free users
 * so basic activity & date suggestions remain accessible without locking the whole tab.
 */
export function getBasicActivitySuggestions(
  plans: DatePlanSuggestion[]
): DatePlanSuggestion[] {
  const preferredBasicIds = [
    'date-home-unwind',
    'date-movie-cozy',
    'date-hobbies-cook',
  ];
  const matched = preferredBasicIds
    .map((id) => plans.find((p) => p.id === id))
    .filter((p): p is DatePlanSuggestion => Boolean(p));

  if (matched.length >= 3) return matched.slice(0, 3);

  const seen = new Set(matched.map((p) => p.id));
  for (const plan of plans) {
    if (!seen.has(plan.id)) {
      matched.push(plan);
      seen.add(plan.id);
    }
    if (matched.length >= 3) break;
  }
  return matched;
}

export function getCurrentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
