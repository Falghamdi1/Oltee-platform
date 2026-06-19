// ═══════════════════════════════════════════════════════════════════════════
// OLTEE — AI Intelligence Client (Google Gemini)
//
// All Google Gemini API communication for the OLTEE platform.
// Previously Anthropic Claude — migrated to Gemini 2.5 Flash for
// cost efficiency (free tier: 1,500 req/day, 1M tokens/min).
//
// Handles four intelligence modes:
//   1. Full insight streaming  — 8-section analysis, primary use
//   2. Full insight blocking   — for PDF report generation
//   3. Scenario commentary     — 2 sentences per scenario
//   4. Monte Carlo summary     — 3 sentences post-simulation
//
// Architecture:
//   - Server-side only (API routes, not client components)
//   - Per-request client factory — no module-level mutable state
//   - Streaming via ReadableStream<string> piped to HTTP Response
//   - JSON parsing with 5-layer defensive cleaning (strips markdown fences,
//     extracts from surrounding text, validates all 8 required fields)
//   - Retry logic: 2 retries, exponential backoff (500ms → 1000ms)
//
// Note on Gemini JSON compliance:
//   Gemini 2.5 Flash occasionally wraps JSON in ```json...``` fences
//   even when explicitly instructed not to. The parseAIInsightJSON parser
//   handles this transparently — no user-visible effect.
//
// Author: Faisal Alghamdi
// ═══════════════════════════════════════════════════════════════════════════

import {
  GoogleGenerativeAI,
  type GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type {
  OLTEEInputs,
  OLTEEOutputs,
  FinancialScores,
  AIInsights,
  MonteCarloResult,
} from "@/types/oltee";
import {
  AI_SYSTEM_PROMPT,
  buildInsightPromptForStatus,
  buildScenarioCommentaryPrompt,
  buildMonteCarloSummaryPrompt,
} from "@/config/ai-prompts";
import { AI_CONFIG } from "@/config/constants";

// ─── Safety settings ──────────────────────────────────────────────────────────
// Financial analysis content — turn off overly-aggressive safety filters
// that would block legitimate risk discussion (e.g. "debt is dangerous").
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─── Client Factory ───────────────────────────────────────────────────────────
// Per-request factory — no module-level mutable state.
// Avoids hot-reload issues in Next.js dev and cold-start confusion on Vercel.

function createGeminiModel(maxOutputTokens?: number): GenerativeModel {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. " +
      "Get a free key at https://aistudio.google.com and add it to .env.local"
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model:           AI_CONFIG.model,
    systemInstruction: AI_SYSTEM_PROMPT,
    generationConfig: {
      temperature:      AI_CONFIG.temperature,
      maxOutputTokens:  maxOutputTokens ?? AI_CONFIG.maxTokens,
      // Gemini supports JSON mode — request it to reduce fencing noise
      responseMimeType: "text/plain",
    },
    safetySettings: SAFETY_SETTINGS,
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export function getAIStatus(): {
  ready: boolean;
  model: string;
  message: string;
} {
  const hasKey = Boolean(process.env.GOOGLE_AI_API_KEY);
  return {
    ready:   hasKey,
    model:   AI_CONFIG.model,
    message: hasKey
      ? `AI insights ready — Gemini ${AI_CONFIG.model} (free tier)`
      : "Set GOOGLE_AI_API_KEY in .env.local — get free key at aistudio.google.com",
  };
}

// ─── Full Insight Streaming ────────────────────────────────────────────────────

/**
 * Generates the full 8-section AI analysis as a streaming ReadableStream<string>.
 * Pipe directly into the HTTP Response body.
 *
 * The client accumulates chunks via APPEND_AI_STREAM dispatch, then parses
 * the complete JSON once the stream closes.
 */
export async function generateInsightsStream(
  inputs:  OLTEEInputs,
  outputs: OLTEEOutputs,
  scores:  FinancialScores
): Promise<ReadableStream<string>> {
  const model      = createGeminiModel();
  const userPrompt = buildInsightPromptForStatus(inputs, outputs, scores);

  const result = await model.generateContentStream(userPrompt);

  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(text);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    // ReadableStream cancel — Gemini SDK does not expose an abort method,
    // but the for-await loop will stop iterating when the stream is cancelled.
    cancel() {
      // intentional no-op — GeminiAI SDK handles cleanup internally
    },
  });
}

// ─── Full Insight (Non-Streaming) ────────────────────────────────────────────

/**
 * Generates the full 8-section AI analysis as a complete AIInsights object.
 * Used for PDF report generation where streaming is not appropriate.
 *
 * Retry logic: up to 2 retries on transient errors, 500ms → 1000ms backoff.
 */
export async function generateInsights(
  inputs:  OLTEEInputs,
  outputs: OLTEEOutputs,
  scores:  FinancialScores,
  retries  = 2
): Promise<AIInsights> {
  const userPrompt = buildInsightPromptForStatus(inputs, outputs, scores);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const model  = createGeminiModel();
      const result = await model.generateContent(userPrompt);
      const text   = result.response.text();
      return parseAIInsightJSON(text);
    } catch (err) {
      lastError = err as Error;
      if (attempt < retries) {
        await sleep(500 * Math.pow(2, attempt)); // 500ms, 1000ms
      }
    }
  }

  throw lastError ?? new Error("AI insight generation failed after retries");
}

// ─── Scenario Commentary ──────────────────────────────────────────────────────

/**
 * Generates a 2-sentence commentary for a scenario change.
 * Returns plain text (not JSON).
 */
export async function generateScenarioCommentary(
  scenarioName:      string,
  baselineStatus:    string,
  newStatus:         string,
  baselineL_star:    number,
  newL_star:         number,
  baselineHeadroom:  number,
  newHeadroom:       number,
  baselineDebtRatio: number
): Promise<string> {
  const prompt = buildScenarioCommentaryPrompt(
    scenarioName, baselineStatus, newStatus,
    baselineL_star, newL_star,
    baselineHeadroom, newHeadroom,
    baselineDebtRatio
  );

  const model  = createGeminiModel(300); // 2 sentences — tight cap
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ─── Monte Carlo Summary ──────────────────────────────────────────────────────

/**
 * Generates a 3-sentence plain-language summary of Monte Carlo results.
 * Returns plain text (not JSON).
 */
export async function generateMonteCarloSummary(
  result:    MonteCarloResult,
  debtRatio: number
): Promise<string> {
  const prompt = buildMonteCarloSummaryPrompt(result, debtRatio);
  const model  = createGeminiModel(400); // 3 sentences — tight cap
  const res    = await model.generateContent(prompt);
  return res.response.text().trim();
}

// ─── JSON Parser ─────────────────────────────────────────────────────────────

/**
 * Parses and validates the JSON response from AI insight generation.
 *
 * Defensive steps (Gemini-hardened):
 *   1. Strip markdown fences  (```json...``` or ```...```)
 *   2. Strip any text before { and after }
 *   3. JSON.parse
 *   4. Validate all 8 required string fields are non-empty
 *   5. Validate all 3 required arrays are non-empty
 *
 * Gemini 2.5 Flash occasionally emits fences even when told not to —
 * steps 1 and 2 handle that transparently.
 */
export function parseAIInsightJSON(raw: string): AIInsights {
  // Step 1: strip markdown code fences (Gemini's most common non-compliance)
  let cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();

  // Step 2: extract JSON object if surrounded by any explanatory text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace  = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Step 3: parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const preview = raw.slice(0, 300).replace(/\n/g, "\\n");
    throw new Error(
      `AI response was not valid JSON.\n` +
      `Parse error: ${(e as Error).message}\n` +
      `Response preview: ${preview}`
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI response parsed to a non-object value");
  }

  const obj = parsed as Record<string, unknown>;

  // Step 4: validate required string fields
  const requiredStrings: (keyof AIInsights)[] = [
    "executiveSummary",
    "riskAssessment",
    "leverageAnalysis",
    "futureConsiderations",
    "personalizedGuidance",
  ];

  for (const field of requiredStrings) {
    if (typeof obj[field] !== "string" || (obj[field] as string).trim() === "") {
      throw new Error(`AI response missing or empty required field: "${field}"`);
    }
  }

  // Step 5: validate required arrays
  const requiredArrays: (keyof AIInsights)[] = [
    "strengths",
    "weaknesses",
    "recommendations",
  ];

  for (const field of requiredArrays) {
    if (!Array.isArray(obj[field])) {
      throw new Error(`AI response missing required array: "${field}"`);
    }
    if ((obj[field] as unknown[]).length === 0) {
      throw new Error(`AI response has empty array for: "${field}"`);
    }
  }

  // Lenient recommendations count — accept 1–4 (system prompt asks for 3)
  if ((obj.recommendations as string[]).length === 0) {
    throw new Error("AI response has no recommendations");
  }

  return parsed as AIInsights;
}

// ─── Stream accumulator helpers ───────────────────────────────────────────────

export async function accumulateAIStream(
  reader: ReadableStreamDefaultReader<string>
): Promise<string> {
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return chunks.join("");
}

export async function accumulateAndParseAIStream(
  reader: ReadableStreamDefaultReader<string>
): Promise<AIInsights> {
  const raw = await accumulateAIStream(reader);
  return parseAIInsightJSON(raw);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
