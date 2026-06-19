// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Scenario Simulation Engine
//
// Applies parameter overrides to a baseline OLTEEInputs and recomputes
// the full OLTEE equation for each scenario.
//
// Override types (from SCENARIO_PRESETS in constants.ts):
//   r_delta      — additive delta on r (e.g. +0.02 = rate hike of 2%)
//   ROI_factor   — multiplicative factor on ROI (e.g. 0.70 = 30% drop)
//   CF_ratio_factor — multiplicative factor on CF_ratio (e.g. 0.75 = 25% income cut)
//   A_factor     — multiplicative factor on A (e.g. 0.80 = 20% asset decline)
//   sigma        — direct replacement of sigma value
//
// All modified values are clamped to valid RANGES before computation.
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import type {
  OLTEEInputs,
  ScenarioPreset,
  ScenarioResult,
  ScenarioComparison,
  SensitivityAnalysis,
  SensitivityPoint,
  ScenarioParameter,
} from "@/types/oltee";

import { SCENARIO_PRESETS, RANGES } from "@/config/constants";
import { computeOLTEE, computeStatus } from "@/lib/engine";
import { computeScores } from "@/lib/scores";
import { clamp } from "@/lib/utils";

// ─── Type for preset overrides (extends ScenarioPreset with runtime override keys) ──

// The overrides from SCENARIO_PRESETS use string keys that are not part of
// OLTEEInputs — they are a DSL for the scenario engine.
type ScenarioOverrideMap = {
  r_delta?:        number;   // additive
  ROI_factor?:     number;   // multiplicative
  CF_ratio_factor?: number;  // multiplicative
  A_factor?:       number;   // multiplicative
  sigma?:          number;   // direct replacement
  // Allow direct field replacements too
  ROI?:      number;
  r?:        number;
  T?:        number;
  CF_ratio?: number;
  D?:        number;
  A?:        number;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Applies a scenario preset's overrides to the baseline inputs.
 * Handles all override types: additive deltas, multiplicative factors,
 * direct replacements. All outputs are clamped to valid RANGES.
 */
export function applyScenarioOverrides(
  baseline: OLTEEInputs,
  preset: ScenarioPreset
): OLTEEInputs {
  const overrides = preset.overrides as ScenarioOverrideMap;

  // Start from baseline
  let ROI      = baseline.ROI;
  let r        = baseline.r;
  let T        = baseline.T;
  let sigma    = baseline.sigma;
  let CF_ratio = baseline.CF_ratio;
  let D        = baseline.D;
  let A        = baseline.A;

  // Apply additive deltas
  if (overrides.r_delta !== undefined)   r        = r + overrides.r_delta;

  // Apply multiplicative factors
  if (overrides.ROI_factor !== undefined)      ROI      = ROI * overrides.ROI_factor;
  if (overrides.CF_ratio_factor !== undefined) CF_ratio = CF_ratio * overrides.CF_ratio_factor;
  if (overrides.A_factor !== undefined)        A        = A * overrides.A_factor;

  // Apply direct replacements
  if (overrides.sigma !== undefined)    sigma    = overrides.sigma;
  if (overrides.ROI !== undefined)      ROI      = overrides.ROI;
  if (overrides.r !== undefined)        r        = overrides.r;
  if (overrides.T !== undefined)        T        = overrides.T;
  if (overrides.CF_ratio !== undefined) CF_ratio = overrides.CF_ratio;
  if (overrides.D !== undefined)        D        = overrides.D;
  if (overrides.A !== undefined)        A        = overrides.A;

  // Clamp all values to valid ranges
  return {
    ROI:      clamp(ROI,      RANGES.ROI.min,      RANGES.ROI.max),
    r:        clamp(r,        RANGES.r.min,        RANGES.r.max),
    T:        clamp(T,        RANGES.T.min,        RANGES.T.max),
    sigma:    clamp(sigma,    RANGES.sigma.min,    RANGES.sigma.max),
    CF_ratio: clamp(CF_ratio, RANGES.CF_ratio.min, RANGES.CF_ratio.max),
    D:        Math.max(D, RANGES.D.min),
    A:        Math.max(A, Math.max(D + 1, RANGES.A.min)), // ensure A > D always
  };
}

/**
 * Builds the baseline ScenarioResult — the anchor for all comparisons.
 */
export function buildBaselineResult(baseline: OLTEEInputs): ScenarioResult {
  const outputs = computeOLTEE(baseline);
  const scores  = computeScores(baseline, outputs);

  return {
    scenario: null,
    label:    "Baseline",
    inputs:   baseline,
    outputs,
    scores,
    delta: {
      L_star:        0,
      debt_ratio:    0,
      headroom_SAR:  0,
      status_changed: false,
      direction:     "unchanged",
    },
  };
}

/**
 * Computes a full ScenarioResult for modified inputs compared to the baseline.
 * Calculates the delta between scenario and baseline, classifies direction.
 */
export function computeScenarioResult(
  scenarioInputs: OLTEEInputs,
  baselineResult: ScenarioResult,
  scenarioLabel: string,
  preset?: ScenarioPreset
): ScenarioResult {
  const outputs = computeOLTEE(scenarioInputs);
  const scores  = computeScores(scenarioInputs, outputs);

  const baseline_L_star       = baselineResult.outputs.L_star;
  const baseline_headroom_SAR = baselineResult.outputs.headroom_SAR;
  const baseline_status       = baselineResult.outputs.status;

  const L_star_delta       = outputs.L_star - baseline_L_star;
  const headroom_SAR_delta = outputs.headroom_SAR - baseline_headroom_SAR;
  const status_changed     = outputs.status !== baseline_status;

  const direction: ScenarioResult["delta"]["direction"] =
    L_star_delta > 0.005  ? "improved"  :
    L_star_delta < -0.005 ? "degraded"  :
    "unchanged";

  return {
    scenario: preset ?? null,
    label:    scenarioLabel,
    inputs:   scenarioInputs,
    outputs,
    scores,
    delta: {
      L_star:        L_star_delta,
      debt_ratio:    outputs.debt_ratio - baselineResult.outputs.debt_ratio,
      headroom_SAR:  headroom_SAR_delta,
      status_changed,
      direction,
    },
  };
}

/**
 * Runs all 8 preset scenarios and returns a full comparison.
 * Identifies worst and best cases by L* threshold value.
 */
export function runAllPresetScenarios(
  baseline: OLTEEInputs
): ScenarioComparison {
  const baselineResult = buildBaselineResult(baseline);

  const scenarios: ScenarioResult[] = SCENARIO_PRESETS.map((preset) => {
    const modifiedInputs = applyScenarioOverrides(baseline, preset as unknown as ScenarioPreset);
    return computeScenarioResult(
      modifiedInputs,
      baselineResult,
      preset.name,
      preset as unknown as ScenarioPreset
    );
  });

  // Worst case: lowest L* (smallest safe threshold)
  const worstCase = scenarios.reduce((prev, curr) =>
    curr.outputs.L_star < prev.outputs.L_star ? curr : prev
  );

  // Best case: highest L* (largest safe threshold)
  const bestCase = scenarios.reduce((prev, curr) =>
    curr.outputs.L_star > prev.outputs.L_star ? curr : prev
  );

  return { baseline: baselineResult, scenarios, worstCase, bestCase };
}

/**
 * Sweeps a single parameter across its valid range in N steps.
 * Returns L* and status at each point, plus the inflection point where
 * the status changes (e.g., from OPTIMAL to CAUTION).
 *
 * @param steps - Number of sweep points (default 50 for smooth chart)
 */
export function runSensitivityAnalysis(
  baseline: OLTEEInputs,
  parameter: ScenarioParameter,
  steps: number = 50
): SensitivityAnalysis {
  const range = RANGES[parameter];
  const { min, max } = range;
  const stepSize = (max - min) / (steps - 1);

  const baselineOutput = computeOLTEE(baseline);
  const points: SensitivityPoint[] = [];

  let inflection_point: number | null = null;
  let prevStatus = baselineOutput.status;

  for (let i = 0; i < steps; i++) {
    const paramValue = min + i * stepSize;
    const modifiedInputs: OLTEEInputs = { ...baseline, [parameter]: paramValue };

    // Ensure A > D when sweeping either asset or debt field
    if (parameter === "A" && modifiedInputs.A <= modifiedInputs.D) {
      modifiedInputs.A = modifiedInputs.D + 1;
    }
    if (parameter === "D" && modifiedInputs.D >= modifiedInputs.A) {
      modifiedInputs.D = modifiedInputs.A - 1;
    }

    const output = computeOLTEE(modifiedInputs);

    const point: SensitivityPoint = {
      parameterValue: paramValue,
      L_star:         output.L_star,
      status:         output.status,
      delta_from_baseline: output.L_star - baselineOutput.L_star,
    };
    points.push(point);

    // Detect first status change
    if (inflection_point === null && output.status !== prevStatus) {
      inflection_point = paramValue;
    }
    prevStatus = output.status;
  }

  // Human-readable parameter labels
  const parameterLabels: Record<ScenarioParameter, string> = {
    ROI:      "Annual return (ROI)",
    r:        "Interest rate (r)",
    sigma:    "Income volatility (σ)",
    CF_ratio: "Cash flow coverage ratio",
    D:        "Total debt (SAR)",
    A:        "Total assets (SAR)",
    T:        "Tax rate (T)",
  };

  return {
    parameter,
    label:            parameterLabels[parameter],
    points,
    baseline_value:   baseline[parameter],
    baseline_L_star:  baselineOutput.L_star,
    inflection_point,
  };
}
