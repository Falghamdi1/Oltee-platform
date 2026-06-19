"use client";
import { useRouter } from "next/navigation";
import { useOLTEEContext } from "@/lib/context";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { ScenarioLab } from "@/components/scenarios/ScenarioLab";

export function ScenariosPageContent() {
  const router = useRouter();
  const { state, hasBaseline, dispatch } = useOLTEEContext();
  const { inputs } = state;

  if (!hasBaseline || !inputs) return <Guard icon="📊" label="Scenario Lab" router={router}/>;

  return (
    <Page title="Scenario Lab"
      subtitle="Simulate how market changes affect your safe leverage threshold.">
      <ScenarioLab baselineInputs={inputs} dispatch={dispatch}/>
    </Page>
  );
}

// ─── Re-usable sub-components ─────────────────────────────────────────────────

function Guard({ icon, label, router }: { icon:string; label:string; router:ReturnType<typeof useRouter> }) {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg,#06080F)",
      color:"var(--text-1,#F5F8FF)", fontFamily:"var(--font-sans,system-ui)" }}>
      <Navigation/>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", height:"calc(100vh - 56px)", gap:20 }}>
        <div style={{ width:72, height:72, borderRadius:18,
          background:"rgba(0,229,180,0.06)", border:"1px solid rgba(0,229,180,0.12)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>
          {icon}
        </div>
        <div style={{ fontSize:16, color:"rgba(245,248,255,0.50)", textAlign:"center" }}>
          Run an analysis first to use {label}.
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

function Page({ title, subtitle, children }: {
  title:string; subtitle:string; children:React.ReactNode
}) {
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg,#06080F)",
      color:"var(--text-1,#F5F8FF)", fontFamily:"var(--font-sans,system-ui)" }}>
      <Navigation/>
      <div style={{ maxWidth:1280, margin:"0 auto", padding:"36px 28px" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.025em",
            color:"var(--text-1,#F5F8FF)", marginBottom:6 }}>{title}</h1>
          <p style={{ fontSize:13, color:"rgba(245,248,255,0.40)", lineHeight:1.6 }}>{subtitle}</p>
        </div>
        {children}
      </div>
      <Footer/>
    </div>
  );
}
