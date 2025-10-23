'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { useMemo, useState } from 'react';

type Pt = { date: string; value: number | null };

// fuerza a número (evita NaN)
function toNum(x: unknown, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export default function ScoreTimeline({
  data,
  windowDays = 30,
  onPick,
  className = '',
}: {
  data: Pt[];
  windowDays?: number;
  onPick?: (p: { date: string; score: number }) => void;
  className?: string;
}) {
  const points = useMemo(
    () =>
      (data ?? [])
        .filter((d) => d.value != null)
        .map((d) => ({ date: d.date, score: Math.round(Number(d.value)) })),
    [data]
  );

  const [range, setRange] = useState<{ startIndex: number; endIndex: number }>(
    () => {
      const n = points.length;
      const end = Math.max(0, n - 1);
      const start = Math.max(0, n - windowDays);
      return { startIndex: start, endIndex: end };
    }
  );

  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(0, points.length - 1)
  );

  const view = points.slice(range.startIndex, range.endIndex + 1);
  const active =
    points.length === 0
      ? null
      : points[Math.min(activeIndex, points.length - 1)];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-baseline justify-end gap-2 mb-1">
        {active ? (
          <>
            <div className="text-2xl font-semibold">
              {active.score}
              <span className="text-sm">/100</span>
            </div>
            <div className="text-xs text-gray-500">{active.date}</div>
          </>
        ) : (
          <div className="text-xs text-gray-500">sin datos suficientes</div>
        )}
      </div>

      {/* Gráfico principal */}
      <div className="h-28 w-full">
        <ResponsiveContainer>
          <LineChart
            data={view}
            onMouseMove={(e: any) => {
              if (e && e.activeTooltipIndex != null) {
                const rel = toNum(e.activeTooltipIndex, 0);
                const idx = range.startIndex + rel;
                setActiveIndex(idx);
                const p = points[idx];
                if (p && onPick) onPick(p);
              }
            }}
          >
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              isAnimationActive={false}
              formatter={(v) => [`${v as number}/100`, 'score']}
              labelFormatter={(l) => l as string}
            />
            <Line type="monotone" dataKey="score" dot={false} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Brush para desplazar/zoom del rango */}
      <div className="h-8 w-full">
        <ResponsiveContainer>
          <LineChart data={points}>
            <Brush
              dataKey="date"
              startIndex={range.startIndex}
              endIndex={range.endIndex}
              onChange={(r: any) => {
                if (!r) return;
                const start = toNum(r.startIndex, 0);
                const end = toNum(r.endIndex, points.length - 1);
                setRange({ startIndex: start, endIndex: end });
                setActiveIndex(end);
                const p = points[end];
                if (p && onPick) onPick(p);
              }}
              travellerWidth={10}
              height={24}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[10px] text-gray-500 text-right mt-1">
        últimos {windowDays} días (ajustable)
      </div>
    </div>
  );
}
