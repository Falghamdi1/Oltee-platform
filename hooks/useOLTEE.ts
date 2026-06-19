// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — Primary State Management Hook
//
// Central hook that manages the entire OLTEE computation lifecycle:
//  1. Form submission → input validation
//  2. Engine computation → outputs + equation steps + scores
//  3. AI insight generation → streaming
//  4. State exposure to all consumer components
//
// Uses React's useReducer for predictable state transitions.
// Reducer lives in lib/reducer.ts — NOT duplicated here.
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import type {
  OLTEEFormValues,
  OLTEEInputs,
  OLTEEOutputs,
  OLTEEState,
  FinancialScores,
  EquationStep,
  AIInsights,
  AIInsightStatus,
} from "@/types/oltee";

// ─── Hook Return Type ──────────────────────────────────────────────────────────

export interface UseOLTEEReturn {
  // State
  state: OLTEEState;

  // Derived state for convenience
  hasResults: boolean;
  isCalculating: boolean;
  inputs: OLTEEInputs | null;
  outputs: OLTEEOutputs | null;
  equationSteps: EquationStep[] | null;
  scores: FinancialScores | null;
  aiStatus: AIInsightStatus;
  aiInsights: Partial<AIInsights>;
  aiStream: string;

  // Actions
  compute: (formValues: OLTEEFormValues) => Promise<void>;
  reset: () => void;
  setActiveTab: (tab: OLTEEState["activeTab"]) => void;
  regenerateAI: () => Promise<void>;
}

// ─── Implementation placeholder ───────────────────────────────────────────────
// Full implementation requires lib/context.tsx (OLTEEProvider) to exist first.
// See AUDIT.md D1, D5, D6 for implementation order.

export function useOLTEE(): UseOLTEEReturn {
  throw new Error(
    "useOLTEE requires OLTEEProvider in app/layout.tsx. " +
    "Implement lib/context.tsx first (see AUDIT.md D5)."
  );
}
