// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Scenario Lab (full page component)
//
// Assembles the complete scenario simulation interface:
//   1. Baseline summary bar
//   2. Preset grid (8 cards, multi-select up to 4)
//   3. Manual slider panel (4 live sliders)
//   4. Comparison charts (L* + Headroom)
//   5. Sensitivity analysis (sweep + line chart)
//   6. AI commentary panel
//
// Uses useScenario hook for all state management.
// All computation is synchronous — no loading states needed.
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect } from "react";
import type { OLTEEInputs, ScenarioResult, LeverageStatus, ScenarioParameter } from "@/types/oltee";
import { useScenario } from "@/hooks/useScenario";
import { ScenarioSlider } from "./ScenarioSlider";
import {
  LStarComparisonChart,
  HeadroomComparisonChart,
  SensitivityLineChart,
} from "./ScenarioChart";
import { formatPercent, formatSAR, formatSARShort } from "@/lib/formatting";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         "var(--bg,#06080F)",
  raised:     "var(--surface,#0E1525)",
  overlay:    "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.09)",
  borderStr:  "rgba(255,255,255,0.13)",
  ink:        "var(--text-1,#F5F8FF)",
  inkSec:     "rgba(245,248,255,0.55)",
  inkTer:     "rgba(245,248,255,0.28)",
  teal:       "#00E5B4",
  tealMid:    "#00B890",
  tealGhost:  "rgba(0,229,180,0.07)",
  optimal:    { bg: "rgba(61,222,142,0.07)", border: "rgba(61,222,142,0.22)", mid: "#3DDE8E", bright: "#3DDE8E" },
  caution:    { bg: "rgba(255,184,48,0.07)",  border: "rgba(255,184,48,0.22)",  mid: "#FFB830", bright: "#FFB830" },
  subopt:     { bg: "rgba(255,92,92,0.07)",   border: "rgba(255,92,92,0.22)",   mid: "#FF5C5C", bright: "#FF5C5C" },
  negsp:      { bg: "rgba(255,68,119,0.07)",  border: "rgba(255,68,119,0.22)",  mid: "#FF4477", bright: "#FF4477" },
};

const STATUS_COLORS: Record<LeverageStatus, typeof C.optimal> = {
  OPTIMAL:    C.optimal,
  CAUTION:    C.caution,
  SUBOPTIMAL: C.subopt,
  NEG_SPREAD: C.negsp,
};
const STATUS_LABELS: Record<LeverageStatus, string> = {
  OPTIMAL: "Optimal", CAUTION: "Caution", SUBOPTIMAL: "Suboptimal", NEG_SPREAD: "Neg. spread",
};

const DANGER_PRESET_IDS = ["rate-hike-5", "combined-stress"];

const SENSITIVITY_OPTIONS: { value: ScenarioParameter; label: string }[] = [
  { value: "r",        label: "Interest rate (r)" },
  { value: "ROI",      label: "Annual return (ROI)" },
  { value: "sigma",    label: "Income volatility (σ)" },
  { value: "CF_ratio", label: "Cash flow coverage" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ScenarioLabProps {
  baselineInputs: OLTEEInputs;
  // Optional: pass context dispatch so comparison is saved for the report
  dispatch?: React.Dispatch<import("@/types/oltee").OLTEEAction>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 500, letterSpacing: "0.12em",
      textTransform: "uppercase", color: C.inkTer, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.raised, border: `1px solid ${C.border}`,
      borderRadius: 12, ...style,
    }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: LeverageStatus }) {
  const sc = STATUS_COLORS[status];
  return (
    <span style={{
      background: sc.bg, border: `1px solid ${sc.border}`,
      color: sc.bright, fontSize: 10, fontWeight: 500,
      padding: "2px 8px", borderRadius: 5,
      textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Baseline Summary Bar ─────────────────────────────────────────────────────

function BaselineBar({
  baseline,
  hasActive,
  onReset,
}: {
  baseline: ScenarioResult;
  hasActive: boolean;
  onReset: () => void;
}) {
  const { outputs } = baseline;
  const sc = STATUS_COLORS[outputs.status];
  const deltaPositive = outputs.intermediates.delta > 0;

  const items = [
    {
      label: "Your baseline",
      value: <StatusBadge status={outputs.status} />,
      isComponent: true,
    },
    {
      label: "Safe ceiling L*",
      value: formatPercent(outputs.L_star),
      color: C.teal,
    },
    {
      label: "Debt ratio",
      value: formatPercent(outputs.debt_ratio),
      color: C.ink,
    },
    {
      label: "Return spread",
      value: (outputs.intermediates.delta > 0 ? "+" : "") +
             formatPercent(outputs.intermediates.delta),
      color: deltaPositive ? C.optimal.bright : C.subopt.bright,
    },
    {
      label: "Headroom",
      value: formatSARShort(outputs.headroom_SAR),
      color: outputs.headroom_SAR > 0 ? C.optimal.bright : C.subopt.bright,
    },
  ];

  return (
    <div style={{
      background: C.raised,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: "0 24px",
      height: 64,
      display: "flex",
      alignItems: "center",
      gap: 0,
    }}>
      {items.map(({ label, value, color, isComponent }, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {i > 0 && (
            <div style={{ width: 1, height: 32, background: C.border, margin: "0 24px" }} />
          )}
          <div>
            <div style={{
              fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
              color: C.inkTer, marginBottom: 3,
            }}>
              {label}
            </div>
            {isComponent ? (
              <div>{value}</div>
            ) : (
              <div style={{
                fontFamily: "var(--font-jetbrains, monospace)",
                fontSize: 15, fontWeight: 600, color: color,
              }}>
                {String(value)}
              </div>
            )}
          </div>
        </div>
      ))}

      {hasActive && (
        <button
          onClick={onReset}
          style={{
            marginLeft: "auto",
            background: "none", border: "none",
            color: C.inkSec, fontSize: 13, cursor: "pointer",
          }}
        >
          Reset all →
        </button>
      )}
    </div>
  );
}

// ─── Preset Card ──────────────────────────────────────────────────────────────

function PresetCard({
  id, name, emoji, description, result, isSelected, isDanger, onToggle,
}: {
  id: string;
  name: string;
  emoji: string;
  description: string;
  result: ScenarioResult;
  isSelected: boolean;
  isDanger: boolean;
  onToggle: (id: string) => void;
}) {
  const { outputs, delta } = result;
  const sc = STATUS_COLORS[outputs.status];
  const deltaDir = delta.direction;

  return (
    <button
      onClick={() => onToggle(id)}
      style={{
        background: isSelected ? "rgba(0,229,180,0.09)" : C.raised,
        border: `1px solid ${isSelected ? C.teal : isDanger ? C.subopt.border : C.border}`,
        borderRadius: 12,
        padding: 14,
        cursor: "pointer",
        textAlign: "left",
        color: C.ink,
        transition: "border-color 150ms, background 150ms",
      }}
    >
      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
        {emoji} {name}
      </div>
      <div style={{
        fontSize: 11, color: C.inkSec, lineHeight: 1.4, marginBottom: 10,
      }}>
        {description}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, marginBottom: 8 }} />

      {/* Result row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 13, fontWeight: 600, color: sc.bright,
          }}>
            → {formatPercent(outputs.L_star)}
          </div>
          <div style={{
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 11,
            color: deltaDir === "improved" ? C.optimal.bright
                 : deltaDir === "degraded" ? C.subopt.bright
                 : C.inkTer,
          }}>
            {delta.L_star > 0 ? "+" : ""}{formatPercent(delta.L_star)}pp
          </div>
        </div>
        <StatusBadge status={outputs.status} />
      </div>
    </button>
  );
}

// ─── Main ScenarioLab Component ───────────────────────────────────────────────

export function ScenarioLab({ baselineInputs, dispatch }: ScenarioLabProps) {
  const [showSensitivity, setShowSensitivity] = useState(false);

  const {
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
  } = useScenario(baselineInputs);

  // Save comparison to global context so it appears in the PDF report
  useEffect(() => {
    if (comparison && dispatch) {
      dispatch({ type: "SET_SCENARIO_COMPARISON", payload: comparison });
    }
  }, [comparison, dispatch]);

  if (!baseline || !comparison) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.inkTer, fontSize: 14 }}>
        Loading scenario data…
      </div>
    );
  }

  const hasAnyActive = selectedPresetIds.length > 0 || hasSliderChanges;

  // Build the set of active scenario results for charts
  const activeScenarioIds = selectedPresetIds;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* 1. Baseline summary */}
      <BaselineBar
        baseline={baseline}
        hasActive={hasAnyActive}
        onReset={resetAll}
      />

      {/* 2. Preset grid */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionLabel>Scenario presets</SectionLabel>
          {selectedPresetIds.length > 0 && (
            <button
              onClick={clearPresets}
              style={{ background: "none", border: "none", color: C.inkSec, fontSize: 12, cursor: "pointer" }}
            >
              Clear selection ({selectedPresetIds.length})
            </button>
          )}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
        }}>
          {comparison.scenarios.map((scenario) => {
            const presetId = (scenario.scenario as { id?: string } | null)?.id ?? "";
            const preset = scenario.scenario as { id: string; name: string; emoji: string; description: string } | null;
            if (!preset) return null;
            return (
              <PresetCard
                key={presetId}
                id={presetId}
                name={preset.name}
                emoji={preset.emoji}
                description={preset.description}
                result={scenario}
                isSelected={selectedPresetIds.includes(presetId)}
                isDanger={DANGER_PRESET_IDS.includes(presetId)}
                onToggle={togglePreset}
              />
            );
          })}
        </div>
        {selectedPresetIds.length === 0 && (
          <div style={{ fontSize: 11, color: C.inkTer, marginTop: 8 }}>
            Click any card to select it for comparison. Select up to 4.
          </div>
        )}
      </div>

      {/* 3. Manual sliders */}
      <Card style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <SectionLabel>Adjust manually — live recalculation</SectionLabel>
          {hasSliderChanges && (
            <button
              onClick={resetSliders}
              style={{ background: "none", border: "none", color: C.inkSec, fontSize: 12, cursor: "pointer" }}
            >
              Reset all sliders ↩
            </button>
          )}
        </div>

        {sliderConfigs.map((config) => (
          <ScenarioSlider
            key={config.parameter}
            config={config}
            onChange={adjustSlider}
          />
        ))}

        {/* Custom result summary */}
        {customResult && hasSliderChanges && (
          <div style={{
            marginTop: 16,
            padding: "12px 16px",
            background: C.overlay,
            border: `1px solid ${C.borderMid}`,
            borderRadius: 8,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}>
            <div style={{ fontSize: 11, color: C.inkTer, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Custom result
            </div>
            <StatusBadge status={customResult.outputs.status} />
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <span style={{ fontSize: 10, color: C.inkTer }}>L* </span>
                <span style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 13, color: C.teal }}>
                  {formatPercent(customResult.outputs.L_star)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: C.inkTer }}>Headroom </span>
                <span style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 13, color: C.optimal.bright }}>
                  {formatSARShort(customResult.outputs.headroom_SAR)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: C.inkTer }}>vs baseline </span>
                <span style={{
                  fontFamily: "var(--font-jetbrains, monospace)",
                  fontSize: 13,
                  color: customResult.delta.direction === "improved" ? C.optimal.bright
                       : customResult.delta.direction === "degraded" ? C.subopt.bright
                       : C.inkTer,
                }}>
                  {customResult.delta.L_star > 0 ? "+" : ""}{formatPercent(customResult.delta.L_star)}pp
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Comparison charts */}
      {(activeScenarioIds.length > 0 || customResult) && (
        <Card style={{ padding: "20px 24px" }}>
          <SectionLabel>Impact on your leverage threshold</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <LStarComparisonChart
              comparison={comparison}
              selectedIds={activeScenarioIds}
              customResult={customResult}
            />
            <HeadroomComparisonChart
              comparison={comparison}
              selectedIds={activeScenarioIds}
              customResult={customResult}
            />
          </div>
        </Card>
      )}

      {/* 5. Worst / best case summary */}
      {comparison.worstCase && comparison.bestCase && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Worst case (across all presets)", result: comparison.worstCase, isWorst: true },
            { label: "Best case (across all presets)", result: comparison.bestCase, isWorst: false },
          ].map(({ label, result, isWorst }) => {
            const sc = STATUS_COLORS[result.outputs.status];
            return (
              <div
                key={label}
                style={{
                  background: sc.bg,
                  border: `1px solid ${sc.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div style={{ fontSize: 10, color: C.inkTer, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: sc.bright, marginBottom: 3 }}>
                      {(result.scenario as { name?: string } | null)?.name ?? result.label}
                    </div>
                    <div style={{ fontFamily: "var(--font-jetbrains, monospace)", fontSize: 20, fontWeight: 700, color: sc.bright }}>
                      L* = {formatPercent(result.outputs.L_star)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <StatusBadge status={result.outputs.status} />
                    <div style={{
                      fontFamily: "var(--font-jetbrains, monospace)",
                      fontSize: 12, color: C.inkSec, marginTop: 6,
                    }}>
                      Headroom: {formatSARShort(result.outputs.headroom_SAR)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Sensitivity analysis */}
      <Card style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionLabel>Single-variable sensitivity</SectionLabel>
          <button
            onClick={() => setShowSensitivity((s) => !s)}
            style={{
              background: "none", border: "none",
              color: C.inkSec, fontSize: 12, cursor: "pointer",
            }}
          >
            {showSensitivity ? "∧ collapse" : "∨ expand"}
          </button>
        </div>

        {showSensitivity && (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: C.inkSec }}>Sweep variable:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {SENSITIVITY_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSensitivityParameter(value)}
                    style={{
                      padding: "5px 12px",
                      background: sensitivityParameter === value ? C.teal : C.overlay,
                      border: `1px solid ${sensitivityParameter === value ? C.tealMid : C.borderMid}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: sensitivityParameter === value ? 600 : 400,
                      color: sensitivityParameter === value ? "#04120E" : C.inkSec,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={runSweep}
                style={{
                  marginLeft: "auto",
                  padding: "7px 16px",
                  background: "none",
                  border: `1px solid ${C.borderStr}`,
                  borderRadius: 7,
                  color: C.inkSec,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Run sweep →
              </button>
            </div>

            {sensitivityAnalysis && sensitivityAnalysis.parameter === sensitivityParameter ? (
              <SensitivityLineChart
                analysis={sensitivityAnalysis}
                baselineDebtRatio={baseline.outputs.debt_ratio}
              />
            ) : (
              <div style={{
                padding: "32px 0",
                textAlign: "center",
                color: C.inkTer,
                fontSize: 13,
              }}>
                Select a variable and click "Run sweep →" to see how L* responds
              </div>
            )}
          </>
        )}

        {!showSensitivity && (
          <div style={{ fontSize: 13, color: C.inkTer }}>
            Shows exactly which value of a parameter would change your leverage status.
          </div>
        )}
      </Card>

    </div>
  );
}
