// app/tester/[code]/page.tsx
import supabaseAdmin from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import RecalcButton from "../RecalcButton";
import DateNav from "../DateNav";
import ScorePanel from "../ScorePanel";
import TesterViewEvent from "./TesterViewEvent"; // <-- Telemetría

export const revalidate = 0;

type Props = { params: { code: string }; searchParams?: { date?: string } };
type Subscores = Record<string, number | null>;

function coverageFromCanon(canon: Record<string, any> | null): number | null {
  if (!canon) return null;
  const vals = Object.values(canon);
  const present = vals.filter((v) => v !== null && v !== undefined).length;
  const total = vals.length || 10;
  return Math.round((present / total) * 100);
}

function startDate(endYMD: string, days: number) {
  const d = new Date(`${endYMD}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

async function getUserIdByTesterCode(code: string) {
  const { data } = await supabaseAdmin
    .from("ingest_tokens")
    .select("user_id")
    .eq("tester_code", code)
    .is("revoked_at", null)
    .limit(1);
  return data?.[0]?.user_id ?? null;
}

async function getCachedScore(userId: string, date: string) {
  const { data } = await supabaseAdmin
    .from("daily_scores")
    .select(
      "score, subscores, last_saved_at, reliability_flag, coverage_percent"
    )
    .eq("user_id", userId)
    .eq("measured_date", date)
    .limit(1);
  return (data?.[0] ?? null) as
    | {
        score: number;
        subscores: Subscores;
        last_saved_at: string;
        reliability_flag: string | null;
        coverage_percent: number | null;
      }
    | null;
}

async function readCanonicalMetrics(userId: string, date: string) {
  const { data } = await supabaseAdmin
    .from("daily_metrics_canonical")
    .select(
      "vo2max_mlkgmin, steps_per_day, mvpa_min_per_day, sedentary_hours_per_day, rhr_bpm, hrv_rmssd_ms, sleep_duration_hours, sleep_regularidad_SRI, sleep_efficiency_percent, whtr_ratio"
    )
    .eq("user_id", userId)
    .eq("measured_date", date)
    .limit(1);
  return (data?.[0] ?? null) as Record<string, number | null> | null;
}

async function computeScoreOnServer(reqUrl: string, metrics: any) {
  const url = new URL(reqUrl);
  url.pathname = "/api/score";
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ metrics }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const d = await res.json();
  return {
    score: d.longevity_score_0_100 as number,
    subscores: d.subscores_0_100 as Subscores,
    reliability_flag: (d.reliability_flag as string) ?? null,
  };
}

// Serie detallada (score + subscores + meta) para 120 días
async function getScoreRows(userId: string, endDate: string, days = 120) {
  const from = startDate(endDate, days);
  const { data } = await supabaseAdmin
    .from("daily_scores")
    .select(
      "measured_date, score, subscores, reliability_flag, coverage_percent, last_saved_at"
    )
    .eq("user_id", userId)
    .gte("measured_date", from)
    .lte("measured_date", endDate)
    .order("measured_date", { ascending: true });
  return (data ?? []).map((r) => ({
    date: r.measured_date as string,
    score: (r.score as number) ?? null,
    subscores: (r.subscores as Subscores) ?? {},
    reliability_flag: (r.reliability_flag as string) ?? null,
    coverage_percent: (r.coverage_percent as number) ?? null,
    last_saved_at: (r.last_saved_at as string) ?? null,
  }));
}

// ===== Server Action: Recalcular y guardar =====
async function recalcAndSave(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "");
  const date = String(
    formData.get("date") || new Date().toISOString().slice(0, 10)
  );
  const userId = await getUserIdByTesterCode(code);
  if (!userId)
    redirect(`/tester/${encodeURIComponent(code)}?date=${date}&err=no_user`);

  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  await fetch(`${base}/api/score/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.INGEST_TEST_TOKEN ?? ""}`,
    },
    body: JSON.stringify({ measured_date: date, user_id: userId }),
  });

  redirect(`/tester/${encodeURIComponent(code)}?date=${date}`);
}

export default async function TesterPage({ params, searchParams }: Props) {
  const code = decodeURIComponent(params.code);
  const date =
    (searchParams?.date && String(searchParams.date)) ||
    new Date().toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const userId = await getUserIdByTesterCode(code);
  if (!userId) {
    return (
      <main className="max-w-xl mx-auto p-6">
        {/* Telemetría: vista sin user_id */}
        <TesterViewEvent testerCode={code} date={date} />
        <h1 className="text-2xl font-semibold">Tester {code}</h1>
        <p className="mt-3 text-red-600">
          No se encontró <code>user_id</code> para este <code>tester_code</code>.
        </p>
      </main>
    );
  }

  const [cached, canon, rows] = await Promise.all([
    getCachedScore(userId, date),
    readCanonicalMetrics(userId, date),
    getScoreRows(userId, date, 120),
  ]);

  let computed:
    | { score: number; subscores: Subscores; reliability_flag: string | null }
    | null = null;
  if (!cached && canon) {
    computed = await computeScoreOnServer(
      `https://${process.env.VERCEL_URL ?? "localhost:3000"}/tester/${encodeURIComponent(
        code
      )}?date=${date}`,
      canon
    );
  }

  const hasMetrics = !!canon;
  const canRecalc = date === today || hasMetrics;

  const payload =
    cached
      ? {
          mode: "cached" as const,
          date,
          score: cached.score,
          subscores: cached.subscores,
          reliability_flag: cached.reliability_flag ?? null,
          coverage_percent: cached.coverage_percent ?? null,
          last_saved_at: cached.last_saved_at,
        }
      : computed
      ? {
          mode: "computed" as const,
          date,
          score: computed.score,
          subscores: computed.subscores,
          reliability_flag: computed.reliability_flag ?? null,
          coverage_percent: coverageFromCanon(canon),
          last_saved_at: null as string | null,
        }
      : null;

  // puntos simples para la línea
  const points = rows.map((r) => ({ date: r.date, value: r.score }));

  // si no hay datos en ningún lado
  if (!payload && rows.length === 0) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <TesterViewEvent testerCode={code} date={date} /> {/* Telemetría */}
        <h1 className="text-2xl font-semibold">Vyvus — Longevity Score (DEMO)</h1>
        <p className="text-gray-500 mt-1">
          DEMO without population calibration or integrations. Educational content. Not medical advice.
        </p>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">Tester {code}</h2>
          <p className="text-sm text-gray-500">Fecha: {date}</p>
          <DateNav date={date} />
        </div>

        <div className="mt-6 rounded-2xl border p-4">
          <p className="text-gray-700">No hay métricas para esta fecha.</p>
          <form action={recalcAndSave} method="post" className="mt-4">
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="date" value={date} />
            <RecalcButton
              disabled={!canRecalc}
              label={canRecalc ? "Calcular y guardar" : "Sin datos para recalcular"}
              testerCode={code}
              date={date}
            />
          </form>
        </div>
      </main>
    );
  }

  // inicial para el panel (si no hay payload, usamos la última fila disponible)
  const initial =
    payload
      ? {
          date,
          score: payload.score,
          subscores: payload.subscores,
          reliability_flag: payload.reliability_flag ?? null,
          coverage_percent: payload.coverage_percent ?? null,
          last_saved_at: payload.last_saved_at ?? undefined,
        }
      : {
          date: rows[rows.length - 1].date,
          score: rows[rows.length - 1].score ?? 0,
          subscores: rows[rows.length - 1].subscores ?? {},
          reliability_flag: rows[rows.length - 1].reliability_flag ?? null,
          coverage_percent: rows[rows.length - 1].coverage_percent ?? null,
          last_saved_at: rows[rows.length - 1].last_saved_at ?? undefined,
        };

  return (
    <main className="max-w-xl mx-auto p-6">
      <TesterViewEvent testerCode={code} date={date} /> {/* Telemetría */}
      <h1 className="text-2xl font-semibold">Vyvus — Longevity Score (DEMO)</h1>
      <p className="text-gray-500 mt-1">
        DEMO without population calibration or integrations. Educational content. Not medical advice.
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Tester {code}</h2>
        <p className="text-sm text-gray-500">Fecha: {date}</p>
        <DateNav date={date} />
      </div>

      <div className="mt-6 rounded-2xl border p-4">
        {/* Panel interactivo: gráfica centrada, score/badges debajo y biomarcadores reactivos */}
        <ScorePanel
          code={code}
          points={points}
          rows={rows}
          initial={initial}
          onRecalc={recalcAndSave}
          canRecalc={canRecalc}
        />

        <div className="mt-5 text-xs text-gray-500">
          * “computed” = calculado al vuelo (no guardado). “cached” = leído de{" "}
          <code>daily_scores</code>.
        </div>
      </div>
    </main>
  );
}

