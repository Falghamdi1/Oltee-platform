// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Application Context Provider
//
// OLTEEProvider wraps the entire app in app/layout.tsx and makes the
// shared OLTEE state available to all pages via useOLTEEContext().
//
// Architecture:
//   OLTEEProvider (app/layout.tsx)
//     └── useReducer(olteeReducer, INITIAL_STATE)
//         └── provides: state, dispatch, compute, regenerateAI, reset
//
// State persists across page navigation — navigating from /analyze to
// /scenarios does not reset the baseline or AI insights.
//
// All async operations (AI streaming, form submission) live here
// and dispatch actions to the reducer.
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import type {
  OLTEEState,
  OLTEEAction,
  OLTEEFormValues,
  OLTEEInputs,
} from "@/types/oltee";
import { olteeReducer, INITIAL_STATE } from "@/lib/reducer";
import { computeOLTEE, buildEquationSteps } from "@/lib/engine";
import { computeScores } from "@/lib/scores";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface OLTEEContextValue {
  state: OLTEEState;
  dispatch: React.Dispatch<OLTEEAction>;

  // Derived convenience flag
  hasBaseline: boolean;

  // Primary actions
  compute: (formValues: OLTEEFormValues) => Promise<void>;
  regenerateAI: () => Promise<void>;
  reset: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OLTEEContext = createContext<OLTEEContextValue | null>(null);

OLTEEContext.displayName = "OLTEEContext";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OLTEEProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(olteeReducer, INITIAL_STATE);

  // ── compute: form → engine → AI ────────────────────────────────────────────

  const compute = useCallback(async (formValues: OLTEEFormValues) => {
    // zodResolver in AnalysisForm already ran the Zod schema and transformed
    // all string fields to numbers before calling onSubmit. By the time we
    // receive formValues here, ROI/r/T/CF_ratio/D/A are already numbers (not
    // strings), so running safeParse again would fail z.string() checks.
    //
    // We cast directly and convert % fields → decimals for the engine.
    // Field-level validation errors are shown by the form itself via react-hook-form.
    const v = formValues as unknown as {
      ROI: number; r: number; T: number; sigma: number;
      CF_ratio: number; D: number; A: number;
    };

    // Basic sanity guard (should never trigger — form validates first)
    if (!v.ROI || !v.r || !v.CF_ratio || !v.D || !v.A) {
      console.error("[OLTEE] compute() called with missing fields", v);
      return;
    }

    // 2. Convert % fields to decimals for the engine
    const inputs: OLTEEInputs = {
      ROI:      v.ROI      / 100,
      r:        v.r        / 100,
      T:        v.T        / 100,
      sigma:    v.sigma,
      CF_ratio: v.CF_ratio,
      D:        v.D,
      A:        v.A,
    };

    // 3. Dispatch computation start
    dispatch({ type: "SET_FORM_VALUES", payload: formValues });

    // 4. Run the OLTEE engine (synchronous, < 1ms)
    const outputs   = computeOLTEE(inputs);
    const scores    = computeScores(inputs, outputs);
    const steps     = buildEquationSteps(inputs, outputs);

    dispatch({
      type: "COMPUTE_RESULTS",
      payload: { inputs, outputs, steps, scores },
    });

    // 5. Automatically start AI insight streaming
    await startAIStream(inputs, outputs, scores, dispatch);
  }, []);

  // ── regenerateAI ───────────────────────────────────────────────────────────

  const regenerateAI = useCallback(async () => {
    if (!state.inputs || !state.outputs || !state.scores) return;
    dispatch({ type: "SET_AI_STATUS", payload: "loading" });
    await startAIStream(state.inputs, state.outputs, state.scores, dispatch);
  }, [state.inputs, state.outputs, state.scores]);

  // ── reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const hasBaseline = state.hasResults && state.inputs !== null;

  return (
    <OLTEEContext.Provider
      value={{ state, dispatch, hasBaseline, compute, regenerateAI, reset }}
    >
      {children}
    </OLTEEContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Primary hook for accessing OLTEE state in client components.
 * Must be called inside a component that is a descendant of OLTEEProvider.
 */
export function useOLTEEContext(): OLTEEContextValue {
  const ctx = useContext(OLTEEContext);
  if (!ctx) {
    throw new Error(
      "useOLTEEContext must be called inside <OLTEEProvider>. " +
      "Ensure app/layout.tsx wraps children in <OLTEEProvider>."
    );
  }
  return ctx;
}

// ─── AI Stream helper (module-private) ───────────────────────────────────────

/**
 * Calls /api/ai-insights in streaming mode and dispatches chunks + final parse
 * to the reducer. Extracted here to be reused by compute and regenerateAI.
 */
async function startAIStream(
  inputs: OLTEEInputs,
  outputs: ReturnType<typeof computeOLTEE>,
  scores: ReturnType<typeof computeScores>,
  dispatch: React.Dispatch<OLTEEAction>
): Promise<void> {
  dispatch({ type: "SET_AI_STATUS", payload: "loading" });

  try {
    const response = await fetch("/api/ai-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs, outputs, scores }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      dispatch({ type: "SET_AI_ERROR", payload: err.error ?? `HTTP ${response.status}` });
      return;
    }

    if (!response.body) {
      dispatch({ type: "SET_AI_ERROR", payload: "No response stream received" });
      return;
    }

    // Stream chunks into reducer
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    dispatch({ type: "SET_AI_STATUS", payload: "streaming" });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      dispatch({ type: "APPEND_AI_STREAM", payload: chunk });
    }

    // Parse completed stream as JSON
    const { parseAIInsightJSON } = await import("@/lib/ai");
    try {
      const insights = parseAIInsightJSON(accumulated);
      dispatch({ type: "SET_AI_INSIGHTS", payload: insights });
    } catch (parseErr) {
      console.error("[OLTEE AI] JSON parse failed:", (parseErr as Error).message);
      dispatch({
        type: "SET_AI_ERROR",
        payload: "Unable to parse AI insights. The analysis is complete but could not be structured.",
      });
    }

  } catch (fetchErr) {
    console.error("[OLTEE AI] Fetch error:", (fetchErr as Error).message);
    dispatch({
      type: "SET_AI_ERROR",
      payload: "Unable to connect to AI service. Check your internet connection.",
    });
  }
}
