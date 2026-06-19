"use client";
import { useState } from "react";
import type { EquationStep, LeverageStatus } from "@/types/oltee";

const STATUS_COLOR: Record<LeverageStatus, string> = {
  OPTIMAL: "#3DDE8E", CAUTION: "#FFB830",
  SUBOPTIMAL: "#FF5C5C", NEG_SPREAD: "#FF4477",
};

function numColor(step: EquationStep, status: LeverageStatus): string {
  if (step.step === 2) return step.result > 0 ? "#3DDE8E" : "#FF5C5C";
  if (step.step === 8) return "#00E5B4";
  if (step.step === 9) return STATUS_COLOR[status];
  if ([5, 6].includes(step.step)) return "rgba(0,229,180,0.85)";
  return "rgba(245,248,255,0.80)";
}

export function EquationWaterfall({ steps, status }: {
  steps: EquationStep[]; status: LeverageStatus;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      background: "var(--surface, #0E1525)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(0,229,180,0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#00E5B4" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h10M4 17h7"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600,
            color: "rgba(245,248,255,0.75)" }}>
            How the result was calculated
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(245,248,255,0.25)" }}>9 steps</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="rgba(245,248,255,0.3)" strokeWidth="2" strokeLinecap="round"
            style={{ transform: open ? "rotate(180deg)" : "none",
              transition: "transform 200ms ease" }} aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }}/>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["#", "Step", "Formula", "Calculation", "Result"].map((h, i) => (
                    <th key={h} style={{
                      padding: "9px 14px",
                      textAlign: i === 4 ? "right" : "left",
                      fontSize: 9, fontWeight: 600, letterSpacing: "0.09em",
                      textTransform: "uppercase" as const,
                      color: "rgba(245,248,255,0.22)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {steps.map((s) => (
                  <tr key={s.step} style={{
                    background: s.highlight ? "rgba(0,229,180,0.04)" : "transparent",
                    borderLeft: s.step === 8
                      ? "3px solid #00E5B4"
                      : "3px solid transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.035)",
                  }}>
                    <td style={{ padding: "9px 14px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 11, color: "rgba(245,248,255,0.18)", width: 32 }}>
                      {String(s.step).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "9px 10px",
                      fontSize: 12, color: "rgba(245,248,255,0.55)", minWidth: 130 }}>
                      {s.label}
                    </td>
                    <td style={{ padding: "9px 10px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 11, color: "rgba(245,248,255,0.28)", minWidth: 110 }}>
                      {s.formula}
                    </td>
                    <td style={{ padding: "9px 10px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 11, color: "rgba(245,248,255,0.38)", minWidth: 110 }}>
                      {s.calculation}
                    </td>
                    <td style={{
                      padding: "9px 14px",
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 14, fontWeight: 700,
                      color: numColor(s, status),
                      textAlign: "right",
                      letterSpacing: "-0.01em",
                    }}>
                      {s.resultFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
