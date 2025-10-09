export const runtime = "nodejs";

import supabaseAdmin from "@/lib/supabaseAdmin";
import { sha256hex } from "@/lib/hashToken";

type InBody = {
  measured_date?: string; // YYYY-MM-DD (default: hoy UTC)
  user_id?: string;       // opcional; por defecto, el del token
  tester_code?: string;   // opcional; si prefieres buscar por código
};

const todayUTC = () => new Date().toISOString().slice(0, 10);

export async function POST(req: Request) {
  try {
    // --- Auth idéntica a ingest ---
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

    // --- Leer métricas canónicas del día ---
    let q = supabaseAdmin
      .from("daily_metrics_canonical")
      .select(
        "vo2max_mlkgmin, steps_per_day, mvpa_min_per_day, sedentary_hours_per_day, rhr_bpm, hrv_rmssd_ms, sleep_duration_hours, sleep_regularidad_SRI, sleep_efficiency_percent, whtr_ratio"
      )
      .eq("measured_date", measured_date)
      .limit(1);

    if (user_id) q = q.eq("user_id", user_id);
    else if (tester_code) q = q.eq("tester_code", tester_code);

    const { data: rows, error: readErr } = await q;
    if (readErr) return new Response(JSON.stringify({ error: "Read error" }), { status: 500 });
    const row = rows?.[0];
    if (!row) return new Response(JSON.stringify({ error: "No metrics for date" }), { status: 404 });

    // --- Calcular score usando el endpoint existente ---
    const url = new URL(req.url); // mismo dominio
    url.pathname = "/api/score";
    const calc = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ metrics: row }),
    });
    if (!calc.ok) {
      const msg = await calc.text();
      return new Response(JSON.stringify({ error: "Score compute failed", detail: msg }), { status: 500 });
    }
    const data = await calc.json();

    // --- Guardar en daily_scores (upsert) ---
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
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}
