import alexAvatar from '@/src/assets/images/avatar_alex_1794573748589.jpg';
import jamieAvatar from '@/src/assets/images/avatar_jamie_1794573749370.jpg';
import {
  analyzePresentationPartner,
  isValidEnergyValue,
  isValidISODate,
  isValidSleepHours,
  parseISODateLocal,
} from '@/src/data/presentation/presentationAnalytics';
import {
  computeMultiDimensionalSummary,
  enrichDemoRecordWithMultiDimensionalMetrics,
} from '@/src/data/presentation/multidimensionalData';
import {
  CanonicalPartnerId,
  EnergyIndexSummary,
  EnergyRecord,
  HistoricalEnergyPoint,
  MultiDimensionalPartnerSummary,
  PartnerId,
  PartnerProfile,
  PartnerProfileData,
  PresentationBundle,
  PresentationPartnerAnalytics,
  RawDemoDataset,
} from '@/src/types/dualcharge';

let cachedBundle: PresentationBundle | null = null;
let inFlightPromise: Promise<PresentationBundle> | null = null;

function toCanonicalPartnerId(partner: PartnerId): CanonicalPartnerId {
  return partner === 'alex' ? 'partner_a' : 'partner_b';
}

function toHistoricalEnergyPoint(record: EnergyRecord): HistoricalEnergyPoint {
  const localDate = parseISODateLocal(record.date);
  return {
    dateISO: record.date,
    year: localDate.getFullYear(),
    monthIndex: localDate.getMonth(),
    dayOfMonth: localDate.getDate(),
    weekdayIndex: localDate.getDay(),
    isThursday: localDate.getDay() === 4,
    energy: record.estimated_energy_index_0_to_100,
    prevNightSleepHours: isValidSleepHours(record.sleep_hours) ? record.sleep_hours : null,
  };
}

function getPartnerLast60Records(
  dataset: RawDemoDataset,
  canonicalId: CanonicalPartnerId
): EnergyRecord[] {
  return dataset.records
    .filter(
      (record) =>
        record &&
        record.partner_id === canonicalId &&
        isValidISODate(record.date) &&
        isValidEnergyValue(record.estimated_energy_index_0_to_100)
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60);
}

function computePartnerSummary(
  dataset: RawDemoDataset,
  partnerId: PartnerId,
  records: EnergyRecord[],
  analytics: PresentationPartnerAnalytics
): EnergyIndexSummary {
  const canonicalPartnerId = toCanonicalPartnerId(partnerId);
  const latestRecord = records[records.length - 1];
  const thursdayStat = analytics.weekdayStats[4];

  return {
    partnerId,
    canonicalPartnerId,
    recordCount: analytics.recordCount,
    dateRange: {
      start: records[0]?.date ?? dataset.date_range.start,
      end: latestRecord?.date ?? dataset.date_range.end,
      days: analytics.recordCount,
    },
    latestEnergy: latestRecord?.estimated_energy_index_0_to_100 ?? 0,
    overallMean: analytics.overallMean,
    recent7DayMean: analytics.recent7DayMean,
    overallAvgSleepHours: analytics.overallAvgSleepHours,
    belowBaselineCount: analytics.belowBaselineCount,
    belowBaselineProportion: analytics.belowBaselinePct,
    thursdayMean: thursdayStat?.averageEnergy ?? 0,
    thursdayCount: thursdayStat?.observationCount ?? 0,
    prevDayBeforeThursdaySleepMean: thursdayStat?.prevNightAvgSleepHours ?? null,
  };
}

export function buildPresentationBundle(dataset: RawDemoDataset): PresentationBundle {
  const alexRecords = getPartnerLast60Records(dataset, 'partner_a').map((rec, idx) =>
    enrichDemoRecordWithMultiDimensionalMetrics(rec, idx, 'alex')
  );
  const jamieRecords = getPartnerLast60Records(dataset, 'partner_b').map((rec, idx) =>
    enrichDemoRecordWithMultiDimensionalMetrics(rec, idx, 'jamie')
  );

  const alexAnalytics = analyzePresentationPartner(alexRecords);
  const jamieAnalytics = analyzePresentationPartner(jamieRecords);

  const alexMultiDimensional = computeMultiDimensionalSummary(alexRecords, 'alex');
  const jamieMultiDimensional = computeMultiDimensionalSummary(jamieRecords, 'jamie');

  const alexSummary = computePartnerSummary(dataset, 'alex', alexRecords, alexAnalytics);
  const jamieSummary = computePartnerSummary(dataset, 'jamie', jamieRecords, jamieAnalytics);

  const alexLatest = alexRecords[alexRecords.length - 1];
  const jamieLatest = jamieRecords[jamieRecords.length - 1];

  const alexHistoryPoints = alexRecords.map(toHistoricalEnergyPoint);
  const jamieHistoryPoints = jamieRecords.map(toHistoricalEnergyPoint);

  const buildPartnerMeta = (partnerId: PartnerId): PartnerProfile => {
    const canonicalId = toCanonicalPartnerId(partnerId);
    const rawPartner = dataset.partners[canonicalId];
    return {
      id: partnerId,
      canonicalId,
      display_name: rawPartner.display_name,
      role: rawPartner.role,
      care_preferences: {
        preferred_care: [...rawPartner.care_preferences.preferred_care],
        food_preferences: [...rawPartner.care_preferences.food_preferences],
        avoid: [...rawPartner.care_preferences.avoid],
        communication_style: rawPartner.care_preferences.communication_style,
      },
      shared_fields: [...rawPartner.shared_fields],
      pattern_note: rawPartner.pattern_note,
    };
  };

  const buildPartnerProfileData = (
    partnerId: PartnerId,
    meta: PartnerProfile,
    avatarUrl: string,
    latestRecord: EnergyRecord,
    historyPoints: HistoricalEnergyPoint[],
    analytics: PresentationPartnerAnalytics,
    multiDimensional: MultiDimensionalPartnerSummary
  ): PartnerProfileData => {
    const detectedStat =
      analytics.pattern.hasPattern && analytics.pattern.detectedWeekdayIndex !== null
        ? analytics.weekdayStats[analytics.pattern.detectedWeekdayIndex]
        : null;

    return {
      id: partnerId,
      name: meta.display_name,
      avatarUrl,
      latestEnergy: latestRecord?.estimated_energy_index_0_to_100 ?? 0,
      todaySummary: {
        sleepDurationHours: latestRecord?.sleep_hours ?? 0,
        sleepQualityScore: latestRecord?.sleep_quality_1_to_5 ?? 0,
        activityMinutes: latestRecord?.activity_minutes ?? 0,
      },
      insights: {
        hasPattern: analytics.pattern.hasPattern,
        detectedWeekdayIndex: analytics.pattern.detectedWeekdayIndex,
        overallAvgEnergy: analytics.overallMean,
        recent7DayMean: analytics.recent7DayMean,
        thursdayAvgEnergy: detectedStat?.averageEnergy ?? undefined,
        thursdayObservations: detectedStat?.observationCount ?? undefined,
        prevDayAvgSleepHours: detectedStat?.prevNightAvgSleepHours ?? undefined,
        analytics,
        historical60Days: historyPoints,
        forecast7Days: analytics.forecast7Days,
        multiDimensional,
      },
    };
  };

  const alexMeta = buildPartnerMeta('alex');
  const jamieMeta = buildPartnerMeta('jamie');

  const alexProfileData = buildPartnerProfileData(
    'alex',
    alexMeta,
    alexAvatar,
    alexLatest,
    alexHistoryPoints,
    alexAnalytics,
    alexMultiDimensional
  );
  const jamieProfileData = buildPartnerProfileData(
    'jamie',
    jamieMeta,
    jamieAvatar,
    jamieLatest,
    jamieHistoryPoints,
    jamieAnalytics,
    jamieMultiDimensional
  );

  return {
    dateRange: dataset.date_range,
    disclaimer: dataset.disclaimer,
    partnerMeta: { alex: alexMeta, jamie: jamieMeta },
    partnerProfiles: { alex: alexProfileData, jamie: jamieProfileData },
    summaries: { alex: alexSummary, jamie: jamieSummary },
    latestRecords: { alex: alexLatest, jamie: jamieLatest },
    historicalPoints: { alex: alexHistoryPoints, jamie: jamieHistoryPoints },
    multiDimensionalSummaries: {
      alex: alexMultiDimensional,
      jamie: jamieMultiDimensional,
    },
    partnerCarePrefs: {
      alex: alexMeta.care_preferences,
      jamie: jamieMeta.care_preferences,
    },
  };
}

/**
 * Lazy-load the canonical 60-day JSON dataset strictly for Presentation Demo Mode.
 * Never invoked during welcome, onboarding, or normal-user initialization.
 */
export async function loadPresentationBundle(): Promise<PresentationBundle> {
  if (cachedBundle) {
    return cachedBundle;
  }
  if (!inFlightPromise) {
    inFlightPromise = import('@/src/data/presentation/presentationDemoData.json').then((mod) => {
      const dataset = (mod.default ?? mod) as RawDemoDataset;
      cachedBundle = buildPresentationBundle(dataset);
      return cachedBundle;
    });
  }
  return inFlightPromise;
}

export function getCachedPresentationBundle(): PresentationBundle | null {
  return cachedBundle;
}
