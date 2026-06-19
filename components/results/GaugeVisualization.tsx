"use client";
import { useState, useEffect, useRef } from "react";
import type { OLTEEOutputs } from "@/types/oltee";
import { useCountUp } from "@/hooks/useCountUp";

export function GaugeVisualization({ outputs }: { outputs: OLTEEOutputs }) {
  const { debt_ratio, L_star, status } = outputs;
  const MAX = 0.70;
  // Layout constants — all verified to fit inside viewBox "0 0 320 230"
  // cx=160, cy=148, R=110, SW=12
  // Arc bottom:  cy + R = 258 → but arc is a semicircle, lowest point is exactly cy (the flat baseline)
  // Actually the arc goes from 180° to 0°, so lowest SVG y is cy (not cy+R).
  // The stroke extends ±SW/2 below, so lowest rendered pixel ≈ cy + 6 = 154.
  // Readout text at cy+48 = 196, sublabel at cy+64 = 212 — both inside 230.
  const cx = 160, cy = 148, R = 110, SW = 12;
  const isNeg = status === "NEG_SPREAD";
  const targetAngle = 180 - (Math.min(debt_ratio, MAX) / MAX) * 180;

  const [needle, setNeedle] = useState(180);
  const raf  = useRef<number>(0);
  const prev = useRef(180);
  const drCount = useCountUp({ target: debt_ratio * 100, duration: 1000 });

  useEffect(() => {
    if (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setNeedle(targetAngle); prev.current = targetAngle; return;
    }
    const from = prev.current, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 900, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setNeedle(from + (targetAngle - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else prev.current = targetAngle;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [targetAngle]);

  const polar = (deg: number) => ({
    x: cx + R * Math.cos((deg * Math.PI) / 180),
    y: cy - R * Math.sin((deg * Math.PI) / 180),
  });
  const arc = (s: number, e: number) => {
    const sp = polar(s), ep = polar(e);
    return `M ${sp.x.toFixed(1)} ${sp.y.toFixed(1)} A ${R} ${R} 0 0 0 ${ep.x.toFixed(1)} ${ep.y.toFixed(1)}`;
  };

  const thA  = 180 - (Math.min(L_star / MAX, 1) * 180);
  const cauA = 180 - (Math.min((L_star * 0.85) / MAX, 1) * 180);
  const thP  = polar(thA);
  const np   = polar(needle);

  // L* label position — stay inside viewBox
  const labelRight  = thP.x > cx;
  const labelX = Math.min(Math.max(thP.x + (labelRight ? 12 : -12), 24), 296);
  const labelY = Math.max(thP.y - 8, 14);

  const STATUS_STROKE: Record<string, string> = {
    OPTIMAL: "#3DDE8E", CAUTION: "#FFB830",
    SUBOPTIMAL: "#FF5C5C", NEG_SPREAD: "#FF4477",
  };
  const activeColor = STATUS_STROKE[status] ?? "#3DDE8E";

  return (
    <div style={{ width: "100%", padding: "12px 0 8px" }}>
      <svg
        viewBox="0 0 320 230"
        width="100%"
        style={{ display: "block" }}
        role="img"
        aria-label={`Leverage gauge: ${(debt_ratio*100).toFixed(1)}% current, ${(L_star*100).toFixed(1)}% ceiling`}
      >
        <title>OLTEE Leverage Gauge</title>

        {/* ── Track background ── */}
        <path d={arc(180, 0)} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={SW} strokeLinecap="round"/>

        {!isNeg ? (<>
          {/* Optimal zone — green */}
          {cauA < 180 &&
            <path d={arc(180, cauA)} fill="none"
              stroke="#3DDE8E" strokeWidth={SW} strokeLinecap="round" strokeOpacity="0.85"/>}
          {/* Caution zone — amber */}
          {thA < cauA &&
            <path d={arc(cauA, thA)} fill="none"
              stroke="#FFB830" strokeWidth={SW} strokeLinecap="round" strokeOpacity="0.85"/>}
          {/* Suboptimal zone — red */}
          {thA > 0 &&
            <path d={arc(thA, 0)} fill="none"
              stroke="#FF5C5C" strokeWidth={SW} strokeLinecap="round" strokeOpacity="0.85"/>}

          {/* L* marker dot */}
          <circle cx={thP.x} cy={thP.y} r={5} fill="#00E5B4"/>
          <circle cx={thP.x} cy={thP.y} r={8} fill="none"
            stroke="#00E5B4" strokeWidth="1.5" strokeOpacity="0.4"/>

          {/* L* label */}
          <text x={labelX} y={labelY}
            fill="#00E5B4" fontSize="11" fontFamily="monospace" fontWeight="600"
            textAnchor={labelRight ? "start" : "end"}>
            L* {(L_star * 100).toFixed(1)}%
          </text>
        </>) : (
          <path d={arc(180, 0)} fill="none"
            stroke="#FF4477" strokeWidth={SW} strokeLinecap="round"/>
        )}

        {/* ── Needle ── */}
        {!isNeg && (
          <line x1={cx} y1={cy}
            x2={np.x.toFixed(1)} y2={np.y.toFixed(1)}
            stroke="rgba(245,248,255,0.90)" strokeWidth="2.5" strokeLinecap="round"/>
        )}

        {/* ── Hub ── */}
        <circle cx={cx} cy={cy} r={8}
          fill="#0E1525" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
        <circle cx={cx} cy={cy} r={3.5}
          fill={isNeg ? "#FF4477" : activeColor}/>

        {/* ── Scale labels ── */}
        <text x={20}  y={cy + 4} fill="rgba(245,248,255,0.25)"
          fontSize="10" fontFamily="system-ui">0%</text>
        <text x={300} y={cy + 4} fill="rgba(245,248,255,0.25)"
          fontSize="10" fontFamily="system-ui" textAnchor="end">70%</text>

        {/* ── Centre readout ── */}
        <text x={cx} y={cy + 44} textAnchor="middle"
          fill={isNeg ? "#FF4477" : "#F5F8FF"}
          fontSize="30" fontWeight="700" fontFamily="monospace"
          letterSpacing="-0.02em">
          {isNeg ? "—" : `${drCount.current.toFixed(1)}%`}
        </text>
        <text x={cx} y={cy + 62} textAnchor="middle"
          fill="rgba(245,248,255,0.35)" fontSize="11" fontFamily="system-ui">
          current debt ratio
        </text>
      </svg>
    </div>
  );
}