"use client";
import { useRouter } from "next/navigation";
import { useOLTEEContext } from "@/lib/context";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PDFReportBuilder } from "@/components/report/PDFReportBuilder";
import { buildReportData } from "@/lib/pdf";

export function ReportPageContent() {
  const router = useRouter();
  const { state, hasBaseline } = useOLTEEContext();
  const { inputs, outputs, equationSteps, scores, aiState, scenarioComparison, monteCarloResult } = state;

  if (!hasBaseline || !inputs || !outputs || !equationSteps || !scores) {
    return <Guard router={router}/>;
  }

  const insights = aiState.status === "complete"
    ? (aiState.insights as import("@/types/oltee").AIInsights) : null;
  const scenarios = scenarioComparison?.scenarios ?? null;
  const reportData = buildReportData(
    inputs, outputs, equationSteps, scores, insights, scenarios, monteCarloResult
  );

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg,#06080F)",
      color:"var(--text-1,#F5F8FF)", fontFamily:"var(--font-sans,system-ui)" }}>
      <Navigation/>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px 28px" }}>
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.025em",
            color:"var(--text-1,#F5F8FF)", marginBottom:6 }}>Your OLTEE report</h1>
          <p style={{ fontSize:13, color:"rgba(245,248,255,0.40)", lineHeight:1.6 }}>
            Download a professional PDF suitable for sharing with a financial advisor.
          </p>
        </div>
        <PDFReportBuilder data={reportData}/>
      </div>
      <Footer/>
    </div>
  );
}

function Guard({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg,#06080F)",
      color:"var(--text-1,#F5F8FF)", fontFamily:"var(--font-sans,system-ui)" }}>
      <Navigation/>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", height:"calc(100vh - 56px)", gap:20 }}>
        <div style={{ width:72, height:72, borderRadius:18,
          background:"rgba(0,229,180,0.06)", border:"1px solid rgba(0,229,180,0.12)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>
          📄
        </div>
        <div style={{ fontSize:16, color:"rgba(245,248,255,0.50)", textAlign:"center" }}>
          Run an analysis first to generate a report.
        </div>
        <button onClick={() => router.push("/analyze")} style={{
          background:"linear-gradient(135deg,#00E5B4,#00B890)",
          color:"#04120E", border:"none", borderRadius:9,
          padding:"10px 24px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
          Go to Analyze →
        </button>
      </div>
    </div>
  );
}
