import { NextRequest, NextResponse } from "next/server";

type Direction = "higher_better" | "lower_better" | "optimal_around_7.5";
type Range = { min: number; max: number; direction: Direction };
type Sex = "M" | "F";
type AgeBand = "18-29" | "30-39" | "40-49" | "50-59" | "60-69";

type MetricKey =
  | "vo2max_mlkgmin"
  | "steps_per_day"
  | "mvpa_min_per_day"
  | "sedentary_hours_per_day"
  | "rhr_bpm"
  | "hrv_rmssd_ms"
  | "sleep_duration_hours"
  | "sleep_regularidad_SRI"
  | "sleep_efficiency_percent"
  | "whtr_ratio";

// RANGO DEMO (igual para todas las edades/sexos; contiene tus mismos valores y direcciones)
const BASE: Record<MetricKey, Range> = {
  vo2max_mlkgmin:          { min: 25,   max: 60,    direction: "higher_better" },
  steps_per_day:           { min: 2000, max: 12000, direction: "higher_better" },
  mvpa_min_per_day:        { min: 0,    max: 90,    direction: "higher_better" },
  sedentary_hours_per_day: { min: 4,    max: 12,    direction: "lower_better" },
  rhr_bpm:                 { min: 45,   max: 85,    direction: "lower_better" },
  hrv_rmssd_ms:            { min: 20,   max: 80,    direction: "higher_better" },
  sleep_duration_hours:    { min: 4.5,  max: 9.5,   direction: "optimal_around_7.5" },
  sleep_regularidad_SRI:   { min: 0,    max: 100,   direction: "higher_better" },
  sleep_efficiency_percent:{ min: 75,   max: 95,    direction: "higher_better" },
  whtr_ratio:              { min: 0.4,  max: 0.65,  direction: "lower_better" }
};

const AGE_BANDS: AgeBand[] = ["18-29","30-39","40-49","50-59","60-69"];
const SEXES: Sex[] = ["M","F"];

// Construimos la tabla completa reutilizando BASE
const TABLE: Record<AgeBand, Record<Sex, Record<MetricKey, Range>>> = Object.fromEntries(
  AGE_BANDS.map((band) => [
    band,
    Object.fromEntries(SEXES.map((s) => [s, BASE])) as Record<Sex, Record<MetricKey, Range>>
  ])
) as any;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const age_band = (url.searchParams.get("age_band") as AgeBand) || "30-39";
  const sex = (url.searchParams.get("sex") as Sex) || "F";

  // soporte opcional: ?all=1 devuelve la tabla completa (útil para móvil)
  const wantAll = url.searchParams.get("all");

  if (wantAll) {
    return NextResponse.json({
      version: "demo-1",
      age_bands: AGE_BANDS,
      sexes: SEXES,
      metrics: Object.keys(BASE),
      table: TABLE
    });
  }

  const byBand = TABLE[age_band] || TABLE["30-39"];
  const ranges = byBand[sex] || byBand["F"];

  return NextResponse.json({
    version: "demo-1",
    age_band,
    sex,
    metrics: Object.keys(BASE),
    ranges
  });
}
