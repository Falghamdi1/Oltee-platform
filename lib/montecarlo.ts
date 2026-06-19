// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Monte Carlo Simulation Engine
//
// Runs N stochastic iterations of the OLTEE equation to produce
// probability distributions and confidence ranges over possible futures.
//
// Stochastic variables (sampled with Normal distribution):
//   ROI      ~ Normal(baseline_ROI,   σ_ROI=0.03)      clipped to [0.001, 1.0]
//   r        ~ Normal(baseline_r,     σ_r=0.01)         clipped to [0.001, 0.30]
//   sigma    ~ Normal(baseline_sigma, σ_sigma=0.05)     clipped to [0.0, 1.0]
//   CF_ratio ~ Normal(baseline_CF,    σ_CF=0.15)        clipped to [0.5, 5.0]
//
// Deterministic (held constant across all iterations):
//   D (total debt)    — user's actual debt position
//   A (total assets)  — user's actual asset base
//   T (tax rate)      — regulatory/jurisdictional, stable
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import type {
  OLTEEInputs,
  MonteCarloConfig,
  MonteCarloResult,
  HistogramBin,
  LeverageStatus,
} from "@/types/oltee";

import { MONTE_CARLO_CONFIG, RANGES } from "@/config/constants";
import { computeOLTEE } from "@/lib/engine";
import { clamp, sortedNumbers, mean, stddev, yieldToEventLoop } from "@/lib/utils";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Synchronous simulation — runs all iterations in one blocking call.
 * Use only in Web Workers or server-side contexts.
 * For browser use, call runMonteCarloSimulationAsync instead.
 */
export function runMonteCarloSimulation(
  baseInputs: OLTEEInputs,
  config?: Partial<MonteCarloConfig>
): MonteCarloResult {
  const cfg = buildConfig(config);
  const start = performance.now();

  const L_stars:  number[]        = [];
  const statuses: LeverageStatus[] = [];

  for (let i = 0; i < cfg.iterations; i++) {
    const inputs = sampleInputs(baseInputs, cfg);
    const output = computeOLTEE(inputs);
    L_stars.push(output.L_star);
    statuses.push(output.status);
  }

  return assembleResult(cfg, L_stars, statuses, baseInputs.D / baseInputs.A, performance.now() - start);
}

/**
 * Async simulation — yields to the event loop every 500 iterations
 * so the UI thread stays responsive. Use this in browser components.
 *
 * @param onProgress - Called with 0.0–1.0 progress fraction
 */
export async function runMonteCarloSimulationAsync(
  baseInputs: OLTEEInputs,
  config?: Partial<MonteCarloConfig>,
  onProgress?: (progress: number) => void
): Promise<MonteCarloResult> {
  const cfg = buildConfig(config);
  const start = performance.now();

  const L_stars:  number[]        = [];
  const statuses: LeverageStatus[] = [];
  const YIELD_EVERY = 500;

  for (let i = 0; i < cfg.iterations; i++) {
    const inputs = sampleInputs(baseInputs, cfg);
    const output = computeOLTEE(inputs);
    L_stars.push(output.L_star);
    statuses.push(output.status);

    // Yield to event loop periodically
    if (i > 0 && i % YIELD_EVERY === 0) {
      onProgress?.(i / cfg.iterations);
      await yieldToEventLoop();
    }
  }

  onProgress?.(1.0);
  return assembleResult(cfg, L_stars, statuses, baseInputs.D / baseInputs.A, performance.now() - start);
}

/**
 * Builds the histogram from flat arrays of L* values and their statuses.
 * Uses HISTOGRAM_BINS equally-spaced bins over [0, HARD_CAP=0.70].
 *
 * Each bin's status is classified by where it falls relative to the
 * baseline debt ratio that the caller must pass in.
 */
export function buildHistogram(
  L_stars: number[],
  statuses: LeverageStatus[],
  bins: number = MONTE_CARLO_CONFIG.HISTOGRAM_BINS
): HistogramBin[] {
  const BIN_MAX = 0.70;
  const binWidth = BIN_MAX / bins;
  const counts = new Array<number>(bins).fill(0);
  const statusCounts = new Array<Map<LeverageStatus, number>>(bins)
    .fill(null as unknown as Map<LeverageStatus, number>)
    .map(() => new Map<LeverageStatus, number>());

  for (let i = 0; i < L_stars.length; i++) {
    const L = Math.min(L_stars[i]!, BIN_MAX);
    const binIndex = Math.min(Math.floor(L / binWidth), bins - 1);
    counts[binIndex] = (counts[binIndex] ?? 0) + 1;
    const statusMap = statusCounts[binIndex]!;
    statusMap.set(statuses[i]!, (statusMap.get(statuses[i]!) ?? 0) + 1);
  }

  const total = L_stars.length;
  return counts.map((count, i) => {
    const rangeStart = i * binWidth;
    const rangeEnd   = rangeStart + binWidth;
    const statusMap  = statusCounts[i]!;

    // Dominant status for this bin
    let dominantStatus: LeverageStatus | "mixed" = "mixed";
    let maxCount = 0;
    const uniqueStatuses = new Set(statusMap.keys());
    if (uniqueStatuses.size === 1) {
      dominantStatus = [...uniqueStatuses][0]!;
    } else {
      for (const [status, c] of statusMap) {
        if (c > maxCount) { maxCount = c; dominantStatus = status; }
      }
    }

    return {
      rangeStart,
      rangeEnd,
      label: `${(rangeStart * 100).toFixed(0)}–${(rangeEnd * 100).toFixed(0)}%`,
      count,
      frequency: total > 0 ? count / total : 0,
      status: dominantStatus,
    } as HistogramBin;
  });
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Samples one stochastic set of OLTEE inputs from Normal distributions.
 * D, A, T are held constant as specified.
 */
function sampleInputs(base: OLTEEInputs, cfg: MonteCarloConfig): OLTEEInputs {
  return {
    ROI:      sampleNormalClamped(base.ROI,      cfg.sigma_ROI,      RANGES.ROI.min,      RANGES.ROI.max),
    r:        sampleNormalClamped(base.r,        cfg.sigma_r,        RANGES.r.min,        RANGES.r.max),
    T:        base.T,    // deterministic
    sigma:    sampleNormalClamped(base.sigma,    cfg.sigma_sigma,    RANGES.sigma.min,    RANGES.sigma.max),
    CF_ratio: sampleNormalClamped(base.CF_ratio, cfg.sigma_CF_ratio, RANGES.CF_ratio.min, RANGES.CF_ratio.max),
    D:        base.D,    // deterministic
    A:        base.A,    // deterministic
  };
}

/**
 * Assembles the final MonteCarloResult from collected iteration data.
 */
function assembleResult(
  cfg: MonteCarloConfig,
  L_stars: number[],
  statuses: LeverageStatus[],
  debt_ratio_fixed: number,
  duration_ms: number
): MonteCarloResult {
  const sorted = sortedNumbers(L_stars);
  const total  = L_stars.length;

  const p_optimal   = statuses.filter(s => s === "OPTIMAL").length   / total;
  const p_caution   = statuses.filter(s => s === "CAUTION").length   / total;
  const p_suboptimal = statuses.filter(s => s === "SUBOPTIMAL").length / total;
  const p_neg_spread = statuses.filter(s => s === "NEG_SPREAD").length / total;

  return {
    config:            cfg,
    iterations_run:    total,
    p_optimal,
    p_caution,
    p_suboptimal,
    p_neg_spread,
    p5_L_star:        percentile(sorted, 5),
    p25_L_star:       percentile(sorted, 25),
    p50_L_star:       percentile(sorted, 50),
    p75_L_star:       percentile(sorted, 75),
    p95_L_star:       percentile(sorted, 95),
    mean_L_star:      mean(L_stars),
    std_L_star:       stddev(L_stars),
    debt_ratio_fixed,
    histogram:        buildHistogram(L_stars, statuses, MONTE_CARLO_CONFIG.HISTOGRAM_BINS),
    duration_ms,
  };
}

// ─── Statistical Primitives ───────────────────────────────────────────────────

/**
 * Box-Muller transform.
 * Generates a standard normal random variable (μ=0, σ=1).
 * Uses two independent uniform samples to produce one Gaussian sample.
 */
export function sampleStandardNormal(): number {
  // Avoid log(0) by using a small epsilon guard
  const u1 = Math.max(Math.random(), 1e-10);
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Samples from Normal(mean, stddev) and clips the result to [min, max].
 */
export function sampleNormalClamped(
  mu: number,
  sigma: number,
  min: number,
  max: number
): number {
  const sample = mu + sampleStandardNormal() * sigma;
  return clamp(sample, min, max);
}

/**
 * Computes the Nth percentile of a pre-sorted ascending array.
 * Uses linear interpolation between adjacent values.
 *
 * @param sorted - Array already sorted ascending
 * @param p      - Percentile (0–100)
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (p <= 0)   return sorted[0]!;
  if (p >= 100) return sorted[sorted.length - 1]!;

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const frac  = index - lower;

  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + frac * (sorted[upper]! - sorted[lower]!);
}

/**
 * Returns a complete MonteCarloConfig with defaults overridden by any
 * provided partial config.
 */
export function buildConfig(overrides?: Partial<MonteCarloConfig>): MonteCarloConfig {
  return {
    iterations:    MONTE_CARLO_CONFIG.DEFAULT_ITERATIONS,
    sigma_ROI:     MONTE_CARLO_CONFIG.SIGMA_ROI,
    sigma_r:       MONTE_CARLO_CONFIG.SIGMA_R,
    sigma_sigma:   MONTE_CARLO_CONFIG.SIGMA_SIGMA,
    sigma_CF_ratio: MONTE_CARLO_CONFIG.SIGMA_CF_RATIO,
    ...overrides,
  };
}
