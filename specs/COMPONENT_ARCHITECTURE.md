# OLTEE — Reusable Component Architecture & Implementation Plan
## Phase 3 Pre-Implementation Reference
**Author:** Faisal Alghamdi | **Version:** 1.0

---

## ARCHITECTURE PRINCIPLES

### 1. Three-Layer Component Model

Every component in OLTEE belongs to exactly one layer:

```
┌─────────────────────────────────────────────────────┐
│  LAYER 3 — Page Assemblies                          │
│  Full page sections that own layout and composition │
│  LandingHero, AnalysisLayout, ScenarioLab           │
├─────────────────────────────────────────────────────┤
│  LAYER 2 — Domain Components                        │
│  OLTEE-specific, consume typed domain data          │
│  DecisionBanner, GaugeVisualization, AIInsightPanel │
├─────────────────────────────────────────────────────┤
│  LAYER 1 — Primitive Components                     │
│  Fully reusable, zero OLTEE-specific knowledge      │
│  Card, Badge, MetricDisplay, StatusRing, FieldInput │
└─────────────────────────────────────────────────────┘
```

**Rules:**
- Layer 1 components know nothing about `LeverageStatus`, `OLTEEOutputs`, or any domain type
- Layer 2 components accept domain types directly — they are the mapping boundary
- Layer 3 components orchestrate layout; they hold `useOLTEE` / `useScenario` hooks
- No hook calls inside Layer 1 or Layer 2 — props only
- No domain imports inside Layer 1

### 2. Composition Over Configuration

Avoid massive prop objects. Prefer:
```tsx
// ✓ Composition
<Card>
  <Card.Header>
    <Badge variant="optimal">Optimal</Badge>
  </Card.Header>
  <Card.Body>
    <MetricDisplay value="59.8%" label="Current ratio" />
  </Card.Body>
</Card>

// ✗ Configuration overload
<ResultCard status="optimal" value="59.8%" label="..." showBadge showBorder ... />
```

### 3. Prop Naming Conventions

```typescript
// Boolean props: positive framing, no "is" prefix for simple toggles
animated?: boolean      // not isAnimated
showLabels?: boolean    // not hasLabels
collapsed?: boolean     // default false = expanded

// Event handlers: "on" + noun + past-tense verb
onSubmit, onValueChange, onPresetSelect, onSimulationComplete

// Data props: exactly match the type name
outputs: OLTEEOutputs   // not result, data, info
scores: FinancialScores
steps: EquationStep[]
```

### 4. CSS Token Usage

All colors, spacing, and radius values via CSS custom properties from `globals.css`.
Never hardcode hex values in component files.
Tailwind classes are allowed only for layout (flex, grid, gap, padding with the design system scale).

### 5. Animation Contract

Every animated component accepts:
```typescript
animated?: boolean   // default true; false = instant render (for testing)
```
All animations respect `prefers-reduced-motion` via:
```css
@media (prefers-reduced-motion: reduce) { /* instant */ }
```

---

## LAYER 1 — PRIMITIVE COMPONENTS

### 1.1 `<Card>` with sub-components

**File:** `components/ui/Card.tsx`

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;       // surface-overlay background (L2)
  status?: LeverageStatus | null;   // adds status glow box-shadow
  onClick?: () => void;
  asChild?: boolean;
}

// Sub-components via dot notation:
Card.Header   // padding-bottom + border-bottom divider
Card.Body     // main content area
Card.Footer   // padding-top + border-top divider
```

**Implementation notes:**
- Default: `bg-[--surface-raised] border border-[--border-base] rounded-xl`
- `elevated`: `bg-[--surface-overlay] border-[--border-raised]`
- `status` prop adds `box-shadow: 0 0 24px var(--status-{status}-pulse)`
- `onClick` adds `cursor-pointer hover:border-[--border-strong] transition-colors duration-150`

---

### 1.2 `<Badge>`

**File:** `components/ui/Badge.tsx`

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant: "optimal" | "caution" | "suboptimal" | "negspread" | "teal" | "neutral";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}
```

**Variant → token mapping:**
```
optimal:    bg-[--optimal-bg]     border-[--optimal-border]   text-[--optimal-bright]
caution:    bg-[--caution-bg]     border-[--caution-border]   text-[--caution-bright]
suboptimal: bg-[--suboptimal-bg]  border-[--suboptimal-border] text-[--suboptimal-bright]
negspread:  bg-[--negspread-bg]   border-[--negspread-border]  text-[--negspread-bright]
teal:       bg-[--teal-ghost]     border-[--teal-dim]          text-[--teal-vivid]
neutral:    bg-[--surface-overlay] border-[--border-raised]    text-[--ink-secondary]
```

Size sm: `text-[10px] px-2 py-0.5 rounded`
Size md (default): `text-[11px] px-2.5 py-1 rounded-md`

---

### 1.3 `<MetricDisplay>`

**File:** `components/ui/MetricDisplay.tsx`

The core building block for all KPI numbers. Encapsulates count-up animation.

```typescript
interface MetricDisplayProps {
  value: string;              // Pre-formatted display string
  label: string;              // UPPERCASE label above
  sublabel?: string;          // Muted text below value
  valueColor?: "primary" | "teal" | "optimal" | "caution" | "suboptimal" | "negspread";
  monoValue?: boolean;        // true = JetBrains Mono (default true for numbers)
  size?: "sm" | "md" | "lg"; // Controls font size of value
  icon?: React.ReactNode;     // Optional icon after label
  animated?: boolean;
  animateDelay?: number;      // ms delay for staggered entrance
}
```

**Size → font size mapping:**
- sm: `text-xl` (JetBrains Mono 20px)
- md: `text-[28px]` (JetBrains Mono 28px) — default
- lg: `text-[36px]` (JetBrains Mono 36px)

**Label:** Inter 10px / uppercase / letter-spacing 0.1em / `--ink-secondary`

---

### 1.4 `<FieldInput>`

**File:** `components/ui/FieldInput.tsx`

Wraps label + input + unit badge + helper + error text.

```typescript
interface FieldInputProps {
  id: string;
  label: string;
  unit?: string;              // "%" or "SAR" or "×" — right slot
  placeholder?: string;
  type?: "text" | "number";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  warning?: string;
  helper?: string;
  tooltip?: string;           // Radix Tooltip content
  rightAccessory?: React.ReactNode;  // e.g. spread badge next to ROI label
  disabled?: boolean;
  required?: boolean;
}
```

**Internal structure:**
```tsx
<div className="flex flex-col gap-1.5">
  <div className="flex items-center justify-between">
    <label>{label} {required && <span>*</span>}</label>
    {tooltip && <TooltipIcon content={tooltip} />}
    {rightAccessory}
  </div>
  <div className="relative">
    <input ... />
    {unit && <UnitBadge>{unit}</UnitBadge>}
  </div>
  {error && <ErrorText>{error}</ErrorText>}
  {warning && !error && <WarningText>{warning}</WarningText>}
  {helper && !error && !warning && <HelperText>{helper}</HelperText>}
</div>
```

---

### 1.5 `<StatusRing>` (SVG score circle)

**File:** `components/ui/StatusRing.tsx`

Reusable SVG ring for FinancialScores and any other 0–100 metric.

```typescript
interface StatusRingProps {
  score: number;              // 0–100
  size?: number;              // diameter in px, default 88
  strokeWidth?: number;       // default 8
  color: "optimal" | "caution" | "suboptimal";
  label?: string;             // center override (default: score number)
  animated?: boolean;
  animateDelay?: number;
}
```

**SVG math:**
```typescript
const r = (size / 2) - (strokeWidth / 2);
const circumference = 2 * Math.PI * r;  // 213.6px at default
const dasharray = `${(score / 100) * circumference} ${circumference}`;
const dashoffset = -circumference * 0.25;  // start from top (−90°)
```

**Color → CSS var mapping:**
```
optimal:    stroke: var(--optimal-mid)
caution:    stroke: var(--caution-mid)
suboptimal: stroke: var(--suboptimal-mid)
```

---

### 1.6 `<ProgressBar>`

**File:** `components/ui/ProgressBar.tsx`

```typescript
interface ProgressBarProps {
  value: number;              // 0–1
  label?: string;             // displayed above bar
  sublabel?: string;          // displayed right-aligned above bar
  color?: "teal" | "optimal" | "caution" | "suboptimal";
  height?: number;            // px, default 4
  animated?: boolean;
  showValue?: boolean;        // show % text right of bar
}
```

---

### 1.7 `<TooltipIcon>`

**File:** `components/ui/TooltipIcon.tsx`

```typescript
interface TooltipIconProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  iconSize?: number;          // default 14
}
```

Renders Lucide `HelpCircle` in `--ink-tertiary`. Radix `Tooltip.Root/Trigger/Content`.
Tooltip card: `bg-[--surface-overlay] border border-[--border-raised] rounded-md p-2 text-[13px] text-[--ink-secondary] max-w-[260px]`

---

### 1.8 `<Button>`

**File:** `components/ui/Button.tsx`

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;     // icon before children
  iconAfter?: React.ReactNode; // icon after children (e.g. →)
  fullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}
```

**Variant styles:**
```
primary:     bg-[--teal-vivid] text-[--ink-inverse] hover:bg-[--teal-mid]
secondary:   bg-transparent border border-[--border-strong] text-[--ink-primary] hover:bg-[--surface-overlay]
ghost:       bg-transparent text-[--ink-secondary] hover:text-[--ink-primary]
destructive: bg-transparent border border-[--suboptimal-border] text-[--suboptimal-bright]
```

**Size → height/padding:**
- sm: h-8 px-3 text-[13px]
- md: h-11 px-5 text-[14px] (default)
- lg: h-12 px-6 text-[15px]

Loading state: spinner replaces icon, text opacity 70%, disabled pointer-events.

---

### 1.9 `<Skeleton>`

**File:** `components/ui/Skeleton.tsx`

```typescript
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
  className?: string;
}
```

`bg-[--surface-overlay] animate-pulse rounded-{rounded}`

---

### 1.10 `<Divider>`

**File:** `components/ui/Divider.tsx`

```typescript
interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}
```

`border-[--border-muted]` 1px rule.

---

### 1.11 `<SectionLabel>`

**File:** `components/ui/SectionLabel.tsx`

```typescript
interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}
```

`text-[10px] font-medium tracking-[0.12em] uppercase text-[--ink-tertiary]`

---

## LAYER 2 — DOMAIN COMPONENTS

### 2.1 `<LiveEquationDisplay>`

**File:** `components/engine/LiveEquationDisplay.tsx`

The signature element. Appears in hero (static) and form column (live).

```typescript
interface LiveEquationDisplayProps {
  // In "live" mode: which terms are filled
  filledTerms?: {
    ROI?: number;         // decimal — undefined = not yet filled
    r?: number;
    T?: number;
    sigma?: number;
    CF_ratio?: number;
    beta?: number;        // computed from sigma
    result?: number;      // L* — computed, shown when all filled
  };
  mode: "hero" | "live" | "result";
  // "hero" = all terms dimmed, hover to highlight
  // "live" = teal for filled, dim for empty
  // "result" = all filled + L* shown prominently
  size?: "sm" | "md";
  animated?: boolean;
}
```

**Term activation sequence (live mode):**
1. Term color transitions from `--ink-tertiary` to `--teal-vivid` over 300ms when `filledTerms[term]` becomes defined
2. When all required terms present: `result` value scales in (scale 0.85→1.0, 400ms ease-spring)
3. β is always derived, not user-entered — updates live with sigma

**Internal structure:**
```tsx
// Line 1: L* = [ {ROI} − {r} ] × [ 1 − {T} ]
// Line 2:   ÷ [ {r} × ( 1 + {σ} × 0.5 ) × ( 1 / {CF} ) ]  = {L*}
// Each term is a <EquationTerm> span with hover interaction
```

**`<EquationTerm>` sub-component:**
```typescript
interface EquationTermProps {
  symbol: string;           // display string: "ROI", "σ", "L*"
  value?: number;           // filled value for display
  active: boolean;          // teal if true
  tooltip?: string;         // Radix Tooltip on hover
}
```

---

### 2.2 `<DecisionBanner>`

**File:** `components/results/DecisionBanner.tsx`
*(Already stubbed — implement from spec)*

```typescript
interface DecisionBannerProps {
  status: LeverageStatus;
  delta?: number;           // Δ = ROI − r, for right-side display
  beta?: number;            // β, for right-side display
  alpha?: number;           // α, for right-side display
  animated?: boolean;
}
```

**Implementation:**
```tsx
const config = STATUS_CONFIG[status];
// Icon: Lucide component by name — use dynamic import or switch
// Animation: Framer Motion scale from 0.96, 500ms ease-spring
// Box-shadow: 0 0 24px var(--{status}-pulse) on the card
```

**Right slot (desktop only, `hidden md:flex`):**
```tsx
<span className="font-mono text-xs text-[--ink-tertiary]">
  Δ {formatPercent(delta)} · β {beta.toFixed(3)} · α {alpha.toFixed(3)}
</span>
```

---

### 2.3 `<KPIRow>`

**File:** `components/results/KPIRow.tsx`
*(Already stubbed — implement from spec)*

```typescript
interface KPIRowProps {
  outputs: OLTEEOutputs;
  animated?: boolean;
}
```

Renders three `<Card>` + `<MetricDisplay>` in a 3-column grid.
Stagger: 0ms / 80ms / 160ms via `animateDelay` on each MetricDisplay.

Card 1 — Current Ratio:
```typescript
value: formatPercent(outputs.debt_ratio)          // "59.8%"
valueColor: statusToColor(outputs.status)
label: "CURRENT RATIO"
sublabel: "of assets are financed by debt"
```

Card 2 — Safe Ceiling:
```typescript
value: formatPercent(outputs.L_star)              // "70.0%"
valueColor: "teal"
label: "SAFE CEILING"
icon: outputs.cap_applied ? <LockIcon /> : undefined
sublabel: "optimal leverage threshold"
```

Card 3 — Headroom:
```typescript
value: formatSAR(outputs.headroom_SAR)            // "SAR 94,000"
valueColor: outputs.headroom_SAR > 0 ? "optimal" : "suboptimal"
label: "HEADROOM"
sublabel: headroom > 0 ? "before crossing the threshold" : "threshold already exceeded"
size: "md"  // SAR numbers can be long — use medium not large
```

---

### 2.4 `<GaugeVisualization>`

**File:** `components/results/GaugeVisualization.tsx`
*(Already stubbed — implement from spec)*

```typescript
interface GaugeVisualizationProps {
  data: GaugeData;          // { currentRatio, threshold, cautionZoneStart, status }
  size?: "sm" | "md" | "lg";  // sm:240×134, md:300×160 (default), lg:360×200
  animated?: boolean;
  showLabels?: boolean;
}
```

**SVG constants (at md size):**
```typescript
const CX = 150, CY = 150;   // center point
const R = 120;               // arc radius
const STROKE = 16;           // arc stroke width
const START_ANGLE = 180;     // degrees (left)
const END_ANGLE = 0;         // degrees (right)
const MAX_RATIO = 0.70;      // 70% = full arc
```

**Arc path computation:**
```typescript
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function ratioToAngle(ratio: number): number {
  return 180 - (Math.min(ratio / MAX_RATIO, 1) * 180);
}
```

**Zone arcs (separate `<path>` elements):**
```typescript
// Zone 1: 0% → cautionZoneStart (green)
// Zone 2: cautionZoneStart → threshold (amber)
// Zone 3: threshold → 70% (red, always present)
// NEG_SPREAD: single full-arc crimson path, replaces all zones
```

**Needle (Framer Motion `<motion.line>`):**
```typescript
const needleAngle = ratioToAngle(currentRatio);
// Framer Motion: animate={{ rotate: needleAngle }} transition={{ type: "spring", stiffness: 55, damping: 12 }}
// Origin: cx=150, cy=150
```

**Center readout:** absolute positioned over SVG
```tsx
<div className="absolute inset-0 flex flex-col items-center justify-center">
  <span className="font-mono text-[26px] font-semibold text-[--ink-primary]">
    {formatPercent(currentRatio)}
  </span>
  <span className="text-[11px] text-[--ink-secondary]">current debt ratio</span>
</div>
```

---

### 2.5 `<EquationWaterfall>`

**File:** `components/results/EquationWaterfall.tsx`
*(Already stubbed — implement from spec)*

```typescript
interface EquationWaterfallProps {
  steps: EquationStep[];
  animated?: boolean;
  defaultCollapsed?: boolean;  // default false on desktop, true on mobile
}
```

**Row component `<WaterfallRow>`:**
```typescript
interface WaterfallRowProps {
  step: EquationStep;
  isHighlighted: boolean;     // steps 7 & 8 — surface-subtle bg
  isPrimary: boolean;         // step 8 — teal left border
  isFinal: boolean;           // step 9 — status color result
  status?: LeverageStatus;    // for step 9 result color
  animateDelay?: number;
}
```

**Result value color logic:**
```typescript
function resultColor(step: EquationStep, status: LeverageStatus): string {
  if (step.step === 2) {
    return step.result > 0 ? "var(--optimal-bright)" : "var(--suboptimal-bright)";
  }
  if (step.step === 8) return "var(--teal-vivid)";
  if (step.step === 9) return `var(--${status.toLowerCase()}-bright)`;
  if ([5, 6].includes(step.step)) return "var(--teal-vivid)";
  return "var(--ink-primary)";
}
```

**Collapse animation:**
```tsx
// Framer Motion AnimatePresence + motion.div with height: 0 / "auto"
// Chevron icon rotates 0° (collapsed) → 180° (expanded)
```

---

### 2.6 `<FinancialScoresPanel>`

**File:** `components/results/FinancialScores.tsx`
*(Already stubbed — implement from spec)*

```typescript
interface FinancialScoresPanelProps {
  scores: FinancialScores;
  animated?: boolean;
}
```

Renders 2×2 grid of `<ScoreCard>` components.

**`<ScoreCard>` (internal):**
```typescript
interface ScoreCardProps {
  scoreKey: keyof FinancialScores;
  score: number;
  animated?: boolean;
  animateDelay?: number;
}
```

Score → color:
```typescript
function scoreColor(score: number): "optimal" | "caution" | "suboptimal" {
  if (score >= 70) return "optimal";
  if (score >= 40) return "caution";
  return "suboptimal";
}
```

Score → qualifier label:
```typescript
const qualifiers: Record<string, [number, string][]> = {
  stability:   [[80, "STABLE"], [50, "MODERATE"], [0, "AT RISK"]],
  debtHealth:  [[80, "HEALTHY"], [50, "FAIR"], [0, "POOR"]],
  efficiency:  [[75, "OPTIMAL"], [45, "PARTIAL"], [0, "INEFFICIENT"]],
  resilience:  [[75, "RESILIENT"], [45, "MODERATE"], [0, "FRAGILE"]],
};
```

---

### 2.7 `<AIInsightPanel>`

**File:** `components/ai/AIInsightPanel.tsx`
*(Already stubbed — implement from spec)*

```typescript
interface AIInsightPanelProps {
  state: AIInsightState;
  onRegenerate?: () => void;
}
```

**Internal state machine render:**
```tsx
{state.status === "idle" && <AIIdleState />}
{state.status === "loading" && <AILoadingState />}
{state.status === "streaming" && <AIStreamingState rawStream={state.rawStream} />}
{state.status === "complete" && <AICompleteState insights={state.insights as AIInsights} />}
{state.status === "error" && <AIErrorState error={state.error} onRetry={onRegenerate} />}
```

**`<AIStreamingState>`:**
```typescript
// Renders rawStream text progressively
// Blinking cursor: <span className="animate-[blink_700ms_step-end_infinite]">|</span>
// aria-live="polite" on container
```

**`<AICompleteState>`:**
```tsx
// Section order: executiveSummary, riskAssessment, leverageAnalysis,
//   [strengths + weaknesses side-by-side], recommendations, futureConsiderations,
//   personalizedGuidance
```

**Section components:**
- `<AIExecutiveSummary>` — `surface-sunken` + teal left border card
- `<AIStrengthsWeaknesses>` — 2-col grid, green card + amber card
- `<AIRecommendations>` — 3 numbered action cards in `surface-overlay`
- `<AIPersonalizedGuidance>` — prominent bottom callout, teal left border

---

### 2.8 `<VolatilitySlider>`

**File:** `components/forms/VolatilitySlider.tsx`
*(Already stubbed — implement)*

```typescript
interface VolatilitySliderProps {
  value: number;              // 0.0–1.0
  onChange: (value: number) => void;
  disabled?: boolean;
}
```

**Track color interpolation:**
```typescript
// Color stops: green(0.0) → amber(0.5) → red(1.0)
// Using CSS linear-gradient on the filled portion
function trackGradient(sigma: number): string {
  if (sigma <= 0.3) return `var(--optimal-mid)`;
  if (sigma <= 0.6) return `var(--caution-mid)`;
  return `var(--suboptimal-mid)`;
}
```

**Beta preview (right of label):**
```tsx
<span className="font-mono text-[12px] text-[--teal-vivid]">
  β = {(1 + value * 0.5).toFixed(3)}
</span>
```

**Label interpolation:**
```typescript
function getVolatilityLabel(sigma: number): { label: string; example: string } {
  // Finds closest VOLATILITY_LABELS entry
  const closest = VOLATILITY_LABELS.reduce((prev, curr) =>
    Math.abs(curr.value - sigma) < Math.abs(prev.value - sigma) ? curr : prev
  );
  return { label: closest.label, example: closest.example };
}
```

Uses Radix `Slider.Root` with custom styled track and thumb.

---

### 2.9 `<CFSubCalculator>`

**File:** `components/forms/CFSubCalculator.tsx`
*(Already stubbed — implement)*

```typescript
interface CFSubCalculatorProps {
  onResult: (CF_ratio: number) => void;
  defaultIncome?: number;
  defaultRepayment?: number;
}
```

**Internal state:** `useState` for monthlyIncome and monthlyRepayment strings.
**Computed:** `CF_ratio = parseFloat(income) / parseFloat(repayment)` — guarded against NaN/0.
**Live:** Updates `result` on every keystroke.
**Expand/collapse:** Controlled by parent via `isOpen` prop + Framer Motion `AnimatePresence`.

---

### 2.10 `<ScenarioPresetCard>`

**File:** `components/scenarios/ScenarioPresetCard.tsx`

```typescript
interface ScenarioPresetCardProps {
  preset: ScenarioPreset;
  result: ScenarioResult | null;  // null = not yet computed
  selected: boolean;
  onClick: (id: string) => void;
}
```

**States:**
- `result === null`: Show preset info only, no bottom result row
- `result !== null` + `!selected`: Show result row with L* delta and status badge
- `selected`: teal border + `--teal-ghost` background

**L* delta display:**
```typescript
const delta = result.delta.L_star;
const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "—";
const color = delta > 0 ? "var(--optimal-bright)" : delta < 0 ? "var(--suboptimal-bright)" : "var(--ink-tertiary)";
```

---

### 2.11 `<ScenarioComparisonChart>`

**File:** `components/scenarios/ScenarioChart.tsx`
*(Already stubbed — implement)*

```typescript
interface ScenarioComparisonChartProps {
  baseline: ScenarioResult;
  scenarios: ScenarioResult[];
  type: "lstar" | "headroom";
  highlightId?: string;       // ID of currently selected scenario
}
```

**Recharts setup:**
```tsx
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 24, left: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" strokeOpacity={0.3} />
    <XAxis dataKey="name" tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }} />
    <YAxis tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }} />
    <ReferenceLine y={baseline.outputs.debt_ratio * 100} stroke="var(--caution-mid)" strokeDasharray="4 4" label="Your ratio" />
    <ReferenceLine y={70} stroke="var(--ink-tertiary)" strokeDasharray="2 4" label="Hard cap" />
    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
      {chartData.map((entry) => (
        <Cell key={entry.name} fill={statusToColor(entry.status)} />
      ))}
    </Bar>
    <Tooltip content={<CustomTooltip />} />
  </BarChart>
</ResponsiveContainer>
```

**Custom tooltip:**
```typescript
interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: ChartPoint }[];
  label?: string;
}
// Renders surface-overlay card with scenario details
```

---

### 2.12 `<ScenarioSlider>`

**File:** `components/scenarios/ScenarioSlider.tsx`
*(Already stubbed — implement)*

```typescript
interface ScenarioSliderProps {
  config: ScenarioSliderConfig;
  onChange: (parameter: ScenarioParameter, value: number) => void;
}
```

Uses Radix Slider with bidirectional range (center = baseline, left = decrease, right = increase).

**Delta display:**
```typescript
const delta = config.currentValue - config.baselineValue;
const formatted = delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${formatInputForDisplay(delta, config.parameter as any)}`;
```

---

### 2.13 `<DistributionChart>`

**File:** `components/montecarlo/DistributionChart.tsx`
*(Already stubbed — implement)*

```typescript
interface DistributionChartProps {
  result: MonteCarloResult;
  highlightCurrentRatio?: boolean;  // default true
}
```

**Recharts BarChart with reference lines:**
```tsx
<ReferenceLine x={p50_bin} stroke="var(--teal-vivid)" strokeWidth={2} label="Median" />
<ReferenceLine x={p5_bin}  stroke="var(--ink-secondary)" strokeDasharray="3 3" label="P5" />
<ReferenceLine x={p95_bin} stroke="var(--ink-secondary)" strokeDasharray="3 3" label="P95" />
{highlightCurrentRatio && (
  <ReferenceLine x={debt_ratio_bin} stroke="var(--caution-mid)" strokeDasharray="4 4" label="Your ratio" />
)}
```

**Bar color:** based on `HistogramBin.status`:
```typescript
const binColor: Record<HistogramBin["status"], string> = {
  OPTIMAL:    "var(--optimal-mid)",
  CAUTION:    "var(--caution-mid)",
  SUBOPTIMAL: "var(--suboptimal-mid)",
  NEG_SPREAD: "var(--negspread-mid)",
  mixed:      "var(--border-strong)",
};
```

---

### 2.14 `<ProbabilityCard>`

**File:** `components/montecarlo/DistributionChart.tsx` (same file)

```typescript
interface ProbabilityCardProps {
  probability: number;        // 0–1
  status: "OPTIMAL" | "CAUTION" | "SUBOPTIMAL";
  label: string;
  sublabel: string;
}
```

---

### 2.15 `<PDFReportBuilder>`

**File:** `components/report/PDFReportBuilder.tsx`
*(Already stubbed — implement)*

```typescript
interface PDFReportBuilderProps {
  data: PDFReportData | null;
  onDownload: () => Promise<void>;
  isGenerating?: boolean;
}
```

Internal `useState` for section toggles:
```typescript
const [sections, setSections] = useState<Record<string, boolean>>({
  executiveSummary:   true,
  inputSummary:       true,
  equationWalkthrough: true,
  decisionResult:     true,   // non-toggleable
  financialScores:    true,
  aiRecommendations:  true,
  scenarioComparison: false,  // disabled if no scenarios
  monteCarlo:         false,  // disabled if no MC result
});
```

---

## LAYER 3 — PAGE ASSEMBLIES

### 3.1 `<AnalysisLayout>`

**File:** `components/layout/AnalysisLayout.tsx` *(new — to be created)*

```typescript
interface AnalysisLayoutProps {
  formColumn: React.ReactNode;
  resultsColumn: React.ReactNode;
}
```

Desktop: CSS Grid `grid-cols-[380px_1fr]` with `100dvh - 60px` height columns.
Mobile: Single column, `grid-cols-1`.
Form column: `border-r border-[--border-base] overflow-y-auto`.

---

### 3.2 `<EmptyResultsState>`

**File:** `components/results/EmptyResultsState.tsx` *(new)*

```typescript
interface EmptyResultsStateProps {
  variant: "empty" | "calculating";
}
```

- `empty`: centered placeholder with Calculator icon + instructional text
- `calculating`: skeleton overlays for each result component

---

### 3.3 `<ResultsStack>`

**File:** `components/results/ResultsStack.tsx` *(new)*

Assembles the full results column in order:
```tsx
export function ResultsStack({ outputs, steps, scores, aiState, onRegenerateAI }: ResultsStackProps) {
  return (
    <div className="flex flex-col gap-5">
      <DecisionBanner status={outputs.status} delta={outputs.intermediates.delta} beta={outputs.intermediates.beta} alpha={outputs.intermediates.alpha} />
      <KPIRow outputs={outputs} animated />
      <Card>
        <GaugeVisualization data={gaugeDataFromOutputs(outputs)} animated />
      </Card>
      <EquationWaterfall steps={steps} animated />
      <FinancialScoresPanel scores={scores} animated />
      <AIInsightPanel state={aiState} onRegenerate={onRegenerateAI} />
    </div>
  );
}
```

---

## CONTEXT & HOOKS

### Context: `OLTEEContext`

**File:** `lib/context.tsx` *(new — to be created)*

```typescript
interface OLTEEContextValue {
  state: OLTEEState;
  dispatch: React.Dispatch<OLTEEAction>;
  // Derived convenience methods
  hasBaseline: boolean;
  compute: (formValues: OLTEEFormValues) => Promise<void>;
  regenerateAI: () => Promise<void>;
  reset: () => void;
}

const OLTEEContext = createContext<OLTEEContextValue | null>(null);

export function OLTEEProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(olteeReducer, INITIAL_STATE);
  // ... compute, regenerateAI, reset implementations
  return <OLTEEContext.Provider value={...}>{children}</OLTEEContext.Provider>;
}

export function useOLTEEContext(): OLTEEContextValue {
  const ctx = useContext(OLTEEContext);
  if (!ctx) throw new Error("useOLTEEContext must be used within OLTEEProvider");
  return ctx;
}
```

**Context placement:** In `app/layout.tsx` wrapping all routes, so state persists across page navigation.

---

### Hook: `useOLTEE`

**File:** `hooks/useOLTEE.ts` *(implement the stub)*

```typescript
export function useOLTEE(): UseOLTEEReturn {
  const { state, dispatch, compute, regenerateAI, reset } = useOLTEEContext();

  return {
    state,
    hasResults: state.hasResults,
    isCalculating: state.isCalculating,
    inputs: state.inputs,
    outputs: state.outputs,
    equationSteps: state.equationSteps,
    scores: state.scores,
    aiStatus: state.aiState.status,
    aiInsights: state.aiState.insights,
    aiStream: state.aiState.rawStream,
    compute,
    reset,
    setActiveTab: (tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab }),
    regenerateAI,
  };
}
```

---

### Reducer: `olteeReducer`

**File:** `lib/reducer.ts` *(new — extracted from hook)*

```typescript
export function olteeReducer(state: OLTEEState, action: OLTEEAction): OLTEEState {
  switch (action.type) {
    case "SET_FORM_VALUES":
      return { ...state, formValues: action.payload };

    case "COMPUTE_RESULTS":
      return {
        ...state,
        isCalculating: false,
        hasResults: true,
        inputs: action.payload.inputs,
        outputs: action.payload.outputs,
        equationSteps: action.payload.steps,
        scores: action.payload.scores,
        // Reset AI on new computation
        aiState: { status: "idle", insights: {}, rawStream: "" },
      };

    case "SET_AI_STATUS":
      return { ...state, aiState: { ...state.aiState, status: action.payload } };

    case "APPEND_AI_STREAM":
      return {
        ...state,
        aiState: {
          ...state.aiState,
          status: "streaming",
          rawStream: state.aiState.rawStream + action.payload,
        },
      };

    case "SET_AI_INSIGHTS":
      return {
        ...state,
        aiState: { ...state.aiState, status: "complete", insights: action.payload },
      };

    case "SET_AI_ERROR":
      return {
        ...state,
        aiState: { ...state.aiState, status: "error", error: action.payload },
      };

    case "SET_SCENARIO_COMPARISON":
      return { ...state, scenarioComparison: action.payload };

    case "START_MONTE_CARLO":
      return { ...state, monteCarloRunning: true, monteCarloResult: null };

    case "SET_MONTE_CARLO_RESULT":
      return { ...state, monteCarloRunning: false, monteCarloResult: action.payload };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}
```

---

### Hook: `useScenario`

**File:** `hooks/useScenario.ts` *(implement the stub)*

```typescript
export function useScenario(baselineInputs: OLTEEInputs | null): UseScenarioReturn {
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [sliderConfigs, setSliderConfigs] = useState<ScenarioSliderConfig[]>([]);
  const [activePreset, setActivePreset] = useState<ScenarioPreset | null>(null);
  const [sensitivityAnalysis, setSensitivityAnalysis] = useState<SensitivityAnalysis | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  // Run all presets on mount when baselineInputs arrives
  useEffect(() => {
    if (!baselineInputs) return;
    const result = runAllPresetScenarios(baselineInputs);
    setComparison(result);
    setSliderConfigs(buildSliderConfigs(baselineInputs));
  }, [baselineInputs]);

  return {
    baseline: comparison?.baseline ?? null,
    comparison,
    sliderConfigs,
    activePreset,
    sensitivityAnalysis,
    isComputing,
    setBaseline: () => {}, // re-initialises from new baseline
    applyPreset: (preset) => {
      setActivePreset(preset);
      // Find result in comparison.scenarios by preset.id
    },
    adjustSlider: debounce((param, value) => {
      if (!baselineInputs) return;
      const modified = { ...baselineInputs, [param]: value };
      const result = computeScenarioResult(modified, comparison!.baseline, "Custom");
      setComparison(prev => prev ? { ...prev, scenarios: [...prev.scenarios.filter(s => s.label !== "Custom"), result] } : prev);
    }, 150),
    runAllPresets: () => {
      if (!baselineInputs) return;
      setComparison(runAllPresetScenarios(baselineInputs));
    },
    runSensitivityAnalysis: (param) => {
      if (!baselineInputs) return;
      setSensitivityAnalysis(runSensitivityAnalysis(baselineInputs, param));
    },
    resetToBaseline: () => {
      if (!baselineInputs) return;
      setComparison(runAllPresetScenarios(baselineInputs));
      setActivePreset(null);
      setSliderConfigs(buildSliderConfigs(baselineInputs));
    },
  };
}
```

---

### Hook: `useMonteCarlo`

**File:** `hooks/useMonteCarlo.ts` *(implement the stub)*

```typescript
export function useMonteCarlo(): UseMonteCarloReturn {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<MonteCarloConfig>(buildConfig());
  const cancelRef = useRef(false);

  return {
    result, isRunning, progress, error, config,
    run: async (inputs, configOverride) => {
      cancelRef.current = false;
      setIsRunning(true);
      setProgress(0);
      setError(null);
      try {
        const result = await runMonteCarloSimulationAsync(
          inputs,
          { ...config, ...configOverride },
          (p) => {
            if (cancelRef.current) return;
            setProgress(p);
          }
        );
        if (!cancelRef.current) setResult(result);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsRunning(false);
        setProgress(0);
      }
    },
    cancel: () => { cancelRef.current = true; setIsRunning(false); },
    updateConfig: (partial) => setConfig(prev => ({ ...prev, ...partial })),
    reset: () => { setResult(null); setProgress(0); setError(null); },
  };
}
```

---

### Hook: `useCountUp`

**File:** `hooks/useCountUp.ts` *(implement the stub)*

```typescript
export function useCountUp({ target, duration = 1200, delay = 0, decimals = 1, easing = "easeOut" }: UseCountUpOptions): UseCountUpReturn {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target);
      return;
    }

    const startAnimation = () => {
      setIsAnimating(true);
      startRef.current = undefined;

      const animate = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp;
        const elapsed = timestamp - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easing === "easeOut" ? 1 - Math.pow(1 - progress, 3) : progress;
        setCurrent(target * eased);
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
    };

    const timer = setTimeout(startAnimation, delay);
    return () => {
      clearTimeout(timer);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay, easing]);

  return {
    current,
    isAnimating,
    formatted: current.toFixed(decimals),
  };
}
```

---

## UTILITY FUNCTIONS TO IMPLEMENT

### `lib/engine.ts` — Full implementation

```typescript
export function computeOLTEE(inputs: OLTEEInputs): OLTEEOutputs {
  const debt_ratio = inputs.D / inputs.A;                    // Eq 1
  const delta = inputs.ROI - inputs.r;                       // Eq 2
  const alpha = 1 - inputs.T;                               // Eq 3
  const beta = 1 + (inputs.sigma * FORMULA.BETA_MULTIPLIER); // Eq 4

  // NEG_SPREAD guard
  if (delta <= 0) {
    return {
      L_star: 0,
      debt_ratio,
      status: "NEG_SPREAD",
      headroom_SAR: 0,
      cap_applied: false,
      intermediates: { debt_ratio, delta, alpha, beta, numerator: 0, denominator: 0, L_raw: 0 },
    };
  }

  const numerator = delta * alpha;                           // Eq 5a
  const denominator = inputs.r * beta * (1 / inputs.CF_ratio); // Eq 5b
  const L_raw = numerator / denominator;                     // Eq 5c
  const L_star = Math.min(L_raw, FORMULA.HARD_CAP);         // min(raw, 0.70)
  const cap_applied = L_raw > FORMULA.HARD_CAP;

  const status = computeStatus(debt_ratio, L_star);
  const headroom_SAR = computeHeadroom(L_star, inputs.A, inputs.D);

  return {
    L_star, debt_ratio, status, headroom_SAR, cap_applied,
    intermediates: { debt_ratio, delta, alpha, beta, numerator, denominator, L_raw },
  };
}

export function computeStatus(debt_ratio: number, L_star: number): LeverageStatus {
  const cautionStart = L_star * FORMULA.CAUTION_FACTOR;
  if (debt_ratio < cautionStart) return "OPTIMAL";
  if (debt_ratio < L_star) return "CAUTION";
  return "SUBOPTIMAL";
}

export function computeHeadroom(L_star: number, A: number, D: number): number {
  return Math.max(0, L_star * A - D);
}
```

### `lib/scores.ts` — Score formula implementation

```typescript
export function computeScores(inputs: OLTEEInputs, outputs: OLTEEOutputs): FinancialScores {
  const { CF_ratio, sigma } = inputs;
  const { debt_ratio, L_star, intermediates, status } = outputs;
  const { delta } = intermediates;

  // Financial Stability: CF_ratio (0.5–5.0 → 0–100) weighted 60%, sigma penalty 40%
  const cfScore = clamp((CF_ratio - 0.5) / 4.5, 0, 1) * 100;
  const sigmaScore = (1 - sigma) * 100;
  const stability = round(cfScore * 0.6 + sigmaScore * 0.4);

  // Debt Health: spread quality + headroom buffer
  const spreadScore = status === "NEG_SPREAD" ? 0 : clamp(delta / 0.15, 0, 1) * 100;
  const buffer = L_star > 0 ? clamp(1 - debt_ratio / L_star, 0, 1) * 100 : 0;
  const debtHealth = round(status === "NEG_SPREAD" ? 0 : spreadScore * 0.5 + buffer * 0.5);

  // Leverage Efficiency: how much of L* capacity is being used productively
  const rawRatio = outputs.cap_applied
    ? clamp((outputs.intermediates.L_raw - 0.70) / 1.0, 0, 1)  // how far above cap
    : clamp(outputs.intermediates.L_raw / 2.0, 0, 1);           // raw / 2.0 normalised
  const efficiency = round(status === "NEG_SPREAD" ? 0 : rawRatio * 100);

  // Financial Resilience: shock absorption — buffer + CF + beta penalty
  const headroomPct = L_star > 0 ? clamp((L_star - debt_ratio) / L_star, 0, 1) : 0;
  const betaPenalty = clamp((intermediates.beta - 1.0) / 0.5, 0, 1);
  const resilience = round(
    status === "NEG_SPREAD" ? 0
      : headroomPct * 50 + (cfScore / 100) * 30 + (1 - betaPenalty) * 20
  );

  return { stability, debtHealth, efficiency, resilience };
}
```

---

## IMPLEMENTATION SEQUENCE

Each item is a single PR / commit unit. Items within a phase can be parallelised.

### Phase A — Core Engine (no UI, pure logic)
```
A1. lib/engine.ts         — computeOLTEE + all helpers
A2. lib/scores.ts         — computeScores + all score functions
A3. lib/validation.ts     — already complete; verify with test values
A4. lib/formatting.ts     — already complete; verify edge cases
A5. lib/montecarlo.ts     — Box-Muller, sampleNormalClamped, runMCSimulationAsync
A6. lib/scenarios.ts      — applyScenarioOverrides, runAllPresetScenarios, sensitivity
A7. lib/reducer.ts        — olteeReducer (extract to own file)
A8. lib/utils.ts          — already complete
```

### Phase B — Primitives (Layer 1, no domain types)
```
B1. components/ui/Button.tsx
B2. components/ui/Card.tsx
B3. components/ui/Badge.tsx
B4. components/ui/MetricDisplay.tsx
B5. components/ui/FieldInput.tsx
B6. components/ui/StatusRing.tsx
B7. components/ui/ProgressBar.tsx
B8. components/ui/TooltipIcon.tsx
B9. components/ui/Skeleton.tsx
B10. components/ui/Divider.tsx + SectionLabel.tsx
```

### Phase C — Context & Hooks
```
C1. lib/context.tsx        — OLTEEProvider + useOLTEEContext
C2. hooks/useOLTEE.ts      — implement (uses context)
C3. hooks/useCountUp.ts    — implement
C4. hooks/useScenario.ts   — implement
C5. hooks/useMonteCarlo.ts — implement
C6. app/layout.tsx         — wrap with OLTEEProvider + font loading
```

### Phase D — Domain Components (Layer 2)
```
D1.  components/engine/LiveEquationDisplay.tsx  — hero + live form variant
D2.  components/forms/VolatilitySlider.tsx      — Radix Slider + interpolation
D3.  components/forms/CFSubCalculator.tsx       — collapsible sub-form
D4.  components/forms/AnalysisForm.tsx          — 7-field RHF form
D5.  components/results/DecisionBanner.tsx      — 4 status states + animation
D6.  components/results/KPIRow.tsx              — 3 animated metric cards
D7.  components/results/GaugeVisualization.tsx  — SVG arc + Framer needle
D8.  components/results/EquationWaterfall.tsx   — 9-step table + collapse
D9.  components/results/FinancialScores.tsx     — 4 score rings
D10. components/ai/AIInsightPanel.tsx           — all 5 AI states
D11. components/ai/StreamingText.tsx            — cursor blink
D12. components/scenarios/ScenarioPresetCard.tsx
D13. components/scenarios/ScenarioSlider.tsx
D14. components/scenarios/ScenarioChart.tsx     — Recharts BarChart + tooltip
D15. components/montecarlo/DistributionChart.tsx — histogram + probability cards
D16. components/report/PDFReportBuilder.tsx     — toggles + preview + download
```

### Phase E — Page Assemblies (Layer 3)
```
E1.  components/layout/Navigation.tsx           — nav bar + mobile drawer
E2.  components/layout/Footer.tsx
E3.  components/layout/AnalysisLayout.tsx       — 2-col desktop / 1-col mobile
E4.  components/results/EmptyResultsState.tsx   — idle + calculating states
E5.  components/results/ResultsStack.tsx        — assembles all result components
E6.  components/landing/Hero.tsx                — animated hero section
E7.  components/landing/Features.tsx            — 4-card grid
```

### Phase F — Pages
```
F1. app/page.tsx            — Landing (Hero + Features + HowItWorks + Ahmad + CTA)
F2. app/analyze/page.tsx    — AnalysisLayout: form col + results col
F3. app/scenarios/page.tsx  — ScenarioLab + guard redirect
F4. app/montecarlo/page.tsx — MonteCarloPanel + guard redirect
F5. app/report/page.tsx     — PDFReportBuilder + guard redirect
F6. app/api/ai-insights/route.ts — streaming API endpoint
```

### Phase G — Library & Report
```
G1. lib/ai.ts   — already complete; wire up in API route
G2. lib/pdf.ts  — jsPDF full implementation (9 sections)
```

---

## DEPENDENCY GRAPH

```
A (Engine) ──────────────────────────────────┐
                                              │
B (Primitives) ──────────────────────────────┤
                                              │
C (Context/Hooks) ← depends on A ────────────┤
                                              │
D (Domain Components) ← depends on A, B, C ──┤
                                              │
E (Page Assemblies) ← depends on B, C, D ────┤
                                              │
F (Pages) ← depends on A, C, D, E ──────────┘
                                              │
G (Lib/PDF) ← depends on A (types only) ────-┘
```

A must be complete before C.
B can proceed in parallel with A.
D cannot start until A, B, C are all done.
F cannot start until D, E are done.

---

## TESTING STRATEGY

### Unit tests (Jest, no React): A-phase only
```typescript
// engine.test.ts — Ahmad's case from spec document
test("Ahmad optimal case", () => {
  const inputs: OLTEEInputs = {
    ROI: 0.12, r: 0.05, T: 0.15, sigma: 0.20,
    CF_ratio: 1.35, D: 550_000, A: 920_000,
  };
  const output = computeOLTEE(inputs);
  expect(output.L_star).toBe(0.70);            // capped
  expect(output.status).toBe("OPTIMAL");
  expect(output.debt_ratio).toBeCloseTo(0.598, 3);
  expect(output.headroom_SAR).toBe(94_000);
  expect(output.intermediates.delta).toBeCloseTo(0.07, 3);
  expect(output.intermediates.alpha).toBeCloseTo(0.85, 3);
  expect(output.intermediates.beta).toBeCloseTo(1.10, 3);
  expect(output.intermediates.numerator).toBeCloseTo(0.05950, 4);
  expect(output.intermediates.denominator).toBeCloseTo(0.04074, 4);
  expect(output.intermediates.L_raw).toBeCloseTo(1.460, 3);
  expect(output.cap_applied).toBe(true);
});

test("NEG_SPREAD guard", () => {
  const inputs: OLTEEInputs = { ROI: 0.04, r: 0.06, T: 0.15, sigma: 0.20, CF_ratio: 1.35, D: 550_000, A: 920_000 };
  const output = computeOLTEE(inputs);
  expect(output.status).toBe("NEG_SPREAD");
  expect(output.L_star).toBe(0);
});
```

### Visual regression: Phase D components via Storybook
- Story per component, per state variant
- Ahmad's case as the default story data

---

## FILE ADDITIONS TO EXISTING STRUCTURE

New files required (not in the existing architecture):

```
components/
  ui/
    Button.tsx         (new)
    Card.tsx           (new)
    Badge.tsx          (new)
    MetricDisplay.tsx  (new)
    FieldInput.tsx     (new)
    StatusRing.tsx     (new)
    ProgressBar.tsx    (new)
    TooltipIcon.tsx    (new)
    Skeleton.tsx       (new)
    Divider.tsx        (new)
    SectionLabel.tsx   (new)
  engine/
    LiveEquationDisplay.tsx  (new — replaces empty index.ts)
  layout/
    AnalysisLayout.tsx  (new)
  results/
    EmptyResultsState.tsx  (new)
    ResultsStack.tsx       (new)
  scenarios/
    ScenarioPresetCard.tsx  (new)

lib/
  context.tsx    (new — OLTEEProvider)
  reducer.ts     (new — extracted from hook)

hooks/
  (all 4 existing stubs need full implementation)
```

---

*Component architecture complete. Ready for Phase A implementation.*  
*All contracts are directly derivable from this document — no design decisions remain.*
