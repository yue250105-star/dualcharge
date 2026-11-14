import React, { useEffect, useState } from 'react';
import { Bell, CalendarClock, Clock, Info, X } from 'lucide-react';
import { formatTemplate, TranslationDictionary } from '@/src/i18n/translations';
import { CareReminderPresetKey } from '@/src/types/aiCare';

interface RemindLaterSheetProps {
  open: boolean;
  recommendationTitle: string;
  t: TranslationDictionary;
  onClose: () => void;
  onConfirm: (presetKey: CareReminderPresetKey, customISO?: string | null) => void;
}

function getDefaultCustomLocalInput(): string {
  const target = new Date(Date.now() + 2 * 60 * 60 * 1000);
  target.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

export function RemindLaterSheet({
  open,
  recommendationTitle,
  t,
  onClose,
  onConfirm,
}: RemindLaterSheetProps) {
  const [selectedPreset, setSelectedPreset] = useState<CareReminderPresetKey>('in_1_hour');
  const [customDateTime, setCustomDateTime] = useState<string>(getDefaultCustomLocalInput);

  useEffect(() => {
    if (!open) return;
    setSelectedPreset('in_1_hour');
    setCustomDateTime(getDefaultCustomLocalInput());
  }, [open, recommendationTitle]);

  if (!open) return null;

  const presetOptions: Array<{ key: CareReminderPresetKey; label: string }> = [
    { key: 'in_1_hour', label: t.deliveryCare.reminder.presetInOneHour },
    { key: 'later_today', label: t.deliveryCare.reminder.presetLaterToday },
    { key: 'tomorrow', label: t.deliveryCare.reminder.presetTomorrow },
    { key: 'custom', label: t.deliveryCare.reminder.presetCustom },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.deliveryCare.reminder.sheetTitle}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#292832]/40 backdrop-blur-[2px] p-3"
    >
      <div className="w-full max-h-[88%] overflow-y-auto rounded-[24px] bg-white border border-[#292832]/[0.06] shadow-2xl p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#EFEDF5] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#706794]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-[15px] font-semibold text-[#292832]">
                {t.deliveryCare.reminder.sheetTitle}
              </h2>
              <p className="text-[11px] text-[#85838D] leading-snug mt-0.5">
                {formatTemplate(t.deliveryCare.reminder.sheetSubtitle, {
                  title: recommendationTitle,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.meta.cancel}
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-[#85838D] hover:bg-[#F4EFEA] active:scale-95 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          {presetOptions.map((opt) => {
            const active = selectedPreset === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedPreset(opt.key)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl text-left text-[12.5px] font-semibold flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                  active
                    ? 'bg-[#EFEDF5] text-[#292832] ring-1 ring-[#9B93B8]'
                    : 'bg-[#FDFBFA] text-[#292832]/85 border border-[#292832]/[0.07] hover:bg-[#F4EFEA]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {opt.key === 'custom' ? (
                    <CalendarClock className="w-4 h-4 text-[#706794] shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#706794] shrink-0" />
                  )}
                  <span>{opt.label}</span>
                </span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    active ? 'border-[#706794] bg-[#706794]' : 'border-[#85838D]/40'
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>

        {selectedPreset === 'custom' && (
          <div className="space-y-1.5 bg-[#FDFBFA] rounded-2xl p-3 border border-[#292832]/[0.06]">
            <label
              htmlFor="dc-custom-reminder-input"
              className="block text-[11px] font-semibold text-[#706794]"
            >
              {t.deliveryCare.reminder.customDateTimeLabel}
            </label>
            <input
              id="dc-custom-reminder-input"
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full min-h-[42px] rounded-xl bg-white border border-[#292832]/12 px-3 text-[12.5px] text-[#292832] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#9B93B8]"
            />
          </div>
        )}

        <div className="rounded-2xl bg-[#FBF7F5] border border-[#292832]/[0.05] px-3 py-2 flex items-start gap-2 text-[10.5px] text-[#85838D] leading-snug">
          <Info className="w-3.5 h-3.5 text-[#706794] shrink-0 mt-0.5" />
          <span>{t.deliveryCare.reminder.clientOnlyNote}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[12.5px] font-semibold active:scale-95 transition-all"
          >
            {t.meta.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              const parsedCustom =
                selectedPreset === 'custom' && customDateTime
                  ? new Date(customDateTime).toISOString()
                  : null;
              onConfirm(selectedPreset, parsedCustom);
            }}
            className="flex-1 min-h-[44px] px-4 rounded-2xl bg-[#706794] hover:bg-[#5E5580] text-white text-[12.5px] font-semibold active:scale-95 transition-all"
          >
            {t.deliveryCare.reminder.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
