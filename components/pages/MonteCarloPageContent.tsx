"use client";
import { useRouter } from "next/navigation";
import { useOLTEEContext } from "@/lib/context";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { MonteCarloPanel } from "@/components/montecarlo/MonteCarloPanel";

export function MonteCarloPageContent() {
  const router = useRouter();
  const { state, hasBaseline, dispatch } = useOLTEEContext();
  const { inputs, outputs, monteCarloResult } = state;

  if (!hasBaseline || !inputs || !outputs) {
    return <Guard router={router}/>;
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg,#06080F)",
      color:"var(--text-1,#F5F8FF)", fontFamily:"var(--font-sans,system-ui)" }}>
      <Navigation/>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px 28px" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.025em",
            color:"var(--text-1,#F5F8FF)", marginBottom:6 }}>Monte Carlo Analysis</h1>
          <p style={{ fontSize:13, color:"rgba(245,248,255,0.40)", lineHeight:1.6 }}>
            Simulate thousands of possible futures to understand the probability your leverage stays productive.
          </p>
        </div>
        <MonteCarloPanel baseInputs={inputs} baseOutputs={outputs}
          dispatch={dispatch} savedResult={monteCarloResult}/>
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
          🎲
        </div>
        <div style={{ fontSize:16, color:"rgba(245,248,255,0.50)", textAlign:"center" }}>
          Run an analysis first to use Monte Carlo simulation.
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
