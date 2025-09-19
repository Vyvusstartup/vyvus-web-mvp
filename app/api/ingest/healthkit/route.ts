import { NextResponse, type NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Metrics = {
  resting_hr_bpm?: number;
  hrv_sdnn_ms?: number;
  hrv_rmssd_ms?: number;
  vo2max_ml_kg_min?: number;
  steps_per_day?: number;
  mvpa_minutes_per_day?: number;
  sedentary_hours_per_day?: number;   // self-report por ahora
  sleep_duration_hours?: number;
  sleep_efficiency_percent?: number;
  sleep_regularidad_SRI?: number;     // self-report por ahora
  height_cm?: number;
  waist_circumference_cm?: number;
  whtr_ratio?: number;                // calculado si hay height & waist
};

type Payload = {
  user_id: string;
  date: string; // YYYY-MM-DD
  metrics: Metrics;
  meta?: Record<string, unknown>;
  consent?: { version?: string; scopes?: string[]; };
};

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const expected = process.env.INGEST_TEST_TOKEN || "";
  if (!expected || token !== expected) return bad("unauthorized", 401);

  let body: Payload;
  try {
    let raw = await req.text();
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
    body = JSON.parse(raw);
  } catch {
    return bad("invalid json");
  }

  if (!body || typeof body !== "object") return bad("invalid payload");
  if (!body.user_id || typeof body.user_id !== "string") return bad("invalid user_id");
  if (!body.date || !isValidDateYYYYMMDD(body.date)) return bad("invalid date");
  if (!body.metrics || typeof body.metrics !== "object") return bad("invalid metrics");

  const m = body.metrics;
  const numericKeys: (keyof Metrics)[] = [
    "resting_hr_bpm","hrv_sdnn_ms","hrv_rmssd_ms","vo2max_ml_kg_min",
    "steps_per_day","mvpa_minutes_per_day","sedentary_hours_per_day",
    "sleep_duration_hours","sleep_efficiency_percent","sleep_regularidad_SRI",
    "height_cm","waist_circumference_cm","whtr_ratio"
  ];
  for (const k of numericKeys) {
    const v = m[k];
    if (v != null && !isFiniteNumber(v)) return bad(`metric ${String(k)} must be a number`);
  }

  // Calcular WHTR si hay altura y cintura pero falta ratio
  if (
    (m.whtr_ratio == null || !isFiniteNumber(m.whtr_ratio)) &&
    isFiniteNumber(m.height_cm) &&
    isFiniteNumber(m.waist_circumference_cm) &&
    m.height_cm > 0
  ) {
    m.whtr_ratio = +(m.waist_circumference_cm / m.height_cm).toFixed(4);
  }

  // ===== STORAGE MODE =====
  // En Vercel el FS es solo lectura salvo /tmp.
  // Si estamos en Vercel (process.env.VERCEL) -> usar /tmp.
  // En local -> usar data/ingest/mock/...
  const isVercel = !!process.env.VERCEL;
  const baseDir = isVercel
    ? path.join("/tmp", "vyvus-ingest", body.user_id)
    : path.join(process.cwd(), "data", "ingest", "mock", body.user_id);

  try {
    await mkdir(baseDir, { recursive: true });
    const filename = path.join(baseDir, `${body.date}.json`);
    const record = { ...body, saved_at: new Date().toISOString() };
    await writeFile(filename, JSON.stringify(record, null, 2), "utf8");
    return NextResponse.json(
      { saved: true, storage: isVercel ? "tmp" : "file", path: isVercel ? filename : path.relative(process.cwd(), filename) },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("storage error", e?.message || e);
    return NextResponse.json({ error: "storage_unavailable", details: String(e?.message || e) }, { status: 500 });
  }
}
