import { parseISODateLocal } from './presentationAnalytics.ts';
import type {
  ActivityIntensity,
  EnergyRecord,
  HealthDataSource,
  HrvMetricType,
  MultiDimensionalDayPoint,
  MultiDimensionalPartnerSummary,
  PartnerId,
} from '../../types/dualcharge.ts';

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round0(val: number): number {
  return Math.round(val);
}

function deterministicHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function isValidNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val > 0;
}

function computeMean(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return round1(sum / values.length);
}

/**
 * Deterministically enriches each canonical 60-day demo record with simulated multi-dimensional
 * Apple Health / Health Connect metrics while leaving core Stage 3 fields
 * (date, sleep_hours, sleep_quality_1_to_5, activity_minutes, self_reported_energy_1_to_5,
 * estimated_energy_index_0_to_100) 100% untouched.
 *
 * Intentionally leaves sparse days as `null` to prove null-safe handling (never substitutes 0 for missing).
 */
export function enrichDemoRecordWithMultiDimensionalMetrics(
  record: EnergyRecord,
  index: number,
  partnerId: PartnerId
): EnergyRecord {
  const localDate = parseISODateLocal(record.date);
  const weekdayIndex = localDate.getDay();
  const isAlex = partnerId === 'alex';

  const source: HealthDataSource = isAlex ? 'Simulated Apple Health' : 'Simulated Health Connect';
  const metricType: HrvMetricType = isAlex ? 'RMSSD' : 'SDNN';
  const r1 = deterministicHash(`${partnerId}-${record.date}-a`);
  const r2 = deterministicHash(`${partnerId}-${record.date}-b`);
  const r3 = deterministicHash(`${partnerId}-${record.date}-c`);

  // Intentional missing days (~4 out of 60 days per stream) to demonstrate nullable health schema
  const missingRhr = isAlex ? index === 11 || index === 34 || index === 52 : index === 8 || index === 29 || index === 48;
  const missingHrv = isAlex ? index === 11 || index === 25 || index === 44 : index === 8 || index === 21 || index === 48;
  const missingSleepStages = isAlex ? index === 19 || index === 41 : index === 14 || index === 37;
  const missingSteps = isAlex ? index === 31 : index === 26;

  // RHR centered around personal baseline (Alex ~61 bpm, Jamie ~67 bpm; never cross-compared)
  const rhrBase = isAlex ? 61 : 67;
  const lowEnergyPenalty = record.estimated_energy_index_0_to_100 < 55 ? 2.8 : 0;
  const rhrValue = missingRhr
    ? null
    : round1(rhrBase + lowEnergyPenalty + (r1 - 0.5) * 4.2 + (weekdayIndex === 4 && !isAlex ? 1.8 : 0));

  // HRV centered around partner's own scale (Alex RMSSD ~46 ms; Jamie SDNN ~54 ms)
  const hrvBase = isAlex ? 46 : 54;
  const hrvAdjustment = (record.estimated_energy_index_0_to_100 - (isAlex ? 87 : 68)) * 0.18;
  const hrvValue = missingHrv
    ? null
    : round1(Math.max(24, hrvBase + hrvAdjustment + (r2 - 0.5) * 8));

  // Sleep stage breakdown in minutes totaling roughly sleep_hours * 60 when available
  const totalSleepMin = isValidNumber(record.sleep_hours) ? record.sleep_hours * 60 : null;
  let deepMin: number | null = null;
  let remMin: number | null = null;
  let lightMin: number | null = null;
  let awakeMin: number | null = null;

  if (!missingSleepStages && totalSleepMin !== null) {
    const deepShare = isAlex ? 0.19 + (r1 - 0.5) * 0.04 : 0.16 + (r1 - 0.5) * 0.04;
    const remShare = isAlex ? 0.22 + (r2 - 0.5) * 0.04 : 0.2 + (r2 - 0.5) * 0.04;
    const awakeFraction = record.sleep_quality_1_to_5 <= 2 ? 0.07 : 0.035;
    deepMin = round0(totalSleepMin * deepShare);
    remMin = round0(totalSleepMin * remShare);
    awakeMin = round0(totalSleepMin * awakeFraction + r3 * 6);
    lightMin = Math.max(40, round0(totalSleepMin - deepMin - remMin));
  }

  // Steps & intensity aligned with activity_minutes without mutating activity_minutes
  const steps = missingSteps
    ? null
    : round0(Math.max(2400, (record.activity_minutes || 25) * 145 + (isAlex ? 2600 : 1900) + (r3 - 0.5) * 1400));

  const intensity: ActivityIntensity | null = missingSteps
    ? null
    : record.activity_minutes >= 45
      ? 'Vigorous'
      : record.activity_minutes >= 25
        ? 'Moderate'
        : 'Low';

  // Optional simulated cycle metadata ONLY present when record explicitly carries opt-in metadata.
  // In presentation demo, Jamie has sample simulated cycle metadata gated behind explicit opt-in & separate share toggle.
  const cycleFields = !isAlex
    ? {
        period_start_date: '2026-10-29',
        period_end_date: '2026-11-02',
        recorded_cycle_day: ((index + 12) % 28) + 1,
        recorded_cycle_phase:
          ((index + 12) % 28) + 1 <= 5
            ? 'Menstrual'
            : ((index + 12) % 28) + 1 <= 13
              ? 'Follicular'
              : ((index + 12) % 28) + 1 <= 16
                ? 'Ovulatory'
                : 'Luteal',
        is_estimated: true,
        explicit_cycle_tracking_consent: true,
      }
    : {
        period_start_date: null,
        period_end_date: null,
        recorded_cycle_day: null,
        recorded_cycle_phase: null,
        is_estimated: null,
        explicit_cycle_tracking_consent: null,
      };

  return {
    ...record,
    measurement_source: source,
    measurement_date: record.date,
    sleep_stage_deep_minutes: deepMin,
    sleep_stage_rem_minutes: remMin,
    sleep_stage_light_minutes: lightMin,
    sleep_stage_awake_minutes: awakeMin,
    resting_heart_rate_bpm: rhrValue,
    hrv_value_ms: hrvValue,
    hrv_metric_type: metricType,
    steps,
    activity_intensity: intensity,
    ...cycleFields,
  };
}

export function computeMultiDimensionalSummary(
  records: EnergyRecord[],
  partnerId: PartnerId
): MultiDimensionalPartnerSummary {
  const isAlex = partnerId === 'alex';
  const defaultMetricType: HrvMetricType = isAlex ? 'RMSSD' : 'SDNN';
  const defaultSource: HealthDataSource = isAlex
    ? 'Simulated Apple Health'
    : 'Simulated Health Connect';

  const series: MultiDimensionalDayPoint[] = records.map((rec) => {
    const d = parseISODateLocal(rec.date);
    return {
      dateISO: rec.date,
      monthIndex: d.getMonth(),
      dayOfMonth: d.getDate(),
      weekdayIndex: d.getDay(),
      restingHeartRateBpm:
        typeof rec.resting_heart_rate_bpm === 'number' && Number.isFinite(rec.resting_heart_rate_bpm)
          ? rec.resting_heart_rate_bpm
          : null,
      hrvValueMs:
        typeof rec.hrv_value_ms === 'number' && Number.isFinite(rec.hrv_value_ms)
          ? rec.hrv_value_ms
          : null,
      hrvMetricType: rec.hrv_metric_type ?? defaultMetricType,
      sleepHours: isValidNumber(rec.sleep_hours) ? rec.sleep_hours : null,
      sleepDeepMinutes:
        typeof rec.sleep_stage_deep_minutes === 'number' ? rec.sleep_stage_deep_minutes : null,
      sleepRemMinutes:
        typeof rec.sleep_stage_rem_minutes === 'number' ? rec.sleep_stage_rem_minutes : null,
      sleepLightMinutes:
        typeof rec.sleep_stage_light_minutes === 'number' ? rec.sleep_stage_light_minutes : null,
      sleepAwakeMinutes:
        typeof rec.sleep_stage_awake_minutes === 'number' ? rec.sleep_stage_awake_minutes : null,
      steps: typeof rec.steps === 'number' ? rec.steps : null,
      activityMinutes:
        typeof rec.activity_minutes === 'number' && Number.isFinite(rec.activity_minutes)
          ? rec.activity_minutes
          : null,
      activityIntensity: rec.activity_intensity ?? null,
      measurementSource: rec.measurement_source ?? defaultSource,
    };
  });

  const validRhr = series
    .map((p) => p.restingHeartRateBpm)
    .filter((v): v is number => v !== null && v > 0);
  const recent7Rhr = series
    .slice(-7)
    .map((p) => p.restingHeartRateBpm)
    .filter((v): v is number => v !== null && v > 0);
  const rhrBaselineBpm = computeMean(validRhr);
  const rhrLatestBpm =
    [...series].reverse().find((p) => p.restingHeartRateBpm !== null)?.restingHeartRateBpm ?? null;
  const rhrLatestDeviationBpm =
    rhrBaselineBpm !== null && rhrLatestBpm !== null ? round1(rhrLatestBpm - rhrBaselineBpm) : null;

  // Filter strictly matching HRV metric type so SDNN & RMSSD are NEVER mixed into one mean
  const detectedMetricType =
    series.find((p) => p.hrvValueMs !== null && p.hrvMetricType)?.hrvMetricType ??
    defaultMetricType;
  const validHrv = series
    .filter((p) => p.hrvMetricType === detectedMetricType)
    .map((p) => p.hrvValueMs)
    .filter((v): v is number => v !== null && v > 0);
  const recent7Hrv = series
    .slice(-7)
    .filter((p) => p.hrvMetricType === detectedMetricType)
    .map((p) => p.hrvValueMs)
    .filter((v): v is number => v !== null && v > 0);
  const hrvBaselineMs = computeMean(validHrv);
  const hrvLatestMs =
    [...series]
      .reverse()
      .find((p) => p.hrvMetricType === detectedMetricType && p.hrvValueMs !== null)?.hrvValueMs ??
    null;
  const hrvLatestDeviationMs =
    hrvBaselineMs !== null && hrvLatestMs !== null ? round1(hrvLatestMs - hrvBaselineMs) : null;

  const deepVals = series.map((p) => p.sleepDeepMinutes).filter((v): v is number => v !== null);
  const remVals = series.map((p) => p.sleepRemMinutes).filter((v): v is number => v !== null);
  const lightVals = series.map((p) => p.sleepLightMinutes).filter((v): v is number => v !== null);
  const awakeVals = series.map((p) => p.sleepAwakeMinutes).filter((v): v is number => v !== null);
  const latestWithStages = [...series]
    .reverse()
    .find((p) => p.sleepDeepMinutes !== null && p.sleepRemMinutes !== null);

  const validSteps = series.map((p) => p.steps).filter((v): v is number => v !== null);
  const recent7Steps = series
    .slice(-7)
    .map((p) => p.steps)
    .filter((v): v is number => v !== null);
  const latestWithSteps = [...series].reverse().find((p) => p.steps !== null);

  const intensityBreakdown: Record<ActivityIntensity, number> = {
    Low: 0,
    Moderate: 0,
    Vigorous: 0,
  };
  series.forEach((p) => {
    if (p.activityIntensity) {
      intensityBreakdown[p.activityIntensity] += 1;
    }
  });

  const weekdayActivityAverages = Array.from({ length: 7 }, (_, weekdayIndex) => {
    const matching = series.filter((p) => p.weekdayIndex === weekdayIndex);
    const mins = matching
      .map((p) => p.activityMinutes)
      .filter((v): v is number => v !== null);
    const stepsList = matching.map((p) => p.steps).filter((v): v is number => v !== null);
    return {
      weekdayIndex,
      avgMinutes: mins.length > 0 ? round0(mins.reduce((a, b) => a + b, 0) / mins.length) : null,
      avgSteps:
        stepsList.length > 0
          ? round0(stepsList.reduce((a, b) => a + b, 0) / stepsList.length)
          : null,
      count: matching.length,
    };
  });

  return {
    partnerId,
    measurementSource: defaultSource,
    validRhrDays: validRhr.length,
    rhrBaselineBpm,
    rhrLatestBpm,
    rhrLatestDeviationBpm,
    rhrRecent7MeanBpm: computeMean(recent7Rhr),
    rhrMinBpm: validRhr.length > 0 ? Math.min(...validRhr) : null,
    rhrMaxBpm: validRhr.length > 0 ? Math.max(...validRhr) : null,
    hrvMetricType: detectedMetricType,
    validHrvDays: validHrv.length,
    hrvBaselineMs,
    hrvLatestMs,
    hrvLatestDeviationMs,
    hrvRecent7MeanMs: computeMean(recent7Hrv),
    hrvMinMs: validHrv.length > 0 ? Math.min(...validHrv) : null,
    hrvMaxMs: validHrv.length > 0 ? Math.max(...validHrv) : null,
    validSleepStageDays: deepVals.length,
    avgDeepMinutes: deepVals.length > 0 ? round0(deepVals.reduce((a, b) => a + b, 0) / deepVals.length) : null,
    avgRemMinutes: remVals.length > 0 ? round0(remVals.reduce((a, b) => a + b, 0) / remVals.length) : null,
    avgLightMinutes: lightVals.length > 0 ? round0(lightVals.reduce((a, b) => a + b, 0) / lightVals.length) : null,
    avgAwakeMinutes: awakeVals.length > 0 ? round0(awakeVals.reduce((a, b) => a + b, 0) / awakeVals.length) : null,
    latestDeepMinutes: latestWithStages?.sleepDeepMinutes ?? null,
    latestRemMinutes: latestWithStages?.sleepRemMinutes ?? null,
    latestLightMinutes: latestWithStages?.sleepLightMinutes ?? null,
    latestAwakeMinutes: latestWithStages?.sleepAwakeMinutes ?? null,
    validStepsDays: validSteps.length,
    avgStepsAll: validSteps.length > 0 ? round0(validSteps.reduce((a, b) => a + b, 0) / validSteps.length) : null,
    avgSteps7d: recent7Steps.length > 0 ? round0(recent7Steps.reduce((a, b) => a + b, 0) / recent7Steps.length) : null,
    latestSteps: latestWithSteps?.steps ?? null,
    latestIntensity: latestWithSteps?.activityIntensity ?? null,
    intensityBreakdown,
    weekdayActivityAverages,
    series,
  };
}
