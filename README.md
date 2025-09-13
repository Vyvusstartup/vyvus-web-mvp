# Vyvus — Longevity Score (DEMO)

**What it is.** Next.js web that computes a **0–100** score from **10 metrics** (Tier 1) and generates a simple, evidence-based explanation (non-diagnostic). PWA installable (iOS/Android).

## Demo
- **URL:** vyvus-web-mvp.vercel.app
- **Try it:** Home → “Calculate my score” → enter 10 metrics or use **Demo profiles**
- **Language:** ES/EN (switch in header)
- **PWA:** Safari/Chrome → *Add to Home Screen / Install app*

## How it works (DEMO)
- **Normalization** to 0–100 sub-scores (reasonable min–max in demo).  
  Inverted: *rhr_bpm, sedentary_hours_per_day, whtr_ratio*.  
  *sleep_duration_hours* uses a U-shape.
- **Aggregation:** weighted sum → **0–100** (clipped).
- **Reliability flag:** green if all 10 present; amber/red otherwise.
- **Explanation:** `/api/assistant/explain` uses a static **evidence pack** to output tips & sources (educational).

## Endpoints (DEMO)
- `POST /api/score` — main scoring
- `GET  /api/profiles` — 5 demo profiles
- `GET  /api/percentiles` — static min-max table (optional)
- `POST /api/assistant/explain` — evidence-based explanation (ES/EN)

## Stack
Next.js 14 + TS, Tailwind; Vercel (API Routes); minimal PWA SW

## Limitations
No population calibration or wearables yet. Educational, not medical advice.

## License
MIT (or your choice).
