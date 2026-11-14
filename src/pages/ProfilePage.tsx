import React, { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Globe,
  Home,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { PremiumFeaturePreview } from '@/src/components/membership/PremiumFeaturePreview';
import { UserAvatar } from '@/src/components/ui/UserAvatar';
import {
  NORMAL_LOCAL_INVITE_CODE,
  PRESENTATION_PAIRING_CODE,
  useDualCharge,
} from '@/src/context/DualChargeContext';
import { createDefaultNotificationPreferences } from '@/src/data/presentation/presentationConstants';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import {
  COUPLE_PROPOSED_PRICING,
  getMembershipCapabilities,
  MEMBERSHIP_COMPARISON_MATRIX,
} from '@/src/services/membershipService';
import { sortSavedSuggestionsNewestFirst } from '@/src/services/savedSuggestionsStore';
import { AiCareSavedItem, LearnedPreferenceProfile } from '@/src/types/aiCare';
import {
  CoupleBillingPlan,
  CoupleMembershipState,
  LanguageCode,
  NotificationFrequencyPreference,
  NotificationPreferences,
  PartnerId,
  SensitivePreviewMode,
  SharingPreferences,
  SharingPrefKey,
  WidgetPreviewStyle,
} from '@/src/types/dualcharge';

interface ProfilePageProps {
  partnerId: PartnerId;
  scope?: 'demo' | 'normal';
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle?: () => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled = false,
  onToggle,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className={`text-[13px] font-medium ${disabled ? 'text-[#85838D]' : 'text-[#292832]'}`}>
          {label}
        </div>
        <div className="text-[11px] text-[#85838D] leading-snug mt-0.5">{description}</div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline-2 focus-visible:outline-[#E88C7D] ${
          disabled
            ? 'bg-[#F4EFEA] cursor-not-allowed'
            : checked
              ? 'bg-[#8FA89B]'
              : 'bg-[#292832]/15'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[24px]' : 'translate-x-[4px]'
          }`}
        />
      </button>
    </div>
  );
}

const LANGUAGE_OPTIONS: LanguageCode[] = ['en', 'zh-CN', 'zh-TW'];
const FREQUENCY_OPTIONS: NotificationFrequencyPreference[] = [
  'low',
  'standard',
  'important_only',
];
const PREVIEW_MODE_OPTIONS: SensitivePreviewMode[] = ['full', 'neutral'];
const WIDGET_STYLE_OPTIONS: WidgetPreviewStyle[] = [
  'shared_energy',
  'care_reminder',
  'daily_goal',
  'date_countdown',
];

function formatSavedDate(iso: string, language: LanguageCode): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const locale = language === 'zh-CN' ? 'zh-CN' : language === 'zh-TW' ? 'zh-TW' : 'en-US';
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function NotificationPreferencesSection({
  prefs,
  onUpdate,
  canUseAdvancedNotifications,
  onUpgrade,
  t,
}: {
  prefs: NotificationPreferences;
  onUpdate: (patch: Partial<NotificationPreferences>) => void;
  canUseAdvancedNotifications: boolean;
  onUpgrade: () => void;
  t: TranslationDictionary;
}) {
  return (
    <section
      aria-label={t.profile.notifPrefsTitle}
      className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
    >
      <div>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.notifPrefsTitle}
          </h2>
        </div>
        <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
          {t.profile.notifPrefsDesc}
        </p>
      </div>

      {/* Essential Daily Status Sharing always stays Free */}
      <div className="divide-y divide-[#292832]/[0.05]">
        <ToggleRow
          label={t.profile.shareStatusNotifsLabel}
          description={t.profile.shareStatusNotifsDesc}
          checked={prefs.shareStatusNotifications}
          onToggle={() =>
            onUpdate({ shareStatusNotifications: !prefs.shareStatusNotifications })
          }
        />

        <ToggleRow
          label={t.profile.quietHoursToggle}
          description={t.profile.quietHoursDesc}
          checked={canUseAdvancedNotifications && prefs.quietHoursEnabled}
          disabled={!canUseAdvancedNotifications}
          onToggle={() =>
            canUseAdvancedNotifications &&
            onUpdate({ quietHoursEnabled: !prefs.quietHoursEnabled })
          }
        />

        {canUseAdvancedNotifications && prefs.quietHoursEnabled && (
          <div className="py-2.5 grid grid-cols-2 gap-2">
            <label className="text-[11px] text-[#85838D] space-y-1">
              <span>{t.profile.quietStartLabel}</span>
              <input
                type="time"
                value={prefs.quietStartTime}
                onChange={(e) => onUpdate({ quietStartTime: e.target.value })}
                className="w-full min-h-[36px] px-2.5 rounded-xl bg-[#FDFBFA] border border-[#292832]/10 text-[12px] text-[#292832]"
              />
            </label>
            <label className="text-[11px] text-[#85838D] space-y-1">
              <span>{t.profile.quietEndLabel}</span>
              <input
                type="time"
                value={prefs.quietEndTime}
                onChange={(e) => onUpdate({ quietEndTime: e.target.value })}
                className="w-full min-h-[36px] px-2.5 rounded-xl bg-[#FDFBFA] border border-[#292832]/10 text-[12px] text-[#292832]"
              />
            </label>
          </div>
        )}

        <ToggleRow
          label={t.profile.allowImportantQuietLabel}
          description={t.profile.allowImportantQuietDesc}
          checked={canUseAdvancedNotifications ? prefs.allowImportantDuringQuietHours : true}
          disabled={!canUseAdvancedNotifications}
          onToggle={() =>
            canUseAdvancedNotifications &&
            onUpdate({
              allowImportantDuringQuietHours: !prefs.allowImportantDuringQuietHours,
            })
          }
        />
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="text-[11.5px] font-medium text-[#292832]">
          {t.profile.frequencyLabel}
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F4EFEA] rounded-2xl">
          {FREQUENCY_OPTIONS.map((freq) => {
            const active = prefs.frequency === freq;
            const isLocked = !canUseAdvancedNotifications && freq === 'low';
            return (
              <button
                key={freq}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && onUpdate({ frequency: freq })}
                className={`min-h-[34px] px-1.5 rounded-xl text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 ${
                  isLocked
                    ? 'text-[#85838D]/65 cursor-not-allowed'
                    : active
                      ? 'bg-white text-[#292832] shadow-sm'
                      : 'text-[#85838D]'
                }`}
              >
                {isLocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                <span>{t.profile.frequencyOptions[freq]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11.5px] font-medium text-[#292832]">
            {t.profile.sensitivePreviewLabel}
          </div>
          {!canUseAdvancedNotifications && (
            <Lock className="w-3 h-3 text-[#706794]" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl">
          {PREVIEW_MODE_OPTIONS.map((mode) => {
            const active = prefs.sensitivePreview === mode;
            const isLocked = !canUseAdvancedNotifications && mode === 'neutral';
            return (
              <button
                key={mode}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && onUpdate({ sensitivePreview: mode })}
                className={`min-h-[34px] px-2 rounded-xl text-[10.5px] font-semibold transition-all flex items-center justify-center gap-1 ${
                  isLocked
                    ? 'text-[#85838D]/65 cursor-not-allowed'
                    : active
                      ? 'bg-white text-[#292832] shadow-sm'
                      : 'text-[#85838D]'
                }`}
              >
                {isLocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                <span className="truncate">{t.profile.sensitivePreviewOptions[mode]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!canUseAdvancedNotifications && (
        <div className="rounded-2xl bg-[#EFEDF5]/75 border border-[#9B93B8]/25 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#5B527E]">
            <Lock className="w-3 h-3 shrink-0" />
            <span>{t.profile.membershipUpgrade.notifAdvancedLockedBadge}</span>
          </div>
          <div className="text-[12px] font-semibold text-[#292832]">
            {t.profile.membershipUpgrade.notifAdvancedLockedTitle}
          </div>
          <p className="text-[11px] text-[#85838D] leading-snug">
            {t.profile.membershipUpgrade.notifAdvancedLockedDesc}
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            className="min-h-[34px] px-3 rounded-xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Crown className="w-3 h-3" />
            <span>{t.profile.membershipUpgrade.upgradeCta}</span>
          </button>
        </div>
      )}
    </section>
  );
}

function SavedSuggestionsLibrarySection({
  savedItems,
  onRemove,
  onReuse,
  onGoToCare,
  partnerName,
  t,
  language,
}: {
  savedItems: AiCareSavedItem[];
  onRemove: (id: string) => void;
  onReuse?: (item: AiCareSavedItem) => void;
  onGoToCare: () => void;
  partnerName: string;
  t: TranslationDictionary;
  language: LanguageCode;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reusedToast, setReusedToast] = useState<string | null>(null);
  const sortedItems = sortSavedSuggestionsNewestFirst(savedItems);

  return (
    <section
      aria-label={t.profile.savedLibraryTitle}
      className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#E88C7D]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.profile.savedLibraryTitle}
            </h2>
          </div>
          <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
            {formatTemplate(t.profile.savedLibraryDesc, { count: sortedItems.length })}
          </p>
        </div>
        <span className="text-[11px] font-mono-tabular font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg shrink-0">
          {sortedItems.length}
        </span>
      </div>

      {reusedToast && (
        <div
          role="status"
          className="rounded-2xl bg-[#8FA89B]/18 px-3 py-2 text-[11.5px] text-[#3D5E49] flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{reusedToast}</span>
        </div>
      )}

      {sortedItems.length === 0 ? (
        <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3.5 space-y-2.5">
          <p className="text-[12px] text-[#85838D] leading-relaxed">{t.profile.savedEmptyText}</p>
          <button
            type="button"
            onClick={onGoToCare}
            className="min-h-[38px] px-3.5 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11.5px] font-semibold transition-all active:scale-95"
          >
            {t.profile.goToCareBtn}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const categoryLabel = t.care.aiEngine.categories[item.category] ?? item.category;
            const sourceLabel = t.profile.sourceLabels[item.source] ?? item.source;
            const savedDateText = formatSavedDate(item.savedAtISO, language);

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.06] p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
                        {categoryLabel}
                      </span>
                      <span className="text-[10px] font-medium text-[#85838D] bg-white border border-[#292832]/[0.06] px-2 py-0.5 rounded-lg">
                        {sourceLabel}
                      </span>
                    </div>
                    <h3 className="font-display text-[13.5px] font-semibold text-[#292832] leading-snug">
                      {item.title}
                    </h3>
                    {savedDateText && (
                      <div className="text-[10.5px] text-[#85838D] mt-0.5">
                        {t.profile.savedOnLabel} {savedDateText}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-[#292832]/[0.06] space-y-1.5 text-[11.5px] text-[#292832]/85">
                    {item.why && (
                      <p className="leading-snug">
                        <span className="font-semibold text-[#292832]">
                          {t.care.aiEngine.whyLabel}{' '}
                        </span>
                        {item.why}
                      </p>
                    )}
                    {item.action && (
                      <p className="leading-snug">
                        <span className="font-semibold text-[#292832]">
                          {t.care.aiEngine.whatLabel}{' '}
                        </span>
                        {item.action}
                      </p>
                    )}
                    {item.suggestedTiming && (
                      <p className="leading-snug text-[#85838D]">
                        <span className="font-semibold text-[#292832]/80">
                          {t.care.aiEngine.whenLabel}{' '}
                        </span>
                        {item.suggestedTiming}
                      </p>
                    )}
                    {item.personalizationReason && (
                      <p className="leading-snug text-[#706794]">
                        <span className="font-semibold">{t.care.aiEngine.personalizationLabel} </span>
                        {item.personalizationReason}
                      </p>
                    )}
                    {item.defaultMessage && (
                      <div className="rounded-xl bg-white border border-[#292832]/[0.05] px-2.5 py-2 text-[11px] text-[#292832]/85 italic">
                        “{item.defaultMessage}”
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-1.5 pt-0.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="min-h-[32px] px-2.5 rounded-xl bg-white hover:bg-[#F4EFEA] border border-[#292832]/[0.06] text-[11px] font-medium text-[#5B527E] inline-flex items-center gap-1 transition-all active:scale-95"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    <span>{isExpanded ? t.profile.hideDetailsBtn : t.profile.viewDetailsBtn}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {onReuse && (
                      <button
                        type="button"
                        onClick={() => {
                          onReuse(item);
                          setReusedToast(
                            formatTemplate(t.profile.reusedCareToast, {
                              title: item.title,
                              partner: partnerName,
                            })
                          );
                        }}
                        className="min-h-[32px] px-2.5 rounded-xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-all active:scale-95"
                      >
                        <Send className="w-3 h-3" />
                        <span>{t.profile.reuseCareBtn}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="min-h-[32px] px-2.5 rounded-xl bg-white hover:bg-[#F5E8E7] text-[#85838D] hover:text-[#8E4D42] text-[11px] font-medium inline-flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t.profile.removeSavedBtn}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LearnedPreferencesSection({
  profile,
  canUseAdvancedLearning,
  onUpgrade,
  onClear,
  t,
}: {
  profile: LearnedPreferenceProfile;
  canUseAdvancedLearning: boolean;
  onUpgrade: () => void;
  onClear: () => void;
  t: TranslationDictionary;
}) {
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClear = () => {
    onClear();
    setClearedNotice(true);
  };

  return (
    <section
      aria-label={t.profile.learnedProfileTitle}
      className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.profile.learnedProfileTitle}
            </h2>
          </div>
          <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
            {t.profile.learnedProfileDesc}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.05] p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-[#85838D]">
            {t.profile.learningMaturityLabel}
          </span>
          <span className="text-[11px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2.5 py-0.5 rounded-lg">
            {t.care.aiEngine.maturityLabels[profile.learningMaturity]}
          </span>
        </div>
        <p className="text-[11.5px] text-[#292832]/85 leading-snug">
          {t.profile.maturityDescriptions[profile.learningMaturity]}
        </p>
        <div className="text-[11px] font-medium text-[#85838D] pt-0.5">
          {formatTemplate(t.profile.feedbackCountsLabel, {
            total: profile.totalFeedbackCount,
            positive: profile.positiveFeedbackCount,
            negative: profile.negativeFeedbackCount,
          })}
        </div>
      </div>

      {profile.totalFeedbackCount === 0 ? (
        <p className="text-[11.5px] text-[#85838D] leading-snug">{t.profile.noLearnedDataYet}</p>
      ) : canUseAdvancedLearning ? (
        <div className="space-y-2">
          {profile.preferredCategories.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-[#85838D]">
                {t.profile.preferredCategoriesLabel}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferredCategories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 rounded-xl bg-[#8FA89B]/18 text-[#284735] text-[11px] font-medium"
                  >
                    {t.care.aiEngine.categories[cat] ?? cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.preferredCommunicationStyles.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-[#85838D]">
                {t.profile.preferredStylesLabel}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferredCommunicationStyles.map((style) => (
                  <span
                    key={style}
                    className="px-2.5 py-1 rounded-xl bg-[#EFEDF5] text-[#5B527E] text-[11px] font-medium"
                  >
                    {t.care.aiEngine.communicationStyles[style] ?? style}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#EFEDF5]/70 border border-[#9B93B8]/25 p-3 space-y-2">
          <div className="flex items-start gap-2 text-[11.5px] text-[#5B527E] leading-snug">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{t.profile.membershipUpgrade.learnedAdvancedLockedNote}</span>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="min-h-[34px] px-3 rounded-xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Crown className="w-3 h-3" />
            <span>{t.profile.membershipUpgrade.upgradeCta}</span>
          </button>
        </div>
      )}

      {clearedNotice && (
        <div
          role="status"
          className="rounded-2xl bg-[#8FA89B]/18 px-3 py-2 text-[11.5px] text-[#3D5E49] flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{t.profile.clearLearnedDone}</span>
        </div>
      )}

      {profile.totalFeedbackCount > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="min-h-[36px] px-3 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[11.5px] font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.profile.clearLearnedBtn}</span>
        </button>
      )}
    </section>
  );
}

interface MembershipComparisonViewProps {
  scope: 'demo' | 'normal';
  membership: CoupleMembershipState;
  isCoupleLinked: boolean;
  billingPlan: CoupleBillingPlan;
  onChangeBillingPlan: (plan: CoupleBillingPlan) => void;
  onBack: () => void;
  onOpenReviewModal: () => void;
  onEnterDemo?: () => void;
  justUpgraded: boolean;
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
  t: TranslationDictionary;
}

function MembershipComparisonView({
  scope,
  membership,
  isCoupleLinked,
  billingPlan,
  onChangeBillingPlan,
  onBack,
  onOpenReviewModal,
  onEnterDemo,
  justUpgraded,
  memberNames,
  widgetStyle = 'shared_energy',
  onChangeWidgetStyle,
  widgetSummaryData,
  t,
}: MembershipComparisonViewProps) {
  const capabilities = getMembershipCapabilities(membership, isCoupleLinked);
  const up = t.profile.membershipUpgrade;
  const isPremium = capabilities.isPremium;
  const activePrice =
    billingPlan === 'monthly'
      ? COUPLE_PROPOSED_PRICING.monthlyLabel
      : COUPLE_PROPOSED_PRICING.yearlyLabel;
  const activeUnit =
    billingPlan === 'monthly' ? t.profile.monthlyUnit : t.profile.yearlyUnit;

  return (
    <div className="space-y-4 pb-2">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[12px] font-semibold text-[#292832] transition-all active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{up.backToProfile}</span>
      </button>

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

      {/* Billing Cycle & Plan Cards */}
      <section aria-label={t.profile.membershipTitle} className="space-y-3">
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F4EFEA] rounded-2xl">
          <button
            type="button"
            onClick={() => onChangeBillingPlan('monthly')}
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
            onClick={() => onChangeBillingPlan('yearly')}
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
                onClick={onOpenReviewModal}
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
                onClick={onBack}
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

      {/* Couple Widget Preview (Locked on Free, Interactive on Couple Premium) */}
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
          onUpgrade={scope === 'demo' ? onOpenReviewModal : onEnterDemo ?? onBack}
        />
      )}
    </div>
  );
}

function NormalProfileContent() {
  const {
    language,
    setLanguage,
    t,
    normalUser,
    normalPairing,
    normalPreferences,
    normalBaseline,
    normalInteractions,
    normalLearnedProfile,
    normalProfileSubView,
    setNormalProfileSubView,
    setNormalActivePage,
    pairNormalLocalPartner,
    toggleNormalSharing,
    updateNormalNotificationPrefs,
    addNormalCustomPreference,
    removeNormalCustomPreference,
    removeNormalPresetPreference,
    removeNormalSavedSuggestion,
    reuseNormalSavedSuggestion,
    clearNormalLearnedPreferences,
    enterPresentationDemo,
    returnToWelcome,
    resetNormalAccount,
  } = useDualCharge();

  const displayName = normalUser.nickname || 'You';
  const partnerDisplayName = t.normalMode.partnerDisplayName;
  const mySharing = normalUser.sharingConsent;
  const myNotifPrefs =
    normalInteractions.notificationPrefs ?? createDefaultNotificationPreferences();
  const isCoupleLinked = normalPairing.status === 'paired_simulated';
  const normalMembership: CoupleMembershipState = {
    tier: 'free',
    plan: 'monthly',
    startDateISO: null,
    purchasedBy: null,
    isSimulated: true,
  };
  const normalCapabilities = getMembershipCapabilities(normalMembership, isCoupleLinked);

  const [newTagInput, setNewTagInput] = useState('');
  const [billingPlan, setBillingPlan] = useState<CoupleBillingPlan>('monthly');
  const [showResetNormalConfirm, setShowResetNormalConfirm] = useState(false);
  const [sharingNotice, setSharingNotice] = useState<string | null>(null);

  const handleToggleSharing = (key: SharingPrefKey, label: string) => {
    const nextState = !mySharing[key];
    toggleNormalSharing(key);
    setSharingNotice(
      formatTemplate(
        nextState ? t.profile.sharingFeedbackOn : t.profile.sharingFeedbackOff,
        { label, partner: partnerDisplayName }
      )
    );
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    addNormalCustomPreference(newTagInput);
    setNewTagInput('');
  };

  return (
    <div className="space-y-4 pb-2 relative">
      {/* Sub-view Bar: My Profile | Premium Membership */}
      <div
        role="tablist"
        aria-label={t.profile.membershipTitle}
        className="grid grid-cols-2 gap-1 p-1 bg-[#EFEDF5]/80 rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={normalProfileSubView === 'main'}
          onClick={() => setNormalProfileSubView('main')}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 px-2 ${
            normalProfileSubView === 'main'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {t.profile.membershipUpgrade.subTabMain}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={normalProfileSubView === 'premium'}
          onClick={() => setNormalProfileSubView('premium')}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
            normalProfileSubView === 'premium'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-[#9B93B8]" />
          <span className="truncate">{t.profile.membershipUpgrade.subTabMembership}</span>
        </button>
      </div>

      {normalProfileSubView === 'premium' ? (
        <MembershipComparisonView
          scope="normal"
          membership={normalMembership}
          isCoupleLinked={isCoupleLinked}
          billingPlan={billingPlan}
          onChangeBillingPlan={setBillingPlan}
          onBack={() => setNormalProfileSubView('main')}
          onOpenReviewModal={() => {}}
          onEnterDemo={enterPresentationDemo}
          justUpgraded={false}
          memberNames={{ a: displayName, b: partnerDisplayName }}
          t={t}
        />
      ) : (
        <>
          {/* 1. Personal Information */}
      <section
        aria-label={displayName}
        className="bg-white/85 backdrop-blur-[10px] ring-1 ring-white/80 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] flex items-center gap-3.5"
      >
        <UserAvatar
          avatarId={normalUser.avatarId}
          name={displayName}
          sizeClass="w-14 h-14"
          textSizeClass="text-[20px]"
        />
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-semibold text-[#292832] leading-tight truncate">
            {displayName}
          </h1>
          <div className="text-[12px] text-[#85838D] mt-0.5">
            {formatTemplate(t.normalMode.personalRoleLabel, {
              day: normalBaseline.currentDayNumber,
            })}
          </div>
          <div className="text-[11px] text-[#706794] font-medium mt-0.5">
            {formatTemplate(t.normalMode.recordedDaysProgress, {
              count: normalBaseline.recordedDaysCount,
              target: normalBaseline.progressTargetDays,
            })}
          </div>
        </div>
      </section>

      {/* 1b. Connected Health Data (Honest Disconnected State in Normal Mode) */}
      <section
        aria-label={t.profile.connectedHealthTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#8FA89B]" strokeWidth={2} />
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.connectedHealthTitle}
          </h2>
        </div>

        <div className="divide-y divide-[#292832]/[0.05] text-[12px]">
          <div className="flex items-center justify-between py-2 first:pt-0">
            <span className="text-[#85838D]">{t.profile.connectionLabel}</span>
            <span className="font-semibold text-[#85838D]">{t.profile.statusDisconnected}</span>
          </div>
          <div className="flex items-center justify-between py-2 last:pb-0">
            <span className="text-[#85838D]">{t.profile.permissionLabel}</span>
            <span className="font-medium text-[#85838D]">{t.profile.permissionNone}</span>
          </div>
        </div>

        <p className="text-[11px] text-[#85838D] bg-[#FDFBFA] rounded-2xl p-2.5 border border-[#292832]/[0.04]">
          {t.profile.normalHealthEmptyNote}
        </p>
      </section>

      {/* 2. Couple Connection */}
      <section
        aria-label={t.profile.coupleSettingsTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#E88C7D]" strokeWidth={2} />
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.coupleSettingsTitle}
          </h2>
        </div>

        <div className="divide-y divide-[#292832]/[0.05] text-[12.5px]">
          <div className="flex items-center justify-between py-2 first:pt-0">
            <span className="text-[#85838D]">{t.profile.partnerName}</span>
            <span className="font-semibold text-[#292832]">{partnerDisplayName}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#85838D]">{t.onboarding.step2.inviteCodeLabel}</span>
            <span className="font-mono-tabular text-[12px] font-medium text-[#292832]">
              {normalPairing.inviteCode || NORMAL_LOCAL_INVITE_CODE}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 last:pb-0">
            <span className="text-[#85838D]">{t.profile.connectionStatus}</span>
            <span
              className={`font-semibold ${
                normalPairing.status === 'paired_simulated' ? 'text-[#3D5E49]' : 'text-[#85838D]'
              }`}
            >
              {normalPairing.status === 'paired_simulated'
                ? formatTemplate(t.normalMode.pairedStatusValue, {
                    code: normalPairing.inviteCode,
                  })
                : t.normalMode.unpairedStatusValue}
            </span>
          </div>
        </div>

        {normalPairing.status === 'unpaired' && (
          <div className="pt-1 space-y-2">
            <p className="text-[11px] text-[#85838D] leading-snug">
              {t.normalMode.pairLaterActionHint}
            </p>
            <button
              type="button"
              onClick={() => pairNormalLocalPartner(normalPairing.inviteCode)}
              className="w-full min-h-[40px] px-3 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {formatTemplate(t.normalMode.simulatePartnerJoinNow, {
                  code: normalPairing.inviteCode || NORMAL_LOCAL_INVITE_CODE,
                })}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* 3. Privacy & Data Sharing */}
      <section
        aria-label={t.profile.dataSharingTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8FA89B]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.profile.dataSharingTitle}
            </h2>
          </div>
          <p className="text-[11.5px] text-[#85838D] mt-1 leading-relaxed">
            {formatTemplate(t.profile.dataSharingDesc, { partner: partnerDisplayName })}
          </p>
        </div>

        <div className="divide-y divide-[#292832]/[0.05]">
          <ToggleRow
            label={t.profile.energySummaryTitle}
            description={t.profile.energySummaryDesc}
            checked={mySharing.energy}
            onToggle={() => handleToggleSharing('energy', t.profile.energySummaryTitle)}
          />
          <ToggleRow
            label={t.profile.sleepSummaryTitle}
            description={t.profile.sleepSummaryDesc}
            checked={mySharing.sleep}
            onToggle={() => handleToggleSharing('sleep', t.profile.sleepSummaryTitle)}
          />
          <ToggleRow
            label={t.profile.heartRateTitle}
            description={formatTemplate(t.profile.heartRateDesc, { partner: partnerDisplayName })}
            checked={Boolean(mySharing.heartRate)}
            onToggle={() => handleToggleSharing('heartRate', t.profile.heartRateTitle)}
          />
          <ToggleRow
            label={t.profile.hrvTitle}
            description={t.profile.hrvDesc}
            checked={Boolean(mySharing.hrv)}
            onToggle={() => handleToggleSharing('hrv', t.profile.hrvTitle)}
          />
          <ToggleRow
            label={t.profile.activitySummaryTitle}
            description={t.profile.activitySummaryDesc}
            checked={mySharing.activity}
            onToggle={() => handleToggleSharing('activity', t.profile.activitySummaryTitle)}
          />
          <ToggleRow
            label={t.profile.cycleTrackingOptInTitle}
            description={t.profile.cycleTrackingOptInDesc}
            checked={Boolean(mySharing.cycleTrackingEnabled)}
            onToggle={() =>
              handleToggleSharing('cycleTrackingEnabled', t.profile.cycleTrackingOptInTitle)
            }
          />
          <ToggleRow
            label={t.profile.cycleShareTitle}
            description={t.profile.cycleShareDesc}
            checked={Boolean(mySharing.cycleTrackingEnabled && mySharing.cycle)}
            disabled={!mySharing.cycleTrackingEnabled}
            onToggle={() => handleToggleSharing('cycle', t.profile.cycleShareTitle)}
          />
        </div>

        {sharingNotice && (
          <div
            role="status"
            className="rounded-2xl bg-[#FDFBFA] px-3 py-2 text-[11.5px] text-[#292832] flex items-center gap-2 border border-[#292832]/[0.05]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#8FA89B] shrink-0" />
            <span>{sharingNotice}</span>
          </div>
        )}
      </section>

      {/* 3b. Notification & Quiet Hours */}
      <NotificationPreferencesSection
        prefs={myNotifPrefs}
        onUpdate={updateNormalNotificationPrefs}
        canUseAdvancedNotifications={normalCapabilities.canUseAdvancedNotifications}
        onUpgrade={() => setNormalProfileSubView('premium')}
        t={t}
      />

      {/* 4. Care Preferences */}
      <section
        aria-label={t.profile.carePreferencesTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div>
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.carePreferencesTitle}
          </h2>
          <p className="text-[11.5px] text-[#85838D] mt-0.5">{t.profile.carePreferencesDesc}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {normalPreferences.preferredCare.map((key) => {
            const displayLabel = t.onboarding.step4.preferredCareOptions[key];
            return (
              <span
                key={`pref-${key}`}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-xl bg-[#F5E8E7]/75 border border-[#E88C7D]/25 text-[11.5px] font-medium text-[#292832]"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  onClick={() => removeNormalPresetPreference('preferred', key)}
                  aria-label={formatTemplate(t.profile.removeTagAria, { tag: displayLabel })}
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[#85838D] hover:text-[#292832] hover:bg-[#292832]/[0.06] active:scale-95 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {normalPreferences.avoidTags.map((key) => {
            const displayLabel = t.onboarding.step4.avoidOptions[key];
            return (
              <span
                key={`avoid-${key}`}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-xl bg-[#EFEDF5]/80 border border-[#9B93B8]/25 text-[11.5px] font-medium text-[#292832]"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  onClick={() => removeNormalPresetPreference('avoid', key)}
                  aria-label={formatTemplate(t.profile.removeTagAria, { tag: displayLabel })}
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[#85838D] hover:text-[#292832] hover:bg-[#292832]/[0.06] active:scale-95 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {normalPreferences.communicationStyle && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-[#8FA89B]/18 text-[11.5px] font-medium text-[#284735]">
              {t.onboarding.step4.communicationOptions[normalPreferences.communicationStyle]}
            </span>
          )}
          {normalPreferences.customTags.map((tag) => {
            const displayLabel = tag.customLabel ?? '';
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.06] text-[11.5px] font-medium text-[#292832]"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  onClick={() => removeNormalCustomPreference(tag.id)}
                  aria-label={formatTemplate(t.profile.removeTagAria, { tag: displayLabel })}
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[#85838D] hover:text-[#292832] hover:bg-[#292832]/[0.06] active:scale-95 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>

        <form onSubmit={handleAddTag} className="flex items-center gap-2 pt-0.5">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder={t.profile.newPreferencePlaceholder}
            aria-label={t.profile.newPreferencePlaceholder}
            className="flex-1 min-h-[40px] px-3 rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.08] text-[12px] text-[#292832] placeholder:text-[#85838D] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
          />
          <button
            type="submit"
            className="min-h-[40px] px-3.5 rounded-2xl bg-[#292832] hover:bg-[#3B3A47] text-white text-[12px] font-semibold inline-flex items-center gap-1 shrink-0 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.profile.addButton}</span>
          </button>
        </form>
      </section>

      {/* 4b. Learned Preferences Summary */}
      <LearnedPreferencesSection
        profile={normalLearnedProfile}
        canUseAdvancedLearning={normalCapabilities.canUseAdvancedFeedbackLearning}
        onUpgrade={() => setNormalProfileSubView('premium')}
        onClear={clearNormalLearnedPreferences}
        t={t}
      />

      {/* 4c. Saved Suggestions Library (with Send Care reuse) */}
      <SavedSuggestionsLibrarySection
        savedItems={normalInteractions.savedAiSuggestions}
        onRemove={removeNormalSavedSuggestion}
        onReuse={(item) => reuseNormalSavedSuggestion(item)}
        onGoToCare={() => setNormalActivePage('care')}
        partnerName={partnerDisplayName}
        t={t}
        language={language}
      />

      {/* 5. Language Settings */}
      <section
        aria-label={t.profile.languageSectionTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.languageSectionTitle}
          </h2>
        </div>
        <p className="text-[11.5px] text-[#85838D] leading-snug">
          {t.profile.languageSectionDesc}
        </p>

        <div
          role="radiogroup"
          aria-label={t.profile.languageSectionTitle}
          className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4EFEA] rounded-2xl"
        >
          {LANGUAGE_OPTIONS.map((code) => {
            const isSelected = language === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setLanguage(code)}
                className={`min-h-[38px] px-2 rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
                    : 'text-[#85838D] hover:text-[#292832]'
                }`}
              >
                {t.profile.languages[code]}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Mode & Presentation Controls */}
      <section
        aria-label={t.normalMode.modeAndDemoTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div>
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.normalMode.modeAndDemoTitle}
          </h2>
          <p className="text-[11.5px] text-[#85838D] mt-0.5 leading-snug">
            {t.normalMode.modeAndDemoDesc}
          </p>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={enterPresentationDemo}
            className="w-full min-h-[44px] px-4 rounded-2xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[12.5px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{t.normalMode.enterPresentationDemo}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={returnToWelcome}
              className="min-h-[40px] px-3 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.normalMode.returnToWelcomeBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetNormalConfirm(true)}
              className="min-h-[40px] px-3 rounded-2xl bg-[#F5E8E7]/80 hover:bg-[#F5E8E7] text-[#8E4D42] text-[11.5px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.normalMode.resetOnboardingBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Membership Summary Card */}
      <section
        aria-label={t.profile.membershipTitle}
        className="bg-gradient-to-br from-white via-[#FDFBFA] to-[#EFEDF5]/65 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] ring-1 ring-[#9B93B8]/25 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.profile.membershipUpgrade.freeStatusTitle}
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
            {t.profile.oneCouplePlanBadge}
          </span>
        </div>
        <p className="text-[11.5px] text-[#85838D] leading-snug">
          {t.profile.membershipUpgrade.freeStatusDesc}
        </p>
        <button
          type="button"
          onClick={() => setNormalProfileSubView('premium')}
          className="w-full min-h-[42px] px-3.5 rounded-2xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{t.profile.membershipUpgrade.openMembershipPageBtn}</span>
        </button>
      </section>
        </>
      )}

      {showResetNormalConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-onboarding-title"
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#292832]/30 backdrop-blur-[2px] p-3"
        >
          <div className="w-full bg-white/95 backdrop-blur-[10px] rounded-[24px] p-4 shadow-xl border border-white space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3
                id="reset-onboarding-title"
                className="font-display text-[15px] font-semibold text-[#292832]"
              >
                {t.normalMode.resetOnboardingTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowResetNormalConfirm(false)}
                aria-label={t.meta.cancel}
                className="min-w-[34px] min-h-[34px] rounded-full flex items-center justify-center text-[#85838D] hover:bg-[#F4EFEA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-[#292832]/85 leading-relaxed">
              {t.normalMode.resetOnboardingBody}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetNormalConfirm(false)}
                className="flex-1 min-h-[42px] rounded-2xl bg-[#F4EFEA] text-[#292832] text-[12px] font-semibold active:scale-95"
              >
                {t.meta.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetNormalConfirm(false);
                  resetNormalAccount();
                }}
                className="flex-1 min-h-[42px] rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12px] font-semibold active:scale-95"
              >
                {t.normalMode.confirmResetOnboarding}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PresentationProfileContent({ partnerId }: { partnerId: PartnerId }) {
  const {
    language,
    setLanguage,
    t,
    presentationBundle,
    sharingPrefs,
    toggleSharingPref,
    healthSyncState,
    syncDemoHealth,
    notificationPrefs,
    updateNotificationPrefs,
    carePreferences,
    addCarePreference,
    removeCarePreference,
    savedAiSuggestions,
    removePresentationSavedSuggestion,
    reusePresentationSavedSuggestion,
    learnedProfileForPartner,
    clearLearnedPreferences,
    setActivePage,
    profileSubViews,
    setProfileSubView,
    membership,
    upgradeDemoPremium,
    widgetPreviewStyle,
    setWidgetPreviewStyle,
  } = useDualCharge();

  const [newTagInput, setNewTagInput] = useState('');
  const [billingPlan, setBillingPlan] = useState<CoupleBillingPlan>(membership.plan);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [sharingNotice, setSharingNotice] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  if (!presentationBundle) {
    return (
      <div className="py-12 text-center text-[13px] text-[#85838D]">
        {t.welcome.loadingPresentationDemo}
      </div>
    );
  }

  const otherPartnerId: PartnerId = partnerId === 'alex' ? 'jamie' : 'alex';
  const me = presentationBundle.partnerProfiles[partnerId];
  const meMeta = presentationBundle.partnerMeta[partnerId];
  const partnerMeta = presentationBundle.partnerMeta[otherPartnerId];
  const partnerProfile = presentationBundle.partnerProfiles[otherPartnerId];
  const capabilities = getMembershipCapabilities(membership, true);
  const activeSubView = profileSubViews[partnerId];

  const mySharing = sharingPrefs[partnerId];
  const partnerSharing = sharingPrefs[otherPartnerId];
  const myTags = carePreferences[partnerId];
  const myHealth = healthSyncState[partnerId];
  const myNotifPrefs = notificationPrefs[partnerId];
  const activeWidgetStyle = widgetPreviewStyle[partnerId];

  const handleToggleSharing = (key: SharingPrefKey, label: string) => {
    const nextState = !mySharing[key];
    toggleSharingPref(partnerId, key);
    setSharingNotice(
      formatTemplate(
        nextState ? t.profile.sharingFeedbackOn : t.profile.sharingFeedbackOff,
        { label, partner: partnerMeta.display_name }
      )
    );
  };

  const handleSyncNow = () => {
    syncDemoHealth(partnerId);
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    setSyncNotice(formatTemplate(t.profile.syncedToast, { time: nowTime }));
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    addCarePreference(partnerId, newTagInput);
    setNewTagInput('');
  };

  const handleConfirmPurchase = () => {
    upgradeDemoPremium(partnerId, billingPlan);
    setShowPremiumModal(false);
    setJustUpgraded(true);
  };

  const activatedByName = membership.purchasedBy
    ? presentationBundle.partnerMeta[membership.purchasedBy].display_name
    : null;

  return (
    <div className="space-y-4 pb-2 relative">
      {/* Sub-view Bar: My Profile | Premium Membership */}
      <div
        role="tablist"
        aria-label={t.profile.membershipTitle}
        className="grid grid-cols-2 gap-1 p-1 bg-[#EFEDF5]/80 rounded-2xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSubView === 'main'}
          onClick={() => setProfileSubView(partnerId, 'main')}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 px-2 ${
            activeSubView === 'main'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          {t.profile.membershipUpgrade.subTabMain}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSubView === 'premium'}
          onClick={() => setProfileSubView(partnerId, 'premium')}
          className={`min-h-[38px] rounded-xl text-[12px] font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 px-2 ${
            activeSubView === 'premium'
              ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
              : 'text-[#85838D] hover:text-[#292832]'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-[#9B93B8]" />
          <span className="truncate">{t.profile.membershipUpgrade.subTabMembership}</span>
        </button>
      </div>

      {activeSubView === 'premium' ? (
        <MembershipComparisonView
          scope="demo"
          membership={membership}
          isCoupleLinked={true}
          billingPlan={billingPlan}
          onChangeBillingPlan={setBillingPlan}
          onBack={() => setProfileSubView(partnerId, 'main')}
          onOpenReviewModal={() => setShowPremiumModal(true)}
          justUpgraded={justUpgraded}
          memberNames={{
            a: presentationBundle.partnerMeta.alex.display_name,
            b: presentationBundle.partnerMeta.jamie.display_name,
            activatedBy: activatedByName,
          }}
          widgetStyle={activeWidgetStyle}
          onChangeWidgetStyle={(style) => setWidgetPreviewStyle(partnerId, style)}
          widgetSummaryData={{
            meName: meMeta.display_name,
            meEnergy: me.latestEnergy,
            partnerName: partnerMeta.display_name,
            partnerEnergy: partnerProfile.latestEnergy,
            partnerSharing,
          }}
          t={t}
        />
      ) : (
        <>
          <section
            aria-label={meMeta.display_name}
            className="bg-white/85 backdrop-blur-[10px] ring-1 ring-white/80 rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] flex items-center gap-3.5"
          >
        <img
          src={me.avatarUrl}
          alt={meMeta.display_name}
          referrerPolicy="no-referrer"
          className="w-14 h-14 rounded-full object-cover ring-2 ring-[#E88C7D]/35 shrink-0"
        />
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-semibold text-[#292832] leading-tight truncate">
            {meMeta.display_name}
          </h1>
          <div className="text-[12px] text-[#85838D] mt-0.5">{t.profile.roles[partnerId]}</div>
          <div className="text-[11px] text-[#85838D] mt-0.5">{t.profile.simulatedDemoProfile}</div>
        </div>
      </section>

      {/* Connected Health Data (Simulated Sync) */}
      <section
        aria-label={t.profile.connectedHealthTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8FA89B]" strokeWidth={2} />
              <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
                {t.profile.connectedHealthTitle}
              </h2>
            </div>
            <p className="text-[11px] text-[#85838D] mt-0.5 leading-snug">
              {t.profile.connectedHealthDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncNow}
            className="min-h-[32px] px-2.5 rounded-xl bg-[#EFEDF5] hover:bg-[#E4E0F0] text-[#5B527E] text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 transition-all active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{t.profile.syncNowBtn}</span>
          </button>
        </div>

        <div className="divide-y divide-[#292832]/[0.05] text-[12px]">
          <div className="flex items-center justify-between py-2 first:pt-0">
            <span className="text-[#85838D]">{t.profile.platformLabel}</span>
            <span className="font-semibold text-[#292832]">{myHealth.platform}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#85838D]">{t.profile.connectionLabel}</span>
            <span className="font-semibold text-[#3D5E49]">{t.profile.statusConnected}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#85838D]">{t.profile.permissionLabel}</span>
            <span className="font-medium text-[#292832] text-right">
              {t.profile.permissionGranted}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 last:pb-0">
            <span className="text-[#85838D]">{t.profile.lastSyncLabel}</span>
            <span className="font-mono-tabular text-[11.5px] text-[#292832]">
              {myHealth.lastSyncLabel}
            </span>
          </div>
        </div>

        {syncNotice && (
          <div
            role="status"
            className="rounded-2xl bg-[#8FA89B]/18 px-3 py-2 text-[11.5px] text-[#3D5E49] flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        <p className="text-[10.5px] text-[#85838D] leading-snug">
          {t.profile.simulatedHealthNotice}
        </p>
      </section>

      <section
        aria-label={t.profile.coupleSettingsTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#E88C7D]" strokeWidth={2} />
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.coupleSettingsTitle}
          </h2>
        </div>

        <div className="divide-y divide-[#292832]/[0.05] text-[12.5px]">
          <div className="flex items-center justify-between py-2 first:pt-0">
            <span className="text-[#85838D]">{t.profile.partnerName}</span>
            <span className="font-semibold text-[#292832]">{partnerMeta.display_name}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[#85838D]">{t.profile.demoPairingCode}</span>
            <span className="font-mono-tabular text-[12px] font-medium text-[#292832]">
              {PRESENTATION_PAIRING_CODE}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 last:pb-0">
            <span className="text-[#85838D]">{t.profile.connectionStatus}</span>
            <span className="font-semibold text-[#3D5E49]">{t.profile.connectedStatusValue}</span>
          </div>
        </div>
      </section>

      <section
        aria-label={t.profile.dataSharingTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8FA89B]" strokeWidth={2} />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {t.profile.dataSharingTitle}
            </h2>
          </div>
          <p className="text-[11.5px] text-[#85838D] mt-1 leading-relaxed">
            {formatTemplate(t.profile.dataSharingDesc, { partner: partnerMeta.display_name })}
          </p>
        </div>

        <div className="divide-y divide-[#292832]/[0.05]">
          <ToggleRow
            label={t.profile.energySummaryTitle}
            description={t.profile.energySummaryDesc}
            checked={mySharing.energy}
            onToggle={() => handleToggleSharing('energy', t.profile.energySummaryTitle)}
          />
          <ToggleRow
            label={t.profile.sleepSummaryTitle}
            description={t.profile.sleepSummaryDesc}
            checked={mySharing.sleep}
            onToggle={() => handleToggleSharing('sleep', t.profile.sleepSummaryTitle)}
          />
          <ToggleRow
            label={t.profile.heartRateTitle}
            description={formatTemplate(t.profile.heartRateDesc, {
              partner: partnerMeta.display_name,
            })}
            checked={Boolean(mySharing.heartRate)}
            onToggle={() => handleToggleSharing('heartRate', t.profile.heartRateTitle)}
          />
          <ToggleRow
            label={t.profile.hrvTitle}
            description={t.profile.hrvDesc}
            checked={Boolean(mySharing.hrv)}
            onToggle={() => handleToggleSharing('hrv', t.profile.hrvTitle)}
          />
          <ToggleRow
            label={t.profile.activitySummaryTitle}
            description={t.profile.activitySummaryDesc}
            checked={mySharing.activity}
            onToggle={() => handleToggleSharing('activity', t.profile.activitySummaryTitle)}
          />
          <ToggleRow
            label={t.profile.cycleTrackingOptInTitle}
            description={t.profile.cycleTrackingOptInDesc}
            checked={Boolean(mySharing.cycleTrackingEnabled)}
            onToggle={() =>
              handleToggleSharing('cycleTrackingEnabled', t.profile.cycleTrackingOptInTitle)
            }
          />
          <ToggleRow
            label={t.profile.cycleShareTitle}
            description={t.profile.cycleShareDesc}
            checked={Boolean(mySharing.cycleTrackingEnabled && mySharing.cycle)}
            disabled={!mySharing.cycleTrackingEnabled}
            onToggle={() => handleToggleSharing('cycle', t.profile.cycleShareTitle)}
          />
        </div>

        {sharingNotice && (
          <div
            role="status"
            className="rounded-2xl bg-[#FDFBFA] px-3 py-2 text-[11.5px] text-[#292832] flex items-center gap-2 border border-[#292832]/[0.05]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#8FA89B] shrink-0" />
            <span>{sharingNotice}</span>
          </div>
        )}
      </section>

      {/* Notification & Quiet Hours */}
      <NotificationPreferencesSection
        prefs={myNotifPrefs}
        onUpdate={(patch) => updateNotificationPrefs(partnerId, patch)}
        canUseAdvancedNotifications={capabilities.canUseAdvancedNotifications}
        onUpgrade={() => setProfileSubView(partnerId, 'premium')}
        t={t}
      />

      <section
        aria-label={t.profile.carePreferencesTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-3"
      >
        <div>
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.carePreferencesTitle}
          </h2>
          <p className="text-[11.5px] text-[#85838D] mt-0.5">{t.profile.carePreferencesDesc}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {myTags.map((tag) => {
            const displayLabel = tag.presetKey
              ? t.profile.presetTags[tag.presetKey] ?? tag.presetKey
              : tag.customLabel ?? '';
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.06] text-[11.5px] font-medium text-[#292832]"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  onClick={() => removeCarePreference(partnerId, tag.id)}
                  aria-label={formatTemplate(t.profile.removeTagAria, { tag: displayLabel })}
                  className="w-5 h-5 rounded-lg flex items-center justify-center text-[#85838D] hover:text-[#292832] hover:bg-[#292832]/[0.06] active:scale-95 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>

        <form onSubmit={handleAddTag} className="flex items-center gap-2 pt-0.5">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder={t.profile.newPreferencePlaceholder}
            aria-label={t.profile.newPreferencePlaceholder}
            className="flex-1 min-h-[40px] px-3 rounded-2xl bg-[#FDFBFA] border border-[#292832]/[0.08] text-[12px] text-[#292832] placeholder:text-[#85838D] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
          />
          <button
            type="submit"
            className="min-h-[40px] px-3.5 rounded-2xl bg-[#292832] hover:bg-[#3B3A47] text-white text-[12px] font-semibold inline-flex items-center gap-1 shrink-0 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.profile.addButton}</span>
          </button>
        </form>
      </section>

      <LearnedPreferencesSection
        profile={learnedProfileForPartner(partnerId)}
        canUseAdvancedLearning={capabilities.canUseAdvancedFeedbackLearning}
        onUpgrade={() => setProfileSubView(partnerId, 'premium')}
        onClear={() => clearLearnedPreferences(partnerId)}
        t={t}
      />

      <SavedSuggestionsLibrarySection
        savedItems={savedAiSuggestions[partnerId] ?? []}
        onRemove={(id) => removePresentationSavedSuggestion(partnerId, id)}
        onReuse={(item) => reusePresentationSavedSuggestion(partnerId, item)}
        onGoToCare={() => setActivePage(partnerId, 'care')}
        partnerName={partnerMeta.display_name}
        t={t}
        language={language}
      />

      <section
        aria-label={t.profile.languageSectionTitle}
        className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#9B93B8]" strokeWidth={2} />
          <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
            {t.profile.languageSectionTitle}
          </h2>
        </div>
        <p className="text-[11.5px] text-[#85838D] leading-snug">
          {t.profile.languageSectionDesc}
        </p>

        <div
          role="radiogroup"
          aria-label={t.profile.languageSectionTitle}
          className="grid grid-cols-3 gap-1.5 p-1 bg-[#F4EFEA] rounded-2xl"
        >
          {LANGUAGE_OPTIONS.map((code) => {
            const isSelected = language === code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setLanguage(code)}
                className={`min-h-[38px] px-2 rounded-xl text-[11.5px] font-semibold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-[#292832] shadow-[0_4px_12px_-4px_rgba(41,40,50,0.08)]'
                    : 'text-[#85838D] hover:text-[#292832]'
                }`}
              >
                {t.profile.languages[code]}
              </button>
            );
          })}
        </div>
      </section>

      {/* Membership Status Summary Card on Profile Main */}
      <section
        aria-label={t.profile.membershipTitle}
        className={`rounded-[22px] p-4 shadow-[0_10px_30px_-10px_rgba(41,40,50,0.06)] space-y-2.5 ${
          capabilities.isPremium
            ? 'bg-gradient-to-br from-[#FBF7F5] via-white to-[#EFEDF5] ring-1 ring-[#9B93B8]/35'
            : 'bg-gradient-to-br from-white via-[#FDFBFA] to-[#EFEDF5]/65 ring-1 ring-[#9B93B8]/25'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown
              className={`w-4 h-4 ${
                capabilities.isPremium ? 'text-[#E88C7D]' : 'text-[#9B93B8]'
              }`}
              strokeWidth={2}
            />
            <h2 className="font-display text-[14.5px] font-semibold text-[#292832]">
              {capabilities.isPremium
                ? t.profile.membershipUpgrade.premiumStatusTitle
                : t.profile.membershipUpgrade.freeStatusTitle}
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
            {t.profile.oneCouplePlanBadge}
          </span>
        </div>

        <p className="text-[11.5px] text-[#85838D] leading-snug">
          {capabilities.isPremium
            ? t.profile.membershipUpgrade.premiumStatusDesc
            : t.profile.membershipUpgrade.freeStatusDesc}
        </p>

        <button
          type="button"
          onClick={() => setProfileSubView(partnerId, 'premium')}
          className="w-full min-h-[42px] px-3.5 rounded-2xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>{t.profile.membershipUpgrade.openMembershipPageBtn}</span>
        </button>
      </section>
        </>
      )}

      {/* Review Upgrade & Confirm Simulated Purchase Modal */}
      {showPremiumModal && (
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
                  {t.profile.membershipUpgrade.reviewModalTitle}
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
                <span className="text-[#85838D]">
                  {t.profile.membershipUpgrade.reviewPlanLabel}
                </span>
                <span className="font-semibold text-[#292832]">
                  {t.profile.premiumPlanTitle}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[#85838D]">
                  {t.profile.membershipUpgrade.reviewBillingLabel}
                </span>
                <span className="font-semibold text-[#292832]">
                  {billingPlan === 'monthly'
                    ? t.profile.billingMonthlyLabel
                    : t.profile.billingYearlyLabel}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[#85838D]">
                  {t.profile.membershipUpgrade.reviewPriceLabel}
                </span>
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
                <div className="text-[11px] text-[#85838D]">
                  {t.profile.membershipUpgrade.reviewSharedLabel}
                </div>
                <div className="font-semibold text-[#3D5E49]">
                  {formatTemplate(t.profile.membershipUpgrade.reviewSharedValue, {
                    a: presentationBundle.partnerMeta.alex.display_name,
                    b: presentationBundle.partnerMeta.jamie.display_name,
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F4EFEA]/80 p-2.5 text-[11px] text-[#85838D] leading-snug">
              {t.profile.membershipUpgrade.reviewNoPaymentNote}
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
                {t.profile.membershipUpgrade.confirmPurchaseBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfilePage({ partnerId, scope = 'demo' }: ProfilePageProps) {
  if (scope === 'normal') {
    return <NormalProfileContent />;
  }
  return <PresentationProfileContent partnerId={partnerId} />;
}
