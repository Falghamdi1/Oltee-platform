// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Formatting Utilities
//
// All number, percentage, and currency formatting for display.
// Single source of truth — never format numbers inline in components.
// ═══════════════════════════════════════════════════════════════════════════

import { FORMAT } from "@/config/constants";

// ─── SAR Currency ─────────────────────────────────────────────────────────────

/**
 * Formats a number as SAR currency.
 * Example: 550000 → "SAR 550,000"
 */
export function formatSAR(value: number, decimals = FORMAT.SARDecimals): string {
  return `SAR ${value.toLocaleString(FORMAT.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Formats a large SAR value with abbreviated suffix for display.
 * Example: 1500000 → "SAR 1.5M" | 750000 → "SAR 750K"
 */
export function formatSARShort(value: number): string {
  if (value >= 1_000_000) {
    return `SAR ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `SAR ${(value / 1_000).toFixed(0)}K`;
  }
  return formatSAR(value);
}

// ─── Percentages ──────────────────────────────────────────────────────────────

/**
 * Formats a decimal ratio as a percentage string.
 * Example: 0.598 → "59.8%"
 */
export function formatPercent(
  value: number,
  decimals = FORMAT.percentDecimals
): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a percentage input (already in %) for display.
 * Example: 12.5 → "12.5%"
 */
export function formatPercentDirect(
  value: number,
  decimals = FORMAT.percentDecimals
): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Ratios ────────────────────────────────────────────────────────────────────

/**
 * Formats a ratio with 2 decimal places and "x" suffix.
 * Example: 1.35 → "1.35×"
 */
export function formatRatio(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}×`;
}

/**
 * Formats a decimal ratio to N decimal places.
 * Example: 0.04074 → "0.041"
 */
export function formatDecimal(value: number, decimals = 3): string {
  return value.toFixed(decimals);
}

// ─── Score Formatting ─────────────────────────────────────────────────────────

/**
 * Formats a 0–100 score as a whole number.
 * Example: 73.4 → "73"
 */
export function formatScore(value: number): string {
  return Math.round(value).toString();
}

// ─── Delta / Change Formatting ────────────────────────────────────────────────

/**
 * Formats a signed percentage change with +/− prefix.
 * Example: 0.05 → "+5.0%"  |  -0.02 → "−2.0%"
 */
export function formatPercentDelta(value: number, decimals = 1): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a signed SAR change.
 * Example: 94000 → "+SAR 94,000"  |  -50000 → "−SAR 50,000"
 */
export function formatSARDelta(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatSAR(Math.abs(value))}`;
}

// ─── Probability Formatting ───────────────────────────────────────────────────

/**
 * Formats a 0–1 probability as a percentage string.
 * Example: 0.734 → "73.4%"
 */
export function formatProbability(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ─── Equation Step Formatting ─────────────────────────────────────────────────

/**
 * Formats an equation step result for the waterfall display.
 * Unit-aware formatting.
 */
export function formatStepResult(
  value: number,
  unit: "ratio" | "percent" | "SAR" | "multiplier" | "decimal" | "none"
): string {
  switch (unit) {
    case "ratio":
      return formatPercent(value);
    case "percent":
      return formatPercentDirect(value * 100);
    case "SAR":
      return formatSAR(value);
    case "multiplier":
      return formatRatio(value);
    case "decimal":
      return formatDecimal(value, 5);
    case "none":
    default:
      return value.toFixed(4);
  }
}

// ─── Input Formatting ─────────────────────────────────────────────────────────

/**
 * Formats a raw input number for display in the form summary.
 */
export function formatInputForDisplay(
  value: number,
  field: "ROI" | "r" | "T" | "sigma" | "CF_ratio" | "D" | "A"
): string {
  switch (field) {
    case "ROI":
    case "r":
    case "T":
      return formatPercentDirect(value * 100);
    case "sigma":
      return value.toFixed(2);
    case "CF_ratio":
      return formatRatio(value);
    case "D":
    case "A":
      return formatSAR(value);
  }
}

// ─── Volatility Label ─────────────────────────────────────────────────────────

/**
 * Returns a qualitative label for a sigma value.
 */
export function getVolatilityLabel(sigma: number): string {
  if (sigma <= 0.10) return "Very stable";
  if (sigma <= 0.20) return "Stable";
  if (sigma <= 0.35) return "Moderate";
  if (sigma <= 0.55) return "Variable";
  if (sigma <= 0.75) return "Volatile";
  return "Highly volatile";
}
