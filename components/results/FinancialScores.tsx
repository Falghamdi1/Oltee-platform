"use client";
import type { FinancialScores } from "@/types/oltee";
import { useCountUp } from "@/hooks/useCountUp";

const SCORES_META = [
  { key: "stability",  label: "Stability",  tiers: ["At Risk","Moderate","Stable"] },
  { key: "debtHealth", label: "Debt Health", tiers: ["Poor","Fair","Healthy"] },
  { key: "efficiency", label: "Efficiency",  tiers: ["Low","Partial","Optimal"] },
  { key: "resilience", label: "Resilience",  tiers: ["Fragile","Moderate","Resilient"] },
] as const;

function getColor(score: number) {
  if (score >= 70) return "#3DDE8E";
  if (score >= 40) return "#FFB830";
  return "#FF5C5C";
}
function getTier(score: number, tiers: readonly string[]) {
  if (score >= 70) return tiers[2];
  if (score >= 40) return tiers[1];
  return tiers[0];
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{
      height: 4, borderRadius: 99,
      background: "rgba(255,255,255,0.07)",
      overflow: "hidden", marginTop: 10,
    }}>
      <div style={{
        height: "100%",
        width: `${score}%`,
        borderRadius: 99,
        background: color,
        transition: "width 900ms cubic-bezier(.22,1,.36,1)",
      }}/>
    </div>
  );
}

function ScoreCard({ scoreKey, score, label, tiers, delay }: {
  scoreKey: string; score: number; label: string;
  tiers: readonly string[]; delay: number;
}) {
  const anim  = useCountUp({ target: score, duration: 900, delay });
  const color = getColor(score);
  const tier  = getTier(score, tiers);
  const r = 26, sw = 5;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{
      background: "var(--surface, #0E1525)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "18px 16px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 0,
    }}>
      {/* Ring + score */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <svg width="62" height="62" viewBox="0 0 62 62"
          aria-label={`${label}: ${score}/100`}
          style={{ flexShrink: 0 }}>
          <circle cx="31" cy="31" r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={sw}/>
          <circle cx="31" cy="31" r={r} fill="none"
            stroke={color} strokeWidth={sw}
            strokeDasharray={`${(score / 100) * circ} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            transform="rotate(-90 31 31)"
            style={{ transition: "stroke-dasharray 900ms cubic-bezier(.22,1,.36,1)" }}/>
          <text x="31" y="35" textAnchor="middle"
            fill={color} fontSize="15" fontWeight="700"
            fontFamily="var(--font-mono, monospace)">
            {Math.round(anim.current)}
          </text>
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,248,255,0.75)",
            marginBottom: 3 }}>{label}</div>
          <div style={{
            display: "inline-block",
            fontSize: 10, fontWeight: 600,
            color, letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            background: `${color}18`,
            padding: "2px 8px", borderRadius: 99,
          }}>
            {tier}
          </div>
        </div>
      </div>
      <ScoreBar score={score} color={color}/>
    </div>
  );
}

export function FinancialScoresPanel({ scores }: { scores: FinancialScores }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.10em",
        textTransform: "uppercase" as const,
        color: "rgba(245,248,255,0.28)",
        marginBottom: 14,
      }}>
        Financial Intelligence Scores
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {SCORES_META.map(({ key, label, tiers }, i) => (
          <ScoreCard key={key} scoreKey={key} score={scores[key as keyof FinancialScores]}
            label={label} tiers={tiers} delay={i * 80}/>
        ))}
      </div>
    </div>
  );
}
