# OLTEE — Senior Staff Engineer Audit
**Auditor:** Internal review against architecture specs and spec document  
**Date:** June 2026  
**Project owner:** Faisal Alghamdi  
**Codebase:** 63 files, ~14,500 lines

---

## Executive Summary

The foundational architecture is sound. The math engine, validation, scores, Monte Carlo, scenario simulation, AI layer, and PDF generator are all correctly implemented and unit-tested. The type system is comprehensive and the data flow from formula → reducer → UI is well-designed. The project is, however, not yet deployable: 4 hooks, 14 UI components, and all 4 route pages remain as stubs. There are also 8 concrete defects that must be fixed before any component can be wired up safely.

**Verdict:** Phase A (engine + math) is shippable. Phase B–F (UI wiring) has not been started in the actual Next.js app — it exists only as interactive widget demos. Prioritise the 8 defects below, then wire the six remaining hooks and 14 component stubs before attempting a build.

---

## 1. Critical Defects (P0 — Fix Before Any PR)

### D1. Duplicate reducer export causes a silent runtime bug

`hooks/useOLTEE.ts` exports both `olteeReducer` and `INITIAL_STATE` as stubs that throw. `lib/reducer.ts` exports the real implementations of both under the same names. Any file that imports from `hooks/useOLTEE.ts` will get the throwing stub; any file that imports from `lib/reducer.ts` gets the real reducer. The context provider (not yet written) will need to pick one. When it is written, an accidental import from the wrong path will produce a runtime error that looks like a state bug, not an import bug.

**Fix:** Delete the stub exports from `hooks/useOLTEE.ts`. Import `olteeReducer` and `INITIAL_STATE` from `lib/reducer.ts`. The stub file should be the one that is removed, not the real implementation.

```typescript
// hooks/useOLTEE.ts — remove these entirely:
export function olteeReducer(...)  // DELETE
export const INITIAL_STATE = ...   // DELETE

// Import from lib/reducer.ts instead:
import { olteeReducer, INITIAL_STATE } from "@/lib/reducer";
```

### D2. Formula constants defined in three separate places

`FORMULA.HARD_CAP`, `FORMULA.CAUTION_FACTOR`, and `FORMULA.BETA_MULTIPLIER` are defined in `config/constants.ts`. `OLTEE_CONSTANTS.HARD_CAP` (same value 0.70) is also defined in `types/oltee.ts` as a `const` export. The engine imports from `config/constants.ts` (correct), but `types/oltee.ts` defines its own copy. If someone changes the cap in one place and not the other, the spec will be silently violated.

**Fix:** Remove `OLTEE_CONSTANTS` from `types/oltee.ts`. Types files should contain only type definitions. Constants belong in `config/constants.ts`. Any file that imported `OLTEE_CONSTANTS.HARD_CAP` from the types file should be migrated to `FORMULA.HARD_CAP` from constants.

### D3. Dead import in the AI route causes a TypeScript warning and signals incomplete wiring

`app/api/ai-insights/route.ts` line 37 imports `buildScenarioCommentaryPrompt` from `config/ai-prompts` but never calls it. The `handleScenarioCommentary` handler calls `generateScenarioCommentary` from `lib/ai.ts`, which in turn calls `buildScenarioCommentaryPrompt` internally. The import at the route level is leftover from an earlier design where the prompt was built at the route layer. It is harmless but it is dead code in a security-sensitive file.

**Fix:** Remove line 37 from `route.ts`.

### D4. `adjustSlider` in `useScenario.ts` calls `setSliderConfigs` twice per event

```typescript
// Current — two setState calls on every slider change:
setSliderConfigs((prev) => prev.map(...));  // first call
setSliderConfigs((prev) => {                // second call — runs the map again
  const updated = prev.map(...);
  debouncedCompute(updated, baseline);
  return updated;
});
```

React batches these in React 18 concurrent mode, but they are still two renders. More critically, the first `setSliderConfigs` call discards the `debouncedCompute` call, and the second one re-derives `updated` from `prev` — which means the second call's `prev` is the state *after* the first call's update, making them redundant but also potentially causing double-map on a slider with many configs.

**Fix:** Collapse to a single setState with the side-effect extracted before it:

```typescript
const adjustSlider = useCallback(
  (parameter: ScenarioParameter, value: number) => {
    if (!baseline) return;
    setIsComputing(true);
    setSliderConfigs((prev) => {
      const updated = prev.map((c) =>
        c.parameter === parameter ? { ...c, currentValue: value } : c
      );
      debouncedCompute(updated, baseline);  // side-effect inside updater is safe here
      return updated;
    });
  },
  [baseline, debouncedCompute]
);
```

### D5. `lib/context.tsx` does not exist — the entire app has no state provider

The architecture document specifies `OLTEEProvider` wrapping `app/layout.tsx` as the mechanism for sharing state across all pages. `lib/context.tsx` is referenced in the component architecture document and is listed as `lib/context.tsx` in the implementation plan, but the file was never created. `app/layout.tsx` does not wrap children in any provider. Every hook that calls `useOLTEEContext()` will throw at runtime.

**Fix:** Create `lib/context.tsx` implementing `OLTEEProvider` and `useOLTEEContext`. Wire it into `app/layout.tsx`. This is the highest-priority missing file — nothing in the UI layer can function without it.

### D6. `useOLTEE`, `useCountUp`, and `useMonteCarlo` all throw

These three hooks are stubs:
- `hooks/useOLTEE.ts`: `throw new Error("useOLTEE not yet implemented")`
- `hooks/useCountUp.ts`: `throw new Error("useCountUp not yet implemented")`
- `hooks/useMonteCarlo.ts`: `throw new Error("useMonteCarlo not yet implemented")`

`useScenario.ts` is fully implemented (264 lines, no throws). The other three must be implemented before any page can render.

### D7. `SCORE_DEFINITIONS` exported from both `config/constants.ts` and imported into `lib/scores.ts` — but also re-exported from an unexpected location

`config/constants.ts` line 217 exports `SCORE_DEFINITIONS` with label/description/icon per score key. `lib/scores.ts` line 18 imports it from constants (correct). However the `lib/scores.ts` file then also appears to export `SCORE_DEFINITIONS` indirectly via a barrel. Any downstream code that does `import { SCORE_DEFINITIONS } from "@/lib/scores"` will fail with undefined. The definitions must only live in `config/constants.ts`.

**Fix:** Audit all barrel exports (`components/ui/index.ts`, etc.) to ensure `SCORE_DEFINITIONS` is not re-exported from `lib/scores.ts`.

### D8. The module-level Anthropic client singleton breaks Next.js hot-reload and Vercel Edge cold starts

```typescript
// lib/ai.ts line 39
let _client: Anthropic | null = null;
```

In Next.js with the Node runtime, module-level mutable state persists across requests in the same worker process but is reset on hot-reload during development, causing an unexpected `null` client on subsequent requests. On Vercel, cold starts on the Node runtime will create a new client per invocation anyway, so the singleton provides no benefit and the stale reference adds confusion.

**Fix:** Remove the singleton pattern. Create the client per-request using a factory function:

```typescript
function createAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
  return new Anthropic({ apiKey });
}
```

The SDK client is lightweight; the cost of re-instantiation per request is negligible.

---

## 2. High-Priority Issues (P1 — Fix Before UI Wiring)

### H1. 14 of 20 UI components are `return null` stubs

The following components render nothing:

| Component | File | Status |
|---|---|---|
| Navigation | `components/layout/Navigation.tsx` | Stub |
| Footer | `components/layout/Footer.tsx` | Stub |
| Hero | `components/landing/Hero.tsx` | Stub |
| Features | `components/landing/Features.tsx` | Stub |
| AnalysisForm | `components/forms/AnalysisForm.tsx` | Stub |
| VolatilitySlider | `components/forms/VolatilitySlider.tsx` | Stub |
| CFSubCalculator | `components/forms/CFSubCalculator.tsx` | Stub |
| DecisionBanner | `components/results/DecisionBanner.tsx` | Stub |
| GaugeVisualization | `components/results/GaugeVisualization.tsx` | Stub |
| KPIRow | `components/results/KPIRow.tsx` | Stub |
| EquationWaterfall | `components/results/EquationWaterfall.tsx` | Stub |
| FinancialScores | `components/results/FinancialScores.tsx` | Stub |
| MonteCarloPanel | `components/montecarlo/MonteCarloPanel.tsx` | Stub |
| DistributionChart | `components/montecarlo/DistributionChart.tsx` | Stub |

The interactive widget demos built during the session are self-contained and correct. Their logic must be extracted and placed into these stub files.

### H2. All four Next.js route pages are stubs

`/analyze`, `/`, `/scenarios` (partially), and `/montecarlo` pages all contain placeholder text instead of actual components. The `/report` page has real shell structure but its `PDFReportBuilder` is not wired to context.

### H3. Jest configuration missing — tests cannot be run in CI

`package.json` has `"test": "jest --passWithNoTests"` but no `jest.config.ts` or `jest.config.js` exists. The test files in `__tests__/` are written with a custom assertion system (not Jest). They can be run with `node` directly but cannot be run via `npm test`. There is no `@types/jest` in devDependencies.

**Fix:** Either add a Jest config (with `ts-jest` transform) or change the test command to `node --experimental-strip-types __tests__/engine.test.ts`. The current state means CI will pass with zero tests run.

### H4. Montecarlo double import

`lib/montecarlo.ts` imports from `config/constants.ts` twice on consecutive lines:
```typescript
import { MONTE_CARLO_CONFIG } from "@/config/constants";
import { RANGES } from "@/config/constants";
```
This is harmless (tree-shaking handles it) but signals a missed cleanup. Merge into one import line.

### H5. `regenerateAI` is missing from `UseOLTEEReturn` but called in `AIInsightPanel`

`AIInsightPanel.tsx` accepts `onRegenerate?: () => void` as a prop. In the architecture spec, this maps to a `regenerateAI()` method on the hook. Neither `UseOLTEEReturn` (the hook interface) nor the stub implementation exposes this method. When `useOLTEE` is implemented, `regenerateAI` must be added to both the interface and the implementation.

---

## 3. Design Issues (P2 — Fix Before Demo/Competition)

### DE1. Hardcoded hex values in 4 components violate the design token contract

`PDFReportBuilder.tsx`, `ScenarioChart.tsx`, `AIInsightPanel.tsx`, and `StreamingText.tsx` contain local `const C = { bg: "#05070F", ... }` objects or inline hex strings. The design system requires all colors to come from CSS custom properties. If the theme is ever adjusted, these components will not update.

**Correct pattern:** Use CSS custom properties directly in `style` props: `color: "var(--ink-primary)"`. For Recharts (which requires literal strings, not CSS vars), define a `CHART_COLORS` object in `config/constants.ts` as the single source of truth.

### DE2. The `EquationStep.unit` field has a type mismatch

The `EquationStep` type in `types/oltee.ts` defines:
```typescript
unit: "ratio" | "percent" | "SAR" | "multiplier" | "decimal" | "none";
```
But `buildEquationSteps` in `lib/engine.ts` uses `"ratio"` where `"percent"` would be more accurate for steps 1, 2, and 8 (which display as percentages). The waterfall display should apply `formatPercent` to `ratio` units and `formatDecimal` to `decimal` units. Currently the unit field is computed but the waterfall component (stub) does not consume it. When implemented, ensure the display logic uses the `unit` field correctly, or change step 1/2/8 to `"percent"` which is the correct semantic label.

### DE3. `buildEquationSteps` is a display concern living in the engine layer

`buildEquationSteps` in `lib/engine.ts` produces formatted strings (e.g., `"SAR 550,000 ÷ SAR 920,000"`) using `formatSAR` and `formatPercent`. This mixes presentation logic into pure computation. The engine should return numeric intermediates only; the waterfall component or a separate `formatEquationSteps` function should handle string formatting. This is currently a minor concern since the function works correctly, but it imports from `lib/formatting.ts` (a presentation layer) into `lib/engine.ts` (a pure math layer), which reverses the dependency direction.

**Fix (low urgency):** Move `buildEquationSteps` to a new `lib/display.ts` or into the `EquationWaterfall` component itself. Engine should export only `computeOLTEE`.

### DE4. Redundant tsconfig path aliases

`tsconfig.json` has `"@/*": ["./*"]` which already resolves all paths, plus four redundant specific mappings:
```json
"@/components/*": ["./components/*"],
"@/lib/*": ["./lib/*"],
// ...etc
```
The specific entries are subsumed by the catch-all. They add maintenance overhead without benefit.

---

## 4. Math/Spec Issues (P1 — Correctness Matters)

### M1. The Ahmad case produces CAUTION, not OPTIMAL — this is intentional but must be prominently documented

The spec document Section 5.3 says "OPTIMAL" for Ahmad. The implementation produces CAUTION (correct per the more precise Section 6.2 pseudocode). This discrepancy is documented in `lib/engine.ts` lines 38–54, which is excellent. However, the interactive dashboard demo loads Ahmad's case as the default and shows "CAUTION" — a user who has read the spec document will be surprised.

**Fix:** Add a one-line note in the UI for Ahmad's demo case: "Note: the 3-zone decision rule from Section 6.2 applies — Ahmad sits in the caution band (59.8% ≥ 59.5% = L*×0.85)." Alternatively, adjust the demo to a case that cleanly produces OPTIMAL.

### M2. The efficiency score formula comment conflicts with the implementation

The architecture document states: "Efficiency peaks in the CAUTION zone (85–100% of L*)." The implementation in `lib/scores.ts` awards a maximum of 100 points when `debt_ratio / L_star` approaches 1.0 (the caution zone ceiling). However, at `debt_ratio >= L_star` the score drops to 0 immediately — there is no gradient in the suboptimal zone. This is the correct behaviour but the comment in the architecture doc should clarify: "efficiency peaks at the caution ceiling, drops to zero the moment the threshold is crossed."

### M3. `ScenarioResult.delta.debt_ratio` is always 0 for the baseline

In `lib/scenarios.ts`, `buildBaselineResult` correctly sets `delta.debt_ratio: 0`. But `computeScenarioResult` sets:
```typescript
debt_ratio: outputs.debt_ratio - baselineResult.outputs.debt_ratio,
```
For scenarios that change A (asset value), the debt ratio changes even though D stays the same. This delta is computed correctly. However, the baseline's `delta.debt_ratio: 0` is correct because there is nothing to compare against. This is fine — but the ScenarioComparison charts should use `outputs.debt_ratio` directly for display, not `delta.debt_ratio + baseline.debt_ratio` which would re-introduce the same number but is error-prone.

---

## 5. Missing Files Inventory

| File | Priority | What it enables |
|---|---|---|
| `lib/context.tsx` | P0 | All pages — without this, nothing renders |
| `hooks/useOLTEE.ts` (implementation) | P0 | Analyze page computation |
| `hooks/useCountUp.ts` (implementation) | P1 | KPI card animations |
| `hooks/useMonteCarlo.ts` (implementation) | P1 | Monte Carlo page |
| `jest.config.ts` | P1 | Running tests in CI |
| `components/layout/Navigation.tsx` (implementation) | P1 | All pages |
| `components/results/DecisionBanner.tsx` (implementation) | P1 | Analyze page |
| `components/results/GaugeVisualization.tsx` (implementation) | P1 | Analyze page |
| All 11 remaining stub components | P1 | Full UI |

---

## 6. What Is Working Well

**Engine implementation is spec-exact.** All 9 equation steps implement the formula verbatim from the specification document. `computeOLTEE`, `computeStatus`, `computeHeadroom`, and all building-block equations are correct. The 35/35 engine tests pass against Ahmad's verified case values.

**Type system is production-grade.** `types/oltee.ts` is 527 lines of well-structured, well-commented types covering every domain concept. `noUncheckedIndexedAccess` and `strict` mode are both enabled. The type hierarchy from `OLTEEFormValues` → `OLTEEInputs` → `OLTEEOutputs` → `ScenarioResult` is clean and avoids the "prop drilling any" antipattern.

**Validation is correct and thorough.** Zod schema with cross-field validation (A > D), sensible defaults (T=15%), and non-blocking warnings for thin spreads and tight CF ratios. `formToEngineInputs` correctly converts user-facing percentages to engine decimals.

**AI layer is well-designed.** Prompt routing by status (NEG_SPREAD gets its own crisis-mode prompt), JSON defensive parsing with 5-layer cleaning, retry logic with exponential backoff, and streaming piped correctly via `ReadableStream`. The `AI_CONFIG.model` reads from environment with a fallback — correct pattern.

**PDF engine is complete and correct.** 919-line implementation with print-safe color translation, consistent page headers/footers, and a `buildReportData` assembly function. Dynamic import of jsPDF keeps it out of the initial bundle. The `estimatePageCount` function is accurate.

**Scenario and Monte Carlo engines are correct.** Override DSL handles all five preset types. Box-Muller is correctly implemented with `log(0)` protection. `buildHistogram` bucketing logic handles the `L_raw > HARD_CAP` clamping correctly. Sensitivity sweep correctly detects inflection points.

**Reducer is immutable and exhaustive.** All 11 action types handled, AI state correctly resets on `COMPUTE_RESULTS`, TypeScript exhaustiveness check on the default case.

---

## 7. Implementation Sequence to Reach MVP

Execute in strict dependency order:

**Step 1** — Fix D1, D2, D3, D4 (30 minutes). These are textual changes with no new logic.

**Step 2** — Implement `lib/context.tsx` and wire into `app/layout.tsx`. (~120 lines based on the architecture spec.) This unblocks everything else.

**Step 3** — Implement `hooks/useOLTEE.ts` using `lib/reducer.ts` + `lib/engine.ts` + `lib/scores.ts` + `lib/validation.ts`. (~200 lines.)

**Step 4** — Extract the interactive widget demo code into the 14 stub components. The demos are already functionally correct; this is primarily a copy-and-refactor exercise, not new logic.

**Step 5** — Wire the analyze page: `AnalysisForm` → `useOLTEE.compute()` → result components reading from context.

**Step 6** — Implement `hooks/useCountUp.ts` and `hooks/useMonteCarlo.ts` (~80 lines each).

**Step 7** — Wire remaining pages (scenarios, montecarlo, report) to context.

**Step 8** — Add `jest.config.ts` and run the test suite in CI.

The entire path from current state to a deployable MVP is approximately 800–1,000 lines of new code (mostly in context.tsx, useOLTEE.ts, and the stub components), with no new algorithm work required.

---

*Audit complete. All findings above are reproducible and can be verified against the files cited.*
