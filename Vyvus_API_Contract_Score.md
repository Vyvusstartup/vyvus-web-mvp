# DEMO API contract for /api/score

**Request (POST /api/score)**

```json
{
  "age_band": "30-39",
  "sex": "F",
  "metrics": {
    "vo2max_mlkgmin": 40,
    "steps_per_day": 7000,
    "mvpa_min_per_day": 30,
    "sedentary_hours_per_day": 8,
    "rhr_bpm": 65,
    "hrv_rmssd_ms": 45,
    "sleep_duration_hours": 7.0,
    "sleep_regularidad_SRI": 70,
    "sleep_efficiency_percent": 88,
    "whtr_ratio": 0.5
  }
}
```

**Response**

```json
{
  "subscores_0_100": { "vo2max_mlkgmin": 65, "...": 50 },
  "longevity_score_0_100": 63,
  "reliability_flag": "green",
  "notes": ["..."]
}
```
