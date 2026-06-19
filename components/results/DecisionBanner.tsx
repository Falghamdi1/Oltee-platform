"use client";
import type { OLTEEOutputs, LeverageStatus } from "@/types/oltee";
import { formatPercent } from "@/lib/formatting";

const META: Record<LeverageStatus, {
  label: string; msg: string;
  color: string; bg: string; border: string;
  icon: string;
}> = {
  OPTIMAL: {
    label: "Optimal", color: "#3DDE8E",
    bg: "rgba(61,222,142,0.07)", border: "rgba(61,222,142,0.22)",
    msg: "Your leverage is in the productive zone. Debt is working for you.",
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
  },
  CAUTION: {
    label: "Caution", color: "#FFB830",
    bg: "rgba(255,184,48,0.07)", border: "rgba(255,184,48,0.22)",
    msg: "Approaching the threshold. Avoid taking on additional debt.",
    icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0M12 9v4M12 17h.01",
  },
  SUBOPTIMAL: {
    label: "Suboptimal", color: "#FF5C5C",
    bg: "rgba(255,92,92,0.07)", border: "rgba(255,92,92,0.22)",
    msg: "Debt ratio has exceeded the safe threshold. Review your position.",
    icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10M15 9l-6 6M9 9l6 6",
  },
  NEG_SPREAD: {
    label: "Negative Spread", color: "#FF4477",
    bg: "rgba(255,68,119,0.07)", border: "rgba(255,68,119,0.22)",
    msg: "Investment return is below borrowing cost. Every borrowed riyal loses money.",
    icon: "M22 17H18l-3-9L9 21l-3-9H2",
  },
};

export function DecisionBanner({ outputs }: { outputs: OLTEEOutputs }) {
  const { status, intermediates } = outputs;
  const m = META[status];

  return (
    <div role="status" aria-live="polite" style={{
      background: m.bg,
      border: `1px solid ${m.border}`,
      borderLeft: `3px solid ${m.color}`,
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}>
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: `rgba(${m.color === "#3DDE8E" ? "61,222,142" : m.color === "#FFB830" ? "255,184,48" : m.color === "#FF5C5C" ? "255,92,92" : "255,68,119"},0.12)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: m.color,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          {m.icon.split("M").filter(Boolean).map((d, i) => (
            <path key={i} d={"M" + d}/>
          ))}
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 20, fontWeight: 700, color: m.color,
          letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 4,
        }}>
          {m.label}
        </div>
        <div style={{ fontSize: 13, color: `${m.color}CC`, lineHeight: 1.55 }}>
          {m.msg}
        </div>
      </div>

      {/* Stats cluster */}
      {status !== "NEG_SPREAD" && (
        <div style={{
          display: "flex", gap: 0,
          background: "rgba(0,0,0,0.20)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {[
            { k: "Δ spread", v: (intermediates.delta >= 0 ? "+" : "") + formatPercent(intermediates.delta, 2) },
            { k: "β risk",   v: intermediates.beta.toFixed(3) },
            { k: "α tax",    v: intermediates.alpha.toFixed(3) },
          ].map(({ k, v }, i) => (
            <div key={k} style={{
              padding: "10px 16px",
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, color: "rgba(245,248,255,0.30)",
                textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>
                {k}
              </div>
              <div style={{ fontFamily: "var(--font-mono, monospace)",
                fontSize: 13, fontWeight: 600, color: "rgba(245,248,255,0.75)" }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
