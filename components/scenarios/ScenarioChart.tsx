// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Scenario Comparison Charts + Sensitivity Chart
//
// Three chart components:
//   1. LStarComparisonChart   — grouped bar chart, baseline vs scenarios
//   2. HeadroomComparisonChart — SAR headroom bar chart
//   3. SensitivityLineChart   — single-variable sweep with color zones
//
// All use Recharts with a consistent dark-theme style derived from
// the OLTEE design system tokens.
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
  LineChart, Line, Area, AreaChart, ReferenceDot,
} from "recharts";
import type { ScenarioComparison, ScenarioResult, SensitivityAnalysis, LeverageStatus } from "@/types/oltee";
import { formatPercent, formatSAR, formatSARShort } from "@/lib/formatting";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       "transparent",
  border:   "rgba(255,255,255,0.07)",
  gridLine: "rgba(255,255,255,0.05)",
  inkTer:   "rgba(245,248,255,0.28)",
  inkSec:   "rgba(245,248,255,0.45)",
  teal:     "#00E5B4",
  tealMid:  "#00B890",
  overlay:  "var(--surface,#0E1525)",
  borderMid: "rgba(255,255,255,0.09)",
  optimal:  { mid: "#3DDE8E", bright: "#3DDE8E", bg: "rgba(61,222,142,0.07)",  border: "rgba(61,222,142,0.22)"  },
  caution:  { mid: "#FFB830", bright: "#FFB830", bg: "rgba(255,184,48,0.07)",  border: "rgba(255,184,48,0.22)"  },
  subopt:   { mid: "#FF5C5C", bright: "#FF5C5C", bg: "rgba(255,92,92,0.07)",   border: "rgba(255,92,92,0.22)"   },
  negsp:    { mid: "#FF4477", bright: "#FF4477", bg: "rgba(255,68,119,0.07)",  border: "rgba(255,68,119,0.22)"  },
};

const STATUS_COLOR: Record<LeverageStatus, string> = {
  OPTIMAL:    T.optimal.mid,
  CAUTION:    T.caution.mid,
  SUBOPTIMAL: T.subopt.mid,
  NEG_SPREAD: T.negsp.mid,
};

const STATUS_LABEL: Record<LeverageStatus, string> = {
  OPTIMAL:    "Optimal",
  CAUTION:    "Caution",
  SUBOPTIMAL: "Suboptimal",
  NEG_SPREAD: "Neg. spread",
};

// ─── Shared chart styles ──────────────────────────────────────────────────────
const AXIS_TICK = { fill: T.inkTer, fontSize: 11, fontFamily: "system-ui" };
const GRID_PROPS = {
  strokeDasharray: "3 3",
  stroke: T.gridLine,
  strokeOpacity: 0.5,
  vertical: false,
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
  type,
}: {
  active?: boolean;
  payload?: { payload: Record<string, unknown>; value: number }[];
  label?: string;
  type: "lstar" | "headroom";
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as {
    name: string;
    lstar?: number;
    headroom?: number;
    status?: LeverageStatus;
    isBaseline?: boolean;
  };
  const sc = d.status ? {
    OPTIMAL: T.optimal, CAUTION: T.caution, SUBOPTIMAL: T.subopt, NEG_SPREAD: T.negsp,
  }[d.status] : T.optimal;

  return (
    <div
      style={{
        background: T.overlay,
        border: `1px solid ${T.borderMid}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        lineHeight: 1.8,
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 500, color: "var(--text-1,#F5F8FF)", marginBottom: 4 }}>
        {d.isBaseline ? "📍 Baseline" : d.name}
      </div>
      {type === "lstar" && (
        <>
          <div style={{ color: T.teal }}>L* = {formatPercent(d.lstar ?? 0)}</div>
          {d.status && (
            <div style={{ color: sc?.bright }}>
              {STATUS_LABEL[d.status]}
            </div>
          )}
        </>
      )}
      {type === "headroom" && (
        <div style={{ color: (d.headroom ?? 0) > 0 ? T.optimal.bright : T.subopt.bright }}>
          Headroom: {formatSAR(d.headroom ?? 0)}
        </div>
      )}
    </div>
  );
}

// ─── 1. L* Comparison Chart ───────────────────────────────────────────────────

export interface LStarChartProps {
  comparison: ScenarioComparison;
  selectedIds?: string[];
  customResult?: ScenarioResult | null;
}

export function LStarComparisonChart({
  comparison,
  selectedIds = [],
  customResult,
}: LStarChartProps) {
  const { baseline, scenarios } = comparison;

  // Build chart data: baseline first, then selected scenarios, then custom
  const chartData = [
    {
      name: "Baseline",
      lstar: baseline.outputs.L_star * 100,
      status: baseline.outputs.status,
      isBaseline: true,
    },
    ...scenarios
      .filter((s) => {
        const id = (s.scenario as { id?: string } | null)?.id;
        return selectedIds.length === 0 || (id && selectedIds.includes(id));
      })
      .map((s) => ({
        name: s.label,
        lstar: s.outputs.L_star * 100,
        status: s.outputs.status,
        isBaseline: false,
      })),
    ...(customResult
      ? [{
          name: "Custom",
          lstar: customResult.outputs.L_star * 100,
          status: customResult.outputs.status,
          isBaseline: false,
        }]
      : []),
  ];

  const debtRatioPct = baseline.outputs.debt_ratio * 100;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1,#F5F8FF)", marginBottom: 4 }}>
        Safe borrowing ceiling (L*)
      </div>
      <div style={{ fontSize: 12, color: T.inkSec, marginBottom: 16 }}>
        Baseline vs selected scenarios
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 32, left: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="name"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            angle={-28}
            textAnchor="end"
            interval={0}
            height={48}
          />
          <YAxis
            tick={AXIS_TICK}
            domain={[0, 75]}
            tickFormatter={(v) => v + "%"}
          />
          <ReferenceLine
            y={debtRatioPct}
            stroke={T.caution.mid}
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: "Debt ratio",
              fill: T.caution.mid,
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
          <ReferenceLine
            y={70}
            stroke={T.inkTer}
            strokeDasharray="3 5"
            strokeWidth={1}
            label={{
              value: "Hard cap 70%",
              fill: T.inkTer,
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload as Parameters<typeof ChartTooltip>[0]["payload"]}
                label={props.label as string}
                type="lstar"
              />
            )}
            cursor={{ fill: "rgba(255,255,255,0.02)" }}
          />
          <Bar dataKey="lstar" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={d.isBaseline ? T.tealMid : STATUS_COLOR[d.status as LeverageStatus] || T.tealMid}
                opacity={d.isBaseline ? 0.65 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 2. Headroom Comparison Chart ─────────────────────────────────────────────

export function HeadroomComparisonChart({
  comparison,
  selectedIds = [],
  customResult,
}: LStarChartProps) {
  const { baseline, scenarios } = comparison;

  const chartData = [
    {
      name: "Baseline",
      headroom: baseline.outputs.headroom_SAR,
      isBaseline: true,
    },
    ...scenarios
      .filter((s) => {
        const id = (s.scenario as { id?: string } | null)?.id;
        return selectedIds.length === 0 || (id && selectedIds.includes(id));
      })
      .map((s) => ({
        name: s.label,
        headroom: s.outputs.headroom_SAR,
        status: s.outputs.status,
        isBaseline: false,
      })),
    ...(customResult
      ? [{
          name: "Custom",
          headroom: customResult.outputs.headroom_SAR,
          status: customResult.outputs.status,
          isBaseline: false,
        }]
      : []),
  ];

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1,#F5F8FF)", marginBottom: 4 }}>
        Remaining headroom (SAR)
      </div>
      <div style={{ fontSize: 12, color: T.inkSec, marginBottom: 16 }}>
        How much more borrowing capacity remains before crossing the threshold
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 32, left: 8 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="name"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            angle={-28}
            textAnchor="end"
            interval={0}
            height={48}
          />
          <YAxis
            tick={AXIS_TICK}
            tickFormatter={(v) =>
              v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M"
              : v >= 1_000 ? (v / 1_000).toFixed(0) + "K"
              : String(v)
            }
          />
          <ReferenceLine y={0} stroke={T.border} strokeWidth={1} />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload as Parameters<typeof ChartTooltip>[0]["payload"]}
                label={props.label as string}
                type="headroom"
              />
            )}
            cursor={{ fill: "rgba(255,255,255,0.02)" }}
          />
          <Bar dataKey="headroom" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={d.isBaseline
                  ? T.tealMid
                  : (d.headroom ?? 0) > 0
                    ? T.optimal.mid
                    : T.subopt.mid
                }
                opacity={d.isBaseline ? 0.65 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 3. Sensitivity Line Chart ────────────────────────────────────────────────

export interface SensitivityChartProps {
  analysis: SensitivityAnalysis;
  baselineDebtRatio: number;
}

export function SensitivityLineChart({
  analysis,
  baselineDebtRatio,
}: SensitivityChartProps) {
  const { points, baseline_value, baseline_L_star, inflection_point, label } = analysis;

  // Build chart data with color zones
  const chartData = points.map((p) => ({
    x: p.parameterValue,
    lstar: p.L_star * 100,
    debtRatio: baselineDebtRatio * 100,
    status: p.status,
  }));

  // Format X-axis tick based on parameter type
  const formatX = (v: number) => {
    if (analysis.parameter === "r" || analysis.parameter === "ROI" || analysis.parameter === "T") {
      return (v * 100).toFixed(1) + "%";
    }
    if (analysis.parameter === "sigma") return v.toFixed(2);
    if (analysis.parameter === "CF_ratio") return v.toFixed(1) + "×";
    if (analysis.parameter === "D" || analysis.parameter === "A") {
      return v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : (v / 1e3).toFixed(0) + "K";
    }
    return String(v);
  };

  const baselineX = baseline_value;
  const debtRatioPct = baselineDebtRatio * 100;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1,#F5F8FF)", marginBottom: 4 }}>
        Sensitivity: {label}
      </div>
      <div style={{ fontSize: 12, color: T.inkSec, marginBottom: 16 }}>
        How L* changes as {label.toLowerCase()} varies across its range
        {inflection_point !== null && (
          <span style={{ color: T.caution.bright, marginLeft: 8 }}>
            · Status changes at {formatX(inflection_point)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id="lstar-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.teal} stopOpacity={0.15} />
              <stop offset="95%" stopColor={T.teal} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            dataKey="x"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            tickFormatter={formatX}
            type="number"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            tick={AXIS_TICK}
            domain={[0, 75]}
            tickFormatter={(v) => v + "%"}
          />
          {/* Debt ratio reference */}
          <ReferenceLine
            y={debtRatioPct}
            stroke={T.caution.mid}
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: "Your debt ratio",
              fill: T.caution.mid,
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
          {/* Hard cap reference */}
          <ReferenceLine
            y={70}
            stroke={T.inkTer}
            strokeDasharray="3 5"
            strokeWidth={1}
            label={{
              value: "Hard cap",
              fill: T.inkTer,
              fontSize: 10,
              position: "insideTopRight",
            }}
          />
          {/* Baseline vertical reference */}
          <ReferenceLine
            x={baselineX}
            stroke={T.inkSec}
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: "Current",
              fill: T.inkSec,
              fontSize: 10,
              position: "top",
            }}
          />
          {/* Inflection point dot */}
          {inflection_point !== null && (
            <ReferenceLine
              x={inflection_point}
              stroke={T.caution.mid}
              strokeDasharray="2 3"
              strokeWidth={1.5}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload as { x: number; lstar: number; status: LeverageStatus };
              const sc = { OPTIMAL: T.optimal, CAUTION: T.caution, SUBOPTIMAL: T.subopt, NEG_SPREAD: T.negsp }[d.status];
              return (
                <div style={{ background: T.overlay, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
                  <div style={{ color: T.inkSec, marginBottom: 4 }}>{label}: {formatX(d.x)}</div>
                  <div style={{ color: T.teal }}>L* = {d.lstar.toFixed(1)}%</div>
                  <div style={{ color: sc?.bright }}>{STATUS_LABEL[d.status]}</div>
                </div>
              );
            }}
            cursor={{ stroke: T.teal, strokeDasharray: "3 3", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="lstar"
            stroke={T.teal}
            strokeWidth={2}
            fill="url(#lstar-gradient)"
            dot={false}
            activeDot={{ r: 4, fill: T.teal, stroke: T.teal }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
