/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeNormalBaseline,
  getTodayLocalDateISO,
  upsertNormalDailyRecord,
} from '../src/data/normal/normalBaseline';
import { selectNormalCareSuggestions } from '../src/data/normal/normalCare';
import {
  analyzePresentationPartner,
  computeWeekdayAnalytics,
  detectRecurringWeekdayPattern,
  generateSevenDayForecast,
  getCalendarWeekKey,
  roundToOneDecimal,
} from '../src/data/presentation/presentationAnalytics';
import rawDemoDataset from '../src/data/presentation/presentationDemoData.json';
import { TRANSLATIONS } from '../src/i18n/translations';
import { EnergyRecord, NormalDailyRecord, RawDemoDataset } from '../src/types/dualcharge';

const dataset = rawDemoDataset as RawDemoDataset;
const alexRecords = dataset.records.filter((r) => r.partner_id === 'partner_a');
const jamieRecords = dataset.records.filter((r) => r.partner_id === 'partner_b');

test('canonical dataset has exactly 60 records per demo partner', () => {
  assert.equal(alexRecords.length, 60);
  assert.equal(jamieRecords.length, 60);
  assert.equal(dataset.records.length, 120);
});

test('computes correct historical averages, weekday counts, and distinct weeks from JSON', () => {
  const alex = analyzePresentationPartner(alexRecords);
  const jamie = analyzePresentationPartner(jamieRecords);

  assert.equal(alex.recordCount, 60);
  assert.equal(jamie.recordCount, 60);

  // Verify overall mean against direct calculation from JSON
  const alexExpectedMean = roundToOneDecimal(
    alexRecords.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0) / 60
  );
  const jamieExpectedMean = roundToOneDecimal(
    jamieRecords.reduce((s, r) => s + r.estimated_energy_index_0_to_100, 0) / 60
  );
  assert.equal(alex.overallMean, alexExpectedMean);
  assert.equal(jamie.overallMean, jamieExpectedMean);

  // Weekday observation counts must sum to 60 and match 60-day range (Tue 2026-09-15 to Fri 2026-11-13)
  const alexCountSum = alex.weekdayStats.reduce((s, w) => s + w.observationCount, 0);
  const jamieCountSum = jamie.weekdayStats.reduce((s, w) => s + w.observationCount, 0);
  assert.equal(alexCountSum, 60);
  assert.equal(jamieCountSum, 60);

  // Tue (2), Wed (3), Thu (4), Fri (5) have 9 observations; Sat (6), Sun (0), Mon (1) have 8
  for (const wd of [2, 3, 4, 5]) {
    assert.equal(alex.weekdayStats[wd].observationCount, 9);
    assert.equal(alex.weekdayStats[wd].qualifyingWeeks, 9);
    assert.equal(jamie.weekdayStats[wd].observationCount, 9);
    assert.equal(jamie.weekdayStats[wd].qualifyingWeeks, 9);
  }
  for (const wd of [0, 1, 6]) {
    assert.equal(alex.weekdayStats[wd].observationCount, 8);
    assert.equal(alex.weekdayStats[wd].qualifyingWeeks, 8);
    assert.equal(jamie.weekdayStats[wd].observationCount, 8);
    assert.equal(jamie.weekdayStats[wd].qualifyingWeeks, 8);
  }

  // Distinct calendar week key sanity check
  assert.notEqual(getCalendarWeekKey('2026-09-17'), getCalendarWeekKey('2026-09-24'));
  assert.equal(getCalendarWeekKey('2026-09-14'), getCalendarWeekKey('2026-09-20'));
});

test('pattern detection emerges from data without forced assignment', () => {
  const alex = analyzePresentationPartner(alexRecords);
  const jamie = analyzePresentationPartner(jamieRecords);

  // Alex: no recurring low-energy weekday pattern
  assert.equal(alex.pattern.hasPattern, false);
  assert.equal(alex.pattern.detectedWeekdayIndex, null);

  // Jamie: Thursday dip emerges from data
  assert.equal(jamie.pattern.hasPattern, true);
  assert.equal(jamie.pattern.detectedWeekdayIndex, 4);
  assert.equal(jamie.pattern.observationCount, 9);
  assert.equal(jamie.pattern.qualifyingWeeks, 9);
  assert.ok((jamie.pattern.dropFromOverall ?? 0) >= 12);
  assert.ok(jamie.pattern.percentageBelowBaseline >= 60);
  assert.equal(jamie.pattern.prevNightAvgSleepHours, 5.7);

  // Verify not forced: flatten all Jamie records to steady energy -> pattern disappears
  const steadyJamie = jamieRecords.map((r) => ({ ...r, estimated_energy_index_0_to_100: 75 }));
  const flatResult = analyzePresentationPartner(steadyJamie);
  assert.equal(flatResult.pattern.hasPattern, false);

  // Verify weekday is not hardcoded to Thursday: shift the dip to Monday
  const mondayDipRecords: EnergyRecord[] = Array.from({ length: 35 }, (_, idx) => {
    const d = new Date(2026, 9, 1 + idx);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const isMon = d.getDay() === 1;
    return {
      date: iso,
      weekday: 'Day',
      partner_id: 'partner_a',
      sleep_hours: isMon ? 5.5 : 7.5,
      sleep_quality_1_to_5: isMon ? 2 : 4,
      activity_minutes: 30,
      self_reported_energy_1_to_5: isMon ? 2 : 5,
      estimated_energy_index_0_to_100: isMon ? 40 : 85,
      is_simulated: true,
    };
  });
  const mondayResult = analyzePresentationPartner(mondayDipRecords);
  assert.equal(mondayResult.pattern.hasPattern, true);
  assert.equal(mondayResult.pattern.detectedWeekdayIndex, 1);

  // Verify threshold boundaries: only 3 weeks for a dip weekday (< 4 required) -> no pattern
  const threeWeekDip: EnergyRecord[] = Array.from({ length: 21 }, (_, idx) => {
    const d = new Date(2026, 9, 1 + idx);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const isThu = d.getDay() === 4;
    return {
      date: iso,
      weekday: 'Day',
      partner_id: 'partner_a',
      sleep_hours: 7.5,
      sleep_quality_1_to_5: 4,
      activity_minutes: 30,
      self_reported_energy_1_to_5: isThu ? 2 : 5,
      estimated_energy_index_0_to_100: isThu ? 35 : 85,
      is_simulated: true,
    };
  });
  const threeWeekResult = analyzePresentationPartner(threeWeekDip);
  assert.equal(threeWeekResult.pattern.hasPattern, false);
});

test('7-day forecast generates consecutive dates, bounded 0-100 estimates, and accurate confidence', () => {
  const alex = analyzePresentationPartner(alexRecords);
  const jamie = analyzePresentationPartner(jamieRecords);

  assert.equal(alex.forecast7Days.length, 7);
  assert.equal(jamie.forecast7Days.length, 7);

  const expectedDates = [
    '2026-11-14',
    '2026-11-15',
    '2026-11-16',
    '2026-11-17',
    '2026-11-18',
    '2026-11-19',
    '2026-11-20',
  ];
  assert.deepEqual(
    alex.forecast7Days.map((d) => d.dateISO),
    expectedDates
  );
  assert.deepEqual(
    jamie.forecast7Days.map((d) => d.dateISO),
    expectedDates
  );

  for (const day of [...alex.forecast7Days, ...jamie.forecast7Days]) {
    assert.equal(day.confidence, 'Moderate');
    assert.ok(day.estimatedEnergy !== null);
    assert.ok(day.estimatedEnergy >= 0 && day.estimatedEnergy <= 100);
  }

  // Distinct weekday estimates (not one identical repeated value)
  assert.ok(new Set(jamie.forecast7Days.map((d) => d.estimatedEnergy)).size > 1);
  assert.ok(new Set(alex.forecast7Days.map((d) => d.estimatedEnergy)).size > 1);

  // Sparse subset (>= 7 records, < 4 weeks per weekday) -> Low confidence
  const sparseRecords = jamieRecords.slice(0, 14);
  const sparseAnalytics = analyzePresentationPartner(sparseRecords);
  assert.ok(sparseAnalytics.forecast7Days.every((d) => d.confidence === 'Low'));

  // Tiny subset (< 7 records) -> Insufficient Data and null estimates
  const tinyRecords = jamieRecords.slice(0, 4);
  const tinyAnalytics = analyzePresentationPartner(tinyRecords);
  assert.ok(
    tinyAnalytics.forecast7Days.every(
      (d) => d.confidence === 'Insufficient Data' && d.estimatedEnergy === null
    )
  );
});

test('handles unsorted, invalid, and missing-sleep records safely without fabricating values', () => {
  const reversedSubset = [...alexRecords].reverse();
  const forward = analyzePresentationPartner(alexRecords);
  const reversed = analyzePresentationPartner(reversedSubset);
  assert.equal(reversed.overallMean, forward.overallMean);
  assert.deepEqual(
    reversed.forecast7Days.map((d) => d.estimatedEnergy),
    forward.forecast7Days.map((d) => d.estimatedEnergy)
  );

  // Inject invalid records and missing sleep_hours
  const dirtyRecords = [
    ...alexRecords.slice(0, 10).map((r) => ({ ...r, sleep_hours: Number.NaN })),
    { ...alexRecords[0], date: 'invalid-date' },
    { ...alexRecords[1], date: '2026-02-30' },
    { ...alexRecords[2], estimated_energy_index_0_to_100: Number.NaN },
    { ...alexRecords[3], estimated_energy_index_0_to_100: 150 },
  ] as EnergyRecord[];

  const dirtyResult = analyzePresentationPartner(dirtyRecords);
  assert.equal(dirtyResult.recordCount, 10);
  assert.equal(dirtyResult.overallAvgSleepHours, null);
  assert.equal(dirtyResult.weekdayStats[4].prevNightAvgSleepHours, null);
  assert.ok(dirtyResult.overallMean > 0 && dirtyResult.overallMean <= 100);

  // Empty array
  const emptyResult = analyzePresentationPartner([]);
  assert.equal(emptyResult.recordCount, 0);
  assert.equal(emptyResult.overallAvgSleepHours, null);
  assert.equal(emptyResult.pattern.hasPattern, false);
  assert.ok(
    emptyResult.forecast7Days.every(
      (d) => d.confidence === 'Insufficient Data' && d.estimatedEnergy === null
    )
  );
});

test('Normal User Mode remains isolated on Day 1 cold start and enforces 7d/4w gates', () => {
  const today = getTodayLocalDateISO();
  const day1 = analyzeNormalBaseline([], today);
  assert.equal(day1.recordedDaysCount, 0);
  assert.equal(day1.phase, 'building');
  assert.equal(day1.earlyInsight, null);
  assert.equal(day1.canShowFutureForecast, false);

  let recs: NormalDailyRecord[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2026, 10, 1 + i);
    recs = upsertNormalDailyRecord(recs, i % 2 === 0 ? 'good' : 'tired', '9:00 AM', d);
  }
  const day7 = analyzeNormalBaseline(recs, '2026-11-01', new Date(2026, 10, 7));
  assert.equal(day7.recordedDaysCount, 7);
  assert.equal(day7.phase, 'preliminary');
  assert.ok(day7.earlyInsight !== null);
  assert.equal(day7.weekdayPattern.hasEnoughWeekdayRepeats, false);
  assert.equal(day7.canShowFutureForecast, false);

  const suggestions = selectNormalCareSuggestions(['warm_drinks'], ['crowded_places']);
  assert.ok(suggestions.length > 0);
});

test('en, zh-CN, and zh-TW translation dictionaries have complete structural key parity', () => {
  const collectPaths = (obj: unknown, prefix = ''): string[] => {
    if (Array.isArray(obj)) {
      return [`${prefix}[${obj.length}]`];
    }
    if (obj && typeof obj === 'object') {
      return Object.entries(obj).flatMap(([k, v]) =>
        collectPaths(v, prefix ? `${prefix}.${k}` : k)
      );
    }
    return [prefix];
  };

  const enPaths = collectPaths(TRANSLATIONS.en).sort();
  const zhCnPaths = collectPaths(TRANSLATIONS['zh-CN']).sort();
  const zhTwPaths = collectPaths(TRANSLATIONS['zh-TW']).sort();

  assert.deepEqual(zhCnPaths, enPaths);
  assert.deepEqual(zhTwPaths, enPaths);
});
