import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Bell,
  BellOff,
  Calendar,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Crown,
  EyeOff,
  FileSignature,
  Gift,
  Heart,
  HeartHandshake,
  Inbox,
  Lock,
  Mic,
  PackageCheck,
  Pencil,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Truck,
  X,
} from 'lucide-react';
import { getProductImageSrc } from '@/src/components/care/productImageMap';
import { MembershipPlanView } from '@/src/components/membership/MembershipPlanView';
import { PremiumFeaturePreview } from '@/src/components/membership/PremiumFeaturePreview';
import { SubpageHeader } from '@/src/components/phone/SubpageHeader';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import { useDualCharge } from '@/src/context/DualChargeContext';
import { ProfilePage } from '@/src/pages/ProfilePage';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import { getAuthorizedPartnerStatusView } from '@/src/services/dailyStatusUpdateService';
import { buildDatePlanSuggestions } from '@/src/services/datePlanningService';
import {
  filterCareMomentsByMembership,
  getMembershipCapabilities,
} from '@/src/services/membershipService';
import {
  getNextMockOrderStage,
  getRecipientVisibleOrderView,
  MOCK_ORDER_STAGE_SEQUENCE,
} from '@/src/services/mockDeliveryService';
import {
  isNotificationAlertActive,
  isWithinQuietHours,
  shouldMaskSensitivePreview,
} from '@/src/services/smartNotificationService';
import {
  getRecipientVisibleSurpriseView,
  isDatePlanHiddenAsSurprise,
} from '@/src/services/surpriseCareService';
import {
  MockOrderRecord,
  MockOrderStatus,
  MockProductImageKey,
  RecipientFeedbackType,
  SurpriseCareRecord,
} from '@/src/types/aiCare';
import {
  CareNotification,
  CoupleMembershipState,
  NormalCareNotification,
  NotificationStatus,
  NotificationsCategoryView,
  PartnerId,
} from '@/src/types/dualcharge';

interface NotificationsPageProps {
  partnerId: PartnerId;
  scope?: 'demo' | 'normal';
}

type DetailTarget =
  | {
      kind: 'notification';
      notificationId: string;
      returnCategory: 'care_updates' | 'orders';
      direction: 'received' | 'sent';
    }
  | {
      kind: 'invitation';
      planId: string;
      returnCategory: 'invitations';
    };

function StatusLabel({ status, label }: { status: NotificationStatus; label: string }) {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3D5E49] shrink-0">
        <CheckCheck className="w-3.5 h-3.5 text-[#8FA89B]" strokeWidth={2.2} />
        <span>{label}</span>
      </span>
    );
  }
  if (status === 'Received') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C45E4E] shrink-0">
        <Check className="w-3.5 h-3.5 text-[#E88C7D]" strokeWidth={2.2} />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#706794] shrink-0">
      <Send className="w-3 h-3 text-[#9B93B8]" strokeWidth={2} />
      <span>{label}</span>
    </span>
  );
}

function OrderProductThumbnail({
  imageKey,
  alt,
}: {
  imageKey?: MockProductImageKey;
  alt: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const src = getProductImageSrc(imageKey);

  return (
    <div className="w-16 h-12 rounded-xl bg-[#F4EFEA] border border-[#292832]/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
      {src && !imgErr ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <ShoppingBag className="w-5 h-5 text-[#C45E4E]" strokeWidth={1.8} />
      )}
    </div>
  );
}

function DeliveryStageProgressBar({
  status,
  t,
}: {
  status: MockOrderStatus;
  t: TranslationDictionary;
}) {
  const currentIdx = MOCK_ORDER_STAGE_SEQUENCE.indexOf(
    status as Exclude<MockOrderStatus, 'Cancelled'>
  );
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[10.5px]">
        <span className="inline-flex items-center gap-1 font-semibold text-[#5B527E]">
          {status === 'Delivered' ? (
            <PackageCheck className="w-3.5 h-3.5 text-[#3D5E49]" />
          ) : (
            <Truck className="w-3.5 h-3.5 text-[#C45E4E]" />
          )}
          <span>{t.deliveryCare.recipient.deliveryProgressLabel}</span>
        </span>
        <span className="font-semibold text-[#292832]">
          {t.deliveryCare.tracking.stages[status]}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1" aria-hidden="true">
        {MOCK_ORDER_STAGE_SEQUENCE.map((stage, idx) => {
          const reached = currentIdx >= idx;
          return (
            <div
              key={stage}
              className={`h-1.5 rounded-full transition-colors ${
                status === 'Delivered' && reached
                  ? 'bg-[#8FA89B]'
                  : reached
                    ? 'bg-[#E88C7D]'
                    : 'bg-[#292832]/10'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function getDemoNextStageButtonLabel(
  nextStage: Exclude<MockOrderStatus, 'Cancelled'>,
  t: TranslationDictionary
): string {
  switch (nextStage) {
    case 'Preparing':
      return t.deliveryCare.tracking.simulateButtons.preparing;
    case 'Picked Up':
      return t.deliveryCare.tracking.simulateButtons.pickedUp;
    case 'Out for Delivery':
      return t.deliveryCare.tracking.simulateButtons.outForDelivery;
    case 'Delivered':
      return t.deliveryCare.tracking.simulateButtons.delivered;
    default:
      return t.deliveryCare.tracking.stages[nextStage];
  }
}

interface NotificationCategoryCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  description: string;
  count: number;
  highlightBadge?: string;
  onClick: () => void;
}

function NotificationCategoryCard({
  icon,
  iconBgClass,
  title,
  description,
  count,
  highlightBadge,
  onClick,
}: NotificationCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] border border-[#E9E4DB]/70 hover:border-[#E88C7D]/45 hover:bg-[#FCFBF8] transition-all active:scale-[0.985] flex items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832] leading-tight">
              {title}
            </h2>
            <span className="rounded-lg bg-[#F4EFEA] px-2 py-0.5 text-[10.5px] font-semibold text-[#292832] tabular-nums">
              {count}
            </span>
            {highlightBadge && (
              <span className="rounded-lg bg-[#F5E8E7] px-2 py-0.5 text-[10px] font-bold text-[#C45E4E] tabular-nums">
                {highlightBadge}
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-[#85838D] leading-snug">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-[#85838D] shrink-0" />
    </button>
  );
}

function isNormalOrderNotification(
  notif: NormalCareNotification,
  surprises: SurpriseCareRecord[],
  orders: MockOrderRecord[]
): { linkedSurprise?: SurpriseCareRecord; linkedOrder?: MockOrderRecord; isVisible: boolean; isOrder: boolean } {
  if (notif.kind === 'surprise_care' && notif.surpriseCareId) {
    const surprise = surprises.find((s) => s.id === notif.surpriseCareId);
    if (!surprise || surprise.status === 'Cancelled') {
      return { isVisible: false, isOrder: false };
    }
    const linkedOrder =
      notif.mockOrderId || surprise.orderId
        ? orders.find((o) => o.id === notif.mockOrderId || o.id === surprise.orderId)
        : undefined;
    if (linkedOrder) {
      if (linkedOrder.status === 'Cancelled') {
        return { linkedSurprise: surprise, linkedOrder, isVisible: false, isOrder: true };
      }
      return { linkedSurprise: surprise, linkedOrder, isVisible: true, isOrder: true };
    }
    return { linkedSurprise: surprise, isVisible: true, isOrder: false };
  }
  return { isVisible: true, isOrder: false };
}

function NormalNotificationsContent() {
  const {
    normalUser,
    normalPairing,
    normalInteractions,
    normalNotificationsSubView,
    setNormalNotificationsSubView,
    updateNormalNotificationStatus,
    cancelNormalSurpriseCare,
    completeNormalSurpriseCare,
    advanceNormalMockOrderStatus,
    cancelNormalMockOrder,
    setNormalActivePage,
    enterPresentationDemo,
    t,
  } = useDualCharge();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('sent');
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);

  const surprises = normalInteractions.surpriseCareRecords ?? [];
  const orders = normalInteractions.mockOrders ?? [];
  const sentList = normalInteractions.notifications;
  const senderName = normalUser.nickname || 'You';
  const partnerName = t.normalMode.partnerDisplayName;
  const isCoupleLinked = normalPairing.status === 'paired_simulated';
  const normalMembership: CoupleMembershipState = {
    tier: 'free',
    plan: 'monthly',
    startDateISO: null,
    purchasedBy: null,
    isSimulated: true,
  };

  const classifiedSent = sentList
    .map((notif) => ({
      notif,
      meta: isNormalOrderNotification(notif, surprises, orders),
    }))
    .filter((entry) => entry.meta.isVisible);

  const careUpdatesSent = classifiedSent.filter((e) => !e.meta.isOrder);
  const ordersSent = classifiedSent.filter((e) => e.meta.isOrder);

  // Personal Settings subpage (Normal mode)
  if (normalNotificationsSubView === 'settings') {
    return (
      <ProfilePage
        partnerId="alex"
        scope="normal"
        titleOverride={t.ia.notifications.personalSettingsSection.pageTitle}
        onBackOverride={() => setNormalNotificationsSubView('overview')}
      />
    );
  }

  // Membership & Benefits subpage (Normal mode)
  if (normalNotificationsSubView === 'membership') {
    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.membershipSection.pageTitle}
          backLabel={t.ia.back}
          onBack={() => setNormalNotificationsSubView('overview')}
        />
        <MembershipPlanView
          scope="normal"
          membership={normalMembership}
          isCoupleLinked={isCoupleLinked}
          onBack={() => setNormalNotificationsSubView('overview')}
          onLinkPartner={() => setNormalNotificationsSubView('settings')}
          onEnterDemo={enterPresentationDemo}
          memberNames={{ a: senderName, b: partnerName }}
          t={t}
        />
      </div>
    );
  }

  // Detail subpage (Normal mode)
  if (normalNotificationsSubView === 'detail' && detailTarget?.kind === 'notification') {
    const entry = classifiedSent.find((e) => e.notif.id === detailTarget.notificationId);
    if (!entry) {
      return (
        <div className="space-y-4 pb-2">
          <SubpageHeader
            title={t.ia.notifications.detailTitle}
            backLabel={t.ia.back}
            onBack={() => setNormalNotificationsSubView(detailTarget.returnCategory)}
          />
          <div className="bg-white rounded-[22px] p-5 text-center text-[12px] text-[#85838D]">
            {t.ia.notifications.emptyCategory}
          </div>
        </div>
      );
    }

    const { notif, meta } = entry;
    const { linkedSurprise, linkedOrder } = meta;

    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.detailTitle}
          subtitle={`${senderName} → ${partnerName}`}
          backLabel={t.ia.back}
          onBack={() => setNormalNotificationsSubView(detailTarget.returnCategory)}
        />

        {linkedOrder && linkedSurprise ? (
          (() => {
            const nextStage = getNextMockOrderStage(linkedOrder.status);
            return (
              <article className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/25 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-[#85838D] min-w-0">
                    <span className="font-semibold text-[#292832]">{senderName}</span>
                    {' → '}
                    <span className="font-semibold text-[#292832]">{partnerName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {notif.dateISO} · {notif.timeLabel}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0 tabular-nums">
                    #{linkedOrder.orderNumber}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <OrderProductThumbnail
                    imageKey={linkedOrder.productImageKey}
                    alt={linkedOrder.productTitle}
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-[10.5px] font-semibold text-[#706794]">
                      {linkedOrder.revealMode === 'tell_now'
                        ? t.deliveryCare.tracking.revealModeTellNow
                        : t.deliveryCare.tracking.revealModeSurprise}
                    </div>
                    <div className="text-[14px] font-semibold text-[#292832] leading-snug">
                      {linkedOrder.productTitle}
                    </div>
                    <div className="text-[11px] text-[#85838D] tabular-nums">
                      {linkedOrder.merchantName} · {linkedOrder.selectedVariant} ×
                      {linkedOrder.quantity} · {linkedOrder.currencySymbol}
                      {linkedOrder.totalAmount}
                    </div>
                  </div>
                </div>

                <DeliveryStageProgressBar status={linkedOrder.status} t={t} />

                <div className="text-[11px] text-[#85838D] flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t.deliveryCare.tracking.etaPrefix} {linkedOrder.estimatedArrivalLabel}
                  </span>
                </div>

                <p className="text-[12.5px] text-[#292832] leading-relaxed bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.05]">
                  “{linkedOrder.careMessage}”
                </p>

                {linkedOrder.status !== 'Delivered' && (
                  <div className="flex items-center gap-2 pt-0.5">
                    {linkedOrder.status === 'Order Confirmed' && (
                      <button
                        type="button"
                        onClick={() => cancelNormalMockOrder(linkedOrder.id)}
                        className="min-h-[38px] px-3 rounded-xl bg-[#F4EFEA] text-[#8E4D42] text-[11px] font-semibold active:scale-95 transition-all"
                      >
                        {t.deliveryCare.tracking.cancelOrderBtn}
                      </button>
                    )}
                    {nextStage && (
                      <button
                        type="button"
                        onClick={() => advanceNormalMockOrderStatus(linkedOrder.id, nextStage)}
                        className="flex-1 min-h-[38px] px-3 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11px] font-semibold active:scale-95 transition-all"
                      >
                        {getDemoNextStageButtonLabel(nextStage, t)}
                      </button>
                    )}
                  </div>
                )}

                {linkedOrder.status === 'Delivered' && linkedSurprise.status !== 'Completed' && (
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] text-[#85838D] leading-snug">
                      {t.deliveryCare.tracking.noAutoCompleteHint}
                    </p>
                    <button
                      type="button"
                      onClick={() => completeNormalSurpriseCare(linkedSurprise.id)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-2xl bg-[#8FA89B]/20 hover:bg-[#8FA89B]/30 text-[#3D5E49] text-[12px] font-semibold transition-all duration-200 active:scale-95"
                    >
                      {t.deliveryCare.recipient.markCompletedBtn}
                    </button>
                  </div>
                )}

                {linkedSurprise.status === 'Completed' && (
                  <div className="rounded-xl bg-[#8FA89B]/16 px-3 py-2 text-[11px] font-semibold text-[#3D5E49] flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.surpriseCare.recipient.completedBadge}</span>
                  </div>
                )}
              </article>
            );
          })()
        ) : linkedSurprise ? (
          <article className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/25 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[11px] text-[#85838D] min-w-0">
                <span className="font-semibold text-[#292832]">{senderName}</span>
                {' → '}
                <span className="font-semibold text-[#292832]">{partnerName}</span>
                <span aria-hidden="true"> · </span>
                <span>
                  {notif.dateISO} · {notif.timeLabel}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0">
                <Gift className="w-3 h-3 text-[#C45E4E]" />
                <span>{t.surpriseCare.statuses[linkedSurprise.status]}</span>
              </span>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold text-[#706794]">
                {t.surpriseCare.categories[linkedSurprise.careCategory].label} ·{' '}
                {t.surpriseCare.noteStyles[linkedSurprise.noteStyle ?? 'standard']}
              </div>
              <div className="text-[14.5px] font-semibold text-[#292832] mt-0.5">
                {linkedSurprise.title}
              </div>
              <p className="text-[12.5px] text-[#292832] leading-relaxed mt-2 bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.05]">
                “{linkedSurprise.content}”
              </p>
            </div>

            <p className="text-[10.5px] text-[#85838D] leading-snug">
              {t.surpriseCare.normalLocalSentHint}
            </p>

            {linkedSurprise.status === 'Scheduled' && (
              <button
                type="button"
                onClick={() => cancelNormalSurpriseCare(linkedSurprise.id)}
                className="w-full min-h-[38px] px-3 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#8E4D42] text-[12px] font-semibold transition-all active:scale-95"
              >
                {t.surpriseCare.cancelSurpriseBtn}
              </button>
            )}

            {(linkedSurprise.status === 'Sent' || linkedSurprise.status === 'Revealed') && (
              <button
                type="button"
                onClick={() => completeNormalSurpriseCare(linkedSurprise.id)}
                className="w-full min-h-[40px] px-3 py-2 rounded-2xl bg-[#8FA89B]/20 hover:bg-[#8FA89B]/30 text-[#3D5E49] text-[12px] font-semibold transition-all duration-200 active:scale-95"
              >
                {t.notifications.markAsCompleted}
              </button>
            )}
          </article>
        ) : (
          (() => {
            const localizedSuggestion = t.normalMode.careSuggestions[notif.suggestionId];
            const suggestionTitle = notif.suggestionTitle || localizedSuggestion?.title || '';
            const messageText =
              notif.customMessage && notif.customMessage.length > 0
                ? notif.customMessage
                : notif.suggestionDefaultMessage || localizedSuggestion?.defaultMessage || '';

            return (
              <article className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] text-[#85838D] min-w-0">
                    <span className="font-semibold text-[#292832]">{senderName}</span>
                    {' → '}
                    <span className="font-semibold text-[#292832]">{partnerName}</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {notif.dateISO} · {notif.timeLabel}
                    </span>
                  </div>
                  <StatusLabel
                    status={notif.status}
                    label={t.notifications.statuses[notif.status]}
                  />
                </div>

                <div>
                  <div className="text-[11px] font-medium text-[#706794]">
                    {t.notifications.relatedSuggestion} {suggestionTitle}
                  </div>
                  <p className="text-[13px] text-[#292832] leading-relaxed mt-2 bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
                    “{messageText}”
                  </p>
                </div>

                {notif.status !== 'Completed' && (
                  <button
                    type="button"
                    onClick={() => updateNormalNotificationStatus(notif.id, 'Completed')}
                    className="w-full min-h-[40px] px-3 py-2 rounded-2xl bg-[#8FA89B]/20 hover:bg-[#8FA89B]/30 text-[#3D5E49] text-[12px] font-semibold transition-all duration-200 active:scale-95"
                  >
                    {t.notifications.markAsCompleted}
                  </button>
                )}
              </article>
            );
          })()
        )}
      </div>
    );
  }

  // Category Subpage: Invitations (Normal mode)
  if (normalNotificationsSubView === 'invitations') {
    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.categories.invitationsTitle}
          backLabel={t.ia.back}
          onBack={() => setNormalNotificationsSubView('overview')}
        />
        <div className="bg-white/90 rounded-[22px] p-6 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFEDF5] flex items-center justify-center mx-auto text-[#706794]">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.ia.notifications.invitationsEmptyNote}
          </div>
          <p className="text-[12px] text-[#85838D] leading-relaxed max-w-[260px] mx-auto">
            {t.ia.notifications.normalInvitationsNote}
          </p>
          <button
            type="button"
            onClick={() => setNormalActivePage('care')}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-2xl bg-[#F5E8E7] hover:bg-[#EEDAD8] text-[#B45A4C] text-[12px] font-semibold transition-all active:scale-95"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{t.notifications.exploreAiCare}</span>
          </button>
        </div>
      </div>
    );
  }

  // Category Subpage: Moments (Normal mode)
  if (normalNotificationsSubView === 'moments') {
    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.categories.momentsTitle}
          backLabel={t.ia.back}
          onBack={() => setNormalNotificationsSubView('overview')}
        />
        <div className="bg-white/90 rounded-[22px] p-6 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F5E8E7] flex items-center justify-center mx-auto text-[#C45E4E]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.notifications.careMomentsEmptyTitle}
          </div>
          <p className="text-[12px] text-[#85838D] leading-relaxed max-w-[260px] mx-auto">
            {t.ia.notifications.normalMomentsNote}
          </p>
        </div>
      </div>
    );
  }

  // Category Subpages: Care Updates | Orders (Normal mode)
  if (
    normalNotificationsSubView === 'care_updates' ||
    normalNotificationsSubView === 'orders'
  ) {
    const isOrders = normalNotificationsSubView === 'orders';
    const items = activeTab === 'received' ? [] : isOrders ? ordersSent : careUpdatesSent;

    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={
            isOrders
              ? t.ia.notifications.categories.ordersTitle
              : t.ia.notifications.categories.careUpdatesTitle
          }
          backLabel={t.ia.back}
          onBack={() => setNormalNotificationsSubView('overview')}
        />

        <div
          role="tablist"
          aria-label={t.notifications.title}
          className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'received'}
            onClick={() => setActiveTab('received')}
            className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
              activeTab === 'received'
                ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
                : 'text-[#85838D] hover:text-[#292832]'
            }`}
          >
            <span>{t.notifications.receivedTab}</span>
            <span className="text-[11px] text-[#85838D] tabular-nums">(0)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sent'}
            onClick={() => setActiveTab('sent')}
            className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
              activeTab === 'sent'
                ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
                : 'text-[#85838D] hover:text-[#292832]'
            }`}
          >
            <span>{t.notifications.sentTab}</span>
            <span className="text-[11px] text-[#85838D] tabular-nums">
              ({isOrders ? ordersSent.length : careUpdatesSent.length})
            </span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-[10px] rounded-[22px] p-6 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F4EFEA] flex items-center justify-center mx-auto text-[#85838D]">
              <Inbox className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="font-display text-[14.5px] font-semibold text-[#292832]">
              {activeTab === 'received'
                ? t.notifications.emptyReceivedTitle
                : t.notifications.emptySentTitle}
            </div>
            <p className="text-[12px] text-[#85838D] leading-relaxed max-w-[240px] mx-auto">
              {activeTab === 'received'
                ? t.notifications.emptyReceivedBody
                : t.notifications.emptySentBody}
            </p>
            <button
              type="button"
              onClick={() => setNormalActivePage('care')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-2xl bg-[#F5E8E7] hover:bg-[#EEDAD8] text-[#B45A4C] text-[12px] font-semibold transition-all duration-200 active:scale-95"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>{t.notifications.exploreAiCare}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] text-[#85838D] px-0.5">
              {t.normalMode.notificationsOutgoingOnlyNote}
            </p>
            {items.map(({ notif, meta }) => {
              const title = meta.linkedOrder
                ? meta.linkedOrder.productTitle
                : meta.linkedSurprise
                  ? meta.linkedSurprise.title
                  : notif.suggestionTitle ||
                    t.normalMode.careSuggestions[notif.suggestionId]?.title ||
                    '';
              const badge = meta.linkedOrder
                ? t.deliveryCare.tracking.stages[meta.linkedOrder.status]
                : meta.linkedSurprise
                  ? t.surpriseCare.statuses[meta.linkedSurprise.status]
                  : t.notifications.statuses[notif.status];

              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    setDetailTarget({
                      kind: 'notification',
                      notificationId: notif.id,
                      returnCategory: isOrders ? 'orders' : 'care_updates',
                      direction: 'sent',
                    });
                    setNormalNotificationsSubView('detail');
                  }}
                  className="w-full text-left bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] hover:ring-1 hover:ring-[#E88C7D]/45 transition-all active:scale-[0.985] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px] text-[#85838D] min-w-0">
                      <span className="font-semibold text-[#292832]">{senderName}</span>
                      {' → '}
                      <span className="font-semibold text-[#292832]">{partnerName}</span>
                      {' · '}
                      <span>{notif.timeLabel}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0">
                      {badge}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[14px] font-semibold text-[#292832] truncate">
                      {title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#85838D] shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Categorized Overview (Normal mode)
  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-[20px] font-semibold tracking-tight text-[#292832]">
            {t.ia.notifications.overviewTitle}
          </h1>
          <p className="text-[12.5px] text-[#85838D] mt-0.5">
            {t.ia.notifications.overviewSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNormalNotificationsSubView('settings')}
          className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white border border-[#E9E4DB] text-[11px] font-semibold text-[#292832] inline-flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#706794]" />
          <span>{t.ia.notifications.settingsShortcut}</span>
        </button>
      </div>

      <section aria-label={t.ia.notifications.membershipSection.title}>
        <button
          type="button"
          onClick={() => setNormalNotificationsSubView('membership')}
          className="w-full text-left rounded-[22px] bg-gradient-to-br from-white via-[#FDFBFA] to-[#EFEDF5]/75 p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] ring-1 ring-[#9B93B8]/25 hover:bg-white transition-all active:scale-[0.99] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#EFEDF5] flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-[#706794]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-[#706794] truncate">
                  {t.ia.notifications.membershipSection.title}
                </div>
                <div className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
                  {t.profile.membershipUpgrade.freeStatusTitle}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0">
              {t.profile.oneCouplePlanBadge}
            </span>
          </div>
          <p className="text-[11.5px] text-[#85838D] leading-snug">
            {t.profile.membershipUpgrade.freeStatusDesc}
          </p>
          <div className="flex items-center justify-between pt-0.5 text-[11.5px] font-semibold text-[#5B527E]">
            <span>{t.ia.notifications.membershipSection.openCta}</span>
            <ChevronRight className="w-4 h-4 text-[#706794] shrink-0" />
          </div>
        </button>
      </section>

      <div className="space-y-3">
        <NotificationCategoryCard
          icon={<Calendar className="w-5 h-5 text-[#5B527E]" />}
          iconBgClass="bg-[#EFEDF5]"
          title={t.ia.notifications.categories.invitationsTitle}
          description={t.ia.notifications.categories.invitationsDesc}
          count={0}
          onClick={() => setNormalNotificationsSubView('invitations')}
        />
        <NotificationCategoryCard
          icon={<HeartHandshake className="w-5 h-5 text-[#C45E4E]" />}
          iconBgClass="bg-[#F5E8E7]"
          title={t.ia.notifications.categories.careUpdatesTitle}
          description={t.ia.notifications.categories.careUpdatesDesc}
          count={careUpdatesSent.length}
          onClick={() => {
            setActiveTab('sent');
            setNormalNotificationsSubView('care_updates');
          }}
        />
        <NotificationCategoryCard
          icon={<Truck className="w-5 h-5 text-[#B87B3A]" />}
          iconBgClass="bg-[#FBF2E6]"
          title={t.ia.notifications.categories.ordersTitle}
          description={t.ia.notifications.categories.ordersDesc}
          count={ordersSent.length}
          onClick={() => {
            setActiveTab('sent');
            setNormalNotificationsSubView('orders');
          }}
        />
        <NotificationCategoryCard
          icon={<Heart className="w-5 h-5 text-[#3D5E49]" />}
          iconBgClass="bg-[#8FA89B]/20"
          title={t.ia.notifications.categories.momentsTitle}
          description={t.ia.notifications.categories.momentsDesc}
          count={0}
          onClick={() => setNormalNotificationsSubView('moments')}
        />
      </div>

      <section aria-label={t.ia.notifications.personalSettingsSection.title}>
        <button
          type="button"
          onClick={() => setNormalNotificationsSubView('settings')}
          className="w-full text-left rounded-[22px] bg-white/95 hover:bg-white p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] border border-[#292832]/[0.05] transition-all active:scale-[0.99] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar
                avatarId={normalUser.avatarId}
                name={senderName}
                sizeClass="w-9 h-9"
                textSizeClass="text-[13px]"
              />
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-[#706794] truncate">
                  {t.ia.notifications.personalSettingsSection.title}
                </div>
                <div className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug truncate">
                  {senderName}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                isCoupleLinked
                  ? 'text-[#3D5E49] bg-[#8FA89B]/20'
                  : 'text-[#85838D] bg-[#F4EFEA]'
              }`}
            >
              {isCoupleLinked
                ? t.ia.notifications.personalSettingsSection.pairedBadge
                : t.ia.notifications.personalSettingsSection.unpairedBadge}
            </span>
          </div>
          <p className="text-[11.5px] text-[#85838D] leading-snug">
            {t.ia.notifications.personalSettingsSection.subtitle}
          </p>
          <div className="flex items-center justify-between pt-0.5 text-[11.5px] font-semibold text-[#5B527E]">
            <span>{t.ia.notifications.personalSettingsSection.openCta}</span>
            <ChevronRight className="w-4 h-4 text-[#706794] shrink-0" />
          </div>
        </button>
      </section>
    </div>
  );
}

function PresentationNotificationsContent({ partnerId }: { partnerId: PartnerId }) {
  const {
    presentationBundle,
    notificationsSubViews,
    setNotificationsSubView,
    notifications,
    sharingPrefs,
    notificationPrefs,
    careMoments,
    updateCareMomentNote,
    toggleCareMomentVisibility,
    updateNotificationStatus,
    recordRecipientNotificationFeedback,
    respondWithCareFromStatus,
    setActivePage,
    membership,
    upgradeDemoPremium,
    widgetPreviewStyle,
    setWidgetPreviewStyle,
    openPremiumMembership,
    surpriseCareRecords,
    revealSurpriseCare,
    completeSurpriseCare,
    cancelSurpriseCare,
    unlockDemoSurpriseReveal,
    mockOrders,
    advanceMockOrderStatus,
    cancelMockOrder,
    datePlanInteractions,
    respondDatePlanInvite,
    proposeDatePlanAlternativeTime,
    t,
  } = useDualCharge();

  const shouldReduceMotion = useReducedMotion();
  const currentSubView: NotificationsCategoryView =
    notificationsSubViews[partnerId] ?? 'overview';

  const [detailByPartner, setDetailByPartner] = useState<
    Record<PartnerId, DetailTarget | null>
  >({
    alex: null,
    jamie: null,
  });
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null);
  const [momentDrafts, setMomentDrafts] = useState<Record<string, string>>({});
  const [nowISO, setNowISO] = useState<string>(() => new Date().toISOString());
  const [justRevealedIds, setJustRevealedIds] = useState<Record<string, boolean>>({});
  const [altProposalOpenForPlan, setAltProposalOpenForPlan] = useState<string | null>(null);
  const [altSlotDraft, setAltSlotDraft] = useState<string>('');
  const [altNoteDraft, setAltNoteDraft] = useState<string>('');

  const hasScheduledSurprise = surpriseCareRecords.some(
    (s) => s.status === 'Scheduled' && s.deliveryMode === 'keep_surprise' && !s.orderId
  );

  useEffect(() => {
    setNowISO(new Date().toISOString());
    if (!hasScheduledSurprise) return;
    const timer = window.setInterval(() => {
      setNowISO(new Date().toISOString());
    }, 2000);
    return () => window.clearInterval(timer);
  }, [hasScheduledSurprise, activeTab, currentSubView]);

  if (!presentationBundle) {
    return (
      <div className="py-12 text-center text-[13px] text-[#85838D]">
        {t.welcome.loadingPresentationDemo}
      </div>
    );
  }

  const myNotifPrefs = notificationPrefs[partnerId];
  const quietHoursActive = isWithinQuietHours(myNotifPrefs);
  const maskSensitive = shouldMaskSensitivePreview(myNotifPrefs);
  const otherPartner: PartnerId = partnerId === 'alex' ? 'jamie' : 'alex';

  const classifyDemoNotification = (
    notif: CareNotification,
    direction: 'received' | 'sent'
  ): {
    visible: boolean;
    category: 'care_updates' | 'orders';
    surprise?: SurpriseCareRecord;
    linkedOrder?: MockOrderRecord;
  } => {
    if (notif.kind === 'surprise_care' && notif.surpriseCareId) {
      const surprise = surpriseCareRecords.find((s) => s.id === notif.surpriseCareId);
      if (!surprise || surprise.status === 'Cancelled' || surprise.status === 'Draft') {
        return { visible: false, category: 'care_updates' };
      }
      const linkedOrder =
        notif.mockOrderId || surprise.orderId
          ? mockOrders.find(
              (o) => o.id === notif.mockOrderId || o.id === surprise.orderId
            )
          : undefined;
      if (linkedOrder) {
        if (direction === 'received') {
          const orderView = getRecipientVisibleOrderView(linkedOrder, surprise);
          return {
            visible: orderView.visible,
            category: 'orders',
            surprise,
            linkedOrder,
          };
        }
        return {
          visible: linkedOrder.status !== 'Cancelled',
          category: 'orders',
          surprise,
          linkedOrder,
        };
      }
      if (direction === 'received') {
        const view = getRecipientVisibleSurpriseView(surprise, nowISO);
        return {
          visible: view.visible,
          category: 'care_updates',
          surprise,
        };
      }
      return { visible: true, category: 'care_updates', surprise };
    }

    return { visible: true, category: 'care_updates' };
  };

  const receivedAll = notifications.filter((n) => n.recipient === partnerId);
  const sentAll = notifications.filter((n) => n.sender === partnerId);

  const receivedCareUpdates = receivedAll.filter((n) => {
    const c = classifyDemoNotification(n, 'received');
    return c.visible && c.category === 'care_updates';
  });
  const sentCareUpdates = sentAll.filter((n) => {
    const c = classifyDemoNotification(n, 'sent');
    return c.visible && c.category === 'care_updates';
  });
  const unreadCareUpdates = receivedCareUpdates.filter((n) =>
    isNotificationAlertActive(n, myNotifPrefs)
  ).length;

  const receivedOrders = receivedAll.filter((n) => {
    const c = classifyDemoNotification(n, 'received');
    return c.visible && c.category === 'orders';
  });
  const sentOrders = sentAll.filter((n) => {
    const c = classifyDemoNotification(n, 'sent');
    return c.visible && c.category === 'orders';
  });
  const unreadOrders = receivedOrders.filter((n) =>
    isNotificationAlertActive(n, myNotifPrefs)
  ).length;

  // Date Invitations
  const allDatePlanSuggestions = buildDatePlanSuggestions({
    viewerId: partnerId,
    partnerId: otherPartner,
    partnerEnergy:
      presentationBundle.latestRecords[otherPartner].estimated_energy_index_0_to_100,
    partnerSharing: sharingPrefs[otherPartner],
    partnerAvoidLabels: presentationBundle.partnerCarePrefs[otherPartner].avoid,
    selectedCategory: 'all',
  });

  const visibleInvitations = Object.values(datePlanInteractions)
    .filter(
      (item) =>
        item.status !== 'none' &&
        !isDatePlanHiddenAsSurprise(item.planId, surpriseCareRecords, partnerId)
    )
    .sort((a, b) => {
      const aPending =
        (a.status === 'invited' && a.invitee === partnerId) || a.status === 'accepted' ? 0 : 1;
      const bPending =
        (b.status === 'invited' && b.invitee === partnerId) || b.status === 'accepted' ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return b.updatedAtISO.localeCompare(a.updatedAtISO);
    });

  const pendingInvitationsCount = visibleInvitations.filter(
    (item) =>
      (item.invitee === partnerId && item.status === 'invited') || item.status === 'accepted'
  ).length;

  // Care Moments
  const visibleCareMoments = careMoments.filter(
    (m) => m.sharedVisibility || m.sender === partnerId || m.recipient === partnerId
  );
  const capabilities = getMembershipCapabilities(membership, true);
  const { visibleMoments: windowCareMoments, lockedOlderCount } =
    filterCareMomentsByMembership(
      visibleCareMoments,
      membership,
      presentationBundle.dateRange.end
    );

  const feedbackOptions: Array<{
    type: RecipientFeedbackType;
    label: string;
    icon: 'up' | 'down';
    isNegative: boolean;
  }> = [
    { type: 'helpful', label: t.notifications.feedbackHelpful, icon: 'up', isNegative: false },
    {
      type: 'not_helpful',
      label: t.notifications.feedbackNotHelpful,
      icon: 'down',
      isNegative: true,
    },
    {
      type: 'not_suitable',
      label: t.notifications.feedbackNotSuitable,
      icon: 'down',
      isNegative: true,
    },
  ];

  const getFeedbackLabel = (type: RecipientFeedbackType): string => {
    switch (type) {
      case 'helpful':
        return t.notifications.feedbackHelpful;
      case 'more_like_this':
        return t.notifications.feedbackMoreLikeThis;
      case 'not_relevant':
        return t.notifications.feedbackNotRelevant;
      case 'not_helpful':
        return t.notifications.feedbackNotHelpful;
      case 'not_suitable':
        return t.notifications.feedbackNotSuitable;
    }
  };

  const altPresetOptions = [
    t.ia.notifications.altTimePresets.tonight8,
    t.ia.notifications.altTimePresets.tomorrow7,
    t.ia.notifications.altTimePresets.weekendAfternoon,
    t.ia.notifications.altTimePresets.sundayMorning,
  ];

  const renderInvitationDetail = (planId: string) => {
    const invite = datePlanInteractions[planId];
    const planMeta = allDatePlanSuggestions.find((p) => p.id === planId);
    if (!invite || !planMeta || isDatePlanHiddenAsSurprise(planId, surpriseCareRecords, partnerId)) {
      return (
        <div className="bg-white rounded-[22px] p-5 text-center text-[12px] text-[#85838D]">
          {t.ia.notifications.emptyCategory}
        </div>
      );
    }

    const copy = t.care.datePlanning.plans[planMeta.titleKey];
    const senderName =
      invite.invitedBy && presentationBundle.partnerMeta[invite.invitedBy]
        ? presentationBundle.partnerMeta[invite.invitedBy].display_name
        : presentationBundle.partnerMeta[otherPartner].display_name;
    const isAltOpen = altProposalOpenForPlan === planId;
    const effectiveSlot = invite.alternativeTimeProposal?.slotLabel ?? planMeta.suggestedSlot;

    return (
      <div className="space-y-3">
        <article className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/30 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10.5px] font-bold text-[#B45A4C]">
                {formatTemplate(t.care.datePlanning.incomingInviteTitle, {
                  partner: senderName,
                })}
              </span>
              <h2 className="font-display text-[17px] font-semibold text-[#292832] leading-snug mt-1">
                {copy?.title ?? planMeta.titleKey}
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2.5 py-0.5 rounded-lg shrink-0">
              {t.care.datePlanning.statusLabels[invite.status]}
            </span>
          </div>

          <p className="text-[12.5px] text-[#292832]/85 leading-relaxed">{copy?.desc ?? ''}</p>

          <div className="rounded-2xl bg-white/90 border border-[#292832]/[0.06] p-3 space-y-1.5 text-[11.5px]">
            <div className="flex items-center gap-1.5 text-[#292832] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#85838D] shrink-0" />
              <span>{effectiveSlot}</span>
            </div>
            <div className="text-[#85838D]">
              {t.care.datePlanning.categories[planMeta.category]} ·{' '}
              {t.care.datePlanning.budgetLabels[planMeta.estimatedBudget]} ·{' '}
              {planMeta.availabilityNote}
            </div>
          </div>

          {invite.alternativeTimeProposal && (
            <div className="rounded-2xl bg-[#EFEDF5] border border-[#9B93B8]/30 p-3 space-y-1 text-[11.5px]">
              <div className="font-semibold text-[#5B527E] flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {t.ia.notifications.altTimeProposedBadge} (
                  {presentationBundle.partnerProfiles[invite.alternativeTimeProposal.proposedBy].name}
                  )
                </span>
              </div>
              <div className="font-semibold text-[#292832]">
                {invite.alternativeTimeProposal.slotLabel}
              </div>
              {invite.alternativeTimeProposal.note && (
                <p className="text-[#5B527E]/90 italic">
                  “{invite.alternativeTimeProposal.note}”
                </p>
              )}
            </div>
          )}

          {invite.status === 'invited' && invite.invitee === partnerId && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => respondDatePlanInvite(partnerId, invite.planId, 'accepted')}
                  className="min-h-[42px] px-3 rounded-2xl bg-[#8FA89B] hover:bg-[#7B9687] text-white text-[12px] font-semibold active:scale-95 transition-all"
                >
                  {t.care.datePlanning.acceptInviteBtn}
                </button>
                <button
                  type="button"
                  onClick={() => respondDatePlanInvite(partnerId, invite.planId, 'declined')}
                  className="min-h-[42px] px-3 rounded-2xl bg-[#F4EFEA] text-[#8E4D42] text-[12px] font-semibold active:scale-95 transition-all"
                >
                  {t.care.datePlanning.declineInviteBtn}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAltProposalOpenForPlan(isAltOpen ? null : planId);
                  setAltSlotDraft(altSlotDraft || altPresetOptions[0]);
                }}
                className="w-full min-h-[40px] px-3 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span>{t.ia.notifications.proposeAltTimeBtn}</span>
              </button>
            </div>
          )}

          {invite.status === 'accepted' && (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => respondDatePlanInvite(partnerId, invite.planId, 'agreed')}
                className="w-full min-h-[42px] px-3 rounded-2xl bg-[#292832] text-white text-[12px] font-semibold active:scale-95 transition-all"
              >
                {t.care.datePlanning.markAgreedBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAltProposalOpenForPlan(isAltOpen ? null : planId);
                  setAltSlotDraft(altSlotDraft || altPresetOptions[0]);
                }}
                className="w-full min-h-[38px] px-3 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11.5px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                <span>{t.ia.notifications.proposeAltTimeBtn}</span>
              </button>
            </div>
          )}

          {isAltOpen && (
            <div className="rounded-2xl bg-white border border-[#9B93B8]/30 p-3.5 space-y-2.5">
              <div className="text-[12px] font-semibold text-[#292832]">
                {t.ia.notifications.proposeAltTimeTitle}
              </div>
              <div className="text-[10.5px] font-medium text-[#85838D]">
                {t.ia.notifications.altTimeSlotLabel}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {altPresetOptions.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAltSlotDraft(preset)}
                    className={`min-h-[34px] px-2 py-1 rounded-xl text-[11px] font-semibold text-center transition-all ${
                      altSlotDraft === preset
                        ? 'bg-[#292832] text-white'
                        : 'bg-[#F4EFEA] text-[#292832] hover:bg-[#EAE3DC]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={altSlotDraft}
                onChange={(e) => setAltSlotDraft(e.target.value)}
                placeholder={t.ia.notifications.altTimeCustomPlaceholder}
                className="w-full rounded-xl bg-[#FDFBFA] border border-[#292832]/12 px-3 py-2 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
              />
              <input
                type="text"
                value={altNoteDraft}
                onChange={(e) => setAltNoteDraft(e.target.value)}
                placeholder={t.ia.notifications.altTimeNotePlaceholder}
                className="w-full rounded-xl bg-[#FDFBFA] border border-[#292832]/12 px-3 py-2 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAltProposalOpenForPlan(null)}
                  className="min-h-[34px] px-3 rounded-xl bg-[#F4EFEA] text-[11px] font-semibold text-[#292832]"
                >
                  {t.meta.cancel}
                </button>
                <button
                  type="button"
                  disabled={!altSlotDraft.trim()}
                  onClick={() => {
                    if (!altSlotDraft.trim()) return;
                    proposeDatePlanAlternativeTime(
                      partnerId,
                      invite.planId,
                      altSlotDraft.trim(),
                      altNoteDraft.trim() || undefined
                    );
                    setAltProposalOpenForPlan(null);
                    setAltNoteDraft('');
                  }}
                  className="min-h-[34px] px-3.5 rounded-xl bg-[#E88C7D] hover:bg-[#DC7D6E] disabled:opacity-50 text-white text-[11px] font-semibold"
                >
                  {t.ia.notifications.altTimeSubmitBtn}
                </button>
              </div>
            </div>
          )}
        </article>
      </div>
    );
  };

  const renderFullDemoNotificationCard = (
    notif: CareNotification,
    direction: 'received' | 'sent'
  ) => {
    const senderName = presentationBundle.partnerProfiles[notif.sender].name;
    const recipientName = presentationBundle.partnerProfiles[notif.recipient].name;
    const timePrefix = notif.isToday
      ? t.notifications.todayPrefix
      : t.notifications.yesterdayPrefix;
    const isMaskedReceived = direction === 'received' && maskSensitive;

    if (notif.kind === 'surprise_care' && notif.surpriseCareId) {
      const surprise = surpriseCareRecords.find((s) => s.id === notif.surpriseCareId);
      if (!surprise || surprise.status === 'Cancelled' || surprise.status === 'Draft') {
        return null;
      }

      const linkedOrder =
        notif.mockOrderId || surprise.orderId
          ? mockOrders.find(
              (o) => o.id === notif.mockOrderId || o.id === surprise.orderId
            )
          : undefined;

      const formattedRevealAt = surprise.revealAt
        ? new Date(surprise.revealAt).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '';

      if (direction === 'received') {
        if (linkedOrder) {
          const orderView = getRecipientVisibleOrderView(linkedOrder, surprise);
          if (!orderView.visible) return null;

          if (orderView.isMasked) {
            return (
              <article
                key={notif.id}
                className="bg-gradient-to-br from-[#F4F1F9] via-white to-[#FBF7F5] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/35 shadow-[0_12px_30px_-10px_rgba(91,82,126,0.14)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2.5 py-1 rounded-xl">
                    <Gift className="w-3.5 h-3.5 text-[#C45E4E]" />
                    <span>{t.deliveryCare.recipient.maskedTitle}</span>
                  </div>
                  <span className="text-[10.5px] text-[#85838D]">
                    {timePrefix} · {notif.timeLabel}
                  </span>
                </div>

                {notif.suppressedByQuietHours && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                    <BellOff className="w-3 h-3" />
                    <span>{t.notifications.suppressedQuietLabel}</span>
                  </div>
                )}

                <div className="rounded-2xl bg-white/90 border border-[#9B93B8]/20 p-3.5 space-y-1.5">
                  <p className="text-[13.5px] font-semibold text-[#292832] leading-snug">
                    {t.deliveryCare.recipient.maskedBody}
                  </p>
                  <p className="text-[11.5px] text-[#706794] leading-snug flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.deliveryCare.recipient.maskedProgressHint}</span>
                  </p>
                </div>
              </article>
            );
          }

          const deliveryFeedbackOptions: Array<{
            type: RecipientFeedbackType;
            label: string;
            isNegative: boolean;
          }> = [
            {
              type: 'more_like_this',
              label: t.deliveryCare.recipient.feedbackLovedIt,
              isNegative: false,
            },
            {
              type: 'helpful',
              label: t.deliveryCare.recipient.feedbackThankYou,
              isNegative: false,
            },
            {
              type: 'not_suitable',
              label: t.deliveryCare.recipient.feedbackNotPreference,
              isNegative: true,
            },
          ];

          return (
            <motion.article
              key={notif.id}
              initial={
                orderView.isDelivered && !shouldReduceMotion
                  ? { opacity: 0.5, scale: 0.97, y: 6 }
                  : false
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-gradient-to-br from-[#FBF5F3] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/35 shadow-[0_12px_32px_-10px_rgba(232,140,125,0.22)] space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#B45A4C]">
                    <Gift className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {orderView.isDelivered
                        ? t.deliveryCare.recipient.deliveredSurpriseBanner
                        : formatTemplate(t.surpriseCare.recipient.tellNowCardTitle, {
                            sender: senderName,
                          })}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#85838D] mt-0.5">
                    {timePrefix} · {notif.timeLabel}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                    surprise.status === 'Completed'
                      ? 'bg-[#8FA89B]/20 text-[#3D5E49]'
                      : 'bg-[#EFEDF5] text-[#5B527E]'
                  }`}
                >
                  {surprise.status === 'Completed'
                    ? t.surpriseCare.statuses.Completed
                    : orderView.status
                      ? t.deliveryCare.tracking.stages[orderView.status]
                      : t.surpriseCare.statuses[surprise.status]}
                </span>
              </div>

              {notif.suppressedByQuietHours && (
                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                  <BellOff className="w-3 h-3" />
                  <span>{t.notifications.suppressedQuietLabel}</span>
                </div>
              )}

              {isMaskedReceived ? (
                <div className="rounded-2xl bg-white/90 border border-[#292832]/[0.05] p-3 space-y-1">
                  <div className="text-[13px] font-semibold text-[#292832]">
                    {t.notifications.neutralPreviewCareTitle}
                  </div>
                  <p className="text-[12.5px] text-[#292832]">
                    {t.notifications.neutralPreviewCareBody}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <OrderProductThumbnail
                      imageKey={orderView.productImageKey}
                      alt={orderView.productTitle ?? t.deliveryCare.recipient.revealedTitle}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-[10.5px] font-semibold text-[#706794]">
                        {t.deliveryCare.recipient.orderDetailsLabel}
                      </div>
                      <h3 className="font-display text-[15px] font-semibold text-[#292832] leading-snug">
                        {orderView.productTitle}
                      </h3>
                      <p className="text-[11.5px] text-[#85838D] leading-snug">
                        {orderView.merchantName} · {orderView.selectedVariant} (×
                        {orderView.quantity})
                      </p>
                    </div>
                  </div>

                  {orderView.status && (
                    <DeliveryStageProgressBar status={orderView.status} t={t} />
                  )}

                  {!orderView.isDelivered && orderView.estimatedArrivalLabel && (
                    <div className="text-[11px] text-[#85838D] flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {t.deliveryCare.tracking.etaPrefix} {orderView.estimatedArrivalLabel}
                      </span>
                    </div>
                  )}

                  {orderView.careMessage && (
                    <p className="text-[13px] text-[#292832] leading-relaxed bg-white/90 rounded-2xl p-3 border border-[#292832]/[0.05]">
                      “{orderView.careMessage}”
                    </p>
                  )}
                </>
              )}

              {surprise.status !== 'Completed' ? (
                <div className="space-y-1.5">
                  {orderView.isDelivered && (
                    <p className="text-[10.5px] text-[#85838D] leading-snug">
                      {t.deliveryCare.tracking.noAutoCompleteHint}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => completeSurpriseCare(partnerId, surprise.id)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-2xl bg-[#8FA89B]/22 hover:bg-[#8FA89B]/32 text-[#3D5E49] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4 shrink-0" />
                    <span>{t.deliveryCare.recipient.markCompletedBtn}</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-xl bg-[#8FA89B]/16 px-3 py-2 text-[11px] font-semibold text-[#3D5E49] flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.surpriseCare.recipient.completedBadge}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#292832]/[0.06] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-[#706794]">
                    {t.deliveryCare.recipient.feedbackPrompt}
                  </span>
                  {notif.feedbackSubmitted && (
                    <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                      {formatTemplate(t.notifications.feedbackSelectedBadge, {
                        type: getFeedbackLabel(notif.feedbackSubmitted),
                      })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {deliveryFeedbackOptions.map((opt) => {
                    const isSelected = notif.feedbackSubmitted === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          recordRecipientNotificationFeedback(notif.id, partnerId, opt.type)
                        }
                        className={`min-h-[38px] px-1.5 py-1.5 rounded-xl text-[10.5px] font-semibold flex items-center justify-center text-center leading-tight transition-all active:scale-95 ${
                          isSelected
                            ? opt.isNegative
                              ? 'bg-[#F5E8E7] text-[#8E4D42] ring-1 ring-[#E88C7D]/50'
                              : 'bg-[#8FA89B]/24 text-[#3D5E49] ring-1 ring-[#8FA89B]/50'
                            : 'bg-white text-[#5B527E] hover:bg-[#EFEDF5] border border-[#292832]/[0.06]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {notif.feedbackSubmitted && (
                  <p className="text-[10px] text-[#85838D] leading-snug">
                    {t.deliveryCare.recipient.feedbackSavedNote}
                  </p>
                )}
              </div>
            </motion.article>
          );
        }

        const view = getRecipientVisibleSurpriseView(surprise, nowISO);
        if (!view.visible) return null;

        if (view.isMasked) {
          return (
            <article
              key={notif.id}
              className="bg-gradient-to-br from-[#F4F1F9] via-white to-[#FBF7F5] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/35 shadow-[0_12px_30px_-10px_rgba(91,82,126,0.14)] space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2.5 py-1 rounded-xl">
                  <Gift className="w-3.5 h-3.5 text-[#C45E4E]" />
                  <span>{t.surpriseCare.recipient.maskedCardTitle}</span>
                </div>
                <span className="text-[10.5px] text-[#85838D]">
                  {timePrefix} · {notif.timeLabel}
                </span>
              </div>

              {notif.suppressedByQuietHours && (
                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                  <BellOff className="w-3 h-3" />
                  <span>{t.notifications.suppressedQuietLabel}</span>
                </div>
              )}

              <div className="rounded-2xl bg-white/90 border border-[#9B93B8]/20 p-3.5 space-y-1.5">
                <p className="text-[13.5px] font-semibold text-[#292832] leading-snug">
                  {t.surpriseCare.recipient.maskedCardBody}
                </p>
                <p className="text-[11.5px] text-[#706794] leading-snug flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {view.canOpenSurprise
                      ? t.surpriseCare.recipient.maskedReadyHint
                      : formatTemplate(t.surpriseCare.recipient.maskedWaitingHint, {
                          time: formattedRevealAt,
                        })}
                  </span>
                </p>
              </div>

              {view.canOpenSurprise && (
                <button
                  type="button"
                  onClick={() => {
                    revealSurpriseCare(partnerId, surprise.id);
                    setJustRevealedIds((prev) => ({
                      ...prev,
                      [surprise.id]: true,
                    }));
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-[0_10px_24px_-8px_rgba(232,140,125,0.6)] transition-all duration-200 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{t.surpriseCare.recipient.openSurpriseBtn}</span>
                </button>
              )}
            </article>
          );
        }

        const justOpened = Boolean(justRevealedIds[surprise.id]);
        const linkedDatePlan = view.relatedDatePlanId
          ? allDatePlanSuggestions.find((p) => p.id === view.relatedDatePlanId)
          : undefined;
        const linkedDateInteraction = view.relatedDatePlanId
          ? datePlanInteractions[view.relatedDatePlanId]
          : undefined;

        const surpriseFeedbackOptions: Array<{
          type: RecipientFeedbackType;
          label: string;
          isNegative: boolean;
        }> = [
          {
            type: 'more_like_this',
            label: t.surpriseCare.recipient.feedbackMadeMyDay,
            isNegative: false,
          },
          {
            type: 'helpful',
            label: t.surpriseCare.recipient.feedbackHelpful,
            isNegative: false,
          },
          {
            type: 'not_suitable',
            label: t.surpriseCare.recipient.feedbackNotMyThing,
            isNegative: true,
          },
        ];

        return (
          <motion.article
            key={notif.id}
            initial={
              justOpened && !shouldReduceMotion
                ? { opacity: 0.4, scale: 0.96, y: 8 }
                : false
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="bg-gradient-to-br from-[#FBF5F3] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/35 shadow-[0_12px_32px_-10px_rgba(232,140,125,0.22)] space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#B45A4C]">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {formatTemplate(t.surpriseCare.recipient.tellNowCardTitle, {
                      sender: senderName,
                    })}
                  </span>
                </div>
                <div className="text-[10.5px] text-[#85838D] mt-0.5">
                  {timePrefix} · {notif.timeLabel}
                  {justOpened && (
                    <span className="ml-1.5 font-semibold text-[#706794]">
                      · {t.surpriseCare.recipient.openedBanner}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                  surprise.status === 'Completed'
                    ? 'bg-[#8FA89B]/20 text-[#3D5E49]'
                    : 'bg-[#EFEDF5] text-[#5B527E]'
                }`}
              >
                {t.surpriseCare.statuses[surprise.status]}
              </span>
            </div>

            {notif.suppressedByQuietHours && (
              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                <BellOff className="w-3 h-3" />
                <span>{t.notifications.suppressedQuietLabel}</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[10.5px] font-semibold text-[#706794]">
                {t.surpriseCare.categories[surprise.careCategory].label}
              </div>
              <h3 className="font-display text-[15px] font-semibold text-[#292832] leading-snug">
                {isMaskedReceived ? t.notifications.neutralPreviewCareTitle : view.title}
              </h3>
              {!isMaskedReceived && view.actionDescription && (
                <p className="text-[12px] text-[#292832]/85 leading-snug">
                  {view.actionDescription}
                </p>
              )}
            </div>

            {isMaskedReceived ? (
              <p className="text-[12.5px] text-[#292832] bg-white/90 rounded-2xl p-3 border border-[#292832]/[0.05]">
                {t.notifications.neutralPreviewCareBody}
              </p>
            ) : view.noteStyle === 'handwritten_note' ? (
              <div className="rounded-2xl bg-[#FFFDF8] border-2 border-dashed border-[#E88C7D]/45 p-3.5 space-y-1.5">
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45A4C]">
                  <FileSignature className="w-3 h-3" />
                  <span>{t.surpriseCare.handwrittenBadge}</span>
                </div>
                <p className="text-[13px] text-[#292832] italic leading-relaxed">
                  “{view.content}”
                </p>
              </div>
            ) : view.noteStyle === 'voice_placeholder' ? (
              <div className="rounded-2xl bg-[#EFEDF5]/65 border border-[#9B93B8]/30 p-3.5 space-y-1.5">
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#5B527E]">
                  <Mic className="w-3 h-3" />
                  <span>{t.surpriseCare.voicePlaceholderBadge}</span>
                </div>
                <p className="text-[13px] text-[#292832] leading-relaxed">“{view.content}”</p>
              </div>
            ) : (
              <p className="text-[13px] text-[#292832] leading-relaxed bg-white/90 rounded-2xl p-3 border border-[#292832]/[0.05]">
                “{view.content}”
              </p>
            )}

            {!isMaskedReceived && linkedDatePlan && linkedDateInteraction && (
              <div className="rounded-2xl bg-white border border-[#9B93B8]/25 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#5B527E]">
                    <Calendar className="w-3.5 h-3.5 text-[#E88C7D]" />
                    <span>{t.surpriseCare.recipient.linkedDateTitle}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                    {t.care.datePlanning.statusLabels[linkedDateInteraction.status]}
                  </span>
                </div>
                <div className="text-[12.5px] font-semibold text-[#292832]">
                  {t.care.datePlanning.plans[linkedDatePlan.titleKey]?.title ??
                    linkedDatePlan.titleKey}
                </div>
                <div className="text-[11px] text-[#85838D] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{linkedDatePlan.suggestedSlot}</span>
                </div>
                {linkedDateInteraction.status === 'invited' && (
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        respondDatePlanInvite(partnerId, linkedDatePlan.id, 'accepted')
                      }
                      className="min-h-[34px] px-2.5 rounded-xl bg-[#8FA89B] hover:bg-[#7B9687] text-white text-[11px] font-semibold active:scale-95 transition-all"
                    >
                      {t.care.datePlanning.acceptInviteBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        respondDatePlanInvite(partnerId, linkedDatePlan.id, 'declined')
                      }
                      className="min-h-[34px] px-2.5 rounded-xl bg-[#F4EFEA] text-[#8E4D42] text-[11px] font-semibold active:scale-95 transition-all"
                    >
                      {t.care.datePlanning.declineInviteBtn}
                    </button>
                  </div>
                )}
                {linkedDateInteraction.status === 'accepted' && (
                  <button
                    type="button"
                    onClick={() => respondDatePlanInvite(partnerId, linkedDatePlan.id, 'agreed')}
                    className="w-full min-h-[34px] px-2.5 rounded-xl bg-[#292832] text-white text-[11px] font-semibold active:scale-95 transition-all"
                  >
                    {t.care.datePlanning.markAgreedBtn}
                  </button>
                )}
              </div>
            )}

            {surprise.status !== 'Completed' ? (
              <button
                type="button"
                onClick={() => completeSurpriseCare(partnerId, surprise.id)}
                className="w-full min-h-[42px] px-3 py-2 rounded-2xl bg-[#8FA89B]/22 hover:bg-[#8FA89B]/32 text-[#3D5E49] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>{t.surpriseCare.recipient.markCompletedBtn}</span>
              </button>
            ) : (
              <div className="rounded-xl bg-[#8FA89B]/16 px-3 py-2 text-[11px] font-semibold text-[#3D5E49] flex items-center gap-1.5">
                <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{t.surpriseCare.recipient.completedBadge}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#292832]/[0.06] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#706794]">
                  {t.surpriseCare.recipient.feedbackPrompt}
                </span>
                {notif.feedbackSubmitted && (
                  <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                    {formatTemplate(t.notifications.feedbackSelectedBadge, {
                      type: getFeedbackLabel(notif.feedbackSubmitted),
                    })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {surpriseFeedbackOptions.map((opt) => {
                  const isSelected = notif.feedbackSubmitted === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        recordRecipientNotificationFeedback(notif.id, partnerId, opt.type)
                      }
                      className={`min-h-[36px] px-1.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center justify-center text-center leading-tight transition-all active:scale-95 ${
                        isSelected
                          ? opt.isNegative
                            ? 'bg-[#F5E8E7] text-[#8E4D42] ring-1 ring-[#E88C7D]/50'
                            : 'bg-[#8FA89B]/24 text-[#3D5E49] ring-1 ring-[#8FA89B]/50'
                          : 'bg-white text-[#5B527E] hover:bg-[#EFEDF5] border border-[#292832]/[0.06]'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {notif.feedbackSubmitted && (
                <p className="text-[10px] text-[#85838D] leading-snug">
                  {t.notifications.feedbackRecordedNote}
                </p>
              )}
            </div>
          </motion.article>
        );
      }

      // Sent direction for surprise care / mock order
      if (linkedOrder) {
        if (linkedOrder.status === 'Cancelled') return null;
        const nextStage = getNextMockOrderStage(linkedOrder.status);
        return (
          <article
            key={notif.id}
            className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/25 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[11px] text-[#85838D] min-w-0">
                <span className="font-semibold text-[#292832]">{senderName}</span>
                {' → '}
                <span className="font-semibold text-[#292832]">{recipientName}</span>
                <span aria-hidden="true"> · </span>
                <span>
                  {timePrefix} · {notif.timeLabel}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0 tabular-nums">
                #{linkedOrder.orderNumber}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <OrderProductThumbnail
                imageKey={linkedOrder.productImageKey}
                alt={linkedOrder.productTitle}
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-[10.5px] font-semibold text-[#706794]">
                  {linkedOrder.revealMode === 'tell_now'
                    ? t.deliveryCare.tracking.revealModeTellNow
                    : t.deliveryCare.tracking.revealModeSurprise}
                </div>
                <div className="text-[13.5px] font-semibold text-[#292832] leading-snug">
                  {linkedOrder.productTitle}
                </div>
                <div className="text-[11px] text-[#85838D] tabular-nums">
                  {linkedOrder.merchantName} · {linkedOrder.selectedVariant} ×
                  {linkedOrder.quantity} · {linkedOrder.currencySymbol}
                  {linkedOrder.totalAmount}
                </div>
              </div>
            </div>

            <DeliveryStageProgressBar status={linkedOrder.status} t={t} />

            <div className="text-[11px] text-[#85838D] flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t.deliveryCare.tracking.etaPrefix} {linkedOrder.estimatedArrivalLabel}
              </span>
            </div>

            <p className="text-[12.5px] text-[#292832] leading-relaxed bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.05]">
              “{linkedOrder.careMessage}”
            </p>

            {linkedOrder.status !== 'Delivered' && (
              <div className="flex items-center gap-2 pt-0.5">
                {linkedOrder.status === 'Order Confirmed' && (
                  <button
                    type="button"
                    onClick={() => cancelMockOrder(partnerId, linkedOrder.id)}
                    className="min-h-[36px] px-3 rounded-xl bg-[#F4EFEA] text-[#8E4D42] text-[11px] font-semibold inline-flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <X className="w-3 h-3" />
                    <span>{t.deliveryCare.tracking.cancelOrderBtn}</span>
                  </button>
                )}
                {nextStage && (
                  <button
                    type="button"
                    onClick={() =>
                      advanceMockOrderStatus(partnerId, linkedOrder.id, nextStage)
                    }
                    className="flex-1 min-h-[36px] px-3 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11px] font-semibold inline-flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{getDemoNextStageButtonLabel(nextStage, t)}</span>
                  </button>
                )}
              </div>
            )}

            {notif.feedbackSubmitted && (
              <div className="rounded-xl bg-[#8FA89B]/16 px-3 py-1.5 text-[10.5px] font-semibold text-[#3D5E49]">
                {formatTemplate(t.notifications.feedbackSelectedBadge, {
                  type: getFeedbackLabel(notif.feedbackSubmitted),
                })}
              </div>
            )}

            <p className="text-[10px] text-[#85838D]">
              {formatTemplate(t.deliveryCare.recipient.senderReadonlyNote, {
                partner: recipientName,
              })}
            </p>
          </article>
        );
      }

      return (
        <article
          key={notif.id}
          className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#9B93B8]/25 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] text-[#85838D] min-w-0">
              <span className="font-semibold text-[#292832]">{senderName}</span>
              {' → '}
              <span className="font-semibold text-[#292832]">{recipientName}</span>
              <span aria-hidden="true"> · </span>
              <span>
                {timePrefix} · {notif.timeLabel}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0">
              <Gift className="w-3 h-3 text-[#C45E4E]" />
              <span>{t.surpriseCare.statuses[surprise.status]}</span>
            </span>
          </div>

          <div>
            <div className="text-[10.5px] font-semibold text-[#706794]">
              {t.surpriseCare.categories[surprise.careCategory].label}
              {surprise.status === 'Scheduled' && formattedRevealAt
                ? ` · ${formatTemplate(t.surpriseCare.recipient.senderStatusWaiting, {
                    time: formattedRevealAt,
                  })}`
                : ''}
            </div>
            <div className="text-[13.5px] font-semibold text-[#292832] mt-0.5">
              {surprise.title}
            </div>
            <p className="text-[12.5px] text-[#292832] leading-relaxed mt-1.5 bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.05]">
              “{surprise.content}”
            </p>
          </div>

          {surprise.status === 'Scheduled' && (
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => cancelSurpriseCare(partnerId, surprise.id)}
                className="min-h-[34px] px-3 rounded-xl bg-[#F4EFEA] text-[#8E4D42] text-[11px] font-semibold inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>{t.surpriseCare.cancelSurpriseBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => unlockDemoSurpriseReveal(surprise.id)}
                className="flex-1 min-h-[34px] px-3 rounded-xl bg-[#EFEDF5] text-[#5B527E] text-[11px] font-semibold inline-flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{t.surpriseCare.demoUnlockNowBtn}</span>
              </button>
            </div>
          )}

          <p className="text-[10px] text-[#85838D]">
            {t.surpriseCare.recipient.senderOnlyReadonlyHint}
          </p>
        </article>
      );
    }

    if (notif.kind === 'status_update') {
      const authorizedView = getAuthorizedPartnerStatusView(
        notif.statusSnapshot,
        sharingPrefs[notif.sender]
      );
      const statusLabel =
        !authorizedView.isPrivate && authorizedView.checkInStatus
          ? t.home.checkInOptions[authorizedView.checkInStatus].label
          : '';
      const statusBody = isMaskedReceived
        ? t.notifications.neutralPreviewStatusBody
        : authorizedView.isPrivate || !authorizedView.checkInStatus
          ? formatTemplate(t.notifications.statusUpdatePrivateBody, {
              sender: senderName,
            })
          : formatTemplate(
              authorizedView.confirmationState === 'updated'
                ? t.notifications.statusUpdateUpdatedBody
                : t.notifications.statusUpdateConfirmedBody,
              {
                sender: senderName,
                status: statusLabel,
              }
            );

      return (
        <article
          key={notif.id}
          className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#F4F1F9] rounded-[22px] p-4 ring-1 ring-[#E88C7D]/25 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] text-[#85838D] min-w-0">
              <span className="font-semibold text-[#292832]">{senderName}</span>
              {' → '}
              <span className="font-semibold text-[#292832]">{recipientName}</span>
              <span aria-hidden="true"> · </span>
              <span>
                {timePrefix} · {notif.timeLabel}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#B45A4C] bg-[#F5E8E7] px-2 py-0.5 rounded-lg shrink-0">
              {t.notifications.statusUpdateLabel}
            </span>
          </div>

          {notif.suppressedByQuietHours && (
            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
              <BellOff className="w-3 h-3" />
              <span>{t.notifications.suppressedQuietLabel}</span>
            </div>
          )}

          <p className="text-[13px] font-medium text-[#292832] leading-relaxed bg-white/85 rounded-2xl p-3 border border-[#292832]/[0.04]">
            {statusBody}
          </p>

          {direction === 'received' && (
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (notif.status === 'Sent') {
                    updateNotificationStatus(notif.id, 'Received', partnerId);
                  }
                  setActivePage(partnerId, 'home');
                }}
                className="min-h-[40px] px-3 py-2 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[12px] font-semibold transition-all duration-200 active:scale-95"
              >
                {t.notifications.viewOnHomeBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (notif.status === 'Sent') {
                    updateNotificationStatus(notif.id, 'Received', partnerId);
                  }
                  respondWithCareFromStatus(partnerId);
                }}
                className="min-h-[40px] px-3 py-2 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12px] font-semibold transition-all duration-200 active:scale-95 shadow-[0_6px_14px_-6px_rgba(232,140,125,0.5)]"
              >
                {t.notifications.respondWithCareBtn}
              </button>
            </div>
          )}
        </article>
      );
    }

    const localizedSuggestion = t.care.suggestions[notif.suggestionId];
    const suggestionTitle = isMaskedReceived
      ? t.notifications.neutralPreviewCareTitle
      : notif.suggestionTitle || localizedSuggestion?.title || '';
    const messageText = isMaskedReceived
      ? t.notifications.neutralPreviewCareBody
      : notif.customMessage && notif.customMessage.length > 0
        ? notif.customMessage
        : notif.suggestionDefaultMessage || localizedSuggestion?.defaultMessage || '';

    return (
      <article
        key={notif.id}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] text-[#85838D] min-w-0">
            <span className="font-semibold text-[#292832]">{senderName}</span>
            {' → '}
            <span className="font-semibold text-[#292832]">{recipientName}</span>
            <span aria-hidden="true"> · </span>
            <span>
              {timePrefix} · {notif.timeLabel}
            </span>
          </div>
          <StatusLabel status={notif.status} label={t.notifications.statuses[notif.status]} />
        </div>

        {(notif.suppressedByQuietHours || notif.suppressedReason === 'frequency_filter') && (
          <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
            <BellOff className="w-3 h-3" />
            <span>
              {notif.suppressedByQuietHours
                ? t.notifications.suppressedQuietLabel
                : t.notifications.suppressedFrequencyLabel}
            </span>
          </div>
        )}

        <div>
          <div className="text-[11px] font-medium text-[#706794]">
            {t.notifications.relatedSuggestion} {suggestionTitle}
          </div>
          <p className="text-[13px] text-[#292832] leading-relaxed mt-1.5 bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04]">
            “{messageText}”
          </p>
        </div>

        {direction === 'received' && notif.status !== 'Completed' && (
          <div className="flex items-center gap-2 pt-0.5">
            {notif.status === 'Sent' && (
              <button
                type="button"
                onClick={() => updateNotificationStatus(notif.id, 'Received', partnerId)}
                className="flex-1 min-h-[42px] px-3 py-2 rounded-2xl bg-[#F5E8E7] hover:bg-[#EEDAD8] text-[#B45A4C] text-[12px] font-semibold transition-all duration-200 active:scale-95"
              >
                {t.notifications.markAsReceived}
              </button>
            )}
            <button
              type="button"
              onClick={() => updateNotificationStatus(notif.id, 'Completed', partnerId)}
              className="flex-1 min-h-[42px] px-3 py-2 rounded-2xl bg-[#8FA89B]/20 hover:bg-[#8FA89B]/30 text-[#3D5E49] text-[12px] font-semibold transition-all duration-200 active:scale-95"
            >
              {t.notifications.markAsCompleted}
            </button>
          </div>
        )}

        {direction === 'received' && notif.recipient === partnerId && (
          <div className="pt-2 border-t border-[#292832]/[0.06] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#706794]">
                {t.notifications.feedbackPrompt}
              </span>
              {notif.feedbackSubmitted && (
                <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/18 px-2 py-0.5 rounded-lg">
                  {formatTemplate(t.notifications.feedbackSelectedBadge, {
                    type: getFeedbackLabel(notif.feedbackSubmitted),
                  })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {feedbackOptions.map((opt) => {
                const isSelected = notif.feedbackSubmitted === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      recordRecipientNotificationFeedback(notif.id, partnerId, opt.type)
                    }
                    className={`min-h-[34px] px-1.5 py-1.5 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                      isSelected
                        ? opt.isNegative
                          ? 'bg-[#F5E8E7] text-[#8E4D42] ring-1 ring-[#E88C7D]/50'
                          : 'bg-[#8FA89B]/24 text-[#3D5E49] ring-1 ring-[#8FA89B]/50'
                        : 'bg-[#FDFBFA] text-[#5B527E] hover:bg-[#EFEDF5]'
                    }`}
                  >
                    {opt.icon === 'up' ? (
                      <ThumbsUp className="w-3 h-3 shrink-0" />
                    ) : (
                      <ThumbsDown className="w-3 h-3 shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {notif.feedbackSubmitted && (
              <p className="text-[10px] text-[#85838D] leading-snug">
                {t.notifications.feedbackRecordedNote}
              </p>
            )}
          </div>
        )}
      </article>
    );
  };

  // Subpage: Personal Settings (Demo)
  if (currentSubView === 'settings') {
    return (
      <ProfilePage
        partnerId={partnerId}
        scope="demo"
        titleOverride={t.ia.notifications.personalSettingsSection.pageTitle}
        onBackOverride={() => setNotificationsSubView(partnerId, 'overview')}
      />
    );
  }

  // Subpage: Membership & Benefits (Demo)
  if (currentSubView === 'membership') {
    const activatedByName = membership.purchasedBy
      ? presentationBundle.partnerMeta[membership.purchasedBy].display_name
      : null;
    const me = presentationBundle.partnerProfiles[partnerId];
    const meMeta = presentationBundle.partnerMeta[partnerId];
    const partnerMeta = presentationBundle.partnerMeta[otherPartner];
    const partnerProfile = presentationBundle.partnerProfiles[otherPartner];

    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.membershipSection.pageTitle}
          backLabel={t.ia.back}
          onBack={() => setNotificationsSubView(partnerId, 'overview')}
        />
        <MembershipPlanView
          scope="demo"
          membership={membership}
          isCoupleLinked={true}
          onBack={() => setNotificationsSubView(partnerId, 'overview')}
          onConfirmUpgrade={(plan) => upgradeDemoPremium(partnerId, plan)}
          memberNames={{
            a: presentationBundle.partnerMeta.alex.display_name,
            b: presentationBundle.partnerMeta.jamie.display_name,
            activatedBy: activatedByName,
          }}
          widgetStyle={widgetPreviewStyle[partnerId]}
          onChangeWidgetStyle={(style) => setWidgetPreviewStyle(partnerId, style)}
          widgetSummaryData={{
            meName: meMeta.display_name,
            meEnergy: me.latestEnergy,
            partnerName: partnerMeta.display_name,
            partnerEnergy: partnerProfile.latestEnergy,
            partnerSharing: sharingPrefs[otherPartner],
          }}
          t={t}
        />
      </div>
    );
  }

  // Subpage: Notification / Invitation Detail (Demo)
  const myDetail = detailByPartner[partnerId];
  if (currentSubView === 'detail' && myDetail) {
    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.detailTitle}
          backLabel={t.ia.back}
          onBack={() => setNotificationsSubView(partnerId, myDetail.returnCategory)}
        />
        {myDetail.kind === 'invitation'
          ? renderInvitationDetail(myDetail.planId)
          : (() => {
              const targetNotif = notifications.find((n) => n.id === myDetail.notificationId);
              if (!targetNotif) {
                return (
                  <div className="bg-white rounded-[22px] p-5 text-center text-[12px] text-[#85838D]">
                    {t.ia.notifications.emptyCategory}
                  </div>
                );
              }
              return (
                renderFullDemoNotificationCard(targetNotif, myDetail.direction) ?? (
                  <div className="bg-white rounded-[22px] p-5 text-center text-[12px] text-[#85838D]">
                    {t.ia.notifications.emptyCategory}
                  </div>
                )
              );
            })()}
      </div>
    );
  }

  // Subpage: Pending Invitations (Demo)
  if (currentSubView === 'invitations') {
    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.ia.notifications.categories.invitationsTitle}
          subtitle={`${visibleInvitations.length}`}
          backLabel={t.ia.back}
          onBack={() => setNotificationsSubView(partnerId, 'overview')}
        />

        {visibleInvitations.length === 0 ? (
          <div className="bg-white/90 rounded-[22px] p-6 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EFEDF5] flex items-center justify-center mx-auto text-[#706794]">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.ia.notifications.invitationsEmptyNote}
            </div>
            <button
              type="button"
              onClick={() => setActivePage(partnerId, 'care')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-2xl bg-[#F5E8E7] text-[#B45A4C] text-[12px] font-semibold active:scale-95 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.care.tabDatePlanning}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleInvitations.map((invite) => {
              const planMeta = allDatePlanSuggestions.find((p) => p.id === invite.planId);
              if (!planMeta) return null;
              const copy = t.care.datePlanning.plans[planMeta.titleKey];
              const senderName =
                invite.invitedBy && presentationBundle.partnerMeta[invite.invitedBy]
                  ? presentationBundle.partnerMeta[invite.invitedBy].display_name
                  : presentationBundle.partnerMeta[otherPartner].display_name;
              const isActionNeeded =
                (invite.invitee === partnerId && invite.status === 'invited') ||
                invite.status === 'accepted';

              return (
                <button
                  key={invite.planId}
                  type="button"
                  onClick={() => {
                    setDetailByPartner((prev) => ({
                      ...prev,
                      [partnerId]: {
                        kind: 'invitation',
                        planId: invite.planId,
                        returnCategory: 'invitations',
                      },
                    }));
                    setNotificationsSubView(partnerId, 'detail');
                  }}
                  className="w-full text-left bg-gradient-to-r from-[#F5E8E7]/50 via-white to-[#EFEDF5]/60 rounded-[22px] p-4 ring-1 ring-[#E88C7D]/25 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.06)] hover:ring-[#E88C7D]/55 transition-all active:scale-[0.985] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#B45A4C]">
                      {formatTemplate(t.care.datePlanning.incomingInviteTitle, {
                        partner: senderName,
                      })}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                        isActionNeeded
                          ? 'bg-[#FBF2E6] text-[#6E4F28]'
                          : 'bg-[#8FA89B]/18 text-[#3D5E49]'
                      }`}
                    >
                      {t.care.datePlanning.statusLabels[invite.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[14.5px] font-semibold text-[#292832] truncate">
                      {copy?.title ?? planMeta.titleKey}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#85838D] shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#85838D]">
                    <span className="truncate">
                      {invite.alternativeTimeProposal
                        ? `${t.ia.notifications.altTimeProposedBadge}: ${invite.alternativeTimeProposal.slotLabel}`
                        : planMeta.suggestedSlot}
                    </span>
                    <span className="text-[10.5px] font-semibold text-[#706794] shrink-0">
                      {t.ia.notifications.openDetailHint}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Subpage: Care Moments (Demo)
  if (currentSubView === 'moments') {
    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={t.notifications.careMomentsTitle}
          subtitle={`${windowCareMoments.length}`}
          backLabel={t.ia.back}
          onBack={() => setNotificationsSubView(partnerId, 'overview')}
        />

        <div className="px-0.5 space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11.5px] text-[#85838D]">
              {t.notifications.careMomentsSubtitle}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                capabilities.canUseFullCareHistory
                  ? 'bg-[#8FA89B]/20 text-[#3D5E49]'
                  : 'bg-[#FBF2E6] text-[#6E4F28]'
              }`}
            >
              {capabilities.canUseFullCareHistory && <Crown className="w-3 h-3 shrink-0" />}
              <span>
                {capabilities.canUseFullCareHistory
                  ? t.notifications.membershipLock.fullHistoryBadge
                  : t.notifications.membershipLock.recentWindowBadge}
              </span>
            </span>
          </div>
        </div>

        {windowCareMoments.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-[10px] rounded-[22px] p-6 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F5E8E7] flex items-center justify-center mx-auto text-[#C45E4E]">
              <Sparkles className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.notifications.careMomentsEmptyTitle}
            </div>
            <p className="text-[12px] text-[#85838D] leading-relaxed max-w-[240px] mx-auto">
              {t.notifications.careMomentsEmptyBody}
            </p>
          </div>
        ) : (
          windowCareMoments.map((moment) => {
            const senderName = presentationBundle.partnerProfiles[moment.sender].name;
            const recipientName = presentationBundle.partnerProfiles[moment.recipient].name;
            const isEditingNote = editingMomentId === moment.id;
            const draft = momentDrafts[moment.id] ?? moment.optionalNote ?? '';

            return (
              <article
                key={moment.id}
                className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-[#85838D]">
                      <span className="font-semibold text-[#292832]">{senderName}</span>
                      {' → '}
                      <span className="font-semibold text-[#292832]">{recipientName}</span>
                      <span>
                        {' · '}
                        {moment.dateISO} · {moment.timeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <h3 className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
                        {moment.careActionTitle}
                      </h3>
                      {moment.isSurprise && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B45A4C] bg-[#F5E8E7] px-2 py-0.5 rounded-lg">
                          <Gift className="w-2.5 h-2.5 shrink-0" />
                          <span>{t.surpriseCare.recipient.momentsSurpriseBadge}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                      moment.sharedVisibility
                        ? 'bg-[#8FA89B]/18 text-[#3D5E49]'
                        : 'bg-[#F4EFEA] text-[#85838D]'
                    }`}
                  >
                    {!moment.sharedVisibility && <Lock className="w-2.5 h-2.5" />}
                    <span>
                      {moment.sharedVisibility
                        ? t.notifications.careMomentSharedBadge
                        : t.notifications.careMomentPrivateBadge}
                    </span>
                  </span>
                </div>

                {moment.optionalNote && !isEditingNote && (
                  <p className="text-[12px] text-[#292832]/85 bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.04] italic">
                    “{moment.optionalNote}”
                  </p>
                )}

                {isEditingNote && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={draft}
                      onChange={(e) =>
                        setMomentDrafts((prev) => ({
                          ...prev,
                          [moment.id]: e.target.value,
                        }))
                      }
                      placeholder={t.notifications.careMomentAddNotePlaceholder}
                      className="w-full rounded-2xl bg-[#FDFBFA] border border-[#292832]/10 p-2.5 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMomentId(null)}
                        className="min-h-[32px] px-3 rounded-xl bg-[#F4EFEA] text-[11px] font-medium text-[#292832]"
                      >
                        {t.meta.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateCareMomentNote(moment.id, draft, partnerId);
                          setEditingMomentId(null);
                        }}
                        className="min-h-[32px] px-3 rounded-xl bg-[#292832] text-white text-[11px] font-semibold"
                      >
                        {t.notifications.careMomentSaveNoteBtn}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#292832]/[0.05]">
                  <button
                    type="button"
                    onClick={() => {
                      setMomentDrafts((prev) => ({
                        ...prev,
                        [moment.id]: moment.optionalNote ?? '',
                      }));
                      setEditingMomentId(isEditingNote ? null : moment.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#706794] hover:underline"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{t.notifications.careMomentAddNotePlaceholder}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCareMomentVisibility(moment.id)}
                    className="text-[11px] font-medium text-[#5B527E] bg-[#EFEDF5] hover:bg-[#E4E0F0] px-2.5 py-1 rounded-xl transition-all active:scale-95"
                  >
                    {t.notifications.careMomentToggleShare}
                  </button>
                </div>
              </article>
            );
          })
        )}

        {lockedOlderCount > 0 && (
          <PremiumFeaturePreview
            badgeLabel={t.notifications.membershipLock.lockedArchiveBadge}
            title={formatTemplate(t.notifications.membershipLock.lockedArchiveTitle, {
              count: lockedOlderCount,
            })}
            description={t.notifications.membershipLock.lockedArchiveDesc}
            benefits={t.notifications.membershipLock.lockedArchiveBenefits}
            upgradeLabel={t.notifications.membershipLock.upgradeCta}
            backLabel={t.ia.back}
            onUpgrade={() => openPremiumMembership(partnerId)}
            onBack={() => setNotificationsSubView(partnerId, 'overview')}
          />
        )}
      </div>
    );
  }

  // Subpage: Care Updates or Order Updates (Demo)
  if (currentSubView === 'care_updates' || currentSubView === 'orders') {
    const isOrders = currentSubView === 'orders';
    const receivedItems = isOrders ? receivedOrders : receivedCareUpdates;
    const sentItems = isOrders ? sentOrders : sentCareUpdates;
    const unreadInCategory = isOrders ? unreadOrders : unreadCareUpdates;
    const displayed = activeTab === 'received' ? receivedItems : sentItems;

    return (
      <div className="space-y-4 pb-2">
        <SubpageHeader
          title={
            isOrders
              ? t.ia.notifications.categories.ordersTitle
              : t.ia.notifications.categories.careUpdatesTitle
          }
          backLabel={t.ia.back}
          onBack={() => setNotificationsSubView(partnerId, 'overview')}
        />

        {quietHoursActive && (
          <div
            role="status"
            className="rounded-2xl bg-[#EFEDF5]/85 border border-[#9B93B8]/25 px-3.5 py-2.5 text-[11.5px] text-[#5B527E] flex items-center gap-2"
          >
            <BellOff className="w-3.5 h-3.5 shrink-0" />
            <span className="leading-snug">
              {formatTemplate(t.notifications.quietHoursActiveBanner, {
                start: myNotifPrefs.quietStartTime,
                end: myNotifPrefs.quietEndTime,
              })}
            </span>
          </div>
        )}

        <div
          role="tablist"
          aria-label={t.notifications.tabNotifications}
          className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'received'}
            onClick={() => setActiveTab('received')}
            className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
              activeTab === 'received'
                ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
                : 'text-[#85838D] hover:text-[#292832]'
            }`}
          >
            <span>{t.notifications.receivedTab}</span>
            <span className="text-[11px] text-[#85838D] tabular-nums">
              ({receivedItems.length})
            </span>
            {unreadInCategory > 0 && (
              <span className="text-[10px] font-bold text-[#D46B5B] tabular-nums">
                · {unreadInCategory} {t.notifications.newCountSuffix}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sent'}
            onClick={() => setActiveTab('sent')}
            className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
              activeTab === 'sent'
                ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
                : 'text-[#85838D] hover:text-[#292832]'
            }`}
          >
            <span>{t.notifications.sentTab}</span>
            <span className="text-[11px] text-[#85838D] tabular-nums">({sentItems.length})</span>
          </button>
        </div>

        {displayed.length === 0 ? (
          <div className="bg-white/85 backdrop-blur-[10px] rounded-[22px] p-6 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F4EFEA] flex items-center justify-center mx-auto text-[#85838D]">
              <Inbox className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="font-display text-[14.5px] font-semibold text-[#292832]">
              {activeTab === 'received'
                ? t.notifications.emptyReceivedTitle
                : t.notifications.emptySentTitle}
            </div>
            <p className="text-[12px] text-[#85838D] leading-relaxed max-w-[240px] mx-auto">
              {activeTab === 'received'
                ? t.notifications.emptyReceivedBody
                : t.notifications.emptySentBody}
            </p>
            <button
              type="button"
              onClick={() => setActivePage(partnerId, 'care')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-2xl bg-[#F5E8E7] hover:bg-[#EEDAD8] text-[#B45A4C] text-[12px] font-semibold transition-all duration-200 active:scale-95"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>{t.notifications.exploreAiCare}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayed.map((notif) => {
              const senderName = presentationBundle.partnerProfiles[notif.sender].name;
              const recipientName = presentationBundle.partnerProfiles[notif.recipient].name;
              const timePrefix = notif.isToday
                ? t.notifications.todayPrefix
                : t.notifications.yesterdayPrefix;
              const isMaskedReceived = activeTab === 'received' && maskSensitive;
              const meta = classifyDemoNotification(notif, activeTab);
              const isUnread =
                activeTab === 'received' && isNotificationAlertActive(notif, myNotifPrefs);

              // Concise summary copy respecting privacy/anti-spoiler masking
              let summaryTitle = '';
              let summaryPreview = '';
              let statusBadge = t.notifications.statuses[notif.status];

              if (notif.kind === 'surprise_care' && meta.surprise) {
                if (meta.linkedOrder) {
                  if (activeTab === 'received') {
                    const orderView = getRecipientVisibleOrderView(
                      meta.linkedOrder,
                      meta.surprise
                    );
                    if (orderView.isMasked) {
                      summaryTitle = t.deliveryCare.recipient.maskedTitle;
                      summaryPreview = t.deliveryCare.recipient.maskedBody;
                      statusBadge = t.deliveryCare.tracking.stages['Order Confirmed'];
                    } else if (isMaskedReceived) {
                      summaryTitle = t.notifications.neutralPreviewCareTitle;
                      summaryPreview = t.notifications.neutralPreviewCareBody;
                    } else {
                      summaryTitle = orderView.productTitle ?? t.deliveryCare.recipient.revealedTitle;
                      summaryPreview = orderView.careMessage ?? '';
                      statusBadge =
                        meta.surprise.status === 'Completed'
                          ? t.surpriseCare.statuses.Completed
                          : orderView.status
                            ? t.deliveryCare.tracking.stages[orderView.status]
                            : t.surpriseCare.statuses[meta.surprise.status];
                    }
                  } else {
                    summaryTitle = meta.linkedOrder.productTitle;
                    summaryPreview = meta.linkedOrder.careMessage;
                    statusBadge = t.deliveryCare.tracking.stages[meta.linkedOrder.status];
                  }
                } else if (activeTab === 'received') {
                  const view = getRecipientVisibleSurpriseView(meta.surprise, nowISO);
                  if (view.isMasked) {
                    summaryTitle = t.surpriseCare.recipient.maskedCardTitle;
                    summaryPreview = t.surpriseCare.recipient.maskedCardBody;
                    statusBadge = t.surpriseCare.statuses.Scheduled;
                  } else if (isMaskedReceived) {
                    summaryTitle = t.notifications.neutralPreviewCareTitle;
                    summaryPreview = t.notifications.neutralPreviewCareBody;
                  } else {
                    summaryTitle = view.title ?? '';
                    summaryPreview = view.content ?? '';
                    statusBadge = t.surpriseCare.statuses[meta.surprise.status];
                  }
                } else {
                  summaryTitle = meta.surprise.title;
                  summaryPreview = meta.surprise.content;
                  statusBadge = t.surpriseCare.statuses[meta.surprise.status];
                }
              } else if (notif.kind === 'status_update') {
                const authorizedView = getAuthorizedPartnerStatusView(
                  notif.statusSnapshot,
                  sharingPrefs[notif.sender]
                );
                summaryTitle = t.notifications.statusUpdateLabel;
                const statusLabel =
                  !authorizedView.isPrivate && authorizedView.checkInStatus
                    ? t.home.checkInOptions[authorizedView.checkInStatus].label
                    : '';
                summaryPreview = isMaskedReceived
                  ? t.notifications.neutralPreviewStatusBody
                  : authorizedView.isPrivate || !authorizedView.checkInStatus
                    ? formatTemplate(t.notifications.statusUpdatePrivateBody, {
                        sender: senderName,
                      })
                    : formatTemplate(
                        authorizedView.confirmationState === 'updated'
                          ? t.notifications.statusUpdateUpdatedBody
                          : t.notifications.statusUpdateConfirmedBody,
                        { sender: senderName, status: statusLabel }
                      );
              } else {
                const localizedSuggestion = t.care.suggestions[notif.suggestionId];
                summaryTitle = isMaskedReceived
                  ? t.notifications.neutralPreviewCareTitle
                  : notif.suggestionTitle || localizedSuggestion?.title || '';
                summaryPreview = isMaskedReceived
                  ? t.notifications.neutralPreviewCareBody
                  : notif.customMessage && notif.customMessage.length > 0
                    ? notif.customMessage
                    : notif.suggestionDefaultMessage || localizedSuggestion?.defaultMessage || '';
              }

              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    setDetailByPartner((prev) => ({
                      ...prev,
                      [partnerId]: {
                        kind: 'notification',
                        notificationId: notif.id,
                        returnCategory: isOrders ? 'orders' : 'care_updates',
                        direction: activeTab,
                      },
                    }));
                    setNotificationsSubView(partnerId, 'detail');
                  }}
                  className={`w-full text-left bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] hover:ring-1 hover:ring-[#E88C7D]/45 transition-all active:scale-[0.985] space-y-2 ${
                    isUnread ? 'ring-1 ring-[#E88C7D]/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[11px] text-[#85838D] min-w-0">
                      <span className="font-semibold text-[#292832]">{senderName}</span>
                      {' → '}
                      <span className="font-semibold text-[#292832]">{recipientName}</span>
                      {' · '}
                      <span>
                        {timePrefix} · {notif.timeLabel}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                        isUnread
                          ? 'bg-[#F5E8E7] text-[#C45E4E]'
                          : 'bg-[#EFEDF5] text-[#5B527E]'
                      }`}
                    >
                      {statusBadge}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-[14.5px] font-semibold text-[#292832] truncate">
                        {summaryTitle}
                      </h3>
                      <p className="text-[12px] text-[#85838D] line-clamp-2 mt-0.5 leading-snug">
                        {summaryPreview}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#85838D] shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Overview (Demo mode)
  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-[20px] font-semibold tracking-tight text-[#292832]">
            {t.ia.notifications.overviewTitle}
          </h1>
          <p className="text-[12.5px] text-[#85838D] mt-0.5">
            {t.ia.notifications.overviewSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNotificationsSubView(partnerId, 'settings')}
          className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white border border-[#E9E4DB] text-[11px] font-semibold text-[#292832] inline-flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#706794]" />
          <span>{t.ia.notifications.settingsShortcut}</span>
        </button>
      </div>

      {quietHoursActive && (
        <div
          role="status"
          className="rounded-2xl bg-[#EFEDF5]/85 border border-[#9B93B8]/25 px-3.5 py-2.5 text-[11.5px] text-[#5B527E] flex items-center gap-2"
        >
          <BellOff className="w-3.5 h-3.5 shrink-0" />
          <span className="leading-snug">
            {formatTemplate(t.notifications.quietHoursActiveBanner, {
              start: myNotifPrefs.quietStartTime,
              end: myNotifPrefs.quietEndTime,
            })}
          </span>
        </div>
      )}

      <section aria-label={t.ia.notifications.membershipSection.title}>
        <button
          type="button"
          onClick={() => setNotificationsSubView(partnerId, 'membership')}
          className={`w-full text-left rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] transition-all active:scale-[0.99] space-y-2 ${
            capabilities.isPremium
              ? 'bg-gradient-to-br from-[#FBF7F5] via-white to-[#EFEDF5] ring-1 ring-[#9B93B8]/35 hover:bg-white'
              : 'bg-gradient-to-br from-white via-[#FDFBFA] to-[#EFEDF5]/75 ring-1 ring-[#9B93B8]/25 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#EFEDF5] flex items-center justify-center shrink-0">
                <Crown
                  className={`w-4 h-4 ${
                    capabilities.isPremium ? 'text-[#E88C7D]' : 'text-[#706794]'
                  }`}
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-[#706794] truncate">
                  {t.ia.notifications.membershipSection.title}
                </div>
                <div className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
                  {capabilities.isPremium
                    ? t.profile.membershipUpgrade.premiumStatusTitle
                    : t.profile.membershipUpgrade.freeStatusTitle}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0">
              {t.profile.oneCouplePlanBadge}
            </span>
          </div>
          <p className="text-[11.5px] text-[#85838D] leading-snug">
            {capabilities.isPremium
              ? t.profile.membershipUpgrade.premiumStatusDesc
              : t.profile.membershipUpgrade.freeStatusDesc}
          </p>
          <div className="flex items-center justify-between pt-0.5 text-[11.5px] font-semibold text-[#5B527E]">
            <span>{t.ia.notifications.membershipSection.openCta}</span>
            <ChevronRight className="w-4 h-4 text-[#706794] shrink-0" />
          </div>
        </button>
      </section>

      <div className="space-y-3">
        <NotificationCategoryCard
          icon={<Calendar className="w-5 h-5 text-[#5B527E]" />}
          iconBgClass="bg-[#EFEDF5]"
          title={t.ia.notifications.categories.invitationsTitle}
          description={t.ia.notifications.categories.invitationsDesc}
          count={visibleInvitations.length}
          highlightBadge={
            pendingInvitationsCount > 0
              ? `${pendingInvitationsCount} ${t.notifications.newCountSuffix}`
              : undefined
          }
          onClick={() => setNotificationsSubView(partnerId, 'invitations')}
        />

        <NotificationCategoryCard
          icon={<Bell className="w-5 h-5 text-[#C45E4E]" />}
          iconBgClass="bg-[#F5E8E7]"
          title={t.ia.notifications.categories.careUpdatesTitle}
          description={t.ia.notifications.categories.careUpdatesDesc}
          count={receivedCareUpdates.length + sentCareUpdates.length}
          highlightBadge={
            unreadCareUpdates > 0
              ? `${unreadCareUpdates} ${t.notifications.newCountSuffix}`
              : undefined
          }
          onClick={() => {
            setActiveTab('received');
            setNotificationsSubView(partnerId, 'care_updates');
          }}
        />

        <NotificationCategoryCard
          icon={<Truck className="w-5 h-5 text-[#B87B3A]" />}
          iconBgClass="bg-[#FBF2E6]"
          title={t.ia.notifications.categories.ordersTitle}
          description={t.ia.notifications.categories.ordersDesc}
          count={receivedOrders.length + sentOrders.length}
          highlightBadge={
            unreadOrders > 0 ? `${unreadOrders} ${t.notifications.newCountSuffix}` : undefined
          }
          onClick={() => {
            setActiveTab('received');
            setNotificationsSubView(partnerId, 'orders');
          }}
        />

        <NotificationCategoryCard
          icon={<Heart className="w-5 h-5 text-[#3D5E49]" />}
          iconBgClass="bg-[#8FA89B]/20"
          title={t.ia.notifications.categories.momentsTitle}
          description={t.ia.notifications.categories.momentsDesc}
          count={windowCareMoments.length}
          highlightBadge={
            lockedOlderCount > 0 ? t.notifications.membershipLock.lockedArchiveBadge : undefined
          }
          onClick={() => setNotificationsSubView(partnerId, 'moments')}
        />
      </div>

      <section aria-label={t.ia.notifications.personalSettingsSection.title}>
        <button
          type="button"
          onClick={() => setNotificationsSubView(partnerId, 'settings')}
          className="w-full text-left rounded-[22px] bg-white/95 hover:bg-white p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] border border-[#292832]/[0.05] transition-all active:scale-[0.99] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={presentationBundle.partnerProfiles[partnerId].avatarUrl}
                alt={presentationBundle.partnerMeta[partnerId].display_name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover ring-1 ring-[#E88C7D]/35 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-[10.5px] font-semibold text-[#706794] truncate">
                  {t.ia.notifications.personalSettingsSection.title}
                </div>
                <div className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug truncate">
                  {presentationBundle.partnerMeta[partnerId].display_name}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[#3D5E49] bg-[#8FA89B]/20 px-2 py-0.5 rounded-lg shrink-0">
              {t.ia.notifications.personalSettingsSection.pairedBadge}
            </span>
          </div>
          <p className="text-[11.5px] text-[#85838D] leading-snug">
            {t.ia.notifications.personalSettingsSection.subtitle}
          </p>
          <div className="flex items-center justify-between pt-0.5 text-[11.5px] font-semibold text-[#5B527E]">
            <span>{t.ia.notifications.personalSettingsSection.openCta}</span>
            <ChevronRight className="w-4 h-4 text-[#706794] shrink-0" />
          </div>
        </button>
      </section>
    </div>
  );
}

export function NotificationsPage({ partnerId, scope = 'demo' }: NotificationsPageProps) {
  if (scope === 'normal') {
    return <NormalNotificationsContent />;
  }
  return <PresentationNotificationsContent partnerId={partnerId} />;
}
