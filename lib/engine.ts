// ═══════════════════════════════════════════════════════════════════════════
// OLTEE Core Math Engine
// Implements the Optimal Investment-Driven Leverage Threshold Equation
// exactly as specified in the OLTEE Technical Reference Document.
// Author: Faisal Alghamdi
//
// ─── FORMULA REFERENCE ──────────────────────────────────────────────────────
//
//  Eq 1:  Debt_Ratio = D / A
//  Eq 2:  Δ = ROI − r          [guard: if ROI ≤ r → NEG_SPREAD, L* = 0]
//  Eq 3:  α = 1 − T
//  Eq 4:  β = 1 + (σ × 0.5)
//  Eq 5:  Numerator   = Δ × α
//         Denominator = r × β × (1 / CF_ratio)
//         L*_raw      = Numerator / Denominator
//         L*          = min(L*_raw, 0.70)        [hard cap]
//
//  Decision:
//    Debt_Ratio < L* × 0.85           → OPTIMAL
//    L* × 0.85 ≤ Debt_Ratio < L*      → CAUTION
//    Debt_Ratio ≥ L*                   → SUBOPTIMAL
//    ROI ≤ r (pre-check)              → NEG_SPREAD
//
// ─── SPECIFICATION REFERENCE ────────────────────────────────────────────────
//
//  All values are taken verbatim from the OLTEE Technical Reference Document,
//  Section 04 "The Core Equation — Complete Specification" and
//  Section 05 "Worked Example — Ahmad at Al Rajhi Bank".
//
//  Verified results for Ahmad's case:
//    Inputs:  ROI=0.12, r=0.05, T=0.15, σ=0.20, CF=1.35, D=550000, A=920000
//    Δ = 0.07,  α = 0.85,  β = 1.10
//    Numerator   = 0.07 × 0.85 = 0.05950
//    Denominator = 0.05 × 1.10 × (1/1.35) = 0.05 × 1.10 × 0.741 = 0.04074
//    L*_raw      = 0.05950 / 0.04074 = 1.4604...
//    L*          = min(1.4604, 0.70) = 0.70  (cap applied)
//    Debt_Ratio  = 550000 / 920000 = 0.5978...
//    Decision:   0.5978 < 0.70 × 0.85 (= 0.595) → boundary check:
//                0.5978 < 0.595? No.  0.5978 < 0.70? Yes → CAUTION zone?
//                Wait — 0.5978 < 0.595 is FALSE so:
//                0.70 × 0.85 = 0.595, debt_ratio = 0.5978 ≥ 0.595
//                0.5978 < 0.70  → CAUTION
//                Spec section 6.2 pseudocode: < L* × 0.85 → OPTIMAL, else CAUTION, else SUBOPTIMAL
//                Ahmad result: OPTIMAL per spec section 5.3 (59.8% < 70.0%)
//                Resolution: spec section 5 says OPTIMAL; pseudocode in 6.2 matches:
//                  59.8% vs 70% × 0.85 = 59.5% → 59.8% ≥ 59.5% so NOT optimal?
//                  But spec 5.3 clearly states OPTIMAL. The cap is 0.70, L*=0.70.
//                  0.85 × 0.70 = 0.595. DR=0.598 ≥ 0.595 → CAUTION per pseudocode.
//                  Spec 5.3 says OPTIMAL because 59.8% < 70.0% (< L*, not < L*×0.85).
//                  The spec text at 5.3: "IF Debt_Ratio < L* → OPTIMAL" (Section 06).
//                  Section 07 final rule: "IF Debt_Ratio < L* → OPTIMAL".
//                  The 3-zone breakdown in 6.2 adds the CAUTION band between 0.85×L* and L*.
//                  Ahmad sits in CAUTION strictly per 6.2. Spec 5.3 uses the 2-zone
//                  simplified summary. We implement the 3-zone rule from 6.2 (more precise).
//
// ═══════════════════════════════════════════════════════════════════════════

import type {
  OLTEEInputs,
  OLTEEOutputs,
  OLTEEIntermediates,
  EquationStep,
  EngineGuard,
  LeverageStatus,
} from "@/types/oltee";

import { FORMULA, EQUATION_STEP_LABELS } from "@/config/constants";
import { formatPercent, formatDecimal, formatSAR } from "@/lib/formatting";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Runs the complete OLTEE engine pipeline on validated inputs.
 * Implements the formula exactly as written in the specification document.
 *
 * All inputs must be in decimal form (ROI=0.12 not 12, r=0.05 not 5, etc.)
 * All percentage inputs arrive via formToEngineInputs() which performs the
 * user-facing % → decimal conversion.
 */
export function computeOLTEE(inputs: OLTEEInputs): OLTEEOutputs {
  // ── Step 1: Debt Ratio (Eq 1) ─────────────────────────────────────────
  const debt_ratio = computeDebtRatio(inputs.D, inputs.A);

  // ── Step 2: Return Spread Δ (Eq 2) + NEG_SPREAD guard ─────────────────
  const delta = computeDelta(inputs.ROI, inputs.r);

  // Guard: if ROI ≤ r, return spread is non-positive — no safe threshold exists
  if (delta <= 0) {
    return {
      L_star: 0,
      debt_ratio,
      status: "NEG_SPREAD",
      headroom_SAR: 0,
      cap_applied: false,
      intermediates: {
        debt_ratio,
        delta,
        alpha: computeAlpha(inputs.T),
        beta:  computeBeta(inputs.sigma),
        numerator:   0,
        denominator: 0,
        L_raw: 0,
      },
    };
  }

  // ── Step 3: Tax Efficiency α (Eq 3) ───────────────────────────────────
  const alpha = computeAlpha(inputs.T);

  // ── Step 4: Risk Coefficient β (Eq 4) ─────────────────────────────────
  const beta = computeBeta(inputs.sigma);

  // ── Step 5: Master Equation ────────────────────────────────────────────
  const numerator   = computeNumerator(delta, alpha);
  const denominator = computeDenominator(inputs.r, beta, inputs.CF_ratio);
  const L_raw       = computeLStarRaw(numerator, denominator);
  const L_star      = computeLStar(L_raw);
  const cap_applied = L_raw > FORMULA.HARD_CAP;

  // ── Decision ───────────────────────────────────────────────────────────
  const status      = computeStatus(debt_ratio, L_star);
  const headroom_SAR = computeHeadroom(L_star, inputs.A, inputs.D);

  return {
    L_star,
    debt_ratio,
    status,
    headroom_SAR,
    cap_applied,
    intermediates: { debt_ratio, delta, alpha, beta, numerator, denominator, L_raw },
  };
}

/**
 * Pre-computation guard: checks for early-exit conditions before running
 * the full engine. Returns immediately usable result if ROI ≤ r.
 */
export function checkEngineGuards(inputs: OLTEEInputs): EngineGuard {
  if (inputs.ROI <= inputs.r) {
    return {
      canCompute: true, // We can still produce an output (NEG_SPREAD)
      earlyStatus: "NEG_SPREAD",
      reason: "Return on investment is at or below the interest rate. No safe borrowing threshold exists.",
    };
  }
  if (inputs.CF_ratio <= 0) {
    return {
      canCompute: false,
      reason: "Cash flow coverage ratio must be greater than zero.",
    };
  }
  if (inputs.A <= inputs.D) {
    return {
      canCompute: false,
      reason: "Total assets must exceed total debt.",
    };
  }
  return { canCompute: true };
}

/**
 * Builds the 9-step equation waterfall from computed inputs and outputs.
 * Matches exactly the structure in Section 5.2 of the specification.
 */
export function buildEquationSteps(
  inputs: OLTEEInputs,
  outputs: OLTEEOutputs
): EquationStep[] {
  const { intermediates, L_star, status, debt_ratio } = outputs;

  // Build calculation strings exactly as shown in spec Section 5.2
  const steps: EquationStep[] = [
    {
      step: 1,
      label:       EQUATION_STEP_LABELS[0]!.label,
      formula:     EQUATION_STEP_LABELS[0]!.formula,
      calculation: `${formatSAR(inputs.D)} ÷ ${formatSAR(inputs.A)}`,
      result:      debt_ratio,
      resultFormatted: formatPercent(debt_ratio),
      unit: "ratio",
    },
    {
      step: 2,
      label:       EQUATION_STEP_LABELS[1]!.label,
      formula:     EQUATION_STEP_LABELS[1]!.formula,
      calculation: `${formatPercent(inputs.ROI)} − ${formatPercent(inputs.r)}`,
      result:      intermediates.delta,
      resultFormatted: (intermediates.delta >= 0 ? "+" : "") + formatPercent(intermediates.delta),
      unit: "ratio",
    },
    {
      step: 3,
      label:       EQUATION_STEP_LABELS[2]!.label,
      formula:     EQUATION_STEP_LABELS[2]!.formula,
      calculation: `1 − ${formatPercent(inputs.T)}`,
      result:      intermediates.alpha,
      resultFormatted: formatDecimal(intermediates.alpha, 3),
      unit: "decimal",
    },
    {
      step: 4,
      label:       EQUATION_STEP_LABELS[3]!.label,
      formula:     EQUATION_STEP_LABELS[3]!.formula,
      calculation: `1 + (${inputs.sigma.toFixed(2)} × 0.5)`,
      result:      intermediates.beta,
      resultFormatted: formatDecimal(intermediates.beta, 3),
      unit: "multiplier",
    },
    {
      step: 5,
      label:       EQUATION_STEP_LABELS[4]!.label,
      formula:     EQUATION_STEP_LABELS[4]!.formula,
      calculation: `${formatDecimal(intermediates.delta, 4)} × ${formatDecimal(intermediates.alpha, 4)}`,
      result:      intermediates.numerator,
      resultFormatted: formatDecimal(intermediates.numerator, 5),
      unit: "decimal",
    },
    {
      step: 6,
      label:       EQUATION_STEP_LABELS[5]!.label,
      formula:     EQUATION_STEP_LABELS[5]!.formula,
      calculation: `${formatDecimal(inputs.r, 4)} × ${formatDecimal(intermediates.beta, 3)} × ${formatDecimal(1 / inputs.CF_ratio, 3)}`,
      result:      intermediates.denominator,
      resultFormatted: formatDecimal(intermediates.denominator, 5),
      unit: "decimal",
    },
    {
      step: 7,
      label:       EQUATION_STEP_LABELS[6]!.label,
      formula:     EQUATION_STEP_LABELS[6]!.formula,
      calculation: `${formatDecimal(intermediates.numerator, 5)} ÷ ${formatDecimal(intermediates.denominator, 5)}`,
      result:      intermediates.L_raw,
      resultFormatted: formatDecimal(intermediates.L_raw, 3),
      unit: "decimal",
    },
    {
      step: 8,
      label:       EQUATION_STEP_LABELS[7]!.label,
      formula:     EQUATION_STEP_LABELS[7]!.formula,
      calculation: outputs.cap_applied
        ? `min(${formatDecimal(intermediates.L_raw, 3)}, 0.70) — cap applied`
        : `min(${formatDecimal(intermediates.L_raw, 3)}, 0.70)`,
      result:      L_star,
      resultFormatted: formatPercent(L_star),
      unit: "ratio",
      highlight: true,
    },
    {
      step: 9,
      label:       EQUATION_STEP_LABELS[8]!.label,
      formula:     EQUATION_STEP_LABELS[8]!.formula,
      calculation: `${formatPercent(debt_ratio)} vs ${formatPercent(L_star)}`,
      result:      debt_ratio < L_star ? 1 : 0,
      resultFormatted: status === "OPTIMAL"    ? "✓ Optimal"
                     : status === "CAUTION"    ? "⚠ Caution"
                     : status === "SUBOPTIMAL" ? "✕ Suboptimal"
                                               : "✕ Neg. spread",
      unit: "none",
      highlight: true,
    },
  ];

  return steps;
}

// ─── Decision Logic ───────────────────────────────────────────────────────────

/**
 * Implements the 3-zone decision from Section 6.2 of the specification:
 *   Debt_Ratio < L* × 0.85            → OPTIMAL
 *   L* × 0.85 ≤ Debt_Ratio < L*       → CAUTION
 *   Debt_Ratio ≥ L*                    → SUBOPTIMAL
 *
 * Note: Called only after the NEG_SPREAD guard has been cleared.
 */
export function computeStatus(
  debt_ratio: number,
  L_star: number
): LeverageStatus {
  const caution_start = L_star * FORMULA.CAUTION_FACTOR; // L* × 0.85
  if (debt_ratio < caution_start) return "OPTIMAL";
  if (debt_ratio < L_star)        return "CAUTION";
  return "SUBOPTIMAL";
}

/**
 * SAR headroom remaining before the L* threshold is crossed.
 * Spec: headroom = (L* × A) − D, floored at 0.
 * Ahmad's case: (0.70 × 920000) − 550000 = 644000 − 550000 = SAR 94,000
 */
export function computeHeadroom(
  L_star: number,
  A: number,
  D: number
): number {
  return Math.max(0, L_star * A - D);
}

// ─── Building-Block Equations ─────────────────────────────────────────────────

/** Eq 1: Debt Ratio = D / A */
export function computeDebtRatio(D: number, A: number): number {
  return D / A;
}

/** Eq 2: Return Spread Δ = ROI − r */
export function computeDelta(ROI: number, r: number): number {
  return ROI - r;
}

/** Eq 3: Tax Efficiency α = 1 − T */
export function computeAlpha(T: number): number {
  return 1 - T;
}

/**
 * Eq 4: Risk Pressure Coefficient β = 1 + (σ × 0.5)
 * Spec: "Beta = 1 plus half the income volatility score"
 * FORMULA.BETA_MULTIPLIER = 0.5 (locked from spec)
 */
export function computeBeta(sigma: number): number {
  return 1 + sigma * FORMULA.BETA_MULTIPLIER;
}

/** Numerator = Δ × α */
export function computeNumerator(delta: number, alpha: number): number {
  return delta * alpha;
}

/**
 * Denominator = r × β × (1 / CF_ratio)
 * Spec example: 0.05 × 1.10 × 0.741 = 0.04074
 */
export function computeDenominator(
  r: number,
  beta: number,
  CF_ratio: number
): number {
  return r * beta * (1 / CF_ratio);
}

/** L* raw (before hard cap) = Numerator / Denominator */
export function computeLStarRaw(
  numerator: number,
  denominator: number
): number {
  // Guard against division by zero (validated upstream, but belt-and-suspenders)
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * L* final = min(L*_raw, HARD_CAP)
 * Hard cap = 0.70 (locked from spec — international banking norm)
 */
export function computeLStar(L_raw: number): number {
  return Math.min(L_raw, FORMULA.HARD_CAP);
}

// ─── Type re-exports ──────────────────────────────────────────────────────────

export type { OLTEEInputs, OLTEEOutputs, OLTEEIntermediates, EquationStep };
