// app/tester/ScoreTimeline.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';

type Pt = { date: string; value: number | null };

// fuerza número seguro
function toNum(x: unknown, fb = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fb;
}

export default function ScoreTimeline({
  data,
  onPick,
  className = '',
}: {
  data: Pt[];
  onPick?: (p: { date: string; score: number | null }) => void;
  className?: string;
}) {
  // normalizo a {date, score}
  const points = useMemo(
    () => data.map(d => ({ date: d.date, score: d.value == null ? null : toNum(d.value) })),
    [data]
  );

  // índice por defecto: último punto con score
  const defaultIdx = useMemo(() => {
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i]?.score != null) return i;
    }
    return Math.max(points.length - 1, 0);
  }, [points]);

  const [idx, setIdx] = useState(defaultIdx);

  // si cambia la ventana de datos, re-sincroniza índice al final
  useEffect(() => setIdx(defaultIdx), [defaultIdx]);

  // notifica selección al padre
  useEffect(() => {
    if (!onPick) return;
    const p = points[idx];
    if (p) onPick({ date: p.date, score: p.score ?? null });
  }, [idx, onPick, points]);

  // dominio Y con padding
  const yDomain = useMemo(() => {
    const vals = points.map(p => p.score).filter((v): v is number => v != null);
    if (!vals.length) return [0, 100] as [number, number];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(2, (max - min) * 0.1);
    return [min - pad, max + pad] as [number, number];
  }, [points]);

  // ticks del eje X: ~6 marcas
  const xTicks = useMemo(() => {
    if (points.length <= 1) return points.map(p => p.date);
    const step = Math.ceil(points.length / 6);
    const arr: string[] = [];
    for (let i = 0; i < points.length; i += step) arr.push(points[i].date);
    if (arr[arr.length - 1] !== points[points.length - 1].date) {
      arr.push(points[points.length - 1].date);
    }
    return arr;
  }, [points]);

  return (
    <div className={className}>
      {/* Gráfico estático con un punto que se mueve */}
      <div className="h-36 sm:h-40 md:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            onClick={(e: any) => {
              if (e && typeof e.activeTooltipIndex === 'number') {
                setIdx(e.activeTooltipIndex);
              }
            }}
          >
            <XAxis
              dataKey="date"
              ticks={xTicks}              // solo algunas fechas
              interval={0}
              tickFormatter={(d: string) => d.slice(5)} // MM-DD
              axisLine={false}
              tickLine={false}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis hide domain={yDomain} />
            <Tooltip contentStyle={{ display: 'none' }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1f7bb6"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            {points[idx] && points[idx].score != null && (
              <ReferenceDot
                x={points[idx].date}
                y={points[idx].score!}
                r={5}
                fill="#1f7bb6"
                stroke="#ffffff"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scrubber de UNA sola manija */}
      <input
        type="range"
        min={0}
        max={Math.max(points.length - 1, 0)}
        value={idx}
        onChange={e => setIdx(Number(e.target.value))}
        className="w-full mt-2 accent-gray-700"
      />

      <div className="text-right text-xs text-gray-500 mt-1">
        últimos {points.length} días (ajustable)
      </div>
    </div>
  );
}
