export const runtime = "nodejs";

import supabaseAdmin from "@/lib/supabaseAdmin";
import { sha256hex } from "@/lib/hashToken";

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

type InBody = { measured_date?: string; user_id?: string; tester_code?: string };

const todayUTC = () => new Date().toISOString().slice(0, 10);

function coveragePercent(canon: RowCanon): number {
  const vals = Object.values(canon);
  const present = vals.filter(v => v !== null && v !== undefined).length;
  const total = vals.length || 10;
  return Math.round((present / total) * 100);
}

export async function POST(req: Request) {
  try {
    // --- Auth por token de ingest (como antes) ---
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401 });
    const tokenHash = sha256hex(m[1].trim()).trim().toLowerCase();

    const { data: tokens, error: tokErr } = await supabaseAdmin
      .from("ingest_tokens")
      .select("user_id, tester_code, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .limit(1);
    if (tokErr) return new Response(JSON.stringify({ error: "Auth error" }), { status: 401 });

    const tok = tokens?.[0];
    if (!tok || tok.revoked_at || (tok.expires_at && new Date(tok.expires_at) < new Date()))
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });

    // --- Inputs ---
    const body = (await req.json().catch(() => ({}))) as InBody;
    const measured_date = body.measured_date || todayUTC();
    const user_id = body.user_id || tok.user_id;
    const tester_code = body.tester_code || tok.tester_code || null;

    // --- 1) Leer canónico (vista) ---
    let canon: RowCanon | null = null;
    {
      let q = supabaseAdmin
        .from("daily_metrics_canonical")
        .select(
          "vo2max_mlkgmin, steps_per_day, mvpa_min_per_day, sedentary_hours_per_day, rhr_bpm, hrv_rmssd_ms, sleep_duration_hours, sleep_regularidad_SRI, sleep_efficiency_percent, whtr_ratio"
        )
        .eq("measured_date", measured_date)
        .limit(1);
      q = q.eq("user_id", user_id);
      const { data: rows } = await q;
      canon = (rows && rows[0]) as RowCanon | null;
    }

    // --- 2) Fallback: mapear desde daily_metrics si no hubo fila en la vista ---
    if (!canon) {
      const { data: rows2, error: e2 } = await supabaseAdmin
        .from("daily_metrics")
        .select(
          "steps, mvpa_minutes, sedentary_minutes, rhr_bpm, hrv_rmssd_ms, sleep_duration_minutes, sleep_efficiency, sleep_regularity_index, vo2max_ml_kg_min, whtr, height_cm, waist_cm"
        )
        .eq("user_id", user_id)
        .eq("measured_date", measured_date)
        .limit(1);
      if (e2 || !rows2 || !rows2[0]) {
        return new Response(JSON.stringify({ error: "No metrics for date" }), { status: 404 });
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

    const coverage_percent = coveragePercent(canon!);

    // --- 3) Calcular score con /api/score ---
    const url = new URL(req.url);
    url.pathname = "/api/score";
    const calc = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ metrics: canon }),
    });
    if (!calc.ok) {
      const msg = await calc.text();
      return new Response(JSON.stringify({ error: "Score compute failed", detail: msg }), { status: 500 });
    }
    const data = await calc.json();

    // --- 4) Guardar en daily_scores con metadata ---
    const { error: upErr } = await supabaseAdmin
      .from("daily_scores")
      .upsert(
        {
          user_id,
          measured_date,
          score: data.longevity_score_0_100,
          subscores: data.subscores_0_100,
          score_version: "v1",
          source: "api/score/save",
          reliability_flag: data.reliability_flag ?? null,
          coverage_percent,
          last_saved_at: new Date().toISOString(),
        },
        { onConflict: "user_id,measured_date" }
      );
    if (upErr) return new Response(JSON.stringify({ error: "DB write failed" }), { status: 500 });

    return new Response(
      JSON.stringify({
        saved: true,
        user_id,
        measured_date,
        score: data.longevity_score_0_100,
        subscores: data.subscores_0_100,
        reliability_flag: data.reliability_flag ?? null,
        coverage_percent,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}
