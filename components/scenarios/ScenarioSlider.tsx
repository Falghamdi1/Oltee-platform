// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Scenario Parameter Slider
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import type { ScenarioSliderConfig, ScenarioParameter } from "@/types/oltee";
import { formatSAR } from "@/lib/formatting";

export interface ScenarioSliderProps {
  config: ScenarioSliderConfig;
  onChange: (parameter: ScenarioParameter, value: number) => void;
}

// ─── Safe number coercion ─────────────────────────────────────────────────────
// All values coming through URL params or intermediate state may arrive as
// strings or undefined. toFixed() only exists on numbers, so we coerce first.

function safeNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isFinite(n) ? n : 0;
}

function formatValue(rawValue: unknown, unit: ScenarioSliderConfig["unit"]): string {
  const value = safeNum(rawValue);
  if (unit === "%")      return (value * 100).toFixed(2) + "%";
  if (unit === "ratio")  return value.toFixed(2) + "×";
  if (unit === "decimal") return value.toFixed(2);
  if (unit === "SAR")    return formatSAR(value);
  return value.toFixed(3);
}

function formatDelta(rawDelta: unknown, unit: ScenarioSliderConfig["unit"]): string {
  const delta = safeNum(rawDelta);
  const sign = delta > 0 ? "+" : "";
  if (unit === "%")      return sign + (delta * 100).toFixed(2) + "%";
  if (unit === "ratio")  return sign + delta.toFixed(2) + "×";
  if (unit === "decimal") return sign + delta.toFixed(2);
  if (unit === "SAR") {
    const sarSign = delta >= 0 ? "+" : "−";
    return `${sarSign}${formatSAR(Math.abs(delta))}`;
  }
  return sign + delta.toFixed(3);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScenarioSlider({ config, onChange }: ScenarioSliderProps) {
  const {
    parameter, label, description,
    unit, step,
  } = config;

  // Coerce all numeric config fields defensively
  const min           = safeNum(config.min);
  const max           = safeNum(config.max);
  const baselineValue = safeNum(config.baselineValue);
  const currentValue  = safeNum(config.currentValue);

  const delta    = currentValue - baselineValue;
  const hasMoved = Math.abs(delta) > safeNum(step) * 0.1;

  const negativeDirection = parameter === "r" || parameter === "sigma" || parameter === "D";
  const deltaIsPositive   = negativeDirection ? delta <= 0 : delta >= 0;
  const deltaColor = !hasMoved ? "rgba(245,248,255,0.28)" : deltaIsPositive ? "#3DDE8E" : "#FF5C5C";

  const rangeSpan       = max - min || 1; // prevent division by zero
  const baselinePos     = ((baselineValue - min) / rangeSpan) * 100;
  const currentPos      = ((currentValue  - min) / rangeSpan) * 100;
  const lo              = Math.min(currentPos, baselinePos);
  const hi              = Math.max(currentPos, baselinePos);
  const fillColor       = currentPos < baselinePos
    ? (negativeDirection ? "#3DDE8E" : "#FF5C5C")
    : (negativeDirection ? "#FF5C5C" : "#3DDE8E");

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #111928" }}>

      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1,#F5F8FF)" }}>{label}</span>
          <span style={{ fontSize: 12, color: "rgba(245,248,255,0.28)", marginLeft: 8 }}>{description}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "monospace", fontSize: 13, color: "#00E5B4", minWidth: 70, textAlign: "right" }}>
            {formatValue(currentValue, unit)}
          </span>
          {hasMoved && (
            <span style={{ fontFamily: "monospace", fontSize: 12, color: deltaColor, minWidth: 60, textAlign: "right" }}>
              {formatDelta(delta, unit)}
            </span>
          )}
        </div>
      </div>

      {/* Slider track */}
      <div style={{ position: "relative" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => onChange(parameter, parseFloat(e.target.value))}
          style={{
            width: "100%",
            height: 4,
            appearance: "none",
            WebkitAppearance: "none",
            background: `linear-gradient(to right,
              #182035 0%,
              #182035 ${lo}%,
              ${fillColor} ${lo}%,
              ${fillColor} ${hi}%,
              #182035 ${hi}%,
              #182035 100%)`,
            borderRadius: 2,
            cursor: "pointer",
            outline: "none",
          }}
        />
        {/* Baseline tick */}
        <div style={{
          position: "absolute", top: "50%",
          left: `${baselinePos}%`,
          transform: "translate(-50%, -50%)",
          width: 2, height: 12,
          background: "rgba(245,248,255,0.28)", borderRadius: 1,
          pointerEvents: "none",
        }} />
      </div>

      {/* Range labels + reset */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "rgba(245,248,255,0.28)" }}>{formatValue(min, unit)}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(245,248,255,0.28)" }}>
            Baseline: {formatValue(baselineValue, unit)}
          </span>
          {hasMoved && (
            <button
              onClick={() => onChange(parameter, baselineValue)}
              style={{ background: "none", border: "none", color: "#00E5B4", fontSize: 11, cursor: "pointer", padding: "0 4px" }}
            >
              Reset ↩
            </button>
          )}
        </div>
        <span style={{ fontSize: 10, color: "rgba(245,248,255,0.28)" }}>{formatValue(max, unit)}</span>
      </div>
    </div>
  );
}
