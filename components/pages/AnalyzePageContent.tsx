"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOLTEEContext } from "@/lib/context";
import { Navigation } from "@/components/layout/Navigation";
import { AnalysisForm } from "@/components/forms/AnalysisForm";
import { DecisionBanner } from "@/components/results/DecisionBanner";
import { KPIRow } from "@/components/results/KPIRow";
import { GaugeVisualization } from "@/components/results/GaugeVisualization";
import { EquationWaterfall } from "@/components/results/EquationWaterfall";
import { FinancialScoresPanel } from "@/components/results/FinancialScores";
import { AIInsightPanel } from "@/components/ai/AIInsightPanel";
import type { OLTEEFormValues } from "@/types/oltee";

export function AnalyzePageContent() {
  const { state, compute, regenerateAI } = useOLTEEContext();
  const { outputs, equationSteps, scores, aiState, isCalculating, inputs } = state;
  const params = useSearchParams();
  const [mobileTab, setMobileTab] = useState<"form" | "results">("form");

  useEffect(() => { if (outputs) setMobileTab("results"); }, [outputs]);

  useEffect(() => {
    const roi = params.get("roi"), r = params.get("r");
    if (!roi || !r) return;
    const pre: OLTEEFormValues = {
      ROI: roi, r,
      T:        params.get("t")     ?? "15",
      sigma:    parseFloat(params.get("sigma") ?? "0.20"),
      CF_ratio: params.get("cf")    ?? "",
      D:        params.get("d")     ?? "",
      A:        params.get("a")     ?? "",
    };
    if (pre.CF_ratio && pre.D && pre.A) compute(pre);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dv: Partial<OLTEEFormValues> | undefined = inputs ? {
    ROI: String(inputs.ROI * 100), r: String(inputs.r * 100),
    T: String(inputs.T * 100), sigma: inputs.sigma,
    CF_ratio: String(inputs.CF_ratio), D: String(inputs.D), A: String(inputs.A),
  } : undefined;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #06080F)",
      color: "var(--text-1, #F5F8FF)", fontFamily: "var(--font-sans, system-ui)" }}>
      <Navigation />

      {/* ── Mobile tab bar ── */}
      <div className="mobile-tabs" style={{ display: "none" }}>
        {(["form", "results"] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)} style={{
            flex: 1, height: 44, background: "none", border: "none",
            borderBottom: `2px solid ${mobileTab === tab ? "#00E5B4" : "transparent"}`,
            color: mobileTab === tab ? "#00E5B4" : "rgba(245,248,255,0.35)",
            fontSize: 13, fontWeight: mobileTab === tab ? 600 : 400,
            cursor: "pointer", transition: "all 120ms",
          }}>
            {tab === "form" ? "Inputs" : outputs ? "Results ✓" : "Results"}
          </button>
        ))}
      </div>

      {/* ── Two-column grid ── */}
      <div className="analyze-grid" style={{
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        minHeight: "calc(100vh - 56px)",
      }}>
        {/* Left — form */}
        <div className={`form-panel ${mobileTab === "results" ? "mobile-hidden" : ""}`}
          style={{
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "24px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 56px)",
            position: "sticky", top: 56,
            alignSelf: "start",
          }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em",
              color: "#F5F8FF", marginBottom: 4 }}>Leverage Analysis</h1>
            <p style={{ fontSize: 12, color: "rgba(245,248,255,0.35)", lineHeight: 1.6 }}>
              Enter your financial data to compute the safe borrowing threshold
            </p>
          </div>
          <AnalysisForm onSubmit={compute} defaultValues={dv} isLoading={isCalculating}/>
        </div>

        {/* Right — results */}
        <div className={`results-panel ${mobileTab === "form" && !outputs ? "mobile-hidden" : ""}`}
          style={{ padding: "28px 32px", overflowY: "auto" }}>
          {!outputs ? <EmptyState/> : (
            <div className="results-stack" style={{
              display: "flex", flexDirection: "column",
              gap: 14, maxWidth: 860,
            }}>
              <DecisionBanner outputs={outputs}/>
              <KPIRow outputs={outputs}/>

              {/* ── Gauge card — full width, no fixed height ── */}
              <div style={{
                background: "var(--surface, #0E1525)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                overflow: "hidden",
                width: "100%",
              }}>
                <GaugeVisualization outputs={outputs}/>
              </div>

              {equationSteps && <EquationWaterfall steps={equationSteps} status={outputs.status}/>}
              {scores && <FinancialScoresPanel scores={scores}/>}
              <AIInsightPanel state={aiState} onRegenerate={regenerateAI}/>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Tablet */
        @media (max-width: 1100px) {
          .analyze-grid { grid-template-columns: 320px 1fr !important; }
          .results-panel { padding: 20px 20px !important; }
        }
        /* Mobile */
        @media (max-width: 720px) {
          .analyze-grid {
            grid-template-columns: 1fr !important;
            min-height: unset !important;
          }
          .form-panel {
            position: static !important;
            max-height: unset !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            padding: 16px !important;
          }
          .results-panel { padding: 16px !important; }
          .results-stack { gap: 12px !important; }
          .mobile-hidden { display: none !important; }
          .mobile-tabs {
            display: flex !important;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            position: sticky; top: 56px; z-index: 90;
            background: var(--bg, #06080F);
          }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: 480, gap: 18, padding: 32, textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="rgba(245,248,255,0.25)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(245,248,255,0.50)",
          marginBottom: 8, letterSpacing: "-0.01em" }}>
          Ready to compute
        </div>
        <div style={{ fontSize: 13, color: "rgba(245,248,255,0.28)",
          maxWidth: 300, lineHeight: 1.75 }}>
          Fill in your data on the left and click{" "}
          <span style={{ color: "#00E5B4", fontWeight: 600 }}>Calculate L*</span>{" "}
          to see your optimal leverage threshold
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, justifyContent: "center" }}>
        {["9-step math", "AI analysis", "Scenario lab", "PDF export"].map(f => (
          <span key={f} style={{
            fontSize: 11, color: "rgba(245,248,255,0.28)",
            padding: "4px 10px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 99,
          }}>{f}</span>
        ))}
      </div>
    </div>
  );
}