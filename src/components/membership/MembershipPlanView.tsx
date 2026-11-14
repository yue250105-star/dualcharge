import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Crown,
  Lock,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { PremiumFeaturePreview } from '@/src/components/membership/PremiumFeaturePreview';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import {
  COUPLE_PROPOSED_PRICING,
  getMembershipCapabilities,
  MEMBERSHIP_COMPARISON_MATRIX,
} from '@/src/services/membershipService';
import {
  CoupleBillingPlan,
  CoupleMembershipState,
  SharingPreferences,
  WidgetPreviewStyle,
} from '@/src/types/dualcharge';

const WIDGET_STYLE_OPTIONS: WidgetPreviewStyle[] = [
  'shared_energy',
  'care_reminder',
  'daily_goal',
  'date_countdown',
];

export interface MembershipPlanViewProps {
  scope: 'demo' | 'normal';
  membership: CoupleMembershipState;
  isCoupleLinked: boolean;
  onBack: () => void;
  onLinkPartner?: () => void;
  onEnterDemo?: () => void;
  onConfirmUpgrade?: (plan: CoupleBillingPlan) => void;
  memberNames: { a: string; b: string; activatedBy?: string | null };
  widgetStyle?: WidgetPreviewStyle;
  onChangeWidgetStyle?: (style: WidgetPreviewStyle) => void;
  widgetSummaryData?: {
    meName: string;
    meEnergy: number;
    partnerName: string;
    partnerEnergy: number;
    partnerSharing: SharingPreferences;
  };
  showInlineBackButton?: boolean;
  t: TranslationDictionary;
}

export function MembershipPlanView({
  scope,
  membership,
  isCoupleLinked,
  onBack,
  onLinkPartner,
  onEnterDemo,
  onConfirmUpgrade,
  memberNames,
  widgetStyle = 'shared_energy',
  onChangeWidgetStyle,
  widgetSummaryData,
  showInlineBackButton = false,
  t,
}: MembershipPlanViewProps) {
  const [billingPlan, setBillingPlan] = useState<CoupleBillingPlan>(membership.plan);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [justUpgraded, setJustUpgraded] = useState(false);

  const capabilities = getMembershipCapabilities(membership, isCoupleLinked);
  const up = t.profile.membershipUpgrade;
  const isPremium = capabilities.isPremium;
  const activePrice =
    billingPlan === 'monthly'
      ? COUPLE_PROPOSED_PRICING.monthlyLabel
      : COUPLE_PROPOSED_PRICING.yearlyLabel;
  const activeUnit =
    billingPlan === 'monthly' ? t.profile.monthlyUnit : t.profile.yearlyUnit;

  const handleConfirmPurchase = () => {
    if (onConfirmUpgrade) {
      onConfirmUpgrade(billingPlan);
    }
    setShowPremiumModal(false);
    setJustUpgraded(true);
  };

  return (
    <div className="space-y-4 pb-2 relative">
      {showInlineBackButton && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[12px] font-semibold text-[#292832] transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.ia.notifications.membershipSection.backToNotifications}</span>
        </button>
      )}

      {justUpgraded && isPremium && (
        <div
          role="status"
          className="rounded-[22px] bg-gradient-to-r from-[#8FA89B]/25 via-[#8FA89B]/18 to-[#EFEDF5] border border-[#8FA89B]/45 p-3.5 flex items-start gap-2.5 text-[#284735]"
        >
          <Crown className="w-4 h-4 text-[#5B527E] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-[12.5px] font-bold">{up.welcomeBanner}</div>
            <p className="text-[11px] leading-snug text-[#3D5E49]">
              {up.premiumStatusDesc}
            </p>
          </div>
        </div>
      )}

      {/* 1. Current Membership Status */}
      <section
        aria-label={up.currentStatusLabel}
        className={`rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2 ${
          isPremium
            ? 'bg-gradient-to-br from-[#FBF7F5] via-white to-[#EFEDF5] ring-1 ring-[#9B93B8]/35'
            : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-[#706794]">
            {up.currentStatusLabel}
          </span>
          <span className="text-[10.5px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
            {t.profile.oneCouplePlanBadge}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Crown
            className={`w-4 h-4 shrink-0 ${
              isPremium ? 'text-[#E88C7D]' : 'text-[#85838D]'
            }`}
          />
          <h2 className="font-display text-[16px] font-semibold text-[#292832]">
            {isPremium ? up.premiumStatusTitle : up.freeStatusTitle}
          </h2>
        </div>

        <p className="text-[12px] text-[#85838D] leading-relaxed">
          {isPremium ? up.premiumStatusDesc : up.freeStatusDesc}
        </p>

        {isPremium && memberNames.activatedBy && (
          <div className="text-[11px] font-medium text-[#3D5E49] bg-[#8FA89B]/15 rounded-xl px-3 py-2 space-y-0.5">
            <div>
              {formatTemplate(up.purchasedByTemplate, {
                name: memberNames.activatedBy,
                date: membership.startDateISO ?? '',
                plan:
                  membership.plan === 'monthly'
                    ? t.profile.billingMonthlyLabel
                    : t.profile.billingYearlyLabel,
              })}
            </div>
            <div className="text-[10.5px] text-[#3D5E49]/85">{t.profile.managePlanNote}</div>
          </div>
        )}
      </section>

      {/* 2. Billing Cycle & Plan Cards */}
      <section aria-label={t.profile.membershipTitle} className="space-y-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl">
          <button
            type="button"
            onClick={() => setBillingPlan('monthly')}
            className={`min-h-[36px] rounded-xl text-[11.5px] font-semibold transition-all ${
              billingPlan === 'monthly'
                ? 'bg-white text-[#292832] shadow-sm'
                : 'text-[#85838D]'
            }`}
          >
            {t.profile.billingMonthlyLabel} · {COUPLE_PROPOSED_PRICING.monthlyLabel}
          </button>
          <button
            type="button"
            onClick={() => setBillingPlan('yearly')}
            className={`min-h-[36px] rounded-xl text-[11.5px] font-semibold transition-all ${
              billingPlan === 'yearly'
                ? 'bg-white text-[#292832] shadow-sm'
                : 'text-[#85838D]'
            }`}
          >
            {t.profile.billingYearlyLabel} · {COUPLE_PROPOSED_PRICING.yearlyLabel}
          </button>
        </div>

        {/* Free Plan Card */}
        <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.profile.freePlanTitle}
            </h3>
            <span className="font-display text-[14px] font-bold text-[#292832] tabular-nums">
              {t.profile.freePrice}{' '}
              <span className="text-[11px] font-normal text-[#85838D]">
                {t.profile.perMonth}
              </span>
            </span>
          </div>
          <ul className="space-y-1 text-[12px] text-[#85838D]">
            {t.profile.freeBenefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#8FA89B] shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Couple Premium Card */}
        <div className="bg-gradient-to-br from-white via-[#FDFBFA] to-[#EFEDF5]/75 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] ring-1 ring-[#9B93B8]/35 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
              <h3 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.profile.premiumPlanTitle}
              </h3>
            </div>
            <span className="font-display text-[13.5px] font-bold text-[#5B527E] tabular-nums">
              {activePrice}{' '}
              <span className="text-[11px] font-normal text-[#85838D]">
                {activeUnit}
              </span>
            </span>
          </div>

          <ul className="space-y-1 text-[12px] text-[#292832]/85">
            {t.profile.premiumBenefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#E88C7D] shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.05] px-3 py-2 text-[10.5px] text-[#85838D] space-y-0.5">
            {billingPlan === 'yearly' && (
              <div className="font-semibold text-[#5B527E]">{t.profile.yearlySavingsNote}</div>
            )}
            <div>{up.illustrativePricingLabel}</div>
          </div>

          {/* Upgrade / Unpaired Guard / Normal Prototype Action */}
          {scope === 'demo' ? (
            isPremium ? (
              <div className="w-full min-h-[42px] px-3 rounded-2xl bg-[#8FA89B]/20 text-[#3D5E49] text-[12px] font-semibold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>{t.profile.premiumActiveBadge}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPremiumModal(true)}
                className="w-full min-h-[44px] px-3 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_8px_20px_-8px_rgba(232,140,125,0.65)] transition-all active:scale-95"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <span>{formatTemplate(up.selectedPlanBtn, { price: activePrice })}</span>
              </button>
            )
          ) : !capabilities.canPurchaseCouplePremium ? (
            <div className="rounded-2xl bg-[#FBF2E6] border border-[#E5C89E]/55 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#6E4F28]">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>{up.unpairedGuardTitle}</span>
              </div>
              <p className="text-[11px] text-[#6E4F28]/90 leading-snug">
                {up.unpairedGuardBody}
              </p>
              <button
                type="button"
                onClick={onLinkPartner ?? onBack}
                className="min-h-[36px] px-3 rounded-xl bg-white text-[#292832] text-[11px] font-semibold border border-[#292832]/10 active:scale-95 transition-all"
              >
                {up.unpairedGuardLinkBtn}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#EFEDF5]/75 p-3 space-y-2">
              <p className="text-[11px] text-[#5B527E] leading-snug">
                {up.normalModePrototypeNote}
              </p>
              {onEnterDemo && (
                <button
                  type="button"
                  onClick={onEnterDemo}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{t.normalMode.enterPresentationDemo}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Detailed 12-Row Feature Comparison Table */}
      <section
        aria-label={up.comparisonTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div>
          <h3 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {up.comparisonTitle}
          </h3>
          <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
            {up.comparisonSubtitle}
          </p>
        </div>

        <div className="space-y-2">
          {MEMBERSHIP_COMPARISON_MATRIX.map((row) => {
            const copy = up.matrixRows[row.id];
            const accessBadge = up.accessBadges[row.accessKind];
            const badgeStyle =
              row.accessKind === 'free_included'
                ? 'bg-[#8FA89B]/18 text-[#3D5E49]'
                : row.accessKind === 'premium_enhanced'
                  ? 'bg-[#EFEDF5] text-[#5B527E]'
                  : 'bg-[#F5E8E7] text-[#B45A4C]';

            return (
              <div
                key={row.id}
                className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12px] font-semibold text-[#292832] leading-snug">
                    {copy.label}
                  </span>
                  <span
                    className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${badgeStyle}`}
                  >
                    {accessBadge}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                  <div className="rounded-xl bg-white px-2.5 py-1.5 border border-[#292832]/[0.04]">
                    <div className="text-[9.5px] font-medium text-[#85838D]">{up.colFree}</div>
                    <div className="font-medium text-[#292832]/85 mt-0.5 leading-snug">
                      {copy.free}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#EFEDF5]/50 px-2.5 py-1.5 border border-[#9B93B8]/20">
                    <div className="text-[9.5px] font-medium text-[#5B527E]">
                      {up.colPremium}
                    </div>
                    <div className="font-semibold text-[#292832] mt-0.5 leading-snug">
                      {copy.premium}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Couple Widget Preview (Locked on Free, Interactive on Couple Premium) */}
      {capabilities.canUseCoupleWidgets && widgetSummaryData && onChangeWidgetStyle ? (
        <section
          aria-label={t.profile.widgetPreviewTitle}
          className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
        >
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#E88C7D]" strokeWidth={2} />
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.profile.widgetPreviewTitle}
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
              {t.profile.widgetPreviewBadge}
            </span>
          </div>
          <p className="text-[11.5px] text-[#85838D] leading-snug">{t.profile.widgetPreviewDesc}</p>

          <div className="flex flex-wrap gap-1.5">
            {WIDGET_STYLE_OPTIONS.map((styleKey) => {
              const active = widgetStyle === styleKey;
              return (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() => onChangeWidgetStyle(styleKey)}
                  className={`min-h-[30px] px-2.5 py-1 rounded-xl text-[10.5px] font-semibold transition-all ${
                    active
                      ? 'bg-[#292832] text-white'
                      : 'bg-[#F4EFEA] text-[#85838D] hover:text-[#292832]'
                  }`}
                >
                  {t.profile.widgetStyles[styleKey]}
                </button>
              );
            })}
          </div>

          <div className="rounded-[20px] bg-gradient-to-br from-[#FBF7F5] via-white to-[#EFEDF5] p-3.5 border border-[#9B93B8]/25 shadow-inner space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#706794]">
              <span>DualCharge · {t.profile.widgetStyles[widgetStyle]}</span>
              <Lock className="w-3 h-3 text-[#8FA89B]" />
            </div>

            {widgetStyle === 'shared_energy' && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div>
                  <div className="text-[13px] font-bold text-[#292832]">
                    {widgetSummaryData.meName}: {widgetSummaryData.meEnergy}/100
                  </div>
                  <div className="text-[11px] text-[#85838D]">
                    {widgetSummaryData.partnerSharing.energy
                      ? `${widgetSummaryData.partnerName}: ${widgetSummaryData.partnerEnergy}/100`
                      : `${widgetSummaryData.partnerName}: ${t.home.sharingPaused}`}
                  </div>
                </div>
                <span className="text-[10.5px] font-medium text-[#5B527E] bg-white/80 px-2 py-1 rounded-xl">
                  {t.profile.widgetMockCopy.sharedEnergySub}
                </span>
              </div>
            )}

            {widgetStyle === 'care_reminder' && (
              <div>
                <div className="text-[13px] font-bold text-[#292832]">
                  {t.profile.widgetMockCopy.careReminderTitle}
                </div>
                <div className="text-[11px] text-[#85838D]">
                  {t.profile.widgetMockCopy.careReminderSub}
                </div>
              </div>
            )}

            {widgetStyle === 'daily_goal' && (
              <div>
                <div className="text-[13px] font-bold text-[#292832]">
                  {t.profile.widgetMockCopy.dailyGoalTitle}
                </div>
                <div className="text-[11px] text-[#85838D]">
                  {t.profile.widgetMockCopy.dailyGoalSub}
                </div>
              </div>
            )}

            {widgetStyle === 'date_countdown' && (
              <div>
                <div className="text-[13px] font-bold text-[#292832]">
                  {t.profile.widgetMockCopy.dateCountdownTitle}
                </div>
                <div className="text-[11px] text-[#85838D]">
                  {t.profile.widgetMockCopy.dateCountdownSub}
                </div>
              </div>
            )}

            <div className="text-[10px] text-[#85838D] pt-1 border-t border-[#292832]/[0.05]">
              {t.profile.widgetMockCopy.sensitiveHiddenNote}
            </div>
          </div>
        </section>
      ) : (
        <PremiumFeaturePreview
          badgeLabel={t.profile.widgetPreviewBadge}
          title={up.widgetLockedTitle}
          description={up.widgetLockedDesc}
          benefits={up.widgetLockedBenefits}
          upgradeLabel={up.upgradeCta}
          onUpgrade={
            scope === 'demo' ? () => setShowPremiumModal(true) : onEnterDemo ?? onBack
          }
        />
      )}

      {/* Review Upgrade & Confirm Simulated Purchase Modal (Demo Mode) */}
      {scope === 'demo' && showPremiumModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-modal-title"
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#292832]/30 backdrop-blur-[2px] p-3"
        >
          <div className="w-full bg-white/95 backdrop-blur-[10px] rounded-[24px] p-4 shadow-xl border border-white space-y-3 max-h-[90%] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#9B93B8]" />
                <h3
                  id="premium-modal-title"
                  className="font-display text-[15px] font-semibold text-[#292832]"
                >
                  {up.reviewModalTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                aria-label={t.profile.closePreview}
                className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[#85838D] hover:bg-[#F4EFEA] active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.06] divide-y divide-[#292832]/[0.05] text-[12px]">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[#85838D]">{up.reviewPlanLabel}</span>
                <span className="font-semibold text-[#292832]">{t.profile.premiumPlanTitle}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[#85838D]">{up.reviewBillingLabel}</span>
                <span className="font-semibold text-[#292832]">
                  {billingPlan === 'monthly'
                    ? t.profile.billingMonthlyLabel
                    : t.profile.billingYearlyLabel}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[#85838D]">{up.reviewPriceLabel}</span>
                <span className="font-bold text-[#5B527E]">
                  {billingPlan === 'monthly'
                    ? COUPLE_PROPOSED_PRICING.monthlyLabel
                    : COUPLE_PROPOSED_PRICING.yearlyLabel}{' '}
                  <span className="text-[11px] font-normal text-[#85838D]">
                    {billingPlan === 'monthly' ? t.profile.monthlyUnit : t.profile.yearlyUnit}
                  </span>
                </span>
              </div>
              <div className="px-3 py-2.5 space-y-0.5">
                <div className="text-[11px] text-[#85838D]">{up.reviewSharedLabel}</div>
                <div className="font-semibold text-[#3D5E49]">
                  {formatTemplate(up.reviewSharedValue, {
                    a: memberNames.a,
                    b: memberNames.b,
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F4EFEA]/80 p-2.5 text-[11px] text-[#85838D] leading-snug">
              {up.reviewNoPaymentNote}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="min-h-[42px] px-4 rounded-2xl bg-[#F4EFEA] text-[#292832] text-[12px] font-semibold active:scale-95 transition-transform"
              >
                {t.meta.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                className="flex-1 min-h-[42px] px-3 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12px] font-semibold transition-all duration-200 active:scale-95"
              >
                {up.confirmPurchaseBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
