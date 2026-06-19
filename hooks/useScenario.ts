// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Scenario Simulation Hook
//
// Central hook for the Scenario Lab page. Manages:
//   - Full preset computation (all 8 at mount)
//   - Active preset selection (multi-select up to 4)
//   - Manual slider state with debounced recomputation
//   - Sensitivity analysis sweep
//   - Reset to baseline
//
// All computation is synchronous — the engine is pure math, < 1ms per run.
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  OLTEEInputs,
  ScenarioPreset,
  ScenarioResult,
  ScenarioComparison,
  ScenarioSliderConfig,
  SensitivityAnalysis,
  ScenarioParameter,
} from "@/types/oltee";
import {
  buildBaselineResult,
  computeScenarioResult,
  runAllPresetScenarios,
  applyScenarioOverrides,
  runSensitivityAnalysis,
} from "@/lib/scenarios";
import { SCENARIO_PRESETS, RANGES } from "@/config/constants";
import { debounce } from "@/lib/utils";

export interface UseScenarioReturn {
  // Core state
  baseline: ScenarioResult | null;
  comparison: ScenarioComparison | null;
  customResult: ScenarioResult | null;

  // Preset management
  selectedPresetIds: string[];
  selectedPresets: ScenarioResult[];
  togglePreset: (id: string) => void;
  clearPresets: () => void;

  // Slider state
  sliderConfigs: ScenarioSliderConfig[];
  adjustSlider: (parameter: ScenarioParameter, value: number) => void;
  resetSliders: () => void;
  hasSliderChanges: boolean;

  // Sensitivity analysis
  sensitivityAnalysis: SensitivityAnalysis | null;
  sensitivityParameter: ScenarioParameter;
  setSensitivityParameter: (p: ScenarioParameter) => void;
  runSweep: () => void;

  // Meta
  isComputing: boolean;
  resetAll: () => void;
}

// ─── Slider Configs ─────────────────────────────────────────────────────────

function buildSliderConfigs(baseline: OLTEEInputs): ScenarioSliderConfig[] {
  // Coerce all values to numbers — URL-param inputs may arrive as strings
  // even after the form layer, causing NaN in Math operations and .toFixed() crashes.
  const n = (v: unknown) => {
    const num = typeof v === "string" ? parseFloat(v as string) : Number(v);
    return isFinite(num) ? num : 0;
  };

  const r        = n(baseline.r);
  const ROI      = n(baseline.ROI);
  const CF_ratio = n(baseline.CF_ratio);
  const sigma    = n(baseline.sigma);

  return [
    {
      parameter:     "r",
      label:         "Interest rate",
      description:   "Annual loan interest or profit rate",
      min:           Math.max(r - 0.08, RANGES.r.min),
      max:           Math.min(r + 0.08, RANGES.r.max),
      step:          0.0025,
      unit:          "%",
      baselineValue: r,
      currentValue:  r,
    },
    {
      parameter:     "ROI",
      label:         "Annual return (ROI)",
      description:   "Investment return on the financed asset",
      min:           Math.max(ROI * 0.40, RANGES.ROI.min),
      max:           Math.min(ROI * 1.80, RANGES.ROI.max),
      step:          0.001,
      unit:          "%",
      baselineValue: ROI,
      currentValue:  ROI,
    },
    {
      parameter:     "CF_ratio",
      label:         "Cash flow coverage",
      description:   "Monthly income ÷ monthly repayment",
      min:           Math.max(CF_ratio * 0.40, RANGES.CF_ratio.min),
      max:           Math.min(CF_ratio * 2.00, RANGES.CF_ratio.max),
      step:          0.05,
      unit:          "ratio",
      baselineValue: CF_ratio,
      currentValue:  CF_ratio,
    },
    {
      parameter:     "sigma",
      label:         "Income stability (σ)",
      description:   "Income volatility — lower is more stable",
      min:           RANGES.sigma.min,
      max:           RANGES.sigma.max,
      step:          0.01,
      unit:          "decimal",
      baselineValue: sigma,
      currentValue:  sigma,
    },
  ];
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useScenario(baselineInputs: OLTEEInputs | null): UseScenarioReturn {
  const [baseline, setBaseline] = useState<ScenarioResult | null>(null);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [sliderConfigs, setSliderConfigs] = useState<ScenarioSliderConfig[]>([]);
  const [customResult, setCustomResult] = useState<ScenarioResult | null>(null);
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState<SensitivityAnalysis | null>(null);
  const [sensitivityParameter, setSensitivityParameter] = useState<ScenarioParameter>("r");
  const [isComputing, setIsComputing] = useState(false);

  // Track if any slider has been moved from baseline
  const hasSliderChanges = sliderConfigs.some(
    (c) => Math.abs(c.currentValue - c.baselineValue) > 1e-10
  );

  // ─── Initialise when baselineInputs arrives ────────────────────────────────
  useEffect(() => {
    if (!baselineInputs) return;

    // Build baseline result
    const bl = buildBaselineResult(baselineInputs);
    setBaseline(bl);

    // Run all 8 presets synchronously
    const cmp = runAllPresetScenarios(baselineInputs);
    setComparison(cmp);

    // Build slider configs from baseline
    setSliderConfigs(buildSliderConfigs(baselineInputs));

    // Clear any prior selection/custom state
    setSelectedPresetIds([]);
    setCustomResult(null);
    setSensitivityAnalysis(null);
  }, [baselineInputs]);

  // ─── Preset management ────────────────────────────────────────────────────
  const togglePreset = useCallback((id: string) => {
    setSelectedPresetIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      // Max 4 simultaneous selections
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const clearPresets = useCallback(() => {
    setSelectedPresetIds([]);
  }, []);

  // Derived: scenario results for selected preset IDs
  const selectedPresets: ScenarioResult[] = comparison
    ? selectedPresetIds
        .map((id) => comparison.scenarios.find(
          (s) => (s.scenario as { id?: string } | null)?.id === id
        ))
        .filter((s): s is ScenarioResult => s !== undefined)
    : [];

  // ─── Slider management ────────────────────────────────────────────────────
  const debouncedCompute = useRef(
    debounce((configs: ScenarioSliderConfig[], bl: ScenarioResult) => {
      // Build modified inputs from current slider values
      const modifiedInputs: OLTEEInputs = { ...bl.inputs };
      for (const config of configs) {
        (modifiedInputs as unknown as Record<string, number>)[config.parameter] = config.currentValue;
      }
      // Ensure A > D invariant
      if (modifiedInputs.D >= modifiedInputs.A) {
        modifiedInputs.A = modifiedInputs.D + 1;
      }
      const result = computeScenarioResult(modifiedInputs, bl, "Custom adjustment");
      setCustomResult(result);
      setIsComputing(false);
    }, 150)
  ).current;

  const adjustSlider = useCallback(
    (parameter: ScenarioParameter, value: number) => {
      if (!baseline) return;
      setIsComputing(true);
      // Single setState — derive updated configs and schedule recomputation
      // in one pass to avoid double-render and double-map.
      setSliderConfigs((prev) => {
        const updated = prev.map((c) =>
          c.parameter === parameter ? { ...c, currentValue: value } : c
        );
        debouncedCompute(updated, baseline);
        return updated;
      });
    },
    [baseline, debouncedCompute]
  );

  const resetSliders = useCallback(() => {
    if (!baselineInputs) return;
    setSliderConfigs(buildSliderConfigs(baselineInputs));
    setCustomResult(null);
    setIsComputing(false);
  }, [baselineInputs]);

  // ─── Sensitivity analysis ─────────────────────────────────────────────────
  const runSweep = useCallback(() => {
    if (!baselineInputs) return;
    const analysis = runSensitivityAnalysis(baselineInputs, sensitivityParameter, 60);
    setSensitivityAnalysis(analysis);
  }, [baselineInputs, sensitivityParameter]);

  // ─── Reset all ────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setSelectedPresetIds([]);
    setCustomResult(null);
    setSensitivityAnalysis(null);
    if (baselineInputs) {
      setSliderConfigs(buildSliderConfigs(baselineInputs));
    }
    setIsComputing(false);
  }, [baselineInputs]);

  return {
    baseline,
    comparison,
    customResult,
    selectedPresetIds,
    selectedPresets,
    togglePreset,
    clearPresets,
    sliderConfigs,
    adjustSlider,
    resetSliders,
    hasSliderChanges,
    sensitivityAnalysis,
    sensitivityParameter,
    setSensitivityParameter,
    runSweep,
    isComputing,
    resetAll,
  };
}
