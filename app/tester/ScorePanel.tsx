"use client";

import { useMemo, useState } from "react";
import ScoreTimeline from "./ScoreTimeline";
import RecalcButton from "./RecalcButton";

type Subscores = Record<string, number | null>;

type SeriesRow = {
  date: string;
  score: number | null;
  subscores?: Subscores | null;
  reliability_flag?: string | null;
  coverage_percent?: number | null;
  last_saved_at?: string | null;
};

type Props = {
  code: string;
  // puntos para el gráfico (simple)
  points: Array<{ date: string; value: number | null }>;
  // filas completas (score + subscores + meta) para que todo cambie al seleccionar
  rows: SeriesRow[];
  // estado inicial (lo que ya tienes para la fecha de la URL)
  initial: {
    date: string;
    score: number;
    subscores: Subscores;
    reliability_flag?: string | null;
    coverage_percent?: number | null;
    last_saved_at?: string | null;
  };
  // server action para recalcular
  onRecalc: (fd: FormData) => Promise<void>;
  canRecalc: boolean;
};

export default function ScorePanel({
  code,
  points,
  rows,
  initial,
  onRecalc,
  canRecalc,
}: Props) {
  // índice del punto activo
  const initialIndex = useMemo(() => {
    const idx = rows.findIndex((r) => r.date === initial.date);
    return idx >= 0 ? idx : rows.length - 1;
  }, [rows, initial.date]);

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  const active = rows[activeIndex] ?? {
    date: initial.date,
    score: initial.score,
    subscores: initial.subscores,
    reliability_flag: initial.reliability_flag,
    coverage_percent: initial.coverage_percent,
    last_saved_at: initial.last_saved_at,
  };

  // Render
  return (
    <div className="flex flex-col items-center">
      {/* Gráfica centrada */}
      <div className="w-full">
        <ScoreTimeline
          data={points}
          onPick={(p) => {
            const i = rows.findIndex((r) => r.date === p.date);
            if (i >= 0) setActiveIndex(i);
          }}
          className="mx-auto"
        />
      </div>

      {/* Score + badges debajo de la gráfica */}
      <div className="mt-3 w-full flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-end gap-2">
          <div className="text-4xl font-bold">
            {active.score == null ? "—" : Math.round(active.score)}
            <span className="text-xl">/100</span>
          </div>
          <div className="text-sm text-gray-500">{active.date}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {typeof active.coverage_percent === "number" && (
            <span className="rounded-full px-2 py-1 border">
              cobertura: {active.coverage_percent.toFixed(2)}%
            </span>
          )}
          {active.reliability_flag && (
            <span
              className={`rounded-full px-2 py-1 border ${
                active.reliability_flag === "green"
                  ? "border-green-500 text-green-600"
                  : active.reliability_flag === "yellow" ||
                    active.reliability_flag === "amber"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-red-500 text-red-600"
              }`}
            >
              {active.reliability_flag}
            </span>
          )}
          {active.last_saved_at && (
            <span className="rounded-full px-2 py-1 border">
              last_saved_at: {new Date(active.last_saved_at).toISOString()}
            </span>
          )}
        </div>
      </div>

      {/* Subscores (los 10 biomarcadores) cambian con la fecha activa */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm w-full">
        {Object.entries(active.subscores || {}).map(([k, v]) => (
          <div key={k} className="flex justify-between border rounded-xl px-3 py-2">
            <span className="truncate">{k}</span>
            <span className="font-medium">
              {v == null ? "—" : Number(v).toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Recalcular para la fecha activa */}
      <form action={onRecalc} method="post" className="mt-6 w-full">
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="date" value={active.date} />
        <RecalcButton
          disabled={!canRecalc}
          label={canRecalc ? "Recalcular y guardar" : "Sin datos para recalcular"}
          testerCode={code}
          date={active.date}
        />
      </form>
    </div>
  );
}
