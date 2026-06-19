"use client";
import { useState } from "react";

interface Props { onResult: (cf: number) => void; defaultIncome?: number; defaultRepayment?: number; }

export function CFSubCalculator({ onResult, defaultIncome=18000, defaultRepayment=13333 }: Props) {
  const [income, setIncome] = useState(String(defaultIncome));
  const [repay,  setRepay]  = useState(String(defaultRepayment));
  const cf = parseFloat(income) > 0 && parseFloat(repay) > 0
    ? parseFloat(income) / parseFloat(repay) : null;

  const inputStyle = {
    flex:1, height:38, background:"rgba(0,0,0,0.30)",
    border:"1px solid rgba(255,255,255,0.09)",
    borderRight:"none", borderRadius:"8px 0 0 8px",
    padding:"0 10px", fontSize:13,
    color:"var(--text-1,#F5F8FF)", outline:"none",
  };
  const unitStyle = {
    height:38, background:"rgba(0,0,0,0.20)",
    border:"1px solid rgba(255,255,255,0.09)", borderLeft:"none",
    borderRadius:"0 8px 8px 0", padding:"0 10px",
    display:"flex", alignItems:"center",
    fontSize:11, fontWeight:600, color:"rgba(245,248,255,0.30)",
  };

  return (
    <div style={{ background:"rgba(0,0,0,0.28)", border:"1px solid rgba(255,255,255,0.09)",
      borderRadius:10, padding:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        {[["Monthly income", income, setIncome], ["Monthly repayment", repay, setRepay]].map(([label, val, set]) => (
          <div key={label as string}>
            <div style={{ fontSize:10, color:"rgba(245,248,255,0.30)", marginBottom:4,
              textTransform:"uppercase" as const, letterSpacing:"0.07em", fontWeight:600 }}>
              {label as string}
            </div>
            <div style={{ display:"flex" }}>
              <input value={val as string} onChange={e => (set as (v:string)=>void)(e.target.value)}
                style={inputStyle as React.CSSProperties}/>
              <div style={unitStyle as React.CSSProperties}>SAR</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div style={{ fontSize:9, color:"rgba(245,248,255,0.30)", textTransform:"uppercase" as const,
            letterSpacing:"0.08em", marginBottom:3 }}>CF ratio</div>
          <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:22,
            fontWeight:700, color:"#00E5B4" }}>{cf ? cf.toFixed(2)+"×" : "—"}</div>
        </div>
        {cf && (
          <button onClick={() => onResult(cf)}
            style={{ background:"linear-gradient(135deg,#00E5B4,#00B890)",
              color:"#04120E", border:"none", borderRadius:8,
              padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Use this →
          </button>
        )}
      </div>
    </div>
  );
}
