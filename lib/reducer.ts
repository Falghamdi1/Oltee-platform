// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — State Reducer
//
// Pure function: (OLTEEState, OLTEEAction) → OLTEEState
// No side effects. No async. Directly testable.
//
// All 11 action types from the OLTEEAction union are handled.
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import type { OLTEEState, OLTEEAction } from "@/types/oltee";

// ─── Initial State ────────────────────────────────────────────────────────────

export const INITIAL_STATE: OLTEEState = {
  formValues:       null,
  inputs:           null,
  hasResults:       false,
  outputs:          null,
  equationSteps:    null,
  scores:           null,
  aiState: {
    status:   "idle",
    insights: {},
    rawStream: "",
  },
  scenarioComparison: null,
  activeScenarios:    [],
  monteCarloResult:   null,
  monteCarloRunning:  false,
  isCalculating:      false,
  activeTab:          "analyze",
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function olteeReducer(state: OLTEEState, action: OLTEEAction): OLTEEState {
  switch (action.type) {

    case "SET_FORM_VALUES":
      return {
        ...state,
        formValues: action.payload,
        isCalculating: true,
      };

    case "COMPUTE_RESULTS":
      return {
        ...state,
        isCalculating:  false,
        hasResults:     true,
        inputs:         action.payload.inputs,
        outputs:        action.payload.outputs,
        equationSteps:  action.payload.steps,
        scores:         action.payload.scores,
        // Reset AI state on every new computation
        aiState: {
          status:   "idle",
          insights: {},
          rawStream: "",
        },
      };

    case "SET_AI_STATUS":
      return {
        ...state,
        aiState: {
          ...state.aiState,
          status: action.payload,
        },
      };

    case "APPEND_AI_STREAM":
      return {
        ...state,
        aiState: {
          ...state.aiState,
          status:    "streaming",
          rawStream: state.aiState.rawStream + action.payload,
        },
      };

    case "SET_AI_INSIGHTS":
      return {
        ...state,
        aiState: {
          ...state.aiState,
          status:   "complete",
          insights: action.payload,
          // Keep rawStream so it can be inspected for debugging
        },
      };

    case "SET_AI_ERROR":
      return {
        ...state,
        aiState: {
          ...state.aiState,
          status: "error",
          error:  action.payload,
        },
      };

    case "SET_SCENARIO_COMPARISON":
      return {
        ...state,
        scenarioComparison: action.payload,
      };

    case "START_MONTE_CARLO":
      return {
        ...state,
        monteCarloRunning: true,
        monteCarloResult:  null,
      };

    case "SET_MONTE_CARLO_RESULT":
      return {
        ...state,
        monteCarloRunning: false,
        monteCarloResult:  action.payload,
      };

    case "SET_ACTIVE_TAB":
      return {
        ...state,
        activeTab: action.payload,
      };

    case "RESET":
      return INITIAL_STATE;

    default:
      // TypeScript exhaustiveness check — should never reach here
      return state;
  }
}
