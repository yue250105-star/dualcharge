import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Calendar,
  CalendarHeart,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Eye,
  HeartPulse,
  Lock,
  Moon,
  Sparkles,
  UserPlus,
  Waves,
} from 'lucide-react';
import { PremiumFeaturePreview } from '@/src/components/membership/PremiumFeaturePreview';
import {
  BiometricTrendChart,
  ForecastChart,
  HistoricalTrendChart,
  SleepStagesBreakdownBar,
  WeekdayActivityChart,
} from '@/src/components/ui/Charts';
import { getEnergyStateStyle } from '@/src/components/ui/EnergyIndicator';
import { useDualCharge } from '@/src/context/DualChargeContext';
import { formatTemplate } from '@/src/i18n/translations';
import { getMembershipCapabilities } from '@/src/services/membershipService';
import { ForecastDay, PartnerId } from '@/src/types/dualcharge';

interface InsightsPageProps {
  partnerId: PartnerId;
  scope?: 'demo' | 'normal';
}

function NormalInsightsContent() {
  const {
    normalUser,
    normalPairing,
    normalBaseline,
    setNormalActivePage,
    t,
  } = useDualCharge();

  const [tab, setTab] = useState<'self' | 'partner'>('self');

  const {
    currentDayNumber,
    recordedDaysCount,
    progressTargetDays,
    phase,
    sortedRecords,
    earlyInsight,
    weekdayPattern,
    canShowFutureForecast,
  } = normalBaseline;

  const myDisplayName = normalUser.nickname || 'You';
  const partnerDisplayName = t.normalMode.partnerDisplayName;
  const progressPct = Math.min(100, Math.round((recordedDaysCount / progressTargetDays) * 100));

  return (
    <div className="space-y-4 pb-2">
      {/* Page Heading */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-[20px] font-semibold tracking-tight text-[#292832]">
            {t.insights.title}
          </h1>
          <span className="text-[11px] font-semibold text-[#8E4D42] bg-[#F5E8E7] px-2.5 py-0.5 rounded-xl">
            {formatTemplate(t.normalMode.dayBadgeTemplate, { day: currentDayNumber })}
          </span>
        </div>
        <p className="text-[12.5px] text-[#85838D] mt-0.5">{t.insights.subtitle}</p>
      </div>

      {/* My Pattern vs Partner Shared */}
      <div
        role="tablist"
        aria-label={t.insights.title}
        className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'self'}
          onClick={() => setTab('self')}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap px-2 ${
            tab === 'self'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {formatTemplate(t.insights.myPatternTab, { name: myDisplayName })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'partner'}
          onClick={() => setTab('partner')}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap px-2 ${
            tab === 'partner'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {formatTemplate(t.insights.partnerSharedTab, { name: partnerDisplayName })}
        </button>
      </div>

      {tab === 'partner' ? (
        <div className="bg-white/85 backdrop-blur-[10px] rounded-[22px] p-5 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
          <div className="w-10 h-10 rounded-full bg-[#EFEDF5] flex items-center justify-center mx-auto">
            {normalPairing.status === 'paired_simulated' ? (
              <Clock className="w-5 h-5 text-[#706794]" strokeWidth={1.75} />
            ) : (
              <UserPlus className="w-5 h-5 text-[#706794]" strokeWidth={1.75} />
            )}
          </div>
          <div className="font-display text-[14.5px] font-semibold text-[#292832]">
            {normalPairing.status === 'paired_simulated'
              ? t.normalMode.waitingForPartnerTitle
              : t.normalMode.invitePartnerTitle}
          </div>
          <p className="text-[12px] text-[#85838D] leading-relaxed">
            {normalPairing.status === 'paired_simulated'
              ? t.normalMode.waitingForPartnerCheckInBody
              : t.normalMode.invitePartnerBody}
          </p>
        </div>
      ) : (
        <>
          {/* Observed Personal Records So Far (never 60-day demo chart) */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {formatTemplate(t.normalMode.observedSoFarTitle, { count: recordedDaysCount })}
              </h2>
              <span className="text-[11px] font-semibold text-[#706794]">
                {phase === 'building'
                  ? t.normalMode.baselineBuildingBadge
                  : t.normalMode.earlyInsightBadge}
              </span>
            </div>

            {/* 7-day progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#292832] tabular-nums">
                <span>
                  {formatTemplate(t.normalMode.recordedDaysProgress, {
                    count: recordedDaysCount,
                    target: progressTargetDays,
                  })}
                </span>
                <span className="text-[#85838D]">{progressPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F4EFEA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E88C7D] to-[#9B93B8] transition-all duration-300"
                  style={{ width: `${Math.max(progressPct, recordedDaysCount > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>

            {sortedRecords.length === 0 ? (
              <div className="rounded-2xl bg-[#FDFBFA] border border-dashed border-[#292832]/12 p-4 text-center text-[12px] text-[#85838D] leading-relaxed">
                {t.normalMode.observedSoFarEmpty}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1.5 items-end pt-2">
                  {sortedRecords.slice(-7).map((rec) => {
                    const barHeightPx = Math.max(18, Math.round((rec.selfReportedScore1To5 / 5) * 68));
                    const weekdayShort = t.calendar.weekdaysShort[rec.weekdayIndex];
                    const shortDay = rec.date.slice(5);
                    return (
                      <div
                        key={rec.date}
                        className="flex flex-col items-center rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] py-2 px-0.5"
                      >
                        <span className="text-[11px] font-bold text-[#292832] tabular-nums mb-1">
                          {rec.selfReportedScore1To5}
                        </span>
                        <div className="w-full h-[70px] flex items-end justify-center px-1">
                          <div
                            className="w-full max-w-[18px] rounded-t-full rounded-b-md bg-[#E88C7D]/85 transition-all duration-300"
                            style={{ height: `${barHeightPx}px` }}
                          />
                        </div>
                        <span className="text-[9.5px] font-medium text-[#292832] mt-1">
                          {weekdayShort}
                        </span>
                        <span className="text-[9px] text-[#85838D] tabular-nums">{shortDay}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10.5px] text-[#85838D] text-center">
                  {t.normalMode.selfReportedScaleNote}
                </div>
              </div>
            )}
          </section>

          {/* Baseline Building (Days 1-6) OR Early Insight (>= 7 Distinct Days) */}
          {phase === 'building' || !earlyInsight ? (
            <section className="bg-white/85 backdrop-blur-[10px] ring-1 ring-[#9B93B8]/25 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFEDF5] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#706794]" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-[15px] font-semibold text-[#292832] leading-snug">
                    {t.normalMode.insightsBuildingTitle}
                  </h2>
                  <p className="text-[12px] text-[#85838D] leading-relaxed">
                    {t.normalMode.insightsBuildingBody}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-white/85 backdrop-blur-[10px] ring-1 ring-[#9B93B8]/25 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F5E8E7] flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarHeart className="w-4 h-4 text-[#C45E4E]" strokeWidth={2} />
                </div>
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#706794]">
                    {t.normalMode.earlyInsightBadge}
                  </span>
                  <h2 className="font-display text-[15px] font-semibold text-[#292832] mt-0.5 leading-snug">
                    {t.normalMode.earlyInsightTitle}
                  </h2>
                  <p className="text-[11.5px] text-[#85838D] mt-0.5">
                    {formatTemplate(t.normalMode.earlyInsightSubtitle, {
                      count: recordedDaysCount,
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">{t.normalMode.avgScoreLabel}</div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {earlyInsight.averageScore1To5} / 5
                  </div>
                </div>
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">{t.normalMode.scoreRangeLabel}</div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {earlyInsight.minScore1To5} – {earlyInsight.maxScore1To5}
                  </div>
                </div>
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {t.normalMode.dayTransitionsLabel}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {earlyInsight.transitionsCount}
                  </div>
                </div>
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {t.normalMode.mostCommonFeelingLabel}
                  </div>
                  <div className="font-display text-[13px] font-bold text-[#292832] mt-1 truncate">
                    {t.home.checkInOptions[earlyInsight.dominantStatus].label}
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-[#292832]/85 leading-relaxed">
                {t.normalMode.variationNotes[earlyInsight.variationKind]}
              </p>
            </section>
          )}

          {/* Weekly Pattern Detection (requires >= 4 distinct weeks per weekday) */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.normalMode.weeklyPatternTitle}
            </h2>
            {weekdayPattern.hasEnoughWeekdayRepeats &&
            weekdayPattern.preliminaryLowWeekdayIndex !== null &&
            weekdayPattern.preliminaryLowWeekdayMean !== null ? (
              <div className="space-y-1.5">
                <span className="inline-block text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2.5 py-0.5 rounded-lg">
                  {t.normalMode.preliminaryWeeklyPatternBadge}
                </span>
                <p className="text-[12px] text-[#292832]/85 leading-relaxed">
                  {formatTemplate(t.normalMode.preliminaryWeeklyPatternBody, {
                    weeks: weekdayPattern.preliminaryLowWeekdayWeeks,
                    weekday: t.calendar.weekdaysFull[weekdayPattern.preliminaryLowWeekdayIndex],
                    mean: weekdayPattern.preliminaryLowWeekdayMean,
                  })}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-[12.5px] font-medium text-[#292832]">
                  {t.normalMode.notEnoughWeekdayRepeats}
                </p>
                <p className="text-[11.5px] text-[#85838D] leading-relaxed">
                  {formatTemplate(t.normalMode.weeklyPatternRequirementNote, {
                    weeks: weekdayPattern.maxDistinctWeeksObserved,
                  })}
                </p>
              </div>
            )}
          </section>

          {/* Future Predictions Disabled Until Sufficient Personal Multi-Week History */}
          {!canShowFutureForecast && (
            <section className="bg-[#FDFBFA] border border-[#292832]/[0.06] rounded-[22px] p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#292832]">
                <Lock className="w-4 h-4 text-[#85838D] shrink-0" />
                <span>{t.normalMode.futureEstimatesInactiveTitle}</span>
              </div>
              <p className="text-[11.5px] text-[#85838D] leading-relaxed">
                {t.normalMode.futureEstimatesInactiveBody}
              </p>
            </section>
          )}
        </>
      )}

      {/* Care Action Entry */}
      <button
        type="button"
        onClick={() => setNormalActivePage('care')}
        className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white font-display text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-[0_10px_24px_-8px_rgba(232,140,125,0.55)] transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#292832]"
      >
        <span>{t.insights.viewCareSuggestions}</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

function PresentationInsightsContent({ partnerId }: { partnerId: PartnerId }) {
  const {
    presentationBundle,
    setActivePage,
    openPremiumMembership,
    sharingPrefs,
    membership,
    t,
    language,
  } = useDualCharge();

  const capabilities = getMembershipCapabilities(membership, true);
  const otherPartnerId: PartnerId = partnerId === 'alex' ? 'jamie' : 'alex';
  const [viewedSubject, setViewedSubject] = useState<PartnerId>(partnerId);
  const [evidenceExpanded, setEvidenceExpanded] = useState<boolean>(false);

  if (!presentationBundle) {
    return (
      <div className="py-12 text-center text-[13px] text-[#85838D]">
        {t.welcome.loadingPresentationDemo}
      </div>
    );
  }

  const subjectProfile = presentationBundle.partnerProfiles[viewedSubject];
  const subjectMetadata = presentationBundle.partnerMeta[viewedSubject];
  const subjectLatestRecord = presentationBundle.latestRecords[viewedSubject];
  const historical60Days = presentationBundle.historicalPoints[viewedSubject];
  const visibleTrendPoints = capabilities.insightsTrendDaysLimit
    ? historical60Days.slice(-capabilities.insightsTrendDaysLimit)
    : historical60Days;
  const multiSummary =
    subjectProfile.insights.multiDimensional ??
    presentationBundle.multiDimensionalSummaries?.[viewedSubject];
  const { insights } = subjectProfile;
  const { analytics } = insights;
  const { pattern, forecast7Days } = analytics;

  const isViewingPartner = viewedSubject !== partnerId;
  const subjectSharing = sharingPrefs[viewedSubject];
  const isEnergyShared = subjectSharing.energy;
  const isSleepAllowed = !isViewingPartner || subjectSharing.sleep;
  const isHeartRateAllowed = !isViewingPartner || Boolean(subjectSharing.heartRate);
  const isHrvAllowed = !isViewingPartner || Boolean(subjectSharing.hrv);
  const isActivityAllowed = !isViewingPartner || subjectSharing.activity;
  const isCycleOptedIn = Boolean(subjectSharing.cycleTrackingEnabled);
  const isCycleAllowed =
    isCycleOptedIn &&
    (!isViewingPartner || Boolean(subjectSharing.cycle)) &&
    Boolean(subjectLatestRecord.recorded_cycle_phase);

  const defaultHighlightedDay =
    forecast7Days.find((d) => d.isHighlighted) ??
    forecast7Days[Math.min(5, Math.max(0, forecast7Days.length - 1))];
  const [selectedForecastDay, setSelectedForecastDay] =
    useState<ForecastDay>(defaultHighlightedDay);

  const handleSwitchSubject = (nextSubject: PartnerId) => {
    setViewedSubject(nextSubject);
    const nextForecast = presentationBundle.partnerProfiles[nextSubject].insights.forecast7Days;
    setSelectedForecastDay(
      nextForecast.find((d) => d.isHighlighted) ??
        nextForecast[Math.min(5, Math.max(0, nextForecast.length - 1))]
    );
  };

  const activeForecast =
    forecast7Days.find((d) => d.dateISO === selectedForecastDay.dateISO) ??
    defaultHighlightedDay;
  const hasForecastEstimate =
    activeForecast.estimatedEnergy !== null && activeForecast.confidence !== 'Insufficient Data';
  const forecastStyle = getEnergyStateStyle(activeForecast.estimatedEnergy ?? 50);

  const myDisplayName = presentationBundle.partnerProfiles[partnerId].name;
  const partnerDisplayName = presentationBundle.partnerProfiles[otherPartnerId].name;
  const activeSubjectName = isViewingPartner ? partnerDisplayName : myDisplayName;

  const formatShortMonthDay = (monthIdx: number, day: number) => {
    const month = t.calendar.monthsShort[monthIdx];
    if (language === 'en') return `${month} ${day}`;
    return `${month}${day}日`;
  };

  const formatHistoricalRange = () => {
    const first = visibleTrendPoints[0];
    const last = visibleTrendPoints[visibleTrendPoints.length - 1];
    if (!first || !last) return '';
    if (language === 'en') {
      return `${formatShortMonthDay(first.monthIndex, first.dayOfMonth)} – ${formatShortMonthDay(
        last.monthIndex,
        last.dayOfMonth
      )}, ${last.year}`;
    }
    return `${first.year}年${formatShortMonthDay(first.monthIndex, first.dayOfMonth)} – ${formatShortMonthDay(
      last.monthIndex,
      last.dayOfMonth
    )}`;
  };

  const formatForecastRange = () => {
    const first = forecast7Days[0];
    const last = forecast7Days[forecast7Days.length - 1];
    if (!first || !last) return '';
    return `${formatShortMonthDay(first.monthIndex, first.dayOfMonth)} – ${formatShortMonthDay(
      last.monthIndex,
      last.dayOfMonth
    )}`;
  };

  const formatFullForecastDate = (day: ForecastDay) => {
    const weekday = t.calendar.weekdaysFull[day.weekdayIndex];
    const month = t.calendar.monthsFull[day.monthIndex];
    if (language === 'en') {
      return `${weekday}, ${day.dayOfMonth} ${month} ${day.year}`;
    }
    return `${day.year}年${month}${day.dayOfMonth}日 ${weekday}`;
  };

  const detectedWeekdayName =
    pattern.hasPattern && pattern.detectedWeekdayIndex !== null
      ? t.calendar.weekdaysFull[pattern.detectedWeekdayIndex]
      : '';

  const validForecastScores = forecast7Days
    .map((d) => d.estimatedEnergy)
    .filter((v): v is number => v !== null);
  const minForecast = validForecastScores.length > 0 ? Math.min(...validForecastScores) : 0;
  const maxForecast = validForecastScores.length > 0 ? Math.max(...validForecastScores) : 0;

  const evidenceObserved =
    pattern.hasPattern && pattern.detectedWeekdayIndex !== null
      ? [
          formatTemplate(t.insights.evidencePatternObserved[0], {
            count: pattern.observationCount,
            weekday: detectedWeekdayName,
            weeks: pattern.qualifyingWeeks,
            weekdayMean: pattern.weekdayMean ?? 0,
            totalDays: analytics.recordCount,
            overallMean: analytics.overallMean,
            belowPct: pattern.percentageBelowBaseline,
          }),
          !isSleepAllowed
            ? formatTemplate(t.insights.evidencePatternSleepPrivate, {
                name: activeSubjectName,
              })
            : pattern.prevNightAvgSleepHours !== null && pattern.sleepDifferenceHours !== null
              ? formatTemplate(t.insights.evidencePatternObserved[1], {
                  weekday: detectedWeekdayName,
                  prevSleep: pattern.prevNightAvgSleepHours,
                  sleepDiff: pattern.sleepDifferenceHours,
                })
              : formatTemplate(t.insights.evidencePatternSleepUnavailable, {
                  weekday: detectedWeekdayName,
                }),
        ]
      : (isSleepAllowed && analytics.overallAvgSleepHours !== null
          ? t.insights.evidenceSteadyObserved
          : t.insights.evidenceSteadyObservedNoSleep
        ).map((tpl) =>
          formatTemplate(tpl, {
            count: analytics.recordCount,
            min: analytics.minEnergy,
            max: analytics.maxEnergy,
            mean: analytics.overallMean,
            recent7: analytics.recent7DayMean,
            sleep: analytics.overallAvgSleepHours ?? '—',
            belowCount: analytics.belowBaselineCount,
            belowPct: analytics.belowBaselinePct,
          })
        );

  const evidenceEstimated = !hasForecastEstimate
    ? t.insights.evidenceInsufficientEstimated.map((tpl) =>
        formatTemplate(tpl, {
          weekday: t.calendar.weekdaysFull[activeForecast.weekdayIndex],
        })
      )
    : pattern.hasPattern
      ? t.insights.evidencePatternEstimated.map((tpl) =>
          formatTemplate(tpl, {
            date: formatFullForecastDate(activeForecast),
            score: activeForecast.estimatedEnergy ?? 0,
            confidence: t.insights.confidenceLevels[activeForecast.confidence],
            weekday: t.calendar.weekdaysFull[activeForecast.weekdayIndex],
            weekdayMean: activeForecast.supportingEvidence.weekdayMean ?? analytics.overallMean,
            recent7: analytics.recent7DayMean,
          })
        )
      : t.insights.evidenceSteadyEstimated.map((tpl) =>
          formatTemplate(tpl, {
            minForecast,
            maxForecast,
            recent7: analytics.recent7DayMean,
          })
        );

  return (
    <div className="space-y-4 pb-2">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-[20px] font-semibold tracking-tight text-[#292832]">
            {t.insights.title}
          </h1>
          <span className="text-[10.5px] text-[#85838D]">{t.meta.simulatedDemoData}</span>
        </div>
        <p className="text-[12.5px] text-[#85838D] mt-0.5">{t.insights.subtitle}</p>
      </div>

      {/* Segmented View Toggle */}
      <div
        role="tablist"
        aria-label={t.insights.title}
        className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewedSubject === partnerId}
          onClick={() => handleSwitchSubject(partnerId)}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap px-2 ${
            viewedSubject === partnerId
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {formatTemplate(t.insights.myPatternTab, { name: myDisplayName })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewedSubject === otherPartnerId}
          onClick={() => handleSwitchSubject(otherPartnerId)}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap px-2 ${
            viewedSubject === otherPartnerId
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {formatTemplate(t.insights.partnerSharedTab, { name: partnerDisplayName })}
        </button>
      </div>

      <div className="rounded-2xl bg-[#EFEDF5]/60 px-3 py-2 flex items-center gap-2 text-[11px] text-[#5B527E]">
        <Crown className="w-3.5 h-3.5 text-[#706794] shrink-0" />
        <span className="leading-snug">
          {membership.tier === 'premium'
            ? t.insights.premiumTierInsightsBanner
            : t.insights.freeTierInsightsBanner}
        </span>
      </div>

      {isViewingPartner && !isEnergyShared ? (
        <div className="bg-white/85 backdrop-blur-[10px] rounded-[22px] p-5 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#EFEDF5] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-[#85838D]" strokeWidth={1.75} />
          </div>
          <div className="font-display text-[14px] font-semibold text-[#292832]">
            {t.insights.sharedInsightsPausedTitle}
          </div>
          <p className="text-[12px] text-[#85838D] leading-relaxed">
            {formatTemplate(t.insights.sharedInsightsPausedBody, { name: activeSubjectName })}
          </p>
        </div>
      ) : (
        <>
          {/* Section A: Today Overview */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.insights.sectionTodayOverview}
              </h2>
              <span className="text-[10.5px] text-[#85838D]">
                {multiSummary?.measurementSource ?? ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                <div className="text-[10.5px] text-[#85838D]">{t.home.estimatedEnergyIndex}</div>
                <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                  {subjectLatestRecord.estimated_energy_index_0_to_100} / 100
                </div>
              </div>

              <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                <div className="text-[10.5px] text-[#85838D]">{t.home.sleepDuration}</div>
                <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                  {isSleepAllowed
                    ? `${subjectLatestRecord.sleep_hours} ${t.home.hoursUnit}`
                    : t.insights.sleepPrivateLabel}
                </div>
              </div>

              <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                <div className="text-[10.5px] text-[#85838D]">{t.home.rhrShortLabel}</div>
                <div className="font-display text-[15px] font-bold text-[#292832] tabular-nums mt-0.5">
                  {!isHeartRateAllowed
                    ? t.insights.sleepPrivateLabel
                    : multiSummary?.rhrLatestBpm !== null && multiSummary?.rhrLatestBpm !== undefined
                      ? `${multiSummary.rhrLatestBpm} ${t.insights.rhrUnit}`
                      : t.insights.metricUnavailable}
                </div>
              </div>

              <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                <div className="text-[10.5px] text-[#85838D]">
                  {t.home.hrvShortLabel}
                  {isHrvAllowed && multiSummary ? ` (${multiSummary.hrvMetricType})` : ''}
                </div>
                <div className="font-display text-[15px] font-bold text-[#292832] tabular-nums mt-0.5">
                  {!isHrvAllowed
                    ? t.insights.sleepPrivateLabel
                    : multiSummary?.hrvLatestMs !== null && multiSummary?.hrvLatestMs !== undefined
                      ? `${multiSummary.hrvLatestMs} ${t.insights.hrvUnit}`
                      : t.insights.metricUnavailable}
                </div>
              </div>
            </div>

            {isCycleAllowed && subjectLatestRecord.recorded_cycle_phase && (
              <div className="rounded-2xl bg-[#F5E8E7]/55 px-3 py-2 text-[11px] text-[#8E4D42]">
                {formatTemplate(t.insights.cycleOptInNoteTemplate, {
                  phase: subjectLatestRecord.recorded_cycle_phase,
                  day: subjectLatestRecord.recorded_cycle_day ?? 1,
                })}
              </div>
            )}
          </section>

          {/* Section B: Energy Trends (30-Day Basic on Free, 60-Day Full on Couple Premium) */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.insights.historicalTrendTitle}
              </h2>
              <span className="text-[11px] font-medium text-[#706794]">
                {capabilities.canUseExtended60DayTrends
                  ? t.insights.last60Days
                  : t.insights.last30DaysFree}
              </span>
            </div>
            <div className="text-[11px] text-[#85838D]">
              {formatTemplate(t.insights.dateRangeTapHintTemplate, {
                range: formatHistoricalRange(),
              })}
            </div>

            <HistoricalTrendChart
              data={visibleTrendPoints}
              highlightWeekdayIndex={pattern.hasPattern ? pattern.detectedWeekdayIndex : null}
              detectedWeekdayCount={pattern.observationCount}
              showSleepDetail={isSleepAllowed}
            />

            {!capabilities.canUseExtended60DayTrends && (
              <div className="rounded-2xl bg-[#EFEDF5]/70 border border-[#9B93B8]/25 p-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#5B527E] leading-snug">
                  {t.insights.membershipLock.freeTrendBanner}
                </span>
                <button
                  type="button"
                  onClick={() => openPremiumMembership(partnerId)}
                  className="min-h-[32px] px-2.5 rounded-xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[10.5px] font-semibold shrink-0 whitespace-nowrap active:scale-95 transition-all"
                >
                  {t.insights.membershipLock.unlock60DayBtn}
                </button>
              </div>
            )}
          </section>

          {capabilities.canUseAdvancedInsights ? (
            <>
              {/* Section C: Sleep Patterns & Stages */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
                <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                  {t.insights.sectionSleepPatterns}
                </h2>
              </div>
              {isSleepAllowed && analytics.overallAvgSleepHours !== null && (
                <span className="text-[11px] font-semibold text-[#292832] tabular-nums">
                  {analytics.overallAvgSleepHours} {t.home.hoursUnit}
                </span>
              )}
            </div>

            {!isSleepAllowed ? (
              <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[11.5px] text-[#85838D] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatTemplate(t.insights.metricPrivateTemplate, { name: activeSubjectName })}{' '}
                  {t.insights.metricEnableHint}
                </span>
              </div>
            ) : multiSummary ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-[#85838D]">
                  <span>{t.insights.sleepStagesTitle}</span>
                  <span>{t.insights.sleepStagesAvgNote}</span>
                </div>
                <SleepStagesBreakdownBar
                  deepMin={multiSummary.avgDeepMinutes}
                  remMin={multiSummary.avgRemMinutes}
                  lightMin={multiSummary.avgLightMinutes}
                  awakeMin={multiSummary.avgAwakeMinutes}
                  labels={{
                    deep: t.insights.stageDeep,
                    rem: t.insights.stageRem,
                    light: t.insights.stageLight,
                    awake: t.insights.stageAwake,
                    minUnit: 'm',
                    unavailable: t.insights.metricUnavailable,
                  }}
                />
                <div className="text-[10.5px] text-[#85838D]">
                  {formatTemplate(t.insights.missingDaysNoteTemplate, {
                    valid: multiSummary.validSleepStageDays,
                    total: analytics.recordCount,
                  })}
                </div>
              </>
            ) : null}
          </section>

          {/* Section D: HRV Trends (Explicit SDNN vs RMSSD, Personal Baseline Only) */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#706794]" strokeWidth={2} />
                <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                  {t.insights.sectionHrvTrends}
                </h2>
              </div>
              {isHrvAllowed && multiSummary && (
                <span className="text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                  {multiSummary.hrvMetricType}
                </span>
              )}
            </div>

            {!isHrvAllowed ? (
              <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[11.5px] text-[#85838D] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatTemplate(t.insights.metricPrivateTemplate, { name: activeSubjectName })}{' '}
                  {t.insights.metricEnableHint}
                </span>
              </div>
            ) : multiSummary ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-[11px] tabular-nums">
                  <div className="rounded-xl bg-[#FDFBFA] p-2 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.personalBaselineLabel}</div>
                    <div className="font-bold text-[#292832] mt-0.5">
                      {multiSummary.hrvBaselineMs !== null
                        ? `${multiSummary.hrvBaselineMs} ${t.insights.hrvUnit}`
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FDFBFA] p-2 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.latestReadingLabel}</div>
                    <div className="font-bold text-[#292832] mt-0.5">
                      {multiSummary.hrvLatestMs !== null
                        ? `${multiSummary.hrvLatestMs} ${t.insights.hrvUnit}`
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FDFBFA] p-2 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.deviationLabel}</div>
                    <div className="font-bold text-[#706794] mt-0.5">
                      {multiSummary.hrvLatestDeviationMs !== null
                        ? `${multiSummary.hrvLatestDeviationMs > 0 ? '+' : ''}${multiSummary.hrvLatestDeviationMs} ${t.insights.hrvUnit}`
                        : '—'}
                    </div>
                  </div>
                </div>

                <BiometricTrendChart
                  points={multiSummary.series.map((p) => ({
                    dateISO: p.dateISO,
                    monthIndex: p.monthIndex,
                    dayOfMonth: p.dayOfMonth,
                    weekdayIndex: p.weekdayIndex,
                    value: p.hrvValueMs,
                  }))}
                  baseline={multiSummary.hrvBaselineMs}
                  unit={t.insights.hrvUnit}
                  accentColor="#706794"
                  ariaLabel={t.insights.sectionHrvTrends}
                  unavailableLabel={t.insights.metricUnavailable}
                  baselineLabel={t.insights.personalBaselineLabel}
                />

                <p className="text-[10.5px] text-[#85838D] leading-snug">
                  {formatTemplate(t.insights.hrvMetricNoteTemplate, {
                    metric: multiSummary.hrvMetricType,
                  })}{' '}
                  ·{' '}
                  {formatTemplate(t.insights.missingDaysNoteTemplate, {
                    valid: multiSummary.validHrvDays,
                    total: analytics.recordCount,
                  })}
                </p>
              </>
            ) : null}
          </section>

          {/* Section E: Resting Heart Rate Trends */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-[#E88C7D]" strokeWidth={2} />
                <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                  {t.insights.sectionRhrTrends}
                </h2>
              </div>
              {isHeartRateAllowed && multiSummary && multiSummary.rhrBaselineBpm !== null && (
                <span className="text-[11px] font-semibold text-[#8E4D42] tabular-nums">
                  {multiSummary.rhrBaselineBpm} {t.insights.rhrUnit}
                </span>
              )}
            </div>

            {!isHeartRateAllowed ? (
              <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[11.5px] text-[#85838D] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatTemplate(t.insights.metricPrivateTemplate, { name: activeSubjectName })}{' '}
                  {t.insights.metricEnableHint}
                </span>
              </div>
            ) : multiSummary ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-[11px] tabular-nums">
                  <div className="rounded-xl bg-[#FDFBFA] p-2 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.personalBaselineLabel}</div>
                    <div className="font-bold text-[#292832] mt-0.5">
                      {multiSummary.rhrBaselineBpm !== null
                        ? `${multiSummary.rhrBaselineBpm} ${t.insights.rhrUnit}`
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FDFBFA] p-2 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.latestReadingLabel}</div>
                    <div className="font-bold text-[#292832] mt-0.5">
                      {multiSummary.rhrLatestBpm !== null
                        ? `${multiSummary.rhrLatestBpm} ${t.insights.rhrUnit}`
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FDFBFA] p-2 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.deviationLabel}</div>
                    <div className="font-bold text-[#C45E4E] mt-0.5">
                      {multiSummary.rhrLatestDeviationBpm !== null
                        ? `${multiSummary.rhrLatestDeviationBpm > 0 ? '+' : ''}${multiSummary.rhrLatestDeviationBpm} ${t.insights.rhrUnit}`
                        : '—'}
                    </div>
                  </div>
                </div>

                <BiometricTrendChart
                  points={multiSummary.series.map((p) => ({
                    dateISO: p.dateISO,
                    monthIndex: p.monthIndex,
                    dayOfMonth: p.dayOfMonth,
                    weekdayIndex: p.weekdayIndex,
                    value: p.restingHeartRateBpm,
                  }))}
                  baseline={multiSummary.rhrBaselineBpm}
                  unit={t.insights.rhrUnit}
                  accentColor="#E88C7D"
                  ariaLabel={t.insights.sectionRhrTrends}
                  unavailableLabel={t.insights.metricUnavailable}
                  baselineLabel={t.insights.personalBaselineLabel}
                />

                <p className="text-[10.5px] text-[#85838D] leading-snug">
                  {formatTemplate(t.insights.missingDaysNoteTemplate, {
                    valid: multiSummary.validRhrDays,
                    total: analytics.recordCount,
                  })}
                </p>
              </>
            ) : null}
          </section>

          {/* Section F: Activity Patterns */}
          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8FA89B]" strokeWidth={2} />
                <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                  {t.insights.sectionActivityPatterns}
                </h2>
              </div>
              {isActivityAllowed && multiSummary?.latestIntensity && (
                <span className="text-[10.5px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                  {t.insights.intensityLevels[multiSummary.latestIntensity]}
                </span>
              )}
            </div>

            {!isActivityAllowed ? (
              <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[11.5px] text-[#85838D] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatTemplate(t.insights.metricPrivateTemplate, { name: activeSubjectName })}{' '}
                  {t.insights.metricEnableHint}
                </span>
              </div>
            ) : multiSummary ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
                  <div className="rounded-xl bg-[#FDFBFA] p-2.5 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.stepsLabel}</div>
                    <div className="font-bold text-[14.5px] text-[#292832] mt-0.5">
                      {multiSummary.latestSteps !== null
                        ? multiSummary.latestSteps.toLocaleString()
                        : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#FDFBFA] p-2.5 border border-[#292832]/[0.04]">
                    <div className="text-[#85838D] text-[10px]">{t.insights.steps7dAvgLabel}</div>
                    <div className="font-bold text-[14.5px] text-[#3D5E49] mt-0.5">
                      {multiSummary.avgSteps7d !== null
                        ? multiSummary.avgSteps7d.toLocaleString()
                        : '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#85838D] mb-1">
                    {t.insights.weeklyActivityTitle} ({t.home.minutesUnit})
                  </div>
                  <WeekdayActivityChart
                    items={multiSummary.weekdayActivityAverages}
                    weekdaysShort={t.calendar.weekdaysShort}
                    unitLabel={t.home.minutesUnit}
                  />
                </div>
              </>
            ) : null}
          </section>
            </>
          ) : (
            <PremiumFeaturePreview
              badgeLabel={t.insights.membershipLock.advancedBadge}
              title={t.insights.membershipLock.advancedTitle}
              description={t.insights.membershipLock.advancedDesc}
              benefits={t.insights.membershipLock.advancedBenefits}
              previewTeaser={
                <p className="text-[11px] text-[#5B527E] leading-snug">
                  {t.insights.membershipLock.teaserPrivacyNote}
                </p>
              }
              upgradeLabel={t.insights.membershipLock.upgradeCta}
              backLabel={t.insights.membershipLock.returnHomeBtn}
              onUpgrade={() => openPremiumMembership(partnerId)}
              onBack={() => setActivePage(partnerId, 'home')}
            />
          )}

          <section className="bg-white/78 backdrop-blur-[10px] ring-1 ring-[#9B93B8]/25 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFEDF5] flex items-center justify-center shrink-0 mt-0.5">
                <CalendarHeart className="w-4 h-4 text-[#706794]" strokeWidth={2} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#706794]">
                  {formatTemplate(t.insights.patternDetectionPrefix, {
                    name: subjectMetadata.display_name,
                  })}
                </div>
                <h2 className="font-display text-[15px] font-semibold text-[#292832] mt-0.5 leading-snug">
                  {pattern.hasPattern && pattern.detectedWeekdayIndex !== null
                    ? formatTemplate(t.insights.weekdayPatternTitleTemplate, {
                        weekday: detectedWeekdayName,
                      })
                    : t.insights.noPatternTitle}
                </h2>
              </div>
            </div>

            {pattern.hasPattern && pattern.detectedWeekdayIndex !== null ? (
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {t.insights.overallAvgEnergy}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {analytics.overallMean}
                  </div>
                </div>
                <div className="bg-[#F5E8E7]/80 rounded-2xl p-2.5">
                  <div className="text-[10.5px] text-[#8E4D42]">
                    {formatTemplate(t.insights.weekdayAvgEnergyTemplate, {
                      weekday: detectedWeekdayName,
                    })}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#8E4D42] tabular-nums mt-0.5">
                    {pattern.weekdayMean ?? analytics.overallMean}
                  </div>
                </div>
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {formatTemplate(t.insights.weekdayObservationsTemplate, {
                      weekday: detectedWeekdayName,
                    })}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {pattern.observationCount}
                  </div>
                </div>
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {t.insights.prevDayAvgSleep}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {!isSleepAllowed
                      ? t.insights.sleepPrivateLabel
                      : pattern.prevNightAvgSleepHours !== null
                        ? `${pattern.prevNightAvgSleepHours} ${t.home.hoursUnit}`
                        : analytics.overallAvgSleepHours !== null
                          ? `${analytics.overallAvgSleepHours} ${t.home.hoursUnit}`
                          : '—'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {formatTemplate(t.insights.overallAvgLabelTemplate, {
                      count: analytics.recordCount,
                    })}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#3D5E49] tabular-nums mt-0.5">
                    {analytics.overallMean}
                  </div>
                </div>
                <div className="bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
                  <div className="text-[10.5px] text-[#85838D]">
                    {t.insights.recent7DayAvgLabel}
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#292832] tabular-nums mt-0.5">
                    {analytics.recent7DayMean}
                  </div>
                </div>
                <div className="col-span-2 bg-[#FDFBFA] rounded-2xl px-3 py-2 flex items-center justify-between border border-[#292832]/[0.04]">
                  <span className="text-[11px] text-[#85838D]">
                    {t.insights.belowBaselineLabel}
                  </span>
                  <span className="font-display text-[13px] font-bold text-[#292832] tabular-nums">
                    {formatTemplate(t.insights.belowBaselineValueTemplate, {
                      count: analytics.belowBaselineCount,
                      pct: analytics.belowBaselinePct,
                    })}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11.5px] text-[#85838D] leading-relaxed">
              {pattern.hasPattern && pattern.detectedWeekdayIndex !== null
                ? formatTemplate(t.insights.weekdayPatternNoteTemplate, {
                    count: analytics.recordCount,
                    pct: pattern.percentageBelowBaseline,
                    weekday: detectedWeekdayName,
                    weeks: pattern.qualifyingWeeks,
                  })
                : formatTemplate(t.insights.noPatternNoteTemplate, {
                    count: analytics.recordCount,
                  })}
            </p>
          </section>

          <section className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.insights.future7DayTitle}
              </h2>
              <span className="text-[10.5px] text-[#706794] font-medium">
                {capabilities.canUseExtended60DayTrends
                  ? `${t.insights.forecastBadge} · ${formatForecastRange()}`
                  : t.insights.membershipLock.basicForecastBadge}
              </span>
            </div>

            <ForecastChart
              days={forecast7Days}
              selectedDateISO={activeForecast.dateISO}
              onSelectDay={setSelectedForecastDay}
            />

            <div
              className={`rounded-2xl p-3 space-y-1 transition-colors ${
                activeForecast.isHighlighted ? 'bg-[#F5E8E7]/75' : 'bg-[#F4EFEA]/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#292832]">
                  <Calendar className="w-3.5 h-3.5 text-[#E88C7D]" strokeWidth={2} />
                  <span>{formatFullForecastDate(activeForecast)}</span>
                </div>
                {activeForecast.isHighlighted && (
                  <span className="text-[10px] font-semibold text-[#8E4D42]">
                    {formatTemplate(t.insights.weekdayDipTagTemplate, {
                      weekday: t.calendar.weekdaysFull[activeForecast.weekdayIndex],
                    })}
                  </span>
                )}
              </div>
              {hasForecastEstimate ? (
                <>
                  <div className="flex items-center justify-between text-[12px] pt-0.5">
                    <span className="text-[#85838D]">{t.insights.estimatedIndexColon}</span>
                    <span className={`font-bold tabular-nums ${forecastStyle.textColor}`}>
                      {activeForecast.estimatedEnergy} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#85838D]">{t.insights.confidenceColon}</span>
                    <span className="font-medium text-[#292832]">
                      {t.insights.confidenceLevels[activeForecast.confidence]}
                    </span>
                  </div>
                </>
              ) : (
                <div className="pt-1 space-y-0.5 text-[11.5px]">
                  <div className="font-semibold text-[#292832]">
                    {t.insights.insufficientDataTitle}
                  </div>
                  <p className="text-[#85838D] leading-snug">{t.insights.insufficientDataBody}</p>
                </div>
              )}
            </div>

            <div className="text-[10.5px] text-[#85838D] text-center pt-0.5">
              {t.insights.forecastFooterLabel}
            </div>
          </section>

          {capabilities.canUseAdvancedInsights && (
          <section className="bg-white rounded-[22px] shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] overflow-hidden">
            <button
              type="button"
              onClick={() => setEvidenceExpanded((prev) => !prev)}
              aria-expanded={evidenceExpanded}
              className="w-full min-h-[50px] px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-[#FDFBFA] transition-colors focus-visible:outline-2 focus-visible:outline-[#E88C7D]"
            >
              <span className="flex items-center gap-2 font-display text-[13.5px] font-semibold text-[#292832]">
                <Sparkles className="w-4 h-4 text-[#9B93B8] shrink-0" strokeWidth={2} />
                <span>{t.insights.whyIdentifiedTitle}</span>
              </span>
              {evidenceExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#85838D] shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#85838D] shrink-0" />
              )}
            </button>

            {evidenceExpanded && (
              <div className="px-4 pb-4 pt-2 border-t border-[#292832]/[0.05] space-y-3 text-[12px] leading-relaxed">
                <div className="rounded-2xl bg-[#FDFBFA] p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#292832]">
                    <Eye className="w-3.5 h-3.5 text-[#8FA89B]" />
                    <span>{t.insights.observedHistoricalTitle}</span>
                  </div>
                  <ul className="space-y-1 text-[#85838D] list-disc pl-4">
                    {evidenceObserved.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#EFEDF5]/55 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#292832]">
                    <CalendarHeart className="w-3.5 h-3.5 text-[#9B93B8]" />
                    <span>{t.insights.estimatedFutureTitle}</span>
                  </div>
                  <ul className="space-y-1 text-[#85838D] list-disc pl-4">
                    {evidenceEstimated.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
          )}

          <p className="text-[10.5px] text-center text-[#85838D] px-2 leading-snug">
            {t.insights.nonDiagnosticBanner}
          </p>
        </>
      )}

      <button
        type="button"
        onClick={() => setActivePage(partnerId, 'care')}
        className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white font-display text-[13.5px] font-semibold flex items-center justify-center gap-2 shadow-[0_10px_24px_-8px_rgba(232,140,125,0.55)] transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#292832]"
      >
        <span>{t.insights.viewCareSuggestions}</span>
        <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}

export function InsightsPage({ partnerId, scope = 'demo' }: InsightsPageProps) {
  if (scope === 'normal') {
    return <NormalInsightsContent />;
  }
  return <PresentationInsightsContent partnerId={partnerId} />;
}
