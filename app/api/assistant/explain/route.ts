import { NextRequest, NextResponse } from "next/server";
import evidenceList from "@/data/evidence/vyvus_tier1_evidence.json";

type Lang = "es" | "en";
type EvidenceEntry = {
  key: string;
  name_es?: string; name_en?: string;
  why_es?: string; why_en?: string;
  guideline_es?: string; guideline_en?: string;
  norm_shape?: string;
  actions_es?: { text: string; suggested_delta?: number; unit?: string }[];
  actions_en?: { text: string; suggested_delta?: number; unit?: string }[];
  refs?: { title: string; url?: string }[];
};

const EVIDENCE_MAP: Record<string, EvidenceEntry> =
  Object.fromEntries((evidenceList as EvidenceEntry[]).map(e => [e.key, e]));

const keyMap: Record<string, string> = {
  vo2max_mlkgmin: "vo2max",
  steps_per_day: "steps_day",
  mvpa_min_per_day: "mvpa_min_day",
  sedentary_hours_per_day: "sedentary_hours_day",
  rhr_bpm: "rhr_bpm",
  hrv_rmssd_ms: "hrv_rmssd",
  sleep_duration_hours: "sleep_duration_hours",
  sleep_regularidad_SRI: "sleep_regularidad_SRI",
  sleep_efficiency_percent: "sleep_efficiency_pct",
  whtr_ratio: "whtr"
};
function toEvidenceKey(metricKey: string) {
  return keyMap[metricKey] ?? metricKey;
}
function topDeficits(subscores: Record<string, number>, k = 3) {
  return Object.entries(subscores).sort((a, b) => a[1] - b[1]).slice(0, k)
    .map(([metric, val]) => ({ metric, val }));
}
function estimatePointsGain(current: number) {
  const target = 70;
  return Math.max(0, Math.min(30, target - Math.round(current)));
}

export async function POST(req: NextRequest) {
  try {
    const { score, subscores, mode = "advanced", lang = "es" } = await req.json() as {
      score: number; subscores: Record<string, number>; mode?: "basic" | "advanced"; lang?: Lang;
    };

    const deficits = topDeficits(subscores);
    const details = deficits.map(({ metric, val }) => {
      const evKey = toEvidenceKey(metric);
      const ev = EVIDENCE_MAP[evKey];
      if (!ev) return null;

      const name = (lang === "en" ? ev.name_en : ev.name_es) ?? evKey;
      const why = (lang === "en" ? ev.why_en : ev.why_es) ?? "";
      const guideline = (lang === "en" ? ev.guideline_en : ev.guideline_es) ?? "";
      const actions = (lang === "en" ? ev.actions_en : ev.actions_es) ?? [];
      const suggestion = actions[0]?.text;
      const est_points = estimatePointsGain(val);

      return { metric, evidence_key: evKey, name, why, guideline, suggestion, est_points, refs: ev.refs ?? [] };
    }).filter(Boolean) as Array<{
      metric: string; evidence_key: string; name: string; why: string; guideline: string;
      suggestion?: string; est_points: number; refs: { title: string; url?: string }[];
    }>;

    const names = details.map(d => d.name);
    const intro = lang === "en"
      ? (mode === "advanced"
          ? `Your score (${Math.round(score)}/100) shows improvement opportunities in ${names.join(", ")}.`
          : `You're on track. Here are the top 3 improvements with highest impact.`)
      : (mode === "advanced"
          ? `Tu score (${Math.round(score)}/100) muestra oportunidades de mejora en ${names.join(", ")}.`
          : `Vas bien encaminado. Aquí tienes 3 mejoras con mayor impacto.`);

    const tips = details.map(d => d.suggestion).filter(Boolean).slice(0, 3) as string[];

    const sourcesMap = new Map<string, { title: string; url?: string }>();
    details.forEach(d => d.refs.forEach(r => {
      const key = (r.url || r.title || "").trim();
      if (key) sourcesMap.set(key, r);
    }));
    const sources = Array.from(sourcesMap.values());

    const disclaimer = lang === "en"
      ? "Educational content. Not medical advice."
      : "Contenido educativo. No reemplaza consejo médico.";

    return NextResponse.json({
      mode, lang, intro, tips,
      details: mode === "advanced" ? details : undefined,
      sources: mode === "advanced" ? sources : undefined,
      disclaimer
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Bad request", message: (e as Error).message },
      { status: 400 }
    );
  }
}
