// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Validation Layer
//
// Zod schemas for all input forms.
// Converts form strings to engine decimals.
// Produces field-level errors and warnings.
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import type { OLTEEInputs, OLTEEFormValues } from "@/types/oltee";
import { RANGES } from "@/config/constants";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

/**
 * Zod schema for the analysis form.
 * All percentage fields accept 0.1–100 (user-facing %) and are
 * converted to decimals before engine submission.
 */
export const OLTEEFormSchema = z
  .object({
    // Percentage fields (user enters 12, engine receives 0.12)
    ROI: z
      .string()
      .min(1, "Annual return is required")
      .transform((v) => parseFloat(v))
      .pipe(
        z
          .number()
          .min(RANGES.ROI.min * 100, "Return must be at least 0.1%")
          .max(RANGES.ROI.max * 100, "Return cannot exceed 100%")
      ),

    r: z
      .string()
      .min(1, "Interest rate is required")
      .transform((v) => parseFloat(v))
      .pipe(
        z
          .number()
          .min(RANGES.r.min * 100, "Rate must be at least 0.1%")
          .max(RANGES.r.max * 100, "Rate cannot exceed 30%")
      ),

    T: z
      .string()
      .transform((v) => (v === "" ? 15 : parseFloat(v)))
      .pipe(
        z
          .number()
          .min(0, "Tax rate cannot be negative")
          .max(RANGES.T.max * 100, "Tax rate cannot exceed 50%")
      ),

    // Direct decimal (slider)
    sigma: z
      .number()
      .min(RANGES.sigma.min, "Volatility must be at least 0")
      .max(RANGES.sigma.max, "Volatility cannot exceed 1.0"),

    // Direct ratio
    CF_ratio: z
      .string()
      .min(1, "Cash flow ratio is required")
      .transform((v) => parseFloat(v))
      .pipe(
        z
          .number()
          .min(RANGES.CF_ratio.min, `Coverage ratio must be at least ${RANGES.CF_ratio.min}`)
          .max(RANGES.CF_ratio.max, `Coverage ratio cannot exceed ${RANGES.CF_ratio.max}`)
      ),

    // SAR currency fields
    D: z
      .string()
      .min(1, "Total debt is required")
      .transform((v) => parseFloat(v.replace(/,/g, "")))
      .pipe(
        z
          .number()
          .positive("Total debt must be greater than 0")
          .max(1e10, "Value exceeds maximum supported amount")
      ),

    A: z
      .string()
      .min(1, "Total assets are required")
      .transform((v) => parseFloat(v.replace(/,/g, "")))
      .pipe(
        z
          .number()
          .positive("Total assets must be greater than 0")
          .max(1e10, "Value exceeds maximum supported amount")
      ),
  })
  .refine((data) => data.A > data.D, {
    message: "Total assets must exceed total debt",
    path: ["A"],
  });

/**
 * Schema for the CF ratio sub-calculator.
 */
export const CFSubCalcSchema = z
  .object({
    monthlyIncome: z
      .string()
      .min(1, "Monthly income is required")
      .transform((v) => parseFloat(v.replace(/,/g, "")))
      .pipe(z.number().positive("Income must be positive")),

    monthlyRepayment: z
      .string()
      .min(1, "Monthly repayment is required")
      .transform((v) => parseFloat(v.replace(/,/g, "")))
      .pipe(z.number().positive("Repayment must be positive")),
  })
  .refine((data) => data.monthlyIncome >= data.monthlyRepayment * 0.5, {
    message: "Repayment cannot exceed twice your monthly income",
    path: ["monthlyRepayment"],
  });

// ─── Form → Engine Converter ──────────────────────────────────────────────────

/**
 * Converts validated form output to engine-ready decimal inputs.
 * Percentage fields are divided by 100.
 */
export function formToEngineInputs(
  validated: z.infer<typeof OLTEEFormSchema>
): OLTEEInputs {
  return {
    ROI: validated.ROI / 100,
    r: validated.r / 100,
    T: validated.T / 100,
    sigma: validated.sigma,
    CF_ratio: validated.CF_ratio,
    D: validated.D,
    A: validated.A,
  };
}

// ─── Warning Generators ────────────────────────────────────────────────────────

/**
 * Generates non-blocking warnings for edge-case inputs.
 * These are informational — they don't block computation.
 */
export function generateInputWarnings(
  inputs: OLTEEInputs
): Partial<Record<keyof OLTEEFormValues, string>> {
  const warnings: Partial<Record<keyof OLTEEFormValues, string>> = {};

  if (inputs.ROI - inputs.r < 0.01 && inputs.ROI > inputs.r) {
    warnings.ROI = "Your return spread is very thin (< 1%). Small rate changes could turn this negative.";
  }

  if (inputs.CF_ratio < 1.2) {
    warnings.CF_ratio = "Coverage ratio below 1.2× — your monthly cash flow is tight.";
  }

  if (inputs.sigma > 0.60) {
    warnings.sigma = "High income volatility significantly tightens your safe borrowing limit.";
  }

  if (inputs.D / inputs.A > 0.60) {
    warnings.D = "Your current debt ratio is already above 60% — approaching the caution zone.";
  }

  return warnings;
}

// ─── Type exports ─────────────────────────────────────────────────────────────

export type OLTEEFormSchema = z.infer<typeof OLTEEFormSchema>;
export type CFSubCalcSchema = z.infer<typeof CFSubCalcSchema>;
