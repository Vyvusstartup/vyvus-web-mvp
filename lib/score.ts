export type Metrics = {
  vo2max_mlkgmin: number;
  steps_per_day: number;
  mvpa_min_per_day: number;
  sedentary_hours_per_day: number;
  rhr_bpm: number;
  hrv_rmssd_ms: number;
  sleep_duration_hours: number;
  sleep_regularidad_SRI: number;
  sleep_efficiency_percent: number;
  whtr_ratio: number;
};

export type ScoreInput = {
  age_band: string; // e.g., "30-39"
  sex: "M" | "F";
  metrics: Metrics;
};

export type ScoreOutput = {
  subscores_0_100: Record<keyof Metrics, number>;
  longevity_score_0_100: number;
  reliability_flag: "green" | "amber" | "red";
  notes: string[];
};

// DEMO min/max ranges for normalization (can be swapped by /api/percentiles later)
export const RANGES: Record<keyof Metrics, { min: number; max: number; inverse?: boolean; shape?: "U" | "linear" }> = {
  vo2max_mlkgmin: { min: 25, max: 60, shape: "linear" },
  steps_per_day: { min: 2000, max: 12000, shape: "linear" },
  mvpa_min_per_day: { min: 0, max: 90, shape: "linear" },
  sedentary_hours_per_day: { min: 4, max: 12, inverse: true, shape: "linear" },
  rhr_bpm: { min: 45, max: 85, inverse: true, shape: "linear" },
  hrv_rmssd_ms: { min: 20, max: 80, shape: "linear" },
  sleep_duration_hours: { min: 4.5, max: 9.5, shape: "U" }, // U-shaped around ~7.5h
  sleep_regularidad_SRI: { min: 0, max: 100, shape: "linear" },
  sleep_efficiency_percent: { min: 75, max: 95, shape: "linear" },
  whtr_ratio: { min: 0.40, max: 0.65, inverse: true, shape: "linear" },
};

// DEMO weights (sum to 1)
export const WEIGHTS: Record<keyof Metrics, number> = {
  vo2max_mlkgmin: 0.15,
  steps_per_day: 0.12,
  mvpa_min_per_day: 0.12,
  sedentary_hours_per_day: 0.08,
  rhr_bpm: 0.08,
  hrv_rmssd_ms: 0.10,
  sleep_duration_hours: 0.10,
  sleep_regularidad_SRI: 0.10,
  sleep_efficiency_percent: 0.07,
  whtr_ratio: 0.08,
};

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function zTo0_100(z: number) {
  return clamp01(z) * 100;
}

function normalizeLinear(value: number, min: number, max: number, inverse?: boolean) {
  if (max === min) return 50;
  let v = (value - min) / (max - min);
  v = clamp01(v);
  if (inverse) v = 1 - v;
  return v * 100;
}

function normalizeU(value: number, optimum=7.5, sigma=1.0, min=4.5, max=9.5) {
  // Gaussian-shaped peak at optimum, drop-off to min/max
  const z = Math.exp(-0.5 * Math.pow((value - optimum) / sigma, 2));
  // map [0,1] to [0,100], but also clamp by bounds
  const within = value >= min && value <= max;
  const base = z * 100;
  return within ? base : Math.max(0, base - 20); // penalize if out of bounds
}

export function computeSubscores(metrics: Metrics): Record<keyof Metrics, number> {
  return {
    vo2max_mlkgmin: normalizeLinear(metrics.vo2max_mlkgmin, RANGES.vo2max_mlkgmin.min, RANGES.vo2max_mlkgmin.max),
    steps_per_day: normalizeLinear(metrics.steps_per_day, RANGES.steps_per_day.min, RANGES.steps_per_day.max),
    mvpa_min_per_day: normalizeLinear(metrics.mvpa_min_per_day, RANGES.mvpa_min_per_day.min, RANGES.mvpa_min_per_day.max),
    sedentary_hours_per_day: normalizeLinear(metrics.sedentary_hours_per_day, RANGES.sedentary_hours_per_day.min, RANGES.sedentary_hours_per_day.max, true),
    rhr_bpm: normalizeLinear(metrics.rhr_bpm, RANGES.rhr_bpm.min, RANGES.rhr_bpm.max, true),
    hrv_rmssd_ms: normalizeLinear(metrics.hrv_rmssd_ms, RANGES.hrv_rmssd_ms.min, RANGES.hrv_rmssd_ms.max),
    sleep_duration_hours: normalizeU(metrics.sleep_duration_hours),
    sleep_regularidad_SRI: normalizeLinear(metrics.sleep_regularidad_SRI, RANGES.sleep_regularidad_SRI.min, RANGES.sleep_regularidad_SRI.max),
    sleep_efficiency_percent: normalizeLinear(metrics.sleep_efficiency_percent, RANGES.sleep_efficiency_percent.min, RANGES.sleep_efficiency_percent.max),
    whtr_ratio: normalizeLinear(metrics.whtr_ratio, RANGES.whtr_ratio.min, RANGES.whtr_ratio.max, true),
  };
}

export function computeScore(input: ScoreInput): ScoreOutput {
  const m = input.metrics;
  const present = Object.values(m).every((v) => typeof v === "number" && !Number.isNaN(v));
  const subs = computeSubscores(m);
  // weighted sum
  let total = 0;
  (Object.keys(subs) as (keyof Metrics)[]).forEach((k) => {
    total += (subs[k] || 0) * WEIGHTS[k];
  });
  const longevity = Math.max(0, Math.min(100, total));
  const reliability: "green" | "amber" | "red" = present ? "green" : "amber";
  const notes = [
    "DEMO: normalización min–max y pesos fijos; producción usará percentiles por edad/sexo y pesos por evidencia × fiabilidad × cobertura.",
  ];
  return {
    subscores_0_100: subs,
    longevity_score_0_100: Math.round(longevity),
    reliability_flag: reliability,
    notes,
  };
}
