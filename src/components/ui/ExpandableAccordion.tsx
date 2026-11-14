import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableAccordionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ExpandableAccordion: React.FC<ExpandableAccordionProps> = ({
  title,
  subtitle,
  badge,
  icon,
  defaultOpen = false,
  children,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#E9E4DB] bg-white shadow-xs transition ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#FAF8F4]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#292832]">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#292832]">
                {title}
              </span>
              {badge && (
                <span className="rounded-md bg-[#F4F1EA] px-1.5 py-0.5 text-[10px] font-semibold text-[#64626E]">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-[#7A7885]">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#7A7885] transition-transform duration-200 ${
            open ? 'rotate-180 text-[#292832]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-[#F0ECE3] bg-[#FCFBF8] px-4 py-3 text-xs leading-relaxed text-[#52505C]">
          {children}
        </div>
      )}
    </div>
  );
};
