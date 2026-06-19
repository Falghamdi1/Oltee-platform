"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import type { MonteCarloResult, LeverageStatus } from "@/types/oltee";

const binColor = (status: LeverageStatus | "mixed") =>
  status === "OPTIMAL" ? "#3DDE8E" : status === "CAUTION" ? "#FFB830" : "#FF5C5C";

export function DistributionChart({ result, baselineDebtRatio }: { result: MonteCarloResult; baselineDebtRatio: number }) {
  return (
    <div style={{background:"var(--surface,#0E1525)",border:"1px solid #182035",borderRadius:12,padding:20}}>
      <div style={{fontSize:13,fontWeight:500,color:"var(--text-1,#F5F8FF)",marginBottom:4}}>
        L* distribution across {result.iterations_run.toLocaleString()} simulated futures
      </div>
      <div style={{fontSize:11,color:"rgba(245,248,255,0.45)",marginBottom:14}}>
        Bars show how often the safe ceiling falls in each range
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={result.histogram} margin={{top:8,right:8,bottom:28,left:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" strokeOpacity={0.5} vertical={false}/>
          <XAxis dataKey="label" tick={{fill:"rgba(245,248,255,0.28)",fontSize:9}} angle={-35} textAnchor="end" interval={1} height={44}/>
          <YAxis tick={{fill:"rgba(245,248,255,0.28)",fontSize:10}} tickFormatter={v => (v*100).toFixed(0)+"%"}/>
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.07)"/>
          <Tooltip
            contentStyle={{background:"#111B2E",border:"1px solid #1E2A42",fontSize:12}}
            formatter={(v: number) => [(v*100).toFixed(1)+"%","Frequency"]}/>
          <Bar dataKey="frequency" radius={[2,2,0,0]}>
            {result.histogram.map((b, i) => <Cell key={i} fill={binColor(b.status)}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
