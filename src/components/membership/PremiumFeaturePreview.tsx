import React from 'react';
import { ArrowLeft, Check, Crown, Lock } from 'lucide-react';

interface PremiumFeaturePreviewProps {
  badgeLabel: string;
  title: string;
  description: string;
  benefits?: string[];
  previewTeaser?: React.ReactNode;
  upgradeLabel: string;
  backLabel?: string;
  onUpgrade: () => void;
  onBack?: () => void;
}

export function PremiumFeaturePreview({
  badgeLabel,
  title,
  description,
  benefits = [],
  previewTeaser,
  upgradeLabel,
  backLabel,
  onUpgrade,
  onBack,
}: PremiumFeaturePreviewProps) {
  return (
    <section
      aria-label={title}
      className="bg-gradient-to-br from-[#FBF7F5] via-white to-[#EFEDF5]/75 rounded-[22px] p-4 ring-1 ring-[#9B93B8]/30 shadow-[0_10px_28px_-10px_rgba(41,40,50,0.07)] space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[#5B527E] bg-[#EFEDF5] px-2.5 py-0.5 rounded-lg">
          <Lock className="w-3 h-3 shrink-0" strokeWidth={2.2} />
          <span>{badgeLabel}</span>
        </div>
        <Crown className="w-4 h-4 text-[#9B93B8] shrink-0" strokeWidth={2} />
      </div>

      <div className="space-y-1">
        <h3 className="font-display text-[14.5px] font-semibold text-[#292832] leading-snug">
          {title}
        </h3>
        <p className="text-[12px] text-[#85838D] leading-relaxed">{description}</p>
      </div>

      {previewTeaser && (
        <div className="rounded-2xl bg-white/80 border border-[#292832]/[0.06] p-3">
          {previewTeaser}
        </div>
      )}

      {benefits.length > 0 && (
        <ul className="space-y-1.5 text-[11.5px] text-[#292832]/85">
          {benefits.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#8FA89B] shrink-0 mt-0.5" strokeWidth={2.2} />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        {onBack && backLabel && (
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] px-3 rounded-2xl bg-[#F4EFEA] hover:bg-[#EAE3DC] text-[#292832] text-[11.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>{backLabel}</span>
          </button>
        )}
        <button
          type="button"
          onClick={onUpgrade}
          className="flex-1 min-h-[40px] px-3.5 rounded-2xl bg-[#9B93B8] hover:bg-[#8A81AC] text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-[0_8px_20px_-8px_rgba(155,147,184,0.65)] transition-all active:scale-95"
        >
          <Crown className="w-3.5 h-3.5 shrink-0" />
          <span>{upgradeLabel}</span>
        </button>
      </div>
    </section>
  );
}
