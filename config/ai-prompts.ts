// ═══════════════════════════════════════════════════════════════════════════
// OLTEE Platform — AI Prompt Architecture
//
// Complete prompt system for all four AI intelligence modes:
//   1. Full insight generation (8-section analysis)
//   2. Scenario commentary (2-sentence impact analysis)
//   3. Monte Carlo summary (3-sentence probability interpretation)
//   4. Negative spread guidance (specialised crisis mode)
//
// Design principles:
//   - Every prompt is self-contained — no shared mutable state
//   - Numbers are formatted to match what the user sees on screen
//   - Context notes guide the model toward user-relevant interpretations
//   - Output format is strict JSON — never prose wrapping JSON
//   - The model never knows it is "Claude" — it is "the OLTEE AI"
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import type {
  OLTEEInputs,
  OLTEEOutputs,
  FinancialScores,
  LeverageStatus,
  MonteCarloResult,
} from "@/types/oltee";

// ─── System Prompt ─────────────────────────────────────────────────────────

/**
 * System prompt for the OLTEE AI intelligence layer.
 *
 * Design decisions:
 * 1. Identity is "OLTEE AI" — not Claude — to preserve product coherence
 * 2. Equation context is brief — the user prompt supplies all the numbers
 * 3. Format rules are explicit and repeated — JSON compliance is critical
 * 4. "Never encourage taking on more debt" is a hard rule, not a suggestion
 * 5. SAR / GCC context sets tone without excluding global users
 */
export const AI_SYSTEM_PROMPT = `
You are the AI intelligence layer of OLTEE — the Optimal Leverage Threshold Engine, a financial engineering platform built on a novel equation developed by Faisal Alghamdi.

The OLTEE equation identifies the precise threshold where personal debt transitions from a wealth-building instrument into a financial liability. It is grounded in Modigliani-Miller theorem and Trade-Off Theory, adapted for individual borrowers in any market.

YOUR ROLE
- Receive the complete mathematical output of the OLTEE equation
- Translate every number into clear, actionable financial intelligence
- Write for users with NO finance background — explain everything simply
- Be specific to the person's actual numbers, not generic advice
- Be honest about risk — if the situation is concerning, say so directly but constructively
- Never encourage taking on more debt, regardless of headroom remaining
- Always recommend consulting a licensed financial advisor before any major decision

REGIONAL CONTEXT
Currency is SAR (Saudi Riyal). Users are primarily in Saudi Arabia and the GCC. Interest rates may be expressed as Islamic "profit rates" (same mathematical treatment). All advice applies globally.

OUTPUT FORMAT — STRICT JSON ONLY
Return a single valid JSON object. No text before or after the JSON.

{
  "executiveSummary": "2 sentences maximum",
  "riskAssessment": "2-3 sentences maximum",
  "leverageAnalysis": "2-3 sentences maximum",
  "strengths": ["One sentence each — 2 items only"],
  "weaknesses": ["One sentence each — 1 or 2 items only"],
  "recommendations": ["Action verb + one sentence", "Action verb + one sentence", "Action verb + one sentence"],
  "futureConsiderations": "2 sentences maximum",
  "personalizedGuidance": "1 sentence only"
}

CRITICAL OUTPUT RULES
- Return ONLY the JSON object — no preamble, no explanation, no markdown fences
- No markdown inside JSON values — no bold (**), no headers (#), no bullet hyphens (-)
- KEEP EVERY VALUE SHORT — each string field must fit in 1-3 sentences maximum
- strengths: exactly 2 items, one sentence each
- weaknesses: exactly 2 items, one sentence each
- recommendations: exactly 3 items, each starting with an action verb
- Never reproduce the formula or its symbols back to the user
- If the situation is NEGATIVE SPREAD (ROI below interest rate): executiveSummary must state borrowing is destroying value; all 3 recommendations must address reducing debt
- The personalizedGuidance must be 1 sentence only — the single most important thing

ABSOLUTE FINAL RULE — JSON ONLY
Your entire response must begin with { and end with }.
Do NOT write any text before the opening brace.
Do NOT write any text after the closing brace.
Do NOT wrap the JSON in markdown code fences.
The first character of your response must be { and the last must be }.
`.trim();

// ─── Primary Insight Prompt Builder ─────────────────────────────────────────

/**
 * Builds the full insight prompt for the 8-section AI analysis.
 *
 * Context notes are conditional — they only appear when the specific
 * threshold is crossed, keeping the prompt focused on what matters for
 * this person rather than cluttering with irrelevant context.
 */
export function buildInsightPrompt(
  inputs: OLTEEInputs,
  outputs: OLTEEOutputs,
  scores: FinancialScores
): string {
  const { ROI, r, T, sigma, CF_ratio, D, A } = inputs;
  const { L_star, debt_ratio, status, headroom_SAR, cap_applied, intermediates } = outputs;
  const { delta, alpha, beta } = intermediates;

  const statusDescription: Record<LeverageStatus, string> = {
    OPTIMAL:    "OPTIMAL — debt is functioning as a productive wealth-building instrument",
    CAUTION:    "CAUTION — approaching the upper boundary of safe leverage",
    SUBOPTIMAL: "SUBOPTIMAL — debt has exceeded the safe borrowing threshold",
    NEG_SPREAD: "NEGATIVE SPREAD — investment return is below borrowing cost; every borrowed riyal is losing money",
  };

  // Conditional context flags — only include what is relevant to this person
  const contextFlags: string[] = [];

  if (sigma <= 0.10) contextFlags.push("Income is very stable (government or large corporate salary equivalent) — low volatility risk");
  else if (sigma <= 0.20) contextFlags.push("Income is stable — modest volatility adds minor risk to debt servicing");
  else if (sigma >= 0.50) contextFlags.push("Income is significantly volatile — this meaningfully increases the risk of missing repayments during slow periods");
  else if (sigma >= 0.70) contextFlags.push("Income is highly volatile — this is a major risk factor that could quickly push debt from productive to harmful");

  if (CF_ratio < 1.0) contextFlags.push("CRITICAL: Monthly repayments exceed monthly income — immediate cash flow crisis risk");
  else if (CF_ratio < 1.2) contextFlags.push("Cash flow is dangerously tight — income barely covers repayments with almost no buffer");
  else if (CF_ratio < 1.5) contextFlags.push("Cash flow coverage is below comfortable levels — limited buffer for unexpected expenses");
  else if (CF_ratio > 2.5) contextFlags.push("Excellent cash flow cushion — strong monthly buffer above repayment obligations");

  if (delta <= 0) contextFlags.push("CRITICAL: Return on investment is at or below the interest rate — borrowing cannot be profitable under any circumstances");
  else if (delta < 0.01) contextFlags.push("Return spread is razor-thin (under 1%) — a small rate increase would eliminate all profit from borrowing");
  else if (delta < 0.02) contextFlags.push("Return spread is thin (under 2%) — sensitive to interest rate increases");
  else if (delta > 0.07) contextFlags.push("Strong positive spread — each borrowed riyal is generating meaningful profit above its cost");

  if (cap_applied) contextFlags.push("The formula's raw output exceeded 70% — the international regulatory ceiling was applied. This person has substantial theoretical borrowing capacity but the hard cap protects them from overleveraging");

  if (status === "CAUTION") {
    const pct_into_caution = L_star > 0
      ? ((debt_ratio - L_star * 0.85) / (L_star * 0.15) * 100).toFixed(0)
      : "0";
    contextFlags.push(`In caution zone: approximately ${pct_into_caution}% of the way from caution start to the ceiling — additional borrowing would cross into suboptimal territory`);
  }

  if (status === "SUBOPTIMAL") {
    const excess_SAR = Math.max(0, D - L_star * A);
    contextFlags.push(`Excess debt above safe threshold: approximately SAR ${excess_SAR.toLocaleString("en-SA")} — this is the amount that should be prioritised for repayment to return to the safe zone`);
  }

  const contextSection = contextFlags.length > 0
    ? `\nSITUATION-SPECIFIC CONTEXT\n${contextFlags.map(f => `- ${f}`).join("\n")}`
    : "";

  return `Analyze this person's financial leverage situation and return the JSON insight object.

OLTEE CALCULATION RESULTS

Overall status: ${statusDescription[status]}

INPUTS PROVIDED
- Annual investment return (ROI): ${(ROI * 100).toFixed(2)}%
- Annual loan interest / profit rate (r): ${(r * 100).toFixed(2)}%
- Effective tax rate (T): ${(T * 100).toFixed(1)}%
- Income volatility (σ): ${sigma.toFixed(2)}  [0.0 = perfectly stable, 1.0 = completely erratic]
- Cash flow coverage: ${CF_ratio.toFixed(2)}× monthly income vs monthly repayment
- Total debt (D): SAR ${D.toLocaleString("en-SA")}
- Total assets (A): SAR ${A.toLocaleString("en-SA")}

KEY COMPUTED OUTPUTS
- Current debt-to-asset ratio: ${(debt_ratio * 100).toFixed(1)}%
- Optimal leverage threshold (L*): ${(L_star * 100).toFixed(1)}%  [safe borrowing ceiling]
- Return spread (Δ = ROI − r): ${(delta * 100).toFixed(2)}%  [${delta > 0 ? "positive — borrowing generates net profit" : "NEGATIVE — borrowing destroys value"}]
- Tax efficiency factor (α = 1−T): ${alpha.toFixed(3)}  [fraction of interest burden after tax shield]
- Risk pressure factor (β = 1+σ×0.5): ${beta.toFixed(3)}  [amplifies effective debt cost based on income risk]
- Remaining safe headroom: SAR ${headroom_SAR.toLocaleString("en-SA")}  [${headroom_SAR > 0 ? "additional borrowing before threshold" : "already past threshold"}]
- Regulatory 70% cap applied: ${cap_applied ? "Yes — formula exceeded 70%, capped at hard limit" : "No — formula result is below 70%"}

FINANCIAL INTELLIGENCE SCORES  [0 = worst, 100 = best]
- Financial Stability (cash flow + income consistency): ${scores.stability}/100
- Debt Health (spread quality + position vs threshold): ${scores.debtHealth}/100
- Leverage Efficiency (productive use of borrowing capacity): ${scores.efficiency}/100
- Financial Resilience (ability to absorb shocks): ${scores.resilience}/100
${contextSection}

Generate the JSON insight object now. Be specific to these exact numbers.`.trim();
}

// ─── Negative Spread Specialised Prompt ──────────────────────────────────────

/**
 * When ROI ≤ r (NEG_SPREAD), the standard insight prompt is replaced
 * with this focused version. The entire analysis reorients around the
 * single most important fact: borrowing is destroying value.
 */
export function buildNegSpreadPrompt(
  inputs: OLTEEInputs,
  outputs: OLTEEOutputs,
  scores: FinancialScores
): string {
  const { ROI, r, D, A, CF_ratio, sigma } = inputs;
  const spread = (ROI - r) * 100;

  return `Analyze this financial situation where borrowing is actively losing money, and return the JSON insight object.

CRITICAL SITUATION: NEGATIVE RETURN SPREAD

This person's investment return (${(ROI * 100).toFixed(2)}%) is ${Math.abs(spread).toFixed(2)} percentage points BELOW their borrowing cost (${(r * 100).toFixed(2)}%). Every SAR they have borrowed is costing more than it earns. There is no mathematically safe leverage threshold — L* equals zero.

FULL PICTURE
- Debt: SAR ${D.toLocaleString("en-SA")}  |  Assets: SAR ${A.toLocaleString("en-SA")}
- Debt-to-asset ratio: ${(outputs.debt_ratio * 100).toFixed(1)}%
- Monthly cash flow coverage: ${CF_ratio.toFixed(2)}×
- Income volatility: ${sigma.toFixed(2)} [0=stable, 1=erratic]
- Stability score: ${scores.stability}/100  |  Resilience score: ${scores.resilience}/100

GUIDANCE FOR RESPONSE
The executiveSummary must clearly state that borrowing is currently costing more than it earns.
All three recommendations must focus on: (1) reducing the interest cost, (2) improving the investment return, or (3) reducing debt. Do not suggest taking on more debt under any framing.
The personalizedGuidance should be direct and honest — this is a financial situation that requires action, not reassurance.

Generate the JSON insight object now.`.trim();
}

// ─── Scenario Commentary Prompt ──────────────────────────────────────────────

/**
 * 2-sentence scenario impact commentary.
 * Called after each scenario preset is activated in the Scenario Lab.
 * Cached client-side by preset ID to avoid redundant API calls.
 */
export function buildScenarioCommentaryPrompt(
  scenarioName: string,
  baselineStatus: string,
  newStatus: string,
  baselineL_star: number,
  newL_star: number,
  baselineHeadroom: number,
  newHeadroom: number,
  baselineDebtRatio: number
): string {
  const L_star_delta = (newL_star - baselineL_star) * 100;
  const headroom_delta = newHeadroom - baselineHeadroom;
  const statusChanged = baselineStatus !== newStatus;

  return `You are the OLTEE AI. Write exactly 2 sentences of commentary on this scenario.

SCENARIO: "${scenarioName}"
Before: status ${baselineStatus}, safe ceiling ${(baselineL_star * 100).toFixed(1)}%, headroom SAR ${baselineHeadroom.toLocaleString("en-SA")}
After:  status ${newStatus}, safe ceiling ${(newL_star * 100).toFixed(1)}%, headroom SAR ${newHeadroom.toLocaleString("en-SA")}
Current debt ratio: ${(baselineDebtRatio * 100).toFixed(1)}% (unchanged by scenario)

Change in safe ceiling: ${L_star_delta > 0 ? "+" : ""}${L_star_delta.toFixed(1)} percentage points
Change in headroom: ${headroom_delta >= 0 ? "+" : ""}SAR ${Math.abs(headroom_delta).toLocaleString("en-SA")}
${statusChanged ? `STATUS CHANGE: moved from ${baselineStatus} to ${newStatus}` : "No status change"}

RULES:
- Sentence 1: what this scenario does to the safe borrowing ceiling and why
- Sentence 2: what the person should watch for or do as a result
- Be specific about the numbers
- Plain language only — no jargon
- Return ONLY the 2 sentences, nothing else`.trim();
}

// ─── Monte Carlo Summary Prompt ───────────────────────────────────────────────

/**
 * 3-sentence plain-language summary of Monte Carlo results.
 * Called once after simulation completes.
 */
export function buildMonteCarloSummaryPrompt(
  result: MonteCarloResult,
  debtRatio: number
): string {
  const { p_optimal, p_caution, p_suboptimal, p_neg_spread,
          p5_L_star, p50_L_star, p95_L_star, iterations_run,
          mean_L_star, std_L_star } = result;

  const riskLevel =
    p_suboptimal + p_neg_spread > 0.20 ? "significant" :
    p_suboptimal + p_neg_spread > 0.10 ? "moderate" :
    p_suboptimal + p_neg_spread > 0.05 ? "low" : "minimal";

  return `You are the OLTEE AI. Write exactly 3 sentences summarising these Monte Carlo simulation results.

SIMULATION: ${iterations_run.toLocaleString()} future scenarios with random variation in returns, interest rates, and income

RESULTS
- Probability of staying OPTIMAL:    ${(p_optimal * 100).toFixed(1)}%
- Probability of entering CAUTION:   ${(p_caution * 100).toFixed(1)}%
- Probability of becoming SUBOPTIMAL: ${(p_suboptimal * 100).toFixed(1)}%
- Probability of negative spread:     ${(p_neg_spread * 100).toFixed(1)}%
- Safe ceiling range (P5 to P95):     ${(p5_L_star * 100).toFixed(1)}% to ${(p95_L_star * 100).toFixed(1)}%
- Median safe ceiling (P50):          ${(p50_L_star * 100).toFixed(1)}%
- Current debt ratio:                 ${(debtRatio * 100).toFixed(1)}%  [held constant — only the ceiling varies]
- Overall risk level: ${riskLevel}

SENTENCE STRUCTURE:
- Sentence 1: what the dominant probability outcome means in plain terms
- Sentence 2: what the range of the safe ceiling (P5 to P95) tells us about uncertainty
- Sentence 3: the single most important risk factor to monitor, based on the numbers

Return ONLY the 3 sentences, nothing else. Plain language, no jargon.`.trim();
}

// ─── Prompt Router ────────────────────────────────────────────────────────────

/**
 * Selects the correct insight prompt based on the leverage status.
 * NEG_SPREAD uses a specialised prompt; all others use the standard one.
 */
export function buildInsightPromptForStatus(
  inputs: OLTEEInputs,
  outputs: OLTEEOutputs,
  scores: FinancialScores
): string {
  if (outputs.status === "NEG_SPREAD") {
    return buildNegSpreadPrompt(inputs, outputs, scores);
  }
  return buildInsightPrompt(inputs, outputs, scores);
}
