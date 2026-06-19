"use client";
import { VOLATILITY_LABELS, FORMULA } from "@/config/constants";

interface Props { value: number; onChange: (v: number) => void; disabled?: boolean; }

export function VolatilitySlider({ value, onChange, disabled }: Props) {
  const beta = (1 + value * FORMULA.BETA_MULTIPLIER).toFixed(3);
  const label = VOLATILITY_LABELS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );
  const trackColor = value <= 0.25 ? "#3DDE8E" : value <= 0.55 ? "#FFB830" : "#FF5C5C";

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:600, letterSpacing:"0.07em",
          textTransform:"uppercase" as const, color:"rgba(245,248,255,0.38)" }}>
          Income stability
        </span>
        <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:12,
          fontWeight:600, color:"#00E5B4" }}>
          β = {beta}
        </span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width:"100%", cursor: disabled ? "not-allowed" : "pointer",
          accentColor: trackColor }}
      />
      <div style={{ display:"flex", justifyContent:"space-between",
        fontSize:10, color:"rgba(245,248,255,0.28)", marginTop:4 }}>
        <span>Very stable</span>
        <span>Highly volatile</span>
      </div>
      <div style={{ fontSize:12, color:"rgba(245,248,255,0.42)", marginTop:6 }}>
        <span style={{ color: trackColor, fontWeight:600 }}>{label.label}</span>
        {" — "}{label.example}
      </div>
    </div>
  );
}
