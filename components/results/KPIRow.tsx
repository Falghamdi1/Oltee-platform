"use client";
import type { OLTEEOutputs, LeverageStatus } from "@/types/oltee";
import { formatSARShort } from "@/lib/formatting";
import { useCountUp } from "@/hooks/useCountUp";

const STATUS_COLOR: Record<LeverageStatus, string> = {
  OPTIMAL: "#3DDE8E", CAUTION: "#FFB830",
  SUBOPTIMAL: "#FF5C5C", NEG_SPREAD: "#FF4477",
};

function KPICard({ label, value, sub, color, note }: {
  label: string; value: string; sub: string;
  color: string; note?: string;
}) {
  return (
    <div style={{
      background: "var(--surface, #0E1525)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `3px solid ${color}`,
      borderRadius: "0 0 12px 12px",
      padding: "20px 18px 16px",
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
        textTransform: "uppercase" as const,
        color: "rgba(245,248,255,0.35)",
        marginBottom: 12,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {label}
        {note && (
          <span style={{
            fontSize: 9, color, background: `${color}18`,
            padding: "1px 6px", borderRadius: 99, fontWeight: 600,
          }}>{note}</span>
        )}
      </div>
      <div style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "clamp(22px, 2.5vw, 32px)",
        fontWeight: 700,
        color,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        marginBottom: 8,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(245,248,255,0.28)" }}>{sub}</div>
    </div>
  );
}

export function KPIRow({ outputs }: { outputs: OLTEEOutputs }) {
  const { debt_ratio, L_star, headroom_SAR, status, cap_applied } = outputs;
  const sc = STATUS_COLOR[status];
  const dr = useCountUp({ target: debt_ratio * 100, duration: 900 });
  const ls = useCountUp({ target: L_star * 100,    duration: 900, delay: 80  });
  const hr = useCountUp({ target: headroom_SAR,    duration: 900, delay: 160 });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
      <KPICard label="Current ratio"
        value={dr.current.toFixed(1) + "%"} sub="of assets financed by debt" color={sc} />
      <KPICard label="Safe ceiling L*"
        value={ls.current.toFixed(1) + "%"} sub="optimal threshold"
        color="#00E5B4" note={cap_applied ? "CAP" : undefined} />
      <KPICard label="Headroom"
        value={formatSARShort(hr.current)}
        sub={headroom_SAR > 0 ? "remaining capacity" : "threshold exceeded"}
        color={headroom_SAR > 0 ? "#3DDE8E" : "#FF5C5C"} />
    </div>
  );
}
