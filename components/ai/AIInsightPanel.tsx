"use client";
import type { AIInsightState, AIInsights } from "@/types/oltee";
import { StreamingText } from "./StreamingText";

export function AIInsightPanel({ state, onRegenerate }: {
  state: AIInsightState; onRegenerate?: () => void;
}) {
  return (
    <div style={{
      background: "var(--surface, #0E1525)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(0,229,180,0.03)",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "rgba(0,229,180,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#00E5B4" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600,
            color: "rgba(245,248,255,0.75)" }}>AI Analysis</div>
          <div style={{ fontSize: 10, color: "rgba(245,248,255,0.28)", marginTop: 1 }}>
            Gemini 2.5 Flash
          </div>
        </div>
        {state.status === "streaming" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "#00E5B4",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: "spin 1s linear infinite" }} aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Generating…
          </div>
        )}
        {state.status === "complete" && onRegenerate && (
          <button onClick={onRegenerate} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 7, color: "rgba(245,248,255,0.45)",
            fontSize: 11, padding: "5px 11px", cursor: "pointer",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Regenerate
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px" }}>
        {state.status === "idle"      && <Idle/>}
        {state.status === "loading"   && <Loading/>}
        {state.status === "streaming" && <Streaming raw={state.rawStream}/>}
        {state.status === "complete"  && <Complete insights={state.insights as AIInsights}/>}
        {state.status === "error"     && <Err error={state.error} onRetry={onRegenerate}/>}
      </div>
    </div>
  );
}

function Idle() {
  return (
    <div style={{ padding: "18px 0", textAlign: "center",
      fontSize: 13, color: "rgba(245,248,255,0.22)" }}>
      Run an analysis to generate AI insights
    </div>
  );
}

function Loading() {
  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(245,248,255,0.38)",
        display: "flex", alignItems: "center", gap: 7, marginBottom: 16 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="#00E5B4" strokeWidth="2" strokeLinecap="round"
          style={{ animation: "spin 1s linear infinite" }} aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Analysing your leverage position…
      </div>
      {[88, 73, 60, 82, 48].map((w, i) => (
        <div key={i} style={{
          height: 11, width: `${w}%`,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 6, marginBottom: 9,
          animation: `pulse 1.5s ease-in-out ${i * 0.12}s infinite`,
        }}/>
      ))}
    </div>
  );
}

function Streaming({ raw }: { raw: string }) {
  const text = raw
    .replace(/^[{\s]*"executiveSummary"\s*:\s*"/, "")
    .replace(/\\n/g, "\n").replace(/\\"/g, '"');
  return (
    <StreamingText text={text || "Generating…"} isStreaming
      style={{ fontSize: 13, color: "rgba(245,248,255,0.50)", lineHeight: 1.7 } as React.CSSProperties}/>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.10em",
      textTransform: "uppercase" as const, color: "rgba(245,248,255,0.28)",
      marginBottom: 7 }}>
      {children}
    </div>
  );
}

function Complete({ insights }: { insights: AIInsights }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Summary callout */}
      <div style={{
        background: "rgba(0,229,180,0.05)",
        border: "1px solid rgba(0,229,180,0.12)",
        borderLeft: "3px solid #00E5B4",
        borderRadius: "0 9px 9px 0",
        padding: "13px 15px",
      }}>
        <SectionLabel>Executive Summary</SectionLabel>
        <p style={{ fontSize: 13, color: "rgba(245,248,255,0.75)",
          lineHeight: 1.7, margin: 0 }}>
          {insights.executiveSummary}
        </p>
      </div>

      {/* Risk + Leverage */}
      {[
        { k: "riskAssessment",  l: "Risk Assessment" },
        { k: "leverageAnalysis", l: "Leverage Analysis" },
      ].map(({ k, l }) => (
        <div key={k}>
          <SectionLabel>{l}</SectionLabel>
          <p style={{ fontSize: 13, color: "rgba(245,248,255,0.48)",
            lineHeight: 1.7, margin: 0 }}>
            {insights[k as keyof AIInsights] as string}
          </p>
        </div>
      ))}

      {/* Strengths + Watch */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { key: "strengths",  label: "Strengths", color: "#3DDE8E", icon: "M20 6 9 17l-5-5" },
          { key: "weaknesses", label: "Watch",     color: "#FFB830",
            icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0M12 9v4M12 17h.01" },
        ].map(({ key, label, color, icon }) => (
          <div key={key} style={{
            background: `rgba(${color === "#3DDE8E" ? "61,222,142" : "255,184,48"},0.05)`,
            border: `1px solid rgba(${color === "#3DDE8E" ? "61,222,142" : "255,184,48"},0.14)`,
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.09em",
              textTransform: "uppercase" as const, color, marginBottom: 9 }}>
              {label}
            </div>
            {(insights[key as keyof AIInsights] as string[]).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 7,
                alignItems: "flex-start", marginBottom: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={color} strokeWidth="2.5" strokeLinecap="round"
                  style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
                  {icon.split("M").filter(Boolean).map((d, j) => (
                    <path key={j} d={"M" + d}/>
                  ))}
                </svg>
                <span style={{ fontSize: 12, color: "rgba(245,248,255,0.45)",
                  lineHeight: 1.55 }}>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div>
        <SectionLabel>Recommendations</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {insights.recommendations.map((rec, i) => (
            <div key={i} style={{
              display: "flex", gap: 11,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "10px 13px", alignItems: "flex-start",
            }}>
              <span style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11, fontWeight: 700,
                color: "#00E5B4", minWidth: 20, paddingTop: 1,
              }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 12, color: "rgba(245,248,255,0.50)",
                lineHeight: 1.6 }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Future */}
      <div>
        <SectionLabel>Future Considerations</SectionLabel>
        <p style={{ fontSize: 12, color: "rgba(245,248,255,0.38)",
          lineHeight: 1.7, margin: 0 }}>
          {insights.futureConsiderations}
        </p>
      </div>

      {/* Guidance */}
      <div style={{
        background: "rgba(0,229,180,0.05)",
        border: "1px solid rgba(0,229,180,0.12)",
        borderLeft: "3px solid #00E5B4",
        borderRadius: "0 9px 9px 0",
        padding: "13px 15px",
      }}>
        <SectionLabel>Personalised Guidance</SectionLabel>
        <p style={{ fontSize: 13, fontWeight: 500,
          color: "rgba(245,248,255,0.72)", lineHeight: 1.65, margin: 0 }}>
          {insights.personalizedGuidance}
        </p>
      </div>
    </div>
  );
}

function Err({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#FF5C5C" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
        </svg>
        <span style={{ fontSize: 13, color: "#FF5C5C" }}>Unable to generate insights</span>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: "rgba(245,248,255,0.25)", marginBottom: 12 }}>{error}</p>
      )}
      {onRetry && (
        <button onClick={onRetry} style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 7, color: "rgba(245,248,255,0.45)",
          fontSize: 12, padding: "7px 14px", cursor: "pointer",
        }}>Try again</button>
      )}
    </div>
  );
}
