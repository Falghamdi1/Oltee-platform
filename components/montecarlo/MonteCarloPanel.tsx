"use client";
import { useState, useEffect } from "react";
import type { OLTEEInputs, OLTEEOutputs, OLTEEAction, MonteCarloResult } from "@/types/oltee";
import { useMonteCarlo } from "@/hooks/useMonteCarlo";
import { DistributionChart } from "./DistributionChart";
import { formatPercent, formatSARShort } from "@/lib/formatting";
import { MONTE_CARLO_CONFIG } from "@/config/constants";

const SL = ({ children }: { children: React.ReactNode }) => (
  <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.10em",
    textTransform:"uppercase" as const,color:"rgba(245,248,255,0.28)",marginBottom:12}}>
    {children}
  </div>
);

interface Props {
  baseInputs: OLTEEInputs;
  baseOutputs: OLTEEOutputs;
  // Optional: pass dispatch so results are saved to global context for the report
  dispatch?: React.Dispatch<OLTEEAction>;
  // Pre-existing result from context (re-hydrates after navigation)
  savedResult?: MonteCarloResult | null;
}

export function MonteCarloPanel({ baseInputs, baseOutputs, dispatch, savedResult }: Props) {
  const [iters, setIters] = useState<number>(MONTE_CARLO_CONFIG.DEFAULT_ITERATIONS);
  const mc = useMonteCarlo();

  // Re-hydrate from context if the user navigates away and back
  useEffect(() => {
    if (savedResult && !mc.result) {
      // Don't re-run, just show the saved result
    }
  }, [savedResult]);

  const displayResult = mc.result ?? savedResult ?? null;

  const handleRun = async () => {
    if (dispatch) dispatch({ type: "START_MONTE_CARLO" });
    await mc.run(baseInputs, { iterations: iters });
  };

  // When mc.result arrives, save it to global context for the report
  useEffect(() => {
    if (mc.result && dispatch) {
      dispatch({ type: "SET_MONTE_CARLO_RESULT", payload: mc.result });
    }
  }, [mc.result, dispatch]);

  const ProbCard = ({ label, val, bg, border, bright, sub }: {
    label: string; val: number; bg: string; border: string; bright: string; sub: string;
  }) => (
    <div style={{background:bg,border:`1px solid ${border}`,borderRadius:12,padding:"18px 16px",textAlign:"center"}}>
      <div style={{fontFamily:"monospace",fontSize:34,fontWeight:700,color:bright,lineHeight:1}}>
        {(val * 100).toFixed(1)}%
      </div>
      <div style={{fontSize:11,fontWeight:500,color:bright,
        textTransform:"uppercase" as const,letterSpacing:"0.08em",margin:"7px 0 4px"}}>{label}</div>
      <div style={{fontSize:12,color:bright}}>{sub}</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Config panel */}
      <div style={{background:"var(--surface,#0E1525)",border:"1px solid #182035",borderRadius:12,padding:20}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" as const}}>
          <span style={{fontSize:12,color:"rgba(245,248,255,0.45)"}}>Scenarios to simulate:</span>
          {[1000,5000,10000,50000].map(n => (
            <button key={n} onClick={() => { setIters(n); mc.reset(); }}
              style={{padding:"5px 12px",
                background:iters===n?"#00E5B4":"rgba(255,255,255,0.04)",
                border:`1px solid ${iters===n?"#00B890":"rgba(255,255,255,0.09)"}`,
                borderRadius:6,fontSize:12,fontWeight:iters===n?600:400,
                color:iters===n?"#04120E":"rgba(245,248,255,0.45)",cursor:"pointer"}}>
              {n >= 1000 ? (n/1000).toFixed(0)+"K" : n}{n===10000?" ★":""}
            </button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            {mc.isRunning && (
              <button onClick={mc.cancel}
                style={{background:"none",border:"1px solid #2A3A5C",borderRadius:6,
                  color:"rgba(245,248,255,0.45)",fontSize:12,padding:"6px 12px",cursor:"pointer"}}>
                Cancel
              </button>
            )}
            <button onClick={handleRun} disabled={mc.isRunning}
              style={{padding:"8px 20px",
                background:mc.isRunning?"#00B890":"#00E5B4",
                color:"#04120E",border:"none",borderRadius:8,fontSize:13,
                fontWeight:600,cursor:mc.isRunning?"default":"pointer",
                opacity:mc.isRunning?0.8:1}}>
              {mc.isRunning
                ? `Simulating… ${(mc.progress * 100).toFixed(0)}%`
                : `Run ${(iters/1000).toFixed(0)}K scenarios →`}
            </button>
          </div>
        </div>
        {mc.isRunning && (
          <div style={{marginTop:12,height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:4,background:"#00E5B4",borderRadius:2,
              width:`${mc.progress * 100}%`,transition:"width 300ms ease"}}/>
          </div>
        )}
        {/* Show "saved to report" badge when result is in context */}
        {displayResult && dispatch && (
          <div style={{marginTop:10,fontSize:12,color:"#00E5B4",display:"flex",alignItems:"center",gap:6}}>
            <span>✓</span>
            <span>Saved — will appear in your PDF report</span>
          </div>
        )}
      </div>

      {!displayResult && !mc.isRunning && (
        <div style={{background:"var(--surface,#0E1525)",border:"1px solid #182035",borderRadius:12,
          padding:48,textAlign:"center",color:"rgba(245,248,255,0.28)",fontSize:14}}>
          Click "Run scenarios" to simulate {(iters/1000).toFixed(0)},000 possible futures
        </div>
      )}

      {displayResult && (<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <ProbCard label="Optimal"    val={displayResult.p_optimal}    bg="rgba(61,222,142,0.07)" border="rgba(61,222,142,0.22)" bright="#3DDE8E" sub="of futures stay productive"/>
          <ProbCard label="Caution"    val={displayResult.p_caution}    bg="rgba(255,184,48,0.07)" border="rgba(255,184,48,0.22)" bright="#FFB830" sub="enter caution zone"/>
          <ProbCard label="Suboptimal" val={displayResult.p_suboptimal} bg="rgba(255,92,92,0.07)" border="rgba(255,92,92,0.22)" bright="#FF5C5C" sub="cross the threshold"/>
        </div>
        <DistributionChart result={displayResult} baselineDebtRatio={baseOutputs.debt_ratio}/>
        <div style={{background:"var(--surface,#0E1525)",border:"1px solid #182035",borderRadius:12,padding:20}}>
          <SL>L* confidence intervals</SL>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {([
              ["P5",   displayResult.p5_L_star,  false],
              ["P25",  displayResult.p25_L_star, false],
              ["P50 median", displayResult.p50_L_star, true],
              ["P75",  displayResult.p75_L_star, false],
              ["P95",  displayResult.p95_L_star, false],
            ] as [string, number, boolean][]).map(([l, v, hi]) => (
              <div key={l} style={{
                background: hi ? "rgba(0,212,170,0.06)" : "var(--surface,#0E1525)",
                border:`1px solid ${hi ? "#006655" : "rgba(255,255,255,0.07)"}`,
                borderRadius:8, padding:"10px", textAlign:"center"}}>
                <div style={{fontSize:10,color:hi?"#00E5B4":"rgba(245,248,255,0.28)",
                  textTransform:"uppercase" as const,letterSpacing:"0.06em",marginBottom:4}}>{l}</div>
                <div style={{fontFamily:"monospace",fontSize:17,fontWeight:600,
                  color:hi?"#00E5B4":"var(--text-1,#F5F8FF)"}}>{formatPercent(v)}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:"rgba(245,248,255,0.28)",marginTop:10}}>
            Your debt ratio ({formatPercent(baseOutputs.debt_ratio)}) vs median ceiling ({formatPercent(displayResult.p50_L_star)}) — {
              baseOutputs.debt_ratio < displayResult.p5_L_star ? "well clear in all scenarios"
              : baseOutputs.debt_ratio < displayResult.p50_L_star ? "below the median ceiling"
              : "above the median — worth monitoring"
            }
          </div>
        </div>
      </>)}
    </div>
  );
}
