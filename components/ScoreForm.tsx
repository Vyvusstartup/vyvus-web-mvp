'use client';
import React, { useMemo, useState } from 'react';
import { computeScore, type Metrics, type ScoreInput } from '@/lib/score';

const defaultInput: ScoreInput = {
  age_band: '30-39',
  sex: 'F',
  metrics: {
    vo2max_mlkgmin: 40,
    steps_per_day: 7000,
    mvpa_min_per_day: 30,
    sedentary_hours_per_day: 8,
    rhr_bpm: 65,
    hrv_rmssd_ms: 45,
    sleep_duration_hours: 7.0,
    sleep_regularidad_SRI: 70,
    sleep_efficiency_percent: 88,
    whtr_ratio: 0.5
  }
};

type DemoProfile = { profile_id: string; age_band: string; sex: 'M'|'F'; metrics: Metrics };

export default function ScoreForm() {
  const [tab, setTab] = useState<'manual'|'demo'>('manual');
  const [input, setInput] = useState<ScoreInput>(defaultInput);
  const [profiles, setProfiles] = useState<DemoProfile[]|null>(null);

  const output = useMemo(() => computeScore(input), [input]);

  async function loadProfiles() {
    const res = await fetch('/api/profiles');
    const data = await res.json();
    setProfiles(data.profiles);
  }

  React.useEffect(() => {
    if (tab === 'demo' && !profiles) loadProfiles();
  }, [tab]);

  function setMetric<K extends keyof Metrics>(key: K, value: number) {
    setInput(prev => ({ ...prev, metrics: { ...prev.metrics, [key]: value }}));
  }

  function ReliabilityBadge() {
    const flag = output.reliability_flag;
    const map = { green: 'badge-green', amber: 'badge-amber', red: 'badge-red' } as const;
    const label = { green: 'Confiable', amber: 'Parcial', red: 'Insuficiente' } as const;
    return <span className={"badge " + map[flag]}>{label[flag]}</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button className={"btn " + (tab==='manual'?'btn-primary':'bg-neutral100')} onClick={() => setTab('manual')}>Ingreso manual</button>
        <button className={"btn " + (tab==='demo'?'btn-primary':'bg-neutral100')} onClick={() => setTab('demo')}>Perfiles demo</button>
      </div>

      {tab === 'manual' && (
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rango de edad</label>
              <select className="input" value={input.age_band} onChange={(e)=>setInput({...input, age_band: e.target.value})}>
                {['18-29','30-39','40-49','50-59','60-69'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sexo</label>
              <select className="input" value={input.sex} onChange={(e)=>setInput({...input, sex: e.target.value as 'M'|'F'})}>
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField label="VO2max (ml/kg/min)" value={input.metrics.vo2max_mlkgmin} onChange={(v)=>setMetric('vo2max_mlkgmin', v)} />
            <NumberField label="Pasos/día" value={input.metrics.steps_per_day} onChange={(v)=>setMetric('steps_per_day', v)} />
            <NumberField label="MVPA (min/día)" value={input.metrics.mvpa_min_per_day} onChange={(v)=>setMetric('mvpa_min_per_day', v)} />
            <NumberField label="Sedentario (h/día)" value={input.metrics.sedentary_hours_per_day} onChange={(v)=>setMetric('sedentary_hours_per_day', v)} step={0.1} />
            <NumberField label="RHR (lat/min)" value={input.metrics.rhr_bpm} onChange={(v)=>setMetric('rhr_bpm', v)} />
            <NumberField label="HRV rMSSD (ms)" value={input.metrics.hrv_rmssd_ms} onChange={(v)=>setMetric('hrv_rmssd_ms', v)} />
            <NumberField label="Sueño — duración (h)" value={input.metrics.sleep_duration_hours} onChange={(v)=>setMetric('sleep_duration_hours', v)} step={0.1} />
            <NumberField label="Sueño — regularidad (SRI)" value={input.metrics.sleep_regularidad_SRI} onChange={(v)=>setMetric('sleep_regularidad_SRI', v)} />
            <NumberField label="Sueño — eficiencia (%)" value={input.metrics.sleep_efficiency_percent} onChange={(v)=>setMetric('sleep_efficiency_percent', v)} />
            <NumberField label="Rel. Cintura/Estatura (WHtR)" value={input.metrics.whtr_ratio} onChange={(v)=>setMetric('whtr_ratio', v)} step={0.01} />
          </div>
        </div>
      )}

      {tab === 'demo' && (
        <div className="card space-y-3">
          {!profiles && <p>Cargando perfiles…</p>}
          {profiles && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profiles.map(p => (
                <button key={p.profile_id} className="card text-left hover:shadow-md transition"
                  onClick={()=> setInput({ age_band: p.age_band, sex: p.sex, metrics: p.metrics })}>
                  <h4 className="font-semibold">{p.profile_id.replace('demo_','').replace('_',' ')}</h4>
                  <p className="text-sm text-neutral900/70">{p.sex} · {p.age_band}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Resultado</h3>
          <ReliabilityBadge />
        </div>
        <div>
          <div className="w-full bg-neutral100 rounded-xl h-4 overflow-hidden">
            <div className="bg-primary h-4" style={{ width: `${output.longevity_score_0_100}%` }} />
          </div>
          <p className="text-sm mt-1"><b>{output.longevity_score_0_100}/100</b></p>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer">Ver sub-scores</summary>
          <ul className="grid grid-cols-2 gap-2 mt-2 text-sm">
            {Object.entries(output.subscores_0_100).map(([k,v]) => (
              <li key={k} className="flex justify-between"><span>{labelFor(k)}</span><span>{Math.round(v)}</span></li>
            ))}
          </ul>
        </details>

        <div className="flex gap-2">
          <button className="btn btn-disabled" disabled>Conectar wearable (pronto)</button>
          <button className="btn btn-disabled" disabled>Subir CSV (beta)</button>
        </div>

        <Tips score={output.longevity_score_0_100} subscores={output.subscores_0_100} />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, step = 1 }:{ label:string; value:number; onChange:(v:number)=>void; step?:number }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type="number" value={value} step={step}
        onChange={(e)=>onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function labelFor(key: string) {
  const map: Record<string,string> = {
    vo2max_mlkgmin: 'VO2max',
    steps_per_day: 'Pasos/día',
    mvpa_min_per_day: 'MVPA (min/día)',
    sedentary_hours_per_day: 'Sedentario (h/d)',
    rhr_bpm: 'RHR (lat/min)',
    hrv_rmssd_ms: 'HRV (rMSSD)',
    sleep_duration_hours: 'Sueño — duración',
    sleep_regularidad_SRI: 'Sueño — regularidad (SRI)',
    sleep_efficiency_percent: 'Sueño — eficiencia (%)',
    whtr_ratio: 'WHtR',
  };
  return map[key] || key;
}

function Tips({ score, subscores }:{ score:number; subscores: Record<string, number> }) {
  const lows = Object.entries(subscores).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>k);
  const suggestions = lows.map(k => suggestFor(k));
  return (
    <div className="mt-3">
      <h4 className="font-semibold">3 cosas que podrías hacer</h4>
      <ul className="list-disc ml-5 text-sm">
        {suggestions.map((s,i)=>(<li key={i}>{s}</li>))}
      </ul>
      <p className="help mt-2">Sugerencias educativas basadas en métricas bajas. No sustituyen recomendaciones médicas.</p>
    </div>
  );
}

function suggestFor(key: string) {
  switch (key) {
    case 'steps_per_day': return 'Añadir ~2000 pasos/día caminando en 2–3 bloques.';
    case 'mvpa_min_per_day': return 'Sumar 15–20 min de actividad moderada (p. ej., trotar o bici).';
    case 'sedentary_hours_per_day': return 'Hacer pausas de 2–3 min cada hora para reducir sedentarismo.';
    case 'rhr_bpm': return 'Practicar respiración/relajación y actividad aeróbica ligera para bajar RHR.';
    case 'hrv_rmssd_ms': return 'Priorizar sueño regular y manejo del estrés para mejorar HRV.';
    case 'sleep_duration_hours': return 'Ajustar horario para acercarte a ~7–8 h de sueño.';
    case 'sleep_regularidad_SRI': return 'Fijar horarios consistentes de acostarse y levantarse.';
    case 'sleep_efficiency_percent': return 'Evitar pantallas antes de dormir y mantener el dormitorio oscuro.';
    case 'whtr_ratio': return 'Apuntar a una relación cintura/estatura más baja con hábitos sostenibles.';
    case 'vo2max_mlkgmin': return 'Incluir entrenamientos aeróbicos progresivos para subir VO2max.';
    default: return 'Hábitos consistentes y progresivos suelen mejorar el score.';
  }
}
