import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { score, subscores } = body as { score: number; subscores: Record<string, number> };
    if (typeof score !== 'number' || !subscores) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const entries = Object.entries(subscores).sort((a,b)=>a[1]-b[1]);
    const low = entries.slice(0, 3).map(([k]) => k);
    const map: Record<string,string> = {
      steps_per_day: 'pasos/día',
      mvpa_min_per_day: 'MVPA (min/día)',
      sedentary_hours_per_day: 'sedentarismo (h/día)',
      rhr_bpm: 'RHR (lat/min)',
      hrv_rmssd_ms: 'HRV rMSSD (ms)',
      sleep_duration_hours: 'duración de sueño',
      sleep_regularidad_SRI: 'regularidad del sueño (SRI)',
      sleep_efficiency_percent: 'eficiencia de sueño (%)',
      whtr_ratio: 'relación cintura/estatura (WHtR)',
      vo2max_mlkgmin: 'VO2max (ml/kg/min)',
    };
    const text = [
      `Tu puntaje es ${Math.round(score)}/100 (DEMO).`, 
      `Áreas con más potencial: ${low.map(k=>map[k]).join(', ')}.`,
      `Esto es educativo; no es diagnóstico.`
    ].join(' ');
    const tips = [
      'Añade ~2000 pasos/día en 2–3 bloques.',
      'Suma 15–20 min de actividad moderada.',
      'Cuida horarios consistentes de sueño.'
    ];
    return NextResponse.json({ explanation: text, tips });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
