"use client";
import React, { useMemo, useState } from "react";
import { computeScore, type Metrics, type ScoreInput } from "@/lib/score";
import { useI18n } from "@/i18n/I18nProvider";

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

// helper mínimo para textos no incluidos en messages/*.json
function tr(lang: "es" | "en", es: string, en: string) {
  return lang === "en" ? en : es;
}

// ---- NUEVO: traduce nombres de perfiles demo según idioma (robusto) ----
function displayProfileName(id: string, lang: "es" | "en") {
  // 1) normaliza: quita "demo_", pasa a minúsculas, elimina acentos, cambia separadores a "_"
  const key = id
    .toLowerCase()
    .replace(/^demo_/, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // sin acentos
    .replace(/[^a-z0-9]+/g, "_")                      // espacios, guiones → "_"
    .replace(/^_|_$/g, "");                           // sin guiones bajos al inicio/fin

  // 2) tabla que contempla variantes en ES y EN
  const map: Record<string, { es: string; en: string }> = {
    // atleta
    "athlete": { es: "Atleta", en: "Athlete" },

    // promedio / average
    "promedio": { es: "Promedio", en: "Average" },
    "average":  { es: "Promedio", en: "Average" },

    // sedentario / sedentary
    "sedentario": { es: "Sedentario", en: "Sedentary" },
    "sedentary":  { es: "Sedentary",  en: "Sedentary" }, // en español mostramos "Sedentario"
    
    // sueño irregular / irregular sleep
    "sueno_irregular":     { es: "Sueño irregular", en: "Irregular sleep" },
    "irregular_sleep":     { es: "Sueño irregular", en: "Irregular sleep" },

    // alto WHtR / high WHtR
    "alto_whtr": { es: "Alto WHtR", en: "High WHtR" },
    "high_whtr": { es: "Alto WHtR", en: "High WHtR" }
  };

  const entry = map[key];
  // 3) fallback: si no mapea, muestra el key con espacios
  return entry ? entry[lang] : key.replace(/_/g, " ");
}


export default function ScoreForm() {
  const { lang, t } = useI18n();
  const [tab, setTab] = useState<"manual" | "demo">("manual");
  const [input, setInput] = useState<ScoreInput>(defaultInput);
  const [profiles, setProfiles] = useState<DemoProfile[] | null>(null);

  const output = useMemo(() => computeScore(input), [input]);

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

          {/* Campos numéricos (labels traducidos con t(...)) */}
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
        <div className="card space-y-3">
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
        <div>
          <div className="w-full bg-neutral100 rounded-xl h-4 overflow-hidden">
            <div
              className="bg-primary h-4"
              style={{ width: `${output.longevity_score_0_100}%` }}
            />
          </div>
          <p className="text-sm mt-1">
            <b>{output.longevity_score_0_100}/100</b>
          </p>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer">{t("result.subscores")}</summary>
          <ul className="grid grid-cols-2 gap-2 mt-2 text-sm">
            {Object.entries(output.subscores_0_100).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{labelFor(k, t)}</span>
                <span>{Math.round(v)}</span>
              </li>
            ))}
          </ul>
        </details>

        <div className="flex gap-2">
          <button className="btn btn-disabled" disabled>
            {tr(lang, "Conectar wearable (pronto)", "Connect wearable (soon)")}
          </button>
          <button className="btn btn-disabled" disabled>
            {tr(lang, "Subir CSV (beta)", "Upload CSV (beta)")}
          </button>
        </div>

        <Tips score={output.longevity_score_0_100} subscores={output.subscores_0_100} />
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

function Tips({
  score,
  subscores
}: {
  score: number;
  subscores: Record<string, number>;
}) {
  const { lang, t } = useI18n(); // usamos el hook aquí para título traducido
  const lows = Object.entries(subscores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([k]) => k);
  const suggestions = lows.map((k) => suggestFor(k, lang));
  return (
    <div className="mt-3">
      <h4 className="font-semibold">{t("result.tips")}</h4>
      <ul className="list-disc ml-5 text-sm">
        {suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      <p className="help mt-2">
        {tr(
          lang,
          "Sugerencias educativas basadas en métricas bajas. No sustituyen recomendaciones médicas.",
          "Educational suggestions based on lower metrics. Not medical advice."
        )}
      </p>
    </div>
  );
}

function suggestFor(key: string, lang: "es" | "en") {
  const S = (es: string, en: string) => (lang === "en" ? en : es);
  switch (key) {
    case "steps_per_day":
      return S("Añadir ~2000 pasos/día caminando en 2–3 bloques.", "Add ~2,000 steps/day in 2–3 bouts.");
    case "mvpa_min_per_day":
      return S(
        "Sumar 15–20 min de actividad moderada (p. ej., trotar o bici).",
        "Add 15–20 min of moderate activity (e.g., jog or bike)."
      );
    case "sedentary_hours_per_day":
      return S(
        "Hacer pausas de 2–3 min cada hora para reducir sedentarismo.",
        "Take 2–3 min movement breaks every hour to reduce sedentary time."
      );
    case "rhr_bpm":
      return S(
        "Practicar respiración/relajación y actividad aeróbica ligera para bajar RHR.",
        "Practice breathing/relaxation and light aerobic activity to lower RHR."
      );
    case "hrv_rmssd_ms":
      return S(
        "Priorizar sueño regular y manejo del estrés para mejorar HRV.",
        "Prioritize regular sleep and stress management to improve HRV."
      );
    case "sleep_duration_hours":
      return S("Ajustar horario para acercarte a ~7–8 h de sueño.", "Adjust schedule toward ~7–8 h of sleep.");
    case "sleep_regularidad_SRI":
      return S(
        "Fijar horarios consistentes de acostarse y levantarse.",
        "Keep consistent bed and wake times."
      );
    case "sleep_efficiency_percent":
      return S(
        "Evitar pantallas antes de dormir y mantener el dormitorio oscuro.",
        "Avoid screens before bed and keep the bedroom dark."
      );
    case "whtr_ratio":
      return S(
        "Apuntar a una relación cintura/estatura más baja con hábitos sostenibles.",
        "Aim for a lower waist-to-height ratio with sustainable habits."
      );
    case "vo2max_mlkgmin":
      return S(
        "Incluir entrenamientos aeróbicos progresivos para subir VO₂max.",
        "Include progressive aerobic training to raise VO₂max."
      );
    default:
      return S(
        "Hábitos consistentes y progresivos suelen mejorar el score.",
        "Consistent, progressive habits typically improve the score."
      );
  }
}
