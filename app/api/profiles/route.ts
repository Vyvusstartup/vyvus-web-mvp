export async function GET() {
  return new Response(JSON.stringify({"profiles": [
  {
    "profile_id": "demo_athlete",
    "age_band": "30-39",
    "sex": "M",
    "metrics": {
      "vo2max_mlkgmin": 55,
      "steps_per_day": 11000,
      "mvpa_min_per_day": 60,
      "sedentary_hours_per_day": 5.0,
      "rhr_bpm": 50,
      "hrv_rmssd_ms": 75,
      "sleep_duration_hours": 7.6,
      "sleep_regularidad_SRI": 90,
      "sleep_efficiency_percent": 93,
      "whtr_ratio": 0.43
    }
  },
  {
    "profile_id": "demo_promedio",
    "age_band": "30-39",
    "sex": "F",
    "metrics": {
      "vo2max_mlkgmin": 38,
      "steps_per_day": 6500,
      "mvpa_min_per_day": 25,
      "sedentary_hours_per_day": 8.5,
      "rhr_bpm": 66,
      "hrv_rmssd_ms": 40,
      "sleep_duration_hours": 7.0,
      "sleep_regularidad_SRI": 70,
      "sleep_efficiency_percent": 86,
      "whtr_ratio": 0.5
    }
  },
  {
    "profile_id": "demo_sedentario",
    "age_band": "40-49",
    "sex": "M",
    "metrics": {
      "vo2max_mlkgmin": 30,
      "steps_per_day": 3500,
      "mvpa_min_per_day": 5,
      "sedentary_hours_per_day": 11.0,
      "rhr_bpm": 78,
      "hrv_rmssd_ms": 25,
      "sleep_duration_hours": 6.5,
      "sleep_regularidad_SRI": 55,
      "sleep_efficiency_percent": 80,
      "whtr_ratio": 0.6
    }
  },
  {
    "profile_id": "demo_sueno_irregular",
    "age_band": "30-39",
    "sex": "F",
    "metrics": {
      "vo2max_mlkgmin": 42,
      "steps_per_day": 7000,
      "mvpa_min_per_day": 30,
      "sedentary_hours_per_day": 8.0,
      "rhr_bpm": 64,
      "hrv_rmssd_ms": 45,
      "sleep_duration_hours": 6.0,
      "sleep_regularidad_SRI": 40,
      "sleep_efficiency_percent": 78,
      "whtr_ratio": 0.49
    }
  },
  {
    "profile_id": "demo_alto_whtr",
    "age_band": "50-59",
    "sex": "M",
    "metrics": {
      "vo2max_mlkgmin": 35,
      "steps_per_day": 5000,
      "mvpa_min_per_day": 10,
      "sedentary_hours_per_day": 9.0,
      "rhr_bpm": 72,
      "hrv_rmssd_ms": 35,
      "sleep_duration_hours": 7.5,
      "sleep_regularidad_SRI": 65,
      "sleep_efficiency_percent": 85,
      "whtr_ratio": 0.64
    }
  }
]}), {
    headers: { 'Content-Type': 'application/json' }
  });
}
