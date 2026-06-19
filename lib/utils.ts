// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Shared Utilities
// ═══════════════════════════════════════════════════════════════════════════

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Tailwind Class Merger ────────────────────────────────────────────────────

/** Merges Tailwind classes without conflicts. Standard shadcn/ui utility. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Math Utilities ───────────────────────────────────────────────────────────

/** Clamps a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation between a and b by t ∈ [0, 1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Maps a value from one range to another. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Rounds a number to N decimal places. */
export function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ─── ID Generation ────────────────────────────────────────────────────────────

/** Generates a short random ID for report identifiers. */
export function generateId(prefix = ""): string {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return prefix ? `${prefix}-${random}` : random;
}

/** Generates a formatted timestamp for report metadata. */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

// ─── Array Utilities ──────────────────────────────────────────────────────────

/** Sorts an array of numbers and returns a new array. */
export function sortedNumbers(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

/** Computes the arithmetic mean of an array of numbers. */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

/** Computes the standard deviation of an array of numbers. */
export function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

// ─── Async Utilities ──────────────────────────────────────────────────────────

/** Yields execution to the event loop. Used in MC simulation for responsiveness. */
export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Debounces a function by N milliseconds. */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
