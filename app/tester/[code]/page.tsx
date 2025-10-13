// app/tester/[code]/page.tsx
import supabaseAdmin from "@/lib/supabaseAdmin";

export const revalidate = 0; // siempre fresco (pilot)

type Props = {
  params: { code: string };
  searchParams?: { date?: string };
};

async function getUserIdByTesterCode(code: string) {
  const { data, error } = await supabaseAdmin
    .from("ingest_tokens")
    .select("user_id")
    .eq("tester_code", code)
    .is("revoked_at", null)
    .limit(1);
  if (error || !data || !data[0]) return null;
  return data[0].user_id as string;
}

async function getCachedScore(userId: string, date: string) {
  const { data, error } = await supabaseAdmin
    .from("daily_scores")
    .select("score, subscores")
    .eq("user_id", userId)
    .eq("measured_date", date)
    .limit(1);
  if (error || !data || !data[0]) return null;
  return data[0] as { score: number; subscores: Record<string, number | null> };
}

async function readCanonicalMetrics(userId: string, date: string) {
  const { data, error } = await supabaseAdmin
    .from("daily_metrics_canonical")
    .select(
      "vo2max_mlkgmin, steps_per_day, mvpa_min_per_day, sedentary_hours_per_day, rhr_bpm, hrv_rmssd_ms, sleep_duration_hours, sleep_regularidad_SRI, sleep_efficiency_percent, whtr_ratio"
    )
    .eq("user_id", userId)
    .eq("measured_date", date)
    .limit(1);
  if (error || !data || !data[0]) return null;
  return data[0] as Record<string, number | null>;
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
    subscores: d.subscores_0_100 as Record<string, number | null>,
  };
}

export default async function TesterPage({ params, searchParams }: Props) {
  const code = decodeURIComponent(params.code);
  const date = (searchParams?.date && String(searchParams.date)) || new Date().toISOString().slice(0, 10);

  const userId = await getUserIdByTesterCode(code);
  if (!userId) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Tester {code}</h1>
        <p className="mt-3 text-red-600">No se encontró <code>user_id</code> para este <code>tester_code</code>.</p>
      </main>
    );
  }

  // 1) intenta caché
  const cached = await getCachedScore(userId, date);

  // 2) si no hay caché, intenta calcular al vuelo leyendo métricas canónicas
  let computed: { score: number; subscores: Record<string, number | null> } | null = null;
  if (!cached) {
    const canon = await readCanonicalMetrics(userId, date);
    if (canon) {
      computed = await computeScoreOnServer(
        // @ts-ignore
        `https://` + process.env.VERCEL_URL + `/tester/${encodeURIComponent(code)}?date=${date}`,
        canon
      );
    }
  }

  const payload = cached
    ? { source: "cached" as const, date, ...cached }
    : computed
      ? { source: "computed" as const, date, ...computed }
      : null;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Tester {code}</h1>
      <p className="text-sm text-gray-500">Fecha: {date}</p>

      {!payload ? (
        <div className="mt-6 rounded-2xl border p-4">
          <p className="text-gray-700">No hay métricas para esta fecha.</p>
          <p className="text-sm text-gray-500 mt-1">
            Sube datos con el atajo o usa <code>/api/ingest/healthkit</code> y vuelve a intentar.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border p-4">
          <div className="text-4xl font-bold">{Math.round(payload.score)}<span className="text-xl">/100</span></div>
          <div className="mt-1 text-sm text-gray-500">source: {payload.source}</div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(payload.subscores).map(([k, v]) => (
              <div key={k} className="flex justify-between border rounded-xl px-3 py-2">
                <span className="truncate">{k}</span>
                <span className="font-medium">{v == null ? "—" : Number(v).toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 text-xs text-gray-500">
            * “computed” = calculado al vuelo (no guardado). “cached” = leído de <code>daily_scores</code>.
          </div>
        </div>
      )}
    </main>
  );
}
