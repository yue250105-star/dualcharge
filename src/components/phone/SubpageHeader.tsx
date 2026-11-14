import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface SubpageHeaderProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
}

export const SubpageHeader: React.FC<SubpageHeaderProps> = ({
  title,
  subtitle,
  backLabel = 'Back',
  onBack,
  rightSlot,
}) => {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-3 border-b border-[#E9E4DB]/80 bg-[#F7F5F0]/95 px-4 py-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-1 rounded-xl border border-[#E9E4DB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#292832] shadow-xs transition hover:border-[#292832]/30 hover:bg-[#FAF8F4] active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4 text-[#292832]" />
          <span>{backLabel}</span>
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#292832]">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[11px] font-medium text-[#7A7885]">{subtitle}</p>
          )}
        </div>

        <div className="flex min-w-[44px] shrink-0 items-center justify-end">
          {rightSlot ?? null}
        </div>
      </div>
    </div>
  );
};
