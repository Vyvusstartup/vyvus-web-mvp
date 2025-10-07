export const runtime = "nodejs";

import supabaseAdmin from "@/lib/supabaseAdmin";
import { sha256hex } from "@/lib/hashToken";

type InBody = {
  source?: string; // e.g., "apple_watch"
  tester_code?: string;
  metrics?: {
    date?: string; // "YYYY-MM-DD"
    steps?: number;
    rhr_bpm?: number;
    hrv_rmssd_ms?: number;
    sleep_duration_minutes?: number;
    sleep_efficiency?: number; // 0..1
    sleep_regularity_index?: number; // 0..100 (SRI)
    mvpa_minutes?: number;
    sedentary_minutes?: number;
    vo2max_ml_kg_min?: number | null;
    weight_kg?: number | null;
    height_cm?: number | null;
    waist_cm?: number | null;
  };
};

function toDateOnlyISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401 });
    }
    const token = m[1].trim();
    const tokenHash = sha256hex(token).trim().toLowerCase();

    // 1) Validate token (match exacto; si no, fallback por prefijo para tolerar espacios/uppercase)
    let { data: tokens, error: tokErr } = await supabaseAdmin
      .from("ingest_tokens")
      .select("id, user_id, tester_code, expires_at, revoked_at, token_hash")
      .eq("token_hash", tokenHash)
      .limit(1);

    if (!tokErr && (!tokens || tokens.length === 0)) {
      const likePrefix = `${tokenHash}%`;
      const res2 = await supabaseAdmin
        .from("ingest_tokens")
        .select("id, user_id, tester_code, expires_at, revoked_at, token_hash")
        .like("token_hash", likePrefix)
        .limit(1);
      if (!res2.error && res2.data && res2.data.length > 0) {
        tokens = res2.data;
      }
    }

    if (tokErr) {
      return new Response(JSON.stringify({ error: "Auth error" }), { status: 401 });
    }
    const tok = (tokens && tokens[0]) || null;
    if (!tok || tok.revoked_at || (tok.expires_at && new Date(tok.expires_at) < new Date())) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });
    }

    // 2) Parse body
    const body = (await req.json()) as InBody;
    const src = body.source || "apple_watch";
    const testerCode = body.tester_code || tok.tester_code || null;
    const mtr = body.metrics || {};
    const measuredDate = mtr.date || toDateOnlyISO(new Date());

    // 3) Derived metrics
    let bmi: number | null = null;
    let whtr: number | null = null;
    if (typeof mtr.weight_kg === "number" && typeof mtr.height_cm === "number" && mtr.height_cm > 0) {
      const hM = mtr.height_cm / 100.0;
      bmi = +(mtr.weight_kg / (hM * hM)).toFixed(2);
    }
    if (typeof mtr.waist_cm === "number" && typeof mtr.height_cm === "number" && mtr.height_cm > 0) {
      whtr = +((mtr.waist_cm / mtr.height_cm)).toFixed(3);
    }

    // 4) Upsert
    const row: any = {
      user_id: tok.user_id,
      tester_code: testerCode,
      measured_date: measuredDate,
      device_source: src,
      steps: mtr.steps ?? null,
      rhr_bpm: mtr.rhr_bpm ?? null,
      hrv_rmssd_ms: mtr.hrv_rmssd_ms ?? null,
      sleep_duration_minutes: mtr.sleep_duration_minutes ?? null,
      sleep_efficiency: mtr.sleep_efficiency ?? null,
      sleep_regularity_index: mtr.sleep_regularity_index ?? null,
      mvpa_minutes: mtr.mvpa_minutes ?? null,
      sedentary_minutes: mtr.sedentary_minutes ?? null,
      vo2max_ml_kg_min: mtr.vo2max_ml_kg_min ?? null,
      weight_kg: mtr.weight_kg ?? null,
      height_cm: mtr.height_cm ?? null,
      waist_cm: mtr.waist_cm ?? null,
      bmi,
      whtr,
      raw: body as any,
    };

    const { error: upErr } = await supabaseAdmin
      .from("daily_metrics")
      .upsert(row, { onConflict: "user_id,measured_date" });

    if (upErr) {
      return new Response(JSON.stringify({ error: "DB write failed" }), { status: 500 });
    }

    return new Response(JSON.stringify({ saved: true, storage: "supabase", measured_date: measuredDate }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}
