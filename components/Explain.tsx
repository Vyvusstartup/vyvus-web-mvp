"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  score: number;
  subscores: Record<string, number>;
};

type Detail = {
  name: string;
  why: string;
  guideline: string;
  est_points: number;
  refs?: Array<{ title: string; url?: string }>;
};

type ResponseData = {
  mode: "basic" | "advanced";
  lang: "es" | "en";
  intro: string;
  tips: string[];
  details?: Detail[];
  sources?: Array<{ title: string; url?: string }>;
  disclaimer: string;
};

export default function Explain({ score, subscores }: Props) {
  const { lang, t } = useI18n();
  const [mode, setMode] = useState<"basic" | "advanced">("advanced");
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);

  const payload = useMemo(
    () => ({ score, subscores, lang, mode }),
    [score, subscores, lang, mode]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/assistant/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: ctrl.signal
        });
        const json = await res.json();
        if (!ctrl.signal.aborted) setData(json);
      } catch {
        if (!ctrl.signal.aborted) setData(null);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };
    run();
    return () => ctrl.abort();
  }, [payload]);

  // Mapa índice → fuente para superíndices [1], [2], ...
  const sourceIndex = useMemo(() => {
    const m = new Map<string, number>();
    if (data?.sources) {
      data.sources.forEach((s, i) => {
        const key = (s.url || s.title || "").trim();
        if (key) m.set(key, i + 1); // 1-based
      });
    }
    return m;
  }, [data]);

  // Busca el primer índice de fuente que corresponda a un detalle
  const firstRefIndex = (d: Detail) => {
    if (!d.refs || !data?.sources) return undefined;
    for (const r of d.refs) {
      const key = (r.url || r.title || "").trim();
      const idx = sourceIndex.get(key);
      if (idx) return idx;
    }
    return undefined;
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Toggle básico/avanzado */}
      <div className="flex gap-2">
        <button
          className={`btn ${mode === "basic" ? "btn-primary" : "bg-neutral100"}`}
          onClick={() => setMode("basic")}
        >
          {t("actions.basic_mode")}
        </button>
        <button
          className={`btn ${mode === "advanced" ? "btn-primary" : "bg-neutral100"}`}
          onClick={() => setMode("advanced")}
        >
          {t("actions.advanced_mode")}
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-600">
          {lang === "en" ? "Generating explanation…" : "Generando explicación…"}
        </p>
      )}

      {!loading && data && (
        <div className="space-y-2">
          <p className="text-sm">{data.intro}</p>

          {data.tips?.length > 0 && (
            <>
              <h4 className="font-semibold">{t("result.tips")}</h4>
              <ul className="list-disc ml-5 text-sm">
                {data.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </>
          )}

          {mode === "advanced" && data.details && data.details.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-semibold">
                {lang === "en" ? "Why and how" : "Por qué y cómo"}
              </h5>
              <ul className="space-y-2 text-sm">
                {data.details.map((d, i) => {
                  const refIdx = firstRefIndex(d);
                  return (
                    <li key={i}>
                      <b>{d.name}</b>
                      {typeof refIdx === "number" && <sup>[{refIdx}]</sup>}
                      {": "}
                      {d.why} — {d.guideline}
                      {d.est_points > 0 && (
                        <> ({lang === "en" ? "est. +" : "est. +"}{d.est_points} {lang === "en" ? "pts" : "pts"})</>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {mode === "advanced" && data.sources && data.sources.length > 0 && (
            <details className="space-y-1">
              <summary className="font-semibold cursor-pointer">
                {lang === "en" ? "Sources" : "Fuentes"} ·{" "}
                <span className="text-xs text-neutral-500">
                  {lang === "en" ? "Evidence pack (demo)" : "Paquete de evidencia (demo)"} —{" "}
                  {lang === "en" ? "Last reviewed: Sep 2025" : "Última revisión: sep 2025"}
                </span>
              </summary>
              <ul className="list-disc ml-5 text-sm mt-2">
                {data.sources.map((s, i) => (
                  <li key={i}>
                    <span className="mr-1">[{i + 1}]</span>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="underline"
                      >
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <p className="text-xs text-neutral900/60">{data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

