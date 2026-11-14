import {
  EnergyRecord,
  ForecastConfidence,
  ForecastDay,
  PresentationPartnerAnalytics,
  WeekdayAnalyticsItem,
  WeekdayPatternResult,
} from '@/src/types/dualcharge';

const MIN_PATTERN_OBSERVATIONS = 4;
const MIN_PATTERN_WEEKS = 4;
const MIN_WEEKDAY_DROP_POINTS = 12;
const MIN_RECORD_DROP_POINTS = 8;
const MIN_BELOW_BASELINE_PCT = 60;
const MIN_FORECAST_TOTAL_RECORDS = 7;
const EPSILON = 1e-9;

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function isValidISODate(dateISO: unknown): dateISO is string {
  if (typeof dateISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateISO.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function isValidEnergyValue(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100;
}

export function isValidSleepHours(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 24;
}

export function parseISODateLocal(dateISO: string): Date {
  const [yearStr, monthStr, dayStr] = dateISO.split('-');
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
}

export function formatLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCalendarWeekKey(dateISO: string): string {
  const date = parseISODateLocal(dateISO);
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isPreviousCalendarDay(prevISO: string, currentISO: string): boolean {
  const prev = parseISODateLocal(prevISO);
  const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1);
  return formatLocalDateISO(next) === currentISO;
}

function sanitizeAndSortRecords(records: EnergyRecord[]): EnergyRecord[] {
  if (!Array.isArray(records)) return [];
  const valid = records.filter(
    (r): r is EnergyRecord =>
      Boolean(r) &&
      typeof r === 'object' &&
      isValidISODate(r.date) &&
      isValidEnergyValue(r.estimated_energy_index_0_to_100)
  );
  return [...valid].sort((a, b) => a.date.localeCompare(b.date));
}

interface WeekdayStatsComputation {
  items: WeekdayAnalyticsItem[];
  rawMeans: Map<number, number>;
}

function computeWeekdayAnalyticsInternal(
  sortedRecords: EnergyRecord[],
  overallMeanRaw: number
): WeekdayStatsComputation {
  interface Bucket {
    records: EnergyRecord[];
    weeks: Set<string>;
    validSleeps: number[];
    prevSleeps: number[];
    otherPrevSleeps: number[];
  }

  const buckets = new Map<number, Bucket>();
  for (let wd = 0; wd < 7; wd++) {
    buckets.set(wd, {
      records: [],
      weeks: new Set(),
      validSleeps: [],
      prevSleeps: [],
      otherPrevSleeps: [],
    });
  }

  for (let i = 0; i < sortedRecords.length; i++) {
    const rec = sortedRecords[i];
    const wd = parseISODateLocal(rec.date).getDay();
    const bucket = buckets.get(wd)!;
    bucket.records.push(rec);
    bucket.weeks.add(getCalendarWeekKey(rec.date));

    if (isValidSleepHours(rec.sleep_hours)) {
      bucket.validSleeps.push(rec.sleep_hours);
    }

    if (i > 0) {
      const prevRec = sortedRecords[i - 1];
      if (isPreviousCalendarDay(prevRec.date, rec.date) && isValidSleepHours(prevRec.sleep_hours)) {
        const prevSleep = prevRec.sleep_hours;
        bucket.prevSleeps.push(prevSleep);
        for (let otherWd = 0; otherWd < 7; otherWd++) {
          if (otherWd !== wd) {
            buckets.get(otherWd)!.otherPrevSleeps.push(prevSleep);
          }
        }
      }
    }
  }

  const items: WeekdayAnalyticsItem[] = [];
  const rawMeans = new Map<number, number>();

  for (let wd = 0; wd < 7; wd++) {
    const b = buckets.get(wd)!;
    const count = b.records.length;
    if (count === 0) {
      items.push({
        weekdayIndex: wd,
        observationCount: 0,
        qualifyingWeeks: 0,
        averageEnergy: null,
        averageSleepHours: null,
        prevNightAvgSleepHours: null,
        otherNightsAvgSleepHours: null,
        belowThreshold8Count: 0,
        belowThreshold8Pct: 0,
        dropFromOverall: null,
      });
      continue;
    }

    const energySum = b.records.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0);
    const meanEnergyRaw = energySum / count;
    rawMeans.set(wd, meanEnergyRaw);

    const belowThreshold8Count = b.records.filter(
      (r) => overallMeanRaw - r.estimated_energy_index_0_to_100 >= MIN_RECORD_DROP_POINTS - EPSILON
    ).length;
    const belowThreshold8Pct = roundToOneDecimal((belowThreshold8Count / count) * 100);

    const averageSleepHours =
      b.validSleeps.length > 0
        ? roundToOneDecimal(b.validSleeps.reduce((s, v) => s + v, 0) / b.validSleeps.length)
        : null;

    const prevNightAvgSleepHours =
      b.prevSleeps.length > 0
        ? roundToOneDecimal(b.prevSleeps.reduce((s, v) => s + v, 0) / b.prevSleeps.length)
        : null;
    const otherNightsAvgSleepHours =
      b.otherPrevSleeps.length > 0
        ? roundToOneDecimal(
            b.otherPrevSleeps.reduce((s, v) => s + v, 0) / b.otherPrevSleeps.length
          )
        : null;

    items.push({
      weekdayIndex: wd,
      observationCount: count,
      qualifyingWeeks: b.weeks.size,
      averageEnergy: roundToOneDecimal(meanEnergyRaw),
      averageSleepHours,
      prevNightAvgSleepHours,
      otherNightsAvgSleepHours,
      belowThreshold8Count,
      belowThreshold8Pct,
      dropFromOverall: roundToOneDecimal(overallMeanRaw - meanEnergyRaw),
    });
  }

  return { items, rawMeans };
}

export function computeWeekdayAnalytics(
  sortedRecords: EnergyRecord[],
  overallMeanRaw: number
): WeekdayAnalyticsItem[] {
  return computeWeekdayAnalyticsInternal(sortedRecords, overallMeanRaw).items;
}

export function detectRecurringWeekdayPattern(
  sortedRecords: EnergyRecord[],
  overallMeanRaw: number,
  recent7DayMean: number,
  overallAvgSleepHours: number | null,
  minEnergy: number,
  maxEnergy: number,
  belowBaselineCount: number,
  belowBaselinePct: number,
  weekdayStats: WeekdayAnalyticsItem[],
  rawWeekdayMeans?: Map<number, number>
): WeekdayPatternResult {
  const overallMean = roundToOneDecimal(overallMeanRaw);
  const candidates = weekdayStats.filter((item) => {
    if (item.averageEnergy === null || item.dropFromOverall === null) return false;
    const rawMean = rawWeekdayMeans?.get(item.weekdayIndex) ?? item.averageEnergy;
    return (
      item.observationCount >= MIN_PATTERN_OBSERVATIONS &&
      item.qualifyingWeeks >= MIN_PATTERN_WEEKS &&
      overallMeanRaw - rawMean >= MIN_WEEKDAY_DROP_POINTS - EPSILON &&
      item.belowThreshold8Pct >= MIN_BELOW_BASELINE_PCT - EPSILON
    );
  });

  // Select the weekday with the largest drop below overall average
  candidates.sort((a, b) => (b.dropFromOverall ?? 0) - (a.dropFromOverall ?? 0));
  const detected = candidates[0] ?? null;

  const sleepDifferenceHours =
    detected &&
    detected.prevNightAvgSleepHours !== null &&
    detected.otherNightsAvgSleepHours !== null
      ? roundToOneDecimal(
          Math.max(0, detected.otherNightsAvgSleepHours - detected.prevNightAvgSleepHours)
        )
      : null;

  const supportingEvidence = {
    totalRecords: sortedRecords.length,
    minEnergy,
    maxEnergy,
    overallAvgSleepHours,
    recent7DayMean,
    belowBaselineCount,
    belowBaselinePct,
  };

  if (!detected) {
    return {
      hasPattern: false,
      detectedWeekdayIndex: null,
      overallMean,
      weekdayMean: null,
      dropFromOverall: null,
      observationCount: 0,
      qualifyingWeeks: 0,
      belowThresholdCount: 0,
      percentageBelowBaseline: 0,
      prevNightAvgSleepHours: null,
      otherNightsAvgSleepHours: null,
      sleepDifferenceHours: null,
      supportingEvidence,
    };
  }

  return {
    hasPattern: true,
    detectedWeekdayIndex: detected.weekdayIndex,
    overallMean,
    weekdayMean: detected.averageEnergy,
    dropFromOverall: detected.dropFromOverall,
    observationCount: detected.observationCount,
    qualifyingWeeks: detected.qualifyingWeeks,
    belowThresholdCount: detected.belowThreshold8Count,
    percentageBelowBaseline: detected.belowThreshold8Pct,
    prevNightAvgSleepHours: detected.prevNightAvgSleepHours,
    otherNightsAvgSleepHours: detected.otherNightsAvgSleepHours,
    sleepDifferenceHours,
    supportingEvidence,
  };
}

export function generateSevenDayForecast(
  sortedRecords: EnergyRecord[],
  weekdayStats: WeekdayAnalyticsItem[],
  overallMeanRaw: number,
  recent7DayMeanRaw: number,
  pattern: WeekdayPatternResult
): ForecastDay[] {
  const lastRecord = sortedRecords[sortedRecords.length - 1];
  const anchorDate = lastRecord ? parseISODateLocal(lastRecord.date) : new Date(2026, 10, 13);
  const recent7Rounded = roundToOneDecimal(recent7DayMeanRaw);
  const overallRounded = roundToOneDecimal(overallMeanRaw);
  const hasMinimumHistory = sortedRecords.length >= MIN_FORECAST_TOTAL_RECORDS;

  // Precompute raw weekday means for exact formula precision before rounding
  const rawWeekdayMeans = new Map<number, number>();
  for (let wd = 0; wd < 7; wd++) {
    const matching = sortedRecords.filter((r) => parseISODateLocal(r.date).getDay() === wd);
    if (matching.length > 0) {
      rawWeekdayMeans.set(
        wd,
        matching.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0) / matching.length
      );
    }
  }

  const forecast: ForecastDay[] = [];
  for (let offset = 1; offset <= 7; offset++) {
    const targetDate = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth(),
      anchorDate.getDate() + offset
    );
    const weekdayIndex = targetDate.getDay();
    const stat = weekdayStats[weekdayIndex];
    const rawWeekdayMean = rawWeekdayMeans.get(weekdayIndex);

    let confidence: ForecastConfidence = 'Insufficient Data';
    let estimatedEnergy: number | null = null;

    if (hasMinimumHistory && stat && stat.observationCount > 0 && rawWeekdayMean !== undefined) {
      confidence =
        stat.observationCount >= MIN_PATTERN_OBSERVATIONS &&
        stat.qualifyingWeeks >= MIN_PATTERN_WEEKS
          ? 'Moderate'
          : 'Low';
      const rawEstimate = 0.75 * rawWeekdayMean + 0.25 * recent7DayMeanRaw;
      estimatedEnergy = Math.max(0, Math.min(100, Math.round(rawEstimate)));
    }

    forecast.push({
      dateISO: formatLocalDateISO(targetDate),
      year: targetDate.getFullYear(),
      monthIndex: targetDate.getMonth(),
      dayOfMonth: targetDate.getDate(),
      weekdayIndex,
      estimatedEnergy,
      confidence,
      isHighlighted:
        pattern.hasPattern &&
        pattern.detectedWeekdayIndex !== null &&
        weekdayIndex === pattern.detectedWeekdayIndex,
      supportingEvidence: {
        weekdayObservationCount: stat?.observationCount ?? 0,
        qualifyingWeeks: stat?.qualifyingWeeks ?? 0,
        weekdayMean: stat?.averageEnergy ?? null,
        recent7DayMean: recent7Rounded,
        overallMean: overallRounded,
      },
    });
  }

  return forecast;
}

export function analyzePresentationPartner(records: EnergyRecord[]): PresentationPartnerAnalytics {
  const sortedRecords = sanitizeAndSortRecords(records);
  const count = sortedRecords.length;

  if (count === 0) {
    const emptyWeekdays = computeWeekdayAnalytics([], 0);
    const emptyPattern = detectRecurringWeekdayPattern(
      [],
      0,
      0,
      null,
      0,
      0,
      0,
      0,
      emptyWeekdays
    );
    return {
      recordCount: 0,
      overallMean: 0,
      recent7DayMean: 0,
      overallAvgSleepHours: null,
      minEnergy: 0,
      maxEnergy: 0,
      belowBaselineCount: 0,
      belowBaselinePct: 0,
      weekdayStats: emptyWeekdays,
      pattern: emptyPattern,
      forecast7Days: generateSevenDayForecast([], emptyWeekdays, 0, 0, emptyPattern),
    };
  }

  const totalEnergy = sortedRecords.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0);
  const overallMeanRaw = totalEnergy / count;
  const overallMean = roundToOneDecimal(overallMeanRaw);

  const recent7 = sortedRecords.slice(-7);
  const recent7DayMeanRaw =
    recent7.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0) / recent7.length;
  const recent7DayMean = roundToOneDecimal(recent7DayMeanRaw);

  const validSleepRecords = sortedRecords.filter((r) => isValidSleepHours(r.sleep_hours));
  const overallAvgSleepHours =
    validSleepRecords.length > 0
      ? roundToOneDecimal(
          validSleepRecords.reduce((s, r) => s + r.sleep_hours, 0) / validSleepRecords.length
        )
      : null;

  const energies = sortedRecords.map((r) => r.estimated_energy_index_0_to_100);
  const minEnergy = Math.min(...energies);
  const maxEnergy = Math.max(...energies);

  const belowBaselineCount = sortedRecords.filter(
    (r) => r.estimated_energy_index_0_to_100 < overallMeanRaw
  ).length;
  const belowBaselinePct = roundToOneDecimal((belowBaselineCount / count) * 100);

  const { items: weekdayStats, rawMeans } = computeWeekdayAnalyticsInternal(
    sortedRecords,
    overallMeanRaw
  );
  const pattern = detectRecurringWeekdayPattern(
    sortedRecords,
    overallMeanRaw,
    recent7DayMean,
    overallAvgSleepHours,
    minEnergy,
    maxEnergy,
    belowBaselineCount,
    belowBaselinePct,
    weekdayStats,
    rawMeans
  );
  const forecast7Days = generateSevenDayForecast(
    sortedRecords,
    weekdayStats,
    overallMeanRaw,
    recent7DayMeanRaw,
    pattern
  );

  return {
    recordCount: count,
    overallMean,
    recent7DayMean,
    overallAvgSleepHours,
    minEnergy,
    maxEnergy,
    belowBaselineCount,
    belowBaselinePct,
    weekdayStats,
    pattern,
    forecast7Days,
  };
}
