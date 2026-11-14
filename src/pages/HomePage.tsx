import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Check,
  Clock,
  Heart,
  HeartPulse,
  Lock,
  Moon,
  Sparkles,
  Sun,
  UserPlus,
  Waves,
  X,
} from 'lucide-react';
import {
  BatteryEnergyBar,
  CircularEnergyRing,
  getEnergyStateStyle,
} from '@/src/components/ui/EnergyIndicator';
import { useDualCharge } from '@/src/context/DualChargeContext';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import { getAuthorizedPartnerStatusView } from '@/src/services/dailyStatusUpdateService';
import { MockOrderStatus } from '@/src/types/aiCare';
import {
  CareActivityItem,
  CheckInOption,
  PartnerId,
  WeeklyRechargeEntry,
  WeeklyRechargeNextWeekWish,
  WeeklyRechargeSupportChoice,
} from '@/src/types/dualcharge';

interface HomePageProps {
  partnerId: PartnerId;
  scope?: 'demo' | 'normal';
}

const CHECK_IN_KEYS: CheckInOption[] = ['good', 'tired', 'rest'];

const SUPPORT_CHOICES: WeeklyRechargeSupportChoice[] = [
  'emotional_support',
  'practical_help',
  'rest_recovery',
  'quality_time',
];

const NEXT_WEEK_WISHES: WeeklyRechargeNextWeekWish[] = [
  'more_quiet_time',
  'more_light_help',
  'more_gentle_checkins',
  'more_shared_outings',
];

interface WeeklyRechargeModalProps {
  open: boolean;
  onClose: () => void;
  initialEntry: WeeklyRechargeEntry | null;
  onSave: (params: {
    supportChoice: WeeklyRechargeSupportChoice;
    nextWeekWish: WeeklyRechargeNextWeekWish;
    optionalComment?: string;
    shareWithPartner: boolean;
  }) => void;
  t: TranslationDictionary;
}

function WeeklyRechargeModal({
  open,
  onClose,
  initialEntry,
  onSave,
  t,
}: WeeklyRechargeModalProps) {
  const [supportChoice, setSupportChoice] = useState<WeeklyRechargeSupportChoice>(
    initialEntry?.supportChoice ?? 'rest_recovery'
  );
  const [nextWeekWish, setNextWeekWish] = useState<WeeklyRechargeNextWeekWish>(
    initialEntry?.nextWeekWish ?? 'more_quiet_time'
  );
  const [optionalComment, setOptionalComment] = useState<string>(
    initialEntry?.optionalComment ?? ''
  );
  const [shareWithPartner, setShareWithPartner] = useState<boolean>(
    initialEntry?.shareWithPartner ?? false
  );

  useEffect(() => {
    if (!open) return;
    setSupportChoice(initialEntry?.supportChoice ?? 'rest_recovery');
    setNextWeekWish(initialEntry?.nextWeekWish ?? 'more_quiet_time');
    setOptionalComment(initialEntry?.optionalComment ?? '');
    setShareWithPartner(initialEntry?.shareWithPartner ?? false);
  }, [open, initialEntry]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.home.weeklyRechargeModalTitle}
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#292832]/30 backdrop-blur-[2px] p-3"
    >
      <div className="w-full bg-white/95 backdrop-blur-[10px] rounded-[24px] p-4 shadow-xl border border-white space-y-3.5 max-h-[90%] overflow-y-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9B93B8]" />
            <h3 className="font-display text-[15px] font-semibold text-[#292832]">
              {t.home.weeklyRechargeModalTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.meta.cancel}
            className="min-w-[34px] min-h-[34px] rounded-full flex items-center justify-center text-[#85838D] hover:bg-[#F4EFEA] active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Q1 */}
        <div className="space-y-1.5">
          <div className="text-[12px] font-semibold text-[#292832] leading-snug">
            {t.home.weeklyRechargeQ1}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {SUPPORT_CHOICES.map((choice) => {
              const selected = supportChoice === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setSupportChoice(choice)}
                  aria-pressed={selected}
                  className={`min-h-[38px] px-3 py-2 rounded-xl text-left text-[11.5px] font-medium transition-all active:scale-[0.98] ${
                    selected
                      ? 'bg-[#F5E8E7] text-[#292832] ring-1 ring-[#E88C7D]'
                      : 'bg-[#FDFBFA] text-[#292832]/85 border border-[#292832]/[0.06] hover:bg-[#F4EFEA]'
                  }`}
                >
                  {t.home.weeklyRechargeQ1Options[choice]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q2 */}
        <div className="space-y-1.5">
          <div className="text-[12px] font-semibold text-[#292832] leading-snug">
            {t.home.weeklyRechargeQ2}
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {NEXT_WEEK_WISHES.map((wish) => {
              const selected = nextWeekWish === wish;
              return (
                <button
                  key={wish}
                  type="button"
                  onClick={() => setNextWeekWish(wish)}
                  aria-pressed={selected}
                  className={`min-h-[38px] px-3 py-2 rounded-xl text-left text-[11.5px] font-medium transition-all active:scale-[0.98] ${
                    selected
                      ? 'bg-[#EFEDF5] text-[#292832] ring-1 ring-[#9B93B8]'
                      : 'bg-[#FDFBFA] text-[#292832]/85 border border-[#292832]/[0.06] hover:bg-[#F4EFEA]'
                  }`}
                >
                  {t.home.weeklyRechargeQ2Options[wish]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Comment */}
        <div className="space-y-1">
          <label className="block text-[11.5px] font-medium text-[#85838D]">
            {t.home.weeklyRechargeCommentLabel}
          </label>
          <textarea
            rows={2}
            value={optionalComment}
            onChange={(e) => setOptionalComment(e.target.value)}
            placeholder={t.home.weeklyRechargeCommentPlaceholder}
            className="w-full rounded-2xl bg-[#FDFBFA] border border-[#292832]/10 p-2.5 text-[12px] text-[#292832] placeholder:text-[#85838D] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
          />
        </div>

        {/* Share with Partner toggle (default private/false) */}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.06] p-3">
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-[#292832]">
              {t.home.weeklyRechargeShareLabel}
            </div>
            <div className="text-[10.5px] text-[#85838D] leading-snug mt-0.5">
              {t.home.weeklyRechargeShareDesc}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={shareWithPartner}
            aria-label={t.home.weeklyRechargeShareLabel}
            onClick={() => setShareWithPartner((prev) => !prev)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
              shareWithPartner ? 'bg-[#8FA89B]' : 'bg-[#292832]/15'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                shareWithPartner ? 'translate-x-[22px]' : 'translate-x-[4px]'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 rounded-2xl bg-[#F4EFEA] text-[#292832] text-[12px] font-semibold active:scale-95 transition-transform"
          >
            {t.meta.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                supportChoice,
                nextWeekWish,
                optionalComment: optionalComment.trim() || undefined,
                shareWithPartner,
              });
              onClose();
            }}
            className="flex-1 min-h-[42px] px-4 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12px] font-semibold shadow-[0_6px_16px_-6px_rgba(232,140,125,0.55)] active:scale-95 transition-all"
          >
            {t.home.weeklyRechargeSaveBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

function NormalHomeContent() {
  const {
    normalUser,
    normalPairing,
    normalBaseline,
    normalInteractions,
    setNormalDraftCheckIn,
    confirmNormalDailyStatus,
    submitNormalWeeklyRecharge,
    skipNormalWeeklyRecharge,
    setNormalActivePage,
    t,
    language,
  } = useDualCharge();

  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

  const {
    currentDayNumber,
    recordedDaysCount,
    progressTargetDays,
    phase,
    todayRecord,
    earlyInsight,
  } = normalBaseline;

  const activeDraftForToday =
    normalInteractions.draftCheckInDateISO === normalBaseline.todayDateISO
      ? normalInteractions.draftCheckInStatus ?? null
      : null;
  const selectedOption = activeDraftForToday ?? todayRecord?.checkInStatus ?? null;
  const hasUnconfirmedDraft =
    selectedOption !== null && (!todayRecord || selectedOption !== todayRecord.checkInStatus);
  const isConfirmedToday = Boolean(todayRecord) && !hasUnconfirmedDraft;

  const progressPct = Math.min(100, Math.round((recordedDaysCount / progressTargetDays) * 100));
  const partnerName = t.normalMode.partnerDisplayName;
  const formattedToday = new Date().toLocaleDateString(
    language === 'en' ? 'en-US' : language === 'zh-CN' ? 'zh-CN' : 'zh-TW',
    { weekday: 'short', month: 'short', day: 'numeric' }
  );

  const myRecharge = normalInteractions.weeklyRecharge ?? null;

  return (
    <div className="space-y-4 pb-2 relative">
      {/* Connection + Local Day Indicator */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#292832]/85 min-w-0">
          <Heart
            className="w-3.5 h-3.5 text-[#E88C7D] fill-[#E88C7D]/30 animate-dc-sync shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">
            {normalPairing.status === 'paired_simulated'
              ? formatTemplate(t.home.connectedWith, { partner: partnerName })
              : t.normalMode.unpairedStatusValue}
          </span>
        </div>
        <span className="text-[10.5px] text-[#85838D] shrink-0 tabular-nums">{formattedToday}</span>
      </div>

      {/* Day 1 / Baseline Building Banner */}
      <section
        aria-label={t.normalMode.baselineStartingTitle}
        className="bg-white/85 backdrop-blur-[10px] ring-1 ring-[#E88C7D]/25 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8E4D42] bg-[#F5E8E7] px-2.5 py-1 rounded-xl">
            {formatTemplate(t.normalMode.dayBadgeTemplate, { day: currentDayNumber })}
          </span>
          <span className="text-[11px] font-semibold text-[#706794]">
            {phase === 'building'
              ? t.normalMode.baselineBuildingBadge
              : t.normalMode.earlyBaselineBadge}
          </span>
        </div>

        <h1 className="font-display text-[16px] font-bold text-[#292832] leading-snug">
          {phase === 'building'
            ? t.normalMode.baselineStartingTitle
            : t.normalMode.earlyInsightTitle}
        </h1>

        <p className="text-[12px] text-[#85838D] leading-relaxed">
          {phase === 'building'
            ? t.normalMode.baselineStartingBody
            : formatTemplate(t.normalMode.earlyInsightSubtitle, { count: recordedDaysCount })}
        </p>

        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#292832] tabular-nums">
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
          {phase === 'building' && (
            <p className="text-[11px] text-[#85838D] leading-snug pt-0.5">
              {t.normalMode.firstInsightTimingNote}
            </p>
          )}
        </div>
      </section>

      {/* Couple Energy Cards: Personal Baseline Status + Partner Empty/Waiting State */}
      <section aria-label={t.home.myEnergy} className="grid grid-cols-2 gap-3">
        <div className="bg-white/78 backdrop-blur-[10px] ring-1 ring-white/85 rounded-[22px] p-3.5 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[#292832] truncate">
                {t.home.myEnergy}
              </span>
              <span className="text-[9.5px] font-medium text-[#85838D] shrink-0">
                {t.home.personalSpaceTag}
              </span>
            </div>
            <div className="text-[10px] text-[#85838D] mt-0.5">
              {phase === 'building'
                ? t.normalMode.baselineBuildingBadge
                : t.normalMode.earlyBaselineBadge}
            </div>
          </div>

          <div className="my-3 flex flex-col items-center justify-center text-center">
            <div className="w-[72px] h-[72px] rounded-full border-[3px] border-dashed border-[#E88C7D]/45 bg-[#FDFBFA] flex flex-col items-center justify-center">
              <span className="font-display text-[15px] font-bold text-[#292832] tabular-nums leading-none">
                {earlyInsight ? earlyInsight.averageScore1To5 : `${recordedDaysCount}/7`}
              </span>
              <span className="text-[9px] text-[#85838D] mt-0.5">
                {earlyInsight
                  ? '/ 5'
                  : formatTemplate(t.normalMode.dayBadgeTemplate, { day: currentDayNumber })}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-medium text-[#292832]/85 text-center leading-snug">
            {todayRecord
              ? t.home.checkInOptions[todayRecord.checkInStatus].label
              : t.home.pendingCheckIn}
          </div>
        </div>

        <div className="bg-[#FDFBFA]/75 backdrop-blur-[10px] ring-1 ring-[#9B93B8]/20 rounded-[22px] p-3.5 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] flex flex-col justify-between text-center">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[#292832] truncate">
                {partnerName}
              </span>
              <span className="text-[9.5px] font-medium text-[#706794] shrink-0">
                {t.home.sharedSpaceTag}
              </span>
            </div>
            <div className="text-[10px] text-[#85838D] mt-0.5 text-left">
              {normalPairing.status === 'paired_simulated'
                ? t.normalMode.waitingForPartnerTitle
                : t.normalMode.unpairedStatusValue}
            </div>
          </div>

          {normalPairing.status === 'unpaired' ? (
            <div className="my-2.5 flex flex-col items-center justify-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-[#EFEDF5] flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#706794]" strokeWidth={1.8} />
              </div>
              <div className="text-[11px] font-semibold text-[#292832] leading-snug">
                {t.normalMode.invitePartnerTitle}
              </div>
              <button
                type="button"
                onClick={() => setNormalActivePage('profile')}
                className="min-h-[32px] px-3 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[10.5px] font-semibold active:scale-95 transition-all"
              >
                {t.normalMode.invitePartnerCta}
              </button>
            </div>
          ) : (
            <div className="my-3 flex flex-col items-center justify-center space-y-2 px-1">
              <div className="w-9 h-9 rounded-full bg-[#EFEDF5] flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#706794]" strokeWidth={1.8} />
              </div>
              <div className="text-[11px] text-[#85838D] leading-snug">
                {t.normalMode.waitingForPartnerCheckInBody}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Daily Check-in */}
      <section
        aria-label={t.home.dailyCheckIn}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-[#292832]">
              {t.home.dailyCheckIn}
            </h2>
            <span className="text-[11px] text-[#85838D]">{t.home.howAreYouFeeling}</span>
          </div>

          {hasUnconfirmedDraft ? (
            <span className="text-[10.5px] font-semibold text-[#8E6A2C] bg-[#FBF2E6] px-2.5 py-0.5 rounded-lg shrink-0">
              {t.home.draftStatusBadge}
            </span>
          ) : todayRecord ? (
            <span className="text-[10.5px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2.5 py-0.5 rounded-lg shrink-0">
              {(todayRecord.confirmationCount ?? 1) > 1
                ? t.home.updatedStatusBadge
                : t.home.confirmedStatusBadge}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CHECK_IN_KEYS.map((key) => {
            const opt = t.home.checkInOptions[key];
            const isSelected = selectedOption === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setNormalDraftCheckIn(key)}
                aria-pressed={isSelected}
                className={`min-h-[52px] px-2 py-2.5 rounded-2xl text-center transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E88C7D] ${
                  isSelected
                    ? 'bg-[#F5E8E7] ring-1 ring-[#E88C7D] text-[#292832] shadow-[0_6px_16px_-6px_rgba(232,140,125,0.4)]'
                    : 'bg-[#F4EFEA]/70 text-[#292832] hover:bg-[#F4EFEA]'
                }`}
              >
                <div className="text-[12px] font-semibold leading-tight">{opt.label}</div>
                <div className="text-[10px] text-[#85838D] mt-0.5 leading-tight">{opt.hint}</div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selectedOption}
          onClick={() => selectedOption && confirmNormalDailyStatus(selectedOption)}
          className={`w-full min-h-[42px] px-4 py-2 rounded-2xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed ${
            hasUnconfirmedDraft
              ? 'bg-[#E88C7D] hover:bg-[#DC7D6E] text-white shadow-[0_6px_16px_-6px_rgba(232,140,125,0.55)]'
              : 'bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832]'
          }`}
        >
          <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
          <span>{todayRecord ? t.home.updateConfirmedStatusBtn : t.home.confirmTodayStatusBtn}</span>
        </button>

        {hasUnconfirmedDraft && (
          <p className="text-[11px] text-[#8E6A2C] bg-[#FBF2E6] rounded-2xl px-3 py-2 leading-snug">
            {t.home.draftNotSharedHint}
          </p>
        )}

        {todayRecord && isConfirmedToday && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-2xl bg-[#8FA89B]/14 px-3 py-2 text-[11px] text-[#3D5E49]"
          >
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.2} />
            <div className="leading-snug space-y-0.5">
              <div className="font-medium">
                {formatTemplate(t.home.checkInConfirmed, {
                  status: t.home.checkInOptions[todayRecord.checkInStatus].label,
                  time: `${t.notifications.todayPrefix} · ${todayRecord.updatedAtTime}`,
                })}
              </div>
              <div className="text-[#85838D]">
                {formatTemplate(t.normalMode.checkInSavesBaselineNote, {
                  count: recordedDaysCount,
                })}
              </div>
              <div className="text-[#85838D]">{t.home.localOnlyStatusNote}</div>
            </div>
          </div>
        )}
      </section>

      {/* Weekly Couple Recharge (Personal Local Mode) */}
      <section
        aria-label={t.home.weeklyRechargeCardTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.home.weeklyRechargeCardTitle}
            </h2>
          </div>
          <span
            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-lg ${
              myRecharge?.status === 'completed'
                ? 'bg-[#8FA89B]/18 text-[#3D5E49]'
                : myRecharge?.status === 'skipped'
                  ? 'bg-[#F4EFEA] text-[#85838D]'
                  : 'bg-[#EFEDF5] text-[#5B527E]'
            }`}
          >
            {myRecharge?.status === 'completed'
              ? t.home.weeklyRechargeBadgeDone
              : myRecharge?.status === 'skipped'
                ? t.home.weeklyRechargeBadgeSkipped
                : t.home.weeklyRechargeBadgeNew}
          </span>
        </div>

        {myRecharge?.status === 'completed' && myRecharge.supportChoice && myRecharge.nextWeekWish ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[11.5px] space-y-1">
              <div className="text-[#292832] font-medium">
                {t.home.weeklyRechargeQ1Options[myRecharge.supportChoice]}
              </div>
              <div className="text-[#706794]">
                {t.home.weeklyRechargeQ2Options[myRecharge.nextWeekWish]}
              </div>
              {myRecharge.optionalComment && (
                <p className="text-[#85838D] italic pt-0.5">“{myRecharge.optionalComment}”</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-[10.5px]">
              <span className="text-[#85838D]">
                {myRecharge.shareWithPartner
                  ? t.home.weeklyRechargeSharedTag
                  : t.home.weeklyRechargePrivateTag}
              </span>
              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="font-semibold text-[#706794] hover:underline"
              >
                {t.home.weeklyRechargeEditBtn}
              </button>
            </div>
            <p className="text-[10.5px] text-[#85838D] leading-snug">
              {t.home.weeklyRechargeNormalNote}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-[#85838D] leading-relaxed">
              {t.home.weeklyRechargePromptDesc}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="flex-1 min-h-[38px] px-3 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11.5px] font-semibold transition-all active:scale-95"
              >
                {t.home.weeklyRechargeOpenBtn}
              </button>
              {myRecharge?.status !== 'skipped' && (
                <button
                  type="button"
                  onClick={skipNormalWeeklyRecharge}
                  className="min-h-[38px] px-3 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#85838D] text-[11.5px] font-medium transition-all active:scale-95"
                >
                  {t.home.weeklyRechargeSkipBtn}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* Today's Summary (Never fabricates unentered sleep/activity numbers) */}
      <section
        aria-label={t.home.todaysSummary}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-[#292832]">
            {t.home.todaysSummary}
          </h2>
          <span className="text-[11px] text-[#85838D]">{t.home.personalView}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Moon className="w-3.5 h-3.5 text-[#9B93B8]" strokeWidth={2} />
              <span>{t.home.sleepDuration}</span>
            </div>
            <div className="mt-1 font-display text-[12.5px] font-medium text-[#85838D]">
              {t.normalMode.notEnteredYet}
            </div>
          </div>

          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Sun className="w-3.5 h-3.5 text-[#E88C7D]" strokeWidth={2} />
              <span>{t.home.sleepQuality}</span>
            </div>
            <div className="mt-1 font-display text-[12.5px] font-medium text-[#85838D]">
              {t.normalMode.notEnteredYet}
            </div>
          </div>

          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Activity className="w-3.5 h-3.5 text-[#8FA89B]" strokeWidth={2} />
              <span>{t.home.activity}</span>
            </div>
            <div className="mt-1 font-display text-[12.5px] font-medium text-[#85838D]">
              {t.normalMode.notEnteredYet}
            </div>
          </div>

          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Clock className="w-3.5 h-3.5 text-[#85838D]" strokeWidth={2} />
              <span>{t.home.selfReported}</span>
            </div>
            <div className="mt-1 font-display text-[13px] font-semibold text-[#292832] truncate">
              {todayRecord
                ? t.home.checkInOptions[todayRecord.checkInStatus].label
                : t.home.pendingCheckIn}
            </div>
          </div>
        </div>
      </section>

      {/* AI Insight Preview */}
      <section
        aria-label={t.home.aiInsightPreview}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#706794]">
          <Sparkles className="w-3.5 h-3.5 text-[#9B93B8]" strokeWidth={2} />
          <span>{t.home.aiInsightPreview}</span>
        </div>
        <p className="text-[13px] text-[#292832] leading-relaxed">
          {earlyInsight
            ? formatTemplate(t.normalMode.insightPreviewEarly, {
                count: recordedDaysCount,
                avg: earlyInsight.averageScore1To5,
              })
            : t.normalMode.insightPreviewBuilding}
        </p>
        <button
          type="button"
          onClick={() => setNormalActivePage('insights')}
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[12px] font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#9B93B8]"
        >
          <span>{t.home.viewInsights}</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </section>

      {/* Recent Care Activity (Strictly Personal Interactions Only) */}
      <section
        aria-label={t.home.recentCareActivity}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-[#292832]">
            {t.home.recentCareActivity}
          </h2>
          <button
            type="button"
            onClick={() => setNormalActivePage('care')}
            className="text-[11.5px] font-semibold text-[#D46B5B] hover:underline min-h-[32px] px-1 active:scale-95 transition-transform"
          >
            {t.home.openCare}
          </button>
        </div>

        {normalInteractions.careActivity.length === 0 ? (
          <p className="text-[12px] text-[#85838D] py-1">{t.normalMode.noCareActivityYet}</p>
        ) : (
          <ul className="divide-y divide-[#292832]/[0.05]">
            {normalInteractions.careActivity.slice(0, 4).map((item) => {
              const title =
                item.suggestionTitle ||
                t.normalMode.careSuggestions[item.suggestionId]?.title ||
                item.suggestionId;
              const actorName = normalUser.nickname || 'You';
              const localizedOrderStage =
                item.kind === 'order_progress' && item.suggestionTitle
                  ? t.deliveryCare.tracking.stages[item.suggestionTitle as MockOrderStatus] ??
                    item.suggestionTitle
                  : '';
              const text =
                item.kind === 'sent_care'
                  ? formatTemplate(t.activityTemplates.sentCare, {
                      actor: actorName,
                      target: partnerName,
                      suggestion: title,
                    })
                  : item.kind === 'surprise_scheduled'
                    ? formatTemplate(t.activityTemplates.surpriseScheduled, {
                        actor: actorName,
                        target: partnerName,
                      })
                    : item.kind === 'surprise_sent'
                      ? formatTemplate(t.activityTemplates.surpriseSent, {
                          actor: actorName,
                          target: partnerName,
                        })
                      : item.kind === 'surprise_completed'
                        ? formatTemplate(t.activityTemplates.surpriseCompleted, {
                            actor: actorName,
                          })
                        : item.kind === 'order_placed_revealed'
                          ? formatTemplate(t.activityTemplates.orderPlacedRevealed, {
                              actor: actorName,
                              target: partnerName,
                              suggestion: title,
                            })
                          : item.kind === 'order_secret_prepared'
                            ? formatTemplate(t.activityTemplates.orderSecretPrepared, {
                                actor: actorName,
                                target: partnerName,
                              })
                            : item.kind === 'order_progress'
                              ? formatTemplate(t.activityTemplates.orderProgress, {
                                  target: partnerName,
                                  stage: localizedOrderStage,
                                })
                              : item.kind === 'order_delivered'
                                ? formatTemplate(t.activityTemplates.orderDelivered, {
                                    target: partnerName,
                                    suggestion: title,
                                  })
                                : formatTemplate(t.activityTemplates.savedCare, {
                                    actor: actorName,
                                    suggestion: title,
                                  });
              return (
                <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                  <p className="text-[12.5px] text-[#292832] leading-snug">{text}</p>
                  <span className="text-[10.5px] text-[#85838D]">
                    {item.dateISO} · {item.timeLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <WeeklyRechargeModal
        open={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        initialEntry={myRecharge}
        onSave={submitNormalWeeklyRecharge}
        t={t}
      />
    </div>
  );
}

function PresentationHomeContent({ partnerId }: { partnerId: PartnerId }) {
  const {
    presentationBundle,
    setActivePage,
    dailyCheckIns,
    partnerStatusUpdates,
    setDraftCheckIn,
    confirmDailyStatus,
    respondWithCareFromStatus,
    weeklyRecharge,
    submitWeeklyRecharge,
    skipWeeklyRecharge,
    sharingPrefs,
    careActivity,
    t,
  } = useDualCharge();

  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

  if (!presentationBundle) {
    return (
      <div className="py-12 text-center text-[13px] text-[#85838D]">
        {t.welcome.loadingPresentationDemo}
      </div>
    );
  }

  const partnerOtherId: PartnerId = partnerId === 'alex' ? 'jamie' : 'alex';
  const partnerProfile = presentationBundle.partnerMeta[partnerOtherId];
  const myLatestRecord = presentationBundle.latestRecords[partnerId];
  const partnerLatestRecord = presentationBundle.latestRecords[partnerOtherId];
  const partnerMultiSummary = presentationBundle.multiDimensionalSummaries?.[partnerOtherId];

  const myCheckIn = dailyCheckIns[partnerId];
  const mySelectedDraft = myCheckIn.draftStatus ?? myCheckIn.status;
  const myHasPendingDraft =
    mySelectedDraft !== null &&
    (myCheckIn.status === null || mySelectedDraft !== myCheckIn.status);

  const partnerSharing = sharingPrefs[partnerOtherId];
  const partnerStatusView = getAuthorizedPartnerStatusView(
    partnerStatusUpdates[partnerOtherId],
    partnerSharing
  );

  const myEnergy = myLatestRecord.estimated_energy_index_0_to_100;
  const partnerEnergy = partnerLatestRecord.estimated_energy_index_0_to_100;
  const myStyle = getEnergyStateStyle(myEnergy);
  const partnerStyle = getEnergyStateStyle(partnerEnergy);

  const myRecharge = weeklyRecharge[partnerId] ?? null;
  const partnerRecharge = weeklyRecharge[partnerOtherId] ?? null;
  const showPartnerRecharge =
    partnerRecharge?.status === 'completed' && partnerRecharge.shareWithPartner === true;

  const hasPartnerSharedBiometrics =
    partnerSharing.sleep ||
    partnerSharing.activity ||
    (partnerSharing.heartRate &&
      partnerLatestRecord.resting_heart_rate_bpm !== null &&
      partnerLatestRecord.resting_heart_rate_bpm !== undefined) ||
    (partnerSharing.hrv &&
      partnerLatestRecord.hrv_value_ms !== null &&
      partnerLatestRecord.hrv_value_ms !== undefined) ||
    Boolean(
      partnerSharing.cycleTrackingEnabled &&
        partnerSharing.cycle &&
        partnerLatestRecord.recorded_cycle_phase
    );

  const renderActivityText = (item: CareActivityItem): string => {
    const actorName = presentationBundle.partnerProfiles[item.actor].name;
    const targetName = item.target ? presentationBundle.partnerProfiles[item.target].name : '';
    const suggestionTitle =
      item.suggestionTitle ||
      (item.suggestionId ? t.care.suggestions[item.suggestionId]?.title ?? '' : '');

    switch (item.kind) {
      case 'sent_care':
        return formatTemplate(t.activityTemplates.sentCare, {
          actor: actorName,
          target: targetName,
          suggestion: suggestionTitle,
        });
      case 'saved_care':
        return formatTemplate(t.activityTemplates.savedCare, {
          actor: actorName,
          suggestion: suggestionTitle,
        });
      case 'completed_care':
        return formatTemplate(t.activityTemplates.completedCare, {
          actor: actorName,
          suggestion: suggestionTitle,
        });
      case 'confirmed_status': {
        const statusKey = item.suggestionTitle as CheckInOption | undefined;
        const localizedStatus =
          statusKey && t.home.checkInOptions[statusKey]
            ? t.home.checkInOptions[statusKey].label
            : item.suggestionTitle ?? '';
        return formatTemplate(t.activityTemplates.confirmedStatus, {
          actor: actorName,
          status: localizedStatus,
        });
      }
      case 'weekly_recharge':
        return formatTemplate(t.activityTemplates.weeklyRecharge, {
          actor: actorName,
        });
      case 'date_invite': {
        const planTitle =
          t.care.datePlanning.plans[item.suggestionTitle ?? '']?.title ??
          item.suggestionTitle ??
          '';
        return formatTemplate(t.activityTemplates.dateInvite, {
          actor: actorName,
          target: targetName,
          plan: planTitle,
        });
      }
      case 'date_agreed': {
        const planTitle =
          t.care.datePlanning.plans[item.suggestionTitle ?? '']?.title ??
          item.suggestionTitle ??
          '';
        return formatTemplate(t.activityTemplates.dateAgreed, {
          actor: actorName,
          target: targetName,
          plan: planTitle,
        });
      }
      case 'surprise_scheduled':
        return formatTemplate(t.activityTemplates.surpriseScheduled, {
          actor: actorName,
          target: targetName,
        });
      case 'surprise_sent':
        return formatTemplate(t.activityTemplates.surpriseSent, {
          actor: actorName,
          target: targetName,
        });
      case 'surprise_revealed':
        return formatTemplate(t.activityTemplates.surpriseRevealed, {
          actor: actorName,
          target: targetName,
        });
      case 'surprise_completed':
        return formatTemplate(t.activityTemplates.surpriseCompleted, {
          actor: actorName,
        });
      case 'order_placed_revealed':
        return formatTemplate(t.activityTemplates.orderPlacedRevealed, {
          actor: actorName,
          target: targetName,
          suggestion: suggestionTitle,
        });
      case 'order_secret_prepared':
        return formatTemplate(t.activityTemplates.orderSecretPrepared, {
          actor: actorName,
          target: targetName,
        });
      case 'order_progress': {
        const localizedStage = item.suggestionTitle
          ? t.deliveryCare.tracking.stages[item.suggestionTitle as MockOrderStatus] ??
            item.suggestionTitle
          : '';
        return formatTemplate(t.activityTemplates.orderProgress, {
          target: targetName,
          stage: localizedStage,
        });
      }
      case 'order_delivered':
        return formatTemplate(t.activityTemplates.orderDelivered, {
          target: targetName,
          suggestion: suggestionTitle,
        });
      case 'seed_supportive':
        return t.activityTemplates.seedSupportive;
      case 'seed_saved_evening':
        return t.activityTemplates.seedSavedEvening;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 pb-2 relative">
      {/* Couple Synchronization Header + Subtle Demo Date */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#292832]/85 min-w-0">
          <Heart
            className="w-3.5 h-3.5 text-[#E88C7D] fill-[#E88C7D]/30 animate-dc-sync shrink-0"
            strokeWidth={2}
          />
          <span className="truncate">
            {formatTemplate(t.home.connectedWith, { partner: partnerProfile.display_name })}
          </span>
        </div>
        <span className="text-[10.5px] text-[#85838D] shrink-0">{t.meta.todayDateLabel}</span>
      </div>

      {/* Couple Energy Cards */}
      <section aria-label={t.home.myEnergy} className="grid grid-cols-2 gap-3">
        <div className="bg-white/78 backdrop-blur-[10px] ring-1 ring-white/85 rounded-[22px] p-3.5 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] flex flex-col justify-between transition-shadow duration-300 hover:shadow-[0_14px_34px_-10px_rgba(41,40,50,0.09)]">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[#292832] truncate">
                {t.home.myEnergy}
              </span>
              <span className="text-[9.5px] font-medium text-[#85838D] shrink-0">
                {t.home.personalSpaceTag}
              </span>
            </div>
            <div className="text-[10px] text-[#85838D] mt-0.5">
              {t.home.estimatedEnergyIndex}
            </div>
          </div>

          <div className="my-2.5 flex items-center justify-center">
            <CircularEnergyRing
              score={myEnergy}
              size={76}
              strokeWidth={6}
              accentVariant="self"
            />
          </div>

          <div className="space-y-1.5">
            <BatteryEnergyBar score={myEnergy} />
            <div className={`text-[11px] font-semibold ${myStyle.textColor}`}>
              {t.energyStates[myStyle.stateKey]} · {myEnergy}/100
            </div>
          </div>
        </div>

        <div className="bg-[#FDFBFA]/72 backdrop-blur-[10px] ring-1 ring-[#9B93B8]/20 rounded-[22px] p-3.5 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] flex flex-col justify-between transition-shadow duration-300 hover:shadow-[0_14px_34px_-10px_rgba(41,40,50,0.09)]">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[#292832] truncate">
                {formatTemplate(t.home.partnerSharedEnergy, {
                  partner: partnerProfile.display_name,
                })}
              </span>
              <span className="text-[9.5px] font-medium text-[#706794] shrink-0">
                {t.home.sharedSpaceTag}
              </span>
            </div>
            <div className="text-[10px] text-[#85838D] mt-0.5">
              {t.home.estimatedEnergyIndex} · {t.home.predictedBaselineLabel}
            </div>
          </div>

          {partnerSharing.energy ? (
            <>
              <div className="my-2.5 flex items-center justify-center">
                <CircularEnergyRing
                  score={partnerEnergy}
                  size={76}
                  strokeWidth={6}
                  accentVariant="partner"
                />
              </div>

              <div className="space-y-1.5">
                <BatteryEnergyBar score={partnerEnergy} />
                <div className={`text-[11px] font-semibold ${partnerStyle.textColor}`}>
                  {t.energyStates[partnerStyle.stateKey]} · {partnerEnergy}/100
                </div>
                {partnerStatusView.hasConfirmedStatus &&
                  !partnerStatusView.isPrivate &&
                  partnerStatusView.checkInStatus && (
                    <div className="rounded-xl bg-[#8FA89B]/16 px-2 py-1 text-[10px] text-[#3D5E49] leading-snug">
                      <div className="font-semibold">
                        {t.home.latestConfirmedStatusLabel}:{' '}
                        {t.home.checkInOptions[partnerStatusView.checkInStatus].label}
                      </div>
                      {partnerStatusView.updatedAtTime && (
                        <div className="text-[#85838D]">{partnerStatusView.updatedAtTime}</div>
                      )}
                    </div>
                  )}
              </div>
            </>
          ) : (
            <div className="my-4 flex flex-col items-center justify-center text-center px-1">
              <div className="w-9 h-9 rounded-full bg-[#EFEDF5] flex items-center justify-center mb-2">
                <Lock className="w-4 h-4 text-[#85838D]" strokeWidth={1.75} />
              </div>
              <div className="text-[11px] font-medium text-[#292832]">{t.home.sharingPaused}</div>
              <div className="text-[10px] text-[#85838D] mt-0.5 leading-snug">
                {partnerStatusView.hasConfirmedStatus && partnerStatusView.isPrivate
                  ? formatTemplate(t.home.partnerStatusPrivateNotice, {
                      partner: partnerProfile.display_name,
                    })
                  : formatTemplate(t.home.sharingPausedNote, {
                      partner: partnerProfile.display_name,
                    })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Partner Timely Status Update Banner (appears immediately after partner confirms) */}
      {partnerStatusView.hasConfirmedStatus &&
        !partnerStatusView.isPrivate &&
        partnerStatusView.checkInStatus && (
          <section
            role="status"
            aria-label={formatTemplate(t.home.partnerStatusUpdatedBanner, {
              partner: partnerProfile.display_name,
            })}
            className="bg-gradient-to-r from-[#F5E8E7]/75 via-white to-[#EFEDF5]/75 rounded-[22px] p-3.5 ring-1 ring-[#E88C7D]/30 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.07)] space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#B45A4C]">
                  {formatTemplate(t.home.partnerStatusUpdatedBanner, {
                    partner: partnerProfile.display_name,
                  })}
                </div>
                <div className="text-[12.5px] font-semibold text-[#292832] mt-0.5">
                  {t.home.latestConfirmedStatusLabel}:{' '}
                  {t.home.checkInOptions[partnerStatusView.checkInStatus].label}
                </div>
                <div className="text-[10.5px] text-[#85838D] mt-0.5">
                  {t.notifications.todayPrefix} · {partnerStatusView.updatedAtTime}
                  {partnerStatusView.confirmationState === 'updated'
                    ? ` · ${t.home.updatedStatusBadge}`
                    : ` · ${t.home.confirmedStatusBadge}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => respondWithCareFromStatus(partnerId)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[11px] font-semibold shrink-0 transition-all active:scale-95 shadow-[0_6px_14px_-6px_rgba(232,140,125,0.6)]"
              >
                {t.home.respondWithCareBtn}
              </button>
            </div>
          </section>
        )}

      {/* Today's Summary */}
      <section
        aria-label={t.home.todaysSummary}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-[#292832]">
            {t.home.todaysSummary}
          </h2>
          <span className="text-[11px] text-[#85838D]">{t.home.personalView}</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Moon className="w-3.5 h-3.5 text-[#9B93B8]" strokeWidth={2} />
              <span>{t.home.sleepDuration}</span>
            </div>
            <div className="mt-1 font-display text-[15px] font-semibold text-[#292832] tabular-nums">
              {myLatestRecord.sleep_hours} {t.home.hoursUnit}
            </div>
          </div>

          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Sun className="w-3.5 h-3.5 text-[#E88C7D]" strokeWidth={2} />
              <span>{t.home.sleepQuality}</span>
            </div>
            <div className="mt-1 font-display text-[15px] font-semibold text-[#292832] tabular-nums">
              {myLatestRecord.sleep_quality_1_to_5} / 5
            </div>
          </div>

          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Activity className="w-3.5 h-3.5 text-[#8FA89B]" strokeWidth={2} />
              <span>{t.home.activity}</span>
            </div>
            <div className="mt-1 font-display text-[15px] font-semibold text-[#292832] tabular-nums">
              {myLatestRecord.activity_minutes} {t.home.minutesUnit}
            </div>
          </div>

          <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
              <Clock className="w-3.5 h-3.5 text-[#85838D]" strokeWidth={2} />
              <span>{t.home.selfReported}</span>
            </div>
            <div className="mt-1 font-display text-[13px] font-semibold text-[#292832] truncate">
              {myCheckIn.status
                ? t.home.checkInOptions[myCheckIn.status].label
                : t.home.pendingCheckIn}
            </div>
          </div>
        </div>

        {/* Distinct Partner Shared Context Block */}
        <div className="rounded-2xl bg-[#EFEDF5]/55 px-3 py-2.5 text-[11px] text-[#85838D] space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#292832]/85">
              {formatTemplate(t.home.partnerSharedContext, {
                partner: partnerProfile.display_name,
              })}
            </span>
            <span className="text-[#706794] font-medium">{t.home.privacyControlled}</span>
          </div>
          {partnerStatusView.hasConfirmedStatus &&
            !partnerStatusView.isPrivate &&
            partnerStatusView.checkInStatus && (
              <div className="text-[#3D5E49] font-medium">
                {t.home.latestConfirmedStatusLabel}:{' '}
                {t.home.checkInOptions[partnerStatusView.checkInStatus].label} (
                {partnerStatusView.updatedAtTime})
              </div>
            )}
          {hasPartnerSharedBiometrics ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#292832]/85 tabular-nums">
              {partnerSharing.sleep && (
                <span>
                  {t.home.sleepLabel}: {partnerLatestRecord.sleep_hours}h (
                  {partnerLatestRecord.sleep_quality_1_to_5}/5)
                </span>
              )}
              {partnerSharing.activity && (
                <span>
                  {t.home.activityLabel}: {partnerLatestRecord.activity_minutes}{' '}
                  {t.home.minutesUnit}
                  {partnerLatestRecord.steps !== null &&
                  partnerLatestRecord.steps !== undefined
                    ? ` · ${partnerLatestRecord.steps.toLocaleString()} ${t.home.stepsShortLabel}`
                    : ''}
                </span>
              )}
              {partnerSharing.heartRate &&
                partnerLatestRecord.resting_heart_rate_bpm !== null &&
                partnerLatestRecord.resting_heart_rate_bpm !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-[#E88C7D]" />
                    {t.home.rhrShortLabel}: {partnerLatestRecord.resting_heart_rate_bpm}{' '}
                    {t.insights.rhrUnit}
                  </span>
                )}
              {partnerSharing.hrv &&
                partnerLatestRecord.hrv_value_ms !== null &&
                partnerLatestRecord.hrv_value_ms !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Waves className="w-3 h-3 text-[#706794]" />
                    {t.home.hrvShortLabel} (
                    {partnerLatestRecord.hrv_metric_type ??
                      partnerMultiSummary?.hrvMetricType ??
                      'HRV'}
                    ): {partnerLatestRecord.hrv_value_ms} {t.insights.hrvUnit}
                  </span>
                )}
              {partnerSharing.cycleTrackingEnabled &&
                partnerSharing.cycle &&
                partnerLatestRecord.recorded_cycle_phase && (
                  <span>
                    {t.home.cyclePhaseLabel}: {partnerLatestRecord.recorded_cycle_phase}
                  </span>
                )}
            </div>
          ) : !partnerSharing.energy ? (
            <p className="leading-relaxed">
              {partnerStatusView.hasConfirmedStatus && partnerStatusView.isPrivate
                ? formatTemplate(t.home.partnerStatusPrivateNotice, {
                    partner: partnerProfile.display_name,
                  })
                : formatTemplate(t.home.partnerEnergyHiddenNotice, {
                    partner: partnerProfile.display_name,
                  })}
            </p>
          ) : (
            <p className="leading-relaxed">
              {formatTemplate(t.home.partnerDefaultPrivacyNotice, {
                partner: partnerProfile.display_name,
              })}
            </p>
          )}
        </div>
      </section>

      {/* Daily Check-in (Draft Selection -> Explicit Confirmation) */}
      <section
        aria-label={t.home.dailyCheckIn}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-[#292832]">
              {t.home.dailyCheckIn}
            </h2>
            <span className="text-[11px] text-[#85838D]">{t.home.howAreYouFeeling}</span>
          </div>

          {myHasPendingDraft ? (
            <span className="text-[10.5px] font-semibold text-[#8E6A2C] bg-[#FBF2E6] px-2.5 py-0.5 rounded-lg shrink-0">
              {t.home.draftStatusBadge}
            </span>
          ) : myCheckIn.status ? (
            <span className="text-[10.5px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2.5 py-0.5 rounded-lg shrink-0">
              {myCheckIn.confirmationState === 'updated'
                ? t.home.updatedStatusBadge
                : t.home.confirmedStatusBadge}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CHECK_IN_KEYS.map((key) => {
            const opt = t.home.checkInOptions[key];
            const isSelected = mySelectedDraft === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDraftCheckIn(partnerId, key)}
                aria-pressed={isSelected}
                className={`min-h-[52px] px-2 py-2.5 rounded-2xl text-center transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E88C7D] ${
                  isSelected
                    ? 'bg-[#F5E8E7] ring-1 ring-[#E88C7D] text-[#292832] shadow-[0_6px_16px_-6px_rgba(232,140,125,0.4)]'
                    : 'bg-[#F4EFEA]/70 text-[#292832] hover:bg-[#F4EFEA]'
                }`}
              >
                <div className="text-[12px] font-semibold leading-tight">{opt.label}</div>
                <div className="text-[10px] text-[#85838D] mt-0.5 leading-tight">{opt.hint}</div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!mySelectedDraft}
          onClick={() => mySelectedDraft && confirmDailyStatus(partnerId, mySelectedDraft)}
          className={`w-full min-h-[42px] px-4 py-2 rounded-2xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed ${
            myHasPendingDraft
              ? 'bg-[#E88C7D] hover:bg-[#DC7D6E] text-white shadow-[0_6px_16px_-6px_rgba(232,140,125,0.55)]'
              : 'bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832]'
          }`}
        >
          <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
          <span>
            {myCheckIn.status ? t.home.updateConfirmedStatusBtn : t.home.confirmTodayStatusBtn}
          </span>
        </button>

        {myHasPendingDraft && (
          <p className="text-[11px] text-[#8E6A2C] bg-[#FBF2E6] rounded-2xl px-3 py-2 leading-snug">
            {t.home.draftNotSharedHint}
          </p>
        )}

        {myCheckIn.status && myCheckIn.updatedAtTime && !myHasPendingDraft && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-2xl bg-[#8FA89B]/14 px-3 py-2 text-[11px] text-[#3D5E49]"
          >
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2.2} />
            <div className="leading-snug">
              <div className="font-medium">
                {formatTemplate(t.home.checkInConfirmed, {
                  status: t.home.checkInOptions[myCheckIn.status].label,
                  time: `${t.notifications.todayPrefix} · ${myCheckIn.updatedAtTime}`,
                })}
              </div>
              <div className="text-[#85838D] mt-0.5">
                {formatTemplate(t.home.checkInPreservedNote, { count: myCheckIn.historyCount })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Weekly Couple Recharge */}
      <section
        aria-label={t.home.weeklyRechargeCardTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.home.weeklyRechargeCardTitle}
            </h2>
          </div>
          <span
            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-lg ${
              myRecharge?.status === 'completed'
                ? 'bg-[#8FA89B]/18 text-[#3D5E49]'
                : myRecharge?.status === 'skipped'
                  ? 'bg-[#F4EFEA] text-[#85838D]'
                  : 'bg-[#EFEDF5] text-[#5B527E]'
            }`}
          >
            {myRecharge?.status === 'completed'
              ? t.home.weeklyRechargeBadgeDone
              : myRecharge?.status === 'skipped'
                ? t.home.weeklyRechargeBadgeSkipped
                : t.home.weeklyRechargeBadgeNew}
          </span>
        </div>

        {myRecharge?.status === 'completed' && myRecharge.supportChoice && myRecharge.nextWeekWish ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[11.5px] space-y-1">
              <div className="text-[#292832] font-medium">
                {t.home.weeklyRechargeQ1Options[myRecharge.supportChoice]}
              </div>
              <div className="text-[#706794]">
                {t.home.weeklyRechargeQ2Options[myRecharge.nextWeekWish]}
              </div>
              {myRecharge.optionalComment && (
                <p className="text-[#85838D] italic pt-0.5">“{myRecharge.optionalComment}”</p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-[10.5px]">
              <span className="text-[#85838D]">
                {myRecharge.shareWithPartner
                  ? t.home.weeklyRechargeSharedTag
                  : t.home.weeklyRechargePrivateTag}
              </span>
              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="font-semibold text-[#706794] hover:underline"
              >
                {t.home.weeklyRechargeEditBtn}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-[#85838D] leading-relaxed">
              {t.home.weeklyRechargePromptDesc}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="flex-1 min-h-[38px] px-3 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11.5px] font-semibold transition-all active:scale-95"
              >
                {t.home.weeklyRechargeOpenBtn}
              </button>
              {myRecharge?.status !== 'skipped' && (
                <button
                  type="button"
                  onClick={() => skipWeeklyRecharge(partnerId)}
                  className="min-h-[38px] px-3 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#85838D] text-[11.5px] font-medium transition-all active:scale-95"
                >
                  {t.home.weeklyRechargeSkipBtn}
                </button>
              )}
            </div>
          </>
        )}

        {showPartnerRecharge && partnerRecharge?.supportChoice && partnerRecharge?.nextWeekWish && (
          <div className="rounded-2xl bg-[#EFEDF5]/60 border border-[#9B93B8]/25 p-3 space-y-1 text-[11.5px]">
            <div className="font-semibold text-[#5B527E]">
              {formatTemplate(t.home.weeklyRechargePartnerTitle, {
                partner: partnerProfile.display_name,
              })}
            </div>
            <div className="text-[#292832]">
              {t.home.weeklyRechargeQ1Options[partnerRecharge.supportChoice]}
            </div>
            <div className="text-[#706794]">
              {t.home.weeklyRechargeQ2Options[partnerRecharge.nextWeekWish]}
            </div>
            {partnerRecharge.optionalComment && (
              <p className="text-[#292832]/80 italic">“{partnerRecharge.optionalComment}”</p>
            )}
            <div className="text-[10.5px] text-[#85838D]">
              {formatTemplate(t.home.weeklyRechargePartnerNote, {
                partner: partnerProfile.display_name,
              })}
            </div>
          </div>
        )}
      </section>

      {/* AI Insight Preview */}
      <section
        aria-label={t.home.aiInsightPreview}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#706794]">
          <Sparkles className="w-3.5 h-3.5 text-[#9B93B8]" strokeWidth={2} />
          <span>{t.home.aiInsightPreview}</span>
        </div>
        <p className="text-[13px] text-[#292832] leading-relaxed">
          {(() => {
            const myPattern = presentationBundle.partnerProfiles[partnerId].insights.analytics.pattern;
            const otherPattern =
              presentationBundle.partnerProfiles[partnerOtherId].insights.analytics.pattern;
            if (myPattern.hasPattern && myPattern.detectedWeekdayIndex !== null) {
              return formatTemplate(t.home.insightPreviewSelfDip, {
                weekday: t.calendar.weekdaysFull[myPattern.detectedWeekdayIndex],
              });
            }
            if (otherPattern.hasPattern && otherPattern.detectedWeekdayIndex !== null) {
              return formatTemplate(t.home.insightPreviewPartnerDip, {
                partner: partnerProfile.display_name,
                weekday: t.calendar.weekdaysFull[otherPattern.detectedWeekdayIndex],
              });
            }
            return t.home.insightPreviewSelfSteady;
          })()}
        </p>
        <button
          type="button"
          onClick={() => setActivePage(partnerId, 'insights')}
          className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[12px] font-semibold transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#9B93B8]"
        >
          <span>{t.home.viewInsights}</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </section>

      {/* Recent Care Activity */}
      <section
        aria-label={t.home.recentCareActivity}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-[#292832]">
            {t.home.recentCareActivity}
          </h2>
          <button
            type="button"
            onClick={() => setActivePage(partnerId, 'care')}
            className="text-[11.5px] font-semibold text-[#D46B5B] hover:underline min-h-[32px] px-1 active:scale-95 transition-transform"
          >
            {t.home.openCare}
          </button>
        </div>

        <ul className="divide-y divide-[#292832]/[0.05]">
          {careActivity.slice(0, 4).map((item) => {
            const dayPrefix =
              item.dayKind === 'today'
                ? t.notifications.todayPrefix
                : t.notifications.yesterdayPrefix;
            return (
              <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                <p className="text-[12.5px] text-[#292832] leading-snug">
                  {renderActivityText(item)}
                </p>
                <span className="text-[10.5px] text-[#85838D]">
                  {dayPrefix} · {item.timeLabel}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="text-center text-[10px] text-[#85838D]/85 pt-0.5">
        {t.meta.simulatedDemoData}
      </div>

      <WeeklyRechargeModal
        open={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        initialEntry={myRecharge}
        onSave={(params) => submitWeeklyRecharge(partnerId, params)}
        t={t}
      />
    </div>
  );
}

export function HomePage({ partnerId, scope = 'demo' }: HomePageProps) {
  if (scope === 'normal') {
    return <NormalHomeContent />;
  }
  return <PresentationHomeContent partnerId={partnerId} />;
}
