// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Optimal Leverage Threshold Engine
// Complete Type System
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

// ─── Section 1: Core Engine Types ───────────────────────────────────────────

/**
 * Raw inputs collected from the user.
 * All percentage values are in decimal form internally (0.12 = 12%).
 * The form layer converts % inputs to decimals before passing to the engine.
 */
export interface OLTEEInputs {
  /** Return on Investment — annualised. 0.001–1.0 (0.1% – 100%). */
  ROI: number;
  /** Cost of Debt (Interest Rate) — annual. 0.001–0.30 (0.1% – 30%). */
  r: number;
  /** Tax Rate — effective income/corporate rate. 0–0.50. Default: 0.15. */
  T: number;
  /** Income Volatility (σ). 0.0 = perfectly stable, 1.0 = very erratic. Default: 0.20. */
  sigma: number;
  /** Cash Flow Coverage Ratio — monthly income ÷ monthly debt repayment. 0.5–5.0. */
  CF_ratio: number;
  /** Total Debt (D) in SAR. Must be > 0. */
  D: number;
  /** Total Assets (A) in SAR. Must be > D. */
  A: number;
}

/**
 * Raw form values as the user types them (strings + display-friendly numbers).
 * Converted to OLTEEInputs before engine computation.
 */
export interface OLTEEFormValues {
  ROI: string;        // User types "12" → engine receives 0.12
  r: string;          // User types "5" → engine receives 0.05
  T: string;          // User types "15" → engine receives 0.15
  sigma: number;      // Slider — direct decimal 0.0–1.0
  CF_ratio: string;   // User types "1.35" or via sub-calculator
  D: string;          // User types "550000" (SAR, no commas)
  A: string;          // User types "920000"
  // Sub-calculator fields (not passed to engine)
  monthlyIncome?: string;
  monthlyRepayment?: string;
}

/**
 * All intermediate computed values from the building-block equations.
 * Preserved for the equation waterfall display.
 */
export interface OLTEEIntermediates {
  /** Eq 1: Debt Ratio = D / A */
  debt_ratio: number;
  /** Eq 2: Return Spread Δ = ROI − r */
  delta: number;
  /** Eq 3: Tax Efficiency Coefficient α = 1 − T */
  alpha: number;
  /** Eq 4: Risk Pressure Coefficient β = 1 + (σ × 0.5) */
  beta: number;
  /** Numerator = Δ × α */
  numerator: number;
  /** Denominator = r × β × (1 / CF_ratio) */
  denominator: number;
  /** L* before hard cap */
  L_raw: number;
}

/**
 * The four possible leverage status outcomes from the OLTEE decision logic.
 */
export type LeverageStatus =
  | "OPTIMAL"      // Debt_Ratio < L* × 0.85
  | "CAUTION"      // L* × 0.85 ≤ Debt_Ratio < L*
  | "SUBOPTIMAL"   // Debt_Ratio ≥ L*
  | "NEG_SPREAD";  // ROI ≤ r (pre-calculation guard)

/**
 * Complete output from the OLTEE core engine.
 */
export interface OLTEEOutputs {
  /** Optimal Leverage Threshold L* = min(L_raw, 0.70). Main output. */
  L_star: number;
  /** Current debt ratio D/A. */
  debt_ratio: number;
  /** The leverage status decision. */
  status: LeverageStatus;
  /** SAR headroom = max(0, (L* × A) − D). */
  headroom_SAR: number;
  /** Whether the 0.70 hard cap was applied (L_raw > 0.70). */
  cap_applied: boolean;
  /** All intermediate step values for display. */
  intermediates: OLTEEIntermediates;
}

/**
 * A single named step in the equation waterfall display.
 */
export interface EquationStep {
  step: number;
  label: string;
  formula: string;
  calculation: string;
  result: number;
  resultFormatted: string;
  unit: "ratio" | "percent" | "SAR" | "multiplier" | "decimal" | "none";
  highlight?: boolean;
}

// ─── Section 2: Financial Intelligence Score Types ───────────────────────────

/**
 * The four derived financial intelligence scores, each 0–100.
 */
export interface FinancialScores {
  /**
   * Financial Stability Score — derived from CF_ratio, σ, and distance
   * of Debt_Ratio from the threshold. High CF_ratio + low volatility = high score.
   */
  stability: number;

  /**
   * Debt Health Score — derived from Δ (return spread), distance of Debt_Ratio
   * from L*, and whether the cap was applied. Positive spread with headroom = high.
   */
  debtHealth: number;

  /**
   * Leverage Efficiency Score — how well the user's debt structure maximises
   * the L* formula. High when L_raw >> 0.70 (borrowing capacity far exceeds debt).
   */
  efficiency: number;

  /**
   * Financial Resilience Score — ability to absorb adverse shocks.
   * Combines CF_ratio, headroom %, β value, and status position.
   */
  resilience: number;
}

export interface ScoreDetail {
  score: number;
  label: string;
  description: string;
  interpretation: string;
  color: "optimal" | "caution" | "suboptimal";
}

// ─── Section 3: AI Insight Types ─────────────────────────────────────────────

/**
 * The eight-section AI insight output from the Anthropic API.
 * Each field is a markdown string streamed from the API.
 */
export interface AIInsights {
  executiveSummary: string;
  riskAssessment: string;
  leverageAnalysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  futureConsiderations: string;
  personalizedGuidance: string;
}

/**
 * The streaming state of an AI insight request.
 */
export type AIInsightStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "complete"
  | "error";

export interface AIInsightState {
  status: AIInsightStatus;
  insights: Partial<AIInsights>;
  rawStream: string;
  error?: string;
}

/**
 * Payload sent to the /api/ai-insights endpoint.
 */
export interface AIInsightRequest {
  inputs: OLTEEInputs;
  outputs: OLTEEOutputs;
  scores: FinancialScores;
  locale?: "ar" | "en";
}

// ─── Section 4: Scenario Simulation Types ───────────────────────────────────

/**
 * A single named scenario parameter that can be adjusted.
 */
export type ScenarioParameter =
  | "ROI"
  | "r"
  | "sigma"
  | "CF_ratio"
  | "D"
  | "A"
  | "T";

/**
 * Configuration for a scenario slider in the Scenario Lab.
 */
export interface ScenarioSliderConfig {
  parameter: ScenarioParameter;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit: "%" | "SAR" | "ratio" | "decimal";
  baselineValue: number;
  currentValue: number;
}

/**
 * Preset scenario definitions — named what-if situations.
 */
export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  overrides: Partial<OLTEEInputs>;
}

/**
 * The result of computing OLTEE for a single scenario.
 */
export interface ScenarioResult {
  scenario: ScenarioPreset | null;
  label: string;
  inputs: OLTEEInputs;
  outputs: OLTEEOutputs;
  scores: FinancialScores;
  delta: {
    L_star: number;
    debt_ratio: number;
    headroom_SAR: number;
    status_changed: boolean;
    direction: "improved" | "degraded" | "unchanged";
  };
  aiCommentary?: string;
}

/**
 * Comparison between baseline and one or more scenarios.
 */
export interface ScenarioComparison {
  baseline: ScenarioResult;
  scenarios: ScenarioResult[];
  worstCase: ScenarioResult | null;
  bestCase: ScenarioResult | null;
}

// ─── Section 5: Monte Carlo Types ─────────────────────────────────────────────

/**
 * Configuration for the Monte Carlo simulation run.
 */
export interface MonteCarloConfig {
  iterations: number;         // Default: 10,000
  seed?: number;              // Optional: reproducible runs

  // Standard deviations for stochastic sampling
  sigma_ROI: number;          // Default: 0.03 (3% std dev on ROI)
  sigma_r: number;            // Default: 0.01 (1% std dev on interest rate)
  sigma_sigma: number;        // Default: 0.05 (volatility std dev)
  sigma_CF_ratio: number;     // Default: 0.15 (CF ratio std dev)
}

/**
 * A single iteration result from Monte Carlo (for histogram building).
 */
export interface MonteCarloIteration {
  L_star: number;
  debt_ratio: number;
  status: LeverageStatus;
}

/**
 * Histogram bin for distribution display.
 */
export interface HistogramBin {
  rangeStart: number;
  rangeEnd: number;
  label: string;
  count: number;
  frequency: number;  // count / total iterations
  status: LeverageStatus | "mixed";
}

/**
 * Complete Monte Carlo simulation result.
 */
export interface MonteCarloResult {
  config: MonteCarloConfig;
  iterations_run: number;

  // Probability outcomes
  p_optimal: number;      // 0–1
  p_caution: number;      // 0–1
  p_suboptimal: number;   // 0–1
  p_neg_spread: number;   // 0–1

  // L* distribution
  p5_L_star: number;
  p25_L_star: number;
  p50_L_star: number;     // Median
  p75_L_star: number;
  p95_L_star: number;
  mean_L_star: number;
  std_L_star: number;

  // Debt ratio distribution
  debt_ratio_fixed: number;   // Unchanged (D and A are deterministic)

  // For chart rendering
  histogram: HistogramBin[];

  // Execution metadata
  duration_ms: number;
}

// ─── Section 6: PDF Report Types ─────────────────────────────────────────────

/**
 * The complete data bundle passed to the PDF builder.
 */
export interface PDFReportData {
  metadata: {
    generatedAt: string;         // ISO timestamp
    reportId: string;            // UUID
    platform: string;            // "OLTEE v1.0"
    engineer: string;            // "Faisal Alghamdi"
  };
  inputs: OLTEEInputs;
  outputs: OLTEEOutputs;
  equationSteps: EquationStep[];
  scores: FinancialScores;
  insights: AIInsights | null;
  scenarios: ScenarioResult[] | null;
  monteCarlo: MonteCarloResult | null;
}

/**
 * PDF section render options.
 */
export interface PDFSection {
  title: string;
  include: boolean;
  pageBreakBefore?: boolean;
}

// ─── Section 7: UI State Types ────────────────────────────────────────────────

/**
 * The full application state managed by the useOLTEE hook.
 */
export interface OLTEEState {
  // Form
  formValues: OLTEEFormValues | null;
  inputs: OLTEEInputs | null;
  hasResults: boolean;

  // Engine outputs
  outputs: OLTEEOutputs | null;
  equationSteps: EquationStep[] | null;
  scores: FinancialScores | null;

  // AI
  aiState: AIInsightState;

  // Scenarios
  scenarioComparison: ScenarioComparison | null;
  activeScenarios: ScenarioPreset[];

  // Monte Carlo
  monteCarloResult: MonteCarloResult | null;
  monteCarloRunning: boolean;

  // UI
  isCalculating: boolean;
  activeTab: "analyze" | "scenarios" | "montecarlo" | "report";
}

/**
 * Actions dispatched to the OLTEE state reducer.
 */
export type OLTEEAction =
  | { type: "SET_FORM_VALUES"; payload: OLTEEFormValues }
  | { type: "COMPUTE_RESULTS"; payload: { inputs: OLTEEInputs; outputs: OLTEEOutputs; steps: EquationStep[]; scores: FinancialScores } }
  | { type: "SET_AI_STATUS"; payload: AIInsightStatus }
  | { type: "APPEND_AI_STREAM"; payload: string }
  | { type: "SET_AI_INSIGHTS"; payload: AIInsights }
  | { type: "SET_AI_ERROR"; payload: string }
  | { type: "SET_SCENARIO_COMPARISON"; payload: ScenarioComparison }
  | { type: "START_MONTE_CARLO" }
  | { type: "SET_MONTE_CARLO_RESULT"; payload: MonteCarloResult }
  | { type: "SET_ACTIVE_TAB"; payload: OLTEEState["activeTab"] }
  | { type: "RESET" };

// ─── Section 8: Validation & Error Types ─────────────────────────────────────

/**
 * Field-level validation result.
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<keyof OLTEEFormValues, string | undefined>;
  warnings: Partial<Record<keyof OLTEEFormValues, string>>;
}

/**
 * Engine-level guard result (before computation).
 */
export interface EngineGuard {
  canCompute: boolean;
  earlyStatus?: LeverageStatus;
  reason?: string;
}

// ─── Section 9: Display / Formatting Types ────────────────────────────────────

/**
 * Status display configuration — maps LeverageStatus to visual properties.
 */
export interface StatusConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
  gaugeColor: string;
}

export type StatusConfigMap = Record<LeverageStatus, StatusConfig>;

/**
 * Gauge visualization data.
 */
export interface GaugeData {
  currentRatio: number;      // 0–1 (Debt_Ratio)
  threshold: number;         // 0–0.70 (L*)
  cautionZoneStart: number;  // L* × 0.85
  status: LeverageStatus;
  headroom: number;          // remaining %
}

// ─── Section 10: Chart / Visualization Data Types ────────────────────────────
//
// NOTE: Formula constants (HARD_CAP, CAUTION_FACTOR, BETA_MULTIPLIER, etc.)
// live exclusively in config/constants.ts → FORMULA and DEFAULTS.
// Do not define constants here — types files contain only type definitions.

/**
 * A single data point in a scenario comparison chart.
 */
export interface ScenarioChartPoint {
  scenario: string;
  L_star: number;
  debt_ratio: number;
  headroom: number;
  status: LeverageStatus;
}

/**
 * Sensitivity analysis data point (one variable swept).
 */
export interface SensitivityPoint {
  parameterValue: number;
  L_star: number;
  status: LeverageStatus;
  delta_from_baseline: number;
}

/**
 * Complete sensitivity analysis for one parameter.
 */
export interface SensitivityAnalysis {
  parameter: ScenarioParameter;
  label: string;
  points: SensitivityPoint[];
  baseline_value: number;
  baseline_L_star: number;
  inflection_point: number | null;  // Where status changes
}
