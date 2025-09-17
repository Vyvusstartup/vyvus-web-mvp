import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "data", "percentiles", "v0_1_0.json");

describe("percentiles dataset (v0_1_0.json)", () => {
  it("is valid JSON without BOM", () => {
    const raw = readFileSync(filePath, "utf8");
    expect(raw.length).toBeGreaterThan(0);
    // no BOM at start
    expect(raw.charCodeAt(0)).not.toBe(0xFEFF);
    const parsed = JSON.parse(raw);
    expect(parsed && typeof parsed).toBe("object");
  });

  it("has required top-level fields", () => {
    const json = JSON.parse(readFileSync(filePath, "utf8"));
    expect(typeof json.dataset_name).toBe("string");
    expect(typeof json.model_version).toBe("string");
    expect(typeof json.data_quality_flag).toBe("string");
    expect(Array.isArray(json.source)).toBe(true);
    expect(typeof json.metrics).toBe("object");
  });

  it("contains expected metric keys and shapes", () => {
    const json = JSON.parse(readFileSync(filePath, "utf8"));
    const m = json.metrics;
    const expectedKeys = [
      "age_years",
      "sex",
      "rhr_bpm",
      "vo2max_ml_kg_min",
      "mvpa_minutes_per_day",
      "steps_per_day",
      "sedentary_hours_per_day",
      "sleep_duration_hours",
      "whtr_ratio",
      "smoking_status",
      "alcohol_days_per_week",
    ];
    for (const k of expectedKeys) {
      expect(m).toHaveProperty(k);
    }

    // sample structural checks
    expect(typeof m.rhr_bpm.min).toBe("number");
    expect(typeof m.rhr_bpm.max).toBe("number");
    expect(m.rhr_bpm.invert).toBe(true);

    expect(m.sleep_duration_hours.u_shape).toBeDefined();
    expect(typeof m.sleep_duration_hours.u_shape.optimal_hours).toBe("number");
    expect(typeof m.sleep_duration_hours.u_shape.sigma).toBe("number");
  });
});
