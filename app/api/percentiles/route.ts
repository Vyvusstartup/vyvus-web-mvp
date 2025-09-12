export async function GET(req: Request) {
  const url = new URL(req.url);
  const age_band = url.searchParams.get('age_band') || '30-39';
  const sex = url.searchParams.get('sex') || 'F';
  const data = {
  "18-29": {
    "M": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    },
    "F": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    }
  },
  "30-39": {
    "M": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    },
    "F": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    }
  },
  "40-49": {
    "M": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    },
    "F": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    }
  },
  "50-59": {
    "M": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    },
    "F": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    }
  },
  "60-69": {
    "M": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    },
    "F": {
      "vo2max_mlkgmin": {
        "min": 25,
        "max": 60,
        "direction": "higher_better"
      },
      "steps_per_day": {
        "min": 2000,
        "max": 12000,
        "direction": "higher_better"
      },
      "mvpa_min_per_day": {
        "min": 0,
        "max": 90,
        "direction": "higher_better"
      },
      "sedentary_hours_per_day": {
        "min": 4,
        "max": 12,
        "direction": "lower_better"
      },
      "rhr_bpm": {
        "min": 45,
        "max": 85,
        "direction": "lower_better"
      },
      "hrv_rmssd_ms": {
        "min": 20,
        "max": 80,
        "direction": "higher_better"
      },
      "sleep_duration_hours": {
        "min": 4.5,
        "max": 9.5,
        "direction": "optimal_around_7.5"
      },
      "sleep_regularidad_SRI": {
        "min": 0,
        "max": 100,
        "direction": "higher_better"
      },
      "sleep_efficiency_percent": {
        "min": 75,
        "max": 95,
        "direction": "higher_better"
      },
      "whtr_ratio": {
        "min": 0.4,
        "max": 0.65,
        "direction": "lower_better"
      }
    }
  }
};
  const byBand = (data as any)[age_band] || (data as any)['30-39'];
  const bySex = byBand[sex as 'M'|'F'] || byBand['F'];
  return new Response(JSON.stringify({ age_band, sex, ranges: bySex }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
