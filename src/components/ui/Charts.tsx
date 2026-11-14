import React, { useState } from 'react';
import { getEnergyStateStyle } from '@/src/components/ui/EnergyIndicator';
import { useDualCharge } from '@/src/context/DualChargeContext';
import { formatTemplate } from '@/src/i18n/translations';
import { ForecastDay, HistoricalEnergyPoint } from '@/src/types/dualcharge';

interface Point2D {
  x: number;
  y: number;
}

// Convert discrete points into a smooth organic Catmull-Rom cubic Bezier SVG path
function buildSmoothCurvePath(pts: Point2D[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  const tension = 0.2;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = Math.min(pts.length - 1, i + 2);

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (pts[p3].x - p1.x) * tension;
    const cp2y = p2.y - (pts[p3].y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

interface HistoricalTrendChartProps {
  data: HistoricalEnergyPoint[];
  highlightWeekdayIndex?: number | null;
  detectedWeekdayCount?: number;
  showSleepDetail?: boolean;
}

export function HistoricalTrendChart({
  data,
  highlightWeekdayIndex = null,
  detectedWeekdayCount = 0,
  showSleepDetail = true,
}: HistoricalTrendChartProps) {
  const { language, t } = useDualCharge();
  const [selectedIndex, setSelectedIndex] = useState<number>(Math.max(0, data.length - 1));

  const width = 316;
  const height = 156;
  const padLeft = 24;
  const padRight = 10;
  const padTop = 18;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
  const getY = (val: number) => padTop + ((100 - val) / 100) * plotH;

  const coords: Point2D[] = data.map((pt, idx) => ({
    x: getX(idx),
    y: getY(pt.energy),
  }));

  const smoothLinePath = buildSmoothCurvePath(coords);
  const smoothAreaPath =
    coords.length > 0
      ? `${smoothLinePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const safeIndex = Math.min(selectedIndex, Math.max(0, data.length - 1));
  const selectedPoint = data[safeIndex] ?? data[data.length - 1];
  const selectedCoord = coords[safeIndex] ?? coords[coords.length - 1];

  const formatShortDate = (pt: HistoricalEnergyPoint) => {
    const month = t.calendar.monthsShort[pt.monthIndex];
    if (language === 'en') {
      return `${month} ${pt.dayOfMonth}`;
    }
    return `${month}${pt.dayOfMonth}日`;
  };

  const hasHighlightedWeekday = highlightWeekdayIndex !== null && highlightWeekdayIndex !== undefined;
  const highlightedWeekdayName = hasHighlightedWeekday
    ? t.calendar.weekdaysFull[highlightWeekdayIndex]
    : '';
  const selectedWeekday = selectedPoint ? t.calendar.weekdaysShort[selectedPoint.weekdayIndex] : '';
  const lineColor = hasHighlightedWeekday ? '#9B93B8' : '#8FA89B';
  const fillGradId = hasHighlightedWeekday ? 'historyFillLavender' : 'historyFillSage';

  const matchesHighlightedWeekday = (pt: HistoricalEnergyPoint) =>
    hasHighlightedWeekday && pt.weekdayIndex === highlightWeekdayIndex;

  return (
    <div>
      {/* Supportive Rest Annotation when a recurring weekday dip is detected */}
      {hasHighlightedWeekday && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-[#F5E8E7]/75 px-3 py-1.5 text-[11px] text-[#8E4D42]">
          <span className="font-medium">
            {formatTemplate(t.insights.restReminderAnnotationTemplate, {
              weekday: highlightedWeekdayName,
            })}
          </span>
          <span className="text-[10.5px] text-[#85838D]">{t.insights.historicalBadge}</span>
        </div>
      )}

      {/* Selected day readout */}
      {selectedPoint && (
        <div className="flex items-center justify-between text-[11.5px] mb-2 min-h-[20px] gap-2">
          <span className="text-[#85838D] truncate">
            {selectedWeekday}, {formatShortDate(selectedPoint)}
            {matchesHighlightedWeekday(selectedPoint)
              ? ` · ${formatTemplate(t.insights.weekdayDipTagTemplate, {
                  weekday: highlightedWeekdayName,
                })}`
              : ''}
          </span>
          <span className="font-semibold text-[#292832] tabular-nums shrink-0">
            {t.insights.indexLabel} {selectedPoint.energy} / 100
            {showSleepDetail && selectedPoint.prevNightSleepHours !== null
              ? ` · ${t.insights.sleepShortLabel} ${selectedPoint.prevNightSleepHours}h`
              : ''}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        role="img"
        aria-label={t.insights.historicalTrendTitle}
      >
        <defs>
          <linearGradient id="historyFillLavender" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9B93B8" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#E88C7D" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FDFBFA" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="historyFillSage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8FA89B" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#FDFBFA" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Minimal gentle horizontal guides */}
        {[25, 50, 75, 100].map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#292832"
                strokeOpacity="0.05"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-[#85838D] text-[9px] tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Soft vertical glow bands for detected pattern weekday */}
        {hasHighlightedWeekday &&
          data.map((pt, idx) =>
            matchesHighlightedWeekday(pt) ? (
              <rect
                key={`band-${pt.dateISO}`}
                x={getX(idx) - 4}
                y={padTop}
                width={8}
                height={plotH}
                rx={4}
                fill="#C98D82"
                fillOpacity="0.1"
              />
            ) : null
          )}

        {/* Soft gradient area fill */}
        <path d={smoothAreaPath} fill={`url(#${fillGradId})`} />

        {/* Smooth curved trend line */}
        <path
          d={smoothLinePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Subtle dot indicators on detected pattern weekday */}
        {hasHighlightedWeekday &&
          data.map((pt, idx) =>
            matchesHighlightedWeekday(pt) ? (
              <circle
                key={pt.dateISO}
                cx={coords[idx].x}
                cy={coords[idx].y}
                r={idx === safeIndex ? 4.8 : 3.2}
                fill="#C98D82"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            ) : null
          )}

        {/* Selected crosshair & marker */}
        {selectedCoord && (
          <>
            <line
              x1={selectedCoord.x}
              y1={padTop}
              x2={selectedCoord.x}
              y2={padTop + plotH}
              stroke="#E88C7D"
              strokeOpacity="0.45"
              strokeDasharray="2 3"
            />
            <circle
              cx={selectedCoord.x}
              cy={selectedCoord.y}
              r="6"
              fill="#E88C7D"
              fillOpacity="0.18"
            />
            <circle
              cx={selectedCoord.x}
              cy={selectedCoord.y}
              r="3.8"
              fill="#292832"
              stroke="#FFFFFF"
              strokeWidth="1.6"
            />
          </>
        )}

        {/* Interactive touch hit zones across historical days */}
        {data.map((pt, idx) => {
          const stepW = plotW / Math.max(1, data.length);
          return (
            <rect
              key={pt.dateISO}
              x={getX(idx) - stepW / 2}
              y={padTop}
              width={Math.max(stepW, 5)}
              height={plotH}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setSelectedIndex(idx)}
              onMouseEnter={() => setSelectedIndex(idx)}
            />
          );
        })}

        {/* X-axis date labels */}
        <text x={padLeft} y={height - 5} textAnchor="start" className="fill-[#85838D] text-[9px]">
          {data[0] ? formatShortDate(data[0]) : ''}
        </text>
        <text
          x={padLeft + plotW / 2}
          y={height - 5}
          textAnchor="middle"
          className="fill-[#85838D] text-[9px]"
        >
          {data[Math.floor(data.length / 2)]
            ? formatShortDate(data[Math.floor(data.length / 2)])
            : ''}
        </text>
        <text x={width - padRight} y={height - 5} textAnchor="end" className="fill-[#85838D] text-[9px]">
          {data[data.length - 1] ? formatShortDate(data[data.length - 1]) : ''}
        </text>
      </svg>

      {hasHighlightedWeekday && (
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#85838D]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9B93B8] inline-block" aria-hidden="true" />
            {t.insights.legendDailyEnergy}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C98D82] inline-block" aria-hidden="true" />
            {formatTemplate(t.insights.legendObservedWeekdayTemplate, {
              weekday: highlightedWeekdayName,
              count: detectedWeekdayCount,
            })}
          </span>
        </div>
      )}
    </div>
  );
}

interface ForecastChartProps {
  days: ForecastDay[];
  selectedDateISO: string;
  onSelectDay: (day: ForecastDay) => void;
}

export function ForecastChart({ days, selectedDateISO, onSelectDay }: ForecastChartProps) {
  const { t } = useDualCharge();

  return (
    <div className="grid grid-cols-7 gap-1.5 items-end pt-2 pb-1">
      {days.map((day) => {
        const isSelected = day.dateISO === selectedDateISO;
        const hasEstimate = day.estimatedEnergy !== null && day.confidence !== 'Insufficient Data';
        const style = getEnergyStateStyle(day.estimatedEnergy ?? 50);
        const barHeightPx = hasEstimate
          ? Math.max(22, Math.round(((day.estimatedEnergy ?? 0) / 100) * 86))
          : 26;
        const shortDayLabel = t.calendar.weekdaysShort[day.weekdayIndex];

        return (
          <button
            key={day.dateISO}
            type="button"
            onClick={() => onSelectDay(day)}
            className={`flex flex-col items-center rounded-2xl py-2 px-0.5 transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#E88C7D] min-h-[44px] ${
              isSelected
                ? 'bg-[#FDFBFA] shadow-[0_6px_16px_-6px_rgba(41,40,50,0.12)] ring-1 ring-[#E88C7D]/35'
                : day.isHighlighted
                  ? 'bg-[#F5E8E7]/55 hover:bg-[#F5E8E7]/85'
                  : 'hover:bg-[#F4EFEA]/70'
            }`}
            aria-pressed={isSelected}
          >
            <span className="text-[11px] font-semibold text-[#292832] tabular-nums mb-1.5">
              {hasEstimate ? day.estimatedEnergy : '—'}
            </span>
            <div className="w-full h-[88px] flex items-end justify-center px-1">
              {hasEstimate ? (
                <div
                  className={`w-full max-w-[20px] rounded-t-full rounded-b-md transition-all duration-300 ${style.barBg} ${
                    day.isHighlighted ? 'opacity-95 ring-4 ring-[#C98D82]/20' : 'opacity-85'
                  }`}
                  style={{ height: `${barHeightPx}px` }}
                />
              ) : (
                <div
                  className="w-full max-w-[20px] rounded-t-full rounded-b-md border border-dashed border-[#85838D]/40 bg-[#F4EFEA]/70"
                  style={{ height: `${barHeightPx}px` }}
                />
              )}
            </div>
            <span
              className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                day.isHighlighted ? 'text-[#8E4D42] font-semibold' : 'text-[#85838D]'
              }`}
            >
              {shortDayLabel}
            </span>
            <span className="text-[10px] text-[#85838D] tabular-nums">{day.dayOfMonth}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface BiometricPoint {
  dateISO: string;
  monthIndex: number;
  dayOfMonth: number;
  weekdayIndex: number;
  value: number | null;
}

interface BiometricTrendChartProps {
  points: BiometricPoint[];
  baseline: number | null;
  unit: string;
  accentColor?: string;
  ariaLabel: string;
  unavailableLabel: string;
  baselineLabel: string;
}

export function BiometricTrendChart({
  points,
  baseline,
  unit,
  accentColor = '#706794',
  ariaLabel,
  unavailableLabel,
  baselineLabel,
}: BiometricTrendChartProps) {
  const { language, t } = useDualCharge();
  const [selectedIndex, setSelectedIndex] = useState<number>(Math.max(0, points.length - 1));

  const validValues = points
    .map((p) => p.value)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  if (validValues.length === 0) {
    return (
      <div className="rounded-2xl bg-[#FDFBFA] border border-dashed border-[#292832]/15 p-4 text-center text-[11.5px] text-[#85838D]">
        {unavailableLabel}
      </div>
    );
  }

  const minRaw = Math.min(...validValues, baseline ?? validValues[0]);
  const maxRaw = Math.max(...validValues, baseline ?? validValues[0]);
  const span = Math.max(6, maxRaw - minRaw);
  const yMin = Math.floor(minRaw - span * 0.2);
  const yMax = Math.ceil(maxRaw + span * 0.2);

  const width = 316;
  const height = 128;
  const padLeft = 28;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 22;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / Math.max(1, points.length - 1)) * plotW;
  const getY = (val: number) => padTop + ((yMax - val) / Math.max(1, yMax - yMin)) * plotH;

  // Build disconnected segments across non-null points so null gaps stay visibly blank (never 0)
  const segments: string[] = [];
  let activeSeg: Point2D[] = [];
  points.forEach((pt, idx) => {
    if (pt.value !== null && Number.isFinite(pt.value)) {
      activeSeg.push({ x: getX(idx), y: getY(pt.value) });
    } else if (activeSeg.length > 0) {
      segments.push(buildSmoothCurvePath(activeSeg));
      activeSeg = [];
    }
  });
  if (activeSeg.length > 0) {
    segments.push(buildSmoothCurvePath(activeSeg));
  }

  const safeIdx = Math.min(selectedIndex, Math.max(0, points.length - 1));
  const selected = points[safeIdx];
  const selectedVal = selected?.value ?? null;
  const selectedY = selectedVal !== null ? getY(selectedVal) : null;

  const formatShortDate = (pt: BiometricPoint) => {
    const month = t.calendar.monthsShort[pt.monthIndex];
    return language === 'en' ? `${month} ${pt.dayOfMonth}` : `${month}${pt.dayOfMonth}日`;
  };

  const baselineY = baseline !== null ? getY(baseline) : null;

  return (
    <div>
      {selected && (
        <div className="flex items-center justify-between text-[11px] mb-1.5 min-h-[18px] gap-2">
          <span className="text-[#85838D] truncate">
            {t.calendar.weekdaysShort[selected.weekdayIndex]}, {formatShortDate(selected)}
          </span>
          <span className="font-semibold text-[#292832] tabular-nums shrink-0">
            {selectedVal !== null ? `${selectedVal} ${unit}` : unavailableLabel}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
        role="img"
        aria-label={ariaLabel}
      >
        {[yMin, Math.round((yMin + yMax) / 2), yMax].map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#292832"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
              <text
                x={padLeft - 5}
                y={y + 3}
                textAnchor="end"
                className="fill-[#85838D] text-[8.5px] tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {baselineY !== null && (
          <line
            x1={padLeft}
            y1={baselineY}
            x2={width - padRight}
            y2={baselineY}
            stroke={accentColor}
            strokeOpacity="0.45"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
        )}

        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Missing days subtle markers at bottom axis */}
        {points.map((pt, idx) =>
          pt.value === null ? (
            <circle
              key={`gap-${pt.dateISO}`}
              cx={getX(idx)}
              cy={padTop + plotH}
              r="1.8"
              fill="#85838D"
              fillOpacity="0.4"
            />
          ) : null
        )}

        {selectedVal !== null && selectedY !== null && (
          <>
            <line
              x1={getX(safeIdx)}
              y1={padTop}
              x2={getX(safeIdx)}
              y2={padTop + plotH}
              stroke="#E88C7D"
              strokeOpacity="0.4"
              strokeDasharray="2 3"
            />
            <circle
              cx={getX(safeIdx)}
              cy={selectedY}
              r="3.8"
              fill="#292832"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </>
        )}

        {points.map((pt, idx) => {
          const stepW = plotW / Math.max(1, points.length);
          return (
            <rect
              key={pt.dateISO}
              x={getX(idx) - stepW / 2}
              y={padTop}
              width={Math.max(stepW, 5)}
              height={plotH}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => setSelectedIndex(idx)}
              onMouseEnter={() => setSelectedIndex(idx)}
            />
          );
        })}

        <text x={padLeft} y={height - 4} textAnchor="start" className="fill-[#85838D] text-[8.5px]">
          {points[0] ? formatShortDate(points[0]) : ''}
        </text>
        <text x={width - padRight} y={height - 4} textAnchor="end" className="fill-[#85838D] text-[8.5px]">
          {points[points.length - 1] ? formatShortDate(points[points.length - 1]) : ''}
        </text>
      </svg>

      {baseline !== null && (
        <div className="mt-1 flex items-center justify-between text-[10.5px] text-[#85838D]">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 border-t border-dashed inline-block"
              style={{ borderColor: accentColor }}
            />
            <span>
              {baselineLabel}: {baseline} {unit}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

interface SleepStagesBreakdownBarProps {
  deepMin: number | null;
  remMin: number | null;
  lightMin: number | null;
  awakeMin: number | null;
  labels: {
    deep: string;
    rem: string;
    light: string;
    awake: string;
    minUnit: string;
    unavailable: string;
  };
}

export function SleepStagesBreakdownBar({
  deepMin,
  remMin,
  lightMin,
  awakeMin,
  labels,
}: SleepStagesBreakdownBarProps) {
  const total =
    (deepMin ?? 0) + (remMin ?? 0) + (lightMin ?? 0) + (awakeMin ?? 0);

  if (deepMin === null || remMin === null || lightMin === null || total <= 0) {
    return (
      <div className="text-[11.5px] text-[#85838D] py-1">{labels.unavailable}</div>
    );
  }

  const deepPct = Math.round((deepMin / total) * 100);
  const remPct = Math.round((remMin / total) * 100);
  const lightPct = Math.round((lightMin / total) * 100);
  const awakePct = Math.max(0, 100 - deepPct - remPct - lightPct);

  return (
    <div className="space-y-2">
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-[#F4EFEA]">
        <div style={{ width: `${deepPct}%` }} className="bg-[#706794]" title={labels.deep} />
        <div style={{ width: `${remPct}%` }} className="bg-[#9B93B8]" title={labels.rem} />
        <div style={{ width: `${lightPct}%` }} className="bg-[#8FA89B]" title={labels.light} />
        {awakePct > 0 && (
          <div style={{ width: `${awakePct}%` }} className="bg-[#E88C7D]/75" title={labels.awake} />
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 text-[10.5px] tabular-nums">
        <div>
          <div className="flex items-center gap-1 text-[#85838D]">
            <span className="w-2 h-2 rounded-full bg-[#706794] shrink-0" />
            <span className="truncate">{labels.deep}</span>
          </div>
          <div className="font-semibold text-[#292832] mt-0.5">
            {deepMin}
            {labels.minUnit}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#85838D]">
            <span className="w-2 h-2 rounded-full bg-[#9B93B8] shrink-0" />
            <span className="truncate">{labels.rem}</span>
          </div>
          <div className="font-semibold text-[#292832] mt-0.5">
            {remMin}
            {labels.minUnit}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#85838D]">
            <span className="w-2 h-2 rounded-full bg-[#8FA89B] shrink-0" />
            <span className="truncate">{labels.light}</span>
          </div>
          <div className="font-semibold text-[#292832] mt-0.5">
            {lightMin}
            {labels.minUnit}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#85838D]">
            <span className="w-2 h-2 rounded-full bg-[#E88C7D]/80 shrink-0" />
            <span className="truncate">{labels.awake}</span>
          </div>
          <div className="font-semibold text-[#292832] mt-0.5">
            {awakeMin ?? '—'}
            {awakeMin !== null ? labels.minUnit : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeekdayActivityChart({
  items,
  weekdaysShort,
  unitLabel,
}: {
  items: Array<{ weekdayIndex: number; avgMinutes: number | null; avgSteps: number | null }>;
  weekdaysShort: string[];
  unitLabel: string;
}) {
  const maxMin = Math.max(
    45,
    ...items.map((item) => item.avgMinutes ?? 0)
  );
  return (
    <div className="grid grid-cols-7 gap-1.5 items-end pt-1">
      {items.map((item) => {
        const val = item.avgMinutes;
        const barH = val !== null ? Math.max(14, Math.round((val / maxMin) * 52)) : 12;
        return (
          <div key={item.weekdayIndex} className="flex flex-col items-center">
            <span className="text-[9.5px] font-semibold text-[#292832] tabular-nums mb-1">
              {val !== null ? val : '—'}
            </span>
            <div className="w-full h-[54px] flex items-end justify-center px-1">
              <div
                className={`w-full max-w-[16px] rounded-t-full rounded-b-md ${
                  val !== null ? 'bg-[#8FA89B]' : 'border border-dashed border-[#85838D]/40'
                }`}
                style={{ height: `${barH}px` }}
                title={val !== null ? `${val} ${unitLabel}` : '—'}
              />
            </div>
            <span className="text-[9.5px] text-[#85838D] mt-1">
              {weekdaysShort[item.weekdayIndex]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

