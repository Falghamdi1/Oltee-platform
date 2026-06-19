// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — AI Insights API Route
// Route: POST /api/ai-insights
//
// Accepts OLTEE computation results and streams Gemini AI insights back.
//
// Modes (via ?mode= query param):
//   POST /api/ai-insights             — streaming 8-section insight analysis
//   POST /api/ai-insights?mode=scenario   — 2-sentence scenario commentary
//   POST /api/ai-insights?mode=montecarlo — 3-sentence MC probability summary
//   GET  /api/ai-insights             — health check (returns ready status)
//
// Error codes:
//   400 — malformed body or missing required fields
//   503 — GOOGLE_AI_API_KEY not configured
//   504 — Gemini API timeout
//   500 — unexpected server error
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import { type NextRequest, NextResponse } from "next/server";
import type { AIInsightRequest, MonteCarloResult, OLTEEOutputs } from "@/types/oltee";
import {
  getAIStatus,
  generateInsightsStream,
  generateScenarioCommentary,
  generateMonteCarloSummary,
} from "@/lib/ai";

// Node.js runtime required — Gemini SDK uses Node streams
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── GET — Health Check ───────────────────────────────────────────────────────

export async function GET() {
  const status = getAIStatus();
  return NextResponse.json(status, {
    status: status.ready ? 200 : 503,
  });
}

// ─── POST — AI Generation ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Guard: check API key before touching the body
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "AI insights not configured. " +
          "Add GOOGLE_AI_API_KEY to .env.local — get a free key at aistudio.google.com",
      },
      { status: 503 }
    );
  }

  // Parse mode
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "insights";

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  switch (mode) {
    case "scenario":   return handleScenarioCommentary(body);
    case "montecarlo": return handleMonteCarloSummary(body);
    default:           return handleInsightStream(body);
  }
}

// ─── Streaming insight handler ────────────────────────────────────────────────

async function handleInsightStream(body: unknown): Promise<Response> {
  const validation = validateInsightRequest(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { inputs, outputs, scores } = body as AIInsightRequest;

  try {
    const stream = await generateInsightsStream(inputs, outputs, scores);

    return new Response(stream, {
      headers: {
        "Content-Type":      "text/plain; charset=utf-8",
        "Cache-Control":     "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const error = err as Error;
    if (error.message?.includes("timeout") || error.message?.includes("ETIMEDOUT")) {
      return NextResponse.json(
        { error: "AI generation timed out. Please try again." },
        { status: 504 }
      );
    }
    console.error("[OLTEE AI] Insight error:", error.message);
    return NextResponse.json(
      { error: "Unable to generate AI insights. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Scenario commentary handler ─────────────────────────────────────────────

async function handleScenarioCommentary(body: unknown): Promise<Response> {
  if (
    typeof body !== "object" || body === null ||
    !("scenarioName" in body) || !("baselineStatus" in body) || !("newStatus" in body)
  ) {
    return NextResponse.json(
      { error: "Missing required scenario commentary fields" },
      { status: 400 }
    );
  }

  const req = body as {
    scenarioName: string; baselineStatus: string; newStatus: string;
    baselineL_star: number; newL_star: number;
    baselineHeadroom: number; newHeadroom: number;
    baselineDebtRatio: number;
  };

  try {
    const commentary = await generateScenarioCommentary(
      req.scenarioName, req.baselineStatus, req.newStatus,
      req.baselineL_star, req.newL_star,
      req.baselineHeadroom, req.newHeadroom,
      req.baselineDebtRatio
    );
    return NextResponse.json({ commentary });
  } catch (err) {
    console.error("[OLTEE AI] Scenario error:", (err as Error).message);
    return NextResponse.json(
      { error: "Unable to generate scenario commentary." },
      { status: 500 }
    );
  }
}

// ─── Monte Carlo summary handler ─────────────────────────────────────────────

async function handleMonteCarloSummary(body: unknown): Promise<Response> {
  if (
    typeof body !== "object" || body === null ||
    !("result" in body) || !("debtRatio" in body)
  ) {
    return NextResponse.json(
      { error: "Missing required Monte Carlo summary fields" },
      { status: 400 }
    );
  }

  const req = body as { result: MonteCarloResult; debtRatio: number };

  try {
    const summary = await generateMonteCarloSummary(req.result, req.debtRatio);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[OLTEE AI] MC summary error:", (err as Error).message);
    return NextResponse.json(
      { error: "Unable to generate Monte Carlo summary." },
      { status: 500 }
    );
  }
}

// ─── Request validator ────────────────────────────────────────────────────────

type ValidationResult = { valid: true } | { valid: false; error: string };

function validateInsightRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const req = body as Record<string, unknown>;

  if (!req.inputs  || typeof req.inputs  !== "object") return { valid: false, error: "Missing: inputs"  };
  if (!req.outputs || typeof req.outputs !== "object") return { valid: false, error: "Missing: outputs" };
  if (!req.scores  || typeof req.scores  !== "object") return { valid: false, error: "Missing: scores"  };

  const inputs = req.inputs as Record<string, unknown>;
  for (const f of ["ROI", "r", "T", "sigma", "CF_ratio", "D", "A"]) {
    if (typeof inputs[f] !== "number") return { valid: false, error: `inputs.${f} must be a number` };
  }

  const outputs = req.outputs as Partial<OLTEEOutputs>;
  if (typeof outputs.L_star !== "number") return { valid: false, error: "outputs.L_star must be a number" };
  if (!["OPTIMAL","CAUTION","SUBOPTIMAL","NEG_SPREAD"].includes(outputs.status ?? "")) {
    return { valid: false, error: "outputs.status must be a valid LeverageStatus" };
  }

  const scores = req.scores as Record<string, unknown>;
  for (const f of ["stability","debtHealth","efficiency","resilience"]) {
    if (typeof scores[f] !== "number") return { valid: false, error: `scores.${f} must be a number` };
  }

  return { valid: true };
}
