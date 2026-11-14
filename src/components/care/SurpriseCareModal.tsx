import React, { useEffect, useState } from 'react';
import {
  Bell,
  CalendarHeart,
  Clock,
  Coffee,
  EyeOff,
  FileSignature,
  Gift,
  HeartHandshake,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import {
  computeSuggestedRevealAtISO,
  inferSurpriseCategoryFromRecommendation,
  SURPRISE_CARE_CATEGORIES,
  SurpriseRevealPresetKey,
} from '@/src/services/surpriseCareService';
import {
  AiCareRecommendation,
  SurpriseCareCategory,
  SurpriseCareDeliveryMode,
  SurpriseCareNoteStyle,
  SurpriseCareRecord,
  SurpriseCareVisibility,
} from '@/src/types/aiCare';

export interface SurpriseDatePlanOption {
  id: string;
  title: string;
  suggestedSlot: string;
}

export interface SurpriseCareSubmitPayload {
  sourceRecommendation: AiCareRecommendation;
  careCategory: SurpriseCareCategory;
  noteStyle: SurpriseCareNoteStyle;
  title: string;
  actionDescription: string;
  content: string;
  deliveryMode: SurpriseCareDeliveryMode;
  revealAt: string | null;
  revealPresetKey?: SurpriseRevealPresetKey;
  relatedDatePlanId?: string;
  visibility: SurpriseCareVisibility;
}

interface SurpriseCareModalProps {
  open: boolean;
  onClose: () => void;
  t: TranslationDictionary;
  recipientName: string;
  sourceRecommendation: AiCareRecommendation | null;
  editingRecord?: SurpriseCareRecord | null;
  datePlanOptions?: SurpriseDatePlanOption[];
  isDemoMode?: boolean;
  onConfirmCreate: (payload: SurpriseCareSubmitPayload) => void;
  onConfirmEdit?: (
    surpriseId: string,
    patch: Partial<
      Pick<
        SurpriseCareRecord,
        | 'careCategory'
        | 'noteStyle'
        | 'title'
        | 'actionDescription'
        | 'content'
        | 'revealAt'
        | 'revealPresetKey'
        | 'relatedDatePlanId'
        | 'visibility'
      >
    >
  ) => void;
}

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function formatReadableDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CategoryIcon({ category }: { category: SurpriseCareCategory }) {
  if (category === 'personal_touch') {
    return <HeartHandshake className="w-4 h-4 text-[#C45E4E] shrink-0" strokeWidth={2} />;
  }
  if (category === 'thoughtful_gesture') {
    return <Coffee className="w-4 h-4 text-[#3D5E49] shrink-0" strokeWidth={2} />;
  }
  return <Users className="w-4 h-4 text-[#706794] shrink-0" strokeWidth={2} />;
}

export function SurpriseCareModal({
  open,
  onClose,
  t,
  recipientName,
  sourceRecommendation,
  editingRecord = null,
  datePlanOptions = [],
  isDemoMode = false,
  onConfirmCreate,
  onConfirmEdit,
}: SurpriseCareModalProps) {
  const isEditing = Boolean(editingRecord);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [careCategory, setCareCategory] = useState<SurpriseCareCategory>('personal_touch');
  const [noteStyle, setNoteStyle] = useState<SurpriseCareNoteStyle>('standard');
  const [title, setTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [content, setContent] = useState('');
  const [relatedDatePlanId, setRelatedDatePlanId] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<SurpriseCareDeliveryMode>('keep_surprise');
  const [revealPreset, setRevealPreset] = useState<SurpriseRevealPresetKey>('this_evening');
  const [customRevealLocal, setCustomRevealLocal] = useState<string>('');
  const [visibility, setVisibility] = useState<SurpriseCareVisibility>('shared');

  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (editingRecord) {
      setCareCategory(editingRecord.careCategory);
      setNoteStyle(editingRecord.noteStyle ?? 'standard');
      setTitle(editingRecord.title);
      setActionDescription(editingRecord.actionDescription);
      setContent(editingRecord.content);
      setRelatedDatePlanId(editingRecord.relatedDatePlanId ?? '');
      setDeliveryMode(editingRecord.deliveryMode);
      const preset = editingRecord.revealPresetKey ?? 'custom';
      setRevealPreset(preset);
      setCustomRevealLocal(
        editingRecord.revealAt
          ? toDatetimeLocalValue(editingRecord.revealAt)
          : toDatetimeLocalValue(computeSuggestedRevealAtISO('this_evening'))
      );
      setVisibility(editingRecord.visibility);
      return;
    }

    if (sourceRecommendation) {
      const inferredCat = inferSurpriseCategoryFromRecommendation(sourceRecommendation);
      setCareCategory(inferredCat);
      const defaultNoteStyle: SurpriseCareNoteStyle =
        sourceRecommendation.communicationStyle === 'Voice Message'
          ? 'voice_placeholder'
          : sourceRecommendation.actionType === 'handwritten_note'
            ? 'handwritten_note'
            : 'standard';
      setNoteStyle(defaultNoteStyle);
      setTitle(sourceRecommendation.title);
      setActionDescription(sourceRecommendation.action);
      setContent(sourceRecommendation.defaultMessage);
      setRelatedDatePlanId('');
      setDeliveryMode('keep_surprise');
      setRevealPreset('this_evening');
      setCustomRevealLocal(toDatetimeLocalValue(computeSuggestedRevealAtISO('this_evening')));
      setVisibility('shared');
    }
  }, [open, editingRecord, sourceRecommendation]);

  if (!open || (!sourceRecommendation && !editingRecord)) {
    return null;
  }

  const whyText = editingRecord?.sourceWhy ?? sourceRecommendation?.why ?? '';
  const timingText =
    editingRecord?.sourceSuggestedTiming ?? sourceRecommendation?.suggestedTiming ?? '';
  const sourceTitleText = editingRecord?.title ?? sourceRecommendation?.title ?? '';

  const resolvedRevealAtISO: string | null =
    deliveryMode === 'tell_now'
      ? null
      : revealPreset === 'custom'
        ? customRevealLocal
          ? new Date(customRevealLocal).toISOString()
          : computeSuggestedRevealAtISO('this_evening')
        : computeSuggestedRevealAtISO(revealPreset);

  const selectedDatePlan = datePlanOptions.find((p) => p.id === relatedDatePlanId);

  const presetKeys: SurpriseRevealPresetKey[] = isDemoMode
    ? ['this_evening', 'tomorrow_morning', 'next_pattern_window', 'demo_quick', 'custom']
    : ['this_evening', 'tomorrow_morning', 'next_pattern_window', 'custom'];

  const handleConfirm = () => {
    if (isEditing && editingRecord && onConfirmEdit) {
      onConfirmEdit(editingRecord.id, {
        careCategory,
        noteStyle,
        title: title.trim() || editingRecord.title,
        actionDescription: actionDescription.trim() || editingRecord.actionDescription,
        content: content.trim() || editingRecord.content,
        revealAt: editingRecord.deliveryMode === 'keep_surprise' ? resolvedRevealAtISO : null,
        revealPresetKey: editingRecord.deliveryMode === 'keep_surprise' ? revealPreset : undefined,
        relatedDatePlanId:
          careCategory === 'shared_moments' && relatedDatePlanId ? relatedDatePlanId : undefined,
        visibility,
      });
      onClose();
      return;
    }

    if (!sourceRecommendation) return;
    onConfirmCreate({
      sourceRecommendation,
      careCategory,
      noteStyle,
      title: title.trim() || sourceRecommendation.title,
      actionDescription: actionDescription.trim() || sourceRecommendation.action,
      content: content.trim() || sourceRecommendation.defaultMessage,
      deliveryMode,
      revealAt: resolvedRevealAtISO,
      revealPresetKey: deliveryMode === 'keep_surprise' ? revealPreset : undefined,
      relatedDatePlanId:
        careCategory === 'shared_moments' && relatedDatePlanId ? relatedDatePlanId : undefined,
      visibility,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="surprise-care-modal-title"
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#292832]/35 backdrop-blur-[2px] p-2.5"
    >
      <div className="w-full max-w-[355px] max-h-[88vh] bg-[#FDFBFA] rounded-[26px] shadow-[0_24px_60px_-14px_rgba(41,40,50,0.35)] ring-1 ring-[#9B93B8]/25 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#292832]/[0.06] bg-white/90 flex items-start justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#706794] bg-[#EFEDF5] px-2 py-0.5 rounded-lg">
              <Gift className="w-3 h-3 text-[#C45E4E]" />
              <span>{formatTemplate(t.surpriseCare.modal.stepLabel, { current: step, total: 3 })}</span>
            </div>
            <h2
              id="surprise-care-modal-title"
              className="font-display text-[16px] font-semibold text-[#292832] mt-1 leading-snug"
            >
              {isEditing ? t.surpriseCare.modal.editTitle : t.surpriseCare.modal.createTitle}
            </h2>
            <p className="text-[11px] text-[#85838D]">
              {step === 1
                ? t.surpriseCare.modal.step1Title
                : step === 2
                  ? t.surpriseCare.modal.step2Title
                  : t.surpriseCare.modal.step3Title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.meta.cancel}
            className="w-9 h-9 rounded-full bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] flex items-center justify-center shrink-0 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
          {step === 1 && (
            <>
              {/* Source AI Recommendation Context (Sender-only) */}
              <div className="rounded-2xl bg-white border border-[#292832]/[0.06] p-3 space-y-1.5">
                <div className="text-[10.5px] font-semibold text-[#706794]">
                  {t.surpriseCare.modal.sourceIdeaLabel}
                </div>
                <div className="text-[13px] font-semibold text-[#292832] leading-snug">
                  {sourceTitleText}
                </div>
                {whyText && (
                  <p className="text-[11px] text-[#292832]/80 leading-snug">
                    <span className="font-semibold text-[#292832]">
                      {t.surpriseCare.modal.whyFitsLabel}:{' '}
                    </span>
                    {whyText}
                  </p>
                )}
                {timingText && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#85838D]">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {t.surpriseCare.modal.suggestedTimingLabel}: {timingText}
                    </span>
                  </div>
                )}
              </div>

              {/* 3 Practical Non-Commercial Categories */}
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-semibold text-[#292832]">
                  {t.surpriseCare.modal.categoryLabel}
                </div>
                <div className="space-y-1.5">
                  {SURPRISE_CARE_CATEGORIES.map((cat) => {
                    const copy = t.surpriseCare.categories[cat];
                    const selected = careCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCareCategory(cat)}
                        aria-pressed={selected}
                        className={`w-full text-left rounded-2xl p-2.5 transition-all flex items-start gap-2.5 ${
                          selected
                            ? 'bg-white ring-2 ring-[#E88C7D] shadow-[0_6px_18px_-6px_rgba(232,140,125,0.3)]'
                            : 'bg-[#F4EFEA]/75 hover:bg-[#F4EFEA]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-[#FDFBFA] flex items-center justify-center shrink-0 mt-0.5">
                          <CategoryIcon category={cat} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-semibold text-[#292832]">
                            {copy.label}
                          </div>
                          <div className="text-[10.5px] text-[#706794] font-medium">
                            {copy.examples}
                          </div>
                          <div className="text-[10.5px] text-[#85838D] mt-0.5 leading-snug">
                            {copy.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Touch Format Selector */}
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-semibold text-[#292832]">
                  {t.surpriseCare.modal.noteStyleLabel}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { key: 'standard', icon: Sparkles },
                      { key: 'handwritten_note', icon: FileSignature },
                      { key: 'voice_placeholder', icon: Mic },
                    ] as const
                  ).map(({ key, icon: Icon }) => {
                    const selected = noteStyle === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNoteStyle(key)}
                        aria-pressed={selected}
                        className={`min-h-[38px] px-2 py-1.5 rounded-xl text-[10.5px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-all ${
                          selected
                            ? 'bg-[#EFEDF5] text-[#5B527E] ring-1 ring-[#9B93B8]/60'
                            : 'bg-white text-[#85838D] border border-[#292832]/[0.06]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-full">
                          {t.surpriseCare.noteStyles[key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {noteStyle === 'voice_placeholder' && (
                  <p className="text-[10.5px] text-[#706794] bg-[#EFEDF5]/60 rounded-xl px-2.5 py-1.5 leading-snug">
                    {t.surpriseCare.voicePlaceholderBadge}
                  </p>
                )}
              </div>

              {/* Editable Title, Action, Personal Message */}
              <div className="space-y-2.5">
                <div>
                  <label
                    htmlFor="surprise-title-input"
                    className="block text-[11px] font-semibold text-[#292832] mb-1"
                  >
                    {t.surpriseCare.modal.titleInputLabel}
                  </label>
                  <input
                    id="surprise-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#292832]/12 px-3 py-2 text-[12.5px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#E88C7D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="surprise-action-input"
                    className="block text-[11px] font-semibold text-[#292832] mb-1"
                  >
                    {t.surpriseCare.modal.actionInputLabel}
                  </label>
                  <input
                    id="surprise-action-input"
                    type="text"
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#292832]/12 px-3 py-2 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#E88C7D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="surprise-msg-input"
                    className="block text-[11px] font-semibold text-[#292832] mb-1"
                  >
                    {formatTemplate(t.surpriseCare.modal.messageInputLabel, {
                      partner: recipientName,
                    })}
                  </label>
                  <textarea
                    id="surprise-msg-input"
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#292832]/12 p-2.5 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#E88C7D]"
                  />
                </div>
              </div>

              {/* Optional Shared Moments Date Plan Link (Reuses Date Planning) */}
              {careCategory === 'shared_moments' && datePlanOptions.length > 0 && (
                <div className="rounded-2xl bg-[#EFEDF5]/55 border border-[#9B93B8]/25 p-3 space-y-1.5">
                  <label
                    htmlFor="surprise-date-plan-select"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5B527E]"
                  >
                    <CalendarHeart className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.surpriseCare.modal.linkDatePlanLabel}</span>
                  </label>
                  <select
                    id="surprise-date-plan-select"
                    value={relatedDatePlanId}
                    onChange={(e) => setRelatedDatePlanId(e.target.value)}
                    className="w-full rounded-xl bg-white border border-[#292832]/12 px-2.5 py-2 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
                  >
                    <option value="">{t.surpriseCare.modal.noDatePlanOption}</option>
                    {datePlanOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.title} · {opt.suggestedSlot}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-[#706794] leading-snug">
                    {t.surpriseCare.modal.datePlanHiddenNote}
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-[#8FA89B]/14 px-3 py-2 text-[10.5px] text-[#3D5E49] flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="leading-snug">{t.surpriseCare.modal.nonCommercialNotice}</span>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Delivery Mode Choice */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => setDeliveryMode('tell_now')}
                  aria-pressed={deliveryMode === 'tell_now'}
                  className={`w-full text-left rounded-2xl p-3 transition-all flex items-start gap-2.5 disabled:opacity-60 ${
                    deliveryMode === 'tell_now'
                      ? 'bg-white ring-2 ring-[#E88C7D] shadow-[0_8px_20px_-8px_rgba(232,140,125,0.35)]'
                      : 'bg-[#F4EFEA]/80 hover:bg-[#F4EFEA]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F5E8E7] flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-[#C45E4E]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#292832]">
                      {t.surpriseCare.modal.tellNowTitle}
                    </div>
                    <p className="text-[11px] text-[#85838D] mt-0.5 leading-snug">
                      {t.surpriseCare.modal.tellNowDesc}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => setDeliveryMode('keep_surprise')}
                  aria-pressed={deliveryMode === 'keep_surprise'}
                  className={`w-full text-left rounded-2xl p-3 transition-all flex items-start gap-2.5 disabled:opacity-60 ${
                    deliveryMode === 'keep_surprise'
                      ? 'bg-white ring-2 ring-[#9B93B8] shadow-[0_8px_20px_-8px_rgba(155,147,184,0.35)]'
                      : 'bg-[#F4EFEA]/80 hover:bg-[#F4EFEA]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EFEDF5] flex items-center justify-center shrink-0">
                    <EyeOff className="w-4 h-4 text-[#706794]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#292832]">
                      {t.surpriseCare.modal.keepSurpriseTitle}
                    </div>
                    <p className="text-[11px] text-[#85838D] mt-0.5 leading-snug">
                      {t.surpriseCare.modal.keepSurpriseDesc}
                    </p>
                  </div>
                </button>
              </div>

              {deliveryMode === 'keep_surprise' && (
                <div className="space-y-3">
                  {/* Reveal Timing Presets */}
                  <div className="space-y-1.5">
                    <div className="text-[11.5px] font-semibold text-[#292832]">
                      {t.surpriseCare.modal.revealTimeLabel}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {presetKeys.map((presetKey) => {
                        const selected = revealPreset === presetKey;
                        return (
                          <button
                            key={presetKey}
                            type="button"
                            onClick={() => setRevealPreset(presetKey)}
                            aria-pressed={selected}
                            className={`min-h-[38px] px-3 py-2 rounded-xl text-left text-[11.5px] font-medium flex items-center justify-between gap-2 transition-all ${
                              selected
                                ? 'bg-[#EFEDF5] text-[#5B527E] ring-1 ring-[#9B93B8]/60 font-semibold'
                                : 'bg-white text-[#292832] border border-[#292832]/[0.07]'
                            }`}
                          >
                            <span>{t.surpriseCare.modal.revealPresets[presetKey]}</span>
                            <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </button>
                        );
                      })}
                    </div>

                    {revealPreset === 'custom' && (
                      <div className="pt-1">
                        <label
                          htmlFor="surprise-custom-reveal-input"
                          className="block text-[11px] font-medium text-[#85838D] mb-1"
                        >
                          {t.surpriseCare.modal.customRevealInputLabel}
                        </label>
                        <input
                          id="surprise-custom-reveal-input"
                          type="datetime-local"
                          value={customRevealLocal}
                          onChange={(e) => setCustomRevealLocal(e.target.value)}
                          className="w-full rounded-xl bg-white border border-[#292832]/12 px-3 py-2 text-[12px] text-[#292832] focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Neutral Notification Preview */}
                  <div className="rounded-2xl bg-white border border-[#9B93B8]/25 p-3 space-y-1.5">
                    <div className="text-[10.5px] font-semibold text-[#706794] flex items-center gap-1.5">
                      <Bell className="w-3 h-3" />
                      <span>{t.surpriseCare.modal.neutralPreviewTitle}</span>
                    </div>
                    <div className="rounded-xl bg-[#FDFBFA] border border-[#292832]/[0.06] p-2.5 space-y-0.5">
                      <div className="text-[12px] font-semibold text-[#292832]">
                        {t.surpriseCare.modal.neutralPreviewHeading}
                      </div>
                      <p className="text-[11.5px] text-[#85838D]">
                        {t.surpriseCare.modal.neutralPreviewBody}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-[#85838D] leading-snug bg-[#F4EFEA]/70 rounded-xl px-3 py-2">
                    {t.surpriseCare.modal.simulatedScheduleNote}
                  </p>
                </div>
              )}

              {/* Care Moments Visibility Setting */}
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-semibold text-[#292832]">
                  {t.surpriseCare.modal.visibilityLabel}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVisibility('shared')}
                    aria-pressed={visibility === 'shared'}
                    className={`min-h-[38px] px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                      visibility === 'shared'
                        ? 'bg-[#8FA89B]/22 text-[#3D5E49] ring-1 ring-[#8FA89B]/50'
                        : 'bg-white text-[#85838D] border border-[#292832]/[0.07]'
                    }`}
                  >
                    {t.surpriseCare.modal.visibilityShared}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    aria-pressed={visibility === 'private'}
                    className={`min-h-[38px] px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                      visibility === 'private'
                        ? 'bg-[#EFEDF5] text-[#5B527E] ring-1 ring-[#9B93B8]/50'
                        : 'bg-white text-[#85838D] border border-[#292832]/[0.07]'
                    }`}
                  >
                    {t.surpriseCare.modal.visibilityPrivate}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2.5">
              <div className="rounded-2xl bg-white border border-[#292832]/[0.07] p-3.5 space-y-2.5 text-[12px]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[#85838D] shrink-0">
                    {t.surpriseCare.modal.summaryCategory}
                  </span>
                  <span className="font-semibold text-[#292832] text-right">
                    {t.surpriseCare.categories[careCategory].label} ·{' '}
                    {t.surpriseCare.noteStyles[noteStyle]}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                  <span className="text-[#85838D] shrink-0">
                    {t.surpriseCare.modal.summaryTitle}
                  </span>
                  <span className="font-semibold text-[#292832] text-right">{title}</span>
                </div>

                <div className="pt-2 border-t border-[#292832]/[0.05] space-y-1">
                  <div className="text-[#85838D] text-[11px]">
                    {t.surpriseCare.modal.summaryAction}
                  </div>
                  <div className="text-[#292832] font-medium leading-snug">
                    {actionDescription}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#292832]/[0.05] space-y-1">
                  <div className="text-[#85838D] text-[11px]">
                    {t.surpriseCare.modal.summaryMessage}
                  </div>
                  <div className="rounded-xl bg-[#FDFBFA] p-2.5 border border-[#292832]/[0.05] text-[#292832] italic leading-relaxed">
                    “{content}”
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                  <span className="text-[#85838D] shrink-0">
                    {t.surpriseCare.modal.summaryDelivery}
                  </span>
                  <span className="font-semibold text-[#706794] text-right">
                    {deliveryMode === 'tell_now'
                      ? t.surpriseCare.modal.tellNowTitle
                      : t.surpriseCare.modal.keepSurpriseTitle}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                  <span className="text-[#85838D] shrink-0">
                    {t.surpriseCare.modal.summaryRevealAt}
                  </span>
                  <span className="font-medium text-[#292832] text-right">
                    {deliveryMode === 'tell_now'
                      ? t.surpriseCare.modal.summaryImmediate
                      : formatReadableDateTime(resolvedRevealAtISO)}
                  </span>
                </div>

                {selectedDatePlan && (
                  <div className="flex items-start justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                    <span className="text-[#85838D] shrink-0">
                      {t.surpriseCare.modal.summaryLinkedDate}
                    </span>
                    <span className="font-medium text-[#3D5E49] text-right">
                      {selectedDatePlan.title}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 pt-2 border-t border-[#292832]/[0.05]">
                  <span className="text-[#85838D] shrink-0">
                    {t.surpriseCare.modal.summaryVisibility}
                  </span>
                  <span className="font-medium text-[#292832] text-right">
                    {visibility === 'shared'
                      ? t.surpriseCare.modal.visibilityShared
                      : t.surpriseCare.modal.visibilityPrivate}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer Navigation */}
        <div className="px-4 py-3 border-t border-[#292832]/[0.06] bg-white flex items-center gap-2 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="min-h-[42px] px-4 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[12.5px] font-semibold active:scale-95 transition-all"
            >
              {t.surpriseCare.modal.backBtn}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#85838D] text-[12.5px] font-semibold active:scale-95 transition-all"
            >
              {t.meta.cancel}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              className="flex-1 min-h-[42px] px-4 rounded-2xl bg-[#292832] hover:bg-[#3B3946] text-white text-[12.5px] font-semibold active:scale-95 transition-all"
            >
              {t.surpriseCare.modal.nextBtn}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 min-h-[42px] px-4 rounded-2xl bg-[#E88C7D] hover:bg-[#DC7D6E] text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 shadow-[0_8px_18px_-6px_rgba(232,140,125,0.55)] active:scale-95 transition-all"
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {isEditing
                  ? t.surpriseCare.modal.confirmEditBtn
                  : deliveryMode === 'tell_now'
                    ? t.surpriseCare.modal.confirmSendNowBtn
                    : t.surpriseCare.modal.confirmScheduleBtn}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
