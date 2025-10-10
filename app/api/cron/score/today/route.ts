export const runtime = "nodejs";

import supabaseAdmin from "@/lib/supabaseAdmin";

type RowCanon = {
  vo2max_mlkgmin: number | null;
  steps_per_day: number | null;
  mvpa_min_per_day: number | null;
  sedentary_hours_per_day: number | null;
  rhr_bpm: number | null;
  hrv_rmssd_ms: number | null;
  sleep_duration_hours: number | null;
  sleep_regularidad_SRI: number | null;
  sleep_efficiency_percent: number | null;
  whtr_ratio: number | null;
};

const todayUTC = () => new Date().toISOString().slice(0, 10);

export async function GET(req: Request) {
  try {
    // --- Auth por secreto de cron ---
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret") || "";
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const date = url.searchParams.get("date") || todayUTC();

    // 1) Obtener user_ids con datos ese día (vista canónica primero)
    const { data: users, error: uErr } = await supabaseAdmin
      .from("daily_metrics_canonical")
      .select("user_id")
      .eq("measured_date", date);

    if (uErr) {
      return new Response(JSON.stringify({ error: "List users error" }), { status: 500 });
    }

    const userIds = Array.from(new Set((users ?? []).map((r: any) => r.user_id))).filter(Boolean);
    let processed = 0, saved = 0;
    const failures: Array<{ user_id: string; reason: string }> = [];

    // 2) Para cada usuario, leer métricas canónicas (con fallback a tabla), calcular score y upsert en daily_scores
    for (const user_id of userIds) {
      processed += 1;
      try {
        // 2.1) Leer canónico
        let canon: RowCanon | null = null;

        {
          const { data: rows, error } = await supabaseAdmin
            .from("daily_metrics_canonical")
            .select(
              "vo2max_mlkgmin, steps_per_day, mvpa_min_per_day, sedentary_hours_per_day, rhr_bpm, hrv_rmssd_ms, sleep_duration_hours, sleep_regularidad_SRI, sleep_efficiency_percent, whtr_ratio"
            )
            .eq("user_id", user_id)
            .eq("measured_date", date)
            .limit(1);
          if (!error && rows && rows[0]) canon = rows[0] as RowCanon;
        }

        // 2.2) Fallback: mapear desde daily_metrics si la vista no trae fila
        if (!canon) {
          const { data: rows2, error: e2 } = await supabaseAdmin
            .from("daily_metrics")
            .select(
              "steps, mvpa_minutes, sedentary_minutes, rhr_bpm, hrv_rmssd_ms, sleep_duration_minutes, sleep_efficiency, sleep_regularity_index, vo2max_ml_kg_min, whtr, height_cm, waist_cm"
            )
            .eq("user_id", user_id)
            .eq("measured_date", date)
            .limit(1);
          if (e2 || !rows2 || !rows2[0]) {
            failures.push({ user_id, reason: "no metrics" });
            continue;
          }
          const dm = rows2[0] as any;
          const whtr_ratio =
            dm.whtr ??
            (dm.height_cm && dm.height_cm > 0 && dm.waist_cm != null
              ? Number((dm.waist_cm / dm.height_cm).toFixed(3))
              : null);

          canon = {
            vo2max_mlkgmin: dm.vo2max_ml_kg_min ?? null,
            steps_per_day: dm.steps ?? null,
            mvpa_min_per_day: dm.mvpa_minutes ?? null,
            sedentary_hours_per_day: dm.sedentary_minutes != null ? dm.sedentary_minutes / 60.0 : null,
            rhr_bpm: dm.rhr_bpm ?? null,
            hrv_rmssd_ms: dm.hrv_rmssd_ms ?? null,
            sleep_duration_hours: dm.sleep_duration_minutes != null ? dm.sleep_duration_minutes / 60.0 : null,
            sleep_regularidad_SRI: dm.sleep_regularity_index ?? null,
            sleep_efficiency_percent: dm.sleep_efficiency != null ? dm.sleep_efficiency * 100.0 : null,
            whtr_ratio,
          };
        }

        // 2.3) Calcular score usando el endpoint interno /api/score
        const base = new URL(req.url);
        base.pathname = "/api/score";
        const calc = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ metrics: canon }),
        });
        if (!calc.ok) {
          const msg = await calc.text();
          failures.push({ user_id, reason: "score_error:" + msg.slice(0, 120) });
          continue;
        }
        const data = await calc.json();

        // 2.4) Guardar en daily_scores (upsert)
        const { error: upErr } = await supabaseAdmin
          .from("daily_scores")
          .upsert(
            {
              user_id,
              measured_date: date,
              score: data.longevity_score_0_100,
              subscores: data.subscores_0_100,
              score_version: "v1",
              source: "cron",
            },
            { onConflict: "user_id,measured_date" }
          );
        if (upErr) {
          failures.push({ user_id, reason: "db_write" });
          continue;
        }
        saved += 1;
      } catch (e: any) {
        failures.push({ user_id, reason: "unexpected" });
      }
    }

    return new Response(
      JSON.stringify({ date, processed, saved, failed: failures.length, failures }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}
