// ═══════════════════════════════════════════════════════════════════════════
// OLTEE Platform — Application Constants
// ═══════════════════════════════════════════════════════════════════════════

import type { LeverageStatus, StatusConfigMap } from "@/types/oltee";

// ─── App Identity ────────────────────────────────────────────────────────────

export const APP = {
  name: "OLTEE",
  fullName: "Optimal Leverage Threshold Engine",
  tagline: "Know exactly when debt works for you — and when it doesn't.",
  version: "1.0.0",
  engineer: "Faisal Alghamdi",
  description:
    "AI-powered financial intelligence platform built on the Optimal Investment-Driven Leverage Threshold Equation.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

// ─── OLTEE Formula Constants (from specification document) ───────────────────
// WARNING: These values are fixed by the OLTEE equation specification.
// Changing them changes the formula itself. Do not modify.

export const FORMULA = {
  /** Hard cap: no individual should exceed 70% debt-to-asset ratio. */
  HARD_CAP: 0.70,

  /** Caution zone starts at 85% of L*. */
  CAUTION_FACTOR: 0.85,

  /** Beta coefficient: β = 1 + (σ × 0.5). */
  BETA_MULTIPLIER: 0.5,
} as const;

// ─── Default Input Values ─────────────────────────────────────────────────────

export const DEFAULTS = {
  T: 0.15,      // 15% tax rate
  sigma: 0.20,  // Moderate income volatility
} as const;

// ─── Input Validation Ranges ──────────────────────────────────────────────────

export const RANGES = {
  ROI:      { min: 0.001, max: 1.0,  step: 0.001 },  // 0.1%–100%
  r:        { min: 0.001, max: 0.30, step: 0.001 },  // 0.1%–30%
  T:        { min: 0.0,   max: 0.50, step: 0.001 },  // 0%–50%
  sigma:    { min: 0.0,   max: 1.0,  step: 0.01  },  // 0.0–1.0
  CF_ratio: { min: 0.5,   max: 5.0,  step: 0.01  },  // 0.5–5.0
  D:        { min: 1,     max: 1e10, step: 1      },  // SAR > 0
  A:        { min: 1,     max: 1e10, step: 1      },  // SAR > 0
} as const;

// ─── Status Configuration ──────────────────────────────────────────────────────

export const STATUS_CONFIG: StatusConfigMap = {
  OPTIMAL: {
    label: "Optimal",
    description: "Your leverage is in the productive zone. Debt is working for you.",
    color: "optimal",
    bgColor: "bg-optimal-bg",
    borderColor: "border-optimal-border",
    textColor: "text-optimal-text",
    icon: "TrendingUp",
    gaugeColor: "#22C55E",
  },
  CAUTION: {
    label: "Caution",
    description: "You are approaching the limit. Avoid additional borrowing.",
    color: "caution",
    bgColor: "bg-caution-bg",
    borderColor: "border-caution-border",
    textColor: "text-caution-text",
    icon: "AlertTriangle",
    gaugeColor: "#F59E0B",
  },
  SUBOPTIMAL: {
    label: "Suboptimal",
    description: "Debt has exceeded the safe threshold. Consult a financial advisor.",
    color: "suboptimal",
    bgColor: "bg-suboptimal-bg",
    borderColor: "border-suboptimal-border",
    textColor: "text-suboptimal-text",
    icon: "AlertCircle",
    gaugeColor: "#EF4444",
  },
  NEG_SPREAD: {
    label: "Negative Spread",
    description: "Your investment return is below your loan cost. Borrowing destroys value.",
    color: "negspread",
    bgColor: "bg-negspread-bg",
    borderColor: "border-negspread-border",
    textColor: "text-negspread-text",
    icon: "XCircle",
    gaugeColor: "#E8305A",
  },
} as const;

// ─── Volatility Slider Labels ──────────────────────────────────────────────────

export const VOLATILITY_LABELS: { value: number; label: string; example: string }[] = [
  { value: 0.05, label: "Very stable",      example: "Government employee, fixed salary" },
  { value: 0.15, label: "Stable",           example: "Corporate professional, regular raises" },
  { value: 0.30, label: "Moderate",         example: "Commission-based role, variable bonus" },
  { value: 0.50, label: "Variable",         example: "Consultant, contract-to-contract" },
  { value: 0.70, label: "Volatile",         example: "Self-employed, seasonal income" },
  { value: 0.90, label: "Highly volatile",  example: "Freelancer, multiple income streams" },
];

// ─── Scenario Presets ─────────────────────────────────────────────────────────

export const SCENARIO_PRESETS = [
  {
    id: "rate-hike-2",
    name: "Rate hike +2%",
    description: "Central bank raises rates by 200 basis points",
    emoji: "📈",
    overrides: { r_delta: 0.02 },  // Additive delta on r
  },
  {
    id: "rate-hike-5",
    name: "Rate hike +5%",
    description: "Severe rate cycle — 500bp increase",
    emoji: "🚨",
    overrides: { r_delta: 0.05 },
  },
  {
    id: "roi-drop-30",
    name: "ROI drops 30%",
    description: "Investment underperforms — return compresses",
    emoji: "📉",
    overrides: { ROI_factor: 0.70 },  // Multiplicative factor on ROI
  },
  {
    id: "income-cut-25",
    name: "Income cut 25%",
    description: "Salary reduction or business slowdown",
    emoji: "💼",
    overrides: { CF_ratio_factor: 0.75 },
  },
  {
    id: "asset-decline-20",
    name: "Asset value −20%",
    description: "Property market correction",
    emoji: "🏠",
    overrides: { A_factor: 0.80 },
  },
  {
    id: "high-volatility",
    name: "Income turns volatile",
    description: "Career change or business uncertainty",
    emoji: "⚡",
    overrides: { sigma: 0.65 },
  },
  {
    id: "combined-stress",
    name: "Combined stress test",
    description: "Rate +2%, ROI −15%, CF −10%",
    emoji: "🔴",
    overrides: { r_delta: 0.02, ROI_factor: 0.85, CF_ratio_factor: 0.90 },
  },
  {
    id: "best-case",
    name: "Ideal conditions",
    description: "Rate falls, ROI rises, income grows",
    emoji: "🌟",
    overrides: { r_delta: -0.01, ROI_factor: 1.15, CF_ratio_factor: 1.20 },
  },
] as const;

// ─── Monte Carlo Configuration ────────────────────────────────────────────────

export const MONTE_CARLO_CONFIG = {
  DEFAULT_ITERATIONS:  10_000,
  MIN_ITERATIONS:      1_000,
  MAX_ITERATIONS:      50_000,
  HISTOGRAM_BINS:      20,

  // Stochastic parameter standard deviations
  SIGMA_ROI:      0.03,   // 3% std dev on ROI
  SIGMA_R:        0.01,   // 1% std dev on interest rate
  SIGMA_SIGMA:    0.05,   // 5% std dev on income volatility
  SIGMA_CF_RATIO: 0.15,   // 15% std dev on CF ratio
} as const;

// ─── Navigation Links ──────────────────────────────────────────────────────────

export const NAV_LINKS = [
  {
    href: "/analyze",
    label: "Analyze",
    description: "Run the OLTEE equation on your debt",
    icon: "Calculator",
  },
  {
    href: "/scenarios",
    label: "Scenario Lab",
    description: "Simulate what-if financial conditions",
    icon: "FlaskConical",
  },
  {
    href: "/montecarlo",
    label: "Monte Carlo",
    description: "Probability analysis across thousands of futures",
    icon: "Dice5",
  },
  {
    href: "/report",
    label: "Report",
    description: "Download your full financial intelligence report",
    icon: "FileDown",
  },
] as const;

// ─── Financial Score Definitions ──────────────────────────────────────────────

export const SCORE_DEFINITIONS = {
  stability: {
    label: "Financial Stability",
    description: "How reliably your cash flow covers your obligations",
    icon: "Shield",
  },
  debtHealth: {
    label: "Debt Health",
    description: "How productive your current debt position is",
    icon: "Heart",
  },
  efficiency: {
    label: "Leverage Efficiency",
    description: "How optimally you are using your borrowing capacity",
    icon: "Zap",
  },
  resilience: {
    label: "Financial Resilience",
    description: "Your ability to absorb adverse market conditions",
    icon: "Anchor",
  },
} as const;

// ─── AI Model Configuration ────────────────────────────────────────────────────

export const AI_CONFIG = {
  model:       process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash",
  maxTokens:   parseInt(process.env.GOOGLE_AI_MAX_TOKENS ?? "4096"),
  temperature: 0.4,
  systemRole:  "financial-intelligence" as const,
} as const;

// ─── Feature Flags ──────────────────────────────────────────────────────────────

export const FEATURES = {
  monteCarlo:  process.env.NEXT_PUBLIC_ENABLE_MONTE_CARLO !== "false",
  pdfExport:   process.env.NEXT_PUBLIC_ENABLE_PDF_EXPORT !== "false",
  aiInsights:  process.env.NEXT_PUBLIC_ENABLE_AI_INSIGHTS !== "false",
} as const;

// ─── Currency / Number Formatting ──────────────────────────────────────────────

export const FORMAT = {
  currency: "SAR",
  locale: "en-SA",
  percentDecimals: 1,
  ratioDecimals: 3,
  SARDecimals: 0,
} as const;

// ─── Equation Step Labels (for waterfall display) ──────────────────────────────

export const EQUATION_STEP_LABELS = [
  {
    step: 1,
    label: "Actual Debt Ratio",
    formula: "D ÷ A",
    description: "Your current debt as a fraction of total assets",
  },
  {
    step: 2,
    label: "Return Spread (Δ)",
    formula: "ROI − r",
    description: "Profit margin above your borrowing cost",
  },
  {
    step: 3,
    label: "Tax Efficiency (α)",
    formula: "1 − T",
    description: "Fraction of interest burden after the tax shield",
  },
  {
    step: 4,
    label: "Risk Coefficient (β)",
    formula: "1 + (σ × 0.5)",
    description: "How income volatility amplifies your debt burden",
  },
  {
    step: 5,
    label: "Numerator",
    formula: "Δ × α",
    description: "Net after-tax economic benefit of borrowing",
  },
  {
    step: 6,
    label: "Denominator",
    formula: "r × β × (1 / CF_ratio)",
    description: "Full real-world burden of your debt",
  },
  {
    step: 7,
    label: "L* (raw)",
    formula: "Numerator ÷ Denominator",
    description: "Uncapped leverage threshold",
  },
  {
    step: 8,
    label: "L* (final)",
    formula: "min(L*_raw, 0.70)",
    description: "Safe ceiling after regulatory hard cap",
  },
  {
    step: 9,
    label: "Decision",
    formula: "Debt_Ratio vs L*",
    description: "Optimal or suboptimal leverage status",
  },
] as const;
