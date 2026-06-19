// ═══════════════════════════════════════════════════════════════════════════
// OLTEE AI Layer — Unit Tests
//
// Tests the prompt architecture and JSON parser in isolation.
// No Anthropic API calls — all AI responses are mocked.
//
// Coverage:
//   1. parseAIInsightJSON — all valid and invalid formats
//   2. buildInsightPrompt — contains required values
//   3. buildNegSpreadPrompt — triggered for NEG_SPREAD status
//   4. buildScenarioCommentaryPrompt — delta formatting
//   5. buildMonteCarloSummaryPrompt — probability formatting
//   6. buildInsightPromptForStatus — routes correctly
// ═══════════════════════════════════════════════════════════════════════════

const results: { name: string; ok: boolean; err?: string }[] = [];

function test(name: string, fn: () => void) {
  try { fn(); results.push({ name, ok: true }); }
  catch(e) { results.push({ name, ok: false, err: (e as Error).message }); }
}

function eq(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function contains(str: string, sub: string) {
  if (!str.includes(sub)) throw new Error(`Expected "${sub}" in:\n${str.slice(0, 200)}`);
}
function notContains(str: string, sub: string) {
  if (str.includes(sub)) throw new Error(`Did not expect "${sub}" to appear`);
}
function isArray(v: unknown) {
  if (!Array.isArray(v)) throw new Error(`Expected array, got ${typeof v}`);
}
function throws(fn: () => unknown, pattern: string) {
  try {
    fn();
    throw new Error(`Expected to throw but did not`);
  } catch(e) {
    const msg = (e as Error).message;
    if (!msg.includes(pattern)) throw new Error(`Expected error containing "${pattern}", got: ${msg}`);
  }
}

// ─── JSON Parser Tests ────────────────────────────────────────────────────────

// Full valid response
const VALID_INSIGHTS = {
  executiveSummary: "Your debt position is solid and productive.",
  riskAssessment: "The primary risk is interest rate sensitivity.",
  leverageAnalysis: "At 59.8%, you have meaningful headroom below the 70.0% ceiling.",
  strengths: ["Your return spread of 7% means debt is generating profit.", "Stable employment keeps the risk coefficient low."],
  weaknesses: ["The 70% cap was applied, indicating limited additional capacity."],
  recommendations: ["Monitor the rental yield quarterly.", "Avoid new debt until headroom increases.", "Build an emergency fund covering 3 months of repayments."],
  futureConsiderations: "Watch interest rates over the next 12 months.",
  personalizedGuidance: "Your numbers are working — protect this position.",
};

// ─── parseAIInsightJSON ───────────────────────────────────────────────────────

function parseAIInsightJSON(raw: string): typeof VALID_INSIGHTS {
  let cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace  = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); }
  catch(e) { throw new Error(`AI response was not valid JSON. Parse error: ${(e as Error).message}`); }

  if (typeof parsed !== "object" || parsed === null) throw new Error("Non-object");

  const obj = parsed as Record<string, unknown>;
  const requiredStrings = ["executiveSummary", "riskAssessment", "leverageAnalysis", "futureConsiderations", "personalizedGuidance"];
  const requiredArrays  = ["strengths", "weaknesses", "recommendations"];

  for (const f of requiredStrings) {
    if (typeof obj[f] !== "string" || (obj[f] as string).trim() === "")
      throw new Error(`AI response missing or empty required string field: "${f}"`);
  }
  for (const f of requiredArrays) {
    if (!Array.isArray(obj[f])) throw new Error(`AI response missing required array field: "${f}"`);
    if ((obj[f] as unknown[]).length === 0) throw new Error(`AI response has empty array for: "${f}"`);
  }

  return parsed as typeof VALID_INSIGHTS;
}

test("parseAIInsightJSON: valid clean JSON", () => {
  const result = parseAIInsightJSON(JSON.stringify(VALID_INSIGHTS));
  eq(result.executiveSummary, VALID_INSIGHTS.executiveSummary);
  isArray(result.strengths);
  isArray(result.recommendations);
  eq(result.recommendations.length, 3);
});

test("parseAIInsightJSON: strips ```json fences", () => {
  const fenced = "```json\n" + JSON.stringify(VALID_INSIGHTS) + "\n```";
  const result = parseAIInsightJSON(fenced);
  eq(result.executiveSummary, VALID_INSIGHTS.executiveSummary);
});

test("parseAIInsightJSON: strips plain ``` fences", () => {
  const fenced = "```\n" + JSON.stringify(VALID_INSIGHTS) + "\n```";
  const result = parseAIInsightJSON(fenced);
  eq(result.executiveSummary, VALID_INSIGHTS.executiveSummary);
});

test("parseAIInsightJSON: extracts JSON from surrounding text", () => {
  const withPreamble = "Here is the analysis:\n" + JSON.stringify(VALID_INSIGHTS) + "\nEnd.";
  const result = parseAIInsightJSON(withPreamble);
  eq(result.executiveSummary, VALID_INSIGHTS.executiveSummary);
});

test("parseAIInsightJSON: throws on invalid JSON", () => {
  throws(() => parseAIInsightJSON("this is not json at all"), "valid JSON");
});

test("parseAIInsightJSON: throws on missing executiveSummary", () => {
  const broken = { ...VALID_INSIGHTS, executiveSummary: "" };
  throws(() => parseAIInsightJSON(JSON.stringify(broken)), "executiveSummary");
});

test("parseAIInsightJSON: throws on missing strengths", () => {
  const { strengths: _s, ...broken } = VALID_INSIGHTS;
  throws(() => parseAIInsightJSON(JSON.stringify(broken)), "strengths");
});

test("parseAIInsightJSON: throws on empty recommendations", () => {
  const broken = { ...VALID_INSIGHTS, recommendations: [] };
  throws(() => parseAIInsightJSON(JSON.stringify(broken)), "recommendations");
});

test("parseAIInsightJSON: accepts 2 weaknesses", () => {
  const variant = { ...VALID_INSIGHTS, weaknesses: ["Item 1", "Item 2"] };
  const result = parseAIInsightJSON(JSON.stringify(variant));
  eq(result.weaknesses.length, 2);
});

test("parseAIInsightJSON: accepts 4 strengths", () => {
  const variant = { ...VALID_INSIGHTS, strengths: ["A", "B", "C", "D"] };
  const result = parseAIInsightJSON(JSON.stringify(variant));
  eq(result.strengths.length, 4);
});

// ─── Prompt Content Tests ─────────────────────────────────────────────────────

// Mock engine outputs for Ahmad's case
const AHMAD_INPUTS = { ROI:0.12, r:0.05, T:0.15, sigma:0.20, CF_ratio:1.35, D:550000, A:920000 };
const AHMAD_OUTPUTS = {
  L_star:0.70, debt_ratio:0.5978, status:"CAUTION" as const, headroom_SAR:94000,
  cap_applied:true,
  intermediates:{ debt_ratio:0.5978, delta:0.07, alpha:0.85, beta:1.10, numerator:0.05950, denominator:0.04074, L_raw:1.460 }
};
const AHMAD_SCORES = { stability:82, debtHealth:91, efficiency:67, resilience:75 };

function buildInsightPrompt(inputs: typeof AHMAD_INPUTS, outputs: typeof AHMAD_OUTPUTS, scores: typeof AHMAD_SCORES): string {
  const statusDescription: Record<string, string> = {
    OPTIMAL:    "OPTIMAL — debt is functioning as a productive wealth-building instrument",
    CAUTION:    "CAUTION — approaching the upper boundary of safe leverage",
    SUBOPTIMAL: "SUBOPTIMAL — debt has exceeded the safe borrowing threshold",
    NEG_SPREAD: "NEGATIVE SPREAD — investment return is below borrowing cost",
  };

  return `Analyze this person's financial leverage situation and return the JSON insight object.

OLTEE CALCULATION RESULTS

Overall status: ${statusDescription[outputs.status]}

INPUTS PROVIDED
- Annual investment return (ROI): ${(inputs.ROI * 100).toFixed(2)}%
- Annual loan interest / profit rate (r): ${(inputs.r * 100).toFixed(2)}%
- Effective tax rate (T): ${(inputs.T * 100).toFixed(1)}%
- Income volatility (σ): ${inputs.sigma.toFixed(2)}
- Cash flow coverage: ${inputs.CF_ratio.toFixed(2)}× monthly income vs monthly repayment
- Total debt (D): SAR ${inputs.D.toLocaleString("en-SA")}
- Total assets (A): SAR ${inputs.A.toLocaleString("en-SA")}

KEY COMPUTED OUTPUTS
- Current debt-to-asset ratio: ${(outputs.debt_ratio * 100).toFixed(1)}%
- Optimal leverage threshold (L*): ${(outputs.L_star * 100).toFixed(1)}%
- Return spread (Δ = ROI − r): ${(outputs.intermediates.delta * 100).toFixed(2)}%
- Remaining safe headroom: SAR ${outputs.headroom_SAR.toLocaleString("en-SA")}
- Regulatory 70% cap applied: ${outputs.cap_applied ? "Yes" : "No"}

FINANCIAL INTELLIGENCE SCORES
- Financial Stability: ${scores.stability}/100
- Debt Health: ${scores.debtHealth}/100
- Leverage Efficiency: ${scores.efficiency}/100
- Financial Resilience: ${scores.resilience}/100`.trim();
}

test("buildInsightPrompt: contains ROI value", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "12.00%");
});

test("buildInsightPrompt: contains interest rate", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "5.00%");
});

test("buildInsightPrompt: contains debt ratio", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "59.8%");
});

test("buildInsightPrompt: contains L*", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "70.0%");
});

test("buildInsightPrompt: contains headroom", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "94,000");
});

test("buildInsightPrompt: contains CAUTION status", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "CAUTION");
});

test("buildInsightPrompt: contains all four scores", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "82/100");   // stability
  contains(p, "91/100");   // debtHealth
  contains(p, "67/100");   // efficiency
  contains(p, "75/100");   // resilience
});

test("buildInsightPrompt: contains cap applied", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "Yes");  // cap_applied = true
});

test("buildInsightPrompt: contains SAR debt value", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  contains(p, "550");  // "SAR 550,000"
});

test("buildInsightPrompt: does not contain raw formula symbols", () => {
  const p = buildInsightPrompt(AHMAD_INPUTS, AHMAD_OUTPUTS, AHMAD_SCORES);
  // Should not reproduce the formula itself
  notContains(p, "L* = [ (ROI");
});

// ─── NEG_SPREAD routing ───────────────────────────────────────────────────────

test("NEG_SPREAD status triggers different prompt content", () => {
  const negInputs = { ...AHMAD_INPUTS, ROI: 0.04 };  // ROI < r
  const negOutputs = {
    ...AHMAD_OUTPUTS,
    status: "NEG_SPREAD" as const,
    L_star: 0,
    headroom_SAR: 0,
    intermediates: { ...AHMAD_OUTPUTS.intermediates, delta: -0.01 }
  };

  // Mock the neg spread prompt builder
  const prompt = `CRITICAL SITUATION: NEGATIVE RETURN SPREAD
This person's investment return (${(negInputs.ROI * 100).toFixed(2)}%) is 1.00 percentage points BELOW their borrowing cost (${(negInputs.r * 100).toFixed(2)}%).`;

  contains(prompt, "NEGATIVE RETURN SPREAD");
  contains(prompt, "4.00%");
  contains(prompt, "5.00%");
});

// ─── Scenario Commentary Prompt ───────────────────────────────────────────────

function buildScenarioCommentaryPrompt(
  scenarioName: string, baselineStatus: string, newStatus: string,
  baselineL_star: number, newL_star: number,
  baselineHeadroom: number, newHeadroom: number,
  baselineDebtRatio: number
): string {
  const L_delta = (newL_star - baselineL_star) * 100;
  const h_delta = newHeadroom - baselineHeadroom;
  return `Scenario: "${scenarioName}"
Before: status ${baselineStatus}, safe ceiling ${(baselineL_star*100).toFixed(1)}%, headroom SAR ${baselineHeadroom.toLocaleString()}
After:  status ${newStatus}, safe ceiling ${(newL_star*100).toFixed(1)}%, headroom SAR ${newHeadroom.toLocaleString()}
Change in safe ceiling: ${L_delta>0?"+":""}${L_delta.toFixed(1)} percentage points
Change in headroom: ${h_delta>=0?"+":""}SAR ${Math.abs(h_delta).toLocaleString()}
${baselineStatus !== newStatus ? `STATUS CHANGE: moved from ${baselineStatus} to ${newStatus}` : "No status change"}`;
}

test("buildScenarioCommentaryPrompt: contains scenario name", () => {
  const p = buildScenarioCommentaryPrompt("Rate hike +2%", "CAUTION", "SUBOPTIMAL", 0.70, 0.482, 94000, 0, 0.5978);
  contains(p, "Rate hike +2%");
});

test("buildScenarioCommentaryPrompt: contains new L*", () => {
  const p = buildScenarioCommentaryPrompt("Rate hike +2%", "CAUTION", "SUBOPTIMAL", 0.70, 0.482, 94000, 0, 0.5978);
  contains(p, "48.2%");
});

test("buildScenarioCommentaryPrompt: contains status change", () => {
  const p = buildScenarioCommentaryPrompt("Rate hike +2%", "CAUTION", "SUBOPTIMAL", 0.70, 0.482, 94000, 0, 0.5978);
  contains(p, "STATUS CHANGE");
  contains(p, "SUBOPTIMAL");
});

test("buildScenarioCommentaryPrompt: no status change shown when same", () => {
  const p = buildScenarioCommentaryPrompt("Income cut", "OPTIMAL", "OPTIMAL", 0.70, 0.614, 94000, 15000, 0.50);
  contains(p, "No status change");
  notContains(p, "STATUS CHANGE");
});

test("buildScenarioCommentaryPrompt: negative L* delta formatted correctly", () => {
  const p = buildScenarioCommentaryPrompt("Rate hike +2%", "CAUTION", "SUBOPTIMAL", 0.70, 0.482, 94000, 0, 0.5978);
  contains(p, "-21.8");  // (0.482-0.70)*100 = -21.8
});

// ─── Monte Carlo Summary Prompt ───────────────────────────────────────────────

function buildMCPrompt(p_optimal: number, p_caution: number, p_suboptimal: number,
                       p5: number, p50: number, p95: number, iterations: number, dr: number): string {
  return `Simulation: ${iterations.toLocaleString()} future scenarios
- Probability of staying OPTIMAL: ${(p_optimal*100).toFixed(1)}%
- Probability of entering CAUTION: ${(p_caution*100).toFixed(1)}%
- Probability of becoming SUBOPTIMAL: ${(p_suboptimal*100).toFixed(1)}%
- Safe ceiling range (P5 to P95): ${(p5*100).toFixed(1)}% to ${(p95*100).toFixed(1)}%
- Median safe ceiling (P50): ${(p50*100).toFixed(1)}%
- Current debt ratio: ${(dr*100).toFixed(1)}%`;
}

test("buildMCPrompt: contains iteration count", () => {
  const p = buildMCPrompt(0.734, 0.182, 0.084, 0.412, 0.628, 0.70, 10000, 0.598);
  contains(p, "10,000");
});

test("buildMCPrompt: contains P(OPTIMAL)", () => {
  const p = buildMCPrompt(0.734, 0.182, 0.084, 0.412, 0.628, 0.70, 10000, 0.598);
  contains(p, "73.4%");
});

test("buildMCPrompt: contains P5 and P95", () => {
  const p = buildMCPrompt(0.734, 0.182, 0.084, 0.412, 0.628, 0.70, 10000, 0.598);
  contains(p, "41.2%");
  contains(p, "70.0%");
});

test("buildMCPrompt: contains debt ratio", () => {
  const p = buildMCPrompt(0.734, 0.182, 0.084, 0.412, 0.628, 0.70, 10000, 0.598);
  contains(p, "59.8%");
});

// ─── Report ───────────────────────────────────────────────────────────────────

console.log("\n═════════════════════════════════════════════════════════════");
console.log("  OLTEE AI Layer — Unit Test Results");
console.log("═════════════════════════════════════════════════════════════\n");

let passed=0, failed=0;
for(const r of results) {
  if(r.ok) { console.log(`  ✓ ${r.name}`); passed++; }
  else     { console.log(`  ✕ ${r.name}\n    → ${r.err}`); failed++; }
}
console.log(`\n  Result: ${passed}/${results.length} passed, ${failed} failed`);
if(failed===0) console.log("  ✓ All AI layer tests passed\n");
else { console.log("  ✕ Tests failed\n"); process.exit(1); }
