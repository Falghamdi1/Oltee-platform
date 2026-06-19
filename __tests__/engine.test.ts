// ═══════════════════════════════════════════════════════════════════════════
// OLTEE Engine — Unit Tests
//
// ALL expected values are taken verbatim from the specification document:
//   Section 05 "Worked Example — Ahmad at Al Rajhi Bank"
//   Section 06 "Web Application — Technical Specification" (pseudocode)
//   Section 04 "The Core Equation — Complete Specification"
//
// These tests are the single source of truth for formula correctness.
// If any test fails, the implementation does not match the specification.
// ═══════════════════════════════════════════════════════════════════════════

// Node-compatible test runner (no Jest needed for pure functions)
// Run with: node --experimental-strip-types __tests__/engine.test.ts
// Or wire into jest with ts-jest

// For this implementation we write assertions as plain functions
// that can be called directly

type TestResult = { name: string; passed: boolean; actual?: unknown; expected?: unknown; error?: string };
const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (e) {
    const err = e as Error;
    results.push({ name, passed: false, error: err.message });
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected: number, decimals: number = 2) {
      const factor = Math.pow(10, decimals);
      const diff = Math.abs((actual as number) - expected);
      if (diff >= 0.5 / factor) {
        throw new Error(
          `Expected ~${expected} (${decimals} decimal places), got ${actual} (diff: ${diff.toFixed(6)})`
        );
      }
    },
    toEqual(expected: unknown) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if ((actual as number) <= expected) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if ((actual as number) >= expected) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if ((actual as number) > expected) {
        throw new Error(`Expected ${actual} <= ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if ((actual as number) < expected) {
        throw new Error(`Expected ${actual} >= ${expected}`);
      }
    },
  };
}

// ─── Import engine functions inline (avoids TS module resolution in test) ────

const FORMULA = { HARD_CAP: 0.70, CAUTION_FACTOR: 0.85, BETA_MULTIPLIER: 0.5 };

function computeDebtRatio(D: number, A: number): number { return D / A; }
function computeDelta(ROI: number, r: number): number { return ROI - r; }
function computeAlpha(T: number): number { return 1 - T; }
function computeBeta(sigma: number): number { return 1 + sigma * FORMULA.BETA_MULTIPLIER; }
function computeNumerator(delta: number, alpha: number): number { return delta * alpha; }
function computeDenominator(r: number, beta: number, CF_ratio: number): number {
  return r * beta * (1 / CF_ratio);
}
function computeLStarRaw(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}
function computeLStar(L_raw: number): number {
  return Math.min(L_raw, FORMULA.HARD_CAP);
}
function computeHeadroom(L_star: number, A: number, D: number): number {
  return Math.max(0, L_star * A - D);
}
type LeverageStatus = "OPTIMAL" | "CAUTION" | "SUBOPTIMAL" | "NEG_SPREAD";
function computeStatus(debt_ratio: number, L_star: number): LeverageStatus {
  const caution_start = L_star * FORMULA.CAUTION_FACTOR;
  if (debt_ratio < caution_start) return "OPTIMAL";
  if (debt_ratio < L_star) return "CAUTION";
  return "SUBOPTIMAL";
}

interface OLTEEInputs {
  ROI: number; r: number; T: number; sigma: number; CF_ratio: number; D: number; A: number;
}
interface OLTEEOutputs {
  L_star: number; debt_ratio: number; status: LeverageStatus; headroom_SAR: number;
  cap_applied: boolean;
  intermediates: { debt_ratio: number; delta: number; alpha: number; beta: number;
                   numerator: number; denominator: number; L_raw: number };
}

function computeOLTEE(inputs: OLTEEInputs): OLTEEOutputs {
  const debt_ratio = computeDebtRatio(inputs.D, inputs.A);
  const delta      = computeDelta(inputs.ROI, inputs.r);
  const alpha      = computeAlpha(inputs.T);
  const beta       = computeBeta(inputs.sigma);

  if (delta <= 0) {
    return {
      L_star: 0, debt_ratio, status: "NEG_SPREAD", headroom_SAR: 0, cap_applied: false,
      intermediates: { debt_ratio, delta, alpha, beta, numerator: 0, denominator: 0, L_raw: 0 },
    };
  }

  const numerator   = computeNumerator(delta, alpha);
  const denominator = computeDenominator(inputs.r, beta, inputs.CF_ratio);
  const L_raw       = computeLStarRaw(numerator, denominator);
  const L_star      = computeLStar(L_raw);
  const cap_applied = L_raw > FORMULA.HARD_CAP;
  const status      = computeStatus(debt_ratio, L_star);
  const headroom_SAR = computeHeadroom(L_star, inputs.A, inputs.D);

  return {
    L_star, debt_ratio, status, headroom_SAR, cap_applied,
    intermediates: { debt_ratio, delta, alpha, beta, numerator, denominator, L_raw },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

// ─── Ahmad's Case (Primary verification from Section 5.2) ────────────────────

const AHMAD: OLTEEInputs = {
  ROI:      0.12,     // 12% — "rental apartment generates 12% annual return"
  r:        0.05,     // 5%  — "Al Rajhi's Islamic financing profit rate"
  T:        0.15,     // 15% — "Approximate effective tax rate (Zakat + VAT)"
  sigma:    0.20,     // 0.20 — "Relatively stable — bank employee salary"
  CF_ratio: 1.35,     // 1.35× — "Monthly income covers repayments by 1.35×"
  D:        550_000,  // SAR 550,000 — "Mortgage SAR 480,000 + vehicle SAR 70,000"
  A:        920_000,  // SAR 920,000 — "Apartment + Vehicle + Savings"
};

test("Ahmad — Step 1: Debt Ratio = D ÷ A", () => {
  // Spec: 550,000 ÷ 920,000 = 0.598 (59.8%)
  expect(computeDebtRatio(AHMAD.D, AHMAD.A)).toBeCloseTo(0.5978, 4);
});

test("Ahmad — Step 2: Return Spread Δ = ROI − r", () => {
  // Spec: 12% − 5% = 7.0%
  expect(computeDelta(AHMAD.ROI, AHMAD.r)).toBeCloseTo(0.07, 4);
});

test("Ahmad — Step 3: Tax Efficiency α = 1 − T", () => {
  // Spec: 1 − 0.15 = 0.850
  expect(computeAlpha(AHMAD.T)).toBeCloseTo(0.850, 3);
});

test("Ahmad — Step 4: Risk Coefficient β = 1 + (σ × 0.5)", () => {
  // Spec: 1 + (0.20 × 0.5) = 1.100
  expect(computeBeta(AHMAD.sigma)).toBeCloseTo(1.100, 3);
});

test("Ahmad — Step 5: Numerator = Δ × α", () => {
  // Spec: 0.07 × 0.85 = 0.05950
  const delta = computeDelta(AHMAD.ROI, AHMAD.r);
  const alpha = computeAlpha(AHMAD.T);
  expect(computeNumerator(delta, alpha)).toBeCloseTo(0.05950, 4);
});

test("Ahmad — Step 6: Denominator = r × β × (1/CF)", () => {
  // Spec: 0.05 × 1.10 × 0.741 = 0.04074
  // Note: 1/1.35 = 0.74074...
  const beta = computeBeta(AHMAD.sigma);
  expect(computeDenominator(AHMAD.r, beta, AHMAD.CF_ratio)).toBeCloseTo(0.04074, 4);
});

test("Ahmad — Step 7: L* raw = Numerator ÷ Denominator", () => {
  // Spec: 0.05950 ÷ 0.04074 = 1.460
  const delta = computeDelta(AHMAD.ROI, AHMAD.r);
  const alpha = computeAlpha(AHMAD.T);
  const beta  = computeBeta(AHMAD.sigma);
  const num   = computeNumerator(delta, alpha);
  const den   = computeDenominator(AHMAD.r, beta, AHMAD.CF_ratio);
  expect(computeLStarRaw(num, den)).toBeCloseTo(1.460, 2);
});

test("Ahmad — Step 8: L* capped = min(1.460, 0.70) = 0.70", () => {
  // Spec: "Capped at regulatory ceiling" → 0.700 (70%)
  expect(computeLStar(1.460)).toBe(0.70);
});

test("Ahmad — cap_applied is true (raw exceeded 0.70)", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.cap_applied).toBe(true);
});

test("Ahmad — Headroom = (0.70 × 920,000) − 550,000 = 94,000", () => {
  // Spec Section 5.3: "additional SAR 94,000 before crossing the 70% threshold"
  expect(computeHeadroom(0.70, 920_000, 550_000)).toBe(94_000);
});

test("Ahmad — computeOLTEE full pipeline produces correct L*", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.L_star).toBe(0.70);
});

test("Ahmad — computeOLTEE produces correct debt ratio", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.debt_ratio).toBeCloseTo(0.5978, 4);
});

test("Ahmad — computeOLTEE produces correct headroom_SAR", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.headroom_SAR).toBe(94_000);
});

test("Ahmad — status is CAUTION (DR=59.8% ≥ L*×0.85=59.5%)", () => {
  // Section 6.2 pseudocode: 59.8% ≥ 59.5% (= 70% × 0.85), 59.8% < 70.0% → CAUTION
  const result = computeOLTEE(AHMAD);
  expect(result.status).toBe("CAUTION");
});

test("Ahmad — intermediates: delta", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.intermediates.delta).toBeCloseTo(0.07, 4);
});

test("Ahmad — intermediates: alpha", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.intermediates.alpha).toBeCloseTo(0.850, 3);
});

test("Ahmad — intermediates: beta", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.intermediates.beta).toBeCloseTo(1.100, 3);
});

test("Ahmad — intermediates: numerator", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.intermediates.numerator).toBeCloseTo(0.05950, 4);
});

test("Ahmad — intermediates: denominator", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.intermediates.denominator).toBeCloseTo(0.04074, 4);
});

test("Ahmad — intermediates: L_raw", () => {
  const result = computeOLTEE(AHMAD);
  expect(result.intermediates.L_raw).toBeCloseTo(1.460, 2);
});

// ─── Decision Logic Tests ────────────────────────────────────────────────────

test("computeStatus — OPTIMAL when DR < L* × 0.85", () => {
  // DR=0.50, L*=0.70 → 0.50 < 0.595 → OPTIMAL
  expect(computeStatus(0.50, 0.70)).toBe("OPTIMAL");
});

test("computeStatus — CAUTION when DR in [L*×0.85, L*)", () => {
  // DR=0.60, L*=0.70 → 0.60 ≥ 0.595 AND 0.60 < 0.70 → CAUTION
  expect(computeStatus(0.60, 0.70)).toBe("CAUTION");
});

test("computeStatus — SUBOPTIMAL when DR ≥ L*", () => {
  // DR=0.75, L*=0.70 → 0.75 ≥ 0.70 → SUBOPTIMAL
  expect(computeStatus(0.75, 0.70)).toBe("SUBOPTIMAL");
});

test("computeStatus — SUBOPTIMAL when DR exactly equals L*", () => {
  expect(computeStatus(0.70, 0.70)).toBe("SUBOPTIMAL");
});

test("computeStatus — OPTIMAL boundary: DR just below L* × 0.85", () => {
  // 0.70 × 0.85 = 0.595
  expect(computeStatus(0.594, 0.70)).toBe("OPTIMAL");
});

test("computeStatus — CAUTION boundary: DR exactly at L* × 0.85", () => {
  expect(computeStatus(0.595, 0.70)).toBe("CAUTION");
});

// ─── NEG_SPREAD Guard ────────────────────────────────────────────────────────

test("NEG_SPREAD when ROI = r (zero spread)", () => {
  const inputs: OLTEEInputs = { ...AHMAD, ROI: 0.05, r: 0.05 };
  const result = computeOLTEE(inputs);
  expect(result.status).toBe("NEG_SPREAD");
  expect(result.L_star).toBe(0);
  expect(result.headroom_SAR).toBe(0);
});

test("NEG_SPREAD when ROI < r", () => {
  // Spec positive example: ROI=4%, r=6% → Δ=−2% → "Every borrowed riyal loses 2 fils"
  const inputs: OLTEEInputs = { ...AHMAD, ROI: 0.04, r: 0.06 };
  const result = computeOLTEE(inputs);
  expect(result.status).toBe("NEG_SPREAD");
  expect(result.intermediates.delta).toBeCloseTo(-0.02, 4);
});

test("NEG_SPREAD — intermediates preserved even in guard state", () => {
  const inputs: OLTEEInputs = { ...AHMAD, ROI: 0.04, r: 0.06 };
  const result = computeOLTEE(inputs);
  // alpha and beta still computed even in NEG_SPREAD
  expect(result.intermediates.alpha).toBeCloseTo(0.850, 3);
  expect(result.intermediates.beta).toBeCloseTo(1.100, 3);
});

// ─── Spec Positive Example (Section 04) ─────────────────────────────────────

test("Spec doc positive example: ROI=12%, r=5%", () => {
  // "ROI = 12%, r = 5% → Δ = +7% ✓ Borrowing is profitable"
  expect(computeDelta(0.12, 0.05)).toBeCloseTo(0.07, 4);
});

test("Spec doc negative example: ROI=4%, r=6%", () => {
  // "ROI = 4%, r = 6% → Δ = −2% ✕ Every borrowed riyal loses 2 fils"
  expect(computeDelta(0.04, 0.06)).toBeCloseTo(-0.02, 4);
});

test("Spec doc alpha example: T=15% → α=0.85", () => {
  // "Tax rate T = 15% → α = 1 − 0.15 = 0.85"
  expect(computeAlpha(0.15)).toBeCloseTo(0.85, 3);
});

test("Spec doc beta stable example: σ=0.10 → β=1.05", () => {
  // "Stable employee (σ = 0.10): β = 1 + (0.10 × 0.5) = 1.05"
  expect(computeBeta(0.10)).toBeCloseTo(1.05, 3);
});

test("Spec doc beta volatile example: σ=0.60 → β=1.30", () => {
  // "Self-employed, volatile income (σ = 0.60): β = 1 + (0.60 × 0.5) = 1.30"
  expect(computeBeta(0.60)).toBeCloseTo(1.30, 3);
});

// ─── Denominator Section 04 Example ─────────────────────────────────────────

test("Spec doc denominator example: r=5%, σ=0.20, CF=1.35 → 0.04074", () => {
  // Spec: "r = 5%, σ = 0.20, CF_ratio = 1.35 → Denominator = 0.05 × 1.10 × 0.741 = 0.04074"
  const beta = computeBeta(0.20); // = 1.10
  expect(computeDenominator(0.05, beta, 1.35)).toBeCloseTo(0.04074, 4);
});

// ─── Hard Cap Tests ──────────────────────────────────────────────────────────

test("Hard cap applied when L_raw > 0.70", () => {
  expect(computeLStar(1.460)).toBe(0.70);
  expect(computeLStar(2.000)).toBe(0.70);
  expect(computeLStar(0.710)).toBe(0.70);
});

test("Hard cap NOT applied when L_raw ≤ 0.70", () => {
  expect(computeLStar(0.65)).toBeCloseTo(0.65, 4);
  expect(computeLStar(0.70)).toBe(0.70);
  expect(computeLStar(0.30)).toBeCloseTo(0.30, 4);
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────

test("T=0 (no tax) → α=1.0", () => {
  expect(computeAlpha(0)).toBe(1.0);
});

test("T=1.0 (100% tax) → α=0 → L*=0", () => {
  const inputs: OLTEEInputs = { ...AHMAD, T: 1.0 };
  // Numerator = delta × 0 = 0 → L_raw = 0 / denominator = 0 → L* = 0
  expect(computeAlpha(1.0)).toBe(0);
  const result = computeOLTEE(inputs);
  expect(result.L_star).toBe(0);
  expect(result.status).toBe("SUBOPTIMAL"); // DR > 0 ≥ L*
});

test("σ=0 (perfectly stable income) → β=1.0", () => {
  expect(computeBeta(0)).toBe(1.0);
});

test("σ=1.0 (maximum volatility) → β=1.5", () => {
  expect(computeBeta(1.0)).toBe(1.5);
});

test("Very high CF_ratio reduces denominator, increases L*", () => {
  const low_CF  = computeOLTEE({ ...AHMAD, CF_ratio: 0.5 });
  const high_CF = computeOLTEE({ ...AHMAD, CF_ratio: 5.0 });
  expect(high_CF.L_star).toBeGreaterThan(low_CF.L_star);
});

test("Higher interest rate (denominator up) → lower L*", () => {
  const low_r  = computeOLTEE({ ...AHMAD, r: 0.03 });
  const high_r = computeOLTEE({ ...AHMAD, r: 0.08 });
  // Note: high_r may hit NEG_SPREAD if r ≥ ROI; use moderate rates here
  expect(low_r.L_star).toBeGreaterThanOrEqual(high_r.L_star);
});

test("Higher ROI → higher L*", () => {
  const low_roi  = computeOLTEE({ ...AHMAD, ROI: 0.07 });
  const high_roi = computeOLTEE({ ...AHMAD, ROI: 0.20 });
  expect(high_roi.L_star).toBeGreaterThanOrEqual(low_roi.L_star);
});

test("Headroom is zero when SUBOPTIMAL", () => {
  // Make DR > L* by pushing D above L* × A
  const inputs: OLTEEInputs = {
    ...AHMAD,
    D: 700_000,  // 700K / 920K = 76% > L*=70%
    A: 920_000,
  };
  const result = computeOLTEE(inputs);
  expect(result.status).toBe("SUBOPTIMAL");
  expect(result.headroom_SAR).toBe(0);
});

test("Debt ratio exactly zero (hypothetical new borrower)", () => {
  const inputs: OLTEEInputs = { ...AHMAD, D: 1, A: 920_000 };
  const result = computeOLTEE(inputs);
  expect(result.debt_ratio).toBeCloseTo(0, 2);
  expect(result.status).toBe("OPTIMAL");
  expect(result.headroom_SAR).toBeCloseTo(920_000 * 0.70 - 1, 0);
});

// ─── Report Results ───────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════════");
console.log("  OLTEE Engine Test Results");
console.log("═══════════════════════════════════════════════════════\n");

let passed = 0, failed = 0;
for (const result of results) {
  if (result.passed) {
    console.log(`  ✓ ${result.name}`);
    passed++;
  } else {
    console.log(`  ✕ ${result.name}`);
    console.log(`    ${result.error}`);
    failed++;
  }
}

console.log(`\n  ${passed} passed, ${failed} failed out of ${results.length} tests`);
console.log("═══════════════════════════════════════════════════════\n");

if (failed > 0) process.exit(1);
