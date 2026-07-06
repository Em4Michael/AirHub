'use client';

import React, { useMemo, useState } from 'react';

/**
 * WorkerHoursBar
 *
 * A single horizontal bar segmented by worker. Each worker's hours render as a
 * coloured slice; the remaining capacity (up to `cap`) shows as an empty track.
 * Hovering a slice reveals that worker's name and hours.
 *
 * When the total exceeds the cap (only really possible on the all-time view
 * where there's no true cap), the bar fills to 100% and no empty track shows.
 */

export interface WorkerSlice {
  id:    string;
  name:  string;
  hours: number;
}

// A distinct, readable palette. Colours are assigned by index so the same
// worker keeps the same colour across every bar on the page (callers pass a
// stable colour map, or we fall back to positional colours).
const PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6',
  '#a855f7', '#84cc16',
];

export function colourForIndex(i: number) {
  return PALETTE[i % PALETTE.length];
}

interface Props {
  slices:     WorkerSlice[];
  cap:        number;          // denominator for the track (0 → use total)
  colourMap?: Record<string, string>;
  height?:    number;
  showLegend?: boolean;
  unit?:      string;
}

export const WorkerHoursBar: React.FC<Props> = ({
  slices,
  cap,
  colourMap,
  height = 22,
  showLegend = true,
  unit = 'h',
}) => {
  const [hover, setHover] = useState<string | null>(null);

  const total = useMemo(
    () => slices.reduce((s, w) => s + (w.hours || 0), 0),
    [slices]
  );

  // Denominator: the cap, unless the total already exceeds it (or cap is 0).
  const denom = cap > 0 ? Math.max(cap, total) : total || 1;

  const colour = (id: string, idx: number) =>
    colourMap?.[id] ?? colourForIndex(idx);

  const filledPct = denom > 0 ? Math.min(100, (total / denom) * 100) : 0;

  return (
    <div className="w-full">
      {/* Track */}
      <div
        className="w-full rounded-full overflow-hidden flex"
        style={{
          height,
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
        }}
        role="img"
        aria-label={`${total.toFixed(2)}${unit} of ${cap > 0 ? cap : total}${unit} used`}
      >
        {slices
          .filter((w) => w.hours > 0)
          .map((w, idx) => {
            const pct = denom > 0 ? (w.hours / denom) * 100 : 0;
            const active = hover === w.id;
            return (
              <div
                key={w.id}
                onMouseEnter={() => setHover(w.id)}
                onMouseLeave={() => setHover(null)}
                title={`${w.name}: ${w.hours}${unit}`}
                style={{
                  width: `${pct}%`,
                  backgroundColor: colour(w.id, idx),
                  opacity: hover && !active ? 0.55 : 1,
                  transition: 'opacity 150ms ease',
                  cursor: 'default',
                }}
              />
            );
          })}
      </div>

      {/* Caption */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {total.toFixed(2)}{unit}
          {cap > 0 && (
            <span style={{ color: 'var(--text-muted)' }}> / {cap}{unit}</span>
          )}
        </span>
        {cap > 0 && (
          <span className="text-[11px] font-semibold tabular-nums"
            style={{ color: filledPct >= 100 ? '#ef4444' : 'var(--text-muted)' }}>
            {Math.round(filledPct)}%
          </span>
        )}
      </div>

      {/* Legend */}
      {showLegend && slices.filter((w) => w.hours > 0).length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {slices
            .filter((w) => w.hours > 0)
            .map((w, idx) => (
              <div
                key={w.id}
                className="flex items-center gap-1.5"
                onMouseEnter={() => setHover(w.id)}
                onMouseLeave={() => setHover(null)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: colour(w.id, idx) }}
                />
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {w.name}
                </span>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {w.hours}{unit}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};