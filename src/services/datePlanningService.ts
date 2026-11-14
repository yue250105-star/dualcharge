import type {
  DatePlanCategory,
  DatePlanSuggestion,
  PartnerId,
  SharingPreferences,
  WeeklyRechargeEntry,
} from '../types/dualcharge.ts';

export const DATE_PLAN_CATEGORIES: readonly DatePlanCategory[] = [
  'Outdoor Activities',
  'Movie Nights',
  'Restaurant Dates',
  'Weekend Trips',
  'Shared Hobbies',
  'Relaxing Time at Home',
];

const SIMULATED_DATE_POOL: DatePlanSuggestion[] = [
  {
    id: 'date-home-tea-vinyl',
    category: 'Relaxing Time at Home',
    titleKey: 'homeTeaSession',
    suggestedSlot: 'Thu · 7:30 PM – 9:00 PM',
    suggestedTimeISO: '2026-11-19T19:30:00',
    energyFit: 'low_pressure',
    estimatedBudget: 'free_or_low',
    availabilityNote: 'Both free after 7:00 PM (simulated schedule)',
  },
  {
    id: 'date-movie-cozy-double',
    category: 'Movie Nights',
    titleKey: 'cozyMovieNight',
    suggestedSlot: 'Fri · 8:00 PM – 10:15 PM',
    suggestedTimeISO: '2026-11-20T20:00:00',
    energyFit: 'low_pressure',
    estimatedBudget: 'free_or_low',
    availabilityNote: 'No evening conflicts on demo calendar',
  },
  {
    id: 'date-outdoor-harbor-stroll',
    category: 'Outdoor Activities',
    titleKey: 'harborEveningWalk',
    suggestedSlot: 'Sat · 4:30 PM – 6:00 PM',
    suggestedTimeISO: '2026-11-21T16:30:00',
    energyFit: 'balanced',
    estimatedBudget: 'free_or_low',
    availabilityNote: '2-hour shared afternoon opening (simulated)',
  },
  {
    id: 'date-hobby-sketch-cook',
    category: 'Shared Hobbies',
    titleKey: 'sharedSlowCooking',
    suggestedSlot: 'Sun · 11:30 AM – 1:30 PM',
    suggestedTimeISO: '2026-11-22T11:30:00',
    energyFit: 'balanced',
    estimatedBudget: 'free_or_low',
    availabilityNote: 'Relaxed late-morning window (simulated)',
  },
  {
    id: 'date-restaurant-quiet-noodle',
    category: 'Restaurant Dates',
    titleKey: 'quietNeighborhoodDinner',
    suggestedSlot: 'Sat · 6:30 PM – 8:00 PM',
    suggestedTimeISO: '2026-11-21T18:30:00',
    energyFit: 'balanced',
    estimatedBudget: 'moderate',
    availabilityNote: 'Open evening dinner window (simulated)',
  },
  {
    id: 'date-trip-botanical-day',
    category: 'Weekend Trips',
    titleKey: 'unhurriedHalfDayEscape',
    suggestedSlot: 'Sun · 10:00 AM – 3:30 PM',
    suggestedTimeISO: '2026-11-22T10:00:00',
    energyFit: 'active',
    estimatedBudget: 'moderate',
    availabilityNote: 'Open weekend day block (simulated)',
  },
];

export interface BuildDateSuggestionsInput {
  viewerId: PartnerId;
  partnerId: PartnerId;
  partnerEnergy: number | null;
  partnerSharing: SharingPreferences;
  partnerAvoidLabels: string[];
  partnerSharedRecharge?: WeeklyRechargeEntry | null;
  selectedCategory?: DatePlanCategory | 'all';
}

/**
 * Generates contextual couple date options from permitted partner energy summaries,
 * avoid tags, and shared weekly recharge cues. High energy allows varied options without
 * assuming someone wants to go out; lower energy prioritizes low-pressure recovery options.
 */
export function buildDatePlanSuggestions(
  input: BuildDateSuggestionsInput
): Array<DatePlanSuggestion & { matchScore: number; lowPressureRecommended: boolean }> {
  const {
    partnerEnergy,
    partnerSharing,
    partnerAvoidLabels,
    partnerSharedRecharge,
    selectedCategory = 'all',
  } = input;

  const authorizedEnergy = partnerSharing.energy ? partnerEnergy : null;
  const preferLowPressure = authorizedEnergy !== null && authorizedEnergy < 62;
  const avoidCrowds = partnerAvoidLabels.some((label) =>
    /crowd|noise|last-minute|拥挤|擁擠|临时|臨時/i.test(label)
  );

  const filtered =
    selectedCategory === 'all'
      ? SIMULATED_DATE_POOL
      : SIMULATED_DATE_POOL.filter((item) => item.category === selectedCategory);

  return filtered
    .map((item) => {
      let score = 50;
      if (preferLowPressure) {
        if (item.energyFit === 'low_pressure') score += 30;
        else if (item.energyFit === 'balanced') score += 10;
        else score -= 18;
      } else if (authorizedEnergy !== null && authorizedEnergy >= 75) {
        // High energy offers balanced variety including calm home options (never forces going out)
        score += item.energyFit === 'balanced' ? 14 : item.energyFit === 'low_pressure' ? 12 : 10;
      }

      if (avoidCrowds && item.category === 'Restaurant Dates') {
        score -= 8;
      }
      if (item.estimatedBudget === 'free_or_low') {
        score += 6;
      }
      if (partnerSharedRecharge?.shareWithPartner) {
        if (
          partnerSharedRecharge.nextWeekWish === 'more_quiet_time' &&
          (item.category === 'Relaxing Time at Home' || item.category === 'Movie Nights')
        ) {
          score += 18;
        }
        if (
          partnerSharedRecharge.nextWeekWish === 'more_shared_outings' &&
          (item.category === 'Outdoor Activities' ||
            item.category === 'Weekend Trips' ||
            item.category === 'Restaurant Dates')
        ) {
          score += 18;
        }
      }

      return {
        ...item,
        matchScore: score,
        lowPressureRecommended: item.energyFit === 'low_pressure',
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
