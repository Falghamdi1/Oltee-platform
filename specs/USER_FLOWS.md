# OLTEE — User Flow Specification
## Complete Interaction Maps · All States · All Transitions
**Author:** Faisal Alghamdi | **Version:** 1.0

---

## APPLICATION STATE MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL APP STATE                             │
│                                                                 │
│  baseline: OLTEEInputs | null                                   │
│  outputs:  OLTEEOutputs | null                                  │
│  scores:   FinancialScores | null                               │
│  aiState:  idle | loading | streaming | complete | error        │
│  scenarios: ScenarioComparison | null                           │
│  mcResult: MonteCarloResult | null                              │
└─────────────────────────────────────────────────────────────────┘
         │
         ├── baseline = null  →  Gates: /scenarios /montecarlo /report
         │
         └── baseline ≠ null  →  All routes accessible
```

---

## FLOW 1 — PRIMARY FIRST-TIME USER

```
[Browser opens /]
        │
        ▼
[Landing page renders]
   • Hero equation display
   • Feature highlights
   • Ahmad worked example
   • "Analyze your leverage →" CTA
        │
        │ [User clicks CTA]
        ▼
[/analyze — EMPTY state]
   • Form column: all fields blank (defaults applied: T=15%, σ=0.20)
   • Results column: empty state placeholder
   • Live equation display: all terms dimmed
        │
        │ [User fills ROI = "12"]
        ▼
[ROI field validates on blur]
   • If valid: ROI term in equation turns teal
   • Δ preview appears only once r is also filled
   • No state change yet
        │
        │ [User fills r = "5"]
        ▼
[r field validates, Δ preview appears]
   • "Spread: +7.0%" badge appears next to ROI label — green
   • r term in equation turns teal
   • Both terms lit in equation display
        │
        │ [User fills T = "15" (or leaves blank for default)]
        │ [User adjusts σ slider to 0.20]
        │ [User enters CF_ratio = "1.35" or uses sub-calculator]
        │ [User fills D = "550000"]
        │ [User fills A = "920000"]
        ▼
[All fields valid — equation display shows full L* value]
   • All terms in equation: teal
   • "= 70.0%" appears at right of equation with scale-in animation
        │
        │ [User clicks "Calculate L* →"]
        ▼
[CALCULATING state]
   • Button: "Calculating…" + spinner
   • Results column: skeleton shimmer overlays
   • Form: inputs remain editable (no lock)
   • Duration: ~50ms (pure sync JS computation)
        │
        ▼
[RESULTS state — first computation complete]
   • DecisionBanner animates in (scale 0.96 → 1.0, 500ms)
   • KPIRow cards stagger in (0ms / 80ms / 160ms delay)
   • Gauge needle springs to position (600ms)
   • EquationWaterfall rows stagger in (30ms per row)
   • FinancialScores rings fill (staggered 100ms apart)
   • AI panel transitions: idle → loading (400ms pause) → streaming
        │
        │ [AI streaming active]
        ▼
[AI_STREAMING state]
   • Characters appear in real-time from Anthropic API
   • Cursor blinks at end of current text
   • Section headers appear as JSON boundaries detected
        │
        │ [Stream completes — all 8 sections rendered]
        ▼
[AI_COMPLETE state]
   • Cursor disappears
   • "Regenerate" button appears in AI panel header
   • User reads full analysis
        │
        │ [User clicks "Scenario Lab" in nav]
        ▼
[/scenarios — baseline auto-loaded]
   (→ See Flow 2)
```

---

## FLOW 2 — SCENARIO LAB EXPLORATION

```
[/scenarios — BASELINE_ONLY state]
   • Baseline bar shows OPTIMAL / L* 70.0% / DR 59.8% / SAR 94K
   • Preset grid: all 8 cards show computed results (instant)
   • Sliders: all at center (no change applied)
   • Charts: empty (no scenarios selected yet)
        │
        │ [User clicks "Rate hike +2%" preset card]
        ▼
[PRESET_ACTIVE state]
   • Selected card: teal border + ghost background
   • Comparison chart animates in:
     - Baseline bar (teal, 60% opacity)
     - Scenario bar (amber — CAUTION)
   • Headroom chart: shows reduction
   • AI commentary: fetches and fades in ("2-sentence AI commentary...")
        │
        │ [User clicks "Rate hike +5%" card (second selection)]
        ▼
[MULTI_PRESET state (2 selected)]
   • Both cards highlighted
   • "Compare selected (2) →" button appears above grid
   • Chart now shows: Baseline / Rate+2% / Rate+5% bars side by side
        │
        │ [User adjusts "Interest rate" slider to +3.5%]
        ▼
[CUSTOM_SCENARIO state]
   • Preset selections remain (visual only) but slider overrides computation
   • New bar added to chart: "Custom" (dashed border style)
   • Live recalculation debounced 150ms
        │
        │ [User clicks "Run sweep →" for sensitivity analysis]
        ▼
[SENSITIVITY_RUNNING state]
   • 50 OLTEE computations across r range (instant, sync)
   • SensitivityChart renders: L* curve across r values
   • Inflection point marked: "Status changes at r = 7.2%"
        │
        │ [User clicks "Reset all →"]
        ▼
[BASELINE_ONLY state — restored]
```

---

## FLOW 3 — MONTE CARLO SIMULATION

```
[/montecarlo — NOT_RUN state]
   • Config panel: 10,000 iterations selected by default
   • Run button: enabled, primary teal
   • Results area: empty state — "Click Run simulation to analyze futures"
        │
        │ [User selects "50,000" iterations]
        │ [User expands advanced settings]
        │ [User adjusts σ_ROI slider to 0.05]
        │ [User clicks "Run simulation — 50,000 scenarios →"]
        ▼
[RUNNING state]
   • Button replaced by: progress bar + "Simulating… 0% of 50,000 scenarios"
   • "Cancel" ghost button visible
   • Progress updates every 500ms (yieldToEventLoop between batches)
   • Duration: ~2–3 seconds for 50,000 iterations on average hardware
        │
        │ [Progress reaches 100%]
        ▼
[COMPLETE state]
   • Progress bar replaced by run button (re-run capability)
   • 3 probability cards scale in with stagger
   • Distribution histogram bars animate up from zero (600ms stagger)
   • Confidence range bar fills from left to right
   • AI summary: 500ms delay, then text appears
        │
        │ [User changes iteration count to 1,000]
        ▼
[NOT_RUN state — config changed]
   • Results area cleared
   • Run button re-enabled
   • Toast: "Change settings and run again to update results"
        │
        │ [User clicks "Cancel" during simulation]
        ▼
[NOT_RUN state — cancelled]
   • Toast: "Simulation cancelled."
```

---

## FLOW 4 — REPORT GENERATION

```
[/report — CONFIGURE state]
   • All available toggles ON by default
   • Scenario/MC sections disabled if not run
   • Preview shows cover page mockup
   • Page count: "Estimated 5 pages"
        │
        │ [User toggles "AI Recommendations" OFF]
        ▼
[CONFIGURE state — updated]
   • Toggle switches OFF
   • Page count updates: "Estimated 4 pages"
   • Preview TOC: recommendation row grayed out
        │
        │ [User clicks "Copy link"]
        ▼
[URL_COPIED state]
   • Clipboard write executes
   • Button text briefly: "Copied! ✓"
   • Toast: "Shareable link copied. Anyone with this link can load your analysis."
   • Reverts to "Copy link" after 2 seconds
        │
        │ [User clicks "Download PDF"]
        ▼
[GENERATING state]
   • Button: "Generating…" + spinner (disabled)
   • jsPDF compiles document sections
   • Duration: ~800ms–2s depending on content
        │
        │ [PDF ready]
        ▼
[GENERATED state]
   • Browser auto-download triggered
   • Button: returns to "Download PDF" (enabled)
   • Toast: "Report downloaded — oltee-report-2024-01-15-optimal.pdf"
```

---

## FLOW 5 — SHARED LINK LOAD

```
[Browser opens /analyze?roi=12&r=5&t=15&sigma=0.20&cf=1.35&d=550000&a=920000]
        │
        ▼
[Page mounts — URL params detected]
   • Form fields populated from params
   • Toast (bottom-center): "Analysis loaded from shared link."
   • Auto-computation triggers immediately (no user click required)
        │
        ▼
[CALCULATING → RESULTS — same as primary flow]
   • All result components animate in
   • AI streaming begins automatically
        │
        │ [User edits a field]
        ▼
[Form dirty state]
   • URL params no longer active
   • No toast — just allows normal editing
```

---

## FLOW 6 — NEGATIVE SPREAD (ERROR STATE)

```
[/analyze]
   • User enters ROI = "4" (4%)
   • User enters r = "6" (6%)
        │
        ▼
[r field blur — Δ preview appears]
   • "Spread: −2.0%" badge — red / `suboptimal-bright`
   • Warning tooltip: "Your return is below your interest rate"
        │
        │ [User clicks Calculate]
        ▼
[NEG_SPREAD results]
   • Engine guard triggers: returns status = NEG_SPREAD before full calc
   • DecisionBanner: deep crimson, XCircle icon
     "Negative spread — Investment return is below loan cost. Borrowing destroys value."
   • KPI cards:
     - Current ratio: still shows 59.8%
     - Safe ceiling: "0.0%" — suboptimal color
     - Headroom: "SAR 0"
   • Gauge: entire arc crimson, no needle, center shows "−"
   • Equation waterfall:
     - Step 2: Δ = −2.0% highlighted red
     - Steps 5–9: show NEG_SPREAD early exit annotation
   • Scores: all at 0 or minimum values
   • AI panel: streams crisis-mode insight — explains what negative spread means
        │
        │ [User edits ROI upward to "8"]
        ▼
[Δ preview updates: "Spread: +3.0%"]
   • Warning cleared
        │
        │ [User clicks Calculate]
        ▼
[New result: OPTIMAL / CAUTION / SUBOPTIMAL depending on inputs]
   • Full animation cycle restarts
```

---

## FLOW 7 — VALIDATION ERRORS

```
[/analyze — user submits with missing/invalid fields]
        │
        │ [ROI field left empty, clicks Calculate]
        ▼
[Validation runs — errors shown]
   • ROI input: border turns suboptimal-border
   • Error text below: "Annual return is required"
   • Lucide AlertCircle icon in error text
   • Form does NOT submit — no calculation
   • Smooth scroll to first error field
        │
        │ [User enters ROI = "12", but A = "400000" while D = "550000"]
        ▼
[Cross-field validation error]
   • Both D and A inputs: suboptimal-border
   • Error below A field: "Total assets must exceed total debt."
        │
        │ [User corrects A to "920000"]
        ▼
[Error cleared — both fields normal border]
   • Calculate button re-enables
```

---

## FLOW 8 — MOBILE USER

```
[/ (mobile) — hero visible, equation display below fold]
        │
        │ [Taps "Analyze your leverage →"]
        ▼
[/analyze (mobile) — single column]
   • Form at top, full-width fields
   • Keyboard-aware: focused fields scroll above keyboard
   • Sticky "Calculate L* →" bar at viewport bottom
        │
        │ [User fills all fields]
        │ [Taps sticky Calculate button]
        ▼
[CALCULATING — skeleton overlays below form]
        │
        ▼
[RESULTS — page auto-scrolls to DecisionBanner]
   • Banner: 72px (compact), no Δ/β/α indicator (desktop-only)
   • KPI cards: single column stack
   • Gauge: 240×134px (smaller SVG, same proportions)
   • Waterfall: collapsed by default, "Show calculation →" toggle
   • Score rings: 2×2 grid (compact 64px rings)
   • AI panel: full-width, streaming as normal
        │
        │ [User taps hamburger menu]
        ▼
[Nav drawer slides down (200ms)]
   • "Analyze" (current)
   • "Scenario Lab" (enabled — baseline exists)
   • "Monte Carlo" (enabled)
   • "Report" (enabled)
        │
        │ [User taps "Scenario Lab"]
        ▼
[Drawer closes (100ms) → /scenarios]
```

---

## FLOW 9 — GUARDED NAVIGATION

```
[User bookmarks /scenarios — no session data]
        │
        ▼
[/scenarios mounts]
   • Middleware/page check: baseline = null in session
   • Redirect: router.push('/analyze')
   • Toast: "Run an analysis on the Analyze page first."
        │
        ▼
[/analyze — EMPTY state]
   • Toast visible for 4 seconds at bottom-center
```

---

## COMPONENT INTERACTION MAP

```
AnalysisForm
  │ onSubmit(formValues)
  ▼
useOLTEE.compute(formValues)
  ├── validate(formValues)           → ValidationResult
  ├── formToEngineInputs(validated)  → OLTEEInputs
  ├── checkEngineGuards(inputs)      → EngineGuard
  ├── computeOLTEE(inputs)          → OLTEEOutputs
  ├── buildEquationSteps(inputs, outputs) → EquationStep[]
  ├── computeScores(inputs, outputs) → FinancialScores
  └── dispatch(COMPUTE_RESULTS)
          │
          ├── → DecisionBanner (status)
          ├── → KPIRow (outputs)
          ├── → GaugeVisualization (outputs)
          ├── → EquationWaterfall (steps)
          ├── → FinancialScoresPanel (scores)
          └── → triggers AI fetch

AI fetch (auto, after results):
  fetch('/api/ai-insights', { inputs, outputs, scores })
    │
    ▼
  ReadableStream (Anthropic API)
    │
    ├── onChunk: dispatch(APPEND_AI_STREAM, chunk)
    │     └── → StreamingText renders new chars
    └── onComplete: dispatch(SET_AI_INSIGHTS, parsed)
          └── → AIInsightPanel renders 8 sections

ScenarioLab:
  useScenario(baselineInputs)
    ├── applyPreset(preset) → modified OLTEEInputs
    ├── computeOLTEE(modified) → ScenarioResult
    └── → ScenarioChart updates

MonteCarlo:
  useMonteCarlo()
    ├── run(baselineInputs, config)
    │     ├── [10,000 iterations, batched with yield]
    │     ├── onProgress(n/total) → ProgressBar updates
    │     └── → MonteCarloResult
    └── → DistributionChart + ProbabilityCards

Report:
  PDFReportBuilder
    ├── reads: inputs, outputs, scores, aiInsights, scenarios?, mcResult?
    ├── onDownload → generatePDFReport(data) → Blob
    └── downloadReport(data) → browser download
```

---

## ERROR BOUNDARIES

### API Failure (Anthropic timeout or 500):
- AIInsightPanel shows error state: "Unable to generate insights at this time."
- "Try again" button re-triggers the API call
- Calculation results remain visible — AI is additive, not blocking

### Monte Carlo Worker Crash:
- useMonteCarlo catches error, returns to NOT_RUN state
- Toast: "Simulation failed. Please try again."
- Calculation remains visible

### PDF Generation Failure:
- Error caught in PDFReportBuilder
- Toast: "Unable to generate report. Your analysis data is intact."
- Console.error for debugging

### Network Offline (no Anthropic API):
- Engine computation still works (pure JS)
- AI panel shows: "AI insights require an internet connection."
- All other features fully functional

---

## LOADING TIME TARGETS

| Action | Target | Notes |
|--------|---------|-------|
| OLTEE engine computation | < 5ms | Synchronous JS |
| Score computation | < 2ms | Synchronous JS |
| Monte Carlo 10K | < 1.5s | Batched with yields |
| Monte Carlo 50K | < 4s | |
| AI insight first token | < 1.5s | Anthropic API |
| AI insight full stream | < 8s | ~500 tokens |
| PDF generation | < 2s | jsPDF |
| Page initial load | < 1.5s | Next.js SSR |
| Scenario computation (all 8) | < 20ms | Synchronous JS |

---

*All user flows are implementation-ready.*  
*State machines map directly to OLTEEAction union in types/oltee.ts.*
