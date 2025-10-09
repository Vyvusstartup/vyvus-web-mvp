export const runtime = "nodejs";

import supabaseAdmin from "@/lib/supabaseAdmin";
import { sha256hex } from "@/lib/hashToken";

export async function GET(req: Request) {
  try {
    // --- Auth (mismo esquema que ingest) ---
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return new Response(JSON.stringify({ error: "Missing bearer token" }), { status: 401 });
    const bearer = m[1].trim();
    const tokenHash = sha256hex(bearer).trim().toLowerCase();

    const { data: tokens, error: tokErr } = await supabaseAdmin
      .from("ingest_tokens")
      .select("user_id, tester_code, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .limit(1);
    if (tokErr) return new Response(JSON.stringify({ error: "Auth error" }), { status: 401 });

    const tok = tokens?.[0];
    if (!tok || tok.revoked_at || (tok.expires_at && new Date(tok.expires_at) < new Date()))
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });

    // --- Parámetros ---
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const user_id = url.searchParams.get("user_id") || tok.user_id;

    // --- 1) Buscar en caché (daily_scores) ---
    const { data: cached, error: readErr } = await supabaseAdmin
      .from("daily_scores")
      .select("score, subscores")
      .eq("user_id", user_id)
      .eq("measured_date", date)
      .limit(1);

    if (readErr) return new Response(JSON.stringify({ error: "Read error" }), { status: 500 });

    if (cached && cached[0]) {
      return new Response(
        JSON.stringify({ date, score: cached[0].score, subscores: cached[0].subscores, source: "cached" }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    // --- 2) Si no hay caché, computar y guardar llamando a /api/score/save ---
    const saveUrl = new URL(req.url);
    saveUrl.pathname = "/api/score/save";
    const saved = await fetch(saveUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + bearer },
      body: JSON.stringify({ measured_date: date, user_id }),
    });

    if (!saved.ok) {
      const msg = await saved.text();
      return new Response(JSON.stringify({ error: "Compute failed", detail: msg }), { status: 502 });
    }

    const payload = await saved.json(); // { saved, measured_date, score, subscores, ... }
    return new Response(
      JSON.stringify({ date: payload.measured_date, score: payload.score, subscores: payload.subscores, source: "computed" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
}
