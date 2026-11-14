import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Bookmark,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Coffee,
  Compass,
  Crown,
  EyeOff,
  Gift,
  HandHelping,
  Heart,
  HeartHandshake,
  Loader2,
  MessageCircleHeart,
  MoonStar,
  PackageCheck,
  Pencil,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  SkipForward,
  Sparkles,
  SunMedium,
  ThumbsDown,
  Truck,
  Users,
  X,
} from 'lucide-react';
import {
  MockDeliveryOrderPayload,
  MockDeliveryPlatformModal,
} from '@/src/components/care/MockDeliveryPlatformModal';
import { RemindLaterSheet } from '@/src/components/care/RemindLaterSheet';
import { getProductImageSrc } from '@/src/components/care/productImageMap';
import {
  SurpriseCareModal,
  SurpriseCareSubmitPayload,
  SurpriseDatePlanOption,
} from '@/src/components/care/SurpriseCareModal';
import { PremiumFeaturePreview } from '@/src/components/membership/PremiumFeaturePreview';
import { SubpageHeader } from '@/src/components/phone/SubpageHeader';
import { ForecastChart } from '@/src/components/ui/Charts';
import { ExpandableAccordion } from '@/src/components/ui/ExpandableAccordion';
import { selectNormalCareSuggestions } from '@/src/data/normal/normalCare';
import { PRESENTATION_CARE_SUGGESTIONS } from '@/src/data/presentation/presentationConstants';
import { useDualCharge } from '@/src/context/DualChargeContext';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import {
  buildNormalCareContext,
  buildPresentationCareContext,
} from '@/src/services/careContextBuilder';
import { requestAiCareRecommendations } from '@/src/services/careEngineClient';
import { generateLocalFallbackCare } from '@/src/services/careFallbackEngine';
import {
  buildDatePlanSuggestions,
  DATE_PLAN_CATEGORIES,
} from '@/src/services/datePlanningService';
import {
  FREE_MONTHLY_AI_CARE_LIMIT,
  getBasicActivitySuggestions,
  getMembershipCapabilities,
} from '@/src/services/membershipService';
import {
  canTransitionMockOrderStatus,
  evaluateDueReminders,
  isPurchaseOrientedRecommendation,
  matchProductForRecommendation,
  MOCK_ORDER_STAGE_SEQUENCE,
} from '@/src/services/mockDeliveryService';
import { buildMetadataFromPresetCare } from '@/src/services/recommendationMetadata';
import { isDatePlanHiddenAsSurprise } from '@/src/services/surpriseCareService';
import {
  AiCareCategory,
  AiCareGenerationResult,
  AiCareRecommendation,
  AiCareSavedItem,
  CareReminderPresetKey,
  CareReminderRecord,
  LearningMaturityLevel,
  MockOrderRecord,
  MockOrderStatus,
  MockProductImageKey,
  SurpriseCareRecord,
} from '@/src/types/aiCare';
import {
  CareScenarioView,
  CareSuggestion,
  DatePlanCategory,
  ForecastDay,
  LanguageCode,
  NormalCareSuggestion,
  PartnerId,
  WeekdayPatternResult,
} from '@/src/types/dualcharge';

interface CarePageProps {
  partnerId: PartnerId;
  scope?: 'demo' | 'normal';
}

interface CareDetailSelection {
  recommendation: AiCareRecommendation;
  returnTo: 'now' | 'plan_ahead';
  kind: 'ai' | 'preset';
  sourceKind: 'gemini' | 'fallback' | 'baseline' | 'preset';
  presetId?: string;
  normalSuggestion?: NormalCareSuggestion;
  demoSuggestion?: CareSuggestion;
}

function SuggestionIconBadge({ category }: { category: CareSuggestion['category'] }) {
  if (category === 'warmth') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
        <Coffee className="w-[18px] h-[18px] text-[#C45E4E]" strokeWidth={1.9} />
      </div>
    );
  }
  if (category === 'calm') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#EFEDF5] flex items-center justify-center shrink-0">
        <MoonStar className="w-[18px] h-[18px] text-[#706794]" strokeWidth={1.9} />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-[#8FA89B]/18 flex items-center justify-center shrink-0">
      <MessageCircleHeart className="w-[18px] h-[18px] text-[#3D5E49]" strokeWidth={1.9} />
    </div>
  );
}

function AiCategoryBadge({ category }: { category: AiCareCategory }) {
  if (category === 'Emotional Support') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
        <HeartHandshake className="w-[18px] h-[18px] text-[#C45E4E]" strokeWidth={1.9} />
      </div>
    );
  }
  if (category === 'Practical Help') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#8FA89B]/18 flex items-center justify-center shrink-0">
        <HandHelping className="w-[18px] h-[18px] text-[#3D5E49]" strokeWidth={1.9} />
      </div>
    );
  }
  if (category === 'Rest & Recovery') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#EFEDF5] flex items-center justify-center shrink-0">
        <MoonStar className="w-[18px] h-[18px] text-[#706794]" strokeWidth={1.9} />
      </div>
    );
  }
  if (category === 'Small Surprise') {
    return (
      <div className="w-10 h-10 rounded-2xl bg-[#FBF2E6] flex items-center justify-center shrink-0">
        <Gift className="w-[18px] h-[18px] text-[#B87B3A]" strokeWidth={1.9} />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-2xl bg-[#EBF1EE] flex items-center justify-center shrink-0">
      <Users className="w-[18px] h-[18px] text-[#3D5E49]" strokeWidth={1.9} />
    </div>
  );
}

function presetToAiRecommendation(params: {
  id: string;
  title: string;
  description: string;
  reason: string;
  timing: string;
  defaultMessage: string;
  requiresSpendingMoney?: boolean;
  evidenceSummary?: string;
  evidenceDetails?: string[];
}): AiCareRecommendation {
  const meta = buildMetadataFromPresetCare({
    suggestionId: params.id,
    title: params.title,
    description: params.description,
    timing: params.timing,
  });
  const deterministicActionType = params.id.includes('milk-tea')
    ? 'purchase_coffee'
    : params.id.includes('dessert')
      ? 'purchase_dessert'
      : meta.actionType;
  const requiresSpending = params.requiresSpendingMoney ?? meta.requiresSpendingMoney;
  return {
    id: params.id,
    title: params.title,
    category: meta.category,
    why: params.reason,
    action: params.description,
    suggestedTiming: params.timing,
    personalizationReason: params.reason,
    confidence: 'Preference-Based',
    defaultMessage: params.defaultMessage,
    actionType: deterministicActionType,
    communicationStyle: meta.communicationStyle,
    effortLevel: meta.effortLevel,
    requiresSpendingMoney: requiresSpending,
    tags: meta.tags,
    fingerprint: meta.fingerprint,
    evidenceSummary: params.evidenceSummary ?? params.reason,
    evidenceDetails: params.evidenceDetails,
  };
}

interface PreparedSurprisesSectionProps {
  records: SurpriseCareRecord[];
  recipientName: string;
  t: TranslationDictionary;
  subtitle: string;
  isDemoMode?: boolean;
  onEdit: (record: SurpriseCareRecord) => void;
  onCancel: (surpriseId: string) => void;
  onDemoUnlock?: (surpriseId: string) => void;
}

function PreparedSurprisesSection({
  records,
  recipientName,
  t,
  subtitle,
  isDemoMode = false,
  onEdit,
  onCancel,
  onDemoUnlock,
}: PreparedSurprisesSectionProps) {
  const activeRecords = records.filter((r) => r.status !== 'Cancelled' && !r.orderId);
  if (activeRecords.length === 0) return null;

  return (
    <section
      aria-label={t.surpriseCare.preparedSectionTitle}
      className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/20 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#292832]">
          <Gift className="w-4 h-4 text-[#C45E4E] shrink-0" />
          <span>{t.surpriseCare.preparedSectionTitle}</span>
        </div>
        <span className="text-[11px] font-semibold text-[#706794] tabular-nums">
          ({activeRecords.length})
        </span>
      </div>
      <p className="text-[11px] text-[#85838D] leading-snug">{subtitle}</p>

      <div className="space-y-2">
        {activeRecords.map((item) => {
          const canModify = item.status === 'Scheduled' || item.status === 'Draft';
          const formattedReveal = item.revealAt
            ? new Date(item.revealAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : '';
          const statusSubtext =
            item.status === 'Scheduled'
              ? formatTemplate(t.surpriseCare.recipient.senderStatusWaiting, {
                  time: formattedReveal,
                })
              : item.status === 'Sent'
                ? formatTemplate(t.surpriseCare.recipient.senderStatusSent, {
                    partner: recipientName,
                  })
                : item.status === 'Revealed'
                  ? formatTemplate(t.surpriseCare.recipient.senderStatusRevealed, {
                      partner: recipientName,
                    })
                  : item.status === 'Completed'
                    ? t.surpriseCare.recipient.senderStatusCompleted
                    : t.surpriseCare.recipient.senderStatusCancelled;

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-[#292832]/[0.06] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-semibold text-[#706794]">
                    {t.surpriseCare.categories[item.careCategory].label} · {statusSubtext}
                  </div>
                  <div className="text-[13px] font-semibold text-[#292832] leading-snug mt-0.5">
                    {item.title}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                    item.status === 'Completed'
                      ? 'bg-[#8FA89B]/20 text-[#3D5E49]'
                      : item.status === 'Scheduled'
                        ? 'bg-[#EFEDF5] text-[#5B527E]'
                        : 'bg-[#F5E8E7] text-[#B45A4C]'
                  }`}
                >
                  {t.surpriseCare.statuses[item.status]}
                </span>
              </div>

              {canModify && (
                <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="min-h-[32px] px-2.5 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[11px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{t.surpriseCare.editSurpriseBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(item.id)}
                    className="min-h-[32px] px-2.5 rounded-xl bg-[#FDFBFA] border border-[#292832]/10 hover:bg-[#F5E8E7] text-[#8E4D42] text-[11px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95"
                  >
                    <X className="w-3 h-3" />
                    <span>{t.surpriseCare.cancelSurpriseBtn}</span>
                  </button>
                  {isDemoMode && onDemoUnlock && (
                    <button
                      type="button"
                      onClick={() => onDemoUnlock(item.id)}
                      className="min-h-[32px] px-2.5 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95 ml-auto"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t.surpriseCare.demoUnlockNowBtn}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SenderOrderThumb({
  imageKey,
  alt,
}: {
  imageKey: MockProductImageKey;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = getProductImageSrc(imageKey);
  if (failed || !src) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
        <ShoppingBag className="w-5 h-5 text-[#C45E4E]" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-[#292832]/[0.06] shrink-0"
    />
  );
}

interface DueRemindersSectionProps {
  dueReminders: CareReminderRecord[];
  t: TranslationDictionary;
  onOrderNow: (reminder: CareReminderRecord) => void;
  onReschedule: (reminder: CareReminderRecord) => void;
  onDismiss: (reminderId: string) => void;
}

function DueRemindersSection({
  dueReminders,
  t,
  onOrderNow,
  onReschedule,
  onDismiss,
}: DueRemindersSectionProps) {
  if (dueReminders.length === 0) return null;

  return (
    <section
      aria-label={t.deliveryCare.reminder.dueSectionTitle}
      className="bg-gradient-to-br from-[#FBF2E6]/90 via-white to-[#EFEDF5]/80 rounded-[22px] p-4 ring-1 ring-[#E5C89E]/45 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.07)] space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#292832]">
          <Bell className="w-4 h-4 text-[#B87B3A] shrink-0" />
          <span>{t.deliveryCare.reminder.dueSectionTitle}</span>
        </div>
        <span className="text-[11px] font-semibold text-[#6E4F28] tabular-nums">
          ({dueReminders.length})
        </span>
      </div>
      <p className="text-[11px] text-[#6E4F28]/90 leading-snug">
        {t.deliveryCare.reminder.dueSectionSubtitle}
      </p>

      <div className="space-y-2">
        {dueReminders.map((rem) => {
          const isPurchase = isPurchaseOrientedRecommendation(rem.recommendation);
          const timeStr = new Date(rem.remindAtISO).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          });
          return (
            <div
              key={rem.id}
              className="rounded-2xl bg-white border border-[#292832]/[0.06] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#6E4F28] bg-[#FBF2E6] px-2 py-0.5 rounded-lg">
                    <span>{t.deliveryCare.reminder.dueBadge}</span>
                    <span className="tabular-nums">· {timeStr}</span>
                  </div>
                  <div className="text-[13px] font-semibold text-[#292832] leading-snug mt-1">
                    {rem.recommendation.title}
                  </div>
                  <p className="text-[11.5px] text-[#85838D] leading-snug mt-0.5">
                    {rem.recommendation.action}
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onOrderNow(rem)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[11.5px] font-semibold inline-flex items-center gap-1.5 shadow-[0_6px_14px_-6px_rgba(232,140,125,0.5)] transition-all active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isPurchase ? t.deliveryCare.orderNowBtn : t.deliveryCare.reminder.actNowBtn}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onReschedule(rem)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11.5px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95"
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.deliveryCare.reminder.rescheduleBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(rem.id)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[#FDFBFA] border border-[#292832]/10 hover:bg-[#F5E8E7] text-[#85838D] text-[11.5px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95 ml-auto"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.deliveryCare.reminder.dismissBtn}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface SenderOrdersTrackingSectionProps {
  orders: MockOrderRecord[];
  t: TranslationDictionary;
  onAdvanceStage: (orderId: string, nextStatus: MockOrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
}

function SenderOrdersTrackingSection({
  orders,
  t,
  onAdvanceStage,
  onCancelOrder,
}: SenderOrdersTrackingSectionProps) {
  const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
  if (activeOrders.length === 0) return null;

  const simTargets: Array<{ status: MockOrderStatus; label: string }> = [
    { status: 'Preparing', label: t.deliveryCare.tracking.simulateButtons.preparing },
    { status: 'Picked Up', label: t.deliveryCare.tracking.simulateButtons.pickedUp },
    { status: 'Out for Delivery', label: t.deliveryCare.tracking.simulateButtons.outForDelivery },
    { status: 'Delivered', label: t.deliveryCare.tracking.simulateButtons.delivered },
  ];

  return (
    <section
      aria-label={t.deliveryCare.tracking.sectionTitle}
      className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/25 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#292832]">
          <Truck className="w-4 h-4 text-[#C45E4E] shrink-0" />
          <span>{t.deliveryCare.tracking.sectionTitle}</span>
        </div>
        <span className="text-[11px] font-semibold text-[#706794] tabular-nums">
          ({activeOrders.length})
        </span>
      </div>
      <p className="text-[11px] text-[#85838D] leading-snug">
        {t.deliveryCare.tracking.sectionSubtitle}
      </p>

      <div className="space-y-3">
        {activeOrders.map((order) => {
          const stageIdx = MOCK_ORDER_STAGE_SEQUENCE.indexOf(
            order.status === 'Cancelled' ? 'Order Confirmed' : order.status
          );
          const isDelivered = order.status === 'Delivered';

          return (
            <div
              key={order.id}
              className="rounded-2xl bg-white border border-[#292832]/[0.07] p-3.5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap text-[10.5px]">
                    <span className="font-bold text-[#292832] tabular-nums">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[#85838D]">·</span>
                    <span className="font-medium text-[#706794]">
                      {order.revealMode === 'keep_surprise'
                        ? t.deliveryCare.tracking.revealModeSurprise
                        : t.deliveryCare.tracking.revealModeTellNow}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                    isDelivered
                      ? 'bg-[#8FA89B]/20 text-[#3D5E49]'
                      : 'bg-[#F5E8E7] text-[#B45A4C]'
                  }`}
                >
                  {t.deliveryCare.tracking.stages[order.status]}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <SenderOrderThumb imageKey={order.productImageKey} alt={order.productTitle} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#292832] leading-snug">
                        {order.productTitle}
                      </div>
                      <div className="text-[11px] text-[#85838D] mt-0.5">
                        {order.merchantName}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-[#292832] tabular-nums shrink-0">
                      {order.currencySymbol}
                      {order.totalAmount}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#292832]/80 mt-1">
                    {order.selectedVariant} × <span className="tabular-nums">{order.quantity}</span>
                  </div>
                  <div className="text-[10.5px] text-[#85838D] mt-1 leading-snug">
                    {order.deliveryAddress} · {t.deliveryCare.tracking.etaPrefix}{' '}
                    <span className="font-medium text-[#292832]">{order.estimatedArrivalLabel}</span>
                  </div>
                </div>
              </div>

              {/* 5-Stage Progress Bar */}
              <div className="space-y-1 pt-0.5">
                <div className="grid grid-cols-5 gap-1">
                  {MOCK_ORDER_STAGE_SEQUENCE.map((st, idx) => {
                    const reached = idx <= stageIdx;
                    return (
                      <div
                        key={st}
                        title={t.deliveryCare.tracking.stages[st]}
                        className={`h-1.5 rounded-full transition-colors ${
                          reached
                            ? isDelivered
                              ? 'bg-[#8FA89B]'
                              : 'bg-[#E88C7D]'
                            : 'bg-[#292832]/10'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#85838D]">
                  <span>{t.deliveryCare.tracking.stages['Order Confirmed']}</span>
                  <span className="font-semibold text-[#292832]">
                    {t.deliveryCare.tracking.stages[order.status]}
                  </span>
                  <span>{t.deliveryCare.tracking.stages['Delivered']}</span>
                </div>
              </div>

              {!isDelivered ? (
                <div className="rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.06] p-2.5 space-y-2">
                  <div className="text-[10.5px] font-semibold text-[#5B527E]">
                    {t.deliveryCare.tracking.demoSimControlsTitle}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {simTargets.map((item) => {
                      const enabled = canTransitionMockOrderStatus(order.status, item.status);
                      return (
                        <button
                          key={item.status}
                          type="button"
                          disabled={!enabled}
                          onClick={() => onAdvanceStage(order.id, item.status)}
                          className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95 ${
                            enabled
                              ? item.status === 'Delivered'
                                ? 'bg-[#8FA89B] hover:bg-[#7B9687] text-white'
                                : 'bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E]'
                              : 'bg-[#F4EFEA]/70 text-[#85838D]/60 cursor-not-allowed'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  {order.status === 'Order Confirmed' && (
                    <button
                      type="button"
                      onClick={() => onCancelOrder(order.id)}
                      className="w-full min-h-[32px] px-2.5 rounded-xl bg-white border border-[#292832]/10 hover:bg-[#F5E8E7] text-[#8E4D42] text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <X className="w-3 h-3" />
                      <span>{t.deliveryCare.tracking.cancelOrderBtn}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-[#8FA89B]/14 border border-[#8FA89B]/30 px-2.5 py-2 flex items-start gap-1.5 text-[10.5px] text-[#3D5E49] leading-snug">
                  <PackageCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{t.deliveryCare.tracking.noAutoCompleteHint}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface AiCareEnginePanelProps {
  idPrefix: string;
  recipientName: string;
  t: TranslationDictionary;
  result: AiCareGenerationResult | null;
  isLoading: boolean;
  savedAiSuggestions: AiCareSavedItem[];
  learningMaturity: LearningMaturityLevel;
  learnedFeedbackCount: number;
  dismissedIds: string[];
  skippedIds: string[];
  hiddenByReminderIds?: string[];
  isPremium: boolean;
  aiUsageCount: number;
  aiMonthlyLimit: number | null;
  canGenerateAi: boolean;
  onUpgrade: () => void;
  onBackToPresets: () => void;
  onGenerate: () => void;
  onOpenDetail: (rec: AiCareRecommendation, source: 'gemini' | 'fallback') => void;
}

function AiCareEnginePanel({
  idPrefix,
  recipientName,
  t,
  result,
  isLoading,
  savedAiSuggestions,
  learningMaturity,
  learnedFeedbackCount,
  dismissedIds,
  skippedIds,
  hiddenByReminderIds = [],
  isPremium,
  aiUsageCount,
  aiMonthlyLimit,
  canGenerateAi,
  onUpgrade,
  onBackToPresets,
  onGenerate,
  onOpenDetail,
}: AiCareEnginePanelProps) {
  const visibleRecommendations = useMemo(() => {
    if (!result) return [];
    return result.data.recommendations.filter(
      (rec) =>
        !dismissedIds.includes(rec.id) &&
        !skippedIds.includes(rec.id) &&
        !hiddenByReminderIds.includes(rec.id)
    );
  }, [result, dismissedIds, skippedIds, hiddenByReminderIds]);

  return (
    <section aria-label={t.care.aiEngine.panelTitle} className="space-y-3 pt-1">
      <div className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/20 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.07)] space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                <Sparkles className="w-3 h-3" />
                <span>{t.care.aiEngine.panelTitle}</span>
              </span>
              <span className="text-[10.5px] font-medium text-[#5B527E] bg-[#FDFBFA] border border-[#9B93B8]/25 px-2 py-0.5 rounded-lg">
                {formatTemplate(t.care.aiEngine.recipientLearningNote, {
                  name: recipientName,
                  stage: t.care.aiEngine.maturityLabels[learningMaturity],
                })}
              </span>
              {learnedFeedbackCount > 0 && (
                <span className="text-[10.5px] font-medium text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                  {formatTemplate(t.care.aiEngine.feedbackWeightedBadge, {
                    count: learnedFeedbackCount,
                  })}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-lg ${
                  isPremium
                    ? 'bg-[#8FA89B]/20 text-[#3D5E49]'
                    : 'bg-[#FBF2E6] text-[#6E4F28]'
                }`}
              >
                {isPremium && <Crown className="w-3 h-3 shrink-0" />}
                <span>
                  {isPremium
                    ? t.care.membershipLock.aiUsagePremiumBadge
                    : formatTemplate(t.care.membershipLock.aiUsageFreeBadge, {
                        used: aiUsageCount,
                        limit: aiMonthlyLimit ?? FREE_MONTHLY_AI_CARE_LIMIT,
                      })}
                </span>
              </span>
            </div>
            <p className="text-[11.5px] text-[#85838D] mt-1.5 leading-relaxed">
              {t.care.aiEngine.panelSubtitle}
            </p>
          </div>
        </div>

        {!result && !isLoading && canGenerateAi && (
          <div className="rounded-2xl bg-white/85 border border-[#292832]/[0.05] p-3 space-y-1.5">
            <div className="text-[12.5px] font-semibold text-[#292832]">
              {t.care.aiEngine.initialPromptTitle}
            </div>
            <p className="text-[11.5px] text-[#85838D] leading-relaxed">
              {t.care.aiEngine.initialPromptBody}
            </p>
          </div>
        )}

        {canGenerateAi ? (
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#292832] hover:bg-[#3B3946] disabled:opacity-70 text-white text-[12.5px] font-semibold flex items-center justify-center gap-2 shadow-[0_10px_24px_-10px_rgba(41,40,50,0.45)] transition-all duration-200 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>{t.care.aiEngine.generatingLabel}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {result ? t.care.aiEngine.regenerateBtn : t.care.aiEngine.initialGenerateCta}
                </span>
              </>
            )}
          </button>
        ) : (
          <PremiumFeaturePreview
            badgeLabel={formatTemplate(t.care.membershipLock.aiLimitReachedBadge, {
              limit: aiMonthlyLimit ?? FREE_MONTHLY_AI_CARE_LIMIT,
            })}
            title={t.care.membershipLock.aiLimitReachedTitle}
            description={formatTemplate(t.care.membershipLock.aiLimitReachedDesc, {
              limit: aiMonthlyLimit ?? FREE_MONTHLY_AI_CARE_LIMIT,
            })}
            benefits={t.care.membershipLock.aiLimitBenefits}
            upgradeLabel={t.care.membershipLock.upgradeCta}
            backLabel={t.care.membershipLock.backToPresets}
            onUpgrade={onUpgrade}
            onBack={onBackToPresets}
          />
        )}

        {result && (
          <div className="space-y-2.5 pt-1 border-t border-[#292832]/[0.06]">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {result.source === 'gemini' ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3D5E49] bg-[#8FA89B]/20 px-2.5 py-0.5 rounded-lg">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {t.care.aiEngine.sourceGeminiBadge}
                    {result.model ? ` · ${result.model}` : ''}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8E4D42] bg-[#F5E8E7] px-2.5 py-0.5 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  <span>{t.care.aiEngine.sourceFallbackBadge}</span>
                </span>
              )}
              <span className="text-[10.5px] text-[#85838D]">
                {formatTemplate(t.care.forRecipient, {
                  name: result.data.recipientName || recipientName,
                })}
              </span>
            </div>

            {result.source === 'fallback' && (
              <div className="rounded-2xl bg-[#FBF2E6] border border-[#E5C89E]/40 px-3 py-2 text-[11px] text-[#6E4F28] leading-snug">
                <span className="font-semibold">{t.care.aiEngine.fallbackNoticePrefix} </span>
                <span>
                  {t.care.aiEngine.fallbackReasons[result.fallbackReason ?? 'api_error']}
                </span>
              </div>
            )}

            <p className="text-[12.5px] font-medium text-[#292832] leading-relaxed">
              {result.data.summary}
            </p>

            {(result.data.evidence.length > 0 || result.data.limitations) && (
              <ExpandableAccordion
                title={t.care.aiEngine.evidenceTitle}
                subtitle={t.care.aiEngine.limitationsTitle}
                icon={<ShieldCheck className="w-4 h-4 text-[#8FA89B]" />}
              >
                <div className="space-y-2">
                  {result.data.evidence.length > 0 && (
                    <ul className="space-y-1">
                      {result.data.evidence.map((ev, idx) => (
                        <li
                          key={`${idPrefix}-ev-${idx}`}
                          className="text-[11px] text-[#292832]/85 leading-snug flex items-start gap-1.5"
                        >
                          <span className="text-[#9B93B8] mt-0.5 shrink-0">•</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="pt-1.5 border-t border-[#292832]/[0.06] space-y-1 text-[10.5px] text-[#85838D]">
                    <p>{result.data.limitations}</p>
                    <p className="text-[#706794]/90">{t.care.aiEngine.feedbackNote}</p>
                    <p>{t.care.senderVsReceiverNote}</p>
                  </div>
                </div>
              </ExpandableAccordion>
            )}
          </div>
        )}
      </div>

      {result && visibleRecommendations.length === 0 && (
        <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2">
          <p className="font-display text-[14px] font-semibold text-[#292832]">
            {t.care.aiEngine.emptyAfterFilterTitle}
          </p>
          <p className="text-[12px] text-[#85838D] leading-relaxed">
            {t.care.aiEngine.emptyAfterFilterBody}
          </p>
        </div>
      )}

      {/* Concise AI Recommendation Summary Cards -> tap to open dedicated Detail Subpage */}
      {visibleRecommendations.map((rec) => {
        const isSaved = savedAiSuggestions.some(
          (item) =>
            item.id === rec.id ||
            (Boolean(item.metadata?.fingerprint && rec.fingerprint) &&
              item.metadata?.fingerprint === rec.fingerprint) ||
            item.title.toLowerCase() === rec.title.toLowerCase()
        );
        const localizedCategory = t.care.aiEngine.categories[rec.category] ?? rec.category;
        const localizedConfidence =
          t.care.aiEngine.confidenceLevels[rec.confidence] ?? rec.confidence;
        const isPurchase = isPurchaseOrientedRecommendation(rec);

        return (
          <button
            key={rec.id}
            type="button"
            onClick={() => onOpenDetail(rec, result?.source ?? 'fallback')}
            className="w-full text-left bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] ring-1 ring-[#292832]/[0.04] hover:ring-[#E88C7D]/45 transition-all active:scale-[0.985] space-y-2.5"
          >
            <div className="flex items-start gap-3">
              <AiCategoryBadge category={rec.category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                  <span className="text-[10.5px] font-semibold text-[#706794]">
                    {localizedCategory}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSaved && (
                      <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                        {t.care.saved}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-[#85838D] bg-[#F4EFEA] px-2 py-0.5 rounded-lg">
                      {localizedConfidence}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-[15px] font-semibold text-[#292832] leading-snug">
                  {rec.title}
                </h3>
                <p className="text-[12px] text-[#85838D] leading-snug mt-1 line-clamp-2">
                  {rec.action}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
              <div className="flex items-center gap-1.5 text-[11px] text-[#85838D] min-w-0">
                {isPurchase ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45A4C] bg-[#F5E8E7] px-2 py-0.5 rounded-lg shrink-0">
                    <ShoppingBag className="w-2.5 h-2.5" />
                    <span>{t.deliveryCare.purchaseBadge}</span>
                  </span>
                ) : (
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{rec.suggestedTiming}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#C45E4E] shrink-0">
                <span>{t.ia.care.detailOpenCta}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}

function ExpandableEvidencePanel({
  t,
  evidenceSummary,
  evidenceDetails,
  accentTone = 'warm',
}: {
  t: TranslationDictionary;
  evidenceSummary?: string;
  evidenceDetails?: string[];
  accentTone?: 'warm' | 'cool';
}) {
  const [expanded, setExpanded] = useState(false);
  if (!evidenceSummary && (!evidenceDetails || evidenceDetails.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
          accentTone === 'cool'
            ? 'text-[#5B527E] hover:text-[#3E365F]'
            : 'text-[#B45A4C] hover:text-[#8E4D42]'
        }`}
      >
        <span>
          {expanded
            ? t.care.stage58.careForNow.evidenceToggleHide
            : t.care.stage58.careForNow.evidenceToggleShow}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div
          className={`rounded-2xl p-3 space-y-1.5 text-[11px] leading-snug border ${
            accentTone === 'cool'
              ? 'bg-[#F7F6FC] border-[#9B93B8]/25 text-[#292832]/85'
              : 'bg-[#FDF6F3] border-[#E88C7D]/25 text-[#292832]/85'
          }`}
        >
          {evidenceSummary && <p className="font-medium text-[#292832]">{evidenceSummary}</p>}
          {evidenceDetails && evidenceDetails.length > 0 && (
            <ul className="space-y-1">
              {evidenceDetails.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span
                    className={
                      accentTone === 'cool'
                        ? 'text-[#706794] mt-0.5 shrink-0'
                        : 'text-[#C45E4E] mt-0.5 shrink-0'
                    }
                  >
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface CareForNowHeaderProps {
  t: TranslationDictionary;
  energyShared: boolean;
  currentEnergy?: number | null;
  recipientName: string;
}

function CareForNowHeader({
  t,
  energyShared,
  currentEnergy,
  recipientName,
}: CareForNowHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-[#FBF2ED] via-white to-[#FDF8F5] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/25 shadow-[0_10px_28px_-10px_rgba(232,140,125,0.16)] space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
            <SunMedium className="w-4 h-4 text-[#C45E4E]" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#B45A4C]">
              {t.care.stage58.careForNow.badge}
            </div>
            <h2 className="font-display text-[15.5px] font-semibold text-[#292832] leading-tight">
              {t.care.stage58.careForNow.title}
            </h2>
          </div>
        </div>
        {energyShared && currentEnergy !== null && currentEnergy !== undefined && (
          <span className="text-[11px] font-semibold text-[#8E4D42] bg-[#F5E8E7] px-2.5 py-1 rounded-xl tabular-nums">
            {formatTemplate(t.care.stage58.careForNow.todayEnergyChip, { score: currentEnergy })}
          </span>
        )}
      </div>

      <p className="text-[12px] text-[#292832]/85 font-medium leading-snug">
        {t.care.stage58.careForNow.subtitle}
      </p>
      <div className="text-[11px] text-[#85838D] flex items-center justify-between gap-2 flex-wrap pt-0.5">
        <span>{t.care.stage58.careForNow.kickerQuestion}</span>
        <span className="text-[10.5px] font-medium text-[#B45A4C]">
          {formatTemplate(t.care.forRecipient, { name: recipientName })}
        </span>
      </div>
    </div>
  );
}

interface PlanAheadSectionProps {
  t: TranslationDictionary;
  language: LanguageCode;
  recipientName: string;
  energyShared: boolean;
  sleepShared: boolean;
  canShowFutureForecast: boolean;
  forecastDays: ForecastDay[];
  overallMean: number | null;
  recent7DayMean: number | null;
  recordedDaysCount: number;
  pattern: WeekdayPatternResult | null;
  normalProgress?: { recordedDays: number; maxWeeks: number };
  recommendations: AiCareRecommendation[];
  planAheadSummary?: string;
  sourceKind: 'gemini' | 'fallback' | 'baseline';
  savedAiSuggestions: AiCareSavedItem[];
  dismissedIds: string[];
  hiddenByReminderIds: string[];
  onOpenDetail: (rec: AiCareRecommendation, sourceKind: 'gemini' | 'fallback' | 'baseline') => void;
}

function PlanAheadSection({
  t,
  language,
  recipientName,
  energyShared,
  sleepShared,
  canShowFutureForecast,
  forecastDays,
  overallMean,
  recent7DayMean,
  recordedDaysCount,
  pattern,
  normalProgress,
  recommendations,
  planAheadSummary,
  sourceKind,
  savedAiSuggestions,
  dismissedIds,
  hiddenByReminderIds,
  onOpenDetail,
}: PlanAheadSectionProps) {
  const defaultSelectedISO =
    forecastDays.find((d) => d.isHighlighted)?.dateISO ?? forecastDays[0]?.dateISO ?? '';
  const [selectedForecastISO, setSelectedForecastISO] = useState<string>(defaultSelectedISO);

  useEffect(() => {
    if (forecastDays.length > 0 && !forecastDays.some((d) => d.dateISO === selectedForecastISO)) {
      const nextDefault =
        forecastDays.find((d) => d.isHighlighted)?.dateISO ?? forecastDays[0].dateISO;
      setSelectedForecastISO(nextDefault);
    }
  }, [forecastDays, selectedForecastISO]);

  const selectedDay =
    forecastDays.find((d) => d.dateISO === selectedForecastISO) ?? forecastDays[0] ?? null;

  const visibleFutureRecs = recommendations.filter(
    (rec) => !dismissedIds.includes(rec.id) && !hiddenByReminderIds.includes(rec.id)
  );

  const formatShortDayDate = (day: ForecastDay) => {
    const month = t.calendar.monthsShort[day.monthIndex];
    if (language === 'en') {
      return `${day.dayOfMonth} ${month}`;
    }
    return `${month}${day.dayOfMonth}日`;
  };

  return (
    <section aria-label={t.care.stage58.planAhead.title} className="space-y-3">
      <div className="bg-gradient-to-br from-[#F2F0FA] via-white to-[#EEF3F8] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/30 shadow-[0_10px_28px_-10px_rgba(91,82,126,0.14)] space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8E4F3] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-[#5B527E]" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#706794]">
                {t.care.stage58.planAhead.badge}
              </div>
              <h2 className="font-display text-[15.5px] font-semibold text-[#292832] leading-tight">
                {t.care.stage58.planAhead.title}
              </h2>
            </div>
          </div>
          <span className="text-[10.5px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2.5 py-1 rounded-xl">
            {t.care.stage58.planAhead.estimateBadge}
          </span>
        </div>

        <p className="text-[12px] text-[#292832]/85 font-medium leading-snug">
          {t.care.stage58.planAhead.subtitle}
        </p>
        <p className="text-[11px] text-[#706794] leading-snug">
          {t.care.stage58.planAhead.kickerQuestion}
        </p>
      </div>

      {!energyShared ? (
        <div className="bg-white/90 rounded-[22px] p-4 ring-1 ring-[#9B93B8]/20 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.05)] space-y-1.5">
          <div className="text-[13.5px] font-semibold text-[#292832]">
            {t.care.stage58.planAhead.privacyPausedTitle}
          </div>
          <p className="text-[12px] text-[#85838D] leading-relaxed">
            {formatTemplate(t.care.stage58.planAhead.privacyPausedBody, {
              partner: recipientName,
            })}
          </p>
        </div>
      ) : !canShowFutureForecast ? (
        <div className="bg-white/90 rounded-[22px] p-4 ring-1 ring-[#9B93B8]/25 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.05)] space-y-2.5">
          <div className="text-[13.5px] font-semibold text-[#292832]">
            {t.care.stage58.planAhead.coldStartEmptyTitle}
          </div>
          <p className="text-[12px] text-[#85838D] leading-relaxed">
            {t.care.stage58.planAhead.coldStartEmptyBody}
          </p>
          {normalProgress && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl bg-[#F4F1F9] px-3 py-2 text-[11px] font-semibold text-[#5B527E] tabular-nums">
                {formatTemplate(t.care.stage58.planAhead.coldStartDaysProgress, {
                  count: normalProgress.recordedDays,
                })}
              </div>
              <div className="rounded-xl bg-[#F4F1F9] px-3 py-2 text-[11px] font-semibold text-[#5B527E] tabular-nums">
                {formatTemplate(t.care.stage58.planAhead.coldStartWeeksProgress, {
                  weeks: normalProgress.maxWeeks,
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[22px] p-4 ring-1 ring-[#9B93B8]/20 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
          <div>
            <h3 className="font-display text-[14px] font-semibold text-[#292832]">
              {t.care.stage58.planAhead.overviewTitle}
            </h3>
            <p className="text-[11px] text-[#85838D] leading-snug mt-0.5">
              {t.care.stage58.planAhead.overviewSubtitle}
            </p>
          </div>

          {forecastDays.length > 0 && (
            <ForecastChart
              days={forecastDays}
              selectedDateISO={selectedForecastISO}
              onSelectDay={(day) => setSelectedForecastISO(day.dateISO)}
            />
          )}

          {selectedDay && (
            <div className="rounded-2xl bg-[#F7F6FC] border border-[#9B93B8]/25 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[12px] font-semibold text-[#292832] tabular-nums">
                  {selectedDay.estimatedEnergy !== null
                    ? formatTemplate(t.care.stage58.planAhead.selectedDayEstimateLabel, {
                        day: t.calendar.weekdaysFull[selectedDay.weekdayIndex],
                        date: formatShortDayDate(selectedDay),
                        score: selectedDay.estimatedEnergy,
                      })
                    : `${t.calendar.weekdaysFull[selectedDay.weekdayIndex]} (${formatShortDayDate(selectedDay)})`}
                </span>
                <span className="text-[10.5px] font-semibold text-[#5B527E] bg-white px-2 py-0.5 rounded-lg border border-[#9B93B8]/25">
                  {t.care.stage58.planAhead.confidencePrefix}{' '}
                  {t.care.stage58.planAhead.confidenceLabels[selectedDay.confidence]}
                </span>
              </div>

              {overallMean !== null && recent7DayMean !== null && (
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#706794] tabular-nums">
                  <span className="font-medium text-[#5B527E]">
                    {t.care.stage58.planAhead.observedHistoryLabel}:
                  </span>
                  <span>
                    {formatTemplate(t.care.stage58.planAhead.overallMeanChip, {
                      score: overallMean,
                    })}
                  </span>
                  <span>·</span>
                  <span>
                    {formatTemplate(t.care.stage58.planAhead.recent7Chip, {
                      score: recent7DayMean,
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {pattern && pattern.hasPattern && pattern.detectedWeekdayIndex !== null ? (
            <div className="rounded-2xl bg-[#FDF7F4] border border-[#E88C7D]/25 px-3 py-2.5 space-y-1 text-[11.5px] text-[#292832]/90">
              <p className="leading-snug font-medium">
                {formatTemplate(t.care.stage58.planAhead.patternCalloutTemplate, {
                  count: pattern.observationCount,
                  weekday: t.calendar.weekdaysFull[pattern.detectedWeekdayIndex],
                  weeks: pattern.qualifyingWeeks,
                  weekdayMean: pattern.weekdayMean ?? 0,
                  overallMean: pattern.overallMean,
                  pct: Math.round(pattern.percentageBelowBaseline),
                })}
              </p>
              {sleepShared && pattern.prevNightAvgSleepHours !== null && (
                <p className="text-[11px] text-[#8E4D42] leading-snug">
                  {formatTemplate(t.care.stage58.planAhead.patternSleepCorrelationTemplate, {
                    weekday: t.calendar.weekdaysFull[pattern.detectedWeekdayIndex],
                    hours: pattern.prevNightAvgSleepHours,
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#EEF3F1] border border-[#8FA89B]/25 px-3 py-2.5 text-[11.5px] text-[#3D5E49] leading-snug">
              {formatTemplate(t.care.stage58.planAhead.steadyPatternNotice, {
                days: recordedDaysCount,
              })}
            </div>
          )}

          {planAheadSummary && (
            <p className="text-[11.5px] text-[#5B527E] leading-relaxed">{planAheadSummary}</p>
          )}
        </div>
      )}

      {/* Concise Future Care Recommendation Cards -> open Recommendation Detail subpage */}
      {energyShared && canShowFutureForecast && visibleFutureRecs.length > 0 && (
        <div className="space-y-2.5">
          <div className="px-0.5 space-y-0.5">
            <h3 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.care.stage58.planAhead.futureRecommendationsTitle}
            </h3>
            <p className="text-[11px] text-[#85838D] leading-snug">
              {t.care.stage58.planAhead.futureRecommendationsSubtitle}
            </p>
          </div>

          {visibleFutureRecs.map((rec) => {
            const isSaved = savedAiSuggestions.some(
              (item) =>
                item.id === rec.id ||
                (Boolean(item.metadata?.fingerprint && rec.fingerprint) &&
                  item.metadata?.fingerprint === rec.fingerprint) ||
                item.title.toLowerCase() === rec.title.toLowerCase()
            );
            const localizedCategory = t.care.aiEngine.categories[rec.category] ?? rec.category;
            const localizedConfidence =
              t.care.aiEngine.confidenceLevels[rec.confidence] ?? rec.confidence;
            const isPurchase = isPurchaseOrientedRecommendation(rec);

            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => onOpenDetail(rec, sourceKind)}
                className="w-full text-left bg-white rounded-[22px] p-4 ring-1 ring-[#9B93B8]/25 shadow-[0_10px_30px_-10px_rgba(91,82,126,0.08)] hover:ring-[#9B93B8]/55 transition-all active:scale-[0.985] space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <AiCategoryBadge category={rec.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                        <CalendarClock className="w-3 h-3 shrink-0" />
                        <span>{rec.suggestedTiming}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isSaved && (
                          <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                            {t.care.saved}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-[#706794] bg-[#F7F6FC] px-2 py-0.5 rounded-lg border border-[#9B93B8]/20">
                          {localizedConfidence}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-display text-[15px] font-semibold text-[#292832] leading-snug mt-1">
                      {rec.title}
                    </h4>
                    <div className="text-[10.5px] text-[#85838D] mt-0.5">
                      {localizedCategory} · {t.care.stage58.planAhead.estimateBadge}
                    </div>
                    <p className="text-[12px] text-[#292832]/80 mt-1 leading-snug line-clamp-2">
                      {rec.action}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                  <span className="text-[10.5px] font-medium text-[#706794]">
                    {isPurchase ? t.deliveryCare.purchaseBadge : t.care.stage58.planAhead.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#5B527E] shrink-0">
                    <span>{t.ia.care.detailOpenCta}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface RecommendationDetailViewProps {
  detail: CareDetailSelection;
  idPrefix: string;
  recipientName: string;
  t: TranslationDictionary;
  language: LanguageCode;
  draftMessage: string;
  onChangeDraft: (msg: string) => void;
  isSaved: boolean;
  surpriseDisabled?: boolean;
  onBack: () => void;
  onSendCare: (customMsg?: string) => void;
  onSave: () => void;
  onSendAsSurprise: () => void;
  onOrderNow: () => void;
  onRemindLater: () => void;
  onNotNow: () => void;
  onSkip: () => void;
  onDismissAi?: () => void;
  onPlanDate?: () => void;
}

function RecommendationDetailView({
  detail,
  idPrefix,
  recipientName,
  t,
  language,
  draftMessage,
  onChangeDraft,
  isSaved,
  surpriseDisabled = false,
  onBack,
  onSendCare,
  onSave,
  onSendAsSurprise,
  onOrderNow,
  onRemindLater,
  onNotNow,
  onSkip,
  onDismissAi,
  onPlanDate,
}: RecommendationDetailViewProps) {
  const { recommendation: rec } = detail;
  const isPurchase =
    detail.demoSuggestion?.requiresSpendingMoney === true || isPurchaseOrientedRecommendation(rec);
  const localizedCategory = t.care.aiEngine.categories[rec.category] ?? rec.category;
  const localizedConfidence = t.care.aiEngine.confidenceLevels[rec.confidence] ?? rec.confidence;
  const localizedStyle = rec.communicationStyle
    ? t.care.aiEngine.communicationStyles[rec.communicationStyle] ?? rec.communicationStyle
    : null;
  const localizedEffort = rec.effortLevel
    ? t.care.aiEngine.effortLevels[rec.effortLevel] ?? rec.effortLevel
    : null;
  const hasDateLink =
    detail.returnTo === 'plan_ahead' &&
    (Boolean(rec.suggestedDatePlanId) || rec.category === 'Quality Time' || Boolean(onPlanDate));
  const [editingMsg, setEditingMsg] = useState(false);

  const productPreview = useMemo(() => {
    if (!isPurchase) return null;
    const item = matchProductForRecommendation(rec);
    const src = getProductImageSrc(item.imageKey);
    return { item, src };
  }, [isPurchase, rec]);

  return (
    <div className="space-y-4 pb-4">
      <SubpageHeader
        title={t.ia.care.detailPageTitle}
        subtitle={formatTemplate(t.care.forRecipient, { name: recipientName })}
        backLabel={t.ia.back}
        onBack={onBack}
      />

      {/* Primary Header Card */}
      <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] ring-1 ring-[#292832]/[0.04] space-y-3">
        <div className="flex items-start gap-3">
          <AiCategoryBadge category={rec.category} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
              <span className="text-[10.5px] font-semibold text-[#706794]">
                {localizedCategory}
              </span>
              <span className="text-[10px] font-medium text-[#85838D] bg-[#F4EFEA] px-2 py-0.5 rounded-lg">
                {t.care.aiEngine.confidenceLabel} {localizedConfidence}
              </span>
            </div>
            <h2 className="font-display text-[17px] font-semibold text-[#292832] leading-snug">
              {rec.title}
            </h2>
            {(localizedStyle || localizedEffort || isPurchase) && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {isPurchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45A4C] bg-[#F5E8E7] px-2 py-0.5 rounded-lg">
                    <ShoppingBag className="w-2.5 h-2.5" />
                    <span>{t.deliveryCare.purchaseBadge}</span>
                  </span>
                )}
                {localizedStyle && (
                  <span className="text-[10px] font-medium text-[#5B527E] bg-[#EFEDF5]/75 px-2 py-0.5 rounded-lg">
                    {localizedStyle}
                  </span>
                )}
                {localizedEffort && (
                  <span className="text-[10px] font-medium text-[#85838D] bg-[#FDFBFA] border border-[#292832]/[0.06] px-2 py-0.5 rounded-lg">
                    {localizedEffort}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {productPreview && productPreview.src && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.06] p-2.5">
            <img
              src={productPreview.src}
              alt={productPreview.item.title[language]}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-[#292832] truncate">
                {productPreview.item.title[language]}
              </div>
              <div className="text-[10.5px] text-[#85838D] truncate">
                {productPreview.item.merchantName[language]} · {productPreview.item.currencySymbol}
                {productPreview.item.unitPrice}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reasoning & Action */}
      <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#706794]">
          {t.ia.care.detailReasoningTitle}
        </div>
        <p className="text-[12.5px] text-[#292832] leading-relaxed">{rec.action}</p>
        <div className="bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.05] text-[12px] text-[#292832]/85 leading-relaxed">
          <span className="font-semibold text-[#292832]">{t.care.aiEngine.whyLabel} </span>
          {rec.why}
        </div>
      </div>

      {/* Context & Expandable Evidence */}
      <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#706794]">
          {t.ia.care.detailContextTitle}
        </div>
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-center gap-1.5 text-[#292832]">
            <Clock className="w-3.5 h-3.5 text-[#85838D] shrink-0" strokeWidth={1.9} />
            <span>
              <span className="font-medium text-[#85838D]">{t.care.aiEngine.whenLabel} </span>
              {rec.suggestedTiming}
            </span>
          </div>
          <p className="text-[#706794] leading-snug">
            <span className="font-semibold">{t.care.aiEngine.personalizationLabel} </span>
            {rec.personalizationReason}
          </p>
        </div>

        <ExpandableEvidencePanel
          t={t}
          accentTone={detail.returnTo === 'plan_ahead' ? 'cool' : 'warm'}
          evidenceSummary={rec.evidenceSummary ?? rec.personalizationReason}
          evidenceDetails={
            rec.evidenceDetails && rec.evidenceDetails.length > 0
              ? rec.evidenceDetails
              : [t.care.stage58.careForNow.observedDataTag]
          }
        />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#706794]">
          {t.ia.care.detailActionsTitle}
        </div>

        {isPurchase ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onOrderNow}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_8px_18px_-6px_rgba(232,140,125,0.55)] transition-all duration-200 active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>{t.deliveryCare.orderNowBtn}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRemindLater}
                className="min-h-[40px] px-3 py-2 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{t.deliveryCare.remindLaterBtn}</span>
              </button>

              <button
                type="button"
                onClick={onNotNow}
                className="min-h-[40px] px-3 py-2 rounded-2xl bg-[#FDFBFA] border border-[#292832]/10 hover:bg-[#F4EFEA] text-[#85838D] hover:text-[#292832] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95"
              >
                <EyeOff className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{t.deliveryCare.notNowBtn}</span>
              </button>
            </div>

            <div className="pt-1 border-t border-[#292832]/[0.05] flex justify-end">
              <button
                type="button"
                onClick={onSave}
                aria-pressed={isSaved}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSaved
                    ? 'bg-[#EFEDF5] text-[#5B527E]'
                    : 'bg-[#F4EFEA] text-[#292832] hover:bg-[#EAE3DC]'
                }`}
              >
                {isSaved ? (
                  <Check className="w-3 h-3 shrink-0" strokeWidth={2.2} />
                ) : (
                  <Bookmark className="w-3 h-3 shrink-0" strokeWidth={2} />
                )}
                <span>{isSaved ? t.care.saved : t.care.saveSuggestion}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div>
              <button
                type="button"
                onClick={() => setEditingMsg((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#706794] hover:underline active:scale-95 transition-transform"
              >
                <Pencil className="w-3 h-3" />
                <span>{editingMsg ? t.care.hideMessageEditor : t.care.editMessage}</span>
              </button>

              {editingMsg ? (
                <div className="mt-2">
                  <label
                    htmlFor={`detail-msg-${idPrefix}-${rec.id}`}
                    className="block text-[11px] font-medium text-[#85838D] mb-1"
                  >
                    {formatTemplate(t.care.customMessageLabel, { name: recipientName })}
                  </label>
                  <textarea
                    id={`detail-msg-${idPrefix}-${rec.id}`}
                    rows={3}
                    value={draftMessage}
                    onChange={(e) => onChangeDraft(e.target.value)}
                    className="w-full rounded-2xl bg-[#FDFBFA] border border-[#292832]/10 p-2.5 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#E88C7D]"
                  />
                </div>
              ) : (
                <div className="mt-2 rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 text-[12px] text-[#292832]/85 italic leading-relaxed">
                  “{draftMessage}”
                </div>
              )}
            </div>

            {hasDateLink && onPlanDate ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onPlanDate}
                  className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#5B527E] hover:bg-[#494168] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.care.stage58.planAhead.planDateBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = draftMessage.trim();
                    onSendCare(
                      trimmed && trimmed !== rec.defaultMessage.trim() ? trimmed : undefined
                    );
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_6px_16px_-6px_rgba(232,140,125,0.55)] transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.care.sendCare}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = draftMessage.trim();
                    onSendCare(
                      trimmed && trimmed !== rec.defaultMessage.trim() ? trimmed : undefined
                    );
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_6px_16px_-6px_rgba(232,140,125,0.55)] transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.care.sendCare}</span>
                </button>

                <button
                  type="button"
                  onClick={onSave}
                  aria-pressed={isSaved}
                  className={`min-h-[44px] px-3 py-2 rounded-2xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                    isSaved
                      ? 'bg-[#EFEDF5] text-[#5B527E] ring-1 ring-[#9B93B8]/40'
                      : 'bg-[#F4EFEA] text-[#292832] hover:bg-[#EAE3DC]'
                  }`}
                >
                  {isSaved ? (
                    <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  )}
                  <span className="truncate">
                    {isSaved ? t.care.saved : t.care.saveSuggestion}
                  </span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={surpriseDisabled}
                onClick={onSendAsSurprise}
                title={surpriseDisabled ? t.surpriseCare.normalUnpairedHint : undefined}
                className="min-h-[40px] px-3 py-2 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] disabled:opacity-50 text-[#5B527E] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Gift className="w-3.5 h-3.5 shrink-0 text-[#C45E4E]" strokeWidth={2} />
                <span className="truncate">{t.surpriseCare.sendAsSurpriseBtn}</span>
              </button>

              <button
                type="button"
                onClick={onRemindLater}
                className="min-h-[40px] px-3 py-2 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{t.deliveryCare.remindLaterBtn}</span>
              </button>
            </div>

            {hasDateLink && (
              <button
                type="button"
                onClick={onSave}
                aria-pressed={isSaved}
                className={`w-full min-h-[38px] px-3 py-1.5 rounded-2xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  isSaved
                    ? 'bg-[#EFEDF5] text-[#5B527E] ring-1 ring-[#9B93B8]/40'
                    : 'bg-[#F4EFEA] text-[#292832] hover:bg-[#EAE3DC]'
                }`}
              >
                {isSaved ? (
                  <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.2} />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                )}
                <span>{isSaved ? t.care.saved : t.care.saveSuggestion}</span>
              </button>
            )}

            <div className="pt-2 border-t border-[#292832]/[0.05] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="min-h-[34px] px-3 py-1 rounded-xl bg-[#FDFBFA] hover:bg-[#F4EFEA] text-[#85838D] hover:text-[#292832] text-[11px] font-medium inline-flex items-center gap-1.5 transition-all active:scale-95"
              >
                <SkipForward className="w-3 h-3 shrink-0" strokeWidth={2} />
                <span>{t.care.skipBtn}</span>
              </button>

              {onDismissAi && (
                <button
                  type="button"
                  onClick={onDismissAi}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-[#FDFBFA] hover:bg-[#F4EFEA] text-[#85838D] hover:text-[#292832] text-[11px] font-medium inline-flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <EyeOff className="w-3 h-3 shrink-0" strokeWidth={2} />
                  <span>{t.care.aiEngine.dismissBtn}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NormalCareContent() {
  const {
    normalUser,
    normalPairing,
    normalPreferences,
    normalBaseline,
    normalInteractions,
    normalCareSubView,
    setNormalCareSubView,
    saveNormalSuggestion,
    saveNormalAiSuggestion,
    sendNormalCare,
    sendNormalAiCare,
    trackNormalSkippedSuggestion,
    recordNormalRecentSuggestions,
    normalLearnedProfile,
    setNormalActivePage,
    membership,
    normalAiCareUsageCount,
    incrementNormalAiCareUsage,
    openNormalPremiumMembership,
    createNormalSurpriseCare,
    updateNormalSurpriseCare,
    cancelNormalSurpriseCare,
    dismissNormalRecommendationNotNow,
    scheduleNormalCareReminder,
    dismissNormalCareReminder,
    createNormalSimulatedOrderFlow,
    advanceNormalMockOrderStatus,
    cancelNormalMockOrder,
    t,
    language,
  } = useDualCharge();

  const [detailSelection, setDetailSelection] = useState<CareDetailSelection | null>(null);
  const [selectedDateCat] = useState<DatePlanCategory | 'all'>('all');
  const [normalDateReactions, setNormalDateReactions] = useState<
    Record<string, 'like' | 'skip' | undefined>
  >({});
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    kind: 'sent' | 'saved' | 'feedback';
    title: string;
    showViewLink?: boolean;
  } | null>(null);

  const [aiResult, setAiResult] = useState<AiCareGenerationResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSeed, setAiSeed] = useState(0);
  const [dismissedAiIds, setDismissedAiIds] = useState<string[]>([]);
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const [surpriseSourceRec, setSurpriseSourceRec] = useState<AiCareRecommendation | null>(null);
  const [editingSurprise, setEditingSurprise] = useState<SurpriseCareRecord | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryRec, setDeliveryRec] = useState<AiCareRecommendation | null>(null);
  const [activeReminderId, setActiveReminderId] = useState<string | undefined>(undefined);
  const [remindSheetOpen, setRemindSheetOpen] = useState(false);
  const [remindRec, setRemindRec] = useState<AiCareRecommendation | null>(null);
  const [reminderNowISO, setReminderNowISO] = useState<string>(() => new Date().toISOString());

  const normalReminders = normalInteractions.careReminders ?? [];
  useEffect(() => {
    const hasScheduled = normalReminders.some((r) => r.status === 'scheduled');
    if (!hasScheduled) return;
    setReminderNowISO(new Date().toISOString());
    const timer = window.setInterval(() => {
      setReminderNowISO(new Date().toISOString());
    }, 10000);
    return () => window.clearInterval(timer);
  }, [normalReminders]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const partnerDisplayName = t.normalMode.partnerDisplayName;
  const isPaired = normalPairing.status === 'paired_simulated';
  const isBuilding = normalBaseline.phase === 'building';
  const normalCapabilities = getMembershipCapabilities(membership, false);
  const canGenerateNormalAi = normalCapabilities.canGenerateAiCare(normalAiCareUsageCount);

  const suggestions = selectNormalCareSuggestions(
    normalPreferences.preferredCare,
    normalPreferences.avoidTags
  );
  const { dueReminders: normalDueReminders, upcomingReminders: normalUpcomingReminders } =
    evaluateDueReminders(normalReminders, reminderNowISO);
  const normalUpcomingReminderRecIds = normalUpcomingReminders.map((r) => r.recommendation.id);
  const normalCombinedDismissedIds = [
    ...new Set([...dismissedAiIds, ...(normalInteractions.dismissedRecommendationIds ?? [])]),
  ];

  const normalSuggestionTitleLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [key, item] of Object.entries(t.normalMode.careSuggestions)) {
      map[key] = item.title;
    }
    return map;
  }, [t.normalMode.careSuggestions]);

  const normalDatePlans = useMemo(() => {
    const avoidLabels = normalPreferences.avoidTags.map(
      (k) => t.onboarding.step4.avoidOptions[k] ?? k
    );
    return buildDatePlanSuggestions({
      viewerId: 'alex',
      partnerId: 'jamie',
      partnerEnergy: null,
      partnerSharing: normalUser.sharingConsent,
      partnerAvoidLabels: avoidLabels,
      partnerSharedRecharge: normalInteractions.weeklyRecharge,
      selectedCategory: selectedDateCat,
    });
  }, [
    normalPreferences.avoidTags,
    normalUser.sharingConsent,
    normalInteractions.weeklyRecharge,
    selectedDateCat,
    t.onboarding.step4.avoidOptions,
  ]);
  const normalStarterActivities = useMemo(
    () => getBasicActivitySuggestions(normalDatePlans),
    [normalDatePlans]
  );
  const normalDatePlanOptions: SurpriseDatePlanOption[] = useMemo(
    () =>
      normalStarterActivities.map((p) => ({
        id: p.id,
        title: t.care.datePlanning.plans[p.titleKey]?.title ?? p.titleKey,
        suggestedSlot: p.suggestedSlot,
      })),
    [normalStarterActivities, t.care.datePlanning.plans]
  );

  const normalPresetToAiRec = (suggestion: NormalCareSuggestion): AiCareRecommendation | null => {
    const localized = t.normalMode.careSuggestions[suggestion.id];
    if (!localized) return null;
    const draftMsg = customDrafts[suggestion.id] ?? localized.defaultMessage;
    return presetToAiRecommendation({
      id: suggestion.id,
      title: localized.title,
      description: localized.description,
      reason: localized.reason,
      timing: localized.timing,
      defaultMessage: draftMsg,
      evidenceSummary: localized.reason,
      evidenceDetails: [t.care.stage58.careForNow.observedDataTag],
    });
  };

  const openNormalSurpriseFromAi = (rec: AiCareRecommendation) => {
    if (!isPaired) return;
    setEditingSurprise(null);
    setSurpriseSourceRec(rec);
    setSurpriseModalOpen(true);
  };

  const openNormalSurpriseFromFirstAvailable = () => {
    if (!isPaired) return;
    const aiRec = aiResult?.data.recommendations[0];
    if (aiRec) {
      openNormalSurpriseFromAi(aiRec);
      return;
    }
    const firstPreset = suggestions[0] ? normalPresetToAiRec(suggestions[0]) : null;
    if (firstPreset) {
      openNormalSurpriseFromAi(firstPreset);
    }
  };

  const handleConfirmNormalSurpriseCreate = (payload: SurpriseCareSubmitPayload) => {
    const ok = createNormalSurpriseCare(payload);
    if (!ok) return;
    setToast({
      kind: 'sent',
      title: formatTemplate(
        payload.deliveryMode === 'tell_now'
          ? t.surpriseCare.createdSentToast
          : t.surpriseCare.createdScheduledToast,
        { name: partnerDisplayName, partner: partnerDisplayName }
      ),
      showViewLink: true,
    });
  };

  const handleGenerateAi = async () => {
    if (aiLoading || !canGenerateNormalAi) return;
    setAiLoading(true);
    try {
      const nextSeed = aiSeed;
      const context = buildNormalCareContext({
        language,
        normalUser,
        normalPairing,
        normalPreferences,
        normalBaseline,
        normalInteractions,
        preferredLabels: t.onboarding.step4.preferredCareOptions,
        avoidLabels: t.onboarding.step4.avoidOptions,
        communicationLabels: t.onboarding.step4.communicationOptions,
        suggestionTitleLookup: normalSuggestionTitleLookup,
        partnerDisplayName,
      });
      const res = await requestAiCareRecommendations(context, nextSeed);
      setAiResult(res);
      recordNormalRecentSuggestions(res.data.recommendations);
      incrementNormalAiCareUsage();
      setAiSeed((prev) => prev + 1);
      setDismissedAiIds([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendCare = (suggestion: NormalCareSuggestion, customMsg?: string) => {
    sendNormalCare(suggestion, customMsg);
    setToast({
      kind: 'sent',
      title: formatTemplate(t.care.sentToastTitle, { name: partnerDisplayName }),
      showViewLink: true,
    });
  };

  const handleSaveSuggestion = (suggestion: NormalCareSuggestion) => {
    const localizedTitle = t.normalMode.careSuggestions[suggestion.id]?.title ?? '';
    const wasAdded = saveNormalSuggestion(suggestion);
    setToast({
      kind: 'saved',
      title: formatTemplate(wasAdded ? t.care.savedToastText : t.care.alreadySavedText, {
        title: localizedTitle,
      }),
      showViewLink: false,
    });
  };

  const handleSendAiCare = (rec: AiCareRecommendation, customMsg?: string) => {
    sendNormalAiCare(rec, customMsg);
    setToast({
      kind: 'sent',
      title: formatTemplate(t.care.sentToastTitle, { name: partnerDisplayName }),
      showViewLink: true,
    });
  };

  const handleSaveAiSuggestion = (
    rec: AiCareRecommendation,
    source: 'gemini' | 'fallback'
  ) => {
    const wasAdded = saveNormalAiSuggestion(rec, source);
    setToast({
      kind: 'saved',
      title: formatTemplate(wasAdded ? t.care.savedToastText : t.care.alreadySavedText, {
        title: rec.title,
      }),
      showViewLink: false,
    });
  };

  const handleDismissAi = (rec: AiCareRecommendation) => {
    setDismissedAiIds((prev) => (prev.includes(rec.id) ? prev : [...prev, rec.id]));
    setToast({
      kind: 'feedback',
      title: formatTemplate(t.care.aiEngine.dismissToast, { title: rec.title }),
    });
  };

  const handleNotNowNormal = (rec: AiCareRecommendation) => {
    dismissNormalRecommendationNotNow(rec.id);
    setToast({
      kind: 'feedback',
      title: formatTemplate(t.deliveryCare.notNowToast, { title: rec.title }),
    });
  };

  const openNormalOrderNow = (rec: AiCareRecommendation, reminderId?: string) => {
    setDeliveryRec(rec);
    setActiveReminderId(reminderId);
    setDeliveryModalOpen(true);
  };

  const openNormalRemindLater = (rec: AiCareRecommendation) => {
    setRemindRec(rec);
    setRemindSheetOpen(true);
  };

  const handleConfirmNormalReminder = (
    presetKey: CareReminderPresetKey,
    customISO?: string | null
  ) => {
    if (!remindRec) return;
    const created = scheduleNormalCareReminder({
      recommendation: remindRec,
      presetKey,
      customISO,
    });
    const formatted = new Date(created.remindAtISO).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    setToast({
      kind: 'saved',
      title: formatTemplate(t.deliveryCare.reminder.scheduledToast, { time: formatted }),
    });
  };

  const handleCompleteNormalOrderFlow = (payload: MockDeliveryOrderPayload) => {
    createNormalSimulatedOrderFlow(payload);
    setToast({
      kind: 'sent',
      title: formatTemplate(
        payload.revealMode === 'tell_now'
          ? t.surpriseCare.createdSentToast
          : t.surpriseCare.createdScheduledToast,
        { name: partnerDisplayName, partner: partnerDisplayName }
      ),
      showViewLink: true,
    });
  };

  const handleSkipAi = (rec: AiCareRecommendation) => {
    trackNormalSkippedSuggestion(rec.id);
    setToast({
      kind: 'feedback',
      title: formatTemplate(t.care.skippedToast, {
        title: rec.title,
        name: partnerDisplayName,
      }),
    });
  };

  const openDetailForAi = (
    rec: AiCareRecommendation,
    returnTo: 'now' | 'plan_ahead',
    sourceKind: 'gemini' | 'fallback' | 'baseline'
  ) => {
    setDetailSelection({
      recommendation: rec,
      returnTo,
      kind: 'ai',
      sourceKind,
    });
    setNormalCareSubView('detail');
  };

  const openDetailForPreset = (suggestion: NormalCareSuggestion) => {
    const rec = normalPresetToAiRec(suggestion);
    if (!rec) return;
    setDetailSelection({
      recommendation: rec,
      returnTo: 'now',
      kind: 'preset',
      sourceKind: 'preset',
      presetId: suggestion.id,
      normalSuggestion: suggestion,
    });
    setNormalCareSubView('detail');
  };

  const activeOrdersCount = (normalInteractions.mockOrders ?? []).filter(
    (o) => o.status !== 'Cancelled'
  ).length;
  const activePreparedCount = (normalInteractions.surpriseCareRecords ?? []).filter(
    (r) => r.status !== 'Cancelled' && !r.orderId
  ).length;
  const surpriseActiveTotal = activeOrdersCount + activePreparedCount;

  const toastBanner = toast && (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-30 rounded-2xl bg-[#292832]/92 backdrop-blur-[10px] text-white px-3.5 py-2.5 shadow-[0_12px_28px_-8px_rgba(41,40,50,0.35)] flex items-center justify-between gap-2 text-[12px]"
    >
      <span className="flex items-center gap-2 min-w-0">
        <Check className="w-4 h-4 text-[#8FA89B] shrink-0" strokeWidth={2.3} />
        <span className="truncate font-medium">{toast.title}</span>
      </span>
      {toast.showViewLink && (
        <button
          type="button"
          onClick={() => {
            setToast(null);
            setNormalActivePage('notifications');
          }}
          className="text-[#E88C7D] font-semibold underline shrink-0 whitespace-nowrap active:scale-95 transition-transform"
        >
          {t.care.viewNotifications}
        </button>
      )}
    </div>
  );

  const visiblePresetSuggestions = suggestions.filter(
    (s) =>
      !(normalInteractions.skippedSuggestionIds ?? []).includes(s.id) &&
      !(normalInteractions.dismissedRecommendationIds ?? []).includes(s.id) &&
      !normalUpcomingReminderRecIds.includes(s.id)
  );

  const renderModals = () => (
    <>
      <SurpriseCareModal
        open={surpriseModalOpen}
        onClose={() => {
          setSurpriseModalOpen(false);
          setEditingSurprise(null);
        }}
        t={t}
        recipientName={partnerDisplayName}
        sourceRecommendation={surpriseSourceRec}
        editingRecord={editingSurprise}
        datePlanOptions={normalDatePlanOptions}
        isDemoMode={false}
        onConfirmCreate={handleConfirmNormalSurpriseCreate}
        onConfirmEdit={(id, patch) => {
          updateNormalSurpriseCare(id, patch);
          setToast({ kind: 'saved', title: t.surpriseCare.updatedToast });
        }}
      />

      <MockDeliveryPlatformModal
        open={deliveryModalOpen}
        recommendation={deliveryRec}
        recipientId="normal_partner"
        recipientName={partnerDisplayName}
        language={language}
        t={t}
        reminderId={activeReminderId}
        isDemoMode={false}
        onClose={() => {
          setDeliveryModalOpen(false);
          setDeliveryRec(null);
          setActiveReminderId(undefined);
        }}
        onCompleteOrderFlow={handleCompleteNormalOrderFlow}
      />

      <RemindLaterSheet
        open={remindSheetOpen}
        recommendationTitle={remindRec?.title ?? ''}
        t={t}
        onClose={() => {
          setRemindSheetOpen(false);
          setRemindRec(null);
        }}
        onConfirm={handleConfirmNormalReminder}
      />
    </>
  );

  if (normalCareSubView === 'detail' && detailSelection) {
    const rec = detailSelection.recommendation;
    const isSaved =
      detailSelection.kind === 'preset' && detailSelection.normalSuggestion
        ? normalInteractions.savedSuggestionIds.includes(detailSelection.normalSuggestion.id)
        : normalInteractions.savedAiSuggestions.some(
            (item) =>
              item.id === rec.id ||
              (Boolean(item.metadata?.fingerprint && rec.fingerprint) &&
                item.metadata?.fingerprint === rec.fingerprint) ||
              item.title.toLowerCase() === rec.title.toLowerCase()
          );
    const draftMsg = customDrafts[rec.id] ?? rec.defaultMessage;

    return (
      <div className="space-y-4 pb-2 relative">
        {toastBanner}
        <RecommendationDetailView
          detail={detailSelection}
          idPrefix="normal"
          recipientName={partnerDisplayName}
          t={t}
          language={language}
          draftMessage={draftMsg}
          onChangeDraft={(msg) => setCustomDrafts((prev) => ({ ...prev, [rec.id]: msg }))}
          isSaved={isSaved}
          surpriseDisabled={!isPaired}
          onBack={() => setNormalCareSubView(detailSelection.returnTo)}
          onSendCare={(customMsg) => {
            if (detailSelection.kind === 'preset' && detailSelection.normalSuggestion) {
              handleSendCare(detailSelection.normalSuggestion, customMsg);
            } else {
              handleSendAiCare(rec, customMsg);
            }
          }}
          onSave={() => {
            if (detailSelection.kind === 'preset' && detailSelection.normalSuggestion) {
              handleSaveSuggestion(detailSelection.normalSuggestion);
            } else {
              handleSaveAiSuggestion(
                rec,
                detailSelection.sourceKind === 'gemini' ? 'gemini' : 'fallback'
              );
            }
          }}
          onSendAsSurprise={() => {
            const payloadRec =
              draftMsg.trim() && draftMsg.trim() !== rec.defaultMessage.trim()
                ? { ...rec, defaultMessage: draftMsg.trim() }
                : rec;
            openNormalSurpriseFromAi(payloadRec);
          }}
          onOrderNow={() => openNormalOrderNow(rec)}
          onRemindLater={() => openNormalRemindLater(rec)}
          onNotNow={() => {
            handleNotNowNormal(rec);
            setNormalCareSubView(detailSelection.returnTo);
          }}
          onSkip={() => {
            handleSkipAi(rec);
            setNormalCareSubView(detailSelection.returnTo);
          }}
          onDismissAi={
            detailSelection.kind === 'ai'
              ? () => {
                  handleDismissAi(rec);
                  setNormalCareSubView(detailSelection.returnTo);
                }
              : undefined
          }
          onPlanDate={() => {
            setNormalCareSubView('date_planning');
          }}
        />
        {renderModals()}
      </div>
    );
  }

  if (normalCareSubView === 'surprise') {
    return (
      <div className="space-y-4 pb-2 relative">
        {toastBanner}
        <SubpageHeader
          title={t.ia.care.surprisePageTitle}
          subtitle={formatTemplate(t.care.forRecipient, { name: partnerDisplayName })}
          backLabel={t.ia.back}
          onBack={() => setNormalCareSubView('now')}
        />

        <div className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/25 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#C45E4E]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[15px] font-semibold text-[#292832]">
                {t.ia.care.surpriseCardTitle}
              </h2>
              <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
                {t.ia.care.surpriseCardDesc}
              </p>
            </div>
          </div>

          {!isPaired && (
            <div className="rounded-xl bg-[#EFEDF5]/75 px-3 py-2 text-[11px] text-[#5B527E] flex items-center justify-between gap-2">
              <span className="leading-snug">{t.surpriseCare.normalUnpairedHint}</span>
              <button
                type="button"
                onClick={() => setNormalActivePage('profile')}
                className="font-semibold underline shrink-0"
              >
                {t.normalMode.invitePartnerCta}
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={!isPaired || suggestions.length === 0}
            onClick={openNormalSurpriseFromFirstAvailable}
            className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] disabled:opacity-50 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_8px_18px_-6px_rgba(232,140,125,0.5)] transition-all active:scale-95"
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>{t.ia.care.surpriseCreateBtn}</span>
          </button>
        </div>

        <DueRemindersSection
          dueReminders={normalDueReminders}
          t={t}
          onOrderNow={(rem) => openNormalOrderNow(rem.recommendation, rem.id)}
          onReschedule={(rem) => openNormalRemindLater(rem.recommendation)}
          onDismiss={(remId) => dismissNormalCareReminder(remId)}
        />

        <SenderOrdersTrackingSection
          orders={normalInteractions.mockOrders ?? []}
          t={t}
          onAdvanceStage={(orderId, nextStatus) => {
            advanceNormalMockOrderStatus(orderId, nextStatus);
            setToast({
              kind: nextStatus === 'Delivered' ? 'sent' : 'feedback',
              title: formatTemplate(
                nextStatus === 'Delivered'
                  ? t.deliveryCare.tracking.deliveredSurpriseToast
                  : t.deliveryCare.tracking.stageUpdatedToast,
                { stage: t.deliveryCare.tracking.stages[nextStatus] }
              ),
              showViewLink: nextStatus === 'Delivered',
            });
          }}
          onCancelOrder={(orderId) => {
            cancelNormalMockOrder(orderId);
            setToast({
              kind: 'feedback',
              title: t.deliveryCare.tracking.cancelledToast,
            });
          }}
        />

        <PreparedSurprisesSection
          records={normalInteractions.surpriseCareRecords ?? []}
          recipientName={partnerDisplayName}
          t={t}
          subtitle={t.surpriseCare.normalPreparedSubtitle}
          onEdit={(rec) => {
            setSurpriseSourceRec(null);
            setEditingSurprise(rec);
            setSurpriseModalOpen(true);
          }}
          onCancel={(id) => {
            cancelNormalSurpriseCare(id);
            setToast({ kind: 'feedback', title: t.surpriseCare.cancelledToast });
          }}
        />

        {normalDueReminders.length === 0 &&
          activeOrdersCount === 0 &&
          activePreparedCount === 0 && (
            <div className="bg-white/90 rounded-[22px] p-5 text-center space-y-1.5 border border-[#E9E4DB]">
              <p className="text-[12.5px] font-semibold text-[#292832]">
                {t.surpriseCare.preparedSectionTitle} (0)
              </p>
              <p className="text-[11.5px] text-[#85838D] leading-snug">
                {t.surpriseCare.normalPreparedSubtitle}
              </p>
            </div>
          )}

        <ExpandableAccordion
          title={t.ia.care.surprisePrivacyTitle}
          icon={<ShieldCheck className="w-4 h-4 text-[#706794]" />}
        >
          <div className="space-y-1.5">
            <p>{t.deliveryCare.recipient.maskedProgressHint}</p>
            <p>{t.deliveryCare.tracking.noAutoCompleteHint}</p>
          </div>
        </ExpandableAccordion>

        {renderModals()}
      </div>
    );
  }

  const activeScenarioTab: 'now' | 'plan_ahead' | 'date_planning' =
    normalCareSubView === 'plan_ahead' || normalCareSubView === 'date_planning'
      ? normalCareSubView
      : 'now';

  return (
    <div className="space-y-4 pb-2 relative">
      {toastBanner}

      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-[20px] font-semibold tracking-tight text-[#292832]">
            {t.care.title}
          </h1>
          <span className="text-[11px] font-semibold text-[#8E4D42] bg-[#F5E8E7] px-2.5 py-0.5 rounded-xl">
            {formatTemplate(t.normalMode.dayBadgeTemplate, {
              day: normalBaseline.currentDayNumber,
            })}
          </span>
        </div>
        <p className="text-[12.5px] text-[#85838D] mt-0.5">{t.ia.care.overviewSubtitle}</p>
      </div>

      {/* Scenario Switcher: Care for Now | Plan Ahead | Date Planning */}
      <div
        role="tablist"
        aria-label={t.care.title}
        className="grid grid-cols-3 gap-1 p-1 bg-[#F4EFEA] rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeScenarioTab === 'now'}
          onClick={() => setNormalCareSubView('now')}
          className={`min-h-[38px] rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 px-1.5 truncate ${
            activeScenarioTab === 'now'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {t.ia.care.scenarios.now}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeScenarioTab === 'plan_ahead'}
          onClick={() => setNormalCareSubView('plan_ahead')}
          className={`min-h-[38px] rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 px-1.5 truncate ${
            activeScenarioTab === 'plan_ahead'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {t.ia.care.scenarios.planAhead}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeScenarioTab === 'date_planning'}
          onClick={() => setNormalCareSubView('date_planning')}
          className={`min-h-[38px] rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 px-1.5 truncate ${
            activeScenarioTab === 'date_planning'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          <Calendar className="w-3 h-3 text-[#E88C7D] shrink-0" />
          <span className="truncate">{t.ia.care.scenarios.datePlanning}</span>
        </button>
      </div>

      {/* Surprise Care Entry Card */}
      <button
        type="button"
        onClick={() => setNormalCareSubView('surprise')}
        className="w-full text-left bg-gradient-to-r from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-3.5 ring-1 ring-[#E88C7D]/30 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] hover:ring-[#E88C7D]/60 transition-all active:scale-[0.985] flex items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-[#C45E4E]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display text-[14px] font-semibold text-[#292832]">
                {t.ia.care.surpriseCardTitle}
              </span>
              {normalDueReminders.length > 0 && (
                <span className="rounded-lg bg-[#FBF2E6] px-2 py-0.5 text-[10px] font-semibold text-[#6E4F28] tabular-nums">
                  {formatTemplate(t.ia.care.surpriseCardBadgeDue, {
                    count: normalDueReminders.length,
                  })}
                </span>
              )}
              {surpriseActiveTotal > 0 && (
                <span className="rounded-lg bg-[#EFEDF5] px-2 py-0.5 text-[10px] font-semibold text-[#5B527E] tabular-nums">
                  {formatTemplate(t.ia.care.surpriseCardBadgeActive, {
                    count: surpriseActiveTotal,
                  })}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#85838D] leading-snug mt-0.5">
              {t.ia.care.surpriseCardDesc}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#85838D] shrink-0" />
      </button>

      {activeScenarioTab === 'date_planning' ? (
        <div className="space-y-3">
          <div className="bg-white/85 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
            <h2 className="font-display text-[15px] font-semibold text-[#292832]">
              {t.care.membershipLock.basicActivityTitle}
            </h2>
            <p className="text-[11.5px] text-[#85838D] leading-snug">
              {t.care.membershipLock.basicActivitySubtitle}
            </p>
            <div className="rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.05] px-3 py-2 text-[11px] text-[#85838D]">
              {t.care.datePlanning.normalModeNotice}
            </div>
          </div>

          {normalStarterActivities.map((plan) => {
            const copy = t.care.datePlanning.plans[plan.titleKey];
            const reaction = normalDateReactions[plan.id];
            return (
              <article
                key={plan.id}
                className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                    {t.care.datePlanning.categories[plan.category]}
                  </span>
                  <span className="text-[10px] font-medium text-[#85838D]">
                    {t.care.datePlanning.budgetLabels[plan.estimatedBudget]}
                  </span>
                </div>
                <h3 className="font-display text-[14.5px] font-semibold text-[#292832]">
                  {copy?.title ?? plan.titleKey}
                </h3>
                <p className="text-[12px] text-[#292832]/85 leading-snug">
                  {copy?.desc ?? ''}
                </p>
                <div className="text-[11px] text-[#85838D] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{plan.suggestedSlot}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setNormalDateReactions((prev) => ({
                        ...prev,
                        [plan.id]: prev[plan.id] === 'like' ? undefined : 'like',
                      }))
                    }
                    className={`min-h-[36px] px-3 rounded-xl text-[11.5px] font-semibold flex items-center justify-center gap-1 transition-all ${
                      reaction === 'like'
                        ? 'bg-[#8FA89B]/22 text-[#3D5E49] ring-1 ring-[#8FA89B]/45'
                        : 'bg-[#F4EFEA] text-[#292832]'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>
                      {reaction === 'like'
                        ? t.care.datePlanning.likedBtn
                        : t.care.datePlanning.likeBtn}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNormalDateReactions((prev) => ({
                        ...prev,
                        [plan.id]: prev[plan.id] === 'skip' ? undefined : 'skip',
                      }))
                    }
                    className={`min-h-[36px] px-3 rounded-xl text-[11.5px] font-semibold flex items-center justify-center gap-1 transition-all ${
                      reaction === 'skip'
                        ? 'bg-[#F5E8E7] text-[#8E4D42]'
                        : 'bg-[#FDFBFA] text-[#85838D] border border-[#292832]/[0.06]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>
                      {reaction === 'skip'
                        ? t.care.datePlanning.skippedBtn
                        : t.care.datePlanning.skipBtn}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}

          <PremiumFeaturePreview
            badgeLabel={t.care.membershipLock.datePlanLockedBadge}
            title={t.care.membershipLock.datePlanLockedTitle}
            description={t.care.membershipLock.datePlanLockedDesc}
            benefits={t.care.membershipLock.datePlanLockedBenefits}
            upgradeLabel={t.care.membershipLock.upgradeCta}
            backLabel={t.care.membershipLock.backToSuggestions}
            onUpgrade={openNormalPremiumMembership}
            onBack={() => setNormalCareSubView('now')}
          />
        </div>
      ) : activeScenarioTab === 'plan_ahead' ? (
        <PlanAheadSection
          t={t}
          language={language}
          recipientName={partnerDisplayName}
          energyShared={normalUser.sharingConsent.energy}
          sleepShared={false}
          canShowFutureForecast={normalBaseline.canShowFutureForecast}
          forecastDays={[]}
          overallMean={null}
          recent7DayMean={null}
          recordedDaysCount={normalBaseline.recordedDaysCount}
          pattern={null}
          normalProgress={{
            recordedDays: normalBaseline.recordedDaysCount,
            maxWeeks: normalBaseline.weekdayPattern.maxDistinctWeeksObserved,
          }}
          recommendations={aiResult?.data.planAheadRecommendations ?? []}
          planAheadSummary={aiResult?.data.planAheadSummary}
          sourceKind={aiResult?.source ?? 'fallback'}
          savedAiSuggestions={normalInteractions.savedAiSuggestions}
          dismissedIds={normalCombinedDismissedIds}
          hiddenByReminderIds={normalUpcomingReminderRecIds}
          onOpenDetail={(rec, src) => openDetailForAi(rec, 'plan_ahead', src)}
        />
      ) : (
        <>
          <section
            aria-label={t.normalMode.careColdStartTitle}
            className="bg-white/85 backdrop-blur-[10px] ring-1 ring-white/80 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#EFEDF5] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-[#706794]" strokeWidth={2} />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-[11px] font-semibold text-[#706794]">
                  {isBuilding
                    ? t.normalMode.careSourcePreferenceBadge
                    : t.normalMode.careSourceEarlyBaselineBadge}
                </div>
                <h2 className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
                  {t.normalMode.careColdStartTitle}
                </h2>
                <p className="text-[11.5px] text-[#85838D] leading-snug">
                  {t.normalMode.careColdStartBody}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#292832]/[0.05] text-[11px] text-[#85838D] flex items-center justify-between gap-2">
              <span>
                {isBuilding
                  ? t.normalMode.careContextWindowBuilding
                  : t.normalMode.careContextWindowEarly}
              </span>
              <span className="font-semibold text-[#292832] shrink-0">
                {formatTemplate(t.normalMode.recordedDaysProgress, {
                  count: normalBaseline.recordedDaysCount,
                  target: normalBaseline.progressTargetDays,
                })}
              </span>
            </div>
          </section>

          {!isPaired && (
            <div className="rounded-2xl bg-[#EFEDF5]/60 px-3.5 py-2.5 text-[11.5px] text-[#5B527E] flex items-center justify-between gap-2">
              <span className="leading-snug">{t.normalMode.carePartnerNotPairedNote}</span>
              <button
                type="button"
                onClick={() => setNormalActivePage('profile')}
                className="text-[11px] font-semibold underline shrink-0 whitespace-nowrap"
              >
                {t.normalMode.invitePartnerCta}
              </button>
            </div>
          )}

          <CareForNowHeader
            t={t}
            energyShared={normalUser.sharingConsent.energy}
            recipientName={partnerDisplayName}
          />

          <AiCareEnginePanel
            idPrefix="normal"
            recipientName={partnerDisplayName}
            t={t}
            result={aiResult}
            isLoading={aiLoading}
            savedAiSuggestions={normalInteractions.savedAiSuggestions}
            learningMaturity={normalLearnedProfile.learningMaturity}
            learnedFeedbackCount={normalLearnedProfile.totalFeedbackCount}
            dismissedIds={normalCombinedDismissedIds}
            skippedIds={normalInteractions.skippedSuggestionIds ?? []}
            hiddenByReminderIds={normalUpcomingReminderRecIds}
            isPremium={normalCapabilities.isPremium}
            aiUsageCount={normalAiCareUsageCount}
            aiMonthlyLimit={normalCapabilities.aiCareMonthlyLimit}
            canGenerateAi={canGenerateNormalAi}
            onUpgrade={openNormalPremiumMembership}
            onBackToPresets={() => {
              document.getElementById('normal-preset-care-section')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }}
            onGenerate={handleGenerateAi}
            onOpenDetail={(rec, src) => openDetailForAi(rec, 'now', src)}
          />

          <section
            id="normal-preset-care-section"
            aria-label={t.care.personalizedSuggestionsTitle}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between px-0.5">
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.care.personalizedSuggestionsTitle}
              </h2>
              <span className="text-[11px] text-[#85838D]">
                {t.normalMode.careSourcePreferenceBadge}
              </span>
            </div>

            {visiblePresetSuggestions.map((suggestion) => {
              const localized = t.normalMode.careSuggestions[suggestion.id];
              if (!localized) return null;
              const isSaved = normalInteractions.savedSuggestionIds.includes(suggestion.id);
              const isNonPurchase = suggestion.category === 'message';

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => openDetailForPreset(suggestion)}
                  className="w-full text-left bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] hover:ring-1 hover:ring-[#E88C7D]/45 transition-all active:scale-[0.985] space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <SuggestionIconBadge category={suggestion.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[10.5px] font-medium text-[#706794]">
                          {isNonPurchase ? t.care.nonPurchaseTag : t.care.homeGestureTag}
                        </span>
                        {isSaved && (
                          <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                            {t.care.saved}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-[15px] font-semibold text-[#292832] leading-snug">
                        {localized.title}
                      </h3>
                      <p className="text-[12px] text-[#85838D] mt-1 leading-snug line-clamp-2">
                        {localized.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#85838D] min-w-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{localized.timing}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#C45E4E] shrink-0">
                      <span>{t.ia.care.detailOpenCta}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </section>
        </>
      )}

      {renderModals()}
    </div>
  );
}

function PresentationCareContent({ partnerId }: { partnerId: PartnerId }) {
  const {
    presentationBundle,
    careSubViews,
    setCareSubView,
    savedSuggestionIds,
    savedAiSuggestions,
    aiFeedback,
    feedbackEvents,
    recentSuggestionHistory,
    learnedProfileForPartner,
    recordRecentSuggestions,
    sharingPrefs,
    dailyCheckIns,
    partnerStatusUpdates,
    carePreferences,
    notifications,
    careMoments,
    weeklyRecharge,
    skippedSuggestionIds,
    trackSkippedSuggestion,
    datePlanInteractions,
    toggleDatePlanReaction,
    sendDatePlanInvite,
    respondDatePlanInvite,
    careStatusResponseFocus,
    clearCareStatusResponseFocus,
    saveCareSuggestion,
    saveAiCareSuggestion,
    sendCareNotification,
    sendAiCareNotification,
    setActivePage,
    membership,
    presentationAiCareUsageCount,
    incrementPresentationAiCareUsage,
    openPremiumMembership,
    surpriseCareRecords,
    createSurpriseCare,
    updateSurpriseCare,
    cancelSurpriseCare,
    unlockDemoSurpriseReveal,
    mockOrders,
    careReminders,
    dismissedRecommendationIds,
    dismissRecommendationNotNow,
    scheduleCareReminder,
    dismissCareReminder,
    createSimulatedOrderFlow,
    advanceMockOrderStatus,
    cancelMockOrder,
    t,
    language,
  } = useDualCharge();

  const currentCareSubView: CareScenarioView = careSubViews[partnerId] ?? 'now';
  const [detailByPartner, setDetailByPartner] = useState<
    Record<PartnerId, CareDetailSelection | null>
  >({
    alex: null,
    jamie: null,
  });
  const [selectedDateCat, setSelectedDateCat] = useState<DatePlanCategory | 'all'>('all');
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    kind: 'sent' | 'saved' | 'feedback';
    title: string;
    showViewLink?: boolean;
  } | null>(null);

  const [aiResultByPartner, setAiResultByPartner] = useState<
    Record<PartnerId, AiCareGenerationResult | null>
  >({
    alex: null,
    jamie: null,
  });
  const [aiLoadingByPartner, setAiLoadingByPartner] = useState<Record<PartnerId, boolean>>({
    alex: false,
    jamie: false,
  });
  const [aiSeedByPartner, setAiSeedByPartner] = useState<Record<PartnerId, number>>({
    alex: 0,
    jamie: 0,
  });
  const [dismissedByPartner, setDismissedByPartner] = useState<Record<PartnerId, string[]>>({
    alex: [],
    jamie: [],
  });
  const [freeActivityReactions, setFreeActivityReactions] = useState<
    Record<string, 'like' | 'skip' | undefined>
  >({});
  const [surpriseModalOpen, setSurpriseModalOpen] = useState(false);
  const [surpriseSourceRec, setSurpriseSourceRec] = useState<AiCareRecommendation | null>(null);
  const [editingSurprise, setEditingSurprise] = useState<SurpriseCareRecord | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryRec, setDeliveryRec] = useState<AiCareRecommendation | null>(null);
  const [activeReminderId, setActiveReminderId] = useState<string | undefined>(undefined);
  const [remindSheetOpen, setRemindSheetOpen] = useState(false);
  const [remindRec, setRemindRec] = useState<AiCareRecommendation | null>(null);
  const [reminderNowISO, setReminderNowISO] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    const hasScheduled = careReminders.some(
      (r) => r.ownerId === partnerId && r.status === 'scheduled'
    );
    if (!hasScheduled) return;
    setReminderNowISO(new Date().toISOString());
    const timer = window.setInterval(() => {
      setReminderNowISO(new Date().toISOString());
    }, 10000);
    return () => window.clearInterval(timer);
  }, [careReminders, partnerId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const suggestionTitleLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [key, item] of Object.entries(t.care.suggestions)) {
      map[key] = item.title;
    }
    return map;
  }, [t.care.suggestions]);

  const demoBaselineContext = useMemo(() => {
    if (!presentationBundle) return null;
    const recipient: PartnerId = partnerId === 'alex' ? 'jamie' : 'alex';
    const sharedRecharge =
      weeklyRecharge[recipient]?.shareWithPartner === true ? weeklyRecharge[recipient] : null;
    return buildPresentationCareContext({
      bundle: presentationBundle,
      senderId: partnerId,
      recipientId: recipient,
      language,
      sharingPrefs,
      dailyCheckInStatus: dailyCheckIns[recipient]?.status ?? null,
      partnerStatusUpdate: partnerStatusUpdates[recipient] ?? null,
      recipientCareTags: carePreferences[recipient] ?? [],
      presetTagLabels: t.profile.presetTags,
      savedSuggestionIds: savedSuggestionIds[partnerId],
      savedAiSuggestions: savedAiSuggestions[partnerId],
      notifications,
      careMoments,
      recipientWeeklyRecharge: sharedRecharge,
      skippedSuggestionIds: skippedSuggestionIds[partnerId] ?? [],
      suggestionTitleLookup,
      feedback: aiFeedback[partnerId],
      recipientFeedbackEvents: feedbackEvents[recipient] ?? [],
      recentSuggestionHistory: recentSuggestionHistory[recipient] ?? [],
    });
  }, [
    presentationBundle,
    partnerId,
    language,
    sharingPrefs,
    dailyCheckIns,
    partnerStatusUpdates,
    carePreferences,
    t.profile.presetTags,
    savedSuggestionIds,
    savedAiSuggestions,
    notifications,
    careMoments,
    weeklyRecharge,
    skippedSuggestionIds,
    suggestionTitleLookup,
    aiFeedback,
    feedbackEvents,
    recentSuggestionHistory,
  ]);

  const demoBaselinePlanAhead = useMemo(() => {
    if (!demoBaselineContext) return null;
    return generateLocalFallbackCare(demoBaselineContext, 'missing_api_key', undefined, 0).data;
  }, [demoBaselineContext]);

  if (!presentationBundle) {
    return (
      <div className="py-12 text-center text-[13px] text-[#85838D]">
        {t.welcome.loadingPresentationDemo}
      </div>
    );
  }

  const defaultRecipient: PartnerId = partnerId === 'alex' ? 'jamie' : 'alex';
  const recipientProfile = presentationBundle.partnerProfiles[defaultRecipient];
  const recipientMeta = presentationBundle.partnerMeta[defaultRecipient];
  const recipientCarePrefs = presentationBundle.partnerCarePrefs[defaultRecipient];
  const recipientAnalytics = recipientProfile.insights.analytics;
  const recipientPattern = recipientAnalytics.pattern;
  const recipientSharing = sharingPrefs[defaultRecipient];
  const highlightedForecast =
    recipientAnalytics.forecast7Days.find((d) => d.isHighlighted) ?? null;

  const recipientSharedRecharge =
    weeklyRecharge[defaultRecipient]?.shareWithPartner === true
      ? weeklyRecharge[defaultRecipient]
      : null;

  const datePlans = buildDatePlanSuggestions({
    viewerId: partnerId,
    partnerId: defaultRecipient,
    partnerEnergy: recipientProfile.latestEnergy,
    partnerSharing: recipientSharing,
    partnerAvoidLabels: recipientCarePrefs.avoid,
    partnerSharedRecharge: recipientSharedRecharge,
    selectedCategory: selectedDateCat,
  });

  const incomingDateInvites = Object.values(datePlanInteractions).filter(
    (item) =>
      !isDatePlanHiddenAsSurprise(item.planId, surpriseCareRecords, partnerId) &&
      ((item.invitee === partnerId && item.status === 'invited') ||
        ((item.invitee === partnerId || item.invitedBy === partnerId) &&
          item.status === 'accepted'))
  );

  const formatCareForecastDate = () => {
    if (!highlightedForecast) return '';
    const weekday = t.calendar.weekdaysFull[highlightedForecast.weekdayIndex];
    const month = t.calendar.monthsShort[highlightedForecast.monthIndex];
    if (language === 'en') {
      return `${weekday}, ${highlightedForecast.dayOfMonth} ${month} ${highlightedForecast.year}`;
    }
    return `${highlightedForecast.year}年${month}${highlightedForecast.dayOfMonth}日 ${weekday}`;
  };

  const predictedWindowText = !recipientSharing.energy
    ? t.care.sharingPausedWindow
    : recipientPattern.hasPattern && highlightedForecast
      ? formatTemplate(t.care.patternWindowTemplate, { date: formatCareForecastDate() })
      : t.care.steadyWindowLabel;

  const predictedReasonText = !recipientSharing.energy
    ? formatTemplate(t.care.sharingPausedReasonTemplate, {
        name: recipientMeta.display_name,
      })
    : recipientPattern.hasPattern &&
        recipientPattern.detectedWeekdayIndex !== null &&
        highlightedForecast &&
        highlightedForecast.estimatedEnergy !== null
      ? recipientSharing.sleep && recipientPattern.prevNightAvgSleepHours !== null
        ? formatTemplate(t.care.patternReasonTemplate, {
            weekday: t.calendar.weekdaysFull[recipientPattern.detectedWeekdayIndex],
            score: highlightedForecast.estimatedEnergy,
            prevSleep: recipientPattern.prevNightAvgSleepHours,
          })
        : formatTemplate(t.care.patternReasonNoSleepTemplate, {
            weekday: t.calendar.weekdaysFull[recipientPattern.detectedWeekdayIndex],
            score: highlightedForecast.estimatedEnergy,
          })
      : formatTemplate(t.care.steadyReasonTemplate, {
          overallMean: recipientAnalytics.overallMean,
          recent7: recipientAnalytics.recent7DayMean,
        });

  const mySkippedIds = skippedSuggestionIds[partnerId] ?? [];
  const myDismissedIds = dismissedRecommendationIds[partnerId] ?? [];
  const myReminders = careReminders.filter((r) => r.ownerId === partnerId);
  const { dueReminders, upcomingReminders } = evaluateDueReminders(myReminders, reminderNowISO);
  const upcomingReminderRecIds = upcomingReminders.map((r) => r.recommendation.id);
  const combinedAiDismissedIds = [
    ...new Set([...dismissedByPartner[partnerId], ...myDismissedIds]),
  ];

  const suggestions = PRESENTATION_CARE_SUGGESTIONS.filter(
    (s) =>
      s.recipient === defaultRecipient &&
      recipientCarePrefs.preferred_care.length > 0 &&
      !mySkippedIds.includes(s.id) &&
      !myDismissedIds.includes(s.id) &&
      !upcomingReminderRecIds.includes(s.id)
  );
  const mySavedIds = savedSuggestionIds[partnerId];
  const mySavedAiSuggestions = savedAiSuggestions[partnerId];
  const myFeedback = aiFeedback[partnerId];
  const recipientLearnedProfile = learnedProfileForPartner(defaultRecipient);
  const recipientStatusFocus = careStatusResponseFocus[partnerId];

  const capabilities = getMembershipCapabilities(membership, true);
  const canGeneratePresentationAi = capabilities.canGenerateAiCare(
    presentationAiCareUsageCount
  );
  const starterBasicActivities = getBasicActivitySuggestions(datePlans);
  const datePlanOptionsForModal: SurpriseDatePlanOption[] = (
    capabilities.canUsePersonalizedDatePlanning ? datePlans : starterBasicActivities
  ).map((p) => ({
    id: p.id,
    title: t.care.datePlanning.plans[p.titleKey]?.title ?? p.titleKey,
    suggestedSlot: p.suggestedSlot,
  }));
  const myPreparedSurprises = surpriseCareRecords.filter((s) => s.senderId === partnerId);
  const mySenderOrders = mockOrders.filter((o) => o.senderId === partnerId);

  const demoPresetToAiRec = (suggestion: CareSuggestion): AiCareRecommendation | null => {
    const localized = t.care.suggestions[suggestion.id];
    if (!localized) return null;
    const draftMsg = customDrafts[suggestion.id] ?? localized.defaultMessage;
    const details = [
      t.care.stage58.careForNow.observedDataTag,
      ...(recipientSharing.energy
        ? [
            formatTemplate(t.care.stage58.careForNow.todayEnergyChip, {
              score: recipientProfile.latestEnergy,
            }),
          ]
        : []),
    ];
    return presetToAiRecommendation({
      id: suggestion.id,
      title: localized.title,
      description: localized.description,
      reason: localized.reason,
      timing: localized.timing,
      defaultMessage: draftMsg,
      requiresSpendingMoney: suggestion.requiresSpendingMoney,
      evidenceSummary: localized.reason,
      evidenceDetails: details,
    });
  };

  const openDemoSurpriseFromAi = (rec: AiCareRecommendation) => {
    setEditingSurprise(null);
    setSurpriseSourceRec(rec);
    setSurpriseModalOpen(true);
  };

  const openDemoSurpriseFromFirstAvailable = () => {
    const aiRec = aiResultByPartner[partnerId]?.data.recommendations[0];
    if (aiRec) {
      openDemoSurpriseFromAi(aiRec);
      return;
    }
    const firstPreset = suggestions[0] ? demoPresetToAiRec(suggestions[0]) : null;
    if (firstPreset) {
      openDemoSurpriseFromAi(firstPreset);
    }
  };

  const openDemoOrderNow = (rec: AiCareRecommendation, reminderId?: string) => {
    setDeliveryRec(rec);
    setActiveReminderId(reminderId);
    setDeliveryModalOpen(true);
  };

  const openDemoRemindLater = (rec: AiCareRecommendation) => {
    setRemindRec(rec);
    setRemindSheetOpen(true);
  };

  const handleNotNowDemo = (rec: AiCareRecommendation) => {
    dismissRecommendationNotNow(partnerId, rec.id);
    setToast({
      kind: 'feedback',
      title: formatTemplate(t.deliveryCare.notNowToast, { title: rec.title }),
    });
  };

  const handleConfirmDemoReminder = (
    presetKey: CareReminderPresetKey,
    customISO?: string | null
  ) => {
    if (!remindRec) return;
    const remindAtISO = scheduleCareReminder(partnerId, {
      recommendation: remindRec,
      presetKey,
      customISO,
    });
    const formatted = new Date(remindAtISO).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    setToast({
      kind: 'saved',
      title: formatTemplate(t.deliveryCare.reminder.scheduledToast, { time: formatted }),
    });
  };

  const handleCompleteDemoOrderFlow = (payload: MockDeliveryOrderPayload) => {
    createSimulatedOrderFlow(partnerId, payload);
    setToast({
      kind: 'sent',
      title: formatTemplate(
        payload.revealMode === 'tell_now'
          ? t.surpriseCare.createdSentToast
          : t.surpriseCare.createdScheduledToast,
        { partner: recipientMeta.display_name }
      ),
      showViewLink: true,
    });
  };

  const handleConfirmDemoSurpriseCreate = (payload: SurpriseCareSubmitPayload) => {
    createSurpriseCare(partnerId, payload);
    setToast({
      kind: 'sent',
      title: formatTemplate(
        payload.deliveryMode === 'tell_now'
          ? t.surpriseCare.createdSentToast
          : t.surpriseCare.createdScheduledToast,
        { partner: recipientMeta.display_name }
      ),
      showViewLink: true,
    });
  };

  const handleGenerateAi = async () => {
    if (aiLoadingByPartner[partnerId] || !canGeneratePresentationAi) return;
    setAiLoadingByPartner((prev) => ({ ...prev, [partnerId]: true }));
    try {
      const seed = aiSeedByPartner[partnerId];
      const context = buildPresentationCareContext({
        bundle: presentationBundle,
        senderId: partnerId,
        recipientId: defaultRecipient,
        language,
        sharingPrefs,
        dailyCheckInStatus: dailyCheckIns[defaultRecipient]?.status ?? null,
        partnerStatusUpdate: partnerStatusUpdates[defaultRecipient] ?? null,
        recipientCareTags: carePreferences[defaultRecipient] ?? [],
        presetTagLabels: t.profile.presetTags,
        savedSuggestionIds: mySavedIds,
        savedAiSuggestions: mySavedAiSuggestions,
        notifications,
        careMoments,
        recipientWeeklyRecharge: recipientSharedRecharge,
        skippedSuggestionIds: mySkippedIds,
        suggestionTitleLookup,
        feedback: myFeedback,
        recipientFeedbackEvents: feedbackEvents[defaultRecipient] ?? [],
        recentSuggestionHistory: recentSuggestionHistory[defaultRecipient] ?? [],
      });
      const res = await requestAiCareRecommendations(context, seed);
      setAiResultByPartner((prev) => ({ ...prev, [partnerId]: res }));
      recordRecentSuggestions(defaultRecipient, res.data.recommendations);
      incrementPresentationAiCareUsage();
      setAiSeedByPartner((prev) => ({ ...prev, [partnerId]: prev[partnerId] + 1 }));
      setDismissedByPartner((prev) => ({ ...prev, [partnerId]: [] }));
    } finally {
      setAiLoadingByPartner((prev) => ({ ...prev, [partnerId]: false }));
    }
  };

  const handleSendCare = (suggestion: CareSuggestion, customMsg?: string) => {
    sendCareNotification(partnerId, suggestion, customMsg);
    setToast({
      kind: 'sent',
      title: formatTemplate(t.care.sentToastTitle, { name: recipientMeta.display_name }),
      showViewLink: true,
    });
  };

  const handleSaveSuggestion = (suggestion: CareSuggestion) => {
    const localizedTitle = t.care.suggestions[suggestion.id]?.title ?? '';
    const wasAdded = saveCareSuggestion(partnerId, suggestion);
    setToast({
      kind: 'saved',
      title: formatTemplate(wasAdded ? t.care.savedToastText : t.care.alreadySavedText, {
        title: localizedTitle,
      }),
      showViewLink: false,
    });
  };

  const handleSendAiCare = (rec: AiCareRecommendation, customMsg?: string) => {
    sendAiCareNotification(partnerId, rec, customMsg);
    setToast({
      kind: 'sent',
      title: formatTemplate(t.care.sentToastTitle, { name: recipientMeta.display_name }),
      showViewLink: true,
    });
  };

  const handleSaveAiSuggestion = (
    rec: AiCareRecommendation,
    source: 'gemini' | 'fallback'
  ) => {
    const wasAdded = saveAiCareSuggestion(partnerId, rec, source);
    setToast({
      kind: 'saved',
      title: formatTemplate(wasAdded ? t.care.savedToastText : t.care.alreadySavedText, {
        title: rec.title,
      }),
      showViewLink: false,
    });
  };

  const handleDismissAi = (rec: AiCareRecommendation) => {
    setDismissedByPartner((prev) => ({
      ...prev,
      [partnerId]: prev[partnerId].includes(rec.id)
        ? prev[partnerId]
        : [...prev[partnerId], rec.id],
    }));
    setToast({
      kind: 'feedback',
      title: formatTemplate(t.care.aiEngine.dismissToast, { title: rec.title }),
    });
  };

  const handleSkipAi = (rec: AiCareRecommendation) => {
    trackSkippedSuggestion(partnerId, rec.id);
    setToast({
      kind: 'feedback',
      title: formatTemplate(t.care.skippedToast, {
        title: rec.title,
        name: recipientMeta.display_name,
      }),
    });
  };

  const openDetailForAi = (
    rec: AiCareRecommendation,
    returnTo: 'now' | 'plan_ahead',
    sourceKind: 'gemini' | 'fallback' | 'baseline'
  ) => {
    setDetailByPartner((prev) => ({
      ...prev,
      [partnerId]: {
        recommendation: rec,
        returnTo,
        kind: 'ai',
        sourceKind,
      },
    }));
    setCareSubView(partnerId, 'detail');
  };

  const openDetailForPreset = (suggestion: CareSuggestion) => {
    const rec = demoPresetToAiRec(suggestion);
    if (!rec) return;
    setDetailByPartner((prev) => ({
      ...prev,
      [partnerId]: {
        recommendation: rec,
        returnTo: 'now',
        kind: 'preset',
        sourceKind: 'preset',
        presetId: suggestion.id,
        demoSuggestion: suggestion,
      },
    }));
    setCareSubView(partnerId, 'detail');
  };

  const activeOrdersCount = mySenderOrders.filter((o) => o.status !== 'Cancelled').length;
  const activePreparedCount = myPreparedSurprises.filter(
    (r) => r.status !== 'Cancelled' && !r.orderId
  ).length;
  const surpriseActiveTotal = activeOrdersCount + activePreparedCount;

  const toastBanner = toast && (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-30 rounded-2xl bg-[#292832]/92 backdrop-blur-[10px] text-white px-3.5 py-2.5 shadow-[0_12px_28px_-8px_rgba(41,40,50,0.35)] flex items-center justify-between gap-2 text-[12px]"
    >
      <span className="flex items-center gap-2 min-w-0">
        <Check className="w-4 h-4 text-[#8FA89B] shrink-0" strokeWidth={2.3} />
        <span className="truncate font-medium">{toast.title}</span>
      </span>
      {toast.showViewLink && (
        <button
          type="button"
          onClick={() => {
            setToast(null);
            setActivePage(partnerId, 'notifications');
          }}
          className="text-[#E88C7D] font-semibold underline shrink-0 whitespace-nowrap active:scale-95 transition-transform"
        >
          {t.care.viewNotifications}
        </button>
      )}
    </div>
  );

  const renderModals = () => (
    <>
      <SurpriseCareModal
        open={surpriseModalOpen}
        onClose={() => {
          setSurpriseModalOpen(false);
          setEditingSurprise(null);
        }}
        t={t}
        recipientName={recipientMeta.display_name}
        sourceRecommendation={surpriseSourceRec}
        editingRecord={editingSurprise}
        datePlanOptions={datePlanOptionsForModal}
        isDemoMode
        onConfirmCreate={handleConfirmDemoSurpriseCreate}
        onConfirmEdit={(id, patch) => {
          updateSurpriseCare(partnerId, id, patch);
          setToast({ kind: 'saved', title: t.surpriseCare.updatedToast });
        }}
      />

      <MockDeliveryPlatformModal
        open={deliveryModalOpen}
        recommendation={deliveryRec}
        recipientId={defaultRecipient}
        recipientName={recipientMeta.display_name}
        language={language}
        t={t}
        reminderId={activeReminderId}
        isDemoMode
        onClose={() => {
          setDeliveryModalOpen(false);
          setDeliveryRec(null);
          setActiveReminderId(undefined);
        }}
        onCompleteOrderFlow={handleCompleteDemoOrderFlow}
      />

      <RemindLaterSheet
        open={remindSheetOpen}
        recommendationTitle={remindRec?.title ?? ''}
        t={t}
        onClose={() => {
          setRemindSheetOpen(false);
          setRemindRec(null);
        }}
        onConfirm={handleConfirmDemoReminder}
      />
    </>
  );

  const detailSelection = detailByPartner[partnerId];
  if (currentCareSubView === 'detail' && detailSelection) {
    const rec = detailSelection.recommendation;
    const isSaved =
      detailSelection.kind === 'preset' && detailSelection.demoSuggestion
        ? mySavedIds.includes(detailSelection.demoSuggestion.id)
        : mySavedAiSuggestions.some(
            (item) =>
              item.id === rec.id ||
              (Boolean(item.metadata?.fingerprint && rec.fingerprint) &&
                item.metadata?.fingerprint === rec.fingerprint) ||
              item.title.toLowerCase() === rec.title.toLowerCase()
          );
    const draftKey = `${partnerId}:${rec.id}`;
    const draftMsg = customDrafts[draftKey] ?? customDrafts[rec.id] ?? rec.defaultMessage;

    return (
      <div className="space-y-4 pb-2 relative">
        {toastBanner}
        <RecommendationDetailView
          detail={detailSelection}
          idPrefix={partnerId}
          recipientName={recipientMeta.display_name}
          t={t}
          language={language}
          draftMessage={draftMsg}
          onChangeDraft={(msg) =>
            setCustomDrafts((prev) => ({ ...prev, [draftKey]: msg, [rec.id]: msg }))
          }
          isSaved={isSaved}
          onBack={() => setCareSubView(partnerId, detailSelection.returnTo)}
          onSendCare={(customMsg) => {
            if (detailSelection.kind === 'preset' && detailSelection.demoSuggestion) {
              handleSendCare(detailSelection.demoSuggestion, customMsg);
            } else {
              handleSendAiCare(rec, customMsg);
            }
          }}
          onSave={() => {
            if (detailSelection.kind === 'preset' && detailSelection.demoSuggestion) {
              handleSaveSuggestion(detailSelection.demoSuggestion);
            } else {
              handleSaveAiSuggestion(
                rec,
                detailSelection.sourceKind === 'gemini' ? 'gemini' : 'fallback'
              );
            }
          }}
          onSendAsSurprise={() => {
            const payloadRec =
              draftMsg.trim() && draftMsg.trim() !== rec.defaultMessage.trim()
                ? { ...rec, defaultMessage: draftMsg.trim() }
                : rec;
            openDemoSurpriseFromAi(payloadRec);
          }}
          onOrderNow={() => openDemoOrderNow(rec)}
          onRemindLater={() => openDemoRemindLater(rec)}
          onNotNow={() => {
            handleNotNowDemo(rec);
            setCareSubView(partnerId, detailSelection.returnTo);
          }}
          onSkip={() => {
            handleSkipAi(rec);
            setCareSubView(partnerId, detailSelection.returnTo);
          }}
          onDismissAi={
            detailSelection.kind === 'ai'
              ? () => {
                  handleDismissAi(rec);
                  setCareSubView(partnerId, detailSelection.returnTo);
                }
              : undefined
          }
          onPlanDate={() => {
            setCareSubView(partnerId, 'date_planning');
            if (rec.suggestedDatePlanId) {
              window.setTimeout(() => {
                document
                  .getElementById(`date-plan-card-${rec.suggestedDatePlanId}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 80);
            }
          }}
        />
        {renderModals()}
      </div>
    );
  }

  if (currentCareSubView === 'surprise') {
    return (
      <div className="space-y-4 pb-2 relative">
        {toastBanner}
        <SubpageHeader
          title={t.ia.care.surprisePageTitle}
          subtitle={formatTemplate(t.care.forRecipient, { name: recipientMeta.display_name })}
          backLabel={t.ia.back}
          onBack={() => setCareSubView(partnerId, 'now')}
        />

        <div className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/25 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#C45E4E]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[15px] font-semibold text-[#292832]">
                {t.ia.care.surpriseCardTitle}
              </h2>
              <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
                {t.ia.care.surpriseCardDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={suggestions.length === 0 && !aiResultByPartner[partnerId]}
            onClick={openDemoSurpriseFromFirstAvailable}
            className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] disabled:opacity-50 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_8px_18px_-6px_rgba(232,140,125,0.5)] transition-all active:scale-95"
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>{t.ia.care.surpriseCreateBtn}</span>
          </button>
        </div>

        <DueRemindersSection
          dueReminders={dueReminders}
          t={t}
          onOrderNow={(rem) => openDemoOrderNow(rem.recommendation, rem.id)}
          onReschedule={(rem) => openDemoRemindLater(rem.recommendation)}
          onDismiss={(remId) => dismissCareReminder(remId)}
        />

        <SenderOrdersTrackingSection
          orders={mySenderOrders}
          t={t}
          onAdvanceStage={(orderId, nextStatus) => {
            advanceMockOrderStatus(partnerId, orderId, nextStatus);
            setToast({
              kind: nextStatus === 'Delivered' ? 'sent' : 'feedback',
              title: formatTemplate(
                nextStatus === 'Delivered'
                  ? t.deliveryCare.tracking.deliveredSurpriseToast
                  : t.deliveryCare.tracking.stageUpdatedToast,
                { stage: t.deliveryCare.tracking.stages[nextStatus] }
              ),
              showViewLink: nextStatus === 'Delivered',
            });
          }}
          onCancelOrder={(orderId) => {
            cancelMockOrder(partnerId, orderId);
            setToast({
              kind: 'feedback',
              title: t.deliveryCare.tracking.cancelledToast,
            });
          }}
        />

        <PreparedSurprisesSection
          records={myPreparedSurprises}
          recipientName={recipientMeta.display_name}
          t={t}
          subtitle={formatTemplate(t.surpriseCare.preparedSectionSubtitle, {
            partner: recipientMeta.display_name,
          })}
          isDemoMode
          onEdit={(rec) => {
            setSurpriseSourceRec(null);
            setEditingSurprise(rec);
            setSurpriseModalOpen(true);
          }}
          onCancel={(id) => {
            cancelSurpriseCare(partnerId, id);
            setToast({ kind: 'feedback', title: t.surpriseCare.cancelledToast });
          }}
          onDemoUnlock={(id) => {
            unlockDemoSurpriseReveal(id);
            setToast({
              kind: 'sent',
              title: formatTemplate(t.surpriseCare.demoUnlockedToast, {
                partner: recipientMeta.display_name,
              }),
            });
          }}
        />

        {dueReminders.length === 0 &&
          activeOrdersCount === 0 &&
          activePreparedCount === 0 && (
            <div className="bg-white/90 rounded-[22px] p-5 text-center space-y-1.5 border border-[#E9E4DB]">
              <p className="text-[12.5px] font-semibold text-[#292832]">
                {t.surpriseCare.preparedSectionTitle} (0)
              </p>
              <p className="text-[11.5px] text-[#85838D] leading-snug">
                {formatTemplate(t.surpriseCare.preparedSectionSubtitle, {
                  partner: recipientMeta.display_name,
                })}
              </p>
            </div>
          )}

        <ExpandableAccordion
          title={t.ia.care.surprisePrivacyTitle}
          icon={<ShieldCheck className="w-4 h-4 text-[#706794]" />}
        >
          <div className="space-y-1.5">
            <p>{t.deliveryCare.recipient.maskedProgressHint}</p>
            <p>{t.deliveryCare.tracking.noAutoCompleteHint}</p>
          </div>
        </ExpandableAccordion>

        {renderModals()}
      </div>
    );
  }

  const activeScenarioTab: 'now' | 'plan_ahead' | 'date_planning' =
    currentCareSubView === 'plan_ahead' || currentCareSubView === 'date_planning'
      ? currentCareSubView
      : 'now';

  return (
    <div className="space-y-4 pb-2 relative">
      {toastBanner}

      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-[20px] font-semibold tracking-tight text-[#292832]">
            {t.care.title}
          </h1>
          <span className="text-[10.5px] text-[#85838D]">{t.meta.simulatedDemoData}</span>
        </div>
        <p className="text-[12.5px] text-[#85838D] mt-0.5">{t.ia.care.overviewSubtitle}</p>
      </div>

      {/* Scenario Tabs: Care for Now | Plan Ahead | Date Planning */}
      <div
        role="tablist"
        aria-label={t.care.title}
        className="grid grid-cols-3 gap-1 p-1 bg-[#F4EFEA] rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeScenarioTab === 'now'}
          onClick={() => setCareSubView(partnerId, 'now')}
          className={`min-h-[38px] rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 px-1.5 truncate ${
            activeScenarioTab === 'now'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {t.ia.care.scenarios.now}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeScenarioTab === 'plan_ahead'}
          onClick={() => setCareSubView(partnerId, 'plan_ahead')}
          className={`min-h-[38px] rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 px-1.5 truncate ${
            activeScenarioTab === 'plan_ahead'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {t.ia.care.scenarios.planAhead}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeScenarioTab === 'date_planning'}
          onClick={() => setCareSubView(partnerId, 'date_planning')}
          className={`min-h-[38px] rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1 px-1.5 truncate ${
            activeScenarioTab === 'date_planning'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          <Calendar className="w-3 h-3 text-[#E88C7D] shrink-0" />
          <span className="truncate">{t.ia.care.scenarios.datePlanning}</span>
        </button>
      </div>

      {/* Surprise Care Entry Card */}
      <button
        type="button"
        onClick={() => setCareSubView(partnerId, 'surprise')}
        className="w-full text-left bg-gradient-to-r from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-3.5 ring-1 ring-[#E88C7D]/30 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] hover:ring-[#E88C7D]/60 transition-all active:scale-[0.985] flex items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-[#C45E4E]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display text-[14px] font-semibold text-[#292832]">
                {t.ia.care.surpriseCardTitle}
              </span>
              {dueReminders.length > 0 && (
                <span className="rounded-lg bg-[#FBF2E6] px-2 py-0.5 text-[10px] font-semibold text-[#6E4F28] tabular-nums">
                  {formatTemplate(t.ia.care.surpriseCardBadgeDue, {
                    count: dueReminders.length,
                  })}
                </span>
              )}
              {surpriseActiveTotal > 0 && (
                <span className="rounded-lg bg-[#EFEDF5] px-2 py-0.5 text-[10px] font-semibold text-[#5B527E] tabular-nums">
                  {formatTemplate(t.ia.care.surpriseCardBadgeActive, {
                    count: surpriseActiveTotal,
                  })}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#85838D] leading-snug mt-0.5">
              {t.ia.care.surpriseCardDesc}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#85838D] shrink-0" />
      </button>

      {activeScenarioTab === 'date_planning' ? (
        capabilities.canUsePersonalizedDatePlanning ? (
          <div className="space-y-3">
            <section className="bg-white/85 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
              <h2 className="font-display text-[15px] font-semibold text-[#292832]">
                {t.care.datePlanning.headerTitle}
              </h2>
              <p className="text-[11.5px] text-[#85838D] leading-snug">
                {t.care.datePlanning.headerSubtitle}
              </p>
              <div className="rounded-xl bg-[#EFEDF5]/75 px-3 py-2 text-[11px] font-medium text-[#5B527E]">
                {!recipientSharing.energy
                  ? t.care.datePlanning.partnerPrivateEnergyBanner
                  : recipientProfile.latestEnergy < 62
                    ? formatTemplate(t.care.datePlanning.partnerEnergyBannerTemplate, {
                        partner: recipientMeta.display_name,
                        score: recipientProfile.latestEnergy,
                      })
                    : formatTemplate(t.care.datePlanning.partnerHighEnergyBannerTemplate, {
                        partner: recipientMeta.display_name,
                        score: recipientProfile.latestEnergy,
                      })}
              </div>
              <div className="rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.05] px-3 py-2 text-[10.5px] text-[#85838D]">
                {t.care.datePlanning.simulatedScheduleNotice}
              </div>
            </section>

            {/* Pending / Accepted Couple Date Invitations (Synced Across Phones) */}
            {incomingDateInvites.map((invite) => {
              const planMeta =
                datePlans.find((p) => p.id === invite.planId) ??
                buildDatePlanSuggestions({
                  viewerId: partnerId,
                  partnerId: defaultRecipient,
                  partnerEnergy: recipientProfile.latestEnergy,
                  partnerSharing: recipientSharing,
                  partnerAvoidLabels: recipientCarePrefs.avoid,
                }).find((p) => p.id === invite.planId);
              if (!planMeta) return null;
              const copy = t.care.datePlanning.plans[planMeta.titleKey];
              const senderName =
                invite.invitedBy && presentationBundle.partnerMeta[invite.invitedBy]
                  ? presentationBundle.partnerMeta[invite.invitedBy].display_name
                  : recipientMeta.display_name;

              return (
                <section
                  key={`invite-${invite.planId}`}
                  role="status"
                  className="bg-gradient-to-r from-[#F5E8E7]/75 via-white to-[#EFEDF5]/75 rounded-[22px] p-3.5 ring-1 ring-[#E88C7D]/30 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.07)] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#B45A4C]">
                      {formatTemplate(t.care.datePlanning.incomingInviteTitle, {
                        partner: senderName,
                      })}
                    </span>
                    <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                      {t.care.datePlanning.statusLabels[invite.status]}
                    </span>
                  </div>
                  <div className="text-[13px] font-semibold text-[#292832]">
                    {copy?.title ?? planMeta.titleKey}
                  </div>
                  <div className="text-[11px] text-[#85838D]">
                    {invite.alternativeTimeProposal
                      ? invite.alternativeTimeProposal.slotLabel
                      : planMeta.suggestedSlot}
                  </div>
                  {invite.alternativeTimeProposal && (
                    <div className="text-[10.5px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2.5 py-1 rounded-lg">
                      {t.ia.notifications.altTimeProposedBadge}:{' '}
                      {invite.alternativeTimeProposal.slotLabel}
                      {invite.alternativeTimeProposal.note
                        ? ` · ${invite.alternativeTimeProposal.note}`
                        : ''}
                    </div>
                  )}

                  {invite.status === 'invited' && invite.invitee === partnerId && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => respondDatePlanInvite(partnerId, invite.planId, 'accepted')}
                        className="min-h-[36px] px-3 rounded-xl bg-[#8FA89B] hover:bg-[#7B9687] text-white text-[11.5px] font-semibold active:scale-95 transition-all"
                      >
                        {t.care.datePlanning.acceptInviteBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => respondDatePlanInvite(partnerId, invite.planId, 'declined')}
                        className="min-h-[36px] px-3 rounded-xl bg-[#F4EFEA] text-[#8E4D42] text-[11.5px] font-semibold active:scale-95 transition-all"
                      >
                        {t.care.datePlanning.declineInviteBtn}
                      </button>
                    </div>
                  )}

                  {invite.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => respondDatePlanInvite(partnerId, invite.planId, 'agreed')}
                      className="w-full min-h-[36px] px-3 rounded-xl bg-[#292832] text-white text-[11.5px] font-semibold active:scale-95 transition-all"
                    >
                      {t.care.datePlanning.markAgreedBtn}
                    </button>
                  )}
                </section>
              );
            })}

            {/* 6 Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDateCat('all')}
                className={`min-h-[30px] px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                  selectedDateCat === 'all'
                    ? 'bg-[#292832] text-white'
                    : 'bg-[#F4EFEA] text-[#85838D] hover:text-[#292832]'
                }`}
              >
                {t.care.datePlanning.allCategories}
              </button>
              {DATE_PLAN_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedDateCat(cat)}
                  className={`min-h-[30px] px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    selectedDateCat === cat
                      ? 'bg-[#292832] text-white'
                      : 'bg-[#F4EFEA] text-[#85838D] hover:text-[#292832]'
                  }`}
                >
                  {t.care.datePlanning.categories[cat]}
                </button>
              ))}
            </div>

            {datePlans.map((plan) => {
              const copy = t.care.datePlanning.plans[plan.titleKey];
              const interaction = datePlanInteractions[plan.id];
              const myReaction = interaction?.reactionByPartner?.[partnerId];
              const isHiddenSurpriseInvite = isDatePlanHiddenAsSurprise(
                plan.id,
                surpriseCareRecords,
                partnerId
              );
              const inviteStatus = isHiddenSurpriseInvite ? 'none' : interaction?.status ?? 'none';

              return (
                <article
                  id={`date-plan-card-${plan.id}`}
                  key={plan.id}
                  className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                      {t.care.datePlanning.categories[plan.category]}
                    </span>
                    {inviteStatus !== 'none' ? (
                      <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                        {t.care.datePlanning.statusLabels[inviteStatus]}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#85838D]">
                        {t.care.datePlanning.energyFitLabels[plan.energyFit]} ·{' '}
                        {t.care.datePlanning.budgetLabels[plan.estimatedBudget]}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
                    {copy?.title ?? plan.titleKey}
                  </h3>
                  <p className="text-[12px] text-[#292832]/85 leading-snug">
                    {copy?.desc ?? ''}
                  </p>

                  <div className="rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.05] px-3 py-2 text-[11px] text-[#85838D] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {interaction?.alternativeTimeProposal && !isHiddenSurpriseInvite
                        ? interaction.alternativeTimeProposal.slotLabel
                        : plan.suggestedSlot}{' '}
                      · {plan.availabilityNote}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleDatePlanReaction(partnerId, plan.id, 'like')}
                      aria-pressed={myReaction === 'like'}
                      className={`min-h-[36px] px-3 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95 ${
                        myReaction === 'like'
                          ? 'bg-[#8FA89B]/22 text-[#3D5E49] ring-1 ring-[#8FA89B]/45'
                          : 'bg-[#F4EFEA] text-[#292832]'
                      }`}
                    >
                      <Heart className="w-3 h-3" />
                      <span>
                        {myReaction === 'like'
                          ? t.care.datePlanning.likedBtn
                          : t.care.datePlanning.likeBtn}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleDatePlanReaction(partnerId, plan.id, 'skip')}
                      aria-pressed={myReaction === 'skip'}
                      className={`min-h-[36px] px-3 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95 ${
                        myReaction === 'skip'
                          ? 'bg-[#F5E8E7] text-[#8E4D42]'
                          : 'bg-[#FDFBFA] text-[#85838D] border border-[#292832]/[0.06]'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span>
                        {myReaction === 'skip'
                          ? t.care.datePlanning.skippedBtn
                          : t.care.datePlanning.skipBtn}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={inviteStatus === 'invited' && interaction?.invitedBy === partnerId}
                      onClick={() => sendDatePlanInvite(partnerId, plan.id)}
                      className="flex-1 min-h-[36px] px-3 rounded-xl bg-[#E88C7D] hover:bg-[#DC7D6E] disabled:opacity-60 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-all active:scale-95"
                    >
                      <Send className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {inviteStatus === 'invited' && interaction?.invitedBy === partnerId
                          ? t.care.datePlanning.invitedBadge
                          : t.care.datePlanning.invitePartnerBtn}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <section className="bg-white/85 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
              <h2 className="font-display text-[15px] font-semibold text-[#292832]">
                {t.care.membershipLock.basicActivityTitle}
              </h2>
              <p className="text-[11.5px] text-[#85838D] leading-snug">
                {t.care.membershipLock.basicActivitySubtitle}
              </p>
            </section>

            {starterBasicActivities.map((plan) => {
              const copy = t.care.datePlanning.plans[plan.titleKey];
              const reaction = freeActivityReactions[plan.id];
              return (
                <article
                  key={plan.id}
                  className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                      {t.care.datePlanning.categories[plan.category]}
                    </span>
                    <span className="text-[10px] font-medium text-[#85838D]">
                      {t.care.datePlanning.budgetLabels[plan.estimatedBudget]}
                    </span>
                  </div>
                  <h3 className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
                    {copy?.title ?? plan.titleKey}
                  </h3>
                  <p className="text-[12px] text-[#292832]/85 leading-snug">
                    {copy?.desc ?? ''}
                  </p>
                  <div className="text-[11px] text-[#85838D] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{plan.suggestedSlot}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFreeActivityReactions((prev) => ({
                          ...prev,
                          [plan.id]: prev[plan.id] === 'like' ? undefined : 'like',
                        }))
                      }
                      className={`min-h-[36px] px-3 rounded-xl text-[11.5px] font-semibold flex items-center justify-center gap-1 transition-all ${
                        reaction === 'like'
                          ? 'bg-[#8FA89B]/22 text-[#3D5E49] ring-1 ring-[#8FA89B]/45'
                          : 'bg-[#F4EFEA] text-[#292832]'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>
                        {reaction === 'like'
                          ? t.care.datePlanning.likedBtn
                          : t.care.datePlanning.likeBtn}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFreeActivityReactions((prev) => ({
                          ...prev,
                          [plan.id]: prev[plan.id] === 'skip' ? undefined : 'skip',
                        }))
                      }
                      className={`min-h-[36px] px-3 rounded-xl text-[11.5px] font-semibold flex items-center justify-center gap-1 transition-all ${
                        reaction === 'skip'
                          ? 'bg-[#F5E8E7] text-[#8E4D42]'
                          : 'bg-[#FDFBFA] text-[#85838D] border border-[#292832]/[0.06]'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>
                        {reaction === 'skip'
                          ? t.care.datePlanning.skippedBtn
                          : t.care.datePlanning.skipBtn}
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}

            <PremiumFeaturePreview
              badgeLabel={t.care.membershipLock.datePlanLockedBadge}
              title={t.care.membershipLock.datePlanLockedTitle}
              description={t.care.membershipLock.datePlanLockedDesc}
              benefits={t.care.membershipLock.datePlanLockedBenefits}
              upgradeLabel={t.care.membershipLock.upgradeCta}
              backLabel={t.care.membershipLock.backToSuggestions}
              onUpgrade={() => openPremiumMembership(partnerId)}
              onBack={() => setCareSubView(partnerId, 'now')}
            />
          </div>
        )
      ) : activeScenarioTab === 'plan_ahead' ? (
        (() => {
          const activeAiResult = aiResultByPartner[partnerId];
          const activePlanAheadRecs =
            activeAiResult?.data.planAheadRecommendations !== undefined
              ? activeAiResult.data.planAheadRecommendations
              : demoBaselinePlanAhead?.planAheadRecommendations ?? [];
          const activePlanAheadSummary =
            activeAiResult?.data.planAheadSummary ?? demoBaselinePlanAhead?.planAheadSummary;
          const activeSourceKind: 'gemini' | 'fallback' | 'baseline' = activeAiResult
            ? activeAiResult.source
            : 'baseline';

          return (
            <PlanAheadSection
              t={t}
              language={language}
              recipientName={recipientMeta.display_name}
              energyShared={recipientSharing.energy}
              sleepShared={recipientSharing.sleep}
              canShowFutureForecast={recipientAnalytics.recordCount >= 7}
              forecastDays={recipientAnalytics.forecast7Days}
              overallMean={recipientAnalytics.overallMean}
              recent7DayMean={recipientAnalytics.recent7DayMean}
              recordedDaysCount={recipientAnalytics.recordCount}
              pattern={recipientPattern}
              recommendations={activePlanAheadRecs}
              planAheadSummary={activePlanAheadSummary}
              sourceKind={activeSourceKind}
              savedAiSuggestions={mySavedAiSuggestions}
              dismissedIds={combinedAiDismissedIds}
              hiddenByReminderIds={upcomingReminderRecIds}
              onOpenDetail={(rec, src) => openDetailForAi(rec, 'plan_ahead', src)}
            />
          );
        })()
      ) : (
        <>
          <section
            aria-label={t.care.defaultRecipient}
            className="bg-white/80 backdrop-blur-[10px] ring-1 ring-white/80 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
          >
            <div className="flex items-center gap-3">
              <img
                src={recipientProfile.avatarUrl}
                alt={recipientMeta.display_name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-[#E88C7D]/30 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#85838D]">
                  {t.care.defaultRecipient}
                </div>
                <div className="font-display text-[15.5px] font-semibold text-[#292832]">
                  {recipientMeta.display_name}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#292832]/[0.05] space-y-1 text-[11.5px]">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#85838D] shrink-0">{t.care.predictedWindowLabel}</span>
                <span className="font-medium text-[#292832] text-right">{predictedWindowText}</span>
              </div>
              <p className="text-[#292832]/85 leading-snug line-clamp-2">{predictedReasonText}</p>
            </div>
          </section>

          {recipientStatusFocus?.active && (
            <div
              role="status"
              className="rounded-2xl bg-[#FBF2E6] border border-[#E5C89E]/55 px-3.5 py-2.5 flex items-center justify-between gap-2 text-[11.5px] text-[#5E4120]"
            >
              <div className="min-w-0">
                <span className="font-semibold">
                  {formatTemplate(t.care.respondingToStatusTitle, {
                    name: recipientMeta.display_name,
                  })}
                </span>
                {recipientSharing.energy && recipientStatusFocus.checkInStatus && (
                  <span className="ml-1.5 text-[#7A5932]">
                    · {t.home.checkInOptions[recipientStatusFocus.checkInStatus].label}
                    {recipientStatusFocus.updatedAtTime
                      ? ` (${recipientStatusFocus.updatedAtTime})`
                      : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => clearCareStatusResponseFocus(partnerId)}
                aria-label={t.care.respondingToStatusClear}
                className="text-[11px] font-semibold text-[#8E4D42] hover:underline inline-flex items-center gap-0.5 shrink-0"
              >
                <X className="w-3 h-3" />
                <span>{t.care.respondingToStatusClear}</span>
              </button>
            </div>
          )}

          <CareForNowHeader
            t={t}
            energyShared={recipientSharing.energy}
            currentEnergy={recipientSharing.energy ? recipientProfile.latestEnergy : null}
            recipientName={recipientMeta.display_name}
          />

          <AiCareEnginePanel
            idPrefix={partnerId}
            recipientName={recipientMeta.display_name}
            t={t}
            result={aiResultByPartner[partnerId]}
            isLoading={aiLoadingByPartner[partnerId]}
            savedAiSuggestions={mySavedAiSuggestions}
            learningMaturity={recipientLearnedProfile.learningMaturity}
            learnedFeedbackCount={recipientLearnedProfile.totalFeedbackCount}
            dismissedIds={combinedAiDismissedIds}
            skippedIds={mySkippedIds}
            hiddenByReminderIds={upcomingReminderRecIds}
            isPremium={capabilities.isPremium}
            aiUsageCount={presentationAiCareUsageCount}
            aiMonthlyLimit={capabilities.aiCareMonthlyLimit}
            canGenerateAi={canGeneratePresentationAi}
            onUpgrade={() => openPremiumMembership(partnerId)}
            onBackToPresets={() => {
              document.getElementById(`demo-preset-care-section-${partnerId}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }}
            onGenerate={handleGenerateAi}
            onOpenDetail={(rec, src) => openDetailForAi(rec, 'now', src)}
          />

          <section
            id={`demo-preset-care-section-${partnerId}`}
            aria-label={t.care.personalizedSuggestionsTitle}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between px-0.5">
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.care.personalizedSuggestionsTitle}
              </h2>
              <span className="text-[11px] text-[#85838D]">
                {formatTemplate(t.care.forRecipient, { name: recipientMeta.display_name })}
              </span>
            </div>

            {suggestions.map((suggestion) => {
              const localized = t.care.suggestions[suggestion.id];
              const isSaved = mySavedIds.includes(suggestion.id);
              const isNonPurchase = suggestion.category === 'message';
              const presetRec = demoPresetToAiRec(suggestion);
              const isPurchase =
                suggestion.requiresSpendingMoney === true ||
                (presetRec ? isPurchaseOrientedRecommendation(presetRec) : false);

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => openDetailForPreset(suggestion)}
                  className="w-full text-left bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] hover:ring-1 hover:ring-[#E88C7D]/45 transition-all active:scale-[0.985] space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <SuggestionIconBadge category={suggestion.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                        {isPurchase ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45A4C] bg-[#F5E8E7] px-2 py-0.5 rounded-lg">
                            <ShoppingBag className="w-2.5 h-2.5" />
                            <span>{t.deliveryCare.purchaseBadge}</span>
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-medium text-[#85838D]">
                            {isNonPurchase ? t.care.nonPurchaseTag : t.care.homeGestureTag}
                          </span>
                        )}
                        {isSaved && (
                          <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                            {t.care.saved}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-[15px] font-semibold text-[#292832] leading-snug">
                        {localized.title}
                      </h3>
                      <p className="text-[12px] text-[#85838D] mt-1 leading-snug line-clamp-2">
                        {localized.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#85838D] min-w-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{localized.timing}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#C45E4E] shrink-0">
                      <span>{t.ia.care.detailOpenCta}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </section>
        </>
      )}

      {renderModals()}
    </div>
  );
}

export function CarePage({ partnerId, scope = 'demo' }: CarePageProps) {
  if (scope === 'normal') {
    return <NormalCareContent />;
  }
  return <PresentationCareContent partnerId={partnerId} />;
}
