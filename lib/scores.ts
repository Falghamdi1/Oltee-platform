// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Financial Intelligence Score Engine
//
// Derives four 0–100 scores from OLTEE inputs/outputs.
// Scores are post-OLTEE analytics — they are NEVER inputs to the equation.
//
// Score formulas are derived from the financial logic in the spec document:
//   Stability   — CF_ratio quality × income consistency (sigma)
//   Debt Health — return spread quality × distance from threshold
//   Efficiency  — how productive the borrowing capacity actually is
//   Resilience  — combined shock-absorption measurement
//
// All scores are clamped to [0, 100] and rounded to whole numbers.
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import type { OLTEEInputs, OLTEEOutputs, FinancialScores, ScoreDetail } from "@/types/oltee";
import { SCORE_DEFINITIONS } from "@/config/constants";
import { clamp, round } from "@/lib/utils";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Entry point: computes all four scores from validated inputs + outputs.
 * Delegates to the four individual score functions below.
 */
export function computeScores(
  inputs: OLTEEInputs,
  outputs: OLTEEOutputs
): FinancialScores {
  const { CF_ratio, sigma } = inputs;
  const { debt_ratio, L_star, intermediates, cap_applied } = outputs;
  const { delta, beta } = intermediates;

  return {
    stability:  computeStabilityScore(CF_ratio, sigma, debt_ratio, L_star),
    debtHealth: computeDebtHealthScore(delta, L_star, debt_ratio, cap_applied),
    efficiency: computeEfficiencyScore(intermediates.L_raw, debt_ratio, L_star),
    resilience: computeResilienceScore(
      beta, CF_ratio, debt_ratio, L_star, outputs.headroom_SAR, inputs.A
    ),
  };
}

/**
 * Returns enriched ScoreDetail objects for UI display.
 * Includes interpretation text and color classification.
 */
export function getScoreDetails(scores: FinancialScores): Record<keyof FinancialScores, ScoreDetail> {
  const keys: (keyof FinancialScores)[] = ["stability", "debtHealth", "efficiency", "resilience"];
  const result = {} as Record<keyof FinancialScores, ScoreDetail>;

  for (const key of keys) {
    const score = scores[key];
    const { label, description } = SCORE_DEFINITIONS[key];
    const interpreted = interpretScore(score);

    result[key] = {
      score,
      label,
      description,
      interpretation: interpreted.label,
      color: interpreted.color,
    };
  }

  return result;
}

// ─── Score 1: Financial Stability ────────────────────────────────────────────

/**
 * Financial Stability Score (0–100)
 *
 * Measures how comfortably the user can service their debt obligations,
 * accounting for income regularity.
 *
 * Formula:
 *   CF component  = (CF_ratio − 0.5) / (5.0 − 0.5) → [0, 1]  (0.5 is the minimum valid CF)
 *   Sigma penalty = 1 − sigma                        → [0, 1]
 *   Buffer bonus  = max(0, (L_star − debt_ratio) / L_star) → [0, 1]
 *
 *   stability = (CF × 0.50) + (sigma_inv × 0.35) + (buffer × 0.15)  × 100
 *   clamped to [0, 100]
 *
 * Rationale:
 *   CF_ratio is the dominant factor (50%) because it directly measures
 *   monthly serviceability. Sigma penalty (35%) represents the income
 *   stability risk that the β coefficient captures in the formula.
 *   Buffer (15%) rewards maintaining headroom above the threshold.
 *
 * NEG_SPREAD: stability can still be positive if CF is good and sigma is low.
 */
export function computeStabilityScore(
  CF_ratio: number,
  sigma: number,
  debt_ratio: number,
  L_star: number
): number {
  // CF component: normalise 0.5–5.0 range to 0–1
  const cf_norm = clamp((CF_ratio - 0.5) / (5.0 - 0.5), 0, 1);

  // Sigma penalty: lower sigma = more stable = higher score
  const sigma_inv = clamp(1 - sigma, 0, 1);

  // Buffer: how far below L* the current debt ratio sits
  const buffer = L_star > 0
    ? clamp((L_star - debt_ratio) / L_star, 0, 1)
    : 0;

  const raw = (cf_norm * 0.50) + (sigma_inv * 0.35) + (buffer * 0.15);
  return round(clamp(raw * 100, 0, 100), 0);
}

// ─── Score 2: Debt Health ─────────────────────────────────────────────────────

/**
 * Debt Health Score (0–100)
 *
 * Measures how productive the current debt position is.
 *
 * Formula:
 *   If NEG_SPREAD (delta ≤ 0): score = 0
 *   Spread quality = clamp(delta / 0.15, 0, 1)  → normalises 0–15% spread to 0–1
 *   Threshold buffer = clamp(1 − debt_ratio/L_star, 0, 1) → 0 at threshold, 1 at zero debt
 *   Cap bonus = cap_applied ? 0 : 0.10  → rewards not hitting the regulatory ceiling
 *
 *   debtHealth = (spread_quality × 0.50 + threshold_buffer × 0.40 + cap_bonus) × 100
 *
 * Rationale:
 *   A positive return spread means every borrowed riyal genuinely earns above
 *   its cost (per spec). The 15% normalisation ceiling reflects that spreads
 *   above 15% are exceptionally rare in personal finance and should score
 *   near-maximally. Position relative to L* (40%) reflects safety margin.
 */
export function computeDebtHealthScore(
  delta: number,
  L_star: number,
  debt_ratio: number,
  cap_applied: boolean
): number {
  // Negative spread: debt is destroying value — score must be zero
  if (delta <= 0) return 0;

  // Spread quality: normalise 0–15% spread → 0–1
  const spread_quality = clamp(delta / 0.15, 0, 1);

  // Buffer below threshold (0 if at or above L*, 1 if debt is zero)
  const threshold_buffer = L_star > 0
    ? clamp(1 - debt_ratio / L_star, 0, 1)
    : 0;

  // Small penalty for hitting the 0.70 hard cap (means formula yielded very high L*)
  const cap_bonus = cap_applied ? 0 : 0.10;

  const raw = (spread_quality * 0.50) + (threshold_buffer * 0.40) + cap_bonus;
  return round(clamp(raw * 100, 0, 100), 0);
}

// ─── Score 3: Leverage Efficiency ────────────────────────────────────────────

/**
 * Leverage Efficiency Score (0–100)
 *
 * Measures how efficiently the user's financial structure converts the OLTEE
 * equation's potential into a productive borrowing ceiling.
 *
 * Formula:
 *   If NEG_SPREAD: score = 0
 *   Position ratio = clamp(debt_ratio / L_star, 0, 1)
 *     → 0 = no debt used, 1 = exactly at ceiling
 *     Efficiency peaks in the CAUTION zone (85%–100% of L*): optimal utilisation
 *
 *   Zone scoring:
 *     debt/L* < 0.50: under-utilisation penalty → score = position_ratio × 60
 *     0.50 ≤ debt/L* < 0.85: productive zone   → score = 60 + (position_ratio − 0.50) / 0.35 × 30
 *     0.85 ≤ debt/L* < 1.0:  caution zone       → score = 90 + (1 − position_ratio) / 0.15 × 10
 *     debt/L* ≥ 1.0:          exceeded ceiling   → score = 0
 *
 * Rationale:
 *   Efficiency is about purposeful use of capacity — not about having no debt,
 *   and not about maximising debt. The peak score zone is the CAUTION band
 *   (85–100% of L*) where the user is productively leveraged without over-reaching.
 */
export function computeEfficiencyScore(
  L_raw: number,
  debt_ratio: number,
  L_star: number
): number {
  // NEG_SPREAD state (L_star = 0): efficiency is zero
  if (L_star <= 0 || L_raw <= 0) return 0;

  // Exceeded the ceiling: suboptimal, no efficiency credit
  if (debt_ratio >= L_star) return 0;

  const ratio = debt_ratio / L_star; // 0 → 1 as debt approaches ceiling

  let score: number;
  if (ratio < 0.50) {
    // Under-utilisation: up to 60 points linearly
    score = ratio * 120; // max 60 at ratio=0.50
  } else if (ratio < 0.85) {
    // Productive zone: 60–90 points
    score = 60 + ((ratio - 0.50) / 0.35) * 30;
  } else {
    // Caution zone: 90–100 points (peak efficiency just below L*)
    score = 90 + ((ratio - 0.85) / 0.15) * 10;
  }

  return round(clamp(score, 0, 100), 0);
}

// ─── Score 4: Financial Resilience ───────────────────────────────────────────

/**
 * Financial Resilience Score (0–100)
 *
 * Measures the user's ability to absorb adverse market conditions without
 * their leverage position becoming suboptimal.
 *
 * Formula:
 *   If NEG_SPREAD: score = 0
 *   Headroom ratio    = clamp(headroom_SAR / (L_star × A), 0, 1)  → % of asset base as buffer
 *   CF cushion        = clamp((CF_ratio − 1.0) / 4.0, 0, 1)       → excess above 1.0× floor
 *   Beta tolerance    = clamp(1 − (beta − 1.0) / 0.5, 0, 1)       → 1 at β=1.0, 0 at β=1.5
 *
 *   resilience = (headroom × 0.45) + (cf_cushion × 0.35) + (beta_tol × 0.20)  × 100
 *
 * Rationale:
 *   SAR headroom (45%) is the primary buffer — it is the direct dollar amount
 *   of capacity before breaching the threshold. CF cushion (35%) represents
 *   monthly service capacity beyond the minimum. Beta tolerance (20%) measures
 *   how much further the risk coefficient could rise before the formula tightens
 *   the threshold to below the current debt ratio.
 */
export function computeResilienceScore(
  beta: number,
  CF_ratio: number,
  debt_ratio: number,
  L_star: number,
  headroom_SAR: number,
  A: number
): number {
  // NEG_SPREAD state: no resilience
  if (L_star <= 0) return 0;

  // Headroom as a fraction of total asset base
  const max_headroom = L_star * A;
  const headroom_ratio = max_headroom > 0
    ? clamp(headroom_SAR / max_headroom, 0, 1)
    : 0;

  // CF cushion above 1.0× (1.0 = barely covering repayments)
  const cf_cushion = clamp((CF_ratio - 1.0) / 4.0, 0, 1);

  // Beta tolerance: β=1.0 (σ=0) is maximum resilience, β=1.5 (σ=1.0) is minimum
  const beta_tolerance = clamp(1 - (beta - 1.0) / 0.5, 0, 1);

  const raw = (headroom_ratio * 0.45) + (cf_cushion * 0.35) + (beta_tolerance * 0.20);
  return round(clamp(raw * 100, 0, 100), 0);
}

// ─── Score Interpretation ─────────────────────────────────────────────────────

/**
 * Maps a numeric score to a qualitative label and color.
 *
 * Thresholds:
 *   ≥ 70: "Strong" → optimal (green)
 *   40–69: "Moderate" → caution (amber)
 *   < 40: "Weak" → suboptimal (red)
 */
export function interpretScore(score: number): {
  label: string;
  color: "optimal" | "caution" | "suboptimal";
} {
  if (score >= 70) return { label: "Strong",   color: "optimal" };
  if (score >= 40) return { label: "Moderate", color: "caution" };
  return               { label: "Weak",      color: "suboptimal" };
}
