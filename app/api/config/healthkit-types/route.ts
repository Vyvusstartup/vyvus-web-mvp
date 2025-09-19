import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    version: "m1",
    note: "Sedentary hours/day y Sleep regularity (SRI) son autorreporte por ahora. WHTR se calcula en el servidor si mandas height_cm + waist_circumference_cm.",
    read_types: {
      heart: ["resting_hr_bpm", "hrv_sdnn_ms", "hrv_rmssd_ms?"],
      activity: ["steps_per_day", "mvpa_minutes_per_day", "sedentary_hours_per_day(self_report)"],
      sleep: ["sleep_duration_hours", "sleep_efficiency_percent", "sleep_regularidad_SRI(self_report)"],
      anthropometrics: ["vo2max_ml_kg_min", "whtr_ratio(computed)", "height_cm", "waist_circumference_cm"]
    }
  });
}
