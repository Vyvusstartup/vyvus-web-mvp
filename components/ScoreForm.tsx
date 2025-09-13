"use client";
import React, { useMemo, useState } from "react";
import { computeScore, type Metrics, type ScoreInput } from "@/lib/score";
import { useI18n } from "@/i18n/I18nProvider";
import Explain from "@/components/Explain";

// 🔎 evidencia (para tooltips “¿por qué?”)
import evidenceList from "@/data/evidence/vyvus_tier1_evidence.json";

const defaultInput: ScoreInput = {
  age_band: "30-39",
  sex: "F",
  metrics: {
    vo2max_mlkgmin: 40,
    steps_per_day: 7000,
    mvpa_min_per_day: 30,
    sedentary_hours_per_day: 8,
    rhr_bpm: 65,
    hrv_rmssd_ms: 45,
    sleep_duration_hours: 7.0,
    sleep_regularidad_SRI: 70,
    sleep_efficiency_percent: 88,
    whtr_ratio: 0.5
  }
};

type DemoProfile = { profile_id: string; age_band: string; sex: "M" | "F"; metrics: Metrics };
type Lang = "es" | "en";
type EvidenceEntry = {
  key: string;
  name_es?: string; name_en?: string;
  why_es?: string;  why_en?: string;
};

// helper mínimo para textos no incluidos en messages/*.json
function tr(lang: "es" | "en", es: string, en: string) {
  return lang === "en" ? en : es;
}

// Traducción robusta de nombres de perfiles demo (ES/EN)
function displayProfileName(id: string, lang: "es" | "en") {
  const key = id
    .toLowerCase()
    .replace(/^demo_/, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const map: Record<string, { es: string; en: string }> = {
    athlete: { es: "Atleta", en: "Athlete" },
    promedio: { es: "Promedio", en: "Average" },
    average: { es: "Promedio", en: "Average" },
    sedentario: { es: "Sedentario", en: "Sedentary" },
    sedentary: { es: "Sedentario", en: "Sedentary" },
    sueno_irregular: { es: "Sueño irregular", en: "Irregular sleep" },
    irregular_sleep: { es: "Sueño irregular", en: "Irregular sleep" },
    alto_whtr: { es: "Alto WHtR", en: "High WHtR" },
    high_whtr: { es: "Alto WHtR", en: "High WHtR" }
  };
  const entry = map[key];
  return entry ? entry[lang] : key.replace(/_/g, " ");
}

// Categoría por score (rango + badge)
function categoryForScore(score: number, lang: "es" | "en") {
  if (score < 50) {
    return { label: tr(lang, "Bajo", "Low"), badgeCls: "bg-red-100 text-red-700" };
  }
  if (score < 70) {
    return { label: tr(lang, "Moderado", "Fair"), badgeCls: "bg-amber-100 text-amber-700" };
  }
  if (score < 85) {
    return { label: tr(lang, "Adecuado", "Good"), badgeCls: "bg-green-100 text-green-700" };
  }
  return { label: tr(lang, "Óptimo", "Excellent"), badgeCls: "bg-blue-100 text-blue-700" };
}

// 🧠 evidencia → “por qué” por métrica (para tooltips)
const EVIDENCE: Record<string, EvidenceEntry> =
  Object.fromEntries((evidenceList as EvidenceEntry[]).map(e => [e.key, e]));
const scoreKeyToEvidenceKey: Record<string, string> = {
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
function whyFor(metricKey: string, lang: Lang): string | undefined {
  const ev = EVIDENCE[scoreKeyToEvidenceKey[metricKey]];
  if (!ev) return;
  return lang === "en" ? ev.why_en : ev.why_es;
}

export default function ScoreForm() {
  const { lang, t } = useI18n();
  const [tab, setTab] = useState<"manual" | "demo">("manual");
  const [input, setInput] = useState<ScoreInput>(defaultInput);
  const [profiles, setProfiles] = useState<DemoProfile[] | null>(null);

  const output = useMemo(() => computeScore(input), [input]);

  // 🚀 Cargar último input y abrir #demo si aplica (con scroll al bloque)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("vyvus:lastInput:v1");
      if (raw) setInput(JSON.parse(raw));
    } catch {}
    if (typeof window !== "undefined" && window.location.hash === "#demo") {
      setTab("demo");
      // esperar al re-render para que exista el nodo con id="demo"
      setTimeout(() => {
        document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 💾 Guardar en localStorage cada cambio
  React.useEffect(() => {
    try { localStorage.setItem("vyvus:lastInput:v1", JSON.stringify(input)); } catch {}
  }, [input]);

  async function loadProfiles() {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    setProfiles(data.profiles);
  }

  React.useEffect(() => {
    if (tab === "demo" && !profiles) loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function setMetric<K extends keyof Metrics>(key: K, value: number) {
    setInput((prev) => ({ ...prev, metrics: { ...prev.metrics, [key]: value } }));
  }

  function ReliabilityBadge() {
    const flag = output.reliability_flag;
    const map = { green: "badge-green", amber: "badge-amber", red: "badge-red" } as const;
    const label =
      flag === "green"
        ? tr(lang, "Confiable", "Reliable")
        : flag === "amber"
        ? tr(lang, "Parcial", "Partial")
        : tr(lang, "Insuficiente", "Insufficient");
    return <span className={"badge " + map[flag]}>{label}</span>;
  }

  const score = output.longevity_score_0_100;
  const cat = categoryForScore(score, lang);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={"btn " + (tab === "manual" ? "btn-primary" : "bg-neutral100")}
          onClick={() => setTab("manual")}
        >
          {t("tabs.manual")}
        </button>
        <button
          className={"btn " + (tab === "demo" ? "btn-primary" : "bg-neutral100")}
          onClick={() => setTab("demo")}
        >
          {t("tabs.profiles")}
        </button>
      </div>

      {/* Tab: Ingreso manual */}
      {tab === "manual" && (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                {tr(lang, "Rango de edad", "Age band")}
              </label>
              <select
                className="input"
                value={input.age_band}
                onChange={(e) => setInput({ ...input, age_band: e.target.value })}
              >
                {["18-29", "30-39", "40-49", "50-59", "60-69"].map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{tr(lang, "Sexo", "Sex")}</label>
              <select
                className="input"
                value={input.sex}
                onChange={(e) => setInput({ ...input, sex: e.target.value as "M" | "F" })}
              >
                <option value="F">{tr(lang, "Femenino", "Female")}</option>
                <option value="M">{tr(lang, "Masculino", "Male")}</option>
              </select>
            </div>
          </div>

          {/* Campos numéricos */}
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label={t("form.vo2max")}
              value={input.metrics.vo2max_mlkgmin}
              onChange={(v) => setMetric("vo2max_mlkgmin", v)}
            />
            <NumberField
              label={t("form.steps_day")}
              value={input.metrics.steps_per_day}
              onChange={(v) => setMetric("steps_per_day", v)}
            />
            <NumberField
              label={t("form.mvpa_min_day")}
              value={input.metrics.mvpa_min_per_day}
              onChange={(v) => setMetric("mvpa_min_per_day", v)}
            />
            <NumberField
              label={t("form.sedentary_hours_day")}
              value={input.metrics.sedentary_hours_per_day}
              onChange={(v) => setMetric("sedentary_hours_per_day", v)}
              step={0.1}
            />
            <NumberField
              label={t("form.rhr_bpm")}
              value={input.metrics.rhr_bpm}
              onChange={(v) => setMetric("rhr_bpm", v)}
            />
            <NumberField
              label={t("form.hrv_rmssd")}
              value={input.metrics.hrv_rmssd_ms}
              onChange={(v) => setMetric("hrv_rmssd_ms", v)}
            />
            <NumberField
              label={t("form.sleep_duration_hours")}
              value={input.metrics.sleep_duration_hours}
              onChange={(v) => setMetric("sleep_duration_hours", v)}
              step={0.1}
            />
            <NumberField
              label={t("form.sleep_regularidad_SRI")}
              value={input.metrics.sleep_regularidad_SRI}
              onChange={(v) => setMetric("sleep_regularidad_SRI", v)}
            />
            <NumberField
              label={t("form.sleep_efficiency_pct")}
              value={input.metrics.sleep_efficiency_percent}
              onChange={(v) => setMetric("sleep_efficiency_percent", v)}
            />
            <NumberField
              label={t("form.whtr")}
              value={input.metrics.whtr_ratio}
              onChange={(v) => setMetric("whtr_ratio", v)}
              step={0.01}
            />
          </div>
        </div>
      )}

      {/* Tab: Perfiles demo */}
      {tab === "demo" && (
        <div className="card space-y-3" id="demo">
          {!profiles && <p>{tr(lang, "Cargando perfiles…", "Loading profiles…")}</p>}
          {profiles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map((p) => (
                <button
                  key={p.profile_id}
                  className="card text-left hover:shadow-md transition"
                  onClick={() => setInput({ age_band: p.age_band, sex: p.sex, metrics: p.metrics })}
                >
                  <h4 className="font-semibold">
                    {displayProfileName(p.profile_id, lang)}
                  </h4>
                  <p className="text-sm text-neutral900/70">
                    {p.sex} · {p.age_band}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultado */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("result.title")}</h3>
          <ReliabilityBadge />
        </div>

        {/* Barra por categorías con gradiente */}
        <div>
          <div className="relative w-full bg-neutral100 rounded-xl h-4 overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-red-500 via-amber-400 via-green-500 to-blue-500"
              style={{ width: `${score}%` }}
              aria-label={tr(lang, "Progreso del score", "Score progress")}
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-semibold">{score}/100</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.badgeCls}`}>
              {cat.label}
            </span>
          </div>

          {/* 🔹 Leyenda discreta (XS) */}
          <div className="text-xs text-gray-500 mt-1">
            {lang === "en"
              ? "0–49 Low · 50–69 Fair · 70–84 Good · 85–100 Excellent"
              : "0–49 Bajo · 50–69 Moderado · 70–84 Adecuado · 85–100 Óptimo"}
          </div>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer">{t("result.subscores")}</summary>
          <ul className="grid grid-cols-2 gap-2 mt-2 text-sm">
            {Object.entries(output.subscores_0_100).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                {/* Tooltip con “por qué importa” (evidencia) */}
                <span title={whyFor(k, lang) ?? undefined}>{labelFor(k, t)}</span>
                <span>{Math.round(v)}</span>
              </li>
            ))}
          </ul>
        </details>

        {/* Explicación basada en evidencia */}
        <Explain score={score} subscores={output.subscores_0_100} />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

// usa las mismas claves de los labels del formulario para traducir los sub-scores
function labelFor(key: string, t: (k: string) => string) {
  switch (key) {
    case "vo2max_mlkgmin":
      return t("form.vo2max");
    case "steps_per_day":
      return t("form.steps_day");
    case "mvpa_min_per_day":
      return t("form.mvpa_min_day");
    case "sedentary_hours_per_day":
      return t("form.sedentary_hours_day");
    case "rhr_bpm":
      return t("form.rhr_bpm");
    case "hrv_rmssd_ms":
      return t("form.hrv_rmssd");
    case "sleep_duration_hours":
      return t("form.sleep_duration_hours");
    case "sleep_regularidad_SRI":
      return t("form.sleep_regularidad_SRI");
    case "sleep_efficiency_percent":
      return t("form.sleep_efficiency_pct");
    case "whtr_ratio":
      return t("form.whtr");
    default:
      return key;
  }
}
