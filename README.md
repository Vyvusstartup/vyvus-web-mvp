# Vyvus — Longevity Score (DEMO)

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind. Deploy sugerido: Vercel.

## Qué hace
- Calcula un Longevity Score 0–100 desde 10 métricas (Tier 1).
- Muestra sub-scores, bandera de confiabilidad y 3 tips educativos.
- Tiene tabs: *Ingreso manual* y *Perfiles demo*.
- Link al PDF explicador en `/public/docs/`.

## Endpoints
- `POST /api/score` — contrato DEMO en `Vyvus_API_Contract_Score.md`.
- `GET /api/profiles` — retorna 5 perfiles de ejemplo.
- `GET /api/percentiles?age_band=30-39&sex=F` — min–max estáticos por edad/sexo (DEMO).
- `POST /api/assistant/explain` — explicación simple y tips (no diagnóstico).

## Correr local
```bash
npm i
npm run dev
# abre http://localhost:3000
```

## Deploy en Vercel
- Importa el repo en Vercel y despliega con los defaults de Next.js 14.
- No requiere variables de entorno para la DEMO.

## Notas
- Módulo de score en `lib/score.ts` es una función pura e independiente.
- En producción: reemplazar normalización DEMO por percentiles reales y ajustar pesos con Evidencia × Fiabilidad × Cobertura.
- Botones de wearable y CSV están visibles pero deshabilitados.
